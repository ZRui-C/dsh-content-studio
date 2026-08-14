# dsh-content-studio

**面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的内容创作与多平台分发 bundle 插件。**

[English](README.en.md) · [dsh-plugin 主题](https://github.com/topics/dsh-plugin)

截屏、录屏、Markdown 渲染小红书图文、dev.to 发布、发布前人工审阅 —— 一次安装、十个工具，告别每次现写脚本。

## 特性

- 🎨 `content_text_to_image` —— 文本生图（Nano Banana / Gemini 2.5 Flash Image，需 API key）：封面、背景图、插图一键生成
- 📸 `content_screenshot` —— macOS 桌面截屏（全屏 / 区域 / 延时）
- 🎬 `content_screen_record` —— ffmpeg AVFoundation 定时长 MP4 录屏，自动探测屏幕/麦克风设备，支持麦克风与裁切区域
- 🃏 `content_md_to_cards` —— Markdown → 小红书图文卡片（Chrome 无头渲染）：封面卡 + 按 H1/H2 分节成卡，1242×1660（3:4），**5 套配色 × 4 种版式**，支持 `![描述](路径)` 插图与带可读性遮罩的背景图
- 🌐 `content_md_to_html` —— 自包含排版 HTML，用于预览、CSDN、公众号粘贴
- 📤 `content_publish_devto` —— dev.to（Forem）官方 API 发布（草稿/直发）
- 👀 `content_review_open / status / refresh / close` —— 持久化的人工审阅闸门：草稿落盘 `~/.dsh/content-studio-output/review/draft.json`，浏览器浮动审阅面板（**审阅 / 发布 / 设置** 三个页签）**实时预览**卡片，用户可改文字、配色、版式与发布文案，然后批准或打回
- 🔌 Playwright MCP（`mcp__playwright__*`）—— 网页截图、会话录屏、UI 自动化（系统 Chrome）
- 📕 xhs-mcp（`mcp__xhs__*`）—— 小红书登录、图文/视频发布、搜索

## 安装

### 方式 A —— bundle 安装（推荐）

```bash
dsh plugin --profile web add "github:ZRui-C/dsh-content-studio#main"
# 开发时用本地路径：
dsh plugin --profile web add ~/Projects/dsh-content-studio
```

重启 DSH 生效。本包在 `package.json` 中声明了 `dsh.bundle.patch`，安装后其 patch 成为 profile 激活层：宿主插件（全部工具）+ Playwright / 小红书 MCP 行。可与任意预设（`standard`、`cordis` 等）搭配，Settings → Plugins 面板可见。

### 方式 B —— 预设复制

```bash
rsync -a ~/Projects/dsh-content-studio/ ~/.dsh/.agent-presets/content-studio/
```

新开会话选「内容工作室」预设：`standard` 全量 + 插件行 + MCP 行 + 动态插件工具集（`cordis_*`）+ 工作流 Skill。

> ⚠️ 两种方式二选一。两者注册相同工具名，同时挂载会因重名冲突而失败。

## 工具

| 工具 | 能力 |
| --- | --- |
| `content_screenshot` | 桌面截屏（macOS screencapture），区域/延时 |
| `content_screen_record` | 定时长桌面 MP4 录屏（ffmpeg AVFoundation），可选麦克风与裁切 |
| `content_capture_devices` | 列出 ffmpeg 可见的采集设备 |
| `content_md_to_cards` | Markdown → XHS 卡片（Chrome 无头渲染，封面 + 分节成卡） |
| `content_text_to_image` | 文本生图（Nano Banana），支持 1:1/3:4/4:3/9:16/16:9 |
| `content_md_to_html` | Markdown → 排版 HTML（自包含） |
| `content_publish_devto` | dev.to API 发布 |
| `content_review_open / status / refresh / close` | 发布前持久化人工审阅 |
| `mcp__playwright__*` | 网页截图 / 录屏 / UI 自动化 |
| `mcp__xhs__*` | 小红书登录 / 发布 / 搜索 |

## 卡片样式系统

两个独立维度 —— 配色 × 版式，外加照片插图与背景图：

- **配色（5 套）**：`xhs-soft` 奶油暖调 · `xhs-dark` 深夜暗调 · `plain` 简洁白底 · `forest` 森林墨绿 · `sunset` 落日暖橙
- **版式（4 种）**：`classic` 经典（左竖线标题）· `magazine` 杂志（衬线居中）· `poster` 大字报（超大标题、色块高亮）· `notebook` 手账（贴纸胶囊、横线底纹）
- **照片**：Markdown 图片语法 `![描述](路径/URL)`，本地路径自动嵌入为 data URL
- **背景图**：`bg_image`（URL 或本地路径），带主题感半透明遮罩保证文字可读
- **AI 生图**：`content_text_to_image` 生成封面/背景/插图（本地路径直接可用作 `bg_image` 或 `![描述](路径)`）

## 审阅工作流（人机双层协作）

实体层 + 双交互层：Agent 用工具创作，人类看图改稿：

```
content_md_to_cards              渲染卡片（PNG）
        ↓
content_review_open              草稿落盘；浏览器弹出审阅面板
        ↓   用户看缩略图，改卡片 Markdown/配色/版式，
        ↓   以及独立于图片文字的发布标题/正文
content_review_status
  ├─ edited   → 用修改后的字段重渲染 → content_review_refresh → 再等一轮
  ├─ approved → 用面板的发布标题/正文发布 → content_review_close
  └─ rejected → 读 humanNote，改稿后重开审阅
```

工具与草稿是**静态持久**的（重启不丢）。浏览器面板是动态插件 —— 客户端半需要 `dsh.client` 构建管线才能静态化（见 Roadmap）。面板模板在 `plugins/content-review-panel/`，任意会话 `cordis_define` + `cordis_run` 约 10 秒即可重建，草稿数据永不丢失。

## 平台矩阵

| 平台 | 通道 | 说明 |
| --- | --- | --- |
| 小红书 XHS | `mcp__xhs__*` | 标题 ≤ 20 字、正文 ≤ 1000、1–18 图（3:4 最佳） |
| dev.to | `content_publish_devto` | 官方 API，≤ 4 tags |
| 掘金 Juejin | 可选 `mcp-juejin` 行 / Playwright UI 自动化 | 需本地起 JueJin-MCP 服务 |
| CSDN / 公众号 | `content_md_to_html` 粘贴 | 无公开 API |
| V2EX | bash + token API | 宣传帖 |

## 环境要求

- macOS、ffmpeg（`brew install ffmpeg`）、Google Chrome
- AI 生图需 Gemini API key（[aistudio.google.com/apikey](https://aistudio.google.com/apikey) 创建，设 `GEMINI_API_KEY` 或调用时传 `api_key`）
- dev.to 发布需 API key（dev.to/settings/extensions 创建，设 `DEVTO_API_KEY`）
- 也可直接在审阅面板「③ API Keys」区配置（保存到 `~/.dsh/content-studio-output/keys.json`，仅显示已配置状态）
- 给运行 DSH 的终端授予「屏幕录制」权限
- 小红书一次性扫码登录（`mcp__xhs__xhs_auth_login`）；dev.to API key 设 `DEVTO_API_KEY`

## 跨机器注意

- `cordis.patch.yml` 把 xhs-mcp 固定在作者的 Chrome 二进制上（`PUPPETEER_EXECUTABLE_PATH`）。换机器时要么改成目标机器的路径，要么删掉这个环境变量并执行一次 `npx xhs-mcp browser` 让它自下载 Chromium。
- 桌面截屏/录屏（`content_screenshot` / `content_screen_record`）目前仅 macOS（screencapture / AVFoundation）；Linux/Windows 适配在路线图上。
- 审阅草稿在 `~/.dsh/content-studio-output/` 下；卡片渲染需要本机 Chrome（或 `CHROME_PATH` 指向 Chromium 内核浏览器）。

## 仓库结构

```
├── package.json            # dsh.bundle.patch 声明
├── cordis.patch.yml        # bundle 层：宿主行 + MCP 行
├── preset.yml              # 方式 B 的显示元数据
├── agent.cordis.yml        # 方式 B 的预设组合
├── src/index.js            # 宿主插件 —— 注册全部 10 个工具
├── src/lib/                # screenshot / record / cards / template / devto / util / review
├── vendor/marked.umd.cjs   # vendored Markdown 解析器（零运行时依赖）
├── plugins/content-review-panel/  # 审阅面板动态插件模板
└── skills/xhs-content-studio/     # 端到端工作流 Skill
```

## Roadmap

- [x] 宿主侧 bundle 化 —— `dsh plugin add` 已在无头实例端到端验证
- [ ] 审阅面板静态化 —— 声明 `dsh.client`，经官方 client-modules 管线发布浏览器构建产物，数据通道改为 session projection（host→client）+ 命令（client→host）
- [ ] Linux / Windows 截屏录屏适配
- [ ] dsh-plugin 主题收录

## License

MIT
