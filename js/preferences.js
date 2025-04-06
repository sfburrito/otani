/**
 * Otani Investor Preferences Module
 * Handles loading, saving, and displaying investor preferences locally
 */

const PREFERENCES_CONFIG = {
    selectors: {
        saveButton: '.save-button',
        customSelect: '.custom-select',
        selectHeader: '.select-header',
        optionsContainer: '.options-container',
        option: '.option',
        selectedOptions: '.selected-options',
        additionalInfo: '.preferences-input'
    }
};

/**
 * Initialize preferences functionality
 */
const initializePreferences = () => {
    const saveButton = document.querySelector(PREFERENCES_CONFIG.selectors.saveButton);
    if (!saveButton) {
        console.error('Save button not found');
        return;
    }

    initializeCustomSelects();
    loadPreferences();
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
    
    header.classList.toggle('has-selections', selected.length > 0);
    
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
 * Load existing preferences from localStorage
 */
const loadPreferences = () => {
    try {
        const savedPreferences = JSON.parse(localStorage.getItem('investorPreferences')) || {};

        document.querySelectorAll(PREFERENCES_CONFIG.selectors.customSelect).forEach(select => {
            const fieldName = select.dataset.name;
            const values = savedPreferences[fieldName] || [];
            
            values.forEach(value => {
                const option = select.querySelector(`${PREFERENCES_CONFIG.selectors.option}[data-value="${value}"]`);
                if (option) {
                    option.classList.add('selected');
                }
            });
            
            updateSelectedOptions(select);
        });

        const additionalInfo = document.querySelector(PREFERENCES_CONFIG.selectors.additionalInfo);
        if (additionalInfo) {
            additionalInfo.value = savedPreferences.additional_info || '';
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
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
const handlePreferencesSave = () => {
    const saveButton = document.querySelector(PREFERENCES_CONFIG.selectors.saveButton);
    if (!saveButton) return;

    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    try {
        const data = {
            industry: getSelectedValues('industry'),
            stage: getSelectedValues('stage'),
            location: getSelectedValues('location'),
            investment_amount: getSelectedValues('investment_amount'),
            additional_info: document.querySelector(PREFERENCES_CONFIG.selectors.additionalInfo)?.value || ''
        };

        localStorage.setItem('investorPreferences', JSON.stringify(data));
        alert('Preferences saved successfully!');
    } catch (error) {
        console.error('Error saving preferences:', error);
        alert('Failed to save preferences');
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Preferences';
    }
};

// Export the initialization function
window.initializePreferences = initializePreferences;
