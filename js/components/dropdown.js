/**
 * Generic accessible dropdown behavior, matching navbar.css
 * (.dropdown-panel, .dropdown-panel.open).
 * Attaches to any [data-dropdown-trigger] with a sibling [data-dropdown-panel].
 */
(function (global) {
  'use strict';

  function closeAll(except) {
    qsa('[data-dropdown-panel].open').forEach((menu) => {
      if (menu !== except) menu.classList.remove('open');
    });
  }

  function init(root = document) {
    qsa('[data-dropdown-trigger]', root).forEach((trigger) => {
      if (trigger.dataset.dropdownBound) return;
      trigger.dataset.dropdownBound = 'true';
      const wrapper = trigger.closest('[data-dropdown]');
      const menu = wrapper ? wrapper.querySelector('[data-dropdown-panel]') : null;
      if (!menu) return;

      trigger.setAttribute('aria-haspopup', 'true');

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menu.classList.contains('open');
        closeAll();
        if (!isOpen) menu.classList.add('open');
      });

      menu.addEventListener('click', (e) => e.stopPropagation());
    });

    document.addEventListener('click', () => closeAll());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });
  }

  global.Dropdown = { init, closeAll };
})(window);
