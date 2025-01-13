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
    document.getElementById('addCompanyForm').reset();
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('addCompanyModal');
    if (event.target.classList.contains('modal-overlay')) {
        closeAddCompanyModal();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Close modal when clicking close button
    document.querySelector('.close-modal').addEventListener('click', () => {
        closeAddCompanyModal();
    });

    const addCompanyForm = document.getElementById('addCompanyForm');
    
    addCompanyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!addCompanyForm.checkValidity()) {
            showFormErrors();
            return;
        }

        const submitButton = addCompanyForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        try {
            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="loading-spinner"></span>Adding...';

            // Get form data
            const formData = new FormData(addCompanyForm);
            const data = Object.fromEntries(formData.entries());

            // Send request to server
            const response = await fetch('/add_company', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to add company');
            }

            // Show success message
            showSuccessMessage('Company added successfully!');
            
            // Reset form and close modal
            addCompanyForm.reset();
            closeAddCompanyModal();
            
            // Reload page to show new company
            location.reload();

        } catch (error) {
            console.error('Error:', error);
            showErrorMessage(error.message || 'Failed to add company. Please try again.');
        } finally {
            // Restore button state
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });

    // Show form validation errors
    function showFormErrors() {
        const invalidInputs = document.querySelectorAll(':invalid');
        invalidInputs.forEach(input => {
            input.classList.add('invalid');
            const errorMessage = input.nextElementSibling;
            if (errorMessage && errorMessage.classList.contains('error-message')) {
                errorMessage.textContent = input.validationMessage;
                errorMessage.style.display = 'block';
            }
        });
    }

    // Show success message
    function showSuccessMessage(message) {
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = message;
        document.body.appendChild(successMessage);
        setTimeout(() => successMessage.remove(), 3000);
    }

    // Show error message
    function showErrorMessage(message) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        document.body.appendChild(errorMessage);
        setTimeout(() => errorMessage.remove(), 3000);
    }

    // Clear form errors when input changes
    addCompanyForm.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('invalid');
            const errorMessage = input.nextElementSibling;
            if (errorMessage && errorMessage.classList.contains('error-message')) {
                errorMessage.style.display = 'none';
            }
        });
    });

    // Format ARR input
    const arrInput = document.getElementById('companyARR');
    if (arrInput) {
        arrInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^0-9.]/g, '');
            if (value) {
                value = parseFloat(value);
                if (!isNaN(value)) {
                    e.target.value = formatCurrency(value);
                }
            }
        });
    }

    function formatCurrency(value) {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(1)}K`;
        }
        return `$${value.toFixed(2)}`;
    }
});
