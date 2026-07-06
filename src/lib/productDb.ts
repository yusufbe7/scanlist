import * as XLSX from 'xlsx'
import type { ProductDB } from '../types'

const BARCODE_KEYS = ['barcode', 'code', 'kod', 'gtin', 'код gtin', 'код gtin total', 'штрих', 'штрихкод', 'ос.штр.код', 'ос.штрих.код', 'shtrix']
const SKU_KEYS = ['sku', 'tovar', 'товар', 'maxsulot kodi', 'mahsulot kodi']
const NAME_KEYS = ['name', 'nomi', 'mahsulot', 'название', 'наименование']
const PRICE_KEYS = ['price', 'narx', 'narxi', 'цена']

function findKey(headerRow: string[], candidates: string[]): number {
  return headerRow.findIndex(h => candidates.includes(h))
}

/**
 * Parses a CSV/XLSX product database file. Scans every sheet, auto-detects
 * the header row (barcode + name columns, in Uzbek/Russian/English), and
 * supports very large files (100k+ rows, e.g. SAP-style GTIN exports).
 *
 * Recognized columns (case-insensitive, any of these per field):
 *   barcode: barcode | code | kod | gtin | "код gtin" | "код gtin total" | штрих...
 *   sku:     sku | tovar | товар
 *   name:    name | nomi | mahsulot | название | наименование
 *   price:   price | narx | narxi | цена
 */
export async function parseProductFile(file: File): Promise<{ db: ProductDB; count: number; sheets: number }> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })

  const db: ProductDB = {}
  let count = 0
  let usableSheets = 0

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName]
    // Array-of-arrays mode is significantly faster than object mode for huge sheets
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false })
    if (!rows.length) continue

    // Find the first row that looks like a header (contains a recognizable barcode/name column)
    let headerIdx = -1
    let barcodeCol = -1
    let skuCol = -1
    let nameCol = -1
    let priceCol = -1

    for (let r = 0; r < Math.min(rows.length, 5); r++) {
      const header = (rows[r] as unknown[]).map(v => String(v ?? '').trim().toLowerCase())
      const bIdx = findKey(header, BARCODE_KEYS)
      const nIdx = findKey(header, NAME_KEYS)
      if (bIdx !== -1 && nIdx !== -1) {
        headerIdx = r
        barcodeCol = bIdx
        nameCol = nIdx
        skuCol = findKey(header, SKU_KEYS)
        priceCol = findKey(header, PRICE_KEYS)
        break
      }
    }

    if (headerIdx === -1) continue
    usableSheets++

    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r] as unknown[]
      const code = String(row[barcodeCol] ?? '').trim()
      const name = String(row[nameCol] ?? '').trim()
      if (!code || !name) continue

      const sku = skuCol !== -1 ? String(row[skuCol] ?? '').trim() : undefined
      let price: number | undefined
      if (priceCol !== -1) {
        const p = Number(row[priceCol])
        price = Number.isFinite(p) && p > 0 ? p : undefined
      }

      db[code] = { name, sku: sku || undefined, price }
      count++
    }
  }

  return { db, count, sheets: usableSheets }
}
