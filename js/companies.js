/**
 * Otani Companies Module
 * Handles company management functionality including:
 * - Company listing
 * - Adding new companies
 * - Modal interactions
 * - Form submission
 * 
 * @module companies
 */

// Debug mode flag for development logging
const DEBUG = false;

// Add this near the top with other constants
const PERPLEXITY_API_KEY = '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';

// Utility function for controlled logging
const log = (message, type = 'info') => {
    if (DEBUG || type === 'error') {
        console[type](message);
    }
};

// DOM Element Selectors
const SELECTORS = {
    modal: '#addCompanyModal',
    form: '#addCompanyForm',
    table: '.companies-table tbody',
    addButton: '.add-company-button',
    cancelButton: '#cancelButton',
    submitButton: 'button[type="submit"]'
};

// Initialize companies list from localStorage
let companiesList = JSON.parse(localStorage.getItem('companiesList')) || [];
let currentCompanyIndex = -1;

/**
 * Main initialization function
 * Sets up all event handlers and loads initial data
 */
const initializeOtani = () => {
    loadCompanies();
    
    // Add Company button event listener
    const addButton = document.querySelector('.add-company-button');
    if (addButton) {
        addButton.addEventListener('click', () => {
            const modal = document.getElementById('addCompanyModal');
            if (modal) {
                modal.removeAttribute('hidden');
            }
        });
    }
    
    // Set up event listeners for the add company form
    const addForm = document.getElementById('addCompanyForm');
    if (addForm) {
        addForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Set up event listeners for the edit company form
    const editForm = document.getElementById('editCompanyForm');
    if (editForm) {
        editForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log('Edit form submitted'); // Debug log
            
            if (currentCompanyIndex >= 0) {
                const form = event.target;
                const submitButton = form.querySelector('button[type="submit"]');
                
                // Disable submit button and show loading state
                submitButton.disabled = true;
                submitButton.textContent = 'Saving...';
                
                try {
                    // Get investor preferences
                    const preferences = JSON.parse(localStorage.getItem('investorPreferences')) || {
                        industry: [],
                        stage: [],
                        location: [],
                        additional_info: ''
                    };

                    // Update company details
                    const updatedCompany = {
                        ...companiesList[currentCompanyIndex],
                        company_name: form.companyName.value,
                        website: form.website.value,
                        industry: form.industry.value,
                        stage: form.stage.value,
                        location: form.location.value,
                        your_rating: form.rating.value,
                        additional_info: form.additionalInfo.value,
                        otani_rating: 'Loading...',
                        why: 'Updating...'
                    };

                    console.log('Updating company:', updatedCompany); // Debug log

                    // Save initial update to show loading state
                    companiesList[currentCompanyIndex] = updatedCompany;
                    localStorage.setItem('companiesList', JSON.stringify(companiesList));
                    loadCompanies();

                    // Get new Otani rating
                    const otaniResponse = await getOtaniRating(updatedCompany, preferences);
                    
                    // Update with new rating and explanation
                    updatedCompany.otani_rating = otaniResponse.rating;
                    updatedCompany.why = otaniResponse.explanation;
                    
                    // Save final update
                    companiesList[currentCompanyIndex] = updatedCompany;
                    localStorage.setItem('companiesList', JSON.stringify(companiesList));
                    loadCompanies();
                    
                    // Close modal
                    closeDetailsModal();

                } catch (error) {
                    console.error('Error updating company:', error);
                    alert('Failed to update company');
                } finally {
                    // Reset button state
                    submitButton.disabled = false;
                    submitButton.textContent = 'Save Changes';
                }
            }
        });
    } else {
        console.error('Edit form not found'); // Debug log
    }
};

/**
 * Initializes modal functionality
 * Handles opening and closing of the add company modal
 */
const initializeModal = () => {
    const modal = document.querySelector(SELECTORS.modal);
    const addButton = document.querySelector(SELECTORS.addButton);
    const cancelButton = document.querySelector(SELECTORS.cancelButton);

    if (!modal || !addButton || !cancelButton) {
        log('Modal elements not found', 'error');
        return;
    }

    addButton.addEventListener('click', () => modal.removeAttribute('hidden'));
    cancelButton.addEventListener('click', () => modal.setAttribute('hidden', ''));
};

/**
 * Get Otani rating and explanation from Perplexity API
 */
