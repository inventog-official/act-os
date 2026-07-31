import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'revenue'
  const orgId = req.nextUrl.searchParams.get('organizationId')
  if (!orgId) return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 })

  const supabase = await createServerSupabaseClient()

  const { data: invoices } = await supabase
    .from('finance_invoices')
    .select('invoice_number, client_name, total, amount_paid, balance_due, status, issue_date')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .in('status', ['paid', 'sent', 'partial', 'overdue'])
    .order('issue_date', { ascending: false })
    .limit(50)

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const page = pdfDoc.addPage(PageSizes.A4)
  const { width } = page.getSize()
  const margin = 50
  let y = PageSizes.A4[1] - margin

  page.drawRectangle({ x: 0, y: y + 10, width, height: 60, color: rgb(0.09, 0.09, 0.11) })
  page.drawText('ACT OS', { x: margin, y: y + 30, size: 18, font: bold, color: rgb(1, 1, 1) })
  page.drawText(`Report: ${type.replace(/_/g, ' ').toUpperCase()}`, { x: width - margin - 200, y: y + 30, size: 14, font: bold, color: rgb(1, 1, 1) })

  y -= 80

  const totalRevenue = (invoices || []).reduce((s, i) => s + parseFloat(i.total || '0'), 0)
  const totalPaid = (invoices || []).filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.total || '0'), 0)
  const totalOutstanding = (invoices || []).filter(i => i.status !== 'paid').reduce((s, i) => s + parseFloat(i.balance_due || i.total || '0'), 0)

  page.drawText('Summary', { x: margin, y, size: 12, font: bold, color: rgb(0.09, 0.09, 0.11) })
  y -= 24
  page.drawText(`Total Invoices: ${invoices?.length || 0}`, { x: margin, y, size: 10, font, color: rgb(0.44, 0.45, 0.47) })
  y -= 16
  page.drawText(`Total Revenue: $${totalRevenue.toLocaleString()}`, { x: margin, y, size: 10, font, color: rgb(0.09, 0.09, 0.11) })
  y -= 16
  page.drawText(`Total Collected: $${totalPaid.toLocaleString()}`, { x: margin, y, size: 10, font, color: rgb(0.13, 0.67, 0.38) })
  y -= 16
  page.drawText(`Outstanding: $${totalOutstanding.toLocaleString()}`, { x: margin, y, size: 10, font, color: rgb(0.92, 0.26, 0.21) })

  y -= 40

  // Invoice list table
  const cols = [margin, margin + 120, width - margin - 320, width - margin - 200, width - margin - 100]
  page.drawRectangle({ x: margin, y: y - 4, width: width - 2 * margin, height: 22, color: rgb(0.97, 0.97, 0.98) })
  page.drawText('Invoice #', { x: cols[0] + 8, y: y + 3, size: 9, font: bold, color: rgb(0.44, 0.45, 0.47) })
  page.drawText('Client', { x: cols[1], y: y + 3, size: 9, font: bold, color: rgb(0.44, 0.45, 0.47) })
  page.drawText('Date', { x: cols[2], y: y + 3, size: 9, font: bold, color: rgb(0.44, 0.45, 0.47) })
  page.drawText('Status', { x: cols[3], y: y + 3, size: 9, font: bold, color: rgb(0.44, 0.45, 0.47) })
  page.drawText('Amount', { x: cols[4], y: y + 3, size: 9, font: bold, color: rgb(0.44, 0.45, 0.47) })
  y -= 26

  for (const inv of invoices || []) {
    page.drawRectangle({ x: margin, y: y - 2, width: width - 2 * margin, height: 0.5, color: rgb(0.85, 0.85, 0.87) })
    page.drawText(inv.invoice_number, { x: cols[0] + 8, y: y + 2, size: 9, font, color: rgb(0.09, 0.09, 0.11) })
    page.drawText(inv.client_name?.slice(0, 20) || '', { x: cols[1], y: y + 2, size: 9, font, color: rgb(0.09, 0.09, 0.11) })
    page.drawText(inv.issue_date || '', { x: cols[2], y: y + 2, size: 9, font, color: rgb(0.44, 0.45, 0.47) })
    const sc = inv.status === 'paid' ? rgb(0.13, 0.67, 0.38) : inv.status === 'overdue' ? rgb(0.92, 0.26, 0.21) : rgb(0.22, 0.47, 0.93)
    page.drawText(inv.status, { x: cols[3], y: y + 2, size: 9, font, color: sc })
    page.drawText(`$${(parseFloat(inv.total) || 0).toLocaleString()}`, { x: cols[4], y: y + 2, size: 9, font, color: rgb(0.09, 0.09, 0.11) })
    y -= 18
    if (y < 60) break
  }

  const pdf = await pdfDoc.save()
  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Report_${type}.pdf"`,
    },
  })
}
