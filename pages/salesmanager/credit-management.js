console.log('credit-management.js loaded');
// Fetch and display the count of active credit customers
function fetchActiveCreditCustomersCount() {
  fetch(API_BASE_URL + '/api/credit-customers/count')
    .then(response => {
      console.log('API response status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('API response data:', data);
      const countElem = document.getElementById('activeCreditCustomersCount');
      if (countElem) {
        countElem.textContent = data.count !== undefined ? data.count : '--';
      }
    })
    .catch(err => {
      console.error('Fetch error:', err);
      const countElem = document.getElementById('activeCreditCustomersCount');
      if (countElem) {
        countElem.textContent = '--';
      }
    });
}

let cachedCreditCustomers = [];

// Fetch and render credit customers in the modal
function fetchAndRenderCreditCustomers() {
  fetch(API_BASE_URL + '/api/customer-credit-accounts')
    .then(response => response.json())
    .then(data => {
      cachedCreditCustomers = data;
      renderCreditCustomersTable(data);
    })
    .catch(err => {
      const tbody = document.getElementById('customerList');
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load data</td></tr>';
    });
}

function renderCreditCustomersTable(customers) {
  const tbody = document.getElementById('customerList');
  tbody.innerHTML = '';
  customers.forEach(customer => {
    // Format fields
    const name = customer.customer_name || '';
    const contact = customer.customer_phone ? `<i class="fas fa-phone-alt me-1 text-secondary"></i>${customer.customer_phone}` : '';
    const outstanding = customer.balance !== undefined ? `<span class="fw-bold text-danger">shs:${customer.balance.toLocaleString()}</span>` : '';
    const recentDate = customer.latest_transaction_date ? new Date(customer.latest_transaction_date).toISOString().split('T')[0] : '';
    const recentAmount = customer.total_credit !== undefined ? `<span class="text-success">shs:${customer.total_credit.toLocaleString()}</span>` : '';
    let statusClass = 'bg-gradient-secondary';
    if (customer.status === 'Overdue') statusClass = 'bg-gradient-danger';
    else if (customer.status === 'Pending') statusClass = 'bg-gradient-warning';
    else if (customer.status === 'Paid') statusClass = 'bg-gradient-success';
    const status = `<span class="badge ${statusClass}">${customer.status || ''}</span>`;
    tbody.innerHTML += `
      <tr>
        <td class="fw-bold">${name}</td>
        <td>${contact}</td>
        <td>${outstanding}</td>
        <td>${recentDate}</td>
        <td>${recentAmount}</td>
        <td>${status}</td>
      </tr>
    `;
  });
  if (customers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-warning">No matching customers found</td></tr>';
  }
}

// Search filter logic
const customerSearchInput = document.getElementById('customerSearchInput');
// Sorting logic for the modal
const filterOutstanding = document.getElementById('filterOutstanding');
const filterDate = document.getElementById('filterDate');
const filterName = document.getElementById('filterName');

function applyCustomerSortAndRender() {
  let customers = [...cachedCreditCustomers];
  // Apply search filter if any
  const searchValue = customerSearchInput.value.trim().toLowerCase();
  if (searchValue) {
    const matches = customers.filter(c => (c.customer_name || '').toLowerCase().includes(searchValue));
    const nonMatches = customers.filter(c => !(c.customer_name || '').toLowerCase().includes(searchValue));
    customers = [...matches, ...nonMatches];
  }
  // Sort by Outstanding Amount
  if (filterOutstanding.value === 'high') {
    customers.sort((a, b) => (b.balance || 0) - (a.balance || 0));
  } else if (filterOutstanding.value === 'low') {
    customers.sort((a, b) => (a.balance || 0) - (b.balance || 0));
  }
  // Sort by Recent Transaction Date
  if (filterDate.value === 'newest') {
    customers.sort((a, b) => new Date(b.latest_transaction_date || 0) - new Date(a.latest_transaction_date || 0));
  } else if (filterDate.value === 'oldest') {
    customers.sort((a, b) => new Date(a.latest_transaction_date || 0) - new Date(b.latest_transaction_date || 0));
  }
  // Sort by Name
  if (filterName.value === 'az') {
    customers.sort((a, b) => (a.customer_name || '').localeCompare(b.customer_name || ''));
  } else if (filterName.value === 'za') {
    customers.sort((a, b) => (b.customer_name || '').localeCompare(a.customer_name || ''));
  }
  renderCreditCustomersTable(customers);
}

if (filterOutstanding) filterOutstanding.addEventListener('change', applyCustomerSortAndRender);
if (filterDate) filterDate.addEventListener('change', applyCustomerSortAndRender);
if (filterName) filterName.addEventListener('change', applyCustomerSortAndRender);
if (customerSearchInput) customerSearchInput.addEventListener('input', applyCustomerSortAndRender);

// Fetch and display the total outstanding amount
function fetchTotalOutstandingAmount() {
  fetch(API_BASE_URL + '/api/credit-customers/total-outstanding')
    .then(response => response.json())
    .then(data => {
      const elem = document.getElementById('totalOutstandingAmount');
      if (elem) {
        elem.textContent = data.totalOutstanding !== undefined ? data.totalOutstanding.toLocaleString() : '--';
      }
    })
    .catch(() => {
      const elem = document.getElementById('totalOutstandingAmount');
      if (elem) elem.textContent = '--';
    });
}

// Fetch and render outstanding customers in the modal
function fetchAndRenderOutstandingCustomers() {
  fetch(API_BASE_URL + '/api/customer-credit-accounts')
    .then(response => response.json())
    .then(data => {
      const tbody = document.getElementById('outstandingCustomerList');
      tbody.innerHTML = '';
      data.forEach(customer => {
        // Only show customers with a positive balance
        if ((customer.balance || 0) > 0) {
          const name = customer.customer_name || '';
          const amount = customer.balance !== undefined ? `<span class="fw-bold text-success">shs:${customer.balance.toLocaleString()}</span>` : '';
          tbody.innerHTML += `
            <tr>
              <td>${name}</td>
              <td>${amount}</td>
            </tr>
          `;
        }
      });
      if (tbody.innerHTML === '') {
        tbody.innerHTML = '<tr><td colspan="2" class="text-center text-warning">No outstanding customers found</td></tr>';
      }
    })
    .catch(() => {
      const tbody = document.getElementById('outstandingCustomerList');
      tbody.innerHTML = '<tr><td colspan="2" class="text-center text-danger">Failed to load data</td></tr>';
    });
}

// Fetch and display the overdue amount
function fetchOverdueAmount() {
  fetch(API_BASE_URL + '/api/credit-customers/overdue-amount')
    .then(response => response.json())
    .then(data => {
      const elem = document.getElementById('overdueAmount');
      if (elem) {
        elem.textContent = data.totalOverdue !== undefined ? data.totalOverdue.toLocaleString() : '--';
      }
      // Also update the overdue customers modal to ensure consistency
      fetchAndRenderOverdueCustomers();
    })
    .catch(() => {
      const elem = document.getElementById('overdueAmount');
      if (elem) elem.textContent = '--';
    });
}

// Fetch and render overdue customers in the modal
function fetchAndRenderOverdueCustomers() {
  fetch(API_BASE_URL + '/api/credit-transactions/all')
    .then(response => response.json())
    .then(data => {
      const now = new Date();
      const tbody = document.getElementById('overdueCustomerList');
      tbody.innerHTML = '';
      
      // Group overdue transactions by customer
      const customerOverdueMap = new Map();
      let debugInfo = [];
      
      data.forEach(transaction => {
        // Check if transaction is overdue (not paid and due date passed)
        // Only include transactions that are actually overdue (past due date)
        const dueDate = new Date(transaction.agreed_repayment_date);
        const isOverdue = transaction.payment_status !== 'paid' && 
                         transaction.agreed_repayment_date && 
                         dueDate < now &&
                         (transaction.total_amount || 0) > (transaction.amount_paid || 0);
        
        // Debug info
        if (transaction.payment_status !== 'paid' && transaction.agreed_repayment_date) {
          debugInfo.push({
            customer: transaction.customer_id.name,
            dueDate: dueDate.toISOString().split('T')[0],
            isOverdue: isOverdue,
            amount: (transaction.total_amount || 0) - (transaction.amount_paid || 0),
            status: transaction.payment_status
          });
        }
        
        if (isOverdue) {
          
          const customerId = transaction.customer_id._id || transaction.customer_id;
          const customerName = transaction.customer_id.name || 'Unknown Customer';
          const overdueAmount = (transaction.total_amount || 0) - (transaction.amount_paid || 0);
          
          // Add to customer overdue map
          if (customerOverdueMap.has(customerId)) {
            customerOverdueMap.get(customerId).overdueAmount += overdueAmount;
          } else {
            customerOverdueMap.set(customerId, {
              name: customerName,
              overdueAmount: overdueAmount
            });
          }
        }
      });
      
      // Render the overdue customers
      let totalOverdue = 0;
      customerOverdueMap.forEach((customer, customerId) => {
        const name = customer.name;
        const amount = `<span class="fw-bold text-danger">shs:${customer.overdueAmount.toLocaleString()}</span>`;
        totalOverdue += customer.overdueAmount;
        
        tbody.innerHTML += `
          <tr>
            <td>${name}</td>
            <td>${amount}</td>
          </tr>
        `;
      });
      
      // Add total row
      if (customerOverdueMap.size > 0) {
        tbody.innerHTML += `
          <tr class="table-info">
            <td class="fw-bold">Total Overdue</td>
            <td class="fw-bold text-danger">shs:${totalOverdue.toLocaleString()}</td>
          </tr>
        `;
      }
      
      // Debug logging
      console.log('=== Overdue Transactions Debug ===');
      console.log('Current date:', now.toISOString().split('T')[0]);
      console.log('All unpaid transactions with due dates:');
      debugInfo.forEach(info => {
        console.log(`${info.customer}: Due ${info.dueDate}, Amount: ${info.amount}, Overdue: ${info.isOverdue}`);
      });
      console.log('Total overdue amount:', totalOverdue);
      console.log('===============================');
      
      if (customerOverdueMap.size === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="text-center text-warning">No overdue customers found</td></tr>';
      }
    })
    .catch(() => {
      const tbody = document.getElementById('overdueCustomerList');
      tbody.innerHTML = '<tr><td colspan="2" class="text-center text-danger">Failed to load data</td></tr>';
    });
}

// Verification function to check if card amount matches modal total
function verifyOverdueAmountConsistency() {
  const cardAmount = document.getElementById('overdueAmount');
  const cardValue = cardAmount ? parseFloat(cardAmount.textContent.replace(/,/g, '')) : 0;
  
  // Calculate modal total
  const overdueRows = document.querySelectorAll('#overdueCustomerList tr:not(.table-info)');
  let modalTotal = 0;
  
  overdueRows.forEach(row => {
    const amountCell = row.querySelector('td:last-child span');
    if (amountCell) {
      const amountText = amountCell.textContent.replace('shs:', '').replace(/,/g, '');
      modalTotal += parseFloat(amountText) || 0;
    }
  });
  
  console.log('Card overdue amount:', cardValue);
  console.log('Modal total overdue amount:', modalTotal);
  
  if (Math.abs(cardValue - modalTotal) > 0.01) {
    console.warn('⚠️ Overdue amount mismatch detected!');
    console.warn('Card shows:', cardValue, 'but modal total is:', modalTotal);
  } else {
    console.log('✅ Overdue amounts are consistent');
  }
}

// --- Credit Transactions Pagination ---
const creditTransactionsPageSize = 4;
let creditTransactionsCurrentPage = 1;
let creditTransactionsTotalPages = 1;
let creditTransactionsCache = [];

function updateCreditTransactionsPaginationInfo(start, end, total) {
  document.getElementById('creditTransactionsShowingText').textContent = `Showing ${start} to ${end} of ${total} items`;
}
function updateCreditTransactionsPaginationControls() {
  document.getElementById('creditTransactionsPrevPage').disabled = creditTransactionsCurrentPage <= 1;
  document.getElementById('creditTransactionsNextPage').disabled = creditTransactionsCurrentPage >= creditTransactionsTotalPages;
  document.getElementById('creditTransactionsCurrentPageInfo').textContent = `Page ${creditTransactionsCurrentPage} of ${creditTransactionsTotalPages}`;
}

// Refactor fetchAndRenderCreditTransactions to use pagination
function renderCreditTransactionsTable(data) {
  const tbody = document.getElementById('creditTransactionsList');
  tbody.innerHTML = '';
  data.forEach(tx => {
    // Customer info
    const customer = tx.customer_id || {};
    const customerName = customer.name || '';
    const customerContact = customer.phone || customer.email || '';
    // Items info (from sale)
    let itemsCount = '';
    let itemsDetails = '';
    if (tx.sale_id && Array.isArray(tx.sale_id.items)) {
      itemsCount = tx.sale_id.items.length + ' Items';
      itemsDetails = tx.sale_id.items.map(item => {
        if (item && item.item_id && item.item_id.name) {
          return item.item_id.name + (item.quantity_sold ? ` (${item.quantity_sold})` : '');
        }
        return '';
      }).filter(Boolean).join(', ');
    }
    // Repayment date
    const repaymentDate = tx.agreed_repayment_date ? new Date(tx.agreed_repayment_date).toISOString().split('T')[0] : '';
    // Amount (balance)
    const balance = (tx.total_amount || 0) - (tx.amount_paid || 0);
    // Status
    let status = 'Pending';
    let statusClass = 'badge badge-sm bg-gradient-warning';
    const now = new Date();
    if (tx.payment_status === 'paid' || balance <= 0) {
      status = 'Completed';
      statusClass = 'badge badge-sm bg-gradient-success';
    } else if (tx.agreed_repayment_date && new Date(tx.agreed_repayment_date) < now) {
      status = 'Overdue';
      statusClass = 'badge badge-sm bg-gradient-danger';
    }
    tbody.innerHTML += `
      <tr>
        <td>
          <div class="d-flex px-2 py-1">
            <div class="d-flex flex-column justify-content-center">
              <h6 class="mb-0 text-sm">${customerName}</h6>
              <p class="text-xs text-secondary mb-0">${customerContact}</p>
            </div>
          </div>
        </td>
        <td>
          <p class="text-xs font-weight-bold mb-0">${itemsCount}</p>
          <p class="text-xs text-secondary mb-0">${itemsDetails}</p>
        </td>
        <td class="align-middle text-center text-sm">
          <span class="text-secondary text-xs font-weight-bold">${repaymentDate}</span>
        </td>
        <td class="align-middle text-center">
          <span class="text-secondary text-xs font-weight-bold">shs:${balance.toLocaleString()}</span>
        </td>
        <td class="align-middle text-center text-sm">
          <span class="${statusClass}">${status}</span>
        </td>
      </tr>
    `;
  });
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-warning">No credit transactions found</td></tr>';
  }
}
function fetchAndRenderCreditTransactions() {
  fetch(API_BASE_URL + '/api/credit-transactions/all')
    .then(response => response.json())
    .then(data => {
      creditTransactionsCache = data;
      renderCreditTransactionsTablePageFiltered(1);
    })
    .catch(() => {
      creditTransactionsCache = [];
      renderCreditTransactionsTable([]);
      updateCreditTransactionsPaginationInfo(0, 0, 0);
      updateCreditTransactionsPaginationControls();
    });
}