const getOtaniRating = async (company, preferences) => {
    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
            },
            body: JSON.stringify({
                model: "sonar-pro",
                messages: [
                    {
                        role: "system",
                        content: `You are Otani, an AI that rates companies based on investor preferences. 
                                First provide a letter grade (A, B, C, or D) where A is the best match.
                                Then provide a brief 1-2 sentence explanation of the rating.
                                Format response exactly as: "RATING: [letter]\nWHY: [explanation]"`
                    },
                    {
                        role: "user",
                        content: `Rate this company based on the investor's preferences:
                                
                                Company Details:
                                - Name: ${company.company_name}
                                - Industry: ${company.industry}
                                - Stage: ${company.stage}
                                - Location: ${company.location}
                                - Status: ${company.status}
                                - Additional Info: ${company.additional_info || 'None provided'}
                                
                                Status Meanings:
                                - "Active" means the company is under initial review (neutral)
                                - "Pass" means the investor has decided not to invest (negative signal)
                                - "Invested" means the investor has invested (positive signal)
                                
                                Investor Preferences:
                                - Industries: ${preferences.industry.join(', ')}
                                - Stages: ${preferences.stage.join(', ')}
                                - Locations: ${preferences.location.join(', ')}
                                - Additional Info: ${preferences.additional_info}
                                
                                Consider the company's status when rating, but remember that "Active" is neutral.
                                Favor patterns similar to "Invested" companies and avoid patterns similar to "Pass" companies.
                                
                                Provide rating and explanation in the specified format.`
                    }
                ]
            })
        });

        const data = await response.json();
        const response_text = data.choices[0].message.content.trim();
        
        // Parse rating and explanation
        const rating_match = response_text.match(/RATING:\s*([ABCD])/i);
        const why_match = response_text.match(/WHY:\s*(.+)$/is);
        
        const rating = rating_match ? rating_match[1].toUpperCase() : 'C';
        const explanation = why_match ? why_match[1].trim() : 'No explanation provided';
        
        return {
            rating: rating,
            explanation: explanation
        };

    } catch (error) {
        console.error('Error getting Otani rating:', error);
        return {
            rating: 'C',
            explanation: 'Error getting AI response'
        };
    }
};

/**
 * Handle form submission with Otani rating and explanation
 */
const handleFormSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector(SELECTORS.submitButton);
    
    if (!submitButton) return;

    submitButton.disabled = true;
    submitButton.textContent = 'Adding...';

    try {
        // Get investor preferences
        const preferences = JSON.parse(localStorage.getItem('investorPreferences')) || {
            industry: [],
            stage: [],
            location: [],
            additional_info: ''
        };

        // Create new company object
        const newCompany = {
            company_name: form.companyName.value,
            website: form.website.value,
            industry: form.industry.value,
            stage: form.stage.value,
            location: form.location.value,
            your_rating: form.rating.value,
            additional_info: form.additionalInfo.value,
            otani_rating: 'Loading...',
            why: 'Loading...'
        };

        // Add company to list and update display
        companiesList.push(newCompany);
        localStorage.setItem('companiesList', JSON.stringify(companiesList));
        loadCompanies();

        // Close modal and reset form
        document.querySelector(SELECTORS.modal).setAttribute('hidden', '');
        form.reset();

        // Get and update Otani rating and explanation
        const otaniResponse = await getOtaniRating(newCompany, preferences);
        newCompany.otani_rating = otaniResponse.rating;
        newCompany.why = otaniResponse.explanation;
        
        // Update storage and display
        localStorage.setItem('companiesList', JSON.stringify(companiesList));
        loadCompanies();

    } catch (error) {
        console.error('Error saving company:', error);
        alert('Failed to add company');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
    }
};

/**
 * Loads and displays companies in the table
 */
const loadCompanies = () => {
    const tbody = document.querySelector(SELECTORS.table);
    if (!tbody) {
        log('Companies table body not found', 'error');
        return;
    }

    tbody.innerHTML = '';
    companiesList.forEach((company, index) => {
        tbody.appendChild(createCompanyRow(company, index));
    });
};

/**
 * Creates a table row for a company
 * @param {Object} company - Company data object
 * @param {Number} index - Index of the company in the list
 * @returns {HTMLElement} Table row element
 */
