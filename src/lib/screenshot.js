// Desktop screenshot via macOS screencapture.
import { execFileP, exists, resolveFile, assertRegion } from './util.js'

const SCREENCAPTURE = process.env.SCREENCAPTURE_PATH || '/usr/sbin/screencapture'

export async function screenshotDesktop(args) {
  if (process.platform !== 'darwin') {
    throw new Error(
      'content_screenshot currently supports macOS only (screencapture). ' +
        'On Linux use gnome-screenshot/scrot, on Windows PowerShell CopyFromScreen — see the xhs-content-studio skill.'
    )
  }
  assertRegion(args.region, 'content_screenshot')
  const outputPath = resolveFile(args.output_path, 'screenshots', 'shot', '.png')
  const cmdArgs = ['-x'] // -x: no shutter sound
  const delay = args.delay_seconds ?? 0
  if (!Number.isInteger(delay) || delay < 0 || delay > 10) {
    throw new Error('content_screenshot: delay_seconds must be an integer between 0 and 10')
  }
  if (delay > 0) cmdArgs.push('-T', String(delay))
  if (args.region) {
    const r = args.region
    cmdArgs.push('-R', `${r.x},${r.y},${r.width},${r.height}`)
  }
  cmdArgs.push(outputPath)
  await execFileP(SCREENCAPTURE, cmdArgs, { timeout: 30000, maxBuffer: 1024 * 1024 })
  if (!exists(outputPath)) throw new Error('content_screenshot: screencapture exited without writing a file')
  return {
    output_path: outputPath,
    region: args.region ?? null,
    delay_seconds: delay,
    note: 'Use read_image to view the PNG.',
  }
}
