(function() {
    let retryCount = 0;
    const MAX_RETRIES = 50; // Maximum 5 seconds of retries (50 * 100ms)
    
    // Helper function to position calendar relative to a specific input field
    function positionCalendarForField(inputField) {
        const calendar = document.querySelector('.ndp-container');
        if (calendar) {
            const rect = inputField.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            
            calendar.style.position = 'fixed';
            
            if (spaceBelow >= 300) {
                calendar.style.top = (rect.bottom + 2) + 'px';
            } else {
                calendar.style.top = (rect.top - calendar.offsetHeight - 2) + 'px';
            }
            calendar.style.left = rect.left + 'px';
            
            // Close calendar on scroll
            const closeOnScroll = function() {
                if (calendar && calendar.parentNode) {
                    calendar.remove();
                }
                window.removeEventListener('scroll', closeOnScroll, true);
            };
            window.addEventListener('scroll', closeOnScroll, true);
        }
    }

    function init() {
        retryCount++;
        
        // Stop retrying after MAX_RETRIES to prevent infinite loops on pages without target fields
        if (retryCount > MAX_RETRIES) {
            console.warn('Date converter: Max retries reached, stopping initialization');
            return;
        }
        
        // Wait for libraries to load
        if (typeof NepaliFunctions === 'undefined') {
            setTimeout(init, 100);
            return;
        }

        // Check if NepaliDatePicker is available via prototype
        if (typeof HTMLElement.prototype.nepaliDatePicker === 'undefined') {
            setTimeout(init, 100);
            return;
        }

        const startAd = document.getElementById('id_case_start_date');
        const startBs = document.getElementById('id_start_date_bs');
        const endAd = document.getElementById('id_case_end_date');
        const endBs = document.getElementById('id_end_date_bs');

        if (!startAd || !startBs || !endAd || !endBs) {
            // Only retry if we haven't exceeded max retries
            if (retryCount <= MAX_RETRIES) {
                setTimeout(init, 200);
            }
            return;
        }

        // Temporarily remove readonly to allow datepicker initialization
        startBs.removeAttribute('readonly');
        endBs.removeAttribute('readonly');

        // Initialize Nepali datepicker on BS fields
        startBs.nepaliDatePicker({
            dateFormat: 'YYYY-MM-DD',
            language: 'english',
            mode: 'light',
            container: 'body',
            onSelect: function(dateObj) {
                if (dateObj && dateObj.value) {
                    const bsDate = NepaliFunctions.ConvertToDateObject(dateObj.value, 'YYYY-MM-DD');
                    const adDate = NepaliFunctions.BS2AD(bsDate);
                    if (adDate) {
                        startAd.value = NepaliFunctions.ConvertToDateFormat(adDate, 'YYYY-MM-DD');
                    }
                }
            }
        });

        endBs.nepaliDatePicker({
            dateFormat: 'YYYY-MM-DD',
            language: 'english',
            mode: 'light',
            container: 'body',
            onSelect: function(dateObj) {
                if (dateObj && dateObj.value) {
                    const bsDate = NepaliFunctions.ConvertToDateObject(dateObj.value, 'YYYY-MM-DD');
                    const adDate = NepaliFunctions.BS2AD(bsDate);
                    if (adDate) {
                        endAd.value = NepaliFunctions.ConvertToDateFormat(adDate, 'YYYY-MM-DD');
                    }
                }
            }
        });

        // Re-add readonly after initialization and prevent typing
        startBs.setAttribute('readonly', 'readonly');
        endBs.setAttribute('readonly', 'readonly');
        
        startBs.addEventListener('keydown', function(e) {
            e.preventDefault();
        });
        
        endBs.addEventListener('keydown', function(e) {
            e.preventDefault();
        });
        
        // Add click handlers to position calendar properly
        startBs.addEventListener('click', function() {
            setTimeout(function() {
                positionCalendarForField(startBs);
            }, 10);
        });
        
        endBs.addEventListener('click', function() {
            setTimeout(function() {
                positionCalendarForField(endBs);
            }, 10);
        });

        // Initialize BS dates from existing AD dates (for editing existing cases)
        if (startAd.value) {
            try {
                const adDate = NepaliFunctions.ConvertToDateObject(startAd.value, 'YYYY-MM-DD');
                const bsDate = NepaliFunctions.AD2BS(adDate);
                if (bsDate) {
                    startBs.value = NepaliFunctions.ConvertToDateFormat(bsDate, 'YYYY-MM-DD');
                }
            } catch (e) {
                console.error('Error initializing start BS date:', e);
            }
        }

        if (endAd.value) {
            try {
                const adDate = NepaliFunctions.ConvertToDateObject(endAd.value, 'YYYY-MM-DD');
                const bsDate = NepaliFunctions.AD2BS(adDate);
                if (bsDate) {
                    endBs.value = NepaliFunctions.ConvertToDateFormat(bsDate, 'YYYY-MM-DD');
                }
            } catch (e) {
                console.error('Error initializing end BS date:', e);
            }
        }

        // Sync AD to BS when AD field changes
        startAd.addEventListener('change', function() {
            const adVal = startAd.value;
            if (adVal) {
                try {
                    const adDate = NepaliFunctions.ConvertToDateObject(adVal, 'YYYY-MM-DD');
                    const bsDate = NepaliFunctions.AD2BS(adDate);
                    if (bsDate) {
                        startBs.value = NepaliFunctions.ConvertToDateFormat(bsDate, 'YYYY-MM-DD');
                    }
                } catch (e) {
                    console.error('Error converting AD to BS:', e);
                }
            } else {
                startBs.value = '';
            }
        });

        endAd.addEventListener('change', function() {
            const adVal = endAd.value;
            if (adVal) {
                try {
                    const adDate = NepaliFunctions.ConvertToDateObject(adVal, 'YYYY-MM-DD');
                    const bsDate = NepaliFunctions.AD2BS(adDate);
                    if (bsDate) {
                        endBs.value = NepaliFunctions.ConvertToDateFormat(bsDate, 'YYYY-MM-DD');
                    }
                } catch (e) {
                    console.error('Error converting AD to BS:', e);
                }
            } else {
                endBs.value = '';
            }
        });

        // Setup timeline date conversion (AD to BS only, no datepicker)
        document.addEventListener('input', function(e) {
            if (e.target.classList.contains('timeline-date-ad')) {
                const adInput = e.target;
                const row = adInput.closest('.timeline-row');
                if (row) {
                    const bsInput = row.querySelector('.timeline-date-bs');
                    if (bsInput && adInput.value) {
                        try {
                            const adDate = NepaliFunctions.ConvertToDateObject(adInput.value, 'YYYY-MM-DD');
                            const bsDate = NepaliFunctions.AD2BS(adDate);
                            if (bsDate) {
                                bsInput.value = NepaliFunctions.ConvertToDateFormat(bsDate, 'YYYY-MM-DD');
                            }
                        } catch (e) {
                            console.error('Error converting timeline AD to BS:', e);
                        }
                    } else if (bsInput) {
                        bsInput.value = '';
                    }
                }
            }
        });
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();