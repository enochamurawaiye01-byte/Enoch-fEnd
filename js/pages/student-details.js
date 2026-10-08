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
      const currentEnrollment = (student.enrollments || []).find((enrollment) => enrollment.status === 'ACTIVE' && enrollment.session?.isActive) || (student.enrollments || [])[0];
      const schoolClass = currentEnrollment?.class || student.currentClass || {};
      const level = schoolClass.classLevel || {};
      const department = currentEnrollment?.department || student.desiredDepartment;
      const classArm = schoolClass.arm || schoolClass.classArm?.name || student.classArm?.name || student.classArmName;
      const classTeacher = schoolClass.classTeacher || schoolClass.teacher ||
        schoolClass.classTeacherAssignment?.staff?.user ||
        schoolClass.classTeacherAssignment?.teacher;
      const classTeacherName = typeof classTeacher === 'string'
        ? classTeacher
        : classTeacher?.fullName || [classTeacher?.firstName, classTeacher?.lastName].filter(Boolean).join(' ');
      container.innerHTML = `
        <section class="card"><div class="card__head"><div class="avatar-cell"><span class="avatar" style="width:64px;height:64px;overflow:hidden;">${student.profileImageUrl ? `<img src="${escapeHtml(student.profileImageUrl)}" alt="Student profile" style="width:100%;height:100%;object-fit:cover;">` : escapeHtml(initials(`${student.firstName || ''} ${student.lastName || ''}`))}</span><div><h3>${escapeHtml(`${student.firstName || ''} ${student.lastName || ''}`.trim())}</h3><span class="badge badge-outline">STUDENT</span> <span class="badge ${statusBadgeClass(student.status)}">${escapeHtml(titleCaseFromEnum(student.status))}</span></div></div></div>
          <div class="profile-grid"><div><span class="form-label">Registration number</span><p>${escapeHtml(student.registrationNumber || student.regNumber || '—')}</p></div><div><span class="form-label">Email</span><p>${escapeHtml(user.email || '—')}</p></div><div><span class="form-label">Current class</span><p>${escapeHtml(`${schoolClass.name || student.className || '—'} ${level.name ? `(${level.name})` : ''}`)}</p></div>${department?.name ? `<div><span class="form-label">Department</span><p>${escapeHtml(department.name)}</p></div>` : ''}${classArm ? `<div><span class="form-label">Section / arm</span><p>${escapeHtml(classArm)}</p></div>` : ''}${classTeacherName ? `<div><span class="form-label">Class teacher</span><p>${escapeHtml(classTeacherName)}</p></div>` : ''}<div><span class="form-label">Academic session</span><p>${escapeHtml(currentEnrollment?.session?.name || '—')}</p></div><div><span class="form-label">Term</span><p>${escapeHtml(titleCaseFromEnum(currentEnrollment?.term?.name || currentEnrollment?.term?.type || '')) || '—'}</p></div><div><span class="form-label">Phone</span><p>${escapeHtml(user.phoneNumber || '—')}</p></div><div><span class="form-label">Admission date</span><p>${student.admissionDate ? formatDate(student.admissionDate) : '—'}</p></div><div><span class="form-label">Gender</span><p>${escapeHtml(titleCaseFromEnum(student.gender || '')) || '—'}</p></div></div>
        </section>
        <section class="card"><div class="card__head"><h3>Enrollment history</h3></div>${(student.enrollments || []).length ? `<div class="table-scroll"><table class="data-table"><thead><tr><th>Session</th><th>Term</th><th>Class</th><th>Status</th></tr></thead><tbody>${student.enrollments.map((enrollment) => `<tr><td>${escapeHtml(enrollment.session?.name || enrollment.sessionId || '—')}</td><td>${escapeHtml(enrollment.term?.name || enrollment.termId || '—')}</td><td>${escapeHtml(enrollment.class?.name || enrollment.classId || '—')}</td><td>${escapeHtml(titleCaseFromEnum(enrollment.status))}</td></tr>`).join('')}</tbody></table></div>` : '<p class="table-state">No enrollment records yet.</p>'}</section>
        <section class="card"><div class="card__head"><h3>Published result history</h3></div>${(student.reportCards || []).length ? `<div class="table-scroll"><table class="data-table"><thead><tr><th>Academic session</th><th>Term</th><th>Class</th><th>Average</th><th>Results</th></tr></thead><tbody>${student.reportCards.map((report) => `<tr><td>${escapeHtml(report.session?.name || '—')}</td><td>${escapeHtml(titleCaseFromEnum(report.term?.name || report.term?.type || ''))}</td><td>${escapeHtml(report.class?.name || student.currentClass?.name || '—')}</td><td>${escapeHtml(report.average == null ? '—' : `${Number(report.average).toFixed(1)}%`)}</td><td><a class="btn btn-outline btn-sm" href="results.html?studentId=${encodeURIComponent(student.id)}&sessionId=${encodeURIComponent(report.sessionId)}&termId=${encodeURIComponent(report.termId)}">View result</a></td></tr>`).join('')}</tbody></table></div>` : '<p class="table-state">No published results yet.</p>'}</section>`;
    } catch (error) {
      container.innerHTML = `<div class="table-state table-state--error"><p>${escapeHtml(error.message || 'Unable to load student details.')}</p></div>`;
    }
  });
})();