// --- Credit Transactions Status Filtering ---
let creditTransactionsStatus = 'all';
const creditTransactionsStatusBtn = document.getElementById('creditTransactionsStatusBtn');
const creditTransactionsStatusDropdown = document.getElementById('creditTransactionsStatusDropdown');

// --- Credit Transactions Sorting Helper ---
function sortCreditTransactions(arr) {
  return [...arr].sort((a, b) => {
    const getStatusOrder = tx => {
      const now = new Date();
      const balance = (tx.total_amount || 0) - (tx.amount_paid || 0);
      if (tx.payment_status === 'paid' || balance <= 0) return 2; // Completed last
      if (tx.agreed_repayment_date && new Date(tx.agreed_repayment_date) < now) return 0; // Overdue first
      return 1; // Pending second
    };
    return getStatusOrder(a) - getStatusOrder(b);
  });
}

function filterCreditTransactionsByStatus() {
  let filtered = creditTransactionsCache;
  if (creditTransactionsStatus !== 'all') {
    filtered = creditTransactionsCache.filter(tx => {
      const now = new Date();
      const balance = (tx.total_amount || 0) - (tx.amount_paid || 0);
      if (creditTransactionsStatus === 'pending') {
        return (tx.payment_status !== 'paid' && balance > 0 && (!tx.agreed_repayment_date || new Date(tx.agreed_repayment_date) >= now));
      } else if (creditTransactionsStatus === 'overdue') {
        return (tx.payment_status !== 'paid' && balance > 0 && tx.agreed_repayment_date && new Date(tx.agreed_repayment_date) < now);
      } else if (creditTransactionsStatus === 'paid') {
        return (tx.payment_status === 'paid' || balance <= 0);
      }
      return true;
    });
  }
  return sortCreditTransactions(filtered);
}

