(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.CurrentUser) return;

    const tbody = document.getElementById('timetable-tbody');
    const filterClass = document.getElementById('filter-class');
    const uploadPanel = document.getElementById('timetable-upload-panel');
    const uploadClass = document.getElementById('timetable-upload-class');
    const uploadForm = document.getElementById('timetable-upload-form');
    const submitButton = document.getElementById('timetable-upload-submit');
    const canUpload = ['SUPER_ADMIN', 'ADMIN'].includes(window.CurrentUser.role);
    if (!canUpload && uploadPanel) uploadPanel.hidden = true;

    const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '—';
    const renderFile = (record) => {
      if (!record.scheduleFileUrl) return '<span class="text-muted">No file uploaded</span>';
      const url = escapeHtml(record.scheduleFileUrl);
      const name = escapeHtml(record.scheduleFileName || 'View timetable');
      const isImage = /\.(jpe?g|png|webp)$/i.test(record.scheduleFileName || '');
      return `${isImage ? `<a href="${url}" target="_blank" rel="noopener"><img src="${url}" alt="${name}" style="display:block;max-width:180px;max-height:120px;object-fit:contain;margin-bottom:6px;"></a>` : ''}<a href="${url}" target="_blank" rel="noopener">${name}</a>`;
    };

    const loadRecords = async () => {
      Loader.tableLoading(tbody, 4, 'Loading class timetables…');
      try {
        const filters = { isActive: 'true' };
        if (filterClass?.value) filters.classId = filterClass.value;
        const { items } = await TimetableService.list(filters);
        if (!items.length) {
          Loader.tableEmpty(tbody, 4, 'No class timetables have been uploaded for the active term yet.');
          return;
        }
        tbody.innerHTML = items.map((record) => `
          <tr>
            <td>${escapeHtml(record.class?.name || '—')}</td>
            <td>${escapeHtml(record.session?.name || '—')}<br>${escapeHtml(record.term?.name || '—')}</td>
            <td>${renderFile(record)}</td>
            <td>${formatDate(record.updatedAt)}</td>
          </tr>`).join('');
      } catch (error) {
        Loader.tableError(tbody, 4, error.message);
      }
    };

    try {
      const { items: classes } = await ClassesService.list({ pageSize: 100 });
      const options = classes.map((schoolClass) =>
        `<option value="${escapeHtml(schoolClass.id)}">${escapeHtml(schoolClass.name)}</option>`
      ).join('');
      if (uploadClass) uploadClass.insertAdjacentHTML('beforeend', options);
      if (filterClass) filterClass.insertAdjacentHTML('beforeend', options);
    } catch (error) {
      Toast.error(error.message || 'Unable to load classes.');
    }

    filterClass?.addEventListener('change', loadRecords);
    uploadForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const file = document.getElementById('timetable-upload-file')?.files?.[0];
      if (!uploadClass.value || !file) {
        Toast.error('Select a class and timetable file before uploading.');
        return;
      }
      submitButton.disabled = true;
      try {
        await TimetableService.uploadFile({ classId: uploadClass.value, file });
        uploadForm.reset();
        Toast.success('Class timetable uploaded.');
        await loadRecords();
      } catch (error) {
        Toast.error(error.message || 'Unable to upload timetable.');
      } finally {
        submitButton.disabled = false;
      }
    });

    await loadRecords();
  });
})();
