// Fetch and display today's sales total
async function fetchTodaysSalesTotal() {
  try {
    const response = await fetch(API_BASE_URL + '/api/sales/today-total');
    const data = await response.json();
    const value = typeof data.total === 'number' ? data.total : 0;
    const element = document.getElementById('todaysSalesValue');
    if (element) {
      element.textContent = `shs:${value.toLocaleString()}`;
    }
  } catch (error) {
    console.error('Error fetching today\'s sales total:', error);
    const element = document.getElementById('todaysSalesValue');
    if (element) {
      element.textContent = 'shs:';
    }
  }
}

// Fetch and display today's customer count
async function fetchCustomersToday() {
  try {
    const response = await fetch(API_BASE_URL + '/api/sales/today-customers');
    const data = await response.json();
    const value = typeof data.count === 'number' ? data.count : 0;
    const element = document.getElementById('customersTodayValue');
    if (element) {
      element.textContent = value.toLocaleString();
    }
  } catch (error) {
    console.error('Error fetching customers today:', error);
    const element = document.getElementById('customersTodayValue');
    if (element) {
      element.textContent = '0';
    }
  }
}

// Fetch and display today's profits
async function fetchTodaysProfits() {
  try {
    const response = await fetch(API_BASE_URL + '/api/sales/today-profits');
    const data = await response.json();
    const value = typeof data.profit === 'number' ? data.profit : 0;
    const element = document.getElementById('todaysProfitsValue');
    if (element) {
      element.textContent = `shs:${value.toLocaleString()}`;
    }
  } catch (error) {
    console.error('Error fetching today\'s profits:', error);
    const element = document.getElementById('todaysProfitsValue');
    if (element) {
      element.textContent = 'shs:';
    }
  }
}

// --- Recent Sales Table Logic ---
const recentSalesPageSize = 4;
let recentSalesCurrentPage = 1;
let recentSalesTotalPages = 1;
let recentSalesCache = [];
let recentSalesTotalCount = 0;

function updateRecentSalesPaginationInfo(start, end, total) {
  const element = document.getElementById('recentSalesShowingText');
  if (element) {
    element.textContent = `Showing ${start} to ${end} of ${total} items`;
  }
}

