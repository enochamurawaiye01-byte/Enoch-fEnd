(function () {
  'use strict';

  let inboxTable, sentTable;

  function initTabs() {
    const tabs = qsa('.tab-btn');
    const panels = qsa('.tab-panel');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        panels.forEach((p) => (p.hidden = true));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tabTarget).hidden = false;
      });
    });
  }

  function openMessageModal(message) {
    Modal.open({
      title: message.subject || 'Message',
      bodyHtml: `
        <p class="text-muted text-small">From: ${escapeHtml(message.senderName || message.sender?.name || 'Unknown')} &middot; ${formatDateTime(message.createdAt)}</p>
        <p style="white-space:pre-wrap; margin-top:var(--space-3);">${escapeHtml(message.body || message.content || '')}</p>
      `,
      footerHtml: `<button type="button" class="btn btn-secondary" data-action="close">Close</button>`,
      onMount: (modalEl) => modalEl.querySelector('[data-action="close"]').addEventListener('click', Modal.close),
    });
  }

  function openComposeModal(onSent) {
    Modal.open({
      title: 'New Message',
      bodyHtml: `
        <form id="compose-form" novalidate>
          <div class="form-group">
            <label class="form-label">To (email or username) <span class="required">*</span></label>
            <input type="text" name="recipient" required />
          </div>
          <div class="form-group">
            <label class="form-label">Subject <span class="required">*</span></label>
            <input type="text" name="subject" required />
          </div>
          <div class="form-group">
            <label class="form-label">Message <span class="required">*</span></label>
            <textarea name="body" rows="6" required></textarea>
          </div>
        </form>
      `,
      footerHtml: `
        <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
        <button type="submit" form="compose-form" class="btn btn-primary" id="compose-send-btn">Send</button>
      `,
      onMount: (modalEl) => {
        modalEl.querySelector('[data-action="cancel"]').addEventListener('click', Modal.close);
        modalEl.querySelector('#compose-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const values = Object.fromEntries(new FormData(e.target).entries());
          const btn = document.getElementById('compose-send-btn');
          Loader.setButtonLoading(btn, true, 'Sending…');
          try {
            await MessagesService.compose(values);
            Toast.success('Message sent.');
            Modal.close();
            onSent();
          } catch (err) {
            Toast.error(err.message || 'Unable to send this message.');
          } finally {
            Loader.setButtonLoading(btn, false);
          }
        });
      },
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.CurrentUser) return;
    initTabs();

    inboxTable = DataTable.create({
      tbody: document.getElementById('inbox-tbody'),
      paginationEl: document.getElementById('inbox-pagination'),
      columns: [
        { key: 'senderName', label: 'From', render: (r) => `<span class="${r.readAt ? '' : 'text-strong'}">${escapeHtml(r.senderName || r.sender?.name || 'Unknown')}</span>` },
        { key: 'subject', label: 'Subject', render: (r) => escapeHtml(r.subject || '(No subject)') },
        { key: 'createdAt', label: 'Date', render: (r) => timeAgo(r.createdAt) },
      ],
      fetchPage: (page) => MessagesService.inbox({ page, pageSize: 20 }),
      emptyMessage: 'Your inbox is empty.',
    });
    inboxTable.load();

    sentTable = DataTable.create({
      tbody: document.getElementById('sent-tbody'),
      paginationEl: document.getElementById('sent-pagination'),
      columns: [
        { key: 'recipientName', label: 'To', render: (r) => escapeHtml(r.recipientName || r.recipient?.name || '—') },
        { key: 'subject', label: 'Subject', render: (r) => escapeHtml(r.subject || '(No subject)') },
        { key: 'createdAt', label: 'Date', render: (r) => timeAgo(r.createdAt) },
      ],
      fetchPage: (page) => MessagesService.sent({ page, pageSize: 20 }),
      emptyMessage: 'You have not sent any messages yet.',
    });
    sentTable.load();

    async function handleRowClick(e, service) {
      const rowEl = e.target.closest('tr[data-row-id]');
      if (!rowEl) return;
      try {
        const message = await MessagesService.get(rowEl.dataset.rowId);
        openMessageModal(message);
      } catch (err) {
        Toast.error(err.message || 'Unable to open this message.');
      }
    }
    document.getElementById('inbox-tbody').addEventListener('click', (e) => handleRowClick(e));
    document.getElementById('sent-tbody').addEventListener('click', (e) => handleRowClick(e));

    document.getElementById('compose-btn').addEventListener('click', () => openComposeModal(() => { inboxTable.reload(); sentTable.reload(); }));
  });
})();
