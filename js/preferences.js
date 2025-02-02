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
        customSelect: '.custom-select',
        selectHeader: '.select-header',
        optionsContainer: '.options-container',
        option: '.option',
        selectedOptions: '.selected-options',
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

    // Initialize custom selects
    initializeCustomSelects();

    // Load existing preferences
    await loadPreferences();

    // Set up save button handler
    saveButton.addEventListener('click', handlePreferencesSave);
};

/**
 * Initialize custom select dropdowns
 */
const initializeCustomSelects = () => {
    const selects = document.querySelectorAll(PREFERENCES_CONFIG.selectors.customSelect);
    
    selects.forEach(select => {
        const header = select.querySelector(PREFERENCES_CONFIG.selectors.selectHeader);
        const optionsContainer = select.querySelector(PREFERENCES_CONFIG.selectors.optionsContainer);
        const options = select.querySelectorAll(PREFERENCES_CONFIG.selectors.option);
        
        // Toggle dropdown
        header.addEventListener('click', () => {
            const isActive = header.classList.contains('active');
            
            // Close all other dropdowns
            document.querySelectorAll(PREFERENCES_CONFIG.selectors.selectHeader).forEach(h => {
                h.classList.remove('active');
                h.nextElementSibling.classList.remove('active');
            });
            
            // Toggle current dropdown
            header.classList.toggle('active', !isActive);
            optionsContainer.classList.toggle('active', !isActive);
        });
        
        // Handle option selection
        options.forEach(option => {
            option.addEventListener('click', () => {
                option.classList.toggle('selected');
                updateSelectedOptions(select);
            });
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest(PREFERENCES_CONFIG.selectors.customSelect)) {
            document.querySelectorAll(PREFERENCES_CONFIG.selectors.selectHeader).forEach(header => {
                header.classList.remove('active');
                header.nextElementSibling.classList.remove('active');
            });
        }
    });
};

/**
 * Update selected options display
 */
const updateSelectedOptions = (select) => {
    const selectedContainer = select.querySelector(PREFERENCES_CONFIG.selectors.selectedOptions);
    const header = select.querySelector(PREFERENCES_CONFIG.selectors.selectHeader);
    const selected = Array.from(select.querySelectorAll(`${PREFERENCES_CONFIG.selectors.option}.selected`));
    
    selectedContainer.innerHTML = selected.map(option => `
        <span class="selected-tag">
            ${option.textContent}
            <span class="remove" data-value="${option.dataset.value}">×</span>
        </span>
    `).join('');
    
    // Add/remove has-selections class
    header.classList.toggle('has-selections', selected.length > 0);
    
    // Add click handlers for remove buttons
    selectedContainer.querySelectorAll('.remove').forEach(removeBtn => {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = removeBtn.dataset.value;
            const option = select.querySelector(`${PREFERENCES_CONFIG.selectors.option}[data-value="${value}"]`);
            option.classList.remove('selected');
            updateSelectedOptions(select);
        });
    });
};

/**
 * Load existing preferences from API
 */
const loadPreferences = async () => {
    try {
        const response = await fetch(PREFERENCES_CONFIG.endpoints.get);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to load preferences');
        }

        // Update custom selects with loaded preferences
        document.querySelectorAll(PREFERENCES_CONFIG.selectors.customSelect).forEach(select => {
            const fieldName = select.dataset.name;
            const values = result.data[fieldName] || [];
            
            values.forEach(value => {
                const option = select.querySelector(`${PREFERENCES_CONFIG.selectors.option}[data-value="${value}"]`);
                if (option) {
                    option.classList.add('selected');
                }
            });
            
            updateSelectedOptions(select);
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
 * Get selected values from a custom select
 */
const getSelectedValues = (fieldName) => {
    const select = document.querySelector(`${PREFERENCES_CONFIG.selectors.customSelect}[data-name="${fieldName}"]`);
    return Array.from(select.querySelectorAll(`${PREFERENCES_CONFIG.selectors.option}.selected`))
        .map(option => option.dataset.value);
};

/**
 * Handle preferences form submission
 */
const handlePreferencesSave = async () => {
    const saveButton = document.querySelector(PREFERENCES_CONFIG.selectors.saveButton);
    if (!saveButton) return;

    const toggleSaving = (saving) => {
        saveButton.disabled = saving;
        saveButton.textContent = saving ? 'Saving...' : 'Save Preferences';
    };

    toggleSaving(true);

    try {
        const data = {
            industry: getSelectedValues('industry'),
            stage: getSelectedValues('stage'),
            location: getSelectedValues('location'),
            investment_amount: getSelectedValues('investment_amount'),
            additional_info: document.querySelector(PREFERENCES_CONFIG.selectors.additionalInfo)?.value || ''
        };

        const response = await fetch(PREFERENCES_CONFIG.endpoints.save, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to save preferences');
        }

        logPreferences('Preferences saved successfully');
        
    } catch (error) {
        logPreferences(error.message, 'error');
    } finally {
        toggleSaving(false);
    }
};

// Export the initialization function for use in index.html
window.initializePreferences = initializePreferences;
