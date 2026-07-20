'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { crmLeadSchema, type CrmLeadInput } from '@/lib/utils/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface LeadFormProps {
  defaultValues?: Partial<CrmLeadInput>
  onSubmit: (data: CrmLeadInput) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function LeadForm({ defaultValues, onSubmit, onCancel, isLoading }: LeadFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CrmLeadInput>({
    resolver: zodResolver(crmLeadSchema) as any,
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      status: 'new',
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogHeader>
        <DialogTitle>{defaultValues?.first_name ? 'Edit Lead' : 'New Lead'}</DialogTitle>
        <DialogDescription>Enter the lead details below</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4 sm:grid-cols-2">
        <Input label="First Name" error={errors.first_name?.message} {...register('first_name')} />
        <Input label="Last Name" error={errors.last_name?.message} {...register('last_name')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
        <Input label="Company" error={errors.company_name?.message} {...register('company_name')} />
        <Input label="Job Title" error={errors.job_title?.message} {...register('job_title')} />
        <Input label="Website" error={errors.website?.message} {...register('website')} />
        <Input label="Industry" error={errors.industry?.message} {...register('industry')} />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Lead Source</label>
          <Select value={watch('lead_source') || ''} onValueChange={v => setValue('lead_source', v as any)}>
            <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="cold_call">Cold Call</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="social_media">Social Media</SelectItem>
              <SelectItem value="advertisement">Advertisement</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Priority</label>
          <Select value={watch('priority') || ''} onValueChange={v => setValue('priority', v as any)}>
            <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
          <Select value={watch('status')} onValueChange={v => setValue('status', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="disqualified">Disqualified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Input
          label="Deal Value"
          type="number"
          step="0.01"
          error={errors.estimated_deal_value?.message}
          {...register('estimated_deal_value', { valueAsNumber: true })}
        />
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Expected Close Date</label>
          <DatePicker
            value={watch('expected_close_date') || undefined}
            onChange={(date) => setValue('expected_close_date', date)}
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
          <textarea
            className="flex min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
            {...register('description')}
            rows={3}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues?.first_name ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  )
}
