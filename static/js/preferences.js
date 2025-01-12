document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing preferences...');
    
    // Initialize dropdowns
    const customSelects = document.querySelectorAll('.custom-select');
    customSelects.forEach(select => {
        const trigger = select.querySelector('.select-trigger');
        const options = select.querySelector('.custom-options');
        const checkboxes = select.querySelectorAll('input[type="checkbox"]');
        
        // Toggle options list
        trigger?.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Close all other dropdowns
            customSelects.forEach(otherSelect => {
                if (otherSelect !== select) {
                    otherSelect.classList.remove('active');
                    const otherOptions = otherSelect.querySelector('.custom-options');
                    if (otherOptions) {
                        otherOptions.style.display = 'none';
                    }
                }
            });
            
            // Toggle current dropdown
            select.classList.toggle('active');
            if (options) {
                options.style.display = select.classList.contains('active') ? 'block' : 'none';
            }
        });

        // Handle checkbox changes
        checkboxes?.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                updateSelectedText(select);
            });
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select')) {
            customSelects.forEach(select => {
                select.classList.remove('active');
                const options = select.querySelector('.custom-options');
                if (options) {
                    options.style.display = 'none';
                }
            });
        }
    });

    // Stop propagation for clicks inside options
    document.querySelectorAll('.custom-options').forEach(options => {
        options.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    // Load saved preferences
    loadPreferences();
});

function updateSelectedText(select) {
    const selectedOptions = Array.from(select.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.parentElement.textContent.trim());
    const selectedText = select.querySelector('.selected-text');
    const placeholder = select.dataset.placeholder;
    
    if (selectedText) {
        selectedText.textContent = selectedOptions.length > 0 ? selectedOptions.join(', ') : placeholder;
    }
}

async function loadPreferences() {
    try {
        console.log('Loading preferences...');
        const response = await fetch('/api/preferences');
        
        console.log('Load response status:', response.status);
        if (!response.ok) {
            throw new Error('Failed to load preferences');
        }
        
        const preferences = await response.json();
        console.log('=== Loaded Preferences ===');
        console.log(JSON.stringify(preferences, null, 2));
        
        // Set each type of preference
        console.log('Setting investment stages:', preferences.investment_stages);
        setSelectedOptions('Select stages', preferences.investment_stages);
        
        console.log('Setting industry sectors:', preferences.industry_sectors);
        setSelectedOptions('Select industries', preferences.industry_sectors);
        
        console.log('Setting geographic focus:', preferences.geographic_focus);
        setSelectedOptions('Select regions', preferences.geographic_focus);
        
        console.log('Setting investment sizes:', preferences.investment_sizes);
        setSelectedOptions('Select investment sizes', preferences.investment_sizes);
        
        // Set additional preferences
        const additionalPrefs = document.getElementById('additionalPrefs');
        if (additionalPrefs && preferences.additional_preferences) {
            console.log('Setting additional preferences:', preferences.additional_preferences);
            additionalPrefs.value = preferences.additional_preferences;
        }
        
    } catch (error) {
        console.error('Error loading preferences:', error);
        showError('Failed to load preferences');
    }
}

function setSelectedOptions(placeholder, values) {
    if (!values) {
        console.log(`No values to set for "${placeholder}"`);
        return;
    }
    
    // Find the select container
    const select = Array.from(document.querySelectorAll('.custom-select'))
        .find(el => el.dataset.placeholder === placeholder);
    
    if (!select) {
        console.warn(`No select found for placeholder: "${placeholder}"`);
        return;
    }
    
    console.log(`Setting values for "${placeholder}":`, values);
    
    // Find and check the checkboxes
    values.forEach(value => {
        const checkbox = Array.from(select.querySelectorAll('input[type="checkbox"]'))
            .find(cb => cb.value === value || cb.parentElement.textContent.trim() === value);
        
        if (checkbox) {
            console.log(`Found checkbox for value "${value}"`);
            checkbox.checked = true;
        } else {
            console.warn(`No checkbox found for value "${value}"`);
        }
    });
    
    // Update the selected text
    updateSelectedText(select);
}

