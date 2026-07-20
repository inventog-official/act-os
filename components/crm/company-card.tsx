'use client'

import { Building2, MapPin, Globe, Users, DollarSign, Mail, Phone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, formatCurrency, formatNumber } from '@/lib/utils'
import type { CrmCompany } from '@/lib/types/database'

interface CompanyCardProps {
  company: CrmCompany
  onClick?: () => void
}

export function CompanyCard({ company, onClick }: CompanyCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 rounded-lg">
            <AvatarFallback className="rounded-lg text-sm bg-zinc-100 dark:bg-zinc-800">
              {getInitials(company.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{company.name}</h3>
            {company.industry && (
              <p className="text-sm text-zinc-500">{company.industry}</p>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {company.city && company.state && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{company.city}, {company.state}</span>
            </div>
          )}
          {company.email && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{company.email}</span>
            </div>
          )}
          {company.phone && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{company.phone}</span>
            </div>
          )}
          {company.website && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{company.website}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {company.employee_count && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {formatNumber(company.employee_count)} employees
            </Badge>
          )}
          {company.revenue && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(company.revenue)} revenue
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