function renderCreditTransactionsTablePageFiltered(page) {
  creditTransactionsCurrentPage = page;
  const filtered = filterCreditTransactionsByStatus();
  const total = filtered.length;
  creditTransactionsTotalPages = Math.ceil(total / creditTransactionsPageSize) || 1;
  const startIdx = (creditTransactionsCurrentPage - 1) * creditTransactionsPageSize;
  const endIdx = Math.min(startIdx + creditTransactionsPageSize, total);
  renderCreditTransactionsTable(filtered.slice(startIdx, endIdx));
  updateCreditTransactionsPaginationInfo(total === 0 ? 0 : startIdx + 1, endIdx, total);
  updateCreditTransactionsPaginationControls();
}

if (creditTransactionsStatusDropdown) {
  creditTransactionsStatusDropdown.querySelectorAll('.credit-status-option').forEach(opt => {
    opt.addEventListener('click', e => {
      e.preventDefault();
      const status = opt.getAttribute('data-status');
      if (status) {
        creditTransactionsStatus = status;
        creditTransactionsStatusBtn.innerHTML = `<i class='fas fa-calendar me-1'></i> ${opt.textContent}`;
        renderCreditTransactionsTablePageFiltered(1);
      }
    });
  });
}
// Patch pagination to use filtered data
const origPrev = document.getElementById('creditTransactionsPrevPage');
const origNext = document.getElementById('creditTransactionsNextPage');
if (origPrev) origPrev.onclick = function() {
  if (creditTransactionsCurrentPage > 1) renderCreditTransactionsTablePageFiltered(creditTransactionsCurrentPage - 1);
};
if (origNext) origNext.onclick = function() {
  if (creditTransactionsCurrentPage < creditTransactionsTotalPages) renderCreditTransactionsTablePageFiltered(creditTransactionsCurrentPage + 1);
};

