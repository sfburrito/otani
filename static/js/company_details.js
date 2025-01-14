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

        // Initialize Bootstrap modal
        new bootstrap.Modal(elements.modal);

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
        const modal = document.getElementById('companyDetailsModal');
        if (!modal) return;

        currentCompanyId = company.id;

        // Update modal content
        elements.name.textContent = company.name || '';
        elements.industry.textContent = company.industry || '';
        elements.stage.textContent = company.stage || '';
        elements.location.textContent = company.location || 'Location not specified';
        elements.description.textContent = company.description || '';

        // Update rating
        if (company.rating) {
            elements.rating.innerHTML = `<span class="rating-badge ${company.rating.toLowerCase()}">${company.rating}</span>`;
        } else {
            elements.rating.innerHTML = '';
        }

        // Update website
        if (company.website) {
            elements.website.href = company.website;
            elements.website.textContent = company.website;
        } else {
            elements.website.textContent = 'Not provided';
        }

        // Update email
        if (company.email) {
            elements.email.href = `mailto:${company.email}`;
            elements.email.textContent = company.email;
        } else {
            elements.email.textContent = 'Not provided';
        }

        // Update timestamps
        const created = new Date(company.created_at);
        const updated = new Date(company.updated_at);
        elements.modal.querySelector('.company-created').textContent = created.toLocaleString();
        elements.modal.querySelector('.company-updated').textContent = updated.toLocaleString();

        // Store company ID for delete operation
        elements.modal.dataset.companyId = company.id;

        // Show modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
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
    async function deleteCompany() {
        const modal = document.getElementById('companyDetailsModal');
        if (!modal) return;

        const companyId = modal.dataset.companyId;
        if (!companyId) return;

        if (!confirm('Are you sure you want to delete this company?')) return;

        try {
            const response = await fetch(`/delete_company/${companyId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete company');

            const result = await response.json();

            // Remove the company row from the table
            const row = document.querySelector(`tr[data-company-id="${companyId}"]`);
            if (row) row.remove();

            // Close the modal
            closeCompanyDetailModal();

            // Show success message
            const event = new CustomEvent('showMessage', {
                detail: {
                    message: 'Company deleted successfully',
                    type: 'success'
                }
            });
            document.dispatchEvent(event);

        } catch (error) {
            console.error('Error deleting company:', error);
            const event = new CustomEvent('showMessage', {
                detail: {
                    message: 'Failed to delete company',
                    type: 'error'
                }
            });
            document.dispatchEvent(event);
        }
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

    // Close modal when clicking outside
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('companyDetailsModal');
        if (!modal) return;

        if (event.target.matches('.modal-overlay')) {
            closeCompanyDetailModal();
        }
    });

    // Close modal with escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeCompanyDetailModal();
        }
    });
})();
