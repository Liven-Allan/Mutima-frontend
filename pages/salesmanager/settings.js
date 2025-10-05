/* global bootstrap */
(function() {
  const API_BASE = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) ? API_BASE_URL : '';
  let deleteTargetId = null;
  let categoriesAll = [];
  let currentPage = 1;
  const pageSize = 4;

  function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 280px;';
    alert.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    document.body.appendChild(alert);
    setTimeout(() => { if (alert.parentNode) alert.remove(); }, 4000);
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch (_) { return ''; }
  }

  async function fetchCategories() {
    const res = await fetch(`${API_BASE}/api/categories`);
    if (!res.ok) throw new Error('Failed to load categories');
    return await res.json();
  }

  function renderCategories(categories) {
    const tbody = document.getElementById('categoriesTableBody');
    tbody.innerHTML = '';
    categories.forEach(cat => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="d-flex px-2 py-1">
            <div class="d-flex flex-column justify-content-center">
              <h6 class="mb-0 text-sm">${cat.name}</h6>
            </div>
          </div>
        </td>
        <td>
          <p class="text-xs font-weight-bold mb-0">${cat.item_type}</p>
        </td>
        <td class="align-middle text-center">
          <span class="text-secondary text-xs font-weight-bold">${formatDate(cat.createdAt)}</span>
        </td>
        <td class="align-middle text-center">
          <button class="btn btn-sm btn-outline-danger" data-id="${cat._id}" data-action="delete-cat">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  function updateCategoriesPaginationControls() {
    const total = categoriesAll.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(total, currentPage * pageSize);

    const showingTextEl = document.getElementById('categoriesShowingText');
    const pageInfoEl = document.getElementById('categoriesCurrentPageInfo');
    const prevBtn = document.getElementById('categoriesPrevPage');
    const nextBtn = document.getElementById('categoriesNextPage');

    if (showingTextEl) showingTextEl.textContent = `Showing ${startIndex || 0} to ${endIndex || 0} of ${total} items`;
    if (pageInfoEl) pageInfoEl.textContent = `Page ${currentPage} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage <= 1 || total === 0;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages || total === 0;

    const sliceStart = (currentPage - 1) * pageSize;
    const sliceEnd = sliceStart + pageSize;
    renderCategories(categoriesAll.slice(sliceStart, sliceEnd));
  }

  async function createCategory(payload) {
    const res = await fetch(`${API_BASE}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.status === 409) {
      throw new Error('Category with this name already exists');
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to create category');
    }
    return await res.json();
  }

  async function deleteCategory(id) {
    const res = await fetch(`${API_BASE}/api/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete category');
  }

  function setupAddCategoryForm() {
    const form = document.getElementById('addCategoryForm');
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const name = document.getElementById('categoryName').value.trim();
      const item_type = document.getElementById('categoryType').value;
      if (!name || !item_type) {
        showAlert('Please provide category name and type', 'warning');
        return;
      }
      try {
        const created = await createCategory({ name, item_type });
        // Reload list to show consistent ordering
        categoriesAll = await fetchCategories();
        // Jump to last page where the new item likely appears (simple UX)
        currentPage = Math.max(1, Math.ceil(categoriesAll.length / pageSize));
        updateCategoriesPaginationControls();
        // Close modal
        const modalEl = document.getElementById('addCategoryModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.hide();
        form.reset();
        showAlert('Category added successfully', 'success');
      } catch (err) {
        showAlert(err.message || 'Error adding category', 'error');
      }
    });
  }

  function setupDeleteFlow() {
    const tbody = document.getElementById('categoriesTableBody');
    tbody.addEventListener('click', function(e) {
      const btn = e.target.closest('button[data-action="delete-cat"]');
      if (!btn) return;
      deleteTargetId = btn.getAttribute('data-id');
      const modalEl = document.getElementById('deleteCategoryModal');
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.show();
    });

    const confirmBtn = document.getElementById('confirmDeleteCategoryBtn');
    confirmBtn.addEventListener('click', async function() {
      if (!deleteTargetId) return;
      try {
        await deleteCategory(deleteTargetId);
        // Refresh list
        categoriesAll = await fetchCategories();
        // Adjust current page if we deleted the last item on the last page
        const totalPages = Math.max(1, Math.ceil(categoriesAll.length / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;
        updateCategoriesPaginationControls();
        // Hide modal
        const modalEl = document.getElementById('deleteCategoryModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.hide();
        deleteTargetId = null;
        showAlert('Category deleted', 'success');
      } catch (err) {
        showAlert(err.message || 'Error deleting category', 'error');
      }
    });
  }

  function setupPaginationButtons() {
    const prevBtn = document.getElementById('categoriesPrevPage');
    const nextBtn = document.getElementById('categoriesNextPage');
    if (prevBtn) prevBtn.addEventListener('click', function() {
      if (currentPage > 1) {
        currentPage -= 1;
        updateCategoriesPaginationControls();
      }
    });
    if (nextBtn) nextBtn.addEventListener('click', function() {
      const totalPages = Math.max(1, Math.ceil(categoriesAll.length / pageSize));
      if (currentPage < totalPages) {
        currentPage += 1;
        updateCategoriesPaginationControls();
      }
    });
  }

  async function init() {
    try {
      categoriesAll = await fetchCategories();
      currentPage = 1;
      updateCategoriesPaginationControls();
    } catch (err) {
      showAlert('Failed to load categories', 'error');
    }
    setupAddCategoryForm();
    setupDeleteFlow();
    setupPaginationButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