// --- Export Credit Transactions to PDF ---
const creditTransactionsExportBtn = document.getElementById('creditTransactionsExportBtn');
if (creditTransactionsExportBtn) {
  creditTransactionsExportBtn.addEventListener('click', () => {
    if (!window.jspdf || !window.html2canvas) {
      alert('jsPDF and html2canvas are required for export.');
      return;
    }
    const filtered = filterCreditTransactionsByStatus();
    // Build HTML table for export
    let html = `<table style='width:100%;border-collapse:collapse;font-size:12px;'>`;
    html += `<thead><tr>`;
    html += `<th style='border:1px solid #ccc;padding:4px;'>Customer</th>`;
    html += `<th style='border:1px solid #ccc;padding:4px;'>Items</th>`;
    html += `<th style='border:1px solid #ccc;padding:4px;'>Date</th>`;
    html += `<th style='border:1px solid #ccc;padding:4px;'>Amount</th>`;
    html += `<th style='border:1px solid #ccc;padding:4px;'>Status</th>`;
    html += `</tr></thead><tbody>`;
    filtered.forEach(tx => {
      const customer = tx.customer_id || {};
      const customerName = customer.name || '';
      let itemsDetails = '';
      if (tx.sale_id && Array.isArray(tx.sale_id.items)) {
        itemsDetails = tx.sale_id.items.map(item => {
          if (item && item.item_id && item.item_id.name) {
            return item.item_id.name + (item.quantity_sold ? ` (${item.quantity_sold})` : '');
          }
          return '';
        }).filter(Boolean).join(', ');
      }
      const repaymentDate = tx.agreed_repayment_date ? new Date(tx.agreed_repayment_date).toISOString().split('T')[0] : '';
      const balance = (tx.total_amount || 0) - (tx.amount_paid || 0);
      let status = 'Pending';
      const now = new Date();
      if (tx.payment_status === 'paid' || balance <= 0) status = 'Completed';
      else if (tx.agreed_repayment_date && new Date(tx.agreed_repayment_date) < now) status = 'Overdue';
      html += `<tr>`;
      html += `<td style='border:1px solid #ccc;padding:4px;'>${customerName}</td>`;
      html += `<td style='border:1px solid #ccc;padding:4px;'>${itemsDetails}</td>`;
      html += `<td style='border:1px solid #ccc;padding:4px;'>${repaymentDate}</td>`;
      html += `<td style='border:1px solid #ccc;padding:4px;'>shs:${balance.toLocaleString()}</td>`;
      html += `<td style='border:1px solid #ccc;padding:4px;'>${status}</td>`;
      html += `</tr>`;
    });
    html += `</tbody></table>`;
    // Create a container for html2canvas
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    window.html2canvas(container, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new window.jspdf.jsPDF('l', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 40;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
      pdf.save('credit-transactions.pdf');
      document.body.removeChild(container);
    });
  });
}

