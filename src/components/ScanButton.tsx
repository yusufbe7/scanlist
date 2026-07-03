import { ScanLine } from 'lucide-react'

export function ScanButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="px-5 pt-4 pb-1.5">
      <button
        onClick={onClick}
        className="w-full bg-primary hover:bg-primary-dark text-white rounded-2xl py-[18px] font-display font-bold text-lg flex items-center justify-center gap-2.5 shadow-scan active:scale-[0.98] transition"
      >
        <ScanLine size={22} />
        Scan qilish
      </button>
    </div>
  )
}
