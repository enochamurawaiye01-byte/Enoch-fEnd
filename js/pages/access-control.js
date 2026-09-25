(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser || !['ADMIN', 'SUPER_ADMIN'].includes(window.CurrentUser.role)) return;

    // Tabs switching
    const tabBtns = document.querySelectorAll('.rbac-tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabBtns.forEach((b) => b.classList.remove('active'));
        tabPanes.forEach((p) => (p.style.display = 'none'));
        btn.classList.add('active');
        const target = document.getElementById(`tab-${btn.dataset.tab}`);
        if (target) target.style.display = 'block';

        if (btn.dataset.tab === 'matrix') loadMatrix();
        if (btn.dataset.tab === 'roles') loadRoles();
        if (btn.dataset.tab === 'permissions') loadPermissions();
      });
    });

    // Refresh Matrix button
    const refreshMatrixBtn = document.getElementById('refresh-matrix-btn');
    if (refreshMatrixBtn) {
      refreshMatrixBtn.addEventListener('click', () => loadMatrix());
    }

    // Tab 1: User Access Table
    const table = DataTable.create({
      tbody: document.getElementById('access-users-tbody'),
      paginationEl: document.getElementById('access-users-pagination'),
      pageSize: 15,
      columns: [
        { key: 'fullName', label: 'User', render: (r) => `<strong>${escapeHtml(r.fullName)}</strong>` },
        { key: 'email', label: 'Email', render: (r) => escapeHtml(r.email || '—') },
        { key: 'role', label: 'Role', render: (r) => `<span class="badge badge-primary">${escapeHtml(titleCaseFromEnum(r.role))}</span>` },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${r.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}">${escapeHtml(r.status)}</span>` },
      ],
      rowActions: (row) => `
        <button type="button" class="btn btn-secondary btn-sm" data-action="change-role">Change Role</button>
        <button type="button" class="btn btn-outline btn-sm" data-action="manage-perms">Grant Permissions</button>
        <button type="button" class="btn ${row.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'} btn-sm" data-action="toggle-status">${row.status === 'ACTIVE' ? 'Deactivate' : 'Activate & Provision'}</button>
      `,
      fetchPage: (page, filters) => UsersService.list({ page, pageSize: 15, search: filters.search || '' }),
      emptyMessage: 'No user accounts found.',
    });

    table.load();

    const searchInput = document.getElementById('access-user-search');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => table.setFilters({ search: searchInput.value.trim() }), 350));
    }

    // User Table Action Handler
    document.getElementById('access-users-tbody').addEventListener('click', async (event) => {
      const btn = event.target.closest('[data-action]');
      const row = event.target.closest('tr[data-row-id]');
      if (!btn || !row) return;

      const userId = row.dataset.rowId;
      const action = btn.dataset.action;

      if (action === 'toggle-status') {
        const isCurrentlyActive = btn.textContent.includes('Deactivate');
        const nextStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';

        ConfirmDialog.open({
          title: isCurrentlyActive ? 'Deactivate User Account' : 'Activate & Provision Account',
          message: isCurrentlyActive
            ? 'Deactivating this account revokes access until re-enabled.'
            : 'Activating will provision all required Student/Staff profiles and generate official registration numbers.',
          confirmLabel: isCurrentlyActive ? 'Deactivate' : 'Activate & Provision',
          tone: isCurrentlyActive ? 'danger' : 'primary',
          onConfirm: async () => {
            try {
              const res = await UsersService.activate(userId);
              const regNo = res.registrationNumber || res.communication?.registrationNumber || '';
              Toast.success(isCurrentlyActive ? 'Account deactivated.' : `Account activated! ${regNo ? `Reg No: ${regNo}` : ''}`);
              table.reload();
            } catch (err) {
              Toast.error(err.message || 'Failed to update user status.');
            }
          },
        });
      }

      if (action === 'change-role') {
        const rolesList = ['MANAGEMENT', 'PRINCIPAL', 'VICE_PRINCIPAL', 'HEAD_TEACHER', 'BURSAR', 'TEACHER', 'STAFF', 'STUDENT', 'PARENT', 'ADMIN'];
        Modal.open({
          title: 'Change User Role',
          content: `
            <form id="change-role-form" class="form">
              <div class="form-group">
                <label class="form-label">Select New Role</label>
                <select name="role" class="form-control" required>
                  ${rolesList.map((r) => `<option value="${r}">${titleCaseFromEnum(r)}</option>`).join('')}
                </select>
              </div>
              <div class="modal__footer">
                <button type="submit" class="btn btn-primary">Update Role</button>
              </div>
            </form>
          `,
          onOpen: (modalEl) => {
            modalEl.querySelector('form').addEventListener('submit', async (e) => {
              e.preventDefault();
              const newRole = e.target.role.value;
              try {
                await RolesService.changeUserRole(userId, newRole);
                Toast.success(`Role changed to ${titleCaseFromEnum(newRole)}`);
                Modal.close();
                table.reload();
              } catch (err) {
                Toast.error(err.message || 'Failed to update user role');
              }
            });
          },
        });
      }

      if (action === 'manage-perms') {
        try {
          const perms = await PermissionsService.list();
          const items = Array.isArray(perms) ? perms : perms.items || [];
          Modal.open({
            title: 'Grant User Custom Permission',
            size: 'md',
            content: `
              <form id="grant-perm-form" class="form">
                <div class="form-group">
                  <label class="form-label">Select Permission to Grant</label>
                  <select name="permissionId" class="form-control" required>
                    ${items.length ? items.map((p) => `<option value="${p.id}">${p.module.toUpperCase()} — ${p.key} (${p.action})</option>`).join('') : '<option value="">No permissions catalogued</option>'}
                  </select>
                </div>
                <div class="modal__footer">
                  <button type="submit" class="btn btn-primary">Grant Permission</button>
                </div>
              </form>
            `,
            onOpen: (modalEl) => {
              modalEl.querySelector('form').addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                  await PermissionsService.assign({ userId, permissionId: e.target.permissionId.value });
                  Toast.success('Permission granted successfully');
                  Modal.close();
                } catch (err) {
                  Toast.error(err.message || 'Failed to grant permission');
                }
              });
            },
          });
        } catch (err) {
          Toast.error(err.message || 'Failed to load permissions');
        }
      }
    });

    // Tab 2: Permission Matrix Logic
    async function loadMatrix() {
      const tbody = document.getElementById('matrix-tbody');
      const theadRow = document.getElementById('matrix-thead-row');
      if (!tbody || !theadRow) return;
      tbody.innerHTML = '<tr><td colspan="10">Loading Permission Matrix...</td></tr>';
      try {
        const [rolesRes, permsRes] = await Promise.all([
          RolesService.list(),
          PermissionsService.list(),
        ]);
        const roles = Array.isArray(rolesRes) ? rolesRes : rolesRes.items || [];
        const perms = Array.isArray(permsRes) ? permsRes : permsRes.items || [];

        theadRow.innerHTML = '<th>Module / Permission Key</th>' + roles.map((r) => `<th style="text-align:center;">${escapeHtml(r.name)}</th>`).join('');

        if (!perms.length) {
          tbody.innerHTML = '<tr><td colspan="10">No permissions catalogued yet. Create keys in the Permissions Catalog tab.</td></tr>';
          return;
        }

        tbody.innerHTML = perms.map((p) => {
          const assignedRoleIds = new Set((p.roles || []).map((r) => r.roleId || r.id));
          return `
            <tr>
              <td>
                <span class="badge badge-outline">${escapeHtml(p.module.toUpperCase())}</span>
                <strong style="margin-left:6px;">${escapeHtml(p.key)}</strong>
                <div style="font-size:11px; color:var(--text-muted, #94a3b8);">${escapeHtml(p.description || p.action)}</div>
              </td>
              ${roles.map((r) => {
                const isChecked = assignedRoleIds.has(r.id);
                return `
                  <td style="text-align:center;">
                    <input type="checkbox" class="matrix-toggle" data-role-id="${r.id}" data-perm-id="${p.id}" ${isChecked ? 'checked' : ''} ${r.isSystem && r.name === 'SUPER_ADMIN' ? 'disabled' : ''} />
                  </td>
                `;
              }).join('')}
            </tr>
          `;
        }).join('');
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-danger">Failed to load permission matrix: ${escapeHtml(err.message)}</td></tr>`;
      }
    }

    // Toggle Checkbox event listener for Permission Matrix
    const matrixTbody = document.getElementById('matrix-tbody');
    if (matrixTbody) {
      matrixTbody.addEventListener('change', async (e) => {
        const checkbox = e.target.closest('.matrix-toggle');
        if (!checkbox) return;
        const roleId = checkbox.dataset.roleId;
        const permissionId = checkbox.dataset.permId;
        const isChecked = checkbox.checked;

        try {
          if (isChecked) {
            await PermissionsService.assign({ roleId, permissionId });
            Toast.success('Permission granted to role.');
          } else {
            await PermissionsService.revoke({ roleId, permissionId });
            Toast.success('Permission revoked from role.');
          }
        } catch (err) {
          checkbox.checked = !isChecked;
          Toast.error(err.message || 'Failed to update permission assignment.');
        }
      });
    }

    // Tab 3: Load Roles
    async function loadRoles() {
      const grid = document.getElementById('roles-grid');
      if (!grid) return;
      grid.innerHTML = '<div class="loader"></div>';
      try {
        const roles = await RolesService.list();
        const items = Array.isArray(roles) ? roles : roles.items || [];
        grid.innerHTML = items.map((r) => `
          <div class="perm-card">
            <div class="perm-card__header">
              <span>${escapeHtml(r.name)}</span>
              ${r.isSystem ? '<span class="badge badge-outline">System</span>' : '<span class="badge badge-success">Custom</span>'}
            </div>
            <div class="perm-card__desc">${escapeHtml(r.description || 'System role definition')}</div>
            <div style="font-size:12px;color:#94a3b8;">Permissions assigned: ${(r.permissions || []).length}</div>
          </div>
        `).join('') || '<p>No roles defined.</p>';
      } catch (err) {
        grid.innerHTML = `<p class="text-danger">Failed to load roles: ${escapeHtml(err.message)}</p>`;
      }
    }

    // Tab 4: Load Permissions
    async function loadPermissions() {
      const tbody = document.getElementById('permissions-tbody');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="5">Loading permissions...</td></tr>';
      try {
        const res = await PermissionsService.list();
        const items = Array.isArray(res) ? res : res.items || [];
        tbody.innerHTML = items.map((p) => `
          <tr data-row-id="${p.id}">
            <td><span class="badge badge-outline">${escapeHtml(p.module)}</span></td>
            <td><code>${escapeHtml(p.key)}</code></td>
            <td>${escapeHtml(p.action)}</td>
            <td>${escapeHtml(p.description || '—')}</td>
            <td style="text-align:right;">
              <button type="button" class="btn btn-danger btn-sm" data-action="delete-perm">Delete</button>
            </td>
          </tr>
        `).join('') || '<tr><td colspan="5">No permissions in catalog.</td></tr>';
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-danger">Failed to load permissions: ${escapeHtml(err.message)}</td></tr>`;
      }
    }

    // Create Role Btn
    const addRoleBtn = document.getElementById('add-role-btn');
    if (addRoleBtn) {
      addRoleBtn.addEventListener('click', () => {
        Modal.open({
          title: 'Create Custom Role',
          content: `
            <form id="create-role-form" class="form">
              <div class="form-group">
                <label class="form-label">Role Name</label>
                <input type="text" name="name" class="form-control" placeholder="e.g. ACADEMIC_COORDINATOR" required />
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea name="description" class="form-control" placeholder="Role responsibilities..."></textarea>
              </div>
              <div class="modal__footer">
                <button type="submit" class="btn btn-primary">Create Role</button>
              </div>
            </form>
          `,
          onOpen: (modalEl) => {
            modalEl.querySelector('form').addEventListener('submit', async (e) => {
              e.preventDefault();
              try {
                await RolesService.create({
                  name: e.target.name.value.trim().toUpperCase(),
                  description: e.target.description.value.trim(),
                });
                Toast.success('Role created successfully');
                Modal.close();
                loadRoles();
              } catch (err) {
                Toast.error(err.message || 'Failed to create role');
              }
            });
          },
        });
      });
    }

    // Create Permission Btn
    const addPermBtn = document.getElementById('add-permission-btn');
    if (addPermBtn) {
      addPermBtn.addEventListener('click', () => {
        Modal.open({
          title: 'Create System Permission Key',
          content: `
            <form id="create-perm-form" class="form">
              <div class="form-group">
                <label class="form-label">Module</label>
                <input type="text" name="module" class="form-control" placeholder="e.g. fees, examinations, admissions" required />
              </div>
              <div class="form-group">
                <label class="form-label">Action</label>
                <input type="text" name="action" class="form-control" placeholder="e.g. VIEW, CREATE, MANAGE, PUBLISH" required />
              </div>
              <div class="form-group">
                <label class="form-label">Permission Key</label>
                <input type="text" name="key" class="form-control" placeholder="e.g. fees:manage or exams.publish" required />
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea name="description" class="form-control" placeholder="What this permission grants..."></textarea>
              </div>
              <div class="modal__footer">
                <button type="submit" class="btn btn-primary">Create Permission Key</button>
              </div>
            </form>
          `,
          onOpen: (modalEl) => {
            modalEl.querySelector('form').addEventListener('submit', async (e) => {
              e.preventDefault();
              try {
                await PermissionsService.create({
                  module: e.target.module.value.trim().toLowerCase(),
                  action: e.target.action.value.trim().toUpperCase(),
                  key: e.target.key.value.trim(),
                  description: e.target.description.value.trim(),
                });
                Toast.success('Permission key created successfully');
                Modal.close();
                loadPermissions();
              } catch (err) {
                Toast.error(err.message || 'Failed to create permission');
              }
            });
          },
        });
      });
    }
  });
})();
