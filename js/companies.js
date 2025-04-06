/**
 * Otani Companies Module
 * 
 * Enterprise-grade company portfolio management system with AI-powered analysis.
 * This module handles:
 * - Company portfolio CRUD operations
 * - AI-driven company analysis and ratings
 * - Real-time status tracking
 * - Detailed company insights
 * 
 * Technical Architecture:
 * - Uses localStorage for data persistence
 * - Integrates with Perplexity API for AI analysis
 * - Event-driven updates for real-time UI
 * 
 * @module companies
 * @version 1.0.0
 * @requires localStorage
 * @requires perplexity-api
 */

// Configuration Constants
const CONFIG = {
    DEBUG: false,  // Set to true to enable detailed logging
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
    },
    RATING_CRITERIA: {
        FOUNDERS: {
            A: 'Strong track record',
            B: 'Good experience',
            C: 'Some experience',
            D: 'Limited experience'
        },
        MARKET: {
            A: '>$10B market',
            B: '$1B-$10B market',
            C: '$100M-$1B market',
            D: '<$100M market'
        },
        COMPETITION: {
            A: 'Few competitors',
            B: 'Moderate competition',
            C: 'High competition',
            D: 'Dominant incumbents'
        }
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

// Application State
let companiesList = [];
let currentCompanyIndex = -1;

/**
 * Utility function for controlled logging
 * @param {string} message - Message to log
 * @param {'info' | 'error' | 'warn'} [type='info'] - Type of log
 */
const log = (message, type = 'info') => {
    if (CONFIG.DEBUG || type === 'error') {
        console[type](`[Otani ${type}]:`, message);
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
 * @returns {void}
 */
const saveCompanies = () => {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.COMPANIES, JSON.stringify(companiesList));
    } catch (error) {
        log('Failed to save companies: ' + error.message, 'error');
    }
};

/**
 * Utility function to safely call gtag
 * @param {string} eventName - Event name
 * @param {Object} params - Event parameters
 */
const trackEvent = (eventName, params) => {
    if (typeof gtag !== 'undefined') {
        // Add event category and common parameters
        const enhancedParams = {
            ...params,
            event_category: 'User Actions',
            event_label: eventName,
            non_interaction: false
        };
        console.log('📊 Tracking event:', eventName, enhancedParams);
        gtag('event', eventName, enhancedParams);
    } else {
        console.warn('Google Analytics not loaded');
    }
};

/**
 * Core Initialization and Company Management
 */

/**
 * Initializes the application
 * @returns {void}
 */
const initializeOtani = () => {
    // Ensure DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeOtani);
        return;
    }

    // Load initial data
    companiesList = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.COMPANIES)) || [];
    
    // Initialize components
    const tbody = document.querySelector(SELECTORS.table.body);
    if (!tbody && window.location.pathname.includes('yourcompanies')) {
        console.error('Companies table body not found');
        return;
    }
    
    if (tbody) {
        loadCompanies();
    }
    
    initializeAddCompany();
    initializeEditCompany();
};

/**
 * Initializes add company functionality
 * @returns {void}
 */
const initializeAddCompany = () => {
    const addButton = document.querySelector(SELECTORS.table.addButton);
    const addForm = document.querySelector(SELECTORS.forms.add);
    
    if (addButton) {
        // Only attach the selection modal opener
        addButton.onclick = openSelectionModal;
    }
    
    if (addForm) {
        addForm.addEventListener('submit', handleFormSubmit);
    }
};

/**
 * Initializes edit company functionality
 * @returns {void}
 */
const initializeEditCompany = () => {
    const editForm = document.querySelector(SELECTORS.forms.edit);
    if (editForm) {
        editForm.addEventListener('submit', handleEditFormSubmit);
    }
};

/**
 * Handles form submission
 * @param {Event} event - Form submission event
 */
const handleFormSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector(SELECTORS.buttons.submit);
    
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
            created_at: new Date().toISOString()
        };

        // Track company addition with enhanced parameters
        trackEvent('company_addition', {
            'company_name': newCompany.company_name,
            'industry': newCompany.industry,
            'stage': newCompany.stage,
            'location': newCompany.location,
            'timestamp': new Date().toISOString()
        });

        // Get Otani rating before adding to list
        const otaniResponse = await getOtaniRating(newCompany, getPreferences());
        newCompany.otani_rating = otaniResponse.rating;
        newCompany.why = otaniResponse.explanation;

        companiesList.push(newCompany);
        saveCompanies();
        loadCompanies();

        // Close both modals
        closeAddModal();
        closeSelectionModal();

        form.reset();

    } catch (error) {
        console.error('Failed to add company:', error);
        alert('Failed to add company. Please try again.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
    }
};

