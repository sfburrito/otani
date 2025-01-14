// Dashboard functionality
(function() {
    // Cache DOM elements
    const elements = {
        companiesTableBody: document.getElementById('companiesTableBody'),
        companySearch: document.getElementById('companySearch')
    };

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Initial companies:', companies);
        renderCompanies(companies);

        // Add search functionality
        if (elements.companySearch) {
            elements.companySearch.addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase();
                const filteredCompanies = companies.filter(company => {
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
        if (!elements.companiesTableBody) return;

        elements.companiesTableBody.innerHTML = '';

        if (!companiesData || companiesData.length === 0) {
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

            row.innerHTML = `
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

            elements.companiesTableBody.appendChild(row);
        });
    }

    // Expose functions to window
    window.renderCompanies = renderCompanies;
})();
