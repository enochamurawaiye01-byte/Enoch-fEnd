(function () {
  'use strict';

  const ItemsAdapter = {
    list: InventoryService.listItems,
    get: InventoryService.getItem,
    create: InventoryService.createItem,
    update: InventoryService.updateItem,
    delete: InventoryService.deleteItem,
  };

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    let categoryOptions = [];
    try {
      const { items } = await InventoryService.categories();
      categoryOptions = items.map((c) => ({ value: c.id || c.name, label: c.name }));
    } catch (e) { /* non-fatal */ }

    SimpleCrudPage.init({
      tbody: document.getElementById('inventory-tbody'),
      paginationEl: document.getElementById('inventory-pagination'),
      searchInput: document.getElementById('inventory-search'),
      addBtn: document.getElementById('add-item-btn'),
      moduleKey: 'inventory',
      entityLabel: 'Inventory Item',
      service: ItemsAdapter,
      columns: [
        { key: 'name', label: 'Item', render: (r) => `<strong>${escapeHtml(r.name)}</strong>` },
        { key: 'category', label: 'Category', render: (r) => escapeHtml(r.category || r.categoryName || '—') },
        {
          key: 'quantity',
          label: 'Quantity in Stock',
          render: (r) => {
            const qty = Number(r.quantity ?? 0);
            const low = r.lowStockThreshold !== undefined && qty <= Number(r.lowStockThreshold);
            return `<span class="${low ? 'text-danger' : ''}">${escapeHtml(String(qty))}</span> ${low ? '<span class="badge badge-danger" style="margin-left:6px;">Low Stock</span>' : ''}`;
          },
        },
        { key: 'unit', label: 'Unit', render: (r) => escapeHtml(r.unit || '—') },
      ],
      formFields: [
        { name: 'name', label: 'Item Name', required: true },
        { name: 'category', label: 'Category', type: 'select', options: categoryOptions },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true },
        { name: 'unit', label: 'Unit', placeholder: 'e.g. pcs, boxes, reams' },
        { name: 'lowStockThreshold', label: 'Low Stock Threshold', type: 'number' },
      ],
      deleteMessage: (row) => `Remove "${row.name}" from inventory?`,
    });
  });
})();
