/**
 * Otani Investor Preferences Module
 * Handles loading, saving, and displaying investor preferences
 * 
 * Features:
 * - Load existing preferences from API
 * - Save preferences to API
 * - Handle multiple select inputs
 * - Provide visual feedback on save
 */

// Configuration
const PREFERENCES_CONFIG = {
    debug: true,
    selectors: {
        saveButton: '.save-button',
        categorySelects: '.category-select',
        additionalInfo: '.preferences-input'
    },
    endpoints: {
        get: '/api/preferences',
        save: '/api/preferences'
    }
};

// Logging utility
const logPreferences = (message, type = 'info') => {
    if (PREFERENCES_CONFIG.debug || type === 'error') {
        console[type](`[Preferences] ${message}`);
    }
};

/**
 * Initialize preferences functionality
 * Sets up event listeners and loads existing preferences
 */
const initializePreferences = async () => {
    const saveButton = document.querySelector(PREFERENCES_CONFIG.selectors.saveButton);
    if (!saveButton) {
        logPreferences('Save button not found', 'error');
        return;
    }

    // Load existing preferences
    await loadPreferences();

    // Set up save button handler
    saveButton.addEventListener('click', handlePreferencesSave);
};

/**
 * Load existing preferences from API
 * Populates form fields with user's saved preferences
 */
const loadPreferences = async () => {
    try {
        const response = await fetch(PREFERENCES_CONFIG.endpoints.get);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to load preferences');
        }

        // Update form fields with loaded preferences
        const selects = document.querySelectorAll(PREFERENCES_CONFIG.selectors.categorySelects);
        selects.forEach(select => {
            const fieldName = select.getAttribute('name');
            const values = result.data[fieldName] || [];
            
            // Update selected options
            Array.from(select.options).forEach(option => {
                option.selected = values.includes(option.value);
            });
        });

        // Update additional info
        const additionalInfo = document.querySelector(PREFERENCES_CONFIG.selectors.additionalInfo);
        if (additionalInfo) {
            additionalInfo.value = result.data.additional_info || '';
        }

    } catch (error) {
        logPreferences(error.message, 'error');
    }
};

/**
 * Handle preferences form submission
 * Collects form data and sends to API
 */
const handlePreferencesSave = async () => {
    const saveButton = document.querySelector(PREFERENCES_CONFIG.selectors.saveButton);
    if (!saveButton) return;

    // Toggle button state
    const toggleSaving = (saving) => {
        saveButton.disabled = saving;
        saveButton.textContent = saving ? 'Saving...' : 'Save Preferences';
    };

    toggleSaving(true);

    try {
        // Collect form data
        const formData = {
            industry: getSelectedValues('industry'),
            stage: getSelectedValues('stage'),
            location: getSelectedValues('location'),
            investment_amount: getSelectedValues('investment_amount'),
            additional_info: document.querySelector(PREFERENCES_CONFIG.selectors.additionalInfo)?.value || ''
        };

        // Send to API
        const response = await fetch(PREFERENCES_CONFIG.endpoints.save, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to save preferences');
        }

        // Show success feedback
        saveButton.textContent = 'Saved!';
        setTimeout(() => {
            saveButton.textContent = 'Save Preferences';
        }, 2000);

    } catch (error) {
        logPreferences(error.message, 'error');
        alert('Failed to save preferences. Please try again.');
    } finally {
        toggleSaving(false);
    }
};

/**
 * Helper function to get selected values from a multiple select
 */
const getSelectedValues = (fieldName) => {
    const select = document.querySelector(`select[name="${fieldName}"]`);
    return select ? Array.from(select.selectedOptions).map(opt => opt.value) : [];
};

// Remove the DOMContentLoaded event listener since we're initializing from index.html
// document.addEventListener('DOMContentLoaded', initializePreferences);

// Export the initialization function for use in index.html
window.initializePreferences = initializePreferences;
