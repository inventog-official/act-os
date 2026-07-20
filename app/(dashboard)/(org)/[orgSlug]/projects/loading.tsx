import { Skeleton } from '@/components/ui/skeleton'

export default function ProjectsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><Skeleton className="h-8 w-32 mb-2" /><Skeleton className="h-4 w-48" /></div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-3"><Skeleton className="h-2.5 w-2.5 rounded-full" /><Skeleton className="h-5 w-36" /></div>
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-1.5 w-full mb-3 rounded-full" />
            <div className="flex justify-between"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-20" /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
