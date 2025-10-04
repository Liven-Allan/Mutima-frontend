// Fetch and update Stock Inventory Value
let latestStockInventoryDate = null;

console.log('Cash utilization JavaScript loaded');

async function updateStockInventoryValue() {
  const valueElem = document.getElementById('stock-inventory-value');
  if (!valueElem) return;

  try {
    // Adjust the URL if your backend is hosted elsewhere
    const response = await fetch(API_BASE_URL + '/api/stock-inventory-value');
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    const value = data.totalStockValue || 0;
    // Format as currency
    valueElem.textContent = 'shs:' + value.toLocaleString();
    // Store latest date for modal
    latestStockInventoryDate = data.latestDate || null;
  } catch (err) {
    valueElem.textContent = '0';
    console.error('Error fetching stock inventory value:', err);
  }
}

window.addEventListener('DOMContentLoaded', updateStockInventoryValue);

// Fetch and update Today's Expenses
window.addEventListener('DOMContentLoaded', async () => {
  const expensesElem = document.getElementById('todays-expenses-value');
  if (expensesElem) {
    try {
      const response = await fetch(API_BASE_URL + '/api/todays-expenses');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      const value = data.totalExpenses || 0;
      expensesElem.textContent = 'shs:' + value.toLocaleString();
    } catch (err) {
      expensesElem.textContent = '0';
      console.error('Error fetching today\'s expenses:', err);
    }
  }
});

// Fetch and update Total Cash Available minus Today's Expenses
window.addEventListener('DOMContentLoaded', async () => {
  const cashElem = document.getElementById('total-cash-available-value');
  if (cashElem) {
    try {
      const [cashRes, expensesRes] = await Promise.all([
        fetch(API_BASE_URL + '/api/todays-cash-available'),
        fetch(API_BASE_URL + '/api/todays-expenses')
      ]);
      if (!cashRes.ok || !expensesRes.ok) throw new Error('Failed to fetch');
      const cashData = await cashRes.json();
      const expensesData = await expensesRes.json();
      const cashValue = cashData.totalCashAvailable || 0;
      const expensesValue = expensesData.totalExpenses || 0;
      const netValue = cashValue - expensesValue;
      cashElem.textContent = 'shs:' + netValue.toLocaleString();
    } catch (err) {
      cashElem.textContent = '0';
      console.error('Error fetching net cash available:', err);
    }
  }
});

// Pagination state for Stock Inventory Details
let stockInventoryDetailsData = [];
let stockInventoryCurrentPage = 1;
const stockInventoryPageSize = 4;

