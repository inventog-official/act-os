'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Folder, File, Image, FileText, Upload, Download, Trash2, Plus, Loader2, ChevronRight, Home, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { formatDate, cn } from '@/lib/utils'
import { getProjectFiles, createFolder, getProjectFolders } from '@/lib/actions/projects/files'
import { toast } from 'sonner'

const fileTypeIcons: Record<string, typeof File> = {
  image: Image,
  pdf: FileText,
  spreadsheet: FileText,
  document: FileText,
  video: File,
  audio: File,
  archive: File,
}

function getFileIcon(mimeType: string) {
  if (mimeType?.startsWith('image/')) return Image
  if (mimeType?.includes('pdf')) return FileText
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel') || mimeType?.includes('sheet')) return FileText
  if (mimeType?.includes('document') || mimeType?.includes('word') || mimeType?.includes('text')) return FileText
  if (mimeType?.startsWith('video/')) return File
  if (mimeType?.startsWith('audio/')) return File
  return File
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export default function ProjectFilesPage({ params }: { params: Promise<{ orgSlug: string; projectId: string }> }) {
  const { orgSlug, projectId } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { currentOrganization } = useOrganizationStore()
  const [files, setFiles] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folderPath, setFolderPath] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'Files' }])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [folderName, setFolderName] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    setIsLoading(true)
    try {
      const [fRes, flRes] = await Promise.all([
        getProjectFiles(projectId, currentFolderId),
        getProjectFolders(projectId),
      ])
      const filteredFolders = currentFolderId
        ? flRes.filter((fl: any) => fl.parent_id === currentFolderId)
        : flRes.filter((fl: any) => !fl.parent_id)
      setFiles(fRes)
      setFolders(filteredFolders)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, currentFolderId, currentOrganization])

  useEffect(() => { fetchData() }, [fetchData])

  const handleNavigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId)
    setFolderPath(prev => [...prev, { id: folderId, name: folderName }])
  }

  const handleNavigateBreadcrumb = (index: number) => {
    const newPath = folderPath.slice(0, index + 1)
    setFolderPath(newPath)
    setCurrentFolderId(newPath[newPath.length - 1].id)
  }

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return
    setSaving(true)
    try {
      await createFolder({
        project_id: projectId,
        name: folderName.trim(),
        parent_id: currentFolderId,
      })
      toast.success('Folder created')
      setShowNewFolder(false)
      setFolderName('')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create folder')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentOrganization) return
    setUploading(true)
    try {
      const user = (await supabase.auth.getUser()).data.user
      const fileExt = file.name.split('.').pop()
      const fileName = `${projectId}/${crypto.randomUUID()}.${fileExt}`
      const bucket = 'project-files'

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase.from('project_files').insert({
        project_id: projectId,
        folder_id: currentFolderId,
        name: file.name,
        file_name: fileName,
        mime_type: file.type,
        size_bytes: file.size,
        url: publicUrl,
        created_by: user?.id,
        organization_id: currentOrganization.id,
      })
      if (dbError) throw dbError

      toast.success('File uploaded')
      setShowUpload(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.is_folder) {
        const { error } = await supabase.from('project_folders').delete().eq('id', deleteTarget.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('project_files').update({ deleted_at: new Date().toISOString() }).eq('id', deleteTarget.id)
        if (error) throw error
      }
      toast.success(deleteTarget.is_folder ? 'Folder deleted' : 'File deleted')
      setDeleteTarget(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const allItems = [
    ...folders.map((f: any) => ({ ...f, is_folder: true })),
    ...files.map((f: any) => ({ ...f, is_folder: false })),
  ]

  return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/${orgSlug}/projects/${projectId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Files</h1>
              <nav className="flex items-center gap-1 text-sm text-zinc-500 mt-0.5">
                {folderPath.map((item, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3 w-3 text-zinc-300" />}
                    <button
                      onClick={() => handleNavigateBreadcrumb(i)}
                      className={cn(
                        'hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors',
                        i === folderPath.length - 1 ? 'text-zinc-900 dark:text-zinc-100 font-medium' : ''
                      )}
                    >
                      {i === 0 ? <Home className="h-3.5 w-3.5" /> : item.name}
                    </button>
                  </span>
                ))}
              </nav>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowNewFolder(true)}>
              <Folder className="h-4 w-4 mr-1" />New Folder
            </Button>
            <Button size="sm" onClick={() => setShowUpload(true)}>
              <Upload className="h-4 w-4 mr-1" />Upload
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            ) : allItems.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No files yet"
                description="Upload files or create a folder to get started"
                action={
                  <Button size="sm" onClick={() => setShowUpload(true)}>
                    <Upload className="h-4 w-4 mr-1" />Upload File
                  </Button>
                }
              />
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {allItems.map(item => {
                  const Icon = item.is_folder ? Folder : getFileIcon(item.mime_type)
                  const isImage = !item.is_folder && item.mime_type?.startsWith('image/')
                  return (
                    <div key={`${item.is_folder ? 'f' : 'fi'}-${item.id}`} className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className={cn(
                        'rounded-lg p-2 shrink-0',
                        item.is_folder ? 'bg-amber-100 dark:bg-amber-950' : 'bg-zinc-100 dark:bg-zinc-800'
                      )}>
                        <Icon className={cn(
                          'h-4 w-4',
                          item.is_folder ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500'
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        {item.is_folder ? (
                          <button
                            onClick={() => handleNavigateToFolder(item.id, item.name)}
                            className="text-sm font-medium hover:text-blue-500 transition-colors text-left"
                          >
                            {item.name}
                          </button>
                        ) : (
                          <div>
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                              {item.size_bytes && <span>{formatBytes(item.size_bytes)}</span>}
                              {item.created_at && <span>{formatDate(item.created_at)}</span>}
                            </div>
                          </div>
                        )}
                      </div>

                      {isImage && (
                        <div className="shrink-0">
                          <img
                            src={item.url}
                            alt={item.name}
                            className="h-10 w-10 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-1 shrink-0">
                        {!item.is_folder && (
                          <Button variant="ghost" size="icon-sm" asChild>
                            <a href={item.url} target="_blank" rel="noopener noreferrer" download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteTarget(item)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
            <DialogDescription>Create a folder to organize files</DialogDescription>
          </DialogHeader>
          <Input
            label="Folder name"
            value={folderName}
            onChange={e => setFolderName(e.target.value)}
            placeholder="Enter folder name"
            onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder() }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolder(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={saving || !folderName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>Upload a file to this project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div
              onClick={() => document.getElementById('file-upload-input')?.click()}
              className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 p-8 hover:border-zinc-400 transition-colors dark:border-zinc-800 dark:hover:border-zinc-500"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-zinc-400 mb-2" />
                  <p className="text-sm text-zinc-500">Click to browse or drag a file</p>
                  <p className="text-xs text-zinc-400 mt-1">Max 50MB</p>
                </>
              )}
            </div>
            <input
              id="file-upload-input"
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)} disabled={uploading}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.is_folder ? 'Folder' : 'File'}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.is_folder
                ? 'This will delete the folder and all its contents. This action cannot be undone.'
                : 'This will delete the file. It will be moved to trash.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  )
}
