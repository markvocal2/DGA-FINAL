/**
 * DGA Translate API - Final Fixed Version for Thai/English Switching
 * Version: 14.0.0
 */

(function() {
    'use strict';

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        console.log('DGA Translate initializing...');
        
        const container = document.querySelector('.dga-translate-api-abc456');
        if (!container) return;

        const buttons = container.querySelectorAll('.dga-translate-btn-abc456');
        const loadingDiv = container.querySelector('.dga-translate-loading-abc456');
        const loadingText = container.querySelector('.dga-loading-text-abc456');
        const progressBar = container.querySelector('.dga-translate-progress-abc456');
        
        // Add WCAG compliance
        fixGoogleTranslateAccessibility();
        
        // Get current language from cookie
        let currentLang = getCookie('dga_lang_api_abc456') || 'th';
        
        // Force clean state on load
        cleanupGoogleTranslate(currentLang);
        
        updateButtonStates(currentLang);

        // Button click handlers
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const newLang = this.dataset.lang;
                
                if (newLang === currentLang) {
                    console.log('Same language selected');
                    return;
                }
                
                if (window.isChangingLanguage) {
                    console.log('Language change in progress');
                    return;
                }
                
                window.isChangingLanguage = true;
                currentLang = newLang;
                
                handleLanguageChange(newLang);
            });
            
            // Keyboard support
            button.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });

        function handleLanguageChange(newLang) {
            console.log(`=== SWITCHING TO ${newLang.toUpperCase()} ===`);
            
            if (newLang === 'th') {
                switchToThai();
            } else {
                switchToEnglish();
            }
        }

        function switchToThai() {
            console.log('Switching to Thai - Force Clean Method');
            
            showLoading('th', dgaTranslateAPI.labels.switchingToTh || 'กำลังเปลี่ยนเป็นภาษาไทย...');
            
            // Step 1: Aggressive cookie clearing
            clearAllTranslationCookies();
            
            // Step 2: Remove Google Translate elements from DOM
            removeGoogleTranslateElements();
            
            // Step 3: Set Thai cookie
            setCookie('dga_lang_api_abc456', 'th', 30);
            
            // Step 4: Send AJAX to clear server-side
            const formData = new FormData();
            formData.append('action', 'dga_change_language_api');
            formData.append('language', 'th');
            formData.append('nonce', dgaTranslateAPI.nonce);
            
            fetch(dgaTranslateAPI.ajaxUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                console.log('Server response:', data);
                
                // Update loading text
                if (loadingText) {
                    loadingText.textContent = dgaTranslateAPI.labels.reloadingTh || 'กำลังโหลดหน้าภาษาไทย...';
                }
                
                // Force reload with clean parameters
                setTimeout(() => {
                    forceCleanReload('th');
                }, 500);
            })
            .catch(error => {
                console.error('AJAX error:', error);
                // Reload anyway
                setTimeout(() => {
                    forceCleanReload('th');
                }, 500);
            });
        }

        function switchToEnglish() {
            console.log('Switching to English - Clean Method');
            
            showLoading('en', dgaTranslateAPI.labels.switchingToEn || 'Switching to English...');
            
            // Clear old cookies first
            clearAllTranslationCookies();
            
            // Set English cookies
            setCookie('dga_lang_api_abc456', 'en', 30);
            setCookie('googtrans', '/th/en', 1);
            
            // Send AJAX
            const formData = new FormData();
            formData.append('action', 'dga_change_language_api');
            formData.append('language', 'en');
            formData.append('nonce', dgaTranslateAPI.nonce);
            
            fetch(dgaTranslateAPI.ajaxUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                console.log('Server response:', data);
                
                // Update loading text
                if (loadingText) {
                    loadingText.textContent = dgaTranslateAPI.labels.reloadingEn || 'Loading English version...';
                }
                
                // Reload page
                setTimeout(() => {
                    forceCleanReload('en');
                }, 500);
            })
            .catch(error => {
                console.error('AJAX error:', error);
                setTimeout(() => {
                    forceCleanReload('en');
                }, 500);
            });
        }

        function clearAllTranslationCookies() {
            console.log('Clearing all translation cookies...');
            
            // List of all possible Google Translate cookie names
            const cookieNames = [
                'googtrans',
                '_googtrans',
                'googtrans',
                'googtrans-mini',
                'translate_once',
                'googtranslate'
            ];
            
            // Clear each cookie with multiple methods
            cookieNames.forEach(name => {
                // Method 1: Basic clear
                document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
                
                // Method 2: With current domain
                document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + window.location.hostname;
                
                // Method 3: With dot domain
                document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.' + window.location.hostname;
                
                // Method 4: Max-Age method
                document.cookie = name + '=; Max-Age=0; path=/';
                document.cookie = name + '=; Max-Age=0; path=/; domain=' + window.location.hostname;
                
                // Method 5: Without domain
                document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            });
            
            // Also clear any cookies that contain 'trans' in their name
            document.cookie.split(';').forEach(cookie => {
                const eqPos = cookie.indexOf('=');
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                
                if (name.toLowerCase().includes('trans') || name.toLowerCase().includes('googl')) {
                    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
                    document.cookie = name + '=; Max-Age=0; path=/';
                }
            });
            
            console.log('Cookies after clearing:', document.cookie);
        }

        function removeGoogleTranslateElements() {
            console.log('Removing Google Translate elements from DOM...');
            
            // Remove all Google Translate related elements
            const selectors = [
                '.goog-te-banner-frame',
                '.goog-te-menu-frame',
                '.goog-te-balloon-frame',
                '.goog-tooltip',
                '.goog-te-spinner',
                '.skiptranslate',
                '#goog-gt-tt',
                '#google_translate_element',
                '#google_translate_element_api',
                'iframe.goog-te-menu-frame',
                'iframe.goog-te-banner-frame',
                'div.goog-te-gadget',
                'div.goog-te-gadget-simple',
                'div.goog-te-menu-value',
                'span.goog-te-menu-value',
                'a.goog-te-menu-value',
                '[id^="goog-gt"]',
                '[class*="goog-te"]',
                '[class*="goog-trans"]'
            ];
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el && el.parentNode) {
                        el.parentNode.removeChild(el);
                    }
                });
            });
            
            // Reset body styles that Google Translate may have added
            document.body.style.top = '';
            document.body.style.position = '';
            document.body.style.marginTop = '';
            document.body.style.paddingTop = '';
            
            // Remove any translate attributes
            document.documentElement.removeAttribute('translate');
            document.body.removeAttribute('translate');
            
            // Remove Google Translate classes from body
            if (document.body.className) {
                document.body.className = document.body.className
                    .replace(/\bgoog-[^\s]+/g, '')
                    .replace(/\btranslated[^\s]*/g, '')
                    .trim();
            }
            
            // Clear any inline styles added by Google Translate
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                if (el.style && el.style.cssText && el.style.cssText.includes('translate')) {
                    el.style.cssText = el.style.cssText.replace(/[^;]*translate[^;]*/gi, '');
                }
            });
        }

        function forceCleanReload(lang) {
            console.log(`Force clean reload for ${lang}...`);
            
            // Clear browser cache if possible
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                });
            }
            
            // Build clean URL
            let url = window.location.protocol + '//' + window.location.host + window.location.pathname;
            
            // Add language parameter
            url += '?lang=' + lang;
            
            // Add cache buster
            url += '&_t=' + Date.now();
            
            // Add force parameter for Thai
            if (lang === 'th') {
                url += '&force_thai=1';
            }
            
            console.log('Reloading to:', url);
            
            // Use location.replace to avoid history issues
            try {
                window.location.replace(url);
            } catch(e) {
                window.location.href = url;
            }
        }

        function cleanupGoogleTranslate(lang) {
            if (lang === 'th') {
                // For Thai, remove all Google Translate traces
                removeGoogleTranslateElements();
                clearAllTranslationCookies();
            } else if (lang === 'en') {
                // For English, ensure Google Translate cookie is set
                if (getCookie('googtrans') !== '/th/en') {
                    setCookie('googtrans', '/th/en', 1);
                }
            }
        }

        function showLoading(lang, message) {
            if (loadingDiv) {
                loadingDiv.classList.add('active');
                loadingDiv.setAttribute('aria-live', 'polite');
                loadingDiv.setAttribute('aria-busy', 'true');
                
                if (loadingText) {
                    loadingText.textContent = message;
                }
            }
            
            if (progressBar) {
                progressBar.style.display = 'block';
                progressBar.setAttribute('role', 'progressbar');
                progressBar.setAttribute('aria-valuemin', '0');
                progressBar.setAttribute('aria-valuemax', '100');
                progressBar.setAttribute('aria-valuenow', '50');
            }
            
            // Disable buttons
            buttons.forEach(btn => {
                btn.disabled = true;
                btn.setAttribute('aria-disabled', 'true');
                btn.style.opacity = '0.5';
                btn.style.pointerEvents = 'none';
            });
        }

        function updateButtonStates(lang) {
            buttons.forEach(btn => {
                if (btn.dataset.lang === lang) {
                    btn.classList.add('active');
                    btn.setAttribute('aria-pressed', 'true');
                    btn.setAttribute('aria-current', 'true');
                } else {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                    btn.removeAttribute('aria-current');
                }
            });
            container.dataset.currentLang = lang;
        }

        function setCookie(name, value, days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            const expires = 'expires=' + date.toUTCString();
            
            // Set cookie with multiple methods for compatibility
            document.cookie = name + '=' + value + '; ' + expires + '; path=/; SameSite=Lax';
            document.cookie = name + '=' + value + '; ' + expires + '; path=/';
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

        function fixGoogleTranslateAccessibility() {
            // Add observer to fix Google Translate iframes
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        // Fix iframe titles
                        const iframes = document.querySelectorAll('iframe.goog-te-menu-frame, iframe.goog-te-banner-frame');
                        iframes.forEach(iframe => {
                            if (!iframe.title) {
                                iframe.title = 'Google Translate Widget';
                                iframe.setAttribute('aria-label', 'Google Translate Widget');
                            }
                        });
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        // Clean up on page load
        console.log('DGA Translate initialized:', {
            currentLang: currentLang,
            googtrans: getCookie('googtrans'),
            cookies: document.cookie
        });
        
        // Additional cleanup after page fully loads
        window.addEventListener('load', function() {
            setTimeout(() => {
                cleanupGoogleTranslate(currentLang);
            }, 1000);
        });
    }

    // Prevent reload interruption
    window.addEventListener('beforeunload', function(e) {
        if (window.isChangingLanguage) {
            delete e['returnValue'];
        }
    });

})();