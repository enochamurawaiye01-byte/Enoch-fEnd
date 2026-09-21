(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    let classOptions = [], subjectOptions = [], termOptions = [];
    try {
      const [{ items: classes }, { items: subjects }, { items: terms }] = await Promise.all([
        ClassesService.list({ pageSize: 100 }),
        SubjectsService.list({ pageSize: 200 }),
        TermsService.list({ pageSize: 50 }),
      ]);
      classOptions = classes.map((c) => ({ value: c.id, label: c.name }));
      subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));
      termOptions = terms.map((t) => ({ value: t.id, label: `${titleCaseFromEnum(t.name)} — ${t.academicSessionName || t.academicSession?.name || ''}`.trim() }));
    } catch (e) { /* non-fatal */ }

    const filterClass = document.getElementById('filter-class');
    if (filterClass) {
      filterClass.innerHTML = '<option value="">All Classes</option>' +
        classOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');
    }

    const table = SimpleCrudPage.init({
      tbody: document.getElementById('examinations-tbody'),
      paginationEl: document.getElementById('examinations-pagination'),
      searchInput: document.getElementById('examinations-search'),
      addBtn: document.getElementById('add-examination-btn'),
      moduleKey: 'examinations',
      entityLabel: 'Examination',
      service: ExaminationsService,
      modalSize: 'lg',
      columns: [
        { key: 'title', label: 'Title', render: (r) => `<strong>${escapeHtml(r.title)}</strong>` },
        { key: 'className', label: 'Class', render: (r) => escapeHtml(r.className || r.class?.name || '—') },
        { key: 'subjectName', label: 'Subject', render: (r) => escapeHtml(r.subjectName || r.subject?.name || '—') },
        { key: 'examDate', label: 'Date', render: (r) => formatDate(r.examDate) },
        { key: 'totalMarks', label: 'Total Marks', render: (r) => escapeHtml(String(r.totalMarks ?? '—')) },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadgeClass(r.status || 'SCHEDULED')}">${escapeHtml(titleCaseFromEnum(r.status || 'SCHEDULED'))}</span>` },
      ],
      formFields: [
        { name: 'title', label: 'Examination Title', required: true, placeholder: 'e.g. First Term Mathematics Exam' },
        { name: 'classId', label: 'Class', type: 'select', required: true, options: classOptions },
        { name: 'subjectId', label: 'Subject', type: 'select', required: true, options: subjectOptions },
        { name: 'termId', label: 'Term', type: 'select', required: true, options: termOptions },
        { name: 'examDate', label: 'Exam Date', type: 'date', required: true },
        { name: 'durationMinutes', label: 'Duration (minutes)', type: 'number' },
        { name: 'totalMarks', label: 'Total Marks', type: 'number', required: true },
      ],
      deleteMessage: (row) => `Delete examination "${row.title}"?`,
      extraFilters: () => ({ classId: filterClass ? filterClass.value : '' }),
    });

    if (filterClass) filterClass.addEventListener('change', () => table.setFilters({ classId: filterClass.value }));
  });
})();
