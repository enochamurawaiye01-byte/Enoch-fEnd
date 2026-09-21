/**
 * SimpleCrudPage — a reusable controller for the many ERP screens that are
 * "a searchable/paginated list + a create/edit modal form + delete/deactivate".
 * Used by Subjects, Departments, Academic Sessions, Terms, Class Subjects,
 * Teacher Assignments, and similar single-entity admin screens.
 *
 * Does NOT replace bespoke controllers (Students, Classes, Fees, etc. have
 * enough special-casing to warrant their own js/pages/*.js file) — it's for
 * the simpler, structurally-identical modules.
 *
 * Usage:
 *   SimpleCrudPage.init({
 *     tbody, paginationEl, searchInput, addBtn,
 *     moduleKey: 'academics',                 // Permissions.canAccessModule key
 *     entityLabel: 'Subject',
 *     service: SubjectsService,               // needs list/get/create/update/delete
 *     columns: [...],                          // same shape as DataTable columns
 *     formFields: [...],                       // see renderField() below
 *     buildRowActions: (row) => html,          // optional override
 *     deleteMessage: (row) => `Delete ${row.name}?`,
 *     onFormValues: (values, row) => values,    // optional transform before submit
 *   });
 */
(function (global) {
  'use strict';

  function renderField(field, values) {
    const value = values ? values[field.name] ?? '' : (field.default ?? '');
    const required = field.required ? '<span class="required">*</span>' : '';
    const commonAttrs = `name="${field.name}" id="field-${field.name}" ${field.required ? 'required' : ''}`;

    let control;
    if (field.type === 'select') {
      const opts = (field.options || [])
        .map((o) => `<option value="${escapeHtml(o.value)}" ${String(o.value) === String(value) ? 'selected' : ''}>${escapeHtml(o.label)}</option>`)
        .join('');
      control = `<select ${commonAttrs}><option value="">${escapeHtml(field.placeholder || 'Select…')}</option>${opts}</select>`;
    } else if (field.type === 'textarea') {
      control = `<textarea ${commonAttrs} placeholder="${escapeHtml(field.placeholder || '')}">${escapeHtml(value)}</textarea>`;
    } else if (field.type === 'checkbox') {
      control = `<label class="checkbox-field"><input type="checkbox" name="${field.name}" id="field-${field.name}" ${value ? 'checked' : ''} /><span>${escapeHtml(field.checkboxLabel || field.label)}</span></label>`;
      return `<div class="form-group" data-field="${field.name}">${control}<span class="form-error"></span></div>`;
    } else {
      control = `<input type="${field.type || 'text'}" ${commonAttrs} value="${escapeHtml(field.type === 'date' ? (toInputDate(value) || '') : value)}" placeholder="${escapeHtml(field.placeholder || '')}" />`;
    }

    return `
      <div class="form-group" data-field="${field.name}">
        <label class="form-label" for="field-${field.name}">${escapeHtml(field.label)} ${required}</label>
        ${control}
        ${field.help ? `<span class="form-help">${escapeHtml(field.help)}</span>` : ''}
        <span class="form-error"></span>
      </div>
    `;
  }

  function init(config) {
    const {
      tbody, paginationEl, searchInput, addBtn,
      moduleKey, entityLabel, service, columns, formFields,
      buildRowActions, deleteMessage, onFormValues, extraFilters,
      pageSize = 20,
    } = config;

    const canManage = window.CurrentUser ? Permissions.canAccessModule(window.CurrentUser.role, moduleKey) : false;
    if (addBtn) addBtn.hidden = !canManage;

    function defaultRowActions(row) {
      if (!canManage) return '';
      return `
        <div class="row" style="gap:4px; justify-content:flex-end;">
          <button type="button" class="icon-link" data-action="edit" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button type="button" class="icon-link" data-action="delete" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
          </button>
        </div>
      `;
    }

    const table = DataTable.create({
      tbody,
      paginationEl,
      columns,
      rowActions: buildRowActions || defaultRowActions,
      pageSize,
      fetchPage: (page, filters) => service.list({ page, pageSize, ...filters }),
      emptyMessage: `No ${entityLabel.toLowerCase()}s found.`,
      emptyActionHtml: canManage ? `<button type="button" class="btn btn-primary btn-sm" data-action="empty-add">Add ${escapeHtml(entityLabel)}</button>` : '',
    });

    function openFormModal(row) {
      const isEdit = Boolean(row && row.id);
      Modal.open({
        title: isEdit ? `Edit ${entityLabel}` : `Add ${entityLabel}`,
        size: config.modalSize || 'md',
        bodyHtml: `<form id="crud-form" novalidate>${formFields.map((f) => renderField(f, row)).join('')}</form>`,
        footerHtml: `
          <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
          <button type="submit" form="crud-form" class="btn btn-primary" id="crud-save-btn">${isEdit ? 'Save Changes' : `Add ${escapeHtml(entityLabel)}`}</button>
        `,
        onMount: (modalEl) => {
          modalEl.querySelector('[data-action="cancel"]').addEventListener('click', Modal.close);
          if (config.onModalMount) config.onModalMount(modalEl, row);

          const form = modalEl.querySelector('#crud-form');
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            let values = {};
            formFields.forEach((f) => {
              if (f.type === 'checkbox') {
                values[f.name] = form.querySelector(`[name="${f.name}"]`).checked;
              } else {
                values[f.name] = formData.get(f.name) || '';
              }
            });
            if (onFormValues) values = onFormValues(values, row) || values;

            const schema = {};
            formFields.forEach((f) => {
              const rules = [];
              if (f.required) rules.push((v) => Validators.required(v, f.label));
              if (f.type === 'email') rules.push((v) => Validators.email(v));
              if (rules.length) schema[f.name] = rules;
            });
            const { valid, errors } = Validators.validateForm(values, schema);
            form.querySelectorAll('.form-group').forEach((g) => g.classList.remove('has-error'));
            if (!valid) {
              Object.entries(errors).forEach(([field, message]) => {
                const group = form.querySelector(`[data-field="${field}"]`);
                if (group) {
                  group.classList.add('has-error');
                  const err = group.querySelector('.form-error');
                  if (err) err.textContent = message;
                }
              });
              return;
            }

            const saveBtn = document.getElementById('crud-save-btn');
            Loader.setButtonLoading(saveBtn, true, isEdit ? 'Saving…' : 'Adding…');
            try {
              if (isEdit) {
                await service.update(row.id, values);
                Toast.success(`${entityLabel} updated successfully.`);
              } else {
                await service.create(values);
                Toast.success(`${entityLabel} added successfully.`);
              }
              Modal.close();
              table.reload();
            } catch (err) {
              Toast.error(err.message || `Unable to save this ${entityLabel.toLowerCase()}.`);
            } finally {
              Loader.setButtonLoading(saveBtn, false);
            }
          });
        },
      });
    }

    function openDeleteConfirm(row) {
      ConfirmDialog.open({
        title: `Delete ${entityLabel}`,
        message: deleteMessage ? deleteMessage(row) : `Are you sure you want to delete this ${entityLabel.toLowerCase()}? This action cannot be undone.`,
        confirmLabel: 'Delete',
        tone: 'danger',
        onConfirm: async () => {
          await service.delete(row.id);
          Toast.success(`${entityLabel} deleted.`);
          table.reload();
        },
      });
    }

    tbody.addEventListener('click', async (e) => {
      const emptyAdd = e.target.closest('[data-action="empty-add"]');
      if (emptyAdd) {
        openFormModal(null);
        return;
      }
      const rowEl = e.target.closest('tr[data-row-id]');
      if (!rowEl) return;
      const id = rowEl.dataset.rowId;

      if (e.target.closest('[data-action="edit"]')) {
        try {
          const row = await service.get(id);
          openFormModal(row);
        } catch (err) {
          Toast.error(err.message || 'Unable to load this record.');
        }
      } else if (e.target.closest('[data-action="delete"]')) {
        try {
          const row = await service.get(id);
          openDeleteConfirm(row);
        } catch (err) {
          Toast.error(err.message || 'Unable to load this record.');
        }
      } else if (config.onRowAction) {
        config.onRowAction(e, rowEl.dataset.rowId);
      }
    });

    if (addBtn) addBtn.addEventListener('click', () => openFormModal(null));

    if (searchInput) {
      const applySearch = debounce(() => {
        table.setFilters(Object.assign({ search: searchInput.value.trim() }, extraFilters ? extraFilters() : {}));
      }, 350);
      searchInput.addEventListener('input', applySearch);
    }

    table.load();
    return table;
  }

  global.SimpleCrudPage = { init, renderField };
})(window);
