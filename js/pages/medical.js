(function () {
  'use strict';

  const RecordsAdapter = {
    list: MedicalService.records,
    get: MedicalService.getRecord,
    create: MedicalService.createRecord,
    update: MedicalService.updateRecord,
    delete: MedicalService.deleteRecord,
  };

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    let studentOptions = [];
    try {
      const { items } = await StudentsService.list({ pageSize: 200 });
      studentOptions = items.map((s) => ({ value: s.id, label: `${s.firstName || ''} ${s.lastName || ''} (${s.regNumber || 'no reg.'})`.trim() }));
    } catch (e) { /* non-fatal */ }

    SimpleCrudPage.init({
      tbody: document.getElementById('medical-tbody'),
      paginationEl: document.getElementById('medical-pagination'),
      searchInput: document.getElementById('medical-search'),
      addBtn: document.getElementById('add-medical-btn'),
      moduleKey: 'medical',
      entityLabel: 'Medical Record',
      service: RecordsAdapter,
      modalSize: 'lg',
      columns: [
        { key: 'studentName', label: 'Student', render: (r) => escapeHtml(r.studentName || `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim() || '—') },
        { key: 'condition', label: 'Condition / Notes', render: (r) => escapeHtml((r.condition || r.notes || '—').toString().slice(0, 60)) },
        { key: 'date', label: 'Date', render: (r) => formatDate(r.date || r.createdAt) },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadgeClass(r.status || 'ACTIVE')}">${escapeHtml(titleCaseFromEnum(r.status || 'ACTIVE'))}</span>` },
      ],
      formFields: [
        { name: 'studentId', label: 'Student', type: 'select', required: true, options: studentOptions },
        { name: 'condition', label: 'Condition', placeholder: 'e.g. Asthma, Allergy' },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ],
      deleteMessage: () => 'Delete this medical record? This is sensitive information — please confirm.',
    });
  });
})();
