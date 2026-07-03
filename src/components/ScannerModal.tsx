import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X, Zap, ZapOff } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { vibrate, beep } from '../lib/feedback'

const SCAN_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.QR_CODE
]

const READER_ID = 'scanlist-reader'
const PAUSE_MS = 1000

export function ScannerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { scan, productDb } = useApp()
  const [continuous, setContinuous] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [manualValue, setManualValue] = useState('')
  const [lastPreview, setLastPreview] = useState<{ code: string; name?: string; price?: number } | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const pausedRef = useRef(false)
  const continuousRef = useRef(continuous)
  continuousRef.current = continuous

  useEffect(() => {
    if (!open) return
    setError(null)
    setLastPreview(null)
    let cancelled = false
    const instance = new Html5Qrcode(READER_ID, { formatsToSupport: SCAN_FORMATS, verbose: false })
    scannerRef.current = instance

    instance
      .start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: { width: 270, height: 130 } },
        decodedText => {
          if (pausedRef.current || cancelled) return
          pausedRef.current = true
          vibrate()
          beep()
          scan(decodedText)
          const info = productDb[decodedText]
          setLastPreview({ code: decodedText, name: info?.name, price: info?.price })

          setTimeout(() => {
            pausedRef.current = false
            if (!continuousRef.current && scannerRef.current) {
              scannerRef.current
                .stop()
                .then(() => scannerRef.current?.clear())
                .catch(() => {})
              onClose()
            }
          }, PAUSE_MS)
        },
        () => {}
      )
      .catch(() => {
        if (!cancelled) setError("Kamera ochilmadi. Ruxsat berilganini tekshiring yoki quyida qo'lda kiriting.")
      })

    return () => {
      cancelled = true
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {})
        scannerRef.current = null
      }
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 text-white">
        <div className="font-display font-bold text-base">📷 Barcode scan</div>
        <div className="flex items-center gap-2">
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-[320px] h-[130px] border-[2.5px] border-primary rounded-2xl pointer-events-none shadow-[0_0_0_2000px_rgba(0,0,0,0.45)] overflow-hidden">
          <div className="absolute left-[6%] right-[6%] h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-laser motion-reduce:animate-none" />
        </div>
      </div>

      {lastPreview && (
        <div className="mx-4 mb-2 bg-white/95 rounded-xl px-4 py-3 flex items-center justify-between animate-in">
          <div>
            <div className="font-mono font-bold text-sm text-ink">{lastPreview.code}</div>
            {lastPreview.name ? (
              <div className="text-xs text-muted mt-0.5">
                {lastPreview.name}
                {lastPreview.price != null && ` — ${lastPreview.price.toLocaleString('uz-UZ')} so'm`}
              </div>
            ) : (
              <div className="text-xs text-muted mt-0.5">Mahsulot bazasida topilmadi</div>
            )}
          </div>
          <span className="text-primary text-xl">✔</span>
        </div>
      )}

      {error && <div className="text-red-200 text-center text-sm px-6 pt-1">{error}</div>}

      <div className="text-white/85 text-center text-[13px] px-6 pb-3">
        {continuous ? "Uzluksiz rejim: bir necha kodni ketma-ket scan qiling" : "Barcode'ni ramka ichiga tuting"}
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
    </div>
  )
}
