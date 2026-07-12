import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library'
import { X, Zap, ZapOff, Flashlight, FlashlightOff, Tag } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { vibrate, beep } from '../lib/feedback'
import { ProductEditDialog } from './ProductEditDialog'
import { consumeScanCredit } from '../lib/creditService'
import { PaywallDialog } from './credits/PaywallDialog'

// ---------------------------------------------------------------------------
// Tunable constants — har biri texnik topshiriqdagi bosqichlarga mos keladi.
// ---------------------------------------------------------------------------

// Bosqich 2: faqat kerakli 1D formatlar. QR Code ATAYIN yo'q — supermarket
// mahsulotlarida ishlatilmaydi va uni qidirish decoder'ni sekinlashtiradi.
const SCAN_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128
]

const PAUSE_AFTER_SUCCESS_MS = 150 // Bosqich 5: 700ms emas, 150ms
const DUPLICATE_WINDOW_MS = 2000 // Bosqich 12: bir xil kod 2s ichida qayta qabul qilinmaydi
const AUTO_TORCH_DARK_THRESHOLD = 55 // 0-255 o'rtacha yorqinlik shundan past -> fonar yonadi
const AUTO_TORCH_LIGHT_THRESHOLD = 90 // gisterezis: shundan yuqori -> fonar o'chadi
const AUTO_TORCH_SAMPLE_MS = 700
const READER_ID = 'scanlist-reader'

// @zxing/browser's IScannerControls types trackFilter as `(track) => MediaStreamTrack[]`,
// but the actual runtime implementation calls `.find()`/`.filter()` with it as a plain
// predicate `(track) => boolean`. The .d.ts is wrong; this cast matches real behavior.
const ALL_TRACKS = (() => true) as unknown as (track: MediaStreamTrack) => MediaStreamTrack[]

const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

// Bosqich 11: Safari/iOS kamerasi 30fps'da barqaror ishlaydi, Android 60fps'ni
// ko'taradi (haqiqiy qiymat qurilma tomonidan "ideal" sifatida qabul qilinadi).
const TARGET_FPS = isIOS ? 30 : 60

// Wide, short box — barcode proporsiyasiga mos. Kattaroq box decoder'ga
// yuqori piksellli kadr beradi — bu tezlik va aniqlikni oshiradi (ayniqsa
// past yorug'likda telefon kameralarida).
function computeBoxSize() {
  const width = Math.min(320, window.innerWidth - 40)
  return { width, height: 90 }
}

