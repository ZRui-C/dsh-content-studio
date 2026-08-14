const PNG_CAP = 12 * 1024 * 1024

// Pure-JS binary-safe base64: the sandbox btoa encodes UTF-8 text, which would
// corrupt PNG bytes >= 0x80. This table-based encoder is byte-exact.
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
function bytesToBase64(bytes) {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined
    out += B64[b0 >> 2]
    out += B64[((b0 & 3) << 4) | (b1 === undefined ? 0 : b1 >> 4)]
    out += b1 === undefined ? '=' : B64[((b1 & 15) << 2) | (b2 === undefined ? 0 : b2 >> 6)]
    out += b2 === undefined ? '=' : B64[b2 & 63]
  }
  return out
}

// output.schema uses the value-schema DSL: NO root `required` array —
// requiredness is declared per property as `required: true`.
function outSchema(properties) {
  const spec = { type: 'object', additionalProperties: false, properties: {} }
  for (const key of Object.keys(properties)) {
    spec.properties[key] = { required: true, ...properties[key] }
  }
  return spec
}

const COVER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    subtitle: { type: 'string' },
    emoji: { type: 'string' },
  },
}

const CARD_ITEM = {
  type: 'object',
  additionalProperties: false,
  properties: {
    path: { type: 'string' },
    title: { type: 'string' },
    kind: { type: 'string' },
  },
}

function mimeOf(path) {
  const l = String(path).toLowerCase()
  return l.endsWith('.jpg') || l.endsWith('.jpeg') ? 'image/jpeg' : l.endsWith('.webp') ? 'image/webp' : l.endsWith('.gif') ? 'image/gif' : 'image/png'
}

