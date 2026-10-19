(function () {
  'use strict';

  const state = {
    positions: [],
    assignments: [],
    students: [],
    sessions: [],
    classes: [],
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (match) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[match]));
  }

  function renderRows() {
    const tbody = document.getElementById('prefects-table-body');
    if (!tbody) return;

    if (!state.assignments.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="muted-text">No active prefect assignments found.</td></tr>';
      return;
    }

    tbody.innerHTML = state.assignments.map((assignment) => {
      const position = assignment.position || {};
      const student = assignment.student || {};
      const classInfo = assignment.class || {};
      const session = assignment.session || {};
      const studentName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ') || 'Unknown student';
      const className = classInfo.name || classInfo.classLevel?.name || '—';
      const sessionLabel = session.name || [session.startYear, session.endYear].filter(Boolean).join('-') || '—';
      const status = assignment.status || 'ACTIVE';
      const assignedBy = assignment.assigner?.fullName || 'System';

      return `
        <tr>
          <td>${escapeHtml(studentName)}</td>
          <td>${escapeHtml(position.name || '—')}</td>
          <td>${escapeHtml(className)}</td>
          <td>${escapeHtml(sessionLabel)}</td>
          <td><span class="badge badge-${status === 'ACTIVE' ? 'success' : 'secondary'}">${escapeHtml(status)}</span></td>
          <td>${escapeHtml(assignedBy)}</td>
        </tr>
      `;
    }).join('');
  }

  function renderCounts() {
    document.getElementById('positions-count').textContent = String(state.positions.length);
    const actives = state.assignments.filter((item) => item.status === 'ACTIVE').length;
    document.getElementById('assignments-count').textContent = String(actives);
  }

  async function loadData() {
    const [positions, assignments, sessions, classes, students] = await Promise.all([
      PrefectsService.listPositions().catch(() => []),
      PrefectsService.list({ pageSize: 200 }).catch(() => ({ items: [] })),
      AcademicSessionsService.list({ pageSize: 200 }).catch(() => ({ items: [] })),
      ClassesService.list({ pageSize: 200 }).catch(() => ({ items: [] })),
      StudentsService.list({ pageSize: 500 }).catch(() => ({ items: [] })),
    ]);

    state.positions = Array.isArray(positions) ? positions : [];
    state.assignments = Array.isArray(assignments.items) ? assignments.items : [];
    state.sessions = Array.isArray(sessions.items) ? sessions.items : [];
    state.classes = Array.isArray(classes.items) ? classes.items : [];
    state.students = Array.isArray(students.items) ? students.items : [];

    renderCounts();
    renderRows();
  }

  function studentOptionsHtml(selectedId = '') {
    if (!state.students.length) {
      return '<option value="">No students available</option>';
    }
    return state.students.map((student) => {
      const name = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ');
      const label = student.registrationNumber ? `${name} (${student.registrationNumber})` : name;
      return `<option value="${escapeHtml(student.id)}" ${selectedId === student.id ? 'selected' : ''}>${escapeHtml(label)}</option>`;
    }).join('');
  }

  function positionOptionsHtml(selectedId = '') {
    if (!state.positions.length) {
      return '<option value="">No positions available</option>';
    }
    return state.positions.map((position) => `<option value="${escapeHtml(position.id)}" ${selectedId === position.id ? 'selected' : ''}>${escapeHtml(position.name)}</option>`).join('');
  }

  function sessionOptionsHtml(selectedId = '') {
    if (!state.sessions.length) {
      return '<option value="">No sessions available</option>';
    }
    return state.sessions.map((session) => `<option value="${escapeHtml(session.id)}" ${selectedId === session.id ? 'selected' : ''}>${escapeHtml(session.name || `${session.startYear || ''}-${session.endYear || ''}`)}</option>`).join('');
  }

  function classOptionsHtml(selectedId = '') {
    if (!state.classes.length) {
      return '<option value="">No classes available</option>';
    }
    return state.classes.map((schoolClass) => `<option value="${escapeHtml(schoolClass.id)}" ${selectedId === schoolClass.id ? 'selected' : ''}>${escapeHtml(schoolClass.name || schoolClass.className || `${schoolClass.level || ''} ${schoolClass.arm || ''}`)}</option>`).join('');
  }

  function openPositionModal() {
    Modal.open({
      title: 'Add prefect position',
      description: 'Create a new school or class leadership position.',
      size: 'md',
      bodyHtml: `
        <form id="prefect-position-form" novalidate>
          <div class="form-group">
            <label class="form-label">Position name</label>
            <input type="text" name="name" required />
          </div>
          <div class="form-group">
            <label class="form-label">Scope</label>
            <select name="scope">
              <option value="SCHOOL">School-wide</option>
              <option value="CLASS">Class-level</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Eligibility</label>
            <input type="text" name="eligibility" placeholder="e.g. JSS, SSS" />
          </div>
        </form>
      `,
      footerHtml: `
        <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
        <button type="submit" form="prefect-position-form" class="btn btn-primary">Save position</button>
      `,
      onMount: () => {
        const form = document.getElementById('prefect-position-form');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          const formData = new FormData(form);
          const payload = {
            name: String(formData.get('name') || '').trim(),
            scope: String(formData.get('scope') || 'SCHOOL'),
            eligibility: String(formData.get('eligibility') || '').trim(),
            isActive: true,
          };

          if (!payload.name) {
            Toast.error('Position name is required.');
            return;
          }

          try {
            await PrefectsService.createPosition(payload);
            Modal.close();
            Toast.success('Prefect position created.');
            await loadData();
          } catch (error) {
            Toast.error(error.message || 'Unable to create the prefect position.');
          }
        });
        document.querySelector('[data-action="cancel"]').addEventListener('click', Modal.close);
      },
    });
  }

  function openAssignmentModal() {
    Modal.open({
      title: 'Assign prefect',
      description: 'Assign a student to a leadership position for the selected session.',
      size: 'md',
      bodyHtml: `
        <form id="prefect-assignment-form" novalidate>
          <div class="form-group">
            <label class="form-label">Student</label>
            <select name="studentId" required>
              ${studentOptionsHtml()}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Position</label>
            <select name="positionId" required>
              ${positionOptionsHtml()}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Session</label>
            <select name="sessionId" required>
              ${sessionOptionsHtml()}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Class (for class-level positions)</label>
            <select name="classId">
              <option value="">School-wide / no class</option>
              ${classOptionsHtml()}
            </select>
          </div>
        </form>
      `,
      footerHtml: `
        <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
        <button type="submit" form="prefect-assignment-form" class="btn btn-primary">Save assignment</button>
      `,
      onMount: () => {
        const form = document.getElementById('prefect-assignment-form');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          const formData = new FormData(form);
          const payload = {
            studentId: String(formData.get('studentId') || '').trim(),
            positionId: String(formData.get('positionId') || '').trim(),
            sessionId: String(formData.get('sessionId') || '').trim(),
            classId: String(formData.get('classId') || '').trim() || null,
          };

          if (!payload.studentId || !payload.positionId || !payload.sessionId) {
            Toast.error('Student, position, and session are required.');
            return;
          }

          try {
            await PrefectsService.create(payload);
            Modal.close();
            Toast.success('Prefect assignment saved.');
            await loadData();
          } catch (error) {
            Toast.error(error.message || 'Unable to assign this prefect.');
          }
        });
        document.querySelector('[data-action="cancel"]').addEventListener('click', Modal.close);
      },
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (window.authGuardReady) await window.authGuardReady;

    const addPositionBtn = document.getElementById('add-position-btn');
    const assignPrefectBtn = document.getElementById('assign-prefect-btn');

    if (addPositionBtn) addPositionBtn.addEventListener('click', openPositionModal);
    if (assignPrefectBtn) assignPrefectBtn.addEventListener('click', openAssignmentModal);

    await loadData();
  });
})();
