'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { organizationSchema, type OrganizationInput } from '@/lib/utils/validations'
import { useOrganizationStore, useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { slugify } from '@/lib/utils'

export default function CreateOrganizationPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()
  const { setCurrentOrganization } = useOrganizationStore()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { name: '', slug: '', website: '', description: '' },
  })

  const orgName = watch('name')
  const orgSlug = watch('slug')

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setValue('name', name)
    if (!orgSlug || orgSlug === slugify(orgName)) {
      setValue('slug', slugify(name))
    }
  }

  const onSubmit = async (data: OrganizationInput) => {
    if (!user) return
    setIsLoading(true)
    try {
      const { data: org, error } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          slug: data.slug,
          website: data.website || null,
          description: data.description || null,
          owner_id: user.id,
          settings: {},
          tier: 'free',
        })
        .select()
        .single()

      if (error) throw error

      await supabase.from('organization_members').insert({
        organization_id: org.id,
        user_id: user.id,
        role_id: null,
        created_by: user.id,
      })

      await supabase.from('workspaces').insert({
        name: 'Default',
        slug: 'default',
        organization_id: org.id,
        created_by: user.id,
        settings: {},
      })

      setCurrentOrganization(org as any)
      toast.success('Organization created!')
      router.push(`/${data.slug}/dashboard`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-xl">Create your organization</CardTitle>
          <CardDescription>Set up your workspace to get started with ACT OS</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Organization Name *"
              placeholder="Acme Corp"
              error={errors.name?.message}
              {...register('name', { onChange: handleNameChange })}
            />
            <Input
              label="Organization Slug *"
              placeholder="acme-corp"
              error={errors.slug?.message}
              {...register('slug')}
            />
            <Input
              label="Website"
              placeholder="https://acmecorp.com"
              error={errors.website?.message}
              {...register('website')}
            />
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <textarea
                {...register('description')}
                className="w-full min-h-[80px] rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                placeholder="Tell us about your organization..."
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Organization
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
