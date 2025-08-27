/**
 * DGA Translate Safe JavaScript - Full Working Version
 * Version: 9.0.0
 */

(function() {
    'use strict';

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        console.log('Initializing DGA Translate...');
        
        const container = document.querySelector('.dga-translate-safe-xyz789');
        if (!container) {
            console.warn('Container not found');
            return;
        }

        const buttons = container.querySelectorAll('.dga-translate-btn-xyz789');
        const loadingDiv = container.querySelector('.dga-translate-loading-xyz789');
        const loadingText = container.querySelector('.dga-loading-text-xyz789');
        
        // Get current language from cookie
        let currentLang = getCookie('dga_user_lang_xyz789') || 'th';
        updateButtonStates(currentLang);

        // Add click handlers
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const newLang = this.dataset.lang;
                
                // Don't do anything if same language
                if (newLang === currentLang) {
                    console.log('Same language selected');
                    return;
                }
                
                // Show loading
                showLoading(newLang);
                
                // Change language
                changeLanguage(newLang);
            });
        });

        function showLoading(lang) {
            if (loadingDiv) {
                loadingDiv.classList.add('active');
                if (loadingText) {
                    loadingText.textContent = lang === 'en' ? 
                        'Changing to English...' : 
                        'กำลังเปลี่ยนเป็นภาษาไทย...';
                }
            }
            
            // Disable buttons
            buttons.forEach(btn => btn.disabled = true);
        }

        function changeLanguage(language) {
            console.log('Changing language to:', language);
            
            // Clear ALL cookies first
            clearAllTranslateCookies();
            
            // Set new language cookie
            setCookie('dga_user_lang_xyz789', language, 30);
            
            // Handle Google Translate
            if (language === 'en') {
                // Set Google Translate cookie for English
                setCookie('googtrans', '/th/en', 1);
                document.cookie = 'googtrans=/th/en; path=/';
                document.cookie = 'googtrans=/th/en; path=/; domain=' + window.location.hostname;
                document.cookie = 'googtrans=/th/en; path=/; domain=.' + window.location.hostname;
            } else {
                // Clear all Google Translate cookies for Thai
                clearGoogleTranslateCookies();
            }
            
            // Send AJAX request (optional - for server-side tracking)
            const formData = new FormData();
            formData.append('action', 'dga_change_language_xyz789');
            formData.append('language', language);
            formData.append('nonce', dgaTranslate.nonce);
            
            fetch(dgaTranslate.ajaxUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                console.log('Server response:', data);
                
                // Update loading text
                if (loadingText) {
                    loadingText.textContent = language === 'en' ? 
                        'Success! Reloading...' : 
                        'สำเร็จ! กำลังโหลดใหม่...';
                }
                
                // Force reload after short delay
                setTimeout(() => {
                    forcePageReload();
                }, 500);
            })
            .catch(error => {
                console.error('AJAX error:', error);
                // Reload anyway even if AJAX fails
                setTimeout(() => {
                    forcePageReload();
                }, 500);
            });
        }

        function forcePageReload() {
            console.log('Forcing page reload...');
            
            // Method 1: Clear cache and reload
            if ('caches' in window) {
                caches.keys().then(function(names) {
                    for (let name of names)
                        caches.delete(name);
                });
            }
            
            // Method 2: Add timestamp to prevent caching
            const timestamp = new Date().getTime();
            const url = window.location.href.split('#')[0].split('?')[0];
            const newUrl = url + '?_t=' + timestamp;
            
            // Method 3: Use multiple reload methods
            try {
                // Try location.replace first
                window.location.replace(newUrl);
            } catch(e) {
                try {
                    // Fallback to location.href
                    window.location.href = newUrl;
                } catch(e2) {
                    // Final fallback to location.reload
                    window.location.reload(true);
                }
            }
        }

        function clearAllTranslateCookies() {
            // List of all possible cookie names to clear
            const cookiesToClear = [
                'googtrans',
                '_googtrans',
                'googtrans',
                'dga_user_lang_abc123',
                'dga_user_language_abc123',
                'dga_reload_flag_abc123'
            ];
            
            const domains = [
                window.location.hostname,
                '.' + window.location.hostname,
                ''
            ];
            
            // Clear each cookie on all domain variations
            cookiesToClear.forEach(cookieName => {
                domains.forEach(domain => {
                    // Clear with different path and domain combinations
                    document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + domain + ';';
                    document.cookie = cookieName + '=; Max-Age=-99999999; path=/;';
                    document.cookie = cookieName + '=; Max-Age=-99999999; path=/; domain=' + domain + ';';
                });
            });
            
            console.log('All translation cookies cleared');
        }

        function clearGoogleTranslateCookies() {
            // Specifically clear Google Translate cookies
            const gtCookies = ['googtrans', '_googtrans'];
            const domains = [
                window.location.hostname,
                '.' + window.location.hostname,
                ''
            ];
            
            gtCookies.forEach(name => {
                domains.forEach(domain => {
                    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    if (domain) {
                        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + domain + ';';
                    }
                });
            });
            
            // Also try to remove using negative max age
            gtCookies.forEach(name => {
                document.cookie = name + '=; Max-Age=-99999999; path=/;';
            });
        }

        function updateButtonStates(lang) {
            buttons.forEach(btn => {
                if (btn.dataset.lang === lang) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Update container data
            container.dataset.currentLang = lang;
        }

        // Cookie helper functions
        function setCookie(name, value, days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            const expires = 'expires=' + date.toUTCString();
            document.cookie = name + '=' + value + '; ' + expires + '; path=/; SameSite=Lax';
        }

        function getCookie(name) {
            const nameEQ = name + '=';
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i].trim();
                if (c.indexOf(nameEQ) === 0) {
                    return c.substring(nameEQ.length);
                }
            }
            return null;
        }

        // Debug info
        console.log('DGA Translate initialized:', {
            currentLang: currentLang,
            googtrans: getCookie('googtrans'),
            cookies: document.cookie
        });
    }

    // Prevent any other scripts from blocking reload
    window.addEventListener('beforeunload', function(e) {
        // Don't prevent the reload
        delete e['returnValue'];
    });

})();