return {
  name: 'content-review',
  apply(ctx) {
    const fs = ctx.get('fs')
    let draft = null

    // http(s)/data URLs pass through; local paths are read via fs and embedded
    // as data URLs so the browser panel can display them.
    async function resolveImageRef(value) {
      const v = String(value ?? '').trim()
      if (v === '' || /^(https?:|data:)/i.test(v)) return v
      if (fs === undefined) return v
      try {
        const target = await fs.resolve(v)
        const bytes = await fs.readBytes(target, undefined, PNG_CAP)
        return 'data:' + mimeOf(v) + ';base64,' + bytesToBase64(bytes)
      } catch (error) {
        return v
      }
    }

    // Rewrite ![alt](local-path) references inside the markdown to data URLs.
    async function resolveMarkdownImages(md) {
      const text = String(md ?? '')
      const matches = []
      text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (m, alt, src, off) {
        matches.push({ m: m, alt: alt, src: src, off: off })
        return m
      })
      if (matches.length === 0) return text
      let out = ''
      let last = 0
      for (const it of matches) {
        const resolved = await resolveImageRef(it.src)
        out += text.slice(last, it.off) + '![' + it.alt + '](' + resolved + ')'
        last = it.off + it.m.length
      }
      return out + text.slice(last)
    }


    async function loadCards(cards) {
      const out = []
      for (const c of (Array.isArray(cards) ? cards : [])) {
        out.push({
          id: typeof c.id === 'string' ? c.id : 'card-' + out.length,
          path: typeof c.path === 'string' ? c.path : '',
          title: typeof c.title === 'string' ? c.title : '',
          kind: typeof c.kind === 'string' ? c.kind : 'content',
        })
      }
      return out
    }

    function view() {
      if (draft === null) return null
      return {
        revision: draft.revision,
        status: draft.status,
        title: draft.title,
        markdown: draft.markdown,
        style: draft.style,
        size: draft.size,
        cover: draft.cover,
        footer: draft.footer,
        bgImage: draft.bgImage,
        publishTitle: draft.publishTitle,
        publishBody: draft.publishBody,
        cards: draft.cards,
        humanNote: draft.humanNote,
        openedAt: draft.openedAt,
        decidedAt: draft.decidedAt,
      }
    }

    harness.handle('get-draft', (args) => {
      if (draft === null) return null
      if (args && args.revision === draft.revision) {
        return { unchanged: true, revision: draft.revision, status: draft.status }
      }
      return view()
    })

    harness.handle('save-draft', (args) => {
      if (draft === null) return { ok: false, error: 'no draft' }
      if (typeof args.markdown === 'string') draft.markdown = args.markdown
      if (args.cover && typeof args.cover === 'object') {
        draft.cover = {
          title: typeof args.cover.title === 'string' ? args.cover.title : '',
          subtitle: typeof args.cover.subtitle === 'string' ? args.cover.subtitle : '',
          emoji: typeof args.cover.emoji === 'string' ? args.cover.emoji : '',
        }
      }
      if (typeof args.footer === 'string') draft.footer = args.footer
      if (typeof args.style === 'string') draft.style = args.style
      if (typeof args.publishTitle === 'string') draft.publishTitle = args.publishTitle
      if (typeof args.publishBody === 'string') draft.publishBody = args.publishBody
      if (typeof args.note === 'string') draft.humanNote = args.note
      draft.status = 'edited'
      draft.revision += 1
      return { ok: true, revision: draft.revision, status: draft.status }
    })

    harness.handle('decide', (args) => {
      if (draft === null) return { ok: false, error: 'no draft' }
      const decision = args && args.decision
      if (decision !== 'approve' && decision !== 'reject') {
        return { ok: false, error: 'decision must be approve or reject' }
      }
      draft.status = decision === 'approve' ? 'approved' : 'rejected'
      draft.decidedAt = Date.now()
      if (decision === 'reject' && typeof args.note === 'string' && args.note.trim() !== '') {
        draft.humanNote = args.note
      }
      draft.revision += 1
      return { ok: true, revision: draft.revision, status: draft.status }
    })

    async function openReview(args) {
      const cards = await loadCards(args.cards)
      draft = {
        revision: 1,
        status: 'draft',
        title: typeof args.title === 'string' ? args.title : '',
        markdown: await resolveMarkdownImages(args.markdown),
        style: typeof args.style === 'string' ? args.style : 'xhs-soft',
        size: typeof args.size === 'string' ? args.size : 'xhs',
        cover: args.cover && typeof args.cover === 'object' ? args.cover : null,
        footer: typeof args.footer === 'string' ? args.footer : '',
        bgImage: await resolveImageRef(args.bg_image),
        publishTitle: typeof args.publish_title === 'string' ? args.publish_title : (typeof args.title === 'string' ? args.title : ''),
        publishBody: typeof args.publish_body === 'string' ? args.publish_body : '',
        cards: cards,
        humanNote: '',
        openedAt: Date.now(),
        decidedAt: null,
      }
      return { ok: true, cards: cards.length, revision: 1, hint: '' }
    }

    async function refreshReview(args) {
      if (draft === null) {
        return { ok: false, cards: 0, revision: 0, hint: 'no draft — call content_review_open first' }
      }
      const cards = await loadCards(args.cards)
      draft.cards = cards
      if (typeof args.markdown === 'string') draft.markdown = await resolveMarkdownImages(args.markdown)
      if (args.cover && typeof args.cover === 'object') draft.cover = args.cover
      if (typeof args.footer === 'string') draft.footer = args.footer
      if (typeof args.style === 'string') draft.style = args.style
      draft.status = 'draft'
      draft.humanNote = ''
      draft.decidedAt = null
      draft.revision += 1
      return { ok: true, cards: cards.length, revision: draft.revision, hint: '' }
    }

    async function diagReview(args) {
      const paths = Array.isArray(args.paths) ? args.paths.map(String) : []
      const results = []
      for (const path of paths) {
        if (fs === undefined) {
          results.push({ path: path, ok: false, size: 0, head: '', error: 'fs service unavailable' })
          continue
        }
        try {
          const target = await fs.resolve(path)
          const bytes = await fs.readBytes(target, undefined, PNG_CAP)
          results.push({ path: path, ok: true, size: bytes.length, head: bytesToBase64(bytes.subarray(0, Math.min(bytes.length, 32))).slice(0, 12) + '…', error: '' })
        } catch (error) {
          results.push({ path: path, ok: false, size: 0, head: '', error: String(error && error.message ? error.message : error) })
        }
      }
      return { fsAvailable: fs !== undefined, results: results }
    }

    ctx.tools.register(harness.defineTool({
      name: 'content_review_open',
      description: 'Open the human review panel for generated XHS image cards before publishing. Pass the card PNG paths from content_md_to_cards (ordered, cover first) plus the markdown/style/cover/footer that produced them, and optionally an initial publish title/body (the caption text that accompanies the post, independent of the text baked into the images). A floating panel appears in the browser with LIVE card previews (edits to markdown/theme re-render instantly); the user edits both the card markdown and the publish caption, then approves or rejects. End your turn after calling this; when the user says continue, check content_review_status.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Draft title.' },
          markdown: { type: 'string', description: 'The markdown source that produced the cards.' },
          style: { type: 'string', enum: ['xhs-soft', 'xhs-dark', 'plain'], description: 'Card theme used.' },
          size: { type: 'string', enum: ['xhs', 'square', 'story'], description: 'Card size used.' },
          cover: { description: 'Cover fields used for the cover card.', ...COVER_SCHEMA },
          footer: { type: 'string', description: 'Footer tag used.' },
          publish_title: { type: 'string', description: 'Initial publish title (≤ 20 chars); independent of the card images. Defaults to the draft title.' },
          publish_body: { type: 'string', description: 'Initial publish caption (≤ 1000 chars, may include #话题#); independent of the text baked into the images.' },
          cards: {
            type: 'array',
            description: 'Card PNG paths from content_md_to_cards (ordered, cover first).',
            items: CARD_ITEM,
          },
        },
        required: ['cards'],
      },
      output: {
        schema: outSchema({
          ok: { type: 'boolean' },
          cards: { type: 'integer' },
          revision: { type: 'integer' },
          hint: { type: 'string' },
        }),
        render: (_args, value) => [{
          type: 'text',
          text: value.ok
            ? '审阅面板已打开（' + value.cards + ' 张卡片，revision ' + value.revision + '）。请结束本轮，等待用户在浏览器面板中查看、修改并批准或打回。用户操作后会说「继续」，届时用 content_review_status 读取结果。'
            : '审阅打开失败：' + value.hint,
        }],
      },
      execute: (args) => openReview(args),
    }))

    ctx.tools.register(harness.defineTool({
      name: 'content_review_status',
      description: 'Check the human review state for the open XHS card draft. none = no review open. draft = waiting for the user. edited = the user modified the draft (use the returned markdown/cover/footer to re-render via content_md_to_cards, then content_review_refresh). approved = publish now using the returned publishTitle/publishBody as the post caption, then content_review_close. rejected = read humanNote and revise.',
      parameters: { type: 'object', properties: {} },
      output: {
        schema: outSchema({
          status: { type: 'string', enum: ['none', 'draft', 'edited', 'approved', 'rejected'] },
          revision: { oneOf: [{ type: 'integer' }, { type: 'null' }] },
          humanNote: { type: 'string' },
          markdown: { type: 'string' },
          style: { type: 'string' },
          cover: { oneOf: [COVER_SCHEMA, { type: 'null' }] },
          footer: { type: 'string' },
          publishTitle: { type: 'string' },
          publishBody: { type: 'string' },
          cardCount: { type: 'integer' },
        }),
        render: (_args, value) => {
          let text
          if (value.status === 'none') text = '当前没有进行中的图文审阅。'
          else if (value.status === 'draft') text = '审阅进行中，用户尚未操作。请结束本轮，等用户看完面板后说「继续」。'
          else if (value.status === 'edited') text = '用户修改了草稿。请用返回的 markdown/cover/footer 重新调用 content_md_to_cards 渲染，然后调用 content_review_refresh 更新面板。' + (value.humanNote ? '\n用户留言：' + value.humanNote : '')
          else if (value.status === 'approved') text = '✅ 用户已批准发布。用面板里的发布文案发布（标题与正文独立于图片内容）：\n发布标题：' + value.publishTitle + '\n发布正文：' + value.publishBody + '\nXHS 用 mcp__xhs__xhs_publish_content（title=发布标题，content=发布正文，media_paths 传卡片路径），dev.to 用 content_publish_devto。发布完成后调用 content_review_close。'
          else text = '❌ 用户打回。意见：' + (value.humanNote || '(无)') + '\n请按意见修改 markdown，重新渲染后调用 content_review_refresh，再次等待审阅。'
          return [{ type: 'text', text: text }]
        },
      },
      execute: () => {
        if (draft === null) {
          return { status: 'none', revision: null, humanNote: '', markdown: '', style: '', cover: null, footer: '', publishTitle: '', publishBody: '', cardCount: 0 }
        }
        return {
          status: draft.status,
          revision: draft.revision,
          humanNote: draft.humanNote,
          markdown: draft.markdown,
          style: draft.style,
          cover: draft.cover,
          footer: draft.footer,
          publishTitle: draft.publishTitle,
          publishBody: draft.publishBody,
          cardCount: draft.cards.length,
        }
      },
    }))

    ctx.tools.register(harness.defineTool({
      name: 'content_review_refresh',
      description: 'Update the open review panel with freshly rendered card PNGs (after re-rendering with content_md_to_cards). Resets the review status to draft so the user confirms the new cards before publishing. The publish title/body are NOT touched.',
      parameters: {
        type: 'object',
        properties: {
          cards: {
            type: 'array',
            description: 'New card PNG paths from content_md_to_cards (ordered, cover first).',
            items: CARD_ITEM,
          },
          markdown: { type: 'string', description: 'Markdown used for the new render.' },
          style: { type: 'string', enum: ['xhs-soft', 'xhs-dark', 'plain'] },
          cover: { description: 'Cover used for the new render.', ...COVER_SCHEMA },
          footer: { type: 'string' },
        },
        required: ['cards'],
      },
      output: {
        schema: outSchema({
          ok: { type: 'boolean' },
          cards: { type: 'integer' },
          revision: { type: 'integer' },
          hint: { type: 'string' },
        }),
        render: (_args, value) => [{
          type: 'text',
          text: value.ok
            ? '审阅面板已更新（' + value.cards + ' 张新卡片，revision ' + value.revision + '）。请结束本轮，等待用户再次确认。'
            : '更新失败：' + value.hint,
        }],
      },
      execute: (args) => refreshReview(args),
    }))

    ctx.tools.register(harness.defineTool({
      name: 'content_review_close',
      description: 'Close the review panel (call after publishing or when the user aborts the review).',
      parameters: { type: 'object', properties: {} },
      output: {
        schema: outSchema({ ok: { type: 'boolean' } }),
        render: (_args, value) => [{ type: 'text', text: value.ok ? '审阅面板已关闭。' : '关闭失败。' }],
      },
      execute: () => {
        draft = null
        return { ok: true }
      },
    }))

    ctx.tools.register(harness.defineTool({
      name: 'content_review_diag',
      description: 'Diagnose card image reading for the review panel: reports whether the fs service is available and tries to read each given PNG path, returning size and the base64 head or the exact error.',
      parameters: {
        type: 'object',
        properties: {
          paths: { type: 'array', items: { type: 'string' }, description: 'PNG paths to probe.' },
        },
        required: ['paths'],
      },
      output: {
        schema: outSchema({
          fsAvailable: { type: 'boolean' },
          results: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                path: { type: 'string' },
                ok: { type: 'boolean' },
                size: { type: 'integer' },
                head: { type: 'string' },
                error: { type: 'string' },
              },
            },
          },
        }),
        render: (_args, value) => [{
          type: 'text',
          text: 'fsAvailable=' + value.fsAvailable + '\n' + value.results.map((r) => (r.ok ? 'OK  ' + r.path + ' (' + r.size + ' bytes)' : 'FAIL ' + r.path + ': ' + r.error)).join('\n'),
        }],
      },
      execute: (args) => diagReview(args),
    }))
  },
}