function updateRecentSalesPaginationControls() {
  const prevBtn = document.getElementById('recentSalesPrevPage');
  const nextBtn = document.getElementById('recentSalesNextPage');
  const currentPageInfo = document.getElementById('recentSalesCurrentPageInfo');
  
  if (prevBtn) {
    prevBtn.disabled = recentSalesCurrentPage <= 1;
  }
  if (nextBtn) {
    nextBtn.disabled = recentSalesCurrentPage >= recentSalesTotalPages;
  }
  if (currentPageInfo) {
    currentPageInfo.textContent = `Page ${recentSalesCurrentPage} of ${recentSalesTotalPages}`;
  }
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

function renderRecentSalesTable(sales) {
  const tbody = document.getElementById('recentSalesTableBody');
  if (!tbody) return;
  
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

async function fetchRecentSalesWithFilter(year = null, month = null, page = 1) {
  try {
    // Update filter status display
    updateRecentSalesFilterStatus(year, month);
    
    let url = API_BASE_URL + `/api/sales/recent?page=${page}&limit=${recentSalesPageSize}`;
    
    // Add year and month parameters if provided
    if (year) url += `&year=${year}`;
    if (month) url += `&month=${month}`;
    
    console.log('Fetching recent sales with filter:', { year, month, page, url });
    
    const response = await fetch(url);
    const data = await response.json();
    recentSalesCache = data.sales || [];
    recentSalesCurrentPage = page;
    recentSalesTotalCount = data.total || 0;
    recentSalesTotalPages = Math.ceil(recentSalesTotalCount / recentSalesPageSize) || 1;
    showRecentSalesPage(page);
  } catch (error) {
    console.error('Error fetching filtered recent sales:', error);
    recentSalesCache = [];
    recentSalesCurrentPage = page;
    recentSalesTotalCount = 0;
    recentSalesTotalPages = 1;
    showRecentSalesPage(page);
  }
}

async function fetchRecentSales(page = 1) {
  try {
    let url = API_BASE_URL + `/api/sales/recent?page=${page}&limit=${recentSalesPageSize}`;
    const response = await fetch(url);
    const data = await response.json();
    recentSalesCache = data.sales || [];
    recentSalesCurrentPage = page;
    recentSalesTotalCount = data.total || 0;
    recentSalesTotalPages = Math.ceil(recentSalesTotalCount / recentSalesPageSize) || 1;
    showRecentSalesPage(page);
  } catch (error) {
    console.error('Error fetching recent sales:', error);
    recentSalesCache = [];
    recentSalesCurrentPage = page;
    recentSalesTotalCount = 0;
    recentSalesTotalPages = 1;
    showRecentSalesPage(page);
  }
}

// --- Sales Bargraph Logic ---
let salesBargraphChart = null;
async function fetchAndRenderSalesBargraph(days = 7) {
  try {
    const response = await fetch(API_BASE_URL + `/api/sales/daily-totals?days=${days}`);
    const data = await response.json();
    const daysArr = data.days || [];
    // Reverse to show oldest to newest (left to right)
    const daysSorted = daysArr.slice().reverse();
    const labels = daysSorted.map(d => d.date.slice(5)); // MM-DD
    const values = daysSorted.map(d => d.total);
    renderSalesBargraph(labels, values);
  } catch (error) {
    console.error('Error fetching sales bargraph data:', error);
    renderSalesBargraph([], []);
  }
}

function renderSalesBargraph(labels, values) {
  const canvas = document.getElementById('sales-bargraph');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
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

// --- Sales Trend Chart Logic ---
let salesTrendChart = null;
async function fetchAndRenderSalesTrend() {
  try {
    const response = await fetch(API_BASE_URL + '/api/sales/monthly-totals');
    const data = await response.json();
    const months = data.months || [];
    const labels = months.map(m => {
      const [year, month] = m.month.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleString('default', { month: 'short', year: '2-digit' });
    });
    const values = months.map(m => m.total);
    renderSalesTrend(labels, values);
  } catch (error) {
    console.error('Error fetching sales trend data:', error);
    renderSalesTrend([], []);
  }
}

function renderSalesTrend(labels, values) {
  const canvas = document.getElementById('sales-trend');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
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

// --- Top Performing Items Logic ---
let topItemsData = [];
const topItemsPageSize = 4;
let topItemsCurrentPage = 1;
let topItemsTotalPages = 1;
let topItemsTotalCount = 0;

// Top Performing Items pagination functions
function updateTopItemsPaginationInfo(start, end, total) {
  const element = document.getElementById('topItemsShowingText');
  if (element) {
    element.textContent = `Showing ${start} to ${end} of ${total} items`;
  }
}

function updateTopItemsPaginationControls() {
  const prevBtn = document.getElementById('topItemsPrevPage');
  const nextBtn = document.getElementById('topItemsNextPage');
  const currentPageInfo = document.getElementById('topItemsCurrentPageInfo');
  
  if (prevBtn) {
    prevBtn.disabled = topItemsCurrentPage <= 1;
  }
  if (nextBtn) {
    nextBtn.disabled = topItemsCurrentPage >= topItemsTotalPages;
  }
  if (currentPageInfo) {
    currentPageInfo.textContent = `Page ${topItemsCurrentPage} of ${topItemsTotalPages}`;
  }
}

function showTopItemsPage(page) {
  topItemsCurrentPage = page;
  const total = topItemsTotalCount;
  topItemsTotalPages = Math.ceil(total / topItemsPageSize) || 1;
  renderTopPerformingItems();
  const startIdx = (topItemsCurrentPage - 1) * topItemsPageSize;
  const endIdx = Math.min(startIdx + topItemsPageSize, total);
  updateTopItemsPaginationInfo(startIdx + 1, endIdx, total);
  updateTopItemsPaginationControls();
}

// Make the function globally available immediately
window.fetchTopPerformingItems = async function(year = null, month = null) {
  try {
    console.log('Fetching top performing items...');
    console.log('Parameters:', { year, month });
    
    // Update filter status display
    updateTopItemsFilterStatus(year, month);
    
    // Show loading indicator
    const loadingDiv = document.getElementById('topItemsLoading');
    const noDataDiv = document.getElementById('topItemsNoData');
    const tableBody = document.getElementById('topItemsTableBody');
    
    console.log('DOM elements found:', {
      loadingDiv: !!loadingDiv,
      noDataDiv: !!noDataDiv,
      tableBody: !!tableBody
    });
    
    if (loadingDiv) loadingDiv.style.display = 'block';
    if (noDataDiv) noDataDiv.style.display = 'none';
    if (tableBody) tableBody.style.display = 'none';
    
    // Build URL with optional year and month parameters
    let url = API_BASE_URL + '/api/sales/top-items';
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    console.log('Fetching from URL:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const allData = await response.json();
    console.log('Top performing items data received:', allData);
    console.log('Data type:', typeof allData);
    console.log('Data length:', Array.isArray(allData) ? allData.length : 'Not an array');
    
    if (Array.isArray(allData)) {
      console.log('First item sample:', allData[0]);
      topItemsData = allData;
      topItemsTotalCount = allData.length;
      topItemsCurrentPage = 1;
      topItemsTotalPages = Math.ceil(topItemsTotalCount / topItemsPageSize) || 1;
      showTopItemsPage(1);
    } else {
      topItemsData = [];
      topItemsTotalCount = 0;
      topItemsCurrentPage = 1;
      topItemsTotalPages = 1;
      renderTopPerformingItems();
    }
  } catch (error) {
    console.error('Error fetching top performing items:', error);
    showTopItemsError('Failed to load top performing items: ' + error.message);
  } finally {
    // Hide loading indicator
    const loadingDiv = document.getElementById('topItemsLoading');
    if (loadingDiv) loadingDiv.style.display = 'none';
  }
};

// Also make renderTopPerformingItems globally available
window.renderTopPerformingItems = function() {
  console.log('renderTopPerformingItems called');
  console.log('topItemsData:', topItemsData);
  
  const tableBody = document.getElementById('topItemsTableBody');
  const noDataDiv = document.getElementById('topItemsNoData');
  
  console.log('DOM elements in render:', {
    tableBody: !!tableBody,
    noDataDiv: !!noDataDiv
  });
  
  if (!tableBody) {
    console.error('tableBody element not found!');
    return;
  }
  
  if (!topItemsData || topItemsData.length === 0) {
    console.log('No data to display, showing no data message');
    tableBody.style.display = 'none';
    if (noDataDiv) noDataDiv.style.display = 'block';
    return;
  }
  
  // Calculate pagination
  const startIdx = (topItemsCurrentPage - 1) * topItemsPageSize;
  const endIdx = Math.min(startIdx + topItemsPageSize, topItemsData.length);
  const pageData = topItemsData.slice(startIdx, endIdx);
  
  console.log('Rendering', pageData.length, 'items for page', topItemsCurrentPage);
  console.log('Page data:', pageData);
  
  tableBody.style.display = 'table-row-group';
  if (noDataDiv) noDataDiv.style.display = 'none';
  
  const itemsHTML = pageData.map((item, index) => {
    console.log('Processing item', index, ':', item);
    
    const globalIndex = startIdx + index;
    const rank = globalIndex + 1;
    const rankBadge = rank <= 3 ? 
      `<span class="badge badge-sm bg-gradient-${rank === 1 ? 'warning' : rank === 2 ? 'secondary' : 'info'}">${rank}</span>` :
      `<span class="badge badge-sm bg-gradient-light text-dark">${rank}</span>`;
    
    const rowHTML = `
      <tr>
        <td class="align-middle text-center">
          ${rankBadge}
        </td>
        <td>
          <div class="d-flex px-2 py-1">
            <div class="d-flex flex-column justify-content-center">
              <h6 class="mb-0 text-sm">${item.item_name || 'Unknown Item'}</h6>
              <p class="text-xs text-secondary mb-0">ID: ${item.item_id}</p>
            </div>
          </div>
        </td>
        <td class="align-middle text-center">
          <span class="text-secondary text-xs font-weight-bold">${item.quantity.toLocaleString()}</span>
        </td>
        <td class="align-middle text-center">
          <span class="text-secondary text-xs font-weight-bold">shs:${item.cost.toLocaleString()}</span>
        </td>
        <td class="align-middle text-center">
          <span class="text-secondary text-xs font-weight-bold">${item.score.toFixed(2)}</span>
        </td>
      </tr>
    `;
    
    console.log('Generated row HTML:', rowHTML);
    return rowHTML;
  }).join('');
  
  console.log('Final HTML length:', itemsHTML.length);
  console.log('Setting table body HTML...');
  
  tableBody.innerHTML = itemsHTML;
  
  console.log('Table body HTML set successfully');
};

// Make showTopItemsError globally available
window.showTopItemsError = function(message) {
  const tableBody = document.getElementById('topItemsTableBody');
  const noDataDiv = document.getElementById('topItemsNoData');
  
  if (tableBody) {
    tableBody.style.display = 'none';
  }
  
  if (noDataDiv) {
    noDataDiv.innerHTML = `
      <i class="fas fa-exclamation-triangle text-danger" style="font-size: 3rem;"></i>
      <p class="mt-2 text-danger">${message}</p>
    `;
    noDataDiv.style.display = 'block';
  }
};

// Make exportTopPerformingItems globally available
window.exportTopPerformingItems = function() {
  if (!topItemsData || topItemsData.length === 0) {
    alert('No data to export');
    return;
  }
  
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Performing Items Report', 20, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString();
    doc.text(`Generated on: ${currentDate}`, 20, 30);
    
    // Prepare table data
    const headers = [['Rank', 'Item Name', 'Quantity Sold', 'Total Revenue', 'Performance Score']];
    const rows = topItemsData.map((item, index) => [
      (index + 1).toString(),
      item.item_name || 'Unknown Item',
      item.quantity.toLocaleString(),
      `shs: ${item.cost.toLocaleString()}`,
      item.score.toFixed(2)
    ]);
    
    // Add table
    doc.autoTable({
      head: headers,
      body: rows,
      startY: 40,
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
    
    // Save the PDF
    const fileName = `top_performing_items_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error exporting top performing items:', error);
    alert('Error exporting data. Please try again.');
  }
};

// PDF Export function for Recent Sales
async function exportRecentSalesToPDF() {
  try {
    console.log('Exporting Recent Sales to PDF...');
    
    // Get the export button and show loading state
    const exportBtn = document.getElementById('recentSalesExportBtn');
    if (exportBtn) {
      exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Generating PDF...';
      exportBtn.disabled = true;
    }
    
    // Get current date and time for filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `Recent_Sales_Report_${dateStr}_${timeStr}.pdf`;
    
    // Check if jsPDF is available
    if (!window.jspdf) {
      console.error('jsPDF library not loaded');
      throw new Error('jsPDF library not available');
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Sales Report', 20, 20);
    
    // Add generation date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, 20, 30);
    
    // Add filter information if any filters are applied
    const filterStatus = document.getElementById('recentSalesFilterStatus');
    if (filterStatus && filterStatus.style.display !== 'none') {
      const filterText = document.getElementById('recentSalesFilterText');
      if (filterText) {
        doc.text(`Filter: ${filterText.textContent}`, 20, 40);
      }
    } else {
      doc.text('Filter: All Records', 20, 40);
    }
    
    // Get all sales data (not just current page)
    let allSalesData = [];
    try {
      // Check if we have active filters
      const yearSelect = document.getElementById('recentSalesYearSelect');
      const monthSelect = document.getElementById('recentSalesMonthSelect');
      const year = yearSelect ? yearSelect.value : null;
      const month = monthSelect ? monthSelect.value : null;
      
      if (year || month) {
        // Fetch filtered data without pagination
        const response = await fetch(API_BASE_URL + `/api/sales/recent?year=${year || ''}&month=${month || ''}&limit=1000`);
        const data = await response.json();
        allSalesData = data.sales || [];
      } else {
        // Fetch all data without pagination
        const response = await fetch(API_BASE_URL + '/api/sales/recent?limit=1000');
        const data = await response.json();
        allSalesData = data.sales || [];
      }
    } catch (error) {
      console.error('Error fetching sales data for PDF:', error);
      // Use current page data as fallback
      allSalesData = recentSalesCache || [];
    }
    
    // Prepare table data
    const tableData = allSalesData.map((sale, index) => {
      // Create items string like the frontend table
      const itemsStr = (sale.items && sale.items.length)
        ? sale.items.map(i => `${i.name}${i.quantity ? ` (${i.quantity}${i.unit ? i.unit : ''})` : ''}`).join(', ')
        : '-';
      
      return [
        index + 1,
        sale.customerName || 'N/A',
        itemsStr,
        sale.date ? new Date(sale.date).toLocaleDateString() : 'N/A',
        sale.total ? `shs:${sale.total.toLocaleString()}` : 'shs:0',
        sale.profit ? `shs:${sale.profit.toLocaleString()}` : 'shs:0'
      ];
    });
    
    // Add table
    if (tableData.length > 0) {
      doc.autoTable({
        startY: 50,
        head: [['#', 'Customer', 'Items', 'Date', 'Total', 'Profit']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 15 }, // #
          1: { cellWidth: 40 }, // Customer
          2: { cellWidth: 60 }, // Items (wider for item names)
          3: { cellWidth: 25 }, // Date
          4: { cellWidth: 30 }, // Total
          5: { cellWidth: 30 }  // Profit
        }
      });
    } else {
      doc.text('No sales data available', 20, 60);
    }
    
    // Add summary information
    const finalY = doc.lastAutoTable.finalY || 60;
    doc.text(`Total Records: ${allSalesData.length}`, 20, finalY + 20);
    
    // Calculate totals
    const totalRevenue = allSalesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalProfit = allSalesData.reduce((sum, sale) => sum + (sale.profit || 0), 0);
    
    doc.text(`Total Revenue: shs:${totalRevenue.toLocaleString()}`, 20, finalY + 30);
    doc.text(`Total Profit: shs:${totalProfit.toLocaleString()}`, 20, finalY + 40);
    
    // Save the PDF
    doc.save(filename);
    
    // Reset button state
    if (exportBtn) {
      exportBtn.innerHTML = '<i class="fas fa-file-export me-1"></i> Export';
      exportBtn.disabled = false;
    }
    
    console.log('PDF exported successfully:', filename);
    
    // Show success notification if available
    if (window.showNotification) {
      window.showNotification('PDF exported successfully!', 'success');
    }
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Reset button state
    const exportBtn = document.getElementById('recentSalesExportBtn');
    if (exportBtn) {
      exportBtn.innerHTML = '<i class="fas fa-file-export me-1"></i> Export';
      exportBtn.disabled = false;
    }
    
    // Show error notification if available
    if (window.showNotification) {
      window.showNotification('Error generating PDF. Please try again.', 'error');
    }
  }
}

// Make export function globally available
window.exportRecentSalesToPDF = exportRecentSalesToPDF;

// --- Sales Trend Period Selection Functions ---
function populateSalesTrendYearSelect() {
  const yearSelect = document.getElementById('salesTrendYearSelect');
  if (!yearSelect) return;
  
  // Clear existing options except the first one
  yearSelect.innerHTML = '<option value="">All Years</option>';
  
  // Get current year and add last 5 years
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= currentYear - 5; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }
}

function openSalesTrendPeriodModal() {
  populateSalesTrendYearSelect();
  const modal = new bootstrap.Modal(document.getElementById('salesTrendPeriodModal'));
  modal.show();
}

function updateSalesTrendFilterStatus(year, month) {
  const label = document.getElementById('salesTrendSelectedMonthLabel');
  if (!label) return;
  
  if (year && month) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[parseInt(month) - 1];
    label.textContent = `${monthName} ${year}`;
  } else if (year) {
    label.textContent = `Year ${year}`;
  } else if (month) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[parseInt(month) - 1];
    label.textContent = monthName;
  } else {
    label.textContent = 'All Time';
  }
}

function applySalesTrendPeriodFilter() {
  const yearSelect = document.getElementById('salesTrendYearSelect');
  const monthSelect = document.getElementById('salesTrendMonthSelect');
  
  if (!yearSelect || !monthSelect) return;
  
  const year = yearSelect.value;
  const month = monthSelect.value;
  
  // Update the filter status
  updateSalesTrendFilterStatus(year, month);
  
  // Fetch and render sales trend with filter
  fetchAndRenderSalesTrendWithFilter(year, month);
  
  // Close the modal properly with timeout to ensure it closes
  setTimeout(() => {
    const modalElement = document.getElementById('salesTrendPeriodModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      } else {
        // Fallback: manually remove modal classes and backdrop
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        modalElement.setAttribute('aria-hidden', 'true');
        modalElement.removeAttribute('aria-modal');
        modalElement.removeAttribute('role');
        
        // Remove backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
        
        // Re-enable body scrolling
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    }
  }, 100); // Small delay to ensure the filter is applied first
}

async function fetchAndRenderSalesTrendWithFilter(year = null, month = null) {
  try {
    let url = API_BASE_URL + '/api/sales/monthly-totals';
    const params = new URLSearchParams();
    
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    console.log('Fetching sales trend with filter:', { year, month, url });
    
    const response = await fetch(url);
    const data = await response.json();
    const months = data.months || [];
    const labels = months.map(m => {
      const [year, month] = m.month.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleString('default', { month: 'short', year: '2-digit' });
    });
    const values = months.map(m => m.total);
    renderSalesTrend(labels, values);
  } catch (error) {
    console.error('Error fetching filtered sales trend data:', error);
    renderSalesTrend([], []);
  }
}

async function openSalesTrendReportModal() {
  try {
    console.log('Opening Sales Trend Report Modal...');
    
    // Get current filter status
    const label = document.getElementById('salesTrendSelectedMonthLabel');
    const currentFilter = label ? label.textContent : 'All Time';
    
    // Update modal title to show current filter
    const modalTitle = document.getElementById('salesTrendReportModalLabel');
    if (modalTitle) {
      modalTitle.innerHTML = `<i class="fas fa-chart-line me-2 text-info"></i>Monthly Sales Summary - ${currentFilter}`;
    }
    
    // Fetch monthly sales data
    let url = API_BASE_URL + '/api/sales/monthly-totals';
    const params = new URLSearchParams();
    
    // Check if we have active filters
    const yearSelect = document.getElementById('salesTrendYearSelect');
    const monthSelect = document.getElementById('salesTrendMonthSelect');
    
    if (yearSelect && yearSelect.value) {
      params.append('year', yearSelect.value);
    }
    if (monthSelect && monthSelect.value) {
      params.append('month', monthSelect.value);
    }
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    console.log('Fetching monthly sales data for report:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    const months = data.months || [];
    
    // Populate the table
    const tableBody = document.getElementById('salesTrendReportTableBody');
    if (tableBody) {
      tableBody.innerHTML = '';
      
      if (months.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No data available</td></tr>';
      } else {
        months.forEach(monthData => {
          const [year, month] = monthData.month.split('-');
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          const monthName = monthNames[parseInt(month) - 1];
          
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>
              <div class="d-flex px-2 py-1">
                <div class="d-flex flex-column justify-content-center">
                  <h6 class="mb-0 text-sm">${monthName}</h6>
                </div>
              </div>
            </td>
            <td class="align-middle text-center text-sm">
              <span class="text-secondary text-xs font-weight-bold">${year}</span>
            </td>
            <td class="align-middle text-center">
              <span class="text-secondary text-xs font-weight-bold">shs:${Number(monthData.total).toLocaleString()}</span>
            </td>
          `;
          tableBody.appendChild(row);
        });
      }
    }
    
    // Show the table section
    const tableSection = document.getElementById('salesTrendReportTable');
    const singleSection = document.getElementById('salesTrendReportSingle');
    
    if (tableSection) tableSection.style.display = 'block';
    if (singleSection) singleSection.style.display = 'none';
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('salesTrendReportModal'));
    modal.show();
    
  } catch (error) {
    console.error('Error opening Sales Trend Report Modal:', error);
    
    // Show error in modal
    const tableBody = document.getElementById('salesTrendReportTableBody');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Error loading data. Please try again.</td></tr>';
    }
    
    // Still show the modal
    const modal = new bootstrap.Modal(document.getElementById('salesTrendReportModal'));
    modal.show();
  }
}

