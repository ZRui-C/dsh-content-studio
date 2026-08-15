// @openclaw/dsh-content-studio — content-studio tools for DeepSeek Harness.
//
// Desktop screenshot / screen recording (macOS), Markdown → Xiaohongshu image
// cards (Chrome headless), styled HTML export, and dev.to publishing.
//
// Plain Cordis plugin. It registers tools on the host `tools` registry and
// provides no service, so it needs no isolate realm — same shape as the shipped
// tool-* rows.
import { screenshotDesktop } from './lib/screenshot.js'
import { recordScreen, listDevices } from './lib/record.js'
import { mdToCards, mdToHtml, findChrome } from './lib/cards.js'
import { publishDevto } from './lib/devto.js'
import { reviewOpen, reviewStatus, reviewRefresh, reviewClose } from './lib/review.js'
import { textToImage } from './lib/text2img.js'
import { objectSchema, textBlock, REGION_SCHEMA } from './lib/util.js'

export const name = 'content-studio'
export const inject = ['tools']

const STYLE_ENUM = ['xhs-soft', 'xhs-dark', 'plain', 'forest', 'sunset']
const SIZE_ENUM = ['xhs', 'square', 'story']
const LAYOUT_ENUM = ['classic', 'magazine', 'poster', 'notebook']

// DSH's supported schema subset has no type arrays; nullable fields use oneOf.
const NULLABLE_OBJECT = {
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        x: { type: 'integer' },
        y: { type: 'integer' },
        width: { type: 'integer' },
        height: { type: 'integer' },
      },
    },
    { type: 'null' },
  ],
}
const NULLABLE_STRING = { oneOf: [{ type: 'string' }, { type: 'null' }] }
const NULLABLE_INTEGER = { oneOf: [{ type: 'integer' }, { type: 'null' }] }

const stringParam = (description, extra = {}) => ({ type: 'string', description, ...extra })

function registerTool(ctx, definition) {
  ctx.tools.register(definition)
}

