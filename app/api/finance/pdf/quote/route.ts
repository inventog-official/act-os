import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generatePdf } from '@/lib/pdf/template'
import type { PdfDocument } from '@/lib/pdf/template'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const { data: quote, error } = await supabase
    .from('finance_quotations')
    .select('*, items:finance_quotation_items(*)')
    .eq('id', id)
    .single()

  if (error || !quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const doc: PdfDocument = {
    title: quote.type === 'estimate' ? 'Estimate' : 'Quotation',
    number: quote.quote_number,
    clientName: quote.client_name,
    clientEmail: quote.client_email,
    clientPhone: quote.client_phone,
    issueDate: quote.issue_date,
    dueDate: quote.expiry_date,
    currency: quote.currency,
    items: (quote.items || []).map((i: any) => ({
      description: i.description,
      quantity: String(i.quantity),
      unitPrice: String(i.unit_price),
      total: String(i.total),
    })),
    subtotal: String(quote.subtotal),
    discountAmount: String(quote.discount_amount || '0'),
    taxAmount: String(quote.tax_amount || '0'),
    total: String(quote.total),
    notes: quote.notes,
    terms: quote.terms,
    status: quote.status,
  }

  const pdf = await generatePdf(doc)
  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${doc.title.replace(/\s+/g, '_')}_${quote.quote_number}.pdf"`,
    },
  })
}
