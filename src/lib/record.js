// Desktop screen recording via ffmpeg AVFoundation capture (macOS).
import { execFileP, exists, resolveFile, assertRegion } from './util.js'

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg'

/** Parse `ffmpeg -f avfoundation -list_devices true -i ""` stderr into device lists. */
async function listAvFoundationDevices() {
  let stderr = ''
  try {
    await execFileP(FFMPEG, ['-f', 'avfoundation', '-list_devices', 'true', '-i', '""'], {
      timeout: 15000,
      maxBuffer: 1024 * 1024,
    })
  } catch (error) {
    stderr = String(error.stderr ?? error.message ?? '')
  }
  const video = []
  const audio = []
  let section = null
  for (const line of stderr.split('\n')) {
    if (line.includes('AVFoundation video devices')) {
      section = 'video'
      continue
    }
    if (line.includes('AVFoundation audio devices')) {
      section = 'audio'
      continue
    }
    const m = line.match(/\[(\d+)\]\s+(.+)/)
    if (m && section) {
      ;(section === 'video' ? video : audio).push({ index: Number(m[1]), name: m[2].trim() })
    }
  }
  return { video, audio }
}

export async function listDevices() {
  const devices = await listAvFoundationDevices()
  return {
    platform: process.platform,
    video: devices.video,
    audio: devices.audio,
  }
}

export async function recordScreen(args) {
  if (process.platform !== 'darwin') {
    throw new Error(
      'content_screen_record currently supports macOS only (ffmpeg avfoundation). ' +
        'On Linux use ffmpeg x11grab, on Windows gdigrab — see the xhs-content-studio skill.'
    )
  }
  assertRegion(args.region, 'content_screen_record')
  const duration = args.duration_seconds
  if (!Number.isInteger(duration) || duration < 1 || duration > 600) {
    throw new Error('content_screen_record: duration_seconds must be an integer between 1 and 600')
  }
  const framerate = args.framerate ?? 30
  if (!Number.isInteger(framerate) || framerate < 5 || framerate > 60) {
    throw new Error('content_screen_record: framerate must be an integer between 5 and 60')
  }

  const devices = await listAvFoundationDevices()
  const screen = devices.video.find((d) => /capture screen/i.test(d.name))
  if (!screen) {
    throw new Error(
      `content_screen_record: no "Capture screen" device found. ffmpeg video devices: ${JSON.stringify(devices.video)}. ` +
        'Grant Screen Recording permission to the terminal running DSH (System Settings → Privacy & Security → Screen Recording).'
    )
  }
  let audioDevice = 'none'
  if (args.mic) {
    const mic = devices.audio.find((d) => /麦克风|microphone|\bmic\b/i.test(d.name))
    if (!mic) throw new Error(`content_screen_record: mic requested but no microphone found: ${JSON.stringify(devices.audio)}`)
    audioDevice = String(mic.index)
  }

  const outputPath = resolveFile(args.output_path, 'recordings', 'record', '.mp4')
  const cmdArgs = [
    '-y',
    '-f', 'avfoundation',
    '-framerate', String(framerate),
    '-capture_cursor', '1',
    '-i', `${screen.index}:${audioDevice}`,
    '-t', String(duration),
  ]
  if (args.region) {
    const r = args.region
    cmdArgs.push('-filter:v', `crop=${r.width}:${r.height}:${r.x}:${r.y}`)
  }
  cmdArgs.push(
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outputPath
  )
  await execFileP(FFMPEG, cmdArgs, { timeout: (duration + 60) * 1000, maxBuffer: 4 * 1024 * 1024 })
  if (!exists(outputPath)) throw new Error('content_screen_record: ffmpeg exited without writing a file')
  return {
    output_path: outputPath,
    duration_seconds: duration,
    framerate,
    screen_device: `${screen.index} · ${screen.name}`,
    audio_device: audioDevice === 'none' ? 'none' : devices.audio.find((d) => String(d.index) === audioDevice)?.name ?? audioDevice,
    region: args.region ?? null,
    note: 'The tool blocks until recording finishes. For longer takes prefer several short clips and concatenate them with ffmpeg.',
  }
}
