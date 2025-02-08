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
 * Handles form submission
 * Updates the UI with new company data
 * @param {Event} event - Form submission event
 */
const handleFormSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector(SELECTORS.submitButton);
    
    if (!submitButton) {
        log('Submit button not found', 'error');
        return;
    }

    // Toggle loading state
    const toggleLoading = (loading) => {
        submitButton.disabled = loading;
        submitButton.textContent = loading ? 'Adding...' : 'Submit';
    };

    toggleLoading(true);

    try {
        const newCompany = {
            company_name: form.companyName.value,
            industry: form.industry.value,
            stage: form.stage.value,
            location: form.location.value,
            your_rating: form.rating.value,
            otani_rating: 'N/A' // Simplified for demo
        };

        companiesList.push(newCompany);
        localStorage.setItem('companiesList', JSON.stringify(companiesList));
        document.querySelector(SELECTORS.modal).setAttribute('hidden', '');
        form.reset();
        loadCompanies();
    } catch (error) {
        log(error.message, 'error');
        alert('Failed to add company');
    } finally {
        toggleLoading(false);
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
        { text: company.industry, class: '' },
        { text: company.stage, class: '' },
        { text: company.location, class: '' },
        { text: company.your_rating, class: `rating-${company.your_rating.toLowerCase()}` },
        { text: company.otani_rating || 'N/A', class: company.otani_rating ? `rating-${company.otani_rating.toLowerCase()}` : '' }
    ];
    
    // Create and append cells
    cells.forEach(({ text, class: className }) => {
        const td = document.createElement('td');
        td.textContent = text;
        if (className) {
            td.className = className;
        }
        row.appendChild(td);
    });
    
    return row;
};

// Initialize only after content is loaded
document.addEventListener('DOMContentLoaded', initializeOtani);
