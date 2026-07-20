'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Camera, Loader2, Upload } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { profileSchema, type ProfileInput } from '@/lib/utils/validations'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FileUpload } from '@/components/ui/file-upload'
import { Separator } from '@/components/ui/separator'
import { getInitials } from '@/lib/utils'

export default function ProfilePage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.user_metadata?.name || '',
      email: user?.email || '',
    },
  })

  const onSubmit = async (data: ProfileInput) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: data.name },
        email: data.email !== user?.email ? data.email : undefined,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Profile updated successfully')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold">Profile</h2>
        <p className="text-sm text-zinc-500">Manage your personal information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>Update your profile picture</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-lg">
                {getInitials(user?.user_metadata?.name || user?.email || 'U')}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1">
            <FileUpload
              bucket="avatars"
              path={`users/${user?.id}`}
              onUploadComplete={async (url) => {
                await supabase.auth.updateUser({ data: { avatar_url: url } })
                toast.success('Avatar updated')
              }}
            />
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Input
              label="Full Name"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Separator />
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </CardContent>
        </Card>
      </form>
    </>
  )
}
