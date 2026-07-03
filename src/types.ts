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

// ─── User & Pro System ─────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  name: string
  createdAt: string
  isPro: boolean
  proExpiresAt: string | null // ISO timestamp
  totalScans: number
  dailyScans: Record<string, number> // { "2024-07-03": 12, ... }
}

export interface AdminUser {
  id: string
  name: string
  isPro: boolean
  proExpiresAt: string | null
  totalScans: number
  lastActive: string
}

// ─── Settings ──────────────────────────────────────────────────────────────

export interface AppSettings {
  volume: number // 0–100
  continuousScan: boolean
}
