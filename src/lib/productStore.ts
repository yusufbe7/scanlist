import { get, set, del } from 'idb-keyval'
import type { ProductDB } from '../types'
import { loadJSON, KEYS } from './storage'

const IDB_KEY = 'scanlist_product_db_v3'

/**
 * Loads the product database from IndexedDB. If nothing is there yet,
 * migrates any legacy (small) product DB that was previously stored in
 * localStorage, so existing users don't lose their uploaded data.
 */
export async function loadProductDb(): Promise<ProductDB> {
  try {
    const fromIdb = await get<ProductDB>(IDB_KEY)
    if (fromIdb && Object.keys(fromIdb).length) return fromIdb
  } catch (e) {
    console.error('IndexedDB o\'qishda xato:', e)
  }

  // Migrate legacy localStorage product DB (from older app versions)
  const legacy = loadJSON<ProductDB>(KEYS.productDb, {})
  if (Object.keys(legacy).length) {
    await saveProductDb(legacy).catch(() => {})
    return legacy
  }
  return {}
}

export async function saveProductDb(db: ProductDB): Promise<void> {
  try {
    await set(IDB_KEY, db)
    // clear the old localStorage copy once migrated, to free up space
    localStorage.removeItem(KEYS.productDb)
  } catch (e) {
    console.error('Mahsulot bazasini saqlashda xato (juda katta bo\'lishi mumkin):', e)
    throw e
  }
}

export async function clearProductDbStorage(): Promise<void> {
  await del(IDB_KEY).catch(() => {})
  localStorage.removeItem(KEYS.productDb)
}