function renderStockInventoryTablePage() {
  const tbody = document.getElementById('stockInventoryDetailsTableBody');
  const showingText = document.getElementById('stockInventoryShowingText');
  const pageInfo = document.getElementById('stockInventoryCurrentPageInfo');
  const prevBtn = document.getElementById('stockInventoryPrevPage');
  const nextBtn = document.getElementById('stockInventoryNextPage');
  const total = stockInventoryDetailsData.length;
  const totalPages = Math.max(1, Math.ceil(total / stockInventoryPageSize));
  if (stockInventoryCurrentPage > totalPages) stockInventoryCurrentPage = totalPages;
  const startIdx = (stockInventoryCurrentPage - 1) * stockInventoryPageSize;
  const endIdx = Math.min(startIdx + stockInventoryPageSize, total);
  const pageData = stockInventoryDetailsData.slice(startIdx, endIdx);

  if (total === 0) {
    tbody.innerHTML = '<tr><td colspan="3">No records found for this date.</td></tr>';
    showingText.textContent = 'Showing 0 of 0 items';
    pageInfo.textContent = 'Page 1 of 1';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  tbody.innerHTML = pageData.map(row =>
    `<tr><td>${row.name}</td><td>${row.quantity.toLocaleString(undefined, {maximumFractionDigits: 2})}</td><td>shs:${row.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>`
  ).join('');
  showingText.textContent = `Showing ${startIdx + 1} to ${endIdx} of ${total} items`;
  pageInfo.textContent = `Page ${stockInventoryCurrentPage} of ${totalPages}`;
  prevBtn.disabled = stockInventoryCurrentPage === 1;
  nextBtn.disabled = stockInventoryCurrentPage === totalPages;
}

// Pagination button handlers
const prevBtn = document.getElementById('stockInventoryPrevPage');
const nextBtn = document.getElementById('stockInventoryNextPage');
if (prevBtn) {
  prevBtn.addEventListener('click', function () {
    if (stockInventoryCurrentPage > 1) {
      stockInventoryCurrentPage--;
      renderStockInventoryTablePage();
    }
  });
}
if (nextBtn) {
  nextBtn.addEventListener('click', function () {
    const totalPages = Math.max(1, Math.ceil(stockInventoryDetailsData.length / stockInventoryPageSize));
    if (stockInventoryCurrentPage < totalPages) {
      stockInventoryCurrentPage++;
      renderStockInventoryTablePage();
    }
  });
}

// Helper to fetch and render inventory details for a date
async function fetchAndRenderInventoryDetails(dateStr) {
  const tbody = document.getElementById('stockInventoryDetailsTableBody');
  const showingText = document.getElementById('stockInventoryShowingText');
  const pageInfo = document.getElementById('stockInventoryCurrentPageInfo');
  const prevBtn = document.getElementById('stockInventoryPrevPage');
  const nextBtn = document.getElementById('stockInventoryNextPage');
  tbody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
  if (showingText) showingText.textContent = '';
  if (pageInfo) pageInfo.textContent = '';
  if (prevBtn) prevBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = true;
  try {
    const url = dateStr
      ? API_BASE_URL + `/api/inventory-details?date=${encodeURIComponent(dateStr)}`
      : API_BASE_URL + '/api/inventory-details';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    stockInventoryDetailsData = data.details || [];
    stockInventoryCurrentPage = 1;
    renderStockInventoryTablePage();
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="3">Error loading data.</td></tr>';
    if (showingText) showingText.textContent = '';
    if (pageInfo) pageInfo.textContent = '';
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    console.error('Error fetching inventory details:', err);
  }
}

// Set modal date field to latest date when modal is shown, and fetch details
const stockInventoryDetailsModal = document.getElementById('stockInventoryDetailsModal');
if (stockInventoryDetailsModal) {
  stockInventoryDetailsModal.addEventListener('show.bs.modal', function () {
    // Refresh the stock inventory value to ensure it's current
    updateStockInventoryValue();
    
    const dateInput = document.getElementById('stockInventoryDate');
    if (dateInput && latestStockInventoryDate) {
      dateInput.value = latestStockInventoryDate;
      fetchAndRenderInventoryDetails(latestStockInventoryDate);
    }
  });
}
// Fetch details when date changes
const dateInput = document.getElementById('stockInventoryDate');
if (dateInput) {
  dateInput.addEventListener('change', function () {
    if (dateInput.value) {
      fetchAndRenderInventoryDetails(dateInput.value);
    }
  });
}

// Expenses Details Modal logic
let expensesDetailsData = [];
let expensesCurrentPage = 1;
const expensesPageSize = 4;

function renderExpensesTablePage() {
  const tbody = document.getElementById('expensesDetailsTableBody');
  const showingText = document.getElementById('expensesShowingText');
  const pageInfo = document.getElementById('expensesCurrentPageInfo');
  const prevBtn = document.getElementById('expensesPrevPage');
  const nextBtn = document.getElementById('expensesNextPage');
  const total = expensesDetailsData.length;
  const totalPages = Math.max(1, Math.ceil(total / expensesPageSize));
  if (expensesCurrentPage > totalPages) expensesCurrentPage = totalPages;
  const startIdx = (expensesCurrentPage - 1) * expensesPageSize;
  const endIdx = Math.min(startIdx + expensesPageSize, total);
  const pageData = expensesDetailsData.slice(startIdx, endIdx);

  if (total === 0) {
    tbody.innerHTML = '<tr><td colspan="2">No records found for this date.</td></tr>';
    showingText.textContent = 'Showing 0 of 0 items';
    pageInfo.textContent = 'Page 1 of 1';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  tbody.innerHTML = pageData.map(row =>
    `<tr><td>${row.purpose}</td><td>shs${row.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>`
  ).join('');
  showingText.textContent = `Showing ${startIdx + 1} to ${endIdx} of ${total} items`;
  pageInfo.textContent = `Page ${expensesCurrentPage} of ${totalPages}`;
  prevBtn.disabled = expensesCurrentPage === 1;
  nextBtn.disabled = expensesCurrentPage === totalPages;
}

// Pagination button handlers for expenses
const expensesPrevBtn = document.getElementById('expensesPrevPage');
const expensesNextBtn = document.getElementById('expensesNextPage');
if (expensesPrevBtn) {
  expensesPrevBtn.addEventListener('click', function () {
    if (expensesCurrentPage > 1) {
      expensesCurrentPage--;
      renderExpensesTablePage();
    }
  });
}
if (expensesNextBtn) {
  expensesNextBtn.addEventListener('click', function () {
    const totalPages = Math.max(1, Math.ceil(expensesDetailsData.length / expensesPageSize));
    if (expensesCurrentPage < totalPages) {
      expensesCurrentPage++;
      renderExpensesTablePage();
    }
  });
}

// Helper to fetch and render expenses details for a date
async function fetchAndRenderExpensesDetails(dateStr) {
  const tbody = document.getElementById('expensesDetailsTableBody');
  const showingText = document.getElementById('expensesShowingText');
  const pageInfo = document.getElementById('expensesCurrentPageInfo');
  const prevBtn = document.getElementById('expensesPrevPage');
  const nextBtn = document.getElementById('expensesNextPage');
  tbody.innerHTML = '<tr><td colspan="2">Loading...</td></tr>';
  if (showingText) showingText.textContent = '';
  if (pageInfo) pageInfo.textContent = '';
  if (prevBtn) prevBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = true;
  try {
    const url = dateStr
      ? API_BASE_URL + `/api/expenses-details?date=${encodeURIComponent(dateStr)}`
      : API_BASE_URL + '/api/expenses-details';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    expensesDetailsData = data.details || [];
    expensesCurrentPage = 1;
    renderExpensesTablePage();
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="2">Error loading data.</td></tr>';
    if (showingText) showingText.textContent = '';
    if (pageInfo) pageInfo.textContent = '';
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    console.error('Error fetching expenses details:', err);
  }
}

// Set modal date field to today by default and fetch details
const expensesDetailsModal = document.getElementById('expensesDetailsModal');
if (expensesDetailsModal) {
  expensesDetailsModal.addEventListener('show.bs.modal', function () {
    const dateInput = document.getElementById('expensesDetailsDate');
    if (dateInput) {
      // Set to today by default
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      dateInput.value = `${yyyy}-${mm}-${dd}`;
      fetchAndRenderExpensesDetails(dateInput.value);
    }
  });
}
// Fetch details when date changes
const expensesDateInput = document.getElementById('expensesDetailsDate');
if (expensesDateInput) {
  expensesDateInput.addEventListener('change', function () {
    if (expensesDateInput.value) {
      fetchAndRenderExpensesDetails(expensesDateInput.value);
    }
  });
}

// Cash Available Details Modal logic
let cashAvailableDetailsData = [];
let cashAvailableCurrentPage = 1;
const cashAvailablePageSize = 4;

function renderCashAvailableTablePage() {
  const tbody = document.getElementById('cashAvailableDetailsTableBody');
  const showingText = document.getElementById('cashAvailableShowingText');
  const pageInfo = document.getElementById('cashAvailableCurrentPageInfo');
  const prevBtn = document.getElementById('cashAvailablePrevPage');
  const nextBtn = document.getElementById('cashAvailableNextPage');
  const total = cashAvailableDetailsData.length;
  const totalPages = Math.max(1, Math.ceil(total / cashAvailablePageSize));
  if (cashAvailableCurrentPage > totalPages) cashAvailableCurrentPage = totalPages;
  const startIdx = (cashAvailableCurrentPage - 1) * cashAvailablePageSize;
  const endIdx = Math.min(startIdx + cashAvailablePageSize, total);
  const pageData = cashAvailableDetailsData.slice(startIdx, endIdx);

  if (total === 0) {
    tbody.innerHTML = '<tr><td colspan="3">No records found for this date.</td></tr>';
    showingText.textContent = 'Showing 0 of 0 items';
    pageInfo.textContent = 'Page 1 of 1';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  tbody.innerHTML = pageData.map(row =>
    `<tr><td>${row.customerName}</td><td>${row.items}</td><td>shs:${row.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>`
  ).join('');
  showingText.textContent = `Showing ${startIdx + 1} to ${endIdx} of ${total} items`;
  pageInfo.textContent = `Page ${cashAvailableCurrentPage} of ${totalPages}`;
  prevBtn.disabled = cashAvailableCurrentPage === 1;
  nextBtn.disabled = cashAvailableCurrentPage === totalPages;
}

// Pagination button handlers for cash available
const cashAvailablePrevBtn = document.getElementById('cashAvailablePrevPage');
const cashAvailableNextBtn = document.getElementById('cashAvailableNextPage');
if (cashAvailablePrevBtn) {
  cashAvailablePrevBtn.addEventListener('click', function () {
    if (cashAvailableCurrentPage > 1) {
      cashAvailableCurrentPage--;
      renderCashAvailableTablePage();
    }
  });
}
if (cashAvailableNextBtn) {
  cashAvailableNextBtn.addEventListener('click', function () {
    const totalPages = Math.max(1, Math.ceil(cashAvailableDetailsData.length / cashAvailablePageSize));
    if (cashAvailableCurrentPage < totalPages) {
      cashAvailableCurrentPage++;
      renderCashAvailableTablePage();
    }
  });
}

// Helper to fetch and render cash available details for a date
async function fetchAndRenderCashAvailableDetails(dateStr) {
  const tbody = document.getElementById('cashAvailableDetailsTableBody');
  const showingText = document.getElementById('cashAvailableShowingText');
  const pageInfo = document.getElementById('cashAvailableCurrentPageInfo');
  const prevBtn = document.getElementById('cashAvailablePrevPage');
  const nextBtn = document.getElementById('cashAvailableNextPage');
  const totalSalesElem = document.getElementById('cashAvailableTotalSales');
  const totalExpensesElem = document.getElementById('cashAvailableTotalExpenses');
  const netCashElem = document.getElementById('cashAvailableNetCash');
  tbody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
  if (showingText) showingText.textContent = '';
  if (pageInfo) pageInfo.textContent = '';
  if (prevBtn) prevBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = true;
  if (totalSalesElem) totalSalesElem.textContent = 'shs:0.00';
  if (totalExpensesElem) totalExpensesElem.textContent = 'shs:0.00';
  if (netCashElem) netCashElem.textContent = 'shs:0.00';
  try {
    const [salesRes, expensesRes] = await Promise.all([
      fetch(dateStr ? API_BASE_URL + `/api/cash-available-details?date=${encodeURIComponent(dateStr)}` : API_BASE_URL + '/api/cash-available-details'),
      fetch(dateStr ? API_BASE_URL + `/api/expenses-details?date=${encodeURIComponent(dateStr)}` : API_BASE_URL + '/api/expenses-details')
    ]);
    if (!salesRes.ok || !expensesRes.ok) throw new Error('Failed to fetch');
    const salesData = await salesRes.json();
    const expensesData = await expensesRes.json();
    cashAvailableDetailsData = salesData.details || [];
    cashAvailableCurrentPage = 1;
    renderCashAvailableTablePage();
    // Calculate totals
    const totalSales = cashAvailableDetailsData.reduce((sum, row) => sum + (row.totalAmount || 0), 0);
    const totalExpenses = (expensesData.details || []).reduce((sum, row) => sum + (row.amount || 0), 0);
    const netCash = totalSales - totalExpenses;
    if (totalSalesElem) totalSalesElem.textContent = 'shs:' + totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if (totalExpensesElem) totalExpensesElem.textContent = 'shs:' + totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if (netCashElem) netCashElem.textContent = 'shs:' + netCash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="3">Error loading data.</td></tr>';
    if (showingText) showingText.textContent = '';
    if (pageInfo) pageInfo.textContent = '';
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    if (totalSalesElem) totalSalesElem.textContent = '0';
    if (totalExpensesElem) totalExpensesElem.textContent = '0';
    if (netCashElem) netCashElem.textContent = '0';
    console.error('Error fetching cash available details:', err);
  }
}

// Set modal date field to today by default and fetch details
const cashAvailableDetailsModal = document.getElementById('cashAvailableDetailsModal');
if (cashAvailableDetailsModal) {
  cashAvailableDetailsModal.addEventListener('show.bs.modal', function () {
    const dateInput = document.getElementById('cashAvailableDetailsDate');
    if (dateInput) {
      // Set to today by default
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      dateInput.value = `${yyyy}-${mm}-${dd}`;
      fetchAndRenderCashAvailableDetails(dateInput.value);
    }
  });
}
// Fetch details when date changes
const cashAvailableDateInput = document.getElementById('cashAvailableDetailsDate');
if (cashAvailableDateInput) {
  cashAvailableDateInput.addEventListener('change', function () {
    if (cashAvailableDateInput.value) {
      fetchAndRenderCashAvailableDetails(cashAvailableDateInput.value);
    }
  });
}

// Cash Flow Overview Chart (7 days, dynamic)
let cashFlowChart = null;
async function renderCashFlowChart() {
  const ctx = document.getElementById('cash-flow-chart').getContext('2d');
  try {
    const response = await fetch(API_BASE_URL + '/api/cash-flow-overview');
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    const labels = data.labels || [];
    const cashIn = data.cashIn || [];
    const cashOut = data.cashOut || [];
    if (cashFlowChart) cashFlowChart.destroy();
    cashFlowChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Cash In',
            data: cashIn,
            borderColor: 'rgb(40, 167, 69)', // green
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            tension: 0.4,
            fill: false
          },
          {
            label: 'Cash Out',
            data: cashOut,
            borderColor: 'orange',
            backgroundColor: 'rgba(255, 165, 0, 0.1)',
            tension: 0.4,
            fill: false
          }
        ]
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
          legend: {
            display: false
          }
        }
      }
    });
  } catch (err) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    console.error('Error fetching cash flow overview:', err);
  }
}
window.addEventListener('DOMContentLoaded', renderCashFlowChart);

