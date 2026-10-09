/**
 * Notification panel, unread indicator, in-page sound, and phone push setup.
 */
(function (global) {
  'use strict';

  const { NOTIFICATIONS } = ENOCH_ENDPOINTS;
  const SOUND_STORAGE_KEY = 'mic-notification-sound-enabled';
  let lastKnownUnreadCount = null;
  let soundContext = null;
  let pollTimer = null;

  function playNotificationSound() {
    if (localStorage.getItem(SOUND_STORAGE_KEY) === 'false') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      soundContext = soundContext || new AudioContextClass();
      if (soundContext.state === 'suspended') soundContext.resume();
      const oscillator = soundContext.createOscillator();
      const gain = soundContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, soundContext.currentTime);
      gain.gain.setValueAtTime(0.0001, soundContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, soundContext.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, soundContext.currentTime + 0.35);
      oscillator.connect(gain);
      gain.connect(soundContext.destination);
      oscillator.start();
      oscillator.stop(soundContext.currentTime + 0.36);
    } catch (error) {
      console.warn('[Notifications] Sound could not be played:', error.message);
    }
  }

  function updateCount(dotEl, count) {
    const unreadCount = Math.max(0, Number(count) || 0);
    if (dotEl) dotEl.hidden = unreadCount === 0;
    if (lastKnownUnreadCount !== null && unreadCount > lastKnownUnreadCount) playNotificationSound();
    lastKnownUnreadCount = unreadCount;
    window.dispatchEvent(new CustomEvent('notifications:count', { detail: { count: unreadCount } }));
    return unreadCount;
  }

  async function loadUnreadCount(dotEl) {
    try {
      const payload = await ApiClient.get(NOTIFICATIONS.UNREAD_COUNT);
      const data = ApiClient.unwrapItem(payload) || {};
      return updateCount(dotEl, Number(data.count ?? data.unread ?? 0) || 0);
    } catch (error) {
      console.warn('[Notifications] Unable to refresh unread count:', error.message);
      return lastKnownUnreadCount;
    }
  }

  function startUnreadPolling(dotEl) {
    if (pollTimer) window.clearInterval(pollTimer);
    loadUnreadCount(dotEl);
    pollTimer = window.setInterval(() => loadUnreadCount(dotEl), 30000);
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
      listEl.innerHTML = items.map((notification) => `
        <a class="notif-item ${notification.readAt || notification.isRead ? '' : 'unread'}"
          data-notification-id="${escapeHtml(notification.id)}"
          href="${notification.targetPath ? `${rootPrefix()}${notification.targetPath.replace(/^\//, '')}` : `${rootPrefix()}pages/notifications.html`}">
          <div class="title">${escapeHtml(notification.title || 'Notification')}</div>
          ${notification.message ? `<div class="message">${escapeHtml(notification.message)}</div>` : ''}
          <div class="meta">${notification.canActivateRole ? 'Activate Role' : timeAgo(notification.createdAt)}</div>
        </a>`).join('');
    } catch (error) {
      console.error('[Notifications] Unable to load notification details:', error.message);
      listEl.innerHTML = '<div class="table-state table-state--error"><p>Unable to load notifications.</p></div>';
    }
  }

  async function markAllRead() {
    try {
      await ApiClient.post(NOTIFICATIONS.MARK_ALL_READ, {});
      window.dispatchEvent(new CustomEvent('notifications:changed'));
      return true;
    } catch (error) {
      console.error('[Notifications] Unable to mark all notifications as read:', error.message);
      return false;
    }
  }

  async function handleRecentClick(event, dotEl) {
    const link = event.target.closest('a[data-notification-id]');
    if (!link) return;
    if (link.classList.contains('unread')) {
      event.preventDefault();
      try {
        await ApiClient.patch(NOTIFICATIONS.MARK_READ(link.dataset.notificationId), {});
        window.dispatchEvent(new CustomEvent('notifications:changed'));
        link.classList.remove('unread');
        await loadUnreadCount(dotEl);
      } catch (error) {
        console.error('[Notifications] Unable to mark notification as read:', error.message);
      }
      window.location.href = link.href;
    }
  }

  function decodeVapidKey(key) {
    const padding = '='.repeat((4 - (key.length % 4)) % 4);
    const base64 = (key + padding).replace(/-/g, '+').replace(/_/g, '/');
    return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  }

  async function enablePhoneAlerts() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      throw new Error('This browser does not support phone notifications.');
    }
    const keyResponse = await ApiClient.get(NOTIFICATIONS.PUSH_KEY);
    const config = ApiClient.unwrapItem(keyResponse);
    if (!config?.configured || !config.publicKey) {
      throw new Error('Phone alerts are not configured on the school server yet. Please contact the system administrator.');
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Allow notifications in your browser settings to receive phone alerts.');
    const registration = await navigator.serviceWorker.register(`${rootPrefix()}service-worker.js`);
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(config.publicKey),
      });
    }
    await ApiClient.post(NOTIFICATIONS.PUSH_SUBSCRIPTION, subscription.toJSON());
    return true;
  }

  async function disablePhoneAlerts() {
    const registration = await navigator.serviceWorker.getRegistration(`${rootPrefix()}service-worker.js`);
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return false;
    await ApiClient.post(NOTIFICATIONS.REMOVE_PUSH_SUBSCRIPTION, { endpoint: subscription.endpoint });
    await subscription.unsubscribe();
    return true;
  }

  async function phoneAlertsEnabled() {
    const registration = await navigator.serviceWorker?.getRegistration(`${rootPrefix()}service-worker.js`);
    return Boolean(await registration?.pushManager.getSubscription());
  }

  function attachRecentActions(listEl, dotEl) {
    listEl?.addEventListener('click', (event) => handleRecentClick(event, dotEl));
  }

  function setSoundEnabled(enabled) {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
    if (enabled) playNotificationSound();
    return enabled;
  }

  global.NotificationPanel = {
    loadUnreadCount,
    loadRecent,
    markAllRead,
    startUnreadPolling,
    attachRecentActions,
    enablePhoneAlerts,
    disablePhoneAlerts,
    phoneAlertsEnabled,
    setSoundEnabled,
    isSoundEnabled: () => localStorage.getItem(SOUND_STORAGE_KEY) !== 'false',
  };
})(window);
