// 辅助函数：自动滚动页面
async function scrollPage(page, config = {}) {
    await page.evaluate(async ({ timeout = 5000, container = 'body', step = 300 }) => {
        await new Promise((resolve, reject) => {
            let totalHeight = 0;
            const interval = setInterval(() => {
                const element = document.querySelector(container);
                element.scrollBy(0, step);
                totalHeight += step;
                if (totalHeight >= element.scrollHeight) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);

            setTimeout(() => {
                clearInterval(interval);
                resolve();
            }, timeout);
        });
    }, config);
}

module.exports = scrollPage;