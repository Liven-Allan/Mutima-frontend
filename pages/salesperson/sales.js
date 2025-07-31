// Global variables
let items = [];
let customers = [];
let paymentMethods = [];
let sales = [];
const inventoryRecordsPerPage = 4;
let weighableCurrentPage = 1;
let weighableTotalPages = 1;
let weighableItemsCache = [];
let unitCurrentPage = 1;
let unitTotalPages = 1;
let unitItemsCache = [];
    
// Pagination variables
let currentPage = 1;
const recordsPerPage = 4;
let totalPages = 1;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded - Initializing sales page');
  setCurrentDate();
  loadItems();
  loadCustomers();
  loadPaymentMethods();
  loadSalesData();
  
  // Initialize any existing item rows
  setTimeout(() => {
    const existingRows = document.querySelectorAll('#itemsTableBody tr');
    existingRows.forEach(row => {
      const rowId = row.id;
      if (rowId) {
        calculateRowTotal(rowId);
      }
    });
  }, 1000); // Wait a bit for items to load
});

// Test function to verify everything is working
function testSalesFunctions() {
  console.log('Testing sales functions...');
  console.log('Items loaded:', items ? items.length : 'Not loaded');
  console.log('onQuantityChange function:', typeof onQuantityChange);
  console.log('calculateRowTotal function:', typeof calculateRowTotal);
  console.log('addNewItemRow function:', typeof addNewItemRow);
  
  // Test adding a new row
  try {
    addNewItemRow();
    console.log('Successfully added new item row');
  } catch (error) {
    console.error('Error adding new item row:', error);
  }
}

// Set current date
function setCurrentDate() {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  document.getElementById('saleDate').value = dateString;
}

// Load items from backend
async function loadItems() {
  try {
    const response = await fetch('http://localhost:5000/api/items');
    items = await response.json();
    console.log('Items loaded:', items.length, 'items');
    return items;
  } catch (error) {
    console.error('Error loading items:', error);
    return [];
  }
}

// Load customers from backend
async function loadCustomers() {
  try {
    const response = await fetch('http://localhost:5000/api/customers');
    customers = await response.json();
    console.log('Customers loaded:', customers);
  } catch (error) {
    console.error('Error loading customers:', error);
  }
}

// Load payment methods from backend
async function loadPaymentMethods() {
  try {
    const response = await fetch('http://localhost:5000/api/payment-methods');
    paymentMethods = await response.json();
    populatePaymentMethods();
    console.log('Payment methods loaded:', paymentMethods);
  } catch (error) {
    console.error('Error loading payment methods:', error);
  }
}

// Populate payment methods dropdown
function populatePaymentMethods() {
  const select = document.getElementById('paymentMethod');
  paymentMethods.forEach(method => {
    const option = document.createElement('option');
    option.value = method._id;
    option.textContent = method.name;
    select.appendChild(option);
  });
}

// Handle customer type change
function onCustomerTypeChange() {
  const customerType = document.getElementById('customerType').value;
  const customNameSection = document.getElementById('customNameSection');
  
  if (customerType === 'Custom') {
    customNameSection.style.display = 'block';
    document.getElementById('customCustomerName').required = true;
  } else {
    customNameSection.style.display = 'none';
    document.getElementById('customCustomerName').required = false;
  }
}

// Add new item row with item selection
function addNewItemRow() {
  const tableBody = document.getElementById('itemsTableBody');
  if (!tableBody) {
    console.error('itemsTableBody not found');
    return;
  }
  
  if (!items || items.length === 0) {
    console.warn('Items array is empty or not loaded yet');
    // Show loading message
    const loadingRow = document.createElement('tr');
    loadingRow.innerHTML = '<td colspan="6" class="text-center">Loading items...</td>';
    tableBody.appendChild(loadingRow);
    
    // Try to load items if not available
    loadItems().then(() => {
      tableBody.removeChild(loadingRow);
      addNewItemRow(); // Retry after loading items
    }).catch(error => {
      console.error('Failed to load items:', error);
      tableBody.removeChild(loadingRow);
      alert('Failed to load items. Please try again.');
    });
    return;
  }
  
  const row = document.createElement('tr');
  const rowId = 'row_' + Date.now();
  
  row.innerHTML = `
    <td>
      <select class="form-control form-control-sm item-select" onchange="onItemSelect(this, '${rowId}')">
        <option value="">Select item</option>
        ${items.map(item => `<option value="${item._id}" data-price="${item.selling_price_per_unit}">${item.name}</option>`).join('')}
      </select>
    </td>
    <td>
      <input type="number" class="form-control form-control-sm item-qty" min="1" value="1" style="width: 80px;" onchange="onQuantityChange(this, '${rowId}')" onkeyup="onQuantityChange(this, '${rowId}')">
      <span class="text-danger stock-warning" style="display:none;font-size:12px;"></span>
    </td>
    <td><input type="number" class="form-control form-control-sm item-unit-price" min="0" step="0.01" value="0.00" style="width: 100px;" readonly></td>
    <td><input type="text" class="form-control form-control-sm item-total-price" value="0.00" style="width: 100px;" readonly></td>
    <td><input type="number" class="form-control form-control-sm item-discount" min="0" step="0.01" value="0.00" style="width: 80px;" onchange="calculateRowTotal('${rowId}')" onkeyup="calculateRowTotal('${rowId}')"></td>
    <td><button type="button" class="btn btn-danger btn-sm remove-item-row" onclick="removeItemRow(this)"><i class="fas fa-trash"></i></button></td>
  `;

  row.id = rowId;
  tableBody.appendChild(row);
}

// Handle item selection
function onItemSelect(selectElement, rowId) {
  try {
    const selectedItemId = selectElement.value;
    const selectedItem = items.find(item => item._id === selectedItemId);
    
    if (selectedItem) {
      const row = document.getElementById(rowId);
      if (row) {
        const unitPriceInput = row.querySelector('.item-unit-price');
        if (unitPriceInput) {
          unitPriceInput.value = selectedItem.selling_price_per_unit.toFixed(2);
          calculateRowTotal(rowId);
        }
      }
    }
  } catch (error) {
    console.error('Error in onItemSelect:', error);
  }
}

// Calculate row total
function calculateRowTotal(rowId) {
  console.log('calculateRowTotal called with rowId:', rowId);
  const row = document.getElementById(rowId);
  if (!row) {
    console.error('Row not found for rowId:', rowId);
    return;
  }
  
  const qtyInput = row.querySelector('.item-qty');
  const unitPriceInput = row.querySelector('.item-unit-price');
  const discountInput = row.querySelector('.item-discount');
  const totalPriceInput = row.querySelector('.item-total-price');

  console.log('Found inputs:', {
    qtyInput: !!qtyInput,
    unitPriceInput: !!unitPriceInput,
    discountInput: !!discountInput,
    totalPriceInput: !!totalPriceInput
  });

  if (!qtyInput || !unitPriceInput || !discountInput || !totalPriceInput) {
    console.error('Required input elements not found in row:', rowId);
    console.error('Missing elements:', {
      qtyInput: !qtyInput,
      unitPriceInput: !unitPriceInput,
      discountInput: !discountInput,
      totalPriceInput: !totalPriceInput
    });
    return;
  }

  const qty = parseFloat(qtyInput.value) || 0;
  const price = parseFloat(unitPriceInput.value) || 0;
  const discount = parseFloat(discountInput.value) || 0;
  
  console.log('Calculating total:', { qty, price, discount });
  
  let total = qty * price - discount;
  if (total < 0) total = 0;
  
  console.log('Total calculated:', total);
  
  totalPriceInput.value = total.toFixed(2);
  calculateGrandTotal();
}

// Calculate grand total
function calculateGrandTotal() {
  const totalInputs = document.querySelectorAll('.item-total-price');
  let grandTotal = 0;
  
  totalInputs.forEach(input => {
    grandTotal += parseFloat(input.value) || 0;
  });
  
  document.getElementById('totalAmount').value = grandTotal.toFixed(2);
}

// Remove item row
function removeItemRow(button) {
  button.closest('tr').remove();
  calculateGrandTotal();
}