// Fetch and update Financial Report Total Revenue (current month)
async function updateFinancialReportTotalRevenue() {
  const revenueElem = document.getElementById('financial-report-total-revenue');
  if (revenueElem) {
    try {
      const response = await fetch(API_BASE_URL + '/api/financial-report/total-revenue');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      const value = data.totalRevenue || 0;
      revenueElem.textContent = 'shs:' + value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    } catch (err) {
      revenueElem.textContent = '0';
      console.error('Error fetching total revenue:', err);
    }
  }
}
// Update when modal is shown
const financialReportModal = document.getElementById('financialReportModal');
if (financialReportModal) {
  financialReportModal.addEventListener('show.bs.modal', updateFinancialReportTotalRevenue);
}

// Fetch and update Financial Report Total Expenses (current month)
async function updateFinancialReportTotalExpenses() {
  const expensesElem = document.getElementById('financial-report-total-expenses');
  if (expensesElem) {
    try {
      const response = await fetch(API_BASE_URL + '/api/financial-report/total-expenses');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      const value = data.totalExpenses || 0;
      expensesElem.textContent = 'shs:' + value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    } catch (err) {
      expensesElem.textContent = '0';
      console.error('Error fetching total expenses:', err);
    }
  }
}
// Update when modal is shown
if (financialReportModal) {
  financialReportModal.addEventListener('show.bs.modal', updateFinancialReportTotalExpenses);
}

// Fetch and update Financial Report Net Profit (current month)
async function updateFinancialReportNetProfit() {
  const profitElem = document.getElementById('financial-report-net-profit');
  if (profitElem) {
    try {
      const response = await fetch(API_BASE_URL + '/api/financial-report/net-profit');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      const value = data.netProfit || 0;
      profitElem.textContent = 'shs:' + value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    } catch (err) {
      profitElem.textContent = '0';
      console.error('Error fetching net profit:', err);
    }
  }
}
// Update when modal is shown
if (financialReportModal) {
  financialReportModal.addEventListener('show.bs.modal', updateFinancialReportNetProfit);
}

// Utility to get YYYY-MM from input type month value
function getMonthRange(monthValue) {
  if (!monthValue) return null;
  const [year, month] = monthValue.split('-');
  const start = new Date(Date.UTC(Number(year), Number(month) - 1, 1, 0, 0, 0, 0));
  // End: last day of month
  const end = new Date(Date.UTC(Number(year), Number(month), 0, 23, 59, 59, 999));
  return { start, end };
}