/**
 * Handles company edit form submission
 * @param {Event} event - Form submission event
 * @returns {Promise<void>}
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
            updated_at: new Date().toISOString()
        };

        // Clear cached analysis if company details change
        if (
            updatedCompany.company_name !== companiesList[currentCompanyIndex].company_name ||
            updatedCompany.website !== companiesList[currentCompanyIndex].website ||
            updatedCompany.industry !== companiesList[currentCompanyIndex].industry
        ) {
            updatedCompany.perplexityDetails = null;
        }

        companiesList[currentCompanyIndex] = updatedCompany;
        saveCompanies();
        loadCompanies();

        // Only fetch new analysis if cache was cleared
        if (!updatedCompany.perplexityDetails) {
            const details = await fetchCompanyDetails(updatedCompany);
            if (details) {
                updatedCompany.perplexityDetails = details;
                saveCompanies();
                loadCompanies();
            }
        }
        
        closeDetailsModal();

    } catch (error) {
        console.error('Failed to update company:', error);
        alert('Failed to update company. Please try again.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Save Changes';
    }
};

/**
 * AI Rating and Analysis Functions
 */

/**
 * Fetches detailed company analysis from Perplexity API
 * @param {Object} company - Company to analyze
 * @returns {Promise<string|null>} Formatted analysis or null if error
 */
const fetchCompanyDetails = async (company) => {
    console.log('🔍 Starting analysis for:', company.company_name);
    
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
                        content: `You are a company analyst providing concise analysis without citations or markdown formatting. 
                        Provide clear, factual information in simple sentences.
                        Use plain text format without headers or special characters.
                        Always use the exact format provided and include ratings.`
                    },
                    {
                        role: "user",
                        content: `Analyze ${company.company_name} (${company.website}) using this exact format without markdown or special characters:

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

Use simple, direct language without citations, markdown, or special formatting.`
                    }
                ]
            })
        });

        const data = await response.json();
        if (!data.choices?.[0]?.message?.content) {
            throw new Error('Invalid API response format');
        }

        const rawContent = data.choices[0].message.content;
        console.log('📝 Raw Perplexity response:', rawContent);

        const validatedContent = validateAndFormatResponse(rawContent);
        console.log('✅ Validated content:', validatedContent);

        return validatedContent;

    } catch (error) {
        console.error('❌ Error fetching company details:', error);
        return null;
    }
};

/**
 * Validates and formats the API response
 * @param {string} content - Raw API response
 * @returns {string} Formatted content
 */