// Save sale
async function saveSale() {
  try {
    // Validate form
    const customerType = document.getElementById('customerType').value;
    if (!customerType) {
      alert('Please select a customer type');
      return;
    }

    if (customerType === 'Custom') {
      const customName = document.getElementById('customCustomerName').value.trim();
      if (!customName) {
        alert('Please enter customer name');
        return;
      }
    }

    const items = getSaleItems();
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const paymentMethod = document.getElementById('paymentMethod').value;
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    // Prepare sale data
    const saleData = {
      customer_info: {
        gender: customerType,
        name: customerType === 'Custom' ? document.getElementById('customCustomerName').value.trim() : customerType,
        phone: null,
        address: null
      },
      date: document.getElementById('saleDate').value,
      total_amount: parseFloat(document.getElementById('totalAmount').value),
      grand_total: parseFloat(document.getElementById('totalAmount').value),
      status: 'completed',
      payment_status: 'paid',
      items: items
    };

    // Only add payment_method_id if one is selected
    if (paymentMethod && paymentMethod.trim() !== '') {
      saleData.payment_method_id = paymentMethod;
    }

    console.log('Sending sale data:', JSON.stringify(saleData, null, 2));

    // Send to backend
    const response = await fetch('http://localhost:5000/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saleData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Sale saved successfully:', result);
      alert(`Sale saved successfully! Invoice: ${result.sale.invoice_number}`);
      
      // Reset form
      resetSaleForm();
      
      // Refresh sales history and reset to page 1
      currentPage = 1;
      await loadSalesData();
      // Refresh items/inventory so the new quantity is reflected immediately
      await loadItems();
      // Reset inventory pagination to first page
      weighableCurrentPage = 1;
      unitCurrentPage = 1;
      // Also refresh the inventory tables and await them
      await fetchAndDisplayItems('weighable', 'weighableItemsTableBody');
      await fetchAndDisplayItems('unit_based', 'unitItemsTableBody');
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('addNewSaleModal'));
      modal.hide();
      return;
    } else {
      const error = await response.json();
      console.error('Server error:', error);
      alert('Error saving sale: ' + (error.details || error.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error saving sale:', error);
    alert('Error saving sale. Please try again.');
  }
}

// Get sale items from table
function getSaleItems() {
  const items = [];
  const rows = document.querySelectorAll('#itemsTableBody tr');
  
  rows.forEach(row => {
    const itemSelect = row.querySelector('.item-select');
    const qtyInput = row.querySelector('.item-qty');
    const unitPriceInput = row.querySelector('.item-unit-price');
    const totalPriceInput = row.querySelector('.item-total-price');
    const discountInput = row.querySelector('.item-discount');

    if (itemSelect && itemSelect.value) {
      items.push({
        item_id: itemSelect.value,
        quantity: parseFloat(qtyInput.value) || 0,
        unit_price: parseFloat(unitPriceInput.value) || 0,
        total_price: parseFloat(totalPriceInput.value) || 0,
        discount: parseFloat(discountInput.value) || 0
      });
    }
  });

  return items;
}

// Reset sale form
function resetSaleForm() {
  document.getElementById('customerType').value = '';
  document.getElementById('customCustomerName').value = '';
  document.getElementById('customNameSection').style.display = 'none';
  document.getElementById('paymentMethod').value = '';
  document.getElementById('totalAmount').value = '0.00';
  document.getElementById('itemsTableBody').innerHTML = '';
  setCurrentDate();
}

// --- Reorder Stock Modal Logic ---
function onReorderItemTypeChange() {
  const type = document.getElementById('reorderItemType').value;
  document.getElementById('reorderWeighableFields').style.display = type === 'weighable' ? 'block' : 'none';
  document.getElementById('reorderUnitBasedFields').style.display = type === 'unit_based' ? 'block' : 'none';
  calculateReorderTotalCost();
  calculateReorderTotalRevenue();
}
  
function calculateReorderTotalWeight() {
  const weight = parseFloat(document.getElementById('reorderWeighableWeightPerPackage').value) || 0;
  const packages = parseInt(document.getElementById('reorderWeighableInitialPackages').value) || 0;
  document.getElementById('reorderWeighableTotalWeight').value = (weight * packages) + ' kg';
  calculateReorderTotalRevenue();
}
  
function calculateReorderTotalUnits() {
  const units = parseInt(document.getElementById('reorderUnitUnitsPerPackage').value) || 0;
  const packages = parseInt(document.getElementById('reorderUnitInitialPackages').value) || 0;
  const unitName = document.getElementById('reorderItemBaseUnit').options[document.getElementById('reorderItemBaseUnit').selectedIndex].text;
  document.getElementById('reorderUnitTotalUnits').value = (units * packages) + ' ' + unitName;
  calculateReorderTotalRevenue();
}
  
function calculateReorderTotalCost() {
  const price = parseFloat(document.getElementById('reorderPurchasePrice').value) || 0;
  let packages = 0;
  if (document.getElementById('reorderWeighableFields').style.display === 'block') {
    packages = parseInt(document.getElementById('reorderWeighableInitialPackages').value) || 0;
  } else {
    packages = parseInt(document.getElementById('reorderUnitInitialPackages').value) || 0;
  }
  document.getElementById('reorderTotalCost').value = (price * packages).toFixed(2);
}
  
function calculateReorderTotalRevenue() {
  const price = parseFloat(document.getElementById('reorderSellingPrice').value) || 0;
  let totalQty = 0;
  if (document.getElementById('reorderItemType').value === 'weighable') {
    totalQty = parseFloat(document.getElementById('reorderWeighableTotalWeight').value) || 0;
  } else {
    totalQty = parseInt(document.getElementById('reorderUnitTotalUnits').value) || 0;
  }
  document.getElementById('reorderTotalRevenue').value = (price * totalQty).toFixed(2);
}
  
function onReorderItemNameInput() {
  // Here you would check if the item exists and pre-fill fields if so, or clear fields for new item
  // For now, just show/hide the current stock display as a placeholder
  const name = document.getElementById('reorderItemName').value.trim();
  if (name === 'Rice') {
    document.getElementById('reorderCurrentStockDisplay').style.display = 'block';
    document.getElementById('reorderCurrentStockValue').innerText = '500 kg';
  } else if (name === 'Sugar') {
    document.getElementById('reorderCurrentStockDisplay').style.display = 'block';
    document.getElementById('reorderCurrentStockValue').innerText = '750 kg';
  } else {
    document.getElementById('reorderCurrentStockDisplay').style.display = 'none';
    document.getElementById('reorderCurrentStockValue').innerText = '0';
  }
}

// Load sales history from backend
async function loadSalesHistory() {
  try {
    const response = await fetch('http://localhost:5000/api/sales');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    sales = await response.json();
    displaySalesHistory();
    console.log('Sales history loaded:', sales);
  } catch (error) {
    console.error('Error loading sales history:', error);
    const tableBody = document.getElementById('salesHistoryTableBody');
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>Error loading sales: ${error.message}
        </td>
      </tr>
    `;
    updatePaginationInfo(0, 0, 0);
  }
}

// Load sales data without resetting pagination
async function loadSalesData() {
  try {
    const response = await fetch('http://localhost:5000/api/sales');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    sales = await response.json();
    displaySalesHistory();
    console.log('Sales history loaded:', sales);
  } catch (error) {
    console.error('Error loading sales history:', error);
    const tableBody = document.getElementById('salesHistoryTableBody');
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>Error loading sales: ${error.message}
        </td>
      </tr>
    `;
    updatePaginationInfo(0, 0, 0);
  }
}

// Display sales history in the table
function displaySalesHistory() {
  const tableBody = document.getElementById('salesHistoryTableBody');
  
  // Filter sales for today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    saleDate.setHours(0, 0, 0, 0);
    return saleDate.getTime() === today.getTime();
  });

  if (filteredSales.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted">
          <i class="fas fa-inbox me-2"></i>No sales found for today
        </td>
      </tr>
    `;
    updatePaginationInfo(0, 0, 0);
    return;
  }

  // Calculate pagination for filtered sales
  totalPages = Math.ceil(filteredSales.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = Math.min(startIndex + recordsPerPage, filteredSales.length);
  const currentPageSales = filteredSales.slice(startIndex, endIndex);

  const salesHTML = currentPageSales.map(sale => {
    // Get customer name
    let customerName = 'Unknown Customer';
    if (sale.customer_id && sale.customer_id.name) {
      customerName = sale.customer_id.name;
    } else if (sale.customer_info && sale.customer_info.name) {
      customerName = sale.customer_info.name;
    } else if (sale.customer_info && sale.customer_info.gender) {
      customerName = sale.customer_info.gender;
    }
    const customerGender = sale.customer_info ? sale.customer_info.gender : '';
    
    // Get items information
    let itemsCount = 0;
    let itemsList = [];
    
    if (sale.items && sale.items.length > 0) {
      itemsCount = sale.items.length;
      itemsList = sale.items.map(item => {
        const itemName = item.item_id ? item.item_id.name : 'Unknown Item';
        const quantity = item.quantity_sold;
        const unit = item.item_id ? item.item_id.base_unit : '';
        return `${itemName} (${quantity} ${unit})`;
      });
    }
    
    // Format date
    const saleDate = new Date(sale.date).toLocaleDateString();
    
    // Format total amount
    const totalAmount = parseFloat(sale.total_amount).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });

    return `
      <tr>
        <td>
          <div class="d-flex px-2 py-1">
            <div class="d-flex flex-column justify-content-center">
              <h6 class="mb-0 text-sm">${customerName}</h6>
              <p class="text-xs text-secondary mb-0">${customerGender}</p>
            </div>
          </div>
        </td>
        <td>
          <p class="text-xs font-weight-bold mb-0">${itemsCount} items</p>
          <p class="text-xs text-secondary mb-0">${itemsList.join(', ')}</p>
        </td>
        <td class="align-middle text-center text-sm">
          <span class="text-xs font-weight-bold">${saleDate}</span>
        </td>
        <td class="align-middle text-center">
          <span class="text-xs font-weight-bold">${totalAmount}</span>
        </td>
        <td class="align-middle text-center">
          <button class="btn btn-link text-danger mb-0" onclick="deleteSale('${sale._id}')" title="Delete Sale">
            <i class="fa fa-trash text-xs"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  tableBody.innerHTML = salesHTML;
  
  // Update pagination info and controls
  updatePaginationInfo(startIndex + 1, endIndex, filteredSales.length);
  updatePaginationControls();
}


