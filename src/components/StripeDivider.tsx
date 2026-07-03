const WIDTHS = [2, 3, 4, 1, 2]

export function StripeDivider() {
  return (
    <div className="h-3.5 flex items-stretch gap-[2px] overflow-hidden bg-surface dark:bg-surface-dark px-5">
      {Array.from({ length: 70 }).map((_, i) => (
        <span key={i} className="bg-border dark:bg-border-dark shrink-0" style={{ width: WIDTHS[i % WIDTHS.length] }} />
      ))}
    </div>
  )
}
