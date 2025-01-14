// Modal functions
function openAddCompanyModal() {
    const modal = document.getElementById('addCompanyModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeAddCompanyModal() {
    const modal = document.getElementById('addCompanyModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        // Reset form
        const form = document.getElementById('addCompanyForm');
        if (form) form.reset();
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal-overlay')) {
        const modal = event.target.closest('.modal');
        if (modal && modal.id === 'addCompanyModal') {
            closeAddCompanyModal();
        }
    }
});

// Function to add a new company row to the table
function addCompanyToTable(company) {
    console.log('Adding company to table:', company);
    const tbody = document.querySelector('.companies-table tbody');
    if (!tbody) return;
    
    const newRow = document.createElement('tr');
    newRow.className = 'clickable-row';
    newRow.onclick = function() {
        console.log('Row clicked:', company);
        // Removed openCompanyDetails function call
    };
    
    newRow.innerHTML = `
        <td class="rating-col text-left">
            <span class="rating-badge ${company.rating.toLowerCase()}">${company.rating}</span>
        </td>
        <td class="text-left">${company.name}</td>
        <td class="text-left">${company.industry}</td>
        <td class="text-left">${company.stage}</td>
        <td class="icon-cell" onclick="event.stopPropagation()">
            ${company.website ? `<a href="${company.website}" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt"></i></a>` : ''}
        </td>
        <td class="icon-cell" onclick="event.stopPropagation()">
            ${company.email ? `<a href="mailto:${company.email}"><i class="fas fa-envelope"></i></a>` : ''}
        </td>
        <td class="description-col text-left">
            <div class="description-content">${company.description || ''}</div>
        </td>
    `;
    
    tbody.appendChild(newRow);
}

// Initialize form once DOM is loaded
function initializeForm() {
    const addCompanyForm = document.getElementById('addCompanyForm');
    if (!addCompanyForm) return; // Exit if form doesn't exist
    
    // Remove any existing event listeners by cloning the form
    const newForm = addCompanyForm.cloneNode(true);
    newForm.id = 'addCompanyForm'; // Ensure ID is preserved
    addCompanyForm.parentNode.replaceChild(newForm, addCompanyForm);
    
    // Add event listeners for form validation
    newForm.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('input', () => {
            console.log(`Input changed - ${input.name}: ${input.value}`);
            input.classList.remove('invalid');
            const errorSpan = document.getElementById(`${input.id}-error`);
            if (errorSpan) {
                errorSpan.textContent = '';
            }
        });
    });
    
    let isSubmitting = false; // Move isSubmitting inside the form initialization
    
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Prevent double submission
        if (isSubmitting) {
            console.log('Form is already being submitted');
            return;
        }
        
        console.log('Form submission started');
        
        if (!newForm.checkValidity()) {
            console.log('Form validation failed');
            showFormErrors();
            return;
        }

        const submitButton = document.querySelector('button[form="addCompanyForm"]');
        if (!submitButton) return;
        
        const originalText = submitButton.textContent;
        
        try {
            isSubmitting = true;
            
            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="loading-spinner"></span>Adding...';

            // Get form data
            const formData = new FormData(newForm);
            const data = {};
            
            // Log each form field
            for (let [key, value] of formData.entries()) {
                console.log(`Form field - ${key}: ${value}`);
                data[key] = value;
            }
            
            console.log('Sending data to server:', JSON.stringify(data, null, 2));

            // Send request to server
            const response = await fetch('/add_company', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });

            console.log('Response status:', response.status);
            
            const result = await response.json();
            console.log('Parsed response:', result);

            if (!response.ok) {
                throw new Error(result.error || 'Failed to add company');
            }

            // Add the new company to the table
            addCompanyToTable(result.company);

            // Show success message
            showSuccessMessage('Company added successfully!');
            
            // Reset form and close modal
            newForm.reset();
            closeAddCompanyModal();

        } catch (error) {
            console.error('Error adding company:', error);
            showErrorMessage(error.message || 'Failed to add company');
        } finally {
            // Reset submission flag and button state
            isSubmitting = false;
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}

// Show form validation errors
function showFormErrors() {
    const form = document.getElementById('addCompanyForm');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        if (!input.validity.valid) {
            input.classList.add('invalid');
            const errorSpan = document.getElementById(`${input.id}-error`);
            if (errorSpan) {
                errorSpan.textContent = input.validationMessage;
            }
        }
    });
}

// Show success message
function showSuccessMessage(message) {
    const flashMessages = document.querySelector('.flash-messages');
    if (!flashMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'alert alert-success';
    messageDiv.textContent = message;
    flashMessages.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 5000);
}

// Show error message
function showErrorMessage(message) {
    const flashMessages = document.querySelector('.flash-messages');
    if (!flashMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'alert alert-error';
    messageDiv.textContent = message;
    flashMessages.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 5000);
}

// Format currency input
function formatCurrency(value) {
    if (!value) return '';
    value = value.replace(/[^\d.]/g, '');
    const parts = value.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return '$' + parts.join('.');
}

// Initialize modals when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize close buttons for add company modal
    const addCompanyModal = document.getElementById('addCompanyModal');
    if (addCompanyModal) {
        const closeButton = addCompanyModal.querySelector('.modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', closeAddCompanyModal);
        }
    }
    
    // Initialize the form
    initializeForm();
});
