(function (global) {
  'use strict';

  const formatScore = (value) => value == null ? '—' : String(value);
  const scoreTone = (value, kind) => {
    if (value == null) return '';
    const score = Number(value);
    if (kind === 'test') return score < 10 ? 'score-band--red' : score < 15 ? 'score-band--orange' : 'score-band--green';
    if (kind === 'exam') return score < 30 ? 'score-band--red' : score < 40 ? 'score-band--orange' : 'score-band--green';
    return score < 40 ? 'score-band--red' : score < 60 ? 'score-band--orange' : 'score-band--green';
  };
  const scoreCell = (value, kind) => `<td class="numeric ${scoreTone(value, kind)}">${escapeHtml(formatScore(value))}</td>`;
  const isComplete = (entry) => ['firstTest', 'secondTest', 'exam'].every((field) => entry[field] !== null && entry[field] !== undefined);
  const reportLabel = (report) => [
    report.session?.name,
    titleCaseFromEnum(report.term?.name || report.term?.type || '')
  ].filter(Boolean).join(' — ') || 'Academic report';

  function render(container, student, transcript) {
    const profile = transcript.student || student || {};
    const fullName = profile.fullName || [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ') || 'Student';
    const school = transcript.school || profile.school || {};
    const schoolName = school.name || 'Mercy T International College (MIC)';
    const reportCards = transcript.reportCards || [];
    const currentClass = student?.currentClass || student?.class || profile.currentClass || {};
    const enrollment = (student?.enrollments || []).find((item) => item.status === 'ACTIVE' && item.session?.isActive);
    const className = enrollment?.class?.name || currentClass.name || profile.currentClass || '—';
    const identity = [
      ['Student name', fullName],
      ['Registration number', profile.registrationNumber || student?.registrationNumber || student?.regNumber],
      ['Class', className],
      ['Gender', profile.gender || student?.gender]
    ].filter(([, value]) => value);
    const logo = school.logoUrl
      ? `<img class="report-school-logo" src="${escapeHtml(school.logoUrl)}" alt="${escapeHtml(`${schoolName} logo`)}" />`
      : '';

    const reportSections = reportCards.map((report) => {
      const classNameForReport = report.class?.name || className;
      const entries = report.entries || [];
      return `
        <section class="report-card-page">
          <div class="report-card-school">
            ${logo}
            <div class="report-card-school__identity">
              <h1>${escapeHtml(schoolName)}</h1>
              ${school.motto ? `<p class="report-school-motto">${escapeHtml(school.motto)}</p>` : ''}
              <p>${escapeHtml([school.address, school.city, school.state].filter(Boolean).join(', '))}</p>
              <p>${escapeHtml([school.phone, school.email].filter(Boolean).join(' · '))}</p>
            </div>
          </div>
          <div class="report-card-title">
            <h2>STUDENT ACADEMIC REPORT</h2>
            <span>${escapeHtml(reportLabel(report))}</span>
          </div>
          <div class="report-student-details">
            ${identity.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}
            <div><span>Session</span><strong>${escapeHtml(report.session?.name || '—')}</strong></div>
            <div><span>Term</span><strong>${escapeHtml(titleCaseFromEnum(report.term?.name || report.term?.type || '—'))}</strong></div>
            <div><span>Class position</span><strong>${report.position ? `${escapeHtml(String(report.position))}${report.classSize ? ` / ${escapeHtml(String(report.classSize))}` : ''}` : '—'}</strong></div>
            <div><span>Overall average</span><strong>${report.average == null ? '—' : `${escapeHtml(Number(report.average).toFixed(1))}%`}</strong></div>
          </div>
          <table class="report-card-table">
            <thead><tr><th>Subject</th><th>1st CA<br /><small>/ 20</small></th><th>2nd CA<br /><small>/ 20</small></th><th>Exam<br /><small>/ 60</small></th><th>Total<br /><small>/ 100</small></th><th>Percentage</th><th>Grade</th><th>Remark</th></tr></thead>
            <tbody>
              ${entries.map((entry) => {
                const total = isComplete(entry) ? Number(entry.total ?? 0) : null;
                return `<tr>
                  <td>${escapeHtml(entry.subject?.name || '—')}</td>
                  ${scoreCell(entry.firstTest, 'test')}
                  ${scoreCell(entry.secondTest, 'test')}
                  ${scoreCell(entry.exam, 'exam')}
                  ${scoreCell(total, 'overall')}
                  ${scoreCell(total == null ? null : `${total.toFixed(1)}%`, 'overall')}
                  <td><strong>${escapeHtml(isComplete(entry) ? entry.grade || '—' : 'Pending')}</strong></td>
                  <td>${escapeHtml(isComplete(entry) ? entry.remark || '—' : 'Assessment incomplete')}</td>
                </tr>`;
              }).join('')}
              ${entries.length ? '' : '<tr><td colspan="8">No subject results are available.</td></tr>'}
            </tbody>
          </table>
          <div class="report-card-summary">
            <div><span>Attendance</span><strong>${escapeHtml(String(report.attendancePresent ?? 0))} present · ${escapeHtml(String(report.attendanceAbsent ?? 0))} absent · ${escapeHtml(String(report.attendanceLate ?? 0))} late</strong></div>
            <div><span>Class teacher’s comment</span><p>${escapeHtml(report.teacherComment || '—')}</p></div>
            <div><span>Principal’s comment</span><p>${escapeHtml(report.principalComment || '—')}</p></div>
          </div>
          <div class="report-signatures"><span>Class teacher</span><span>Principal / Head teacher</span><span>Parent / Guardian</span></div>
          <footer>${escapeHtml(schoolName)} · ${escapeHtml(classNameForReport)} · ${escapeHtml(reportLabel(report))}</footer>
        </section>`;
    });

    const legacyRows = (transcript.records || transcript.results || []);
    const content = reportSections.length ? reportSections.join('') : legacyRows.length
      ? `<section class="report-card-page">
          <div class="report-card-school"><div class="report-card-school__identity"><h1>${escapeHtml(schoolName)}</h1><p>${escapeHtml([school.address, school.city, school.state].filter(Boolean).join(', '))}</p></div></div>
          <div class="report-card-title"><h2>ACADEMIC TRANSCRIPT</h2></div>
          <div class="report-student-details">${identity.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}</div>
          <table class="report-card-table"><thead><tr><th>Session / Term</th><th>Subject</th><th>Score</th><th>Grade</th><th>Remark</th></tr></thead><tbody>
            ${legacyRows.map((row) => `<tr><td>${escapeHtml(row.termName || row.term?.name || '—')}</td><td>${escapeHtml(row.subjectName || row.subject?.name || row.subject || '—')}</td><td class="numeric">${escapeHtml(formatScore(row.score))}</td><td>${escapeHtml(row.grade || '—')}</td><td>${escapeHtml(row.remarks || row.remark || '—')}</td></tr>`).join('')}
          </tbody></table>
          <div class="report-signatures"><span>Class teacher</span><span>Principal / Head teacher</span><span>Parent / Guardian</span></div>
        </section>`
      : '<div class="table-state"><p>No published results available yet.</p></div>';

    container.innerHTML = `<div class="transcript-sheet">
      <div class="report-card-actions no-print"><button type="button" class="btn btn-secondary" id="print-transcript-btn">Print report</button></div>
      ${content}
    </div>`;
    document.getElementById('print-transcript-btn')?.addEventListener('click', () => global.print());
  }

  global.ReportCardRenderer = { render };
})(window);
