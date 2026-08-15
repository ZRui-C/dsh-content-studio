---
name: xhs-content-studio
description: 技术内容创作与多平台分发的端到端工作流：Markdown 渲染小红书图文卡片、桌面截屏/录屏、网页截图/录屏（Playwright）、小红书发布、dev.to 官方 API 发布，以及掘金/CSDN/公众号等渠道的发布矩阵。当用户要求生成小红书图文、制作产品宣传卡片、录演示视频、把技术文章分发到多平台时使用。
---

# xhs-content-studio · 内容工作室工作流

本技能把「内容生产 → 视觉化 → 多平台发布」固化为可重复的流水线。你拥有完整编码能力，但做内容宣传时优先调用已配置好的工具，而不是从头写脚本。

## 工具地图

| 能力 | 工具 | 说明 |
|---|---|---|
| 桌面截屏 | `content_screenshot` | macOS screencapture；可区域/延时截取 |
| 桌面录屏 | `content_screen_record` | ffmpeg AVFoundation，固定时长 MP4；可带麦克风、可裁切 |
| 采集设备排查 | `content_capture_devices` | 列出 ffmpeg 看到的屏幕/麦克风设备 |
| Markdown → 图文卡片 | `content_md_to_cards` | Chrome 无头渲染：封面 + 按 H1/H2 分节成卡（1242×1660） |
| AI 文本生图 | `content_text_to_image` | Nano Banana / Gemini 2.5 Flash Image，需 `GEMINI_API_KEY`（aistudio.google.com/apikey）；产出路径可作 `bg_image` 或 `![描述](路径)` |
| Markdown → 排版 HTML | `content_md_to_html` | 自包含 HTML，浏览器预览 / 手动粘贴到 CSDN、公众号 |
| dev.to 发布 | `content_publish_devto` | Forem 官方 API（草稿/直接发布） |
| 网页截图/快照 | `mcp__playwright__browser_take_screenshot` 等 | Playwright MCP（`--browser chrome`） |
| 网页演示录屏 | `mcp__playwright__browser_start_video` / `browser_stop_video` | 录制浏览器会话操作过程 |
| 网页 UI 自动化 | `mcp__playwright__browser_navigate` / `browser_click` / `browser_snapshot` 等 | 可用来操作掘金/公众号编辑器、抓取网页素材 |
| 小红书发布 | `mcp__xhs__xhs_publish_content` | 图文（1-18 图）与视频发布 |
| 小红书登录/状态 | `mcp__xhs__xhs_auth_login` / `xhs_auth_status` / `xhs_auth_logout` | 首次扫码登录后 cookie 持久化 |
| 小红书调研 | `mcp__xhs__xhs_search_note` / `xhs_discover_feeds` / `xhs_get_note_detail` | 调研爆款选题、评论区需求 |
| 小红书管理 | `mcp__xhs__xhs_get_user_notes` / `xhs_delete_note` / `xhs_comment_on_note` | 查看/删除已发笔记、互动 |
| 图文审阅（动态插件） | `content_review_open` / `content_review_status` / `content_review_refresh` / `content_review_close` | 发布前人工审阅：右下角浮动面板看图、改稿、批准/打回；模板见 `plugins/content-review-panel/` |
| 掘金发布（可选） | `mcp__juejin__*` | 需先本地启动 JueJin-MCP（见下） |

## 端到端流程 A：小红书图文笔记

