'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useOrganizationStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { organizationSchema, type OrganizationInput } from '@/lib/utils/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function WorkspacePage() {
  const supabase = createClient()
  const { currentOrganization } = useOrganizationStore()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: currentOrganization?.name || '',
      slug: currentOrganization?.slug || '',
      website: currentOrganization?.website || '',
      description: currentOrganization?.description || '',
    },
  })

  const onSubmit = async (data: OrganizationInput) => {
    if (!currentOrganization) return
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .update(data as any)
        .eq('id', currentOrganization.id)

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Workspace updated successfully')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold">Workspace</h2>
        <p className="text-sm text-zinc-500">Manage your organization settings</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>Update your organization information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Input
              label="Organization Name"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Slug"
              error={errors.slug?.message}
              hint="Used in URLs: act-os.app/your-slug"
              {...register('slug')}
            />
            <Input
              label="Website"
              type="url"
              placeholder="https://example.com"
              error={errors.website?.message}
              {...register('website')}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300"
                {...register('description')}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>
            <Separator />
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">Delete Workspace</p>
            <p className="text-sm text-red-500 mt-1">
              Once deleted, this cannot be undone. All data will be permanently removed.
            </p>
            <Button variant="destructive" className="mt-3" disabled>
              Delete Workspace
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
