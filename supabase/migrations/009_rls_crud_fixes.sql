-- 009_rls_crud_fixes.sql
-- Fix missing RLS policies that silently broke CRUD operations.
-- These mirror the existing is_org_member / is_project_member helpers.

-- ============================================================================
-- tasks: INSERT + UPDATE (soft delete / status change). Only SELECT existed.
-- ============================================================================
drop policy if exists "Members can insert tasks" on public.tasks;
create policy "Members can insert tasks"
  on public.tasks for insert
  to authenticated
  with check (
    organization_id in (
      select organization_members.organization_id
      from organization_members
      where organization_members.user_id = auth.uid()
    )
  );

drop policy if exists "Members can update tasks" on public.tasks;
create policy "Members can update tasks"
  on public.tasks for update
  to authenticated
  using (
    organization_id in (
      select organization_members.organization_id
      from organization_members
      where organization_members.user_id = auth.uid()
    )
  )
  with check (
    organization_id in (
      select organization_members.organization_id
      from organization_members
      where organization_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- task_comments: INSERT (commenting). Only SELECT existed.
-- ============================================================================
drop policy if exists "Members can insert task comments" on public.task_comments;
create policy "Members can insert task comments"
  on public.task_comments for insert
  to authenticated
  with check (
    exists (
      select 1 from public.tasks t
      where t.id = task_comments.task_id
        and t.organization_id in (
          select organization_members.organization_id
          from organization_members
          where organization_members.user_id = auth.uid()
        )
    )
  );

drop policy if exists "Members can update task comments" on public.task_comments;
create policy "Members can update task comments"
  on public.task_comments for update
  to authenticated
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_comments.task_id
        and t.organization_id in (
          select organization_members.organization_id
          from organization_members
          where organization_members.user_id = auth.uid()
        )
    )
  )
  with check (
    exists (
      select 1 from public.tasks t
      where t.id = task_comments.task_id
        and t.organization_id in (
          select organization_members.organization_id
          from organization_members
          where organization_members.user_id = auth.uid()
        )
    )
  );

-- ============================================================================
-- workspaces: INSERT, UPDATE, and soft-delete (UPDATE). Only SELECT existed.
-- ============================================================================
drop policy if exists "Members can insert workspaces" on public.workspaces;
create policy "Members can insert workspaces"
  on public.workspaces for insert
  to authenticated
  with check (
    organization_id in (
      select organization_members.organization_id
      from organization_members
      where organization_members.user_id = auth.uid()
    )
  );

