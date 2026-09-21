/**
 * Reports — a category picker (academic, attendance, financial,
 * examination, operational) backed by the real reports API. Only
 * categories the backend actually returns data for are rendered.
 */
(function () {
  'use strict';

  const CATEGORIES = [
    { key: 'academic', label: 'Academic', fetch: () => ReportsService.academic() },
    { key: 'attendance', label: 'Attendance', fetch: () => ReportsService.attendance() },
    { key: 'financial', label: 'Financial', fetch: () => ReportsService.financial() },
    { key: 'examination', label: 'Examination', fetch: () => ReportsService.examination() },
    { key: 'operational', label: 'Operational', fetch: () => ReportsService.operational() },
  ];

  function renderReportData(container, data) {
    if (!data || typeof data !== 'object' || !Object.keys(data).length) {
      container.innerHTML = '<div class="table-state"><p>No data is available for this report yet.</p></div>';
      return;
    }
    const entries = Object.entries(data).filter(([, v]) => typeof v !== 'object');
    if (!entries.length) {
      container.innerHTML = '<div class="table-state"><p>No summarized figures available for this report.</p></div>';
      return;
    }
    container.innerHTML = `
      <div class="stat-grid">
        ${entries
          .map(
            ([key, value]) => `
          <div class="stat-card">
            <div class="stat-card__label">${escapeHtml(titleCaseFromEnum(key))}</div>
            <div class="stat-card__value">${escapeHtml(String(value))}</div>
          </div>`
          )
          .join('')}
      </div>
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;

    const tabBar = document.getElementById('report-tabs');
    const content = document.getElementById('report-content');

    tabBar.innerHTML = CATEGORIES.map((c, i) => `<button type="button" class="tab-btn ${i === 0 ? 'active' : ''}" data-key="${c.key}">${escapeHtml(c.label)}</button>`).join('');

    async function loadCategory(key) {
      const cat = CATEGORIES.find((c) => c.key === key);
      content.innerHTML = Loader.spinnerHtml(`Loading ${cat.label.toLowerCase()} report…`);
      try {
        const data = await cat.fetch();
        renderReportData(content, data);
      } catch (err) {
        content.innerHTML = `<div class="table-state table-state--error"><p>${escapeHtml(err.message)}</p></div>`;
      }
    }

    tabBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      qsa('.tab-btn', tabBar).forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      loadCategory(btn.dataset.key);
    });

    loadCategory(CATEGORIES[0].key);
  });
})();
