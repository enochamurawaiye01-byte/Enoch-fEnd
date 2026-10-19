(function () {
  'use strict';

  function rowActions(row, canManage) {
    const activateBtn = row.status !== 'ACTIVE'
      ? `<button type="button" class="icon-link" data-action="activate" title="Activate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M5 13l4 4L19 7"/></svg>
        </button>`
      : `<button type="button" class="icon-link" data-action="close" title="Close term">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="9"/><path d="M8 8l8 8"/></svg>
        </button>`;
    return `
      <div class="row" style="gap:4px; justify-content:flex-end;">
        ${canManage ? `<button type="button" class="icon-link" data-action="edit-term" title="Edit term">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>` : ''}
        ${canManage ? activateBtn : ''}
      </div>
    `;
  }

  function openEditTermModal(term) {
    const currentType = term.type || term.name;
    Modal.open({
      title: 'Edit Term',
      bodyHtml: `
        <form id="term-edit-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="term-edit-name">Term <span class="required">*</span></label>
            <select id="term-edit-name" name="name" required>
              <option value="FIRST" ${currentType === 'FIRST' ? 'selected' : ''}>First Term</option>
              <option value="SECOND" ${currentType === 'SECOND' ? 'selected' : ''}>Second Term</option>
              <option value="THIRD" ${currentType === 'THIRD' ? 'selected' : ''}>Third Term</option>
            </select>
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label" for="term-edit-start">Start Date <span class="required">*</span></label>
            <input id="term-edit-start" type="date" name="startDate" value="${escapeHtml(toInputDate(term.startDate) || '')}" required />
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label" for="term-edit-end">End Date <span class="required">*</span></label>
            <input id="term-edit-end" type="date" name="endDate" value="${escapeHtml(toInputDate(term.endDate) || '')}" required />
            <span class="form-error"></span>
          </div>
        </form>
      `,
      footerHtml: `
        <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
        <button type="submit" form="term-edit-form" class="btn btn-primary" id="term-edit-save-btn">Save Changes</button>
      `,
      onMount: (modalEl) => {
        modalEl.querySelector('[data-action="cancel"]').addEventListener('click', Modal.close);
        modalEl.querySelector('#term-edit-form').addEventListener('submit', async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const values = Object.fromEntries(new FormData(form).entries());
          const errors = {};
          if (!values.name) errors.name = 'Select a term.';
          if (!values.startDate) errors.startDate = 'Select a start date.';
          if (!values.endDate) errors.endDate = 'Select an end date.';
          if (values.startDate && values.endDate && values.endDate <= values.startDate) {
            errors.endDate = 'End date must be after the start date.';
          }
          form.querySelectorAll('.form-group').forEach((group) => group.classList.remove('has-error'));
          if (Object.keys(errors).length) {
            Object.entries(errors).forEach(([field, message]) => {
              const input = form.querySelector(`[name="${field}"]`);
              const group = input.closest('.form-group');
              group.classList.add('has-error');
              group.querySelector('.form-error').textContent = message;
            });
            return;
          }

          const saveBtn = modalEl.querySelector('#term-edit-save-btn');
          Loader.setButtonLoading(saveBtn, true, 'Saving…');
          try {
            await TermsService.update(term.id, {
              name: values.name,
              type: values.name,
              startDate: `${values.startDate}T00:00:00.000Z`,
              endDate: `${values.endDate}T23:59:59.999Z`,
            });
            Toast.success('Term updated.');
            Modal.close();
            table.reload();
          } catch (error) {
            Toast.error(error.message || 'Unable to update this term.');
          } finally {
            Loader.setButtonLoading(saveBtn, false);
          }
        });
      },
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const canManage = Permissions.canAccessModule(window.CurrentUser.role, 'academics');

    let sessionOptions = [];
    try {
      const { items } = await AcademicSessionsService.list({ pageSize: 50 });
      sessionOptions = items.map((s) => ({ value: s.id, label: s.name }));
    } catch (e) { /* non-fatal */ }

    const filterSession = document.getElementById('filter-session');
    if (filterSession) {
      filterSession.innerHTML = '<option value="">All Sessions</option>' +
        sessionOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');
    }

    let table = SimpleCrudPage.init({
      tbody: document.getElementById('terms-tbody'),
      paginationEl: document.getElementById('terms-pagination'),
      addBtn: document.getElementById('add-term-btn'),
      moduleKey: 'academics',
      entityLabel: 'Term',
      service: TermsService,
      columns: [
        { key: 'name', label: 'Term', render: (r) => `<strong>${escapeHtml(titleCaseFromEnum(r.name))}</strong>` },
        { key: 'session', label: 'Academic Session', render: (r) => escapeHtml(r.academicSessionName || r.academicSession?.name || '—') },
        { key: 'startDate', label: 'Start Date', render: (r) => formatDate(r.startDate) },
        { key: 'endDate', label: 'End Date', render: (r) => formatDate(r.endDate) },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadgeClass(r.status)}">${escapeHtml(titleCaseFromEnum(r.status))}</span>` },
      ],
      buildRowActions: (row) => rowActions(row, canManage),
      formFields: [
        { name: 'academicSessionId', label: 'Academic Session', type: 'select', required: true, options: sessionOptions },
        { name: 'name', label: 'Term', type: 'select', required: true, options: [
          { value: 'FIRST', label: 'First Term' },
          { value: 'SECOND', label: 'Second Term' },
          { value: 'THIRD', label: 'Third Term' },
        ] },
        { name: 'startDate', label: 'Start Date', type: 'date', required: true },
        { name: 'endDate', label: 'End Date', type: 'date', required: true },
      ],
      onFormValues: (values) => ({
        ...values,
        type: values.name,
        startDate: values.startDate ? `${values.startDate}T00:00:00.000Z` : values.startDate,
        endDate: values.endDate ? `${values.endDate}T23:59:59.999Z` : values.endDate,
      }),
      deleteMessage: (row) => `Delete ${titleCaseFromEnum(row.name)} term?`,
      extraFilters: () => ({ academicSessionId: filterSession ? filterSession.value : '' }),
      onRowAction: async (e, id) => {
        if (e.target.closest('[data-action="edit-term"]')) {
          try {
            openEditTermModal(await TermsService.get(id));
          } catch (error) {
            Toast.error(error.message || 'Unable to load this term.');
          }
        } else if (e.target.closest('[data-action="activate"]')) {
          ConfirmDialog.open({
            title: 'Activate Term',
            message: 'Activating this term will make it the current active term school-wide.',
            confirmLabel: 'Activate',
            tone: 'warn',
            onConfirm: async () => {
              await TermsService.activate(id);
              Toast.success('Term activated.');
              table.reload();
            },
          });
        } else if (e.target.closest('[data-action="close"]')) {
          ConfirmDialog.open({
            title: 'Close Term',
            message: 'Closing this term will lock it from further result and attendance entry.',
            confirmLabel: 'Close Term',
            tone: 'danger',
            onConfirm: async () => {
              await TermsService.close(id);
              Toast.success('Term closed.');
              table.reload();
            },
          });
        }
      },
    });

    if (filterSession) {
      filterSession.addEventListener('change', () => table.setFilters({ academicSessionId: filterSession.value }));
    }
  });
})();
