// Text-to-image via Nano Banana (Google Gemini 2.5 Flash Image).
// Generative Language API — one API key, one POST, base64 image back.
// Docs: https://ai.google.dev/gemini-api/docs/image-generation
import { writeFileSync } from 'node:fs'
import { resolveFile } from './util.js'

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent'
const ASPECTS = ['1:1', '16:9', '9:16', '4:3', '3:4']

export async function textToImage(args) {
  const keyArg = typeof args.api_key === 'string' ? args.api_key.trim() : ''
  const apiKey = keyArg || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error(
      'content_text_to_image: no API key — pass api_key or set GEMINI_API_KEY in the environment (create one at https://aistudio.google.com/apikey).'
    )
  }
  const prompt = typeof args.prompt === 'string' ? args.prompt.trim() : ''
  if (prompt === '') throw new Error('content_text_to_image: prompt is required')
  const aspect = ASPECTS.includes(args.aspect_ratio) ? args.aspect_ratio : '1:1'

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { response_modalities: ['IMAGE'], aspect_ratio: aspect },
    }),
  })
  const text = await res.text()
  if (!res.ok) {
    let message = text
    try {
      const parsed = JSON.parse(text)
      message = parsed?.error?.message ?? text
    } catch {
      // keep raw body
    }
    throw new Error(`content_text_to_image: Gemini API ${res.status}: ${String(message).slice(0, 400)}`)
  }
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('content_text_to_image: unexpected non-JSON response from the Gemini API')
  }
  const parts = data?.candidates?.[0]?.content?.parts ?? []
  const inline = parts.find((p) => p && p.inlineData && p.inlineData.data)
  if (!inline) {
    throw new Error('content_text_to_image: the response contained no image (the prompt may have been blocked by safety filters)')
  }
  const mime = inline.inlineData.mimeType ?? 'image/png'
  const ext = mime.includes('jpeg') ? '.jpg' : mime.includes('webp') ? '.webp' : '.png'
  const outputPath = resolveFile(args.output_path, 'ai-images', 'img', ext)
  writeFileSync(outputPath, Buffer.from(inline.inlineData.data, 'base64'))
  return {
    output_path: outputPath,
    aspect_ratio: aspect,
    provider: 'gemini-2.5-flash-image (nano-banana)',
    note: 'Use this path as bg_image for content_md_to_cards, or as ![alt](path) inside the card markdown — both embed the image automatically.',
  }
}
