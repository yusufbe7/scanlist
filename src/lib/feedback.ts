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
 * Designed to be fast with no perceptible latency for rapid scanning.
 */
export function beep() {
  const ctx = getAudioContext()
  if (!ctx) return

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, ctx.currentTime)
  // Quick pitch rise for a satisfying "chirp"
  osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.04)
  osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.04)

  gain.gain.setValueAtTime(0.18, ctx.currentTime)
  gain.gain.setValueAtTime(0.18, ctx.currentTime + 0.06)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.12)
}

/**
 * Warning beep for "not found" scenarios (lower frequency, dual tone ~180ms).
 * Clearly different from success beep so user knows without looking.
 */
export function beepError() {
  const ctx = getAudioContext()
  if (!ctx) return

  // First tone - low
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.type = 'square'
  osc1.frequency.setValueAtTime(330, ctx.currentTime)
  gain1.gain.setValueAtTime(0.12, ctx.currentTime)
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
  gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.1)
  gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.start(ctx.currentTime + 0.1)
  osc2.stop(ctx.currentTime + 0.18)
}

/**
 * Combined success feedback: vibrate + beep simultaneously.
 * Call this on successful barcode read.
 */
export function feedbackSuccess() {
  vibrate(60)
  beep()
}

/**
 * Combined error/warning feedback: double vibrate + error beep.
 * Call this when barcode not found in database.
 */
export function feedbackNotFound() {
  vibrateError()
  beepError()
}
