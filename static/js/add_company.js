// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal-overlay')) {
        const modal = event.target.closest('.modal');
        closeModal(modal.id);
    }
});

// Function to add a new company row to the table
function addCompanyToTable(company) {
    console.log('Adding company to table:', company);
    const tbody = document.querySelector('.companies-table tbody');
    const newRow = document.createElement('tr');
    newRow.className = 'clickable-row';
    newRow.onclick = function() {
        console.log('Row clicked:', company);
        openCompanyDetail(company);
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
            closeModal('addCompanyModal');

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

// Company Detail Modal Functions
function openCompanyDetail(company) {
    console.log('Opening company detail:', company);
    
    // Update modal content
    document.getElementById('companyDetailName').textContent = company.name;
    document.getElementById('companyDetailIndustry').textContent = company.industry;
    document.getElementById('companyDetailStage').textContent = company.stage;
    
    // Set up rating badge
    const ratingSpan = document.getElementById('companyDetailRating');
    ratingSpan.innerHTML = `<span class="rating-badge ${company.rating.toLowerCase()}">${company.rating}</span>`;
    
    // Set up links
    const websiteLink = document.getElementById('companyDetailWebsite');
    if (company.website) {
        websiteLink.href = company.website;
        websiteLink.textContent = company.website;
        websiteLink.classList.remove('hidden');
    } else {
        websiteLink.classList.add('hidden');
    }
    
    const emailLink = document.getElementById('companyDetailEmail');
    if (company.email) {
        emailLink.href = `mailto:${company.email}`;
        emailLink.textContent = company.email;
        emailLink.classList.remove('hidden');
    } else {
        emailLink.classList.add('hidden');
    }
    
    // Set description
    document.getElementById('companyDetailDescription').textContent = company.description || '';
    
    // Load notes if they exist
    const notes = localStorage.getItem(`company_notes_${company.id}`);
    document.getElementById('companyNotes').value = notes || '';
    
    // Store current company ID for notes saving
    document.getElementById('companyDetailModal').dataset.companyId = company.id;
    
    // Show modal
    openModal('companyDetailModal');
}

function closeCompanyDetailModal() {
    closeModal('companyDetailModal');
}

function saveCompanyNotes() {
    const modal = document.getElementById('companyDetailModal');
    const companyId = modal.dataset.companyId;
    const notes = document.getElementById('companyNotes').value;
    
    // Save to localStorage
    localStorage.setItem(`company_notes_${companyId}`, notes);
    
    // Show success message
    showSuccessMessage('Notes saved successfully');
}

// Initialize modals when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize close buttons
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // Initialize the form
    initializeForm();
});
