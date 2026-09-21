/**
 * Notification panel — matches .notif-panel/.notif-panel__head/.notif-item
 * in navbar.css, and the .dot unread indicator on .topbar__icon-btn.
 */
(function (global) {
  'use strict';

  const { NOTIFICATIONS } = ENOCH_ENDPOINTS;

  async function loadUnreadCount(dotEl) {
    if (!dotEl) return;
    try {
      const payload = await ApiClient.get(NOTIFICATIONS.UNREAD_COUNT);
      const data = ApiClient.unwrapItem(payload) || {};
      const count = Number(data.count ?? data.unread ?? 0) || 0;
      dotEl.hidden = count <= 0;
    } catch (e) {
      dotEl.hidden = true;
    }
  }

  async function loadRecent(listEl) {
    if (!listEl) return;
    listEl.innerHTML = Loader.spinnerHtml('Loading notifications…');
    try {
      const payload = await ApiClient.get(NOTIFICATIONS.BASE, { limit: 6 });
      const { items } = ApiClient.unwrapList(payload);
      if (!items.length) {
        listEl.innerHTML = '<div class="table-state"><p>You have no notifications.</p></div>';
        return;
      }
      const workspace = (window.CurrentUser && Permissions.getWorkspaceForRole(window.CurrentUser.role)) || 'admin';
      listEl.innerHTML = items
        .map(
          (n) => `
          <a class="notif-item ${n.readAt || n.isRead ? '' : 'unread'}" href="${rootPrefix()}pages/${workspace}/notifications.html">
            <div class="title">${escapeHtml(n.title || n.message || 'Notification')}</div>
            <div class="meta">${timeAgo(n.createdAt)}</div>
          </a>`
        )
        .join('');
    } catch (e) {
      listEl.innerHTML = '<div class="table-state table-state--error"><p>Unable to load notifications.</p></div>';
    }
  }

  async function markAllRead() {
    try {
      await ApiClient.post(NOTIFICATIONS.MARK_ALL_READ, {});
      return true;
    } catch (e) {
      return false;
    }
  }

  global.NotificationPanel = { loadUnreadCount, loadRecent, markAllRead };
})(window);
