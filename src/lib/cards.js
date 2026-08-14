// Markdown → styled HTML → PNG cards (Chrome headless), for XHS image-text posts.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import markedPkg from '../../vendor/marked.umd.cjs'
import { execFileP, exists, resolveDir, resolveFile } from './util.js'
import { escapeHtml, renderCardHtml, renderCoverHtml, sizeOf } from './template.js'

const { marked } = markedPkg

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/microsoft-edge',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
]

export function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    if (candidate && exists(candidate)) return candidate
  }
  return null
}

export function parseMarkdown(md) {
  return marked.parse(String(md), { gfm: true, breaks: false })
}

/** Split top-level H1/H2 headings into sections; leading content forms an untitled section. */
function splitSections(md) {
  const tokens = marked.lexer(String(md))
  const sections = []
  let current = null
  for (const token of tokens) {
    if (token.type === 'heading' && token.depth <= 2) {
      current = { title: token.text, tokens: [] }
      sections.push(current)
      continue
    }
    if (!current) {
      current = { title: '', tokens: [] }
      sections.push(current)
    }
    current.tokens.push(token)
  }
  return sections
}

/** Rough per-token line estimate for card-fitting math. */
function tokenLines(token, charsPerLine) {
  switch (token.type) {
    case 'space':
      return 1
    case 'heading':
      return Math.max(1, Math.ceil(String(token.text ?? '').length / (charsPerLine * 0.8))) + 2
    case 'paragraph':
    case 'text': {
      const raw = String(token.raw ?? token.text ?? '').replaceAll('\n', ' ')
      return Math.max(1, Math.ceil(raw.length / charsPerLine))
    }
    case 'code':
      return String(token.text ?? '').split('\n').length + 3
    case 'list':
      return (token.items?.length ?? 0) + Math.ceil(String(token.raw ?? '').length / charsPerLine)
    case 'table':
      return 2 + (token.rows?.length ?? 0)
    case 'image':
      return 12
    case 'blockquote':
      return Math.ceil(String(token.raw ?? '').length / charsPerLine) + 2
    case 'hr':
      return 2
    default:
      return Math.max(1, Math.ceil(String(token.raw ?? '').length / charsPerLine))
  }
}

function sectionLines(section, charsPerLine) {
  let lines = section.title ? 4 : 0
  for (const token of section.tokens) lines += tokenLines(token, charsPerLine)
  return lines
}

/** Greedily group tokens into chunks that fit one card height. */
function chunkSection(section, maxLines, charsPerLine) {
  const chunks = []
  let current = []
  let used = 0
  for (const token of section.tokens) {
    const lines = tokenLines(token, charsPerLine)
    if (used > 0 && used + lines > maxLines) {
      chunks.push({ title: section.title, tokens: current })
      current = []
      used = 0
    }
    current.push(token)
    used += lines
  }
  if (current.length > 0) chunks.push({ title: section.title, tokens: current })
  return chunks
}

async function chromeShot(chrome, htmlPath, pngPath, width, height) {
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${width},${height}`,
    `--screenshot=${pngPath}`,
    `file://${htmlPath}`,
  ]
  await execFileP(chrome, args, { timeout: 90000, maxBuffer: 4 * 1024 * 1024 })
  if (!exists(pngPath)) throw new Error(`Chrome exited but no screenshot was written: ${pngPath}`)
}

function readMarkdownInput(args, toolName) {
  if (typeof args.markdown === 'string' && args.markdown.trim().length > 0) return args.markdown
  if (typeof args.markdown_path === 'string' && args.markdown_path.trim().length > 0) {
    return readFileSync(args.markdown_path, 'utf8')
  }
  throw new Error(`${toolName}: provide either markdown (inline string) or markdown_path (file)`)
}

/** Resolve a background image argument: URL/data pass through, local paths get embedded as data URLs. */
function resolveBgImage(bg) {
  if (typeof bg !== 'string' || bg.trim() === '') return null
  const value = bg.trim()
  if (/^(https?:|data:)/i.test(value)) return value
  try {
    const buf = readFileSync(value)
    const ext = path.extname(value).toLowerCase()
    const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/png'
    return 'data:' + mime + ';base64,' + buf.toString('base64')
  } catch (error) {
    throw new Error('bg_image: cannot read local image ' + value + ' — ' + String(error && error.message ? error.message : error))
  }
}

