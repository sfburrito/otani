document.addEventListener('DOMContentLoaded', () => {
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

            if (!response.ok) {
                throw new Error('Failed to add company');
            }

            // Show success message
            showSuccessMessage('Company added successfully!');
            
            // Update companies list
            await updateCompaniesList();
            
            // Reset form and close modal
            addCompanyForm.reset();
            closeAddCompanyModal();

        } catch (error) {
            console.error('Error:', error);
            showErrorMessage('Failed to add company. Please try again.');
        } finally {
            // Restore button state
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });

    // Show form validation errors
    function showFormErrors() {
        const invalidInputs = addCompanyForm.querySelectorAll(':invalid');
        invalidInputs.forEach(input => {
            const errorMessage = input.nextElementSibling;
            if (errorMessage && errorMessage.classList.contains('error-message')) {
                errorMessage.textContent = input.validationMessage;
                errorMessage.classList.add('show');
            }
        });
    }

    // Show success message
    function showSuccessMessage(message) {
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = message;
        document.body.appendChild(successMessage);

        // Trigger reflow for animation
        successMessage.offsetHeight;
        successMessage.classList.add('show');

        // Remove after 3 seconds
        setTimeout(() => {
            successMessage.classList.remove('show');
            setTimeout(() => successMessage.remove(), 300);
        }, 3000);
    }

    // Show error message
    function showErrorMessage(message) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        document.body.appendChild(errorMessage);

        // Trigger reflow for animation
        errorMessage.offsetHeight;
        errorMessage.classList.add('show');

        // Remove after 3 seconds
        setTimeout(() => {
            errorMessage.classList.remove('show');
            setTimeout(() => errorMessage.remove(), 300);
        }, 3000);
    }

    // Clear form errors when input changes
    addCompanyForm.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('input', () => {
            const errorMessage = input.nextElementSibling;
            if (errorMessage && errorMessage.classList.contains('error-message')) {
                errorMessage.classList.remove('show');
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