export function apply(ctx) {
  // ── desktop screenshot ────────────────────────────────────────────────────
  registerTool(ctx, {
    name: 'content_screenshot',
    description:
      'Capture a desktop screenshot on macOS (screencapture). Returns an absolute PNG path; view it with read_image. ' +
      'Optionally restrict to a display-coordinate region or delay a few seconds to set up a window. ' +
      'For webpage screenshots prefer the Playwright MCP tools (mcp__playwright__browser_take_screenshot).',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        output_path: stringParam('Optional absolute PNG path. Default: ~/.dsh/content-studio-output/screenshots/shot-<timestamp>.png'),
        region: REGION_SCHEMA,
        delay_seconds: {
          type: 'integer',
          description: 'Delay in seconds before capturing (0-10). Useful to bring a window to front.',
        },
      },
    },
    output: {
      schema: objectSchema(
        {
          output_path: { type: 'string' },
          region: NULLABLE_OBJECT,
          delay_seconds: { type: 'integer' },
          note: { type: 'string' },
        },
        ['output_path']
      ),
      render: (_args, value) =>
        textBlock(`Screenshot saved: ${value.output_path}\n${value.region ? `Region: ${JSON.stringify(value.region)}\n` : ''}View it with read_image.`),
    },
    execute: (args) => screenshotDesktop(args),
  })

  // ── desktop screen recording ──────────────────────────────────────────────
  registerTool(ctx, {
    name: 'content_screen_record',
    description:
      'Record the desktop screen on macOS for a fixed duration using ffmpeg AVFoundation capture, producing an MP4. ' +
      'Blocks until done; keep takes short (10-120s) and concatenate clips with ffmpeg if needed. ' +
      'Requires Screen Recording permission for the terminal running DSH. Optional: microphone audio, display-coordinate crop region. ' +
      'For webpage demo videos prefer the Playwright MCP tools (mcp__playwright__browser_start_video / browser_stop_video).',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['duration_seconds'],
      properties: {
        duration_seconds: {
          type: 'integer',
          description: 'Recording length in seconds (1-600).',
        },
        output_path: stringParam('Optional absolute MP4 path. Default: ~/.dsh/content-studio-output/recordings/record-<timestamp>.mp4'),
        mic: {
          type: 'boolean',
          description: 'Also record the first microphone device. Default false (no audio track).',
        },
        framerate: {
          type: 'integer',
          description: 'Frames per second, 5-60. Default 30.',
        },
        region: REGION_SCHEMA,
      },
    },
    output: {
      schema: objectSchema(
        {
          output_path: { type: 'string' },
          duration_seconds: { type: 'integer' },
          framerate: { type: 'integer' },
          screen_device: { type: 'string' },
          audio_device: { type: 'string' },
          region: NULLABLE_OBJECT,
          note: { type: 'string' },
        },
        ['output_path']
      ),
      render: (_args, value) =>
        textBlock(
          `Recording saved: ${value.output_path}\n${value.duration_seconds}s @ ${value.framerate}fps, screen=${value.screen_device}, audio=${value.audio_device}` +
            (value.region ? `, region=${JSON.stringify(value.region)}` : '') +
            '\nPost-process (trim/speed/captions) with ffmpeg via the bash tool.'
        ),
    },
    execute: (args) => recordScreen(args),
    timeoutMs: 700000,
  })

  // ── markdown → XHS image cards ────────────────────────────────────────────
  registerTool(ctx, {
    name: 'content_md_to_cards',
    description:
      'Render Markdown into Xiaohongshu-style image cards (PNG) using headless Chrome. ' +
      'split=heading (default) makes a cover plus one card per H1/H2 section, chunked to fit the card height; split=none makes one long image. ' +
      'XHS size is 1242×1660 (3:4). Returns ordered card paths — preview with read_image, then publish via mcp__xhs__xhs_publish_content. ' +
      'Style has two dimensions: style (palette: xhs-soft 奶油暖调, xhs-dark 深夜暗调, plain 简洁白底, forest 森林墨绿, sunset 落日暖橙) and layout (版式: classic 经典, magazine 杂志, poster 大字报, notebook 手账). Cards are not text-only: embed photos with Markdown image syntax ![alt](url-or-local-path), and set a background image with bg_image (URL or local path). Use content_md_to_html for browser preview.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        markdown: {
          type: 'string',
          description: 'Inline Markdown source (either this or markdown_path).',
        },
        markdown_path: {
          type: 'string',
          description: 'Path to a Markdown file (either this or markdown).',
        },
        style: {
          type: 'string',
          enum: STYLE_ENUM,
          description: 'Card palette. Default xhs-soft.',
        },
        layout: {
          type: 'string',
          enum: ['classic', 'magazine', 'poster', 'notebook'],
          description: 'Layout/typography style: classic 经典 (left-bar headings), magazine 杂志 (serif, centered), poster 大字报 (oversized headings, color-block highlights), notebook 手账 (sticker pills, ruled background). Default classic.',
        },
        bg_image: {
          type: 'string',
          description: 'Optional background image: an http(s) URL, data URL, or a local image path (PNG/JPG/WebP — gets embedded as a data URL). A translucent overlay keeps text readable.',
        },
        size: {
          type: 'string',
          enum: SIZE_ENUM,
          description: 'Card dimensions. Default xhs (1242×1660, 3:4). square=1080×1080, story=1080×1920.',
        },
        split: {
          type: 'string',
          enum: ['heading', 'none'],
          description: 'heading: one card per H1/H2 section (default). none: a single full-length image.',
        },
        cover: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string', description: 'Cover headline.' },
            subtitle: { type: 'string', description: 'Cover subtitle line.' },
            emoji: { type: 'string', description: 'Large emoji on the cover, e.g. 🛠️.' },
          },
          description: 'Optional cover card generated before content cards.',
        },
        footer: {
          type: 'string',
          description: 'Optional footer tag, e.g. "OpenClaw · AI 工作流".',
        },
        output_dir: {
          type: 'string',
          description: 'Optional output directory. Default: ~/.dsh/content-studio-output/cards/<timestamp>/',
        },
      },
    },
    output: {
      schema: objectSchema(
        {
          output_dir: { type: 'string' },
          size: { type: 'string' },
          style: { type: 'string' },
          layout: { type: 'string' },
          bg_image: { oneOf: [{ type: 'string' }, { type: 'null' }] },
          chrome: { type: 'string' },
          cards: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                path: { type: 'string' },
                title: { type: 'string' },
                kind: { type: 'string' },
              },
            },
          },
          markdown_path: { type: 'string' },
          html_path: { type: 'string' },
          note: { type: 'string' },
        },
        ['output_dir', 'cards']
      ),
      render: (_args, value) =>
        textBlock(
          `Rendered ${value.cards.length} card(s) in ${value.output_dir} (${value.size}, ${value.style})\n` +
            value.cards.map((c, i) => `${i + 1}. [${c.kind}] ${c.title}\n   ${c.path}`).join('\n') +
            `\nPreview each with read_image; publish on XHS via mcp__xhs__xhs_publish_content (media_paths = card PNG paths, title ≤ 20 chars).`
        ),
    },
    execute: (args) => mdToCards(args),
    timeoutMs: 300000,
  })

  // ── markdown → styled HTML ────────────────────────────────────────────────
  registerTool(ctx, {
    name: 'content_md_to_html',
    description:
      'Render Markdown into a self-contained styled HTML file (inline CSS, XHS card theme) for browser preview, ' +
      'manual publishing (CSDN / WeChat editor paste), or further screenshotting via Playwright MCP.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        markdown: { type: 'string', description: 'Inline Markdown source (either this or markdown_path).' },
        markdown_path: { type: 'string', description: 'Path to a Markdown file (either this or markdown).' },
        style: { type: 'string', enum: STYLE_ENUM, description: 'Palette. Default xhs-soft.' },
        layout: { type: 'string', enum: LAYOUT_ENUM, description: 'Layout: classic/magazine/poster/notebook. Default classic.' },
        bg_image: { type: 'string', description: 'Optional background image URL or local path (embedded as data URL).' },
        size: { type: 'string', enum: SIZE_ENUM, description: 'Page width preset. Default xhs.' },
        footer: { type: 'string', description: 'Optional footer tag.' },
        output_path: {
          type: 'string',
          description: 'Optional absolute HTML path. Default: ~/.dsh/content-studio-output/html/article-<timestamp>.html',
        },
      },
    },
    output: {
      schema: objectSchema(
        {
          html_path: { type: 'string' },
          style: { type: 'string' },
          layout: { type: 'string' },
          size: { type: 'string' },
          note: { type: 'string' },
        },
        ['html_path']
      ),
      render: (_args, value) => textBlock(`Styled HTML written: ${value.html_path}\nOpen in a browser or pass to Playwright MCP.`),
    },
    execute: (args) => mdToHtml(args),
  })

  // ── AI text-to-image (Nano Banana) ─────────────────────────────────────────
  registerTool(ctx, {
    name: 'content_text_to_image',
    description:
      'Generate an image from a text prompt with Nano Banana (Google Gemini 2.5 Flash Image) via the Generative Language API. ' +
      'Requires a Gemini API key: pass api_key, or set GEMINI_API_KEY in the environment (create one at https://aistudio.google.com/apikey). ' +
      'Use the returned local path for XHS covers, as bg_image for content_md_to_cards, or as ![alt](path) inside card markdown — both embed it automatically. ' +
      'Aspect ratios: 1:1 square (default), 3:4 portrait (good for XHS covers), 4:3, 9:16, 16:9.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['prompt'],
      properties: {
        prompt: { type: 'string', description: 'Image prompt (Chinese or English). Describe subject, style, colors, composition.' },
        aspect_ratio: { type: 'string', enum: ['1:1', '3:4', '4:3', '9:16', '16:9'], description: 'Output aspect ratio. Default 1:1.' },
        api_key: { type: 'string', description: 'Optional Gemini API key; falls back to GEMINI_API_KEY / GOOGLE_API_KEY env.' },
        output_path: { type: 'string', description: 'Optional absolute output path. Default: ~/.dsh/content-studio-output/ai-images/img-<timestamp>.png' },
      },
    },
    output: {
      schema: objectSchema(
        {
          output_path: { type: 'string' },
          aspect_ratio: { type: 'string' },
          provider: { type: 'string' },
          note: { type: 'string' },
        },
        ['output_path']
      ),
      render: (_args, value) =>
        textBlock(
          `AI 图片已生成：${value.output_path}\n比例 ${value.aspect_ratio} · ${value.provider}\n${value.note}`
        ),
    },
    execute: (args) => textToImage(args),
    timeoutMs: 120000,
  })

  // ── dev.to publishing ─────────────────────────────────────────────────────
  registerTool(ctx, {
    name: 'content_publish_devto',
    description:
      'Create a dev.to (Forem) article via the official API: POST https://dev.to/api/articles. ' +
      'published=false saves a draft for review; published=true publishes immediately. Max 4 tags. ' +
      'API key: pass api_key or export DEVTO_API_KEY (create one at https://dev.to/settings/extensions).',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'body_markdown'],
      properties: {
        title: { type: 'string', description: 'Article title.' },
        body_markdown: { type: 'string', description: 'Full article body in Markdown.' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Up to 4 tags, e.g. ["ai", "automation", "productivity"].',
        },
        series: { type: 'string', description: 'Optional series name (must already exist).' },
        canonical_url: { type: 'string', description: 'Optional canonical URL for cross-posting.' },
        main_image: { type: 'string', description: 'Optional cover image URL.' },
        published: { type: 'boolean', description: 'true = publish now; false = save draft (default).' },
        api_key: { type: 'string', description: 'Optional dev.to API key; falls back to DEVTO_API_KEY env.' },
      },
    },
    output: {
      schema: objectSchema(
        {
          id: NULLABLE_INTEGER,
          url: NULLABLE_STRING,
          state: NULLABLE_STRING,
          published: { type: 'boolean' },
          tags: { type: 'array', items: { type: 'string' } },
          note: { type: 'string' },
        },
        ['published']
      ),
      render: (_args, value) =>
        textBlock(
          `dev.to ${value.published ? '已发布' : '草稿已保存'}: ${value.url ?? '(no url)'}\n` + `id=${value.id ?? '?'}, state=${value.state ?? '?'}, tags=${JSON.stringify(value.tags ?? [])}`
        ),
    },
    execute: (args) => publishDevto(args),
  })

  // ── capture device diagnostics ────────────────────────────────────────────
  registerTool(ctx, {
    name: 'content_capture_devices',
    description:
      'List the AVFoundation video/audio capture devices ffmpeg sees (screens, cameras, microphones). ' +
      'Useful before content_screen_record to check that a "Capture screen" device exists and to pick a mic.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {},
    },
    output: {
      schema: objectSchema(
        {
          platform: { type: 'string' },
          video: { type: 'array', items: {} },
          audio: { type: 'array', items: {} },
        },
        ['platform']
      ),
      render: (_args, value) =>
        textBlock(
          `platform: ${value.platform}\n` +
            `video: ${value.video.map((d) => `[${d.index}] ${d.name}`).join(' | ') || '(none)'}\n` +
            `audio: ${value.audio.map((d) => `[${d.index}] ${d.name}`).join(' | ') || '(none)'}\n` +
            'content_screen_record auto-selects the first "Capture screen" device (and the first mic when mic=true).'
        ),
    },
    execute: () => listDevices(),
  })

  // ── durable human review (shared with the dynamic review panel) ────────────
  // The draft state lives in ~/.dsh/content-studio-output/review/draft.json;
  // the dynamic review PANEL plugin reads/writes the same file, so tools here
  // survive process restarts and the panel stays a thin view layer.
  registerTool(ctx, {
    name: 'content_review_open',
    description:
      'Open the human review flow for generated XHS image cards before publishing. Pass the card PNG paths from content_md_to_cards (ordered, cover first) plus the markdown/style/layout/cover/footer that produced them, and optionally an initial publish title/body (the caption text that accompanies the post, independent of the text baked into the images). The draft is persisted to disk; if the review PANEL dynamic plugin is running, a floating panel appears in the browser with LIVE previews. End your turn after calling this; when the user says continue, check content_review_status.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['cards'],
      properties: {
        title: { type: 'string', description: 'Draft title.' },
        markdown: { type: 'string', description: 'The markdown source that produced the cards. Image syntax ![alt](path-or-url) embeds photos; local paths are converted to data URLs automatically.' },
        style: { type: 'string', enum: STYLE_ENUM, description: 'Card palette used.' },
        layout: { type: 'string', enum: LAYOUT_ENUM, description: 'Card layout: classic/magazine/poster/notebook.' },
        size: { type: 'string', enum: SIZE_ENUM, description: 'Card size used.' },
        cover: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string' },
            subtitle: { type: 'string' },
            emoji: { type: 'string' },
          },
          description: 'Cover fields used for the cover card.',
        },
        footer: { type: 'string', description: 'Footer tag used.' },
        bg_image: { type: 'string', description: 'Initial background image: http(s) URL, data URL, or local path (embedded as a data URL).' },
        publish_title: { type: 'string', description: 'Initial publish title (≤ 20 chars); independent of the card images. Defaults to the draft title.' },
        publish_body: { type: 'string', description: 'Initial publish caption (≤ 1000 chars, may include #话题#); independent of the text baked into the images.' },
        cards: {
          type: 'array',
          description: 'Card PNG paths from content_md_to_cards (ordered, cover first).',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              path: { type: 'string' },
              title: { type: 'string' },
              kind: { type: 'string' },
            },
          },
        },
      },
    },
    output: {
      schema: objectSchema(
        {
          ok: { type: 'boolean' },
          cards: { type: 'integer' },
          revision: { type: 'integer' },
          hint: { type: 'string' },
        },
        ['ok']
      ),
      render: (_args, value) =>
        textBlock(
          value.ok
            ? `审阅已开启（${value.cards} 张卡片，revision ${value.revision}，草稿已落盘）。请结束本轮，等待用户在审阅面板中查看、修改并批准或打回。用户操作后会说「继续」，届时用 content_review_status 读取结果。`
            : '审阅打开失败：' + value.hint
        ),
    },
    execute: (args) => reviewOpen(args),
  })

  registerTool(ctx, {
    name: 'content_review_status',
    description:
      'Check the human review state for the open XHS card draft. none = no review open. draft = waiting for the user. edited = the user modified the draft (use the returned markdown/style/layout/cover/footer/bgImage to re-render via content_md_to_cards, then content_review_refresh). approved = publish now using the returned publishTitle/publishBody as the post caption, then content_review_close. rejected = read humanNote and revise.',
    parameters: { type: 'object', additionalProperties: false, properties: {} },
    output: {
      schema: objectSchema(
        {
          status: { type: 'string', enum: ['none', 'draft', 'edited', 'approved', 'rejected'] },
          revision: { oneOf: [{ type: 'integer' }, { type: 'null' }] },
          humanNote: { type: 'string' },
          markdown: { type: 'string' },
          style: { type: 'string' },
          layout: { type: 'string' },
          cover: {
            oneOf: [
              {
                type: 'object',
                additionalProperties: false,
                properties: {
                  title: { type: 'string' },
                  subtitle: { type: 'string' },
                  emoji: { type: 'string' },
                },
              },
              { type: 'null' },
            ],
          },
          footer: { type: 'string' },
          bgImage: { type: 'string' },
          publishTitle: { type: 'string' },
          publishBody: { type: 'string' },
          cardCount: { type: 'integer' },
        },
        ['status']
      ),
      render: (_args, value) => {
        let text
        if (value.status === 'none') text = '当前没有进行中的图文审阅。'
        else if (value.status === 'draft') text = '审阅进行中，用户尚未操作。请结束本轮，等用户看完面板后说「继续」。'
        else if (value.status === 'edited') text = '用户修改了草稿。请用返回的 markdown/style/layout/cover/footer/bgImage 重新调用 content_md_to_cards 渲染，然后调用 content_review_refresh 更新。' + (value.humanNote ? '\n用户留言：' + value.humanNote : '')
        else if (value.status === 'approved') text = '✅ 用户已批准发布。用面板里的发布文案发布（标题与正文独立于图片内容）：\n发布标题：' + value.publishTitle + '\n发布正文：' + value.publishBody + '\nXHS 用 mcp__xhs__xhs_publish_content（title=发布标题，content=发布正文，media_paths 传卡片路径），dev.to 用 content_publish_devto。发布完成后调用 content_review_close。'
        else text = '❌ 用户打回。意见：' + (value.humanNote || '(无)') + '\n请按意见修改 markdown，重新渲染后调用 content_review_refresh，再次等待审阅。'
        return textBlock(text)
      },
    },
    execute: () => reviewStatus(),
  })

  registerTool(ctx, {
    name: 'content_review_refresh',
    description:
      'Update the open review draft with freshly rendered card PNG paths (after re-rendering with content_md_to_cards). Resets the review status to draft so the user confirms the new cards before publishing. Local image paths in markdown and bg_image are auto-embedded as data URLs. The publish title/body are NOT touched.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['cards'],
      properties: {
        cards: {
          type: 'array',
          description: 'New card PNG paths from content_md_to_cards (ordered, cover first).',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              path: { type: 'string' },
              title: { type: 'string' },
              kind: { type: 'string' },
            },
          },
        },
        markdown: { type: 'string', description: 'Markdown used for the new render.' },
        style: { type: 'string', enum: STYLE_ENUM },
        layout: { type: 'string', enum: LAYOUT_ENUM },
        cover: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string' },
            subtitle: { type: 'string' },
            emoji: { type: 'string' },
          },
          description: 'Cover used for the new render.',
        },
        footer: { type: 'string' },
        bg_image: { type: 'string', description: 'Background image used for the new render.' },
      },
    },
    output: {
      schema: objectSchema(
        {
          ok: { type: 'boolean' },
          cards: { type: 'integer' },
          revision: { type: 'integer' },
          hint: { type: 'string' },
        },
        ['ok']
      ),
      render: (_args, value) =>
        textBlock(
          value.ok
            ? `审阅草稿已更新（${value.cards} 张新卡片，revision ${value.revision}）。请结束本轮，等待用户再次确认。`
            : '更新失败：' + value.hint
        ),
    },
    execute: (args) => reviewRefresh(args),
  })

  registerTool(ctx, {
    name: 'content_review_close',
    description: 'Close the review (call after publishing or when the user aborts the review). Clears the persisted draft.',
    parameters: { type: 'object', additionalProperties: false, properties: {} },
    output: {
      schema: objectSchema({ ok: { type: 'boolean' } }, ['ok']),
      render: (_args, value) => textBlock(value.ok ? '审阅已关闭。' : '关闭失败。'),
    },
    execute: () => reviewClose(),
  })
}
