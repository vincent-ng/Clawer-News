const scrollPage = require('../tools/scrollPage');

module.exports = async function douyinCommentsHandler(browser, gameId) {
    const url = `https://steamcommunity.com/app/${gameId}/reviews/?browsefilter=toprated`; // 拼接URL
    console.log(`访问抖音视频页面: ${url}...`);
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    console.log('滚动页面以加载更多评论...');
    await scrollPage(page, { container: '.parent-route-container' });

    console.log('提取评论...');
    const post = await page.evaluate(() => {
        const title = document.querySelector('.apphub_AppName').textContent
        const reviews = [];
        // 获取所有 apphub_Card 元素
        const reviewCards = document.querySelectorAll('.apphub_Card');

        reviewCards.forEach((card) => {
            const review = {};

            // 用户信息
            const authorName = card.querySelector('.apphub_CardContentAuthorName a');
            review.username = authorName ? authorName.textContent.trim() : 'Unknown';
            review.userLink = authorName ? authorName.href : '';

            // 推荐状态
            const thumbImg = card.querySelector('.thumb img');
            review.recommended = thumbImg && thumbImg.src.includes('thumbsUp') ? 'Yes' : 'No';

            // 游玩时长
            const hours = card.querySelector('.hours');
            review.playtime = hours ? hours.textContent.trim() : 'N/A';

            // 评论内容
            const content = card.querySelector('.apphub_CardTextContent');
            const contentText = content ? content.cloneNode(true) : null;
            if (contentText) {
                const datePosted = contentText.querySelector('.date_posted');
                if (datePosted) datePosted.remove();
                review.content = contentText.textContent.trim();
            } else {
                review.content = '';
            }

            // 发布日期
            const postedDate = card.querySelector('.date_posted');
            review.postedDate = postedDate ? postedDate.textContent.trim().replace('发布于：', '').trim() : '';

            // 投票数据（修正带逗号的数字解析）
            const voteInfo = card.querySelector('.found_helpful');
            if (voteInfo) {
                const helpfulMatch = voteInfo.textContent.match(/有 ([\d,]+) 人觉得这篇评测有价值/);
                const funnyMatch = voteInfo.textContent.match(/有 ([\d,]+) 人觉得这篇评测很欢乐/);
                review.helpfulVotes = helpfulMatch ? parseInt(helpfulMatch[1].replace(/,/g, '')) : 0;
                review.funnyVotes = funnyMatch ? parseInt(funnyMatch[1].replace(/,/g, '')) : 0;
            } else {
                review.helpfulVotes = 0;
                review.funnyVotes = 0;
            }

            // 奖励数据
            // const awards = card.querySelector('.review_award_aggregated');
            // review.awards = [];
            // if (awards && awards.dataset.tooltipHtml) {
            //     const parser = new DOMParser();
            //     const awardDoc = parser.parseFromString(awards.dataset.tooltipHtml, 'text/html');
            //     const awardElements = awardDoc.querySelectorAll('.review_award');
            //     awardElements.forEach(award => {
            //         const reaction = award.dataset.reaction || 'Unknown';
            //         const countSpan = award.querySelector('.review_award_count');
            //         const count = countSpan && countSpan.textContent.trim() !== '' ? parseInt(countSpan.textContent.trim()) : 1;
            //         if (reaction !== 'Unknown') {
            //             review.awards.push({ reactionId: reaction, count });
            //         }
            //     });
            // }

            // 评论数
            const commentCount = card.querySelector('.apphub_CardCommentCount');
            review.commentCount = commentCount ? parseInt(commentCount.textContent.trim()) : 0;

            reviews.push(review);
        });

        return {
            title,
            comments: reviews,
        }
    });
    console.log(`成功提取了【${post.title}】的${post.comments.length} 条评论`);

    return {
        timestamp: Date.now(),
        ...post,
        prompt: `
            这是游戏${post.title}的steam社区的评论数据。
            我是一名底部的游戏博主，需要将收集到steam游戏评价进行分析，编写一份两分钟以内爆款的短视频口播文案，来让我更引人关注。
            注意不要结构化输出文稿，不要带emoji，这是口播稿。另外风格想要强烈的、幽默的，多用吐槽、反讽、自嘲，不要太正式。
            以下是数据：${JSON.stringify(post.comments)}
        `,
    };
}
