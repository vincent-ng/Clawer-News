const helpMessage = `
Usage: node analyzeComments.js [options] -p <platform> [-r <resourceId>] [-s] [-v] [--no-cache] [-m <maxComments>] [-h]
OPENAI_API_KEY: Set your OpenAI API Key in the environment variable OPENAI_API_KEY
Options:
  -p, --platform  Specify the platform (bilibili, douyin, steam, 3dm, gamesky), required
  -r, --resourceId   Specify the video/game ID, required for bilibili/douyin/steam
  -s, --stream    Stream the output
  -v, --verbose   Run Puppeteer in non-headless mode (show browser window)
  --no-cache      Ignore cache (useful for debugging)
  -m, --maxComments Specify the maximum number of comments to analyze
  -h, --help      Show this help message and exit
`;

function parseArgs() {
    const args = process.argv.slice(2);
    const config = {
        platform: 'douyin', // 默认平台为抖音
        resourceId: '', // 资源ID，如视频ID或游戏ID
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
            case '--resourceId':
            case '-r':
                config.resourceId = args[++i];
                break;
            case '--no-cache':
                config.checkCache = false;
                break;
            case '--verbose':
            case '-v':
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

    if (!config.openaiApiKey && ['douyin', 'bilibili', 'steam'].includes(config.platform)) {
        console.error('必须提供 OpenAI API Key');
        console.log(helpMessage);
        process.exit(1);
    }

    if (!config.resourceId && ['douyin', 'bilibili'].includes(config.platform)) {
        console.error('必须提供视频ID');
        console.log(helpMessage);
        process.exit(1);
    }

    if (!['bilibili', 'douyin', 'steam', '3dm', 'gamesky'].includes(config.platform)) {
        console.error('平台参数必须是 bilibili, douyin, steam, 3dm, gamesky 之一');
        console.log(helpMessage);
        process.exit(1);
    }


    return config;
}

module.exports = parseArgs;