// Repayment Tracking Calendar Logic
const repaymentCalendarGrid = document.getElementById('repaymentCalendarGrid');
const repaymentMonthSelect = document.querySelector('.card-header select.form-select');

// Repayment Tracking Month Navigation
const repaymentMonthLabel = document.getElementById('repaymentMonthLabel');
const repaymentMonthPrev = document.getElementById('repaymentMonthPrev');
const repaymentMonthNext = document.getElementById('repaymentMonthNext');
let repaymentSelectedMonth = new Date().getMonth();
let repaymentSelectedYear = new Date().getFullYear();

function updateRepaymentMonthLabel() {
  const date = new Date(repaymentSelectedYear, repaymentSelectedMonth, 1);
  repaymentMonthLabel.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });
}
function changeRepaymentMonth(delta) {
  repaymentSelectedMonth += delta;
  if (repaymentSelectedMonth < 0) {
    repaymentSelectedMonth = 11;
    repaymentSelectedYear--;
  } else if (repaymentSelectedMonth > 11) {
    repaymentSelectedMonth = 0;
    repaymentSelectedYear++;
  }
  updateRepaymentMonthLabel();
  renderRepaymentCalendar();
}
if (repaymentMonthPrev) repaymentMonthPrev.addEventListener('click', () => changeRepaymentMonth(-1));
if (repaymentMonthNext) repaymentMonthNext.addEventListener('click', () => changeRepaymentMonth(1));

