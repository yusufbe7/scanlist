import { saveAs } from 'file-saver'
import type { ScanItem, ProductDB } from '../types'

function stamp() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function enrich(items: ScanItem[], productDb: ProductDB) {
  return items.map((i, idx) => {
    const info = productDb[i.code]
    return {
      idx: idx + 1,
      code: i.code,
      sku: info?.sku ?? '',
      name: info?.name ?? '',
      price: info?.price != null ? info.price : null,
      qty: i.qty,
      total: info?.price != null ? info.price * i.qty : null,
      time: new Date(i.addedAt).toLocaleString('uz-UZ')
    }
  })
}

export async function exportWord(listName: string, items: ScanItem[], productDb: ProductDB) {
  const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, ShadingType } = await import('docx')
  const rows = enrich(items, productDb)
  const hasSku = rows.some(r => r.sku)
  const hasName = rows.some(r => r.name)
  const hasPrice = rows.some(r => r.price != null)

  const headerCells = [
    '№',
    'Barcode',
    ...(hasSku ? ['Tovar kodi'] : []),
    ...(hasName ? ['Mahsulot'] : []),
    ...(hasPrice ? ['Narx'] : []),
    'Soni',
    ...(hasPrice ? ['Jami'] : []),
    'Vaqt'
  ]

  const headerRow = new TableRow({
    tableHeader: true,
    children: headerCells.map(
      text =>
        new TableCell({
          shading: { type: ShadingType.SOLID, color: '1D8348', fill: '1D8348' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, color: 'FFFFFF', bold: true, size: 20 })] })]
        })
    )
  })

  const dataRows = rows.map(
    r =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(String(r.idx))] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: r.code, font: 'Courier New' })] })] }),
          ...(hasSku ? [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: r.sku || '—', font: 'Courier New' })] })] })] : []),
          ...(hasName ? [new TableCell({ children: [new Paragraph(r.name || '—')] })] : []),
          ...(hasPrice ? [new TableCell({ children: [new Paragraph(r.price != null ? `${r.price.toLocaleString('uz-UZ')} so'm` : '—')] })] : []),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(String(r.qty))] })] }),
          ...(hasPrice ? [new TableCell({ children: [new Paragraph(r.total != null ? `${r.total.toLocaleString('uz-UZ')} so'm` : '—')] })] : []),
          new TableCell({ children: [new Paragraph(r.time)] })
        ]
      })
  )

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: 'ScanList', bold: true, size: 32, color: '1D8348' })] }),
          new Paragraph({ children: [new TextRun({ text: `${listName} — ${stamp()}`, size: 22, color: '5B6B63' })] }),
          new Paragraph({ text: '' }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] })
        ]
      }
    ]
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `scanlist-${listName.replace(/\s+/g, '_')}-${stamp()}.docx`)
}

export async function exportExcel(listName: string, items: ScanItem[], productDb: ProductDB) {
  const XLSX = await import('xlsx')
  const rows = enrich(items, productDb)
  const hasSku = rows.some(r => r.sku)
  const hasName = rows.some(r => r.name)
  const hasPrice = rows.some(r => r.price != null)

  const data = rows.map(r => {
    const base: Record<string, string | number> = { '№': r.idx, Barcode: r.code }
    if (hasSku) base['Tovar kodi'] = r.sku
    if (hasName) base['Mahsulot'] = r.name
    if (hasPrice) base['Narx'] = r.price ?? ''
    base['Soni'] = r.qty
    if (hasPrice) base['Jami'] = r.total ?? ''
    base['Vaqt'] = r.time
    return base
  })

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = Object.keys(data[0] ?? { a: 1 }).map(() => ({ wch: 18 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, listName.slice(0, 28) || 'ScanList')
  XLSX.writeFile(wb, `scanlist-${listName.replace(/\s+/g, '_')}-${stamp()}.xlsx`)
}

export function exportTxt(listName: string, items: ScanItem[]) {
  const text = items.map(i => (i.qty > 1 ? `${i.code} x${i.qty}` : i.code)).join('\n')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  saveAs(blob, `scanlist-${listName.replace(/\s+/g, '_')}-${stamp()}.txt`)
}
