import { ListChecks, Settings, Package } from 'lucide-react'
import { useApp } from '../context/AppContext'

function isToday(iso: string) {
  const d = new Date(iso)
  const n = new Date()
  return d.toDateString() === n.toDateString()
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

export function Header({ onOpenLists, onOpenSettings }: { onOpenLists: () => void; onOpenSettings: () => void }) {
  const { activeList, lists } = useApp()
  const todayCount = activeList.items.filter(i => isToday(i.addedAt)).length
  const totalCount = activeList.items.reduce((s, i) => s + i.qty, 0)
  const last = activeList.items[activeList.items.length - 1]

  return (
    <header className="bg-primary dark:bg-primary-dark text-white px-5 pt-5 pb-6 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 font-display font-extrabold text-[22px] tracking-tight">
          <div className="w-9 h-9 bg-white rounded-[9px] flex items-center justify-center text-primary">
            <Package size={19} strokeWidth={2.4} />
          </div>
          ScanList
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLists}
            className="flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-full pl-3 pr-3.5 py-1.5 text-sm font-semibold active:scale-95 transition"
          >
            <ListChecks size={15} />
            <span className="max-w-[90px] truncate">{activeList.name}</span>
            {lists.length > 1 && <span className="opacity-70 text-xs">({lists.length})</span>}
          </button>
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-full bg-white/15 border border-white/25 flex items-center justify-center active:scale-95 transition"
            aria-label="Sozlamalar"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-2.5 mt-4">
        <div className="flex-1 bg-white/15 border border-white/20 rounded-xl px-3 py-2">
          <div className="font-display font-bold text-xl leading-none">{todayCount}</div>
          <div className="text-[11px] opacity-85 mt-0.5">Bugungi scan</div>
        </div>
        <div className="flex-1 bg-white/15 border border-white/20 rounded-xl px-3 py-2">
          <div className="font-display font-bold text-xl leading-none">{totalCount}</div>
          <div className="text-[11px] opacity-85 mt-0.5">Jami (soni)</div>
        </div>
        <div className="flex-1 bg-white/15 border border-white/20 rounded-xl px-3 py-2">
          <div className="font-display font-bold text-xl leading-none">{last ? fmtTime(last.addedAt) : '—'}</div>
          <div className="text-[11px] opacity-85 mt-0.5">Oxirgi scan</div>
        </div>
      </div>
    </header>
  )
}
