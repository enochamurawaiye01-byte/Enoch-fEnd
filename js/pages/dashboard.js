/**
 * Dashboard controller. Renders role-appropriate stat cards, a recent
 * activity feed, and quick links — all sourced from the real dashboard
 * API endpoint for the current workspace. Metrics the backend does not
 * return are simply omitted (never fabricated), per project requirements.
 */
(function () {
  'use strict';

  const { DASHBOARD } = ENOCH_ENDPOINTS;

  // Maps a workspace to its dashboard endpoint and the stat cards it
  // *may* show, keyed by the field name we look for in the API response.
  // label / icon / accent are display only; the card is skipped entirely
  // if the field is absent from the response so we never invent a number.
  const WORKSPACE_CONFIG = {
    admin: {
      endpoint: DASHBOARD.ADMIN,
      stats: [
        { key: 'totalStudents', label: 'Total Students' },
        { key: 'totalTeachers', label: 'Total Teachers' },
        { key: 'totalParents', label: 'Total Parents' },
        { key: 'totalClasses', label: 'Classes' },
        { key: 'activeSession', label: 'Active Session', isText: true },
        { key: 'currentTerm', label: 'Current Term', isText: true },
        { key: 'totalRevenue', label: 'Revenue (Term)', isCurrency: true, accent: true },
        { key: 'outstandingFees', label: 'Outstanding Fees', isCurrency: true, accent: true },
        { key: 'attendanceRate', label: "Today's Attendance", isPercent: true },
        { key: 'pendingExaminations', label: 'Pending Examinations' },
      ],
      quickLinks: [
        { label: 'Add Student', href: 'students.html', icon: 'M12 5v14M5 12h14' },
        { label: 'Record Payment', href: 'payments.html', icon: 'M2 10h20M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z' },
        { label: 'Mark Attendance', href: 'attendance.html', icon: 'M9 12l2 2 4-4M4 4h16v16H4z' },
        { label: 'New Announcement', href: 'announcements.html', icon: 'M3 10v4l5 1 7 4V5l-7 4Z' },
      ],
    },
    management: {
      endpoint: DASHBOARD.MANAGEMENT,
      stats: [
        { key: 'totalStudents', label: 'Total Students' },
        { key: 'totalTeachers', label: 'Total Teachers' },
        { key: 'averageAttendance', label: 'Average Attendance', isPercent: true },
        { key: 'averagePerformance', label: 'Average Performance', isPercent: true },
        { key: 'totalRevenue', label: 'Revenue (Term)', isCurrency: true, accent: true },
        { key: 'outstandingFees', label: 'Outstanding Fees', isCurrency: true, accent: true },
      ],
      quickLinks: [
        { label: 'View Results', href: 'results.html', icon: 'M12 8l-6 4 6 4 6-4Z' },
        { label: 'Finance Overview', href: 'finance.html', icon: 'M4 20V10M12 20V4M20 20v-7' },
        { label: 'School Reports', href: 'reports.html', icon: 'm3 17 6-6 4 4 8-8' },
      ],
    },
    teacher: {
      endpoint: DASHBOARD.TEACHER,
      stats: [
        { key: 'assignedClasses', label: 'My Classes' },
        { key: 'assignedSubjects', label: 'My Subjects' },
        { key: 'totalStudents', label: 'My Students' },
        { key: 'pendingAssignments', label: 'Pending Assignments' },
        { key: 'upcomingExaminations', label: 'Upcoming Examinations' },
      ],
      quickLinks: [
        { label: 'Mark Attendance', href: 'attendance.html', icon: 'M9 12l2 2 4-4M4 4h16v16H4z' },
        { label: 'New Assignment', href: 'assignments.html', icon: 'M12 5v14M5 12h14' },
        { label: 'Enter Results', href: 'results.html', icon: 'M12 8l-6 4 6 4 6-4Z' },
      ],
    },
    student: {
      endpoint: DASHBOARD.STUDENT,
      stats: [
        { key: 'attendanceRate', label: 'My Attendance', isPercent: true },
        { key: 'pendingAssignments', label: 'Pending Assignments' },
        { key: 'upcomingExaminations', label: 'Upcoming Examinations' },
        { key: 'outstandingFees', label: 'Outstanding Fees', isCurrency: true, accent: true },
      ],
      quickLinks: [
        { label: 'View Results', href: 'results.html', icon: 'M12 8l-6 4 6 4 6-4Z' },
        { label: 'Timetable', href: 'timetable.html', icon: 'M12 7v5l3.5 2' },
        { label: 'Pay Fees', href: 'fees.html', icon: 'M3 10h18M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z' },
      ],
    },
    parent: {
      endpoint: DASHBOARD.PARENT,
      stats: [
        { key: 'totalChildren', label: 'My Children' },
        { key: 'outstandingFees', label: 'Outstanding Fees', isCurrency: true, accent: true },
        { key: 'averageAttendance', label: 'Average Attendance', isPercent: true },
      ],
      quickLinks: [
        { label: 'My Children', href: 'children.html', icon: 'M2.5 20c0-3.5 2.9-6.3 6.5-6.3s6.5 2.8 6.5 6.3' },
        { label: 'Pay Fees', href: 'fees.html', icon: 'M3 10h18M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z' },
        { label: 'View Results', href: 'results.html', icon: 'M12 8l-6 4 6 4 6-4Z' },
      ],
    },
  };

  function renderStatCard({ key, label, isCurrency, isPercent, isText, accent }, value) {
    let display = value;
    if (isCurrency) display = formatCurrency(value);
    else if (isPercent) display = `${Number(value).toFixed(1)}%`;
    else if (!isText) display = Number(value).toLocaleString('en-NG');

    return `
      <div class="stat-card ${accent ? 'stat-card--accent' : ''}">
        <div class="stat-card__label">${escapeHtml(label)}</div>
        <div class="stat-card__value">${escapeHtml(String(display))}</div>
      </div>
    `;
  }

  function renderQuickLinks(links) {
    return `
      <div class="quick-links">
        ${links
          .map(
            (l) => `
          <a class="quick-link" href="${l.href}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="${l.icon}"/></svg>
            <span>${escapeHtml(l.label)}</span>
          </a>`
          )
          .join('')}
      </div>
    `;
  }

  async function loadRecentActivity(container) {
    if (!container) return;
    container.innerHTML = Loader.spinnerHtml('Loading recent activity…');
    try {
      const payload = await ApiClient.get(ENOCH_ENDPOINTS.ANNOUNCEMENTS.BASE, { limit: 5 });
      const { items } = ApiClient.unwrapList(payload);
      if (!items.length) {
        container.innerHTML = '<div class="table-state"><p>No recent activity to show.</p></div>';
        return;
      }
      container.innerHTML = items
        .map(
          (a) => `
        <div class="list-row">
          <div>
            <div class="list-row__title">${escapeHtml(a.title || 'Announcement')}</div>
            <div class="list-row__sub">${timeAgo(a.createdAt || a.publishedAt)}</div>
          </div>
        </div>`
        )
        .join('');
    } catch (err) {
      container.innerHTML = `<div class="table-state table-state--error"><p>${escapeHtml(err.message)}</p></div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const statGrid = document.getElementById('dashboard-stats');
    const quickLinksEl = document.getElementById('dashboard-quick-links');
    const activityEl = document.getElementById('dashboard-activity');
    if (!statGrid) return;

    const workspace = document.body.dataset.workspace || 'admin';
    const config = WORKSPACE_CONFIG[workspace] || WORKSPACE_CONFIG.admin;

    if (quickLinksEl) quickLinksEl.innerHTML = renderQuickLinks(config.quickLinks);
    loadRecentActivity(activityEl);

    statGrid.innerHTML = Loader.spinnerHtml('Loading dashboard…');
    try {
      const payload = await ApiClient.get(config.endpoint);
      const data = ApiClient.unwrapItem(payload) || {};

      const cardsHtml = config.stats
        .filter((s) => data[s.key] !== undefined && data[s.key] !== null)
        .map((s) => renderStatCard(s, data[s.key]))
        .join('');

      statGrid.innerHTML = cardsHtml || '<div class="table-state"><p>No dashboard metrics are available yet.</p></div>';
    } catch (err) {
      statGrid.innerHTML = `
        <div class="table-state table-state--error" style="grid-column:1/-1;">
          <p>${escapeHtml(err.message || 'Unable to load dashboard data.')}</p>
          <button type="button" class="btn btn-secondary btn-sm" id="dashboard-retry">Retry</button>
        </div>
      `;
      document.getElementById('dashboard-retry')?.addEventListener('click', () => window.location.reload());
    }
  });
})();