// Main dashboard initialization
document.addEventListener('DOMContentLoaded', async function() {
  try {
    console.log('Sales Manager dashboard initializing...');
    
    // Initialize dashboard data with proper error handling
    await Promise.allSettled([
      fetchTodaysSalesTotal().catch(err => console.error('Error fetching today\'s sales:', err)),
      fetchCustomersToday().catch(err => console.error('Error fetching customers today:', err)),
      fetchTodaysProfits().catch(err => console.error('Error fetching today\'s profits:', err)),
      fetchRecentSales(1).catch(err => console.error('Error fetching recent sales:', err)),
      fetchAndRenderSalesBargraph(7).catch(err => console.error('Error rendering sales bargraph:', err)),
      fetchAndRenderSalesTrend().catch(err => console.error('Error rendering sales trend:', err)),
      fetchTopPerformingItems().catch(err => console.error('Error fetching top performing items:', err))
    ]);
    
    // Recent Sales pagination event listeners
    const recentSalesPrevPage = document.getElementById('recentSalesPrevPage');
    if (recentSalesPrevPage) {
      recentSalesPrevPage.addEventListener('click', function() {
        if (recentSalesCurrentPage > 1) {
          // Use the filtered function if we have active filters, otherwise use the regular function
          const yearSelect = document.getElementById('recentSalesYearSelect');
          const monthSelect = document.getElementById('recentSalesMonthSelect');
          const year = yearSelect ? yearSelect.value : null;
          const month = monthSelect ? monthSelect.value : null;
          
          if (year || month) {
            fetchRecentSalesWithFilter(year, month, recentSalesCurrentPage - 1).catch(err => console.error('Error fetching previous page:', err));
          } else {
            fetchRecentSales(recentSalesCurrentPage - 1).catch(err => console.error('Error fetching previous page:', err));
          }
        }
      });
    }
    
    const recentSalesNextPage = document.getElementById('recentSalesNextPage');
    if (recentSalesNextPage) {
      recentSalesNextPage.addEventListener('click', function() {
        if (recentSalesCurrentPage < recentSalesTotalPages) {
          // Use the filtered function if we have active filters, otherwise use the regular function
          const yearSelect = document.getElementById('recentSalesYearSelect');
          const monthSelect = document.getElementById('recentSalesMonthSelect');
          const year = yearSelect ? yearSelect.value : null;
          const month = monthSelect ? monthSelect.value : null;
          
          if (year || month) {
            fetchRecentSalesWithFilter(year, month, recentSalesCurrentPage + 1).catch(err => console.error('Error fetching next page:', err));
          } else {
            fetchRecentSales(recentSalesCurrentPage + 1).catch(err => console.error('Error fetching next page:', err));
          }
        }
      });
    }
    
    // Top Performing Items event listeners
    const topItemsExportBtn = document.getElementById('topItemsExportBtn');
    if (topItemsExportBtn) {
      topItemsExportBtn.addEventListener('click', function() {
        exportTopPerformingItems();
      });
    }
    
    const topItemsSelectDateBtn = document.getElementById('topItemsSelectDateBtn');
    if (topItemsSelectDateBtn) {
      topItemsSelectDateBtn.addEventListener('click', function() {
        openTopItemsPeriodModal();
      });
    }



    // Top Performing Items pagination event listeners
    const topItemsPrevPage = document.getElementById('topItemsPrevPage');
    if (topItemsPrevPage) {
      topItemsPrevPage.addEventListener('click', function() {
        if (topItemsCurrentPage > 1) {
          showTopItemsPage(topItemsCurrentPage - 1);
        }
      });
    }
    
    const topItemsNextPage = document.getElementById('topItemsNextPage');
    if (topItemsNextPage) {
      topItemsNextPage.addEventListener('click', function() {
        if (topItemsCurrentPage < topItemsTotalPages) {
          showTopItemsPage(topItemsCurrentPage + 1);
        }
      });
    }

    // Recent Sales Select Date button
    const recentSalesSelectDateBtn = document.getElementById('recentSalesSelectDateBtn');
    if (recentSalesSelectDateBtn) {
      recentSalesSelectDateBtn.addEventListener('click', function() {
        openRecentSalesPeriodModal();
      });
    }

    // Top Performing Items Period Modal Apply Filter button
    const topItemsApplyPeriodBtn = document.getElementById('topItemsApplyPeriodBtn');
    if (topItemsApplyPeriodBtn) {
      topItemsApplyPeriodBtn.addEventListener('click', function() {
        applyTopItemsPeriodFilter();
      });
    }

    // Recent Sales Period Modal Apply Filter button
    const recentSalesApplyPeriodBtn = document.getElementById('recentSalesApplyPeriodBtn');
    if (recentSalesApplyPeriodBtn) {
      recentSalesApplyPeriodBtn.addEventListener('click', function() {
        applyRecentSalesPeriodFilter();
      });
    }
    
    // Recent Sales Export button
    const recentSalesExportBtn = document.getElementById('recentSalesExportBtn');
    if (recentSalesExportBtn) {
      recentSalesExportBtn.addEventListener('click', function() {
        exportRecentSalesToPDF();
      });
    }
    
    // Sales Trend Select Month button
    const salesTrendSelectMonthBtn = document.getElementById('salesTrendSelectMonthBtn');
    if (salesTrendSelectMonthBtn) {
      salesTrendSelectMonthBtn.addEventListener('click', function() {
        openSalesTrendPeriodModal();
      });
    }
    
    // Sales Trend Period Modal Apply Filter button
    const salesTrendApplyPeriodBtn = document.getElementById('salesTrendApplyPeriodBtn');
    if (salesTrendApplyPeriodBtn) {
      salesTrendApplyPeriodBtn.addEventListener('click', function() {
        applySalesTrendPeriodFilter();
      });
    }
    
    // Sales Trend View button
    const salesTrendViewBtn = document.getElementById('salesTrendViewBtn');
    if (salesTrendViewBtn) {
      salesTrendViewBtn.addEventListener('click', function() {
        openSalesTrendReportModal();
      });
    }
    
    // Add modal cleanup event listeners
    const salesTrendPeriodModal = document.getElementById('salesTrendPeriodModal');
    if (salesTrendPeriodModal) {
      salesTrendPeriodModal.addEventListener('hidden.bs.modal', function() {
        // Ensure cleanup when modal is hidden
        if (window.cleanupModal) {
          window.cleanupModal('salesTrendPeriodModal');
        }
      });
    }
    
    console.log('Sales Manager dashboard initialized successfully');
  } catch (error) {
    console.error('Error during Sales Manager dashboard initialization:', error);
  }
});

