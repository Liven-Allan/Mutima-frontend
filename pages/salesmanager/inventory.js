 document.addEventListener('DOMContentLoaded', function () {
      // --- CATEGORY DROPDOWN LOGIC ---
      const categorySelect = document.getElementById('addItemCategory');
      async function fetchAndPopulateCategories() {
        try {
          const response = await fetch(API_BASE_URL + '/api/categories');
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

        fetch(API_BASE_URL + '/api/items', {
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
        items.forEach(item => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${item.name || ''}</td>
            <td>${item.total_quantity !== undefined ? item.total_quantity : ''}</td>
            <td>${item.base_unit || ''}</td>
            <td>${item.selling_price_per_unit || ''}</td>
            <td>${item.purchase_price_per_package || ''}</td>
            <td>
              ${item.minimum_stock > 0
                ? '<span class="badge badge-sm bg-gradient-success">In Stock</span>'
                : '<span class="badge badge-sm bg-gradient-warning">Low Stock</span>'}
            </td>
          `;
          tbody.appendChild(tr);
        });
      }

      // --- PAGINATION FOR WEIGHABLE GOODS ---
      const weighableRecordsPerPage = 4;
      let weighableCurrentPage = 1;
      let weighableTotalPages = 1;
      let weighableItemsCache = [];

      function renderWeighableItemsTable(items) {
        const tbody = document.getElementById('weighableItemsTableBody');
        tbody.innerHTML = '';
        items.forEach(item => {
          let statusHtml = '';
          if (item.total_quantity === 0) {
            statusHtml = '<span class="badge badge-sm bg-gradient-danger">Out of Stock</span>';
          } else if (item.total_quantity <= item.minimum_stock) {
            statusHtml = '<span class="badge badge-sm bg-gradient-warning">Low Stock</span>';
          } else {
            statusHtml = '<span class="badge badge-sm bg-gradient-success">In Stock</span>';
          }
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${item.name || ''}</td>
            <td>${item.total_quantity !== undefined ? item.total_quantity : ''}</td>
            <td>${item.base_unit || ''}</td>
            <td>${item.selling_price_per_unit || ''}</td>
            <td>${item.purchase_price_per_package || ''}</td>
            <td>${statusHtml}</td>
            <td><button class="btn btn-sm btn-outline-primary update-item-btn" data-id="${item._id}">Update</button></td>
          `;
          tbody.appendChild(tr);
        });
      }
      function updateWeighablePaginationInfo(start, end, total) {
        document.getElementById('weighableShowingText').innerText = `Showing ${start} to ${end} of ${total} items`;
      }
      function updateWeighablePaginationControls() {
        document.getElementById('weighablePrevPage').disabled = weighableCurrentPage <= 1;
        document.getElementById('weighableNextPage').disabled = weighableCurrentPage >= weighableTotalPages;
        document.getElementById('weighableCurrentPageInfo').innerText = `Page ${weighableCurrentPage} of ${weighableTotalPages}`;
      }
      function showWeighablePage(page) {
        weighableCurrentPage = page;
        const total = weighableItemsCache.length;
        weighableTotalPages = Math.ceil(total / weighableRecordsPerPage) || 1;
        const startIdx = (weighableCurrentPage - 1) * weighableRecordsPerPage;
        const endIdx = Math.min(startIdx + weighableRecordsPerPage, total);
        renderWeighableItemsTable(weighableItemsCache.slice(startIdx, endIdx));
        updateWeighablePaginationInfo(startIdx + 1, endIdx, total);
        updateWeighablePaginationControls();
      }
      document.getElementById('weighablePrevPage').addEventListener('click', function() {
        if (weighableCurrentPage > 1) showWeighablePage(weighableCurrentPage - 1);
      });
      document.getElementById('weighableNextPage').addEventListener('click', function() {
        if (weighableCurrentPage < weighableTotalPages) showWeighablePage(weighableCurrentPage + 1);
      });

      // --- PAGINATION FOR UNIT-BASED GOODS ---
      const unitRecordsPerPage = 4;
      let unitCurrentPage = 1;
      let unitTotalPages = 1;
      let unitItemsCache = [];

      function renderUnitItemsTable(items) {
        const tbody = document.getElementById('unitItemsTableBody');
        tbody.innerHTML = '';
        items.forEach(item => {
          let statusHtml = '';
          if (item.total_quantity === 0) {
            statusHtml = '<span class="badge badge-sm bg-gradient-danger">Out of Stock</span>';
          } else if (item.total_quantity <= item.minimum_stock) {
            statusHtml = '<span class="badge badge-sm bg-gradient-warning">Low Stock</span>';
          } else {
            statusHtml = '<span class="badge badge-sm bg-gradient-success">In Stock</span>';
          }
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${item.name || ''}</td>
            <td>${item.total_quantity !== undefined ? item.total_quantity : ''}</td>
            <td>${item.base_unit || ''}</td>
            <td>${item.selling_price_per_unit || ''}</td>
            <td>${item.purchase_price_per_package || ''}</td>
            <td>${statusHtml}</td>
            <td><button class="btn btn-sm btn-outline-primary update-item-btn" data-id="${item._id}">Update</button></td>
          `;
          tbody.appendChild(tr);
        });
      }
      function updateUnitPaginationInfo(start, end, total) {
        document.getElementById('unitShowingText').innerText = `Showing ${start} to ${end} of ${total} items`;
      }
      function updateUnitPaginationControls() {
        document.getElementById('unitPrevPage').disabled = unitCurrentPage <= 1;
        document.getElementById('unitNextPage').disabled = unitCurrentPage >= unitTotalPages;
        document.getElementById('unitCurrentPageInfo').innerText = `Page ${unitCurrentPage} of ${unitTotalPages}`;
      }
      function showUnitPage(page) {
        unitCurrentPage = page;
        const total = unitItemsCache.length;
        unitTotalPages = Math.ceil(total / unitRecordsPerPage) || 1;
        const startIdx = (unitCurrentPage - 1) * unitRecordsPerPage;
        const endIdx = Math.min(startIdx + unitRecordsPerPage, total);
        renderUnitItemsTable(unitItemsCache.slice(startIdx, endIdx));
        updateUnitPaginationInfo(startIdx + 1, endIdx, total);
        updateUnitPaginationControls();
      }
      document.getElementById('unitPrevPage').addEventListener('click', function() {
        if (unitCurrentPage > 1) showUnitPage(unitCurrentPage - 1);
      });
      document.getElementById('unitNextPage').addEventListener('click', function() {
        if (unitCurrentPage < unitTotalPages) showUnitPage(unitCurrentPage + 1);
      });

      // --- FETCH AND DISPLAY ITEMS WITH PAGINATION ---
      async function fetchAndDisplayItems(itemType, tableBodyId) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/items?item_type=${itemType}`);
          const items = await response.json();
          if (itemType === 'weighable') {
            weighableItemsCache = items;
            weighableCurrentPage = 1;
            showWeighablePage(1);
          } else if (itemType === 'unit_based') {
            unitItemsCache = items;
            unitCurrentPage = 1;
            showUnitPage(1);
          }
        } catch (error) {
          console.error('Error fetching items:', error);
        }
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

      // --- COMMODITY REQUESTS LOGIC ---
      function formatProductType(type) {
        if (type === 'weight_based') return 'Weight Based';
        if (type === 'unit_based') return 'Unit Based';
        return 'Other';
      }
      function formatStatus(status) {
        if (!status) return '';
        return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      const requestsPerPage = 4;
      let currentPage = 1;
      let allRequestsCache = [];
      let totalRequests = 0;
      let totalPages = 1;

      function renderCommodityRequestsTable(requests) {
        const tbody = document.getElementById('commodityRequestsTableBody');
        tbody.innerHTML = '';
        if (requests.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No requests found</td></tr>`;
          updateRequestPaginationInfo(0, 0, 0);
          updateRequestPaginationControls();
          return;
        }
        requests.forEach(req => {
          const date = req.requested_date ? new Date(req.requested_date).toISOString().split('T')[0] : '';
          const commodity = req.commodity_name || '';
          const type = formatProductType(req.product_type);
          const customer = req.customer_id && req.customer_id.name ? req.customer_id.name : '';
          const contact = req.customer_contact || '';
          const status = req.status ? `<span class="badge bg-info">${formatStatus(req.status)}</span>` : '';
          const actionBtn = `<button class="btn btn-sm btn-outline-primary update-status-btn" data-id="${req._id}" data-status="${req.status}">Update</button>`;
          const row = `
            <tr>
              <td>${date}</td>
              <td>${commodity}</td>
              <td>${type}</td>
              <td>
                ${customer}
                ${contact ? `<br><span class='text-xs text-secondary'>${contact}</span>` : ''}
              </td>
              <td>${status}</td>
              <td>${actionBtn}</td>
            </tr>
          `;
          tbody.insertAdjacentHTML('beforeend', row);
        });
        // Add event listeners for update buttons
        document.querySelectorAll('.update-status-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const requestId = this.getAttribute('data-id');
            const currentStatus = this.getAttribute('data-status');
            document.getElementById('updateRequestId').value = requestId;
            document.getElementById('updateRequestStatus').value = currentStatus;
            const modal = new bootstrap.Modal(document.getElementById('updateRequestStatusModal'));
            modal.show();
          });
        });
        updateRequestPaginationInfo(
          (currentPage - 1) * requestsPerPage + 1,
          Math.min(currentPage * requestsPerPage, totalRequests),
          totalRequests
        );
        updateRequestPaginationControls();
      }

      function updateRequestPaginationInfo(start, end, total) {
        document.getElementById('requestShowingText').innerText = `Showing ${start} to ${end} of ${total} requests`;
      }
      function updateRequestPaginationControls() {
        document.getElementById('requestPrevPage').disabled = currentPage <= 1;
        document.getElementById('requestNextPage').disabled = currentPage >= totalPages;
        document.getElementById('requestCurrentPageInfo').innerText = `Page ${currentPage} of ${totalPages}`;
      }
      document.getElementById('requestPrevPage').addEventListener('click', function() {
        if (currentPage > 1) {
          currentPage--;
          renderCommodityRequestsTable(allRequestsCache.slice((currentPage-1)*requestsPerPage, currentPage*requestsPerPage));
        }
      });
      document.getElementById('requestNextPage').addEventListener('click', function() {
        if (currentPage < totalPages) {
          currentPage++;
          renderCommodityRequestsTable(allRequestsCache.slice((currentPage-1)*requestsPerPage, currentPage*requestsPerPage));
        }
      });

      async function fetchAndDisplayCommodityRequests() {
        try {
          const response = await fetch(API_BASE_URL + '/api/commodity-requests?page=1&limit=10000');
          const data = await response.json();
          allRequestsCache = data.requests || [];
          totalRequests = allRequestsCache.length;
          totalPages = Math.ceil(totalRequests / requestsPerPage);
          currentPage = 1;
          renderCommodityRequestsTable(allRequestsCache.slice(0, requestsPerPage));
        } catch (error) {
          console.error('Error fetching commodity requests:', error);
        }
      }
      // Add event listener for Commodity Requests tab
      const requestsTab = document.querySelector('[href="#requests"]');
      if (requestsTab) {
        requestsTab.addEventListener('click', function() {
          fetchAndDisplayCommodityRequests();
        });
      }

      // --- REQUEST STATISTICS (STATUS SUMMARY) ---
      async function loadCommodityRequestStatusSummary() {
        try {
          const response = await fetch(API_BASE_URL + '/api/commodity-requests/status-summary');
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

      // --- TOP REQUESTED ITEMS ---
      async function loadTopRequestedItems() {
        try {
          const response = await fetch(API_BASE_URL + '/api/commodity-requests/top-items');
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

      loadCommodityRequestStatusSummary();
      loadTopRequestedItems();

      // --- UPDATE REQUEST STATUS MODAL ---
      const updateRequestStatusModal = new bootstrap.Modal(document.getElementById('updateRequestStatusModal'));

      const saveRequestStatusBtn = document.getElementById('saveRequestStatusBtn');
      saveRequestStatusBtn.addEventListener('click', async function() {
        const requestId = document.getElementById('updateRequestId').value;
        const newStatus = document.getElementById('updateRequestStatus').value;
        try {
          const response = await fetch(API_BASE_URL + `/api/commodity-requests/${requestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          if (response.ok) {
            // Hide modal and refresh data
            const modal = bootstrap.Modal.getInstance(document.getElementById('updateRequestStatusModal'));
            if (modal) modal.hide();
            await fetchAndDisplayCommodityRequests();
          } else {
            alert('Failed to update status');
          }
        } catch (err) {
          alert('Error updating status');
        }
      });

      // --- SEARCH FUNCTIONALITY ---
      const inventorySearchInput = document.getElementById('inventorySearchInput');
      const commodityRequestSearchInput = document.getElementById('commodityRequestSearchInput');

      if (inventorySearchInput) {
        inventorySearchInput.addEventListener('input', function () {
          const query = inventorySearchInput.value.trim().toLowerCase();
          // Determine which tab is active
          const activeTab = document.querySelector('.tab-pane.active');
          if (activeTab && activeTab.id === 'weighable') {
            let filtered = weighableItemsCache.slice();
            if (query) {
              filtered = weighableItemsCache.filter(item => (item.name || '').toLowerCase().includes(query));
              // Move matches to top, keep others below
              filtered = filtered.concat(weighableItemsCache.filter(item => !(item.name || '').toLowerCase().includes(query)));
              // Remove duplicates
              filtered = filtered.filter((item, idx, arr) => arr.findIndex(i => i._id === item._id) === idx);
            }
            weighableCurrentPage = 1;
            renderWeighableItemsTable(filtered.slice(0, weighableRecordsPerPage));
            updateWeighablePaginationInfo(1, Math.min(weighableRecordsPerPage, filtered.length), filtered.length);
            weighableTotalPages = Math.ceil(filtered.length / weighableRecordsPerPage) || 1;
            updateWeighablePaginationControls();
            // Store filtered for pagination
            weighableItemsCacheFiltered = filtered;
          } else if (activeTab && activeTab.id === 'unit') {
            let filtered = unitItemsCache.slice();
            if (query) {
              filtered = unitItemsCache.filter(item => (item.name || '').toLowerCase().includes(query));
              filtered = filtered.concat(unitItemsCache.filter(item => !(item.name || '').toLowerCase().includes(query)));
              filtered = filtered.filter((item, idx, arr) => arr.findIndex(i => i._id === item._id) === idx);
            }
            unitCurrentPage = 1;
            renderUnitItemsTable(filtered.slice(0, unitRecordsPerPage));
            updateUnitPaginationInfo(1, Math.min(unitRecordsPerPage, filtered.length), filtered.length);
            unitTotalPages = Math.ceil(filtered.length / unitRecordsPerPage) || 1;
            updateUnitPaginationControls();
            unitItemsCacheFiltered = filtered;
          }
        });
      }

      if (commodityRequestSearchInput) {
        commodityRequestSearchInput.addEventListener('input', function () {
          const query = commodityRequestSearchInput.value.trim().toLowerCase();
          let matches = [];
          let nonMatches = [];
          if (query) {
            matches = allRequestsCache.filter(req => (req.commodity_name || '').toLowerCase().includes(query));
            nonMatches = allRequestsCache.filter(req => !(req.commodity_name || '').toLowerCase().includes(query));
          } else {
            matches = allRequestsCache.slice();
            nonMatches = [];
          }
          // Combine matches and non-matches, remove duplicates
          const filtered = matches.concat(nonMatches).filter((req, idx, arr) => arr.findIndex(i => i._id === req._id) === idx);
          currentPage = 1;
          allRequestsCacheFiltered = filtered;
          totalPages = Math.ceil(filtered.length / requestsPerPage) || 1;
          renderCommodityRequestsTable(filtered.slice(0, requestsPerPage));
          updateRequestPaginationInfo(1, Math.min(requestsPerPage, filtered.length), filtered.length);
          updateRequestPaginationControls();
        });
      }

      // Update pagination to use filtered cache if present
      let weighableItemsCacheFiltered = null;
      let unitItemsCacheFiltered = null;
      let allRequestsCacheFiltered = null;

      // Patch pagination functions to use filtered cache
      function showWeighablePage(page) {
        weighableCurrentPage = page;
        const cache = weighableItemsCacheFiltered || weighableItemsCache;
        const total = cache.length;
        weighableTotalPages = Math.ceil(total / weighableRecordsPerPage) || 1;
        const startIdx = (weighableCurrentPage - 1) * weighableRecordsPerPage;
        const endIdx = Math.min(startIdx + weighableRecordsPerPage, total);
        renderWeighableItemsTable(cache.slice(startIdx, endIdx));
        updateWeighablePaginationInfo(startIdx + 1, endIdx, total);
        updateWeighablePaginationControls();
      }
      function showUnitPage(page) {
        unitCurrentPage = page;
        const cache = unitItemsCacheFiltered || unitItemsCache;
        const total = cache.length;
        unitTotalPages = Math.ceil(total / unitRecordsPerPage) || 1;
        const startIdx = (unitCurrentPage - 1) * unitRecordsPerPage;
        const endIdx = Math.min(startIdx + unitRecordsPerPage, total);
        renderUnitItemsTable(cache.slice(startIdx, endIdx));
        updateUnitPaginationInfo(startIdx + 1, endIdx, total);
        updateUnitPaginationControls();
      }
      function renderCommodityRequestsTable(requests) {
        const cache = allRequestsCacheFiltered || allRequestsCache;
        const tbody = document.getElementById('commodityRequestsTableBody');
        tbody.innerHTML = '';
        if (cache.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No requests found</td></tr>`;
          updateRequestPaginationInfo(0, 0, 0);
          updateRequestPaginationControls();
          return;
        }
        requests.forEach(req => {
          const date = req.requested_date ? new Date(req.requested_date).toISOString().split('T')[0] : '';
          const commodity = req.commodity_name || '';
          const type = formatProductType(req.product_type);
          const customer = req.customer_id && req.customer_id.name ? req.customer_id.name : '';
          const contact = req.customer_contact || '';
          const status = req.status ? `<span class="badge bg-info">${formatStatus(req.status)}</span>` : '';
          const actionBtn = `<button class="btn btn-sm btn-outline-primary update-status-btn" data-id="${req._id}" data-status="${req.status}">Update</button>`;
          const row = `
            <tr>
              <td>${date}</td>
              <td>${commodity}</td>
              <td>${type}</td>
              <td>
                ${customer}
                ${contact ? `<br><span class='text-xs text-secondary'>${contact}</span>` : ''}
              </td>
              <td>${status}</td>
              <td>${actionBtn}</td>
            </tr>
          `;
          tbody.insertAdjacentHTML('beforeend', row);
        });
        // Add event listeners for update buttons
        document.querySelectorAll('.update-status-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const requestId = this.getAttribute('data-id');
            const currentStatus = this.getAttribute('data-status');
            document.getElementById('updateRequestId').value = requestId;
            document.getElementById('updateRequestStatus').value = currentStatus;
            const modal = new bootstrap.Modal(document.getElementById('updateRequestStatusModal'));
            modal.show();
          });
        });
        updateRequestPaginationInfo(
          (currentPage - 1) * requestsPerPage + 1,
          Math.min(currentPage * requestsPerPage, cache.length),
          cache.length
        );
        updateRequestPaginationControls();
      }

      // --- UPDATE ITEM LOGIC (replicated from salesperson) ---
      let originalUpdateItemValues = {};

      function onUpdateItem(itemId) {
        fetch(API_BASE_URL + `/api/items/${itemId}`)
          .then(response => response.json())
          .then(item => {
            document.getElementById('updateItemName').value = item.name || '';
            fetch(API_BASE_URL + '/api/categories')
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
            document.getElementById('updateSupplierName').value = item.supplier_id && typeof item.supplier_id === 'object' ? (item.supplier_id.name || '') : '';
            document.getElementById('updateSupplierContact').value = item.supplier_id && typeof item.supplier_id === 'object' ? (item.supplier_id.contact_info || '') : '';
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

      // Attach input listeners for auto-calculation
      ['updateWeighableWeightPerPackage', 'updateWeighableInitialPackages', 'updateItemPurchasePrice', 'updateItemSellingPrice', 'updateUnitUnitsPerPackage', 'updateUnitInitialPackages'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', updateCalculateTotals);
        }
      });

      // Handle update item form submit
      const updateItemForm = document.getElementById('updateItemForm');
      updateItemForm && updateItemForm.addEventListener('submit', function(event) {
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
        fetch(API_BASE_URL + `/api/items/${itemId}`, {
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

      // Attach event listeners to update buttons in the tables
      function attachUpdateItemListeners() {
        document.querySelectorAll('.update-item-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            onUpdateItem(itemId);
          });
        });
      }
      // Call this after rendering tables
      // After rendering weighable and unit tables, call attachUpdateItemListeners();
      const oldRenderWeighableItemsTable = renderWeighableItemsTable;
      renderWeighableItemsTable = function(items) {
        oldRenderWeighableItemsTable(items);
        attachUpdateItemListeners();
      };
      const oldRenderUnitItemsTable = renderUnitItemsTable;
      renderUnitItemsTable = function(items) {
        oldRenderUnitItemsTable(items);
        attachUpdateItemListeners();
      };


    });