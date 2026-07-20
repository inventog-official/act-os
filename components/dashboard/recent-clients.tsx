'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, randomColor } from '@/lib/utils'

const clients = [
  { id: '1', name: 'Acme Corp', project: 'Website Redesign', amount: '$12,000', status: 'active', initials: 'AC' },
  { id: '2', name: 'TechStart Inc', project: 'Mobile App', amount: '$28,500', status: 'active', initials: 'TI' },
  { id: '3', name: 'Global Media', project: 'Brand Refresh', amount: '$8,200', status: 'pending', initials: 'GM' },
  { id: '4', name: 'DataFlow Systems', project: 'API Integration', amount: '$15,000', status: 'completed', initials: 'DS' },
  { id: '5', name: 'CloudBase', project: 'Dashboard', amount: '$9,800', status: 'active', initials: 'CB' },
]

export function RecentClients() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Clients</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clients.map(client => (
            <div key={client.id} className="flex items-center gap-4">
              <Avatar className="h-9 w-9">
                <AvatarFallback style={{ backgroundColor: randomColor(), color: 'white' }} className="text-xs">
                  {client.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{client.name}</p>
                <p className="text-xs text-zinc-500">{client.project}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{client.amount}</p>
                <Badge
                  variant={
                    client.status === 'active' ? 'success' :
                    client.status === 'pending' ? 'warning' : 'secondary'
                  }
                  className="text-[10px]"
                >
                  {client.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
