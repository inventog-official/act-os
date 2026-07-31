import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib'

const PRIMARY = rgb(0.09, 0.09, 0.11)
const MUTED = rgb(0.44, 0.45, 0.47)
const BORDER = rgb(0.85, 0.85, 0.87)
const BG = rgb(0.97, 0.97, 0.98)

export interface PdfLineItem {
  description: string
  quantity: string
  unitPrice: string
  total: string
}

export interface PdfDocument {
  title: string
  number: string
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null
  issueDate: string
  dueDate?: string | null
  currency?: string
  items: PdfLineItem[]
  subtotal: string
  discountAmount?: string
  taxAmount: string
  total: string
  notes?: string | null
  terms?: string | null
  status: string
  orgName?: string
}

function formatCurrency(amount: string, currency = 'USD'): string {
  const num = parseFloat(amount) || 0
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num)
}

export async function generatePdf(doc: PdfDocument): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const page = pdfDoc.addPage(PageSizes.A4)
  const { width, height } = page.getSize()
  const margin = 50
  let y = height - margin

  // Header bar
  page.drawRectangle({ x: 0, y: height - 60, width, height: 60, color: PRIMARY })
  page.drawText(doc.orgName || 'ACT OS', { x: margin, y: height - 42, size: 18, font: bold, color: rgb(1, 1, 1) })
  page.drawText(doc.title, { x: width - margin - 120, y: height - 42, size: 14, font: bold, color: rgb(1, 1, 1) })

  y -= 80

  // Status badge
  const statusColors: Record<string, any> = {
    draft: rgb(0.65, 0.65, 0.67),
    sent: rgb(0.22, 0.47, 0.93),
    paid: rgb(0.13, 0.67, 0.38),
    overdue: rgb(0.92, 0.26, 0.21),
    accepted: rgb(0.13, 0.67, 0.38),
    cancelled: rgb(0.65, 0.65, 0.67),
  }
  const statusColor = statusColors[doc.status] || MUTED
  page.drawRectangle({ x: width - margin - 80, y: y - 8, width: 80, height: 20, color: statusColor })
  page.drawText(doc.status.toUpperCase(), { x: width - margin - 75, y: y - 3, size: 9, font: bold, color: rgb(1, 1, 1) })

  // Document number
  page.drawText(`${doc.title} #${doc.number}`, { x: margin, y, size: 10, font: bold, color: MUTED })
  y -= 20
  page.drawText(`Issue Date: ${doc.issueDate}`, { x: margin, y, size: 9, font, color: MUTED })
  if (doc.dueDate) {
    page.drawText(`Due Date: ${doc.dueDate}`, { x: margin + 200, y, size: 9, font, color: MUTED })
  }

  y -= 35

  // Bill To
  page.drawText('BILL TO', { x: margin, y, size: 10, font: bold, color: PRIMARY })
  y -= 16
  page.drawText(doc.clientName, { x: margin, y, size: 10, font, color: PRIMARY })
  y -= 14
  if (doc.clientEmail) page.drawText(doc.clientEmail, { x: margin, y, size: 9, font, color: MUTED })
  if (doc.clientEmail) y -= 14
  if (doc.clientPhone) page.drawText(doc.clientPhone, { x: margin, y, size: 9, font, color: MUTED })
  if (doc.clientPhone) y -= 14

  y -= 25

  // Table header
  const col1 = margin
  const col2 = width - margin - 220
  const col3 = width - margin - 140
  const col4 = width - margin - 70
  const tableWidth = width - 2 * margin
  page.drawRectangle({ x: margin, y: y - 4, width: tableWidth, height: 22, color: BG })
  page.drawText('Description', { x: col1 + 8, y: y + 3, size: 9, font: bold, color: MUTED })
  page.drawText('Qty', { x: col2, y: y + 3, size: 9, font: bold, color: MUTED })
  page.drawText('Unit Price', { x: col3, y: y + 3, size: 9, font: bold, color: MUTED })
  page.drawText('Total', { x: col4, y: y + 3, size: 9, font: bold, color: MUTED })
  y -= 28

  // Table rows
  for (const item of doc.items) {
    const rowH = 18
    page.drawRectangle({ x: margin, y: y - 2, width: tableWidth, height: rowH, color: rgb(1, 1, 1) })
    page.drawRectangle({ x: margin, y: y - 2, width: tableWidth, height: 0.5, color: BORDER })

    page.drawText(item.description, { x: col1 + 8, y: y + 2, size: 9, font, color: PRIMARY, maxWidth: col2 - col1 - 16 })
    page.drawText(item.quantity, { x: col2, y: y + 2, size: 9, font, color: PRIMARY })
    page.drawText(formatCurrency(item.unitPrice, doc.currency), { x: col3, y: y + 2, size: 9, font, color: PRIMARY })
    page.drawText(formatCurrency(item.total, doc.currency), { x: col4, y: y + 2, size: 9, font, color: PRIMARY })

    y -= rowH + 2
  }

  // Totals
  y -= 10
  const totalX = width - margin - 200
  page.drawText('Subtotal', { x: totalX, y, size: 10, font, color: MUTED })
  page.drawText(formatCurrency(doc.subtotal, doc.currency), { x: width - margin - 70, y, size: 10, font, color: PRIMARY })
  y -= 18

  if (doc.discountAmount && parseFloat(doc.discountAmount) > 0) {
    page.drawText('Discount', { x: totalX, y, size: 10, font, color: MUTED })
    page.drawText(`-${formatCurrency(doc.discountAmount, doc.currency)}`, { x: width - margin - 70, y, size: 10, font, color: rgb(0.92, 0.26, 0.21) })
    y -= 18
  }

  page.drawText('Tax', { x: totalX, y, size: 10, font, color: MUTED })
  page.drawText(formatCurrency(doc.taxAmount, doc.currency), { x: width - margin - 70, y, size: 10, font, color: PRIMARY })
  y -= 18

  // Total line
  page.drawRectangle({ x: totalX - 10, y: y - 4, width: width - margin - totalX + 10, height: 28, color: PRIMARY })
  page.drawText('Total', { x: totalX, y: y + 5, size: 12, font: bold, color: rgb(1, 1, 1) })
  page.drawText(formatCurrency(doc.total, doc.currency), { x: width - margin - 70, y: y + 5, size: 12, font: bold, color: rgb(1, 1, 1) })

  y -= 50

  if (doc.notes) {
    page.drawText('Notes', { x: margin, y, size: 10, font: bold, color: PRIMARY })
    y -= 16
    page.drawText(doc.notes, { x: margin, y, size: 9, font, color: MUTED, maxWidth: tableWidth })
    y -= 30
  }

  if (doc.terms) {
    page.drawText('Terms & Conditions', { x: margin, y, size: 10, font: bold, color: PRIMARY })
    y -= 16
    page.drawText(doc.terms, { x: margin, y, size: 9, font, color: MUTED, maxWidth: tableWidth })
  }

  // Footer
  page.drawLine({ start: { x: margin, y: 40 }, end: { x: width - margin, y: 40 }, thickness: 0.5, color: BORDER })
  page.drawText('Generated by ACT OS', { x: margin, y: 28, size: 8, font, color: MUTED })
  page.drawText(`${doc.title} #${doc.number}`, { x: width - margin - 120, y: 28, size: 8, font, color: MUTED })

  return pdfDoc.save()
}
