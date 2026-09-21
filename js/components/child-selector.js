/**
 * ChildSelector — shared helper for Parent workspace pages that need to
 * pick which child to view data for. Persists the last-selected child
 * in sessionStorage (per browser tab) so navigating between parent
 * pages remembers the choice without re-prompting.
 */
(function (global) {
  'use strict';

  const SESSION_KEY = 'enoch_selected_child_id';

  async function populate(selectEl, { autoLoadFirst = true } = {}) {
    if (!selectEl || !window.CurrentUser) return [];
    selectEl.innerHTML = '<option value="">Loading children…</option>';
    try {
      const { items } = await ParentsService.children(window.CurrentUser.id);
      if (!items.length) {
        selectEl.innerHTML = '<option value="">No children linked to your account</option>';
        return [];
      }
      selectEl.innerHTML = items
        .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(`${c.firstName || ''} ${c.lastName || ''}`)} — ${escapeHtml(c.className || c.class?.name || '')}</option>`)
        .join('');

      const stored = sessionStorage.getItem(SESSION_KEY);
      const validStored = items.find((c) => c.id === stored);
      if (validStored) {
        selectEl.value = stored;
      } else if (autoLoadFirst) {
        selectEl.value = items[0].id;
      }
      selectEl.addEventListener('change', () => sessionStorage.setItem(SESSION_KEY, selectEl.value));
      return items;
    } catch (err) {
      selectEl.innerHTML = '<option value="">Unable to load children</option>';
      return [];
    }
  }

  global.ChildSelector = { populate };
})(window);
