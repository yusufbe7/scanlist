import { useRef, useState } from 'react'
import { X, Moon, Sun, Type, Database, CloudUpload, CloudOff, Trash2, Loader2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../hooks/useToast'
import { parseProductFile } from '../lib/productDb'
import { isSyncConfigured, pushListToCloud, pullListsFromCloud } from '../lib/supabaseClient'

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, toggleTheme, fontSize, setFontSize, productDb, productDbLoading, setProductDb, clearProductDb, activeList, lists } = useApp()
  const { show } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [syncing, setSyncing] = useState(false)
  const [parsing, setParsing] = useState(false)
  const productCount = Object.keys(productDb).length

  if (!open) return null

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParsing(true)
    try {
      const { db, count, sheets } = await parseProductFile(file)
      if (count === 0) {
        show("⚠️ Fayldan mahsulot topilmadi — ustun nomlarini tekshiring")
      } else {
        setProductDb(db, false)
        show(`✅ ${count.toLocaleString('uz-UZ')} ta mahsulot yuklandi (${sheets} varaq)`)
      }
    } catch (err) {
      console.error(err)
      show("❌ Faylni o'qib bo'lmadi")
    } finally {
      setParsing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleCloudPush() {
    setSyncing(true)
    const res = await pushListToCloud({ id: activeList.id, name: activeList.name, createdAt: activeList.createdAt, items: activeList.items })
    setSyncing(false)
    show(res.ok ? '☁️ Bulutga yuklandi' : `❌ ${res.error}`)
  }

  async function handleCloudPull() {
    setSyncing(true)
    const res = await pullListsFromCloud()
    setSyncing(false)
    show(res.ok ? `☁️ ${res.data?.length ?? 0} ta ro'yxat topildi (jurnalga qarang)` : `❌ ${res.error}`)
    if (res.ok) console.log("Bulutdagi ro'yxatlar:", res.data)
  }

  return (
    <div className="fixed inset-0 bg-black/45 z-[55] flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-surface-dark rounded-t-2xl sm:rounded-2xl w-full max-w-[440px] max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-border-dark sticky top-0 bg-white dark:bg-surface-dark">
          <h3 className="font-display font-bold text-base text-ink dark:text-ink-dark">Sozlamalar</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface dark:bg-black/20 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Theme */}
          <section>
            <h4 className="text-xs font-display font-bold uppercase tracking-wide text-muted mb-2.5">Ko'rinish</h4>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl px-4 py-3"
            >
              <span className="flex items-center gap-2.5 text-sm font-semibold text-ink dark:text-ink-dark">
                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                {theme === 'dark' ? 'Tungi rejim' : 'Kunduzgi rejim'}
              </span>
              <span className={`w-11 h-6 rounded-full relative transition ${theme === 'dark' ? 'bg-primary' : 'bg-border'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-[22px]' : 'left-0.5'}`} />
              </span>
            </button>
          </section>

          {/* Font size */}
          <section>
            <h4 className="text-xs font-display font-bold uppercase tracking-wide text-muted mb-2.5">Shrift o'lchami</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setFontSize('normal')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold border ${
                  fontSize === 'normal' ? 'bg-primary text-white border-primary' : 'bg-surface dark:bg-black/20 border-border dark:border-border-dark text-ink dark:text-ink-dark'
                }`}
              >
                <Type size={14} /> Oddiy
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-base font-semibold border ${
                  fontSize === 'large' ? 'bg-primary text-white border-primary' : 'bg-surface dark:bg-black/20 border-border dark:border-border-dark text-ink dark:text-ink-dark'
                }`}
              >
                <Type size={16} /> Katta
              </button>
            </div>
          </section>

          {/* Product DB */}
          <section>
            <h4 className="text-xs font-display font-bold uppercase tracking-wide text-muted mb-2.5">Mahsulot bazasi</h4>
            <div className="bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl p-4">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-ink dark:text-ink-dark mb-1">
                <Database size={16} />
                {productDbLoading
                  ? 'Yuklanmoqda...'
                  : productCount > 0
                  ? `${productCount.toLocaleString('uz-UZ')} ta mahsulot yuklangan`
                  : 'Baza yuklanmagan'}
              </div>
              <p className="text-xs text-muted mb-3">
                CSV yoki Excel fayl yuklang. Ustunlar avtomatik aniqlanadi: barcode/GTIN, tovar kodi (ixtiyoriy), nom, narx (ixtiyoriy) — lotin, o'zbek yoki rus tilida. Juda katta fayllar (yuz minglab qator) ham qo'llab-quvvatlanadi.
              </p>
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} disabled={parsing} />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={parsing}
                  className="flex-1 bg-primary text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {parsing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Fayl o'qilmoqda...
                    </>
                  ) : (
                    'Fayl yuklash'
                  )}
                </button>
                {productCount > 0 && !parsing && (
                  <button
                    onClick={() => {
                      clearProductDb()
                      show("Baza o'chirildi")
                    }}
                    className="w-10 rounded-lg border border-border dark:border-border-dark text-danger flex items-center justify-center"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Cloud sync */}
          <section>
            <h4 className="text-xs font-display font-bold uppercase tracking-wide text-muted mb-2.5">Bulutga sinxronizatsiya</h4>
            <div className="bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl p-4">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-ink dark:text-ink-dark mb-1">
                {isSyncConfigured ? <CloudUpload size={16} /> : <CloudOff size={16} />}
                {isSyncConfigured ? 'Sozlangan' : 'Sozlanmagan (Pro funksiya)'}
              </div>
              {isSyncConfigured ? (
                <>
                  <p className="text-xs text-muted mb-3">Joriy ro'yxatni ("{activeList.name}") bulutga yuklang yoki jamoa ro'yxatlarini torting.</p>
                  <div className="flex gap-2">
                    <button onClick={handleCloudPush} disabled={syncing} className="flex-1 bg-primary text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5">
                      {syncing ? <Loader2 size={13} className="animate-spin" /> : null} Yuklash
                    </button>
                    <button onClick={handleCloudPull} disabled={syncing} className="flex-1 bg-white dark:bg-transparent border border-border dark:border-border-dark rounded-lg py-2 text-xs font-semibold text-ink dark:text-ink-dark">
                      Tortib olish
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted">
                  Bir nechta xodim bitta ro'yxatga birgalikda scan qilishi uchun <span className="font-mono">.env</span> fayliga{' '}
                  <span className="font-mono">VITE_SUPABASE_URL</span> va <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> qo'shing. Batafsil — README.md.
                </p>
              )}
            </div>
          </section>

          <p className="text-[11px] text-muted text-center pt-1">{lists.length} ta ro'yxat · Barcha ma'lumot qurilmangizda saqlanadi</p>
        </div>
      </div>
    </div>
  )
}
