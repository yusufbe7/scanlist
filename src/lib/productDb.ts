import type { ProductDB } from '../types'

/**
 * Accepts a CSV or XLSX file with columns (case-insensitive, flexible names):
 * barcode | code      -> product barcode
 * name | nomi          -> product name
 * price | narx          -> price (number)
 */
export async function parseProductFile(file: File): Promise<{ db: ProductDB; count: number }> {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  const db: ProductDB = {}
  let count = 0

  for (const row of rows) {
    const entries = Object.entries(row).reduce((acc, [k, v]) => {
      acc[k.trim().toLowerCase()] = v
      return acc
    }, {} as Record<string, unknown>)

    const code = String(entries['barcode'] ?? entries['code'] ?? entries['kod'] ?? '').trim()
    const name = String(entries['name'] ?? entries['nomi'] ?? entries['mahsulot'] ?? '').trim()
    const priceRaw = entries['price'] ?? entries['narx'] ?? entries['narxi']
    const price = priceRaw !== undefined && priceRaw !== '' ? Number(priceRaw) : undefined

    if (code && name) {
      db[code] = { name, price: Number.isFinite(price) ? price : undefined }
      count++
    }
  }

  return { db, count }
}