export async function mdToHtml(args) {
  const md = readMarkdownInput(args, 'content_md_to_html')
  const style = args.style ?? 'xhs-soft'
  const layout = args.layout ?? 'classic'
  const { width } = sizeOf(args.size)
  const htmlPath = resolveFile(args.output_path, 'html', 'article', '.html')
  const bgImage = resolveBgImage(args.bg_image)
  const html = renderCardHtml({ bodyHtml: parseMarkdown(md), style, size: args.size, footer: args.footer, layout, bgImage })
  writeFileSync(htmlPath, html, 'utf8')
  return {
    html_path: htmlPath,
    style,
    layout,
    size: args.size ?? 'xhs',
    note: 'Open in a browser or pass to Playwright MCP for screenshots. The HTML is self-contained (inline CSS).',
  }
}

export async function mdToCards(args) {
  const md = readMarkdownInput(args, 'content_md_to_cards')
  const { width, height } = sizeOf(args.size)
  const style = args.style ?? 'xhs-soft'
  const layout = args.layout ?? 'classic'
  const bgImage = resolveBgImage(args.bg_image)
  const k = width / 1242
  const footer = args.footer
  const outputDir = resolveDir(args.output_dir, 'cards')
  const chrome = findChrome()
  if (!chrome) {
    throw new Error(
      'content_md_to_cards: no Chrome/Edge/Chromium found for headless rendering. ' +
        'Install Google Chrome, or set CHROME_PATH to a Chromium executable.'
    )
  }
  const write = (name, content) => {
    const p = path.join(outputDir, name)
    writeFileSync(p, content, 'utf8')
    return p
  }

  const cards = []
  let contentIdx = 0

  if (args.cover) {
    const html = renderCoverHtml({
      title: args.cover.title,
      subtitle: args.cover.subtitle,
      emoji: args.cover.emoji,
      style,
      size: args.size,
      footer,
      layout,
      bgImage,
    })
    const htmlPath = write('card-000-cover.html', html)
    const pngPath = path.join(outputDir, 'card-000-cover.png')
    await chromeShot(chrome, htmlPath, pngPath, width, height)
    cards.push({ path: pngPath, title: args.cover.title ?? '封面', kind: 'cover' })
  }

  if (args.split === 'none') {
    const bodyHtml = parseMarkdown(md)
    const charsPerLine = Math.max(12, Math.round(width / 44))
    const estLines = Math.max(6, Math.ceil(String(md).length / charsPerLine) + 6)
    const lineH = Math.round(61 * k)
    const pad = Math.round(96 * k)
    const cardHeight = Math.max(height, Math.min(16384, pad * 2 + Math.round(estLines * lineH) + 240))
    const html = renderCardHtml({ bodyHtml, style, size: args.size, footer, layout, bgImage })
    const htmlPath = write('card-001-full.html', html)
    const pngPath = path.join(outputDir, 'card-001-full.png')
    await chromeShot(chrome, htmlPath, pngPath, width, cardHeight)
    cards.push({ path: pngPath, title: '全文长图', kind: 'full' })
  } else {
    const charsPerLine = Math.max(12, Math.round(width / 44))
    const lineH = Math.round(61 * k)
    const pad = Math.round(96 * k)
    const maxLines = Math.max(6, Math.floor((height - pad * 2 - Math.round(140 * k)) / lineH))
    for (const section of splitSections(md)) {
      for (const chunk of chunkSection(section, maxLines, charsPerLine)) {
        contentIdx += 1
        const id = String(contentIdx).padStart(3, '0')
        const titleHtml = chunk.title ? `<h1>${escapeHtml(chunk.title)}</h1>` : ''
        const bodyHtml = titleHtml + marked.parser(chunk.tokens)
        const html = renderCardHtml({ bodyHtml, style, size: args.size, footer, layout, bgImage })
        const htmlPath = write(`card-${id}.html`, html)
        const pngPath = path.join(outputDir, `card-${id}.png`)
        await chromeShot(chrome, htmlPath, pngPath, width, height)
        cards.push({ path: pngPath, title: chunk.title || `卡片 ${id}`, kind: 'content' })
      }
    }
    if (cards.length === 0) {
      throw new Error('content_md_to_cards: the markdown produced no cards (empty input?)')
    }
  }

  const mdPath = write('source.md', md)
  const fullHtmlPath = write(
    'preview-full.html',
    renderCardHtml({ bodyHtml: parseMarkdown(md), style, size: args.size, footer, layout, bgImage })
  )
  return {
    output_dir: outputDir,
    size: `${width}×${height}`,
    style,
    layout,
    bg_image: bgImage,
    chrome,
    cards,
    markdown_path: mdPath,
    html_path: fullHtmlPath,
    note: 'Cards are ordered (cover first). Preview each PNG with read_image. To publish on XHS, pass the PNG paths to mcp__xhs__xhs_publish_content as media_paths (3:4, up to 18 images, title ≤ 20 chars).',
  }
}
