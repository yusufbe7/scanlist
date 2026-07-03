import { useMemo, useState } from 'react'
import { Search, Pencil, Trash2, PackageSearch } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../hooks/useToast'

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

export function ItemList() {
  const { activeList, productDb, updateItem, deleteItem } = useApp()
  const { show } = useToast()
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const filtered = useMemo(() => {
    const items = query.trim() ? activeList.items.filter(i => i.code.includes(query.trim())) : activeList.items
    return [...items].reverse()
  }, [activeList.items, query])

  function startEdit(id: string, code: string) {
    setEditingId(id)
    setEditValue(code)
  }

  function saveEdit(id: string, qty: number) {
    if (editValue.trim()) {
      updateItem(id, editValue.trim(), qty)
      show('✏️ Yangilandi')
    }
    setEditingId(null)
  }

  return (
    <div className="flex-1">
      <div className="px-5 pt-3.5">
        <div className="flex items-center gap-2 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-3.5 py-2.5">
          <Search size={16} className="text-muted shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Barcode qidirish..."
            className="flex-1 bg-transparent outline-none font-mono text-sm text-ink dark:text-ink-dark placeholder:text-muted"
          />
        </div>
      </div>

      <div className="px-5 pb-36 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-display font-bold uppercase tracking-wide text-muted">Ro'yxat ({filtered.length})</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <PackageSearch size={44} className="mx-auto mb-3 opacity-35" />
            <p className="text-sm">
              {query ? 'Hech narsa topilmadi' : (
                <>Hali scan qilinmagan.<br />Boshlash uchun yuqoridagi tugmani bosing.</>
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(item => {
              const info = productDb[item.code]
              const isEditing = editingId === item.id
              return (
                <div key={item.id} className="flex items-center gap-3 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-3.5 py-3">
                  <div
                    className="w-2 h-8 rounded shrink-0"
                    style={{ background: 'repeating-linear-gradient(90deg, #1D8348 0 2px, transparent 2px 4px)' }}
                  />
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(item.id, item.qty)}
                        onBlur={() => saveEdit(item.id, item.qty)}
                        className="w-full bg-white dark:bg-surface-dark border border-primary rounded-lg px-2 py-1 font-mono text-sm outline-none"
                      />
                    ) : (
                      <div className="font-mono font-bold text-[15px] text-ink dark:text-ink-dark truncate">
                        {item.code}
                        {item.qty > 1 && <span className="ml-2 text-xs font-sans font-semibold text-primary bg-primary-light dark:bg-primary/20 rounded-full px-2 py-0.5">x{item.qty}</span>}
                      </div>
                    )}
                    <div className="text-[11px] text-muted mt-0.5">
                      {fmtTime(item.addedAt)}
                      {info?.name && <span className="ml-2">· {info.name}</span>}
                      {info?.price != null && <span className="ml-1">· {(info.price * item.qty).toLocaleString('uz-UZ')} so'm</span>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => startEdit(item.id, item.code)}
                      className="w-8 h-8 rounded-lg border border-border dark:border-border-dark bg-white dark:bg-transparent flex items-center justify-center text-muted"
                      aria-label="Tahrirlash"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        deleteItem(item.id)
                        show("🗑 O'chirildi")
                      }}
                      className="w-8 h-8 rounded-lg border border-border dark:border-border-dark bg-white dark:bg-transparent flex items-center justify-center text-danger"
                      aria-label="O'chirish"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
