# dsh-content-studio · 内容工作室

面向 DeepSeek Harness 的**内容创作与多平台分发** bundle 插件：截屏、录屏、Markdown 渲染小红书图文（5 配色 × 4 版式、照片插图、背景图）、dev.to 官方 API 发布、发布前人工审阅，并挂载 Playwright 与小红书 MCP。

## 两种安装方式（二选一，同时装会因工具重名冲突）

### A. 正规 bundle 安装（推荐，工具永久在）

```bash
# 从 GitHub 安装（发布后）
dsh plugin --profile web add "github:<owner>/dsh-content-studio#main"
# 或本地路径（开发时）
dsh plugin --profile web add ~/Projects/dsh-content-studio
# 重启 DSH 生效；Settings → Plugins 面板可见
```

原理：本包 `package.json` 声明了 `"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }`，安装后其 patch 成为 profile 激活层 —— 一行宿主插件（10 个工具，全部注册在共享 tools 注册表）+ 两行 MCP（Playwright、xhs-mcp）+ 可选掘金 MCP。配合任何预设（standard/cordis）使用。

### B. 预设复制安装（自带全套，适合嵌入 OpenClaw 等场景）

```bash
rsync -a ~/Projects/dsh-content-studio/ ~/.dsh/.agent-presets/content-studio/
```
新开会话选预设「内容工作室」。预设 = `standard` 全量 + 插件行 + MCP 行 + 动态插件工具集（`tool-cordis`，用于拉起审阅面板）+ 工作流 Skill。

## 组成

```
dsh-content-studio/
├── package.json                # bundle 声明（dsh.bundle.patch）
├── cordis.patch.yml            # 安装方式 A 的 profile patch 层
├── preset.yml / agent.cordis.yml  # 安装方式 B 的预设组合
├── src/
│   ├── index.js                # 宿主插件：10 个工具注册
│   └── lib/                    # screenshot / record / cards / template / devto / util / review
├── vendor/marked.umd.cjs       # vendored Markdown 解析器
├── plugins/content-review-panel/  # 审阅面板动态插件模板（host.js/client.js + 说明）
└── skills/xhs-content-studio/SKILL.md  # 端到端工作流 Skill
```

## 工具

| 工具 | 能力 |
|---|---|
| `content_screenshot` / `content_screen_record` / `content_capture_devices` | macOS 桌面截屏 / 录屏（ffmpeg AVFoundation，自动探测设备）/ 设备诊断 |
| `content_md_to_cards` / `content_md_to_html` | Markdown → XHS 图文卡片（5 配色 × 4 版式、封面、按节分卡、照片插图、背景图，Chrome 无头渲染） |
| `content_publish_devto` | dev.to 官方 API 发布（草稿/直发） |
| `content_review_open/status/refresh/close` | 发布前人工审阅：草稿落盘 `~/.dsh/content-studio-output/review/draft.json`，配合审阅面板双人协作 |
| `mcp__playwright__*` / `mcp__xhs__*` | 网页截图/录屏/自动化；小红书登录/发布/搜索 |

## 审阅面板（人类层）

面板是**动态插件**（浏览器 Client 半）：本会话里 `cordis_define`（`code.host`=`plugins/content-review-panel/host.js`，`code.client`=`client.js`）+ `cordis_run` 拉起。它只桥接 `draft.json` —— **工具与草稿由本 bundle 静态持有，重启后数据不丢，只需重建面板薄壳**。工作流见 `skills/xhs-content-studio/SKILL.md`。

## Roadmap

- [x] 宿主侧 bundle 化（`dsh plugin add` 安装，无头实例验证通过）
- [ ] 审阅面板静态化：声明 `dsh.client` + `exports["./client"]` 指向构建后的浏览器 bundle（官方 `dsh-client-modules` 管线：host 扫描构建、挂 /plugins 服务），数据通道改 session projection（host→client）+ 命令（client→host）
- [ ] 发布 GitHub + `dsh-plugin` topic 收录
- [ ] Linux/Windows 截屏录屏适配
