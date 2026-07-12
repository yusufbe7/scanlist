import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider, useToast } from './hooks/useToast'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Header } from './components/Header'
import { StripeDivider } from './components/StripeDivider'
import { ScanButton } from './components/ScanButton'
import { ItemList } from './components/ItemList'
import { ExportBar } from './components/ExportBar'
import { ScannerModal } from './components/ScannerModal'
import { DuplicateDialog } from './components/DuplicateDialog'
import { ConfirmDialog } from './components/ConfirmDialog'
import { ListSwitcher } from './components/ListSwitcher'
import { SettingsSheet } from './components/SettingsSheet'
import { AuthGate } from './components/auth/AuthGate'
import { CreditsSheet } from './components/credits/CreditsSheet'
import { AdminPanel } from './components/admin/AdminPanel'

function AppShell() {
  const { clearActiveList } = useApp()
  const { show } = useToast()
  const [scannerOpen, setScannerOpen] = useState(false)
  const [listsOpen, setListsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [creditsOpen, setCreditsOpen] = useState(false)
  const [creditsInitialStep, setCreditsInitialStep] = useState<'overview' | 'tariff'>('overview')
  const [adminOpen, setAdminOpen] = useState(false)

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-white dark:bg-ink flex flex-col relative">
      <Header
        onOpenLists={() => setListsOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenCredits={() => {
          setCreditsInitialStep('overview')
          setCreditsOpen(true)
        }}
      />
      <StripeDivider />
      <ScanButton onClick={() => setScannerOpen(true)} />
      <ItemList />
      <ExportBar onRequestClear={() => setClearConfirmOpen(true)} />

      <ScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onNeedCredits={() => {
          setCreditsInitialStep('tariff')
          setCreditsOpen(true)
        }}
      />
      <ListSwitcher open={listsOpen} onClose={() => setListsOpen(false)} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CreditsSheet
        open={creditsOpen}
        initialStep={creditsInitialStep}
        onClose={() => setCreditsOpen(false)}
        onOpenAdmin={() => {
          setCreditsOpen(false)
          setAdminOpen(true)
        }}
      />
      <AdminPanel open={adminOpen} onClose={() => setAdminOpen(false)} />
      <DuplicateDialog />
      <ConfirmDialog
        open={clearConfirmOpen}
        emoji="🗑"
        title="Ro'yxatni tozalash"
        message="Barcha scanlar o'chiriladi. Bu amalni bekor qilib bo'lmaydi."
        confirmLabel="O'chirish"
        danger
        onCancel={() => setClearConfirmOpen(false)}
        onConfirm={() => {
          clearActiveList()
          setClearConfirmOpen(false)
          show("🗑 Ro'yxat tozalandi")
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AuthGate>
            <AppProvider>
              <AppShell />
            </AppProvider>
          </AuthGate>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
