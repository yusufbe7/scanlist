import type { UserProfile, AdminUser } from '../types'
import { loadJSON, saveJSON, KEYS } from './storage'

// ─── Constants ─────────────────────────────────────────────────────────────

export const FREE_SCAN_LIMIT = 100
export const PRO_PRICE = '10 000'
export const TELEGRAM_CONTACT = '@asyusufbe'
export const TELEGRAM_LINK = 'https://t.me/asyusufbe'
export const ADMIN_PASSWORD = 'umida'

// ─── Helpers ───────────────────────────────────────────────────────────────

function generateId(): string {
  return `SL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── User Operations ───────────────────────────────────────────────────────

export function getCurrentUser(): UserProfile | null {
  return loadJSON<UserProfile | null>(KEYS.user, null)
}

export function createUser(name: string): UserProfile {
  const user: UserProfile = {
    id: generateId(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    isPro: false,
    proExpiresAt: null,
    totalScans: 0,
    dailyScans: {},
  }
  saveJSON(KEYS.user, user)
  // Add to all users registry
  addToRegistry(user)
  return user
}

export function updateUser(user: UserProfile): void {
  saveJSON(KEYS.user, user)
  updateRegistry(user)
}

export function getTodayScans(user: UserProfile): number {
  return user.dailyScans[todayKey()] ?? 0
}

export function incrementScanCount(user: UserProfile): UserProfile {
  const key = todayKey()
  const updated: UserProfile = {
    ...user,
    totalScans: user.totalScans + 1,
    dailyScans: {
      ...user.dailyScans,
      [key]: (user.dailyScans[key] ?? 0) + 1,
    },
  }
  updateUser(updated)
  return updated
}

export function canScan(user: UserProfile): boolean {
  if (isProActive(user)) return true
  return user.totalScans < FREE_SCAN_LIMIT
}

export function getRemainingScans(user: UserProfile): number {
  if (isProActive(user)) return Infinity
  return Math.max(0, FREE_SCAN_LIMIT - user.totalScans)
}

export function isProActive(user: UserProfile): boolean {
  if (!user.isPro || !user.proExpiresAt) return false
  return new Date(user.proExpiresAt) > new Date()
}

// ─── Pro Management ────────────────────────────────────────────────────────

export function grantPro(userId: string, months: number = 1): boolean {
  const users = getAllUsers()
  const userIndex = users.findIndex(u => u.id === userId)
  if (userIndex === -1) return false

  const now = new Date()
  const expiresAt = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000)

  users[userIndex] = {
    ...users[userIndex],
    isPro: true,
    proExpiresAt: expiresAt.toISOString(),
  }
  saveJSON(KEYS.allUsers, users)

  // If current user, update local profile too
  const currentUser = getCurrentUser()
  if (currentUser && currentUser.id === userId) {
    const updated = { ...currentUser, isPro: true, proExpiresAt: expiresAt.toISOString() }
    saveJSON(KEYS.user, updated)
  }

  return true
}

export function revokePro(userId: string): boolean {
  const users = getAllUsers()
  const userIndex = users.findIndex(u => u.id === userId)
  if (userIndex === -1) return false

  users[userIndex] = {
    ...users[userIndex],
    isPro: false,
    proExpiresAt: null,
  }
  saveJSON(KEYS.allUsers, users)

  const currentUser = getCurrentUser()
  if (currentUser && currentUser.id === userId) {
    const updated = { ...currentUser, isPro: false, proExpiresAt: null }
    saveJSON(KEYS.user, updated)
  }

  return true
}

// ─── Admin/Registry ────────────────────────────────────────────────────────

export function getAllUsers(): AdminUser[] {
  return loadJSON<AdminUser[]>(KEYS.allUsers, [])
}

function addToRegistry(user: UserProfile): void {
  const users = getAllUsers()
  const adminUser: AdminUser = {
    id: user.id,
    name: user.name,
    isPro: user.isPro,
    proExpiresAt: user.proExpiresAt,
    totalScans: user.totalScans,
    lastActive: new Date().toISOString(),
  }
  users.push(adminUser)
  saveJSON(KEYS.allUsers, users)
}

function updateRegistry(user: UserProfile): void {
  const users = getAllUsers()
  const idx = users.findIndex(u => u.id === user.id)
  if (idx === -1) {
    addToRegistry(user)
    return
  }
  users[idx] = {
    ...users[idx],
    name: user.name,
    isPro: user.isPro,
    proExpiresAt: user.proExpiresAt,
    totalScans: user.totalScans,
    lastActive: new Date().toISOString(),
  }
  saveJSON(KEYS.allUsers, users)
}

export function validateAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD
}
