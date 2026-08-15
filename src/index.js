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
import { publishMedium } from './lib/medium.js'
import { reviewOpen, reviewStatus, reviewRefresh, reviewClose, reviewGetRaw, reviewSavePanel, reviewDecidePanel, reviewCardImage } from './lib/review.js'
import { keysStatus, saveKeys } from './lib/keys.js'
import { textToImage } from './lib/text2img.js'
import { objectSchema, textBlock, REGION_SCHEMA } from './lib/util.js'

export const name = 'content-studio'
export const inject = ['tools', 'timer']

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
  // ── static review-panel HTTP API ──────────────────────────────────────────
  // The review panel ships as a static browser client (dsh.client bundle) and
  // talks to the host through these exact routes (the dsh-ppt pattern).
  ctx.effect(() => {
    // webServer 与其它条目并发挂载，apply 时刻可能还没 provide（dsh-ppt 实测如此），
    // 且 ctx.effect 不会因 ctx.get 的依赖出现而重跑 —— 用 interval 轮询兜底：
    // 服务就位后注册一次并停止轮询；返回的 cleanup 在卸载时注销路由与定时器。
    const disposers = []
    const json = (handler) => async (req, res) => {
      try {
        let raw = ''
        req.on('data', (chunk) => { raw += chunk })
        await new Promise((resolve) => req.on('end', resolve))
        let body = {}
        if (raw) {
          try { body = JSON.parse(raw) } catch { body = {} }
        }
        const value = await handler(body)
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify(value))
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ ok: false, error: String((error && error.message) || error) }))
      }
    }
    function tryRegister() {
      const webServer = ctx.get('webServer')
      if (!webServer || typeof webServer.register !== 'function') return false
      try {
        disposers.push(webServer.register({ kind: 'exact', path: '/content-studio-api/get-draft', handler: json(async () => reviewGetRaw()) }))
        disposers.push(webServer.register({ kind: 'exact', path: '/content-studio-api/save-draft', handler: json(async (body) => reviewSavePanel(body || {})) }))
        disposers.push(webServer.register({ kind: 'exact', path: '/content-studio-api/decide', handler: json(async (body) => reviewDecidePanel(body && body.decision, body && body.note)) }))
        disposers.push(webServer.register({ kind: 'exact', path: '/content-studio-api/get-keys', handler: json(async () => keysStatus()) }))
        disposers.push(webServer.register({ kind: 'exact', path: '/content-studio-api/save-keys', handler: json(async (body) => {
          saveKeys(body || {})
          return keysStatus()
        }) }))
        // Card PNG stream: /content-studio-api/card-image/<cardId> (binary, not JSON).
        // The panel renders the real rendered images; the ?rev= query is ignored
        // by the matcher and only busts the browser cache on re-renders.
        disposers.push(webServer.register({
          kind: 'prefix',
          path: '/content-studio-api/card-image/',
          handler: (req, res) => {
            try {
              const pathname = new URL(req.url ?? '/', 'http://x').pathname
              const id = decodeURIComponent(pathname.slice('/content-studio-api/card-image/'.length))
              const found = reviewCardImage(id)
              if (!found.ok) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
                res.end('card not found')
                return
              }
              res.writeHead(200, {
                'Content-Type': found.mime,
                'Cache-Control': 'no-cache',
              })
              res.end(found.buffer)
            } catch (error) {
              res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
              res.end(String((error && error.message) || error))
            }
          },
        }))
      } catch (error) {
        // 路由已注册（同进程重复挂载）时忽略，留日志可查
        for (const dispose of disposers) { try { dispose() } catch (e2) { /* ignore */ } }
        disposers.length = 0
        try { ctx.logger.warn('[dsh-content-studio] 面板路由注册跳过: ' + String((error && error.message) || error)) } catch (e2) { /* ignore */ }
      }
      return true
    }
    if (!tryRegister()) {
      const timer = ctx.interval(() => { if (tryRegister()) timer() }, 500)
      disposers.push(timer)
    }
    return () => {
      for (const dispose of disposers) { try { dispose() } catch (e2) { /* ignore */ } }
      disposers.length = 0
    }
  })

  // ── dynamic Cordis plugin tools (define/run/stop/undefine) ─────────────────
  // Registered WITHOUT the Inspect Providers (those are process-level
  // singletons and conflict with the cordis preset), so content-studio
  // sessions can define/run dynamic plugins even alongside cordis sessions.
  ctx.effect(() => {
    const disposers = []
    function tryRegisterCordis() {
      const runner = ctx.get('dynamicCordisRunner')
      if (!runner || typeof runner.define !== 'function') return false
    const requireAgent = (exec) => {
      if (exec && exec.agent) return exec.agent
      throw new Error('Cordis dynamic tools require an Agent-backed session')
    }
    const sp = ctx.get('systemPrompt')
    if (sp && typeof sp.section === 'function') {
      sp.section({
        name: 'tool:cordis-mini',
        order: 115,
        text: 'You have the dynamic Cordis plugin tools (cordis_define / cordis_run / cordis_stop / cordis_undefine) without the inspect tools. Dynamic plugins are session-owned and process-local: they are lost on DSH restart. cordis_define only defines code; cordis_run activates it and may require the user to approve in the UI.',
      })
    }

    registerTool(ctx, {
      name: 'cordis_define',
      description: 'Define an immutable Cordis Package. For a new Plugin, use kind:"new" and provide only a semantic prefix of 3–6 lowercase English letters; the Host returns the final pluginId and packageId. To modify an existing Plugin, use kind:"existing" with its exact pluginId to append a Package without overwriting older versions. Provide at least one of code.host and code.client. Each value is a plain JavaScript function body that returns a Cordis Plugin; no TypeScript, JSX, or import transformation occurs. Define only validates parameters and syntax and records source: it does not request approval, execute apply, or change currentPackageId. On success, call cordis_run with the returned IDs.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['plugin', 'name', 'purpose', 'code'],
        properties: {
          plugin: {
            oneOf: [
              {
                type: 'object',
                additionalProperties: false,
                required: ['kind', 'idPrefix'],
                properties: {
                  kind: { type: 'string', const: 'new' },
                  idPrefix: { type: 'string', description: 'Suggested semantic prefix of 3–6 lowercase English letters; the Host adds a unique numeric suffix.' },
                },
              },
              {
                type: 'object',
                additionalProperties: false,
                required: ['kind', 'pluginId'],
                properties: {
                  kind: { type: 'string', const: 'existing' },
                  pluginId: { type: 'string', description: 'Exact ID of an existing Plugin; the new Package is appended to that instance.' },
                },
              },
            ],
          },
          name: { type: 'string', description: 'Short, readable Package name.' },
          purpose: { type: 'string', description: 'One-sentence, user-facing description of the Package purpose.' },
          code: {
            type: 'object',
            additionalProperties: false,
            properties: {
              host: { type: 'string', description: 'Plain JavaScript function body that returns the Host-half Cordis Plugin.' },
              client: { type: 'string', description: 'Plain JavaScript function body that returns the browser Client-half Cordis Plugin.' },
            },
          },
        },
      },
      output: {
        schema: objectSchema(
          {
            pluginId: { type: 'string' },
            packageId: { type: 'string' },
          },
          ['pluginId', 'packageId']
        ),
        render: (_args, value) => textBlock(`Defined ${value.pluginId}/${value.packageId}; it is not running yet. Use cordis_run to activate this Package.`),
      },
      execute: (args, exec) => {
        const agent = requireAgent(exec)
        const plugin = args.plugin.kind === 'new'
          ? { kind: 'new', idPrefix: args.plugin.idPrefix }
          : { kind: 'existing', pluginId: args.plugin.pluginId }
        const receipt = runner.define({
          sessionId: agent.id,
          plugin,
          name: args.name,
          purpose: args.purpose,
          code: {
            ...(args.code.host === undefined ? {} : { host: args.code.host }),
            ...(args.code.client === undefined ? {} : { client: args.code.client }),
          },
        })
        return { pluginId: String(receipt.pluginId), packageId: String(receipt.packageId) }
      },
    })

    registerTool(ctx, {
      name: 'cordis_run',
      description: 'Activate one exact Package of a dynamic Plugin. Use mode:"run" for the first activation, restarting currentPackageId, or rollback. When current exists, use mode:"update" to switch to a different Package, even if the Plugin is currently stopped. An unauthorized Client Package creates an approval request and returns awaiting-approval; an authorized Package returns starting and continues asynchronously in the browser. Neither result waits for the final outcome inside the Tool. currentPackageId changes only after complete success; on failure, the old current and target next remain. Asynchronous success, rejection, or technical failure is reported through state and steering. After a technical failure, read diagnostics, correct the same Plugin, and retry autonomously. Do not request approval again after the user rejects it.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['pluginId', 'packageId', 'mode'],
        properties: {
          pluginId: { type: 'string', description: 'Stable Plugin ID returned by cordis_define.' },
          packageId: { type: 'string', description: 'Exact immutable Package ID to activate under that Plugin.' },
          mode: { type: 'string', enum: ['run', 'update'], description: 'Use run for the first activation, restarting current, or rollback; use update to switch from current to a different Package.' },
        },
      },
      output: {
        schema: objectSchema(
          {
            status: { type: 'string' },
            pluginId: { type: 'string' },
            packageId: { type: 'string' },
            pluginRunId: { type: 'string' },
          },
          ['status']
        ),
        render: (_args, value) => {
          const line = value.status === 'awaiting-approval'
            ? `${value.pluginId}/${value.packageId} is awaiting user approval (${value.pluginRunId}).`
            : value.status === 'starting'
              ? `${value.pluginId}/${value.packageId} is starting asynchronously (${value.pluginRunId}).`
              : `${value.pluginId}/${value.packageId} is running (${value.pluginRunId}).`
          return textBlock(line)
        },
      },
      execute: async (args, exec) => {
        const agent = requireAgent(exec)
        const receipt = await runner.run(agent, args.pluginId, args.packageId, args.mode, exec && exec.signal)
        if (!receipt.ok) throw new Error(receipt.message)
        return {
          status: receipt.status === 'running' ? 'running' : receipt.status,
          pluginId: args.pluginId,
          packageId: args.packageId,
          pluginRunId: String(receipt.pluginRunId ?? ''),
        }
      },
    })

    registerTool(ctx, {
      name: 'cordis_stop',
      description: 'Stop the current Run of a dynamic Plugin and cancel unfinished approval or activation requests. Retain the Plugin, every immutable Package, grants, currentPackageId, and nextPackageId so it can later run or update directly. Stopping an already stopped Plugin succeeds idempotently. Use this Tool to disable effects temporarily; use cordis_undefine for permanent removal.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['pluginId'],
        properties: {
          pluginId: { type: 'string', description: 'Stable dynamic Plugin ID to stop.' },
        },
      },
      output: {
        schema: objectSchema({ pluginId: { type: 'string' } }, ['pluginId']),
        render: (_args, value) => textBlock(`Stopped dynamic Plugin ${value.pluginId} (if it was running).`),
      },
      execute: async (args, exec) => {
        const receipt = await runner.stop(requireAgent(exec), args.pluginId)
        if (!receipt.ok && receipt.reason !== 'not-running') throw new Error(receipt.message)
        return { pluginId: args.pluginId }
      },
    })

    registerTool(ctx, {
      name: 'cordis_undefine',
      description: 'Permanently remove a dynamic Plugin owned by the current Session. If it is running or awaiting approval, first stop it and cancel the request, then delete every Package, grant, and version pointer. After this returns, its pluginId, packageIds, @ reference, and Package business views are invalid; historical cards retain only a "Plugin removed" record. Do not call this Tool when versions must remain available for restart or rollback; use cordis_stop instead.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['pluginId'],
        properties: {
          pluginId: { type: 'string', description: 'Stable dynamic Plugin ID to remove permanently.' },
        },
      },
      output: {
        schema: objectSchema(
          {
            pluginId: { type: 'string' },
            wasRunning: { type: 'boolean' },
          },
          ['pluginId']
        ),
        render: (_args, value) => textBlock(`Removed dynamic Plugin ${value.pluginId}${value.wasRunning ? ' (was running)' : ''} and all of its Packages.`),
      },
      execute: async (args, exec) => {
        const receipt = await runner.undefine(requireAgent(exec), args.pluginId)
        if (!receipt.ok) throw new Error(receipt.message)
        return { pluginId: args.pluginId, wasRunning: Boolean(receipt.wasRunning) }
      },
    })
      return true
    }
    if (!tryRegisterCordis()) {
      const timer = ctx.interval(() => { if (tryRegisterCordis()) timer() }, 500)
      disposers.push(timer)
    }
    return () => {
      for (const dispose of disposers) { try { dispose() } catch (e2) { /* ignore */ } }
      disposers.length = 0
    }
  })

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

  // ── Medium publishing ──────────────────────────────────────────────────────
  registerTool(ctx, {
    name: 'content_publish_medium',
    description:
      'Create a Medium post via the official API: POST https://api.medium.com/v1/users/{userId}/posts. ' +
      'published=false saves a draft for review; published=true publishes immediately. Max 5 tags. ' +
      'API key: pass api_key or save a Medium integration token from the panel 设置 page (create one at https://medium.com/me/settings -> Integration tokens).',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'body_markdown'],
      properties: {
        title: { type: 'string', description: 'Post title.' },
        body_markdown: { type: 'string', description: 'Full post body in Markdown.' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Up to 5 tags, e.g. ["ai", "automation", "productivity"].',
        },
        canonical_url: { type: 'string', description: 'Optional canonical URL for cross-posting.' },
        published: { type: 'boolean', description: 'true = publish now; false = save draft (default).' },
        api_key: { type: 'string', description: 'Optional Medium integration token; falls back to the saved panel key or MEDIUM_TOKEN env.' },
      },
    },
    output: {
      schema: objectSchema(
        {
          ok: { type: 'boolean' },
          published: { type: 'boolean' },
          mediumUrl: NULLABLE_STRING,
          note: { type: 'string' },
        },
        ['ok']
      ),
      render: (_args, value) =>
        textBlock(
          `Medium ${value.ok ? (value.published ? '已发布' : '草稿已保存') : '失败'}${value.mediumUrl ? ': ' + value.mediumUrl : ''}\n` + (value.note ?? '')
        ),
    },
    execute: (args) => publishMedium(args),
    timeoutMs: 90000,
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
        else if (value.status === 'approved') text = '✅ 用户已批准发布。用面板里的发布文案发布（标题与正文独立于图片内容）：\n发布标题：' + value.publishTitle + '\n发布正文：' + value.publishBody + '\nXHS 用 mcp__xhs__xhs_publish_content（title=发布标题，content=发布正文，media_paths 传卡片路径），dev.to 用 content_publish_devto，Medium 用 content_publish_medium。发布完成后调用 content_review_close。'
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
