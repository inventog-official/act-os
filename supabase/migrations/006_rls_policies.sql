-- ACT OS RLS Policies for tables missing them

-- Projects
CREATE POLICY "Members can view projects"
  ON projects FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    AND deleted_at IS NULL
  );

CREATE POLICY "Members can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can update projects"
  ON projects FOR UPDATE
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    AND deleted_at IS NULL
  );

CREATE POLICY "Members can delete projects"
  ON projects FOR UPDATE
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    AND deleted_at IS NULL
  );

-- Teams
CREATE POLICY "Members can view teams"
  ON teams FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    AND deleted_at IS NULL
  );

-- Organization members
CREATE POLICY "Members can view organization members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Team members
CREATE POLICY "Members can view team members"
  ON team_members FOR SELECT
  USING (
    team_id IN (SELECT id FROM teams WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
  );

-- Roles
CREATE POLICY "Members can view roles"
  ON roles FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Permissions
CREATE POLICY "Anyone can view permissions"
  ON permissions FOR SELECT
  USING (true);

-- Role permissions
CREATE POLICY "Members can view role permissions"
  ON role_permissions FOR SELECT
  USING (
    role_id IN (SELECT id FROM roles WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
  );

-- Activities (foundation)
CREATE POLICY "Members can view activities"
  ON activities FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own notifications"
  ON notifications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- API Keys
CREATE POLICY "Members can view API keys"
  ON api_keys FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    AND deleted_at IS NULL
  );

-- Audit logs
CREATE POLICY "Members can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Project tables
CREATE POLICY "Members can view project tags"
  ON project_tags FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
    AND deleted_at IS NULL
  );

CREATE POLICY "Members can view project folders"
  ON project_folders FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Members can view project files"
  ON project_files FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
    AND deleted_at IS NULL
  );

CREATE POLICY "Members can view project activities"
  ON project_activities FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Members can view checklist items"
  ON task_checklist_items FOR SELECT
  USING (
    task_id IN (SELECT id FROM tasks WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Members can view subtasks"
  ON task_subtasks FOR SELECT
  USING (
    parent_task_id IN (SELECT id FROM tasks WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Members can view dependencies"
  ON task_dependencies FOR SELECT
  USING (
    task_id IN (SELECT id FROM tasks WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Members can view watchers"
  ON task_watchers FOR SELECT
  USING (
    task_id IN (SELECT id FROM tasks WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Members can view attachments"
  ON task_attachments FOR SELECT
  USING (
    task_id IN (SELECT id FROM tasks WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
    AND deleted_at IS NULL
  );

CREATE POLICY "Members can view labels"
  ON task_labels FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    AND deleted_at IS NULL
  );

CREATE POLICY "Members can view label assignments"
  ON task_label_assignments FOR SELECT
  USING (
    label_id IN (SELECT id FROM task_labels WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Members can view milestones"
  ON milestones FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
    AND deleted_at IS NULL
  );

CREATE POLICY "Members can view milestone tasks"
  ON milestone_tasks FOR SELECT
  USING (
    milestone_id IN (SELECT id FROM milestones WHERE project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())))
  );

CREATE POLICY "Members can view sprints"
  ON sprints FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
    AND deleted_at IS NULL
  );

CREATE POLICY "Members can view sprint tasks"
  ON sprint_tasks FOR SELECT
  USING (
    sprint_id IN (SELECT id FROM sprints WHERE project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())))
  );

CREATE POLICY "Members can view time entries"
  ON time_entries FOR SELECT
  USING (
    task_id IN (SELECT id FROM tasks WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
    AND deleted_at IS NULL
  );

-- INSERT policies for project tables
CREATE POLICY "Members can insert project tags"
  ON project_tags FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM project_members WHERE project_id = project_tags.project_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can insert project folders"
  ON project_folders FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM project_members WHERE project_id = project_folders.project_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can insert project files"
  ON project_files FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM project_members WHERE project_id = project_files.project_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can insert activities"
  ON project_activities FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM project_members WHERE project_id = project_activities.project_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can insert checklist items"
  ON task_checklist_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id WHERE t.id = task_checklist_items.task_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "Members can insert subtasks"
  ON task_subtasks FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id WHERE t.id = task_subtasks.parent_task_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "Members can insert dependencies"
  ON task_dependencies FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id WHERE t.id = task_dependencies.task_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "Members can insert watchers"
  ON task_watchers FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id WHERE t.id = task_watchers.task_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "Members can insert attachments"
  ON task_attachments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id WHERE t.id = task_attachments.task_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "Members can insert labels"
  ON task_labels FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can insert label assignments"
  ON task_label_assignments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM task_labels WHERE id = task_label_assignments.label_id AND organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Members can insert milestones"
  ON milestones FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM project_members WHERE project_id = milestones.project_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can insert milestone tasks"
  ON milestone_tasks FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM milestones m JOIN project_members pm ON pm.project_id = m.project_id WHERE m.id = milestone_tasks.milestone_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "Members can insert sprints"
  ON sprints FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM project_members WHERE project_id = sprints.project_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can insert sprint tasks"
  ON sprint_tasks FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM sprints s JOIN project_members pm ON pm.project_id = s.project_id WHERE s.id = sprint_tasks.sprint_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "Members can insert time entries"
  ON time_entries FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- UPDATE/DELETE policies (typically same as SELECT)
CREATE POLICY "Members can update checklist items"
  ON task_checklist_items FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id WHERE t.id = task_checklist_items.task_id AND pm.user_id = auth.uid())
  );

CREATE POLICY "Members can update milestones"
  ON milestones FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM project_members WHERE project_id = milestones.project_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can update sprints"
  ON sprints FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM project_members WHERE project_id = sprints.project_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can update time entries"
  ON time_entries FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Members can update labels"
  ON task_labels FOR UPDATE
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can delete label assignments"
  ON task_label_assignments FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM task_labels WHERE id = task_label_assignments.label_id AND organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
  );
