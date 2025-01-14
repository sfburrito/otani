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
            <td class="company-name text-left">${company.name || ''}</td>
            <td class="company-industry text-left"><span class="table-badge">${company.industry || ''}</span></td>
            <td class="company-stage text-left"><span class="table-badge">${company.stage || ''}</span></td>
            <td class="company-location text-left"><span class="table-badge">${company.location || ''}</span></td>
            <td class="company-otani-rating text-center">
                <span class="rating-badge otani-rating-${company.otani_rating?.toLowerCase() || 'd'}">${company.otani_rating || 'D'}</span>
            </td>
            <td class="company-rating text-center">
                <span class="rating-badge rating-${company.rating?.toLowerCase() || ''}">${company.rating || ''}</span>
            </td>
            <td class="company-actions text-center">
                <div class="table-actions">
                    ${company.website ? `<a href="${company.website}" target="_blank" rel="noopener noreferrer" class="action-btn" onclick="event.stopPropagation()"><i class="fas fa-external-link-alt"></i></a>` : ''}
                    ${company.email ? `<a href="mailto:${company.email}" class="action-btn" onclick="event.stopPropagation()"><i class="fas fa-envelope"></i></a>` : ''}
                </div>
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
        event.preventDefault();
        debugLog('Form submission started');
        
        if (isSubmitting) {
            debugLog('Already submitting, preventing duplicate submission');
            return;
        }
        
        const currentTime = Date.now();
        if (currentTime - lastSubmissionTime < DEBOUNCE_DELAY) {
            debugLog('Submission too soon after last submission, preventing');
            showMessage('Please wait a moment before submitting again', 'warning');
            return;
        }
        
        isSubmitting = true;
        submitCount++;
        const currentSubmitCount = submitCount;
        debugLog(`Submit attempt #${currentSubmitCount}`);
        
        try {
            const formData = {
                name: elements.addCompanyForm.querySelector('#name').value,
                industry: elements.addCompanyForm.querySelector('#industry').value,
                stage: elements.addCompanyForm.querySelector('#stage').value,
                location: elements.addCompanyForm.querySelector('#location').value,
                website: elements.addCompanyForm.querySelector('#website').value,
                email: elements.addCompanyForm.querySelector('#email').value,
                description: elements.addCompanyForm.querySelector('#description').value,
                rating: elements.addCompanyForm.querySelector('#rating').value
            };
            
            debugLog('Form data:', formData);
            
            const response = await fetch('/add_company', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            debugLog('Server response:', data);
            
            if (response.ok) {
                if (data.message === "Company already added") {
                    showMessage('This company was already added', 'warning');
                } else {
                    showMessage('Company added successfully', 'success');
                    addCompanyToTable(data.company);
                    closeAddCompanyModal();
                    elements.addCompanyForm.reset();
                }
            } else {
                showMessage(data.error || 'Failed to add company', 'error');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showMessage('An error occurred while adding the company', 'error');
        } finally {
            isSubmitting = false;
            lastSubmissionTime = Date.now();
            debugLog(`Submit attempt #${currentSubmitCount} completed`);
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

            // Handle form submission
            elements.addCompanyForm.addEventListener('submit', handleSubmit);
            debugLog('Form submit handler attached');
        }

        // Add click handler for the submit button since it's outside the form
        if (elements.addCompanyButton) {
            elements.addCompanyButton.addEventListener('click', () => {
                debugLog('Add company button clicked');
                if (elements.addCompanyForm) {
                    // Trigger form submission
                    const submitEvent = new Event('submit', {
                        bubbles: true,
                        cancelable: true
                    });
                    elements.addCompanyForm.dispatchEvent(submitEvent);
                }
            });
            debugLog('Button click handler attached');
        }

        debugLog('Initialization complete');
    });

    // Expose functions to window
    window.openAddCompanyModal = openAddCompanyModal;
    window.closeAddCompanyModal = closeAddCompanyModal;
    window.formatCurrency = formatCurrency;
})();
