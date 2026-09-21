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

    container.innerHTML = `
      <div class="card">
        <div class="card__head">
          <div class="avatar-cell">
            <label for="profile-picture" class="avatar" style="width:48px;height:48px;font-size:1rem;cursor:pointer;overflow:hidden;">${student.profileImageUrl ? `<img src="${escapeHtml(student.profileImageUrl)}" alt="Profile picture" style="width:100%;height:100%;object-fit:cover;">` : escapeHtml(initials(`${student.firstName || ''} ${student.lastName || ''}`))}</label>
            <div>
              <div class="name" style="font-size:1.1rem;">${escapeHtml(`${student.firstName || ''} ${student.lastName || ''}`)}</div>
              <div class="sub">${escapeHtml(student.regNumber || '—')}</div>
            </div>
          </div>
        </div>
        <div class="profile-grid">
          <div style="grid-column:1/-1;"><label class="form-label" for="profile-picture">Profile picture</label><input type="file" id="profile-picture" accept="image/jpeg,image/png,image/webp"></div>
          <div><span class="form-label">Class</span><p>${escapeHtml(student.className || student.class?.name || '—')}</p></div>
          <div><span class="form-label">Class Arm</span><p>${escapeHtml(student.classArmName || student.classArm?.name || '—')}</p></div>
          <div><span class="form-label">Email</span><p>${escapeHtml(student.email || '—')}</p></div>
          <div><span class="form-label">Phone</span><p>${escapeHtml(student.phone || '—')}</p></div>
          <div><span class="form-label">Date of Birth</span><p>${student.dateOfBirth ? formatDate(student.dateOfBirth) : '—'}</p></div>
          <div><span class="form-label">Gender</span><p>${escapeHtml(titleCaseFromEnum(student.gender || '')) || '—'}</p></div>
          <div style="grid-column:1/-1;"><span class="form-label">Address</span><p>${escapeHtml(student.address || '—')}</p></div>
        </div>
      </div>
    `;

    const pictureInput = document.getElementById('profile-picture');
    pictureInput?.addEventListener('change', async () => {
      if (!pictureInput.files[0]) return;
      try {
        await StudentsService.uploadProfilePicture(pictureInput.files[0]);
        window.location.reload();
      } catch (error) {
        pictureInput.insertAdjacentHTML('afterend', `<span class="form-error" style="display:block;">${escapeHtml(error.message)}</span>`);
      }
    });
  });
})();