// Add placeholder functions for delete

let saleIdToDelete = null;

function deleteSale(saleId) {
  saleIdToDelete = saleId;
  const modal = new bootstrap.Modal(document.getElementById('deleteSaleModal'));
  modal.show();
}

// Attach event listener for the confirm delete button
// Remove the old top-level event listener for confirmDeleteSaleBtn
// Attach event listener for the confirm delete button after DOM is loaded

document.addEventListener('DOMContentLoaded', function() {
  const confirmDeleteSaleBtn = document.getElementById('confirmDeleteSaleBtn');
  if (confirmDeleteSaleBtn) {
    confirmDeleteSaleBtn.addEventListener('click', async function() {
      if (!saleIdToDelete) return;
      fetch(`http://localhost:5000/api/sales/${saleIdToDelete}`, {
        method: 'DELETE'
      })
      .then(async res => {
        if (res.ok) {
          alert('Sale deleted and item quantities restored.');
          currentPage = 1;
          await loadSalesData();
          await loadItems();
          weighableCurrentPage = 1;
          unitCurrentPage = 1;
          await fetchAndDisplayItems('weighable', 'weighableItemsTableBody');
          await fetchAndDisplayItems('unit_based', 'unitItemsTableBody');
        } else {
          const error = await res.json();
          alert('Failed to delete sale: ' + (error.error || 'Unknown error'));
        }
        saleIdToDelete = null;
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteSaleModal'));
        if (modal) modal.hide();
      })
      .catch(err => {
        alert('Failed to delete sale: ' + err.message);
        saleIdToDelete = null;
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteSaleModal'));
        if (modal) modal.hide();
      });
    });
  }
});

// Update pagination info and controls
function updatePaginationInfo(startRecord, endRecord, totalRecords) {
  document.getElementById('startRecord').innerText = startRecord;
  document.getElementById('endRecord').innerText = endRecord;
  document.getElementById('totalRecords').innerText = totalRecords;
}

function updatePaginationControls() {
  const prevPage = document.getElementById('prevPage');
  const nextPage = document.getElementById('nextPage');
  const currentPageInfo = document.getElementById('currentPageInfo');
  
  // Enable/disable previous button
  prevPage.disabled = currentPage <= 1;
  
  // Enable/disable next button
  nextPage.disabled = currentPage >= totalPages;
  
  // Update page info text
  currentPageInfo.innerText = `Page ${currentPage} of ${totalPages}`;
}

function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    displaySalesHistory();
  }
}

function nextPage() {
  if (currentPage < totalPages) {
    currentPage++;
    displaySalesHistory();
  }
}

// Refresh sales data (resets to page 1)
function refreshSalesHistory() {
  currentPage = 1;
  loadSalesData();
}

