const path = require('path'); // 添加 path 模块的引入
const fs = require('fs').promises; // 使用 fs 的 await 版本 API
const puppeteer = require('puppeteer');
const douyinCommentHandler = require('./puppeteer-handler/douyinComments.js');
const bilibiliCommentHandler = require('./puppeteer-handler/bilibiliComments.js');
const steamCommentHandler = require('./puppeteer-handler/steamComments.js');
const parseArgs = require('./tools/parseArgs.js'); // 引入参数解析模块

const cacheDir = './cache'; // 缓存目录

async function getFromPostCatch({ platform, resourceId, checkCache }) {
    // 如果 checkCache 为 false，则跳过缓存检查
    if (!checkCache) {
        console.log('忽略缓存检查...');
        return null;
    }
    // 检查缓存
    const cacheFilePath = path.join(cacheDir, `${encodeURIComponent(platform + resourceId)}.json`);
    try {
        const cachedData = await fs.readFile(cacheFilePath, 'utf8');
        const cache = JSON.parse(cachedData);

        const timeDifference = (Date.now() - (cache.timestamp || 0)) / (1000 * 60 * 60); // 时间差（小时）
        if (timeDifference > 24) {
            console.log('缓存已过期，重新获取数据...');
            return null;
        } else {
            console.log(`缓存读取了【${cache.title}】的${cache.comments.length}条评论`);
        }

        return cache;
    } catch (error) {
        console.error('缓存读取失败', error.message);
        return null;
    }
}

async function getPostFromPuppeteer({ platform, resourceId, verbose }) {
    console.log('启动浏览器...');
    const browser = await puppeteer.launch({
        slowMo: 50,      // 操作延迟 (毫秒)，便于观察
        args: ['--window-size=1280,720'],
        userDataDir: './user_data', // 指定用户数据目录以记住cookie
        headless: !verbose // 根据verbose参数设置headless模式
    });

    let result;
    if (platform === 'douyin') {
        result = await douyinCommentHandler(browser, resourceId);
    } else if (platform === 'bilibili') {
        result = await bilibiliCommentHandler(browser, resourceId);
    } else if (platform === 'steam') {
        result = await steamCommentHandler(browser, resourceId);
    }

    console.log('关闭浏览器...');
    try {
        await browser.close();
    } catch (error) {
        console.error('关闭浏览器时遇到问题', error.message);
    }

    return result;
}

async function analyzeComments(config) {
    let post = await getFromPostCatch(config);
    if (!post) {
        post = await getPostFromPuppeteer(config);
        // 缓存数据
        const cacheFilePath = path.join(cacheDir, `${encodeURIComponent(config.platform + config.resourceId)}.json`);
        try {
            await fs.access(cacheDir); // 检查目录是否存在
        } catch (error) {
            await fs.mkdir(cacheDir); // 如果目录不存在，则创建目录
        }
        await fs.writeFile(cacheFilePath, JSON.stringify(post, null, 4));
        console.log(`数据已缓存到: ${cacheFilePath}`);
    }

    // 限制评论数量
    const maxComments = config.maxComments || 50; // 默认最大评论数量为50
    post.comments = post.comments.slice(0, maxComments);

    console.log(`发送${post.comments.length}条评论给LLM进行分析...`);

    // 请求OpenAI兼容的API
    const openaiResponse = await callOpenAI(post.prompt, config); // 修改这里以支持流式输出

    // Ollama的代码保留作为候选
    // const ollamaResponse = await callOllama(prompt);

    return openaiResponse;
}

async function callOpenAI(prompt, { streamOutput, openaiApiKey }) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
            // model: 'qwen/qwen2.5-vl-72b-instruct:free',
            model: 'deepseek/deepseek-chat:free',
            // model: 'deepseek/deepseek-r1:free',
            // model: 'deepseek/deepseek-r1-distill-llama-70b:free',
            "messages": [{
                "role": "user",
                "content": prompt
            }],
            stream: streamOutput
        })
    });

    if (streamOutput) {
        return response.body.getReader();
    } else {
        const rs = await response.json();
        return rs?.choices?.[0]?.message?.content || '';
    }
}

async function callOllama(prompt) {
    const response = await fetch('http://172.16.2.112:11434/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt: prompt,
            model: 'deepseek-r1:latest',
            stream: false,
        })
    });
    return response.json();
}

async function streamToConsole(reader) {
    const decoder = new TextDecoder();
    let buffer = ''; // 处理跨 chunk 的缓冲区
  
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
  
      buffer += decoder.decode(value, { stream: true }); // 解码并保留不完整字符

      // 处理完整的事件块
      let index;
      while ((index = buffer.indexOf('\n\n')) !== -1) {
        const event = buffer.substring(0, index);
        buffer = buffer.substring(index + 2);
  
        if (event.startsWith('data:')) {
          const jsonStr = event.slice(5).trim();
          if (jsonStr === '[DONE]') continue; // 流结束标志

          try {
            const data = JSON.parse(jsonStr);
            const text = data.choices[0]?.delta?.content || '';
            process.stdout.write(text); // 流式输出到控制台
          } catch (err) {
            console.error('解析错误:', err);
          }
        }
      }
    }

    // 处理最后剩余的数据
    if (buffer) {
      const text = decoder.decode(); // 刷新剩余字节
      process.stdout.write(text);
    }
}

// 创建配置对象
const config = parseArgs(); // 使用parseArgs方法获取配置对象
analyzeComments(config).then(async (result) => {
    if (config.streamOutput) {
        console.log('舆论分析结果（流式输出）:');
        await streamToConsole(result);
    } else {
        console.log('舆论分析结果:', result);
    }
}).catch(error => {
    console.error('分析过程中出现错误:', error);
});