// Update all financial report cards for a given month (YYYY-MM)
async function updateFinancialReportCardsForMonth(monthValue) {
  const revenueElem = document.getElementById('financial-report-total-revenue');
  const expensesElem = document.getElementById('financial-report-total-expenses');
  const profitElem = document.getElementById('financial-report-net-profit');
  if (revenueElem) revenueElem.textContent = '...';
  if (expensesElem) expensesElem.textContent = '...';
  if (profitElem) profitElem.textContent = '...';
  try {
    const params = monthValue ? `?month=${monthValue}` : '';
    const [revenueRes, expensesRes, profitRes] = await Promise.all([
      fetch(API_BASE_URL + `/api/financial-report/total-revenue${params}`),
      fetch(API_BASE_URL + `/api/financial-report/total-expenses${params}`),
      fetch(API_BASE_URL + `/api/financial-report/net-profit${params}`)
    ]);
    const revenueData = await revenueRes.json();
    const expensesData = await expensesRes.json();
    const profitData = await profitRes.json();
    if (revenueElem) revenueElem.textContent = 'shs:' + (revenueData.totalRevenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if (expensesElem) expensesElem.textContent = 'shs:' + (expensesData.totalExpenses || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if (profitElem) profitElem.textContent = 'shs:' + (profitData.netProfit || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
  } catch (err) {
    if (revenueElem) revenueElem.textContent = '0';
    if (expensesElem) expensesElem.textContent = '0';
    if (profitElem) profitElem.textContent = '0';
    console.error('Error fetching financial report cards:', err);
  }
}

// Custom month navigation for Financial Report modal
let financialReportSelectedMonth = new Date().getMonth();
let financialReportSelectedYear = new Date().getFullYear();

function updateFinancialReportMonthLabel() {
  const label = document.getElementById('financialReportMonthLabel');
  const date = new Date(financialReportSelectedYear, financialReportSelectedMonth, 1);
  label.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

function getFinancialReportMonthValue() {
  // Returns YYYY-MM string
  const mm = String(financialReportSelectedMonth + 1).padStart(2, '0');
  return `${financialReportSelectedYear}-${mm}`;
}

// Update Expense vs Revenue Pie Chart in Financial Report modal
let expenseRevenuePieChart = null;
async function updateExpenseRevenuePieChart(monthValue) {
  const ctxPie = document.getElementById('expenseRevenuePieChart').getContext('2d');
  try {
    const params = monthValue ? `?month=${monthValue}` : '';
    const [revenueRes, expensesRes, profitRes] = await Promise.all([
      fetch(API_BASE_URL + `/api/financial-report/total-revenue${params}`),
      fetch(API_BASE_URL + `/api/financial-report/total-expenses${params}`),
      fetch(API_BASE_URL + `/api/financial-report/net-profit${params}`)
    ]);
    const revenueData = await revenueRes.json();
    const expensesData = await expensesRes.json();
    const profitData = await profitRes.json();
    const revenue = revenueData.totalRevenue || 0;
    const expenses = expensesData.totalExpenses || 0;
    const netProfit = profitData.netProfit || 0;
    if (expenseRevenuePieChart) expenseRevenuePieChart.destroy();
    expenseRevenuePieChart = new Chart(ctxPie, {
      type: 'pie',
      data: {
        labels: ['Expense', 'Revenue', 'Net Profit'],
        datasets: [{
          data: [expenses, revenue, netProfit],
          backgroundColor: [
            'rgb(220, 53, 69)',   // Expense: red
            'rgb(40, 167, 69)',   // Revenue: green
            'rgb(26, 115, 232)'   // Net Profit: blue
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          }
        }
      }
    });
  } catch (err) {
    ctxPie.clearRect(0, 0, ctxPie.canvas.width, ctxPie.canvas.height);
    console.error('Error updating Expense vs Revenue chart:', err);
  }
}
// Update pie chart when month changes or modal is shown
function updateFinancialReportAllForMonth(monthValue) {
  updateFinancialReportCardsForMonth(monthValue);
  updateExpenseRevenuePieChart(monthValue);
}
// Patch month navigation to update pie chart as well
function updateFinancialReportCardsForSelectedMonth() {
  updateFinancialReportMonthLabel();
  updateFinancialReportAllForMonth(getFinancialReportMonthValue());
}
if (financialReportModal) {
  financialReportModal.addEventListener('show.bs.modal', function() {
    const now = new Date();
    financialReportSelectedMonth = now.getMonth();
    financialReportSelectedYear = now.getFullYear();
    updateFinancialReportCardsForSelectedMonth();
  });
  // Add event listeners for month navigation buttons
  const prevBtn = document.getElementById('financialReportMonthPrev');
  const nextBtn = document.getElementById('financialReportMonthNext');
  if (prevBtn) {
    prevBtn.addEventListener('click', function() {
      financialReportSelectedMonth--;
      if (financialReportSelectedMonth < 0) {
        financialReportSelectedMonth = 11;
        financialReportSelectedYear--;
      }
      updateFinancialReportCardsForSelectedMonth();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      financialReportSelectedMonth++;
      if (financialReportSelectedMonth > 11) {
        financialReportSelectedMonth = 0;
        financialReportSelectedYear++;
      }
      updateFinancialReportCardsForSelectedMonth();
    });
  }
}

// Render Monthly Profit Trend Chart
let profitTrendLineChart = null;
async function renderProfitTrendLineChart() {
  const ctxLine = document.getElementById('profitTrendLineChart').getContext('2d');
  try {
    const response = await fetch(API_BASE_URL + '/api/financial-report/monthly-profit-trend');
    if (!response.ok) throw new Error('Failed to fetch monthly profit trend');
    const data = await response.json();
    // Sort months from most recent to oldest, then reverse for left-to-right
    const months = (data.months || []).slice().reverse();
    const labels = months.map(m => {
      // Format as 'MMM YYYY'
      const [year, month] = m.month.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      return d.toLocaleString('default', { month: 'short', year: 'numeric' });
    });
    const profits = months.map(m => m.netProfit);
    if (profitTrendLineChart) profitTrendLineChart.destroy();
    profitTrendLineChart = new Chart(ctxLine, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Net Profit',
          data: profits,
          borderColor: 'rgb(26, 115, 232)',
          backgroundColor: 'rgba(26, 115, 232, 0.1)',
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: false, // Important for scrollable charts
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'shs:' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  } catch (err) {
    ctxLine.clearRect(0, 0, ctxLine.canvas.width, ctxLine.canvas.height);
    console.error('Error rendering Monthly Profit Trend chart:', err);
  }
}
// Render chart when Financial Report modal is shown
if (financialReportModal) {
  financialReportModal.addEventListener('show.bs.modal', renderProfitTrendLineChart);
}

// Export PDF for Financial Report
const exportPDFBtn = document.getElementById('financialReportExportPDF');
if (exportPDFBtn) {
  exportPDFBtn.addEventListener('click', async function () {
    try {
      // Show loading state
      const originalText = exportPDFBtn.innerHTML;
      exportPDFBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Generating PDF...';
      exportPDFBtn.disabled = true;

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      let y = 40;

      // Add company header
      pdf.setFillColor(41, 128, 185);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Financial Report', pageWidth / 2, 20, { align: 'center' });
      pdf.setTextColor(0, 0, 0);

      // Add generation date and time
      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${dateStr} at ${timeStr}`, pageWidth - 40, 50, { align: 'right' });

      // Month label with better styling
      const monthLabel = document.getElementById('financialReportMonthLabel').textContent;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Period: ${monthLabel}`, 40, 70);
      y = 90;

      // Summary section with better formatting
      pdf.setFillColor(248, 249, 250);
      pdf.rect(30, y - 10, pageWidth - 60, 80, 'F');
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(41, 128, 185);
      pdf.text('Financial Summary', 40, y);
      y += 25;

      // Get summary data
      const revenue = document.getElementById('financial-report-total-revenue').textContent;
      const expenses = document.getElementById('financial-report-total-expenses').textContent;
      const profit = document.getElementById('financial-report-net-profit').textContent;

      // Create summary table
      const summaryData = [
        ['Metric', 'Amount'],
        ['Total Revenue', revenue],
        ['Total Expenses', expenses],
        ['Net Profit', profit]
      ];

      pdf.autoTable({
        startY: y,
        head: [['Metric', 'Amount']],
        body: summaryData.slice(1), // Skip header row since we're using head
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 12,
          cellPadding: 8
        },
        columnStyles: {
          0: { cellWidth: 120, fontStyle: 'bold' },
          1: { cellWidth: 120, halign: 'right' }
        },
        margin: { left: 40, right: 40 }
      });

      y = pdf.lastAutoTable.finalY + 30;

      // Charts section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(41, 128, 185);
      pdf.text('Financial Analysis Charts', 40, y);
      y += 25;

      // Export Pie Chart as image
      const pieCanvas = document.getElementById('expenseRevenuePieChart');
      if (pieCanvas) {
        try {
          const pieImg = pieCanvas.toDataURL('image/png', 1.0);
          
          // Check if we need a new page
          if (y > pageHeight - 200) {
            pdf.addPage();
            y = 40;
          }
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text('Expense vs Revenue vs Profit Analysis', 40, y);
          y += 15;
          
          // Add chart with better positioning
          const chartWidth = 200;
          const chartHeight = 120;
          const chartX = 40;
          pdf.addImage(pieImg, 'PNG', chartX, y, chartWidth, chartHeight);
          y += chartHeight + 20;
        } catch (error) {
          console.warn('Could not export pie chart:', error);
        }
      }

      // Export Line Chart as image
      const lineCanvas = document.getElementById('profitTrendLineChart');
      if (lineCanvas) {
        try {
          const lineImg = lineCanvas.toDataURL('image/png', 1.0);
          
          // Check if we need a new page
          if (y > pageHeight - 200) {
            pdf.addPage();
            y = 40;
          }
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text('Monthly Profit Trend Analysis', 40, y);
          y += 15;
          
          // Add chart with better positioning
          const chartWidth = 400;
          const chartHeight = 120;
          const chartX = 40;
          pdf.addImage(lineImg, 'PNG', chartX, y, chartWidth, chartHeight);
          y += chartHeight + 20;
        } catch (error) {
          console.warn('Could not export line chart:', error);
        }
      }

      // Add footer with page numbers
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
      }

      // Save the PDF with better filename
      const filename = `Financial_Report_${monthLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr.replace(/\//g, '-')}.pdf`;
      pdf.save(filename);

      // Reset button
      exportPDFBtn.innerHTML = originalText;
      exportPDFBtn.disabled = false;

      // Show success message
      if (window.showNotification) {
        window.showNotification('Financial Report PDF exported successfully!', 'success');
      }

    } catch (error) {
      console.error('Error generating Financial Report PDF:', error);
      
      // Reset button
      exportPDFBtn.innerHTML = '<i class="fas fa-file-pdf me-1"></i> Export PDF';
      exportPDFBtn.disabled = false;

      // Show error message
      if (window.showNotification) {
        window.showNotification('Error generating PDF. Please try again.', 'error');
      }
    }
  });
}

// --- Transaction History Modal Logic ---
const transactionHistoryModal = document.getElementById('transactionHistoryModal');
if (transactionHistoryModal) {
  transactionHistoryModal.addEventListener('show.bs.modal', fetchAndRenderTransactionHistory);
}

// --- Transaction History Pagination Logic ---
const transactionHistoryPageSize = 4;
let transactionHistoryCache = [];
let transactionHistoryCurrentPage = 1;
let transactionHistoryTotalPages = 1;

function renderTransactionHistoryTablePage(page) {
  const tbody = document.getElementById('transactionHistoryTableBody');
  const total = transactionHistoryCache.length;
  transactionHistoryTotalPages = Math.ceil(total / transactionHistoryPageSize) || 1;
  const startIdx = (page - 1) * transactionHistoryPageSize;
  const endIdx = Math.min(startIdx + transactionHistoryPageSize, total);
  tbody.innerHTML = '';
  if (total === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No data</td></tr>';
    updateTransactionHistoryPaginationInfo(0, 0, 0);
    updateTransactionHistoryPaginationControls();
    return;
  }
  for (let i = startIdx; i < endIdx; i++) {
    const sale = transactionHistoryCache[i];
    const itemsStr = (sale.items && sale.items.length)
      ? sale.items.map(i => `${i.name}${i.quantity ? ` (${i.quantity}${i.unit ? i.unit : ''})` : ''}`).join(', ')
      : '-';
    const amount = Number(sale.total) || 0;
    const paymentMethod = sale.paymentMethodName === 'N/A' ? 'Credit' : sale.paymentMethodName;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><a href="#" class="text-decoration-underline">${sale.customerName || ''}</a></td>
      <td>${itemsStr}</td>
      <td><span class="fw-bold text-success">shs:${amount.toLocaleString()}</span></td>
      <td>${paymentMethod}</td>
    `;
    tbody.appendChild(tr);
  }
  updateTransactionHistoryPaginationInfo(startIdx + 1, endIdx, total);
  updateTransactionHistoryPaginationControls();
}

function updateTransactionHistoryPaginationInfo(start, end, total) {
  document.getElementById('transactionHistoryShowingText').textContent = `Showing ${start} to ${end} of ${total} items`;
}

function updateTransactionHistoryPaginationControls() {
  document.getElementById('transactionHistoryPrevPage').disabled = transactionHistoryCurrentPage <= 1;
  document.getElementById('transactionHistoryNextPage').disabled = transactionHistoryCurrentPage >= transactionHistoryTotalPages;
  document.getElementById('transactionHistoryCurrentPageInfo').textContent = `Page ${transactionHistoryCurrentPage} of ${transactionHistoryTotalPages}`;
}

function showTransactionHistoryPage(page) {
  transactionHistoryCurrentPage = page;
  renderTransactionHistoryTablePage(page);
}

document.getElementById('transactionHistoryPrevPage').addEventListener('click', function() {
  if (transactionHistoryCurrentPage > 1) showTransactionHistoryPage(transactionHistoryCurrentPage - 1);
});
document.getElementById('transactionHistoryNextPage').addEventListener('click', function() {
  if (transactionHistoryCurrentPage < transactionHistoryTotalPages) showTransactionHistoryPage(transactionHistoryCurrentPage + 1);
});

// --- Transaction History Filter Logic ---
const transactionHistoryDateInput = document.getElementById('transactionHistoryDateInput');
// Remove Payment Status filter logic for Transaction History
// Only keep date filter
let transactionHistorySelectedDate = null;

if (transactionHistoryModal) {
  transactionHistoryModal.addEventListener('show.bs.modal', () => {
    fetchAndRenderTransactionHistory();
  });
}

if (transactionHistoryDateInput) {
  transactionHistoryDateInput.addEventListener('change', function() {
    transactionHistorySelectedDate = this.value || null;
    fetchAndRenderTransactionHistory();
  });
}

// Update fetch to support only date filtering
async function fetchAndRenderTransactionHistory() {
  const tbody = document.getElementById('transactionHistoryTableBody');
  tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Loading...</td></tr>';
  try {
    let url = API_BASE_URL + '/api/sales/recent?page=1&limit=100';
    if (transactionHistorySelectedDate) {
      url += `&date=${transactionHistorySelectedDate}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    let sales = data.sales || [];
    transactionHistoryCache = sales;
    transactionHistoryCurrentPage = 1;
    showTransactionHistoryPage(1);
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading data</td></tr>';
    transactionHistoryCache = [];
    transactionHistoryCurrentPage = 1;
    showTransactionHistoryPage(1);
    console.error('Failed to load transaction history:', err);
  }
}

// --- Stock Analysis Modal: Fetch and display Total SKUs ---
const stockAnalysisModal = document.getElementById('stockAnalysisModal');
if (stockAnalysisModal) {
  stockAnalysisModal.addEventListener('show.bs.modal', () => {
    fetchAndRenderTotalSKUs();
    fetchAndRenderLowStockItems();
    fetchAndRenderRecentlyReceivedItems();
    fetchAndRenderStockAnalysisTable();
  });
}
async function fetchAndRenderTotalSKUs() {
  const elem = document.getElementById('stock-analysis-total-skus');
  if (!elem) return;
  elem.textContent = '...';
  try {
    const res = await fetch(API_BASE_URL + '/api/items/sku-count');
    const data = await res.json();
    elem.textContent = data.skuCount || 0;
  } catch (err) {
    elem.textContent = 'N/A';
  }
}

if (stockAnalysisModal) {
  stockAnalysisModal.addEventListener('show.bs.modal', () => {
    fetchAndRenderTotalSKUs();
    fetchAndRenderLowStockItems();
  });
}
async function fetchAndRenderLowStockItems() {
  const elem = document.getElementById('stock-analysis-low-stock');
  if (!elem) return;
  elem.textContent = '...';
  try {
    const res = await fetch(API_BASE_URL + '/api/items/low-stock-count');
    const data = await res.json();
    elem.textContent = data.lowStockCount || 0;
  } catch (err) {
    elem.textContent = 'N/A';
  }
}

if (stockAnalysisModal) {
  stockAnalysisModal.addEventListener('show.bs.modal', () => {
    fetchAndRenderTotalSKUs();
    fetchAndRenderLowStockItems();
    fetchAndRenderRecentlyReceivedItems();
  });
}
async function fetchAndRenderRecentlyReceivedItems() {
  const elem = document.getElementById('stock-analysis-recently-received');
  if (!elem) return;
  elem.textContent = '...';
  try {
    const res = await fetch(API_BASE_URL + '/api/items/recently-received-count');
    const data = await res.json();
    elem.textContent = data.recentlyReceivedCount || 0;
  } catch (err) {
    elem.textContent = 'N/A';
  }
}

if (stockAnalysisModal) {
  stockAnalysisModal.addEventListener('show.bs.modal', () => {
    fetchAndRenderTotalSKUs();
    fetchAndRenderLowStockItems();
    fetchAndRenderRecentlyReceivedItems();
    fetchAndRenderStockAnalysisTable();
  });
}
async function fetchAndRenderStockAnalysisTable() {
  const tbody = document.getElementById('stockAnalysisTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Loading...</td></tr>';
  try {
    const res = await fetch(API_BASE_URL + '/api/items/stock-table');
    const data = await res.json();
    const items = data.items || [];
    tbody.innerHTML = '';
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No data</td></tr>';
      return;
    }
    items.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><a href="#" class="text-decoration-underline text-primary">${item.name}</a></td>
        <td><span class="fw-bold">${item.currentStock}</span></td>
        <td>shs:${Number(item.unitPrice).toLocaleString()}</td>
        <td>shs:${Number(item.totalCost).toLocaleString()}</td>
        <td>${item.lastReceived || '-'}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading data</td></tr>';
  }
}

// --- Stock Analysis Table Pagination Logic ---
const stockAnalysisPageSize = 4;
window.stockAnalysisCache = [];
let stockAnalysisCurrentPage = 1;
let stockAnalysisTotalPages = 1;

function renderStockAnalysisTablePage(page) {
  const tbody = document.getElementById('stockAnalysisTableBody');
  const total = stockAnalysisFilteredCache.length;
  stockAnalysisTotalPages = Math.ceil(total / stockAnalysisPageSize) || 1;
  const startIdx = (page - 1) * stockAnalysisPageSize;
  const endIdx = Math.min(startIdx + stockAnalysisPageSize, total);
  tbody.innerHTML = '';
  if (total === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No data</td></tr>';
    updateStockAnalysisPaginationInfo(0, 0, 0);
    updateStockAnalysisPaginationControls();
    return;
  }
  for (let i = startIdx; i < endIdx; i++) {
    const item = stockAnalysisFilteredCache[i];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><a href="#" class="text-decoration-underline text-primary">${item.name}</a></td>
      <td><span class="fw-bold">${item.currentStock}</span></td>
      <td>shs:${Number(item.unitPrice).toLocaleString()}</td>
      <td>shs:${Number(item.totalCost).toLocaleString()}</td>
      <td>${item.lastReceived || '-'}</td>
    `;
    tbody.appendChild(tr);
  }
  updateStockAnalysisPaginationInfo(startIdx + 1, endIdx, total);
  updateStockAnalysisPaginationControls();
}

function updateStockAnalysisPaginationInfo(start, end, total) {
  document.getElementById('stockAnalysisShowingText').textContent = `Showing ${start} to ${end} of ${total} items`;
}

function updateStockAnalysisPaginationControls() {
  document.getElementById('stockAnalysisPrevPage').disabled = stockAnalysisCurrentPage <= 1;
  document.getElementById('stockAnalysisNextPage').disabled = stockAnalysisCurrentPage >= stockAnalysisTotalPages;
  document.getElementById('stockAnalysisCurrentPageInfo').textContent = `Page ${stockAnalysisCurrentPage} of ${stockAnalysisTotalPages}`;
}

function showStockAnalysisPage(page) {
  stockAnalysisCurrentPage = page;
  renderStockAnalysisTablePage(page);
}

document.getElementById('stockAnalysisPrevPage').addEventListener('click', function() {
  if (stockAnalysisCurrentPage > 1) showStockAnalysisPage(stockAnalysisCurrentPage - 1);
});
document.getElementById('stockAnalysisNextPage').addEventListener('click', function() {
  if (stockAnalysisCurrentPage < stockAnalysisTotalPages) showStockAnalysisPage(stockAnalysisCurrentPage + 1);
});

// Update fetch to cache all records and show first page
async function fetchAndRenderStockAnalysisTable() {
  const tbody = document.getElementById('stockAnalysisTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Loading...</td></tr>';
  try {
    const res = await fetch(API_BASE_URL + '/api/items/stock-table');
    const data = await res.json();
    stockAnalysisCache = data.items || [];
    stockAnalysisFilteredCache = [...stockAnalysisCache];
    stockAnalysisCurrentPage = 1;
    showStockAnalysisPage(1);
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading data</td></tr>';
    stockAnalysisCache = [];
    stockAnalysisFilteredCache = [];
    stockAnalysisCurrentPage = 1;
    showStockAnalysisPage(1);
  }
}

// --- Stock Analysis Table Search/Filter Logic ---
let stockAnalysisFilteredCache = [];
const stockAnalysisSearchInput = document.getElementById('stockAnalysisSearchInput');
const stockAnalysisStatusSelect = document.getElementById('stockAnalysisStatusSelect');

function applyStockAnalysisFilters() {
  const search = stockAnalysisSearchInput ? stockAnalysisSearchInput.value.trim().toLowerCase() : '';
  const status = stockAnalysisStatusSelect ? stockAnalysisStatusSelect.value : '';
  let filtered = [...stockAnalysisCache];
  // Status filter
  if (status === 'in') {
    filtered = filtered.filter(item => item.currentStock > (item.minimum_stock ?? 0));
  } else if (status === 'out') {
    filtered = filtered.filter(item => {
      // Out of stock: total quantity is zero OR at/below minimum_stock (if defined)
      const minStock = (typeof item.minimum_stock === 'number') ? item.minimum_stock : 0;
      return item.currentStock === 0 || item.currentStock <= minStock;
    });
  }
  // Search filter
  if (search) {
    const matches = filtered.filter(item => item.name.toLowerCase().includes(search));
    const nonMatches = filtered.filter(item => !item.name.toLowerCase().includes(search));
    stockAnalysisFilteredCache = [...matches, ...nonMatches];
  } else {
    stockAnalysisFilteredCache = filtered;
  }
  stockAnalysisCurrentPage = 1;
  renderStockAnalysisTablePage(stockAnalysisCurrentPage);
}

if (stockAnalysisSearchInput) {
  stockAnalysisSearchInput.addEventListener('input', applyStockAnalysisFilters);
}
if (stockAnalysisStatusSelect) {
  stockAnalysisStatusSelect.addEventListener('change', applyStockAnalysisFilters);
}
// Patch renderStockAnalysisTablePage to use filtered cache
function renderStockAnalysisTablePage(page) {
  const tbody = document.getElementById('stockAnalysisTableBody');
  const total = stockAnalysisFilteredCache.length;
  stockAnalysisTotalPages = Math.ceil(total / stockAnalysisPageSize) || 1;
  const startIdx = (page - 1) * stockAnalysisPageSize;
  const endIdx = Math.min(startIdx + stockAnalysisPageSize, total);
  tbody.innerHTML = '';
  if (total === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No data</td></tr>';
    updateStockAnalysisPaginationInfo(0, 0, 0);
    updateStockAnalysisPaginationControls();
    return;
  }
  for (let i = startIdx; i < endIdx; i++) {
    const item = stockAnalysisFilteredCache[i];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><a href="#" class="text-decoration-underline text-primary">${item.name}</a></td>
      <td><span class="fw-bold">${item.currentStock}</span></td>
      <td>shs:${Number(item.unitPrice).toLocaleString()}</td>
      <td>shs:${Number(item.totalCost).toLocaleString()}</td>
      <td>${item.lastReceived || '-'}</td>
    `;
    tbody.appendChild(tr);
  }
  updateStockAnalysisPaginationInfo(startIdx + 1, endIdx, total);
  updateStockAnalysisPaginationControls();
}
// Patch fetchAndRenderStockAnalysisTable to update filtered cache
async function fetchAndRenderStockAnalysisTable() {
  const tbody = document.getElementById('stockAnalysisTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Loading...</td></tr>';
  try {
    const res = await fetch(API_BASE_URL + '/api/items/stock-table');
    const data = await res.json();
    stockAnalysisCache = data.items || [];
    stockAnalysisFilteredCache = [...stockAnalysisCache];
    stockAnalysisCurrentPage = 1;
    applyStockAnalysisFilters();
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading data</td></tr>';
    stockAnalysisCache = [];
    stockAnalysisFilteredCache = [];
    stockAnalysisCurrentPage = 1;
    renderStockAnalysisTablePage(1);
  }
}

// --- Top Stock Value Bar Chart (Scrollable) ---
let topStockValueBarChart = null;
async function renderTopStockValueBarChart() {
  const canvas = document.getElementById('topStockValueBarChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  try {
    const res = await fetch(API_BASE_URL + '/api/items/stock-table');
    const data = await res.json();
    const items = data.items || [];
    if (!items.length) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      return;
    }
    // Prepare data for chart
    const labels = items.map(item => item.name);
    const values = items.map(item => item.totalCost);
    // Destroy previous chart if exists
    if (topStockValueBarChart) topStockValueBarChart.destroy();
    // Dynamically set width for horizontal scroll if many items
    const minBarWidth = 60;
    const chartWidth = Math.max(600, labels.length * minBarWidth);
    canvas.width = chartWidth;
    topStockValueBarChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Stock Value',
          data: values,
          backgroundColor: 'rgb(255, 193, 7)',
          borderRadius: 5
        }]
      },
      options: {
        indexAxis: 'x',
        responsive: false, // Important for scrollable charts
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Cost (shs)'
            },
            ticks: {
              callback: function(value) {
                return 'shs:' + value.toLocaleString();
              }
            }
          },
          x: {
            title: {
              display: true,
              text: 'Products'
            },
            ticks: {
              autoSkip: false,
              maxRotation: 45,
              minRotation: 30
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ' shs' + context.parsed.y.toLocaleString();
              }
            }
          }
        }
      }
    });
  } catch (err) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    console.error('Error rendering Top Stock Value Bar Chart:', err);
  }
}
if (stockAnalysisModal) {
  stockAnalysisModal.addEventListener('show.bs.modal', renderTopStockValueBarChart);
}

