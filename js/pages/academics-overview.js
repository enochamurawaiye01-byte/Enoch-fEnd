/**
 * Management → Academics overview: current session/term at a glance,
 * plus a read-oriented list of classes. Deeper academic administration
 * (subjects, teacher assignments, etc.) lives in the Admin workspace;
 * this page is a summary view for Management/Principal roles.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    const summaryGrid = document.getElementById('academics-summary-grid');
    summaryGrid.innerHTML = Loader.spinnerHtml('Loading academic overview…');
    try {
      const [session, term] = await Promise.all([
        AcademicSessionsService.current().catch(() => null),
        TermsService.current().catch(() => null),
      ]);
      const cards = [];
      if (session) cards.push({ label: 'Active Academic Session', value: session.name });
      if (term) cards.push({ label: 'Current Term', value: titleCaseFromEnum(term.name) });
      summaryGrid.innerHTML = cards.length
        ? cards.map((c) => `
          <div class="stat-card">
            <div class="stat-card__label">${escapeHtml(c.label)}</div>
            <div class="stat-card__value">${escapeHtml(c.value)}</div>
          </div>`).join('')
        : '<div class="table-state"><p>No active academic session or term has been set yet.</p></div>';
    } catch (err) {
      summaryGrid.innerHTML = `<div class="table-state table-state--error"><p>${escapeHtml(err.message)}</p></div>`;
    }

    const table = DataTable.create({
      tbody: document.getElementById('classes-tbody'),
      paginationEl: document.getElementById('classes-pagination'),
      columns: [
        { key: 'name', label: 'Class', render: (r) => `<strong>${escapeHtml(r.name)}</strong>` },
        { key: 'level', label: 'Level', render: (r) => escapeHtml(r.level || '—') },
        { key: 'arms', label: 'Arms / Streams', render: (r) => (r.arms && r.arms.length ? r.arms.map((a) => `<span class="tag" style="margin-right:4px;">${escapeHtml(a.name)}</span>`).join('') : '<span class="text-muted text-small">No arms</span>') },
        { key: 'studentCount', label: 'Students', render: (r) => escapeHtml(String(r.studentCount ?? '—')) },
      ],
      fetchPage: (page) => ClassesService.list({ page, pageSize: 20 }),
      emptyMessage: 'No classes found.',
    });
    table.load();
  });
})();
