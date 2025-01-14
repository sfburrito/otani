// Company Details Modal functionality
(function() {
    // Cache DOM elements
    const elements = {
        modal: null,
        name: null,
        industry: null,
        stage: null,
        rating: null,
        website: null,
        email: null,
        description: null,
        notes: null,
        modalClose: null,
        modalOverlay: null,
        deleteConfirmModal: null,
        deleteCompanyName: null
    };

    let currentCompanyId = null;

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        // Cache DOM elements
        elements.modal = document.getElementById('companyDetailModal');
        if (!elements.modal) {
            console.error('Company detail modal not found');
            return;
        }

        elements.name = document.getElementById('companyDetailName');
        elements.industry = document.getElementById('companyDetailIndustry');
        elements.stage = document.getElementById('companyDetailStage');
        elements.rating = document.getElementById('companyDetailRating');
        elements.website = document.getElementById('companyDetailWebsite');
        elements.email = document.getElementById('companyDetailEmail');
        elements.description = document.getElementById('companyDetailDescription');
        elements.notes = document.getElementById('companyNotes');
        elements.modalClose = elements.modal.querySelector('.modal-close');
        elements.modalOverlay = elements.modal.querySelector('.modal-overlay');
        elements.deleteConfirmModal = document.getElementById('deleteConfirmModal');
        elements.deleteCompanyName = document.getElementById('deleteCompanyName');

        // Use event delegation for modal clicks
        elements.modal.addEventListener('click', (e) => {
            if (e.target.matches('.modal-close, .modal-close *, .modal-overlay')) {
                closeCompanyDetailModal();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (elements.deleteConfirmModal.style.display === 'flex') {
                    closeDeleteConfirmModal();
                } else if (elements.modal.style.display === 'block') {
                    closeCompanyDetailModal();
                }
            }
        });
    });

    // Open company detail modal
    function openCompanyDetail(company) {
        if (!elements.modal || !company) return;
        console.log('Opening company detail:', company);

        currentCompanyId = company.id;

        // Update text content
        if (elements.name) elements.name.textContent = company.name || '';
        if (elements.industry) elements.industry.textContent = company.industry || '';
        if (elements.stage) elements.stage.textContent = company.stage || '';
        
        // Update rating badge
        if (elements.rating && company.rating) {
            elements.rating.innerHTML = `<span class="rating-badge ${company.rating.toLowerCase()}">${company.rating}</span>`;
        }
        
        // Update website link
        if (elements.website) {
            elements.website.innerHTML = company.website 
                ? `<a href="${company.website}" target="_blank" rel="noopener noreferrer">${company.website}</a>`
                : 'Not provided';
        }
        
        // Update email link
        if (elements.email) {
            elements.email.innerHTML = company.email
                ? `<a href="mailto:${company.email}">${company.email}</a>`
                : 'Not provided';
        }
        
        // Update description
        if (elements.description) {
            elements.description.textContent = company.description || 'No description available';
        }
        
        // Load notes
        if (elements.notes) {
            elements.notes.value = localStorage.getItem(`company_notes_${company.id}`) || '';
            elements.modal.dataset.companyId = company.id;
        }
        
        // Show modal
        elements.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // Close company detail modal
    function closeCompanyDetailModal() {
        if (!elements.modal) return;
        elements.modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    // Save company notes
    function saveCompanyNotes() {
        if (!elements.modal || !elements.notes) return;
        
        const companyId = elements.modal.dataset.companyId;
        const notes = elements.notes.value;
        
        localStorage.setItem(`company_notes_${companyId}`, notes);
        showMessage('Notes saved successfully');
    }

    // Show delete confirmation
    function confirmDeleteCompany() {
        if (!elements.deleteConfirmModal || !elements.deleteCompanyName || !elements.name) return;
        
        elements.deleteCompanyName.textContent = elements.name.textContent;
        elements.modal.style.display = 'none';
        elements.deleteConfirmModal.style.display = 'flex';
    }

    // Close delete confirmation
    function closeDeleteConfirmModal() {
        if (!elements.deleteConfirmModal) return;
        elements.deleteConfirmModal.style.display = 'none';
        elements.modal.style.display = 'block';
    }

    // Delete company
    function deleteCompany() {
        if (!currentCompanyId) return;

        fetch(`/delete_company/${currentCompanyId}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                // Close both modals
                elements.deleteConfirmModal.style.display = 'none';
                elements.modal.style.display = 'none';
                document.body.style.overflow = '';
                
                // Remove the company from the table
                const row = document.querySelector(`tr[data-company-id="${currentCompanyId}"]`);
                if (row) row.remove();
                
                // Show success message
                showMessage(data.message);
                
                // Reset current company ID
                currentCompanyId = null;
            } else if (data.error) {
                showMessage(data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Failed to delete company', 'error');
        });
    }

    // Show message
    function showMessage(message, type = 'success') {
        const flashMessages = document.querySelector('.flash-messages');
        if (!flashMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type}`;
        messageDiv.textContent = message;
        flashMessages.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 5000);
    }

    // Expose functions to window
    window.openCompanyDetail = openCompanyDetail;
    window.closeCompanyDetailModal = closeCompanyDetailModal;
    window.saveCompanyNotes = saveCompanyNotes;
    window.confirmDeleteCompany = confirmDeleteCompany;
    window.closeDeleteConfirmModal = closeDeleteConfirmModal;
    window.deleteCompany = deleteCompany;
})();
