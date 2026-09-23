(function () {
  'use strict';

  function rowActions(row, canManage) {
    const publishBtn = row.status !== 'PUBLISHED' && canManage
      ? `<button type="button" class="icon-link" data-action="publish" title="Publish">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M5 13l4 4L19 7"/></svg>
        </button>`
      : '';
    return `
      <div class="row" style="gap:4px; justify-content:flex-end;">
        ${canManage ? `
        <button type="button" class="icon-link" data-action="edit" title="Edit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>` : ''}
        ${publishBtn}
      </div>
    `;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const canManage = ['ADMIN', 'SUPER_ADMIN'].includes(window.CurrentUser.role) && Permissions.canAccessModule(window.CurrentUser.role, 'results');

    let studentOptions = [], subjectOptions = [], termOptions = [], classOptions = [];
    try {
      const [{ items: students }, { items: subjects }, { items: terms }, { items: classes }] = await Promise.all([
        StudentsService.list({ pageSize: 200 }),
        SubjectsService.list({ pageSize: 200 }),
        TermsService.list({ pageSize: 50 }),
        ClassesService.list({ pageSize: 100 }),
      ]);
      studentOptions = students.map((s) => ({ value: s.id, label: `${s.firstName || ''} ${s.lastName || ''} (${s.regNumber || 'no reg.'})`.trim() }));
      subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));
      termOptions = terms.map((t) => ({ value: t.id, label: `${titleCaseFromEnum(t.name)} — ${t.academicSessionName || t.academicSession?.name || ''}`.trim() }));
      classOptions = classes.map((c) => ({ value: c.id, label: c.name }));
    } catch (e) { /* non-fatal */ }

    const filterClass = document.getElementById('filter-class');
    const filterTerm = document.getElementById('filter-term');
    if (filterClass) filterClass.innerHTML = '<option value="">All Classes</option>' + classOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');
    if (filterTerm) filterTerm.innerHTML = '<option value="">All Terms</option>' + termOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');

    const table = SimpleCrudPage.init({
      tbody: document.getElementById('results-tbody'),
      paginationEl: document.getElementById('results-pagination'),
      searchInput: document.getElementById('results-search'),
      addBtn: canManage ? document.getElementById('add-result-btn') : null,
      moduleKey: 'results',
      entityLabel: 'Result',
      service: ResultsService,
      columns: [
        { key: 'studentName', label: 'Student', render: (r) => escapeHtml(r.studentName || `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim() || '—') },
        { key: 'subjectName', label: 'Subject', render: (r) => escapeHtml(r.subjectName || r.subject?.name || '—') },
        { key: 'termName', label: 'Term', render: (r) => escapeHtml(titleCaseFromEnum(r.termName || r.term?.name || '')) },
        { key: 'score', label: 'Score', render: (r) => escapeHtml(String(r.score ?? '—')) },
        { key: 'grade', label: 'Grade', render: (r) => escapeHtml(r.grade || '—') },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadgeClass(r.status || 'DRAFT')}">${escapeHtml(titleCaseFromEnum(r.status || 'DRAFT'))}</span>` },
      ],
      buildRowActions: (row) => rowActions(row, canManage),
      formFields: [
        { name: 'studentId', label: 'Student', type: 'select', required: true, options: studentOptions },
        { name: 'subjectId', label: 'Subject', type: 'select', required: true, options: subjectOptions },
        { name: 'termId', label: 'Term', type: 'select', required: true, options: termOptions },
        { name: 'score', label: 'Score', type: 'number', required: true },
        { name: 'grade', label: 'Grade' },
        { name: 'remarks', label: 'Remarks', type: 'textarea' },
      ],
      deleteMessage: () => 'Delete this result record?',
      extraFilters: () => ({ classId: filterClass ? filterClass.value : '', termId: filterTerm ? filterTerm.value : '' }),
      onRowAction: async (e, id) => {
        if (e.target.closest('[data-action="publish"]')) {
          ConfirmDialog.open({
            title: 'Publish Result',
            message: 'Publishing makes this result visible to the student and their parent.',
            confirmLabel: 'Publish',
            tone: 'warn',
            onConfirm: async () => {
              await ResultsService.publish(id);
              Toast.success('Result published.');
              table.reload();
            },
          });
        }
      },
    });

    if (filterClass) filterClass.addEventListener('change', () => table.setFilters({ classId: filterClass.value, termId: filterTerm ? filterTerm.value : '' }));
    if (filterTerm) filterTerm.addEventListener('change', () => table.setFilters({ classId: filterClass ? filterClass.value : '', termId: filterTerm.value }));
  });
})();
