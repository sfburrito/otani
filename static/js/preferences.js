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
