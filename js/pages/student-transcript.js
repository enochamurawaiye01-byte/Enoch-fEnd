(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const container = document.getElementById('transcript-viewer');
    container.innerHTML = Loader.spinnerHtml('Loading your transcript…');

    try {
      const student = await StudentsService.me().catch(() => null);
      const transcript = await TranscriptsService.byStudent(student?.id || window.CurrentUser.id);
      const records = (transcript && (transcript.records || transcript.results)) || [];
      const enrollment = student && (student.enrollments || []).find(
        (item) => item.status === 'ACTIVE' && item.session?.isActive
      );
      const currentClass = (enrollment && enrollment.class) || (student && (student.currentClass || student.class)) || {};
      const department = (enrollment && enrollment.department) || (student && (student.desiredDepartment || student.department));
      const classArm = currentClass.arm || currentClass.classArm?.name || (student && (student.classArm?.name || student.classArmName));
      const classTeacher = currentClass.classTeacher || currentClass.teacher ||
        currentClass.classTeacherAssignment?.staff?.user ||
        currentClass.classTeacherAssignment?.teacher;
      const classTeacherName = typeof classTeacher === 'string'
        ? classTeacher
        : classTeacher?.fullName || [classTeacher?.firstName, classTeacher?.lastName].filter(Boolean).join(' ');
      const identity = [
        ['Registration number', student && (student.registrationNumber || student.regNumber)],
        ['Class', currentClass.name || (student && student.className)],
        ['Department', department?.name],
        ['Section / arm', classArm],
        ['Class teacher', classTeacherName],
      ].filter(([, value]) => value);
      const groupedByTerm = records.reduce((acc, r) => {
        const key = r.termName || r.term?.name || 'Unspecified Term';
        (acc[key] = acc[key] || []).push(r);
        return acc;
      }, {});

      container.innerHTML = `
        <div class="transcript-sheet">
          <div class="transcript-head">
            <div>
              <p class="text-muted">Mercy T International College (MIC)</p>
              <h2>${escapeHtml(student ? `${student.firstName || ''} ${student.lastName || ''}` : window.CurrentUser.firstName || '')}</h2>
              <div class="profile-grid">${identity.map(([label, value]) => `<div><span class="form-label">${escapeHtml(label)}</span><p>${escapeHtml(value)}</p></div>`).join('')}</div>
            </div>
            <button type="button" class="btn btn-secondary no-print" id="print-transcript-btn">Print</button>
          </div>
          ${
            Object.keys(groupedByTerm).length
              ? Object.entries(groupedByTerm)
                  .map(
                    ([term, rows]) => `
                <h3 class="transcript-term-title">${escapeHtml(titleCaseFromEnum(term))}</h3>
                <table class="data-table">
                  <thead><tr><th>Subject</th><th>Score</th><th>Grade</th><th>Remarks</th></tr></thead>
                  <tbody>
                    ${rows.map((r) => `
                      <tr>
                        <td>${escapeHtml(r.subjectName || r.subject?.name || '—')}</td>
                        <td class="numeric">${escapeHtml(String(r.score ?? '—'))}</td>
                        <td>${escapeHtml(r.grade || '—')}</td>
                        <td>${escapeHtml(r.remarks || '—')}</td>
                      </tr>`).join('')}
                  </tbody>
                </table>`
                  )
                  .join('')
              : '<div class="table-state"><p>No published results available yet.</p></div>'
          }
        </div>
      `;
      document.getElementById('print-transcript-btn')?.addEventListener('click', () => window.print());
    } catch (err) {
      container.innerHTML = `<div class="table-state table-state--error"><p>${escapeHtml(err.message)}</p></div>`;
    }
  });
})();