document.addEventListener('DOMContentLoaded', function () {
  // --- CATEGORY DROPDOWN LOGIC ---
  const categorySelect = document.getElementById('addItemCategory');
  async function fetchAndPopulateCategories() {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const categories = await response.json();
      categorySelect.innerHTML = '<option value="">Select category...</option>';
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category._id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error populating categories:', error);
      categorySelect.innerHTML = '<option value="">Could not load categories</option>';
    }
  }

  // --- DYNAMIC FIELD LOGIC ---
  const itemTypeSelect = document.getElementById('addItemType');
  const baseUnitSelect = document.getElementById('addItemBaseUnit');

  // Weighable fields
  const weighableFields = document.getElementById('weighableFields');
  const weighablePackageUnit = document.getElementById('weighablePackageUnit');
  const weighableWeightInput = document.getElementById('weighableWeightPerPackage');
  const weighablePackagesInput = document.getElementById('weighableInitialPackages');
  const totalWeightOutput = document.getElementById('weighableTotalWeight');

  // Unit-based fields
  const unitBasedFields = document.getElementById('unitBasedFields');
  const unitPackageUnit = document.getElementById('unitPackageUnit');
  const unitUnitsInput = document.getElementById('unitUnitsPerPackage');
  const unitPackagesInput = document.getElementById('unitInitialPackages');
  const totalUnitsOutput = document.getElementById('unitTotalUnits');

  // Pricing fields
  const purchasePriceInput = document.getElementById('addItemPurchasePrice');
  const sellingPriceInput = document.getElementById('addItemSellingPrice');
  const totalCostOutput = document.getElementById('addItemTotalCost');
  const totalRevenueOutput = document.getElementById('addItemTotalRevenue');

  // Attach event listeners for inventory pagination buttons
  var weighablePrevBtn = document.getElementById('weighablePrevPage');
  var weighableNextBtn = document.getElementById('weighableNextPage');
  var unitPrevBtn = document.getElementById('unitPrevPage');
  var unitNextBtn = document.getElementById('unitNextPage');

  if (weighablePrevBtn) {
weighablePrevBtn.addEventListener('click', function() {
  if (weighableCurrentPage > 1) {
    weighableCurrentPage--;
    renderPaginatedItems('weighable');
  }
});
}
if (weighableNextBtn) {
weighableNextBtn.addEventListener('click', function() {
  if (weighableCurrentPage < weighableTotalPages) {
    weighableCurrentPage++;
    renderPaginatedItems('weighable');
  }
});
}
if (unitPrevBtn) {
unitPrevBtn.addEventListener('click', function() {
  if (unitCurrentPage > 1) {
    unitCurrentPage--;
    renderPaginatedItems('unit_based');
  }
});
}
if (unitNextBtn) {
unitNextBtn.addEventListener('click', function() {
  if (unitCurrentPage < unitTotalPages) {
    unitCurrentPage++;
    renderPaginatedItems('unit_based');
  }
});
}

  function toggleItemTypeFields() {
    if (itemTypeSelect.value === 'weighable') {
      weighableFields.style.display = 'block';
      unitBasedFields.style.display = 'none';
      weighablePackageUnit.disabled = false;
      weighableWeightInput.disabled = false;
      weighablePackagesInput.disabled = false;
      unitPackageUnit.disabled = true;
      unitUnitsInput.disabled = true;
      unitPackagesInput.disabled = true;
    } else {
      weighableFields.style.display = 'none';
      unitBasedFields.style.display = 'block';
      weighablePackageUnit.disabled = true;
      weighableWeightInput.disabled = true;
      weighablePackagesInput.disabled = true;
      unitPackageUnit.disabled = false;
      unitUnitsInput.disabled = false;
      unitPackagesInput.disabled = false;
    }
    calculateTotals();
  }

  function calculateTotals() {
    const itemType = itemTypeSelect.value;
    const purchasePrice = parseFloat(purchasePriceInput.value) || 0;
    const sellingPrice = parseFloat(sellingPriceInput.value) || 0;

    let initialPackages = 0;
    let totalQuantity = 0;
    let totalCost = 0;
    let totalRevenue = 0;

    if (itemType === 'weighable') {
      const weightPerPackage = parseFloat(weighableWeightInput.value) || 0;
      initialPackages = parseInt(weighablePackagesInput.value) || 0;
      totalQuantity = weightPerPackage * initialPackages;
      totalWeightOutput.value = totalQuantity ? (totalQuantity + ' ' + baseUnitSelect.value) : '';
      totalCost = initialPackages * purchasePrice;
      totalRevenue = sellingPrice * totalQuantity;
    } else {
      const unitsPerPackage = parseInt(unitUnitsInput.value) || 0;
      initialPackages = parseInt(unitPackagesInput.value) || 0;
      totalQuantity = unitsPerPackage * initialPackages;
      const unitName = baseUnitSelect.options[baseUnitSelect.selectedIndex].text;
      totalUnitsOutput.value = totalQuantity ? (totalQuantity + ' ' + unitName + (totalQuantity === 1 ? '' : 's')) : '';
      totalCost = initialPackages * purchasePrice;
      totalRevenue = sellingPrice * totalQuantity;
    }

    totalCostOutput.value = totalCost ? ('$' + totalCost.toFixed(2)) : '';
    totalRevenueOutput.value = totalRevenue ? ('$' + totalRevenue.toFixed(2)) : '';
  }

  // Event listeners
  itemTypeSelect.addEventListener('change', toggleItemTypeFields);
  baseUnitSelect.addEventListener('change', calculateTotals);

  [weighableWeightInput, weighablePackagesInput, unitUnitsInput, unitPackagesInput, purchasePriceInput, sellingPriceInput].forEach(input => {
    input.addEventListener('input', calculateTotals);
  });

  // Initial state
  fetchAndPopulateCategories();
  toggleItemTypeFields();

  const addNewItemForm = document.getElementById('addNewItemForm');
  addNewItemForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData(addNewItemForm);
    const data = {};
    formData.forEach((value, key) => {
      if (value) data[key] = value;
    });

    // Clean up data based on item type
    if (data.item_type === 'weighable') {
      delete data.units_per_package;
      // Add total_quantity as total weight
      const weightPerPackage = parseFloat(weighableWeightInput.value) || 0;
      const initialPackages = parseInt(weighablePackagesInput.value) || 0;
      data.total_quantity = weightPerPackage * initialPackages;
    } else if (data.item_type === 'unit_based') {
      delete data.weight_per_package;
      // Add total_quantity as total units
      const unitsPerPackage = parseInt(unitUnitsInput.value) || 0;
      const initialPackages = parseInt(unitPackagesInput.value) || 0;
      data.total_quantity = unitsPerPackage * initialPackages;
    }

    fetch('http://localhost:5000/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(result => {
      if (result.message === 'Item added successfully') {
        alert('Item added successfully!');
        addNewItemForm.reset();
        if (typeof calculateTotals === 'function') calculateTotals();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addNewItemModal'));
        if (modal) modal.hide();
      } else {
        let errorMessage = result.error || 'Unknown error';
        if(result.details && result.details.errors) {
          const errors = Object.values(result.details.errors).map(e => e.message).join('\n');
          errorMessage += ':\n' + errors;
        } else if (result.details) {
          errorMessage += ': ' + JSON.stringify(result.details);
        }
        alert('Error adding item: \n' + errorMessage);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred while adding the item.');
    });
  });

  // Utility to render items in a table
  function renderItemsTable(items, tableBodyId, type) {
    const tbody = document.getElementById(tableBodyId);
    tbody.innerHTML = '';
    // Find the most recently updated item (by updatedAt)
    let mostRecentItem = null;
    let mostRecentTime = 0;
    items.forEach(item => {
      if (item.updatedAt) {
        const t = new Date(item.updatedAt).getTime();
        if (t > mostRecentTime) {
          mostRecentTime = t;
          mostRecentItem = item;
        }
      }
    });
    const now = Date.now();
    // Helper to fetch and render each row with correct stock
    async function renderRow(item) {
      // Always use item.total_quantity for availableQty
      let availableQty = item.total_quantity !== undefined ? item.total_quantity : '';
      let statusHtml = '';
      const minStock = Number(item.minimum_stock) || 0;
      if (availableQty === 0) {
        statusHtml = '<span class="badge badge-sm bg-gradient-danger">No Stock</span>';
      } else if (availableQty === minStock) {
        statusHtml = '<span class="badge badge-sm bg-gradient-warning">Low Stock</span>';
      } else if (availableQty > minStock) {
        statusHtml = '<span class="badge badge-sm bg-gradient-success">In Stock</span>';
      } else if (availableQty < minStock) {
        statusHtml = '<span class="badge badge-sm bg-gradient-warning">Low Stock</span>';
      }
      const tr = document.createElement('tr');
      let actionButtons = `<button class="btn btn-sm btn-primary" onclick="onUpdateItem('${item._id}')">Update</button>`;
      tr.innerHTML = `
        <td>${item.name || ''}</td>
        <td>${availableQty}</td>
        <td>${item.base_unit || ''}</td>
        <td>${item.selling_price_per_unit || ''}</td>
        <td>${statusHtml}</td>
        <td>${actionButtons}</td>
      `;
      tbody.appendChild(tr);
    }
    // Render all rows asynchronously
    (async () => {
      for (const item of items) {
        await renderRow(item);
      }
    })();
  }

  // Fetch and display items for a given type
  async function fetchAndDisplayItems(itemType, tableBodyId) {
try {
  const response = await fetch(`http://localhost:5000/api/items?item_type=${itemType}`);
  const items = await response.json();
  if (itemType === 'weighable') {
    weighableItemsCache = items;
    weighableTotalPages = Math.ceil(items.length / inventoryRecordsPerPage) || 1;
    renderPaginatedItems('weighable');
  } else {
    unitItemsCache = items;
    unitTotalPages = Math.ceil(items.length / inventoryRecordsPerPage) || 1;
    renderPaginatedItems('unit_based');
  }
} catch (error) {
  console.error('Error fetching items:', error);
}
}
window.fetchAndDisplayItems = fetchAndDisplayItems;
   
  function renderPaginatedItems(itemType) {
let items, currentPage, totalPages, tableBodyId, startRecordId, endRecordId, totalRecordsId, currentPageInfoId, prevBtnId, nextBtnId;
if (itemType === 'weighable') {
  items = weighableItemsCache;
  currentPage = weighableCurrentPage;
  totalPages = weighableTotalPages;
  tableBodyId = 'weighableItemsTableBody';
  startRecordId = 'weighableStartRecord';
  endRecordId = 'weighableEndRecord';
  totalRecordsId = 'weighableTotalRecords';
  currentPageInfoId = 'weighableCurrentPageInfo';
  prevBtnId = 'weighablePrevPage';
  nextBtnId = 'weighableNextPage';
} else {
  items = unitItemsCache;
  currentPage = unitCurrentPage;
  totalPages = unitTotalPages;
  tableBodyId = 'unitItemsTableBody';
  startRecordId = 'unitStartRecord';
  endRecordId = 'unitEndRecord';
  totalRecordsId = 'unitTotalRecords';
  currentPageInfoId = 'unitCurrentPageInfo';
  prevBtnId = 'unitPrevPage';
  nextBtnId = 'unitNextPage';
}
const startIndex = (currentPage - 1) * inventoryRecordsPerPage;
const endIndex = Math.min(startIndex + inventoryRecordsPerPage, items.length);
const currentItems = items.slice(startIndex, endIndex);
renderItemsTable(currentItems, tableBodyId, itemType);
document.getElementById(startRecordId).innerText = items.length === 0 ? 0 : startIndex + 1;
document.getElementById(endRecordId).innerText = endIndex;
document.getElementById(totalRecordsId).innerText = items.length;
document.getElementById(currentPageInfoId).innerText = `Page ${currentPage} of ${totalPages}`;
document.getElementById(prevBtnId).disabled = currentPage <= 1;
document.getElementById(nextBtnId).disabled = currentPage >= totalPages;
}

  // On tab click, fetch and display
  const weighableTab = document.querySelector('[href="#weighable"]');
  const unitTab = document.querySelector('[href="#unit"]');
  if (weighableTab) weighableTab.addEventListener('click', function() {
    fetchAndDisplayItems('weighable', 'weighableItemsTableBody');
  });
  if (unitTab) unitTab.addEventListener('click', function() {
    fetchAndDisplayItems('unit_based', 'unitItemsTableBody');
  });
  // On page load, fetch weighable items by default
  fetchAndDisplayItems('weighable', 'weighableItemsTableBody');
});

