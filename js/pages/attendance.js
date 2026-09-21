/**
 * Attendance page — pick a class + date to mark attendance for the
 * roster, plus a filterable history table of previously recorded
 * attendance. Status options (Present/Absent/Late) are marked per
 * student and submitted as a single batch to the backend.
 */
(function () {
  'use strict';

  let historyTable;
  const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'LATE'];

  function statusButtonsHtml(studentId, current) {
    return STATUS_OPTIONS.map(
      (s) => `
      <button type="button" class="chip-toggle ${current === s ? 'active' : ''}" data-student="${escapeHtml(studentId)}" data-status="${s}">
        ${escapeHtml(titleCaseFromEnum(s))}
      </button>`
    ).join('');
  }

  async function loadRoster(classId) {
    const rosterEl = document.getElementById('attendance-roster');
    rosterEl.innerHTML = Loader.spinnerHtml('Loading class roster…');
    if (!classId) {
      rosterEl.innerHTML = '<div class="table-state"><p>Select a class to mark attendance.</p></div>';
      return;
    }
    try {
      const { items } = await ClassesService.students(classId, { pageSize: 200 });
      if (!items.length) {
        rosterEl.innerHTML = '<div class="table-state"><p>No students found in this class.</p></div>';
        return;
      }
      rosterEl.dataset.studentMarks = JSON.stringify(items.reduce((acc, s) => ({ ...acc, [s.id]: 'PRESENT' }), {}));
      rosterEl.innerHTML = `
        <div class="table-scroll">
          <table class="data-table">
            <thead><tr><th>Student</th><th>Reg. No.</th><th>Attendance</th></tr></thead>
            <tbody>
              ${items
                .map(
                  (s) => `
                <tr data-student-row="${escapeHtml(s.id)}">
                  <td>${escapeHtml(`${s.firstName || ''} ${s.lastName || ''}`)}</td>
                  <td>${escapeHtml(s.regNumber || '—')}</td>
                  <td><div class="chip-toggle-group">${statusButtonsHtml(s.id, 'PRESENT')}</div></td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      rosterEl.innerHTML = `<div class="table-state table-state--error"><p>${escapeHtml(err.message)}</p></div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    let classOptions = [];
    try {
      const { items } = await ClassesService.list({ pageSize: 100 });
      classOptions = items.map((c) => ({ value: c.id, label: c.name }));
    } catch (e) { /* non-fatal */ }

    const classSelect = document.getElementById('mark-class-select');
    const filterClassSelect = document.getElementById('filter-class');
    const optionsHtml = classOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');
    if (classSelect) classSelect.innerHTML = '<option value="">Select class…</option>' + optionsHtml;
    if (filterClassSelect) filterClassSelect.innerHTML = '<option value="">All Classes</option>' + optionsHtml;

    const dateInput = document.getElementById('mark-date');
    if (dateInput) dateInput.value = toInputDate(new Date());

    if (classSelect) classSelect.addEventListener('change', () => loadRoster(classSelect.value));

    const rosterEl = document.getElementById('attendance-roster');
    rosterEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip-toggle');
      if (!btn) return;
      const group = btn.closest('.chip-toggle-group');
      group.querySelectorAll('.chip-toggle').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const marks = JSON.parse(rosterEl.dataset.studentMarks || '{}');
      marks[btn.dataset.student] = btn.dataset.status;
      rosterEl.dataset.studentMarks = JSON.stringify(marks);
    });

    document.getElementById('save-attendance-btn').addEventListener('click', async () => {
      if (!classSelect.value) {
        Toast.warning('Please select a class first.');
        return;
      }
      const marks = JSON.parse(rosterEl.dataset.studentMarks || '{}');
      const records = Object.entries(marks).map(([studentId, status]) => ({ studentId, status }));
      if (!records.length) {
        Toast.warning('There are no students to mark.');
        return;
      }
      const btn = document.getElementById('save-attendance-btn');
      Loader.setButtonLoading(btn, true, 'Saving…');
      try {
        await AttendanceService.mark({ classId: classSelect.value, date: dateInput.value, records });
        Toast.success('Attendance saved successfully.');
        historyTable.reload();
      } catch (err) {
        Toast.error(err.message || 'Unable to save attendance.');
      } finally {
        Loader.setButtonLoading(btn, false);
      }
    });

    historyTable = DataTable.create({
      tbody: document.getElementById('attendance-history-tbody'),
      paginationEl: document.getElementById('attendance-history-pagination'),
      columns: [
        { key: 'studentName', label: 'Student', render: (r) => escapeHtml(r.studentName || `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim() || '—') },
        { key: 'className', label: 'Class', render: (r) => escapeHtml(r.className || r.class?.name || '—') },
        { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadgeClass(r.status)}">${escapeHtml(titleCaseFromEnum(r.status))}</span>` },
      ],
      fetchPage: (page, filters) => AttendanceService.list({ page, pageSize: 20, ...filters }),
      emptyMessage: 'No attendance records found.',
    });
    historyTable.load();

    if (filterClassSelect) {
      filterClassSelect.addEventListener('change', () => historyTable.setFilters({ classId: filterClassSelect.value }));
    }

    loadRoster('');
  });
})();