function savePreferences() {
    // Get and log each value separately
    const stages = getSelectedValues('Select stages');
    const sectors = getSelectedValues('Select industries');
    const regions = getSelectedValues('Select regions');
    const sizes = getSelectedValues('Select investment sizes');
    const additional = document.getElementById('additionalPrefs')?.value || '';

    console.log('=== Selected Values ===');
    console.log('Stages:', stages);
    console.log('Sectors:', sectors);
    console.log('Regions:', regions);
    console.log('Sizes:', sizes);
    console.log('Additional:', additional);

    const preferences = {
        investment_stages: stages,
        industry_sectors: sectors,
        geographic_focus: regions,
        investment_sizes: sizes,
        additional_preferences: additional
    };
    
    console.log('=== Full Preferences Object ===');
    console.log(JSON.stringify(preferences, null, 2));
    
    // Show loading state
    const saveButton = document.querySelector('button[onclick="savePreferences()"]');
    if (!saveButton) {
        console.error('Save button not found');
        return;
    }
    
    const originalText = saveButton.innerHTML;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveButton.disabled = true;
    
    fetch('/api/preferences', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
    })
    .then(async response => {
        console.log('=== Response Details ===');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', Object.fromEntries([...response.headers]));
        
        const responseData = await response.json();
        console.log('Response Data:', responseData);
        
        if (!response.ok) {
            throw new Error(`Failed to save preferences: ${response.status} ${response.statusText}`);
        }
        return responseData;
    })
    .then(data => {
        console.log('Save successful:', data);
        showSuccess('Preferences saved successfully!');
        
        // Verify saved data by reloading
        loadPreferences();
    })
    .catch(error => {
        console.error('Error saving preferences:', error);
        showError('Failed to save preferences');
    })
    .finally(() => {
        saveButton.innerHTML = originalText;
        saveButton.disabled = false;
    });
}

function getSelectedValues(placeholder) {
    console.log(`Getting values for "${placeholder}"`);
    
    // Find the select container
    const select = Array.from(document.querySelectorAll('.custom-select'))
        .find(el => el.dataset.placeholder === placeholder);
    
    if (!select) {
        console.warn(`No select found for placeholder: "${placeholder}"`);
        return [];
    }
    
    console.log('Found select element:', select);
    
    // Get checked checkboxes
    const checkboxes = select.querySelectorAll('input[type="checkbox"]:checked');
    console.log('Checked checkboxes:', checkboxes);
    
    const values = Array.from(checkboxes)
        .map(checkbox => {
            const value = checkbox.value || checkbox.parentElement.textContent.trim();
            console.log('Checkbox value:', value);
            return value;
        });
    
    console.log(`Final values for "${placeholder}":`, values);
    return values;
}

function showSuccess(message) {
    const flashContainer = document.querySelector('.flash-messages');
    if (!flashContainer) return;
    
    const alert = document.createElement('div');
    alert.className = 'flash-message success';
    alert.textContent = message;
    
    flashContainer.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

function showError(message) {
    const flashContainer = document.querySelector('.flash-messages');
    if (!flashContainer) return;
    
    const alert = document.createElement('div');
    alert.className = 'flash-message error';
    alert.textContent = message;
    
    flashContainer.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

function resetPreferences() {
    document.querySelectorAll('.custom-select').forEach(select => {
        const selectedText = select.querySelector('.selected-text');
        const options = select.querySelectorAll('input');
        
        options.forEach(option => option.checked = false);
        selectedText.textContent = select.getAttribute('data-placeholder');
    });

    const textarea = document.getElementById('additionalPrefs');
    if (textarea) {
        textarea.value = '';
        textarea.style.height = 'auto';
    }
}
