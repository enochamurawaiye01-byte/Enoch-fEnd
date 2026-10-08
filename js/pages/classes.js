/**
 * Classes page — class levels (JSS1…SS3) each optionally split into
 * configurable arms/streams (e.g. JSS1 A, JSS1 Blue). Arms are managed
 * inline via a secondary "Manage Arms" modal per class.
 */
(function () {
  'use strict';

  let table;
  let canManage = false;
  let classLevels = [];

  function rowActionsHtml(row) {
    return `
      <div class="row" style="gap:4px; justify-content:flex-end;">
        <button type="button" class="icon-link" data-action="details" title="View Class Details">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        </button>
        <button type="button" class="icon-link" data-action="arms" title="Manage Arms">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/></svg>
        </button>
        <a class="icon-link" href="students.html?classId=${encodeURIComponent(row.id)}" title="View Students">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M22 10L12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>
        </a>
        ${
          canManage
            ? `
        <button type="button" class="icon-link" data-action="edit" title="Edit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button type="button" class="icon-link" data-action="delete" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
        </button>`
            : ''
        }
      </div>
    `;
  }

  function classFormHtml(row) {
    const c = row || {};
    const selectedLevel = c.classLevel?.name || c.level || '';
    return `
      <form id="class-form" novalidate>
        <div class="form-group">
          <label class="form-label">Class level <span class="required">*</span></label>
          <select name="level" required>
            <option value="">Select class level</option>
            ${classLevels.map((level) => `<option value="${escapeHtml(level.name)}" ${level.name === selectedLevel ? 'selected' : ''}>${escapeHtml(level.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Arm / stream <span class="required">*</span></label>
          <input type="text" name="arm" value="${escapeHtml(c.arm || '')}" placeholder="e.g. A, Science, Arts" required />
        </div>
        <div class="form-group"><label class="form-label">Description</label><input type="text" name="description" value="${escapeHtml(c.description || '')}" /></div>
      </form>
    `;
  }

  function openClassModal(row) {
    const isEdit = Boolean(row && row.id);
    Modal.open({
      title: isEdit ? 'Edit Class' : 'Add Class',
      bodyHtml: classFormHtml(row),
      footerHtml: `
        <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
        <button type="submit" form="class-form" class="btn btn-primary" id="class-save-btn">${isEdit ? 'Save Changes' : 'Add Class'}</button>
      `,
      onMount: (modalEl) => {
        modalEl.querySelector('[data-action="cancel"]').addEventListener('click', Modal.close);
        const form = modalEl.querySelector('#class-form');
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const values = Object.fromEntries(new FormData(form).entries());
          const { valid, errors } = Validators.validateForm(values, {
            level: [(v) => Validators.required(v, 'Class level')],
            arm: [(v) => Validators.required(v, 'Class arm')]
          });
          if (!valid) {
            Object.entries(errors).forEach(([field, message]) => {
              const group = form.querySelector(`[name="${field}"]`).closest('.form-group');
              group.classList.add('has-error');
              const errorElement = group.querySelector('.form-error');
              if (errorElement) errorElement.textContent = message;
            });
            return;
          }
          const btn = document.getElementById('class-save-btn');
          Loader.setButtonLoading(btn, true, 'Saving…');
          try {
            if (isEdit) {
              await ClassesService.update(row.id, values);
              Toast.success('Class updated.');
            } else {
              await ClassesService.create(values);
              Toast.success('Class added.');
            }
            Modal.close();
            table.reload();
          } catch (err) {
            Toast.error(err.message || 'Unable to save this class.');
          } finally {
            Loader.setButtonLoading(btn, false);
          }
        });
      },
    });
  }

  async function openArmsModal(classRow) {
    Modal.open({
      title: `Manage Arms — ${classRow.name}`,
      description: 'Add, rename or remove arms/streams for this class.',
      bodyHtml: `
        <div id="arms-list">${Loader.spinnerHtml('Loading arms…')}</div>
        <form id="add-arm-form" class="row gap-2" style="margin-top:16px;">
          <input type="text" id="new-arm-name" placeholder="New arm name, e.g. A, Blue…" style="flex:1;" />
          <button type="submit" class="btn btn-secondary">Add Arm</button>
        </form>
      `,
      footerHtml: `<button type="button" class="btn btn-primary" data-action="done">Done</button>`,
      onMount: async (modalEl) => {
        modalEl.querySelector('[data-action="done"]').addEventListener('click', () => {
          Modal.close();
          table.reload();
        });

        async function refreshArms() {
          const listEl = modalEl.querySelector('#arms-list');
          listEl.innerHTML = Loader.spinnerHtml('Loading arms…');
          try {
            const { items } = await ClassesService.arms(classRow.id);
            if (!items.length) {
              listEl.innerHTML = '<p class="text-muted text-small">No arms yet for this class.</p>';
              return;
            }
            listEl.innerHTML = items
              .map(
                (a) => `
              <div class="list-row" data-arm-id="${escapeHtml(a.id)}">
                <span class="list-row__title">${escapeHtml(a.arm)} <span class="text-muted">${escapeHtml(a.name)}</span></span>
                <button type="button" class="icon-link" data-remove-arm title="Remove">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
                </button>
              </div>`
              )
              .join('');
          } catch (err) {
            listEl.innerHTML = `<p class="text-muted text-small">${escapeHtml(err.message)}</p>`;
          }
        }

        modalEl.querySelector('#arms-list').addEventListener('click', (e) => {
          const btn = e.target.closest('[data-remove-arm]');
          if (!btn) return;
          const armRow = btn.closest('[data-arm-id]');
          const armId = armRow.dataset.armId;
          ConfirmDialog.open({
            title: 'Remove Arm',
            message: 'Remove this arm/stream? Students currently assigned to it will need reassignment.',
            confirmLabel: 'Remove',
            tone: 'danger',
            onConfirm: async () => {
              await ClassesService.deleteArm(armId);
              Toast.success('Arm removed.');
              refreshArms();
            },
          });
        });

        modalEl.querySelector('#add-arm-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const input = modalEl.querySelector('#new-arm-name');
          const name = input.value.trim();
          if (!name) return;
          try {
            await ClassesService.create({ level: classRow.classLevel.name, arm: name });
            input.value = '';
            Toast.success('Arm added.');
            refreshArms();
          } catch (err) {
            Toast.error(err.message || 'Unable to add this arm.');
          }
        });

        refreshArms();
      },
    });
  }

  function openClassDetailsModal(classRow) {
    Modal.open({
      title: classRow.name,
      size: 'lg',
      bodyHtml: Loader.spinnerHtml('Loading class details…'),
      footerHtml: '<button type="button" class="btn btn-primary" data-action="close">Close</button>',
      onMount: async (modalEl) => {
        modalEl.querySelector('[data-action="close"]').addEventListener('click', Modal.close);
        try {
          const [schoolClass, studentResult, subjectResult, teacherResult] = await Promise.all([
            ClassesService.get(classRow.id),
            ClassesService.students(classRow.id),
            ClassSubjectsService.list({ classId: classRow.id }),
            TeacherAssignmentsService.list({ classId: classRow.id }),
          ]);
          const students = studentResult.items || [];
          const subjects = subjectResult.items || [];
          const assignments = teacherResult.items || [];
          const teachers = new Map(assignments.map((assignment) => [
            assignment.staffId || assignment.staff?.id,
            assignment.staff?.user?.fullName
              || `${assignment.staff?.firstName || ''} ${assignment.staff?.lastName || ''}`.trim(),
          ]));
          const studentNames = students.map((student) => `${student.firstName || ''} ${student.lastName || ''}`.trim()).filter(Boolean);

          modalEl.querySelector('.modal__body').innerHTML = `
            <div class="profile-grid">
              <div><span class="form-label">Class</span><p>${escapeHtml(schoolClass.name || classRow.name)}</p></div>
              <div><span class="form-label">Class teacher</span><p>${escapeHtml(schoolClass.classTeacher?.fullName || 'Not Assigned')}</p></div>
              <div><span class="form-label">Students (${students.length})</span><p>${studentNames.length ? studentNames.map(escapeHtml).join(', ') : 'No students assigned.'}</p></div>
              <div><span class="form-label">Subjects</span><p>${subjects.length ? subjects.map((item) => escapeHtml(item.subject?.name || '—')).join(', ') : 'No subjects assigned.'}</p></div>
              <div><span class="form-label">Subject teachers</span><p>${teachers.size ? [...teachers.values()].map((name) => escapeHtml(name || '—')).join(', ') : 'No subject teachers assigned.'}</p></div>
            </div>
          `;
        } catch (error) {
          modalEl.querySelector('.modal__body').innerHTML = `<p class="text-danger">${escapeHtml(error.message || 'Unable to load class details.')}</p>`;
        }
      },
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    canManage = Permissions.canAccessModule(window.CurrentUser.role, 'academics');

    const addBtn = document.getElementById('add-class-btn');
    if (addBtn) addBtn.hidden = !canManage;

    try {
      const { items } = await ClassesService.levels();
      classLevels = items || [];
    } catch (error) {
      Toast.error('Unable to load class levels. Class creation is unavailable until they are configured.');
      if (addBtn) addBtn.disabled = true;
    }

    table = DataTable.create({
      tbody: document.getElementById('classes-tbody'),
      paginationEl: document.getElementById('classes-pagination'),
      columns: [
        { key: 'name', label: 'Class', render: (r) => `<strong>${escapeHtml(r.name)}</strong>` },
        { key: 'level', label: 'Level', render: (r) => escapeHtml(r.classLevel?.name || '—') },
        { key: 'arm', label: 'Arm / Stream', render: (r) => escapeHtml(r.arm || '—') },
        { key: 'classTeacher', label: 'Class Teacher', render: (r) => `${r.classTeacher ? escapeHtml(r.classTeacher.fullName || '—') : '<span class="text-muted">Not Assigned</span>'}${canManage ? ` <a href="teacher-assignments.html#class-teachers">Manage</a>` : ''}` },
        { key: 'studentCount', label: 'Students', render: (r) => escapeHtml(String(r._count?.students ?? '0')) },
      ],
      rowActions: rowActionsHtml,
      fetchPage: (page, filters) => ClassesService.list({ page, pageSize: 20, ...filters }),
      emptyMessage: 'No classes found.',
      emptyActionHtml: canManage ? '<button type="button" class="btn btn-primary btn-sm" data-action="empty-add">Add Class</button>' : '',
    });
    table.load();

    document.getElementById('classes-tbody').addEventListener('click', async (e) => {
      if (e.target.closest('[data-action="empty-add"]')) {
        openClassModal(null);
        return;
      }
      const rowEl = e.target.closest('tr[data-row-id]');
      if (!rowEl) return;
      const id = rowEl.dataset.rowId;

      if (e.target.closest('[data-action="edit"]')) {
        const row = await ClassesService.get(id);
        openClassModal(row);
      } else if (e.target.closest('[data-action="delete"]')) {
        const row = await ClassesService.get(id);
        ConfirmDialog.open({
          title: 'Delete Class',
          message: `Delete "${row.name}"? All arms and any linked data must be reassigned first.`,
          confirmLabel: 'Delete',
          tone: 'danger',
          onConfirm: async () => {
            await ClassesService.delete(id);
            Toast.success('Class deleted.');
            table.reload();
          },
        });
      } else if (e.target.closest('[data-action="arms"]')) {
        const row = await ClassesService.get(id);
        openArmsModal(row);
      } else if (e.target.closest('[data-action="details"]')) {
        openClassDetailsModal({ id, name: rowEl.querySelector('td')?.textContent?.trim() || 'Class details' });
      }
    });

    if (addBtn) addBtn.addEventListener('click', () => openClassModal(null));
  });
})();
