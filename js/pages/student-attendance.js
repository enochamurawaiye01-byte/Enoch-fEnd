(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    const summaryGrid = document.getElementById('attendance-summary-grid');
    try {
      const stats = await AttendanceService.stats({ studentId: window.CurrentUser.id });
      const fields = [
        { key: 'presentCount', label: 'Days Present' },
        { key: 'absentCount', label: 'Days Absent' },
        { key: 'lateCount', label: 'Days Late' },
        { key: 'attendanceRate', label: 'Attendance Rate', percent: true },
      ];
      const cards = fields
        .filter((f) => stats && stats[f.key] !== undefined && stats[f.key] !== null)
        .map((f) => `
          <div class="stat-card">
            <div class="stat-card__label">${escapeHtml(f.label)}</div>
            <div class="stat-card__value">${f.percent ? `${Number(stats[f.key]).toFixed(1)}%` : escapeHtml(String(stats[f.key]))}</div>
          </div>`)
        .join('');
      summaryGrid.innerHTML = cards || '<div class="table-state"><p>No attendance summary available yet.</p></div>';
    } catch (err) {
      summaryGrid.innerHTML = `<div class="table-state table-state--error" style="grid-column:1/-1;"><p>${escapeHtml(err.message)}</p></div>`;
    }

    const table = DataTable.create({
      tbody: document.getElementById('attendance-tbody'),
      paginationEl: document.getElementById('attendance-pagination'),
      columns: [
        { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
        { key: 'className', label: 'Class', render: (r) => escapeHtml(r.className || r.class?.name || '—') },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadgeClass(r.status)}">${escapeHtml(titleCaseFromEnum(r.status))}</span>` },
      ],
      fetchPage: (page) => AttendanceService.byStudent(window.CurrentUser.id, { page, pageSize: 20 }),
      emptyMessage: 'No attendance records found.',
    });
    table.load();
  });
})();
