/**
 * Sidebar component — builds role-aware navigation and handles
 * collapse/expand + active-link highlighting + mobile toggle.
 * Matches css/components/sidebar.css (.sidebar, .sidebar__*, .active,
 * .app-shell.sidebar-collapsed, .app-shell.mobile-nav-open, .sidebar-overlay).
 *
 * Expects <div id="app-sidebar"></div> placeholder in the page shell,
 * which this module replaces with the full <aside class="sidebar">.
 */
(function (global) {
  'use strict';

  const NAV = {
    admin: [
      { group: 'Overview', items: [{ label: 'Dashboard', href: 'dashboard.html', icon: 'grid' }] },
      {
        group: 'People',
        items: [
          { label: 'Users', href: 'users.html', icon: 'user-cog' },
          { label: 'Students', href: 'students.html', icon: 'graduation' },
          { label: 'Parents', href: 'parents.html', icon: 'users' },
          { label: 'Teachers', href: 'teachers.html', icon: 'chalkboard' },
        ],
      },
      {
        group: 'Academics',
        items: [
          { label: 'Academic Sessions', href: 'academic-sessions.html', icon: 'calendar' },
          { label: 'Terms', href: 'terms.html', icon: 'calendar-days' },
          { label: 'Classes', href: 'classes.html', icon: 'building' },
          { label: 'Subjects', href: 'subjects.html', icon: 'book' },
          { label: 'Departments', href: 'departments.html', icon: 'sitemap' },
          { label: 'Class Subjects', href: 'class-subjects.html', icon: 'link' },
          { label: 'Teacher Assignments', href: 'teacher-assignments.html', icon: 'clipboard' },
          { label: 'Enrollments', href: 'enrollments.html', icon: 'user-plus' },
          { label: 'Promotions', href: 'promotions.html', icon: 'arrow-up' },
        ],
      },
      {
        group: 'Teaching & Learning',
        items: [
          { label: 'Attendance', href: 'attendance.html', icon: 'check-square' },
          { label: 'Timetable', href: 'timetable.html', icon: 'clock' },
          { label: 'Lessons', href: 'lessons.html', icon: 'book-open' },
          { label: 'Assignments', href: 'assignments.html', icon: 'file-text' },
        ],
      },
      {
        group: 'Examinations',
        items: [
          { label: 'Examinations', href: 'examinations.html', icon: 'file-check' },
          { label: 'Question Bank', href: 'questions.html', icon: 'help-circle' },
          { label: 'Exam Attempts', href: 'exam-attempts.html', icon: 'edit' },
          { label: 'Results', href: 'results.html', icon: 'award' },
          { label: 'Transcripts', href: 'transcripts.html', icon: 'file' },
        ],
      },
      {
        group: 'Finance',
        items: [
          { label: 'Fees', href: 'fees.html', icon: 'tag' },
          { label: 'Fee Accounts', href: 'fee-accounts.html', icon: 'wallet' },
          { label: 'Invoices', href: 'invoices.html', icon: 'file-invoice' },
          { label: 'Payments', href: 'payments.html', icon: 'credit-card' },
          { label: 'Receipts', href: 'receipts.html', icon: 'receipt' },
          { label: 'Financial Reports', href: 'financial-reports.html', icon: 'bar-chart' },
        ],
      },
      {
        group: 'Facilities',
        items: [
          { label: 'Library', href: 'library.html', icon: 'library' },
          { label: 'Inventory', href: 'inventory.html', icon: 'box' },
          { label: 'Transport', href: 'transport.html', icon: 'bus' },
          { label: 'Hostel', href: 'hostel.html', icon: 'home' },
          { label: 'Medical', href: 'medical.html', icon: 'plus-square' },
          { label: 'Discipline', href: 'discipline.html', icon: 'alert-triangle' },
        ],
      },
      {
        group: 'Communication',
        items: [
          { label: 'Announcements', href: 'announcements.html', icon: 'megaphone' },
          { label: 'Notifications', href: 'notifications.html', icon: 'bell' },
          { label: 'Messages', href: 'messages.html', icon: 'mail' },
          { label: 'News', href: 'news.html', icon: 'newspaper' },
          { label: 'Events', href: 'events.html', icon: 'calendar-star' },
          { label: 'Gallery', href: 'gallery.html', icon: 'image' },
          { label: 'Documents', href: 'documents.html', icon: 'folder' },
        ],
      },
      {
        group: 'System',
        items: [
          { label: 'Reports', href: 'reports.html', icon: 'trending-up' },
          { label: 'Audit Logs', href: 'audit-logs.html', icon: 'shield' },
          { label: 'Settings', href: 'settings.html', icon: 'settings' },
        ],
      },
    ],
    management: [
      { group: 'Overview', items: [{ label: 'Dashboard', href: 'dashboard.html', icon: 'grid' }] },
      {
        group: 'School',
        items: [
          { label: 'Students', href: 'students.html', icon: 'graduation' },
          { label: 'Teachers', href: 'teachers.html', icon: 'chalkboard' },
          { label: 'Academics', href: 'academics.html', icon: 'book' },
        ],
      },
      {
        group: 'Performance',
        items: [
          { label: 'Results', href: 'results.html', icon: 'award' },
          { label: 'Finance', href: 'finance.html', icon: 'bar-chart' },
          { label: 'Reports', href: 'reports.html', icon: 'trending-up' },
        ],
      },
      {
        group: 'Communication',
        items: [
          { label: 'Announcements', href: 'announcements.html', icon: 'megaphone' },
          { label: 'News', href: 'news.html', icon: 'newspaper' },
        ],
      },
      { group: 'System', items: [{ label: 'Settings', href: 'settings.html', icon: 'settings' }] },
    ],
    teacher: [
      { group: 'Overview', items: [{ label: 'Dashboard', href: 'dashboard.html', icon: 'grid' }] },
      {
        group: 'My Teaching',
        items: [
          { label: 'My Classes', href: 'classes.html', icon: 'building' },
          { label: 'My Students', href: 'students.html', icon: 'graduation' },
          { label: 'My Subjects', href: 'subjects.html', icon: 'book' },
          { label: 'Timetable', href: 'timetable.html', icon: 'clock' },
          { label: 'Lessons', href: 'lessons.html', icon: 'book-open' },
        ],
      },
      {
        group: 'Assessment',
        items: [
          { label: 'Attendance', href: 'attendance.html', icon: 'check-square' },
          { label: 'Assignments', href: 'assignments.html', icon: 'file-text' },
          { label: 'Examinations', href: 'examinations.html', icon: 'file-check' },
          { label: 'Results', href: 'results.html', icon: 'award' },
        ],
      },
      { group: 'System', items: [{ label: 'Settings', href: 'settings.html', icon: 'settings' }] },
    ],
    student: [
      { group: 'Overview', items: [{ label: 'Dashboard', href: 'dashboard.html', icon: 'grid' }, { label: 'My Profile', href: 'profile.html', icon: 'user' }] },
      {
        group: 'Academics',
        items: [
          { label: 'Timetable', href: 'timetable.html', icon: 'clock' },
          { label: 'Assignments', href: 'assignments.html', icon: 'file-text' },
          { label: 'Examinations', href: 'examinations.html', icon: 'file-check' },
          { label: 'Results', href: 'results.html', icon: 'award' },
          { label: 'Transcript', href: 'transcript.html', icon: 'file' },
          { label: 'Attendance', href: 'attendance.html', icon: 'check-square' },
        ],
      },
      {
        group: 'More',
        items: [
          { label: 'Fees', href: 'fees.html', icon: 'wallet' },
          { label: 'Library', href: 'library.html', icon: 'library' },
          { label: 'Documents', href: 'documents.html', icon: 'folder' },
          { label: 'Notifications', href: 'notifications.html', icon: 'bell' },
        ],
      },
      { group: 'System', items: [{ label: 'Settings', href: 'settings.html', icon: 'settings' }] },
    ],
    parent: [
      { group: 'Overview', items: [{ label: 'Dashboard', href: 'dashboard.html', icon: 'grid' }, { label: 'My Children', href: 'children.html', icon: 'users' }] },
      {
        group: 'Academics',
        items: [
          { label: 'Results', href: 'results.html', icon: 'award' },
          { label: 'Attendance', href: 'attendance.html', icon: 'check-square' },
          { label: 'Timetable', href: 'timetable.html', icon: 'clock' },
          { label: 'Assignments', href: 'assignments.html', icon: 'file-text' },
        ],
      },
      {
        group: 'Finance',
        items: [
          { label: 'Fees', href: 'fees.html', icon: 'wallet' },
          { label: 'Payments', href: 'payments.html', icon: 'credit-card' },
        ],
      },
      {
        group: 'More',
        items: [
          { label: 'Documents', href: 'documents.html', icon: 'folder' },
          { label: 'Notifications', href: 'notifications.html', icon: 'bell' },
        ],
      },
      { group: 'System', items: [{ label: 'Settings', href: 'settings.html', icon: 'settings' }] },
    ],
  };

  function icon(name) {
    const common = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';
    const paths = {
      grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
      'user-cog': '<circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.3 3.1-6 7-6"/><circle cx="18" cy="17" r="2.5"/><path d="M18 13v1.2M18 19.8V21M22 17h-1.2M14.2 17H13"/>',
      graduation: '<path d="M22 10L12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>',
      users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.5 2.9-6.3 6.5-6.3s6.5 2.8 6.5 6.3"/><circle cx="17.5" cy="8.5" r="2.6"/><path d="M15 13.8c2.9.3 5 2.7 5 5.7"/>',
      chalkboard: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20l4-4 4 4"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
      'calendar-days': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 15h.01M12 15h.01M16 15h.01"/>',
      building: '<rect x="4" y="3" width="16" height="18"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/>',
      book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5v-16Z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/>',
      sitemap: '<rect x="9" y="3" width="6" height="4"/><rect x="3" y="17" width="6" height="4"/><rect x="15" y="17" width="6" height="4"/><path d="M12 7v5M6 17v-3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/>',
      link: '<path d="M9 15l6-6M8 12l-2 2a3.5 3.5 0 0 0 5 5l2-2M16 12l2-2a3.5 3.5 0 0 0-5-5l-2 2"/>',
      clipboard: '<rect x="6" y="4" width="12" height="17" rx="1.5"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 11h6M9 15h6"/>',
      'user-plus': '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.5 2.9-6.3 6.5-6.3s6.5 2.8 6.5 6.3"/><path d="M19 8v6M22 11h-6"/>',
      'arrow-up': '<path d="M12 19V5M6 11l6-6 6 6"/>',
      'check-square': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12l3 3 6-6"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
      'book-open': '<path d="M2 5.5S4.5 4 8 4s6 1.5 6 1.5v14S11.5 18 8 18s-6 1.5-6 1.5Z"/><path d="M22 5.5S19.5 4 16 4s-2 1.5-2 1.5v14s.5-1.5 2-1.5 6 1.5 6 1.5Z"/>',
      'file-text': '<path d="M6 2h9l5 5v15H6Z"/><path d="M15 2v5h5M9 13h6M9 17h6M9 9h2"/>',
      'file-check': '<path d="M6 2h9l5 5v15H6Z"/><path d="M15 2v5h5M9 14l2 2 4-4"/>',
      'help-circle': '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.8 1c0 1.7-2.3 1.9-2.3 3.5M12 17h.01"/>',
      edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
      award: '<circle cx="12" cy="8" r="6"/><path d="M9 13.5 7 22l5-3 5 3-2-8.5"/>',
      file: '<path d="M6 2h9l5 5v15H6Z"/><path d="M15 2v5h5"/>',
      tag: '<path d="M3 3h8l10 10-8 8L3 11Z"/><circle cx="8" cy="8" r="1.5"/>',
      wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/>',
      'file-invoice': '<path d="M6 2h9l5 5v15H6Z"/><path d="M15 2v5h5M9 12h6M9 16h4"/>',
      'credit-card': '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
      receipt: '<path d="M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2Z"/><path d="M8 8h8M8 12h8"/>',
      'bar-chart': '<path d="M4 20V10M12 20V4M20 20v-7"/>',
      library: '<path d="M4 4h4v17H4zM10 4h4v17h-4zM17 4l3 .6v16.4l-3-.6Z"/>',
      box: '<path d="M21 8l-9-5-9 5 9 5 9-5Z"/><path d="M3 8v9l9 5 9-5V8M12 13v9"/>',
      bus: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M3 12h18M7 20v-3M17 20v-3"/>',
      home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
      'plus-square': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>',
      'alert-triangle': '<path d="M12 3 2 20h20Z"/><path d="M12 10v4M12 17h.01"/>',
      megaphone: '<path d="M3 10v4l5 1 7 4V5l-7 4Z"/><path d="M15 9a3 3 0 0 1 0 6"/>',
      bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
      mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7"/>',
      newspaper: '<rect x="3" y="4" width="14" height="16" rx="1"/><path d="M7 8h6M7 12h6M7 16h4M21 8v9a2 2 0 0 1-2 2"/>',
      'calendar-star': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="m12 13 1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L9 15.3l2-.3Z"/>',
      image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
      folder: '<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/>',
      'trending-up': '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
      shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6Z"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1Z"/>',
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    };
    return `<svg ${common}>${paths[name] || paths.grid}</svg>`;
  }

  function currentFileName() {
    const parts = window.location.pathname.split('/');
    return parts[parts.length - 1] || 'dashboard.html';
  }

  function render(containerId, workspace, roleLabel) {
    const placeholder = document.getElementById(containerId);
    if (!placeholder) return;
    const groups = NAV[workspace] || NAV.student;
    const active = currentFileName();

    const groupsHtml = groups
      .map(
        (g) => `
        <div class="sidebar__group">
          <div class="sidebar__group-label">${escapeHtml(g.group)}</div>
          ${g.items
            .map(
              (item) => `
            <a class="sidebar__link ${item.href === active ? 'active' : ''}" href="${item.href}">
              ${icon(item.icon)}
              <span>${escapeHtml(item.label)}</span>
            </a>`
            )
            .join('')}
        </div>`
      )
      .join('');

    const aside = document.createElement('aside');
    aside.className = 'sidebar';
    aside.id = containerId;
    aside.innerHTML = `
      <div class="sidebar__brand">
        <span class="sidebar__mark">EIC</span>
        <span class="sidebar__name">Enoch International<small>College ERP</small></span>
      </div>
      <button type="button" class="sidebar__collapse-btn" id="sidebar-collapse-btn" aria-label="Collapse sidebar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>
      </button>
      <div class="sidebar__scroll">${groupsHtml}</div>
      <div class="sidebar__footer">
        <div class="role-pill" style="margin-bottom:10px;color:#D6D9DD;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;">${escapeHtml(roleLabel || '')}</div>
        <button type="button" class="sidebar__logout" data-action="logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>
          <span>Sign Out</span>
        </button>
      </div>
    `;
    placeholder.replaceWith(aside);

    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', () => document.querySelector('.app-shell')?.classList.remove('mobile-nav-open'));

    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    const appShell = document.querySelector('.app-shell');
    if (Storage.getSidebarCollapsed() && appShell) appShell.classList.add('sidebar-collapsed');
    if (collapseBtn && appShell) {
      collapseBtn.addEventListener('click', () => {
        appShell.classList.toggle('sidebar-collapsed');
        Storage.setSidebarCollapsed(appShell.classList.contains('sidebar-collapsed'));
      });
    }

    aside.addEventListener('click', (e) => {
      if (e.target.closest('.sidebar__link')) {
        document.querySelector('.app-shell')?.classList.remove('mobile-nav-open');
      }
    });
  }

  global.Sidebar = { render };
})(window);
