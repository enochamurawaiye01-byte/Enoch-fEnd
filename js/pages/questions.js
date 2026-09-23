(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    let examOptions = [];
    try {
      const { items } = await ExaminationsService.list({ pageSize: 100 });
      examOptions = items.map((e) => ({ value: e.id, label: e.title }));
    } catch (e) { /* non-fatal */ }

    const filterExam = document.getElementById('filter-examination');
    if (filterExam) {
      filterExam.innerHTML = '<option value="">All Examinations</option>' +
        examOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');
    }

    const table = SimpleCrudPage.init({
      tbody: document.getElementById('questions-tbody'),
      paginationEl: document.getElementById('questions-pagination'),
      addBtn: document.getElementById('add-question-btn'),
      moduleKey: 'examinations',
      entityLabel: 'Question',
      service: QuestionsService,
      modalSize: 'lg',
      columns: [
        { key: 'questionText', label: 'Question', render: (r) => `<span title="${escapeHtml(r.questionText)}">${escapeHtml((r.questionText || '').slice(0, 80))}${(r.questionText || '').length > 80 ? '…' : ''}</span>` },
        { key: 'examinationTitle', label: 'Examination', render: (r) => escapeHtml(r.examinationTitle || r.examination?.title || '—') },
        { key: 'type', label: 'Type', render: (r) => `<span class="badge badge-outline">${escapeHtml(titleCaseFromEnum(r.type || 'MCQ'))}</span>` },
        { key: 'marks', label: 'Marks', render: (r) => escapeHtml(String(r.marks ?? '—')) },
      ],
      formFields: [
        { name: 'examinationId', label: 'Examination', type: 'select', required: true, options: examOptions },
        { name: 'questionText', label: 'Question Text', type: 'textarea', required: true },
        { name: 'options', label: 'Options (prefix the correct option with *)', type: 'textarea', help: 'Example: *A. First answer\\nB. Second answer' },
        { name: 'marks', label: 'Marks', type: 'number', required: true },
      ],
      deleteMessage: () => 'Delete this question from the bank?',
      extraFilters: () => ({ examinationId: filterExam ? filterExam.value : '' }),
      onFormValues: (values) => ({
        examId: values.examinationId,
        questionText: values.questionText,
        marks: Number(values.marks),
        options: String(values.options || '').split(/\r?\n/).map((line, index) => line.trim()).filter(Boolean).map((line, index) => {
          const correct = line.startsWith('*');
          const text = correct ? line.slice(1).trim() : line;
          const separator = text.indexOf('.');
          return { optionKey: separator > 0 ? text.slice(0, separator).trim() : String.fromCharCode(65 + index), optionText: separator > 0 ? text.slice(separator + 1).trim() : text, isCorrect: correct };
        }),
      }),
    });

    if (filterExam) filterExam.addEventListener('change', () => table.setFilters({ examinationId: filterExam.value }));
  });
})();
