# content-review-panel（审阅面板 · 动态插件模板）

XHS 图文**发布前人工审阅**的浏览器浮动面板：看图、改 Markdown/封面/配色/版式、批准或打回。

## 持久化架构（v11 起）

| 层 | 载体 | 重启后 |
|---|---|---|
| 审阅工具 `content_review_*` | **静态**：content-studio 预设内 `lib/review.js` | ✅ 永久在 |
| 草稿实体（revision/状态/文案） | `~/.dsh/content-studio-output/review/draft.json` | ✅ 数据不丢 |
| 浏览器浮动面板（Client 半） | **动态**：本目录 `client.js` + `host.js`（86 行纯桥接） | ⚠️ 需重建（一条 define+run，约 10 秒） |

面板的 host 半不再注册工具、不再持有草稿 —— 它只把面板的读写桥接到上面的 draft.json。这样内容工作室会话里工具永在，面板重建后草稿原样恢复。

## 重建面板（重启后，或面板缺失时）

在带动态插件工具集的会话里：

1. `cordis_define`：`plugin: { kind: 'new', idPrefix: 'revw' }`，`code.host` = 本目录 `host.js`，`code.client` = 本目录 `client.js`；
2. `cordis_run`（首次带 client 半需授权一次）。

> 非内容工作室预设的会话（没有静态工具）请改用 `host-fulltools.js`（旧版全功能：自带 4 个工具 + 内存草稿），`client.js` 不变。

## 工作流（Agent 视角）

```
content_md_to_cards 渲染卡片
        ↓
content_review_open({ cards, markdown, cover, footer, style, layout, publish_title, publish_body })  ← 草稿落盘，结束本轮
        ↓（用户：面板看图/改字/点按钮，然后说「继续」）
content_review_status
  ├─ edited   → 用返回的 markdown/style/layout/cover/footer/bgImage 重新 content_md_to_cards → content_review_refresh → 再等
  ├─ approved → 用返回的 publishTitle/publishBody 发布 → content_review_close
  └─ rejected → 读 humanNote 修改后重开审阅
```

拖给 agent 的图片：把本地路径写进 markdown（`![描述](路径)`）或作为 `bg_image` —— open/refresh 会自动转成 data URL。
