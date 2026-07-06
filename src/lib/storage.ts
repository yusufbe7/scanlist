const KEYS = {
  lists: 'scanlist_lists_v2',
  activeListId: 'scanlist_active_id_v2',
  productDb: 'scanlist_product_db_v2',
  theme: 'scanlist_theme_v2',
  fontSize: 'scanlist_font_size_v2'
} as const

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Storage saqlashda xato:', e)
  }
}

export { KEYS }
