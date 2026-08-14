// dev.to (Forem) publishing via the official REST API.
// Docs: https://developers.forem.com/api — POST /api/articles with header api-key.
import { getKey } from './keys.js'

export async function publishDevto(args) {
  const key = args.api_key ?? getKey('devtoApiKey') ?? process.env.DEVTO_API_KEY
  if (!key) {
    throw new Error(
      'content_publish_devto: no API key. Pass api_key, save one in the review panel (③ 设置/API Keys), or export DEVTO_API_KEY. ' +
        'Get one at https://dev.to/settings/extensions ("DEV Community API Keys").'
    )
  }
  if (!args.title || !String(args.title).trim()) throw new Error('content_publish_devto: title is required')
  if (!args.body_markdown || !String(args.body_markdown).trim()) {
    throw new Error('content_publish_devto: body_markdown is required')
  }
  const article = {
    title: String(args.title).trim(),
    body_markdown: String(args.body_markdown),
    published: args.published ?? false,
  }
  if (Array.isArray(args.tags) && args.tags.length > 0) article.tags = args.tags.map(String).slice(0, 4)
  if (args.series) article.series = String(args.series)
  if (args.canonical_url) article.canonical_url = String(args.canonical_url)
  if (args.main_image) article.main_image = String(args.main_image)

  const res = await fetch('https://dev.to/api/articles', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'api-key': key,
    },
    body: JSON.stringify({ article }),
  })
  const text = await res.text()
  let data = {}
  try {
    data = JSON.parse(text)
  } catch {
    // keep data empty on non-JSON bodies
  }
  if (!res.ok) {
    throw new Error(`content_publish_devto: dev.to API ${res.status}: ${text.slice(0, 400)}`)
  }
  return {
    id: data.id ?? null,
    url: data.url ?? null,
    state: data.state ?? null,
    published: Boolean(data.published),
    tags: article.tags ?? [],
    note: data.published ? '已发布' : '已存为草稿（published: false）。确认后可将 published 设为 true 重发同稿（会创建新文章）。',
  }
}
