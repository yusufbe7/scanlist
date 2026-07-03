import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Zap, ZapOff, Flashlight, FlashlightOff, Crown } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { feedbackSuccess, feedbackNotFound } from '../lib/feedback'
import { getTodayScans, getRemainingScans, isProActive, FREE_SCAN_LIMIT } from '../lib/userManager'

// ─── Types ─────────────────────────────────────────────────────────────────

interface ScanPreview {
  code: string
  name?: string
  price?: number
  found: boolean
  time: string
}

// ─── Constants ─────────────────────────────────────────────────────────────

const COOLDOWN_MS = 1000
const SCAN_INTERVAL_MS = 80
const FALLBACK_FPS = 15

const NATIVE_FORMATS: BarcodeFormat[] = [
  'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code',
]

// ─── Utilities ─────────────────────────────────────────────────────────────

function hasNativeBarcodeDetector(): boolean {
  return 'BarcodeDetector' in window
}

function getCameraConstraints(): MediaStreamConstraints {
  const videoConstraints: MediaTrackConstraints & Record<string, unknown> = {
    facingMode: 'environment',
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
  }
  videoConstraints.focusMode = { ideal: 'continuous' }
  videoConstraints.exposureMode = { ideal: 'continuous' }
  return { video: videoConstraints, audio: false }
}