async function loadCommodityRequestStatusSummary() {
  try {
    const response = await fetch('http://localhost:5000/api/commodity-requests/status-summary');
    const summary = await response.json();
    document.getElementById('total-commodity-requests').innerText = summary.total;
    document.getElementById('pending-commodity-requests').innerText = summary.pending;
    document.getElementById('approved-commodity-requests').innerText = summary.approved;
    document.getElementById('rejected-commodity-requests').innerText = summary.rejected;
  } catch (error) {
    document.getElementById('total-commodity-requests').innerText = 'Error';
    document.getElementById('pending-commodity-requests').innerText = 'Error';
    document.getElementById('approved-commodity-requests').innerText = 'Error';
    document.getElementById('rejected-commodity-requests').innerText = 'Error';
    console.error('Failed to load commodity request status summary:', error);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // ... existing code ...
  loadCommodityRequestStatusSummary();
});

async function loadTopRequestedItems() {
  try {
    const response = await fetch('http://localhost:5000/api/commodity-requests/top-items');
    const items = await response.json();
    const tbody = document.getElementById('topRequestedItemsTableBody');
    tbody.innerHTML = '';
    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">No data</td></tr>';
      return;
    }
    items.forEach(item => {
      const date = new Date(item.period);
      const period = date.toLocaleDateString();
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${item.commodity_name}</td><td>${period}</td>`;
      tbody.appendChild(tr);
    });
  } catch (error) {
    const tbody = document.getElementById('topRequestedItemsTableBody');
    tbody.innerHTML = '<tr><td colspan="2" class="text-center text-danger">Error loading data</td></tr>';
    console.error('Failed to load top requested items:', error);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // ... existing code ...
  loadTopRequestedItems();
});

// Add the onQuantityChange function
function onQuantityChange(input, rowId) {
  console.log('onQuantityChange called with rowId:', rowId, 'input value:', input.value);
  
  // Validate input parameters
  if (!input || !rowId) {
    console.error('Invalid parameters passed to onQuantityChange:', { input, rowId });
    return;
  }
  
  try {
    const row = document.getElementById(rowId);
    if (!row) {
      console.error('Row not found for rowId:', rowId);
      return;
    }
    
    const qty = parseFloat(input.value) || 0;
    const itemSelect = row.querySelector('.item-select');
    
    console.log('Found itemSelect:', itemSelect);
    console.log('itemSelect value:', itemSelect ? itemSelect.value : 'null');
    
    // Check if item is selected
    if (!itemSelect || !itemSelect.value) {
      console.log('No item selected, calculating total without stock validation');
      // No item selected yet, just calculate the total without stock validation
      calculateRowTotal(rowId);
      return;
    }
    
    const selectedItemId = itemSelect.value;
    console.log('Selected item ID:', selectedItemId);
    console.log('Available items:', items);
    
    const selectedItem = items.find(item => item._id === selectedItemId);
    console.log('Selected item:', selectedItem);
    
    const warningSpan = row.querySelector('.stock-warning');
    
    if (selectedItem && qty > selectedItem.total_quantity) {
      warningSpan.textContent = `Only ${selectedItem.total_quantity} in stock!`;
      warningSpan.style.display = 'block';
    } else {
      warningSpan.textContent = '';
      warningSpan.style.display = 'none';
    }
    
    calculateRowTotal(rowId);
  } catch (error) {
    console.error('Error in onQuantityChange:', error);
    console.error('Error stack:', error.stack);
    // Still try to calculate the total even if there's an error
    try {
      calculateRowTotal(rowId);
    } catch (calcError) {
      console.error('Error calculating row total:', calcError);
    }
  }
}

// Store original values for increment logic
let originalUpdateItemValues = {};

function onUpdateItem(itemId) {
  fetch(`http://localhost:5000/api/items/${itemId}`)
    .then(response => response.json())
    .then(item => {
      document.getElementById('updateItemName').value = item.name || '';
      fetch('http://localhost:5000/api/categories')
        .then(res => res.json())
        .then(categories => {
          const categorySelect = document.getElementById('updateItemCategory');
          categorySelect.innerHTML = '<option value="">Select category...</option>';
          categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category._id;
            option.textContent = category.name;
            if (item.category_id && (item.category_id._id ? item.category_id._id : item.category_id) === category._id) option.selected = true;
            categorySelect.appendChild(option);
          });
        });
      document.getElementById('updateItemType').value = item.item_type || 'weighable';
      document.getElementById('updateItemBaseUnit').value = item.base_unit || 'kg';
      // --- Supplier fields ---
      if (item.supplier_id && typeof item.supplier_id === 'object') {
        document.getElementById('updateSupplierName').value = item.supplier_id.name || '';
        document.getElementById('updateSupplierContact').value = item.supplier_id.contact_info || '';
      } else {
        document.getElementById('updateSupplierName').value = '';
        document.getElementById('updateSupplierContact').value = '';
      }
      document.getElementById('updateItemExpiryDate').value = item.expiry_date ? item.expiry_date.split('T')[0] : '';
      document.getElementById('updateItemMinStock').value = item.minimum_stock || '';
      document.getElementById('updateItemPurchasePrice').value = item.purchase_price_per_package || '';
      document.getElementById('updateItemSellingPrice').value = item.selling_price_per_unit || '';
      if (item.item_type === 'weighable') {
        document.getElementById('updateWeighableFields').style.display = 'block';
        document.getElementById('updateUnitBasedFields').style.display = 'none';
        document.getElementById('updateWeighablePackageUnit').value = item.package_unit || '';
        document.getElementById('updateWeighableWeightPerPackage').value = item.weight_per_package || '';
        document.getElementById('updateWeighableInitialPackages').value = item.initial_packages || '';
        const weight = parseFloat(item.weight_per_package) || 0;
        const packages = parseInt(item.initial_packages) || 0;
        document.getElementById('updateWeighableTotalWeight').value = (weight * packages) + ' ' + (item.base_unit || 'kg');
        // Store original values for increment logic
        originalUpdateItemValues = {
          item_type: 'weighable',
          initial_packages: packages,
          weight_per_package: weight,
          total_weight: weight * packages,
          minimum_stock: item.minimum_stock || 0,
          expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : ''
        };
      } else {
        document.getElementById('updateWeighableFields').style.display = 'none';
        document.getElementById('updateUnitBasedFields').style.display = 'block';
        document.getElementById('updateUnitPackageUnit').value = item.package_unit || '';
        document.getElementById('updateUnitUnitsPerPackage').value = item.units_per_package || '';
        document.getElementById('updateUnitInitialPackages').value = item.initial_packages || '';
        const units = parseInt(item.units_per_package) || 0;
        const packages = parseInt(item.initial_packages) || 0;
        const unitName = document.getElementById('updateItemBaseUnit').options[document.getElementById('updateItemBaseUnit').selectedIndex].text;
        document.getElementById('updateUnitTotalUnits').value = (units * packages) + ' ' + unitName;
        // Store original values for increment logic
        originalUpdateItemValues = {
          item_type: 'unit_based',
          initial_packages: packages,
          units_per_package: units,
          total_units: units * packages,
          minimum_stock: item.minimum_stock || 0,
          expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : ''
        };
      }
      updateCalculateTotals();
      const modal = new bootstrap.Modal(document.getElementById('updateItemModal'));
      modal.show();
      document.getElementById('updateItemForm').setAttribute('data-item-id', itemId);
    })
    .catch(error => {
      alert('Failed to load item details: ' + error);
    });
}

// Update calculation logic for update modal
function updateCalculateTotals() {
  const itemType = document.getElementById('updateItemType').value;
  const purchasePrice = parseFloat(document.getElementById('updateItemPurchasePrice').value) || 0;
  const sellingPrice = parseFloat(document.getElementById('updateItemSellingPrice').value) || 0;
  let initialPackages = 0;
  let totalQuantity = 0;
  let totalCost = 0;
  let totalRevenue = 0;
  if (itemType === 'weighable') {
    const weightPerPackage = parseFloat(document.getElementById('updateWeighableWeightPerPackage').value) || 0;
    initialPackages = parseInt(document.getElementById('updateWeighableInitialPackages').value) || 0;
    totalQuantity = weightPerPackage * initialPackages;
    document.getElementById('updateWeighableTotalWeight').value = totalQuantity ? (totalQuantity + ' ' + document.getElementById('updateItemBaseUnit').value) : '';
    totalCost = initialPackages * purchasePrice;
    totalRevenue = sellingPrice * totalQuantity;
  } else {
    const unitsPerPackage = parseInt(document.getElementById('updateUnitUnitsPerPackage').value) || 0;
    initialPackages = parseInt(document.getElementById('updateUnitInitialPackages').value) || 0;
    totalQuantity = unitsPerPackage * initialPackages;
    const unitName = document.getElementById('updateItemBaseUnit').options[document.getElementById('updateItemBaseUnit').selectedIndex].text;
    document.getElementById('updateUnitTotalUnits').value = totalQuantity ? (totalQuantity + ' ' + unitName + (totalQuantity === 1 ? '' : 's')) : '';
    totalCost = initialPackages * purchasePrice;
    totalRevenue = sellingPrice * totalQuantity;
  }
  document.getElementById('updateItemTotalCost').value = totalCost ? ('$' + totalCost.toFixed(2)) : '';
  document.getElementById('updateItemTotalRevenue').value = totalRevenue ? ('$' + totalRevenue.toFixed(2)) : '';
}

