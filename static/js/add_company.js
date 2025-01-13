// Modal functions
function openAddCompanyModal() {
    const modal = document.getElementById('addCompanyModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeAddCompanyModal() {
    const modal = document.getElementById('addCompanyModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    // Get the form either by original ID or the cloned one
    const form = document.getElementById('addCompanyForm');
    if (form) form.reset();
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('addCompanyModal');
    if (event.target.classList.contains('modal-overlay')) {
        closeAddCompanyModal();
    }
});

// Function to add a new company row to the table
function addCompanyToTable(company) {
    const tbody = document.querySelector('.companies-table tbody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td class="rating-col text-center">
            <span class="rating-badge ${company.rating.toLowerCase()}">${company.rating}</span>
        </td>
        <td class="text-center">${company.name}</td>
        <td class="text-center">${company.industry}</td>
        <td class="text-center">${company.stage}</td>
        <td class="icon-cell">
            ${company.website ? `<a href="${company.website}" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt"></i></a>` : ''}
        </td>
        <td class="icon-cell">
            ${company.email ? `<a href="mailto:${company.email}"><i class="fas fa-envelope"></i></a>` : ''}
        </td>
        <td class="description-col">
            <div class="description-content">${company.description || ''}</div>
        </td>
    `;
    
    tbody.appendChild(newRow);
}

// Prevent multiple form submissions
let isSubmitting = false;

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

// Initialize form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize close button
    const closeButton = document.querySelector('.close-modal');
    if (closeButton) {
        closeButton.addEventListener('click', closeAddCompanyModal);
    }
    
    // Initialize the form
    initializeForm();
});

// Show form validation errors
function showFormErrors() {
    const form = document.getElementById('addCompanyForm');
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
    const messageDiv = document.createElement('div');
    messageDiv.className = 'alert alert-success';
    messageDiv.textContent = message;
    flashMessages.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 5000);
}

// Show error message
function showErrorMessage(message) {
    const flashMessages = document.querySelector('.flash-messages');
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
