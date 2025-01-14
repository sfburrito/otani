(function() {
    let initialized = false; // Prevent double initialization
    
    // Cache DOM elements
    const elements = {
        addCompanyModal: null,
        addCompanyForm: null,
        addCompanyButton: null,
        flashMessages: null,
        companiesTableBody: null
    };

    let isSubmitting = false;
    let lastSubmissionTime = 0;
    const DEBOUNCE_DELAY = 2000; // 2 seconds
    let submitCount = 0; // Track number of submission attempts

    // Debug logging
    function debugLog(message, data = null) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    // Modal functions
    function openAddCompanyModal() {
        debugLog('Opening add company modal');
        if (elements.addCompanyModal) {
            elements.addCompanyModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    function closeAddCompanyModal() {
        debugLog('Closing add company modal');
        if (elements.addCompanyModal) {
            elements.addCompanyModal.style.display = 'none';
            document.body.style.overflow = '';
            if (elements.addCompanyForm) {
                elements.addCompanyForm.reset();
                isSubmitting = false;
                debugLog('Reset form and submission state');
            }
        }
    }

    // Function to add a new company row to the table
    function addCompanyToTable(company) {
        debugLog('Adding company to table:', company);
        if (!elements.companiesTableBody) {
            debugLog('Error: Companies table body not found');
            return;
        }
        
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
        debugLog('Successfully added row to table');
    }

    // Show messages
    function showMessage(message, type = 'success') {
        debugLog(`Showing message: ${message} (${type})`);
        if (!elements.flashMessages) {
            debugLog('Error: Flash messages container not found');
            return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type}`;
        messageDiv.textContent = message;
        elements.flashMessages.appendChild(messageDiv);
        
        setTimeout(() => messageDiv.remove(), 5000);
    }

    // Show form validation errors
    function showFormErrors() {
        debugLog('Showing form validation errors');
        if (!elements.addCompanyForm) {
            debugLog('Error: Form not found');
            return;
        }
        
        elements.addCompanyForm.querySelectorAll('input, textarea, select').forEach(input => {
            if (!input.validity.valid) {
                input.classList.add('invalid');
                const errorSpan = document.getElementById(`${input.id}-error`);
                if (errorSpan) errorSpan.textContent = input.validationMessage;
                debugLog(`Validation error for ${input.id}: ${input.validationMessage}`);
            }
        });
    }

    // Handle form submission
    async function handleSubmit(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation(); // Prevent event bubbling
            debugLog('Prevented default form submission and stopped propagation');
        }

        submitCount++;
        const currentSubmit = submitCount;
        debugLog(`Submit attempt #${currentSubmit} started`);

        // Check if enough time has passed since last submission
        const now = Date.now();
        const timeSinceLastSubmission = now - lastSubmissionTime;
        debugLog(`Time since last submission: ${timeSinceLastSubmission}ms`);

        if (timeSinceLastSubmission < DEBOUNCE_DELAY) {
            debugLog(`Submission too soon (${timeSinceLastSubmission}ms < ${DEBOUNCE_DELAY}ms)`);
            return;
        }

        if (isSubmitting) {
            debugLog('Form submission already in progress');
            return;
        }

        if (!elements.addCompanyForm || !elements.addCompanyButton) {
            debugLog('Error: Required elements not found', {
                formFound: !!elements.addCompanyForm,
                buttonFound: !!elements.addCompanyButton
            });
            return;
        }

        if (!elements.addCompanyForm.checkValidity()) {
            debugLog('Form validation failed');
            showFormErrors();
            return;
        }

        const originalText = elements.addCompanyButton.innerHTML;
        debugLog('Starting submission process');
        
        try {
            isSubmitting = true;
            lastSubmissionTime = now;
            elements.addCompanyButton.disabled = true;
            elements.addCompanyButton.innerHTML = '<span class="loading-spinner"></span>Adding...';

            const formData = new FormData(elements.addCompanyForm);
            const data = Object.fromEntries(formData.entries());
            debugLog('Form data prepared:', data);
            
            debugLog('Sending POST request to /add_company');
            const response = await fetch('/add_company', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            debugLog('Received response:', result);

            if (!response.ok) {
                throw new Error(result.error || 'Failed to add company');
            }

            if (result.message === 'Company already added') {
                debugLog('Duplicate company detected by server');
                showMessage('This company was already added', 'warning');
            } else {
                addCompanyToTable(result.company);
                showMessage('Company added successfully!');
                elements.addCompanyForm.reset();
                closeAddCompanyModal();
            }

        } catch (error) {
            debugLog('Error during submission:', error);
            console.error('Error adding company:', error);
            showMessage(error.message || 'Failed to add company', 'error');
        } finally {
            debugLog(`Submit attempt #${currentSubmit} finished`);
            if (elements.addCompanyButton) {
                elements.addCompanyButton.disabled = false;
                elements.addCompanyButton.innerHTML = originalText;
            }
            // Only reset isSubmitting after a delay
            setTimeout(() => {
                isSubmitting = false;
                debugLog(`Reset submission state for attempt #${currentSubmit}`);
            }, DEBOUNCE_DELAY);
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
        if (initialized) {
            debugLog('Already initialized, skipping');
            return;
        }
        initialized = true;
        
        debugLog('DOM loaded, initializing form');
        
        // Cache DOM elements
        elements.addCompanyModal = document.getElementById('addCompanyModal');
        elements.addCompanyForm = document.getElementById('addCompanyForm');
        elements.addCompanyButton = document.getElementById('addCompanyButton');
        elements.flashMessages = document.querySelector('.flash-messages');
        elements.companiesTableBody = document.querySelector('.companies-table tbody');

        debugLog('Elements initialized:', {
            modalFound: !!elements.addCompanyModal,
            formFound: !!elements.addCompanyForm,
            buttonFound: !!elements.addCompanyButton,
            flashMessagesFound: !!elements.flashMessages,
            tableBodyFound: !!elements.companiesTableBody
        });
        
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

            // Only attach one submit handler to the form
            elements.addCompanyForm.addEventListener('submit', handleSubmit);
            debugLog('Form submit handler attached');
        }

        debugLog('Initialization complete');
    });

    // Expose functions to window
    window.openAddCompanyModal = openAddCompanyModal;
    window.closeAddCompanyModal = closeAddCompanyModal;
    window.formatCurrency = formatCurrency;
})();
