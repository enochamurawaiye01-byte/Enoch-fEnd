(function () {
  'use strict';

  // Adapter so the Books list can reuse SimpleCrudPage with LibraryService's
  // book-specific method names.
  const BooksAdapter = {
    list: LibraryService.listBooks,
    get: LibraryService.getBook,
    create: LibraryService.createBook,
    update: LibraryService.updateBook,
    delete: LibraryService.deleteBook,
  };

  function openBorrowModal(studentOptions, onDone) {
    Modal.open({
      title: 'Borrow Book',
      bodyHtml: `
        <form id="borrow-form" novalidate>
          <div class="form-group">
            <label class="form-label">Book Title / ISBN <span class="required">*</span></label>
            <input type="text" name="bookQuery" placeholder="Enter book title or ISBN" required />
          </div>
          <div class="form-group">
            <label class="form-label">Borrower <span class="required">*</span></label>
            <select name="memberId" required>
              <option value="">Select student…</option>
              ${studentOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Due Date</label>
            <input type="date" name="dueDate" />
          </div>
        </form>
      `,
      footerHtml: `
        <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
        <button type="submit" form="borrow-form" class="btn btn-primary" id="borrow-save-btn">Borrow</button>
      `,
      onMount: (modalEl) => {
        modalEl.querySelector('[data-action="cancel"]').addEventListener('click', Modal.close);
        modalEl.querySelector('#borrow-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const values = Object.fromEntries(new FormData(e.target).entries());
          const btn = document.getElementById('borrow-save-btn');
          Loader.setButtonLoading(btn, true, 'Saving…');
          try {
            await LibraryService.borrow(values);
            Toast.success('Book borrowed successfully.');
            Modal.close();
            onDone();
          } catch (err) {
            Toast.error(err.message || 'Unable to record this loan.');
          } finally {
            Loader.setButtonLoading(btn, false);
          }
        });
      },
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;
    const canManage = Permissions.canAccessModule(window.CurrentUser.role, 'library');

    let studentOptions = [];
    try {
      const { items } = await StudentsService.list({ pageSize: 200 });
      studentOptions = items.map((s) => ({ value: s.id, label: `${s.firstName || ''} ${s.lastName || ''} (${s.regNumber || 'no reg.'})`.trim() }));
    } catch (e) { /* non-fatal */ }

    const table = SimpleCrudPage.init({
      tbody: document.getElementById('books-tbody'),
      paginationEl: document.getElementById('books-pagination'),
      searchInput: document.getElementById('books-search'),
      addBtn: document.getElementById('add-book-btn'),
      moduleKey: 'library',
      entityLabel: 'Book',
      service: BooksAdapter,
      columns: [
        { key: 'title', label: 'Title', render: (r) => `<strong>${escapeHtml(r.title)}</strong>` },
        { key: 'author', label: 'Author', render: (r) => escapeHtml(r.author || '—') },
        { key: 'isbn', label: 'ISBN', render: (r) => escapeHtml(r.isbn || '—') },
        { key: 'category', label: 'Category', render: (r) => escapeHtml(r.category || '—') },
        { key: 'copiesAvailable', label: 'Available', render: (r) => escapeHtml(String(r.copiesAvailable ?? r.availableCopies ?? '—')) },
      ],
      formFields: [
        { name: 'title', label: 'Book Title', required: true },
        { name: 'author', label: 'Author' },
        { name: 'isbn', label: 'ISBN' },
        { name: 'category', label: 'Category' },
        { name: 'totalCopies', label: 'Total Copies', type: 'number' },
      ],
      deleteMessage: (row) => `Remove "${row.title}" from the library catalogue?`,
    });

    const borrowBtn = document.getElementById('borrow-book-btn');
    if (borrowBtn) {
      borrowBtn.hidden = !canManage;
      borrowBtn.addEventListener('click', () => openBorrowModal(studentOptions, () => table.reload()));
    }

    const overdueTbody = document.getElementById('overdue-tbody');
    Loader.tableLoading(overdueTbody, 3, 'Loading overdue books…');
    try {
      const { items } = await LibraryService.overdue();
      if (!items.length) {
        Loader.tableEmpty(overdueTbody, 3, 'No overdue books.');
      } else {
        overdueTbody.innerHTML = items
          .map(
            (o) => `
          <tr>
            <td>${escapeHtml(o.bookTitle || o.book?.title || '—')}</td>
            <td>${escapeHtml(o.borrowerName || o.member?.name || '—')}</td>
            <td>${formatDate(o.dueDate)}</td>
          </tr>`
          )
          .join('');
      }
    } catch (err) {
      Loader.tableError(overdueTbody, 3, err.message);
    }
  });
})();