// Handle update item form submit
const updateItemForm = document.getElementById('updateItemForm');
updateItemForm.addEventListener('submit', function(event) {
  event.preventDefault();
  const itemId = updateItemForm.getAttribute('data-item-id');
  const formData = new FormData(updateItemForm);
  const data = {};
  formData.forEach((value, key) => {
    if (value) data[key] = value;
  });
  // --- Increment/replace logic ---
  if (originalUpdateItemValues.item_type === 'weighable') {
    const newInitialPackages = parseInt(document.getElementById('updateWeighableInitialPackages').value) || 0;
    const newWeightPerPackage = parseFloat(document.getElementById('updateWeighableWeightPerPackage').value) || 0;
    const newTotalWeight = newInitialPackages * newWeightPerPackage;
    data.increment_initial_packages = newInitialPackages - originalUpdateItemValues.initial_packages;
    data.increment_total_weight = newTotalWeight - originalUpdateItemValues.total_weight;
  } else if (originalUpdateItemValues.item_type === 'unit_based') {
    const newInitialPackages = parseInt(document.getElementById('updateUnitInitialPackages').value) || 0;
    const newUnitsPerPackage = parseInt(document.getElementById('updateUnitUnitsPerPackage').value) || 0;
    const newTotalUnits = newInitialPackages * newUnitsPerPackage;
    data.increment_initial_packages = newInitialPackages - originalUpdateItemValues.initial_packages;
    data.increment_total_units = newTotalUnits - originalUpdateItemValues.total_units;
  }
  // For minimum stock and expiry date, always replace
  data.minimum_stock = document.getElementById('updateItemMinStock').value;
  data.expiry_date = document.getElementById('updateItemExpiryDate').value;
  fetch(`http://localhost:5000/api/items/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(response => response.json())
    .then(result => {
      if (result.message === 'Item updated successfully') {
        alert('Item updated successfully!');
        const modal = bootstrap.Modal.getInstance(document.getElementById('updateItemModal'));
        if (modal) modal.hide();
        fetchAndDisplayItems('weighable', 'weighableItemsTableBody');
        fetchAndDisplayItems('unit_based', 'unitItemsTableBody');
        loadSecondaryInventoryAdjustments();
      } else {
        let errorMessage = result.error || 'Unknown error';
        if(result.details && result.details.errors) {
          const errors = Object.values(result.details.errors).map(e => e.message).join('\n');
          errorMessage += ':\n' + errors;
        } else if (result.details) {
          errorMessage += ': ' + JSON.stringify(result.details);
        }
        alert('Error updating item: \n' + errorMessage);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred while updating the item.');
    });
});

// Ensure updateCalculateTotals is called on input for all relevant update modal fields
['updateWeighableWeightPerPackage', 'updateWeighableInitialPackages', 'updateItemPurchasePrice', 'updateItemSellingPrice', 'updateUnitUnitsPerPackage', 'updateUnitInitialPackages'].forEach(function(id) {
  var el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', updateCalculateTotals);
  }
});

// Export Sales History as PDF
document.addEventListener('DOMContentLoaded', function() {
  const exportBtn = document.getElementById('exportSalesHistoryBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', function() {
      // Filter today's sales (same logic as displaySalesHistory)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        saleDate.setHours(0, 0, 0, 0);
        return saleDate.getTime() === today.getTime();
      });

      if (filteredSales.length === 0) {
        alert('No sales found for today to export.');
        return;
      }

      // Prepare table data
      const headers = [['Customer', 'Items', 'Date', 'Total']];
      const rows = filteredSales.map(sale => {
        // Customer name
        let customerName = 'Unknown Customer';
        if (sale.customer_id && sale.customer_id.name) {
          customerName = sale.customer_id.name;
        } else if (sale.customer_info && sale.customer_info.name) {
          customerName = sale.customer_info.name;
        } else if (sale.customer_info && sale.customer_info.gender) {
          customerName = sale.customer_info.gender;
        }
        // Items
        let itemsList = [];
        if (sale.items && sale.items.length > 0) {
          itemsList = sale.items.map(item => {
            const itemName = item.item_id ? item.item_id.name : 'Unknown Item';
            const quantity = item.quantity_sold;
            const unit = item.item_id ? item.item_id.base_unit : '';
            return `${itemName} (${quantity} ${unit})`;
          });
        }
        // Date
        const saleDate = new Date(sale.date).toLocaleDateString();
        // Total
        const totalAmount = parseFloat(sale.total_amount).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD'
        });
        return [
          customerName,
          itemsList.join(', '),
          saleDate,
          totalAmount
        ];
      });

      // Generate PDF
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.text('Sales History - ' + today.toISOString().split('T')[0], 14, 14);
      doc.autoTable({
        head: headers,
        body: rows,
        startY: 20,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [26, 115, 232] }
      });
      doc.save('sales_history_' + today.toISOString().split('T')[0] + '.pdf');
    });
  }
});

// --- Secondary Inventory Integration ---
const secondaryInventoryRecordsPerPage = 4;
let secondaryWeighableCurrentPage = 1;
let secondaryWeighableTotalPages = 1;
let secondaryWeighableAdjustmentsCache = [];
let secondaryUnitCurrentPage = 1;
let secondaryUnitTotalPages = 1;
let secondaryUnitAdjustmentsCache = [];

// Fetch all inventory adjustments from backend
async function fetchInventoryAdjustments() {
  try {
    const response = await fetch('http://localhost:5000/api/inventory-adjustments');
    const data = await response.json();
    return data.adjustments || [];
  } catch (error) {
    console.error('Error fetching inventory adjustments:', error);
    return [];
  }
}

// Render adjustments in the secondary inventory tables
function renderAdjustmentsTable(adjustments, tableBodyId) {
  const tbody = document.getElementById(tableBodyId);
  tbody.innerHTML = '';
  if (!adjustments.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No records found</td></tr>';
    return;
  }
  adjustments.forEach(adj => {
    const item = adj.item_id || {};
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name || ''}</td>
      <td>${adj.quantity}</td>
      <td>${item.base_unit || ''}</td>
      <td>${adj.adjustment_date ? new Date(adj.adjustment_date).toLocaleDateString() : ''}</td>
      <td class="align-middle text-center">
        <button class="btn btn-link text-danger mb-0 secondary-delete-adjustment-btn" data-id="${adj._id}" data-item-id="${item._id}" data-qty="${adj.quantity}" title="Delete">
          <i class="fa fa-trash text-xs"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  // Attach event listeners for delete buttons
  tbody.querySelectorAll('.secondary-delete-adjustment-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      const itemId = this.getAttribute('data-item-id');
      const qty = this.getAttribute('data-qty');
      deleteInventoryAdjustment(id, itemId, qty);
    });
  });
}

let adjustmentToDeleteId = null;
let adjustmentToDeleteItemId = null;
let adjustmentToDeleteQuantity = null;

function deleteInventoryAdjustment(adjustmentId, itemId, quantity) {
  adjustmentToDeleteId = adjustmentId;
  adjustmentToDeleteItemId = itemId;
  adjustmentToDeleteQuantity = quantity;
  const modal = new bootstrap.Modal(document.getElementById('deleteAdjustmentModal'));
  modal.show();
}

// Attach confirm delete handler
document.addEventListener('DOMContentLoaded', function() {
  const confirmDeleteAdjustmentBtn = document.getElementById('confirmDeleteAdjustmentBtn');
  if (confirmDeleteAdjustmentBtn) {
    confirmDeleteAdjustmentBtn.addEventListener('click', async function() {
      if (!adjustmentToDeleteId || !adjustmentToDeleteItemId) return;
      try {
        // 1. Delete the adjustment
        const response = await fetch(`http://localhost:5000/api/inventory-adjustments/${adjustmentToDeleteId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete adjustment');
        // 2. Reduce the item quantity
        // (Assume backend handles this automatically, but if not, send a PATCH/PUT to update item)
        // 3. Refresh both tables
        await loadSecondaryInventoryAdjustments();
        await fetchAndDisplayItems('weighable', 'weighableItemsTableBody');
        await fetchAndDisplayItems('unit_based', 'unitItemsTableBody');
        // 4. Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteAdjustmentModal'));
        if (modal) modal.hide();
      } catch (err) {
        alert('Error deleting adjustment: ' + err.message);
      } finally {
        adjustmentToDeleteId = null;
        adjustmentToDeleteItemId = null;
        adjustmentToDeleteQuantity = null;
      }
    });
  }
});

