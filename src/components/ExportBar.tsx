import { FileText, FileSpreadsheet, FileDown, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../hooks/useToast'
import { exportWord, exportExcel, exportCsv } from '../lib/exporters'

export function ExportBar({ onRequestClear }: { onRequestClear: () => void }) {
  const { activeList, productDb } = useApp()
  const { show } = useToast()
  const empty = activeList.items.length === 0

  async function handleWord() {
    if (empty) return show("Ro'yxat bo'sh")
    await exportWord(activeList.name, activeList.items, productDb)
    show('📄 Word yuklandi')
  }
  async function handleExcel() {
    if (empty) return show("Ro'yxat bo'sh")
    await exportExcel(activeList.name, activeList.items, productDb)
    show('📊 Excel yuklandi')
  }
  function handleCsv() {
    if (empty) return show("Ro'yxat bo'sh")
    exportCsv(activeList.name, activeList.items, productDb)
    show('📋 CSV yuklandi')
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white/80 dark:bg-ink/80 backdrop-blur-lg border-t border-border/50 dark:border-border-dark/50 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex gap-2">
      <button onClick={handleWord} className="flex-1 flex flex-col items-center gap-1 glass text-primary-dark dark:text-primary rounded-xl py-2.5 text-xs font-semibold">
        <FileText size={16} /> Word
      </button>
      <button onClick={handleExcel} className="flex-1 flex flex-col items-center gap-1 glass text-primary-dark dark:text-primary rounded-xl py-2.5 text-xs font-semibold">
        <FileSpreadsheet size={16} /> Excel
      </button>
      <button onClick={handleCsv} className="flex-1 flex flex-col items-center gap-1 glass text-muted dark:text-muted-dark rounded-xl py-2.5 text-xs font-semibold">
        <FileDown size={16} /> CSV
      </button>
      <button onClick={onRequestClear} className="w-11 flex flex-col items-center justify-center gap-1 bg-danger/10 dark:bg-danger/15 text-danger rounded-xl border border-danger/20">
        <Trash2 size={16} />
      </button>
    </div>
  )
}
