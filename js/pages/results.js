(function () {
  'use strict';

  const scoreTone = (value, kind) => {
    if (value === '' || value == null) return '';
    const score = Number(value);
    if (kind === 'test') return score < 10 ? 'score-band--red' : score < 15 ? 'score-band--orange' : 'score-band--green';
    if (kind === 'exam') return score < 30 ? 'score-band--red' : score < 40 ? 'score-band--orange' : 'score-band--green';
    return score < 40 ? 'score-band--red' : score < 60 ? 'score-band--orange' : 'score-band--green';
  };

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
    const sessionLabel = document.getElementById('current-session-label');
    const termLabel = document.getElementById('current-term-label');
    const classLabel = document.getElementById('assigned-class-label');
    const loadButton = document.getElementById('load-result-sheet-btn');
    const saveButton = document.getElementById('save-term-results-btn');
    const tbody = document.getElementById('results-tbody');
    let assignments = [];
    let classTeacherRows = [];
    let configuration = null;
    let subjectUpdateId = 0;
    const classSubjectCache = new Map();
    const saveQueue = new Map();
    let saveTimer = null;
    let drainPromise = null;
    let savingCount = 0;
    let previewRequestId = 0;
    let activeSheetKey = '';
    let previewTimer = null;
    saveButton.disabled = true;

    const sheetContext = () => ({
      sessionId: sessionSelect.value,
      termId: termSelect.value,
      classId: classSelect.value
    });
    const sheetKey = (context = sheetContext()) => `${context.sessionId}|${context.termId}|${context.classId}|${subjectSelect.value}`;
    const setRowStatus = (row, state, message, retry = false) => {
      const cell = row.querySelector('[data-save-state]');
      if (!cell) return;
      const retryButton = retry
        ? '<button type="button" class="btn btn-secondary btn-sm result-save-retry" data-retry-save>Retry</button>'
        : '';
      cell.innerHTML = `<span class="result-save-state result-save-state--${state}" role="status">${escapeHtml(message)}</span>${retryButton}`;
      row.dataset.saveState = state;
    };
    const rowPayload = (row) => {
      const fields = [...row.querySelectorAll('.score-input')];
      const hasValue = fields.some((field) => field.value !== '');
      if (!hasValue && row.dataset.hasScores !== 'true') return null;
      const payload = { studentId: row.dataset.studentId };
      fields.forEach((field) => {
        if (field.value !== '') payload[field.dataset.score] = Number(field.value);
      });
      if (hasValue || row.dataset.hasScores === 'true') {
        payload.teacherComment = row.querySelector('.teacher-comment-input').value.trim();
      }
      return payload;
    };
    const payloadKey = (payload) => payload ? JSON.stringify(payload) : '';
    const currentRowKey = (row) => payloadKey(rowPayload(row));
    const unsavedRows = () => [...tbody.querySelectorAll('tr[data-student-id]')]
      .filter((row) => currentRowKey(row) !== row.dataset.savedPayload);
    const updateSaveButton = () => {
      const changed = unsavedRows().length > 0 || saveQueue.size > 0 || savingCount > 0;
      saveButton.disabled = !changed;
      saveButton.textContent = savingCount ? `Saving ${savingCount}…` : changed ? 'Save all changes' : 'All changes saved';
      saveButton.setAttribute('aria-busy', savingCount ? 'true' : 'false');
      if (saveStatus) {
        saveStatus.textContent = savingCount
          ? `Saving ${savingCount} student result${savingCount === 1 ? '' : 's'}…`
          : saveQueue.size
            ? `${saveQueue.size} student result${saveQueue.size === 1 ? '' : 's'} waiting to save.`
            : changed
              ? 'Some changes need attention.'
              : 'All changes saved.';
      }
    };
    const syncDirty = () => {
      const dirty = unsavedRows().length > 0 || saveQueue.size > 0 || savingCount > 0;
      window.__teacherResultsDirty = dirty;
      updateSaveButton();
    };
    const contextForRow = (row) => {
      try {
        return JSON.parse(row.dataset.entryContext || '{}');
      } catch (_error) {
        return {};
      }
    };
    const queueRow = (row, immediate = false) => {
      const payload = rowPayload(row);
      const key = payloadKey(payload);
      if (key === row.dataset.savedPayload) {
        saveQueue.delete(row.dataset.studentId);
        setRowStatus(row, row.dataset.hasScores === 'true' ? 'saved' : 'idle', row.dataset.hasScores === 'true' ? 'Saved' : 'Not started');
        syncDirty();
        return;
      }
      if (!payload) {
        setRowStatus(row, 'pending', 'Enter scores to save');
        syncDirty();
        return;
      }
      saveQueue.set(row.dataset.studentId, {
        payload,
        key,
        context: contextForRow(row)
      });
      setRowStatus(row, 'queued', 'Waiting to save');
      if (saveTimer) clearTimeout(saveTimer);
      if (immediate) {
        saveTimer = null;
        void drainSaveQueue();
      } else {
        saveTimer = setTimeout(() => {
          saveTimer = null;
          void drainSaveQueue();
        }, 650);
      }
      syncDirty();
    };
    const schedulePreviewRefresh = () => {
      if (previewTimer) clearTimeout(previewTimer);
      previewTimer = setTimeout(() => {
        previewTimer = null;
        void loadTermPreview();
      }, 500);
    };
    const drainSaveQueue = () => {
      if (drainPromise) return drainPromise;
      drainPromise = (async () => {
        while (saveQueue.size) {
          const [studentId, item] = saveQueue.entries().next().value;
          saveQueue.delete(studentId);
          const row = tbody.querySelector(`tr[data-student-id="${CSS.escape(studentId)}"]`);
          if (!row) continue;
          savingCount += 1;
          setRowStatus(row, 'saving', 'Saving…');
          syncDirty();
          try {
            await ResultsService.saveTermEntries({
              ...item.context,
              entries: [item.payload]
            });
            row.dataset.savedPayload = item.key;
            row.dataset.hasScores = 'true';
            const latestKey = currentRowKey(row);
            if (latestKey !== item.key) {
              queueRow(row, true);
            } else {
              setRowStatus(row, 'saved', 'Saved');
            }
            schedulePreviewRefresh();
          } catch (error) {
            const latestKey = currentRowKey(row);
            if (latestKey !== item.key) {
              queueRow(row, true);
            } else {
              setRowStatus(row, 'error', error.message || 'Save failed', true);
            }
          } finally {
            savingCount = Math.max(0, savingCount - 1);
            syncDirty();
          }
        }
      })().finally(() => {
        drainPromise = null;
        syncDirty();
      });
      return drainPromise;
    };
    const flushAll = async () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      unsavedRows().forEach((row) => queueRow(row, true));
      await drainSaveQueue();
      return ![...tbody.querySelectorAll('tr[data-student-id]')].some((row) =>
        currentRowKey(row) !== row.dataset.savedPayload && row.dataset.saveState === 'error'
      );
    };

    const setOptions = (select, placeholder, values) => {
      select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>${values.map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join('')}`;
    };
    const matchingAssignments = () => assignments.filter((assignment) => assignment.classId === classSelect.value
      && (!assignment.sessionId || assignment.sessionId === sessionSelect.value)
      && (!assignment.termId || assignment.termId === termSelect.value));
    const updateClasses = (sessionId) => {
      const classes = new Map();
      assignments.forEach((assignment) => {
        if (assignment.class && (!assignment.sessionId || assignment.sessionId === sessionId)) {
          classes.set(assignment.classId, assignment.class.name);
        }
      });
      classTeacherRows.forEach((assignment) => {
        if (assignment.class && assignment.sessionId === sessionId) {
          classes.set(assignment.classId, assignment.class.name);
        }
      });
      setOptions(classSelect, 'Select assigned class', [...classes].map(([value, label]) => ({ value, label })));
      classSelect.disabled = !sessionId || !classes.size;
      if (!classes.has(classSelect.value)) classSelect.value = classes.keys().next().value || '';
      classLabel.textContent = classes.get(classSelect.value) || 'No class assigned for the active session';
    };
    const updateSubjects = async () => {
      const updateId = ++subjectUpdateId;
      const subjects = new Map();
      matchingAssignments().forEach((assignment) => {
        if (assignment.subject) subjects.set(assignment.subjectId, assignment.subject.name);
      });
      const isClassTeacher = classTeacherRows.some((assignment) =>
        assignment.classId === classSelect.value && assignment.sessionId === sessionSelect.value
      );
      subjectSelect.disabled = true;
      if (isClassTeacher && classSelect.value) {
        try {
          if (!classSubjectCache.has(classSelect.value)) {
            classSubjectCache.set(classSelect.value, ClassSubjectsService.list({ classId: classSelect.value }));
          }
          const { items } = await classSubjectCache.get(classSelect.value);
          items.forEach((classSubject) => {
            if (classSubject.subject?.isActive !== false) {
              subjects.set(classSubject.subjectId, classSubject.subject?.name || 'Subject');
            }
          });
        } catch (error) {
          classSubjectCache.delete(classSelect.value);
          if (updateId === subjectUpdateId) Toast.error(error.message || 'Unable to load subjects for your class.');
        }
      }
      if (updateId !== subjectUpdateId) return;
      setOptions(subjectSelect, 'Select subject', [...subjects].map(([value, label]) => ({ value, label })));
      subjectSelect.disabled = !classSelect.value || !subjects.size;
      if (!subjects.has(subjectSelect.value)) subjectSelect.value = subjects.size === 1 ? subjects.keys().next().value : '';
      if (subjectSelect.value && termSelect.value) await loadRoster();
      else if (!subjects.size) {
        tbody.innerHTML = '<tr><td colspan="8">No subjects are assigned to your class.</td></tr>';
        previewBody.innerHTML = '<tr><td colspan="4">No assigned subjects are available for this class.</td></tr>';
        previewStatus.textContent = '';
      }
    };

    try {
      const [{ items: assignmentRows }, { items: classTeacherAssignmentRows }, currentSession] = await Promise.all([
        TeacherAssignmentsService.list(),
        TeacherAssignmentsService.listClassTeachers(),
        AcademicSessionsService.current()
      ]);
      assignments = assignmentRows || [];
      classTeacherRows = classTeacherAssignmentRows || [];
      if (!currentSession?.id || currentSession.isActive === false) {
        throw new Error('There is no active academic session. Contact the school administrator.');
      }
      setOptions(sessionSelect, 'Current session', [{ value: currentSession.id, label: currentSession.name }]);
      sessionSelect.value = currentSession.id;
      sessionLabel.textContent = currentSession.name;
      updateClasses(sessionSelect.value);
      if (!classSelect.value) throw new Error('You have no class assignment for the active academic session.');
    } catch (error) {
      Toast.error(error.message || 'Unable to load your assigned classes and subjects.');
      sessionLabel.textContent = 'Unavailable';
      termLabel.textContent = 'Unavailable';
      classLabel.textContent = 'No assigned class';
      loadButton.disabled = true;
      saveButton.disabled = true;
      return;
    }

    async function updateTerms() {
      const sessionId = sessionSelect.value;
      termSelect.disabled = !sessionId;
      updateClasses(sessionId);
      if (!sessionId) {
        setOptions(termSelect, 'Select session first', []);
        await updateSubjects();
        return;
      }
      try {
        const { items: terms } = await TermsService.list({ sessionId, pageSize: 50 });
        setOptions(termSelect, 'Select term', terms.map((term) => ({ value: term.id, label: titleCaseFromEnum(term.name || term.type) })));
        const selectedTerm = terms.find((term) => term.isActive);
        termSelect.disabled = !selectedTerm;
        if (!selectedTerm) throw new Error('There is no active term for the current academic session. Contact the school administrator.');
        if (selectedTerm) termSelect.value = selectedTerm.id;
        termLabel.textContent = titleCaseFromEnum(selectedTerm.name || selectedTerm.type);
        await updateSubjects();
      } catch (error) {
        setOptions(termSelect, 'Unable to load terms', []);
        termLabel.textContent = 'Unavailable';
        await updateSubjects();
        Toast.error(error.message || 'Unable to load terms for this session.');
      }
    }

    async function loadRoster() {
      if (!sessionSelect.value || !termSelect.value || !classSelect.value || !subjectSelect.value) {
        Toast.error('Select a session, term, class, and assigned subject first.');
        return;
      }
      const nextSheetKey = sheetKey();
      if (tbody.querySelector('tr[data-student-id]') && (activeSheetKey !== nextSheetKey || unsavedRows().length || saveQueue.size)) {
        const saved = await flushAll();
        if (!saved) {
          Toast.error('Some scores could not be saved. Retry the affected student before loading another sheet.');
          return;
        }
      }
      loadButton.disabled = true;
      saveButton.disabled = true;
      tbody.innerHTML = '<tr><td colspan="8">Loading enrolled students…</td></tr>';
      previewBody.innerHTML = '<tr><td colspan="4">Loading saved subjects and completeness…</td></tr>';
      previewStatus.textContent = '';
      try {
        const sheet = await ResultsService.termEntry({ sessionId: sessionSelect.value, termId: termSelect.value, classId: classSelect.value, subjectId: subjectSelect.value });
        configuration = sheet.configuration;
        activeSheetKey = nextSheetKey;
        if (!sheet.students.length) {
          tbody.innerHTML = '<tr><td colspan="8">No active students are enrolled for this class, term, and subject.</td></tr>';
          await loadTermPreview();
          return;
        }
        tbody.innerHTML = sheet.students.map((student) => {
          const savedPayload = student.scores ? {
            studentId: student.id,
            ...(student.scores.firstTest != null ? { firstTest: Number(student.scores.firstTest) } : {}),
            ...(student.scores.secondTest != null ? { secondTest: Number(student.scores.secondTest) } : {}),
            ...(student.scores.exam != null ? { exam: Number(student.scores.exam) } : {}),
            teacherComment: student.scores.teacherComment || ''
          } : null;
          const complete = student.scores && ['firstTest', 'secondTest', 'exam'].every((field) => student.scores[field] != null);
          return `
          <tr data-student-id="${escapeHtml(student.id)}" data-entry-context="${escapeHtml(JSON.stringify({ sessionId: sessionSelect.value, termId: termSelect.value, classId: classSelect.value, subjectId: subjectSelect.value }))}" data-has-scores="${student.scores ? 'true' : 'false'}" data-saved-payload="${savedPayload ? escapeHtml(JSON.stringify(savedPayload)) : ''}" data-save-state="${student.scores ? 'saved' : 'idle'}">
            <td data-label="Student">${escapeHtml(student.fullName)}</td>
            <td data-label="Registration No.">${escapeHtml(student.registrationNumber)}</td>
            <td data-label="First CA"><input class="score-input ${scoreTone(student.scores?.firstTest, 'test')}" data-score="firstTest" type="number" min="0" max="${escapeHtml(String(configuration.firstTestMax))}" step="0.01" value="${student.scores?.firstTest == null ? '' : escapeHtml(String(student.scores.firstTest))}" aria-label="First CA for ${escapeHtml(student.fullName)}" /></td>
            <td data-label="Second CA"><input class="score-input ${scoreTone(student.scores?.secondTest, 'test')}" data-score="secondTest" type="number" min="0" max="${escapeHtml(String(configuration.secondTestMax))}" step="0.01" value="${student.scores?.secondTest == null ? '' : escapeHtml(String(student.scores.secondTest))}" aria-label="Second CA for ${escapeHtml(student.fullName)}" /></td>
            <td data-label="Examination"><input class="score-input ${scoreTone(student.scores?.exam, 'exam')}" data-score="exam" type="number" min="0" max="${escapeHtml(String(configuration.examMax))}" step="0.01" value="${student.scores?.exam == null ? '' : escapeHtml(String(student.scores.exam))}" aria-label="Examination score for ${escapeHtml(student.fullName)}" /></td>
            <td data-label="Total"><strong class="${complete ? scoreTone(student.scores.total, 'overall') : ''}" data-score-total>${complete ? escapeHtml(String(student.scores.total)) : student.scores ? `Partial · ${escapeHtml(String(student.scores.total ?? 0))}` : '—'}</strong></td>
            <td data-label="Teacher remark"><textarea class="teacher-comment-input" maxlength="500" aria-label="Teacher remark for ${escapeHtml(student.fullName)}">${escapeHtml(student.scores?.teacherComment || '')}</textarea></td>
            <td data-label="Save status" data-save-state><span class="result-save-state result-save-state--${student.scores ? 'saved' : 'idle'}" role="status">${student.scores ? 'Saved' : 'Not started'}</span></td>
          </tr>`;
        }).join('');
        syncDirty();
        await loadTermPreview();
      } catch (error) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-danger">${escapeHtml(error.message || 'Unable to load this result sheet.')}</td></tr>`;
      } finally {
        loadButton.disabled = false;
      }
    }

    async function loadTermPreview() {
      if (!previewBody || !previewStatus || !sessionSelect.value || !termSelect.value || !classSelect.value) return;
      const requestId = ++previewRequestId;
      const context = sheetContext();
      const subjects = [...subjectSelect.options]
        .filter((option) => option.value)
        .map((option) => ({ id: option.value, name: option.textContent }));
      if (!subjects.length) {
        previewBody.innerHTML = '<tr><td colspan="4">No assigned subjects are available for this class.</td></tr>';
        previewStatus.textContent = '';
        return;
      }
      previewStatus.textContent = 'Checking saved results across your assigned subjects…';
      const responses = await Promise.allSettled(subjects.map((subject) =>
        ResultsService.termEntry({ ...context, subjectId: subject.id })
      ));
      if (requestId !== previewRequestId) return;
      const students = new Map();
      let successfulSubjects = 0;
      responses.forEach((response, index) => {
        if (response.status !== 'fulfilled') return;
        successfulSubjects += 1;
        const subject = subjects[index];
        (response.value.students || []).forEach((student) => {
          if (!students.has(student.id)) {
            students.set(student.id, {
              name: student.fullName,
              registrationNumber: student.registrationNumber,
              expected: 0,
              saved: []
            });
          }
          const summary = students.get(student.id);
          summary.expected += 1;
          if (student.scores) summary.saved.push(subject.name);
        });
      });
      const rows = [...students.values()];
      previewBody.innerHTML = rows.length ? rows.map((student) => {
        const percent = student.expected ? Math.round(student.saved.length / student.expected * 100) : 0;
        return `<tr>
          <td data-label="Student"><strong>${escapeHtml(student.name)}</strong><span class="text-muted result-preview-registration">${escapeHtml(student.registrationNumber || '—')}</span></td>
          <td data-label="Saved subjects">${student.saved.length ? escapeHtml(student.saved.join(', ')) : '<span class="text-muted">No saved subjects yet</span>'}</td>
          <td data-label="Completeness">
            <div class="result-completeness"><span>${student.saved.length} of ${student.expected} subjects</span><strong>${percent}%</strong></div>
            <div class="result-completeness-track" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(student.name)} result completeness"><span style="width:${percent}%"></span></div>
          </td>
          <td data-label="Status"><span class="badge ${percent === 100 ? 'badge-success' : 'badge-warning'}">${percent === 100 ? 'Complete' : 'In progress'}</span></td>
        </tr>`;
      }).join('') : `<tr><td colspan="4">${successfulSubjects ? 'No active students were found for this class and term.' : 'Unable to load saved subject results. Try again.'}</td></tr>`;
      previewStatus.textContent = successfulSubjects === subjects.length
        ? `${students.size} student${students.size === 1 ? '' : 's'} · ${subjects.length} assigned subject${subjects.length === 1 ? '' : 's'} checked`
        : `${successfulSubjects} of ${subjects.length} assigned subjects checked. Some results could not be loaded.`;
    }

    sessionSelect.addEventListener('change', () => updateTerms().catch((error) => Toast.error(error.message)));
    termSelect.addEventListener('change', () => updateSubjects().catch((error) => Toast.error(error.message)));
    classSelect.addEventListener('change', () => updateSubjects().catch((error) => Toast.error(error.message)));
    subjectSelect.addEventListener('change', loadRoster);
    loadButton.addEventListener('click', loadRoster);
    tbody.addEventListener('input', (event) => {
      const input = event.target.closest('.score-input, .teacher-comment-input');
      if (!input) return;
      const row = input.closest('tr');
      if (input.matches('.score-input')) {
        const scoreInputs = [...row.querySelectorAll('.score-input')];
        const complete = scoreInputs.every((field) => field.value !== '');
        const totalElement = row.querySelector('[data-score-total]');
        const total = scoreInputs.reduce((sum, field) => sum + Number(field.value || 0), 0);
        totalElement.textContent = complete ? total.toFixed(2).replace(/\.00$/, '') : `Partial · ${total.toFixed(2).replace(/\.00$/, '')}`;
        totalElement.className = complete ? scoreTone(total, 'overall') : '';
        input.classList.remove('score-band--red', 'score-band--orange', 'score-band--green');
        const tone = scoreTone(input.value, input.dataset.score === 'exam' ? 'exam' : 'test');
        if (tone) input.classList.add(tone);
      }
      queueRow(row);
    });
    window.addEventListener('beforeunload', (event) => {
      if (!window.__teacherResultsDirty) return;
      event.preventDefault();
      event.returnValue = '';
    });
    tbody.addEventListener('click', (event) => {
      const retry = event.target.closest('[data-retry-save]');
      if (!retry) return;
      const row = retry.closest('tr[data-student-id]');
      if (row) queueRow(row, true);
    });
    saveButton.addEventListener('click', async () => {
      const saved = await flushAll();
      if (saved) Toast.success('All changed student scores are saved.');
      else Toast.error('Some scores could not be saved. Retry the affected student rows.');
    });
    const previewBody = document.getElementById('term-preview-tbody');
    const previewStatus = document.getElementById('term-preview-status');
    const saveStatus = document.getElementById('teacher-results-save-status');
    updateSaveButton();
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
    const activateClassTermStudentButton = document.getElementById('activate-class-term-student-results-btn');
    const activateClassTermParentButton = document.getElementById('activate-class-term-parent-results-btn');
    if (!tbody || !loadButton) return;
    const updateBulkControl = () => {
      const disabled = !(controls.sessionId.value && controls.termId.value && controls.classId.value);
      if (activateClassTermStudentButton) activateClassTermStudentButton.disabled = disabled;
      if (activateClassTermParentButton) activateClassTermParentButton.disabled = disabled;
    };
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

    Object.values(controls).forEach((control) => control.addEventListener('change', updateBulkControl));

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
            <td data-label="Status"><span class="badge ${report.studentPublished ? 'badge-success' : 'badge-warning'}">Student: ${report.studentPublished ? 'Published' : 'Hidden'}</span> <span class="badge ${report.parentPublished ? 'badge-success' : 'badge-warning'}">Parent: ${report.parentPublished ? 'Published' : 'Hidden'}</span></td>
            <td data-label="Action">
              <button type="button" class="btn ${report.studentPublished ? 'btn-secondary' : 'btn-primary'} btn-sm" data-report-id="${escapeHtml(report.id)}" data-portal="student" data-published="${report.studentPublished}">${report.studentPublished ? 'Hide from student' : 'Show to student'}</button>
              <button type="button" class="btn ${report.parentPublished ? 'btn-secondary' : 'btn-primary'} btn-sm" data-report-id="${escapeHtml(report.id)}" data-portal="parent" data-published="${report.parentPublished}">${report.parentPublished ? 'Hide from parent' : 'Show to parent'}</button>
            </td>
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
    const publishClassTerm = (portal) => {
      const filters = Object.fromEntries(Object.entries(controls).map(([key, select]) => [key, select.value]));
      if (!filters.sessionId || !filters.termId || !filters.classId) return;
      ConfirmDialog.open({
        title: `Activate class results for ${portal}s`,
        message: `Are you sure you want to publish all complete results for this class, session, and term to the ${portal} portal? Every enrolled student must have a result for each registered subject. This will not change visibility on the other portal.`,
        confirmLabel: `Activate for ${portal}s`,
        tone: 'primary',
        onConfirm: async () => {
          const button = portal === 'student' ? activateClassTermStudentButton : activateClassTermParentButton;
          button.disabled = true;
          try {
            const result = await ReportCardsService.publishClassTerm({ classId: filters.classId, sessionId: filters.sessionId, termId: filters.termId, published: true, portal });
            Toast.success(`${result.count} student result(s) activated for the ${portal} portal.`);
            await loadReports();
          } catch (error) {
            Toast.error(error.message || `Unable to activate class results for the ${portal} portal. Resolve pending subjects first.`);
          } finally {
            updateBulkControl();
          }
        },
      });
    };
    activateClassTermStudentButton?.addEventListener('click', () => publishClassTerm('student'));
    activateClassTermParentButton?.addEventListener('click', () => publishClassTerm('parent'));
    tbody.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-report-id]');
      if (!button) return;
      const reportId = button.dataset.reportId;
      const portal = button.dataset.portal;
      const nextPublished = button.dataset.published !== 'true';
      ConfirmDialog.open({
        title: `${nextPublished ? 'Activate' : 'Deactivate'} result for ${portal}s`,
        message: nextPublished
          ? `Are you sure you want to publish this result to the ${portal} portal? The other portal's visibility will not change.`
          : `Are you sure you want to hide this result from the ${portal} portal? The other portal's visibility will not change.`,
        confirmLabel: nextPublished ? `Activate for ${portal}s` : `Deactivate for ${portal}s`,
        tone: nextPublished ? 'primary' : 'danger',
        onConfirm: async () => {
          try {
            await ReportCardsService.publish(reportId, nextPublished, portal);
            Toast.success(nextPublished ? `Result activated for the ${portal} portal.` : `Result deactivated for the ${portal} portal.`);
            await loadReports();
          } catch (error) {
            Toast.error(error.message || 'Unable to update publication status.');
          }
        },
      });
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
    if (['TEACHER', 'CLASS_TEACHER', 'SUBJECT_TEACHER', 'SENIOR_TEACHER'].includes(window.CurrentUser.role)) {
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
