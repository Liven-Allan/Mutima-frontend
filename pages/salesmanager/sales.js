// Fetch and display today's sales total
function fetchTodaysSalesTotal() {
  fetch('http://localhost:5000/api/sales/today-total')
    .then(res => res.json())
    .then(data => {
      const value = typeof data.total === 'number' ? data.total : 0;
      document.getElementById('todaysSalesValue').textContent = `shs:${value.toLocaleString()}`;
    })
    .catch(() => {
      document.getElementById('todaysSalesValue').textContent = 'shs:';
    });
}

// Fetch and display today's customer count
function fetchCustomersToday() {
  fetch('http://localhost:5000/api/sales/today-customers')
    .then(res => res.json())
    .then(data => {
      const value = typeof data.count === 'number' ? data.count : 0;
      document.getElementById('customersTodayValue').textContent = value.toLocaleString();
    })
    .catch(() => {
      document.getElementById('customersTodayValue').textContent = '0';
    });
}

// Fetch and display today's profits
function fetchTodaysProfits() {
  fetch('http://localhost:5000/api/sales/today-profits')
    .then(res => res.json())
    .then(data => {
      const value = typeof data.profit === 'number' ? data.profit : 0;
      document.getElementById('todaysProfitsValue').textContent = `shs:${value.toLocaleString()}`;
    })
    .catch(() => {
      document.getElementById('todaysProfitsValue').textContent = 'shs:';
    });
}

// --- Today's Profit Report Modal Logic ---
function setProfitReportDateToToday() {
  const input = document.getElementById('profitReportDate');
  if (input) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    input.value = `${yyyy}-${mm}-${dd}`;
  }
}

// --- Profit Report Pagination ---
const profitReportRecordsPerPage = 4;
let profitReportCurrentPage = 1;
let profitReportTotalPages = 1;
let profitReportCache = [];

function renderProfitReportTable(items) {
  const tbody = document.getElementById('profitReportTableBody');
  tbody.innerHTML = '';
  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No data</td></tr>';
    updateProfitReportPaginationInfo(0, 0, 0);
    updateProfitReportPaginationControls();
    return;
  }
  items.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.product}</td>
      <td>${row.quantity}</td>
      <td>shs:${Number(row.buyingPrice).toFixed(2)}</td>
      <td>shs:${Number(row.sellingPrice).toFixed(2)}</td>
      <td>shs:${Number(row.totalCost).toFixed(2)}</td>
      <td>shs:${Number(row.totalRevenue).toFixed(2)}</td>
      <td>shs:${Number(row.profit).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}
function updateProfitReportPaginationInfo(start, end, total) {
  document.getElementById('profitReportShowingText').textContent = `Showing ${start} to ${end} of ${total} items`;
}
function updateProfitReportPaginationControls() {
  document.getElementById('profitReportPrevPage').disabled = profitReportCurrentPage <= 1;
  document.getElementById('profitReportNextPage').disabled = profitReportCurrentPage >= profitReportTotalPages;
  document.getElementById('profitReportCurrentPageInfo').textContent = `Page ${profitReportCurrentPage} of ${profitReportTotalPages}`;
}
function showProfitReportPage(page) {
  profitReportCurrentPage = page;
  const total = profitReportCache.length;
  profitReportTotalPages = Math.ceil(total / profitReportRecordsPerPage) || 1;
  const startIdx = (profitReportCurrentPage - 1) * profitReportRecordsPerPage;
  const endIdx = Math.min(startIdx + profitReportRecordsPerPage, total);
  renderProfitReportTable(profitReportCache.slice(startIdx, endIdx));
  updateProfitReportPaginationInfo(startIdx + 1, endIdx, total);
  updateProfitReportPaginationControls();
}
document.getElementById('profitReportPrevPage').addEventListener('click', function() {
  if (profitReportCurrentPage > 1) showProfitReportPage(profitReportCurrentPage - 1);
});
document.getElementById('profitReportNextPage').addEventListener('click', function() {
  if (profitReportCurrentPage < profitReportTotalPages) showProfitReportPage(profitReportCurrentPage + 1);
});
// Patch fetchProfitReport to use pagination
function fetchProfitReport(dateStr) {
  fetch(`http://localhost:5000/api/sales/profit-report?date=${dateStr}`)
    .then(res => res.json())
    .then(data => {
      profitReportCache = data.items || [];
      profitReportCurrentPage = 1;
      profitReportTotalPages = Math.ceil(profitReportCache.length / profitReportRecordsPerPage) || 1;
      showProfitReportPage(1);
      document.getElementById('profitReportTotalCost').textContent = `shs:${Number(data.totalCost || 0).toFixed(2)}`;
      document.getElementById('profitReportTotalRevenue').textContent = `shs:${Number(data.totalRevenue || 0).toFixed(2)}`;
      document.getElementById('profitReportProfit').textContent = `shs:${Number(data.profit || 0).toFixed(2)}`;
    })
    .catch(() => {
      profitReportCache = [];
      renderProfitReportTable([]);
      updateProfitReportPaginationInfo(0, 0, 0);
      updateProfitReportPaginationControls();
      document.getElementById('profitReportTotalCost').textContent = 'shs:';
      document.getElementById('profitReportTotalRevenue').textContent = 'shs:';
      document.getElementById('profitReportProfit').textContent = 'shs:';
    });
}

