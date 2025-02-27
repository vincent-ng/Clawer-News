const puppeteer = require('puppeteer');
const { table } = require('table');
const parseArgs = require('./tools/parseArgs.js'); // 引入参数解析模块

async function extractGameskyArticleInfo(browser) {
    const page = await browser.newPage();

    console.log('打开游戏资讯网站...');
    await page.goto('https://www.gamersky.com/pcgame/');

    // 点击 '.LoadMore' 按钮，直到它消失
    while (await page.$('.LoadMore')) {
        await page.click('.LoadMore');
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒，确保页面加载
    }

    console.log('获取所有文章的链接、标题和日期...');
    const results = await page.evaluate(() => {
        const listItems = document.querySelectorAll('ul.pictxt.block > li');
        const articles = [];
    
        listItems.forEach(item => {
            const linkElement = item.querySelector('.tit > a');
            const link = linkElement ? linkElement.href : null;
            const title = linkElement ? linkElement.title || linkElement.textContent : null;
    
            const dateElement = item.querySelector('.time');
            const date = dateElement ? dateElement.textContent : null;

            const viewElement = item.querySelector('.visit.gshit');
            const viewCount = viewElement ? viewElement.textContent : null;
    
            const commentElement = item.querySelector('.pls.cy_comment');
            const commentCount = commentElement ? commentElement.textContent : null;
    
            if (title) {
                articles.push({
                    link,
                    title,
                    date,
                    viewCount,
                    commentCount
                });
            }
        });
        return articles;
    });

    return results;
}

async function extract3DMArticleInfo(browser) {
    const page = await browser.newPage();

    console.log('打开游戏资讯网站...');
    await page.goto('https://www.3dmgame.com/news/game/');

    console.log('获取所有文章的链接、标题和日期...');
    const articleData = await page.evaluate(() => {
        const data = [];
        document.querySelectorAll('.selectpost').forEach(post => {
            const linkElement = post.querySelector('a.bt');
            const dateElement = post.querySelector('span.time');
            if (linkElement && linkElement.href.includes('html')) {
                const id = linkElement.href.split('/').pop().replace('.html', '');
                data.push({
                    link: linkElement.href,
                    title: linkElement.innerText,
                    date: dateElement ? dateElement.innerText : '无日期',
                    id: id // 添加id属性
                });
            }
        });
        return data;
    });

    const results = [];

    console.log('逐个打开文章页面并获取评论数量...');
    for (const article of articleData) {
        console.log(`处理文章链接: ${article.link}`);
        const articlePage = await browser.newPage();
        await articlePage.goto(article.link);

        const commentCount = await articlePage.evaluate(() => {
            const commentElement = document.querySelector('span#Ct_top_total');
            return commentElement ? commentElement.innerText : 'N/A';
        });

        // 请求阅读量
        const viewCount = await articlePage.evaluate((id) => {
            return new Promise((resolve) => {
                $.post("/api/getviews", { type: 'news', id: id }, function(data) {
                    resolve(data.nums);
                }, "json");
            });
        }, article.id);

        results.push({ ...article, commentCount, viewCount });
        await articlePage.close();
    }

    return results;
}

async function fetchHotArticles() {
    const config = parseArgs(); // 使用parseArgs方法获取配置对象

    console.log('启动浏览器...');
    const browser = await puppeteer.launch();

    let results;
    switch (config.platform) {
        case '3dm':
            results = await extract3DMArticleInfo(browser);
            break;
        case 'gamesky':
            results = await extractGameskyArticleInfo(browser);
            break;
        default:
            console.error('未知平台参数');
            process.exit(1);
    }

    console.log('关闭浏览器...');
    await browser.close();

    console.log('计算爆款指数...');
    const now = new Date();
    results = results.map(result => {
        // 处理 viewCount 和 commentCount 超过万的情况
        const parseCount = (count) => {
            if (typeof count === 'string' && count.includes('w')) {
                return parseFloat(count) * 10000;
            }
            return parseInt(count.replace(/,/g, ''), 10) || 0;
        };

        const viewCount = parseCount(result.viewCount);
        const commentCount = parseCount(result.commentCount);
        const date = new Date(result.date);
        const deltaTime = (now - date) / (1000 * 60 * 60); // Δt in hours
        const hotIndex = (viewCount + 20 * commentCount) / (Math.min(deltaTime, 24) + 1);
        return { ...result, hotIndex: hotIndex.toFixed(0) };
    });

    console.log('整理成表格并输出...');
    const data = results.map(result => [result.link, result.title, result.date, result.viewCount, result.commentCount, result.hotIndex]);
    const tableConfig = {
        columns: {
            1: { truncate: 50 },
        },
    };
    const output = table([['文章链接', '文章标题', '发布日期', '阅读量', '评论数量', '爆款指数'], ...data], tableConfig);
    console.log(output);
}

fetchHotArticles();