function getMonthYearFromSelect() {
  return { month: repaymentSelectedMonth, year: repaymentSelectedYear };
}

function getStatusForDay(day, month, year, transactions) {
  // Find all transactions due on this day
  const txs = transactions.filter(tx => {
    if (!tx.agreed_repayment_date) return false;
    const date = new Date(tx.agreed_repayment_date);
    return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
  });
  if (!txs.length) return null;
  // Priority: Overdue > Pending > Complete
  const now = new Date();
  for (const tx of txs) {
    const balance = (tx.total_amount || 0) - (tx.amount_paid || 0);
    if (tx.payment_status === 'paid' || balance <= 0) return 'complete';
    if (tx.agreed_repayment_date && new Date(tx.agreed_repayment_date) < now) return 'overdue';
    return 'pending';
  }
  return null;
}

function renderRepaymentCalendar() {
  if (!repaymentCalendarGrid) return;
  updateRepaymentMonthLabel();
  repaymentCalendarGrid.innerHTML = '';
  const { month, year } = getMonthYearFromSelect();
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Fetch all credit transactions
  fetch(API_BASE_URL + '/api/credit-transactions/all')
    .then(res => res.json())
    .then(transactions => {
      // Render day headers
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      dayNames.forEach(dn => {
        const div = document.createElement('div');
        div.className = 'calendar-day text-center p-2';
        div.innerHTML = `<span class="text-xs fw-bold">${dn}</span>`;
        repaymentCalendarGrid.appendChild(div);
      });
      // Render empty days before first day
      for (let i = 0; i < firstDay; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day text-center p-2';
        repaymentCalendarGrid.appendChild(div);
      }
      // Render days of month
      for (let day = 1; day <= daysInMonth; day++) {
        const status = getStatusForDay(day, month, year, transactions);
        let bg = '';
        if (status === 'complete') bg = 'bg-success text-white';
        else if (status === 'pending') bg = 'bg-warning text-dark';
        else if (status === 'overdue') bg = 'bg-danger text-white';
        const div = document.createElement('div');
        div.className = `calendar-day text-center p-2 ${bg}`;
        div.innerHTML = `<span class="text-xs">${day}</span>`;
        repaymentCalendarGrid.appendChild(div);
      }
      // Fill trailing days to complete the grid (if needed)
      const totalCells = dayNames.length + firstDay + daysInMonth;
      const trailing = (7 - (totalCells % 7)) % 7;
      for (let i = 0; i < trailing; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day text-center p-2';
        repaymentCalendarGrid.appendChild(div);
      }
    });
}
if (repaymentMonthSelect) {
  repaymentMonthSelect.addEventListener('change', renderRepaymentCalendar);
}
document.addEventListener('DOMContentLoaded', () => {
  updateRepaymentMonthLabel();
  renderRepaymentCalendar();
});

