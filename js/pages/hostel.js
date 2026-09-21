(function () {
  'use strict';

  let hostelOptions = [], roomOptions = [], studentOptions = [];

  async function loadHostels() {
    const tbody = document.getElementById('hostels-tbody');
    Loader.tableLoading(tbody, 3, 'Loading hostels…');
    try {
      const { items } = await HostelService.hostels({ pageSize: 100 });
      hostelOptions = items.map((h) => ({ value: h.id, label: h.name }));
      if (!items.length) return Loader.tableEmpty(tbody, 3, 'No hostels registered.');
      tbody.innerHTML = items.map((h) => `
        <tr><td>${escapeHtml(h.name)}</td><td>${escapeHtml(titleCaseFromEnum(h.gender || ''))}</td><td>${escapeHtml(String(h.capacity ?? '—'))}</td></tr>
      `).join('');
    } catch (err) { Loader.tableError(tbody, 3, err.message, loadHostels); }
  }

  async function loadRooms() {
    const tbody = document.getElementById('rooms-tbody');
    Loader.tableLoading(tbody, 3, 'Loading rooms…');
    try {
      const { items } = await HostelService.rooms({ pageSize: 200 });
      roomOptions = items.map((r) => ({ value: r.id, label: `${r.hostelName || r.hostel?.name || ''} — ${r.roomNumber || r.name}`.trim() }));
      if (!items.length) return Loader.tableEmpty(tbody, 3, 'No rooms configured.');
      tbody.innerHTML = items.map((r) => `
        <tr><td>${escapeHtml(r.hostelName || r.hostel?.name || '—')}</td><td>${escapeHtml(r.roomNumber || r.name)}</td><td>${escapeHtml(String(r.bedCount ?? r.capacity ?? '—'))}</td></tr>
      `).join('');
    } catch (err) { Loader.tableError(tbody, 3, err.message, loadRooms); }
  }

  async function loadAllocations() {
    const tbody = document.getElementById('allocations-tbody');
    Loader.tableLoading(tbody, 3, 'Loading allocations…');
    try {
      const { items } = await HostelService.allocations({ pageSize: 200 });
      if (!items.length) return Loader.tableEmpty(tbody, 3, 'No students allocated to hostel rooms yet.');
      tbody.innerHTML = items.map((a) => `
        <tr>
          <td>${escapeHtml(a.studentName || `${a.student?.firstName || ''} ${a.student?.lastName || ''}`.trim() || '—')}</td>
          <td>${escapeHtml(a.hostelName || a.hostel?.name || '—')}</td>
          <td>${escapeHtml(a.roomNumber || a.room?.roomNumber || '—')}</td>
        </tr>
      `).join('');
    } catch (err) { Loader.tableError(tbody, 3, err.message, loadAllocations); }
  }

  function initTabs() {
    const tabs = qsa('.tab-btn');
    const panels = qsa('.tab-panel');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        panels.forEach((p) => (p.hidden = true));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tabTarget).hidden = false;
      });
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const canManage = Permissions.canAccessModule(window.CurrentUser.role, 'hostel');

    initTabs();
    loadHostels();
    loadRooms();
    loadAllocations();

    try {
      const { items } = await StudentsService.list({ pageSize: 200 });
      studentOptions = items.map((s) => ({ value: s.id, label: `${s.firstName || ''} ${s.lastName || ''} (${s.regNumber || 'no reg.'})`.trim() }));
    } catch (e) { /* non-fatal */ }

    function simpleAddModal(title, fields, onSubmit, onDone) {
      Modal.open({
        title,
        bodyHtml: `<form id="hs-form" novalidate>${fields.map((f) => SimpleCrudPage.renderField(f, null)).join('')}</form>`,
        footerHtml: `<button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
                     <button type="submit" form="hs-form" class="btn btn-primary" id="hs-save-btn">Save</button>`,
        onMount: (modalEl) => {
          modalEl.querySelector('[data-action="cancel"]').addEventListener('click', Modal.close);
          modalEl.querySelector('#hs-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const values = Object.fromEntries(new FormData(e.target).entries());
            const btn = document.getElementById('hs-save-btn');
            Loader.setButtonLoading(btn, true, 'Saving…');
            try {
              await onSubmit(values);
              Toast.success('Saved successfully.');
              Modal.close();
              onDone();
            } catch (err) {
              Toast.error(err.message || 'Unable to save.');
            } finally {
              Loader.setButtonLoading(btn, false);
            }
          });
        },
      });
    }

    const addHostelBtn = document.getElementById('add-hostel-btn');
    if (addHostelBtn) {
      addHostelBtn.hidden = !canManage;
      addHostelBtn.addEventListener('click', () => simpleAddModal('Add Hostel', [
        { name: 'name', label: 'Hostel Name', required: true },
        { name: 'gender', label: 'Gender', type: 'select', options: [{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }] },
        { name: 'capacity', label: 'Total Capacity', type: 'number' },
      ], (v) => HostelService.createHostel(v), loadHostels));
    }

    const addRoomBtn = document.getElementById('add-room-btn');
    if (addRoomBtn) {
      addRoomBtn.hidden = !canManage;
      addRoomBtn.addEventListener('click', () => simpleAddModal('Add Room', [
        { name: 'hostelId', label: 'Hostel', type: 'select', required: true, options: hostelOptions },
        { name: 'roomNumber', label: 'Room Number', required: true },
        { name: 'bedCount', label: 'Bed Count', type: 'number' },
      ], (v) => HostelService.createRoom(v), loadRooms));
    }

    const addAllocationBtn = document.getElementById('add-allocation-btn');
    if (addAllocationBtn) {
      addAllocationBtn.hidden = !canManage;
      addAllocationBtn.addEventListener('click', () => simpleAddModal('Allocate Student to Room', [
        { name: 'studentId', label: 'Student', type: 'select', required: true, options: studentOptions },
        { name: 'roomId', label: 'Room', type: 'select', required: true, options: roomOptions },
      ], (v) => HostelService.createAllocation(v), loadAllocations));
    }
  });
})();