drop policy if exists "Members can update workspaces" on public.workspaces;
create policy "Members can update workspaces"
  on public.workspaces for update
  to authenticated
  using (
    organization_id in (
      select organization_members.organization_id
      from organization_members
      where organization_members.user_id = auth.uid()
    )
  )
  with check (
    organization_id in (
      select organization_members.organization_id
      from organization_members
      where organization_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- teams: INSERT, UPDATE, and soft-delete (UPDATE). Only SELECT existed.
-- ============================================================================
drop policy if exists "Members can insert teams" on public.teams;
create policy "Members can insert teams"
  on public.teams for insert
  to authenticated
  with check (
    organization_id in (
      select organization_members.organization_id
      from organization_members
      where organization_members.user_id = auth.uid()
    )
  );

drop policy if exists "Members can update teams" on public.teams;
create policy "Members can update teams"
  on public.teams for update
  to authenticated
  using (
    organization_id in (
      select organization_members.organization_id
      from organization_members
      where organization_members.user_id = auth.uid()
    )
  )
  with check (
    organization_id in (
      select organization_members.organization_id
      from organization_members
      where organization_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- organization_members: INSERT (inviting members / self-onboard on org create).
-- ============================================================================
drop policy if exists "Members can insert organization members" on public.organization_members;
create policy "Members can insert organization members"
  on public.organization_members for insert
  to authenticated
  with check (
    organization_id in (
      select organization_members.organization_id
      from organization_members
      where organization_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- api_keys: INSERT (creating API keys). Only SELECT existed.
-- ============================================================================
drop policy if exists "Members can insert API keys" on public.api_keys;
create policy "Members can insert API keys"
  on public.api_keys for insert
  to authenticated
  with check (
    organization_id in (
      select organization_members.organization_id
      from organization_members
      where organization_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- crm_tags: SELECT (reading tags). Only INSERT existed.
-- ============================================================================
drop policy if exists "Members can view CRM tags" on public.crm_tags;
create policy "Members can view CRM tags"
  on public.crm_tags for select
  to authenticated
  using (
    organization_id in (
      select organization_members.organization_id
      from organization_members
      where organization_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- crm_entity_tags: SELECT + DELETE. Only INSERT existed.
-- ============================================================================
drop policy if exists "Members can view entity tags" on public.crm_entity_tags;
create policy "Members can view entity tags"
  on public.crm_entity_tags for select
  to authenticated
  using (
    exists (
      select 1 from public.crm_tags t
      where t.id = crm_entity_tags.tag_id
        and t.organization_id in (
          select organization_members.organization_id
          from organization_members
          where organization_members.user_id = auth.uid()
        )
    )
  );

drop policy if exists "Members can delete entity tags" on public.crm_entity_tags;
create policy "Members can delete entity tags"
  on public.crm_entity_tags for delete
  to authenticated
  using (
    exists (
      select 1 from public.crm_tags t
      where t.id = crm_entity_tags.tag_id
        and t.organization_id in (
          select organization_members.organization_id
          from organization_members
          where organization_members.user_id = auth.uid()
        )
    )
  );

-- ============================================================================
-- crm_pipeline_stages: SELECT. Only INSERT/UPDATE existed.
-- ============================================================================
drop policy if exists "Members can view pipeline stages" on public.crm_pipeline_stages;
create policy "Members can view pipeline stages"
  on public.crm_pipeline_stages for select
  to authenticated
  using (
    exists (
      select 1 from public.crm_pipelines p
      where p.id = crm_pipeline_stages.pipeline_id
        and p.organization_id in (
          select organization_members.organization_id
          from organization_members
          where organization_members.user_id = auth.uid()
        )
    )
  );

-- ============================================================================
-- crm_activities: SELECT. Only INSERT/UPDATE existed.
-- ============================================================================
drop policy if exists "Members can view activities" on public.crm_activities;
create policy "Members can view activities"
  on public.crm_activities for select
  to authenticated
  using (
    organization_id in (
      select organization_members.organization_id
      from organization_members
      where organization_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- crm_notes: SELECT. Only INSERT/UPDATE existed.
-- ============================================================================
drop policy if exists "Members can view CRM notes" on public.crm_notes;
create policy "Members can view CRM notes"
  on public.crm_notes for select
  to authenticated
  using (
    organization_id in (
      select organization_members.organization_id
      from organization_members
      where organization_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- crm_tasks: SELECT. Only INSERT/UPDATE existed.
-- ============================================================================
drop policy if exists "Members can view CRM tasks" on public.crm_tasks;
create policy "Members can view CRM tasks"
  on public.crm_tasks for select
  to authenticated
  using (
    organization_id in (
      select organization_members.organization_id
      from organization_members
      where organization_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- project_files: UPDATE (soft delete / rename). Only INSERT/SELECT existed.
-- ============================================================================
drop policy if exists "Members can update project files" on public.project_files;
create policy "Members can update project files"
  on public.project_files for update
  to authenticated
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_files.project_id
        and pm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_files.project_id
        and pm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- project_folders: DELETE. Only INSERT/SELECT existed.
-- ============================================================================
drop policy if exists "Members can delete project folders" on public.project_folders;
create policy "Members can delete project folders"
  on public.project_folders for delete
  to authenticated
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_folders.project_id
        and pm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- task_checklist_items: DELETE. Only INSERT/UPDATE/SELECT existed.
-- ============================================================================
drop policy if exists "Members can delete checklist items" on public.task_checklist_items;
create policy "Members can delete checklist items"
  on public.task_checklist_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.tasks t
      join public.project_members pm on pm.project_id = t.project_id
      where t.id = task_checklist_items.task_id
        and pm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- task_dependencies: DELETE. Only INSERT/SELECT existed.
-- ============================================================================
drop policy if exists "Members can delete dependencies" on public.task_dependencies;
create policy "Members can delete dependencies"
  on public.task_dependencies for delete
  to authenticated
  using (
    exists (
      select 1 from public.tasks t
      join public.project_members pm on pm.project_id = t.project_id
      where t.id = task_dependencies.task_id
        and pm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- project_members: UPDATE + DELETE (changing/removing members). Only INSERT/SELECT existed.
-- ============================================================================
drop policy if exists "Admins can update project members" on public.project_members;
create policy "Admins can update project members"
  on public.project_members for update
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_members.project_id
        and p.organization_id in (
          select organization_members.organization_id
          from organization_members
          where organization_members.user_id = auth.uid()
        )
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_members.project_id
        and p.organization_id in (
          select organization_members.organization_id
          from organization_members
          where organization_members.user_id = auth.uid()
        )
    )
  );

drop policy if exists "Admins can delete project members" on public.project_members;
create policy "Admins can delete project members"
  on public.project_members for delete
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_members.project_id
        and p.organization_id in (
          select organization_members.organization_id
          from organization_members
          where organization_members.user_id = auth.uid()
        )
    )
  );