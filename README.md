# dsh-content-studio

**Content creation & multi-platform publishing bundle plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).**

[中文说明](README.zh-CN.md) · [dsh-plugin topic](https://github.com/topics/dsh-plugin)

Screenshots, screen recording, Markdown → Xiaohongshu (XHS) image cards, dev.to publishing, and a human-in-the-loop review gate before anything goes live — one install, ten tools, no more ad-hoc scripts.

## Features

- 📸 `content_screenshot` — desktop screenshot on macOS (full screen / region / delay)
- 🎬 `content_screen_record` — timed MP4 screen capture via ffmpeg AVFoundation with automatic device detection, optional microphone and crop region
- 🃏 `content_md_to_cards` — Markdown → XHS image cards rendered by headless Chrome: cover card + one card per H1/H2 section at 1242×1660 (3:4), **5 palettes × 4 layouts**, photos via `![alt](path)`, background images with a readability overlay
- 🌐 `content_md_to_html` — self-contained styled HTML for preview, CSDN, or the WeChat editor
- 📤 `content_publish_devto` — official dev.to (Forem) API publishing (draft or publish)
- 👀 `content_review_open / status / refresh / close` — a durable human review gate: the draft persists to `~/.dsh/content-studio-output/review/draft.json`, and a floating review panel in the browser shows **live card previews** where the user edits text, palette, layout, and the publish copy — then approves or rejects
- 🔌 Playwright MCP (`mcp__playwright__*`) — webpage screenshots, session video, UI automation (system Chrome channel)
- 📕 xhs-mcp (`mcp__xhs__*`) — Xiaohongshu login, image/video publishing, search

## Install

### Option A — bundle (recommended)

```bash
dsh plugin --profile web add "github:ZRui-C/dsh-content-studio#main"
# or a local checkout while developing:
dsh plugin --profile web add ~/Projects/dsh-content-studio
```

Restart DSH. The package declares `dsh.bundle.patch`, so the profile layer mounts the host plugin (all tools) plus the Playwright / XHS MCP rows. Works with any agent preset (`standard`, `cordis`, …) and appears under Settings → Plugins.

### Option B — agent preset copy

```bash
rsync -a ~/Projects/dsh-content-studio/ ~/.dsh/.agent-presets/content-studio/
```

Then start a session on the 内容工作室 (content-studio) preset: `standard` + the plugin rows + MCP rows + the dynamic-plugin toolset (`cordis_*`) + the workflow skill.

> ⚠️ Pick ONE install path. Both register the same tool names; mounting both fails loudly on duplicates.

## Tools

| Tool | What it does |
| --- | --- |
| `content_screenshot` | Desktop screenshot (macOS screencapture), region / delay |
| `content_screen_record` | Fixed-duration desktop MP4 (ffmpeg AVFoundation), optional mic & crop |
| `content_capture_devices` | List the capture devices ffmpeg sees |
| `content_md_to_cards` | Markdown → XHS cards (headless Chrome, cover + per-section split) |
| `content_md_to_html` | Markdown → styled self-contained HTML |
| `content_publish_devto` | dev.to API publishing |
| `content_review_open / status / refresh / close` | Durable human review gate before publishing |
| `mcp__playwright__*` | Webpage screenshot / video / UI automation |
| `mcp__xhs__*` | Xiaohongshu login / publish / search |

## Card style system

Two independent dimensions — palette and layout — plus photos and background images:

- **Palettes (5)**: `xhs-soft` 奶油暖调 · `xhs-dark` 深夜暗调 · `plain` 简洁白底 · `forest` 森林墨绿 · `sunset` 落日暖橙
- **Layouts (4)**: `classic` 经典 (left-bar headings) · `magazine` 杂志 (serif, centered) · `poster` 大字报 (oversized headings, color-block highlights) · `notebook` 手账 (sticker pills, ruled background)
- **Photos**: Markdown image syntax `![alt](path-or-url)` — local paths are embedded as data URLs automatically
- **Background**: `bg_image` (URL or local path) with a theme-aware translucent overlay for text readability

## Review workflow (human in the loop)

Entity layer + two interaction layers — the agent edits with tools, the human reviews and adjusts visually:

```
content_md_to_cards              render cards (PNG)
        ↓
content_review_open              draft persisted to disk; browser panel appears
        ↓   user views thumbnails, edits card markdown/palette/layout,
        ↓   and the publish title/body (independent of the card text)
content_review_status
  ├─ edited   → re-render with the edited fields → content_review_refresh → wait again
  ├─ approved → publish using the panel's publish title/body → content_review_close
  └─ rejected → read humanNote, revise, re-open
```

Tools and the draft are static (they survive restarts). The browser panel is a dynamic Cordis plugin — the client half cannot ship statically without the `dsh.client` build pipeline (see Roadmap). Rebuild it in any session from `plugins/content-review-panel/` with `cordis_define` + `cordis_run` (~10 s); draft data is never lost.

## Platform matrix

| Platform | Channel | Notes |
| --- | --- | --- |
| 小红书 XHS | `mcp__xhs__*` | title ≤ 20 chars, body ≤ 1000, 1–18 images (3:4 best) |
| dev.to | `content_publish_devto` | official API, ≤ 4 tags |
| 掘金 Juejin | optional `mcp-juejin` row / Playwright UI automation | needs a locally hosted JueJin-MCP |
| CSDN / WeChat | `content_md_to_html` paste | no public API |
| V2EX | bash + token API | promo threads |

## Requirements

- macOS, ffmpeg (`brew install ffmpeg`), Google Chrome
- Screen Recording permission for the terminal running DSH
- One-time XHS QR login (`mcp__xhs__xhs_auth_login`); dev.to API key via `DEVTO_API_KEY`

## Cross-machine notes

- `cordis.patch.yml` pins xhs-mcp to the author's Chrome binary (`PUPPETEER_EXECUTABLE_PATH`). On another machine either update that path, or remove the env entry and run `npx xhs-mcp browser` once to let it download its own Chromium.
- Desktop capture tools (`content_screenshot` / `content_screen_record`) are macOS-only for now (screencapture / AVFoundation); Linux/Windows adapters are on the roadmap.
- The review draft lives under `~/.dsh/content-studio-output/`; card renders need a local Chrome (or `CHROME_PATH` pointing at a Chromium binary).

## Repository layout

```
├── package.json            # dsh.bundle.patch declaration
├── cordis.patch.yml        # bundle layer: host row + MCP rows
├── preset.yml              # display metadata for Option B
├── agent.cordis.yml        # preset composition (Option B)
├── src/index.js            # host plugin — registers all 10 tools
├── src/lib/                # screenshot / record / cards / template / devto / util / review
├── vendor/marked.umd.cjs   # vendored markdown parser (zero runtime deps)
├── plugins/content-review-panel/  # review panel dynamic-plugin template
└── skills/xhs-content-studio/     # end-to-end workflow skill
```

## Roadmap

- [x] Host-side bundle — `dsh plugin add` verified end-to-end on a headless profile
- [ ] Static review panel — declare `dsh.client`, ship a built browser bundle through the official client-modules pipeline, move the data channel to session projections (host→client) + commands (client→host)
- [ ] Linux / Windows capture support
- [ ] dsh-plugin topic listing

## License

MIT
