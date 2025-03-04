const scrollPage = require('../tools/scrollPage');

module.exports = async function douyinCommentsHandler(browser, resourceId) {
    const url = `https://www.douyin.com/video/${resourceId}`; // 拼接URL
    console.log(`访问抖音视频页面: ${url}...`);
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    console.log('滚动页面以加载更多评论...');
    await scrollPage(page, { container: '.parent-route-container' });
    
    console.log('提取评论...');
    const post = await page.evaluate(() => {
        const title = document.querySelector('h1 span').textContent
        const extractCommentInfo = (commentDom) => {
            const username = commentDom
              .querySelector('span[data-click-from="title"]')
              ?.textContent
              ?.trim() || "";
          
            const timeRegion = commentDom
              .querySelector('[data-e2e="comment-item"] > div:nth-child(2) > div > div:nth-child(3) span')
              ?.textContent
              ?.split('·') || [];
            const [time, region] = timeRegion.map(s => s.trim());
          
            const comment = commentDom
              .querySelector('[data-e2e="comment-item"] > div:nth-child(2) > div > div:nth-child(2) > span')
              ?.textContent
              ?.trim() || '';
          
            const likes = commentDom
              .querySelector('.comment-item-stats-container > div > p > span')
              ?.textContent || 0;
          
            return { username, time, region, comment, likes };
        };
        return {
            timestamp: Date.now(),
            title,
            comments: [...document.querySelectorAll('div[data-e2e="comment-item"]')].map(extractCommentInfo)
        }
    });
    console.log(`成功提取了【${post.title}】的${post.comments.length} 条评论`);

    post.prompt = `这是douyin里的一个标题为${post.title}的视频下的评论。请综合点赞数、各人的态度，分析舆论风向。${JSON.stringify(post.comments)}`;

    return post;
}