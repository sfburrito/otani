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

        // Add sorting functionality
        initializeSorting();
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
                    <td colspan="6" class="text-center py-4">
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
            row.setAttribute('data-company-id', company.id);
            
            // Create row content with minimal structure
            const rowContent = `
                <td><div class="text-badge">${company.name || ''}</div></td>
                <td><div class="text-badge">${company.industry || ''}</div></td>
                <td><div class="text-badge">${company.stage || ''}</div></td>
                <td><div class="text-badge">${company.location || ''}</div></td>
                <td><div class="rating-badge otani-rating-${(company.otani_rating || 'D').toLowerCase()}">${company.otani_rating || 'D'}</div></td>
                <td><div class="rating-badge rating-${(company.rating || '').toLowerCase()}">${company.rating || ''}</div></td>
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

    // Add sorting functionality
    function initializeSorting() {
        const headers = document.querySelectorAll('.companies-table th[data-column]');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.column;
                const currentSort = header.getAttribute('aria-sort');
                
                // Reset all other headers
                headers.forEach(h => h.setAttribute('aria-sort', 'none'));
                
                // Toggle sort direction
                const newSort = currentSort === 'ascending' ? 'descending' : 'ascending';
                header.setAttribute('aria-sort', newSort);
                
                // Sort the table
                sortTable(column, newSort === 'ascending');
            });
        });
    }

    // Sort table data
    function sortTable(column, ascending) {
        const tbody = document.getElementById('companiesTableBody');
        const rows = Array.from(tbody.getElementsByTagName('tr'));
        
        rows.sort((a, b) => {
            const aValue = getCellValue(a, column);
            const bValue = getCellValue(b, column);
            
            if (aValue === bValue) return 0;
            if (ascending) {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
        
        // Clear and re-append rows
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        rows.forEach(row => tbody.appendChild(row));
    }

    // Helper to get cell value for sorting
    function getCellValue(row, column) {
        const columnIndex = {
            'name': 0,
            'industry': 1,
            'stage': 2,
            'location': 3,
            'otani_rating': 4,
            'rating': 5
        }[column];
        
        if (columnIndex === undefined) return '';
        
        const cell = row.cells[columnIndex];
        const badge = cell.querySelector('.text-badge, .rating-badge');
        return badge ? badge.textContent.trim().toLowerCase() : '';
    }

    // Expose functions to window
    window.initDashboard = initDashboard;
    window.renderCompanies = renderCompanies;
})();

// Initialize sorting when table is populated
document.addEventListener('DOMContentLoaded', () => {
    // No need to call initializeSorting here, it's already called in initDashboard
});
