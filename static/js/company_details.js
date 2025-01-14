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
        location: null,
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
        elements.modal = document.getElementById('companyDetailsModal');
        if (!elements.modal) {
            console.error('Company detail modal not found');
            return;
        }

        elements.name = document.getElementById('modal-company-name');
        elements.industry = document.getElementById('modal-company-industry');
        elements.stage = document.getElementById('modal-company-stage');
        elements.rating = document.getElementById('modal-company-rating');
        elements.website = document.getElementById('modal-company-website');
        elements.email = document.getElementById('modal-company-email');
        elements.description = document.getElementById('modal-company-description');
        elements.location = document.getElementById('modal-company-location');
        elements.notes = document.getElementById('companyNotes');
        elements.modalClose = elements.modal.querySelector('.modal-close');
        elements.modalOverlay = elements.modal.querySelector('.modal-overlay');
        elements.deleteConfirmModal = document.getElementById('deleteConfirmModal');
        elements.deleteCompanyName = document.getElementById('deleteCompanyName');

        // Close modal when clicking outside
        document.addEventListener('click', function(event) {
            const modal = document.getElementById('companyDetailsModal');
            if (!modal) return;

            if (event.target === modal) {
                closeCompanyDetailModal();
            }
        });

        // Close modal when clicking close button
        const closeButtons = document.querySelectorAll('[data-bs-dismiss="modal"]');
        closeButtons.forEach(button => {
            button.addEventListener('click', closeCompanyDetailModal);
        });

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
        console.log('Opening company detail:', company);
        
        // Get the modal
        const modal = document.getElementById('companyDetailsModal');
        if (!modal) {
            console.error('Company detail modal not found');
            return;
        }

        try {
            // Store current company ID
            currentCompanyId = company.id;

            // Update modal content
            if (company.name) {
                const nameElement = document.getElementById('modal-company-name');
                if (nameElement) nameElement.textContent = company.name;
            }

            if (company.industry) {
                const industryElement = document.getElementById('modal-company-industry');
                if (industryElement) industryElement.textContent = company.industry;
            }

            if (company.stage) {
                const stageElement = document.getElementById('modal-company-stage');
                if (stageElement) stageElement.textContent = company.stage;
            }

            if (company.location) {
                const locationElement = document.getElementById('modal-company-location');
                if (locationElement) locationElement.textContent = company.location;
            }

            if (company.website) {
                const websiteElement = document.getElementById('modal-company-website');
                if (websiteElement) {
                    websiteElement.href = company.website;
                    websiteElement.textContent = company.website;
                }
            }

            if (company.email) {
                const emailElement = document.getElementById('modal-company-email');
                if (emailElement) {
                    emailElement.href = `mailto:${company.email}`;
                    emailElement.textContent = company.email;
                }
            }

            if (company.description) {
                const descElement = document.getElementById('modal-company-description');
                if (descElement) descElement.textContent = company.description;
            }

            if (company.rating) {
                const ratingElement = document.getElementById('modal-company-rating');
                if (ratingElement) ratingElement.textContent = company.rating;
            }

            // Load company notes
            const notes = localStorage.getItem(`company_notes_${company.id}`);
            const notesElement = document.getElementById('companyNotes');
            if (notesElement) {
                notesElement.value = notes || '';
            }

            // Show the modal
            modal.style.display = 'block';
            modal.classList.add('show');
            document.body.classList.add('modal-open');
            
            // Add backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            document.body.appendChild(backdrop);
        } catch (error) {
            console.error('Error updating modal content:', error);
        }
    }

    // Close company detail modal
    function closeCompanyDetailModal() {
        const modal = document.getElementById('companyDetailsModal');
        if (!modal) return;

        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        
        // Remove backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    }

    // Show delete confirmation
    function confirmDeleteCompany() {
        const modal = document.getElementById('deleteConfirmModal');
        const companyName = document.getElementById('modal-company-name');
        const deleteCompanyName = document.getElementById('deleteCompanyName');
        
        if (!modal || !companyName || !deleteCompanyName) return;
        
        // Update delete confirmation modal
        deleteCompanyName.textContent = companyName.textContent;
        
        // Hide company details modal
        closeCompanyDetailModal();
        
        // Show delete confirmation modal
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.classList.add('modal-open');
    }

    // Close delete confirmation modal
    function closeDeleteConfirmModal() {
        const modal = document.getElementById('deleteConfirmModal');
        if (!modal) return;

        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
    }

    // Delete company
    async function deleteCompany() {
        if (!currentCompanyId) {
            console.error('No company selected for deletion');
            return;
        }

        try {
            const response = await fetch(`/delete_company/${currentCompanyId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete company');

            const result = await response.json();
            console.log('Delete result:', result);

            // Remove the company row from the table
            const row = document.querySelector(`tr[data-company-id="${currentCompanyId}"]`);
            if (row) row.remove();

            // Close the modal
            closeDeleteConfirmModal();

            // Show success message
            showMessage('Company deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting company:', error);
            showMessage('Failed to delete company', 'error');
        }
    }

    // Save company notes
    function saveCompanyNotes() {
        if (!currentCompanyId) {
            console.error('No company selected for saving notes');
            return;
        }

        const notesElement = document.getElementById('companyNotes');
        if (!notesElement) return;

        // Save notes to local storage
        localStorage.setItem(`company_notes_${currentCompanyId}`, notesElement.value);
        showMessage('Notes saved successfully', 'success');
    }

    // Show message
    function showMessage(message, type = 'success') {
        const flashMessages = document.querySelector('.flash-messages');
        if (!flashMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type}`;
        messageDiv.textContent = message;

        flashMessages.appendChild(messageDiv);

        // Remove message after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // Expose functions to window
    window.openCompanyDetail = openCompanyDetail;
    window.closeCompanyDetailModal = closeCompanyDetailModal;
    window.saveCompanyNotes = saveCompanyNotes;
    window.confirmDeleteCompany = confirmDeleteCompany;
    window.closeDeleteConfirmModal = closeDeleteConfirmModal;
    window.deleteCompany = deleteCompany;
})();
