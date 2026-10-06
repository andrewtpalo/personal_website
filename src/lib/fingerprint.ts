/**
 * Browser fingerprinting demo. Collects the passive signals any site can read
 * without a prompt and hashes them into an identifier. Everything runs
 * locally; nothing is stored or transmitted.
 */
import { fnv1a } from './rng'

export interface Signal {
  key: string
  value: string
}

export interface Fingerprint {
  signals: Signal[]
  hash: string
  algorithm: string
}

function canvasSignal(): string {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 240
    canvas.height = 40
    const ctx = canvas.getContext('2d')
    if (!ctx) return 'unavailable'
    // Text + emoji rendering differs subtly across GPU, OS, font stack and anti-aliasing.
    ctx.textBaseline = 'top'
    ctx.font = '16px "Times New Roman", serif'
    ctx.fillStyle = '#f60'
    ctx.fillRect(100, 1, 60, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('andrewtpalo.com \u{1F512}', 2, 4)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('andrewtpalo.com \u{1F512}', 4, 8)
    return fnv1a(canvas.toDataURL())
  } catch {
    return 'blocked'
  }
}

function webglSignal(): string {
  try {
    const gl = document.createElement('canvas').getContext('webgl')
    if (!gl) return 'unavailable'
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return String(renderer)
  } catch {
    return 'blocked'
  }
}

async function sha256(text: string): Promise<{ hash: string; algorithm: string }> {
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
    return { hash, algorithm: 'SHA-256' }
  }
  return { hash: fnv1a(text), algorithm: 'FNV-1a (Web Crypto unavailable)' }
}

export async function collectFingerprint(): Promise<Fingerprint> {
  const nav = navigator as Navigator & { deviceMemory?: number; userAgentData?: { platform?: string } }
  const media = (q: string) => matchMedia(q).matches
  const signals: Signal[] = [
    { key: 'platform', value: nav.userAgentData?.platform || nav.platform || 'unknown' },
    { key: 'languages', value: (nav.languages ?? [nav.language]).join(', ') },
    { key: 'timezone', value: Intl.DateTimeFormat().resolvedOptions().timeZone },
    { key: 'screen', value: `${screen.width}×${screen.height} @${devicePixelRatio}x · ${screen.colorDepth}-bit` },
    { key: 'cpu threads', value: String(nav.hardwareConcurrency ?? 'hidden') },
    { key: 'device memory', value: nav.deviceMemory ? `≥${nav.deviceMemory} GB` : 'hidden' },
    { key: 'touch points', value: String(nav.maxTouchPoints) },
    { key: 'gpu', value: webglSignal() },
    { key: 'canvas render', value: canvasSignal() },
    {
      key: 'preferences',
      value: [
        media('(prefers-color-scheme: dark)') ? 'dark' : 'light',
        media('(prefers-reduced-motion: reduce)') ? 'reduced-motion' : 'motion-ok',
        media('(pointer: coarse)') ? 'coarse-pointer' : 'fine-pointer',
      ].join(' · '),
    },
  ]
  const { hash, algorithm } = await sha256(signals.map((s) => `${s.key}=${s.value}`).join('|'))
  return { signals, hash, algorithm }
}
