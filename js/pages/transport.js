/**
 * Transport — vehicles, drivers, routes and student-route assignments.
 * Presented as tabs within a single page since each is a small, related
 * lookup list rather than a full standalone module.
 */
(function () {
  'use strict';

  let routeOptions = [], vehicleOptions = [], studentOptions = [];

  async function loadVehicles() {
    const tbody = document.getElementById('vehicles-tbody');
    Loader.tableLoading(tbody, 3, 'Loading vehicles…');
    try {
      const { items } = await TransportService.vehicles({ pageSize: 100 });
      vehicleOptions = items.map((v) => ({ value: v.id, label: v.plateNumber || v.name }));
      if (!items.length) return Loader.tableEmpty(tbody, 3, 'No vehicles registered.');
      tbody.innerHTML = items.map((v) => `
        <tr><td>${escapeHtml(v.plateNumber || v.name || '—')}</td><td>${escapeHtml(v.model || '—')}</td><td>${escapeHtml(String(v.capacity ?? '—'))}</td></tr>
      `).join('');
    } catch (err) { Loader.tableError(tbody, 3, err.message, loadVehicles); }
  }

  async function loadDrivers() {
    const tbody = document.getElementById('drivers-tbody');
    Loader.tableLoading(tbody, 3, 'Loading drivers…');
    try {
      const { items } = await TransportService.drivers({ pageSize: 100 });
      if (!items.length) return Loader.tableEmpty(tbody, 3, 'No drivers registered.');
      tbody.innerHTML = items.map((d) => `
        <tr><td>${escapeHtml(d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim())}</td><td>${escapeHtml(d.phone || '—')}</td><td>${escapeHtml(d.licenseNumber || '—')}</td></tr>
      `).join('');
    } catch (err) { Loader.tableError(tbody, 3, err.message, loadDrivers); }
  }

  async function loadRoutes() {
    const tbody = document.getElementById('routes-tbody');
    Loader.tableLoading(tbody, 3, 'Loading routes…');
    try {
      const { items } = await TransportService.routes({ pageSize: 100 });
      routeOptions = items.map((r) => ({ value: r.id, label: r.name }));
      if (!items.length) return Loader.tableEmpty(tbody, 3, 'No routes configured.');
      tbody.innerHTML = items.map((r) => `
        <tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.description || '—')}</td><td>${escapeHtml(String(r.studentCount ?? '—'))}</td></tr>
      `).join('');
    } catch (err) { Loader.tableError(tbody, 3, err.message, loadRoutes); }
  }

  async function loadAssignments() {
    const tbody = document.getElementById('assignments-tbody');
    Loader.tableLoading(tbody, 3, 'Loading assignments…');
    try {
      const { items } = await TransportService.assignments({ pageSize: 100 });
      if (!items.length) return Loader.tableEmpty(tbody, 3, 'No student route assignments yet.');
      tbody.innerHTML = items.map((a) => `
        <tr>
          <td>${escapeHtml(a.studentName || `${a.student?.firstName || ''} ${a.student?.lastName || ''}`.trim() || '—')}</td>
          <td>${escapeHtml(a.routeName || a.route?.name || '—')}</td>
          <td>${escapeHtml(a.vehiclePlateNumber || a.vehicle?.plateNumber || '—')}</td>
        </tr>
      `).join('');
    } catch (err) { Loader.tableError(tbody, 3, err.message, loadAssignments); }
  }

  function initTabs() {
    const tabs = qsa('.tab-btn');
    const panels = qsa('.tab-panel');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        panels.forEach((p) => p.hidden = true);
        tab.classList.add('active');
        document.getElementById(tab.dataset.tabTarget).hidden = false;
      });
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const canManage = Permissions.canAccessModule(window.CurrentUser.role, 'transport');

    initTabs();
    loadVehicles();
    loadDrivers();
    loadRoutes();
    loadAssignments();

    try {
      const { items } = await StudentsService.list({ pageSize: 200 });
      studentOptions = items.map((s) => ({ value: s.id, label: `${s.firstName || ''} ${s.lastName || ''} (${s.regNumber || 'no reg.'})`.trim() }));
    } catch (e) { /* non-fatal */ }

    function simpleAddModal(title, fields, onSubmit, onDone) {
      Modal.open({
        title,
        bodyHtml: `<form id="tp-form" novalidate>${fields.map((f) => SimpleCrudPage.renderField(f, null)).join('')}</form>`,
        footerHtml: `<button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
                     <button type="submit" form="tp-form" class="btn btn-primary" id="tp-save-btn">Save</button>`,
        onMount: (modalEl) => {
          modalEl.querySelector('[data-action="cancel"]').addEventListener('click', Modal.close);
          modalEl.querySelector('#tp-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const values = Object.fromEntries(new FormData(e.target).entries());
            const btn = document.getElementById('tp-save-btn');
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

    const addVehicleBtn = document.getElementById('add-vehicle-btn');
    if (addVehicleBtn) {
      addVehicleBtn.hidden = !canManage;
      addVehicleBtn.addEventListener('click', () => simpleAddModal('Add Vehicle', [
        { name: 'plateNumber', label: 'Plate Number', required: true },
        { name: 'model', label: 'Model' },
        { name: 'capacity', label: 'Seating Capacity', type: 'number' },
      ], (v) => ApiClient.post(ENOCH_ENDPOINTS.TRANSPORT.VEHICLES, v), loadVehicles));
    }

    const addRouteBtn = document.getElementById('add-route-btn');
    if (addRouteBtn) {
      addRouteBtn.hidden = !canManage;
      addRouteBtn.addEventListener('click', () => simpleAddModal('Add Route', [
        { name: 'name', label: 'Route Name', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
      ], (v) => TransportService.createRoute(v), loadRoutes));
    }

    const addAssignmentBtn = document.getElementById('add-transport-assignment-btn');
    if (addAssignmentBtn) {
      addAssignmentBtn.hidden = !canManage;
      addAssignmentBtn.addEventListener('click', () => simpleAddModal('Assign Student to Route', [
        { name: 'studentId', label: 'Student', type: 'select', required: true, options: studentOptions },
        { name: 'routeId', label: 'Route', type: 'select', required: true, options: routeOptions },
        { name: 'vehicleId', label: 'Vehicle', type: 'select', options: vehicleOptions },
      ], (v) => TransportService.createAssignment(v), loadAssignments));
    }
  });
})();
