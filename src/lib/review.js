// Durable review draft entity for the static content-studio plugin.
// The draft lives at ~/.dsh/content-studio-output/review/draft.json and is
// shared between the static content_review_* tools (agent side) and the
// dynamic review PANEL plugin (browser side): both read/write the same file,
// so drafts survive plugin recreation and process restarts.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { ensureDir } from './util.js'

export const REVIEW_DIR = path.join(homedir(), '.dsh', 'content-studio-output', 'review')
export const DRAFT_PATH = path.join(REVIEW_DIR, 'draft.json')

const STYLE_ENUM = ['xhs-soft', 'xhs-dark', 'plain', 'forest', 'sunset']
const LAYOUT_ENUM = ['classic', 'magazine', 'poster', 'notebook']

function readDraft() {
  try {
    return JSON.parse(readFileSync(DRAFT_PATH, 'utf8'))
  } catch {
    return null
  }
}

function writeDraft(draft) {
  ensureDir(REVIEW_DIR)
  writeFileSync(DRAFT_PATH, JSON.stringify(draft, null, 2), 'utf8')
}

function mimeOf(p) {
  const l = String(p).toLowerCase()
  return l.endsWith('.jpg') || l.endsWith('.jpeg') ? 'image/jpeg' : l.endsWith('.webp') ? 'image/webp' : l.endsWith('.gif') ? 'image/gif' : 'image/png'
}

/** Local image path → data URL (Buffer base64); http(s)/data URLs pass through. */
function resolveImageRef(value) {
  const v = String(value ?? '').trim()
  if (v === '' || /^(https?:|data:)/i.test(v)) return v
  try {
    return 'data:' + mimeOf(v) + ';base64,' + readFileSync(v).toString('base64')
  } catch {
    return v
  }
}

/** Rewrite ![alt](local-path) references inside markdown to data URLs. */
function resolveMarkdownImages(md) {
  const text = String(md ?? '')
  return text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt, src) => `![${alt}](${resolveImageRef(src)})`)
}

function loadCards(cards) {
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

export async function reviewOpen(args) {
  const cards = loadCards(args.cards)
  const draft = {
    revision: 1,
    status: 'draft',
    title: typeof args.title === 'string' ? args.title : '',
    markdown: resolveMarkdownImages(args.markdown),
    style: STYLE_ENUM.includes(args.style) ? args.style : 'xhs-soft',
    layout: LAYOUT_ENUM.includes(args.layout) ? args.layout : 'classic',
    size: ['xhs', 'square', 'story'].includes(args.size) ? args.size : 'xhs',
    cover: args.cover && typeof args.cover === 'object' ? args.cover : null,
    footer: typeof args.footer === 'string' ? args.footer : '',
    bgImage: resolveImageRef(args.bg_image),
    publishTitle: typeof args.publish_title === 'string' ? args.publish_title : (typeof args.title === 'string' ? args.title : ''),
    publishBody: typeof args.publish_body === 'string' ? args.publish_body : '',
    cards,
    humanNote: '',
    openedAt: Date.now(),
    decidedAt: null,
  }
  writeDraft(draft)
  return { ok: true, cards: cards.length, revision: 1, hint: '' }
}

export function reviewStatus() {
  const d = readDraft()
  if (d === null) {
    return { status: 'none', revision: null, humanNote: '', markdown: '', style: '', layout: '', cover: null, footer: '', bgImage: '', publishTitle: '', publishBody: '', cardCount: 0 }
  }
  return {
    status: d.status,
    revision: d.revision,
    humanNote: d.humanNote,
    markdown: d.markdown,
    style: d.style,
    layout: d.layout,
    cover: d.cover,
    footer: d.footer,
    bgImage: d.bgImage,
    publishTitle: d.publishTitle,
    publishBody: d.publishBody,
    cardCount: d.cards.length,
  }
}

export async function reviewRefresh(args) {
  const d = readDraft()
  if (d === null) return { ok: false, cards: 0, revision: 0, hint: 'no draft — call content_review_open first' }
  d.cards = loadCards(args.cards)
  if (typeof args.markdown === 'string') d.markdown = resolveMarkdownImages(args.markdown)
  if (args.cover && typeof args.cover === 'object') d.cover = args.cover
  if (typeof args.footer === 'string') d.footer = args.footer
  if (STYLE_ENUM.includes(args.style)) d.style = args.style
  if (LAYOUT_ENUM.includes(args.layout)) d.layout = args.layout
  if (typeof args.bg_image === 'string') d.bgImage = resolveImageRef(args.bg_image)
  d.status = 'draft'
  d.humanNote = ''
  d.decidedAt = null
  d.revision += 1
  writeDraft(d)
  return { ok: true, cards: d.cards.length, revision: d.revision, hint: '' }
}

export function reviewClose() {
  try {
    if (existsSync(DRAFT_PATH)) writeDraft(null)
  } catch {
    // ignore close failures
  }
  return { ok: true }
}
