const scrollPage = require('../tools/scrollPage');

// Helper function to format timestamp
function formatTimestamp(timestamp) {
    return new Date(timestamp * 1000).toISOString();
}

// Function to parse the input JSON data
function extractCommentData(inputJson) {
    try {
        // Parse the JSON if it's a string
        const data = typeof inputJson === 'string' ? JSON.parse(inputJson) : inputJson;

        // Check if the data structure is as expected
        if (!data.data || !data.data.replies) {
            throw new Error("Invalid data structure: 'data.replies' not found");
        }

        // Extract the main comments
        const comments = data.data.replies.map(reply => {
            // Extract main comment data
            const mainComment = {
                username: reply.member.uname,
                content: reply.content.message,
                timestamp: formatTimestamp(reply.ctime),
                likes: reply.like,
                replies: []
            };

            // Extract any replies to this comment
            if (reply.replies && reply.replies.length > 0) {
                mainComment.replies = reply.replies.map(subReply => ({
                    username: subReply.member.uname,
                    content: subReply.content.message,
                    timestamp: formatTimestamp(subReply.ctime),
                    likes: subReply.like
                }));
            }

            return mainComment;
        });

        return comments;
    } catch (error) {
        console.error("Error processing comment data:", error);
        return [];
    }
}

module.exports = async function bilibiliCommentsHandler(browser, resourceId) {
    const url = `https://www.bilibili.com/video/${resourceId}`;
    console.log(`访问Bilibili视频页面: ${url}...`);
    const page = await browser.newPage();

    // 设置响应监听（必须在导航前调用）
    const responsePromise = page.waitForResponse(response => 
        response.url().includes('/x/v2/reply/wbi/main')
    );

    await page.goto(url, { waitUntil: 'networkidle2' });

    // 模拟滚动确保评论加载（如需）
    await scrollPage(page); 

    // 等待获取评论API响应
    const response = await responsePromise;
    const commentData = await response.json();

    // 获取标题
    const title = await page.evaluate(() => 
        document.querySelector('h1.video-title').textContent.trim()
    );

    // 处理评论数据
    const processedComments = extractCommentData(commentData);
    console.log(`成功提取了【${post.title}】的${processedComments.length}条评论`);
    
    await page.close(); // 关闭页面释放资源
    
    return {
        timestamp: Date.now(),
        title,
        comments: processedComments,
        prompt: `这是bilibili里的一个标题为${post.title}的视频下的评论。请综合点赞数、各人的态度，分析舆论风向。${JSON.stringify(post.comments)}`,
    };
}

