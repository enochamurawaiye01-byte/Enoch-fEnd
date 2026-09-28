(function () {
  'use strict';

  let modalOverlay = null;

  function createModalDOM() {
    if (document.getElementById('user-details-modal-overlay')) {
      return document.getElementById('user-details-modal-overlay');
    }

    const overlay = document.createElement('div');
    overlay.id = 'user-details-modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(4px);
      display: none; align-items: center; justify-content: center;
      z-index: 9999; padding: 16px;
    `;

    overlay.innerHTML = `
      <div class="modal-card" style="
        background: var(--surface-bg, #ffffff);
        color: var(--text-primary, #1e293b);
        border: 1px solid var(--surface-border, #e2e8f0);
        border-radius: 12px; width: 100%; max-width: 680px;
        max-height: 90vh; overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);
      ">
        <div style="padding: 16px 20px; border-bottom: 1px solid var(--surface-border, #e2e8f0); display: flex; align-items: center; justify-content: space-between; background: rgba(27, 42, 74, 0.04);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div id="udm-avatar-container" style="width: 52px; height: 52px; border-radius: 50%; background: #1b2a4a; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; border: 2px solid #c53030; overflow: hidden; flex-shrink: 0;">
              <span id="udm-initials">MTC</span>
              <img id="udm-photo" src="" alt="Passport" style="width: 100%; height: 100%; object-fit: cover; display: none;" />
            </div>
            <div>
              <h3 id="udm-name" style="margin: 0; font-size: 18px; font-weight: 700; color: var(--text-primary, #1b2a4a);">Applicant Profile</h3>
              <div style="display: flex; gap: 6px; margin-top: 4px;">
                <span id="udm-role-badge" class="badge badge-outline">Role</span>
                <span id="udm-status-badge" class="badge badge-warning">Status</span>
              </div>
            </div>
          </div>
          <button type="button" id="udm-close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #64748b; line-height: 1;">&times;</button>
        </div>

        <div style="padding: 20px; display: flex; flex-direction: column; gap: 16px;">
          <!-- Basic & Contact Information -->
          <div style="background: var(--card-bg, #f8fafc); border-radius: 8px; padding: 14px; border: 1px solid var(--surface-border, #e2e8f0);">
            <h4 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #1b2a4a; font-weight: bold;">Personal & Contact Details</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 13px;">
              <div><strong>Email:</strong> <span id="udm-email">-</span></div>
              <div><strong>Phone:</strong> <span id="udm-phone">-</span></div>
              <div><strong>Date of Birth:</strong> <span id="udm-dob">-</span></div>
              <div><strong>Gender:</strong> <span id="udm-gender">-</span></div>
              <div><strong>Address:</strong> <span id="udm-address">-</span></div>
              <div><strong>Nationality / State:</strong> <span id="udm-origin">-</span></div>
            </div>
          </div>

          <!-- Academic Class & Term Details -->
          <div style="background: rgba(27, 42, 74, 0.04); border-radius: 8px; padding: 14px; border: 1px solid rgba(27, 42, 74, 0.15);">
            <h4 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #1b2a4a; font-weight: bold;">Academic Class & Progress Details</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 13px;">
              <div><strong>Reg / Staff No:</strong> <span id="udm-reg-no" style="font-family: monospace; font-weight: bold; color: #c53030;">-</span></div>
              <div><strong>Current Class:</strong> <span id="udm-current-class" class="badge badge-primary">-</span></div>
              <div><strong>Current Term:</strong> <span id="udm-current-term">-</span></div>
              <div><strong>Target Class (Going To):</strong> <span id="udm-target-class" class="badge badge-info">-</span></div>
              <div><strong>Target Term (Going To):</strong> <span id="udm-target-term">-</span></div>
            </div>
          </div>

          <!-- Medical & Emergency Profile -->
          <div style="background: rgba(197, 48, 48, 0.04); border-radius: 8px; padding: 14px; border: 1px solid rgba(197, 48, 48, 0.2);">
            <h4 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #c53030; font-weight: bold;">Medical Record & Emergency Details</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 13px;">
              <div><strong>Blood Group:</strong> <span id="udm-blood-group" style="font-weight: bold; color: #c53030;">-</span></div>
              <div><strong>Genotype:</strong> <span id="udm-genotype" style="font-weight: bold;">-</span></div>
              <div><strong>Known Allergies:</strong> <span id="udm-allergies" style="color: #b91c1c;">-</span></div>
              <div><strong>Emergency Contact:</strong> <span id="udm-emergency">-</span></div>
            </div>
            <div style="margin-top: 8px; font-size: 13px;">
              <strong>Medical Notes:</strong>
              <p id="udm-medical-notes" style="margin: 4px 0 0 0; color: #64748b; font-style: italic;">None provided.</p>
            </div>
          </div>

          <!-- Parent / Guardian Information -->
          <div id="udm-parent-section" style="background: var(--card-bg, #f8fafc); border-radius: 8px; padding: 14px; border: 1px solid var(--surface-border, #e2e8f0);">
            <h4 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #1b2a4a; font-weight: bold;">Parent / Guardian Information</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 13px;">
              <div><strong>Parent Name:</strong> <span id="udm-parent-name">-</span></div>
              <div><strong>Parent Phone:</strong> <span id="udm-parent-phone">-</span></div>
              <div><strong>Parent Email:</strong> <span id="udm-parent-email">-</span></div>
              <div><strong>Relationship:</strong> <span id="udm-parent-rel">-</span></div>
            </div>
          </div>
        </div>

        <div style="padding: 14px 20px; border-top: 1px solid var(--surface-border, #e2e8f0); display: flex; align-items: center; justify-content: flex-end; gap: 10px; background: rgba(27, 42, 74, 0.02);">
          <button type="button" class="btn btn-secondary btn-sm" id="udm-close-footer-btn">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeHandler = () => { overlay.style.display = 'none'; };
    overlay.querySelector('#udm-close-btn').addEventListener('click', closeHandler);
    overlay.querySelector('#udm-close-footer-btn').addEventListener('click', closeHandler);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeHandler(); });

    return overlay;
  }

  window.UserDetailsModal = {
    open: function (data) {
      const modal = createModalDOM();
      
      const fullName = data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unnamed Applicant';
      document.getElementById('udm-name').textContent = fullName;
      document.getElementById('udm-initials').textContent = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MTC';

      const photoImg = document.getElementById('udm-photo');
      const initialsSpan = document.getElementById('udm-initials');
      if (data.profileImageUrl) {
        photoImg.src = data.profileImageUrl;
        photoImg.style.display = 'block';
        initialsSpan.style.display = 'none';
      } else {
        photoImg.style.display = 'none';
        initialsSpan.style.display = 'block';
      }

      document.getElementById('udm-role-badge').textContent = (data.role || data.desiredClass?.name || 'STUDENT').replace('_', ' ');
      
      const status = (data.status || 'PENDING').toUpperCase();
      const statusBadge = document.getElementById('udm-status-badge');
      statusBadge.textContent = status;
      statusBadge.className = `badge ${status === 'ACTIVE' || status === 'APPROVED' ? 'badge-success' : status === 'REJECTED' || status === 'DEACTIVATED' ? 'badge-danger' : 'badge-warning'}`;

      document.getElementById('udm-email').textContent = data.email || '-';
      document.getElementById('udm-phone').textContent = data.phoneNumber || data.parentPhone || '-';
      document.getElementById('udm-dob').textContent = data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : '-';
      document.getElementById('udm-gender').textContent = data.gender || '-';
      document.getElementById('udm-address').textContent = data.address || '-';
      document.getElementById('udm-origin').textContent = [data.nationality, data.stateOfOrigin].filter(Boolean).join(' / ') || '-';

      document.getElementById('udm-reg-no').textContent = data.registrationNumber || data.staffNumber || data.applicationNumber || 'Pending Assignment';
      document.getElementById('udm-current-class').textContent = data.currentClass || data.student?.currentClass?.name || 'N/A';
      document.getElementById('udm-current-term').textContent = data.currentTerm || 'N/A';
      document.getElementById('udm-target-class').textContent = data.targetClass || data.desiredClass?.name || 'N/A';
      document.getElementById('udm-target-term').textContent = data.targetTerm || 'N/A';

      document.getElementById('udm-blood-group').textContent = data.bloodGroup || 'Not specified';
      document.getElementById('udm-genotype').textContent = data.genotype || 'Not specified';
      document.getElementById('udm-allergies').textContent = data.allergies || 'None reported';
      document.getElementById('udm-emergency').textContent = data.emergencyContact || '-';
      document.getElementById('udm-medical-notes').textContent = data.medicalNotes || 'No special medical instructions provided.';

      document.getElementById('udm-parent-name').textContent = data.parentName || (data.parentLinks?.[0]?.parent?.user?.fullName) || '-';
      document.getElementById('udm-parent-phone').textContent = data.parentPhone || '-';
      document.getElementById('udm-parent-email').textContent = data.parentEmail || '-';
      document.getElementById('udm-parent-rel').textContent = data.parentRelationship || '-';

      modal.style.display = 'flex';
    }
  };
})();
