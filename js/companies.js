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

// API Endpoints
const API = {
    companies: '/api/companies'
};

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
 * Submits company data to the API and updates the UI
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
        const formData = {
            company_name: form.companyName.value,
            industry: form.industry.value,
            stage: form.stage.value,
            location: form.location.value,
            your_rating: form.rating.value
        };

        const response = await fetch(API.companies, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            document.querySelector(SELECTORS.modal).setAttribute('hidden', '');
            form.reset();
            loadCompanies();
        } else {
            throw new Error(result.error || 'Failed to add company');
        }
    } catch (error) {
        log(error.message, 'error');
        alert(error.message);
    } finally {
        toggleLoading(false);
    }
};

/**
 * Loads and displays companies in the table
 * Fetches company data from the API and updates the UI
 */
const loadCompanies = async () => {
    const tbody = document.querySelector(SELECTORS.table);
    if (!tbody) {
        log('Companies table body not found', 'error');
        return;
    }

    try {
        const response = await fetch(API.companies);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to load companies');
        }

        tbody.innerHTML = '';
        result.companies.forEach(company => {
            tbody.appendChild(createCompanyRow(company));
        });
    } catch (error) {
        log(error.message, 'error');
    }
};

/**
 * Creates a table row for a company
 * @param {Object} company - Company data object
 * @returns {HTMLElement} Table row element
 */
const createCompanyRow = (company) => {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${company.company_name}</td>
        <td>${company.industry}</td>
        <td>${company.stage}</td>
        <td>${company.location}</td>
        <td>${company.your_rating}</td>
        <td>${company.otani_rating || 'N/A'}</td>
    `;
    return row;
};

// Initialize only after content is loaded
document.addEventListener('DOMContentLoaded', initializeOtani);
