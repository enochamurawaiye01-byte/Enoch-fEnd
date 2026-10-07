(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('teacher-profile-content');
    const teacherId = new URLSearchParams(window.location.search).get('id');
    const selfProfile = !teacherId && window.CurrentUser?.role === 'TEACHER';
    if (!teacherId && !selfProfile) {
      container.innerHTML = '<div class="table-state table-state--error">No teacher was selected.</div>';
      return;
    }

    container.innerHTML = Loader.spinnerHtml('Loading teacher profile…');
    let teacher;
    try {
      teacher = selfProfile ? await TeachersService.getCurrent() : await TeachersService.get(teacherId);
    } catch (error) {
      container.innerHTML = `<div class="table-state table-state--error">${escapeHtml(error.message || 'Unable to load this teacher profile.')}</div>`;
      return;
    }

    const currentUserId = window.CurrentUser?.userId || window.CurrentUser?.id;
    const isSelf = selfProfile || (window.CurrentUser?.role === 'TEACHER' && currentUserId === teacher.userId);

    const render = () => {
      const fullName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
      const subjectAssignments = teacher.teacherAssignments || [];
      const classAssignments = teacher.classTeacherAssignments || [];
      const assignedClassMap = new Map();
      [...subjectAssignments, ...classAssignments].forEach((assignment) => {
        const schoolClass = assignment.class;
        if (!schoolClass) return;
        const current = assignedClassMap.get(schoolClass.id) || { schoolClass, isClassTeacher: false };
        if (classAssignments.some((item) => item.classId === schoolClass.id)) current.isClassTeacher = true;
        assignedClassMap.set(schoolClass.id, current);
      });

      container.innerHTML = `
        <section class="card">
          <div class="card__head">
            <div class="avatar-cell">
              <span class="avatar" style="width:72px;height:72px;font-size:1.25rem;overflow:hidden;">${teacher.profileImageUrl ? `<img src="${escapeHtml(teacher.profileImageUrl)}" alt="Teacher profile" style="width:100%;height:100%;object-fit:cover;">` : escapeHtml(initials(fullName))}</span>
              <div>
                <h2 style="margin:0;">${escapeHtml(fullName || teacher.user?.fullName || 'Teacher')}</h2>
                <span class="badge badge-outline">${escapeHtml(titleCaseFromEnum(teacher.user?.role || 'TEACHER'))}</span>
              </div>
            </div>
          </div>
          <div class="profile-grid">
            <div><span class="form-label">Email</span><p>${escapeHtml(teacher.user?.email || '—')}</p></div>
            <div><span class="form-label">Phone</span><p>${escapeHtml(teacher.user?.phoneNumber || '—')}</p></div>
            <div><span class="form-label">Department</span><p>${escapeHtml(teacher.department?.name || '—')}</p></div>
            <div><span class="form-label">Staff number</span><p>${escapeHtml(teacher.staffNumber || '—')}</p></div>
            <div><span class="form-label">Status</span><p>${escapeHtml(titleCaseFromEnum(teacher.status || '')) || '—'}</p></div>
            <div><span class="form-label">Qualification</span><p>${escapeHtml(teacher.qualification || '—')}</p></div>
          </div>
          ${isSelf ? `<div class="form-group" style="margin-top:16px;"><label class="form-label" for="teacher-profile-picture">Profile picture</label><input id="teacher-profile-picture" type="file" accept="image/jpeg,image/png,image/webp"><div class="row" style="gap:8px;margin-top:8px;"><button type="button" id="remove-teacher-picture" class="btn btn-secondary btn-sm" ${teacher.profileImageUrl ? '' : 'hidden'}>Remove picture</button><span id="teacher-picture-status" class="form-help" aria-live="polite"></span></div></div>` : ''}
        </section>
        <section class="card">
          <div class="card__head"><h3>Assigned Classes</h3></div>
          ${assignedClassMap.size ? `<div class="table-scroll"><table class="data-table"><thead><tr><th>Class</th><th>Class teacher</th><th>Session</th></tr></thead><tbody>${[...assignedClassMap.values()].map(({ schoolClass, isClassTeacher }) => {
            const assignment = classAssignments.find((item) => item.classId === schoolClass.id) || subjectAssignments.find((item) => item.classId === schoolClass.id);
            return `<tr><td>${escapeHtml(schoolClass.name || '—')}</td><td>${isClassTeacher ? 'Yes' : 'No'}</td><td>${escapeHtml(assignment?.session?.name || 'All sessions')}</td></tr>`;
          }).join('')}</tbody></table></div>` : '<p class="table-state">No class assignments yet.</p>'}
        </section>
        <section class="card">
          <div class="card__head"><h3>Assigned Subjects</h3></div>
          ${subjectAssignments.length ? `<div class="table-scroll"><table class="data-table"><thead><tr><th>Subject</th><th>Class</th><th>Session</th><th>Term</th></tr></thead><tbody>${subjectAssignments.map((assignment) => `<tr><td>${escapeHtml(assignment.subject?.name || '—')}</td><td>${escapeHtml(assignment.class?.name || '—')}</td><td>${escapeHtml(assignment.session?.name || 'All sessions')}</td><td>${escapeHtml(assignment.term?.name || 'All terms')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="table-state">No subject assignments yet.</p>'}
        </section>
      `;

      if (!isSelf) return;
      const input = document.getElementById('teacher-profile-picture');
      const status = document.getElementById('teacher-picture-status');
      input?.addEventListener('change', async () => {
        if (!input.files[0]) return;
        input.disabled = true;
        status.textContent = 'Uploading…';
        try {
          await TeachersService.uploadProfilePicture(input.files[0]);
          teacher = await TeachersService.get(teacherId);
          Toast.success('Profile picture updated.');
          render();
        } catch (error) {
          status.textContent = error.message || 'Unable to upload profile picture. Please try again.';
        } finally {
          input.disabled = false;
        }
      });
      document.getElementById('remove-teacher-picture')?.addEventListener('click', async (event) => {
        event.currentTarget.disabled = true;
        try {
          await TeachersService.removeProfilePicture();
          teacher = await TeachersService.get(teacherId);
          Toast.success('Profile picture removed.');
          render();
        } catch (error) {
          Toast.error(error.message || 'Unable to remove profile picture.');
          event.currentTarget.disabled = false;
        }
      });
    };

    render();
  });
})();