const validateAndFormatResponse = (content) => {
    console.log('🔎 Starting validation of content');
    
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

    // Clean up markdown formatting and split into sections
    const cleanContent = content
        .replace(/###\s*/g, '') // Remove markdown headers
        .replace(/\*\*/g, '')   // Remove bold markers
        .trim();
    
    // Split into sections and clean up
    const sections = cleanContent.split('\n').filter(line => line.trim());
    console.log('📋 Parsed sections:', sections);

    const formattedSections = {};
    let currentSection = '';
    let currentContent = [];

    // Process sections and their content
    sections.forEach(line => {
        const sectionMatch = line.match(/^([A-Z_]+):\s*(.*)$/);
        if (sectionMatch) {
            // If we have a previous section, save it
            if (currentSection) {
                formattedSections[currentSection] = currentContent.join(' ').trim();
                currentContent = [];
            }
            currentSection = sectionMatch[1].trim();
            const content = sectionMatch[2].trim();
            if (content) {
                currentContent.push(content);
            }
        } else if (currentSection && line.trim()) {
            currentContent.push(line.trim());
        }
    });

    // Save the last section
    if (currentSection && currentContent.length > 0) {
        formattedSections[currentSection] = currentContent.join(' ').trim();
    }

    // Check for missing sections and add defaults
    requiredSections.forEach(section => {
        if (!formattedSections[section] || formattedSections[section].includes('###')) {
            console.log(`⚠️ Missing or invalid section ${section}, adding default`);
            if (section.endsWith('_RATING')) {
                formattedSections[section] = formattedSections[section]?.match(/[ABCD]/)?.[0] || 'B';
            } else {
                formattedSections[section] = 'Information not available';
            }
        }
    });

    console.log('🏁 Final formatted sections:', formattedSections);

    // Return formatted content
    return requiredSections
        .map(section => `${section}: ${formattedSections[section]}`)
        .join('\n\n');
};

/**
 * Updates modal with company details
 * @param {string} details - Formatted company details
 */
const updateModalWithDetails = (details) => {
    if (!details) {
        // Keep showing loading state
        return;
    }
    
    const sections = details.split('\n').filter(line => line.trim());
    sections.forEach(section => {
        const [type, ...contentParts] = section.split(':');
        const trimmedType = type.trim();
        const content = contentParts.join(':').trim();
        
        if (trimmedType.endsWith('_RATING')) {
            const baseType = trimmedType.replace('_RATING', '').toLowerCase();
            const ratingElement = document.querySelector(`.section-rating[data-rating="${baseType}"]`);
            
            if (ratingElement) {
                ratingElement.textContent = content;
                ratingElement.setAttribute('data-grade', content);
            }
        } else {
            const sectionElement = document.querySelector(
                `.detail-section[data-type="${trimmedType.toLowerCase()}"] .detail-content`
            );
            
            if (sectionElement) {
                sectionElement.innerHTML = `<p>${content}</p>`;
            }
        }
    });
};

/**
 * Gets Otani rating for a company
 * @param {Object} company - Company to rate
 * @param {Object} preferences - Investor preferences
 * @returns {Promise<{rating: string, explanation: string}>}
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
        console.error('Failed to get Otani rating:', error);
        return {
            rating: 'C',
            explanation: 'Error analyzing company'
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
    return `Rate this company based on investor preferences. Do not include any citations or reference numbers in your response.
            
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
    WHY: [1-2 sentence explanation without any citations or reference numbers]`;
};

/**
 * Parses the rating response from Perplexity API
 * @param {string} response - API response text
 * @returns {Object} Parsed rating and explanation
 */
const parseRatingResponse = (response) => {
    const rating_match = response.match(/RATING:\s*([ABCD])/i);
    const why_match = response.match(/WHY:\s*(.+)$/is);
    
    // Remove citation numbers [1], [2], etc.
    const explanation = why_match 
        ? why_match[1].trim().replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim()
        : 'No explanation provided';
    
    return {
        rating: rating_match ? rating_match[1].toUpperCase() : 'C',
        explanation: explanation
    };
};

/**
 * Table and Display Management
 */

/**
 * Loads and displays companies in the table
 * @returns {void}
 */
const loadCompanies = () => {
    const tbody = document.getElementById('companiesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    companiesList.forEach((company, index) => {
        tbody.appendChild(createCompanyRow(company, index));
    });
};

/**
 * Creates a table row for a company
 * @param {Object} company - Company data
 * @param {number} index - Company index in list
 * @returns {HTMLTableRowElement}
 */
const createCompanyRow = (company, index) => {
    const row = document.createElement('tr');
    row.onclick = () => openDetailsModal(index);
    
    // Helper function to create rating cell
    const createRatingCell = (rating) => {
        const td = document.createElement('td');
        if (rating) {
            td.className = `rating-cell rating-${rating.toLowerCase()}`;
            const ratingSpan = document.createElement('span');
            ratingSpan.className = 'rating-badge';
            ratingSpan.textContent = rating;
            td.appendChild(ratingSpan);
        } else {
            td.textContent = '—';
        }
        return td;
    };
    
    // Create cells
    const cells = [
        { text: company.company_name },
        { isStatus: true, status: company.status, index },
        createRatingCell(company.your_rating),
        createRatingCell(company.otani_rating),
        { text: company.why || '—', class: 'why-column' }
    ];
    
    cells.forEach(cell => {
        if (cell instanceof HTMLTableCellElement) {
            row.appendChild(cell);
        } else {
            const td = document.createElement('td');
            if (cell.class) td.className = cell.class;
            
            if (cell.isStatus) {
                td.appendChild(createStatusSelect(cell.status, cell.index));
            } else {
                td.textContent = cell.text;
            }
            
            row.appendChild(td);
        }
    });
    
    return row;
};

/**
 * Creates a status select element
 * @param {string} currentStatus - Current status value
 * @param {number} companyIndex - Company index in list
 * @returns {HTMLSelectElement}
 */
const createStatusSelect = (currentStatus, companyIndex) => {
    const select = document.createElement('select');
    select.className = 'status-select';
    
    ['Active', 'Pass', 'Invested'].forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        option.selected = status === currentStatus;
        select.appendChild(option);
    });
    
    select.onclick = (e) => e.stopPropagation();
    select.addEventListener('change', async (e) => {
        const company = companiesList[companyIndex];
        company.status = e.target.value;
        company.updated_at = new Date().toISOString();
        
        const otaniResponse = await getOtaniRating(company, getPreferences());
        company.otani_rating = otaniResponse.rating;
        company.why = otaniResponse.explanation;
        
        saveCompanies();
        loadCompanies();
    });
    
    return select;
};

/**
 * Modal Management
 */

/**
 * Opens the add company modal
 * @returns {void}
 */