// On modal show, set date and fetch data
document.getElementById('todaysProfitModal').addEventListener('show.bs.modal', function() {
  setProfitReportDateToToday();
  const input = document.getElementById('profitReportDate');
  if (input) fetchProfitReport(input.value);
});
// On date change, fetch new data
document.getElementById('profitReportDate').addEventListener('change', function() {
  fetchProfitReport(this.value);
});

// --- Customers Today Modal Logic ---
let customersTodayData = [];
let customersTodayCurrentPage = 1;
const customersTodayPageSize = 4;
let customersTodayTotalPages = 1;

function setCustomersTodayDateToToday() {
  const input = document.getElementById('customersTodayDate');
  if (input) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    input.value = `${yyyy}-${mm}-${dd}`;
  }
}

function updateCustomersTodayPaginationInfo(start, end, total) {
  document.getElementById('customersTodayShowingText').textContent = `Showing ${start} to ${end} of ${total} items`;
}
function updateCustomersTodayPaginationControls() {
  document.getElementById('customersTodayPrevPage').disabled = customersTodayCurrentPage <= 1;
  document.getElementById('customersTodayNextPage').disabled = customersTodayCurrentPage >= customersTodayTotalPages;
  document.getElementById('customersTodayCurrentPageInfo').textContent = `Page ${customersTodayCurrentPage} of ${customersTodayTotalPages}`;
}
function showCustomersTodayPage(page) {
  customersTodayCurrentPage = page;
  const total = customersTodayData.length;
  customersTodayTotalPages = Math.ceil(total / customersTodayPageSize) || 1;
  const startIdx = (customersTodayCurrentPage - 1) * customersTodayPageSize;
  const endIdx = Math.min(startIdx + customersTodayPageSize, total);
  renderCustomersTodayTablePage(startIdx, endIdx);
  updateCustomersTodayPaginationInfo(startIdx + 1, endIdx, total);
  updateCustomersTodayPaginationControls();
}
document.getElementById('customersTodayPrevPage').addEventListener('click', function() {
  if (customersTodayCurrentPage > 1) showCustomersTodayPage(customersTodayCurrentPage - 1);
});
document.getElementById('customersTodayNextPage').addEventListener('click', function() {
  if (customersTodayCurrentPage < customersTodayTotalPages) showCustomersTodayPage(customersTodayCurrentPage + 1);
});
function renderCustomersTodayTablePage(startIdx, endIdx) {
  const tbody = document.getElementById('customersTodayTableBody');
  tbody.innerHTML = '';
  const pageData = customersTodayData.slice(startIdx, endIdx);
  pageData.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.name}</td>
      <td>shs${Number(row.amount).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
  if (customersTodayData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">No data</td></tr>';
  }
}
function fetchCustomersTodayReport(dateStr) {
  fetch(`http://localhost:5000/api/sales/customers-report?date=${dateStr}`)
    .then(res => res.json())
    .then(data => {
      customersTodayData = data.customers || [];
      customersTodayCurrentPage = 1;
      customersTodayTotalPages = Math.ceil(customersTodayData.length / customersTodayPageSize) || 1;
      showCustomersTodayPage(1);
    })
    .catch(() => {
      customersTodayData = [];
      customersTodayCurrentPage = 1;
      customersTodayTotalPages = 1;
      showCustomersTodayPage(1);
    });
}
// On modal show, set date and fetch data
document.getElementById('customersTodayModal').addEventListener('show.bs.modal', function() {
  setCustomersTodayDateToToday();
  const input = document.getElementById('customersTodayDate');
  if (input) fetchCustomersTodayReport(input.value);
});
// On date change, fetch new data
document.getElementById('customersTodayDate').addEventListener('change', function() {
  fetchCustomersTodayReport(this.value);
});