// Recent Sales Period Selection Modal Functions
function populateRecentSalesYearSelect() {
  const yearSelect = document.getElementById('recentSalesYearSelect');
  if (!yearSelect) return;
  
  // Clear existing options except "All Years"
  yearSelect.innerHTML = '<option value="">All Years</option>';
  
  // Get current year and populate last 5 years
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= currentYear - 4; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }
}

function openRecentSalesPeriodModal() {
  populateRecentSalesYearSelect();
  
  // Set current selections if any
  const yearSelect = document.getElementById('recentSalesYearSelect');
  const monthSelect = document.getElementById('recentSalesMonthSelect');
  
  if (yearSelect && monthSelect) {
    // You can set default values here if needed
    yearSelect.value = '';
    monthSelect.value = '';
  }
}

function updateRecentSalesFilterStatus(year, month) {
  const filterStatus = document.getElementById('recentSalesFilterStatus');
  const filterText = document.getElementById('recentSalesFilterText');
  
  if (!filterStatus || !filterText) return;
  
  if (year || month) {
    let statusText = '';
    if (year && month) {
      const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      statusText = `${monthNames[parseInt(month)]} ${year}`;
    } else if (year) {
      statusText = `Year ${year}`;
    } else if (month) {
      const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      statusText = `${monthNames[parseInt(month)]}`;
    }
    filterText.textContent = statusText;
    filterStatus.style.display = 'block';
  } else {
    filterStatus.style.display = 'none';
  }
}