const openAddModal = () => {
    const modal = document.querySelector(SELECTORS.modals.add);
    if (modal) modal.removeAttribute('hidden');
};

/**
 * Closes the add company modal
 * @returns {void}
 */
const closeAddModal = () => {
    const modal = document.querySelector(SELECTORS.modals.add);
    const form = document.querySelector(SELECTORS.forms.add);
    
    if (modal) modal.setAttribute('hidden', '');
    if (form) form.reset();
};

/**
 * Opens the company details modal
 * @param {number} index - Company index in list
 */
const openDetailsModal = async (index) => {
    currentCompanyIndex = index;
    const company = companiesList[index];
    const modal = document.querySelector(SELECTORS.modals.details);
    
    if (!modal || !company) return;
    
    // First, reset all content and ratings to loading state
    document.querySelectorAll(SELECTORS.details.content).forEach(section => {
        section.innerHTML = '<p class="detail-placeholder">Loading analysis...</p>';
    });
    
    document.querySelectorAll(SELECTORS.details.rating).forEach(rating => {
        rating.textContent = '—';
        rating.removeAttribute('data-grade');
        rating.className = 'section-rating';
    });
    
    // Update form fields
    const formFields = {
        editCompanyName: company.company_name,
        editWebsite: company.website,
        editIndustry: company.industry,
        editStage: company.stage,
        editLocation: company.location,
        editRating: company.your_rating,
        editAdditionalInfo: company.additional_info || '',
        editStatus: company.status || 'Active'
    };
    
    Object.entries(formFields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    });
    
    // Show the modal
    modal.removeAttribute('hidden');
    
    // Check if we already have cached details
    if (company.perplexityDetails) {
        console.log('Using cached analysis');
        updateModalWithDetails(company.perplexityDetails);
    } else {
        // Only fetch if we don't have cached details
        console.log('Fetching new analysis');
        const details = await fetchCompanyDetails(company);
        if (details) {
            company.perplexityDetails = details;
            saveCompanies();
            updateModalWithDetails(details);
        }
    }
};

/**
 * Closes the details modal
 * @returns {void}
 */
const closeDetailsModal = () => {
    const modal = document.querySelector(SELECTORS.modals.details);
    if (modal) {
        // Reset all content and ratings when closing
        document.querySelectorAll(SELECTORS.details.content).forEach(section => {
            section.innerHTML = '<p class="detail-placeholder">Loading analysis...</p>';
        });
        
        document.querySelectorAll(SELECTORS.details.rating).forEach(rating => {
            rating.textContent = '—';
            rating.removeAttribute('data-grade');
            rating.className = 'section-rating';
        });
        
        modal.setAttribute('hidden', '');
        currentCompanyIndex = -1;
    }
};

/**
 * Deletes the current company
 * @returns {void}
 */
const deleteCompany = () => {
    if (currentCompanyIndex >= 0 && confirm('Are you sure you want to delete this company?')) {
        // Track company deletion
        trackEvent('delete_company', {
            'company_name': companiesList[currentCompanyIndex].company_name
        });
        
        companiesList.splice(currentCompanyIndex, 1);
        saveCompanies();
        loadCompanies();
        closeDetailsModal();
    }
};

// Make necessary functions available globally
window.closeAddModal = closeAddModal;
window.closeDetailsModal = closeDetailsModal;
window.deleteCompany = deleteCompany;

// Update initialization
document.addEventListener('DOMContentLoaded', () => {
    // Remove the window.load listener we had before
    initializeOtani();
});

// Add these new functions
const openSelectionModal = () => {
    const modal = document.getElementById('addCompanySelectionModal');
    if (modal) modal.removeAttribute('hidden');
};

const closeSelectionModal = () => {
    const modal = document.getElementById('addCompanySelectionModal');
    if (modal) modal.setAttribute('hidden', '');
};

const handleUploadPitchDeck = () => {
    alert('Coming soon: Upload Pitch Deck functionality');
};

const handleBatchUpload = () => {
    alert('Coming soon: Batch Upload functionality');
};

// Make functions available globally
window.openSelectionModal = openSelectionModal;
window.closeSelectionModal = closeSelectionModal;
window.handleUploadPitchDeck = handleUploadPitchDeck;
window.handleBatchUpload = handleBatchUpload;
window.openAddModal = openAddModal;

// Add session tracking
window.addEventListener('load', function() {
    // Track session start
    trackEvent('session_start', {
        'page_title': document.title,
        'page_location': window.location.href
    });
});

// Track time spent on site
let startTime = Date.now();
window.addEventListener('beforeunload', function() {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    trackEvent('session_duration', {
        'duration_seconds': timeSpent
    });
});