// Repayment Tracking Modal Logic
function renderRepaymentTrackingModal() {
  fetch(API_BASE_URL + '/api/credit-transactions/all')
    .then(res => res.json())
    .then(transactions => {
      const overdueTbody = document.getElementById('repaymentOverdueList');
      const pendingTbody = document.getElementById('repaymentPendingList');
      const completedTbody = document.getElementById('repaymentCompletedList');
      overdueTbody.innerHTML = '';
      pendingTbody.innerHTML = '';
      completedTbody.innerHTML = '';
      const now = new Date();
      transactions.forEach(tx => {
        const customer = tx.customer_id || {};
        const customerName = customer.name || '';
        const date = tx.agreed_repayment_date ? new Date(tx.agreed_repayment_date).toISOString().split('T')[0] : '';
        const amount = (tx.total_amount || 0) - (tx.amount_paid || 0);
        let status = 'pending';
        if (tx.payment_status === 'paid' || amount <= 0) status = 'completed';
        else if (tx.agreed_repayment_date && new Date(tx.agreed_repayment_date) < now) status = 'overdue';
        let row = `<tr><td>${customerName}</td><td>${date}</td><td><span class='fw-bold text-${status === 'completed' ? 'success' : status === 'overdue' ? 'danger' : 'warning'}'>shs:${amount.toLocaleString()}</span></td></tr>`;
        if (status === 'overdue') overdueTbody.innerHTML += row;
        else if (status === 'pending') pendingTbody.innerHTML += row;
        else completedTbody.innerHTML += row;
      });
      if (!overdueTbody.innerHTML) overdueTbody.innerHTML = '<tr><td colspan="3" class="text-center text-warning">No overdue repayments</td></tr>';
      if (!pendingTbody.innerHTML) pendingTbody.innerHTML = '<tr><td colspan="3" class="text-center text-warning">No pending repayments</td></tr>';
      if (!completedTbody.innerHTML) completedTbody.innerHTML = '<tr><td colspan="3" class="text-center text-success">No completed repayments</td></tr>';
    })
    .catch(() => {
      document.getElementById('repaymentOverdueList').innerHTML = '<tr><td colspan="3" class="text-center text-danger">Failed to load data</td></tr>';
      document.getElementById('repaymentPendingList').innerHTML = '<tr><td colspan="3" class="text-center text-danger">Failed to load data</td></tr>';
      document.getElementById('repaymentCompletedList').innerHTML = '<tr><td colspan="3" class="text-center text-danger">Failed to load data</td></tr>';
    });
}
document.getElementById('repaymentTrackingModal').addEventListener('show.bs.modal', renderRepaymentTrackingModal);

