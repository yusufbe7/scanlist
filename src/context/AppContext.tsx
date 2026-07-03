import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import type { ScanListData, ScanItem, ProductDB, ThemeMode, FontSize, UserProfile, AppSettings } from '../types'
import { loadJSON, saveJSON, KEYS } from '../lib/storage'
import { getCurrentUser, createUser, incrementScanCount, canScan, isProActive, updateUser } from '../lib/userManager'
import { cacheProductDb } from '../lib/offlineDb'

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function makeDefaultList(): ScanListData {
  return { id: uid(), name: "Ro'yxat 1", createdAt: new Date().toISOString(), items: [] }
}

interface DuplicateInfo {
  code: string
  existingQty: number
}

interface AppContextValue {
  lists: ScanListData[]
  activeList: ScanListData
  activeListId: string
  productDb: ProductDB
  theme: ThemeMode
  fontSize: FontSize
  pendingDuplicate: DuplicateInfo | null
  user: UserProfile | null
  settings: AppSettings
  showPaywall: boolean

  createList: (name?: string) => void
  switchList: (id: string) => void
  renameList: (id: string, name: string) => void
  deleteList: (id: string) => void
  clearActiveList: () => void

  scan: (code: string) => boolean // returns false if limit reached
  confirmDuplicateIncrement: () => void
  dismissDuplicate: () => void
  updateItem: (id: string, code: string, qty: number) => void
  deleteItem: (id: string) => void

  setProductDb: (db: ProductDB, merge?: boolean) => void
  clearProductDb: () => void

  toggleTheme: () => void
  setFontSize: (size: FontSize) => void

