// Medium publishing via the official API (https://github.com/Medium/medium-api-docs).
// POST /v1/me -> user id; POST /v1/users/:id/posts -> create post.
// Known Medium quirks handled here: 202 on success, an occasional spurious 401
// right after a successful create (retried once), and empty url in the reply.
import { getKey } from './keys.js'

const API = 'https://api.medium.com/v1'

function headersOf(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Charset': 'utf-8',
  }
}

async function createPost(userId, token, payload) {
  const res = await fetch(`${API}/users/${userId}/posts`, {
    method: 'POST',
    headers: headersOf(token),
    body: JSON.stringify(payload),
  })
  if (res.status === 201 || res.status === 202) {
    const data = await res.json().catch(() => ({}))
    return { ok: true, httpStatus: res.status, url: data && data.data && data.data.url ? data.data.url : '' }
  }
  const text = await res.text().catch(() => '')
  return { ok: false, httpStatus: res.status, error: text.slice(0, 400) }
}

export async function publishMedium(args = {}) {
  const token = (typeof args.api_key === 'string' && args.api_key.trim() !== '' ? args.api_key : getKey('mediumToken') || process.env.MEDIUM_TOKEN || '').trim()
  if (token === '') {
    return { ok: false, error: 'No Medium token. Generate one at https://medium.com/me/settings -> Integration tokens, then pass api_key or save it from the panel 设置 page.' }
  }
  if (typeof args.title !== 'string' || args.title.trim() === '') {
    return { ok: false, error: 'title is required' }
  }
  if (typeof args.body_markdown !== 'string' || args.body_markdown.trim() === '') {
    return { ok: false, error: 'body_markdown is required' }
  }

  // 1) resolve user id
  let userId = ''
  {
    const res = await fetch(`${API}/me`, { headers: headersOf(token) })
    const data = await res.json().catch(() => ({}))
    userId = data && data.data && data.data.id
    if (!userId) {
      return { ok: false, error: `Medium auth failed (HTTP ${res.status}): ${JSON.stringify(data).slice(0, 200)}` }
    }
  }

  // 2) create the post
  const payload = {
    title: args.title.trim(),
    contentFormat: 'markdown',
    content: args.body_markdown,
    tags: (Array.isArray(args.tags) ? args.tags : []).slice(0, 5),
    publishStatus: args.published === true ? 'public' : 'draft',
  }
  if (typeof args.canonical_url === 'string' && args.canonical_url.trim() !== '') {
    payload.canonicalUrl = args.canonical_url.trim()
  }

  let result = await createPost(userId, token, payload)
  if (!result.ok && result.httpStatus === 401) {
    // Medium is known to return a spurious 401 after the post was actually created.
    result = await createPost(userId, token, payload)
  }
  if (!result.ok) {
    return { ok: false, error: `Medium HTTP ${result.httpStatus}: ${result.error}` }
  }
  return {
    ok: true,
    published: args.published === true,
    mediumUrl: result.url,
    note: result.url === '' ? 'Post created but Medium did not return a URL yet; it will appear in your drafts/stories shortly.' : '',
  }
}