// Paginate and render for weighable/unit_based
function renderSecondaryPaginatedAdjustments(itemType) {
  let adjustments, currentPage, totalPages, tableBodyId, startRecordId, endRecordId, totalRecordsId, currentPageInfoId, prevBtnId, nextBtnId;
  if (itemType === 'weighable') {
    adjustments = secondaryWeighableAdjustmentsCache;
    currentPage = secondaryWeighableCurrentPage;
    totalPages = secondaryWeighableTotalPages;
    tableBodyId = 'secondaryWeighableItemsTableBody';
    startRecordId = 'secondaryWeighableStartRecord';
    endRecordId = 'secondaryWeighableEndRecord';
    totalRecordsId = 'secondaryWeighableTotalRecords';
    currentPageInfoId = 'secondaryWeighableCurrentPageInfo';
    prevBtnId = 'secondaryWeighablePrevPage';
    nextBtnId = 'secondaryWeighableNextPage';
  } else {
    adjustments = secondaryUnitAdjustmentsCache;
    currentPage = secondaryUnitCurrentPage;
    totalPages = secondaryUnitTotalPages;
    tableBodyId = 'secondaryUnitItemsTableBody';
    startRecordId = 'secondaryUnitStartRecord';
    endRecordId = 'secondaryUnitEndRecord';
    totalRecordsId = 'secondaryUnitTotalRecords';
    currentPageInfoId = 'secondaryUnitCurrentPageInfo';
    prevBtnId = 'secondaryUnitPrevPage';
    nextBtnId = 'secondaryUnitNextPage';
  }
  const startIndex = (currentPage - 1) * secondaryInventoryRecordsPerPage;
  const endIndex = Math.min(startIndex + secondaryInventoryRecordsPerPage, adjustments.length);
  const currentAdjustments = adjustments.slice(startIndex, endIndex);
  renderAdjustmentsTable(currentAdjustments, tableBodyId);
  document.getElementById(startRecordId).innerText = adjustments.length === 0 ? 0 : startIndex + 1;
  document.getElementById(endRecordId).innerText = endIndex;
  document.getElementById(totalRecordsId).innerText = adjustments.length;
  document.getElementById(currentPageInfoId).innerText = `Page ${currentPage} of ${totalPages}`;
  document.getElementById(prevBtnId).disabled = currentPage <= 1;
  document.getElementById(nextBtnId).disabled = currentPage >= totalPages;
}

// Load and cache adjustments for both types
async function loadSecondaryInventoryAdjustments() {
  const allAdjustments = await fetchInventoryAdjustments();
  // Get today's date in YYYY-MM-DD
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  // Filter by item_type and current date
  secondaryWeighableAdjustmentsCache = allAdjustments.filter(adj => {
    if (!(adj.item_id && adj.item_id.item_type === 'weighable')) return false;
    if (!adj.adjustment_date) return false;
    const adjDate = new Date(adj.adjustment_date);
    const adjStr = `${adjDate.getFullYear()}-${String(adjDate.getMonth() + 1).padStart(2, '0')}-${String(adjDate.getDate()).padStart(2, '0')}`;
    return adjStr === todayStr;
  });
  secondaryUnitAdjustmentsCache = allAdjustments.filter(adj => {
    if (!(adj.item_id && adj.item_id.item_type === 'unit_based')) return false;
    if (!adj.adjustment_date) return false;
    const adjDate = new Date(adj.adjustment_date);
    const adjStr = `${adjDate.getFullYear()}-${String(adjDate.getMonth() + 1).padStart(2, '0')}-${String(adjDate.getDate()).padStart(2, '0')}`;
    return adjStr === todayStr;
  });
  secondaryWeighableTotalPages = Math.ceil(secondaryWeighableAdjustmentsCache.length / secondaryInventoryRecordsPerPage) || 1;
  secondaryUnitTotalPages = Math.ceil(secondaryUnitAdjustmentsCache.length / secondaryInventoryRecordsPerPage) || 1;
  renderSecondaryPaginatedAdjustments('weighable');
}

// Tab click handlers for secondary inventory
const secondaryWeighableTab = document.querySelector('[href="#secondaryWeighable"]');
const secondaryUnitTab = document.querySelector('[href="#secondaryUnit"]');
if (secondaryWeighableTab) secondaryWeighableTab.addEventListener('click', function() {
  renderSecondaryPaginatedAdjustments('weighable');
});
if (secondaryUnitTab) secondaryUnitTab.addEventListener('click', function() {
  renderSecondaryPaginatedAdjustments('unit_based');
});
// Pagination controls for secondary inventory
const secondaryWeighablePrevBtn = document.getElementById('secondaryWeighablePrevPage');
const secondaryWeighableNextBtn = document.getElementById('secondaryWeighableNextPage');
if (secondaryWeighablePrevBtn) secondaryWeighablePrevBtn.addEventListener('click', function() {
  if (secondaryWeighableCurrentPage > 1) {
    secondaryWeighableCurrentPage--;
    renderSecondaryPaginatedAdjustments('weighable');
  }
});
if (secondaryWeighableNextBtn) secondaryWeighableNextBtn.addEventListener('click', function() {
  if (secondaryWeighableCurrentPage < secondaryWeighableTotalPages) {
    secondaryWeighableCurrentPage++;
    renderSecondaryPaginatedAdjustments('weighable');
  }
});
const secondaryUnitPrevBtn = document.getElementById('secondaryUnitPrevPage');
const secondaryUnitNextBtn = document.getElementById('secondaryUnitNextPage');
if (secondaryUnitPrevBtn) secondaryUnitPrevBtn.addEventListener('click', function() {
  if (secondaryUnitCurrentPage > 1) {
    secondaryUnitCurrentPage--;
    renderSecondaryPaginatedAdjustments('unit_based');
  }
});
if (secondaryUnitNextBtn) secondaryUnitNextBtn.addEventListener('click', function() {
  if (secondaryUnitCurrentPage < secondaryUnitTotalPages) {
    secondaryUnitCurrentPage++;
    renderSecondaryPaginatedAdjustments('unit_based');
  }
});
// On page load, fetch and render weighable adjustments by default
loadSecondaryInventoryAdjustments();