  registerUser: (name: string) => void
  setVolume: (volume: number) => void
  setShowPaywall: (show: boolean) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lists, setLists] = useState<ScanListData[]>(() => {
    const stored = loadJSON<ScanListData[]>(KEYS.lists, [])
    return stored.length ? stored : [makeDefaultList()]
  })
  const [activeListId, setActiveListId] = useState<string>(() => loadJSON<string>(KEYS.activeListId, lists[0].id))
  const [productDb, setProductDbState] = useState<ProductDB>(() => loadJSON<ProductDB>(KEYS.productDb, {}))
  const [theme, setTheme] = useState<ThemeMode>(() => loadJSON<ThemeMode>(KEYS.theme, 'light'))
  const [fontSize, setFontSizeState] = useState<FontSize>(() => loadJSON<FontSize>(KEYS.fontSize, 'normal'))
  const [pendingDuplicate, setPendingDuplicate] = useState<DuplicateInfo | null>(null)
  const [user, setUser] = useState<UserProfile | null>(() => getCurrentUser())
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadJSON<AppSettings>(KEYS.settings, { volume: 80, continuousScan: true })
  )
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => saveJSON(KEYS.lists, lists), [lists])
  useEffect(() => saveJSON(KEYS.activeListId, activeListId), [activeListId])
  useEffect(() => saveJSON(KEYS.productDb, productDb), [productDb])
  useEffect(() => saveJSON(KEYS.theme, theme), [theme])
  useEffect(() => saveJSON(KEYS.fontSize, fontSize), [fontSize])
  useEffect(() => saveJSON(KEYS.settings, settings), [settings])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('text-lg-mode', fontSize === 'large')
  }, [theme, fontSize])

  const activeList = useMemo(() => lists.find(l => l.id === activeListId) ?? lists[0], [lists, activeListId])

  const updateActiveList = useCallback(
    (updater: (list: ScanListData) => ScanListData) => {
      setLists(prev => prev.map(l => (l.id === activeList.id ? updater(l) : l)))
    },
    [activeList.id]
  )

  const createList = useCallback((name?: string) => {
    const newList: ScanListData = {
      id: uid(),
      name: name?.trim() || `Ro'yxat ${lists.length + 1}`,
      createdAt: new Date().toISOString(),
      items: []
    }
    setLists(prev => [...prev, newList])
    setActiveListId(newList.id)
  }, [lists.length])

  const switchList = useCallback((id: string) => setActiveListId(id), [])

  const renameList = useCallback((id: string, name: string) => {
    if (!name.trim()) return
    setLists(prev => prev.map(l => (l.id === id ? { ...l, name: name.trim() } : l)))
  }, [])

  const deleteList = useCallback(
    (id: string) => {
      setLists(prev => {
        const next = prev.filter(l => l.id !== id)
        const finalList = next.length ? next : [makeDefaultList()]
        if (id === activeListId) setActiveListId(finalList[0].id)
        return finalList
      })
    },
    [activeListId]
  )

  const clearActiveList = useCallback(() => {
    updateActiveList(l => ({ ...l, items: [] }))
  }, [updateActiveList])

  const scan = useCallback(
    (rawCode: string): boolean => {
      const code = rawCode.trim()
      if (!code) return true

      // Check scan limit
      if (user && !canScan(user)) {
        setShowPaywall(true)
        return false
      }

      const existing = activeList.items.find(i => i.code === code)
      if (existing) {
        setPendingDuplicate({ code, existingQty: existing.qty })
        // Still count as a scan
        if (user) {
          const updated = incrementScanCount(user)
          setUser(updated)
        }
        return true
      }

      const item: ScanItem = { id: uid(), code, qty: 1, addedAt: new Date().toISOString() }
      updateActiveList(l => ({ ...l, items: [...l.items, item] }))

      // Increment scan counter
      if (user) {
        const updated = incrementScanCount(user)
        setUser(updated)
      }

      return true
    },
    [activeList.items, updateActiveList, user]
  )

  const confirmDuplicateIncrement = useCallback(() => {
    if (!pendingDuplicate) return
    const { code } = pendingDuplicate
    updateActiveList(l => ({
      ...l,
      items: l.items.map(i => (i.code === code ? { ...i, qty: i.qty + 1, addedAt: new Date().toISOString() } : i))
    }))
    setPendingDuplicate(null)
  }, [pendingDuplicate, updateActiveList])

  const dismissDuplicate = useCallback(() => setPendingDuplicate(null), [])

  const updateItem = useCallback(
    (id: string, code: string, qty: number) => {
      updateActiveList(l => ({
        ...l,
        items: l.items.map(i => (i.id === id ? { ...i, code: code.trim() || i.code, qty: Math.max(1, qty) } : i))
      }))
    },
    [updateActiveList]
  )

  const deleteItem = useCallback(
    (id: string) => {
      updateActiveList(l => ({ ...l, items: l.items.filter(i => i.id !== id) }))
    },
    [updateActiveList]
  )

  const setProductDb = useCallback((db: ProductDB, merge = false) => {
    const finalDb = merge ? { ...productDb, ...db } : db
    setProductDbState(finalDb)
    // Cache to IndexedDB for offline use
    cacheProductDb(finalDb).catch(() => {})
  }, [productDb])

  const clearProductDb = useCallback(() => setProductDbState({}), [])

  const toggleTheme = useCallback(() => setTheme(t => (t === 'light' ? 'dark' : 'light')), [])
  const setFontSizeVal = useCallback((size: FontSize) => setFontSizeState(size), [])

  const registerUser = useCallback((name: string) => {
    const newUser = createUser(name)
    setUser(newUser)
  }, [])

  const setVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, volume }))
  }, [])

  // Check if Pro expired on load
  useEffect(() => {
    if (user && user.isPro && !isProActive(user)) {
      const updated = { ...user, isPro: false, proExpiresAt: null }
      updateUser(updated)
      setUser(updated)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const value: AppContextValue = {
    lists,
    activeList,
    activeListId: activeList.id,
    productDb,
    theme,
    fontSize,
    pendingDuplicate,
    user,
    settings,
    showPaywall,
    createList,
    switchList,
    renameList,
    deleteList,
    clearActiveList,
    scan,
    confirmDuplicateIncrement,
    dismissDuplicate,
    updateItem,
    deleteItem,
    setProductDb,
    clearProductDb,
    toggleTheme,
    setFontSize: setFontSizeVal,
    registerUser,
    setVolume,
    setShowPaywall,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp AppProvider ichida ishlatilishi kerak')
  return ctx
}
