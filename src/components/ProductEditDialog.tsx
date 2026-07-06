import { useState, useEffect } from 'react'
import { X, Tag } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../hooks/useToast'

export function ProductEditDialog({ code, onClose }: { code: string | null; onClose: () => void }) {
  const { productDb, setSingleProduct } = useApp()
  const { show } = useToast()
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [price, setPrice] = useState('')

  useEffect(() => {
    if (code) {
      const info = productDb[code]
      setName(info?.name ?? '')
      setSku(info?.sku ?? '')
      setPrice(info?.price != null ? String(info.price) : '')
    }
  }, [code, productDb])

  if (!code) return null

  function save() {
    if (!name.trim() || !code) {
      show('Mahsulot nomini kiriting')
      return
    }
    setSingleProduct(code, { name: name.trim(), sku: sku.trim() || undefined, price: price.trim() ? Number(price) : undefined })
    show('🏷 Saqlandi')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/45 z-[65] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="bg-white dark:bg-surface-dark rounded-t-2xl sm:rounded-2xl w-full max-w-[400px] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-display font-bold text-base text-ink dark:text-ink-dark">
            <Tag size={17} className="text-primary" /> Mahsulot ma'lumoti
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface dark:bg-black/20 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <p className="font-mono text-sm text-muted mb-4">{code}</p>

        <label className="block text-xs font-semibold text-muted mb-1.5">Mahsulot nomi</label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="masalan: Coca-Cola 1L"
          className="w-full bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl px-3.5 py-2.5 text-sm outline-none mb-3.5 focus:border-primary"
        />

        <label className="block text-xs font-semibold text-muted mb-1.5">Tovar kodi (ixtiyoriy)</label>
        <input
          value={sku}
          onChange={e => setSku(e.target.value)}
          placeholder="masalan: 1000116471"
          className="w-full bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl px-3.5 py-2.5 text-sm font-mono outline-none mb-3.5 focus:border-primary"
        />

        <label className="block text-xs font-semibold text-muted mb-1.5">Narxi, so'm (ixtiyoriy)</label>
        <input
          value={price}
          onChange={e => setPrice(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="masalan: 18500"
          inputMode="numeric"
          onKeyDown={e => e.key === 'Enter' && save()}
          className="w-full bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl px-3.5 py-2.5 text-sm outline-none mb-5 focus:border-primary"
        />

        <button onClick={save} className="w-full bg-primary text-white rounded-xl py-3 font-bold text-sm">
          Saqlash
        </button>
      </div>
    </div>
  )
}
