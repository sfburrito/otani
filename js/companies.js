/**
 * Otani Companies Module
 * 
 * Core functionality for managing company portfolio including:
 * - Company listing and table management
 * - Adding and editing companies
 * - Status management and updates
 * - AI-powered company ratings and analysis
 * - Company details fetching and caching
 * 
 * @module companies
 * @requires localStorage
 * @requires perplexity-api
 */

// Configuration Constants
const CONFIG = {
    DEBUG: false,
    PERPLEXITY_API_KEY: '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',
    STORAGE_KEYS: {
        COMPANIES: 'companiesList',
        PREFERENCES: 'investorPreferences'
    },
    DEFAULT_PREFERENCES: {
        industry: [],
        stage: [],
        location: [],
        additional_info: ''
    }
};

// DOM Element Selectors (centralized for maintainability)
const SELECTORS = {
    modals: {
        add: '#addCompanyModal',
        details: '#companyDetailsModal'
    },
    forms: {
        add: '#addCompanyForm',
        edit: '#editCompanyForm'
    },
    table: {
        body: '#companiesTableBody',
        addButton: '.add-company-button'
    },
    buttons: {
        cancel: '#cancelButton',
        submit: 'button[type="submit"]',
        delete: '.delete-button'
    },
    details: {
        content: '.detail-content',
        rating: '.section-rating',
        placeholder: '.detail-placeholder'
    }
};

// Initialize state
let companiesList = [];
let currentCompanyIndex = -1;

/**
 * Utility function for controlled logging
 * @param {string} message - Message to log
 * @param {string} [type='info'] - Type of log ('info', 'error', etc.)
 */
const log = (message, type = 'info') => {
    if (CONFIG.DEBUG || type === 'error') {
        console[type](message);
    }
};

/**
 * Gets preferences from localStorage with fallback to defaults
 * @returns {Object} Investor preferences
 */
const getPreferences = () => {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PREFERENCES)) || CONFIG.DEFAULT_PREFERENCES;
};

/**
 * Saves companies list to localStorage
 */
const saveCompanies = () => {
    localStorage.setItem(CONFIG.STORAGE_KEYS.COMPANIES, JSON.stringify(companiesList));
};

/**
 * Main initialization function
 * Sets up all event handlers and loads initial data
 */
const initializeOtani = () => {
    console.log('Starting Otani initialization...');
    
    // Load initial data
    companiesList = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.COMPANIES)) || [];
    console.log(`Loaded ${companiesList.length} companies from storage`);
    
    // Initialize table
    const tbody = document.getElementById('companiesTableBody');
    if (!tbody) {
        console.error('Companies table body not found. Make sure the table exists with id="companiesTableBody"');
        return;
    }
    
    // Initialize components
    loadCompanies();
    
    // Initialize forms
    const addForm = document.getElementById('addCompanyForm');
    const editForm = document.getElementById('editCompanyForm');
    
    if (addForm) {
        initializeAddCompany();
    } else {
        console.warn('Add company form not found');
    }
    
    if (editForm) {
        initializeEditCompany();
    } else {
        console.warn('Edit company form not found');
    }
    
    console.log('Otani initialization complete');
};

/**
 * Initializes add company functionality
 * Sets up event listeners for the add company modal and form
 */
const initializeAddCompany = () => {
    const addButton = document.querySelector(SELECTORS.table.addButton);
    const addForm = document.querySelector(SELECTORS.forms.add);
    
    if (addButton) {
        addButton.addEventListener('click', openAddModal);
    }
    
    if (addForm) {
        addForm.addEventListener('submit', handleFormSubmit);
    }
};

/**
 * Initializes edit company functionality
 * Sets up event listeners for the edit company form
 */
const initializeEditCompany = () => {
    const editForm = document.querySelector(SELECTORS.forms.edit);
    if (editForm) {
        editForm.addEventListener('submit', handleEditFormSubmit);
    }
};

/**
 * Handles the submission of the add company form
 * @param {Event} event - The form submission event
 */
const handleFormSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector(SELECTORS.buttons.submit);
    
    if (!submitButton) return;

    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Adding...';

        const newCompany = {
            company_name: form.companyName.value,
            website: form.website.value,
            industry: form.industry.value,
            stage: form.stage.value,
            location: form.location.value,
            your_rating: form.rating.value,
            additional_info: form.additionalInfo.value,
            status: form.status.value,
            otani_rating: 'Loading...',
            why: 'Loading...'
        };

        // Add company and update display
        companiesList.push(newCompany);
        saveCompanies();
        loadCompanies();

        // Close modal and reset form
        closeAddModal();

        // Get and update Otani rating
        const otaniResponse = await getOtaniRating(newCompany, getPreferences());
        newCompany.otani_rating = otaniResponse.rating;
        newCompany.why = otaniResponse.explanation;
        
        saveCompanies();
        loadCompanies();

    } catch (error) {
        log('Error saving company: ' + error.message, 'error');
        alert('Failed to add company');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
    }
};

