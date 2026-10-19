/**
 * Promotions page — records of students promoted from one class to
 * another between academic sessions. Promotion records are immutable
 * history (create + view only — no edit/delete), consistent with how
 * most SIS/ERP systems treat academic history.
 */
(function () {
  'use strict';

  let table;

  function promotionFormHtml(classOptions, sessionOptions, studentOptions) {
    return `
      <form id="promotion-form" novalidate>
        <div class="form-group">
          <label class="form-label">Student <span class="required">*</span></label>
          <select name="studentId" required>
            <option value="">Select student…</option>
              ${studentOptions.map((o) => `<option value="${escapeHtml(o.value)}" data-current-class-id="${escapeHtml(o.classId || '')}">${escapeHtml(o.label)}</option>`).join('')}
          </select>
          <span class="form-error"></span>
        </div>
        <div class="form-row">
          <div class="form-group">
              <label class="form-label">From Class <span class="required">*</span></label>
              <select name="fromClassId" required>
              <option value="">Select…</option>
              ${classOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">To Class <span class="required">*</span></label>
              <select name="toClassId">
              <option value="">Select…</option>
              ${classOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('')}
            </select>
            <span class="form-error"></span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Academic Session <span class="required">*</span></label>
          <select name="sessionId" required>
            <option value="">Select…</option>
            ${sessionOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('')}
          </select>
          <span class="form-error"></span>
        </div>
        <div class="form-group">
          <label class="form-label">Promotion Status <span class="required">*</span></label>
          <select name="status" required>
            <option value="PROMOTED">Promoted</option>
            <option value="CONDITIONAL">Conditional</option>
            <option value="NOT_PROMOTED">Not promoted</option>
            <option value="GRADUATED">Graduated</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>
      </form>
    `;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const canManage = Permissions.canAccessModule(window.CurrentUser.role, 'academics');
    const addBtn = document.getElementById('add-promotion-btn');
    if (addBtn) addBtn.hidden = !canManage;

    let classOptions = [], sessionOptions = [], studentOptions = [];
    const [classesResult, sessionsResult, studentsResult] = await Promise.allSettled([
      ClassesService.list({ pageSize: 100 }),
      AcademicSessionsService.list({ pageSize: 50 }),
      StudentsService.listAll({ pageSize: 100, status: 'ACTIVE' }),
    ]);
    if (classesResult.status === 'fulfilled') {
      classOptions = classesResult.value.items.map((c) => ({ value: c.id, label: c.name }));
    }
    if (sessionsResult.status === 'fulfilled') {
      sessionOptions = sessionsResult.value.items.map((s) => ({ value: s.id, label: s.name }));
    }
    if (studentsResult.status === 'fulfilled') {
      studentOptions = studentsResult.value.items.map((s) => ({
        value: s.id,
        classId: s.currentClassId || s.classId || '',
        label: `${s.firstName || ''} ${s.lastName || ''} (${s.regNumber || 'no reg.'})`.trim(),
      }));
    }

    table = DataTable.create({
      tbody: document.getElementById('promotions-tbody'),
      paginationEl: document.getElementById('promotions-pagination'),
      columns: [
        { key: 'studentName', label: 'Student', render: (r) => escapeHtml(r.studentName || `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim() || '—') },
        { key: 'fromClass', label: 'From', render: (r) => escapeHtml(r.fromClassName || r.fromClass?.name || '—') },
        { key: 'toClass', label: 'To', render: (r) => escapeHtml(r.toClassName || r.toClass?.name || '—') },
        { key: 'sessionName', label: 'Academic Session', render: (r) => escapeHtml(r.academicSessionName || r.academicSession?.name || '—') },
        { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadgeClass(r.status || 'PROMOTED')}">${escapeHtml(titleCaseFromEnum(r.status || 'PROMOTED'))}</span>` },
        { key: 'date', label: 'Date', render: (r) => formatDate(r.createdAt || r.date) },
      ],
      fetchPage: (page) => PromotionsService.list({ page, pageSize: 20 }),
      emptyMessage: 'No promotion records found.',
      emptyActionHtml: canManage ? '<button type="button" class="btn btn-primary btn-sm" data-action="empty-add">Promote a Student</button>' : '',
    });
    table.load();

    function openPromoteModal() {
      Modal.open({
        title: 'Promote Student',
        description: 'Move a student from their current class into a new class for the given academic session.',
        bodyHtml: promotionFormHtml(classOptions, sessionOptions, studentOptions),
        footerHtml: `
          <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
          <button type="submit" form="promotion-form" class="btn btn-primary" id="promotion-save-btn">Promote Student</button>
        `,
        onMount: (modalEl) => {
          modalEl.querySelector('[data-action="cancel"]').addEventListener('click', Modal.close);
          const form = modalEl.querySelector('#promotion-form');
          const studentSelect = form.querySelector('[name="studentId"]');
          const fromClassSelect = form.querySelector('[name="fromClassId"]');
          const toClassSelect = form.querySelector('[name="toClassId"]');
          const statusSelect = form.querySelector('[name="status"]');
          const syncFromClass = () => {
            const selectedOption = studentSelect.selectedOptions[0];
            const studentClassId = selectedOption?.dataset.currentClassId || '';
            if (studentClassId && [...fromClassSelect.options].some((option) => option.value === studentClassId)) {
              fromClassSelect.value = studentClassId;
            } else {
              fromClassSelect.value = '';
            }
          };
          const syncTargetRequirement = () => {
            toClassSelect.required = !['NOT_PROMOTED', 'GRADUATED'].includes(statusSelect.value);
          };
          studentSelect.addEventListener('change', syncFromClass);
          statusSelect.addEventListener('change', syncTargetRequirement);
          syncTargetRequirement();
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const values = Object.fromEntries(new FormData(form).entries());
            const { valid, errors } = Validators.validateForm(values, {
              studentId: [(v) => Validators.required(v, 'Student')],
              fromClassId: [(v) => Validators.required(v, 'Source class')],
              sessionId: [(v) => Validators.required(v, 'Academic session')],
            });
            if (!['NOT_PROMOTED', 'GRADUATED'].includes(values.status) && !values.toClassId) {
              errors.toClassId = 'Select a destination class.';
            }
            form.querySelectorAll('.form-group').forEach((g) => g.classList.remove('has-error'));
            if (!valid || Object.keys(errors).length) {
              Object.entries(errors).forEach(([field, message]) => {
                const input = form.querySelector(`[name="${field}"]`);
                const group = input && input.closest('.form-group');
                if (group) {
                  group.classList.add('has-error');
                  const error = group.querySelector('.form-error');
                  if (error) error.textContent = message;
                }
              });
              return;
            }
            const btn = document.getElementById('promotion-save-btn');
            Loader.setButtonLoading(btn, true, 'Promoting…');
            try {
              await PromotionsService.create({
                studentId: values.studentId,
                fromClassId: values.fromClassId,
                toClassId: values.toClassId || null,
                sessionId: values.sessionId,
                status: values.status,
              });
              Toast.success('Student promoted successfully.');
              Modal.close();
              table.reload();
            } catch (err) {
              Toast.error(err.message || 'Unable to promote this student.');
            } finally {
              Loader.setButtonLoading(btn, false);
            }
          });
        },
      });
    }

    if (addBtn) addBtn.addEventListener('click', openPromoteModal);
    document.getElementById('promotions-tbody').addEventListener('click', (e) => {
      if (e.target.closest('[data-action="empty-add"]')) openPromoteModal();
    });
  });
})();
