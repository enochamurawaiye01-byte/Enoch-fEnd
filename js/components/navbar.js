/**
 * Top navigation bar — matches css/components/navbar.css
 * (.topbar, .topbar__left/__right, .topbar__icon-btn .dot,
 *  .topbar__profile, .dropdown-panel, .notif-panel).
 * Expects <div id="app-navbar"></div> placeholder, which is replaced
 * with the full <header class="topbar">.
 */
(function (global) {
  'use strict';

  function render(containerId, { pageTitle, breadcrumb, user }) {
    const placeholder = document.getElementById(containerId);
    if (!placeholder) return;

    const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.username : 'User';
    const roleLabel = user ? titleCaseFromEnum(user.role) : '';

    const header = document.createElement('header');
    header.className = 'topbar';
    header.id = containerId;
    header.innerHTML = `
      <div class="topbar__left">
        <button type="button" class="topbar__menu-btn icon-link" id="mobile-menu-btn" aria-label="Open navigation menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
        <div class="topbar__crumbs">
          <h1>${escapeHtml(pageTitle || '')}</h1>
          ${breadcrumb ? `<span class="topbar__breadcrumb">${breadcrumb}</span>` : ''}
        </div>
      </div>

      <div class="topbar__right">
        <button type="button" class="topbar__icon-btn" id="theme-toggle-btn" aria-label="Toggle dark mode">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        </button>

        <div class="dropdown" data-dropdown style="position:relative;">
          <button type="button" class="topbar__icon-btn" data-dropdown-trigger aria-label="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>
            <span class="dot" id="notif-dot" hidden></span>
          </button>
          <div class="dropdown-panel notif-panel" data-dropdown-panel>
            <div class="notif-panel__head">
              <strong class="text-small">Notifications</strong>
              <button type="button" class="link-btn" id="mark-all-read-btn" style="background:none;border:none;color:var(--color-emerald-700);font-size:12px;font-weight:600;cursor:pointer;">Mark all read</button>
            </div>
            <div id="notif-list"></div>
          </div>
        </div>

        <div class="dropdown" data-dropdown style="position:relative;">
          <div class="topbar__profile" data-dropdown-trigger>
            <span class="avatar">${escapeHtml(initials(displayName))}</span>
            <div class="topbar__profile-meta">
              <span class="name">${escapeHtml(displayName)}</span>
              <span class="role">${escapeHtml(roleLabel)}</span>
            </div>
          </div>
          <div class="dropdown-panel" data-dropdown-panel>
            <a href="settings.html" class="dropdown-panel__item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="3"/></svg>
              Profile Settings
            </a>
            <div class="dropdown-panel__divider"></div>
            <a href="#" class="dropdown-panel__item danger" data-action="logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>
              Sign Out
            </a>
          </div>
        </div>
      </div>
    `;
    placeholder.replaceWith(header);

    const mobileBtn = document.getElementById('mobile-menu-btn');
    const appShell = document.querySelector('.app-shell');
    if (mobileBtn && appShell) {
      mobileBtn.addEventListener('click', () => appShell.classList.toggle('mobile-nav-open'));
    }

    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const isDark = document.documentElement.dataset.theme === 'dark';
        const next = isDark ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        Storage.setTheme(next);
      });
    }

    Dropdown.init(header);

    const dot = document.getElementById('notif-dot');
    NotificationPanel.loadUnreadCount(dot);

    const notifTrigger = header.querySelector('.notif-panel')?.closest('[data-dropdown]')?.querySelector('[data-dropdown-trigger]');
    if (notifTrigger) {
      notifTrigger.addEventListener('click', () => NotificationPanel.loadRecent(document.getElementById('notif-list')));
    }

    const markAllBtn = document.getElementById('mark-all-read-btn');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const ok = await NotificationPanel.markAllRead();
        if (ok) {
          if (dot) dot.hidden = true;
          NotificationPanel.loadRecent(document.getElementById('notif-list'));
        }
      });
    }

    header.querySelectorAll('[data-action="logout"]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        ConfirmDialog.open({
          title: 'Sign out',
          message: 'Are you sure you want to end your session?',
          confirmLabel: 'Sign Out',
          tone: 'danger',
          onConfirm: async () => {
            await AuthService.logout();
            window.location.href = `${rootPrefix()}login.html`;
          },
        });
      });
    });
  }

  global.Navbar = { render };
})(window);