// --- Today's Sales Report Modal Logic ---
const salesReportPageSize = 4;
let salesReportCurrentPage = 1;
let salesReportTotalPages = 1;
let salesReportCache = [];

function setSalesReportDateToToday() {
  const input = document.getElementById('salesReportDate');
  if (input) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    input.value = `${yyyy}-${mm}-${dd}`;
  }
}

function updateSalesReportPaginationInfo(start, end, total) {
  document.getElementById('salesReportShowingText').textContent = `Showing ${start} to ${end} of ${total} items`;
}
function updateSalesReportPaginationControls() {
  document.getElementById('salesReportPrevPage').disabled = salesReportCurrentPage <= 1;
  document.getElementById('salesReportNextPage').disabled = salesReportCurrentPage >= salesReportTotalPages;
  document.getElementById('salesReportCurrentPageInfo').textContent = `Page ${salesReportCurrentPage} of ${salesReportTotalPages}`;
}
function showSalesReportPage(page) {
  salesReportCurrentPage = page;
  const total = salesReportCache.length;
  salesReportTotalPages = Math.ceil(total / salesReportPageSize) || 1;
  const startIdx = (salesReportCurrentPage - 1) * salesReportPageSize;
  const endIdx = Math.min(startIdx + salesReportPageSize, total);
  renderSalesReportTable(salesReportCache.slice(startIdx, endIdx));
  updateSalesReportPaginationInfo(startIdx + 1, endIdx, total);
  updateSalesReportPaginationControls();
}
document.getElementById('salesReportPrevPage').addEventListener('click', function() {
  if (salesReportCurrentPage > 1) showSalesReportPage(salesReportCurrentPage - 1);
});
document.getElementById('salesReportNextPage').addEventListener('click', function() {
  if (salesReportCurrentPage < salesReportTotalPages) showSalesReportPage(salesReportCurrentPage + 1);
});

