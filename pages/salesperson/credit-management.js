// JavaScript for Credit Sale Modal
// Global variables for credit sale modal
    let creditItemCount = 0;
    let selectedCreditCustomer = null;
    let selectedCreditItem = null;

    // Customer dropdown functions
    function showCreditCustomerDropdown() {
      const container = document.getElementById('creditCustomerDropdownContainer');
      if (container) {
        container.style.display = 'block';
        console.log('Customer dropdown shown');
      } else {
        console.error('Customer dropdown container not found');
      }
    }

    function hideCreditCustomerDropdown() {
      setTimeout(() => {
        const container = document.getElementById('creditCustomerDropdownContainer');
        if (container) {
          container.style.display = 'none';
          console.log('Customer dropdown hidden');
        }
      }, 150);
    }

    function filterCreditCustomers() {
      const searchInput = document.getElementById('creditCustomerSearch');
      const container = document.getElementById('creditCustomerDropdownContainer');
      const searchTerm = searchInput.value.toLowerCase();
      
      console.log('Filtering customers with term:', searchTerm);
      
      if (container) {
        const items = container.querySelectorAll('.dropdown-item');
        let hasVisibleItems = false;
        
        items.forEach(item => {
          const itemText = item.textContent.toLowerCase();
          if (itemText.includes(searchTerm)) {
            item.style.display = 'block';
            hasVisibleItems = true;
          } else {
            item.style.display = 'none';
          }
        });
        
        if (searchTerm.length > 0 && hasVisibleItems) {
          container.style.display = 'block';
        } else if (searchTerm.length === 0) {
          items.forEach(item => item.style.display = 'block');
          container.style.display = 'block';
        } else {
          container.style.display = 'none';
        }
        
        console.log('Customers filtered, visible items:', hasVisibleItems);
      } else {
        console.error('Customer dropdown container not found during filtering');
      }
    }

    function selectCreditCustomer(name, email, contact) {
      const searchInput = document.getElementById('creditCustomerSearch');
      const container = document.getElementById('creditCustomerDropdownContainer');
      const detailsDiv = document.getElementById('selectedCustomerDetails');
      
      // Set the input value
      searchInput.value = name;
      
      // Hide dropdown
      container.style.display = 'none';
      
      // Store selected customer
      selectedCreditCustomer = { name, email, contact };
      
      // Show customer details
      document.getElementById('customerName').textContent = name;
      document.getElementById('customerContact').textContent = contact;
      detailsDiv.style.display = 'block';
    }

    function createNewCreditCustomer() {
      const customerName = prompt('Enter customer name:');
      if (customerName) {
        const customerEmail = prompt('Enter customer email:');
        if (customerEmail) {
          const customerContact = prompt('Enter customer contact (phone):');
          if (customerContact) {
            selectCreditCustomer(customerName, customerEmail, customerContact);
            alert('New customer created: ' + customerName);
          }
        }
      }
    }

    // Item dropdown functions
    function showCreditItemDropdown() {
      const container = document.getElementById('creditItemDropdownContainer');
      if (container) {
        container.style.display = 'block';
        console.log('Item dropdown shown');
      } else {
        console.error('Item dropdown container not found');
      }
    }

    function hideCreditItemDropdown() {
      setTimeout(() => {
        const container = document.getElementById('creditItemDropdownContainer');
        if (container) {
          container.style.display = 'none';
          console.log('Item dropdown hidden');
        }
      }, 150);
    }

    function filterCreditItems() {
      const searchInput = document.getElementById('creditItemSearch');
      const container = document.getElementById('creditItemDropdownContainer');
      const searchTerm = searchInput.value.toLowerCase();
      
      console.log('Filtering items with term:', searchTerm);
      
      if (container) {
        const items = container.querySelectorAll('.dropdown-item');
        let hasVisibleItems = false;
        
        items.forEach(item => {
          const itemText = item.textContent.toLowerCase();
          if (itemText.includes(searchTerm)) {
            item.style.display = 'block';
            hasVisibleItems = true;
          } else {
            item.style.display = 'none';
          }
        });
        
        if (searchTerm.length > 0 && hasVisibleItems) {
          container.style.display = 'block';
        } else if (searchTerm.length === 0) {
          items.forEach(item => item.style.display = 'block');
          container.style.display = 'block';
        } else {
          container.style.display = 'none';
        }
        
        console.log('Items filtered, visible items:', hasVisibleItems);
      } else {
        console.error('Item dropdown container not found during filtering');
      }
    }

    function selectCreditItem(itemName, unitPrice, stockLevel, unit) {
      console.log('Selecting item:', itemName, 'Price:', unitPrice, 'Stock:', stockLevel, 'Unit:', unit);
      
      selectedCreditItem = { itemName, unitPrice, stockLevel, unit };
      document.getElementById('creditItemSearch').value = itemName;
      document.getElementById('creditItemDropdownContainer').style.display = 'none';
      
      console.log('Item selected:', selectedCreditItem);
    }

    function addCreditItem() {
      if (!selectedCreditItem) {
        alert('Please select an item first');
        return;
      }
      
      creditItemCount++;
      const tbody = document.getElementById('creditItemsTableBody');
      const newRow = document.createElement('tr');
      newRow.id = 'creditItemRow' + creditItemCount;
      
      newRow.innerHTML = `
        <td>
          <div class="d-flex flex-column justify-content-center">
            <h6 class="mb-0 text-sm">${selectedCreditItem.itemName}</h6>
            <p class="text-xs text-secondary mb-0">${selectedCreditItem.stockLevel} ${selectedCreditItem.unit} available</p>
          </div>
        </td>
        <td>
          <p class="text-xs font-weight-bold mb-0">${selectedCreditItem.stockLevel} ${selectedCreditItem.unit}</p>
        </td>
        <td class="align-middle text-center">
          <span class="text-xs font-weight-bold">shs:${selectedCreditItem.unitPrice.toFixed(2)}</span>
        </td>
        <td class="align-middle text-center">
          <input type="number" class="form-control form-control-sm" 
                 id="creditQuantity${creditItemCount}" 
                 value="1" 
                 min="1" 
                 max="${selectedCreditItem.stockLevel}"
                 onchange="calculateCreditItemTotal(${creditItemCount})" 
                 onkeyup="calculateCreditItemTotal(${creditItemCount})"
                 style="width: 80px;">
        </td>
        <td class="align-middle text-center">
          <span class="text-xs font-weight-bold" id="creditItemTotal${creditItemCount}">shs:${selectedCreditItem.unitPrice.toFixed(2)}</span>
        </td>
        <td class="align-middle text-center">
          <button class="btn btn-link text-danger mb-0" onclick="removeCreditItem(${creditItemCount})">
            <i class="fas fa-trash text-xs"></i>
          </button>
        </td>
      `;
      
      tbody.appendChild(newRow);
      calculateCreditTotalAmount();
      
      // Reset selected item
      selectedCreditItem = null;
      document.getElementById('creditItemSearch').value = '';
    }

    function calculateCreditItemTotal(rowId) {
      const quantity = parseFloat(document.getElementById('creditQuantity' + rowId).value) || 0;
      const unitPrice = parseFloat(document.querySelector(`#creditItemRow${rowId} td:nth-child(3) span`).textContent.replace('$', '')) || 0;
      const total = quantity * unitPrice;
      
      document.getElementById('creditItemTotal' + rowId).textContent = '$' + total.toFixed(2);
      calculateCreditTotalAmount();
    }

    function calculateCreditTotalAmount() {
      let total = 0;
      const totalElements = document.querySelectorAll('[id^="creditItemTotal"]');
      
      totalElements.forEach(element => {
        total += parseFloat(element.textContent.replace('$', '')) || 0;
      });
      
      document.getElementById('creditTotalAmount').value = total.toFixed(2);
      calculateRemainingBalance();
    }

    function removeCreditItem(rowId) {
      const row = document.getElementById('creditItemRow' + rowId);
      if (row) {
        row.remove();
        calculateCreditTotalAmount();
      }
    }

    // Transaction details functions
    function calculateRepaymentDate() {
      const creditTerms = parseInt(document.getElementById('creditTerms')?.value) || 30;
      const today = new Date();
      const repaymentDate = new Date(today.getTime() + (creditTerms * 24 * 60 * 60 * 1000));
      const year = repaymentDate.getFullYear();
      const month = String(repaymentDate.getMonth() + 1).padStart(2, '0');
      const day = String(repaymentDate.getDate()).padStart(2, '0');
      const input = document.getElementById('creditRepaymentDate');
      if (input) input.value = `${year}-${month}-${day}`;
    }

    // Payment method functions
    function togglePartialPayment() {
      const checkbox = document.getElementById('enablePartialPayment');
      const section = document.getElementById('partialPaymentSection');
      
      if (checkbox.checked) {
        section.style.display = 'block';
        calculateRemainingBalance();
      } else {
        section.style.display = 'none';
        document.getElementById('partialPaymentAmount').value = '';
        document.getElementById('remainingBalance').value = '0.00';
      }
    }

    function calculateRemainingBalance() {
      const totalAmountInput = document.getElementById('creditTotalAmount');
      const partialAmountInput = document.getElementById('partialPaymentAmount');
      const remainingInput = document.getElementById('remainingBalance');
      if (!totalAmountInput || !partialAmountInput || !remainingInput) return;
      const totalAmount = parseFloat(totalAmountInput.value) || 0;
      const partialAmount = parseFloat(partialAmountInput.value) || 0;
      const remaining = totalAmount - partialAmount;
      remainingInput.value = remaining.toFixed(2);
    }

    // Main credit sale function
    async function createCreditSale() {
      // 1. Collect customer
      let customerId = null;
      let customerType = 'credit';
      let customerName = '';
      const customerSelect = document.getElementById('creditCustomerType');
      if (selectedCreditCustomer && selectedCreditCustomer.id) {
        customerId = selectedCreditCustomer.id;
        customerName = selectedCreditCustomer.name;
      } else if (customerSelect && customerSelect.value && customerSelect.value !== 'new') {
        customerId = customerSelect.value;
        customerName = customerSelect.options[customerSelect.selectedIndex].textContent;
      } else if (selectedCreditCustomer && selectedCreditCustomer.name) {
        customerName = selectedCreditCustomer.name;
        alert('Creating new customers inline is not yet implemented. Please select an existing customer.');
        return;
      } else {
        alert('Please select a customer');
        return;
      }

      // 2. Collect items
      const items = getCreditSaleItems();
      if (items.length === 0) {
        alert('Please add at least one item to the credit sale');
        return;
      }

      // 3. Collect transaction details
      const totalAmount = parseFloat(document.getElementById('creditTotalAmount').value) || 0;
      const grandTotal = totalAmount; // No extra charges/discounts for now
      const agreedRepaymentDate = document.getElementById('creditRepaymentDate')?.value;
      const remarks = document.getElementById('creditRemarks').value;
      const saleDate = new Date().toISOString();

      // 4. Prepare payload
      const saleData = {
        customer_id: customerId,
        customer_type: customerType,
        total_amount: totalAmount,
        grand_total: grandTotal,
        status: 'pending', // Set to 'pending' for new credit sales
        payment_status: 'unpaid',
        date: saleDate,
        items: items.map(item => ({
          item_id: item.item_id,
          quantity: item.quantity, // Use 'quantity' instead of 'quantity_sold'
          unit_price: item.unit_price,
          total_price: item.total, // Backend expects 'total_price'
          discount: item.discount || 0
        })),
        credit: {
          agreed_repayment_date: agreedRepaymentDate,
          remarks: remarks
        }
      };

      try {
        const response = await fetch(API_BASE_URL + '/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saleData)
        });
        if (!response.ok) {
          const error = await response.json();
          alert('Error saving credit sale: ' + (error.details || error.error || 'Unknown error'));
          return;
        }
        const result = await response.json();
        const sale = result.sale;
        // Now create the CreditTransaction
        const creditTransactionData = {
          customer_id: sale.customer_id?._id || sale.customer_id, // handle populated or raw id
          sale_id: sale._id,
          transaction_date: sale.date,
          total_amount: sale.total_amount,
          payment_status: 'pending',
          agreed_repayment_date: saleData.credit.agreed_repayment_date,
          remarks: saleData.credit.remarks
        };
        const creditRes = await fetch(API_BASE_URL + '/api/credit-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(creditTransactionData)
        });
        if (!creditRes.ok) {
          const error = await creditRes.json();
          alert('Credit sale saved, but failed to create credit transaction: ' + (error.details || error.error || 'Unknown error'));
          return;
        }
        
        const creditResult = await creditRes.json();
        console.log('Credit transaction created successfully:', creditResult);
        
        // Success!
        alert('Credit sale and credit transaction created successfully! Invoice: ' + (sale?.invoice_number || 'N/A'));
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createCreditSaleModal'));
        modal.hide();
        // Reset form
        resetCreditSaleForm();
        // Reload the Customer Credit Accounts table so the new record appears immediately
        console.log('Calling refreshCreditAccounts to update the table...');
        refreshCreditAccounts();
        return; // Prevent further execution and double popup
      } catch (error) {
        alert('Error saving credit sale. Please try again.');
        console.error(error);
      }
    }

    function getCreditSaleItems() {
      const items = [];
      const rows = document.querySelectorAll('#creditItemsTableBody tr');
      rows.forEach(row => {
        const itemSelect = row.querySelector('.credit-item-select');
        const qtyInput = row.querySelector('.credit-item-qty');
        const unitPriceInput = row.querySelector('.credit-item-unit-price');
        const discountInput = row.querySelector('.credit-item-discount');
        const totalInput = row.querySelector('.credit-item-total');
        if (itemSelect && itemSelect.value && qtyInput && qtyInput.value) {
          const selectedOption = itemSelect.options[itemSelect.selectedIndex];
          items.push({
            item_id: itemSelect.value,
            item_name: selectedOption.textContent,
            quantity: parseFloat(qtyInput.value) || 0,
            unit_price: parseFloat(unitPriceInput.value) || 0,
            discount: parseFloat(discountInput.value) || 0,
            total: parseFloat(totalInput.value) || 0
          });
        }
      });
      return items;
    }

    function resetCreditSaleForm() {
      // Reset customer
      selectedCreditCustomer = null;
      if (document.getElementById('creditCustomerSearch')) document.getElementById('creditCustomerSearch').value = '';
      if (document.getElementById('selectedCustomerDetails')) document.getElementById('selectedCustomerDetails').style.display = 'none';
      
      // Reset items
      selectedCreditItem = null;
      if (document.getElementById('creditItemSearch')) document.getElementById('creditItemSearch').value = '';
      if (document.getElementById('creditItemsTableBody')) document.getElementById('creditItemsTableBody').innerHTML = '';
      creditItemCount = 0;
      
      // Reset transaction details
      if (document.getElementById('creditTotalAmount')) document.getElementById('creditTotalAmount').value = '0.00';
      if (document.getElementById('creditTerms')) document.getElementById('creditTerms').value = '30';
      if (document.getElementById('creditRepaymentDate')) document.getElementById('creditRepaymentDate').value = '';
      
      // Reset payment method
      if (document.getElementById('mobileMoney')) document.getElementById('mobileMoney').checked = true;
      if (document.getElementById('enablePartialPayment')) document.getElementById('enablePartialPayment').checked = false;
      if (document.getElementById('partialPaymentSection')) document.getElementById('partialPaymentSection').style.display = 'none';
      if (document.getElementById('partialPaymentAmount')) document.getElementById('partialPaymentAmount').value = '';
      if (document.getElementById('remainingBalance')) document.getElementById('remainingBalance').value = '0.00';
      
      // Calculate initial repayment date
      if (typeof calculateRepaymentDate === 'function') calculateRepaymentDate();
    }

    // Initialize modal when opened
    document.addEventListener('DOMContentLoaded', function() {
      const modal = document.getElementById('createCreditSaleModal');
      if (modal) {
        modal.addEventListener('show.bs.modal', function() {
          calculateRepaymentDate();
        });
      }
    });

