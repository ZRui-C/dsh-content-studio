// Hub API-key store: ~/.dsh/content-studio-output/keys.json (mode 0600).
// Consumed by the static tools (text-to-image, dev.to) as a fallback after the
// per-call argument and before environment variables. The review panel
// (dynamic plugin) reads/writes the same file through its host bridge, so
// users can configure keys from the browser panel.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

const KEYS_PATH = path.join(homedir(), '.dsh', 'content-studio-output', 'keys.json')

export function loadKeys() {
  try {
    const parsed = JSON.parse(readFileSync(KEYS_PATH, 'utf8'))
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function getKey(name) {
  const value = loadKeys()[name]
  return typeof value === 'string' ? value : ''
}

/** Merge non-empty string values for the known key names; never clears existing ones. */
export function saveKeys(patch) {
  const next = loadKeys()
  for (const name of ['geminiApiKey', 'devtoApiKey', 'mediumToken']) {
    const value = patch && patch[name]
    if (typeof value === 'string' && value.trim() !== '') next[name] = value.trim()
  }
  mkdirSync(path.dirname(KEYS_PATH), { recursive: true })
  writeFileSync(KEYS_PATH, JSON.stringify(next, null, 2), { mode: 0o600 })
  return next
}

/** Presence-only status, safe to show in the panel. */
export function keysStatus() {
  const keys = loadKeys()
  return {
    geminiSet: Boolean(keys.geminiApiKey),
    devtoSet: Boolean(keys.devtoApiKey),
    mediumSet: Boolean(keys.mediumToken),
  }
}
