(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const childId = getInitialParam('id');
    const container = document.getElementById('child-details-viewer');

    if (!childId) {
      container.innerHTML = '<div class="table-state"><p>No child selected. Return to <a href="children.html">My Children</a>.</p></div>';
      return;
    }

    container.innerHTML = Loader.spinnerHtml('Loading student details…');
    try {
      const student = await StudentsService.get(childId);
      container.innerHTML = `
        <div class="card">
          <div class="card__head">
            <div class="avatar-cell">
              <span class="avatar" style="width:48px;height:48px;font-size:1rem;">${escapeHtml(initials(`${student.firstName || ''} ${student.lastName || ''}`))}</span>
              <div>
                <div class="name" style="font-size:1.1rem;">${escapeHtml(`${student.firstName || ''} ${student.lastName || ''}`)}</div>
                <div class="sub">${escapeHtml(student.regNumber || '—')}</div>
              </div>
            </div>
          </div>
          <div class="profile-grid">
            <div><span class="form-label">Class</span><p>${escapeHtml(student.className || student.class?.name || '—')}</p></div>
            <div><span class="form-label">Class Arm</span><p>${escapeHtml(student.classArmName || student.classArm?.name || '—')}</p></div>
            <div><span class="form-label">Email</span><p>${escapeHtml(student.email || '—')}</p></div>
            <div><span class="form-label">Phone</span><p>${escapeHtml(student.phone || '—')}</p></div>
            <div><span class="form-label">Status</span><p><span class="badge ${statusBadgeClass(student.status || 'ACTIVE')}">${escapeHtml(titleCaseFromEnum(student.status || 'ACTIVE'))}</span></p></div>
          </div>
        </div>

        <div class="quick-links" style="margin-top:var(--space-6);">
          <a class="quick-link" href="results.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 8l-6 4 6 4 6-4Z"/></svg><span>View Results</span></a>
          <a class="quick-link" href="attendance.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12l3 3 6-6"/></svg><span>View Attendance</span></a>
          <a class="quick-link" href="fees.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="6" width="18" height="14" rx="2"/></svg><span>View Fees</span></a>
          <a class="quick-link" href="timetable.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg><span>View Timetable</span></a>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="table-state table-state--error"><p>${escapeHtml(err.message)}</p></div>`;
    }
  });
})();
