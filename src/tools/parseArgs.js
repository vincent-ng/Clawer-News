const helpMessage = `
Usage: node analyzeComments.js [options] -p <platform> [-v <videoId>] [-s] [-V] [--no-cache] [-m <maxComments>] [-h]
OPENAI_API_KEY: Set your OpenAI API Key in the environment variable OPENAI_API_KEY
Options:
  -p, --platform  Specify the platform (bilibili, douyin, 3dm, gamesky), required
  -v, --videoId   Specify the video ID, required for bilibili and douyin
  -s, --stream    Stream the output
  -V, --verbose   Run Puppeteer in non-headless mode (show browser window)
  --no-cache      Ignore cache (useful for debugging)
  -m, --maxComments Specify the maximum number of comments to analyze
  -h, --help      Show this help message and exit
`;

function parseArgs() {
    const args = process.argv.slice(2);
    const config = {
        platform: 'douyin', // 默认平台为抖音
        videoId: '', // 视频ID
        checkCache: true, // 是否检查缓存
        verbose: false, // 是否详细输出
        streamOutput: false, // 是否流式输出
        maxComments: 50, // 默认最大评论数量为50
        openaiApiKey: process.env.OPENAI_API_KEY,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--platform':
            case '-p':
                config.platform = args[++i];
                break;
            case '--videoId':
            case '-v':
                config.videoId = args[++i];
                break;
            case '--no-cache':
                config.checkCache = false;
                break;
            case '--verbose':
            case '-V':
                config.verbose = true;
                break;
            case '--stream':
            case '-s':
                config.streamOutput = true;
                break;
            case '--maxComments':
            case '-m':
                config.maxComments = parseInt(args[++i], 10);
                break;
            case '--help':
            case '-h':
                console.log(helpMessage);
                process.exit(0);
            default:
                console.error(`未知参数: ${arg}`);
                process.exit(1);
        }
    }

    if (!config.openaiApiKey && ['douyin', 'bilibili'].includes(config.platform)) {
        console.error('必须提供 OpenAI API Key');
        console.log(helpMessage);
        process.exit(1);
    }

    if (!config.videoId && ['douyin', 'bilibili'].includes(config.platform)) {
        console.error('必须提供视频ID');
        console.log(helpMessage);
        process.exit(1);
    }

    if (!['bilibili', 'douyin', '3dm', 'gamesky'].includes(config.platform)) {
        console.error('平台参数必须是 bilibili, douyin, 3dm 或 gamesky');
        console.log(helpMessage);
        process.exit(1);
    }


    return config;
}

module.exports = parseArgs;