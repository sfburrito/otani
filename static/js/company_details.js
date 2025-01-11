// Company Details Modal functionality
document.addEventListener('DOMContentLoaded', () => {
    const companyDetailsModal = document.getElementById('companyDetailsModal');
    const modalClose = companyDetailsModal.querySelector('.modal-close');
    const modalOverlay = companyDetailsModal.querySelector('.modal-overlay');
    let activeModal = null;

    window.openCompanyDetails = function(companyName) {
        document.body.classList.add('modal-open');
        companyDetailsModal.classList.add('active');
        activeModal = companyDetailsModal;
        
        // Set modal title
        document.getElementById('modalTitle').textContent = companyName;
        
        // Focus management
        const firstFocusable = companyDetailsModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    };

    window.closeModal = function() {
        if (activeModal) {
            document.body.classList.remove('modal-open');
            activeModal.classList.remove('active');
            activeModal = null;
        }
    };

    // Event listeners
    modalClose.addEventListener('click', window.closeModal);
    modalOverlay.addEventListener('click', window.closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeModal) {
            window.closeModal();
        }
    });

    // Focus trap
    companyDetailsModal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            const focusable = companyDetailsModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const firstFocusable = focusable[0];
            const lastFocusable = focusable[focusable.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    e.preventDefault();
                }
            }
        }
    });

    // Initialize table row clicks
    const rows = document.querySelectorAll('#companiesTableBody tr');
    rows.forEach(row => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => {
            const companyName = row.querySelector('td:nth-child(2)').textContent;
            window.openCompanyDetails(companyName);
        });
    });
});
