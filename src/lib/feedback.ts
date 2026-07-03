import { loadJSON, KEYS } from './storage'
import type { AppSettings } from '../types'

// ─── Volume Control ────────────────────────────────────────────────────────

function getVolume(): number {
  const settings = loadJSON<AppSettings>(KEYS.settings, { volume: 80, continuousScan: true })
  return settings.volume / 100 // 0.0 - 1.0
}

// ─── Haptic Feedback ───────────────────────────────────────────────────────

/** Short success vibration pattern */
export function vibrate(ms = 60) {
  if (navigator.vibrate) navigator.vibrate(ms)
}

/** Double-pulse vibration for errors/warnings */
export function vibrateError() {
  if (navigator.vibrate) navigator.vibrate([40, 50, 40])
}

// ─── Audio Feedback ────────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtx = new Ctor()
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    return audioCtx
  } catch {
    return null
  }
}

/**
 * Short, crisp success beep (880 Hz, ~120ms).
 * Volume controlled by user settings.
 */
export function beep() {
  const vol = getVolume()
  if (vol === 0) return

  const ctx = getAudioContext()
  if (!ctx) return

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, ctx.currentTime)
  osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.04)
  osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.04)

  const maxGain = 0.22 * vol
  gain.gain.setValueAtTime(maxGain, ctx.currentTime)
  gain.gain.setValueAtTime(maxGain, ctx.currentTime + 0.06)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.12)
}

/**
 * Warning beep for "not found" scenarios (lower frequency, dual tone ~180ms).
 * Volume controlled by user settings.
 */
export function beepError() {
  const vol = getVolume()
  if (vol === 0) return

  const ctx = getAudioContext()
  if (!ctx) return

  const maxGain = 0.15 * vol

  // First tone - low
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.type = 'square'
  osc1.frequency.setValueAtTime(330, ctx.currentTime)
  gain1.gain.setValueAtTime(maxGain, ctx.currentTime)
  gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09)
  osc1.connect(gain1)
  gain1.connect(ctx.destination)
  osc1.start(ctx.currentTime)
  osc1.stop(ctx.currentTime + 0.09)

  // Second tone - slightly lower, delayed
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'square'
  osc2.frequency.setValueAtTime(260, ctx.currentTime + 0.1)
  gain2.gain.setValueAtTime(0, ctx.currentTime)
  gain2.gain.setValueAtTime(maxGain, ctx.currentTime + 0.1)
  gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.start(ctx.currentTime + 0.1)
  osc2.stop(ctx.currentTime + 0.18)
}

/**
 * Combined success feedback: vibrate + beep simultaneously.
 */
export function feedbackSuccess() {
  vibrate(60)
  beep()
}

/**
 * Combined error/warning feedback: double vibrate + error beep.
 */
export function feedbackNotFound() {
  vibrateError()
  beepError()
}