// --- Stock Movement Trend Line Chart ---
let stockMovementLineChart = null;
async function renderStockMovementLineChart() {
  const canvas = document.getElementById('stockMovementLineChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  try {
    const res = await fetch(API_BASE_URL + '/api/stock/movement-trend');
    const data = await res.json();
    const labels = data.months || [];
    const inflow = data.inflow || [];
    const outflow = data.outflow || [];
    if (stockMovementLineChart) stockMovementLineChart.destroy();
    stockMovementLineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Stock Inflow',
            data: inflow,
            borderColor: 'rgb(26, 115, 232)', // blue
            backgroundColor: 'rgba(26, 115, 232, 0.1)',
            tension: 0.3,
            fill: false
          },
          {
            label: 'Stock Outflow',
            data: outflow,
            borderColor: 'rgb(40, 167, 69)', // green
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            tension: 0.3,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Quantity' }
          },
          x: {
            title: { display: true, text: 'Month' }
          }
        }
      }
    });
  } catch (err) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    console.error('Error rendering Stock Movement Trend chart:', err);
  }
}
// Use the already declared stockAnalysisModal for event binding
if (stockAnalysisModal) {
  stockAnalysisModal.addEventListener('show.bs.modal', renderStockMovementLineChart);
}

// --- Cash Utilization Ratio Chart (Dynamic) ---
// --- Cash Utilization Ratio Month Navigation ---
let cashUtilizationSelectedMonth = new Date().getMonth();
let cashUtilizationSelectedYear = new Date().getFullYear();
function getCashUtilizationMonthValue() {
  return `${cashUtilizationSelectedYear}-${String(cashUtilizationSelectedMonth + 1).padStart(2, '0')}`;
}
function updateCashUtilizationMonthLabel() {
  const label = document.getElementById('cashUtilizationMonthLabel');
  if (label) {
    const d = new Date(cashUtilizationSelectedYear, cashUtilizationSelectedMonth, 1);
    label.textContent = d.toLocaleString('default', { month: 'long', year: 'numeric' });
  }
}
async function renderCashUtilizationRatioChart() {
  const ctx = document.getElementById('cash-utilization-chart').getContext('2d');
  try {
    const month = getCashUtilizationMonthValue();
    const res = await fetch(API_BASE_URL + `/api/cash-utilization-ratio?month=${month}`);
    const data = await res.json();
    const { percentages } = data;
    const chartData = [percentages.stockInvestment, percentages.operationalExpenses, percentages.pendingPayments, percentages.sales];
    const chartLabels = ['Stock Investment', 'Operational Expenses', 'Pending Payments', 'Sales'];
    const chartColors = [
      'rgb(26, 115, 232)', // blue
      'rgb(40, 167, 69)',  // green
      'rgb(255, 193, 7)',  // yellow
      'rgb(255, 87, 34)'   // orange for Sales
    ];
    if (window.cashUtilizationChart) window.cashUtilizationChart.destroy();
    window.cashUtilizationChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chartLabels,
        datasets: [{
          data: chartData,
          backgroundColor: chartColors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        cutout: '70%'
      }
    });
    // Update legend percentages in the DOM
    const legendMap = {
      'Stock Investment': percentages.stockInvestment,
      'Operational Expenses': percentages.operationalExpenses,
      'Pending Payments': percentages.pendingPayments,
      'Sales': percentages.sales
    };
    document.querySelectorAll('#cash-utilization-legend .legend-label').forEach(el => {
      const label = el.getAttribute('data-label');
      if (legendMap[label] !== undefined) {
        el.textContent = `${label} (${legendMap[label]}%)`;
      }
    });
    updateCashUtilizationMonthLabel();
  } catch (err) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    console.error('Error rendering Cash Utilization Ratio chart:', err);
  }
}
// Month navigation event listeners
const cashUtilizationMonthPrev = document.getElementById('cashUtilizationMonthPrev');
const cashUtilizationMonthNext = document.getElementById('cashUtilizationMonthNext');
if (cashUtilizationMonthPrev) {
  cashUtilizationMonthPrev.addEventListener('click', function() {
    cashUtilizationSelectedMonth--;
    if (cashUtilizationSelectedMonth < 0) {
      cashUtilizationSelectedMonth = 11;
      cashUtilizationSelectedYear--;
    }
    renderCashUtilizationRatioChart();
  });
}
if (cashUtilizationMonthNext) {
  cashUtilizationMonthNext.addEventListener('click', function() {
    cashUtilizationSelectedMonth++;
    if (cashUtilizationSelectedMonth > 11) {
      cashUtilizationSelectedMonth = 0;
      cashUtilizationSelectedYear++;
    }
    renderCashUtilizationRatioChart();
  });
}
window.addEventListener('DOMContentLoaded', renderCashUtilizationRatioChart);

