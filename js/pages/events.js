(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;

    SimpleCrudPage.init({
      tbody: document.getElementById('events-tbody'),
      paginationEl: document.getElementById('events-pagination'),
      searchInput: document.getElementById('events-search'),
      addBtn: document.getElementById('add-event-btn'),
      moduleKey: 'events',
      entityLabel: 'Event',
      service: EventsService,
      modalSize: 'lg',
      columns: [
        { key: 'title', label: 'Event', render: (r) => `<strong>${escapeHtml(r.title)}</strong>` },
        { key: 'location', label: 'Location', render: (r) => escapeHtml(r.location || '—') },
        { key: 'startDate', label: 'Start', render: (r) => formatDateTime(r.startDate) },
        { key: 'endDate', label: 'End', render: (r) => formatDateTime(r.endDate) },
      ],
      formFields: [
        { name: 'title', label: 'Event Title', required: true },
        { name: 'location', label: 'Location' },
        { name: 'startDate', label: 'Start Date', type: 'date', required: true },
        { name: 'endDate', label: 'End Date', type: 'date' },
        { name: 'description', label: 'Description', type: 'textarea' },
      ],
      deleteMessage: (row) => `Delete event "${row.title}"?`,
    });
  });
})();
