import type { ProductDB, ProductInfo } from '../types'

const DB_NAME = 'scanlist_offline'
const DB_VERSION = 1
const STORE_NAME = 'products'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'barcode' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function cacheProductDb(productDb: ProductDB): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.clear()
    for (const [barcode, info] of Object.entries(productDb)) {
      store.put({ barcode, name: info.name, price: info.price })
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => { db.close(); reject(tx.error) }
    })
  } catch (e) {
    console.error('IndexedDB cache error:', e)
  }
}

export async function loadCachedProductDb(): Promise<ProductDB> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result: ProductDB = {}
        for (const item of request.result) result[item.barcode] = { name: item.name, price: item.price }
        db.close()
        resolve(result)
      }
      request.onerror = () => { db.close(); reject(request.error) }
    })
  } catch { return {} }
}

export async function lookupProduct(barcode: string): Promise<ProductInfo | null> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(barcode)
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close()
        resolve(request.result ? { name: request.result.name, price: request.result.price } : null)
      }
      request.onerror = () => { db.close(); reject(request.error) }
    })
  } catch { return null }
}
