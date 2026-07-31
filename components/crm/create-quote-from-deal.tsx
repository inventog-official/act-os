'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, FileText, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useOrganizationStore } from '@/lib/store'
import { createQuotation } from '@/lib/actions/finance'
import { toast } from 'sonner'
import type { CrmDeal } from '@/lib/types/database'

interface CreateQuoteFromDealProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deal: CrmDeal
  company?: { name?: string | null; email?: string | null; phone?: string | null } | null
  contact?: { first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null } | null
  orgSlug: string
}

interface QuoteItemForm {
  description: string
  quantity: string
  unitPrice: string
}

const emptyItem = (): QuoteItemForm => ({ description: '', quantity: '1', unitPrice: '' })

export function CreateQuoteFromDeal({ open, onOpenChange, deal, company, contact, orgSlug }: CreateQuoteFromDealProps) {
  const router = useRouter()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [saving, setSaving] = useState(false)
  const [clientName, setClientName] = useState(company?.name || deal.name || '')
  const [clientEmail, setClientEmail] = useState(contact?.email || company?.email || '')
  const [clientPhone, setClientPhone] = useState(contact?.phone || company?.phone || '')
  const [currency, setCurrency] = useState('USD')
  const [items, setItems] = useState<QuoteItemForm[]>([{ ...emptyItem(), description: deal.name || '' }])

  const handleCreate = async () => {
    if (!currentOrganization) {
      toast.error('No organization selected')
      return
    }
    if (!clientName.trim()) {
      toast.error('Client name is required')
      return
    }
    const validItems = items.filter(i => i.description.trim())
    if (!validItems.length) {
      toast.error('At least one line item with a description is required')
      return
    }

    setSaving(true)
    try {
      const quotation = await createQuotation({
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || null,
        clientPhone: clientPhone.trim() || null,
        companyId: deal.company_id,
        dealId: deal.id,
        projectId: null,
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: null,
        currency,
        discountType: null,
        discountValue: null,
        notes: null,
        terms: null,
        type: 'quote',
        organizationId: currentOrganization.id,
        items: validItems.map(i => ({
          description: i.description.trim(),
          quantity: Number(i.quantity) || 1,
          unitPrice: Number(i.unitPrice) || 0,
          discountPercent: 0,
        })),
      })
      toast.success(`Quote ${quotation?.quote_number || ''} created`)
      onOpenChange(false)
      router.push(`/${orgSlug}/finance/quotations`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create quote')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Quote from Deal
          </DialogTitle>
          <DialogDescription>
            {company?.name ? `For ${company.name}` : `From ${deal.name}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            label="Client Name *"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            placeholder="Enter client name"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Client Email"
              type="email"
              value={clientEmail}
              onChange={e => setClientEmail(e.target.value)}
            />
            <Input
              label="Client Phone"
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">Currency</label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY', 'BRL', 'MXN'].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block text-zinc-700 dark:text-zinc-300">Line Items</label>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, description: e.target.value } : it))}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: e.target.value } : it))}
                    className="w-[70px]"
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, unitPrice: e.target.value } : it))}
                    className="w-[110px]"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setItems(prev => [...prev, emptyItem()])}>
              <Plus className="h-4 w-4 mr-1" />Add Item
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
