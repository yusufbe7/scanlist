import React from 'react'
import { RefreshCw } from 'lucide-react'

interface State {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('ScanList xato:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-[480px] mx-auto min-h-screen bg-white dark:bg-ink flex flex-col items-center justify-center px-8 text-center gap-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="font-display font-bold text-lg text-ink dark:text-ink-dark">Nimadir xato ketdi</h2>
          <p className="text-sm text-muted">
            Ilova kutilmagan xatoga uchradi. Scan qilingan ma'lumotlaringiz qurilmada saqlangan — sahifani qayta yuklab davom eting.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-primary text-white rounded-xl px-5 py-3 font-semibold text-sm"
          >
            <RefreshCw size={16} /> Sahifani qayta yuklash
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
