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
  sku?: string
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

export interface AppProfile {
  id: string
  fullName: string | null
  phone: string | null
  role: 'user' | 'admin'
  credits: number
  freeScansUsed: number
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected'

export interface PaymentRecord {
  id: string
  userId: string
  amount: number
  credits: number
  receiptPath: string
  status: PaymentStatus
  rejectReason: string | null
  createdAt: string
  reviewedAt: string | null
  userFullName?: string | null
  userPhone?: string | null
}

export interface AppSettings {
  freeScanLimit: number
  paymentCardNumber: string
  paymentCardOwner: string
  paymentPhone: string | null
}

export interface CreditTariff {
  amount: number
  credits: number
}
