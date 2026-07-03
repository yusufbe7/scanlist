import { useRef, useState } from 'react'
import { X, Moon, Sun, Type, Database, CloudUpload, CloudOff, Trash2, Loader2, Volume2, VolumeX, Shield, Crown, User } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../hooks/useToast'
import { parseProductFile } from '../lib/productDb'
import { isSyncConfigured, pushListToCloud, pullListsFromCloud } from '../lib/supabaseClient'
import { isProActive, getRemainingScans, FREE_SCAN_LIMIT } from '../lib/userManager'

interface Props { open: boolean; onClose: () => void; onOpenAdmin: () => void }

export function SettingsSheet({ open, onClose, onOpenAdmin }: Props) {
  const { theme, toggleTheme, fontSize, setFontSize, productDb, setProductDb, clearProductDb, activeList, lists, settings, setVolume, user } = useApp()
  const { show } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [syncing, setSyncing] = useState(false)
  const productCount = Object.keys(productDb).length
  if (!open) return null
  const isPro = user ? isProActive(user) : false
  const remaining = user ? getRemainingScans(user) : FREE_SCAN_LIMIT

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try { const { db, count } = await parseProductFile(file); setProductDb(db, false); show(`✅ ${count} ta mahsulot yuklandi`) }
    catch { show("❌ Faylni o'qib bo'lmadi") }
    if (fileRef.current) fileRef.current.value = ''
  }
  async function handleCloudPush() {
    setSyncing(true)
    const res = await pushListToCloud({ id: activeList.id, name: activeList.name, createdAt: activeList.createdAt, items: activeList.items })
    setSyncing(false); show(res.ok ? '☁️ Yuklandi' : `❌ ${res.error}`)
  }
  async function handleCloudPull() {
    setSyncing(true)
    const res = await pullListsFromCloud()
    setSyncing(false); show(res.ok ? `☁️ ${res.data?.length ?? 0} ta topildi` : `❌ ${res.error}`)
  }

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[55] flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-ink rounded-t-3xl sm:rounded-3xl w-full max-w-[440px] max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-border-dark sticky top-0 bg-white dark:bg-ink z-10">
          <h3 className="font-display font-bold text-base text-ink dark:text-ink-dark">Sozlamalar</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface dark:bg-white/10 flex items-center justify-center"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-5">
          {user && (
            <section className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><User size={18} className="text-primary" /></div>
                  <div><div className="font-semibold text-sm text-ink dark:text-ink-dark">{user.name}</div><div className="font-mono text-[10px] text-muted">{user.id}</div></div>
                </div>
                {isPro ? (<div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-500/10 px-2.5 py-1 rounded-full"><Crown size={12} className="text-yellow-500" /><span className="text-[11px] font-bold text-yellow-700 dark:text-yellow-400">PRO</span></div>)
                  : (<div className="text-[11px] text-muted">{remaining}/{FREE_SCAN_LIMIT} qoldi</div>)}
              </div>
            </section>
          )}
          <section>
            <h4 className="text-xs font-display font-bold uppercase tracking-wide text-muted mb-2.5">Ovoz balandligi</h4>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setVolume(settings.volume > 0 ? 0 : 80)} className="w-9 h-9 rounded-lg bg-surface dark:bg-white/10 flex items-center justify-center">
                  {settings.volume === 0 ? <VolumeX size={16} className="text-muted" /> : <Volume2 size={16} className="text-primary" />}
                </button>
                <input type="range" min="0" max="100" value={settings.volume} onChange={e => setVolume(Number(e.target.value))} className="flex-1 h-2 rounded-full appearance-none bg-border dark:bg-border-dark [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md" />
                <span className="text-sm font-mono font-bold text-ink dark:text-ink-dark w-10 text-right">{settings.volume}%</span>
              </div>
            </div>
          </section>
          <section>
            <h4 className="text-xs font-display font-bold uppercase tracking-wide text-muted mb-2.5">Ko'rinish</h4>
            <button onClick={toggleTheme} className="w-full flex items-center justify-between glass rounded-xl px-4 py-3">
              <span className="flex items-center gap-2.5 text-sm font-semibold text-ink dark:text-ink-dark">{theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}{theme === 'dark' ? ' Tungi rejim' : ' Kunduzgi rejim'}</span>
              <span className={`w-11 h-6 rounded-full relative transition ${theme === 'dark' ? 'bg-primary' : 'bg-border'}`}><span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow ${theme === 'dark' ? 'left-[22px]' : 'left-0.5'}`} /></span>
            </button>
          </section>
          <section>
            <h4 className="text-xs font-display font-bold uppercase tracking-wide text-muted mb-2.5">Shrift</h4>
            <div className="flex gap-2">
              <button onClick={() => setFontSize('normal')} className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold border ${fontSize === 'normal' ? 'bg-primary text-white border-primary' : 'glass border-border text-ink dark:text-ink-dark'}`}><Type size={14} />Oddiy</button>
              <button onClick={() => setFontSize('large')} className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-base font-semibold border ${fontSize === 'large' ? 'bg-primary text-white border-primary' : 'glass border-border text-ink dark:text-ink-dark'}`}><Type size={16} />Katta</button>
            </div>
          </section>
          <section>
            <h4 className="text-xs font-display font-bold uppercase tracking-wide text-muted mb-2.5">Mahsulot bazasi</h4>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-ink dark:text-ink-dark mb-1"><Database size={16} />{productCount > 0 ? `${productCount} ta mahsulot` : 'Baza yuklanmagan'}</div>
              <p className="text-xs text-muted mb-3">CSV/Excel: barcode, name, price. Offline ishlaydi.</p>
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
                <button onClick={() => fileRef.current?.click()} className="flex-1 bg-primary text-white rounded-lg py-2 text-xs font-semibold">Fayl yuklash</button>
                {productCount > 0 && <button onClick={() => { clearProductDb(); show("O'chirildi") }} className="w-10 rounded-lg border border-border text-danger flex items-center justify-center"><Trash2 size={14} /></button>}
              </div>
            </div>
          </section>
          <section>
            <h4 className="text-xs font-display font-bold uppercase tracking-wide text-muted mb-2.5">Bulut</h4>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-ink-dark mb-1">{isSyncConfigured ? <CloudUpload size={16} /> : <CloudOff size={16} />}{isSyncConfigured ? ' Sozlangan' : ' Sozlanmagan (Pro)'}</div>
              {isSyncConfigured ? (<div className="flex gap-2 mt-2"><button onClick={handleCloudPush} disabled={syncing} className="flex-1 bg-primary text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1">{syncing && <Loader2 size={12} className="animate-spin" />}Yuklash</button><button onClick={handleCloudPull} disabled={syncing} className="flex-1 glass border border-border rounded-lg py-2 text-xs font-semibold">Tortish</button></div>) : <p className="text-xs text-muted">Pro rejim bilan mavjud.</p>}
            </div>
          </section>
          <button onClick={() => { onClose(); onOpenAdmin() }} className="w-full flex items-center justify-center gap-2 glass border border-border dark:border-border-dark rounded-xl py-3 text-sm font-semibold text-ink dark:text-ink-dark"><Shield size={15} className="text-muted" />Admin Panel</button>
          <p className="text-[11px] text-muted text-center">{lists.length} ta ro'yxat · Ma'lumot qurilmada saqlanadi</p>
        </div>
      </div>
    </div>
  )
}
