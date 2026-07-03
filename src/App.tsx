import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { ToastProvider, useToast } from './hooks/useToast'
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

function AppShell() {
  const { clearActiveList } = useApp()
  const { show } = useToast()
  const [scannerOpen, setScannerOpen] = useState(false)
  const [listsOpen, setListsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-white dark:bg-ink flex flex-col relative">
      <Header onOpenLists={() => setListsOpen(true)} onOpenSettings={() => setSettingsOpen(true)} />
      <StripeDivider />
      <ScanButton onClick={() => setScannerOpen(true)} />
      <ItemList />
      <ExportBar onRequestClear={() => setClearConfirmOpen(true)} />

      <ScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} />
      <ListSwitcher open={listsOpen} onClose={() => setListsOpen(false)} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
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
    <AppProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </AppProvider>
  )
}
