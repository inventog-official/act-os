import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generatePdf } from '@/lib/pdf/template'
import type { PdfDocument } from '@/lib/pdf/template'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const { data: invoice, error } = await supabase
    .from('finance_invoices')
    .select('*, items:finance_invoice_items(*)')
    .eq('id', id)
    .single()

  if (error || !invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const doc: PdfDocument = {
    title: 'Invoice',
    number: invoice.invoice_number,
    clientName: invoice.client_name,
    clientEmail: invoice.client_email,
    clientPhone: invoice.client_phone,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    currency: invoice.currency,
    items: (invoice.items || []).map((i: any) => ({
      description: i.description,
      quantity: String(i.quantity),
      unitPrice: String(i.unit_price),
      total: String(i.total),
    })),
    subtotal: String(invoice.subtotal),
    discountAmount: String(invoice.discount_amount || '0'),
    taxAmount: String(invoice.tax_amount || '0'),
    total: String(invoice.total),
    notes: invoice.notes,
    terms: invoice.terms,
    status: invoice.status,
  }

  const pdf = await generatePdf(doc)
  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Invoice_${invoice.invoice_number}.pdf"`,
    },
  })
}