1. **选题调研**：`web_search` 找热点；`mcp__xhs__xhs_search_note` 搜同类笔记，看高赞选题、标题句式、评论区问题。
2. **写 Markdown 稿**（放工作区 `content/` 下，可复用）：
   - 结构：`# 大标题` → 若干 `## 分节`（一节 = 一张卡），每节 3~8 行，短句 + emoji + 要点列表；
   - 口语化、给结论不给过程；代码用 ``` 围栏；重要结论放 `> 引用块`；
   - 字数预算：正文 ≤ 1000 字（XHS 上限），标题 ≤ 20 字符（CJK 计 2 显示单位，上限 40 显示单位）。
3. **生成卡片**：`content_md_to_cards`，参数建议：
   - `style: xhs-soft`（奶油暖调）或 `xhs-dark`（深夜暗调）；`size: xhs`（1242×1660，3:4）；
   - `split: heading`（默认，一屏一卡，自动分块）+ `cover: {title, subtitle, emoji}` + `footer: "OpenClaw · AI 工作流"`；
   - 输出目录默认 `~/.dsh/content-studio-output/cards/<时间戳>/`。
4. **预览与迭代**：逐张 `read_image` 检查排版（截断、跑版、中英文混排）；不满意就改 Markdown 或换 style 重渲染 —— 渲染是幂等的，可反复跑。
5. **补充实拍素材（含照片与背景图）**：
   - 产品界面用 `content_screenshot`（区域截取）或 Playwright 截图；操作演示用 `content_screen_record`（10-60 秒短片段）或 `browser_start_video`。用 ffmpeg（bash 工具）裁剪/加速/加字幕后再插入。
   - **AI 生成封面/背景/插图**：`content_text_to_image`（Nano Banana）按提示词生图（封面用 3:4、背景用 1:1 或 16:9），返回的本地路径直接传给 `bg_image` 或写进 `![描述](路径)`，无需二次处理。
   - **用户拖进对话的图片**：拿到附件路径后，写进 Markdown 用 `![描述](<本地路径>)` 插到对应小节，或作为背景图 `bg_image: <本地路径>` 传给 `content_md_to_cards` / `content_review_open` / `content_review_refresh` —— 审阅插件 Host 会自动把本地路径转成 data URL，面板 2 秒内实时显示；正式渲染器也会自动嵌入。
6. **发布前人工审阅（发布前必经）**：
   - **面板无需重建**：审阅面板是 bundle 自带的静态客户端（`dsh.client` + `/content-studio-api/*` HTTP API），随 profile 加载，重启/换会话都在。若界面里没看到右下角面板，确认 bundle 已安装（`dsh plugin --profile web add dsh-content-studio`）并重启过 DSH。
   - `content_review_open`，传入 `cards`（卡片 PNG 路径，封面在前）、`markdown`、`cover`、`footer`、`style`，以及初始 `publish_title`/`publish_body`（发布文案）→ 浏览器右下角弹出「图文审阅」浮动面板。**面板分两个区**：① 卡片渲染 —— 决定**图片里的字**（改完重渲染）；② 发布文案 —— **图片之外的**标题（≤20 字）和正文（≤1000 字，可带 #话题#），两者相互独立。**调完立即结束本轮**；
   - 用户操作完会说「继续」→ `content_review_status`：
     - `edited`：用返回的 `markdown/cover/footer` 重新 `content_md_to_cards` → `content_review_refresh` 更新面板（发布文案不动）→ 再等一轮确认；
     - `approved`：进入第 7 步发布，**必须用返回的 `publishTitle`/`publishBody` 作为发布文案**，不要用 markdown 当正文；
     - `rejected`：读 `humanNote`，改稿后重开审阅。
   - 若面板不在（进程重启后动态插件丢失）：按项目 `plugins/content-review-panel/README.md` 用 `cordis_define`（`code.host`=host.js、`code.client`=client.js）+ `cordis_run` 拉起 —— **工具与草稿是静态持久的**（草稿在 `~/.dsh/content-studio-output/review/draft.json`），只需重建面板这层，数据原样恢复。
7. **发布**：
   - `mcp__xhs__xhs_auth_status` → 未登录则 `xhs_auth_login`（终端会出二维码，让用户扫码，全程无头浏览器完成登录）；
   - `mcp__xhs__xhs_publish_content`：`type: image`，`title` = 面板②区的发布标题（≤20 字），`content` = 面板②区的发布正文（≤1000 字，带 #话题#），`media_paths` 传卡片 PNG 路径数组（1-18 张），`tags` 2-5 个 —— 图片里的字与发布正文是两套内容，别混用；
   - 发布完成后 `content_review_close` 关闭面板；建议先发 1-2 篇观察数据，再批量。

## 端到端流程 B：技术长文多平台分发

1. 用标准 Markdown 写长文（含代码块、表格、配图）。
2. **dev.to（英文主阵地）**：`content_publish_devto`，先 `published: false` 存草稿检查，确认后 `published: true`。tags ≤ 4 个；`canonical_url` 可指向中文首发链接（SEO 规范）。
3. **掘金（中文技术主阵地）**：两种方式
   - 可选 MCP：`unomcp/JueJin-MCP`（Go）—— 本地构建后监听 `http://localhost:10086/mcp`，支持登录持久化、草稿箱、分类/标签发布；在 `agent.cordis.yml` 里取消 `mcp-juejin` 行注释即可接入（`streamable-http`）。
   - 浏览器自动化：Playwright MCP 打开 `https://juejin.cn/editor/drafts/new`，登录后 `browser_click`/`browser_type` 填入标题正文，`browser_take_screenshot` 校对后手动点发布。
4. **CSDN**：无公开 API。`content_md_to_html` 生成排版 HTML 后复制粘贴到 CSDN Markdown 编辑器；或 Playwright 自动化粘贴。注意 CSDN 原创标识与审核。
5. **微信公众号**：无个人 API。`content_md_to_html` → 粘贴进公众号编辑器（图片需重新上传）；或交给 mdnice 等排版工具。发布前用 `browser_take_screenshot` 预览手机版。
6. **V2EX（宣传帖）**：个人 token 发帖 API（`v2ex.com/settings/tokens`），bash 工具 curl 即可：`POST https://www.v2ex.com/api/v2/topics`，适合发「我做了个开源项目」类帖子。
7. **视频平台（B站/抖音/视频号）**：`content_screen_record` 录演示 → ffmpeg 压制 → 手动上传。B站投稿有开放平台 API（需企业/个人认证），暂走手动。

## 平台规格速查（调研结论）

| 平台 | AI 接入 | 内容形态 | 关键限制 |
|---|---|---|---|
| 小红书 | ✅ xhs-mcp（Puppeteer，扫码登录持久化） | 图文/视频 | 标题≤20字、正文≤1000、图1-18张、3:4最佳 |
| dev.to | ✅ 官方 REST API | Markdown 长文 | 4 tags、需 API key |
| 掘金 | ⚠️ 社区 MCP（Go，本地自建）+ 浏览器自动化 | 技术长文 | 需登录态；分类/标签必填 |
| CSDN | ⚠️ 无 API，手动/浏览器自动化 | 技术长文 | 原创审核 |
| 微信公众号 | ⚠️ 无 API，手动粘贴 | 长文 | 图片手动上传 |
| V2EX | ✅ token API 发帖 | 短帖 | 每日发帖频率限制 |
| B站/抖音 | ⚠️ 视频手动上传 | 视频 | 需账号与审核 |
| 知乎 | ❌ 无官方 API | 长文/回答 | 自动化属灰色地带，谨慎 |

## 首次使用清单

- [ ] macOS：系统设置 → 隐私与安全性 → 屏幕录制 → 勾选运行 DSH 的终端（否则 `content_screenshot`/`content_screen_record` 无输出）。
- [ ] `ffmpeg`：`brew install ffmpeg`（本机已装）。
- [ ] Chrome：本机已装，插件自动探测；否则设置 `CHROME_PATH`。
- [ ] 小红书：会话里调用 `mcp__xhs__xhs_auth_login` 扫码一次（cookie 持久化，之后免登录）。
- [ ] dev.to：`https://dev.to/settings/extensions` 创建 API key，`export DEVTO_API_KEY=...`（或调用工具时传 `api_key`）。
- [ ] 掘金（可选）：构建并运行 JueJin-MCP，取消 `agent.cordis.yml` 中 `mcp-juejin` 行注释，重启会话。

## 故障排查

- **没有 `mcp__playwright__*` / `mcp__xhs__*` 工具**：这些 MCP 走 `npx`，首次冷启动要下载包（几十秒到几分钟）；`failOnStartupError: false` 保证会话能开，但工具要等 MCP 就绪。等 1-2 分钟后新开会话，或手动 `npx -y xhs-mcp mcp` 预热。
- **screencapture 无输出**：屏幕录制权限未授权；区域坐标超出显示器（Retina 下坐标是 point 不是像素）。
- **录屏没有「Capture screen」设备**：同上权限问题；先跑 `content_capture_devices` 看设备列表。
- **XHS 发布失败**：检查登录态（`xhs_auth_status`）、标题长度（≤20 字）、图片张数（1-18）、图片格式（PNG/JPG）。
- **卡片文字截断**：一节内容太多，被分块到多张卡是正常行为；若单卡仍溢出，精简该节文字或把大代码块拆分。
- **Chrome 渲染报错**：`--headless=new` 需要较新 Chrome；设 `CHROME_PATH` 指向其他 Chromium 内核浏览器。