const createCompanyRow = (company, index) => {
    const row = document.createElement('tr');
    row.onclick = () => openDetailsModal(index);
    
    // Create cells for each company property
    const cells = [
        { text: company.company_name, class: '' },
        { isStatus: true, status: company.status, index: index },
        { text: company.your_rating, class: `rating-${company.your_rating.toLowerCase()}` },
        { text: company.otani_rating || 'N/A', class: company.otani_rating ? `rating-${company.otani_rating.toLowerCase()}` : '' },
        { text: company.why || '', class: 'why-column' }
    ];
    
    // Create and append cells
    cells.forEach(({ text, class: className, isStatus, status, index }) => {
        const td = document.createElement('td');
        if (className) {
            td.className = className;
        }
        
        if (isStatus) {
            // Stop the row click event when clicking the status select
            td.onclick = (e) => e.stopPropagation();
            
            const select = document.createElement('select');
            select.className = 'status-select';
            select.innerHTML = `
                <option value="Active" ${status === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Pass" ${status === 'Pass' ? 'selected' : ''}>Pass</option>
                <option value="Invested" ${status === 'Invested' ? 'selected' : ''}>Invested</option>
            `;
            
            select.addEventListener('change', async (e) => {
                const newStatus = e.target.value;
                companiesList[index].status = newStatus;
                
                // Update localStorage
                localStorage.setItem('companiesList', JSON.stringify(companiesList));
                
                // Get new Otani rating based on updated status
                const preferences = JSON.parse(localStorage.getItem('investorPreferences')) || {
                    industry: [],
                    stage: [],
                    location: [],
                    additional_info: ''
                };
                
                const otaniResponse = await getOtaniRating(companiesList[index], preferences);
                companiesList[index].otani_rating = otaniResponse.rating;
                companiesList[index].why = otaniResponse.explanation;
                
                // Save and reload
                localStorage.setItem('companiesList', JSON.stringify(companiesList));
                loadCompanies();
            });
            
            td.appendChild(select);
        } else {
            td.textContent = text;
        }
        
        row.appendChild(td);
    });
    
    return row;
};

const fetchCompanyDetails = async (company) => {
    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
            },
            body: JSON.stringify({
                model: "sonar-pro",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful AI that provides company information in a structured format. Provide information without citations or reference numbers. Use clear, direct statements."
                    },
                    {
                        role: "user",
                        content: `Please provide publicly available information about ${company.company_name} (${company.website}) without any citations or reference numbers in the text. Format the response exactly as:
                            DESCRIPTION: Brief overview of what they do in 2-3 sentences.
                            FOUNDERS: Key team members and their backgrounds in 1-2 sentences.
                            MARKET: Addressable market size for ${company.industry} in 1-2 sentences.
                            COMPETITION: Main competitors in 1-2 sentences.
                            BUSINESS: Business model and revenue streams in 1-2 sentences.
                            
                            Keep responses concise and avoid any [1], [2], or similar citations in the text.`
                    }
                ]
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error fetching company details:', error);
        return null;
    }
};

const openDetailsModal = async (index) => {
    currentCompanyIndex = index;
    const company = companiesList[index];
    const modal = document.getElementById('companyDetailsModal');
    
    // Fill form with company details
    document.getElementById('editCompanyName').value = company.company_name;
    document.getElementById('editWebsite').value = company.website;
    document.getElementById('editIndustry').value = company.industry;
    document.getElementById('editStage').value = company.stage;
    document.getElementById('editLocation').value = company.location;
    document.getElementById('editRating').value = company.your_rating;
    document.getElementById('editAdditionalInfo').value = company.additional_info || '';
    
    // Show the modal
    modal.removeAttribute('hidden');
    
    // Check if we already have the company details
    if (!company.perplexityDetails) {
        // Show loading state
        document.querySelectorAll('.detail-content').forEach(section => {
            section.innerHTML = '<p class="detail-placeholder">Loading...</p>';
        });
        
        // Fetch details if we don't have them
        const details = await fetchCompanyDetails(company);
        if (details) {
            // Store the details in the company object
            company.perplexityDetails = details;
            companiesList[index] = company;
            localStorage.setItem('companiesList', JSON.stringify(companiesList));
        }
    }
    
    // Populate sections with stored details
    if (company.perplexityDetails) {
        const sections = company.perplexityDetails.split('\n');
        sections.forEach(section => {
            const [type, content] = section.split(': ');
            const sectionElement = document.querySelector(`.detail-section[data-type="${type.toLowerCase()}"] .detail-content`);
            if (sectionElement) {
                sectionElement.innerHTML = `<p>${content}</p>`;
            }
        });
    }
};

const closeDetailsModal = () => {
    document.getElementById('companyDetailsModal').setAttribute('hidden', '');
    currentCompanyIndex = -1;
};

const deleteCompany = () => {
    if (currentCompanyIndex >= 0) {
        if (confirm('Are you sure you want to delete this company?')) {
            companiesList.splice(currentCompanyIndex, 1);
            localStorage.setItem('companiesList', JSON.stringify(companiesList));
            loadCompanies();
            closeDetailsModal();
        }
    }
};

// Add these helper functions if they're not already present
const openAddModal = () => {
    const modal = document.getElementById('addCompanyModal');
    if (modal) {
        modal.removeAttribute('hidden');
    }
};

const closeAddModal = () => {
    const modal = document.getElementById('addCompanyModal');
    if (modal) {
        modal.setAttribute('hidden', '');
        // Reset form
        const form = document.getElementById('addCompanyForm');
        if (form) {
            form.reset();
        }
    }
};

// Make sure this function is available globally
window.closeAddModal = closeAddModal;

// Initialize only after content is loaded
document.addEventListener('DOMContentLoaded', initializeOtani);
