import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function DocumentsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-10 w-10 rounded-xl mb-3" />
              <Skeleton className="h-8 w-28 mb-1" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 grid-cols-2">
        <Card><CardContent className="p-5"><Skeleton className="h-[280px] w-full" /></CardContent></Card>
        <Card><CardContent className="p-5"><Skeleton className="h-[280px] w-full" /></CardContent></Card>
      </div>
    </div>
  )
}