 // JavaScript for Credit Customers Page

// Global variables for pagination
let creditCustomers = [];
let creditCustomersCurrentPage = 1;
const creditCustomersRecordsPerPage = 4;
let creditCustomersTotalPages = 1;

// Load credit customers when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadCreditCustomers();
    
    // Add search functionality
    const searchInput = document.getElementById('searchCreditCustomerInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterCreditCustomers(this.value);
        });
    }
});

// Load credit customers from backend
async function loadCreditCustomers() {
    try {
        console.log('Loading credit customers...');
        
        const response = await fetch(API_BASE_URL + '/api/customer-credit-accounts');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const creditAccounts = await response.json();
        
        // Transform the data to match our expected structure
        creditCustomers = creditAccounts.map(account => ({
            _id: account.customer_id,
            name: account.customer_name,
            phone: account.customer_phone,
            email: account.customer_email,
            balance: account.balance, // This is the same "Balance" value from credit-management.html
            total_credit: account.total_credit,
            amount_paid: account.amount_paid,
            status: account.status,
            transaction_count: account.transaction_count
        }));
        
        console.log('Credit accounts loaded:', creditAccounts.length);
        console.log('Credit customers transformed:', creditCustomers.length);
        console.log('Records per page setting:', creditCustomersRecordsPerPage);
        
        displayCreditCustomers();
        
    } catch (error) {
        console.error('Error loading credit customers:', error);
        const tbody = document.getElementById('creditCustomersTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-danger py-4">
                        <i class="fas fa-exclamation-triangle me-2"></i>Error loading credit customers: ${error.message}
                    </td>
                </tr>
            `;
        }
        updateCreditCustomersPaginationInfo(0, 0, 0);
    }
}

// Display credit customers with pagination
function displayCreditCustomers() {
    console.log('displayCreditCustomers called');
    console.log('Total customers:', creditCustomers.length);
    console.log('Records per page:', creditCustomersRecordsPerPage);
    console.log('Current page:', creditCustomersCurrentPage);
    
    const tbody = document.getElementById('creditCustomersTableBody');
    if (!tbody) {
        console.error('Table body not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (creditCustomers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted py-4">
                    <i class="fas fa-info-circle me-2"></i>No credit customers found
                </td>
            </tr>
        `;
        updateCreditCustomersPaginationInfo(0, 0, 0);
        return;
    }
    
    // Calculate pagination
    creditCustomersTotalPages = Math.ceil(creditCustomers.length / creditCustomersRecordsPerPage);
    const startIndex = (creditCustomersCurrentPage - 1) * creditCustomersRecordsPerPage;
    const endIndex = Math.min(startIndex + creditCustomersRecordsPerPage, creditCustomers.length);
    const currentPageCustomers = creditCustomers.slice(startIndex, endIndex);
    
    console.log('Total pages:', creditCustomersTotalPages);
    console.log('Start index:', startIndex);
    console.log('End index:', endIndex);
    console.log('Customers to display:', currentPageCustomers.length);
    
    currentPageCustomers.forEach(customer => {
        const row = document.createElement('tr');
        const totalCredit = customer.balance || 0;
        
        row.innerHTML = `
            <td>
                <div class="d-flex px-2 py-1">
                    <div class="d-flex flex-column justify-content-center">
                        <h6 class="mb-0 text-sm">${customer.name || 'Unnamed'}</h6>
                        <p class="text-xs text-secondary mb-0">${customer.phone || 'No phone'}</p>
                    </div>
                </div>
            </td>
            <td>
                <p class="text-xs font-weight-bold mb-0">shs:${totalCredit.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            </td>
            <td class="align-middle text-center">
                <button class="btn btn-link text-danger mb-0" onclick="showDeleteConfirmation('${customer._id}', '${customer.name}', ${totalCredit})" title="Delete Customer">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    updateCreditCustomersPaginationInfo(startIndex + 1, endIndex, creditCustomers.length);
    updateCreditCustomersPaginationControls();
}

// Update pagination info
function updateCreditCustomersPaginationInfo(startRecord, endRecord, totalRecords) {
    const startElement = document.getElementById('creditCustomersStartRecord');
    const endElement = document.getElementById('creditCustomersEndRecord');
    const totalElement = document.getElementById('creditCustomersTotalRecords');
    
    if (startElement) startElement.textContent = startRecord;
    if (endElement) endElement.textContent = endRecord;
    if (totalElement) totalElement.textContent = totalRecords;
}

// Update pagination controls
function updateCreditCustomersPaginationControls() {
    const prevButton = document.getElementById('creditCustomersPrevPage');
    const nextButton = document.getElementById('creditCustomersNextPage');
    const currentPageInfo = document.getElementById('creditCustomersCurrentPageInfo');
    
    if (prevButton) {
        prevButton.disabled = creditCustomersCurrentPage <= 1;
    }
    
    if (nextButton) {
        nextButton.disabled = creditCustomersCurrentPage >= creditCustomersTotalPages;
    }
    
    if (currentPageInfo) {
        currentPageInfo.textContent = `Page ${creditCustomersCurrentPage} of ${creditCustomersTotalPages}`;
    }
}

// Pagination functions
function creditCustomersPreviousPage() {
    if (creditCustomersCurrentPage > 1) {
        creditCustomersCurrentPage--;
        displayCreditCustomers();
    }
}

function creditCustomersNextPage() {
    if (creditCustomersCurrentPage < creditCustomersTotalPages) {
        creditCustomersCurrentPage++;
        displayCreditCustomers();
    }
}

// Filter credit customers based on search term
function filterCreditCustomers(searchTerm) {
    if (!searchTerm.trim()) {
        // If search is empty, show all customers
        creditCustomersCurrentPage = 1; // Reset to first page
        displayCreditCustomers();
        return;
    }
    
    const filteredCustomers = creditCustomers.filter(customer => {
        const name = (customer.name || '').toLowerCase();
        const phone = (customer.phone || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return name.includes(search) || phone.includes(search);
    });
    
    // Reset to first page when filtering
    creditCustomersCurrentPage = 1;
    
    // Display filtered results
    displayFilteredCreditCustomers(filteredCustomers);
}

// Display filtered credit customers
function displayFilteredCreditCustomers(filteredCustomers) {
    const tbody = document.getElementById('creditCustomersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (filteredCustomers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted py-4">
                    <i class="fas fa-search me-2"></i>No customers found matching your search
                </td>
            </tr>
        `;
        updateCreditCustomersPaginationInfo(0, 0, 0);
        return;
    }
    
    // Apply pagination to filtered results
    const startIndex = (creditCustomersCurrentPage - 1) * creditCustomersRecordsPerPage;
    const endIndex = Math.min(startIndex + creditCustomersRecordsPerPage, filteredCustomers.length);
    const currentPageCustomers = filteredCustomers.slice(startIndex, endIndex);
    
    currentPageCustomers.forEach(customer => {
        const row = document.createElement('tr');
        const totalCredit = customer.balance || 0;
        
        row.innerHTML = `
            <td>
                <div class="d-flex px-2 py-1">
                    <div class="d-flex flex-column justify-content-center">
                        <h6 class="mb-0 text-sm">${customer.name || 'Unnamed'}</h6>
                        <p class="text-xs text-secondary mb-0">${customer.phone || 'No phone'}</p>
                    </div>
                </div>
            </td>
            <td>
                <p class="text-xs font-weight-bold mb-0">shs:${totalCredit.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            </td>
            <td class="align-middle text-center">
                <button class="btn btn-link text-danger mb-0" onclick="showDeleteConfirmation('${customer._id}', '${customer.name}', ${totalCredit})" title="Delete Customer">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    updateCreditCustomersPaginationInfo(startIndex + 1, endIndex, filteredCustomers.length);
    updateCreditCustomersPaginationControls();
}

// Add new credit customer
async function addCreditCustomer() {
    console.log('Adding new credit customer...');
    
    // Get form values
    const name = document.getElementById('newCustomerName').value.trim();
    const phone = document.getElementById('newCustomerPhone').value.trim();
    const email = document.getElementById('newCustomerEmail').value.trim();
    const gender = document.getElementById('newCustomerGender').value;
    const customerType = document.getElementById('newCustomerType').value;
    const creditLimit = parseFloat(document.getElementById('newCustomerCreditLimit').value) || 0;
    const address = document.getElementById('newCustomerAddress').value.trim();
    const notes = document.getElementById('newCustomerNotes').value.trim();
    
    // Validate required fields
    if (!name || !phone) {
        alert('Please provide both customer name and phone number');
        return;
    }
    
    // Validate phone number
    if (phone.length < 10 || phone.length > 15) {
        alert('Please enter a valid phone number (10-15 digits)');
        return;
    }
    
    try {
        const customerData = {
            name: name,
            phone: phone,
            email: email || undefined,
            gender: gender || undefined,
            customer_type: customerType,
            is_credit_customer: true,
            address: address || undefined,
            notes: notes || undefined
        };
        
        console.log('Customer data to send:', customerData);
        console.log('Making API call to: API_BASE_URL + /api/customers');
        
        const response = await fetch(API_BASE_URL + '/api/customers', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(customerData)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        if (!response.ok) {
            let errorMessage = 'Unknown error';
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.details || errorData.error || errorData.message || 'Unknown error';
            } catch (e) {
                errorMessage = responseText || 'Network error';
            }
            console.error('API Error:', errorMessage);
            alert('Error creating customer: ' + errorMessage);
            return;
        }
        
        let newCustomer;
        try {
            newCustomer = JSON.parse(responseText);
        } catch (e) {
            console.error('Error parsing response:', e);
            alert('Error parsing server response. Please try again.');
            return;
        }
        
        console.log('Customer created successfully:', newCustomer);
        
        alert('Credit customer created successfully!');
        
        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCreditCustomerModal'));
        if (modal) {
            modal.hide();
        }
        resetAddCustomerForm();
        
        // Reload customers list
        await loadCreditCustomers();
        
    } catch (error) {
        console.error('Error creating customer:', error);
        console.error('Error details:', error.message);
        alert('Error creating customer: ' + error.message);
    }
}

// Reset add customer form
function resetAddCustomerForm() {
    document.getElementById('newCustomerName').value = '';
    document.getElementById('newCustomerPhone').value = '';
    document.getElementById('newCustomerEmail').value = '';
    document.getElementById('newCustomerGender').value = '';
    document.getElementById('newCustomerType').value = 'retail';
    document.getElementById('newCustomerCreditLimit').value = '';
    document.getElementById('newCustomerAddress').value = '';
    document.getElementById('newCustomerNotes').value = '';
}

// View customer details
function viewCustomerDetails(customerId) {
    console.log('Viewing customer details for ID:', customerId);
    // TODO: Implement view customer details functionality
    alert('View customer details functionality will be implemented here');
}

// Edit customer
function editCustomer(customerId) {
    console.log('Editing customer with ID:', customerId);
    // TODO: Implement edit customer functionality
    alert('Edit customer functionality will be implemented here');
}

// Delete customer
async function deleteCustomer(customerId, customerName) {
    console.log('Deleting customer:', customerName, 'with ID:', customerId);
    
    try {
        const response = await fetch(API_BASE_URL + `/api/customers/${customerId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('Delete response status:', response.status);
        
        if (!response.ok) {
            // Try to parse error response as JSON
            let errorMessage = 'Unknown error';
            try {
                const errorText = await response.text();
                console.log('Error response text:', errorText);
                
                if (errorText.trim()) {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.details || errorData.error || errorData.message || 'Unknown error';
                } else {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            
            // Show error in modal instead of alert for better UX
            const modalBody = document.querySelector('#deleteCustomerModal .modal-body');
            if (modalBody) {
                modalBody.innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Error:</strong> ${errorMessage}
                    </div>
                    <p class="text-muted mb-0">Please try again or contact support if the problem persists.</p>
                `;
            }
            
            // Hide the delete button
            const confirmDeleteBtn = document.getElementById('confirmDeleteCustomerBtn');
            if (confirmDeleteBtn) {
                confirmDeleteBtn.style.display = 'none';
            }
            
            return;
        }
        
        console.log('Customer deleted successfully');
        
        // Hide the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteCustomerModal'));
        if (modal) {
            modal.hide();
        }
        
        // Show success message
        alert(`Customer "${customerName}" deleted successfully!`);
        
        // Reload customers list
        await loadCreditCustomers();
        
    } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Error deleting customer. Please try again.');
    }
}

// Refresh credit customers list
function refreshCreditCustomers() {
    loadCreditCustomers();
}

// Helper functions for the new buttons
function scrollToTable() {
    const tableSection = document.querySelector('.row.mt-4:last-child');
    if (tableSection) {
        tableSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function focusSearch() {
    const searchInput = document.getElementById('searchCreditCustomerInput');
    if (searchInput) {
        searchInput.focus();
        scrollToTable();
    }
}

// Show delete confirmation modal
function showDeleteConfirmation(customerId, customerName, totalCredit) {
    console.log('Showing delete confirmation for customer:', customerName, 'with ID:', customerId);
    
    // Find the customer to check their credit balance
    const customer = creditCustomers.find(c => c._id === customerId);
    if (!customer) {
        alert('Customer not found!');
        return;
    }
    
    const currentCredit = customer.balance || 0;
    
    // Set the customer name in the modal
    const deleteCustomerNameElement = document.getElementById('deleteCustomerName');
    if (deleteCustomerNameElement) {
        deleteCustomerNameElement.textContent = customerName;
    }
    
    // Check if customer has outstanding credit
    if (currentCredit !== 0) {
        // Show modal with credit balance warning
        const modalBody = document.querySelector('#deleteCustomerModal .modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Cannot Delete:</strong> Customer has outstanding credit balance
                </div>
                <p>Cannot delete customer <strong>${customerName}</strong>. Customer has outstanding credit balance of <strong>shs:${currentCredit.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong>.</p>
                <p class="text-muted mb-0">Please clear the credit balance before deleting.</p>
            `;
        }
        
        // Hide the delete button and show only close button
        const confirmDeleteBtn = document.getElementById('confirmDeleteCustomerBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.style.display = 'none';
        }
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('deleteCustomerModal'));
        modal.show();
        return;
    }
    
    // For customers with 0 credit, show the normal confirmation modal
    const modalBody = document.querySelector('#deleteCustomerModal .modal-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="alert alert-warning" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Warning:</strong> This action cannot be undone!
            </div>
            <p>Are you sure you want to delete customer <strong>${customerName}</strong>?</p>
            <p class="text-muted mb-0">This will permanently remove the customer from the system.</p>
        `;
    }
    
    // Show the delete button for customers with 0 credit
    const confirmDeleteBtn = document.getElementById('confirmDeleteCustomerBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.style.display = 'block';
        confirmDeleteBtn.onclick = function() {
            deleteCustomer(customerId, customerName);
        };
    }
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('deleteCustomerModal'));
    modal.show();
}

// Make functions globally accessible
window.creditCustomersPreviousPage = creditCustomersPreviousPage;
window.creditCustomersNextPage = creditCustomersNextPage;
window.addCreditCustomer = addCreditCustomer;
window.viewCustomerDetails = viewCustomerDetails;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;
window.showDeleteConfirmation = showDeleteConfirmation;
window.refreshCreditCustomers = refreshCreditCustomers;
window.scrollToTable = scrollToTable;
window.focusSearch = focusSearch;