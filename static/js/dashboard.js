// Dashboard functionality
(function() {
    let companiesTableBody = null;
    let companySearch = null;

    // Initialize the dashboard
    function initDashboard(companies) {
        console.log('Initializing dashboard with companies:', companies);
        
        // Cache DOM elements
        companiesTableBody = document.getElementById('companiesTableBody');
        companySearch = document.getElementById('companySearch');

        if (!companiesTableBody) {
            console.error('Companies table body not found');
            return;
        }

        // Store companies globally
        window.companies = companies;

        // Render the initial companies
        renderCompanies(companies);

        // Add search functionality
        if (companySearch) {
            companySearch.addEventListener('input', function(e) {
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
    }

    // Render companies in the table
    function renderCompanies(companiesData) {
        console.log('Rendering companies:', companiesData);
        
        // Re-check table body in case it was not available earlier
        if (!companiesTableBody) {
            companiesTableBody = document.getElementById('companiesTableBody');
        }
        
        if (!companiesTableBody) {
            console.error('Companies table body still not found');
            return;
        }

        // Clear existing content
        companiesTableBody.innerHTML = '';

        if (!companiesData || companiesData.length === 0) {
            console.log('No companies to display');
            companiesTableBody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="7" class="text-center py-4">
                        <p class="text-gray-500">No companies found. Add your first company to get started!</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Create and append each row
        companiesData.forEach(company => {
            console.log('Creating row for company:', company);
            const row = document.createElement('tr');
            row.className = 'company-row';
            row.setAttribute('data-company-id', company.id);
            
            // Create row content with simpler structure
            const rowContent = `
                <td class="col-name"><div class="text-badge">${company.name || ''}</div></td>
                <td class="col-industry"><div class="text-badge">${company.industry || ''}</div></td>
                <td class="col-stage"><div class="text-badge">${company.stage || ''}</div></td>
                <td class="col-location"><div class="text-badge">${company.location || ''}</div></td>
                <td class="col-otani-rating"><div class="rating-badge otani-rating-${(company.otani_rating || 'D').toLowerCase()}">${company.otani_rating || 'D'}</div></td>
                <td class="col-rating"><div class="rating-badge rating-${(company.rating || '').toLowerCase()}">${company.rating || ''}</div></td>
                <td class="col-actions">
                    <button class="action-btn" onclick="openCompanyDetails('${company.id}')">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                </td>
            `;

            // Set the row content
            row.innerHTML = rowContent;

            // Add click handler
            row.addEventListener('click', () => {
                console.log('Row clicked:', company);
                if (typeof window.openCompanyDetail === 'function') {
                    window.openCompanyDetail(company);
                } else {
                    console.error('openCompanyDetail function not found');
                }
            });

            // Add the row to the table
            companiesTableBody.appendChild(row);
        });
    }

    // Expose functions to window
    window.initDashboard = initDashboard;
    window.renderCompanies = renderCompanies;
})();