function timeNow(): string {
  return new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ScannerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { scan, productDb, user, setShowPaywall } = useApp()

  const [continuous, setContinuous] = useState(true)
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualValue, setManualValue] = useState('')
  const [scanSuccess, setScanSuccess] = useState(false)
  const [usingNative, setUsingNative] = useState(false)
  // Scan history (last 5)
  const [scanHistory, setScanHistory] = useState<ScanPreview[]>([])
  const [sessionCount, setSessionCount] = useState(0)

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

  // ─── Handle decode ─────────────────────────────────────────────────────

  const handleDecode = useCallback(
    (code: string) => {
      const now = Date.now()
      if (code === lastCodeRef.current && now - lastScanTimeRef.current < COOLDOWN_MS) return

      lastScanTimeRef.current = now
      lastCodeRef.current = code

      // Try to scan (may fail if limit reached)
      const success = scan(code)
      if (!success) {
        setShowPaywall(true)
        return
      }

      const info = productDb[code]
      const found = !!info

      if (found) {
        feedbackSuccess()
      } else {
        feedbackNotFound()
      }

      const preview: ScanPreview = { code, name: info?.name, price: info?.price, found, time: timeNow() }
      setScanHistory(prev => [preview, ...prev].slice(0, 5))
      setSessionCount(c => c + 1)
      setScanSuccess(true)
      setTimeout(() => setScanSuccess(false), 400)

      if (!continuousRef.current) {
        setTimeout(() => { stopCamera(); onClose() }, COOLDOWN_MS)
      }
    },
    [scan, productDb, onClose, setShowPaywall]
  )

  // ─── Torch ─────────────────────────────────────────────────────────────

  const toggleTorch = useCallback(async () => {
    const stream = streamRef.current
    if (!stream) return
    const track = stream.getVideoTracks()[0]
    if (!track) return
    try {
      const newState = !torchOn
      // @ts-expect-error - torch not in standard TS types
      await track.applyConstraints({ advanced: [{ torch: newState }] })
      setTorchOn(newState)
    } catch {}
  }, [torchOn])

  // ─── Stop camera ──────────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    scanningRef.current = false
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = 0 }
    if (html5ScannerRef.current) {
      html5ScannerRef.current.stop().then(() => html5ScannerRef.current?.clear()).catch(() => {})
      html5ScannerRef.current = null
    }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
  }, [])

  // ─── Native scanning loop ─────────────────────────────────────────────

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
        if (timestamp - lastFrameTime < SCAN_INTERVAL_MS) { animFrameRef.current = requestAnimationFrame(scanFrame); return }
        lastFrameTime = timestamp
        if (video.readyState < video.HAVE_ENOUGH_DATA) { animFrameRef.current = requestAnimationFrame(scanFrame); return }

        const vw = video.videoWidth, vh = video.videoHeight
        const roiW = Math.floor(vw * 0.7), roiH = Math.floor(vh * 0.35)
        const roiX = Math.floor((vw - roiW) / 2), roiY = Math.floor((vh - roiH) / 2)
        canvas.width = roiW; canvas.height = roiH
        ctx.drawImage(video, roiX, roiY, roiW, roiH, 0, 0, roiW, roiH)

        detector.detect(canvas).then(barcodes => {
          if (!scanningRef.current || !mountedRef.current) return
          if (barcodes.length > 0 && barcodes[0].rawValue) handleDecode(barcodes[0].rawValue)
        }).catch(() => {})

        animFrameRef.current = requestAnimationFrame(scanFrame)
      }
      animFrameRef.current = requestAnimationFrame(scanFrame)
    },
    [handleDecode]
  )

  // ─── Fallback scanning ────────────────────────────────────────────────

  const startFallbackScanning = useCallback(async () => {
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
      const formats = [
        Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A, Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.QR_CODE,
      ]
      const el = document.getElementById('scanlist-fallback-reader')
      if (!el) return
      const instance = new Html5Qrcode('scanlist-fallback-reader', { formatsToSupport: formats, verbose: false })
      html5ScannerRef.current = instance
      await instance.start(
        { facingMode: 'environment' },
        { fps: FALLBACK_FPS, qrbox: { width: 280, height: 140 }, aspectRatio: 1.7 },
        (decodedText: string) => { if (scanningRef.current && mountedRef.current) handleDecode(decodedText) },
        () => {}
      )
      scanningRef.current = true
    } catch {
      setError("Kamera ochilmadi. Ruxsat berilganini tekshiring yoki quyida qo'lda kiriting.")
    }
  }, [handleDecode])

  // ─── Start camera ─────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(getCameraConstraints())
      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return }
      streamRef.current = stream
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()

      const track = stream.getVideoTracks()[0]
      if (track) {
        const capabilities = track.getCapabilities?.() as any
        if (capabilities?.torch) setTorchSupported(true)
      }

      const detector = new BarcodeDetector({ formats: NATIVE_FORMATS })
      startNativeScanning(detector)
    } catch {
      setError("Kamera ochilmadi. Ruxsat berilganini tekshiring yoki quyida qo'lda kiriting.")
    }
  }, [startNativeScanning])

  // ─── Effect ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return
    mountedRef.current = true
    setError(null)
    setScanSuccess(false)
    lastCodeRef.current = ''

    const useNative = hasNativeBarcodeDetector()
    setUsingNative(useNative)

    const timer = setTimeout(() => {
      if (mountedRef.current) useNative ? startCamera() : startFallbackScanning()
    }, 100)

    return () => { clearTimeout(timer); mountedRef.current = false; stopCamera() }
  }, [open, startCamera, startFallbackScanning, stopCamera])

  if (!open) return null

  const todayScans = user ? getTodayScans(user) : 0
  const remaining = user ? getRemainingScans(user) : FREE_SCAN_LIMIT
  const isPro = user ? isProActive(user) : false

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 text-white z-10">
        <div className="flex items-center gap-2">
          <div className="font-display font-bold text-base">📷 Scan</div>
          {/* Session counter badge */}
          <div className="bg-white/15 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
            {sessionCount} ta
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {torchSupported && (
            <button
              onClick={toggleTorch}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${torchOn ? 'bg-yellow-400 text-black' : 'bg-white/15'}`}
              aria-label="Flash"
            >
              {torchOn ? <Flashlight size={14} /> : <FlashlightOff size={14} />}
            </button>
          )}
          <button
            onClick={() => setContinuous(c => !c)}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold border transition-colors ${
              continuous ? 'bg-primary border-primary text-white' : 'bg-white/10 border-white/25 text-white/80'
            }`}
          >
            {continuous ? <Zap size={12} /> : <ZapOff size={12} />}
            Uzluksiz
          </button>
          <button
            onClick={() => { stopCamera(); onClose() }}
            className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center"
            aria-label="Yopish"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── Scan counter bar ─────────────────────────────────────────────── */}
      <div className="px-4 pb-2 flex items-center gap-2 text-white/80">
        <div className="flex-1 flex items-center gap-2 text-[11px]">
          <span>📊 Bugun: <b className="text-white">{todayScans}</b></span>
          <span className="text-white/30">|</span>
          {isPro ? (
            <span className="flex items-center gap-1"><Crown size={10} className="text-yellow-400" /> Pro</span>
          ) : (
            <span>Qoldi: <b className={remaining < 20 ? 'text-orange-400' : 'text-white'}>{remaining}</b></span>
          )}
        </div>
      </div>

      {/* ── Camera View ──────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {usingNative ? (
          <>
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : (
          <div id="scanlist-fallback-reader" className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />
        )}

        {/* Overlay with scan frame */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[78%] max-w-[320px] h-[140px] rounded-2xl border-[2.5px] transition-colors duration-200
            ${scanSuccess ? 'border-green-400' : 'border-white/80'}
            shadow-[0_0_0_2000px_rgba(0,0,0,0.55)]`}
          >
            <div className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-[3px] border-l-[3px] border-green-400 rounded-tl-xl" />
            <div className="absolute -top-[2px] -right-[2px] w-6 h-6 border-t-[3px] border-r-[3px] border-green-400 rounded-tr-xl" />
            <div className="absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-[3px] border-l-[3px] border-green-400 rounded-bl-xl" />
            <div className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-[3px] border-r-[3px] border-green-400 rounded-br-xl" />
            <div className={`absolute left-[8%] right-[8%] h-[2px] rounded-full
              ${scanSuccess ? 'bg-green-400 animate-none opacity-80' : 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-laser'}
              motion-reduce:animate-none`}
            />
            {scanSuccess && <div className="absolute inset-0 bg-green-400/15 rounded-2xl animate-pulse" />}
          </div>
        </div>

        {/* Instruction */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <span className="bg-black/60 text-white/90 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
            Barcode'ni ramka ichiga olib keling
          </span>
        </div>
      </div>

      {/* ── Scan History (last 5) ────────────────────────────────────────── */}
      {scanHistory.length > 0 && (
        <div className="px-4 py-2 max-h-[130px] overflow-y-auto space-y-1.5">
          {scanHistory.map((item, i) => (
            <div
              key={`${item.code}-${item.time}-${i}`}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs
                ${i === 0 ? 'animate-in' : ''}
                ${item.found
                  ? 'bg-white/90 dark:bg-white/10'
                  : 'bg-orange-50/90 dark:bg-orange-500/10 border border-orange-200/50'}
              `}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-ink dark:text-ink-dark truncate">{item.code}</span>
                  <span className="text-[10px] text-muted flex-shrink-0">{item.time}</span>
                </div>
                {item.found ? (
                  <span className="text-[10px] text-muted truncate block">
                    {item.name}{item.price != null && ` · ${item.price.toLocaleString('uz-UZ')} so'm`}
                  </span>
                ) : (
                  <span className="text-[10px] text-orange-600">Bazada topilmadi</span>
                )}
              </div>
              <span className={`ml-2 text-sm ${item.found ? 'text-primary' : 'text-orange-500'}`}>
                {item.found ? '✓' : '⚠'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && <div className="text-red-200 text-center text-sm px-6 pt-1">{error}</div>}

      {/* ── Manual input ─────────────────────────────────────────────────── */}
      <div className="px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 flex gap-2">
        <input
          value={manualValue}
          onChange={e => setManualValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && manualValue.trim()) {
              const code = manualValue.trim()
              const ok = scan(code)
              if (ok) {
                feedbackSuccess()
                const info = productDb[code]
                const preview: ScanPreview = { code, name: info?.name, price: info?.price, found: !!info, time: timeNow() }
                setScanHistory(prev => [preview, ...prev].slice(0, 5))
                setSessionCount(c => c + 1)
              }
              setManualValue('')
            }
          }}
          placeholder="yoki kodni qo'lda kiriting"
          inputMode="numeric"
          className="flex-1 bg-white/10 border border-white/25 text-white placeholder-white/50 rounded-xl px-3.5 py-3 font-mono text-sm outline-none focus:border-primary transition-colors"
        />
        <button
          onClick={() => {
            if (!manualValue.trim()) return
            const code = manualValue.trim()
            const ok = scan(code)
            if (ok) {
              feedbackSuccess()
              const info = productDb[code]
              const preview: ScanPreview = { code, name: info?.name, price: info?.price, found: !!info, time: timeNow() }
              setScanHistory(prev => [preview, ...prev].slice(0, 5))
              setSessionCount(c => c + 1)
            }
            setManualValue('')
          }}
          className="bg-primary text-white rounded-xl px-4 font-bold text-sm active:scale-95 transition-transform"
        >
          +
        </button>
      </div>
    </div>
  )
}