/**
 * Handles the submission of the edit company form
 * @param {Event} event - The form submission event
 */
const handleEditFormSubmit = async (event) => {
    event.preventDefault();
    if (currentCompanyIndex < 0) return;

    const form = event.target;
    const submitButton = form.querySelector(SELECTORS.buttons.submit);
    
    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';

        const updatedCompany = {
            ...companiesList[currentCompanyIndex],
            company_name: form.companyName.value,
            website: form.website.value,
            industry: form.industry.value,
            stage: form.stage.value,
            location: form.location.value,
            your_rating: form.rating.value,
            additional_info: form.additionalInfo.value,
            status: form.status.value,
            otani_rating: 'Loading...',
            why: 'Updating...'
        };

        // Save initial update
        companiesList[currentCompanyIndex] = updatedCompany;
        saveCompanies();
        loadCompanies();

        // Get new Otani rating
        const otaniResponse = await getOtaniRating(updatedCompany, getPreferences());
        updatedCompany.otani_rating = otaniResponse.rating;
        updatedCompany.why = otaniResponse.explanation;
        
        companiesList[currentCompanyIndex] = updatedCompany;
        saveCompanies();
        loadCompanies();
        
        closeDetailsModal();

    } catch (error) {
        log('Error updating company: ' + error.message, 'error');
        alert('Failed to update company');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Save Changes';
    }
};

/**
 * AI Rating and Details Functions
 */

/**
 * Fetches company details from Perplexity API
 * @param {Object} company - Company to fetch details for
 * @returns {Promise<string|null>} Formatted company details or null if error
 */
const fetchCompanyDetails = async (company) => {
    log('Fetching details for: ' + company.company_name);
    
    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.PERPLEXITY_API_KEY}`
            },
            body: JSON.stringify({
                model: "sonar-pro",
                messages: [
                    {
                        role: "system",
                        content: `You are a company analyst providing concise analysis without citations or references. 
                        Provide clear, factual information in simple sentences without mentioning sources.
                        Always use the exact format provided and include ratings.`
                    },
                    {
                        role: "user",
                        content: `Analyze ${company.company_name} (${company.website}) using this exact format, without citations or references:

DESCRIPTION: Write 2-3 clear sentences about what they do.

BUSINESS: Write 1-2 simple sentences about their business model.

FOUNDERS: Write 1-2 factual sentences about the founders.
FOUNDERS_RATING: [A/B/C/D]

MARKET: Write 1-2 direct sentences about market size.
MARKET_RATING: [A/B/C/D]

COMPETITION: Write 1-2 clear sentences about competitors.
COMPETITION_RATING: [A/B/C/D]

Rating criteria:
- Founders: A=strong track record, D=limited experience
- Market: A=>$10B market, D=<$100M market
- Competition: A=few competitors, D=dominant incumbents

