// Company Details Modal functionality
document.addEventListener('DOMContentLoaded', () => {
    const companyDetailModal = document.getElementById('companyDetailModal');
    if (!companyDetailModal) {
        console.error('Company detail modal not found');
        return;
    }

    const modalClose = companyDetailModal.querySelector('.modal-close');
    const modalOverlay = companyDetailModal.querySelector('.modal-overlay');

    window.openCompanyDetail = function(company) {
        console.log('Opening company detail:', company);
        
        // Update modal content
        const nameElement = document.getElementById('companyDetailName');
        if (nameElement) nameElement.textContent = company.name || '';
        
        const industryElement = document.getElementById('companyDetailIndustry');
        if (industryElement) industryElement.textContent = company.industry || '';
        
        const stageElement = document.getElementById('companyDetailStage');
        if (stageElement) stageElement.textContent = company.stage || '';
        
        // Set up rating badge
        const ratingSpan = document.getElementById('companyDetailRating');
        if (ratingSpan && company.rating) {
            ratingSpan.innerHTML = `<span class="rating-badge ${company.rating.toLowerCase()}">${company.rating}</span>`;
        }
        
        // Set up website
        const websiteSpan = document.getElementById('companyDetailWebsite');
        if (websiteSpan) {
            if (company.website) {
                websiteSpan.innerHTML = `<a href="${company.website}" target="_blank" rel="noopener noreferrer">${company.website}</a>`;
            } else {
                websiteSpan.textContent = 'Not provided';
            }
        }
        
        // Set up email
        const emailSpan = document.getElementById('companyDetailEmail');
        if (emailSpan) {
            if (company.email) {
                emailSpan.innerHTML = `<a href="mailto:${company.email}">${company.email}</a>`;
            } else {
                emailSpan.textContent = 'Not provided';
            }
        }
        
        // Set description
        const descriptionElement = document.getElementById('companyDetailDescription');
        if (descriptionElement) {
            descriptionElement.textContent = company.description || 'No description available';
        }
        
        // Load notes if they exist
        const notesTextarea = document.getElementById('companyNotes');
        if (notesTextarea) {
            const notes = localStorage.getItem(`company_notes_${company.id}`);
            notesTextarea.value = notes || '';
        }
        
        // Show modal
        companyDetailModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    };

    window.closeCompanyDetailModal = function() {
        companyDetailModal.style.display = 'none';
        document.body.style.overflow = '';
    };

    // Event listeners
    if (modalClose) modalClose.addEventListener('click', window.closeCompanyDetailModal);
    if (modalOverlay) modalOverlay.addEventListener('click', window.closeCompanyDetailModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && companyDetailModal.style.display === 'block') {
            window.closeCompanyDetailModal();
        }
    });
});
