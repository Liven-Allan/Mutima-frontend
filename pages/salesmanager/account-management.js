// Fetch and display the total number of users
window.addEventListener('DOMContentLoaded', () => {
  const totalUsersElem = document.getElementById('totalUsersCount');
  if (totalUsersElem) {
    fetch(API_BASE_URL + '/api/users/count')
      .then(res => res.json())
      .then(data => {
        totalUsersElem.textContent = data.count !== undefined ? data.count.toLocaleString() : '--';
      })
      .catch(() => {
        totalUsersElem.textContent = '--';
      });
  }
  const pendingUsersElem = document.getElementById('pendingUsersCount');
  if (pendingUsersElem) {
    fetch(API_BASE_URL + '/api/users/pending-count')
      .then(res => res.json())
      .then(data => {
        pendingUsersElem.textContent = data.count !== undefined ? data.count.toLocaleString() : '--';
      })
      .catch(() => {
        pendingUsersElem.textContent = '--';
      });
  }
  const rejectedUsersElem = document.getElementById('rejectedUsersCount');
  if (rejectedUsersElem) {
    fetch(API_BASE_URL + '/api/users/rejected-count')
      .then(res => res.json())
      .then(data => {
        rejectedUsersElem.textContent = data.count !== undefined ? data.count.toLocaleString() : '--';
      })
      .catch(() => {
        rejectedUsersElem.textContent = '--';
      });
  }
  // --- Active Users Pagination (Inventory Style) ---
  // (Ensure only this logic is used for rendering Active Users)
  // Remove any legacy or duplicate rendering logic for Active Users table.
  const activeUsersTableBody = document.getElementById('activeUsersTableBody');
  const activeUsersShowingText = document.getElementById('activeUsersShowingText');
  const activeUsersPrevPage = document.getElementById('activeUsersPrevPage');
  const activeUsersNextPage = document.getElementById('activeUsersNextPage');
  const activeUsersCurrentPageInfo = document.getElementById('activeUsersCurrentPageInfo');
  let activeUsersData = [];
  let activeUsersCurrentPage = 1;
  let activeUsersTotalPages = 1;
  const activeUsersPageSize = 4;

  function renderActiveUsersTable(items) {
    activeUsersTableBody.innerHTML = '';
    if (!items.length) {
      activeUsersTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-warning">No active users found</td></tr>';
    } else {
      items.forEach(user => {
        const name = (`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Unknown');
        const contact = user.phone ? user.phone : (user.email ? user.email : '');
        const role = user.role ? user.role.replace(/([A-Z])/g, ' $1').trim() : '';
        const status = user.status === 'active' ? '<span class="badge badge-sm bg-gradient-success">Active</span>' : '';
        const lastActive = user.last_login ? new Date(user.last_login).toISOString().slice(0, 10) : '';
        activeUsersTableBody.innerHTML += `
          <tr style="vertical-align: middle;">
            <td style="padding: 12px 16px;">
              <div class="d-flex px-2 py-1">
                <div class="d-flex flex-column justify-content-center">
                  <h6 class="mb-0 text-sm">${name}${contact ? ' - ' + contact : ''}</h6>
                </div>
              </div>
            </td>
            <td style="padding: 12px 16px;">
              <p class="text-xs font-weight-bold mb-0">${role}</p>
            </td>
            <td class="align-middle text-center text-sm" style="padding: 12px 16px;">
              ${status}
            </td>
            <td class="align-middle text-center" style="padding: 12px 16px;">
              <span class="text-secondary text-xs font-weight-bold">${lastActive}</span>
            </td>
            <td class="align-middle text-center" style="padding: 12px 16px;">
              <button class="btn btn-link text-secondary mb-0 edit-user-btn" title="Edit">
                <i class="fa fa-edit text-xs"></i>
              </button>
              <button class="btn btn-link text-danger mb-0 delete-user-btn" title="Delete" data-bs-toggle="modal" data-bs-target="#deleteUserModal" data-user-id="${user._id}">
                <i class="fa fa-trash text-xs"></i>
              </button>
            </td>
          </tr>
        `;
      });
    }
  }
  function updateActiveUsersPaginationInfo(start, end, total) {
    if (activeUsersShowingText) {
      activeUsersShowingText.textContent = `Showing ${start} to ${end} of ${total} items`;
    }
  }
  function updateActiveUsersPaginationControls() {
    if (activeUsersPrevPage) activeUsersPrevPage.disabled = activeUsersCurrentPage <= 1;
    if (activeUsersNextPage) activeUsersNextPage.disabled = activeUsersCurrentPage >= activeUsersTotalPages;
    if (activeUsersCurrentPageInfo) activeUsersCurrentPageInfo.textContent = `Page ${activeUsersCurrentPage} of ${activeUsersTotalPages}`;
  }
  const activeUsersSearchInput = document.querySelector('input[placeholder="Search User"]');
  let activeUsersSearchTerm = '';

  function getFilteredActiveUsers() {
    if (!activeUsersSearchTerm) return activeUsersData;
    const term = activeUsersSearchTerm.toLowerCase();
    // Sort: matching users first, then others
    return activeUsersData
      .map(user => {
        const name = (`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '');
        const username = user.username || '';
        const match = name.toLowerCase().includes(term) || username.toLowerCase().includes(term);
        return { user, match };
      })
      .sort((a, b) => b.match - a.match)
      .filter(entry => entry.match)
      .map(entry => entry.user);
  }

  function showActiveUsersPage(page) {
    activeUsersCurrentPage = page;
    const filtered = getFilteredActiveUsers();
    const total = filtered.length;
    activeUsersTotalPages = Math.ceil(total / activeUsersPageSize) || 1;
    const startIdx = (activeUsersCurrentPage - 1) * activeUsersPageSize;
    const endIdx = Math.min(startIdx + activeUsersPageSize, total);
    renderActiveUsersTable(filtered.slice(startIdx, endIdx));
    updateActiveUsersPaginationInfo(total === 0 ? 0 : startIdx + 1, endIdx, total);
    updateActiveUsersPaginationControls();
  }
  function fetchAndRenderActiveUsers() {
    fetch(API_BASE_URL + '/api/users/active')
      .then(res => res.json())
      .then(data => {
        activeUsersData = data.users || [];
        showActiveUsersPage(1);
      })
      .catch(() => {
        activeUsersData = [];
        showActiveUsersPage(1);
      });
  }
  if (activeUsersTableBody && activeUsersShowingText && activeUsersPrevPage && activeUsersNextPage && activeUsersCurrentPageInfo) {
    fetchAndRenderActiveUsers();
    activeUsersPrevPage.addEventListener('click', function() {
      if (activeUsersCurrentPage > 1) showActiveUsersPage(activeUsersCurrentPage - 1);
    });
    activeUsersNextPage.addEventListener('click', function() {
      if (activeUsersCurrentPage < activeUsersTotalPages) showActiveUsersPage(activeUsersCurrentPage + 1);
    });
  }
  if (activeUsersSearchInput) {
    activeUsersSearchInput.addEventListener('input', function() {
      activeUsersSearchTerm = this.value.trim();
      showActiveUsersPage(1);
    });
  }
  // --- Pending Approvals Pagination ---
  const pendingApprovalsTableBody = document.getElementById('pendingApprovalsTableBody');
  const pendingApprovalsShowingText = document.getElementById('pendingApprovalsShowingText');
  const pendingApprovalsPrevPage = document.getElementById('pendingApprovalsPrevPage');
  const pendingApprovalsNextPage = document.getElementById('pendingApprovalsNextPage');
  const pendingApprovalsCurrentPageInfo = document.getElementById('pendingApprovalsCurrentPageInfo');
  let pendingApprovalsData = [];
  let pendingApprovalsCurrentPage = 1;
  let pendingApprovalsTotalPages = 1;
  const pendingApprovalsPageSize = 4;

  function renderPendingApprovalsTable(items) {
    pendingApprovalsTableBody.innerHTML = '';
    if (!items.length) {
      pendingApprovalsTableBody.innerHTML = '<tr><td colspan="3" class="text-center text-warning">No pending users found</td></tr>';
    } else {
      items.forEach(user => {
        const name = (`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Unknown');
        const contact = user.phone ? user.phone : (user.email ? user.email : '');
        const role = user.role ? user.role.replace(/([A-Z])/g, ' $1').trim() : '';
        pendingApprovalsTableBody.innerHTML += `
          <tr data-user-id="${user._id}" style="vertical-align: middle;">
            <td style="padding: 12px 16px;">
              <div class="d-flex flex-column justify-content-center">
                <h6 class="mb-0 text-sm">${name}${contact ? ' - ' + contact : ''}</h6>
              </div>
            </td>
            <td style="padding: 12px 16px;">
              <p class="text-xs font-weight-bold mb-0">${role}</p>
            </td>
            <td class="align-middle text-center" style="padding: 12px 16px;">
              <button class="btn bg-gradient-success btn-sm me-2 approve-btn">
                <i class="fas fa-check me-1"></i> Approve
              </button>
              <button class="btn bg-gradient-danger btn-sm reject-btn">
                <i class="fas fa-times me-1"></i> Reject
              </button>
            </td>
          </tr>
        `;
      });
    }
  }
  function updatePendingApprovalsPaginationInfo(start, end, total) {
    if (pendingApprovalsShowingText) {
      pendingApprovalsShowingText.textContent = `Showing ${start} to ${end} of ${total} items`;
    }
  }
  function updatePendingApprovalsPaginationControls() {
    if (pendingApprovalsPrevPage) pendingApprovalsPrevPage.disabled = pendingApprovalsCurrentPage <= 1;
    if (pendingApprovalsNextPage) pendingApprovalsNextPage.disabled = pendingApprovalsCurrentPage >= pendingApprovalsTotalPages;
    if (pendingApprovalsCurrentPageInfo) pendingApprovalsCurrentPageInfo.textContent = `Page ${pendingApprovalsCurrentPage} of ${pendingApprovalsTotalPages}`;
  }
  function showPendingApprovalsPage(page) {
    pendingApprovalsCurrentPage = page;
    const total = pendingApprovalsData.length;
    pendingApprovalsTotalPages = Math.ceil(total / pendingApprovalsPageSize) || 1;
    const startIdx = (pendingApprovalsCurrentPage - 1) * pendingApprovalsPageSize;
    const endIdx = Math.min(startIdx + pendingApprovalsPageSize, total);
    renderPendingApprovalsTable(pendingApprovalsData.slice(startIdx, endIdx));
    updatePendingApprovalsPaginationInfo(total === 0 ? 0 : startIdx + 1, endIdx, total);
    updatePendingApprovalsPaginationControls();
    // Add event listeners for approve/reject
    Array.from(pendingApprovalsTableBody.querySelectorAll('.approve-btn')).forEach(btn => {
      btn.addEventListener('click', function() {
        const tr = btn.closest('tr');
        const userId = tr.getAttribute('data-user-id');
        fetch(API_BASE_URL + '/api/users/${userId}/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active' })
        })
          .then(() => fetchAndRenderPendingApprovals());
      });
    });
    Array.from(pendingApprovalsTableBody.querySelectorAll('.reject-btn')).forEach(btn => {
      btn.addEventListener('click', function() {
        const tr = btn.closest('tr');
        const userId = tr.getAttribute('data-user-id');
        fetch(API_BASE_URL + '/api/users/${userId}/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'rejected' })
        })
          .then(() => {
            fetchAndRenderPendingApprovals();
            if (typeof fetchAndRenderRejectedUsers === 'function') fetchAndRenderRejectedUsers();
          });
      });
    });
  }
  function fetchAndRenderPendingApprovals() {
    fetch(API_BASE_URL + '/api/users/pending')
      .then(res => res.json())
      .then(data => {
        pendingApprovalsData = data.users || [];
        showPendingApprovalsPage(1);
      })
      .catch(() => {
        pendingApprovalsData = [];
        showPendingApprovalsPage(1);
      });
  }
  if (pendingApprovalsTableBody && pendingApprovalsShowingText && pendingApprovalsPrevPage && pendingApprovalsNextPage && pendingApprovalsCurrentPageInfo) {
    fetchAndRenderPendingApprovals();
    pendingApprovalsPrevPage.addEventListener('click', function() {
      if (pendingApprovalsCurrentPage > 1) showPendingApprovalsPage(pendingApprovalsCurrentPage - 1);
    });
    pendingApprovalsNextPage.addEventListener('click', function() {
      if (pendingApprovalsCurrentPage < pendingApprovalsTotalPages) showPendingApprovalsPage(pendingApprovalsCurrentPage + 1);
    });
  }
  // --- Rejected Users Pagination ---
  const rejectedUsersTableBody = document.getElementById('rejectedUsersTableBody');
  const rejectedUsersShowingText = document.getElementById('rejectedUsersShowingText');
  const rejectedUsersPrevPage = document.getElementById('rejectedUsersPrevPage');
  const rejectedUsersNextPage = document.getElementById('rejectedUsersNextPage');
  const rejectedUsersCurrentPageInfo = document.getElementById('rejectedUsersCurrentPageInfo');
  let rejectedUsersData = [];
  let rejectedUsersCurrentPage = 1;
  let rejectedUsersTotalPages = 1;
  const rejectedUsersPageSize = 4;

  function renderRejectedUsersTable(items) {
    rejectedUsersTableBody.innerHTML = '';
    if (!items.length) {
      rejectedUsersTableBody.innerHTML = '<tr><td colspan="3" class="text-center text-warning">No rejected users found</td></tr>';
    } else {
      items.forEach(user => {
        const name = (`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Unknown');
        const contact = user.phone ? user.phone : (user.email ? user.email : '');
        const role = user.role ? user.role.replace(/([A-Z])/g, ' $1').trim() : '';
        rejectedUsersTableBody.innerHTML += `
          <tr style="vertical-align: middle;">
            <td style="padding: 12px 16px;">
              <div class="d-flex flex-column justify-content-center">
                <h6 class="mb-0 text-sm">${name}${contact ? ' - ' + contact : ''}</h6>
              </div>
            </td>
            <td style="padding: 12px 16px;">
              <p class="text-xs font-weight-bold mb-0">${role}</p>
            </td>
            <td class="align-middle text-center" style="padding: 12px 16px;">
              <button class="btn btn-link text-secondary mb-0 edit-rejected-user-btn" title="Edit" data-user-id="${user._id}">
                <i class="fa fa-edit text-xs"></i>
              </button>
              <button class="btn btn-link text-danger mb-0 delete-rejected-user-btn" title="Delete" data-user-id="${user._id}" data-bs-toggle="modal" data-bs-target="#deleteRejectedUserModal">
                <i class="fa fa-trash text-xs"></i>
              </button>
            </td>
          </tr>
        `;
      });
    }
  }
  function updateRejectedUsersPaginationInfo(start, end, total) {
    if (rejectedUsersShowingText) {
      rejectedUsersShowingText.textContent = `Showing ${start} to ${end} of ${total} items`;
    }
  }
  function updateRejectedUsersPaginationControls() {
    if (rejectedUsersPrevPage) rejectedUsersPrevPage.disabled = rejectedUsersCurrentPage <= 1;
    if (rejectedUsersNextPage) rejectedUsersNextPage.disabled = rejectedUsersCurrentPage >= rejectedUsersTotalPages;
    if (rejectedUsersCurrentPageInfo) rejectedUsersCurrentPageInfo.textContent = `Page ${rejectedUsersCurrentPage} of ${rejectedUsersTotalPages}`;
  }
  function showRejectedUsersPage(page) {
    rejectedUsersCurrentPage = page;
    const total = rejectedUsersData.length;
    rejectedUsersTotalPages = Math.ceil(total / rejectedUsersPageSize) || 1;
    const startIdx = (rejectedUsersCurrentPage - 1) * rejectedUsersPageSize;
    const endIdx = Math.min(startIdx + rejectedUsersPageSize, total);
    renderRejectedUsersTable(rejectedUsersData.slice(startIdx, endIdx));
    updateRejectedUsersPaginationInfo(total === 0 ? 0 : startIdx + 1, endIdx, total);
    updateRejectedUsersPaginationControls();
  }
  function fetchAndRenderRejectedUsers() {
    fetch(API_BASE_URL + '/api/users/rejected')
      .then(res => res.json())
      .then(data => {
        rejectedUsersData = data.users || [];
        showRejectedUsersPage(1);
      })
      .catch(() => {
        rejectedUsersData = [];
        showRejectedUsersPage(1);
      });
  }
  if (rejectedUsersTableBody && rejectedUsersShowingText && rejectedUsersPrevPage && rejectedUsersNextPage && rejectedUsersCurrentPageInfo) {
    fetchAndRenderRejectedUsers();
    rejectedUsersPrevPage.addEventListener('click', function() {
      if (rejectedUsersCurrentPage > 1) showRejectedUsersPage(rejectedUsersCurrentPage - 1);
    });
    rejectedUsersNextPage.addEventListener('click', function() {
      if (rejectedUsersCurrentPage < rejectedUsersTotalPages) showRejectedUsersPage(rejectedUsersCurrentPage + 1);
    });
  }
  // Render Pending Approvals Table
  function refreshPendingAndActiveUsers() {
    // Refresh pending users
    if (pendingApprovalsTableBody) {
      fetch(API_BASE_URL + '/api/users/pending')
        .then(res => res.json())
        .then(data => {
          const users = data.users || [];
          pendingApprovalsTableBody.innerHTML = '';
          if (!users.length) {
            pendingApprovalsTableBody.innerHTML = '<tr><td colspan="3" class="text-center text-warning">No pending users found</td></tr>';
          } else {
            users.forEach(user => {
              const name = (`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Unknown');
              const contact = user.phone ? user.phone : (user.email ? user.email : '');
              const role = user.role ? user.role.replace(/([A-Z])/g, ' $1').trim() : '';
              pendingApprovalsTableBody.innerHTML += `
                <tr data-user-id="${user._id}">
                  <td>
                    <div class="d-flex px-2 py-1">
                      <div class="d-flex flex-column justify-content-center">
                        <h6 class="mb-0 text-sm">${name}${contact ? ' - ' + contact : ''}</h6>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p class="text-xs font-weight-bold mb-0">${role}</p>
                  </td>
                  <td class="align-middle text-center">
                    <button class="btn bg-gradient-success btn-sm me-2 approve-btn">
                      <i class="fas fa-check me-1"></i> Approve
                    </button>
                    <button class="btn bg-gradient-danger btn-sm reject-btn">
                      <i class="fas fa-times me-1"></i> Reject
                    </button>
                  </td>
                </tr>
              `;
            });
          }
          // Add event listeners for approve/reject
          Array.from(pendingApprovalsTableBody.querySelectorAll('.approve-btn')).forEach(btn => {
            btn.addEventListener('click', function() {
              const tr = btn.closest('tr');
              const userId = tr.getAttribute('data-user-id');
              fetch(API_BASE_URL + '/api/users/${userId}/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'active' })
              })
                .then(() => refreshPendingAndActiveUsers());
            });
          });
          Array.from(pendingApprovalsTableBody.querySelectorAll('.reject-btn')).forEach(btn => {
            btn.addEventListener('click', function() {
              const tr = btn.closest('tr');
              const userId = tr.getAttribute('data-user-id');
              fetch(API_BASE_URL + '/api/users/${userId}/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected' })
              })
                .then(() => {
                  refreshPendingAndActiveUsers();
                  if (typeof fetchAndRenderRejectedUsers === 'function') fetchAndRenderRejectedUsers();
                });
            });
          });
        })
        .catch(() => {
          pendingApprovalsTableBody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Failed to load users</td></tr>';
        });
    }
    // Refresh active users
    // REMOVE legacy rendering logic for Active Users here
    if (typeof fetchAndRenderActiveUsers === 'function') fetchAndRenderActiveUsers();
    // Refresh counts
    const totalUsersElem = document.getElementById('totalUsersCount');
    if (totalUsersElem) {
      fetch(API_BASE_URL + '/api/users/count')
        .then(res => res.json())
        .then(data => {
          totalUsersElem.textContent = data.count !== undefined ? data.count.toLocaleString() : '--';
        })
        .catch(() => {
          totalUsersElem.textContent = '--';
        });
    }
    const pendingUsersElem = document.getElementById('pendingUsersCount');
    if (pendingUsersElem) {
      fetch(API_BASE_URL + '/api/users/pending-count')
        .then(res => res.json())
        .then(data => {
          pendingUsersElem.textContent = data.count !== undefined ? data.count.toLocaleString() : '--';
        })
        .catch(() => {
          pendingUsersElem.textContent = '--';
        });
    }
    const rejectedUsersElem = document.getElementById('rejectedUsersCount');
    if (rejectedUsersElem) {
      fetch(API_BASE_URL + '/api/users/rejected-count')
        .then(res => res.json())
        .then(data => {
          rejectedUsersElem.textContent = data.count !== undefined ? data.count.toLocaleString() : '--';
        })
        .catch(() => {
          rejectedUsersElem.textContent = '--';
        });
    }
  }
  refreshPendingAndActiveUsers();

  // Add New User Form Submission
  const addUserForm = document.getElementById('addUserForm');
  if (addUserForm) {
    addUserForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const fullName = document.getElementById('userFullName').value.trim();
      const contact = document.getElementById('userContact').value.trim();
      const email = document.getElementById('userEmail').value.trim();
      const password = document.getElementById('userPassword').value;
      const role = document.getElementById('userRole').value;
      const status = document.getElementById('userStatus').value;
      // Split full name into first and last
      let first_name = '', last_name = '', username = '';
      if (fullName.includes(' ')) {
        const parts = fullName.split(' ');
        first_name = parts[0];
        last_name = parts.slice(1).join(' ');
        username = fullName;
      } else {
        first_name = fullName;
        last_name = '';
        username = fullName;
      }
      const payload = {
        first_name,
        last_name,
        username,
        phone: contact,
        email,
        password,
        role,
        status
      };
      fetch(API_BASE_URL + '/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to add user');
          return res.json();
        })
        .then(() => {
          // Close modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
          if (modal) modal.hide();
          addUserForm.reset();
          // Refresh tables and counts
          if (typeof refreshPendingAndActiveUsers === 'function') refreshPendingAndActiveUsers();
        })
        .catch(() => {
          alert('Failed to add user. Please check your input and try again.');
        });
    });
  }

  // --- Edit/Delete logic for Active Users ---
  let userIdToDelete = null;
  let userIdToEdit = null;
  const deleteUserModal = document.getElementById('deleteUserModal');
  const confirmDeleteUserBtn = document.getElementById('confirmDeleteUserBtn');
  const editUserModal = document.getElementById('editUserModal');
  const editUserStatus = document.getElementById('editUserStatus');
  const saveEditUserBtn = document.getElementById('saveEditUserBtn');

  function attachActiveUsersActionListeners() {
    Array.from(document.querySelectorAll('.delete-user-btn')).forEach(btn => {
      btn.addEventListener('click', function() {
        userIdToDelete = btn.getAttribute('data-user-id');
      });
    });
    Array.from(document.querySelectorAll('.edit-user-btn')).forEach(btn => {
      btn.addEventListener('click', function() {
        userIdToEdit = null;
        const tr = btn.closest('tr');
        const idx = Array.from(tr.parentNode.children).indexOf(tr);
        // Find the user in the current page's data
        const filtered = getFilteredActiveUsers();
        const startIdx = (activeUsersCurrentPage - 1) * activeUsersPageSize;
        const user = filtered[startIdx + idx];
        if (user) {
          userIdToEdit = user._id;
          editUserStatus.value = user.status;
          const modal = new bootstrap.Modal(editUserModal);
          modal.show();
        }
      });
    });
  }

  if (saveEditUserBtn) {
    saveEditUserBtn.addEventListener('click', function() {
      if (userIdToEdit) {
        const newStatus = editUserStatus.value;
        fetch(API_BASE_URL + '/api/users/${userIdToEdit}/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        })
          .then(res => {
            if (!res.ok) throw new Error('Failed to update user');
            return res.json();
          })
          .then(() => {
            const modal = bootstrap.Modal.getInstance(editUserModal);
            if (modal) modal.hide();
            userIdToEdit = null;
            // Refresh all tables after status update
            if (typeof refreshPendingAndActiveUsers === 'function') refreshPendingAndActiveUsers();
            if (typeof fetchAndRenderRejectedUsers === 'function') fetchAndRenderRejectedUsers();
          })
          .catch(() => {
            alert('Failed to update user.');
          });
      }
    });
  }

  // Patch renderActiveUsersTable to attach listeners after rendering
  const originalRenderActiveUsersTable = renderActiveUsersTable;
  renderActiveUsersTable = function(items) {
    originalRenderActiveUsersTable(items);
    attachActiveUsersActionListeners();
  };

  // --- Delete Rejected User Logic ---
  let rejectedUserIdToDelete = null;
  const deleteRejectedUserModal = document.getElementById('deleteRejectedUserModal');
  const confirmDeleteRejectedUserBtn = document.getElementById('confirmDeleteRejectedUserBtn');
  let deleteRejectedUserModalInstance = null;
  if (deleteRejectedUserModal) {
    deleteRejectedUserModalInstance = new bootstrap.Modal(deleteRejectedUserModal);
    deleteRejectedUserModal.addEventListener('hidden.bs.modal', function () {
      rejectedUserIdToDelete = null;
    });
  }
  if (rejectedUsersTableBody) {
    rejectedUsersTableBody.addEventListener('click', function(e) {
      if (e.target.closest('.delete-rejected-user-btn')) {
        const btn = e.target.closest('.delete-rejected-user-btn');
        rejectedUserIdToDelete = btn.getAttribute('data-user-id');
        if (deleteRejectedUserModalInstance) {
          deleteRejectedUserModalInstance.show();
        }
      }
      // Optionally, handle Edit button here in the future
    });
  }
  if (confirmDeleteRejectedUserBtn) {
    confirmDeleteRejectedUserBtn.addEventListener('click', function() {
      if (rejectedUserIdToDelete) {
        fetch(API_BASE_URL + '/api/users/${rejectedUserIdToDelete}', {
          method: 'DELETE',
        })
          .then(res => res.json())
          .then(() => {
            // Hide modal
            if (deleteRejectedUserModalInstance) {
              deleteRejectedUserModalInstance.hide();
            }
            rejectedUserIdToDelete = null;
            // Refresh rejected users
            fetchAndRenderRejectedUsers();
          });
      }
    });
  }
  // --- Edit logic for Rejected Users ---
  let rejectedUserIdToEdit = null;
  if (rejectedUsersTableBody) {
    rejectedUsersTableBody.addEventListener('click', function(e) {
      if (e.target.closest('.edit-rejected-user-btn')) {
        const btn = e.target.closest('.edit-rejected-user-btn');
        const userId = btn.getAttribute('data-user-id');
        // Find the user in the current page's data
        const startIdx = (rejectedUsersCurrentPage - 1) * rejectedUsersPageSize;
        const idx = Array.from(btn.closest('tr').parentNode.children).indexOf(btn.closest('tr'));
        const user = rejectedUsersData[startIdx + idx];
        if (user) {
          rejectedUserIdToEdit = user._id;
          editUserStatus.value = user.status;
          const modal = new bootstrap.Modal(editUserModal);
          modal.show();
        }
      }
    });
  }
  if (saveEditUserBtn) {
    saveEditUserBtn.addEventListener('click', function() {
      if (rejectedUserIdToEdit) {
        const newStatus = editUserStatus.value;
        fetch(API_BASE_URL + '/api/users/${rejectedUserIdToEdit}/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        })
          .then(res => {
            if (!res.ok) throw new Error('Failed to update user');
            return res.json();
          })
          .then(() => {
            const modal = bootstrap.Modal.getInstance(editUserModal);
            if (modal) modal.hide();
            rejectedUserIdToEdit = null;
            // Refresh all tables after status update
            if (typeof refreshPendingAndActiveUsers === 'function') refreshPendingAndActiveUsers();
            if (typeof fetchAndRenderRejectedUsers === 'function') fetchAndRenderRejectedUsers();
          })
          .catch(() => {
            alert('Failed to update user.');
          });
      }
    });
  }
});
