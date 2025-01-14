(function() {
    // Cache DOM elements
    const elements = {
        addCompanyModal: null,
        addCompanyForm: null,
        addCompanyButton: null,
        flashMessages: null,
        companiesTableBody: null
    };

    let isSubmitting = false;

    // Modal functions
    function openAddCompanyModal() {
        if (elements.addCompanyModal) {
            elements.addCompanyModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    function closeAddCompanyModal() {
        if (elements.addCompanyModal) {
            elements.addCompanyModal.style.display = 'none';
            document.body.style.overflow = '';
            if (elements.addCompanyForm) {
                elements.addCompanyForm.reset();
                isSubmitting = false;
            }
        }
    }

    // Function to add a new company row to the table
    function addCompanyToTable(company) {
        console.log('Adding company to table:', company);
        if (!elements.companiesTableBody) return;
        
        const newRow = document.createElement('tr');
        newRow.className = 'clickable-row';
        newRow.dataset.companyId = company.id;
        newRow.onclick = () => window.openCompanyDetail?.(company);
        
        newRow.innerHTML = `
            <td class="rating-col text-left">
                <span class="rating-badge ${company.rating?.toLowerCase() || ''}">${company.rating || ''}</span>
            </td>
            <td class="text-left">${company.name || ''}</td>
            <td class="text-left">${company.industry || ''}</td>
            <td class="text-left">${company.stage || ''}</td>
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
        
        // Remove empty state if it exists
        const emptyState = elements.companiesTableBody.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        elements.companiesTableBody.appendChild(newRow);
    }

    // Show messages
    function showMessage(message, type = 'success') {
        if (!elements.flashMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type}`;
        messageDiv.textContent = message;
        elements.flashMessages.appendChild(messageDiv);
        
        setTimeout(() => messageDiv.remove(), 5000);
    }

    // Show form validation errors
    function showFormErrors() {
        if (!elements.addCompanyForm) return;
        
        elements.addCompanyForm.querySelectorAll('input, textarea, select').forEach(input => {
            if (!input.validity.valid) {
                input.classList.add('invalid');
                const errorSpan = document.getElementById(`${input.id}-error`);
                if (errorSpan) errorSpan.textContent = input.validationMessage;
            }
        });
    }

    // Handle form submission
    async function handleSubmit() {
        if (isSubmitting || !elements.addCompanyForm || !elements.addCompanyButton) {
            console.log('Form submission already in progress or missing elements');
            return;
        }

        if (!elements.addCompanyForm.checkValidity()) {
            showFormErrors();
            return;
        }

        const originalText = elements.addCompanyButton.innerHTML;
        
        try {
            isSubmitting = true;
            elements.addCompanyButton.disabled = true;
            elements.addCompanyButton.innerHTML = '<span class="loading-spinner"></span>Adding...';

            const formData = new FormData(elements.addCompanyForm);
            const data = Object.fromEntries(formData.entries());
            
            const response = await fetch('/add_company', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to add company');

            addCompanyToTable(result.company);
            showMessage('Company added successfully!');
            elements.addCompanyForm.reset();
            closeAddCompanyModal();

        } catch (error) {
            console.error('Error adding company:', error);
            showMessage(error.message || 'Failed to add company', 'error');
        } finally {
            if (elements.addCompanyButton) {
                elements.addCompanyButton.disabled = false;
                elements.addCompanyButton.innerHTML = originalText;
            }
            // Only reset isSubmitting after a delay to prevent double submissions
            setTimeout(() => {
                isSubmitting = false;
            }, 1000);
        }
    }

    // Format currency input
    function formatCurrency(value) {
        if (!value) return '';
        value = value.replace(/[^\d.]/g, '');
        const parts = value.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return '$' + parts.join('.');
    }

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Cache DOM elements
        elements.addCompanyModal = document.getElementById('addCompanyModal');
        elements.addCompanyForm = document.getElementById('addCompanyForm');
        elements.addCompanyButton = document.getElementById('addCompanyButton');
        elements.flashMessages = document.querySelector('.flash-messages');
        elements.companiesTableBody = document.querySelector('.companies-table tbody');
        
        // Add event listeners
        if (elements.addCompanyModal) {
            elements.addCompanyModal.addEventListener('click', (e) => {
                if (e.target.matches('.modal-close, .modal-close *')) {
                    closeAddCompanyModal();
                } else if (e.target.matches('.modal-overlay')) {
                    closeAddCompanyModal();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && elements.addCompanyModal.style.display === 'block') {
                    closeAddCompanyModal();
                }
            });
        }

        // Add input event listeners using event delegation
        if (elements.addCompanyForm) {
            elements.addCompanyForm.addEventListener('input', (e) => {
                const input = e.target;
                if (input.matches('input, textarea, select')) {
                    input.classList.remove('invalid');
                    const errorSpan = document.getElementById(`${input.id}-error`);
                    if (errorSpan) errorSpan.textContent = '';
                }
            });

            // Prevent form submission and handle it through the button click
            elements.addCompanyForm.addEventListener('submit', (e) => {
                e.preventDefault();
            });
        }

        // Add click handler for the submit button
        if (elements.addCompanyButton) {
            elements.addCompanyButton.addEventListener('click', handleSubmit);
        }
    });

    // Expose functions to window
    window.openAddCompanyModal = openAddCompanyModal;
    window.closeAddCompanyModal = closeAddCompanyModal;
    window.formatCurrency = formatCurrency;
})();