Use simple, direct language without citations or references.`
                    }
                ]
            })
        });

        const data = await response.json();
        if (!data.choices?.[0]?.message?.content) {
            throw new Error('Invalid API response');
        }

        let content = data.choices[0].message.content;
        console.log('Raw API response:', content);
        
        // Log before validation
        console.log('Before validation:', content);
        
        const validatedContent = validateAndFormatResponse(content);
        
        // Log after validation
        console.log('After validation:', validatedContent);
        
        return validatedContent;

    } catch (error) {
        log('Error fetching company details: ' + error.message, 'error');
        return null;
    }
};

/**
 * Validates and formats the API response
 * @param {string} content - Raw API response
 * @returns {string} Formatted content
 */
const validateAndFormatResponse = (content) => {
    const requiredSections = [
        'DESCRIPTION',
        'BUSINESS',
        'FOUNDERS',
        'FOUNDERS_RATING',
        'MARKET',
        'MARKET_RATING',
        'COMPETITION',
        'COMPETITION_RATING'
    ];

    const sections = content.split('\n').filter(line => line.trim());
    const formattedSections = {};

    // Extract existing sections
    sections.forEach(section => {
        const [type, ...contentParts] = section.split(':');
        const trimmedType = type.trim();
        const content = contentParts.join(':').trim();
        formattedSections[trimmedType] = content;
    });

    // Validate and ensure all sections exist
    requiredSections.forEach(section => {
        if (!formattedSections[section]) {
            if (section.endsWith('_RATING')) {
                formattedSections[section] = 'B';
            } else {
                formattedSections[section] = 'Information not available';
            }
        }
    });

    // Construct final response
    return Object.entries(formattedSections)
        .filter(([key]) => requiredSections.includes(key))
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n\n');
};

/**
 * Updates modal with company details
 * @param {string} details - Formatted company details
 */
const updateModalWithDetails = (details) => {
    log('Updating modal with details');
    if (!details) return;
    
    // Reset all sections
    document.querySelectorAll(SELECTORS.details.content).forEach(section => {
        section.innerHTML = '<p class="detail-placeholder">No information available</p>';
    });
    
    document.querySelectorAll(SELECTORS.details.rating).forEach(rating => {
        rating.textContent = '-';
        rating.removeAttribute('data-grade');
    });
    
    // Process sections
    const sections = details.split('\n').filter(line => line.trim());
    sections.forEach(section => {
        const [type, ...contentParts] = section.split(':');
        const trimmedType = type.trim();
        const content = contentParts.join(':').trim();
        
        log('Processing section:', {
            type: trimmedType,
            content: content,
            isRating: trimmedType.endsWith('_RATING')
        });
        
        if (trimmedType.endsWith('_RATING')) {
            updateRatingSection(trimmedType, content);
        } else {
            updateContentSection(trimmedType, content);
        }
    });
};

/**
 * Updates a rating section in the modal
 * @param {string} type - Rating type (e.g., 'FOUNDERS_RATING')
 * @param {string} content - Rating value
 */
const updateRatingSection = (type, content) => {
    const baseType = type.replace('_RATING', '').toLowerCase();
    const ratingElement = document.querySelector(`.section-rating[data-rating="${baseType}"]`);
    
    if (ratingElement) {
        ratingElement.textContent = content;
        ratingElement.setAttribute('data-grade', content);
    }
};

/**
 * Updates a content section in the modal
 * @param {string} type - Section type (e.g., 'DESCRIPTION')
 * @param {string} content - Section content
 */
const updateContentSection = (type, content) => {
    const sectionElement = document.querySelector(
        `.detail-section[data-type="${type.toLowerCase()}"] .detail-content`
    );
    
    if (sectionElement) {
        sectionElement.innerHTML = `<p>${content}</p>`;
    }
};

/**
 * Gets Otani rating for a company
 * @param {Object} company - Company to rate
 * @param {Object} preferences - Investor preferences
 * @returns {Promise<Object>} Rating and explanation
 */
const getOtaniRating = async (company, preferences) => {
    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.PERPLEXITY_API_KEY}`
            },
            body: JSON.stringify({
                model: "sonar-pro",
                messages: [
                    {
                        role: "system",
                        content: "You are Otani, an AI that rates companies A-D based on investor preferences."
                    },
                    {
                        role: "user",
                        content: generateRatingPrompt(company, preferences)
                    }
                ]
            })
        });

        const data = await response.json();
        return parseRatingResponse(data.choices[0].message.content);

    } catch (error) {
        log('Error getting Otani rating: ' + error.message, 'error');
        return {
            rating: 'C',
            explanation: 'Error getting AI response'
        };
    }
};

/**
 * Generates the rating prompt for Perplexity API
 * @param {Object} company - Company to rate
 * @param {Object} preferences - Investor preferences
 * @returns {string} Formatted prompt
 */
const generateRatingPrompt = (company, preferences) => {
    return `Rate this company based on investor preferences:
            
    Company Details:
    - Name: ${company.company_name}
    - Industry: ${company.industry}
    - Stage: ${company.stage}
    - Location: ${company.location}
    - Status: ${company.status}
    - Additional Info: ${company.additional_info || 'None provided'}
    
    Investor Preferences:
    - Industries: ${preferences.industry.join(', ')}
    - Stages: ${preferences.stage.join(', ')}
    - Locations: ${preferences.location.join(', ')}
    - Additional Info: ${preferences.additional_info}
    
    Format response exactly as:
    RATING: [A-D]
    WHY: [1-2 sentence explanation]`;
};

/**
 * Parses the rating response from Perplexity API
 * @param {string} response - API response text
 * @returns {Object} Parsed rating and explanation
 */
const parseRatingResponse = (response) => {
    const rating_match = response.match(/RATING:\s*([ABCD])/i);
    const why_match = response.match(/WHY:\s*(.+)$/is);
    
    return {
        rating: rating_match ? rating_match[1].toUpperCase() : 'C',
        explanation: why_match ? why_match[1].trim() : 'No explanation provided'
    };
};

/**
 * Loads and displays companies in the table
 */
