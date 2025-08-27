/**
 * Enhanced DGA Language Switcher Script
 * Version: 2.0.0
 * ID: kzp487
 */

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        elementId: 'google_translate_element_kzp487',
        cookieNames: [
            'googtrans',
            'googtrans_session',
            'dga_preferred_lang',
            'dga_preferred_lang_kzp487'
        ]
    };
    
    /**
     * Clear all translation-related cookies
     */
    const clearTranslationCookies = () => {
        // Clear cookies via JavaScript
        CONFIG.cookieNames.forEach(cookieName => {
            // Clear for current path
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            // Clear for current domain
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
            // Clear for parent domain (if subdomain)
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
        });
        
        // Clear sessionStorage and localStorage
        try {
            sessionStorage.clear();
            localStorage.removeItem('dga_preferred_lang_kzp487');
            localStorage.removeItem('googtrans');
        } catch (e) {
            console.debug('Storage clear error:', e);
        }
    };
    
    /**
     * Clear cookies via AJAX
     */
    const clearCookiesViaAjax = async () => {
        if (!window.dga_translate_vars) return;
        
        try {
            const formData = new FormData();
            formData.append('action', 'dga_clear_cookies');
            formData.append('nonce', dga_translate_vars.nonce);
            
            const response = await fetch(dga_translate_vars.ajax_url, {
                method: 'POST',
                credentials: 'same-origin',
                body: formData
            });
            
            const data = await response.json();
            console.debug('Cookies cleared:', data);
        } catch (error) {
            console.error('Error clearing cookies via AJAX:', error);
        }
    };
    
    /**
     * Show loading indicator
     */
    const showLoading = () => {
        const loader = document.querySelector('.dga-loading-kzp487');
        if (loader) {
            loader.style.display = 'flex';
        }
    };
    
    /**
     * Handle language switch with reload
     */
    const handleLanguageSwitch = async (targetLang) => {
        // Show loading indicator
        showLoading();
        
        // Clear all cookies first
        clearTranslationCookies();
        await clearCookiesViaAjax();
        
        // Build new URL with language parameter
        const url = new URL(window.location.href);
        url.searchParams.set('lang', targetLang);
        
        // Set Google Translate cookie for the target language
        const langCode = targetLang === 'en' ? '/th/en' : '/th/th';
        document.cookie = `googtrans=${langCode}; path=/`;
        document.cookie = `googtrans=${langCode}; path=/; domain=${window.location.hostname}`;
        
        // Delay slightly to ensure cookies are cleared, then reload
        setTimeout(() => {
            window.location.href = url.toString();
        }, 100);
    };
    
    /**
     * Initialize translation system
     */
    const initialize = () => {
        // Get all language switcher buttons
        const langButtons = document.querySelectorAll('.dga-lang-switcher-kzp487');
        
        langButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetLang = this.getAttribute('data-lang');
                const currentLang = dga_translate_vars ? dga_translate_vars.current_lang : 'th';
                
                // Only switch if different language
                if (targetLang !== currentLang) {
                    handleLanguageSwitch(targetLang);
                }
            });
        });
        
        // Auto-trigger Google Translate on page load if lang parameter exists
        const urlParams = new URLSearchParams(window.location.search);
        const targetLang = urlParams.get('lang');
        
        if (targetLang && targetLang === 'en') {
            // Wait for Google Translate to load
            const checkGoogleTranslate = setInterval(() => {
                const selectElement = document.querySelector(`#${CONFIG.elementId} select`);
                if (selectElement) {
                    clearInterval(checkGoogleTranslate);
                    // Set to English
                    selectElement.value = 'en';
                    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, 100);
            
            // Stop checking after 5 seconds
            setTimeout(() => clearInterval(checkGoogleTranslate), 5000);
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();