function applyRecentSalesPeriodFilter() {
  const yearSelect = document.getElementById('recentSalesYearSelect');
  const monthSelect = document.getElementById('recentSalesMonthSelect');
  
  if (!yearSelect || !monthSelect) return;
  
  const selectedYear = yearSelect.value;
  const selectedMonth = monthSelect.value;
  
  console.log('Applying recent sales period filter:', { year: selectedYear, month: selectedMonth });
  
  // Close the modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('recentSalesPeriodModal'));
  if (modal) {
    modal.hide();
  }
  
  // Fetch data with the selected period
  fetchRecentSalesWithFilter(selectedYear || null, selectedMonth || null)
    .catch(err => console.error('Error fetching filtered recent sales:', err));
}

// Top Performing Items Period Selection Modal Functions
function populateTopItemsYearSelect() {
  const yearSelect = document.getElementById('topItemsYearSelect');
  if (!yearSelect) return;
  
  // Clear existing options except "All Years"
  yearSelect.innerHTML = '<option value="">All Years</option>';
  
  // Get current year and populate last 5 years
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= currentYear - 4; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }
}

function openTopItemsPeriodModal() {
  populateTopItemsYearSelect();
  
  // Set current selections if any
  const yearSelect = document.getElementById('topItemsYearSelect');
  const monthSelect = document.getElementById('topItemsMonthSelect');
  
  if (yearSelect && monthSelect) {
    // You can set default values here if needed
    yearSelect.value = '';
    monthSelect.value = '';
  }
}

