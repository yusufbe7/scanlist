import { FileText, FileSpreadsheet, FileType, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../hooks/useToast'
import { exportWord, exportExcel, exportTxt } from '../lib/exporters'

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
  function handleTxt() {
    if (empty) return show("Ro'yxat bo'sh")
    exportTxt(activeList.name, activeList.items)
    show('📋 TXT yuklandi')
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white dark:bg-surface-dark border-t border-border dark:border-border-dark px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex gap-2 shadow-[0_-4px_14px_rgba(0,0,0,0.06)]">
      <button onClick={handleWord} className="flex-1 flex flex-col items-center gap-1 bg-primary-light dark:bg-primary/15 text-primary-dark dark:text-primary rounded-[11px] py-2.5 text-xs font-semibold border border-border dark:border-border-dark">
        <FileText size={16} /> Word
      </button>
      <button onClick={handleExcel} className="flex-1 flex flex-col items-center gap-1 bg-primary-light dark:bg-primary/15 text-primary-dark dark:text-primary rounded-[11px] py-2.5 text-xs font-semibold border border-border dark:border-border-dark">
        <FileSpreadsheet size={16} /> Excel
      </button>
      <button onClick={handleTxt} className="flex-1 flex flex-col items-center gap-1 bg-surface dark:bg-black/20 text-muted rounded-[11px] py-2.5 text-xs font-semibold border border-border dark:border-border-dark">
        <FileType size={16} /> TXT
      </button>
      <button onClick={onRequestClear} className="w-11 flex flex-col items-center justify-center gap-1 bg-danger-light dark:bg-danger/15 text-danger rounded-[11px] border border-border dark:border-border-dark">
        <Trash2 size={16} />
      </button>
    </div>
  )
}
