// Fetch and display today's sales total
async function fetchTodaysSalesTotal() {
  try {
    const response = await fetch('http://localhost:5000/api/sales/today-total');
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
    const response = await fetch('http://localhost:5000/api/sales/today-customers');
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
    const response = await fetch('http://localhost:5000/api/sales/today-profits');
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

async function fetchRecentSales(page = 1) {
  try {
    let url = `http://localhost:5000/api/sales/recent?page=${page}&limit=${recentSalesPageSize}`;
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
    const response = await fetch(`http://localhost:5000/api/sales/daily-totals?days=${days}`);
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
    const response = await fetch('http://localhost:5000/api/sales/monthly-totals');
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
    let url = 'http://localhost:5000/api/sales/top-items';
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

// Global function for testing - can be called from browser console
window.testTopItems = async function() {
  console.log('=== TESTING TOP ITEMS FUNCTION ===');
  console.log('Current topItemsData:', topItemsData);
  console.log('Calling fetchTopPerformingItems...');
  
  try {
    await fetchTopPerformingItems();
    console.log('fetchTopPerformingItems completed');
    console.log('Updated topItemsData:', topItemsData);
    
    // Check DOM elements
    const tableBody = document.getElementById('topItemsTableBody');
    const noDataDiv = document.getElementById('topItemsNoData');
    const loadingDiv = document.getElementById('topItemsLoading');
    
    console.log('DOM Elements:');
    console.log('- tableBody:', tableBody);
    console.log('- noDataDiv:', noDataDiv);
    console.log('- loadingDiv:', loadingDiv);
    
    if (tableBody) {
      console.log('Table body innerHTML length:', tableBody.innerHTML.length);
      console.log('Table body display style:', tableBody.style.display);
      console.log('Table body first few characters:', tableBody.innerHTML.substring(0, 200));
    }
    
  } catch (error) {
    console.error('Error in testTopItems:', error);
  }
};

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
          fetchRecentSales(recentSalesCurrentPage - 1).catch(err => console.error('Error fetching previous page:', err));
        }
      });
    }
    
    const recentSalesNextPage = document.getElementById('recentSalesNextPage');
    if (recentSalesNextPage) {
      recentSalesNextPage.addEventListener('click', function() {
        if (recentSalesCurrentPage < recentSalesTotalPages) {
          fetchRecentSales(recentSalesCurrentPage + 1).catch(err => console.error('Error fetching next page:', err));
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
        // For now, just refresh with current data
        // In the future, this could open a date picker modal
        fetchTopPerformingItems().catch(err => console.error('Error refreshing top items:', err));
      });
    }

    // Top performing items test button
    const topItemsTestBtn = document.getElementById('topItemsTestBtn');
    if (topItemsTestBtn) {
      topItemsTestBtn.addEventListener('click', function() {
        fetchTopPerformingItems().catch(err => console.error('Error testing top items:', err));
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
    
    console.log('Sales Manager dashboard initialized successfully');
  } catch (error) {
    console.error('Error during Sales Manager dashboard initialization:', error);
  }
});

// Make pagination functions globally available for testing
window.showTopItemsPage = showTopItemsPage;
window.updateTopItemsPaginationInfo = updateTopItemsPaginationInfo;
window.updateTopItemsPaginationControls = updateTopItemsPaginationControls;




