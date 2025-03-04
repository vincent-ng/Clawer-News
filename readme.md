# Clawer-News 项目 README

## 项目简介
Clawer-News 是一个用于从多个平台（如 bilibili、douyin、3dm、gamesky）抓取和分析评论的工具。它使用 Puppeteer 进行网页自动化，并通过 OpenAI API 对评论进行情感分析。此外，项目还支持缓存机制以提高效率。

## 目录结构
```
clawer-news/
├── cache/                       # 缓存文件存放目录
├── src/
│   ├── analyzeComments.js       # 主要的评论分析逻辑
│   ├── puppeteer-handler/       # 不同平台的评论抓取处理模块
│   │   ├── bilibiliComments.js  
│   │   └── douyinComments.js    
│   ├── fetchHotArticles.js        # 抓取文章信息并输出为表格
│   └── tools/                   # 工具函数模块
│       └── parseArgs.js         # 命令行参数解析
├── user_data/                   # 浏览器用户数据存储目录
└── package.json                 # 项目依赖配置
```

## 安装依赖
确保已安装 Node.js 环境后，在项目根目录下运行以下命令来安装所有依赖：
```bash
npm install
```

## 使用说明

### 分析评论
执行 `analyzeComments.js` 可以对指定平台上的视频或文章进行评论抓取及分析。支持通过环境变量设置 OpenAI API Key。
```bash
OPENAI_API_KEY=your_api_key node src/analyzeComments.js [options]
```

#### 参数说明
| 参数 | 描述 |
| --- | --- |
| `-p, --platform` | 指定平台 (bilibili, douyin, 3dm, gamesky)，必填项 |
| `-r, --resourceId` | 资源ID，对于 bilibili、douyin、steam 必填 |
| `--no-cache` | 忽略缓存，强制重新抓取数据 |
| `-V, --verbose` | 开启浏览器窗口模式 |
| `-s, --stream` | 启用流式输出结果 |
| `-m, --maxComments` | 设置最大评论数量，默认50条 |
| `-h, --help` | 显示帮助信息 |

### 抓取文章信息
执行 `fetchHotArticles.js` 可以从指定平台上抓取文章列表及其相关信息（如阅读量、评论数），并将结果整理成表格形式输出。
```bash
node src/fetchHotArticles.js -p <platform>
```

#### 支持的平台
- `3dm`: 游戏资讯网站 3DM
- `gamesky`: 游戏天空网
- `steam`: Steam 游戏平台

### 快捷命令
项目提供了以下 npm run 快捷命令：
- npm run 3dm: 抓取 3DM 平台的文章信息。
- npm run gamesky: 抓取 游戏天空网 平台的文章信息。
- npm run douyin: 分析 Douyin 平台上的视频评论。
- npm run bilibili: 分析 Bilibili 平台上的视频评论。

## 注意事项
1. **OpenAI API Key**: 需要在环境变量中设置 `OPENAI_API_KEY`，否则无法调用 OpenAI 的 API 进行情感分析。
2. **缓存机制**: 默认情况下会检查本地缓存，若数据未过期则直接读取缓存；可以通过 `--no-cache` 参数禁用此功能。
3. **浏览器启动**: 当启用 verbose 模式时，Puppeteer 将不会以无头模式启动浏览器，方便调试。

## 贡献指南
欢迎任何形式的贡献！如果您发现了 bug 或有改进建议，请提交 issue 或 pull request。

## 许可证
本项目采用 ISC License 许可证，详情参见 LICENSE 文件。