// Shared helpers for the content-studio plugin. Plain ESM, zero dependencies.
import { execFile } from 'node:child_process'
import { mkdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

export const execFileP = promisify(execFile)

/** Default output root: ~/.dsh/content-studio-output/ */
export const OUTPUT_ROOT = path.join(homedir(), '.dsh', 'content-studio-output')

export function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

export function ensureDir(dir) {
  mkdirSync(dir, { recursive: true })
  return dir
}

export function exists(p) {
  try {
    statSync(p)
    return true
  } catch {
    return false
  }
}

/** Resolve an output directory; defaults to OUTPUT_ROOT/<kind>/<stamp>/. */
export function resolveDir(outputDir, kind) {
  const dir = outputDir ? path.resolve(outputDir) : path.join(OUTPUT_ROOT, kind, stamp())
  return ensureDir(dir)
}

/** Resolve an output file; defaults to OUTPUT_ROOT/<kind>/<name>-<stamp><ext>. Creates the parent directory. */
export function resolveFile(outputPath, kind, name, ext) {
  const p = outputPath ? path.resolve(outputPath) : path.join(OUTPUT_ROOT, kind, `${name}-${stamp()}${ext}`)
  ensureDir(path.dirname(p))
  return p
}

/** Native text content block for tool output.render. */
export function textBlock(text) {
  return [{ type: 'text', text }]
}

/** Minimal JSON Schema object builder for tool output schemas. */
export function objectSchema(properties, required = []) {
  return { type: 'object', properties, required, additionalProperties: false }
}

/** Shared region schema: display coordinates in points (screen space). */
export const REGION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    x: { type: 'integer', description: 'Top-left X in display points.' },
    y: { type: 'integer', description: 'Top-left Y in display points.' },
    width: { type: 'integer', description: 'Region width in display points.' },
    height: { type: 'integer', description: 'Region height in display points.' },
  },
}

export function assertRegion(region, toolName) {
  if (region === undefined || region === null) return
  for (const k of ['x', 'y', 'width', 'height']) {
    const v = region[k]
    if (v === undefined || !Number.isInteger(v) || v < 0) {
      throw new Error(`${toolName}: region.${k} must be a non-negative integer (got ${JSON.stringify(v)})`)
    }
  }
  if (region.width === 0 || region.height === 0) throw new Error(`${toolName}: region width/height must be positive`)
}
