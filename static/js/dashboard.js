// Dashboard functionality
(function() {
    // Cache DOM elements
    const elements = {
        companiesTableBody: document.getElementById('companiesTableBody'),
        companySearch: document.getElementById('companySearch')
    };

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Initial companies:', window.companies);
        renderCompanies(window.companies);

        // Add search functionality
        if (elements.companySearch) {
            elements.companySearch.addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase();
                if (!window.companies) {
                    console.error('Companies data not available for search');
                    return;
                }
                const filteredCompanies = window.companies.filter(company => {
                    return (
                        company.name?.toLowerCase().includes(searchTerm) ||
                        company.industry?.toLowerCase().includes(searchTerm) ||
                        company.stage?.toLowerCase().includes(searchTerm) ||
                        company.location?.toLowerCase().includes(searchTerm)
                    );
                });
                renderCompanies(filteredCompanies);
            });
        }
    });

    // Render companies in the table
    function renderCompanies(companiesData) {
        console.log('Rendering companies:', companiesData);
        if (!elements.companiesTableBody) {
            console.error('Companies table body not found');
            return;
        }

        elements.companiesTableBody.innerHTML = '';

        if (!companiesData || companiesData.length === 0) {
            console.log('No companies to display');
            elements.companiesTableBody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="7" class="text-center py-4">
                        <p class="text-gray-500">No companies found. Add your first company to get started!</p>
                    </td>
                </tr>
            `;
            return;
        }

        companiesData.forEach(company => {
            console.log('Creating row for company:', company);
            const row = document.createElement('tr');
            row.className = 'clickable-row';
            row.dataset.companyId = company.id;
            row.onclick = () => window.openCompanyDetail?.(company);

            // Create the row HTML with debugging classes
            const rowHtml = `
                <td class="company-name text-left">${company.name || ''}</td>
                <td class="company-industry text-left">
                    <span class="table-badge badge-debug">${company.industry || ''}</span>
                </td>
                <td class="company-stage text-left">
                    <span class="table-badge badge-debug">${company.stage || ''}</span>
                </td>
                <td class="company-location text-left">
                    <span class="table-badge badge-debug">${company.location || ''}</span>
                </td>
                <td class="company-otani-rating text-center">
                    <span class="rating-badge otani-rating-${company.otani_rating?.toLowerCase() || 'd'} rating-debug">${company.otani_rating || 'D'}</span>
                </td>
                <td class="company-rating text-center">
                    <span class="rating-badge rating-${company.rating?.toLowerCase() || ''} rating-debug">${company.rating || ''}</span>
                </td>
                <td class="company-actions text-center">
                    <div class="table-actions">
                        ${company.website ? `<a href="${company.website}" target="_blank" rel="noopener noreferrer" class="action-btn action-debug" onclick="event.stopPropagation()"><i class="fas fa-external-link-alt"></i></a>` : ''}
                        ${company.email ? `<a href="mailto:${company.email}" class="action-btn action-debug" onclick="event.stopPropagation()"><i class="fas fa-envelope"></i></a>` : ''}
                    </div>
                </td>
            `;

            // Log the generated HTML for debugging
            console.log('Generated row HTML:', rowHtml);

            row.innerHTML = rowHtml;
            elements.companiesTableBody.appendChild(row);

            // Log applied styles for debugging
            const badges = row.querySelectorAll('.badge-debug');
            badges.forEach(badge => {
                console.log('Badge computed styles:', window.getComputedStyle(badge));
            });

            const ratings = row.querySelectorAll('.rating-debug');
            ratings.forEach(rating => {
                console.log('Rating computed styles:', window.getComputedStyle(rating));
            });

            const actions = row.querySelectorAll('.action-debug');
            actions.forEach(action => {
                console.log('Action computed styles:', window.getComputedStyle(action));
            });
        });
    }

    // Expose functions to window
    window.renderCompanies = renderCompanies;
})();
