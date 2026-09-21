(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    let classOptions = [], termOptions = [];
    try {
      const [{ items: classes }, { items: terms }] = await Promise.all([
        ClassesService.list({ pageSize: 100 }),
        TermsService.list({ pageSize: 50 }),
      ]);
      classOptions = classes.map((c) => ({ value: c.id, label: c.name }));
      termOptions = terms.map((t) => ({ value: t.id, label: `${titleCaseFromEnum(t.name)} — ${t.academicSessionName || t.academicSession?.name || ''}`.trim() }));
    } catch (e) { /* non-fatal */ }

    SimpleCrudPage.init({
      tbody: document.getElementById('fees-tbody'),
      paginationEl: document.getElementById('fees-pagination'),
      searchInput: document.getElementById('fees-search'),
      addBtn: document.getElementById('add-fee-btn'),
      moduleKey: 'finance',
      entityLabel: 'Fee Item',
      service: FeesService,
      columns: [
        { key: 'name', label: 'Fee Item', render: (r) => `<strong>${escapeHtml(r.name)}</strong>` },
        { key: 'category', label: 'Category', render: (r) => escapeHtml(r.category || '—') },
        { key: 'className', label: 'Class', render: (r) => escapeHtml(r.className || r.class?.name || 'All Classes') },
        { key: 'termName', label: 'Term', render: (r) => escapeHtml(titleCaseFromEnum(r.termName || r.term?.name || '')) },
        { key: 'amount', label: 'Amount', render: (r) => `<span class="numeric">${formatCurrency(r.amount)}</span>` },
      ],
      formFields: [
        { name: 'name', label: 'Fee Item Name', required: true, placeholder: 'e.g. Tuition Fee' },
        { name: 'category', label: 'Category', placeholder: 'e.g. Tuition, Development Levy, Uniform' },
        { name: 'classId', label: 'Class (leave blank for all classes)', type: 'select', options: classOptions },
        { name: 'termId', label: 'Term', type: 'select', required: true, options: termOptions },
        { name: 'amount', label: 'Amount (₦)', type: 'number', required: true },
      ],
      deleteMessage: (row) => `Delete fee item "${row.name}"?`,
    });
  });
})();