export function ScannerModal({
  open,
  onClose,
  onNeedCredits
}: {
  open: boolean
  onClose: () => void
  onNeedCredits: () => void
}) {
  const { scan, productDb } = useApp()
  const [continuous, setContinuous] = useState(true)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualValue, setManualValue] = useState('')
  const [lastPreview, setLastPreview] = useState<{ code: string; name?: string; sku?: string; price?: number } | null>(null)
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [quickEditCode, setQuickEditCode] = useState<string | null>(null)
  const [boxSize, setBoxSize] = useState(() => computeBoxSize())
  const [flash, setFlash] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const pausedRef = useRef(false)
  const continuousRef = useRef(continuous)
  const lastSeenRef = useRef<Map<string, number>>(new Map())
  const manualTorchRef = useRef(false) // true bo'lsa foydalanuvchi qo'lda o'zgartirgan — avto-fonar aralashmaydi
  const torchOnRef = useRef(false)
  const autoTorchIntervalRef = useRef<number | null>(null)
  const flashTimeoutRef = useRef<number | null>(null)

  continuousRef.current = continuous

  useEffect(() => {
    if (!open) return
    setError(null)
    setLastPreview(null)
    setTorchOn(false)
    setTorchSupported(false)
    torchOnRef.current = false
    manualTorchRef.current = false
    lastSeenRef.current.clear()

    let active = true
    const box = computeBoxSize()
    setBoxSize(box)

    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, SCAN_FORMATS)

    const reader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanSuccess: PAUSE_AFTER_SUCCESS_MS,
      // Bosqich 14: muvaffaqiyatsiz urinishlar orasida deyarli kutmaydi —
      // shu tufayli barcode odatda 100-300ms ichida topiladi.
      delayBetweenScanAttempts: 0
    })

    function triggerFlash() {
      setFlash(true)
      if (flashTimeoutRef.current) window.clearTimeout(flashTimeoutRef.current)
      flashTimeoutRef.current = window.setTimeout(() => setFlash(false), 320)
    }

    function startAutoTorch(controls: IScannerControls) {
      // Bosqich 8: qorong'i joyda fonar avtomatik yonadi. Brauzerlarda ambient
      // light sensor API ishonchli emas, shu sababli video kadrning o'rtacha
      // yorqinligini kichik canvas orqali o'lchaymiz (gisterezis bilan, tez-tez
      // yonib-o'chib turmasligi uchun).
      const canvas = document.createElement('canvas')
      canvas.width = 24
      canvas.height = 24
      const ctx = canvas.getContext('2d', { willReadFrequently: true } as CanvasRenderingContext2DSettings)

      autoTorchIntervalRef.current = window.setInterval(() => {
        if (manualTorchRef.current || !active || !ctx || !videoRef.current) return
        const video = videoRef.current
        if (video.readyState < 2) return
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
          let sum = 0
          for (let i = 0; i < data.length; i += 4) {
            sum += (data[i] + data[i + 1] + data[i + 2]) / 3
          }
          const avg = sum / (data.length / 4)
          if (!torchOnRef.current && avg < AUTO_TORCH_DARK_THRESHOLD) {
            torchOnRef.current = true
            setTorchOn(true)
            controls.switchTorch?.(true).catch(() => {})
          } else if (torchOnRef.current && avg > AUTO_TORCH_LIGHT_THRESHOLD) {
            torchOnRef.current = false
            setTorchOn(false)
            controls.switchTorch?.(false).catch(() => {})
          }
        } catch {
          /* ba'zi brauzerlarda video kadrini canvas'ga chizish cheklangan bo'lishi mumkin */
        }
      }, AUTO_TORCH_SAMPLE_MS)
    }

    async function run() {
      try {
        const controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: 'environment' },
              // Bosqich 7: 720p — 1080p va 4K SO'RALMAYDI. Kamera fayllari
              // kattaroq bo'lsa decode sekinlashadi va batareya tezroq tugaydi.
              width: { ideal: 1280, max: 1280 },
              height: { ideal: 720, max: 720 },
              frameRate: { ideal: TARGET_FPS, max: TARGET_FPS }
            }
          },
          videoRef.current ?? undefined,
          (result, err, ctl) => {
            if (!active) return
            if (result) {
              const text = result.getText()
              const now = Date.now()
              const lastSeen = lastSeenRef.current.get(text)
              if (lastSeen && now - lastSeen < DUPLICATE_WINDOW_MS) return
              lastSeenRef.current.set(text, now)
              // Xotira o'sib ketmasligi uchun eski yozuvlarni tozalaymiz
              if (lastSeenRef.current.size > 200) {
                const cutoff = now - DUPLICATE_WINDOW_MS * 4
                for (const [code, ts] of lastSeenRef.current) {
                  if (ts < cutoff) lastSeenRef.current.delete(code)
                }
              }

              if (pausedRef.current) return
              pausedRef.current = true

              consumeScanCredit().then(credit => {
                if (!active) return
                if (!credit.allowed) {
                  pausedRef.current = false
                  setPaywallOpen(true)
                  return
                }

                vibrate()
                beep()
                triggerFlash()
                scan(text)
                const info = productDb[text]
                setLastPreview({ code: text, name: info?.name, sku: info?.sku, price: info?.price })

                window.setTimeout(() => {
                  pausedRef.current = false
                  if (!continuousRef.current) {
                    ctl.stop()
                    onClose()
                  }
                }, PAUSE_AFTER_SUCCESS_MS)
              })
            } else if (err && !(err instanceof NotFoundException)) {
              // NotFoundException — har bir "kod topilmadi" kadrida normal holat.
              // Boshqa (kutilmagan) xatolarni jim o'tkazamiz, chunki decode loop
              // davom etishi kerak.
            }
          }
        )

        if (!active) {
          controls.stop()
          return
        }
        controlsRef.current = controls

        // Torch qo'llab-quvvatlanishini ZXing o'zi avtomatik aniqlaydi
        const hasTorch = typeof controls.switchTorch === 'function'
        setTorchSupported(hasTorch)

        // Bosqich 3: avtomatik zoom (qurilma qo'llab-quvvatlasa) — barcode
        // kattaroq va aniqroq ko'rinadi.
        try {
          const caps = controls.streamVideoCapabilitiesGet?.(ALL_TRACKS) as
            | (MediaTrackCapabilities & { zoom?: { min: number; max: number } })
            | undefined
          if (caps?.zoom) {
            const targetZoom = Math.min(2, caps.zoom.max)
            await controls.streamVideoConstraintsApply?.(
              { advanced: [{ zoom: targetZoom } as unknown as MediaTrackConstraintSet] },
              ALL_TRACKS
            )
          }
        } catch {
          /* zoom qo'llab-quvvatlanmasa jim o'tkazamiz */
        }

        // Bosqich 15: qo'llab-quvvatlansa auto-focus / auto-exposure /
        // auto-white-balance rejimlarini aniq yoqamiz (ko'p qurilmalarda bu
        // allaqachon standart, lekin ayrimlarida aniq so'rash kerak bo'ladi).
        try {
          await controls.streamVideoConstraintsApply?.(
            {
              advanced: [
                { focusMode: 'continuous' } as unknown as MediaTrackConstraintSet,
                { exposureMode: 'continuous' } as unknown as MediaTrackConstraintSet,
                { whiteBalanceMode: 'continuous' } as unknown as MediaTrackConstraintSet
              ]
            },
            ALL_TRACKS
          )
        } catch {
          /* Safari kabi brauzerlar buni qo'llamaydi — bu xato emas */
        }

        // Bosqich 8: qorong'i joyda fonarni avtomatik yoqish
        if (hasTorch) {
          startAutoTorch(controls)
        }
      } catch {
        if (active) setError("Kamera ochilmadi. Ruxsat berilganini tekshiring yoki quyida qo'lda kiriting.")
      }
    }

    run()

    return () => {
      active = false
      if (autoTorchIntervalRef.current) window.clearInterval(autoTorchIntervalRef.current)
      if (flashTimeoutRef.current) window.clearTimeout(flashTimeoutRef.current)
      controlsRef.current?.stop()
      controlsRef.current = null
    }
  }, [open])

  async function submitManualCode(code: string) {
    const credit = await consumeScanCredit()
    if (!credit.allowed) {
      setPaywallOpen(true)
      return
    }
    scan(code)
    vibrate()
    setManualValue('')
  }

  async function toggleTorch() {
    if (!controlsRef.current || !torchSupported) return
    manualTorchRef.current = true // avto-fonar bu sessiyada endi aralashmaydi
    try {
      const next = !torchOn
      await controlsRef.current.switchTorch?.(next)
      torchOnRef.current = next
      setTorchOn(next)
    } catch {
      /* torch almashtirish muvaffaqiyatsiz bo'lsa jim o'tkazamiz — hamma qurilma qo'llamaydi */
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

      <div className="flex-1 relative overflow-hidden" id={READER_ID}>
        {/* Video elementini biz o'zimiz boshqaramiz va CSS o'lchami hech qachon
            kutubxona tomonidan o'zgartirilmaydi — shu sababli oldingi
            "skanerlashda kadr kichrayib ketishi" muammosi endi umuman bo'lmaydi. */}
        <video ref={videoRef} muted playsInline autoPlay className="w-full h-full object-contain" />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-[2.5px] rounded-2xl pointer-events-none shadow-[0_0_0_2000px_rgba(0,0,0,0.45)] overflow-hidden ${
            flash ? 'border-emerald-400 animate-scanFlash' : 'border-primary'
          }`}
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
        {torchSupported === false && !error && " · Qorong'i joyda fonar tugmasi ko'rinmasa, telefon kamerasi torch'ni qo'llab-quvvatlamaydi"}
      </div>

      <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex gap-2">
        <input
          value={manualValue}
          onChange={e => setManualValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && manualValue.trim()) {
              submitManualCode(manualValue.trim())
            }
          }}
          placeholder="yoki kodni qo'lda kiriting"
          inputMode="numeric"
          className="flex-1 bg-white/10 border border-white/25 text-white placeholder-white/50 rounded-[10px] px-3.5 py-3 font-mono text-sm outline-none"
        />
        <button
          onClick={() => {
            if (!manualValue.trim()) return
            submitManualCode(manualValue.trim())
          }}
          className="bg-primary text-white rounded-[10px] px-4 font-bold"
        >
          Qo'shish
        </button>
      </div>

      <ProductEditDialog code={quickEditCode} onClose={() => setQuickEditCode(null)} />
      <PaywallDialog
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onBuyCredits={() => {
          setPaywallOpen(false)
          onClose()
          onNeedCredits()
        }}
      />
    </div>
  )
}
