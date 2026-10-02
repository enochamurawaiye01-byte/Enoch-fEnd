(function () {
  'use strict';

  function rowActions(row, canManage) {
    const publishBtn = row.status !== 'PUBLISHED' && canManage
      ? `<button type="button" class="icon-link" data-action="publish" title="Publish">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M5 13l4 4L19 7"/></svg>
        </button>`
      : '';
    return `
      <div class="row" style="gap:4px; justify-content:flex-end;">
        ${publishBtn}
      </div>
    `;
  }

  async function initializeTeacherResultEntry() {
    const sessionSelect = document.getElementById('filter-session');
    const termSelect = document.getElementById('filter-term');
    const classSelect = document.getElementById('filter-class');
    const subjectSelect = document.getElementById('filter-subject');
    const loadButton = document.getElementById('load-result-sheet-btn');
    const saveButton = document.getElementById('save-term-results-btn');
    const tbody = document.getElementById('results-tbody');
    let assignments = [];
    let configuration = null;
    let dirty = false;

    const setOptions = (select, placeholder, values) => {
      select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>${values.map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join('')}`;
    };
    const matchingAssignments = () => assignments.filter((assignment) => assignment.classId === classSelect.value
      && (!assignment.sessionId || assignment.sessionId === sessionSelect.value)
      && (!assignment.termId || assignment.termId === termSelect.value));
    const updateSubjects = () => {
      const subjects = new Map();
      matchingAssignments().forEach((assignment) => {
        if (assignment.subject) subjects.set(assignment.subjectId, assignment.subject.name);
      });
      setOptions(subjectSelect, 'Select subject', [...subjects].map(([value, label]) => ({ value, label })));
      subjectSelect.disabled = !classSelect.value;
    };

    try {
      const [{ items: assignmentRows }, { items: sessions }, currentConfiguration] = await Promise.all([
        TeacherAssignmentsService.list(),
        AcademicSessionsService.list({ pageSize: 100 }),
        ReportCardsService.getConfiguration()
      ]);
      assignments = assignmentRows || [];
      configuration = currentConfiguration;
      const activeSession = sessions.find((session) => session.isActive);
      setOptions(sessionSelect, 'Select session', sessions.map((session) => ({ value: session.id, label: session.name })));
      if (activeSession) sessionSelect.value = activeSession.id;
      const classes = new Map();
      assignments.forEach((assignment) => { if (assignment.class) classes.set(assignment.classId, assignment.class.name); });
      setOptions(classSelect, 'Select assigned class', [...classes].map(([value, label]) => ({ value, label })));
      if (!assignments.length) Toast.show('info', 'No class/subject assignments are available for your account.');
    } catch (error) {
      Toast.error(error.message || 'Unable to load your assigned classes and subjects.');
      loadButton.disabled = true;
      saveButton.disabled = true;
      return;
    }

    async function updateTerms() {
      const sessionId = sessionSelect.value;
      termSelect.disabled = !sessionId;
      classSelect.disabled = !sessionId;
      if (!sessionId) {
        setOptions(termSelect, 'Select session first', []);
        updateSubjects();
        return;
      }
      const { items: terms } = await TermsService.list({ sessionId, pageSize: 50 });
      setOptions(termSelect, 'Select term', terms.map((term) => ({ value: term.id, label: titleCaseFromEnum(term.name || term.type) })));
      const activeTerm = terms.find((term) => term.isActive);
      if (activeTerm) termSelect.value = activeTerm.id;
      updateSubjects();
    }

    async function loadRoster() {
      if (!sessionSelect.value || !termSelect.value || !classSelect.value || !subjectSelect.value) {
        Toast.error('Select a session, term, class, and assigned subject first.');
        return;
      }
      loadButton.disabled = true;
      saveButton.disabled = true;
      tbody.innerHTML = '<tr><td colspan="6">Loading enrolled students…</td></tr>';
      try {
        const sheet = await ResultsService.termEntry({ sessionId: sessionSelect.value, termId: termSelect.value, classId: classSelect.value, subjectId: subjectSelect.value });
        configuration = sheet.configuration;
        if (!sheet.students.length) {
          tbody.innerHTML = '<tr><td colspan="6">No active students are enrolled for this class, term, and subject.</td></tr>';
          dirty = false;
          return;
        }
        tbody.innerHTML = sheet.students.map((student) => `
          <tr data-student-id="${escapeHtml(student.id)}">
            <td data-label="Student">${escapeHtml(student.fullName)}</td>
            <td data-label="Registration No.">${escapeHtml(student.registrationNumber)}</td>
            <td data-label="First CA"><input class="score-input" data-score="firstTest" type="number" min="0" max="${escapeHtml(String(configuration.firstTestMax))}" step="0.01" value="${student.scores ? escapeHtml(String(student.scores.firstTest)) : ''}" aria-label="First CA for ${escapeHtml(student.fullName)}" /></td>
            <td data-label="Second CA"><input class="score-input" data-score="secondTest" type="number" min="0" max="${escapeHtml(String(configuration.secondTestMax))}" step="0.01" value="${student.scores ? escapeHtml(String(student.scores.secondTest)) : ''}" aria-label="Second CA for ${escapeHtml(student.fullName)}" /></td>
            <td data-label="Examination"><input class="score-input" data-score="exam" type="number" min="0" max="${escapeHtml(String(configuration.examMax))}" step="0.01" value="${student.scores ? escapeHtml(String(student.scores.exam)) : ''}" aria-label="Examination score for ${escapeHtml(student.fullName)}" /></td>
            <td data-label="Total"><strong data-score-total>${student.scores ? escapeHtml(String(student.scores.total)) : '—'}</strong></td>
          </tr>`).join('');
        dirty = false;
        saveButton.disabled = false;
      } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-danger">${escapeHtml(error.message || 'Unable to load this result sheet.')}</td></tr>`;
      } finally {
        loadButton.disabled = false;
      }
    }

    sessionSelect.addEventListener('change', () => updateTerms().catch((error) => Toast.error(error.message)));
    termSelect.addEventListener('change', updateSubjects);
    classSelect.addEventListener('change', updateSubjects);
    loadButton.addEventListener('click', loadRoster);
    tbody.addEventListener('input', (event) => {
      const input = event.target.closest('.score-input');
      if (!input) return;
      dirty = true;
      const row = input.closest('tr');
      const values = [...row.querySelectorAll('.score-input')].map((field) => Number(field.value || 0));
      row.querySelector('[data-score-total]').textContent = values.reduce((total, value) => total + value, 0).toFixed(2).replace(/\.00$/, '');
    });
    window.addEventListener('beforeunload', (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    });
    saveButton.addEventListener('click', async () => {
      const entries = [...tbody.querySelectorAll('tr[data-student-id]')].map((row) => {
        const fields = [...row.querySelectorAll('.score-input')];
        if (fields.every((field) => field.value === '')) return null;
        return { studentId: row.dataset.studentId, firstTest: Number(fields[0].value || 0), secondTest: Number(fields[1].value || 0), exam: Number(fields[2].value || 0) };
      }).filter(Boolean);
      if (!entries.length) {
        Toast.error('Enter at least one student score before saving.');
        return;
      }
      saveButton.disabled = true;
      try {
        const result = await ResultsService.saveTermEntries({ sessionId: sessionSelect.value, termId: termSelect.value, classId: classSelect.value, subjectId: subjectSelect.value, entries });
        dirty = false;
        Toast.success(`${result.count} student result(s) saved.`);
        await loadRoster();
      } catch (error) {
        Toast.error(error.message || 'Unable to save these results.');
      } finally {
        saveButton.disabled = false;
      }
    });
    await updateTerms();
  }

  async function initializeAdminTermReports() {
    const controls = {
      sessionId: document.getElementById('term-report-session'),
      termId: document.getElementById('term-report-term'),
      classId: document.getElementById('term-report-class'),
      subjectId: document.getElementById('term-report-subject'),
      teacherId: document.getElementById('term-report-teacher')
    };
    const tbody = document.getElementById('term-reports-tbody');
    const summary = document.getElementById('term-result-completion');
    const loadButton = document.getElementById('load-term-reports-btn');
    if (!tbody || !loadButton) return;
    const setOptions = (select, placeholder, rows) => {
      select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>${rows.map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join('')}`;
    };
    try {
      const [{ items: sessions }, { items: terms }, { items: classes }, { items: subjects }, { items: teachers }] = await Promise.all([
        AcademicSessionsService.list({ pageSize: 100 }), TermsService.list({ pageSize: 100 }), ClassesService.list({ pageSize: 200 }),
        SubjectsService.list({ pageSize: 300 }), TeachersService.list({ pageSize: 300 })
      ]);
      setOptions(controls.sessionId, 'All sessions', sessions.map((row) => ({ value: row.id, label: row.name })));
      setOptions(controls.termId, 'All terms', terms.map((row) => ({ value: row.id, label: `${titleCaseFromEnum(row.name || row.type)} — ${row.session?.name || ''}` })));
      setOptions(controls.classId, 'All classes', classes.map((row) => ({ value: row.id, label: row.name })));
      setOptions(controls.subjectId, 'All subjects', subjects.map((row) => ({ value: row.id, label: row.name })));
      setOptions(controls.teacherId, 'All teachers', teachers.map((row) => ({ value: row.id, label: `${row.firstName || ''} ${row.lastName || ''}`.trim() || row.user?.fullName || row.name || 'Teacher' })));
    } catch (error) {
      Toast.error(error.message || 'Unable to load result filters.');
    }

    async function loadReports() {
      loadButton.disabled = true;
      tbody.innerHTML = '<tr><td colspan="14">Loading term results…</td></tr>';
      try {
        const filters = Object.fromEntries(Object.entries(controls).map(([key, select]) => [key, select.value]));
        const { items: reports } = await ResultsService.termReports(filters);
        const rows = reports.flatMap((report) => (report.entries || []).map((entry) => ({ report, entry })));
        tbody.innerHTML = rows.length ? rows.map(({ report, entry }) => `
          <tr>
            <td data-label="Student">${escapeHtml(`${report.student?.firstName || ''} ${report.student?.lastName || ''}`.trim())}</td>
            <td data-label="Registration no.">${escapeHtml(report.student?.registrationNumber || '—')}</td>
            <td data-label="Class">${escapeHtml(report.class?.name || report.student?.currentClass?.name || '—')}</td>
            <td data-label="Subject">${escapeHtml(entry.subject?.name || '—')}</td>
            <td data-label="Session / Term">${escapeHtml(`${report.session?.name || ''} / ${titleCaseFromEnum(report.term?.name || report.term?.type || '')}`)}</td>
            <td data-label="1st CA">${escapeHtml(String(entry.firstTest ?? '—'))}</td>
            <td data-label="2nd CA">${escapeHtml(String(entry.secondTest ?? '—'))}</td>
            <td data-label="Exam">${escapeHtml(String(entry.exam ?? '—'))}</td>
            <td data-label="Total">${escapeHtml(String(entry.total ?? '—'))}</td>
            <td data-label="Grade"><strong>${escapeHtml(entry.grade || '—')}</strong></td>
            <td data-label="Remark">${escapeHtml(entry.remark || '—')}</td>
            <td data-label="Teacher">${escapeHtml(entry.teacher ? `${entry.teacher.firstName} ${entry.teacher.lastName}`.trim() : '—')}</td>
            <td data-label="Status"><span class="badge ${report.published ? 'badge-success' : 'badge-warning'}">${report.published ? 'Published' : 'Draft'}</span></td>
            <td data-label="Action"><button type="button" class="btn ${report.published ? 'btn-secondary' : 'btn-primary'} btn-sm" data-report-id="${escapeHtml(report.id)}" data-published="${report.published}">${report.published ? 'Unpublish' : 'Publish'}</button></td>
          </tr>`).join('') : '<tr><td colspan="14">No term results match these filters.</td></tr>';

        if (filters.classId && filters.subjectId && filters.sessionId && filters.termId) {
          const sheet = await ResultsService.termEntry(filters);
          summary.textContent = `${sheet.students.length} enrolled · ${sheet.submitted} submitted · ${sheet.pending} pending`;
        } else {
          summary.textContent = `${rows.length} subject result(s) found.`;
        }
      } catch (error) {
        tbody.innerHTML = `<tr><td colspan="14" class="text-danger">${escapeHtml(error.message || 'Unable to load term results.')}</td></tr>`;
        summary.textContent = '';
      } finally {
        loadButton.disabled = false;
      }
    }

    loadButton.addEventListener('click', loadReports);
    tbody.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-report-id]');
      if (!button) return;
      const reportId = button.dataset.reportId;
      const nextPublished = button.dataset.published !== 'true';
      try {
        await ReportCardsService.publish(reportId, nextPublished);
        Toast.success(nextPublished ? 'Report card published.' : 'Report card unpublished.');
        await loadReports();
      } catch (error) {
        Toast.error(error.message || 'Unable to update publication status.');
      }
    });
    await loadReports();
  }

  async function initializeTeacherResultEntryLegacy() {
    const sessionSelect = document.getElementById('filter-session');
    const termSelect = document.getElementById('filter-term');
    const classSelect = document.getElementById('filter-class');
    const subjectSelect = document.getElementById('filter-subject');
    const loadButton = document.getElementById('load-result-sheet-btn');
    const saveButton = document.getElementById('save-term-results-btn');
    const tbody = document.getElementById('results-tbody');
    let assignments = [];
    let configuration = null;
    let dirty = false;

    const setOptions = (select, placeholder, values) => {
      select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>${values.map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join('')}`;
    };

    function matchingAssignments() {
      return assignments.filter((assignment) => assignment.classId === classSelect.value
        && (!assignment.sessionId || assignment.sessionId === sessionSelect.value)
        && (!assignment.termId || assignment.termId === termSelect.value));
    }

    function updateSubjects() {
      const subjects = new Map();
      matchingAssignments().forEach((assignment) => {
        if (assignment.subject) subjects.set(assignment.subjectId, assignment.subject.name);
      });
      setOptions(subjectSelect, 'Select subject', [...subjects].map(([value, label]) => ({ value, label })));
    }

    try {
      const [{ items: assignmentRows }, { items: sessions }, currentConfiguration] = await Promise.all([
        TeacherAssignmentsService.list(),
        AcademicSessionsService.list({ pageSize: 100 }),
        ReportCardsService.getConfiguration()
      ]);
      assignments = assignmentRows || [];
      configuration = currentConfiguration;
      const activeSession = sessions.find((session) => session.isActive);
      setOptions(sessionSelect, 'Select session', sessions.map((session) => ({ value: session.id, label: session.name })));
      if (activeSession) sessionSelect.value = activeSession.id;
      const classes = new Map();
      assignments.forEach((assignment) => {
        if (assignment.class) classes.set(assignment.classId, assignment.class.name);
      });
      setOptions(classSelect, 'Select assigned class', [...classes].map(([value, label]) => ({ value, label })));
      if (!assignments.length) Toast.show('info', 'No class/subject assignments are available for your account.');
    } catch (error) {
      Toast.error(error.message || 'Unable to load your assigned classes and subjects.');
      loadButton.disabled = true;
      saveButton.disabled = true;
      return;
    }

    async function updateTerms() {
      const sessionId = sessionSelect.value;
      termSelect.disabled = !sessionId;
      subjectSelect.disabled = true;
      classSelect.disabled = !sessionId;
      if (!sessionId) {
        setOptions(termSelect, 'Select session first', []);
        return;
      }
      const { items: terms } = await TermsService.list({ sessionId, pageSize: 50 });
      setOptions(termSelect, 'Select term', terms.map((term) => ({ value: term.id, label: titleCaseFromEnum(term.name || term.type) })));
      const activeTerm = terms.find((term) => term.isActive);
      if (activeTerm) termSelect.value = activeTerm.id;
      updateSubjects();
      subjectSelect.disabled = !classSelect.value;
    }

    async function loadRoster() {
      if (!sessionSelect.value || !termSelect.value || !classSelect.value || !subjectSelect.value) {
        Toast.error('Select a session, term, class, and assigned subject first.');
        return;
      }
      loadButton.disabled = true;
      saveButton.disabled = true;
      tbody.innerHTML = '<tr><td colspan="6">Loading enrolled students…</td></tr>';
      try {
        const sheet = await ResultsService.termEntry({
          sessionId: sessionSelect.value,
          termId: termSelect.value,
          classId: classSelect.value,
          subjectId: subjectSelect.value
        });
        configuration = sheet.configuration;
        if (!sheet.students.length) {
          tbody.innerHTML = '<tr><td colspan="6">No active students are enrolled for this class, term, and subject.</td></tr>';
          dirty = false;
          return;
        }
        tbody.innerHTML = sheet.students.map((student) => `
          <tr data-student-id="${escapeHtml(student.id)}">
            <td data-label="Student">${escapeHtml(student.fullName)}</td>
            <td data-label="Registration No.">${escapeHtml(student.registrationNumber)}</td>
            <td data-label="First CA"><input class="score-input" data-score="firstTest" type="number" min="0" max="${escapeHtml(configuration.firstTestMax)}" step="0.01" value="${student.scores ? escapeHtml(String(student.scores.firstTest)) : ''}" aria-label="First CA for ${escapeHtml(student.fullName)}" /></td>
            <td data-label="Second CA"><input class="score-input" data-score="secondTest" type="number" min="0" max="${escapeHtml(configuration.secondTestMax)}" step="0.01" value="${student.scores ? escapeHtml(String(student.scores.secondTest)) : ''}" aria-label="Second CA for ${escapeHtml(student.fullName)}" /></td>
            <td data-label="Examination"><input class="score-input" data-score="exam" type="number" min="0" max="${escapeHtml(configuration.examMax)}" step="0.01" value="${student.scores ? escapeHtml(String(student.scores.exam)) : ''}" aria-label="Examination score for ${escapeHtml(student.fullName)}" /></td>
            <td data-label="Total"><strong data-score-total>${student.scores ? escapeHtml(String(student.scores.total)) : '—'}</strong></td>
          </tr>
        `).join('');
        dirty = false;
        saveButton.disabled = false;
      } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-danger">${escapeHtml(error.message || 'Unable to load this result sheet.')}</td></tr>`;
        dirty = false;
      } finally {
        loadButton.disabled = false;
      }
    }

    sessionSelect.addEventListener('change', () => updateTerms().catch((error) => Toast.error(error.message)));
    termSelect.addEventListener('change', updateSubjects);
    classSelect.addEventListener('change', updateSubjects);
    loadButton.addEventListener('click', loadRoster);
    tbody.addEventListener('input', (event) => {
      const input = event.target.closest('.score-input');
      if (!input) return;
      dirty = true;
      const row = input.closest('tr');
      const values = [...row.querySelectorAll('.score-input')].map((field) => Number(field.value || 0));
      row.querySelector('[data-score-total]').textContent = values.reduce((sum, value) => sum + value, 0).toFixed(2).replace(/\.00$/, '');
    });
    window.addEventListener('beforeunload', (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    });
    saveButton.addEventListener('click', async () => {
      const entries = [...tbody.querySelectorAll('tr[data-student-id]')].map((row) => {
        const fields = [...row.querySelectorAll('.score-input')];
        if (fields.every((field) => field.value === '')) return null;
        return { studentId: row.dataset.studentId, firstTest: Number(fields[0].value || 0), secondTest: Number(fields[1].value || 0), exam: Number(fields[2].value || 0) };
      }).filter(Boolean);
      if (!entries.length) {
        Toast.error('Enter at least one student score before saving.');
        return;
      }
      saveButton.disabled = true;
      try {
        const result = await ResultsService.saveTermEntries({
          sessionId: sessionSelect.value,
          termId: termSelect.value,
          classId: classSelect.value,
          subjectId: subjectSelect.value,
          entries
        });
        dirty = false;
        Toast.success(`${result.count} student result(s) saved.`);
        await loadRoster();
      } catch (error) {
        Toast.error(error.message || 'Unable to save these results.');
      } finally {
        saveButton.disabled = false;
      }
    });

    await updateTerms();
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    if (window.CurrentUser.role === 'TEACHER') {
      await initializeTeacherResultEntry();
      return;
    }
    initializeAdminTermReports();
    const canManage = ['ADMIN', 'SUPER_ADMIN'].includes(window.CurrentUser.role) && Permissions.canAccessModule(window.CurrentUser.role, 'results');

    let studentOptions = [], subjectOptions = [], termOptions = [], classOptions = [];
    try {
      const [{ items: students }, { items: subjects }, { items: terms }, { items: classes }] = await Promise.all([
        StudentsService.list({ pageSize: 200 }),
        SubjectsService.list({ pageSize: 200 }),
        TermsService.list({ pageSize: 50 }),
        ClassesService.list({ pageSize: 100 }),
      ]);
      studentOptions = students.map((s) => ({ value: s.id, label: `${s.firstName || ''} ${s.lastName || ''} (${s.regNumber || 'no reg.'})`.trim() }));
      subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));
      termOptions = terms.map((t) => ({ value: t.id, label: `${titleCaseFromEnum(t.name)} — ${t.academicSessionName || t.academicSession?.name || ''}`.trim() }));
      classOptions = classes.map((c) => ({ value: c.id, label: c.name }));
    } catch (e) { /* non-fatal */ }

    const filterClass = document.getElementById('filter-class');
    const filterTerm = document.getElementById('filter-term');
    if (filterClass) filterClass.innerHTML = '<option value="">All Classes</option>' + classOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');
    if (filterTerm) filterTerm.innerHTML = '<option value="">All Terms</option>' + termOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');

    const table = SimpleCrudPage.init({
      tbody: document.getElementById('results-tbody'),
      paginationEl: document.getElementById('results-pagination'),
      searchInput: document.getElementById('results-search'),
      addBtn: canManage ? document.getElementById('add-result-btn') : null,
      moduleKey: 'results',
      entityLabel: 'Result',
      service: ResultsService,
      columns: [
        { key: 'studentName', label: 'Student', render: (r) => escapeHtml(r.studentName || `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim() || '—') },
        { key: 'subjectName', label: 'Subject', render: (r) => escapeHtml(r.subjectName || r.subject?.name || '—') },
        { key: 'termName', label: 'Term', render: (r) => escapeHtml(titleCaseFromEnum(r.termName || r.term?.name || '')) },
        { key: 'score', label: 'Score', render: (r) => escapeHtml(String(r.score ?? '—')) },
        { key: 'grade', label: 'Grade', render: (r) => escapeHtml(r.grade || '—') },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadgeClass(r.status || 'DRAFT')}">${escapeHtml(titleCaseFromEnum(r.status || 'DRAFT'))}</span>` },
      ],
      buildRowActions: (row) => rowActions(row, canManage),
      formFields: [
        { name: 'studentId', label: 'Student', type: 'select', required: true, options: studentOptions },
        { name: 'subjectId', label: 'Subject', type: 'select', required: true, options: subjectOptions },
        { name: 'termId', label: 'Term', type: 'select', required: true, options: termOptions },
        { name: 'score', label: 'Score', type: 'number', required: true },
        { name: 'grade', label: 'Grade' },
        { name: 'remarks', label: 'Remarks', type: 'textarea' },
      ],
      deleteMessage: () => 'Delete this result record?',
      extraFilters: () => ({ classId: filterClass ? filterClass.value : '', termId: filterTerm ? filterTerm.value : '' }),
      onRowAction: async (e, id) => {
        if (e.target.closest('[data-action="publish"]')) {
          ConfirmDialog.open({
            title: 'Publish Result',
            message: 'Publishing makes this result visible to the student and their parent.',
            confirmLabel: 'Publish',
            tone: 'warn',
            onConfirm: async () => {
              await ResultsService.publish(id);
              Toast.success('Result published.');
              table.reload();
            },
          });
        }
      },
    });

    if (filterClass) filterClass.addEventListener('change', () => table.setFilters({ classId: filterClass.value, termId: filterTerm ? filterTerm.value : '' }));
    if (filterTerm) filterTerm.addEventListener('change', () => table.setFilters({ classId: filterClass ? filterClass.value : '', termId: filterTerm.value }));
  });
})();
