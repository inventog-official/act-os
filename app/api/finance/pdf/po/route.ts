import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generatePdf } from '@/lib/pdf/template'
import type { PdfDocument } from '@/lib/pdf/template'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const { data: po, error } = await supabase
    .from('finance_purchase_orders')
    .select('*, items:finance_purchase_order_items(*)')
    .eq('id', id)
    .single()

  if (error || !po) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const doc: PdfDocument = {
    title: 'Purchase Order',
    number: po.po_number,
    clientName: po.vendor_name,
    clientEmail: po.vendor_email,
    clientPhone: po.vendor_phone,
    issueDate: po.issue_date,
    dueDate: po.delivery_date,
    currency: po.currency,
    items: (po.items || []).map((i: any) => ({
      description: i.description,
      quantity: String(i.quantity),
      unitPrice: String(i.unit_price),
      total: String(i.total),
    })),
    subtotal: String(po.subtotal || '0'),
    discountAmount: '0',
    taxAmount: String(po.tax_amount || '0'),
    total: String(po.total || '0'),
    notes: po.notes,
    terms: po.terms,
    status: po.status,
  }

  const pdf = await generatePdf(doc)
  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Purchase_Order_${po.po_number}.pdf"`,
    },
  })
}
