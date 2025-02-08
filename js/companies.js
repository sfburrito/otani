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
const companiesList = JSON.parse(localStorage.getItem('companiesList')) || [];

/**
 * Main initialization function
 * Sets up all event handlers and loads initial data
 */
const initializeOtani = () => {
    loadCompanies();
    initializeFormHandling();
    initializeModal();
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
 * Initializes form handling
 * Sets up event listeners for form submission
 */
const initializeFormHandling = () => {
    const form = document.querySelector(SELECTORS.form);
    if (!form) {
        log('Add company form not found', 'error');
        return;
    }

    form.addEventListener('submit', handleFormSubmit);
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
                                Then provide a brief 1-2 sentence explanation.
                                Format response as: "RATING: [letter]\nWHY: [explanation]"`
                    },
                    {
                        role: "user",
                        content: `Rate this company based on the investor's preferences:
                                
                                Company Details:
                                - Name: ${company.company_name}
                                - Industry: ${company.industry}
                                - Stage: ${company.stage}
                                - Location: ${company.location}
                                
                                Investor Preferences:
                                - Industries: ${preferences.industry.join(', ')}
                                - Stages: ${preferences.stage.join(', ')}
                                - Locations: ${preferences.location.join(', ')}
                                - Additional Info: ${preferences.additional_info}`
                    }
                ]
            })
        });

        const data = await response.json();
        const response_text = data.choices[0].message.content.trim();
        
        // Parse rating and explanation
        const rating_match = response_text.match(/RATING:\s*([ABCD])/i);
        const why_match = response_text.match(/WHY:\s*(.+)$/i);
        
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
    companiesList.forEach(company => {
        tbody.appendChild(createCompanyRow(company));
    });
};

/**
 * Creates a table row for a company
 * @param {Object} company - Company data object
 * @returns {HTMLElement} Table row element
 */
const createCompanyRow = (company) => {
    const row = document.createElement('tr');
    
    // Create cells for each company property
    const cells = [
        { text: company.company_name, class: '' },
        { text: company.website, class: '', isLink: true },
        { text: company.industry, class: '' },
        { text: company.stage, class: '' },
        { text: company.location, class: '' },
        { text: company.your_rating, class: `rating-${company.your_rating.toLowerCase()}` },
        { text: company.otani_rating || 'N/A', class: company.otani_rating ? `rating-${company.otani_rating.toLowerCase()}` : '' },
        { text: company.why || '', class: 'why-column' }
    ];
    
    // Create and append cells
    cells.forEach(({ text, class: className, isLink }) => {
        const td = document.createElement('td');
        if (isLink) {
            const a = document.createElement('a');
            a.href = text;
            a.textContent = new URL(text).hostname;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            td.appendChild(a);
        } else {
            td.textContent = text;
        }
        if (className) {
            td.className = className;
        }
        row.appendChild(td);
    });
    
    return row;
};

// Initialize only after content is loaded
document.addEventListener('DOMContentLoaded', initializeOtani);