function renderSalesReportTable(sales) {
  const tbody = document.querySelector('#todaysSalesModal tbody');
  tbody.innerHTML = '';
  if (!sales.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No data</td></tr>';
    return;
  }
  sales.forEach(sale => {
    const itemsStr = (sale.items && sale.items.length)
      ? sale.items.map(i => `${i.name}${i.quantity ? ` (${i.quantity}${i.unit ? i.unit : ''})` : ''}`).join(', ')
      : '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sale.customerName}</td>
      <td>${itemsStr}</td>
      <td>shs:${Number(sale.totalAmount).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function fetchSalesReport(dateStr) {
  fetch(`http://localhost:5000/api/sales/sales-report?date=${dateStr}`)
    .then(res => res.json())
    .then(data => {
      salesReportCache = data.sales || [];
      salesReportCurrentPage = 1;
      salesReportTotalPages = Math.ceil(salesReportCache.length / salesReportPageSize) || 1;
      showSalesReportPage(1);
    })
    .catch(() => {
      salesReportCache = [];
      salesReportCurrentPage = 1;
      salesReportTotalPages = 1;
      showSalesReportPage(1);
    });
}

document.getElementById('todaysSalesModal').addEventListener('show.bs.modal', function() {
  setSalesReportDateToToday();
  const input = document.getElementById('salesReportDate');
  if (input) fetchSalesReport(input.value);
});
document.getElementById('salesReportDate').addEventListener('change', function() {
  fetchSalesReport(this.value);
});

// --- Recent Sales Table Logic ---
const recentSalesPageSize = 4;
let recentSalesCurrentPage = 1;
let recentSalesTotalPages = 1;
let recentSalesCache = [];
let recentSalesTotalCount = 0;

function updateRecentSalesPaginationInfo(start, end, total) {
  document.getElementById('recentSalesShowingText').textContent = `Showing ${start} to ${end} of ${total} items`;
}
function updateRecentSalesPaginationControls() {
  document.getElementById('recentSalesPrevPage').disabled = recentSalesCurrentPage <= 1;
  document.getElementById('recentSalesNextPage').disabled = recentSalesCurrentPage >= recentSalesTotalPages;
  document.getElementById('recentSalesCurrentPageInfo').textContent = `Page ${recentSalesCurrentPage} of ${recentSalesTotalPages}`;
}
function showRecentSalesPage(page) {
  recentSalesCurrentPage = page;
  const total = recentSalesTotalCount;
  recentSalesTotalPages = Math.ceil(total / recentSalesPageSize) || 1;
  renderRecentSalesTable(recentSalesCache);
  const startIdx = (recentSalesCurrentPage - 1) * recentSalesPageSize;
  const endIdx = Math.min(startIdx + recentSalesCache.length, total);
  updateRecentSalesPaginationInfo(startIdx + 1, startIdx + recentSalesCache.length, total);
  updateRecentSalesPaginationControls();
}
document.getElementById('recentSalesPrevPage').addEventListener('click', function() {
  if (recentSalesCurrentPage > 1) fetchRecentSales(recentSalesCurrentPage - 1);
});
document.getElementById('recentSalesNextPage').addEventListener('click', function() {
  if (recentSalesCurrentPage < recentSalesTotalPages) fetchRecentSales(recentSalesCurrentPage + 1);
});

function renderRecentSalesTable(sales) {
  const tbody = document.getElementById('recentSalesTableBody');
  tbody.innerHTML = '';
  if (!sales.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No data</td></tr>';
    return;
  }
  sales.forEach(sale => {
    const itemsStr = (sale.items && sale.items.length)
      ? sale.items.map(i => `${i.name}${i.quantity ? ` (${i.quantity}${i.unit ? i.unit : ''})` : ''}`).join(', ')
      : '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="d-flex px-2 py-1">
          <div class="d-flex flex-column justify-content-center">
            <h6 class="mb-0 text-sm">${sale.customerName}</h6>
          </div>
        </div>
      </td>
      <td>
        <p class="text-xs font-weight-bold mb-0">${sale.items.length} Item${sale.items.length !== 1 ? 's' : ''}</p>
        <p class="text-xs text-secondary mb-0">${itemsStr}</p>
      </td>
      <td class="align-middle text-center text-sm">
        <span class="text-secondary text-xs font-weight-bold">${sale.date}</span>
      </td>
      <td class="align-middle text-center">
        <span class="text-secondary text-xs font-weight-bold">shs:${Number(sale.total).toLocaleString()}</span>
      </td>
      <td class="align-middle text-center">
        <span class="text-secondary text-xs font-weight-bold">shs:${Number(sale.profit).toLocaleString()}</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function fetchRecentSales(page = 1, dateStr = null) {
  let url = `http://localhost:5000/api/sales/recent?page=${page}&limit=${recentSalesPageSize}`;
  if (dateStr) {
    url += `&date=${dateStr}`;
  }
  fetch(url)
    .then(res => res.json())
    .then(data => {
      recentSalesCache = data.sales || [];
      recentSalesCurrentPage = page;
      recentSalesTotalCount = data.total || 0;
      recentSalesTotalPages = Math.ceil(recentSalesTotalCount / recentSalesPageSize) || 1;
      showRecentSalesPage(page);
    })
    .catch(() => {
      recentSalesCache = [];
      recentSalesCurrentPage = page;
      recentSalesTotalCount = 0;
      recentSalesTotalPages = 1;
      showRecentSalesPage(page);
    });
}

// --- Recent Sales Date Filter Logic ---
const recentSalesSelectDateBtn = document.getElementById('recentSalesSelectDateBtn');
const recentSalesDateInput = document.getElementById('recentSalesDateInput');
let recentSalesSelectedDate = null;

if (recentSalesSelectDateBtn && recentSalesDateInput) {
  recentSalesSelectDateBtn.addEventListener('click', function() {
    recentSalesDateInput.style.display = recentSalesDateInput.style.display === 'none' ? 'inline-block' : 'none';
    if (recentSalesDateInput.style.display !== 'none') {
      recentSalesDateInput.focus();
    }
  });
  recentSalesDateInput.addEventListener('change', function() {
    if (this.value) {
      window.recentSalesSelectedDate = this.value;
      fetchRecentSales(1, window.recentSalesSelectedDate);
    } else {
      window.recentSalesSelectedDate = null;
      fetchRecentSales(1);
    }
  });
}

// Add a clear/reset button for date filter (optional)

// --- Sales Bargraph Logic ---
let salesBargraphChart = null;
function fetchAndRenderSalesBargraph(days = 7) {
  fetch(`http://localhost:5000/api/sales/daily-totals?days=${days}`)
    .then(res => res.json())
    .then(data => {
      const daysArr = data.days || [];
      // Reverse to show oldest to newest (left to right)
      const daysSorted = daysArr.slice().reverse();
      const labels = daysSorted.map(d => d.date.slice(5)); // MM-DD
      const values = daysSorted.map(d => d.total);
      renderSalesBargraph(labels, values);
    })
    .catch(() => {
      renderSalesBargraph([], []);
    });
}
function renderSalesBargraph(labels, values) {
  const ctx = document.getElementById('sales-bargraph').getContext('2d');
  if (salesBargraphChart) salesBargraphChart.destroy();
  salesBargraphChart = new Chart(ctx, {
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
}

// --- Sales Bargraph Date Range Logic ---
let salesBargraphRanges = [];
let selectedSalesBargraphRangeIdx = 0;

function fetchAndRenderSalesBargraphRanges() {
  fetch('http://localhost:5000/api/sales/date-ranges')
    .then(res => res.json())
    .then(data => {
      salesBargraphRanges = data.ranges || [];
      renderSalesBargraphRanges();
    });
}

function renderSalesBargraphRanges() {
  const container = document.getElementById('salesBargraphRangesContainer');
  container.innerHTML = '';
  salesBargraphRanges.forEach((range, idx) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline-secondary btn-sm me-2 mb-1' + (idx === selectedSalesBargraphRangeIdx ? ' active' : '');
    btn.textContent = `${idx + 1}. ${formatDate(range.start)} to ${formatDate(range.end)}`;
    btn.onclick = () => {
      selectedSalesBargraphRangeIdx = idx;
      renderSalesBargraphRanges();
    };
    container.appendChild(btn);
  });
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB');
}

document.getElementById('salesBargraphSelectDateBtn').addEventListener('click', function() {
  const rangeDiv = document.getElementById('salesBargraphDateRange');
  rangeDiv.style.display = rangeDiv.style.display === 'none' ? 'block' : 'none';
  if (rangeDiv.style.display === 'block') {
    fetchAndRenderSalesBargraphRanges();
  }
});

document.getElementById('salesBargraphApplyBtn').addEventListener('click', function() {
  if (!salesBargraphRanges.length) return;
  const range = salesBargraphRanges[selectedSalesBargraphRangeIdx];
  fetchAndRenderSalesBargraph(7, range.end); // always 7 days ending at range.end
  document.getElementById('salesBargraphDateRange').style.display = 'none';
});

// --- Top Selling Items Logic ---
async function fetchAndRenderTopSellingItems(year, month) {
  try {
    let url = 'http://localhost:5000/api/sales/top-items';
    if (year && month) {
      url += `?year=${year}&month=${month}`;
    }
    const response = await fetch(url);
    const items = await response.json();
    const tbody = document.getElementById('topSellingItemsTableBody');
    tbody.innerHTML = '';
    let totalRevenue = 0;
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No data</td></tr>';
      document.getElementById('topSellingItemsTotalRevenue').textContent = 'shs:';
      return;
    }
    items.forEach((item, idx) => {
      totalRevenue += item.cost || 0;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${item.item_name || ''}</td>
        <td>${item.quantity || 0}</td>
        <td class="align-middle text-center text-sm"><span class="text-secondary text-xs font-weight-bold">shs:${Number(item.cost || 0).toLocaleString()}</span></td>
      `;
      tbody.appendChild(tr);
    });
    document.getElementById('topSellingItemsTotalRevenue').textContent = `shs:${Number(totalRevenue).toLocaleString()}`;
  } catch (error) {
    const tbody = document.getElementById('topSellingItemsTableBody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading data</td></tr>';
    document.getElementById('topSellingItemsTotalRevenue').textContent = 'shs:';
    console.error('Failed to load top selling items:', error);
  }
}

// --- Top Selling Items Month Picker Overlay Logic ---
const selectMonthBtn = document.getElementById('selectMonthBtn');
const monthOverlay = document.getElementById('topSellingItemsMonthOverlay');
const monthList = document.getElementById('topSellingItemsMonthList');
const closeMonthOverlayBtn = document.getElementById('closeMonthOverlayBtn');
const allTimeBtn = document.getElementById('allTimeBtn');
let selectedMonth = null;

function getMonthOptions(numMonths = 18) {
  const options = [];
  const now = new Date();
  for (let i = 0; i < numMonths; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    options.push({ year, month, label });
  }
  return options;
}
function renderMonthList() {
  monthList.innerHTML = '';
  const months = getMonthOptions();
  months.forEach(({ year, month, label }) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline-primary btn-sm';
    btn.textContent = label;
    btn.style.minWidth = '90px';
    btn.style.whiteSpace = 'nowrap';
    btn.dataset.year = year;
    btn.dataset.month = month;
    if (selectedMonth && selectedMonth.year == year && selectedMonth.month == month) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      selectedMonth = { year, month };
      fetchAndRenderTopSellingItems(year, month);
      hideMonthOverlay();
    });
    monthList.appendChild(btn);
  });
}
function showMonthOverlay() {
  renderMonthList();
  monthOverlay.style.display = 'block';
  setTimeout(() => {
    document.addEventListener('mousedown', handleOutsideClick);
  }, 0);
}
function hideMonthOverlay() {
  monthOverlay.style.display = 'none';
  document.removeEventListener('mousedown', handleOutsideClick);
}
function handleOutsideClick(e) {
  if (!monthOverlay.contains(e.target) && e.target !== selectMonthBtn) {
    hideMonthOverlay();
  }
}
if (selectMonthBtn) {
  selectMonthBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    showMonthOverlay();
  });
}
if (closeMonthOverlayBtn) {
  closeMonthOverlayBtn.addEventListener('click', function() {
    hideMonthOverlay();
  });
}
if (allTimeBtn) {
  allTimeBtn.addEventListener('click', function() {
    selectedMonth = null;
    fetchAndRenderTopSellingItems();
    hideMonthOverlay();
  });
}

// --- Sales Trend Report Modal Logic ---
let salesTrendMonthsCache = [];
let salesTrendSelectedMonth = null;
let salesTrendReportCurrentPage = 1;
const salesTrendReportPageSize = 4;
let salesTrendReportTotalPages = 1;

function updateSalesTrendSelectedMonthLabel() {
  const label = document.getElementById('salesTrendSelectedMonthLabel');
  if (salesTrendSelectedMonth) {
    const date = new Date(salesTrendSelectedMonth.year, salesTrendSelectedMonth.month - 1);
    label.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });
  } else {
    label.textContent = 'All Time';
  }
}

function showSalesTrendReportModal() {
  if (salesTrendSelectedMonth) {
    // Show single month summary
    document.getElementById('salesTrendReportSingle').style.display = '';
    document.getElementById('salesTrendReportTable').style.display = 'none';
    const tbody = document.getElementById('salesTrendReportSingleBody');
    tbody.innerHTML = '';
    // Find the selected month in cache
    const found = salesTrendMonthsCache.find(m => m.month === `${salesTrendSelectedMonth.year}-${String(salesTrendSelectedMonth.month).padStart(2, '0')}`);
    const date = new Date(salesTrendSelectedMonth.year, salesTrendSelectedMonth.month - 1);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${date.toLocaleString('default', { month: 'long' })}</td>
      <td>${date.getFullYear()}</td>
      <td>shs:${found ? Number(found.total).toLocaleString() : '0'}</td>
    `;
    tbody.appendChild(tr);
  } else {
    // Show paginated table
    document.getElementById('salesTrendReportSingle').style.display = 'none';
    document.getElementById('salesTrendReportTable').style.display = '';
    renderSalesTrendReportTablePage(1);
  }
  const modal = new bootstrap.Modal(document.getElementById('salesTrendReportModal'));
  modal.show();
}

function renderSalesTrendReportTablePage(page) {
  salesTrendReportCurrentPage = page;
  const total = salesTrendMonthsCache.length;
  salesTrendReportTotalPages = Math.ceil(total / salesTrendReportPageSize) || 1;
  const startIdx = (salesTrendReportCurrentPage - 1) * salesTrendReportPageSize;
  const endIdx = Math.min(startIdx + salesTrendReportPageSize, total);
  const tbody = document.getElementById('salesTrendReportTableBody');
  tbody.innerHTML = '';
  const pageData = salesTrendMonthsCache.slice(startIdx, endIdx);
  pageData.forEach(m => {
    const [year, month] = m.month.split('-');
    const date = new Date(year, month - 1);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${date.toLocaleString('default', { month: 'long' })}</td>
      <td>${date.getFullYear()}</td>
      <td>shs:${Number(m.total).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
  if (!pageData.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No data</td></tr>';
  }
  document.getElementById('salesTrendReportShowingText').textContent = `Showing ${startIdx + 1} to ${endIdx} of ${total} items`;
  document.getElementById('salesTrendReportCurrentPageInfo').textContent = `Page ${salesTrendReportCurrentPage} of ${salesTrendReportTotalPages}`;
  document.getElementById('salesTrendReportPrevPage').disabled = salesTrendReportCurrentPage <= 1;
  document.getElementById('salesTrendReportNextPage').disabled = salesTrendReportCurrentPage >= salesTrendReportTotalPages;
}

document.getElementById('salesTrendReportPrevPage').addEventListener('click', function() {
  if (salesTrendReportCurrentPage > 1) renderSalesTrendReportTablePage(salesTrendReportCurrentPage - 1);
});
document.getElementById('salesTrendReportNextPage').addEventListener('click', function() {
  if (salesTrendReportCurrentPage < salesTrendReportTotalPages) renderSalesTrendReportTablePage(salesTrendReportCurrentPage + 1);
});

document.getElementById('salesTrendViewBtn').addEventListener('click', showSalesTrendReportModal);

// --- Integrate with month picker ---
// If you have a month picker for Sales Trend, update salesTrendSelectedMonth and call updateSalesTrendSelectedMonthLabel()
// For demo, you can set salesTrendSelectedMonth = { year: 2025, month: 5 } and call updateSalesTrendSelectedMonthLabel()

// --- Fetch months data for chart and modal ---
async function fetchAndRenderSalesTrend() {
  try {
    const response = await fetch('http://localhost:5000/api/sales/monthly-totals');
    const data = await response.json();
    salesTrendMonthsCache = data.months || [];
    const labels = salesTrendMonthsCache.map(m => {
      const [year, month] = m.month.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleString('default', { month: 'short', year: '2-digit' });
    });
    const values = salesTrendMonthsCache.map(m => m.total);
    renderSalesTrend(labels, values);
    updateSalesTrendSelectedMonthLabel();
  } catch (error) {
    renderSalesTrend([], []);
    salesTrendMonthsCache = [];
    updateSalesTrendSelectedMonthLabel();
    console.error('Failed to load sales trend data:', error);
  }
}

// --- Sales Trend Chart Logic ---
let salesTrendChart = null;
function renderSalesTrend(labels, values) {
  const ctx = document.getElementById('sales-trend').getContext('2d');
  if (salesTrendChart) salesTrendChart.destroy();
  salesTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Sales',
        data: values,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
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
}


document.addEventListener('DOMContentLoaded', function() {
  fetchTodaysSalesTotal();
  fetchCustomersToday();
  fetchTodaysProfits();
  fetchRecentSales(1);
  fetchAndRenderSalesBargraph(7);
  fetchAndRenderTopSellingItems();
  fetchAndRenderSalesTrend();
  const recentSalesExportBtn = document.getElementById('recentSalesExportBtn');
  if (recentSalesExportBtn) {
    recentSalesExportBtn.addEventListener('click', async function() {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const headers = [['Customer', 'Items', 'Date', 'Total', 'Profit']];
      let rows = [];
      let totalSum = 0;
      let profitSum = 0;
      // Fetch all records for export (not just current page)
      let url = `http://localhost:5000/api/sales/recent?page=1&limit=10000`;
      if (window.recentSalesSelectedDate) {
        url += `&date=${window.recentSalesSelectedDate}`;
      }
      try {
        const res = await fetch(url);
        const data = await res.json();
        const sales = data.sales || [];
        sales.forEach(sale => {
          // Compose items string
          const itemsStr = (sale.items && sale.items.length)
            ? sale.items.map(i => `${i.name}${i.quantity ? ` (${i.quantity}${i.unit ? i.unit : ''})` : ''}`).join(', ')
            : '-';
          const totalVal = Number(sale.total) || 0;
          const profitVal = Number(sale.profit) || 0;
          totalSum += totalVal;
          profitSum += profitVal;
          rows.push([
            sale.customerName,
            `${sale.items.length} Item${sale.items.length !== 1 ? 's' : ''}\n${itemsStr}`,
            sale.date,
            `shs:${Number(sale.total).toLocaleString()}`,
            `shs:${Number(sale.profit).toLocaleString()}`
          ]);
        });
        if (rows.length === 0) {
          alert('No data to export.');
          return;
        }
        // Add summary row
        rows.push(['', '', 'Total', `shs:${totalSum.toLocaleString()}`, `shs:${profitSum.toLocaleString()}`]);
        let y = 16;
        doc.text('Recent Sales', 14, y);
        y += 8;
        if (window.recentSalesSelectedDate) {
          doc.text(`Date: ${window.recentSalesSelectedDate}`, 14, y);
          y += 8;
        }
        doc.autoTable({
          head: headers,
          body: rows,
          startY: y,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [26, 115, 232] }
        });
        doc.save('recent_sales.pdf');
      } catch (err) {
        alert('Failed to export PDF.');
      }
    });
  }
  // --- Integrate Sales Trend with month picker overlay ---
  // If you want to use the same month picker overlay as Top Selling Items, add logic here
  const salesTrendMonthBtn = document.getElementById('salesTrendSelectMonthBtn');
  if (salesTrendMonthBtn) {
    salesTrendMonthBtn.addEventListener('click', function(e) {
      // Show the month picker overlay (reuse Top Selling Items overlay)
      showMonthOverlay('salesTrend');
    });
  }

  // Patch showMonthOverlay to accept a context ("salesTrend" or default)
  const originalShowMonthOverlay = window.showMonthOverlay || function(){};
  window.showMonthOverlay = function(context) {
    renderMonthList(function(year, month) {
      if (context === 'salesTrend') {
        salesTrendSelectedMonth = { year, month };
        updateSalesTrendSelectedMonthLabel();
      } else {
        selectedMonth = { year, month };
        fetchAndRenderTopSellingItems(year, month);
      }
      hideMonthOverlay();
    }, function() {
      if (context === 'salesTrend') {
        salesTrendSelectedMonth = null;
        updateSalesTrendSelectedMonthLabel();
      } else {
        selectedMonth = null;
        fetchAndRenderTopSellingItems();
      }
      hideMonthOverlay();
    });
    monthOverlay.style.display = 'block';
    setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideClick);
    }, 0);
  };

  // Patch renderMonthList to accept a callback for month selection and all time
  function renderMonthList(onMonthSelect, onAllTime) {
    monthList.innerHTML = '';
    const months = getMonthOptions();
    months.forEach(({ year, month, label }) => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-outline-primary btn-sm';
      btn.textContent = label;
      btn.style.minWidth = '70px';
      btn.style.padding = '2px 8px';
      btn.style.whiteSpace = 'nowrap';
      btn.dataset.year = year;
      btn.dataset.month = month;
      // Highlight for both contexts
      if ((selectedMonth && selectedMonth.year == year && selectedMonth.month == month) ||
          (salesTrendSelectedMonth && salesTrendSelectedMonth.year == year && salesTrendSelectedMonth.month == month)) {
        btn.classList.add('active');
      }
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (onMonthSelect) onMonthSelect(year, month);
      });
      monthList.appendChild(btn);
    });
    // All Time button
    allTimeBtn.onclick = function() {
      if (onAllTime) onAllTime();
    };
  }

});
