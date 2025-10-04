window.addEventListener('DOMContentLoaded', async () => {
  const valueElem = document.getElementById('monthlySalesCostValue');
  const changeElem = document.getElementById('monthlySalesCostChange');
  if (!valueElem) return;
  try {
    const res = await fetch(API_BASE_URL + '/api/sales/monthly-totals');
    const data = await res.json();
    const months = data.months || [];
    if (!months.length) {
      valueElem.textContent = 'shs:';
      if (changeElem) changeElem.innerHTML = '';
      return;
    }
    // Get the latest month (should be the current month if sorted)
    const latest = months[months.length - 1];
    const value = latest.total || 0;
    valueElem.textContent = 'shs:' + value.toLocaleString();
    // Calculate percentage change from previous month
    if (changeElem) {
      if (months.length < 2) {
        changeElem.innerHTML = '<span class="text-secondary">No previous month</span>';
      } else {
        const prev = months[months.length - 2].total || 0;
        let percent = 0;
        if (prev > 0) {
          percent = ((value - prev) / prev) * 100;
        } else if (value > 0) {
          percent = 100;
        }
        const rounded = Math.abs(percent).toFixed(1);
        if (percent > 0) {
          changeElem.className = 'text-sm text-success mb-0';
          changeElem.innerHTML = `<i class="fas fa-arrow-up"></i> +${rounded}% this month`;
        } else if (percent < 0) {
          changeElem.className = 'text-sm text-danger mb-0';
          changeElem.innerHTML = `<i class="fas fa-arrow-down"></i> -${rounded}% this month`;
        } else {
          changeElem.className = 'text-sm text-secondary mb-0';
          changeElem.innerHTML = `<i class="fas fa-minus"></i> 0% this month`;
        }
      }
    }
  } catch (err) {
    valueElem.textContent = 'N/A';
    if (changeElem) changeElem.innerHTML = '';
    console.error('Error fetching monthly sales cost:', err);
  }

  // Inventory Cost logic
  const invValueElem = document.getElementById('monthlyInventoryCostValue');
  const invChangeElem = document.getElementById('monthlyInventoryCostChange');
  if (invValueElem) {
    try {
      // Get current month
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const currMonth = `${year}-${month}`;
      // Fetch current month cost and percent change from backend
      const currRes = await fetch(API_BASE_URL + `/api/inventory/monthly-cost?month=${currMonth}`);
      const currData = await currRes.json();
      const currValue = currData.totalCost || 0;
      const percent = currData.percentChange || 0;
      invValueElem.textContent = 'shs:' + currValue.toLocaleString();
      // Use backend percentChange for display
      if (invChangeElem) {
        const rounded = Math.abs(percent).toFixed(1);
        if (percent > 0) {
          invChangeElem.className = 'text-sm text-success mb-0';
          invChangeElem.innerHTML = `<i class="fas fa-arrow-up"></i> +${rounded}% this month`;
        } else if (percent < 0) {
          invChangeElem.className = 'text-sm text-danger mb-0';
          invChangeElem.innerHTML = `<i class="fas fa-arrow-down"></i> -${rounded}% this month`;
        } else {
          invChangeElem.className = 'text-sm text-secondary mb-0';
          invChangeElem.innerHTML = `<i class="fas fa-minus"></i> 0% this month`;
        }
      }
    } catch (err) {
      invValueElem.textContent = 'N/A';
      if (invChangeElem) invChangeElem.innerHTML = '';
      console.error('Error fetching monthly inventory cost:', err);
    }
  }

  // Credit Cost logic
  const creditCostElem = document.getElementById('creditCostValue');
  if (creditCostElem) {
    try {
      const res = await fetch(API_BASE_URL + '/api/credit-customers/total-outstanding');
      const data = await res.json();
      const value = data.totalOutstanding || 0;
      creditCostElem.textContent = 'shs:' + value.toLocaleString();
    } catch (err) {
      creditCostElem.textContent = 'N/A';
      console.error('Error fetching credit cost:', err);
    }
  }

  // --- Inventory Cost Details Modal Logic ---
  const inventoryCostMonthLabel = document.getElementById('inventoryCostMonthLabel');
  const inventoryCostMonthPrev = document.getElementById('inventoryCostMonthPrev');
  const inventoryCostMonthNext = document.getElementById('inventoryCostMonthNext');
  const inventoryCostDetailsTableBody = document.getElementById('inventoryCostDetailsTableBody');
  const inventoryCostShowingText = document.getElementById('inventoryCostShowingText');
  const inventoryCostCurrentPageInfo = document.getElementById('inventoryCostCurrentPageInfo');
  const inventoryCostPrevPage = document.getElementById('inventoryCostPrevPage');
  const inventoryCostNextPage = document.getElementById('inventoryCostNextPage');

  let inventoryCostDetailsData = [];
  let inventoryCostCurrentPage = 1;
  const inventoryCostPageSize = 4;

  function formatCurrency(val) {
    return 'shs:' + (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function renderInventoryCostTablePage() {
    if (!inventoryCostDetailsData.length) {
      inventoryCostDetailsTableBody.innerHTML = '<tr><td colspan="3" class="text-center text-secondary">No records found.</td></tr>';
      inventoryCostShowingText.textContent = 'Showing 0 of 0 items';
      inventoryCostCurrentPageInfo.textContent = 'Page 0 of 0';
      return;
    }
    const startIdx = (inventoryCostCurrentPage - 1) * inventoryCostPageSize;
    const endIdx = Math.min(startIdx + inventoryCostPageSize, inventoryCostDetailsData.length);
    const pageData = inventoryCostDetailsData.slice(startIdx, endIdx);
    inventoryCostDetailsTableBody.innerHTML = pageData.map(row =>
      `<tr><td>${row.itemName}</td><td>${row.quantity}</td><td>${formatCurrency(row.cost)}</td></tr>`
    ).join('');
    inventoryCostShowingText.textContent = `Showing ${startIdx + 1} to ${endIdx} of ${inventoryCostDetailsData.length} items`;
    const totalPages = Math.ceil(inventoryCostDetailsData.length / inventoryCostPageSize) || 1;
    inventoryCostCurrentPageInfo.textContent = `Page ${inventoryCostCurrentPage} of ${totalPages}`;
    inventoryCostPrevPage.disabled = inventoryCostCurrentPage === 1;
    inventoryCostNextPage.disabled = inventoryCostCurrentPage === totalPages;
  }

  async function fetchInventoryCostDetails(monthStr) {
    try {
      const res = await fetch(API_BASE_URL + `/api/inventory/monthly-cost-details?month=${monthStr}`);
      const data = await res.json();
      inventoryCostDetailsData = data.details || [];
      inventoryCostCurrentPage = 1;
      renderInventoryCostTablePage();
    } catch (err) {
      inventoryCostDetailsTableBody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Failed to load data.</td></tr>';
      inventoryCostShowingText.textContent = 'Showing 0 of 0 items';
      inventoryCostCurrentPageInfo.textContent = 'Page 0 of 0';
    }
  }

  let inventoryCostMonth = null;

  function updateInventoryCostMonthLabel() {
    const date = new Date(inventoryCostMonth + '-01');
    const monthName = date.toLocaleString('default', { month: 'long' });
    inventoryCostMonthLabel.textContent = `${monthName} ${date.getFullYear()}`;
  }

  function changeInventoryCostMonth(delta) {
    const [year, month] = inventoryCostMonth.split('-').map(Number);
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 1) { newMonth = 12; newYear--; }
    if (newMonth > 12) { newMonth = 1; newYear++; }
    inventoryCostMonth = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    updateInventoryCostMonthLabel();
    fetchInventoryCostDetails(inventoryCostMonth);
  }

  if (inventoryCostMonthLabel && inventoryCostMonthPrev && inventoryCostMonthNext) {
    // Set default to current month
    const now = new Date();
    inventoryCostMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    updateInventoryCostMonthLabel();
    // Modal show event
    const modal = document.getElementById('inventoryCostDetailsModal');
    if (modal) {
      modal.addEventListener('show.bs.modal', () => {
        updateInventoryCostMonthLabel();
        fetchInventoryCostDetails(inventoryCostMonth);
      });
    }
    inventoryCostMonthPrev.addEventListener('click', () => changeInventoryCostMonth(-1));
    inventoryCostMonthNext.addEventListener('click', () => changeInventoryCostMonth(1));
  }

  // Add event listeners for Inventory Cost Details pagination
  if (inventoryCostPrevPage) {
    inventoryCostPrevPage.addEventListener('click', function () {
      if (inventoryCostCurrentPage > 1) {
        inventoryCostCurrentPage--;
        renderInventoryCostTablePage();
      }
    });
  }
  if (inventoryCostNextPage) {
    inventoryCostNextPage.addEventListener('click', function () {
      const totalPages = Math.ceil(inventoryCostDetailsData.length / inventoryCostPageSize) || 1;
      if (inventoryCostCurrentPage < totalPages) {
        inventoryCostCurrentPage++;
        renderInventoryCostTablePage();
      }
    });
  }

  // Sales over last 7 days bar graph
  const salesChartElem = document.getElementById('sales-chart');
  if (salesChartElem) {
    fetch(API_BASE_URL + '/api/sales/daily-totals?days=7')
      .then(res => res.json())
      .then(data => {
        const daysArr = data.days || [];
        const daysSorted = daysArr.slice().reverse();
        const labels = daysSorted.map(d => d.date.slice(5)); // MM-DD
        const values = daysSorted.map(d => d.total);
        if (window.dashboardSalesChart) window.dashboardSalesChart.destroy();
        window.dashboardSalesChart = new Chart(salesChartElem.getContext('2d'), {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Sales',
              data: values,
              backgroundColor: 'rgba(26, 115, 232, 0.8)',
              borderColor: 'rgba(26, 115, 232, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return 'shs:' + value.toLocaleString();
                  }
                }
              }
            },
            plugins: {
              legend: { display: false }
            }
          }
        });
      })
      .catch(() => {
        if (window.dashboardSalesChart) window.dashboardSalesChart.destroy();
      });
  }

  // Low Stock Items logic
  let allLowStockItems = [];
  const lowStockTable = document.querySelector('.col-lg-4 .table tbody');
  const lowStockModal = document.getElementById('lowStockModal');
  const lowStockModalTable = lowStockModal ? lowStockModal.querySelector('tbody') : null;
  const lowStockAlertBadge = document.getElementById('lowStockAlertBadge');
  if (lowStockTable) {
    fetch(API_BASE_URL + '/api/items/stock-table')
      .then(res => res.json())
      .then(data => {
        allLowStockItems = (data.items || []).filter(item => {
          const minStock = (typeof item.minimum_stock === 'number') ? item.minimum_stock : 0;
          return item.currentStock === 0 || item.currentStock <= minStock;
        });
        // Show only first 3 in card
        const items = allLowStockItems.slice(0, 3);
        lowStockTable.innerHTML = '';
        if (!items.length) {
          lowStockTable.innerHTML = '<tr><td colspan="2" class="text-center text-muted">No low stock items</td></tr>';
        } else {
          items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>
                <div class="d-flex px-2 py-1">
                  <div class="d-flex flex-column justify-content-center">
                    <h6 class="mb-0 text-sm">${item.name}</h6>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge badge-sm bg-gradient-danger">${item.currentStock} units</span>
              </td>
            `;
            lowStockTable.appendChild(tr);
          });
        }
        // Update Low Stock Alert badge
        if (lowStockAlertBadge) {
          lowStockAlertBadge.textContent = allLowStockItems.length;
        }
      })
      .catch(() => {
        lowStockTable.innerHTML = '<tr><td colspan="2" class="text-center text-danger">Error loading data</td></tr>';
        if (lowStockAlertBadge) {
          lowStockAlertBadge.textContent = '--';
        }
      });
  }
  // Populate modal with all low stock items when opened
  if (lowStockModal && lowStockModalTable) {
    lowStockModal.addEventListener('show.bs.modal', () => {
      lowStockModalTable.innerHTML = '';
      if (!allLowStockItems.length) {
        lowStockModalTable.innerHTML = '<tr><td colspan="2" class="text-center text-muted">No low stock items</td></tr>';
        return;
      }
      allLowStockItems.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div class="d-flex px-2 py-1">
              <div class="d-flex flex-column justify-content-center">
                <h6 class="mb-0 text-sm">${item.name}</h6>
              </div>
            </div>
          </td>
          <td>
            <span class="badge badge-sm bg-gradient-danger">${item.currentStock} units</span>
          </td>
        `;
        lowStockModalTable.appendChild(tr);
      });
    });
  }

  // Credit Alert (Overdue payments) logic
  const creditAlertBadge = document.getElementById('creditAlertBadge');
  if (creditAlertBadge) {
    fetch(API_BASE_URL + '/api/customer-credit-accounts')
      .then(res => res.json())
      .then(data => {
        const overdueCount = (data || []).filter(c => (c.balance || 0) > 0 && c.status === 'Overdue').length;
        creditAlertBadge.textContent = overdueCount;
      })
      .catch(() => {
        creditAlertBadge.textContent = '--';
      });
  }

  // Requested Product (New requests) logic
  const requestedProductBadge = document.getElementById('requestedProductBadge');
  if (requestedProductBadge) {
    fetch(API_BASE_URL + '/api/commodity-requests/status-summary')
      .then(res => res.json())
      .then(summary => {
        requestedProductBadge.textContent = summary.pending !== undefined ? summary.pending : '--';
      })
      .catch(() => {
        requestedProductBadge.textContent = '--';
      });
  }

  // --- Expiring Products Logic ---
  const expiringProductsTableBody = document.getElementById('expiringProductsTableBody');
  const expiringProductsRangeDropdown = document.getElementById('expiringProductsRangeDropdown');
  const expiringProductsRangeBtn = document.getElementById('expiringProductsRangeBtn');
  const expiringProductsShowingText = document.getElementById('expiringProductsShowingText');
  const expiringProductsPrevPage = document.getElementById('expiringProductsPrevPage');
  const expiringProductsNextPage = document.getElementById('expiringProductsNextPage');
  const expiringProductsCurrentPageInfo = document.getElementById('expiringProductsCurrentPageInfo');
  let expiringProductsMonths = 2;
  let expiringProductsData = [];
  let expiringProductsPage = 1;
  const expiringProductsPageSize = 4;

  function renderExpiringProductsTable() {
    const startIdx = (expiringProductsPage - 1) * expiringProductsPageSize;
    const endIdx = startIdx + expiringProductsPageSize;
    const pageItems = expiringProductsData.slice(startIdx, endIdx);
    expiringProductsTableBody.innerHTML = '';
    if (!pageItems.length) {
      expiringProductsTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">No expiring products in this range.</td></tr>';
    } else {
      pageItems.forEach(item => {
        const dateStr = item.expiry_date ? new Date(item.expiry_date).toISOString().slice(0, 10) : '';
        const totalStr = 'shs:' + (item.total || 0).toLocaleString();
        expiringProductsTableBody.innerHTML += `<tr><td>${dateStr}</td><td>${item.name}</td><td>${item.total_quantity || 0}</td><td>${totalStr}</td></tr>`;
      });
    }
    // Update showing text and page info
    const total = expiringProductsData.length;
    const showingStart = total === 0 ? 0 : startIdx + 1;
    const showingEnd = Math.min(endIdx, total);
    if (expiringProductsShowingText) {
      expiringProductsShowingText.textContent = `Showing ${showingStart} to ${showingEnd} of ${total} items`;
    }
    const totalPages = Math.max(1, Math.ceil(total / expiringProductsPageSize));
    if (expiringProductsCurrentPageInfo) {
      expiringProductsCurrentPageInfo.textContent = `Page ${expiringProductsPage} of ${totalPages}`;
    }
    if (expiringProductsPrevPage) expiringProductsPrevPage.disabled = expiringProductsPage <= 1;
    if (expiringProductsNextPage) expiringProductsNextPage.disabled = expiringProductsPage >= totalPages;
  }

  function fetchAndRenderExpiringProducts(months = 2) {
    fetch(API_BASE_URL + `/api/items/expiring?months=${months}`)
      .then(res => res.json())
      .then(data => {
        expiringProductsData = data.items || [];
        expiringProductsPage = 1;
        renderExpiringProductsTable();
      })
      .catch(() => {
        expiringProductsData = [];
        expiringProductsPage = 1;
        renderExpiringProductsTable();
      });
  }

  if (expiringProductsTableBody && expiringProductsRangeDropdown && expiringProductsRangeBtn) {
    fetchAndRenderExpiringProducts(expiringProductsMonths);
    expiringProductsRangeDropdown.querySelectorAll('.expiring-range-option').forEach(opt => {
      opt.addEventListener('click', e => {
        e.preventDefault();
        const months = parseInt(opt.getAttribute('data-months'), 10);
        if (!isNaN(months)) {
          expiringProductsMonths = months;
          expiringProductsRangeBtn.textContent = `${months} Month${months > 1 ? 's' : ''}`;
          fetchAndRenderExpiringProducts(months);
        }
      });
    });
    if (expiringProductsPrevPage) {
      expiringProductsPrevPage.addEventListener('click', () => {
        if (expiringProductsPage > 1) {
          expiringProductsPage--;
          renderExpiringProductsTable();
        }
      });
    }
    if (expiringProductsNextPage) {
      expiringProductsNextPage.addEventListener('click', () => {
        const totalPages = Math.max(1, Math.ceil(expiringProductsData.length / expiringProductsPageSize));
        if (expiringProductsPage < totalPages) {
          expiringProductsPage++;
          renderExpiringProductsTable();
        }
      });
    }
  }
});
