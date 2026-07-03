import { ListChecks, Settings, Package, Crown } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { isProActive, getTodayScans } from '../lib/userManager'

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

export function Header({ onOpenLists, onOpenSettings }: { onOpenLists: () => void; onOpenSettings: () => void }) {
  const { activeList, lists, user } = useApp()
  const todayCount = user ? getTodayScans(user) : 0
  const totalCount = activeList.items.reduce((s, i) => s + i.qty, 0)
  const last = activeList.items[activeList.items.length - 1]
  const isPro = user ? isProActive(user) : false

  return (
    <header className="bg-gradient-to-br from-primary to-primary-dark text-white px-5 pt-5 pb-6 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />

      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-2.5 font-display font-extrabold text-[22px] tracking-tight">
          <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-[9px] flex items-center justify-center border border-white/20">
            <Package size={19} strokeWidth={2.4} />
          </div>
          ScanList
          {isPro && <Crown size={14} className="text-yellow-300 -ml-0.5" />}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLists}
            className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full pl-3 pr-3.5 py-1.5 text-sm font-semibold active:scale-95 transition"
          >
            <ListChecks size={15} />
            <span className="max-w-[90px] truncate">{activeList.name}</span>
            {lists.length > 1 && <span className="opacity-70 text-xs">({lists.length})</span>}
          </button>
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center active:scale-95 transition"
            aria-label="Sozlamalar"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="flex gap-2.5 mt-4 relative">
        <div className="flex-1 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-3 py-2.5">
          <div className="font-display font-bold text-xl leading-none">{todayCount}</div>
          <div className="text-[11px] opacity-80 mt-0.5">Bugungi scan</div>
        </div>
        <div className="flex-1 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-3 py-2.5">
          <div className="font-display font-bold text-xl leading-none">{totalCount}</div>
          <div className="text-[11px] opacity-80 mt-0.5">Jami (soni)</div>
        </div>
        <div className="flex-1 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-3 py-2.5">
          <div className="font-display font-bold text-xl leading-none">{last ? fmtTime(last.addedAt) : '—'}</div>
          <div className="text-[11px] opacity-80 mt-0.5">Oxirgi scan</div>
        </div>
      </div>
    </header>
  )
}
