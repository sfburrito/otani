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

// Function to add a new company row to the table
function addCompanyToTable(company) {
    const table = document.querySelector('.companies-table tbody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td>${company.name}</td>
        <td>${company.industry}</td>
        <td>${company.stage}</td>
        <td class="rating-col">
            <span class="rating-badge ${company.rating.toLowerCase()}">${company.rating}</span>
        </td>
        <td class="description-col">
            <div class="description-content">${company.description || ''}</div>
        </td>
        <td class="icon-cell">
            ${company.website ? `<a href="${company.website}" target="_blank" class="action-icon"><i class="fas fa-globe"></i></a>` : ''}
            ${company.email ? `<a href="mailto:${company.email}" class="action-icon"><i class="fas fa-envelope"></i></a>` : ''}
        </td>
    `;
    
    table.appendChild(newRow);
}

document.addEventListener('DOMContentLoaded', () => {
    // Close modal when clicking close button
    document.querySelector('.close-modal').addEventListener('click', () => {
        closeAddCompanyModal();
    });

    const addCompanyForm = document.getElementById('addCompanyForm');
    
    addCompanyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submission started');
        
        if (!addCompanyForm.checkValidity()) {
            console.log('Form validation failed');
            showFormErrors();
            return;
        }

        const submitButton = document.querySelector('button[form="addCompanyForm"]');
        const originalText = submitButton.textContent;
        
        try {
            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="loading-spinner"></span>Adding...';

            // Get form data
            const formData = new FormData(addCompanyForm);
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
            addCompanyForm.reset();
            closeAddCompanyModal();

        } catch (error) {
            console.error('Error adding company:', error);
            showErrorMessage(error.message || 'Failed to add company');
        } finally {
            // Restore button state
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });

    // Show form validation errors
    function showFormErrors() {
        const invalidInputs = document.querySelectorAll(':invalid');
        console.log('Invalid inputs:', Array.from(invalidInputs).map(input => ({
            id: input.id,
            name: input.name,
            value: input.value,
            validationMessage: input.validationMessage
        })));
        
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
        console.log('Success:', message);
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = message;
        document.body.appendChild(successMessage);
        setTimeout(() => successMessage.remove(), 3000);
    }

    // Show error message
    function showErrorMessage(message) {
        console.error('Error:', message);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        document.body.appendChild(errorMessage);
        setTimeout(() => errorMessage.remove(), 3000);
    }

    // Clear form errors when input changes
    addCompanyForm.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('input', () => {
            console.log(`Input changed - ${input.name}: ${input.value}`);
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
