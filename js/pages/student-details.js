(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('student-details');
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
      container.innerHTML = '<div class="table-state table-state--error"><p>No student was selected.</p></div>';
      return;
    }

    container.innerHTML = Loader.spinnerHtml('Loading student profile...');
    try {
      const student = await StudentsService.get(id);
      const user = student.user || {};
      const schoolClass = student.currentClass || {};
      const level = schoolClass.classLevel || {};
      container.innerHTML = `
        <section class="card"><div class="card__head"><h3>${escapeHtml(`${student.firstName || ''} ${student.lastName || ''}`.trim())}</h3><span class="badge ${statusBadgeClass(student.status)}">${escapeHtml(titleCaseFromEnum(student.status))}</span></div>
          <div class="profile-grid"><div><span class="form-label">Registration number</span><p>${escapeHtml(student.registrationNumber || '—')}</p></div><div><span class="form-label">Email</span><p>${escapeHtml(user.email || '—')}</p></div><div><span class="form-label">Class</span><p>${escapeHtml(`${schoolClass.name || '—'} ${level.name ? `(${level.name})` : ''}`)}</p></div><div><span class="form-label">Phone</span><p>${escapeHtml(user.phoneNumber || '—')}</p></div><div><span class="form-label">Admission date</span><p>${student.admissionDate ? formatDate(student.admissionDate) : '—'}</p></div><div><span class="form-label">Gender</span><p>${escapeHtml(titleCaseFromEnum(student.gender || '')) || '—'}</p></div></div>
        </section>
        <section class="card"><div class="card__head"><h3>Enrollment history</h3></div>${(student.enrollments || []).length ? `<div class="table-scroll"><table class="data-table"><thead><tr><th>Session</th><th>Term</th><th>Class</th><th>Status</th></tr></thead><tbody>${student.enrollments.map((enrollment) => `<tr><td>${escapeHtml(enrollment.session?.name || enrollment.sessionId || '—')}</td><td>${escapeHtml(enrollment.term?.name || enrollment.termId || '—')}</td><td>${escapeHtml(enrollment.class?.name || enrollment.classId || '—')}</td><td>${escapeHtml(titleCaseFromEnum(enrollment.status))}</td></tr>`).join('')}</tbody></table></div>` : '<p class="table-state">No enrollment records yet.</p>'}</section>`;
    } catch (error) {
      container.innerHTML = `<div class="table-state table-state--error"><p>${escapeHtml(error.message || 'Unable to load student details.')}</p></div>`;
    }
  });
})();
