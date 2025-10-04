document.addEventListener('DOMContentLoaded', function () {
  // --- GLOBAL VARIABLES ---
  let lostItemsData = [];
  let filteredLostItemsData = [];
  let currentPage = 1;
  const itemsPerPage = 4;
  let allItems = []; // Store all items for reference
  let selectedMonth = new Date().getMonth();
  let selectedYear = new Date().getFullYear();
  let isCustomMonthSelected = false;

  // --- INITIALIZATION ---
  initializePage();

  // --- MAIN FUNCTIONS ---
  async function initializePage() {
    await fetchAndDisplayLostItems();
    await loadStatistics();
    await populateItemSelect();
    setupEventListeners();
  }

  async function fetchAndDisplayLostItems() {
    try {
      const response = await fetch(API_BASE_URL + '/api/item-losses');
      if (!response.ok) throw new Error('Failed to fetch lost items');
      
      const data = await response.json();
      console.log('Fetched lost items data:', data);
      lostItemsData = data.losses || [];
      console.log('Processed lost items data:', lostItemsData);
      filteredLostItemsData = [...lostItemsData];
      
      renderLostItemsTable();
      updatePagination();
    } catch (error) {
      console.error('Error fetching lost items:', error);
      showError('Failed to load lost items');
    }
  }

  function renderLostItemsTable() {
    const tableBody = document.getElementById('lostItemsTableBody');
    if (!tableBody) return;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = filteredLostItemsData.slice(startIndex, endIndex);

    if (pageItems.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-secondary">No lost items found</td></tr>';
      return;
    }

    tableBody.innerHTML = pageItems.map(item => {
      const lossDate = new Date(item.loss_date).toLocaleDateString();
      const statusBadge = getStatusBadge(item.status);
      const reasonBadge = getReasonBadge(item.loss_reason);
      const totalValue = (item.quantity_lost * item.estimated_cost).toFixed(2);
      
      return `
        <tr>
          <td>
            <div class="d-flex px-2 py-1">
              <div class="d-flex flex-column justify-content-center">
                <h6 class="mb-0 text-sm">${item.item_name || 'Unknown Item'}</h6>
              </div>
            </div>
          </td>
          <td>
            <p class="text-xs font-weight-bold mb-0">${lossDate}</p>
          </td>
          <td>
            <p class="text-xs font-weight-bold mb-0">${item.quantity_lost} ${item.unit_of_measure}</p>
          </td>
          <td>
            ${reasonBadge}
          </td>
          <td>
            ${statusBadge}
          </td>
          <td>
            <p class="text-xs font-weight-bold mb-0">shs: ${totalValue}</p>
          </td>
          <td>
            <p class="text-xs font-weight-bold mb-0">${item.reported_by || 'System'}</p>
          </td>
          <td>
            <button class="btn btn-link text-danger mb-0 delete-loss-btn" 
                    data-id="${item._id}" 
                    data-name="${item.item_name}" 
                    data-quantity="${item.quantity_lost}" 
                    data-unit="${item.unit_of_measure}" 
                    title="Delete">
              <i class="fas fa-trash text-xs"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function getStatusBadge(status) {
    const statusConfig = {
      'pending': { class: 'bg-warning', text: 'Pending' },
      'investigated': { class: 'bg-info', text: 'Investigated' },
      'resolved': { class: 'bg-success', text: 'Resolved' },
      'written_off': { class: 'bg-danger', text: 'Written Off' }
    };
    
    const config = statusConfig[status] || { class: 'bg-secondary', text: status };
    return `<span class="badge badge-sm ${config.class}">${config.text}</span>`;
  }

  function getReasonBadge(reason) {
    const reasonConfig = {
      'damage': { class: 'bg-danger', text: 'Damage' },
      'expiration': { class: 'bg-warning', text: 'Expired' },
      'spoilage': { class: 'bg-danger', text: 'Spoiled' },
      'breakage': { class: 'bg-danger', text: 'Broken' },
      'theft': { class: 'bg-dark', text: 'Theft' },
      'fire': { class: 'bg-danger', text: 'Fire' },
      'flood': { class: 'bg-info', text: 'Flood' },
      'pest_damage': { class: 'bg-warning', text: 'Pest Damage' },
      'poor_storage': { class: 'bg-warning', text: 'Poor Storage' },
      'manufacturing_defect': { class: 'bg-secondary', text: 'Defect' },
      'other': { class: 'bg-secondary', text: 'Other' }
    };
    
    const config = reasonConfig[reason] || { class: 'bg-secondary', text: reason };
    return `<span class="badge badge-sm ${config.class}">${config.text}</span>`;
  }

  function updatePagination() {
    const totalItems = filteredLostItemsData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Update showing text
    const showingText = document.getElementById('lostItemsShowingText');
    if (showingText) {
      showingText.textContent = `Showing ${startItem} to ${endItem} of ${totalItems} items`;
    }

    // Update page info
    const pageInfo = document.getElementById('lostItemsCurrentPageInfo');
    if (pageInfo) {
      pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    // Update pagination buttons
    const prevBtn = document.getElementById('lostItemsPrevPage');
    const nextBtn = document.getElementById('lostItemsNextPage');
    
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
  }

  async function loadStatistics() {
    try {
      // Calculate statistics from the data
      const totalLosses = lostItemsData.length;
      const totalValue = lostItemsData.reduce((sum, item) => sum + (item.quantity_lost * item.estimated_cost), 0);
      
      // Calculate this month's losses
      const monthToUse = isCustomMonthSelected ? selectedMonth : new Date().getMonth();
      const yearToUse = isCustomMonthSelected ? selectedYear : new Date().getFullYear();
      
      // Update the "This Month" title with current month and year
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const currentMonthName = monthNames[monthToUse];
      const thisMonthTitle = document.getElementById('thisMonthTitle');
      if (thisMonthTitle) {
        thisMonthTitle.textContent = `${currentMonthName} ${yearToUse}`;
      }
      
      // Update the description text
      const thisMonthDescription = document.getElementById('thisMonthDescription');
      if (thisMonthDescription) {
        thisMonthDescription.innerHTML = `<i class="fas fa-calendar-check"></i> ${currentMonthName} ${yearToUse} losses`;
      }
      
      console.log('Selected month/year:', monthToUse, yearToUse);
      console.log('Total lost items data:', lostItemsData.length);
      
      const thisMonthLosses = lostItemsData.filter(item => {
        // Handle both string and Date object formats
        let itemDate;
        if (typeof item.loss_date === 'string') {
          itemDate = new Date(item.loss_date);
        } else if (item.loss_date instanceof Date) {
          itemDate = item.loss_date;
        } else {
          // If it's a timestamp or other format, try to create a Date
          itemDate = new Date(item.loss_date);
        }
        
        // Check if the date is valid
        if (isNaN(itemDate.getTime())) {
          console.log('Invalid date for item:', item);
          return false;
        }
        
        const itemMonth = itemDate.getMonth();
        const itemYear = itemDate.getFullYear();
        
        console.log('Item date:', itemDate, 'Month:', itemMonth, 'Year:', itemYear, 'Item:', item.item_name);
        
        return itemMonth === monthToUse && itemYear === yearToUse;
      });
      
      console.log('This month losses count:', thisMonthLosses.length);
      
      const thisMonthValue = thisMonthLosses.reduce((sum, item) => {
        const itemValue = (item.quantity_lost || 0) * (item.estimated_cost || 0);
        console.log('Item value calculation:', item.item_name, 'Quantity:', item.quantity_lost, 'Cost:', item.estimated_cost, 'Value:', itemValue);
        return sum + itemValue;
      }, 0);

      console.log('This month value:', thisMonthValue);

      // Update statistics display
      document.getElementById('totalLossesCount').textContent = totalLosses;
      document.getElementById('totalValueLost').textContent = `shs: ${totalValue.toFixed(2)}`;
      document.getElementById('thisMonthLosses').textContent = `shs: ${(thisMonthValue || 0).toFixed(2)}`;
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  async function populateItemSelect() {
    try {
      const response = await fetch(API_BASE_URL + '/api/items');
      if (!response.ok) throw new Error('Failed to fetch items');
      
      const items = await response.json();
      allItems = items; // Store all items
      const itemSelect = document.getElementById('lossItemSelect');
      
      itemSelect.innerHTML = '<option value="">Select an item...</option>';
      
      if (!items || items.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No items available';
        option.disabled = true;
        itemSelect.appendChild(option);
        return;
      }
      
      items.forEach(item => {
        const option = document.createElement('option');
        option.value = item._id;
        const itemType = item.item_type === 'weighable' ? 'Weighable' : 'Unit-based';
        const unit = item.item_type === 'weighable' ? item.base_unit : 'pcs';
        const stock = item.total_quantity || 0;
        const stockStatus = stock <= (item.minimum_stock || 0) ? 'LOW STOCK' : 'In Stock';
        const stockColor = stock <= (item.minimum_stock || 0) ? 'text-danger' : 'text-success';
        option.textContent = `${item.name} - ${itemType} (${unit}) - Stock: ${stock} ${unit} [${stockStatus}]`;
        itemSelect.appendChild(option);
      });

      // Add event listener to populate estimated cost
      itemSelect.addEventListener('change', async function() {
        const selectedItemId = this.value;
        if (selectedItemId) {
          const selectedItem = allItems.find(item => item._id === selectedItemId);
          if (selectedItem) {
            // Use selling price per unit as default estimated cost
            document.getElementById('lossEstimatedCost').value = selectedItem.selling_price_per_unit || 0;
            
            // Store selected item for validation
            itemSelect.selectedItem = selectedItem;
            
            // Add validation to quantity input
            const quantityInput = document.getElementById('lossQuantity');
            quantityInput.max = selectedItem.total_quantity;
            quantityInput.placeholder = `Max: ${selectedItem.total_quantity} ${selectedItem.base_unit}`;
            
            // Add validation event listener
            quantityInput.addEventListener('input', function() {
              const quantity = parseFloat(this.value);
              const maxQuantity = selectedItem.total_quantity;
              
              if (quantity > maxQuantity) {
                this.setCustomValidity(`Cannot lose more than ${maxQuantity} ${selectedItem.base_unit}`);
                this.classList.add('is-invalid');
              } else {
                this.setCustomValidity('');
                this.classList.remove('is-invalid');
              }
            });
          } else {
            document.getElementById('lossEstimatedCost').value = '';
          }
        } else {
          document.getElementById('lossEstimatedCost').value = '';
          document.getElementById('lossQuantity').max = '';
          document.getElementById('lossQuantity').placeholder = 'Enter quantity lost';
        }
      });
    } catch (error) {
      console.error('Error populating item select:', error);
    }
  }

  // Function to refresh item data and update dropdown
  async function refreshItemData() {
    try {
      const response = await fetch(API_BASE_URL + '/api/items');
      if (!response.ok) throw new Error('Failed to fetch updated items');
      
      const items = await response.json();
      allItems = items; // Update the stored items with fresh data
      
      // Update the dropdown with fresh data
      await populateItemSelect();
      
      console.log('Item data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing item data:', error);
    }
  }

  function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('lossSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', handleSearch);
    }

    // Filter functionality
    const reasonFilter = document.getElementById('lossReasonFilter');
    const statusFilter = document.getElementById('lossStatusFilter');
    if (reasonFilter) reasonFilter.addEventListener('change', handleFilter);
    if (statusFilter) statusFilter.addEventListener('change', handleFilter);

    // Clear filters
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', clearFilters);
    }

    // Pagination
    const prevBtn = document.getElementById('lostItemsPrevPage');
    const nextBtn = document.getElementById('lostItemsNextPage');
    if (prevBtn) prevBtn.addEventListener('click', () => changePage(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changePage(1));

    // Add loss record
    const saveLossBtn = document.getElementById('saveLossRecordBtn');
    if (saveLossBtn) {
      saveLossBtn.addEventListener('click', saveLossRecord);
    }

    // Confirm delete loss record
    const confirmDeleteBtn = document.getElementById('confirmDeleteLossBtn');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', confirmDeleteLossRecord);
    }

    // Add event delegation for delete buttons (since they're dynamically created)
    document.addEventListener('click', function(e) {
      if (e.target.closest('.delete-loss-btn')) {
        const button = e.target.closest('.delete-loss-btn');
        const itemId = button.getAttribute('data-id');
        const itemName = button.getAttribute('data-name');
        const quantity = button.getAttribute('data-quantity');
        const unit = button.getAttribute('data-unit');
        
        deleteLostItem(itemId, itemName, quantity, unit);
      }
    });

    // Month/Year selection functionality
    const thisMonthTitle = document.getElementById('thisMonthTitle');
    if (thisMonthTitle) {
      thisMonthTitle.addEventListener('click', function() {
        populateMonthYearDropdown();
        const modal = new bootstrap.Modal(document.getElementById('monthYearSelectionModal'));
        modal.show();
      });
    }
    
    // Apply month/year selection
    const applyMonthYearSelection = document.getElementById('applyMonthYearSelection');
    if (applyMonthYearSelection) {
      applyMonthYearSelection.addEventListener('click', function() {
        const select = document.getElementById('monthYearSelect');
        if (select && select.value) {
          const [year, month] = select.value.split('-').map(Number);
          selectedMonth = month;
          selectedYear = year;
          isCustomMonthSelected = true;
          
          // Update statistics with new selection
          loadStatistics();
          
          // Close modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('monthYearSelectionModal'));
          if (modal) {
            modal.hide();
          }
          
          // Show feedback with month name
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          
          // Check if the selected month has data
          const hasData = lostItemsData.some(item => {
            let itemDate;
            if (typeof item.loss_date === 'string') {
              itemDate = new Date(item.loss_date);
            } else if (item.loss_date instanceof Date) {
              itemDate = item.loss_date;
            } else {
              itemDate = new Date(item.loss_date);
            }
            
            if (!isNaN(itemDate.getTime())) {
              return itemDate.getMonth() === month && itemDate.getFullYear() === year;
            }
            return false;
          });
          
          const dataStatus = hasData ? 'with data' : 'no data available';
          showSuccess(`Viewing losses for ${monthNames[month]} ${year} (${dataStatus})`);
        }
      });
    }
    
    // Reset to current month when clicking outside or canceling
    const monthYearModal = document.getElementById('monthYearSelectionModal');
    if (monthYearModal) {
      monthYearModal.addEventListener('hidden.bs.modal', function() {
        // Reset to current month if no custom selection was made
        if (!isCustomMonthSelected) {
          const now = new Date();
          selectedMonth = now.getMonth();
          selectedYear = now.getFullYear();
          loadStatistics();
        }
      });
    }
    
    // Reset to current month button
    const resetToCurrentMonth = document.getElementById('resetToCurrentMonth');
    if (resetToCurrentMonth) {
      resetToCurrentMonth.addEventListener('click', function() {
        const now = new Date();
        selectedMonth = now.getMonth();
        selectedYear = now.getFullYear();
        isCustomMonthSelected = false;
        
        // Update statistics
        loadStatistics();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('monthYearSelectionModal'));
        if (modal) {
          modal.hide();
        }
        
        // Show feedback
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        showSuccess(`Reset to current month: ${monthNames[now.getMonth()]} ${now.getFullYear()}`);
      });
    }

    // Refresh item data when modal is opened
    const addLossModal = document.getElementById('addLossRecordModal');
    if (addLossModal) {
      addLossModal.addEventListener('show.bs.modal', async function() {
        await refreshItemData();
      });
    }
  }

  function handleSearch() {
    const searchTerm = document.getElementById('lossSearchInput').value.toLowerCase();
    filterItems(searchTerm);
  }

  function handleFilter() {
    const reasonFilter = document.getElementById('lossReasonFilter').value;
    const statusFilter = document.getElementById('lossStatusFilter').value;
    filterItems(null, reasonFilter, statusFilter);
  }

  function filterItems(searchTerm = null, reasonFilter = null, statusFilter = null) {
    filteredLostItemsData = lostItemsData.filter(item => {
      let matches = true;

      // Search filter
      if (searchTerm) {
        const itemName = (item.item_name || '').toLowerCase();
        const description = (item.loss_description || '').toLowerCase();
        matches = matches && (itemName.includes(searchTerm) || description.includes(searchTerm));
      }

      // Reason filter
      if (reasonFilter && reasonFilter !== '') {
        matches = matches && item.loss_reason === reasonFilter;
      }

      // Status filter
      if (statusFilter && statusFilter !== '') {
        matches = matches && item.status === statusFilter;
      }

      return matches;
    });

    currentPage = 1;
    renderLostItemsTable();
    updatePagination();
  }

  function clearFilters() {
    document.getElementById('lossSearchInput').value = '';
    document.getElementById('lossReasonFilter').value = '';
    document.getElementById('lossStatusFilter').value = '';
    
    filteredLostItemsData = [...lostItemsData];
    currentPage = 1;
    renderLostItemsTable();
    updatePagination();
  }

  function changePage(delta) {
    const totalPages = Math.ceil(filteredLostItemsData.length / itemsPerPage);
    const newPage = currentPage + delta;
    
    if (newPage >= 1 && newPage <= totalPages) {
      currentPage = newPage;
      renderLostItemsTable();
      updatePagination();
    }
  }

  async function saveLossRecord() {
    const form = document.getElementById('addLossRecordForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const selectedItemId = document.getElementById('lossItemSelect').value;
    const selectedItem = allItems.find(item => item._id === selectedItemId);
    
    if (!selectedItem) {
      showError('Please select a valid item');
      return;
    }

    // Validate quantity against available stock
    const quantityLost = parseFloat(document.getElementById('lossQuantity').value);
    if (quantityLost > selectedItem.total_quantity) {
      showError(`Cannot lose ${quantityLost} ${selectedItem.base_unit} when only ${selectedItem.total_quantity} are available`);
      return;
    }

    if (quantityLost <= 0) {
      showError('Quantity lost must be greater than 0');
      return;
    }

    const formData = {
      item_id: document.getElementById('lossItemSelect').value,
      quantity_lost: quantityLost,
      loss_reason: document.getElementById('lossReason').value,
      loss_description: document.getElementById('lossDescription').value,
      estimated_cost: parseFloat(document.getElementById('lossEstimatedCost').value),
      unit_of_measure: selectedItem.base_unit || 'pcs'
    };

    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(API_BASE_URL + '/api/item-losses', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save loss record');
      }

      const result = await response.json();
      const newStock = selectedItem.total_quantity - quantityLost;
      showSuccess(`Loss record saved successfully! Stock updated: ${selectedItem.total_quantity} → ${newStock} ${selectedItem.base_unit}`);
      
      // Reset form and close modal
      form.reset();
      const modal = bootstrap.Modal.getInstance(document.getElementById('addLossRecordModal'));
      if (modal) modal.hide();
      
      // Refresh data
      await fetchAndDisplayLostItems();
      await loadStatistics();
      await refreshItemData(); // Refresh item data to update dropdown with new stock levels
    } catch (error) {
      console.error('Error saving loss record:', error);
      showError(error.message || 'Failed to save loss record');
    }
  }

  async function confirmDeleteLossRecord() {
    if (!window.itemToDelete) {
      showError('No item selected for deletion');
      return;
    }

    const { id, name, quantity, unit } = window.itemToDelete;

    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(API_BASE_URL + `/api/item-losses/${id}`, {
        method: 'DELETE',
        headers: headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete loss record');
      }

      const result = await response.json();
      showSuccess(`Loss record for ${name} deleted successfully! ${quantity} ${unit} restored to stock.`);
      
      // Close the modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('deleteLossRecordModal'));
      if (modal) modal.hide();
      
      // Clear the stored item
      window.itemToDelete = null;
      
      // Refresh data
      await fetchAndDisplayLostItems();
      await loadStatistics();
      await refreshItemData(); // Refresh item data to update dropdown with new stock levels
    } catch (error) {
      console.error('Error deleting loss record:', error);
      showError(error.message || 'Failed to delete loss record');
    }
  }

  // --- UTILITY FUNCTIONS ---
  function showSuccess(message) {
    // You can implement a toast notification here
    alert(message);
  }

  function showError(message) {
    // You can implement a toast notification here
    alert('Error: ' + message);
  }

  // --- GLOBAL FUNCTIONS (for onclick handlers) ---
  window.deleteLostItem = function(itemId, itemName, quantityLost, unitOfMeasure) {
    // Store the item details for deletion
    window.itemToDelete = {
      id: itemId,
      name: itemName,
      quantity: quantityLost,
      unit: unitOfMeasure
    };
    
    // Populate the modal with item details
    const deleteDetails = document.getElementById('deleteLossDetails');
    deleteDetails.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <strong>Item:</strong> ${itemName}
        </div>
        <div class="col-md-6">
          <strong>Quantity Lost:</strong> ${quantityLost} ${unitOfMeasure}
        </div>
      </div>
      <div class="row mt-2">
        <div class="col-12">
          <strong>Action:</strong> This will restore ${quantityLost} ${unitOfMeasure} back to the item's stock.
        </div>
      </div>
    `;
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('deleteLossRecordModal'));
    modal.show();
  };

  // --- HELPER FUNCTIONS ---
  
  // Populate month/year dropdown with available data
  function populateMonthYearDropdown() {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const select = document.getElementById('monthYearSelect');
    if (!select) return;
    
    // Clear existing options
    select.innerHTML = '';
    
    // Get unique month/year combinations from data
    const uniqueMonths = new Set();
    const monthsWithData = new Set();
    lostItemsData.forEach(item => {
      let itemDate;
      if (typeof item.loss_date === 'string') {
        itemDate = new Date(item.loss_date);
      } else if (item.loss_date instanceof Date) {
        itemDate = item.loss_date;
      } else {
        itemDate = new Date(item.loss_date);
      }
      
      if (!isNaN(itemDate.getTime())) {
        const month = itemDate.getMonth();
        const year = itemDate.getFullYear();
        uniqueMonths.add(`${year}-${month}`);
        monthsWithData.add(`${year}-${month}`);
      }
    });
    
    // Add current month to the set
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    uniqueMonths.add(`${currentYear}-${currentMonth}`);
    
    // Convert to array and sort
    const sortedMonths = Array.from(uniqueMonths).sort((a, b) => {
      const [yearA, monthA] = a.split('-').map(Number);
      const [yearB, monthB] = b.split('-').map(Number);
      return yearA === yearB ? monthB - monthA : yearB - yearA; // Sort in descending order (newest first)
    });
    
    // Create options
    sortedMonths.forEach(monthKey => {
      const [year, month] = monthKey.split('-').map(Number);
      const option = document.createElement('option');
      option.value = monthKey;
      
      // Add visual indicators
      const isCurrentMonth = (month === currentMonth && year === currentYear);
      const hasData = monthsWithData.has(monthKey);
      
      if (isCurrentMonth && hasData) {
        option.textContent = `${monthNames[month]} ${year} (Current Month - Has Data)`;
      } else if (isCurrentMonth) {
        option.textContent = `${monthNames[month]} ${year} (Current Month)`;
      } else if (hasData) {
        option.textContent = `${monthNames[month]} ${year} (Has Data)`;
      } else {
        option.textContent = `${monthNames[month]} ${year}`;
      }
      
      // Mark current month as selected by default
      if (month === selectedMonth && year === selectedYear) {
        option.selected = true;
      }
      
      select.appendChild(option);
    });
    
    // If no options were created, add current month as fallback
    if (sortedMonths.length === 0) {
      const option = document.createElement('option');
      option.value = `${currentYear}-${currentMonth}`;
      option.textContent = `${monthNames[currentMonth]} ${currentYear} (Current Month)`;
      option.selected = true;
      select.appendChild(option);
    }
  }
  
  // Get status badge HTML
}); 