// Credit Line Graph Logic
function fetchAndRenderCreditLineGraph() {
  fetch(API_BASE_URL + '/api/credit/monthly-totals')
    .then(res => res.json())
    .then(data => {
      const labels = data.map(d => `${d.year}-${String(d.month).padStart(2, '0')}`);
      const issued = data.map(d => d.issued);
      const paid = data.map(d => d.paid);
      const ctx = document.getElementById('credit-line-graph').getContext('2d');
      if (window.creditLineChart) window.creditLineChart.destroy();
      window.creditLineChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Credit Issued',
              data: issued,
              borderColor: 'rgb(255, 193, 7)', // yellow
              backgroundColor: 'rgba(255, 193, 7, 0.2)',
              tension: 0.1,
              fill: false
            },
            {
              label: 'Payments',
              data: paid,
              borderColor: 'rgb(40, 167, 69)', // green
              backgroundColor: 'rgba(40, 167, 69, 0.2)',
              tension: 0.1,
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
                  return '$' + value.toLocaleString();
                }
              }
            }
          },
          plugins: {
            legend: {
              display: true
            }
          }
        }
      });
    });
}
document.addEventListener('DOMContentLoaded', fetchAndRenderCreditLineGraph);

document.addEventListener('DOMContentLoaded', () => {
  fetchActiveCreditCustomersCount();
  fetchTotalOutstandingAmount();
  fetchOverdueAmount();
  fetchAndRenderCreditTransactions();
});
document.getElementById('viewCreditCustomersModal').addEventListener('show.bs.modal', fetchAndRenderCreditCustomers);
document.getElementById('viewOutstandingDetailsModal').addEventListener('show.bs.modal', fetchAndRenderOutstandingCustomers);
document.getElementById('viewOverdueAccountsModal').addEventListener('show.bs.modal', fetchAndRenderOverdueCustomers);

  // Event listeners for modals
  document.addEventListener('DOMContentLoaded', function() {
    // Overdue accounts modal verification
    const overdueModal = document.getElementById('viewOverdueAccountsModal');
    if (overdueModal) {
      overdueModal.addEventListener('shown.bs.modal', function() {
        // Verify consistency after modal is shown
        setTimeout(verifyOverdueAmountConsistency, 100);
      });
    }
  });
