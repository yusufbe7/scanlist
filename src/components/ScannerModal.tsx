import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X, Zap, ZapOff, Flashlight, FlashlightOff, Tag } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { vibrate, beep } from '../lib/feedback'
import { ProductEditDialog } from './ProductEditDialog'

const SCAN_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
]

const READER_ID = 'scanlist-reader'
const PAUSE_MS = 150

// Wide, short box — matches barcode proportions. A bigger box gives the
// decoder a higher-resolution crop to work with, which noticeably improves
// speed and accuracy on phone cameras (especially in low light).
function computeBoxSize() {
  const width = Math.min(320, window.innerWidth - 40)
  return {
    width,
    height: 90
  }
}

export function ScannerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { scan, productDb } = useApp()
  const [continuous, setContinuous] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [manualValue, setManualValue] = useState('')
  const [lastPreview, setLastPreview] = useState<{ code: string; name?: string; sku?: string; price?: number } | null>(null)
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [quickEditCode, setQuickEditCode] = useState<string | null>(null)
  const [boxSize, setBoxSize] = useState(() => computeBoxSize())
  const lastCodeRef = useRef('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const pausedRef = useRef(false)
  const continuousRef = useRef(continuous)
  continuousRef.current = continuous

  useEffect(() => {
    if (!open) return
    setError(null)
    setLastPreview(null)
    setTorchOn(false)
    setTorchSupported(false)

    let active = true
    const box = computeBoxSize()
    setBoxSize(box)
    const instance = new Html5Qrcode(READER_ID, {
      formatsToSupport: SCAN_FORMATS,
      useBarCodeDetectorIfSupported: true,
      verbose: false
    })
    scannerRef.current = instance

    async function run() {
      try {
        await instance.start(
          { facingMode: 'environment' },
      {
    fps: 30,
    qrbox: box,
    disableFlip: true,
    aspectRatio: 1.7778, // 16:9
   videoConstraints: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1280 },
    height: { ideal: 720 }
}
},
          decodedText => {
            if (lastCodeRef.current === decodedText) return
            lastCodeRef.current = decodedText
            if (pausedRef.current || !active) return
            pausedRef.current = true
            vibrate()
            beep()
            scan(decodedText)
            const info = productDb[decodedText]
            setLastPreview({ code: decodedText, name: info?.name, sku: info?.sku, price: info?.price })

            setTimeout(() => {
              pausedRef.current = false
              if (!continuousRef.current) {
                onClose()
              }
            }, PAUSE_MS)
          },
          () => {}
        )

        try {
  await instance.applyVideoConstraints({
    advanced: [
      {
        zoom: 2
      } as unknown as MediaTrackConstraintSet
    ]
  })
} catch {}

        if (!active) {
          // Component was closed while the camera was still starting up —
          // shut it down immediately instead of leaving it running.
          await instance.stop().catch(() => {})
          instance.clear()
          return
        }

        try {
          const caps = instance.getRunningTrackCameraCapabilities()
          const torch = caps.torchFeature()
          setTorchSupported(torch.isSupported())
        } catch {
          setTorchSupported(false)
        }
      } catch {
        if (active) setError("Kamera ochilmadi. Ruxsat berilganini tekshiring yoki quyida qo'lda kiriting.")
      }
    }

    run()

    return () => {
      active = false
      const instance2 = scannerRef.current
      scannerRef.current = null
      if (instance2) {
        instance2
          .stop()
          .then(() => instance2.clear())
          .catch(() => {})
      }
    }
  }, [open])

  async function toggleTorch() {
    if (!scannerRef.current || !torchSupported) return
    try {
      const next = !torchOn
      await scannerRef.current.applyVideoConstraints({ advanced: [{ torch: next } as unknown as MediaTrackConstraintSet] })
      setTorchOn(next)
    } catch {
      /* torch toggle failed silently — not all devices honor it mid-stream */
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 text-white">
        <div className="font-display font-bold text-base">📷 Barcode scan</div>
        <div className="flex items-center gap-2">
          {torchSupported && (
            <button
              onClick={toggleTorch}
              className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                torchOn ? 'bg-primary border-primary' : 'bg-white/10 border-white/25'
              }`}
              aria-label="Fonar"
            >
              {torchOn ? <Flashlight size={16} /> : <FlashlightOff size={16} />}
            </button>
          )}
          <button
            onClick={() => setContinuous(c => !c)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border ${
              continuous ? 'bg-primary border-primary' : 'bg-white/10 border-white/25'
            }`}
          >
            {continuous ? <Zap size={13} /> : <ZapOff size={13} />}
            Uzluksiz
          </button>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center" aria-label="Yopish">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div id={READER_ID} className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-[2.5px] border-primary rounded-2xl pointer-events-none shadow-[0_0_0_2000px_rgba(0,0,0,0.45)] overflow-hidden"
          style={{ width: boxSize.width, height: boxSize.height }}
        >
          <div className="absolute left-[6%] right-[6%] h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-laser motion-reduce:animate-none" />
        </div>
      </div>

      {lastPreview && (
        <div className="mx-4 mb-2 bg-white/95 rounded-xl px-4 py-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="font-mono font-bold text-sm text-ink">{lastPreview.code}</div>
            {lastPreview.name ? (
              <div className="text-xs text-muted mt-0.5 truncate">
                {lastPreview.sku && <span className="font-mono">{lastPreview.sku}</span>}
                {lastPreview.sku && ' · '}
                {lastPreview.name}
                {lastPreview.price != null && ` — ${lastPreview.price.toLocaleString('uz-UZ')} so'm`}
              </div>
            ) : (
              <div className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">⚠️ Bazada topilmadi</div>
            )}
          </div>
          {!lastPreview.name && (
            <button
              onClick={() => setQuickEditCode(lastPreview.code)}
              className="shrink-0 flex items-center gap-1 bg-primary text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold"
            >
              <Tag size={12} /> Qo'shish
            </button>
          )}
          {lastPreview.name && <span className="text-primary text-xl shrink-0">✔</span>}
        </div>
      )}

      {error && <div className="text-red-200 text-center text-sm px-6 pt-1">{error}</div>}

      <div className="text-white/85 text-center text-[13px] px-6 pb-3">
        {continuous ? "Uzluksiz rejim: bir necha kodni ketma-ket scan qiling" : "Barcode'ni ramka ichiga tuting"}
        {torchSupported === false && !error && ' · Qorong\'i joyda fonar tugmasi ko\'rinmasa, telefon kamerasi torch\'ni qo\'llab-quvvatlamaydi'}
      </div>

      <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex gap-2">
        <input
          value={manualValue}
          onChange={e => setManualValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && manualValue.trim()) {
              scan(manualValue.trim())
              vibrate()
              setManualValue('')
            }
          }}
          placeholder="yoki kodni qo'lda kiriting"
          inputMode="numeric"
          className="flex-1 bg-white/10 border border-white/25 text-white placeholder-white/50 rounded-[10px] px-3.5 py-3 font-mono text-sm outline-none"
        />
        <button
          onClick={() => {
            if (!manualValue.trim()) return
            scan(manualValue.trim())
            vibrate()
            setManualValue('')
          }}
          className="bg-primary text-white rounded-[10px] px-4 font-bold"
        >
          Qo'shish
        </button>
      </div>

      <ProductEditDialog code={quickEditCode} onClose={() => setQuickEditCode(null)} />
    </div>
  )
}
