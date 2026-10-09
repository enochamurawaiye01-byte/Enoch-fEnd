/**
 * Top navigation bar — matches css/components/navbar.css
 */
(function (global) {
  'use strict';

  function render(containerId, { pageTitle, breadcrumb, user }) {
    const placeholder = document.getElementById(containerId);
    if (!placeholder) return;

    if (!document.querySelector('link[rel="manifest"]')) {
      const manifest = document.createElement('link');
      manifest.rel = 'manifest';
      manifest.href = `${rootPrefix()}manifest.webmanifest`;
      document.head.appendChild(manifest);
    }
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
      const appleWebApp = document.createElement('meta');
      appleWebApp.name = 'apple-mobile-web-app-capable';
      appleWebApp.content = 'yes';
      document.head.appendChild(appleWebApp);
    }
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      appleIcon.href = `${rootPrefix()}logo.png`;
      document.head.appendChild(appleIcon);
    }

    const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.username : 'User';
    const roleLabel = user ? titleCaseFromEnum(user.role) : '';
    const profileRoute = user?.role === 'STUDENT' ? 'pages/student/profile.html'
      : user?.role === 'TEACHER' ? 'pages/teacher/profile.html'
        : user?.role === 'PARENT' ? 'pages/parent/settings.html'
          : 'pages/admin/settings.html';
    const profileLabel = ['STUDENT', 'TEACHER'].includes(user?.role) ? 'My Profile' : 'Profile and Settings';

    const header = document.createElement('header');
    header.className = 'topbar';
    header.id = containerId;
    header.innerHTML = `
      <div class="topbar__left">
        <button type="button" class="topbar__menu-btn icon-link" id="mobile-menu-btn" aria-label="Open navigation menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
        <div class="topbar__crumbs">
          <div class="topbar__title-row">
            <h1 style="color:#13283E;">${escapeHtml(pageTitle || '')}</h1>
            <span class="topbar__active-role" aria-label="Current dashboard role">
              <span class="topbar__active-role-label">CURRENT ROLE</span>
              <strong>${escapeHtml(roleLabel || 'Unassigned')}</strong>
            </span>
          </div>
          <span class="topbar__breadcrumb" style="font-size:12px; color:#A33B45; font-weight:bold; font-style:italic;">Mercy T International College — Motto: "Knowledge is Light"</span>
        </div>
      </div>

      <div class="topbar__right">
        <div class="dropdown" data-dropdown style="position:relative;">
          <button type="button" class="topbar__icon-btn" data-dropdown-trigger aria-label="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>
            <span class="dot" id="notif-dot" hidden></span>
          </button>
          <div class="dropdown-panel notif-panel" data-dropdown-panel>
            <div class="notif-panel__head">
              <strong class="text-small" style="color:#13283E;">Notifications</strong>
              <button type="button" class="link-btn" id="mark-all-read-btn" style="background:none;border:none;color:#13283E;font-size:12px;font-weight:600;cursor:pointer;">Mark all read</button>
            </div>
            ${['ADMIN', 'SUPER_ADMIN'].includes(user?.role) ? `
            <div class="notif-panel__head" style="padding-top:0;">
              <button type="button" class="link-btn" id="toggle-notif-sound" aria-pressed="false"></button>
              <button type="button" class="link-btn" id="phone-alerts-btn">Enable phone alerts</button>
            </div>` : ''}
            <div id="notif-list"></div>
          </div>
        </div>

        <div class="dropdown" data-dropdown style="position:relative;">
          <div class="topbar__profile" data-dropdown-trigger>
            <span class="avatar" style="background:#13283E; color:#ffffff;">${escapeHtml(initials(displayName))}</span>
            <div class="topbar__profile-meta">
              <span class="name">${escapeHtml(displayName)}</span>
              <span class="role" style="color:#A33B45; font-weight:bold;">${escapeHtml(roleLabel)}</span>
            </div>
          </div>
          <div class="dropdown-panel" data-dropdown-panel>
            <a href="${rootPrefix()}${profileRoute}" class="dropdown-panel__item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="3"/></svg>
              ${escapeHtml(profileLabel)}
            </a>
            <div class="dropdown-panel__divider"></div>
            <a href="#" class="dropdown-panel__item danger" data-action="logout" style="color:#A33B45;">
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

    Dropdown.init(header);

    const dot = document.getElementById('notif-dot');
    NotificationPanel.startUnreadPolling(dot);
    const recentList = document.getElementById('notif-list');
    NotificationPanel.attachRecentActions(recentList, dot);
    window.addEventListener('notifications:changed', () => {
      NotificationPanel.loadUnreadCount(dot);
      if (document.getElementById('notif-list')) NotificationPanel.loadRecent(recentList);
    });

    const notifTrigger = header.querySelector('.notif-panel')?.closest('[data-dropdown]')?.querySelector('[data-dropdown-trigger]');
    if (notifTrigger) {
      notifTrigger.addEventListener('click', () => NotificationPanel.loadRecent(document.getElementById('notif-list')));
    }
    const soundButton = document.getElementById('toggle-notif-sound');
    if (soundButton) {
      const updateSoundButton = () => {
        const enabled = NotificationPanel.isSoundEnabled();
        soundButton.textContent = `Sound: ${enabled ? 'On' : 'Off'}`;
        soundButton.setAttribute('aria-pressed', String(enabled));
      };
      updateSoundButton();
      soundButton.addEventListener('click', () => {
        NotificationPanel.setSoundEnabled(!NotificationPanel.isSoundEnabled());
        updateSoundButton();
      });
    }
    const phoneAlertsButton = document.getElementById('phone-alerts-btn');
    if (phoneAlertsButton) {
      NotificationPanel.phoneAlertsEnabled().then((enabled) => {
        phoneAlertsButton.textContent = enabled ? 'Phone alerts enabled' : 'Enable phone alerts';
      }).catch((error) => console.warn('[Notifications] Unable to inspect phone-alert status:', error.message));
      phoneAlertsButton.addEventListener('click', async () => {
        phoneAlertsButton.disabled = true;
        try {
          const enabled = await NotificationPanel.phoneAlertsEnabled();
          if (enabled) {
            await NotificationPanel.disablePhoneAlerts();
            phoneAlertsButton.textContent = 'Enable phone alerts';
            Toast.success('Phone alerts disabled.');
          } else {
            await NotificationPanel.enablePhoneAlerts();
            NotificationPanel.setSoundEnabled(true);
            phoneAlertsButton.textContent = 'Phone alerts enabled';
            Toast.success('Phone alerts enabled on this device.');
          }
        } catch (error) {
          Toast.error(error.message || 'Unable to update phone alert settings.');
        } finally {
          phoneAlertsButton.disabled = false;
        }
      });
    }

    const markAllBtn = document.getElementById('mark-all-read-btn');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const ok = await NotificationPanel.markAllRead();
        if (ok) {
          await NotificationPanel.loadUnreadCount(dot);
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
