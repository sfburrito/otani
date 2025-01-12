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
        const response = await fetch('/api/preferences');
        if (!response.ok) {
            throw new Error('Failed to load preferences');
        }
        
        const preferences = await response.json();
        console.log('Loaded preferences:', preferences);
        
        // Set investment stages
        setSelectedOptions('Select stages', preferences.investment_stages);
        
        // Set industry sectors
        setSelectedOptions('Select industries', preferences.industry_sectors);
        
        // Set geographic focus
        setSelectedOptions('Select regions', preferences.geographic_focus);
        
        // Set investment sizes
        setSelectedOptions('Select investment sizes', preferences.investment_sizes);
        
        // Set additional preferences
        const additionalPrefs = document.getElementById('additionalPrefs');
        if (additionalPrefs && preferences.additional_preferences) {
            additionalPrefs.value = preferences.additional_preferences;
        }
        
    } catch (error) {
        console.error('Error loading preferences:', error);
        showError('Failed to load preferences');
    }
}

function setSelectedOptions(placeholder, values) {
    if (!values) return;
    
    // Find the select container by its placeholder
    const select = Array.from(document.querySelectorAll('.custom-select'))
        .find(el => el.dataset.placeholder === placeholder);
    if (!select) return;
    
    // Find and check the checkboxes
    values.forEach(value => {
        const checkbox = Array.from(select.querySelectorAll('input[type="checkbox"]'))
            .find(cb => cb.value === value || cb.parentElement.textContent.trim() === value);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
    
    // Update the selected text
    updateSelectedText(select);
}

function savePreferences() {
    const preferences = {
        investment_stages: getSelectedValues('Select stages'),
        industry_sectors: getSelectedValues('Select industries'),
        geographic_focus: getSelectedValues('Select regions'),
        investment_sizes: getSelectedValues('Select investment sizes'),
        additional_preferences: document.getElementById('additionalPrefs')?.value || ''
    };
    
    console.log('Saving preferences:', preferences);
    
    // Show loading state
    const saveButton = document.querySelector('button[onclick="savePreferences()"]');
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
    .then(response => {
        if (!response.ok) throw new Error('Failed to save preferences');
        return response.json();
    })
    .then(() => {
        showSuccess('Preferences saved successfully!');
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
    // Find the select container by its placeholder
    const select = Array.from(document.querySelectorAll('.custom-select'))
        .find(el => el.dataset.placeholder === placeholder);
    if (!select) return [];
    
    // Get checked checkboxes
    return Array.from(select.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value || checkbox.parentElement.textContent.trim());
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
    textarea.value = '';
    textarea.style.height = 'auto';
}