// JavaScript for Record Payment Modal
// Global variables for payment modal
    let selectedPaymentCustomer = null;
    let outstandingSortKey = 'date';
    let outstandingSortAsc = true;
    let selectedRows = new Set();
    let allCustomers = [];
    let customerCreditDetails = null;
    let customerDropdownLoading = false;
    let selectedOutstandingSaleIds = new Set(); // Global set to store selected sale ids
    let paymentMethods = [];

    // Fetch customers with credit when the modal opens or on search
    async function fetchCreditCustomers(searchTerm = '') {
      customerDropdownLoading = true;
      try {
        let url = API_BASE_URL + '/api/customers-with-credit';
        if (searchTerm) {
          url += `?search=${encodeURIComponent(searchTerm)}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch customers');
        allCustomers = await response.json();
        populateCustomerDropdown(allCustomers);
      } catch (error) {
        console.error('Error fetching customers:', error);
        populateCustomerDropdown([]);
      }
      customerDropdownLoading = false;
    }

    // Show dropdown and populate with all customers
    function showPaymentCustomerDropdown() {
      fetchCreditCustomers(document.getElementById('paymentCustomerSearch').value.trim());
      document.getElementById('paymentCustomerDropdownContainer').style.display = 'block';
    }

    // Hide dropdown
    function hidePaymentCustomerDropdown() {
      setTimeout(() => {
        if (!customerDropdownLoading) {
          document.getElementById('paymentCustomerDropdownContainer').style.display = 'none';
        }
      }, 150);
    }

    // Filter customers as you type
    function filterPaymentCustomers() {
      const search = document.getElementById('paymentCustomerSearch').value.trim();
      fetchCreditCustomers(search);
    }

    // Populate dropdown with customers
    function populateCustomerDropdown(customers) {
      const dropdownBody = document.querySelector('#paymentCustomerDropdownContainer .dropdown-body');
      dropdownBody.innerHTML = '';
      if (customers.length === 0) {
        dropdownBody.innerHTML = '<div class="dropdown-item p-2 text-muted">No customers found</div>';
        return;
      }
      customers.forEach(customer => {
        const displayText = `${customer.name} - ${customer.phone || customer.email || 'No contact'}`;
        const item = document.createElement('div');
        item.className = 'dropdown-item p-2';
        item.innerHTML = `<i class="fas fa-user me-2 text-primary"></i>${displayText}`;
        item.onclick = () => selectPaymentCustomer(customer);
        dropdownBody.appendChild(item);
      });
    }

    async function selectPaymentCustomer(customer) {
      try {
        document.getElementById('paymentCustomerSearch').value = customer.name;
        document.getElementById('paymentCustomerDropdownContainer').style.display = 'none';
        document.getElementById('selectedPaymentCustomerDetails').style.display = 'block';
        document.getElementById('paymentCustomerName').textContent = 'Loading...';
        document.getElementById('paymentCustomerContact').textContent = 'Loading...';
        // Fetch customer credit details from backend
        const response = await fetch(API_BASE_URL + `/api/customer-credit-details/${customer._id}`);
        if (!response.ok) throw new Error('Failed to fetch customer credit details');
        customerCreditDetails = await response.json();
        selectedPaymentCustomer = customer;
        document.getElementById('paymentCustomerName').textContent = customer.name;
        document.getElementById('paymentCustomerContact').textContent = customer.phone || customer.email || 'No contact';
        const summary = customerCreditDetails.credit_summary;
        document.getElementById('totalOrderBalance').value = `shs:${summary.total_order_balance.toFixed(2)}`;
        document.getElementById('creditTime').value = summary.credit_time;
        populateOutstandingCreditSalesTable();
      } catch (error) {
        console.error('Error fetching customer credit details:', error);
        alert('Error loading customer details. Please try again.');
        resetPaymentCustomerSelection();
      }
    }

    function resetPaymentCustomerSelection() {
      selectedPaymentCustomer = null;
      customerCreditDetails = null;
      document.getElementById('selectedPaymentCustomerDetails').style.display = 'none';
      document.getElementById('totalOrderBalance').value = 'shs:';
      document.getElementById('creditTime').value = '-';
      document.getElementById('outstandingCreditSalesTableBody').innerHTML = '';
      document.getElementById('totalSelectedAmount').textContent = 'shs:';
      selectedRows.clear();
    }

    // Outstanding credit sales table logic
    function populateOutstandingCreditSalesTable() {
      const tbody = document.getElementById('outstandingCreditSalesTableBody');
      tbody.innerHTML = '';
      selectedRows.clear();
      
      if (!customerCreditDetails || !customerCreditDetails.outstanding_sales) {
        return;
      }
      
      let sales = [...customerCreditDetails.outstanding_sales];
      
      // Sort
      sales.sort((a, b) => {
        let valA = a[outstandingSortKey], valB = b[outstandingSortKey];
        if (outstandingSortKey === 'date' || outstandingSortKey === 'due_date') {
          valA = new Date(valA); valB = new Date(valB);
        } else if (outstandingSortKey === 'total' || outstandingSortKey === 'due') {
          valA = outstandingSortKey === 'total' ? a.total_amount : a.amount_due;
          valB = outstandingSortKey === 'total' ? b.total_amount : b.amount_due;
        }
        return outstandingSortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
      
      sales.forEach((sale, idx) => {
        const rowId = `outstandingRow${idx}`;
        const statusClass = sale.status === 'overdue' ? 'text-danger' : 
                           sale.status === 'partially_paid' ? 'text-warning' : 'text-info';
        
        tbody.innerHTML += `
          <tr>
            <td>${sale.date}</td>
            <td>shs:${sale.total_amount.toFixed(2)}</td>
            <td class="${statusClass}">shs:${sale.amount_due.toFixed(2)}</td>
            <td class="text-center">
              <input type="checkbox" data-sale-id="${sale.id}" data-total-amount="${sale.total_amount}" onchange="updateTotalSelectedAmount()">
            </td>
          </tr>
        `;
      });
      
      updateOutstandingSummary();
    }

    function sortOutstandingTable(key) {
      if (outstandingSortKey === key) { 
        outstandingSortAsc = !outstandingSortAsc; 
      } else { 
        outstandingSortKey = key; 
        outstandingSortAsc = true; 
      }
      populateOutstandingCreditSalesTable();
    }

    function toggleOutstandingRow(rowId, due) {
      const cb = document.getElementById(rowId);
      if (cb.checked) {
        selectedRows.add(rowId);
      } else {
        selectedRows.delete(rowId);
      }
      updateOutstandingSummary();
    }

    function updateOutstandingSummary() {
      if (!customerCreditDetails || !customerCreditDetails.outstanding_sales) return;
      
      let total = 0;
      selectedRows.forEach(rowId => {
        const idx = parseInt(rowId.replace('outstandingRow', ''));
        total += customerCreditDetails.outstanding_sales[idx].amount_due;
      });
      
      document.getElementById('totalSelectedAmount').textContent = `shs:${total.toFixed(2)}`;
    }

    // Payment form logic with backend integration
    async function recordPayment() {
      try {
        // Validation
        if (!selectedPaymentCustomer) { 
          alert('Please select a customer.'); 
          return; 
        }
        if (!customerCreditDetails) {
          alert('Error: No customer credit details loaded. Please select a customer and wait for their details to load.');
          return;
        }
        
      const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
      const paymentMethod = document.getElementById('paymentMethodSelect').value;
      const paymentDate = document.getElementById('paymentDate').value;
      const remarks = document.getElementById('paymentRemarks').value;
        
      // Get selected sales
      const selectedSales = Array.from(selectedRows).map(rowId => {
        const idx = parseInt(rowId.replace('outstandingRow', ''));
          return customerCreditDetails.outstanding_sales[idx];
        });
        
        if (selectedSales.length === 0) { 
          alert('Please select at least one outstanding credit sale.'); 
          return; 
        }
        
        if (amountPaid <= 0) { 
          alert('Please enter a valid amount paid.'); 
          return; 
        }
        
        if (!paymentMethod) {
          alert('Please select a payment method.');
          return;
        }
        
        if (!paymentDate) { 
          alert('Please select a payment date.'); 
          return; 
        }
        
        // Calculate total selected amount
        const totalSelected = selectedSales.reduce((sum, sale) => sum + sale.amount_due, 0);
        
        if (amountPaid > totalSelected) {
          alert(`Amount paid (shs:${amountPaid.toFixed(2)}) cannot exceed total selected amount (shs:${totalSelected.toFixed(2)})`);
          return;
        }
        
        // Prepare payment data
        const paymentData = {
          customer_id: selectedPaymentCustomer._id,
          credit_transaction_ids: selectedSales.map(sale => sale.id),
          amount_paid: amountPaid,
          payment_method_id: paymentMethod,
          payment_date: paymentDate,
          remarks: remarks
        };
        
        console.log('Recording payment:', paymentData);
        
        // Send to backend
        const response = await fetch(API_BASE_URL + '/api/repayments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(paymentData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to record payment');
        }
        
        const result = await response.json();
        
        // Show success message
        alert(`Payment recorded successfully!\nAmount: shs:${amountPaid.toFixed(2)}\nRepayments created: ${result.repayments_count}`);
        
      // Reset modal
      resetRecordPaymentModal();
      const modal = bootstrap.Modal.getInstance(document.getElementById('recordPaymentModal'));
      modal.hide();
        
      } catch (error) {
        console.error('Error recording payment:', error);
        alert(`Error recording payment: ${error.message}`);
    }
    }

    function resetRecordPaymentModal() {
      // document.getElementById('paymentCustomerSearch').value = ''; // Removed because this element no longer exists
      resetPaymentCustomerSelection();
      document.getElementById('amountPaid').value = '';
      document.getElementById('paymentMethodSelect').value = '';
      document.getElementById('paymentDate').value = new Date().toISOString().slice(0,10);
      document.getElementById('paymentRemarks').value = '';
    }

    // Load payment methods from backend
    async function loadPaymentMethods() {
      try {
        const response = await fetch(API_BASE_URL + '/api/payment-methods');
        paymentMethods = await response.json();
        populatePaymentMethods();
        console.log('Payment methods loaded:', paymentMethods);
      } catch (error) {
        console.error('Error loading payment methods:', error);
      }
    }

    function populatePaymentMethods() {
      const select = document.getElementById('paymentMethodSelect');
      select.innerHTML = '<option value="">Select payment method</option>';
      paymentMethods.forEach(method => {
        const option = document.createElement('option');
        option.value = method._id;
        option.textContent = method.name;
        select.appendChild(option);
      });
    }

    // Set default payment date on modal show
    document.addEventListener('DOMContentLoaded', function() {
      const modal = document.getElementById('recordPaymentModal');
      if (modal) {
        modal.addEventListener('show.bs.modal', function() {
          resetRecordPaymentModal();
          document.getElementById('paymentDate').value = new Date().toISOString().slice(0,10);
          loadPaymentMethods(); // Load payment methods when modal opens
        });
      }
    });

    // 1. Replace the search input and dropdown in the Record Payment modal:
    // Find the section with id='paymentCustomerSearch' and replace with:
    // <select class="form-control" id="paymentCustomerSelect" onchange="onPaymentCustomerChange()">
    //   <option value="">Select customer...</option>
    // </select>





    // 4. Call loadPaymentCustomers() when the modal opens
    // In the DOMContentLoaded event for the Record Payment modal, add:
    // loadPaymentCustomers();

    // 5. Remove the old search/filter logic for this dropdown.

// JavaScript for View Accounts Modal
// Sample data for demonstration
    const viewAccountData = {
      customer: {
        name: 'John Doe',
        currentBalance: 2500.00,
        overdue: 500.00
      },
      transactions: [
        { date: '2024-03-01', total: 1000, paid: 500, status: 'Partial', dueDate: '2024-03-31' },
        { date: '2024-03-10', total: 2000, paid: 0, status: 'Unpaid', dueDate: '2024-04-10' },
        { date: '2024-02-15', total: 1500, paid: 1500, status: 'Paid', dueDate: '2024-03-15' },
        { date: '2024-01-20', total: 1800, paid: 1800, status: 'Paid', dueDate: '2024-02-20' },
        { date: '2024-03-12', total: 500, paid: 0, status: 'Overdue', dueDate: '2024-03-22' },
        { date: '2024-03-15', total: 700, paid: 0, status: 'Unpaid', dueDate: '2024-04-15' },
        { date: '2024-02-28', total: 1200, paid: 1000, status: 'Partial', dueDate: '2024-03-28' },
        { date: '2024-01-10', total: 900, paid: 900, status: 'Paid', dueDate: '2024-02-10' },
        { date: '2024-03-18', total: 600, paid: 0, status: 'Overdue', dueDate: '2024-03-25' },
        { date: '2024-03-20', total: 800, paid: 0, status: 'Unpaid', dueDate: '2024-04-20' },
      ],
      upcoming: [
        { amount: 2000, dueDate: '2024-04-10', status: 'Unpaid' },
        { amount: 700, dueDate: '2024-04-15', status: 'Unpaid' },
        { amount: 800, dueDate: '2024-04-20', status: 'Unpaid' },
      ],
      overdue: [
        { amount: 500, dueDate: '2024-03-22', overdueDays: 10, priority: 'High' },
        { amount: 600, dueDate: '2024-03-25', overdueDays: 7, priority: 'Medium' },
      ]
    };
    let accountSortKey = 'date';
    let accountSortAsc = true;
    let accountPage = 1;
    const accountPageSize = 5;

    function populateViewAccountsModal() {
      // Customer summary
      document.getElementById('viewAccountCustomerName').textContent = viewAccountData.customer.name;
      document.getElementById('viewAccountCurrentBalance').textContent = `shs:${viewAccountData.customer.currentBalance.toLocaleString(undefined, {minimumFractionDigits:2})}`;
      const overdueElem = document.getElementById('viewAccountOverdue');
      if (viewAccountData.customer.overdue > 0) {
        overdueElem.textContent = `Overdue: shs:${viewAccountData.customer.overdue.toLocaleString(undefined, {minimumFractionDigits:2})}`;
        overdueElem.classList.add('text-danger');
      } else {
        overdueElem.textContent = 'Overdue: shs:';
        overdueElem.classList.remove('text-danger');
      }
      // Transaction history
      populateAccountTransactionTable();
      // Repayment schedule
      populateRepaymentSchedule();
    }

    function populateAccountTransactionTable() {
      let txs = [...viewAccountData.transactions];
      // Sort
      txs.sort((a, b) => {
        let valA = a[accountSortKey], valB = b[accountSortKey];
        if (accountSortKey === 'date' || accountSortKey === 'dueDate') {
          valA = new Date(valA); valB = new Date(valB);
        } else if (accountSortKey === 'status') {
          valA = a.status.toLowerCase(); valB = b.status.toLowerCase();
        }
        return accountSortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
      // Pagination
      const start = (accountPage-1)*accountPageSize;
      const end = start+accountPageSize;
      const paged = txs.slice(start, end);
      const tbody = document.getElementById('viewAccountTransactionTableBody');
      tbody.innerHTML = '';
      paged.forEach((tx, idx) => {
        const statusClass = tx.status === 'Overdue' ? 'text-danger fw-bold' : (tx.status === 'Paid' ? 'text-success' : '');
        tbody.innerHTML += `
          <tr onclick="showTransactionDetail(${start+idx})">
            <td>${tx.date}</td>
            <td>shs:${tx.total.toFixed(2)}</td>
            <td>shs:${tx.paid.toFixed(2)}</td>
            <td class="${statusClass}">${tx.status}</td>
            <td>${tx.dueDate}</td>
          </tr>
        `;
      });
      populateAccountPagination(txs.length);
    }
    function sortAccountTable(key) {
      if (accountSortKey === key) { accountSortAsc = !accountSortAsc; }
      else { accountSortKey = key; accountSortAsc = true; }
      accountPage = 1;
      populateAccountTransactionTable();
    }
    function populateAccountPagination(total) {
      const ul = document.getElementById('viewAccountPagination');
      ul.innerHTML = '';
      const pages = Math.ceil(total/accountPageSize);
      for (let i=1; i<=pages; i++) {
        ul.innerHTML += `<li class="page-item${i===accountPage?' active':''}"><a class="page-link" href="#" onclick="gotoAccountPage(${i});return false;">${i}</a></li>`;
      }
    }
    function gotoAccountPage(page) {
      accountPage = page;
      populateAccountTransactionTable();
    }
    function showTransactionDetail(idx) {
      const tx = viewAccountData.transactions[idx];
      alert(`Transaction Detail\nDate: ${tx.date}\nTotal: shs:${tx.total.toFixed(2)}\nPaid: shs:${tx.paid.toFixed(2)}\nStatus: ${tx.status}\nDue Date: ${tx.dueDate}`);
    }
    function populateRepaymentSchedule() {
      // Upcoming
      const upcomingList = document.getElementById('upcomingDuePaymentsList');
      upcomingList.innerHTML = '';
      viewAccountData.upcoming.forEach(up => {
        upcomingList.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center">
          <span><i class="fas fa-arrow-circle-right text-success me-2"></i>Due: <strong>${up.dueDate}</strong></span>
          <span class="fw-bold">shs:${up.amount.toFixed(2)}</span>
          <span class="badge bg-secondary">${up.status}</span>
        </li>`;
      });
      // Overdue
      const overdueList = document.getElementById('pastOverduePaymentsList');
      overdueList.innerHTML = '';
      let totalOverdue = 0;
      viewAccountData.overdue.forEach(od => {
        totalOverdue += od.amount;
        overdueList.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center">
          <span><i class="fas fa-exclamation-circle text-danger me-2"></i>Due: <strong>${od.dueDate}</strong> <span class="overdue-priority ms-2">[${od.priority} Priority]</span></span>
          <span class="fw-bold text-danger">shs:${od.amount.toFixed(2)}</span>
          <span class="badge bg-danger">Overdue by ${od.overdueDays} days</span>
        </li>`;
      });
      document.getElementById('totalOverdueAmount').textContent = `shs:${totalOverdue.toFixed(2)}`;
    }
    // Reset modal on show
    document.addEventListener('DOMContentLoaded', function() {
      const modal = document.getElementById('viewAccountsModal');
      if (modal) {
        modal.addEventListener('show.bs.modal', function() {
          accountSortKey = 'date';
          accountSortAsc = true;
          accountPage = 1;
          populateViewAccountsModal();
        });
      }
    });

// JavaScript for Credit Sale Modal
 // --- Customer Dropdown Logic ---
    async function loadCreditCustomers() {
      const select = document.getElementById('creditCustomerType');
      // Remove all except the first two options
      while (select.options.length > 2) select.remove(2);
      try {
        const res = await fetch(API_BASE_URL + '/api/customers');
        const customers = await res.json();
        customers.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c._id;
          opt.textContent = c.name || c.gender || 'Unnamed';
          select.appendChild(opt);
        });
      } catch (e) { /* handle error */ }
    }
    document.getElementById('creditCustomerType').addEventListener('change', function() {
      const select = this;
      const value = select.value;
      if (value === 'new') {
        document.getElementById('creditCustomNameSection').style.display = 'block';
        selectedCreditCustomer = null;
      } else if (value) {
        // Find the selected option's text (customer name)
        const name = select.options[select.selectedIndex].textContent;
        selectedCreditCustomer = { name: name, id: value };
        document.getElementById('creditCustomNameSection').style.display = 'none';
      } else {
        selectedCreditCustomer = null;
        document.getElementById('creditCustomNameSection').style.display = 'none';
      }
    });
    document.getElementById('createCreditSaleModal').addEventListener('show.bs.modal', loadCreditCustomers);

    // --- Pagination Variables for Credit Accounts ---
    let creditAccounts = [];
    let creditCurrentPage = 1;
    const creditRecordsPerPage = 4;
    let creditTotalPages = 1;

    // --- Load Customer Credit Accounts ---
    async function loadCreditAccounts() {
      try {
        console.log('Fetching credit accounts...');
        const response = await fetch(API_BASE_URL + '/api/customer-credit-accounts');
        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
        }
        
        creditAccounts = JSON.parse(responseText);
        console.log('Parsed credit accounts:', creditAccounts);
        console.log('Number of credit accounts found:', creditAccounts.length);
        
        // Log each account for debugging
        creditAccounts.forEach((account, index) => {
          console.log(`Account ${index + 1}:`, {
            customer_name: account.customer_name,
            customer_id: account.customer_id,
            total_credit: account.total_credit,
            amount_paid: account.amount_paid,
            balance: account.balance,
            status: account.status,
            transaction_count: account.transaction_count
          });
        });
        
        displayCreditAccounts();
      } catch (error) {
        console.error('Error loading credit accounts:', error);
        console.error('Error details:', error.message);
        const tbody = document.getElementById('creditAccountsTableBody');
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-danger py-4">
              <i class="fas fa-exclamation-triangle me-2"></i>Error loading credit accounts: ${error.message}
            </td>
          </tr>
        `;
        updateCreditPaginationInfo(0, 0, 0);
      }
    }

    // Display credit accounts with pagination
    function displayCreditAccounts() {
      const tbody = document.getElementById('creditAccountsTableBody');
      tbody.innerHTML = '';
      
      if (creditAccounts.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-muted py-4">
              <i class="fas fa-info-circle me-2"></i>No credit accounts found
            </td>
          </tr>
        `;
        updateCreditPaginationInfo(0, 0, 0);
        return;
      }
      
      // Calculate pagination
      creditTotalPages = Math.ceil(creditAccounts.length / creditRecordsPerPage);
      const startIndex = (creditCurrentPage - 1) * creditRecordsPerPage;
      const endIndex = Math.min(startIndex + creditRecordsPerPage, creditAccounts.length);
      const currentPageAccounts = creditAccounts.slice(startIndex, endIndex);
      
      currentPageAccounts.forEach(account => {
        // Format last payment date
        let lastPaymentDate = 'No payments';
        if (account.last_payment_date) {
          const dateObj = new Date(account.last_payment_date);
          if (!isNaN(dateObj)) {
            lastPaymentDate = dateObj.toLocaleDateString();
          }
        }
        
        // Determine status badge class
        let statusClass = 'bg-gradient-secondary';
        if (account.status === 'Active') statusClass = 'bg-gradient-success';
        else if (account.status === 'Overdue') statusClass = 'bg-gradient-danger';
        else if (account.status === 'Paid') statusClass = 'bg-gradient-info';
        else if (account.status === 'Pending') statusClass = 'bg-gradient-warning';
        
        tbody.innerHTML += `
          <tr>
            <td>
              <div class="d-flex px-2 py-1">
                <div class="d-flex flex-column justify-content-center">
                  <h6 class="mb-0 text-sm">${account.customer_name}</h6>
                  <p class="text-xs text-secondary mb-0">${account.customer_phone || 'No phone'}</p>
                </div>
              </div>
            </td>
            <td>
              <p class="text-xs font-weight-bold mb-0">shs:${account.total_credit.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            </td>
            <td class="align-middle text-center text-sm">
              <span class="text-secondary text-xs font-weight-bold">shs:${account.amount_paid.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </td>
            <td class="align-middle text-center">
              <span class="text-secondary text-xs font-weight-bold">shs:${account.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </td>
            <td class="align-middle text-center">
              <span class="text-secondary text-xs font-weight-bold">${lastPaymentDate}</span>
            </td>
            <td class="align-middle text-center text-sm">
              <span class="badge badge-sm ${statusClass}">${account.status}</span>
            </td>
          </tr>
        `;
      });
      
      // Update pagination info and controls
      updateCreditPaginationInfo(startIndex + 1, endIndex, creditAccounts.length);
      updateCreditPaginationControls();
    }

    // Update pagination info
    function updateCreditPaginationInfo(startRecord, endRecord, totalRecords) {
      document.getElementById('creditStartRecord').innerText = startRecord;
      document.getElementById('creditEndRecord').innerText = endRecord;
      document.getElementById('creditTotalRecords').innerText = totalRecords;
    }

    // Update pagination controls
    function updateCreditPaginationControls() {
      const prevPage = document.getElementById('creditPrevPage');
      const nextPage = document.getElementById('creditNextPage');
      const currentPageInfo = document.getElementById('creditCurrentPageInfo');
      
      // Enable/disable previous button
      prevPage.disabled = creditCurrentPage <= 1;
      
      // Enable/disable next button
      nextPage.disabled = creditCurrentPage >= creditTotalPages;
      
      // Update page info text
      currentPageInfo.innerText = `Page ${creditCurrentPage} of ${creditTotalPages}`;
    }

    // Pagination navigation functions
    function creditPreviousPage() {
      if (creditCurrentPage > 1) {
        creditCurrentPage--;
        displayCreditAccounts();
      }
    }

    function creditNextPage() {
      if (creditCurrentPage < creditTotalPages) {
        creditCurrentPage++;
        displayCreditAccounts();
      }
    }

    // Refresh credit accounts (resets to page 1)
    function refreshCreditAccounts() {
      creditCurrentPage = 1;
      loadCreditAccounts();
    }

    // Debug function to check all credit transactions
    async function debugCreditTransactions() {
      try {
        console.log('Calling debug endpoint...');
        const response = await fetch(API_BASE_URL + '/api/debug/credit-transactions');
        const data = await response.json();
        
        console.log('Debug endpoint response:', data);
        console.log('Total transactions found:', data.total_count);
        
        if (data.transactions && data.transactions.length > 0) {
          console.log('All credit transactions:');
          data.transactions.forEach((tx, index) => {
            console.log(`Transaction ${index + 1}:`, {
              id: tx.id,
              customer: tx.customer_name,
              phone: tx.customer_phone,
              sale_invoice: tx.sale_invoice,
              total_amount: tx.total_amount,
              amount_paid: tx.amount_paid,
              payment_status: tx.payment_status,
              transaction_date: tx.transaction_date
            });
          });
        } else {
          console.log('No credit transactions found');
        }
        
        alert(`Debug complete! Found ${data.total_count} credit transactions. Check console for details.`);
      } catch (error) {
        console.error('Error calling debug endpoint:', error);
        alert('Error calling debug endpoint: ' + error.message);
      }
    }

    // Make debug function globally accessible
    window.debugCreditTransactions = debugCreditTransactions;

    // Function to view customer account details (placeholder)
    function viewCustomerAccount(customerId) {
      // This could open a modal with detailed account information
      alert(`Viewing account details for customer ID: ${customerId}`);
    }

    // Load credit accounts when page loads
    document.addEventListener('DOMContentLoaded', function() {
      loadCreditAccounts();
    });

    // --- Items Section Logic (copied/adapted from Add New Sale) ---

// Add JS for loading customers and handling select for Record Payment modal
async function loadCreditCustomersPayment() {
      const select = document.getElementById('creditCustomerTypePayment');
      if (!select) {
        console.error('Credit customer select element not found');
        return;
      }
      
      // Clear all options except the first one (placeholder)
      while (select.options.length > 1) {
        select.remove(1);
      }
      
      try {
        const res = await fetch(API_BASE_URL + '/api/customers-with-credit');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const customers = await res.json();
        console.log('Loaded customers for payment modal:', customers.length);
        
        // Use a Set to track added customer IDs to prevent duplicates
        const addedCustomerIds = new Set();
        
        customers.forEach(c => {
          // Skip if customer ID already added (prevent duplicates)
          if (addedCustomerIds.has(c._id)) {
            console.warn('Duplicate customer found:', c._id, c.name);
            return;
          }
          
          const opt = document.createElement('option');
          opt.value = c._id;
          opt.textContent = c.name || c.phone || c.email || 'Unnamed';
          select.appendChild(opt);
          addedCustomerIds.add(c._id);
        });
        
        console.log('Added customers to payment dropdown:', addedCustomerIds.size);
      } catch (e) {
        console.error('Error loading customers for payment modal:', e);
        // Add error option to dropdown
        const errorOpt = document.createElement('option');
        errorOpt.value = '';
        errorOpt.textContent = 'Error loading customers';
        errorOpt.disabled = true;
        select.appendChild(errorOpt);
      }
    }
    document.getElementById('recordPaymentModal').addEventListener('show.bs.modal', loadCreditCustomersPayment);

//  Add event listener for customer selection in Record Payment modal 
//   When a customer is selected, fetch and display their credit summary and outstanding sales
document.getElementById('creditCustomerTypePayment').addEventListener('change', async function() {
      const customerId = this.value;
      document.getElementById('recordPaymentBtn').disabled = true; // Disable while loading
      if (!customerId) {
        // Reset summary and table
        document.getElementById('totalOrderBalance').value = 'shs:';
        document.getElementById('creditTime').value = '-';
        document.getElementById('outstandingCreditSalesTableBody').innerHTML = '';
        selectedPaymentCustomer = null;
        customerCreditDetails = null;
        document.getElementById('recordPaymentBtn').disabled = true; // Keep disabled
        return;
      }
      try {
        const response = await fetch(API_BASE_URL + `/api/customer-credit-details/${customerId}`);
        if (!response.ok) throw new Error('Failed to fetch customer credit details');
        const data = await response.json();
        // Calculate total order balance as sum of all amount_due
        const totalOrderBalance = (data.outstanding_sales || []).reduce((sum, sale) => sum + (sale.amount_due || 0), 0);
        document.getElementById('totalOrderBalance').value = `shs:${totalOrderBalance.toFixed(2)}`;
        document.getElementById('creditTime').value = data.credit_summary.credit_time || '-';
        // Populate outstanding credit sales table
        const tbody = document.getElementById('outstandingCreditSalesTableBody');
        tbody.innerHTML = '';
        (data.outstanding_sales || []).forEach(sale => {
          tbody.innerHTML += `
            <tr>
              <td>${sale.date}</td>
              <td>shs:${sale.total_amount.toFixed(2)}</td>
              <td>shs:${sale.amount_due.toFixed(2)}</td>
              <td class="text-center"><input type="checkbox" data-sale-id="${sale.id}" data-amount-due="${sale.amount_due}" onchange="updateTotalSelectedAmount()"></td>
            </tr>
          `;
        });
        // Set selectedPaymentCustomer here:
        selectedPaymentCustomer = {
          _id: customerId,
          name: data.customer.name,
          phone: data.customer.phone,
          email: data.customer.email
        };
        customerCreditDetails = data; // Set details
        document.getElementById('recordPaymentBtn').disabled = false; // Enable after loading
        // Reset total selected
        document.getElementById('totalSelectedAmount').textContent = 'shs:';
      } catch (error) {
        document.getElementById('totalOrderBalance').value = 'shs:';
        document.getElementById('creditTime').value = '-';
        document.getElementById('outstandingCreditSalesTableBody').innerHTML = '<tr><td colspan="4" class="text-danger">Error loading credit details</td></tr>';
        selectedPaymentCustomer = null;
        customerCreditDetails = null;
        document.getElementById('recordPaymentBtn').disabled = true; // Keep disabled
      }
    }); 

// Update selected total amount
 function updateTotalSelectedAmount() {
      let total = 0;
      selectedOutstandingSaleIds.clear();
      selectedRows.clear();
      document.querySelectorAll('#outstandingCreditSalesTableBody input[type=checkbox]:checked').forEach((cb, idx) => {
        total += parseFloat(cb.getAttribute('data-amount-due')) || 0;
        const saleId = cb.getAttribute('data-sale-id');
        if (saleId) selectedOutstandingSaleIds.add(saleId);
        // Add the row index to selectedRows for recordPayment
        const row = cb.closest('tr');
        if (row) {
          const rowIndex = Array.from(row.parentNode.children).indexOf(row);
          selectedRows.add(`outstandingRow${rowIndex}`);
        }
      });
      document.getElementById('totalSelectedAmount').textContent = `shs:${total.toFixed(2)}`;
    }

// Add global creditItems array and loader
let creditItems = [];
    async function loadCreditItems() {
      try {
        const response = await fetch(API_BASE_URL + '/api/items');
        creditItems = await response.json();
        console.log('Credit items loaded:', creditItems);
      } catch (error) {
        console.error('Error loading credit items:', error);
        creditItems = [];
      }
    }

// Add addCreditItemRow function
function addCreditItemRow() {
      const tbody = document.getElementById('creditItemsTableBody');
      const rowId = 'creditItemRow_' + Date.now();
      const row = document.createElement('tr');
      row.id = rowId;
      row.innerHTML = `
        <td>
          <select class="form-control form-control-sm credit-item-select" onchange="onCreditItemSelect(this, '${rowId}')">
            <option value="">Select item</option>
            ${creditItems.map(item => `<option value="${item._id}" data-price="${item.selling_price_per_unit}">${item.name}</option>`).join('')}
          </select>
        </td>
        <td><input type="number" class="form-control form-control-sm credit-item-qty" min="1" value="1" style="width: 80px;" onchange="calculateCreditItemRowTotal('${rowId}')"></td>
        <td><input type="number" class="form-control form-control-sm credit-item-unit-price" min="0" step="0.01" value="0.00" style="width: 100px;" readonly></td>
        <td><input type="number" class="form-control form-control-sm credit-item-discount" min="0" step="0.01" value="0.00" style="width: 80px;" onchange="calculateCreditItemRowTotal('${rowId}')"></td>
        <td><input type="text" class="form-control form-control-sm credit-item-total" value="0.00" style="width: 100px;" readonly></td>
        <td><button type="button" class="btn btn-danger btn-sm" onclick="removeCreditItemRow(this)"><i class="fas fa-trash"></i></button></td>
      `;
      tbody.appendChild(row);
    }

// Add onCreditItemSelect and calculateCreditItemRowTotal
 function onCreditItemSelect(selectElement, rowId) {
      const selectedItemId = selectElement.value;
      const selectedItem = creditItems.find(item => item._id === selectedItemId);
      if (selectedItem) {
        const row = document.getElementById(rowId);
        const unitPriceInput = row.querySelector('.credit-item-unit-price');
        unitPriceInput.value = selectedItem.selling_price_per_unit.toFixed(2);
        calculateCreditItemRowTotal(rowId);
      }
    }
    function calculateCreditItemRowTotal(rowId) {
      const row = document.getElementById(rowId);
      const qtyInput = row.querySelector('.credit-item-qty');
      const unitPriceInput = row.querySelector('.credit-item-unit-price');
      const discountInput = row.querySelector('.credit-item-discount');
      const totalInput = row.querySelector('.credit-item-total');
      const qty = parseFloat(qtyInput.value) || 0;
      const price = parseFloat(unitPriceInput.value) || 0;
      const discount = parseFloat(discountInput.value) || 0;
      let total = qty * price - discount;
      if (total < 0) total = 0;
      totalInput.value = total.toFixed(2);
      calculateCreditTotalAmount();
    }
    function removeCreditItemRow(button) {
      button.closest('tr').remove();
      calculateCreditTotalAmount();
    }

// Update calculateCreditTotalAmount to sum new row totals
function calculateCreditTotalAmount() {
      let total = 0;
      const totalInputs = document.querySelectorAll('.credit-item-total');
      totalInputs.forEach(input => {
        total += parseFloat(input.value) || 0;
      });
      document.getElementById('creditTotalAmount').value = total.toFixed(2);
      calculateRemainingBalance && calculateRemainingBalance();
    }

// Update Add Item button to call addCreditItemRow
 function addCreditItem() {
      addCreditItemRow();
    }

//  Load items when modal opens 
document.getElementById('createCreditSaleModal').addEventListener('show.bs.modal', loadCreditItems);

// View Accounts Modal: Populate customer dropdown and update summary
async function loadViewAccountCustomers() {
      const select = document.getElementById('viewAccountCustomerSelect');
      // Remove all except the first option
      while (select.options.length > 1) select.remove(1);
      try {
        const res = await fetch(API_BASE_URL + '/api/customers-with-credit');
        const customers = await res.json();
        customers.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c._id;
          opt.textContent = c.name || c.phone || c.email || 'Unnamed';
          select.appendChild(opt);
        });
      } catch (e) { /* handle error */ }
    }

    async function onViewAccountCustomerChange() {
      const select = document.getElementById('viewAccountCustomerSelect');
      const customerId = select.value;
      // Clear summary fields
      if (document.getElementById('viewAccountCustomerName')) document.getElementById('viewAccountCustomerName').textContent = '';
      if (document.getElementById('viewAccountCurrentBalance')) document.getElementById('viewAccountCurrentBalance').textContent = '';
      if (document.getElementById('viewAccountOverdue')) document.getElementById('viewAccountOverdue').textContent = '';
      // Clear transaction history table
      const txTbody = document.getElementById('viewAccountTransactionTableBody');
      if (txTbody) txTbody.innerHTML = '';
      if (!customerId) return;
      try {
        // Fetch customer credit account summary
        const res = await fetch(API_BASE_URL + '/api/customer-credit-accounts');
        const accounts = await res.json();
        const account = accounts.find(acc => acc.customer_id === customerId);
        if (account) {
          if (document.getElementById('viewAccountCustomerName')) document.getElementById('viewAccountCustomerName').textContent = account.customer_name;
          if (document.getElementById('viewAccountCurrentBalance')) document.getElementById('viewAccountCurrentBalance').textContent = `shs:${(account.balance || 0).toLocaleString(undefined, {minimumFractionDigits:2})}`;
          if (document.getElementById('viewAccountOverdue')) {
            document.getElementById('viewAccountOverdue').textContent = `Overdue: shs:${(account.status === 'Overdue' ? account.balance : 0).toLocaleString(undefined, {minimumFractionDigits:2})}`;
            if (account.status === 'Overdue') {
              document.getElementById('viewAccountOverdue').classList.add('text-danger');
            } else {
              document.getElementById('viewAccountOverdue').classList.remove('text-danger');
            }
          }
        }
        // Fetch credit transactions for this customer
        const txRes = await fetch(API_BASE_URL + `/api/credit-transactions?customer_id=${customerId}`);
        const transactions = await txRes.json();
        // Populate transaction history table
        if (txTbody && Array.isArray(transactions)) {
          txTbody.innerHTML = '';
          transactions.forEach(tx => {
            // Calculate paid amount (from amount_paid or repayments if available)
            const paid = tx.amount_paid || 0;
            // Format status
            let statusClass = '';
            if (tx.payment_status === 'overdue') statusClass = 'text-danger fw-bold';
            else if (tx.payment_status === 'paid') statusClass = 'text-success';
            else if (tx.payment_status === 'partially_paid') statusClass = 'text-warning';
            txTbody.innerHTML += `
              <tr>
                <td>${tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString() : ''}</td>
                <td>shs:${(tx.total_amount || 0).toFixed(2)}</td>
                <td>shs:${(paid).toFixed(2)}</td>
                <td class="${statusClass}">${tx.payment_status ? tx.payment_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}</td>
                <td>${tx.agreed_repayment_date ? new Date(tx.agreed_repayment_date).toLocaleDateString() : ''}</td>
              </tr>
            `;
          });
          if (transactions.length === 0) {
            txTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No transactions found for this customer.</td></tr>';
          }
        }
      } catch (e) {
        if (txTbody) txTbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading transactions.</td></tr>';
      }
    }

    document.addEventListener('DOMContentLoaded', function() {
      const modal = document.getElementById('viewAccountsModal');
      if (modal) {
        modal.addEventListener('show.bs.modal', function() {
          loadViewAccountCustomers();
          // Optionally clear summary fields
          document.getElementById('viewAccountCustomerName').textContent = '';
          document.getElementById('viewAccountCurrentBalance').textContent = '';
          document.getElementById('viewAccountOverdue').textContent = '';
        });
        document.getElementById('viewAccountCustomerSelect').addEventListener('change', onViewAccountCustomerChange);
      }
    });

// Customer Search Functionality 
let filteredCreditAccounts = null;
    document.addEventListener('DOMContentLoaded', function() {
      const searchInput = document.getElementById('searchCustomerInput');
      if (searchInput) {
        searchInput.addEventListener('input', function() {
          const searchTerm = this.value.trim().toLowerCase();
          creditCurrentPage = 1;
          if (!searchTerm) {
            filteredCreditAccounts = null;
            displayCreditAccounts();
            return;
          }
          const matching = creditAccounts.filter(acc => acc.customer_name && acc.customer_name.toLowerCase().includes(searchTerm));
          const nonMatching = creditAccounts.filter(acc => !acc.customer_name || !acc.customer_name.toLowerCase().includes(searchTerm));
          filteredCreditAccounts = [...matching, ...nonMatching];
          displayCreditAccounts(filteredCreditAccounts);
        });
      }
      // Patch displayCreditAccounts to use filteredCreditAccounts if present
      const origDisplay = displayCreditAccounts;
      window.displayCreditAccounts = function(data) {
        data = data || filteredCreditAccounts || creditAccounts;
        const tbody = document.getElementById('creditAccountsTableBody');
        tbody.innerHTML = '';
        if (data.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4"><i class="fas fa-info-circle me-2"></i>No credit accounts found</td></tr>`;
          updateCreditPaginationInfo(0, 0, 0);
          return;
        }
        creditTotalPages = Math.ceil(data.length / creditRecordsPerPage);
        const startIndex = (creditCurrentPage - 1) * creditRecordsPerPage;
        const endIndex = Math.min(startIndex + creditRecordsPerPage, data.length);
        const currentPageAccounts = data.slice(startIndex, endIndex);
        currentPageAccounts.forEach(account => {
          let lastPaymentDate = 'No payments';
          if (account.last_payment_date) {
            const dateObj = new Date(account.last_payment_date);
            if (!isNaN(dateObj)) {
              lastPaymentDate = dateObj.toLocaleDateString();
            }
          }
          let statusClass = 'bg-gradient-secondary';
          if (account.status === 'Active') statusClass = 'bg-gradient-success';
          else if (account.status === 'Overdue') statusClass = 'bg-gradient-danger';
          else if (account.status === 'Paid') statusClass = 'bg-gradient-info';
          else if (account.status === 'Pending') statusClass = 'bg-gradient-warning';
          tbody.innerHTML += `
            <tr>
              <td>
                <div class="d-flex px-2 py-1">
                  <div class="d-flex flex-column justify-content-center">
                    <h6 class="mb-0 text-sm">${account.customer_name}</h6>
                    <p class="text-xs text-secondary mb-0">${account.customer_phone || 'No phone'}</p>
                  </div>
                </div>
              </td>
              <td>
                <p class="text-xs font-weight-bold mb-0">shs:${account.total_credit.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </td>
              <td class="align-middle text-center text-sm">
                <span class="text-secondary text-xs font-weight-bold">shs:${account.amount_paid.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </td>
              <td class="align-middle text-center">
                <span class="text-secondary text-xs font-weight-bold">shs:${account.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </td>
              <td class="align-middle text-center">
                <span class="text-secondary text-xs font-weight-bold">${lastPaymentDate}</span>
              </td>
              <td class="align-middle text-center text-sm">
                <span class="badge badge-sm ${statusClass}">${account.status}</span>
              </td>
            </tr>
          `;
        });
        updateCreditPaginationInfo(startIndex + 1, endIndex, data.length);
        updateCreditPaginationControls();
      }
    });

// Function to recalculate customer credit balances
async function recalculateCustomerBalances() {
  try {
    console.log('Starting customer balance recalculation...');
    
    const response = await fetch(API_BASE_URL + '/api/recalculate-customer-balances', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Recalculation result:', result);
    
    alert(`Successfully recalculated balances for ${result.customers_updated} customers.`);
    
    // Refresh the credit accounts table to show updated balances
    await loadCreditAccounts();
    
  } catch (error) {
    console.error('Error recalculating customer balances:', error);
    alert('Error recalculating customer balances: ' + error.message);
  }
}

// Make the function globally accessible
window.recalculateCustomerBalances = recalculateCustomerBalances;