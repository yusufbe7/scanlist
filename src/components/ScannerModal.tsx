import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Zap, ZapOff, Flashlight, FlashlightOff } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { feedbackSuccess, feedbackNotFound } from '../lib/feedback'

// ─── Types ─────────────────────────────────────────────────────────────────

interface ScanPreview {
  code: string
  name?: string
  price?: number
  found: boolean
}

// ─── Constants ─────────────────────────────────────────────────────────────

const COOLDOWN_MS = 1000 // Prevent re-reading same barcode within 1s
const SCAN_INTERVAL_MS = 80 // ~12fps scan rate for native API
const FALLBACK_FPS = 15 // html5-qrcode fallback FPS

// Barcode formats for native BarcodeDetector
const NATIVE_FORMATS: BarcodeFormat[] = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'code_39',
  'qr_code',
]

// ─── Utility: Check native BarcodeDetector support ─────────────────────────

function hasNativeBarcodeDetector(): boolean {
  return 'BarcodeDetector' in window
}

// ─── Optimized Camera Constraints ──────────────────────────────────────────

function getCameraConstraints(): MediaStreamConstraints {
  const videoConstraints: MediaTrackConstraints & Record<string, unknown> = {
    facingMode: 'environment',
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
  }
  // Advanced constraints for autofocus/exposure (not in all TS libs)
  videoConstraints.focusMode = { ideal: 'continuous' }
  videoConstraints.exposureMode = { ideal: 'continuous' }

  return { video: videoConstraints, audio: false }
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ScannerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { scan, productDb } = useApp()

  // State
  const [continuous, setContinuous] = useState(true)
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualValue, setManualValue] = useState('')
  const [lastPreview, setLastPreview] = useState<ScanPreview | null>(null)
  const [scanSuccess, setScanSuccess] = useState(false) // For green frame animation
  const [usingNative, setUsingNative] = useState(false)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number>(0)
  const lastScanTimeRef = useRef<number>(0)
  const lastCodeRef = useRef<string>('')
  const continuousRef = useRef(continuous)
  const mountedRef = useRef(false)
  const scanningRef = useRef(false)
  const html5ScannerRef = useRef<any>(null)

  continuousRef.current = continuous

  // ─── Handle successful decode ──────────────────────────────────────────

  const handleDecode = useCallback(
    (code: string) => {
      const now = Date.now()

      // Cooldown: same barcode can't be re-read within COOLDOWN_MS
      if (code === lastCodeRef.current && now - lastScanTimeRef.current < COOLDOWN_MS) {
        return
      }

      lastScanTimeRef.current = now
      lastCodeRef.current = code

      // Check product database
      const info = productDb[code]
      const found = !!info

      // Feedback
      if (found) {
        feedbackSuccess()
      } else {
        feedbackNotFound()
      }

      // Process scan
      scan(code)

      // UI feedback
      setLastPreview({ code, name: info?.name, price: info?.price, found })
      setScanSuccess(true)
      setTimeout(() => setScanSuccess(false), 400)

      // If not continuous, close after cooldown
      if (!continuousRef.current) {
        setTimeout(() => {
          stopCamera()
          onClose()
        }, COOLDOWN_MS)
      }
    },
    [scan, productDb, onClose]
  )

  // ─── Torch control ────────────────────────────────────────────────────

  const toggleTorch = useCallback(async () => {
    const stream = streamRef.current
    if (!stream) return
    const track = stream.getVideoTracks()[0]
    if (!track) return

    try {
      const newState = !torchOn
      // @ts-expect-error - torch is not in standard TS types
      await track.applyConstraints({ advanced: [{ torch: newState }] })
      setTorchOn(newState)
    } catch {
      // Torch not supported on this device
    }
  }, [torchOn])

  // ─── Stop camera and cleanup ──────────────────────────────────────────

  const stopCamera = useCallback(() => {
    scanningRef.current = false

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = 0
    }

    if (html5ScannerRef.current) {
      html5ScannerRef.current
        .stop()
        .then(() => html5ScannerRef.current?.clear())
        .catch(() => {})
      html5ScannerRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  // ─── Native BarcodeDetector scanning loop ─────────────────────────────

  const startNativeScanning = useCallback(
    (detector: BarcodeDetector) => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      scanningRef.current = true
      let lastFrameTime = 0

      const scanFrame = (timestamp: number) => {
        if (!scanningRef.current || !mountedRef.current) return

        // Throttle to SCAN_INTERVAL_MS
        if (timestamp - lastFrameTime < SCAN_INTERVAL_MS) {
          animFrameRef.current = requestAnimationFrame(scanFrame)
          return
        }
        lastFrameTime = timestamp

        if (video.readyState < video.HAVE_ENOUGH_DATA) {
          animFrameRef.current = requestAnimationFrame(scanFrame)
          return
        }

        // Only scan the center region (ROI) for speed
        const vw = video.videoWidth
        const vh = video.videoHeight

        // ROI: center 60% width, 30% height — optimized for barcode shape
        const roiW = Math.floor(vw * 0.7)
        const roiH = Math.floor(vh * 0.35)
        const roiX = Math.floor((vw - roiW) / 2)
        const roiY = Math.floor((vh - roiH) / 2)

        canvas.width = roiW
        canvas.height = roiH

        // Draw only the ROI region to canvas
        ctx.drawImage(video, roiX, roiY, roiW, roiH, 0, 0, roiW, roiH)

        // Detect barcodes in ROI
        detector
          .detect(canvas)
          .then(barcodes => {
            if (!scanningRef.current || !mountedRef.current) return
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue
              if (code) handleDecode(code)
            }
          })
          .catch(() => {
            // Silently continue on detection errors
          })

        animFrameRef.current = requestAnimationFrame(scanFrame)
      }

      animFrameRef.current = requestAnimationFrame(scanFrame)
    },
    [handleDecode]
  )

  // ─── Fallback: html5-qrcode scanning ─────────────────────────────────

  const startFallbackScanning = useCallback(async () => {
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')

      const formats = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.QR_CODE,
      ]

      const readerId = 'scanlist-fallback-reader'
      // Ensure element exists
      const el = document.getElementById(readerId)
      if (!el) return

      const instance = new Html5Qrcode(readerId, {
        formatsToSupport: formats,
        verbose: false,
      })
      html5ScannerRef.current = instance

      await instance.start(
        { facingMode: 'environment' },
        {
          fps: FALLBACK_FPS,
          qrbox: { width: 280, height: 140 },
          aspectRatio: 1.7,
        },
        (decodedText: string) => {
          if (!scanningRef.current || !mountedRef.current) return
          handleDecode(decodedText)
        },
        () => {} // error callback — ignore non-reads
      )

      scanningRef.current = true
    } catch {
      setError("Kamera ochilmadi. Ruxsat berilganini tekshiring yoki quyida qo'lda kiriting.")
    }
  }, [handleDecode])

  // ─── Start camera (native path) ──────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(getCameraConstraints())
      if (!mountedRef.current) {
        stream.getTracks().forEach(t => t.stop())
        return
      }

      streamRef.current = stream
      const video = videoRef.current
      if (!video) return

      video.srcObject = stream
      await video.play()

      // Check torch support
      const track = stream.getVideoTracks()[0]
      if (track) {
        const capabilities = track.getCapabilities?.() as any
        if (capabilities?.torch) {
          setTorchSupported(true)
        }
      }

      // Start native detection
      const detector = new BarcodeDetector({ formats: NATIVE_FORMATS })
      startNativeScanning(detector)
    } catch {
      setError("Kamera ochilmadi. Ruxsat berilganini tekshiring yoki quyida qo'lda kiriting.")
    }
  }, [startNativeScanning])

  // ─── Main effect: open/close camera ───────────────────────────────────

  useEffect(() => {
    if (!open) return

    mountedRef.current = true
    setError(null)
    setLastPreview(null)
    setScanSuccess(false)
    lastCodeRef.current = ''

    const useNative = hasNativeBarcodeDetector()
    setUsingNative(useNative)

    if (useNative) {
      // Small delay to let DOM render video element
      const timer = setTimeout(() => {
        if (mountedRef.current) startCamera()
      }, 100)
      return () => {
        clearTimeout(timer)
        mountedRef.current = false
        stopCamera()
      }
    } else {
      // Fallback path
      const timer = setTimeout(() => {
        if (mountedRef.current) startFallbackScanning()
      }, 100)
      return () => {
        clearTimeout(timer)
        mountedRef.current = false
        stopCamera()
      }
    }
  }, [open, startCamera, startFallbackScanning, stopCamera])

  // ─── Render ───────────────────────────────────────────────────────────

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 text-white z-10">
        <div className="font-display font-bold text-base">📷 Barcode scan</div>
        <div className="flex items-center gap-2">
          {/* Torch toggle */}
          {torchSupported && (
            <button
              onClick={toggleTorch}
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                torchOn ? 'bg-yellow-400 text-black' : 'bg-white/15'
              }`}
              aria-label={torchOn ? 'Flash o\'chirish' : 'Flash yoqish'}
            >
              {torchOn ? <Flashlight size={15} /> : <FlashlightOff size={15} />}
            </button>
          )}

          {/* Continuous mode toggle */}
          <button
            onClick={() => setContinuous(c => !c)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
              continuous
                ? 'bg-primary border-primary text-white'
                : 'bg-white/10 border-white/25 text-white/80'
            }`}
          >
            {continuous ? <Zap size={13} /> : <ZapOff size={13} />}
            Uzluksiz
          </button>

          {/* Close button */}
          <button
            onClick={() => {
              stopCamera()
              onClose()
            }}
            className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"
            aria-label="Yopish"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Camera View ──────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {usingNative ? (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            {/* Hidden canvas for ROI extraction */}
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : (
          /* Fallback: html5-qrcode renders into this div */
          <div
            id="scanlist-fallback-reader"
            className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
          />
        )}

        {/* ── Darkened overlay with scan frame cutout ─────────────────────── */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Dark background with cutout effect using box-shadow */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              w-[78%] max-w-[320px] h-[140px]
              rounded-2xl
              border-[2.5px] transition-colors duration-200
              ${scanSuccess ? 'border-green-400' : 'border-white/80'}
              shadow-[0_0_0_2000px_rgba(0,0,0,0.55)]
            `}
          >
            {/* Corner markers for professional look */}
            <div className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-[3px] border-l-[3px] border-green-400 rounded-tl-xl" />
            <div className="absolute -top-[2px] -right-[2px] w-6 h-6 border-t-[3px] border-r-[3px] border-green-400 rounded-tr-xl" />
            <div className="absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-[3px] border-l-[3px] border-green-400 rounded-bl-xl" />
            <div className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-[3px] border-r-[3px] border-green-400 rounded-br-xl" />

            {/* Laser scan line */}
            <div
              className={`absolute left-[8%] right-[8%] h-[2px] rounded-full
                ${scanSuccess ? 'bg-green-400 animate-none opacity-80' : 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-laser'}
                motion-reduce:animate-none
              `}
            />

            {/* Success flash overlay */}
            {scanSuccess && (
              <div className="absolute inset-0 bg-green-400/15 rounded-2xl animate-pulse" />
            )}
          </div>
        </div>

        {/* Instruction text overlay */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <span className="bg-black/60 text-white/90 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
            Barcode'ni ramka ichiga olib keling
          </span>
        </div>
      </div>

      {/* ── Last scan preview ────────────────────────────────────────────── */}
      {lastPreview && (
        <div
          className={`mx-4 mb-2 rounded-xl px-4 py-3 flex items-center justify-between animate-in
            ${lastPreview.found ? 'bg-white/95' : 'bg-orange-50/95 border border-orange-200'}
          `}
        >
          <div className="min-w-0 flex-1">
            <div className="font-mono font-bold text-sm text-ink truncate">{lastPreview.code}</div>
            {lastPreview.found ? (
              <div className="text-xs text-muted mt-0.5 truncate">
                {lastPreview.name}
                {lastPreview.price != null && ` — ${lastPreview.price.toLocaleString('uz-UZ')} so'm`}
              </div>
            ) : (
              <div className="text-xs text-orange-600 mt-0.5">Mahsulot bazasida topilmadi</div>
            )}
          </div>
          <span className={`text-xl ml-2 ${lastPreview.found ? 'text-primary' : 'text-orange-500'}`}>
            {lastPreview.found ? '✔' : '⚠'}
          </span>
        </div>
      )}

      {/* ── Error message ────────────────────────────────────────────────── */}
      {error && <div className="text-red-200 text-center text-sm px-6 pt-1">{error}</div>}

      {/* ── Mode info ────────────────────────────────────────────────────── */}
      <div className="text-white/85 text-center text-[13px] px-6 pb-2">
        {continuous
          ? '⚡ Uzluksiz rejim: mahsulotlarni ketma-ket scan qiling'
          : "Barcode'ni ramka ichiga tuting"}
      </div>

      {/* ── Manual input ─────────────────────────────────────────────────── */}
      <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex gap-2">
        <input
          value={manualValue}
          onChange={e => setManualValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && manualValue.trim()) {
              const code = manualValue.trim()
              scan(code)
              feedbackSuccess()
              setManualValue('')
              const info = productDb[code]
              setLastPreview({ code, name: info?.name, price: info?.price, found: !!info })
            }
          }}
          placeholder="yoki kodni qo'lda kiriting"
          inputMode="numeric"
          className="flex-1 bg-white/10 border border-white/25 text-white placeholder-white/50 rounded-[10px] px-3.5 py-3 font-mono text-sm outline-none focus:border-primary transition-colors"
        />
        <button
          onClick={() => {
            if (!manualValue.trim()) return
            const code = manualValue.trim()
            scan(code)
            feedbackSuccess()
            setManualValue('')
            const info = productDb[code]
            setLastPreview({ code, name: info?.name, price: info?.price, found: !!info })
          }}
          className="bg-primary text-white rounded-[10px] px-4 font-bold active:scale-95 transition-transform"
        >
          Qo'shish
        </button>
      </div>
    </div>
  )
}