// --- Top Performing Products by ROI Chart ---
async function renderTopROIChart() {
  const ctx = document.getElementById('roi-chart').getContext('2d');
  try {
    const res = await fetch(API_BASE_URL + '/api/items/top-roi');
    const data = await res.json();
    const items = data.items || [];
    const labels = items.map(i => i.name);
    const values = items.map(i => i.roi);
    if (window.topROIChart) window.topROIChart.destroy();
    window.topROIChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'ROI (%)',
          data: values,
          backgroundColor: 'rgb(26, 115, 232)',
          borderRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'ROI (%)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Products'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  } catch (err) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    console.error('Error rendering Top ROI chart:', err);
  }
}
// Render chart when modal is shown
window.addEventListener('DOMContentLoaded', renderTopROIChart);

// --- PDF Export Functionality for Stock Analysis ---

// Event listener for Export PDF button - using event delegation for dynamic content
document.addEventListener('click', function(event) {
  if (event.target && event.target.id === 'exportStockAnalysisPDF') {
    console.log('Export PDF button clicked');
    exportStockAnalysisToPDF();
  }
});

// Alternative approach: attach event listener when modal is shown
document.addEventListener('DOMContentLoaded', function() {
  const stockAnalysisModal = document.getElementById('stockAnalysisModal');
  if (stockAnalysisModal) {
    stockAnalysisModal.addEventListener('shown.bs.modal', function() {
      const exportPDFBtn = document.getElementById('exportStockAnalysisPDF');
      if (exportPDFBtn && !exportPDFBtn.hasAttribute('data-pdf-listener-attached')) {
        exportPDFBtn.addEventListener('click', exportStockAnalysisToPDF);
        exportPDFBtn.setAttribute('data-pdf-listener-attached', 'true');
      }
    });
  }
});

// Helper function to show notifications
window.showNotification = function(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show position-fixed`;
  notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  notification.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}
