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
            
            // Create row content with proper column widths and explicit styling for stage
            const rowContent = `
                <td class="company-name">
                    <span class="table-badge">${company.name || ''}</span>
                </td>
                <td class="company-industry">
                    <span class="table-badge">${company.industry || ''}</span>
                </td>
                <td class="company-stage" style="background: none !important;">
                    <span class="table-badge">${company.stage || ''}</span>
                </td>
                <td class="company-location">
                    <span class="table-badge">${company.location || ''}</span>
                </td>
                <td class="company-otani-rating">
                    <span class="rating-badge otani-rating-${(company.otani_rating || 'D').toLowerCase()}">${company.otani_rating || 'D'}</span>
                </td>
                <td class="company-rating">
                    <span class="rating-badge rating-${(company.rating || '').toLowerCase()}">${company.rating || ''}</span>
                </td>
                <td class="company-actions">
                    <div class="table-actions">
                        ${company.website ? `
                            <a href="${company.website}" 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               class="action-btn" 
                               onclick="event.stopPropagation()"
                               title="Visit Website">
                                <i class="fas fa-external-link-alt"></i>
                            </a>` : ''}
                        ${company.email ? `
                            <a href="mailto:${company.email}" 
                               class="action-btn" 
                               onclick="event.stopPropagation()"
                               title="Send Email">
                                <i class="fas fa-envelope"></i>
                            </a>` : ''}
                    </div>
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
