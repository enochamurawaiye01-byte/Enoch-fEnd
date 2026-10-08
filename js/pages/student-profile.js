/**
 * Student → My Profile. Tries the student record first (class, reg.
 * number, guardian info); falls back to the generic profile endpoint
 * if the backend does not expose a student-specific self-view.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const container = document.getElementById('profile-viewer');
    container.innerHTML = Loader.spinnerHtml('Loading your profile…');

    let student = null;
    try {
      student = await StudentsService.me();
    } catch (e) {
      try {
        student = await SettingsService.getProfile();
      } catch (e2) { /* leave null */ }
    }

    if (!student) {
      container.innerHTML = '<div class="table-state table-state--error"><p>Unable to load your profile right now.</p></div>';
      return;
    }

    const renderProfile = () => {
      const enrollment = (student.enrollments || []).find((item) => item.status === 'ACTIVE' && item.session?.isActive) || student.enrollments?.[0];
      const currentClass = enrollment?.class || student.currentClass;
      const department = enrollment?.department || student.desiredDepartment;
      const classArm = currentClass?.arm || currentClass?.classArm?.name || student.classArm?.name || student.classArmName;
      const classTeacher = student.currentClass?.classTeacher || currentClass?.classTeacher || currentClass?.teacher ||
        currentClass?.classTeacherAssignment?.staff?.user ||
        currentClass?.classTeacherAssignment?.teacher;
      const classTeacherName = typeof classTeacher === 'string'
        ? classTeacher
        : classTeacher?.fullName || [classTeacher?.firstName, classTeacher?.lastName].filter(Boolean).join(' ');
      container.innerHTML = `
        <section class="card">
          <div class="card__head">
            <div class="avatar-cell">
              <span class="avatar" style="width:64px;height:64px;font-size:1.1rem;overflow:hidden;">${student.profileImageUrl ? `<img src="${escapeHtml(student.profileImageUrl)}" alt="Student profile" style="width:100%;height:100%;object-fit:cover;">` : escapeHtml(initials(`${student.firstName || ''} ${student.lastName || ''}`))}</span>
              <div><div class="name">${escapeHtml(`${student.firstName || ''} ${student.lastName || ''}`)}</div><div class="sub">${escapeHtml(student.user?.email || student.email || '—')}</div><div><span class="badge ${statusBadgeClass(student.status)}">STUDENT · ${escapeHtml(titleCaseFromEnum(student.status))}</span></div></div>
            </div>
          </div>
          <div class="form-section-title">Academic Information</div>
          <div class="profile-grid">
            <div><span class="form-label">Registration number</span><p>${escapeHtml(student.registrationNumber || student.regNumber || '—')}</p></div>
            <div><span class="form-label">Current class</span><p>${escapeHtml(currentClass?.name || student.className || '—')}</p></div>
            ${department?.name ? `<div><span class="form-label">Department</span><p>${escapeHtml(department.name)}</p></div>` : ''}
            ${classArm ? `<div><span class="form-label">Section / arm</span><p>${escapeHtml(classArm)}</p></div>` : ''}
            ${classTeacherName ? `<div><span class="form-label">Class teacher</span><p>${escapeHtml(classTeacherName)}</p></div>` : ''}
            <div><span class="form-label">Academic session</span><p>${escapeHtml(enrollment?.session?.name || '—')}</p></div>
            <div><span class="form-label">Term</span><p>${escapeHtml(titleCaseFromEnum(enrollment?.term?.name || enrollment?.term?.type || '')) || '—'}</p></div>
            <div><span class="form-label">Admission status</span><p>${escapeHtml(titleCaseFromEnum(student.status || '')) || '—'}</p></div>
          </div>
          <div class="form-section-title">Personal Information</div>
          <div class="profile-grid">
            <div><span class="form-label">Phone</span><p>${escapeHtml(student.user?.phoneNumber || student.phone || '—')}</p></div>
            <div><span class="form-label">Date of birth</span><p>${student.dateOfBirth ? formatDate(student.dateOfBirth) : '—'}</p></div>
            <div><span class="form-label">Gender</span><p>${escapeHtml(titleCaseFromEnum(student.gender || '')) || '—'}</p></div>
            <div><span class="form-label">Address</span><p>${escapeHtml(student.address || '—')}</p></div>
          </div>
          <div class="form-group" style="margin-top:16px;">
            <label class="form-label" for="profile-picture">Profile picture</label>
            <input type="file" id="profile-picture" accept="image/jpeg,image/png,image/webp">
            <div class="row" style="gap:8px;margin-top:8px;">
              ${student.profileImageUrl ? '<button type="button" class="btn btn-secondary btn-sm" id="remove-profile-picture">Remove picture</button>' : ''}
              <span class="form-help" id="profile-picture-status" aria-live="polite"></span>
            </div>
          </div>
        </section>
      `;

      const pictureInput = document.getElementById('profile-picture');
      pictureInput?.addEventListener('change', async () => {
        if (!pictureInput.files[0]) return;
        const status = document.getElementById('profile-picture-status');
        status.textContent = 'Uploading…';
        pictureInput.disabled = true;
        try {
          await StudentsService.uploadProfilePicture(pictureInput.files[0]);
          student = await StudentsService.me();
          Toast.success('Profile picture updated.');
          renderProfile();
        } catch (error) {
          status.textContent = error.message || 'Unable to upload profile picture. Please try again.';
        } finally {
          pictureInput.disabled = false;
        }
      });
      document.getElementById('remove-profile-picture')?.addEventListener('click', async (event) => {
        const button = event.currentTarget;
        button.disabled = true;
        try {
          await StudentsService.removeProfilePicture();
          student = await StudentsService.me();
          Toast.success('Profile picture removed.');
          renderProfile();
        } catch (error) {
          Toast.error(error.message || 'Unable to remove profile picture.');
          button.disabled = false;
        }
      });
    };
    renderProfile();
  });
})();
