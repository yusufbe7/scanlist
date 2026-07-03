export interface ScanItem {
  id: string
  code: string
  qty: number
  addedAt: string // ISO timestamp
}

export interface ScanListData {
  id: string
  name: string
  createdAt: string
  items: ScanItem[]
}

export interface ProductInfo {
  name: string
  price?: number
}

export type ProductDB = Record<string, ProductInfo>

export type ThemeMode = 'light' | 'dark'
export type FontSize = 'normal' | 'large'

export interface SyncStatus {
  configured: boolean
  connected: boolean
  lastSyncAt: string | null
  syncing: boolean
  error: string | null
}