function updateTopItemsFilterStatus(year, month) {
  const filterStatus = document.getElementById('topItemsFilterStatus');
  const filterText = document.getElementById('topItemsFilterText');
  
  if (!filterStatus || !filterText) return;
  
  if (year || month) {
    let statusText = '';
    if (year && month) {
      const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      statusText = `${monthNames[parseInt(month)]} ${year}`;
    } else if (year) {
      statusText = `Year ${year}`;
    } else if (month) {
      const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      statusText = `${monthNames[parseInt(month)]}`;
    }
    filterText.textContent = statusText;
    filterStatus.style.display = 'block';
  } else {
    filterStatus.style.display = 'none';
  }
}

function applyTopItemsPeriodFilter() {
  const yearSelect = document.getElementById('topItemsYearSelect');
  const monthSelect = document.getElementById('topItemsMonthSelect');
  
  if (!yearSelect || !monthSelect) return;
  
  const selectedYear = yearSelect.value;
  const selectedMonth = monthSelect.value;
  
  console.log('Applying period filter:', { year: selectedYear, month: selectedMonth });
  
  // Close the modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('topItemsPeriodModal'));
  if (modal) {
    modal.hide();
  }
  
  // Fetch data with the selected period
  fetchTopPerformingItems(selectedYear || null, selectedMonth || null)
    .catch(err => console.error('Error fetching filtered top items:', err));
}

// Make pagination functions globally available for testing
window.showTopItemsPage = showTopItemsPage;
window.updateTopItemsPaginationInfo = updateTopItemsPaginationInfo;
window.updateTopItemsPaginationControls = updateTopItemsPaginationControls;