const loadCompanies = () => {
    const tbody = document.getElementById('companiesTableBody');
    if (!tbody) {
        console.error('Companies table body not found during load');
        return;
    }

    console.log(`Rendering ${companiesList.length} companies to table`);
    tbody.innerHTML = '';
    companiesList.forEach((company, index) => {
        tbody.appendChild(createCompanyRow(company, index));
    });
};

/**
 * Creates a table row for a company
 * @param {Object} company - Company data object
 * @param {number} index - Index of the company in the list
 * @returns {HTMLElement} Table row element
 */
const createCompanyRow = (company, index) => {
    const row = document.createElement('tr');
    row.onclick = () => openDetailsModal(index);
    
    const cells = [
        { text: company.company_name, class: '' },
        { isStatus: true, status: company.status, index: index },
        { text: company.your_rating, class: `rating-${company.your_rating?.toLowerCase()}` },
        { text: company.otani_rating || 'N/A', class: company.otani_rating ? `rating-${company.otani_rating.toLowerCase()}` : '' },
        { text: company.why || '', class: 'why-column' }
    ];
    
    cells.forEach(({ text, class: className, isStatus, status, index }) => {
        const td = document.createElement('td');
        if (className) td.className = className;
        
        if (isStatus) {
            td.appendChild(createStatusSelect(status, index));
        } else {
            td.textContent = text;
        }
        
        row.appendChild(td);
    });
    
    return row;
};

/**
 * Creates a status select element for a company row
 * @param {string} currentStatus - Current status value
 * @param {number} companyIndex - Index of the company
 * @returns {HTMLElement} Select element
 */
const createStatusSelect = (currentStatus, companyIndex) => {
    const select = document.createElement('select');
    select.className = 'status-select';
    
    const options = ['Active', 'Pass', 'Invested'];
    options.forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        option.selected = status === currentStatus;
        select.appendChild(option);
    });
    
    // Stop event propagation to prevent modal opening
    select.onclick = (e) => e.stopPropagation();
    
    select.addEventListener('change', async (e) => {
        const company = companiesList[companyIndex];
        company.status = e.target.value;
        
        // Update Otani rating based on new status
        const otaniResponse = await getOtaniRating(company, getPreferences());
        company.otani_rating = otaniResponse.rating;
        company.why = otaniResponse.explanation;
        
        saveCompanies();
        loadCompanies();
    });
    
    return select;
};

/**
 * Opens the company details modal
 * @param {number} index - Index of the company to display
 */
const openDetailsModal = async (index) => {
    currentCompanyIndex = index;
    const company = companiesList[index];
    const modal = document.querySelector(SELECTORS.modals.details);
    
    if (!modal || !company) return;
    
    // Fill form with company details
    const fields = {
        'editCompanyName': company.company_name,
        'editWebsite': company.website,
        'editIndustry': company.industry,
        'editStage': company.stage,
        'editLocation': company.location,
        'editRating': company.your_rating,
        'editAdditionalInfo': company.additional_info || '',
        'editStatus': company.status || 'Active'
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    });
    
    modal.removeAttribute('hidden');
    
    // Handle company details loading
    if (!company.perplexityDetails) {
        // Show loading state
        document.querySelectorAll(SELECTORS.details.content).forEach(section => {
            section.innerHTML = '<p class="detail-placeholder">Loading...</p>';
        });
        
        const details = await fetchCompanyDetails(company);
        if (details) {
            company.perplexityDetails = details;
            saveCompanies();
        }
    }
    
    if (company.perplexityDetails) {
        updateModalWithDetails(company.perplexityDetails);
    }
};

/**
 * Closes the details modal
 */
const closeDetailsModal = () => {
    const modal = document.querySelector(SELECTORS.modals.details);
    if (modal) {
        modal.setAttribute('hidden', '');
        currentCompanyIndex = -1;
    }
};

const deleteCompany = () => {
    if (currentCompanyIndex < 0) return;
    
    if (confirm('Are you sure you want to delete this company?')) {
        companiesList.splice(currentCompanyIndex, 1);
        saveCompanies();
        loadCompanies();
        closeDetailsModal();
    }
};

/**
 * Opens the add company modal
 */
const openAddModal = () => {
    const modal = document.querySelector(SELECTORS.modals.add);
    if (modal) modal.removeAttribute('hidden');
};

/**
 * Closes the add company modal and resets the form
 */
const closeAddModal = () => {
    const modal = document.querySelector(SELECTORS.modals.add);
    const form = document.querySelector(SELECTORS.forms.add);
    
    if (modal) modal.setAttribute('hidden', '');
    if (form) form.reset();
};

// Make sure this function is available globally
window.closeAddModal = closeAddModal;

// Wait for full page load before initializing
window.addEventListener('load', () => {
    console.log('Page fully loaded, initializing Otani...');
    initializeOtani();
});