// PDF Export functionality for inventory items
function exportInventoryToPDF() {
  // Get the currently active tab
  const activeTab = document.querySelector('.tab-pane.active');
  let title = '';
  let items = [];
  let headers = [];
  
  if (activeTab && activeTab.id === 'weighable') {
    title = 'Weighable Goods Inventory Report';
    items = weighableItemsCache || [];
    headers = ['Item Name', 'Available Quantity', 'Base Unit', 'Selling Price/Unit', 'Status'];
  } else if (activeTab && activeTab.id === 'unit') {
    title = 'Unit-Based Goods Inventory Report';
    items = unitItemsCache || [];
    headers = ['Item Name', 'Available Quantity', 'Base Unit', 'Selling Price/Unit', 'Status'];
  } else {
    alert('Please select a valid inventory tab to export');
    return;
  }
  
  if (!items || items.length === 0) {
    alert('No items to export. Please ensure items are loaded.');
    return;
  }
  
  // Create PDF document
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, 20);
  
  // Add date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleDateString();
  doc.text(`Generated on: ${currentDate}`, 20, 30);
  
  // Prepare table data
  const tableData = items.map(item => [
    item.name || 'N/A',
    item.total_quantity !== undefined ? item.total_quantity.toString() : 'N/A',
    item.base_unit || 'N/A',
    item.selling_price_per_unit ? `shs: ${item.selling_price_per_unit.toFixed(2)}` : 'N/A',
    getStatusText(item.total_quantity, item.minimum_stock)
  ]);
  
  // Add table
  doc.autoTable({
    head: [headers],
    body: tableData,
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
    },
    columnStyles: {
      0: { cellWidth: 50 }, // Item Name
      1: { cellWidth: 30 }, // Available Quantity
      2: { cellWidth: 25 }, // Base Unit
      3: { cellWidth: 35 }, // Selling Price/Unit
      4: { cellWidth: 25 }  // Status
    }
  });
  
  // Add summary
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary:', 20, finalY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Items: ${items.length}`, 20, finalY + 10);
  
  const totalValue = items.reduce((sum, item) => {
    const quantity = item.total_quantity || 0;
    const price = item.selling_price_per_unit || 0;
    return sum + (quantity * price);
  }, 0);
  
  doc.text(`Total Inventory Value: shs: ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20, finalY + 20);
  
  // Save the PDF
  const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// Helper function to get status text
function getStatusText(quantity, minimumStock) {
  if (!quantity || quantity === 0) {
    return 'Out of Stock';
  } else if (minimumStock && quantity <= minimumStock) {
    return 'Low Stock';
  } else {
    return 'In Stock';
  }
}

// PDF Export functionality for secondary inventory
function exportSecondaryInventoryToPDF() {
  console.log('exportSecondaryInventoryToPDF called');
  
  // Get the currently active tab - try multiple approaches
  let activeTab = document.querySelector('.tab-pane.active');
  console.log('Active tab found:', activeTab);
  console.log('Active tab ID:', activeTab ? activeTab.id : 'null');
  
  // If no active tab found, try to find it within the secondary inventory section
  if (!activeTab || (!activeTab.id.includes('secondaryWeighable') && !activeTab.id.includes('secondaryUnit'))) {
    console.log('Looking for secondary inventory tabs specifically...');
    const secondaryWeighableTab = document.getElementById('secondaryWeighable');
    const secondaryUnitTab = document.getElementById('secondaryUnit');
    
    if (secondaryWeighableTab && secondaryWeighableTab.classList.contains('active')) {
      activeTab = secondaryWeighableTab;
      console.log('Found active secondary weighable tab');
    } else if (secondaryUnitTab && secondaryUnitTab.classList.contains('active')) {
      activeTab = secondaryUnitTab;
      console.log('Found active secondary unit tab');
    } else {
      // Try to find any active tab within the secondary inventory section
      const secondaryTabs = document.querySelectorAll('#secondaryWeighable, #secondaryUnit');
      for (const tab of secondaryTabs) {
        if (tab.classList.contains('active') || tab.classList.contains('show')) {
          activeTab = tab;
          console.log('Found active secondary tab:', tab.id);
          break;
        }
      }
    }
  }
  
  console.log('Final active tab:', activeTab);
  console.log('Final active tab ID:', activeTab ? activeTab.id : 'null');
  
  let title = '';
  let items = [];
  let headers = [];
  
  if (activeTab && activeTab.id === 'secondaryWeighable') {
    title = 'Secondary Weighable Goods Inventory Report';
    // Use the secondary weighable adjustments cache (the actual data being displayed)
    const adjustments = secondaryWeighableAdjustmentsCache || [];
    items = adjustments.map(adj => ({
      name: adj.item_id?.name || 'N/A',
      total_quantity: adj.quantity || 0,
      base_unit: adj.item_id?.base_unit || 'N/A',
      selling_price_per_unit: adj.item_id?.selling_price_per_unit || 0,
      minimum_stock: adj.item_id?.minimum_stock || 0,
      adjustment_date: adj.adjustment_date
    }));
    headers = ['Item Name', 'Available Quantity', 'Base Unit', 'Adjustment Date'];
    console.log('Exporting secondary weighable adjustments:', items.length);
  } else if (activeTab && activeTab.id === 'secondaryUnit') {
    title = 'Secondary Unit-Based Goods Inventory Report';
    // Use the secondary unit adjustments cache (the actual data being displayed)
    const adjustments = secondaryUnitAdjustmentsCache || [];
    items = adjustments.map(adj => ({
      name: adj.item_id?.name || 'N/A',
      total_quantity: adj.quantity || 0,
      base_unit: adj.item_id?.base_unit || 'N/A',
      selling_price_per_unit: adj.item_id?.selling_price_per_unit || 0,
      minimum_stock: adj.item_id?.minimum_stock || 0,
      adjustment_date: adj.adjustment_date
    }));
    headers = ['Item Name', 'Available Quantity', 'Base Unit', 'Adjustment Date'];
    console.log('Exporting secondary unit adjustments:', items.length);
  } else {
    console.error('No valid active tab found. Active tab:', activeTab);
    console.error('Available tabs:', document.querySelectorAll('.tab-pane'));
    alert('Please select a valid secondary inventory tab to export');
    return;
  }
  
  if (!items || items.length === 0) {
    alert('No items to export. Please ensure items are loaded.');
    return;
  }
  
  // Create PDF document
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, 20);
  
  // Add date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleDateString();
  doc.text(`Generated on: ${currentDate}`, 20, 30);
  
  // Prepare table data - handle both inventory items and adjustments
  const tableData = items.map(item => {
    if (item.adjustment_date) {
      // This is adjustment data (secondary inventory)
      return [
        item.name || 'N/A',
        item.total_quantity !== undefined ? item.total_quantity.toString() : 'N/A',
        item.base_unit || 'N/A',
        item.adjustment_date ? new Date(item.adjustment_date).toLocaleDateString() : 'N/A'
      ];
    } else {
      // This is regular inventory data (main inventory)
      return [
        item.name || 'N/A',
        item.total_quantity !== undefined ? item.total_quantity.toString() : 'N/A',
        item.base_unit || 'N/A',
        item.selling_price_per_unit ? `shs: ${item.selling_price_per_unit.toFixed(2)}` : 'N/A',
        getStatusText(item.total_quantity, item.minimum_stock)
      ];
    }
  });
  
  // Add table
  doc.autoTable({
    head: [headers],
    body: tableData,
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
    },
    columnStyles: {
      0: { cellWidth: 50 }, // Item Name
      1: { cellWidth: 30 }, // Available Quantity
      2: { cellWidth: 25 }, // Base Unit
      3: { cellWidth: 35 }, // Selling Price/Unit
      4: { cellWidth: 25 }  // Status
    }
  });
  
  // Add summary - handle both inventory items and adjustments
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary:', 20, finalY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Items: ${items.length}`, 20, finalY + 10);
  
  // Only calculate total value if we have selling price data (main inventory)
  if (items.length > 0 && items[0].selling_price_per_unit !== undefined) {
    const totalValue = items.reduce((sum, item) => {
      const quantity = item.total_quantity || 0;
      const price = item.selling_price_per_unit || 0;
      return sum + (quantity * price);
    }, 0);
    
    doc.text(`Total Inventory Value: shs: ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20, finalY + 20);
  }
  
  // Save the PDF
  const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// Export button event listeners are now added in the main DOMContentLoaded event listener

// Test function for debugging secondary inventory export
function testSecondaryInventoryExport() {
  console.log('Testing secondary inventory export...');
  
  // Check if the function exists
  console.log('exportSecondaryInventoryToPDF function:', typeof exportSecondaryInventoryToPDF);
  
  // Check all tab panes
  const allTabs = document.querySelectorAll('.tab-pane');
  console.log('All tab panes:', allTabs);
  
  // Check secondary inventory tabs specifically
  const secondaryWeighableTab = document.getElementById('secondaryWeighable');
  const secondaryUnitTab = document.getElementById('secondaryUnit');
  console.log('Secondary weighable tab:', secondaryWeighableTab);
  console.log('Secondary unit tab:', secondaryUnitTab);
  
  // Check which tabs are active
  allTabs.forEach(tab => {
    console.log(`Tab ${tab.id}: active=${tab.classList.contains('active')}, show=${tab.classList.contains('show')}`);
  });
  
  // Check if data is available
  console.log('weighableItemsCache:', weighableItemsCache);
  console.log('unitItemsCache:', unitItemsCache);
  console.log('secondaryWeighableAdjustmentsCache:', secondaryWeighableAdjustmentsCache);
  console.log('secondaryUnitAdjustmentsCache:', secondaryUnitAdjustmentsCache);
  
  // Try to call the export function
  try {
    exportSecondaryInventoryToPDF();
  } catch (error) {
    console.error('Error calling exportSecondaryInventoryToPDF:', error);
  }
}

// Add event listeners for export buttons
document.addEventListener('DOMContentLoaded', function() {
  const exportInventoryBtn = document.getElementById('exportInventoryBtn');
  const exportSecondaryInventoryBtn = document.getElementById('exportSecondaryInventoryBtn');
  
  if (exportInventoryBtn) {
    exportInventoryBtn.addEventListener('click', exportInventoryToPDF);
  }
  
  if (exportSecondaryInventoryBtn) {
    exportSecondaryInventoryBtn.addEventListener('click', exportSecondaryInventoryToPDF);
  }
});