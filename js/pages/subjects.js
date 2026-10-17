(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    let departmentOptions = [];
    try {
      const { items } = await DepartmentsService.list({ pageSize: 100 });
      departmentOptions = items.map((d) => ({ value: d.id, label: d.name }));
    } catch (error) {
      Toast.error(error.message || 'Unable to load departments. Please refresh and try again.');
    }

    SimpleCrudPage.init({
      tbody: document.getElementById('subjects-tbody'),
      paginationEl: document.getElementById('subjects-pagination'),
      searchInput: document.getElementById('subjects-search'),
      addBtn: document.getElementById('add-subject-btn'),
      moduleKey: 'academics',
      entityLabel: 'Subject',
      service: SubjectsService,
      columns: [
        { key: 'name', label: 'Subject Name', render: (r) => `<strong>${escapeHtml(r.name)}</strong>` },
        { key: 'code', label: 'Code', render: (r) => escapeHtml(r.code || '—') },
        { key: 'department', label: 'Available to', render: (r) => escapeHtml(r.targetSummary || r.departmentName || r.department?.name || '—') },
        { key: 'status', label: 'Status', render: (r) => {
          const status = r.status || (r.isActive === false ? 'INACTIVE' : 'ACTIVE');
          return `<span class="badge ${statusBadgeClass(status)}">${escapeHtml(titleCaseFromEnum(status))}</span>`;
        } },
      ],
      formFields: [
        { name: 'name', label: 'Subject Name', required: true, placeholder: 'e.g. Mathematics' },
        { name: 'code', label: 'Subject Code (optional)', placeholder: 'Leave blank if your school does not use subject codes' },
        { name: 'classGroup', label: 'Class group', type: 'select', required: true, options: [{ value: 'JSS', label: 'JSS — all junior classes' }, { value: 'SSS', label: 'SSS — selected departments' }], help: 'This assigns the subject to all existing classes in the selected group and to classes created later.' },
        { name: 'departmentIds', label: 'Senior secondary departments', type: 'checkboxGroup', required: true, options: departmentOptions, help: 'Choose one or more departments that should use this subject.' },
        { name: 'description', label: 'Description', type: 'textarea' },
      ],
      onModalMount: (modalEl, row) => {
        const classGroup = modalEl.querySelector('[name="classGroup"]');
        const departmentGroup = modalEl.querySelector('[data-field="departmentIds"]');
        const updateDepartmentVisibility = () => {
          departmentGroup.hidden = classGroup.value !== 'SSS';
          departmentGroup.querySelectorAll('input').forEach((input) => { input.disabled = classGroup.value !== 'SSS' || Boolean(row); });
        };
        if (row) {
          classGroup.disabled = true;
          const help = document.createElement('span');
          help.className = 'form-help';
          help.textContent = 'Class group and departments are locked after creation to protect existing class assignments and results.';
          departmentGroup.appendChild(help);
        }
        classGroup.addEventListener('change', updateDepartmentVisibility);
        updateDepartmentVisibility();
      },
      requiredWhen: (name, values, row) => name !== 'departmentIds' || (!row && values.classGroup === 'SSS'),
      onFormValues: (values, row) => {
        if (row) {
          delete values.classGroup;
          delete values.departmentIds;
        }
        return values;
      },
      deleteMessage: (row) => `Permanently delete "${row.name}"? This is allowed only when it has no class registrations or academic records. Use Archive to retain history.`,
      archiveAction: true,
      archiveMessage: (row) => `Archive "${row.name}" from future use? Existing class registrations and academic history will be preserved.`,
      archiveSuccessMessage: 'Subject archived. Existing class registrations and academic history are preserved.',
      restoreAction: true,
      restoreSuccessMessage: 'Subject restored.',
    });
  });
})();
