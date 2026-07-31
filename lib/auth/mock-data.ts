const MOCK_ORG_ID = '00000000-0000-0000-0000-000000000001'
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000'
const MOCK_PIPELINE_ID = '00000000-0000-0000-0000-000000000010'

export const mockOrganization = {
  id: MOCK_ORG_ID,
  name: 'Demo Corp',
  slug: 'demo-corp',
  logo_url: null,
  website: 'https://democorp.com',
  description: 'A sample organization for testing',
  owner_id: MOCK_USER_ID,
  settings: {},
  tier: 'starter',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
}

export const mockWorkspace = {
  id: '00000000-0000-0000-0000-000000000002',
  name: 'Default',
  slug: 'default',
  description: null,
  organization_id: MOCK_ORG_ID,
  settings: {},
  created_by: MOCK_USER_ID,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
}

const mockStages = [
  { id: 'stage-1', pipeline_id: MOCK_PIPELINE_ID, name: 'New', color: '#3b82f6', probability: 10, order_index: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'stage-2', pipeline_id: MOCK_PIPELINE_ID, name: 'Qualified', color: '#8b5cf6', probability: 30, order_index: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'stage-3', pipeline_id: MOCK_PIPELINE_ID, name: 'Proposal', color: '#6366f1', probability: 50, order_index: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'stage-4', pipeline_id: MOCK_PIPELINE_ID, name: 'Negotiation', color: '#ec4899', probability: 70, order_index: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'stage-5', pipeline_id: MOCK_PIPELINE_ID, name: 'Won', color: '#10b981', probability: 100, order_index: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'stage-6', pipeline_id: MOCK_PIPELINE_ID, name: 'Lost', color: '#ef4444', probability: 0, order_index: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

export const mockPipeline = {
  id: MOCK_PIPELINE_ID,
  name: 'Sales Pipeline',
  description: 'Default sales pipeline',
  organization_id: MOCK_ORG_ID,
  workspace_id: null,
  is_default: true,
  created_by: MOCK_USER_ID,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
}

let mockLeads = [
  { id: 'lead-1', first_name: 'Sarah', last_name: 'Chen', email: 'sarah@democorp.com', phone: '+1 555-0101', job_title: 'CEO', company_id: null, company_name: 'Demo Corp', website: 'https://democorp.com', industry: 'Technology', lead_source: 'website', priority: 'high', status: 'new', pipeline_stage_id: 'stage-1', estimated_deal_value: 25000, expected_close_date: '2025-08-15', description: 'Interested in enterprise plan', notes: null, organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, updated_by: null, created_at: new Date(Date.now() - 3600000).toISOString(), updated_at: new Date(Date.now() - 3600000).toISOString(), deleted_at: null },
  { id: 'lead-2', first_name: 'Mike', last_name: 'Johnson', email: 'mike@techstart.io', phone: '+1 555-0102', job_title: 'CTO', company_id: null, company_name: 'TechStart Inc', website: 'https://techstart.io', industry: 'SaaS', lead_source: 'referral', priority: 'medium', status: 'qualified', pipeline_stage_id: 'stage-2', estimated_deal_value: 50000, expected_close_date: '2025-09-01', description: 'Looking for scalable solution', notes: null, organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, updated_by: null, created_at: new Date(Date.now() - 7200000).toISOString(), updated_at: new Date(Date.now() - 7200000).toISOString(), deleted_at: null },
  { id: 'lead-3', first_name: 'Emily', last_name: 'Davis', email: 'emily@globalmedia.com', phone: '+1 555-0103', job_title: 'Marketing Director', company_id: null, company_name: 'Global Media', website: 'https://globalmedia.com', industry: 'Media', lead_source: 'email', priority: 'high', status: 'proposal', pipeline_stage_id: 'stage-3', estimated_deal_value: 75000, expected_close_date: '2025-08-28', description: 'Need comprehensive marketing automation', notes: null, organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, updated_by: null, created_at: new Date(Date.now() - 14400000).toISOString(), updated_at: new Date(Date.now() - 14400000).toISOString(), deleted_at: null },
]

let mockCompanies = [
  { id: 'company-1', name: 'Demo Corp', industry: 'Technology', employee_count: 250, revenue: 50000000, address_line1: '123 Main St', address_line2: null, city: 'San Francisco', state: 'CA', zip: '94105', country: null, website: 'https://democorp.com', phone: '+1 555-1000', email: 'info@democorp.com', gst_number: null, logo_url: null, description: 'Leading tech company', organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, updated_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
  { id: 'company-2', name: 'TechStart Inc', industry: 'SaaS', employee_count: 50, revenue: 10000000, address_line1: '456 Oak Ave', address_line2: null, city: 'Austin', state: 'TX', zip: '73301', country: null, website: 'https://techstart.io', phone: '+1 555-2000', email: 'hello@techstart.io', gst_number: null, logo_url: null, description: 'Fast-growing SaaS startup', organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, updated_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
  { id: 'company-3', name: 'Global Media', industry: 'Media', employee_count: 500, revenue: 200000000, address_line1: '789 Broadway', address_line2: null, city: 'New York', state: 'NY', zip: '10003', country: null, website: 'https://globalmedia.com', phone: '+1 555-3000', email: 'contact@globalmedia.com', gst_number: null, logo_url: null, description: 'Global media conglomerate', organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, updated_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
]

let mockContacts = [
  { id: 'contact-1', first_name: 'John', last_name: 'Smith', email: 'john@democorp.com', phone: '+1 555-1100', job_title: 'VP Sales', department: 'Sales', company_id: 'company-1', organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, updated_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
  { id: 'contact-2', first_name: 'Jane', last_name: 'Doe', email: 'jane@techstart.io', phone: '+1 555-2100', job_title: 'Product Manager', department: 'Product', company_id: 'company-2', organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, updated_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
  { id: 'contact-3', first_name: 'Bob', last_name: 'Wilson', email: 'bob@globalmedia.com', phone: '+1 555-3100', job_title: 'CTO', department: 'Engineering', company_id: 'company-3', organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, updated_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
]

let mockDeals = [
  { id: 'deal-1', name: 'Demo Corp Enterprise', deal_value: 25000, probability: 10, pipeline_id: MOCK_PIPELINE_ID, pipeline_stage_id: 'stage-1', lead_id: 'lead-1', company_id: 'company-1', contact_id: null, expected_close_date: '2025-08-15', actual_close_date: null, notes: null, organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, updated_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
  { id: 'deal-2', name: 'TechStart Scale-up', deal_value: 50000, probability: 30, pipeline_id: MOCK_PIPELINE_ID, pipeline_stage_id: 'stage-2', lead_id: 'lead-2', company_id: 'company-2', contact_id: null, expected_close_date: '2025-09-01', actual_close_date: null, notes: null, organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, updated_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
  { id: 'deal-3', name: 'Global Media Suite', deal_value: 75000, probability: 50, pipeline_id: MOCK_PIPELINE_ID, pipeline_stage_id: 'stage-3', lead_id: 'lead-3', company_id: 'company-3', contact_id: null, expected_close_date: '2025-08-28', actual_close_date: null, notes: null, organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, updated_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
]

let mockActivities = [
  { id: 'activity-1', type: 'call', subject: 'Discovery call with Demo Corp', description: 'Discussed project requirements and timeline', activity_date: new Date(Date.now() - 1800000).toISOString(), duration_minutes: 30, lead_id: 'lead-1', company_id: null, contact_id: null, deal_id: null, organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'activity-2', type: 'email', subject: 'Follow-up proposal sent', description: 'Sent detailed proposal for website redesign', activity_date: new Date(Date.now() - 7200000).toISOString(), duration_minutes: null, lead_id: 'lead-2', company_id: null, contact_id: null, deal_id: null, organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'activity-3', type: 'meeting', subject: 'Product demo with TechStart', description: 'Demonstrated platform capabilities', activity_date: new Date(Date.now() - 14400000).toISOString(), duration_minutes: 45, lead_id: 'lead-3', company_id: null, contact_id: null, deal_id: null, organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'activity-4', type: 'task', subject: 'Review contract terms', description: 'Legal review of partnership agreement', activity_date: new Date(Date.now() - 21600000).toISOString(), duration_minutes: null, lead_id: 'lead-1', company_id: null, contact_id: null, deal_id: null, organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

let mockTasks = [
  { id: 'task-1', title: 'Follow up with Demo Corp proposal', description: 'Send revised proposal with updated pricing', status: 'pending', priority: 'high', due_date: new Date(Date.now() + 86400000).toISOString(), reminder_at: null, is_recurring: false, recurring_interval: null, lead_id: 'lead-1', company_id: null, contact_id: null, deal_id: null, organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, updated_by: null, completed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
  { id: 'task-2', title: 'Prepare Q1 sales presentation', description: 'Create deck for quarterly review meeting', status: 'in_progress', priority: 'urgent', due_date: new Date(Date.now() + 172800000).toISOString(), reminder_at: null, is_recurring: false, recurring_interval: null, lead_id: null, company_id: null, contact_id: null, deal_id: null, organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, updated_by: null, completed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
  { id: 'task-3', title: 'Call Mike Johnson about TechStart', description: 'Discuss timeline and next steps', status: 'pending', priority: 'medium', due_date: new Date(Date.now() + 10800000).toISOString(), reminder_at: null, is_recurring: false, recurring_interval: null, lead_id: 'lead-2', company_id: null, contact_id: null, deal_id: null, organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, updated_by: null, completed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
  { id: 'task-4', title: 'Review contract terms with legal', description: 'DataFlow Systems partnership agreement', status: 'completed', priority: 'high', due_date: new Date(Date.now() - 86400000).toISOString(), reminder_at: null, is_recurring: false, recurring_interval: null, lead_id: null, company_id: null, contact_id: null, deal_id: null, organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, updated_by: null, completed_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
  { id: 'task-5', title: 'Weekly team standup', description: 'Monday morning sync with sales team', status: 'pending', priority: 'medium', due_date: new Date(Date.now() + 259200000).toISOString(), reminder_at: null, is_recurring: true, recurring_interval: 'weekly', lead_id: null, company_id: null, contact_id: null, deal_id: null, organization_id: MOCK_ORG_ID, workspace_id: null, assigned_to: null, created_by: MOCK_USER_ID, updated_by: null, completed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
]

let mockNotes: any[] = []

export function getMockData(table: string) {
  switch (table) {
    case 'organizations': return [mockOrganization]
    case 'workspaces': return [mockWorkspace]
    case 'crm_pipelines': return [mockPipeline]
    case 'crm_pipeline_stages': return mockStages
    case 'crm_leads': return [...mockLeads]
    case 'crm_companies': return [...mockCompanies]
    case 'crm_contacts': return [...mockContacts]
    case 'crm_deals': return [...mockDeals]
    case 'crm_activities': return [...mockActivities]
    case 'crm_tasks': return [...mockTasks]
    case 'crm_notes': return [...mockNotes]
    default: return []
  }
}

export function addMockData(table: string, item: any) {
  const newItem = { ...item, id: item.id || crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  switch (table) {
    case 'crm_leads': mockLeads = [newItem, ...mockLeads]; break
    case 'crm_companies': mockCompanies = [newItem, ...mockCompanies]; break
    case 'crm_contacts': mockContacts = [newItem, ...mockContacts]; break
    case 'crm_deals': mockDeals = [newItem, ...mockDeals]; break
    case 'crm_activities': mockActivities = [newItem, ...mockActivities]; break
    case 'crm_tasks': mockTasks = [newItem, ...mockTasks]; break
    case 'crm_notes': mockNotes = [newItem, ...mockNotes]; break
  }
  return newItem
}

export function updateMockData(table: string, id: string, updates: any) {
  const update = (arr: any[]) => arr.map(item => item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item)
  switch (table) {
    case 'crm_leads': mockLeads = update(mockLeads); break
    case 'crm_companies': mockCompanies = update(mockCompanies); break
    case 'crm_contacts': mockContacts = update(mockContacts); break
    case 'crm_deals': mockDeals = update(mockDeals); break
    case 'crm_activities': mockActivities = update(mockActivities); break
    case 'crm_tasks': mockTasks = update(mockTasks); break
  }
}

export function deleteMockData(table: string, id: string) {
  const softDelete = (arr: any[]) => arr.map(item => item.id === id ? { ...item, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() } : item)
  switch (table) {
    case 'crm_leads': mockLeads = softDelete(mockLeads); break
    case 'crm_companies': mockCompanies = softDelete(mockCompanies); break
    case 'crm_contacts': mockContacts = softDelete(mockContacts); break
    case 'crm_deals': mockDeals = softDelete(mockDeals); break
    case 'crm_tasks': mockTasks = softDelete(mockTasks); break
  }
}
