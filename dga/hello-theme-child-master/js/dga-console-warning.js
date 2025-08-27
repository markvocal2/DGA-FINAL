/**
 * DGA Console Warning Script v2
 * Safe implementation with error handling
 */
(function() {
    'use strict';
    
    // Check if console exists and data is available
    if (typeof console === 'undefined' || typeof dgaConsoleData === 'undefined') {
        return;
    }
    
    // Only run if enabled
    if (!dgaConsoleData.enabled) {
        return;
    }
    
    try {
        // Store original console methods
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        
        // Display warning function
        function displayDGAWarning() {
            const messages = dgaConsoleData.messages;
            
            // Use fallback if console styling is not supported
            if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.userAgent.indexOf('Trident') !== -1) {
                // IE fallback
                originalWarn.call(console, messages.warning_title);
                originalWarn.call(console, messages.stop_message);
                originalWarn.call(console, messages.warning_text);
                originalWarn.call(console, messages.scam_warning);
                originalWarn.call(console, messages.contact_info);
            } else {
                // Modern browsers with styling
                try {
                    originalLog.call(console, 
                        '%c' + messages.warning_title, 
                        'color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);'
                    );
                    
                    originalLog.call(console, 
                        '%c' + messages.stop_message, 
                        'color: #ff0000; font-size: 30px; font-weight: bold; background: yellow; padding: 10px;'
                    );
                    
                    originalLog.call(console, 
                        '%c' + messages.warning_text, 
                        'color: #333; font-size: 16px; line-height: 1.5;'
                    );
                    
                    originalLog.call(console, 
                        '%c' + messages.scam_warning, 
                        'color: #ff6600; font-size: 18px; font-weight: bold;'
                    );
                    
                    originalLog.call(console, 
                        '%c' + messages.contact_info, 
                        'color: #0066cc; font-size: 14px;'
                    );
                    
                    originalLog.call(console, 
                        '%c' + messages.security_notice, 
                        'color: #666; font-size: 12px; font-style: italic;'
                    );
                } catch (styleError) {
                    // Fallback if styling fails
                    originalWarn.call(console, messages.warning_title);
                    originalWarn.call(console, messages.warning_text);
                }
            }
        }
        
        // Display warning immediately
        displayDGAWarning();
        
        // Optional: Re-display warning when console is opened
        let devtools = {open: false, orientation: null};
        const threshold = 160;
        
        setInterval(function() {
            try {
                if (window.outerHeight - window.innerHeight > threshold || 
                    window.outerWidth - window.innerWidth > threshold) {
                    if (!devtools.open) {
                        devtools.open = true;
                        displayDGAWarning();
                    }
                } else {
                    devtools.open = false;
                }
            } catch (e) {
                // Ignore errors in detection
            }
        }, 500);
        
    } catch (error) {
        // Fail silently to not break other scripts
        if (typeof console !== 'undefined' && console.error) {
            console.error('DGA Console Warning Error:', error);
        }
    }
})();