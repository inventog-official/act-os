export interface NavItem {
  title: string
  href: string
  icon: string
  badge?: string
  items?: NavItem[]
}

export const crmNavigation: NavItem[] = [
  {
    title: 'CRM Dashboard',
    href: '/crm',
    icon: 'LayoutDashboard',
  },
  {
    title: 'Leads',
    href: '/crm/leads',
    icon: 'UserPlus',
  },
  {
    title: 'Companies',
    href: '/crm/companies',
    icon: 'Building2',
  },
  {
    title: 'Contacts',
    href: '/crm/contacts',
    icon: 'Users',
  },
  {
    title: 'Pipeline',
    href: '/crm/pipeline',
    icon: 'KanbanSquare',
  },
  {
    title: 'Activities',
    href: '/crm/activities',
    icon: 'Activity',
  },
  {
    title: 'Tasks',
    href: '/crm/tasks',
    icon: 'CheckSquare',
  },
]

export interface NavItem {
  title: string
  href: string
  icon: string
  badge?: string
  items?: NavItem[]
}

export const mainNavigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    title: 'CRM',
    href: '/crm',
    icon: 'ContactRound',
    badge: 'New',
  },
  {
    title: 'Projects',
    href: '/projects',
    icon: 'FolderKanban',
  },
  {
    title: 'Tasks',
    href: '/tasks',
    icon: 'CheckSquare',
  },
  {
    title: 'Teams',
    href: '/teams',
    icon: 'Users',
  },
  {
    title: 'Calendar',
    href: '/calendar',
    icon: 'Calendar',
  },
  {
    title: 'Activity',
    href: '/activity',
    icon: 'Activity',
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: 'BarChart3',
  },
]

export const settingsNavigation: NavItem[] = [
  {
    title: 'Profile',
    href: '/settings/profile',
    icon: 'User',
  },
  {
    title: 'Appearance',
    href: '/settings/appearance',
    icon: 'Palette',
  },
  {
    title: 'Security',
    href: '/settings/security',
    icon: 'Shield',
  },
  {
    title: 'Workspace',
    href: '/settings/workspace',
    icon: 'Building2',
  },
  {
    title: 'Billing',
    href: '/settings/billing',
    icon: 'CreditCard',
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
    icon: 'Bell',
  },
  {
    title: 'Members',
    href: '/settings/members',
    icon: 'UsersRound',
  },
  {
    title: 'API Keys',
    href: '/settings/api-keys',
    icon: 'Key',
  },
]
