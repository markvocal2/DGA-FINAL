/**
 * Enhanced Google Translate Controller with Force Cookie Clear
 * Version: 6.0.0
 */

(function($) {
    'use strict';

    const DGATranslateEnhanced = {
        currentLang: 'th',
        isChanging: false,
        config: null,
        cookieCleanInterval: null,

        init() {
            this.config = window.dgaTranslateEnhanced || {};
            this.currentLang = this.config.currentLang || 'th';
            
            // Force initial cookie cleanup
            this.forceClearAllCookies();
            
            this.bindEvents();
            this.hideGoogleTranslateBar();
            this.updateButtonStates();
            
            // Check and apply saved language
            this.checkAndApplyLanguage();
            
            // Monitor for unauthorized cookie changes
            this.startCookieMonitor();
        },

        bindEvents() {
            // Button clicks with forced cookie clear
            $('.dga-translate-btn-xyz456').on('click', (e) => {
                e.preventDefault();
                const $btn = $(e.currentTarget);
                const targetLang = $btn.data('lang');
                
                if (!this.isChanging && targetLang !== this.currentLang) {
                    this.changeLanguage(targetLang);
                }
            });

            // Keyboard accessibility
            $('.dga-translate-btn-xyz456').on('keypress', (e) => {
                if (e.which === 13 || e.which === 32) {
                    e.preventDefault();
                    $(e.currentTarget).trigger('click');
                }
            });
        },

        changeLanguage(targetLang) {
            if (this.isChanging) return;
            
            this.isChanging = true;
            this.showLoading(true, this.config.labels.clearing);

            // Step 1: Force clear ALL cookies
            this.forceClearAllCookies();
            
            // Step 2: Wait a moment for cookies to clear
            setTimeout(() => {
                // Step 3: Set new language cookies
                this.setLanguageCookies(targetLang);
                
                // Step 4: Update loading message
                this.showLoading(true, this.config.labels.switching);
                
                // Step 5: Save via AJAX
                $.ajax({
                    url: this.config.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'dga_change_language_enhanced',
                        language: targetLang,
                        nonce: this.config.nonce
                    },
                    success: (response) => {
                        if (response.success) {
                            // Update current language
                            this.currentLang = targetLang;
                            
                            // Show success message
                            this.showMessage(targetLang === 'en' ? 
                                'Switching to English...' : 
                                'กำลังเปลี่ยนเป็นภาษาไทย...');
                            
                            // Force reload with cache buster
                            const cacheBuster = response.data.cache_buster || Date.now();
                            const separator = window.location.href.indexOf('?') > -1 ? '&' : '?';
                            const newUrl = window.location.href.split('?')[0] + 
                                         separator + 'lang_switch=' + targetLang + 
                                         '&v=' + cacheBuster;
                            
                            setTimeout(() => {
                                window.location.href = newUrl;
                            }, 300);
                        }
                    },
                    error: () => {
                        // Fallback: Force reload anyway
                        this.forcePageReload(targetLang);
                    }
                });
            }, 200);
        },

        forceClearAllCookies() {
            // List of all possible translation-related cookies
            const cookiesToClear = [
                'googtrans',
                'googtrans-en', 
                'googtrans-th',
                'dga_user_lang',
                'dga_user_lang_xyz456',
                'dga_user_language',
                '_googtrans',
                'GOOGTRANS',
                'google_translate_params',
                'translate_lang'
            ];
            
            // Get all cookies
            const allCookies = document.cookie.split(';');
            
            // Clear each cookie
            cookiesToClear.forEach(cookieName => {
                // Clear on all possible domains
                this.deleteCookie(cookieName, '/');
                this.deleteCookie(cookieName, '/', location.hostname);
                this.deleteCookie(cookieName, '/', '.' + location.hostname);
                this.deleteCookie(cookieName, '/', this.config.domain);
                this.deleteCookie(cookieName, '/', '.' + this.config.domain);
            });
            
            // Also clear any cookies that contain 'trans' or 'lang'
            allCookies.forEach(cookie => {
                const eqPos = cookie.indexOf('=');
                if (eqPos > -1) {
                    const name = cookie.substr(0, eqPos).trim();
                    if (name.toLowerCase().includes('trans') || 
                        name.toLowerCase().includes('lang')) {
                        this.deleteCookie(name, '/');
                        this.deleteCookie(name, '/', location.hostname);
                    }
                }
            });
            
            // Clear local storage items
            if (typeof(Storage) !== "undefined") {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.includes('translate') || key.includes('lang'))) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }
            
            // Clear session storage
            if (typeof(Storage) !== "undefined") {
                const keysToRemove = [];
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    if (key && (key.includes('translate') || key.includes('lang'))) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => sessionStorage.removeItem(key));
            }
        },

        deleteCookie(name, path, domain) {
            const expires = 'Thu, 01 Jan 1970 00:00:00 UTC';
            let cookie = name + '=; expires=' + expires;
            
            if (path) cookie += '; path=' + path;
            if (domain) cookie += '; domain=' + domain;
            
            document.cookie = cookie;
            
            // Also try with Max-Age
            cookie = name + '=; Max-Age=-99999999';
            if (path) cookie += '; path=' + path;
            if (domain) cookie += '; domain=' + domain;
            document.cookie = cookie;
        },

        setLanguageCookies(lang) {
            // Clear first
            this.forceClearAllCookies();
            
            // Set new cookies
            const expires = new Date();
            expires.setTime(expires.getTime() + (30 * 24 * 60 * 60 * 1000));
            
            // Set custom language cookie
            document.cookie = 'dga_user_lang_xyz456=' + lang + 
                            '; expires=' + expires.toUTCString() + 
                            '; path=/; SameSite=Lax';
            
            // Set Google Translate cookies
            if (lang === 'en') {
                document.cookie = 'googtrans=/th/en; path=/';
                document.cookie = 'googtrans=/th/en; path=/; domain=' + location.hostname;
                document.cookie = 'googtrans=/th/en; path=/; domain=.' + location.hostname;
            }
        },

        checkAndApplyLanguage() {
            // Force clear unwanted cookies first
            this.forceClearUnwantedCookies();
            
            // Get current cookie value
            const cookies = this.parseCookies();
            const googleTransCookie = cookies['googtrans'];
            
            // Apply translation if needed
            if (this.currentLang === 'en' && googleTransCookie !== '/th/en') {
                this.triggerGoogleTranslate('en');
            } else if (this.currentLang === 'th' && googleTransCookie === '/th/en') {
                this.triggerGoogleTranslate('th');
            }
        },

        forceClearUnwantedCookies() {
            const cookies = this.parseCookies();
            const currentLang = this.config.currentLang || 'th';
            
            // If current language is Thai but Google cookie is set to English
            if (currentLang === 'th' && cookies['googtrans'] === '/th/en') {
                this.deleteCookie('googtrans', '/');
                this.deleteCookie('googtrans', '/', location.hostname);
            }
            // If current language is English but Google cookie is not set
            else if (currentLang === 'en' && cookies['googtrans'] !== '/th/en') {
                this.setLanguageCookies('en');
            }
        },

        parseCookies() {
            const cookies = {};
            document.cookie.split(';').forEach(cookie => {
                const parts = cookie.split('=');
                if (parts.length === 2) {
                    cookies[parts[0].trim()] = decodeURIComponent(parts[1].trim());
                }
            });
            return cookies;
        },

        triggerGoogleTranslate(lang) {
            // Try multiple methods to trigger translation
            
            // Method 1: Direct frame manipulation
            const checkFrame = setInterval(() => {
                const $frame = $('iframe.goog-te-menu-frame:first');
                
                if ($frame.length > 0) {
                    clearInterval(checkFrame);
                    
                    try {
                        const doc = $frame[0].contentDocument || $frame[0].contentWindow.document;
                        const $options = $(doc).find('.goog-te-menu2-item span.text');
                        
                        $options.each(function() {
                            const text = $(this).text();
                            if ((lang === 'en' && text === 'English') || 
                                (lang === 'th' && (text === 'Thai' || text === 'ไทย'))) {
                                $(this).click();
                                return false;
                            }
                        });
                    } catch (e) {
                        // Method 2: Use select element
                        const $select = $('.goog-te-combo');
                        if ($select.length) {
                            $select.val(lang === 'en' ? 'en' : 'th').trigger('change');
                        }
                    }
                }
            }, 100);
            
            // Stop after 3 seconds
            setTimeout(() => clearInterval(checkFrame), 3000);
            
            // Method 3: Force Google Translate API
            if (typeof google !== 'undefined' && google.translate) {
                try {
                    const instance = google.translate.TranslateElement.getInstance();
                    if (instance) {
                        instance.showBanner(false);
                        if (lang === 'th') {
                            instance.restore();
                        }
                    }
                } catch (e) {
                    console.log('Google Translate API method failed');
                }
            }
        },

        startCookieMonitor() {
            // Monitor cookies every 2 seconds
            this.cookieCleanInterval = setInterval(() => {
                if (!this.isChanging) {
                    this.forceClearUnwantedCookies();
                }
            }, 2000);
        },

        hideGoogleTranslateBar() {
            // Enhanced CSS to hide Google Translate elements
            const style = `
                <style id="dga-hide-translate-bar-xyz456">
                    .skiptranslate,
                    .goog-te-banner-frame,
                    .goog-te-gadget,
                    .goog-te-gadget-icon,
                    .goog-te-gadget-simple,
                    .goog-te-menu-value,
                    .goog-te-menu-frame,
                    .goog-te-balloon-frame,
                    #goog-gt-tt,
                    #google_translate_element_xyz456,
                    iframe.skiptranslate {
                        display: none !important;
                        visibility: hidden !important;
                        height: 0 !important;
                        width: 0 !important;
                        line-height: 0 !important;
                        opacity: 0 !important;
                        overflow: hidden !important;
                    }
                    body {
                        top: 0 !important;
                        position: static !important;
                        min-height: initial !important;
                    }
                    .goog-te-spinner-pos {
                        display: none !important;
                    }
                    html {
                        margin-top: 0 !important;
                    }
                </style>
            `;
            
            if (!$('#dga-hide-translate-bar-xyz456').length) {
                $('head').append(style);
            }

            // Force fix body position
            const fixBodyPosition = () => {
                const $body = $('body');
                if ($body.css('top') !== '0px' || $body.css('position') === 'relative') {
                    $body.css({
                        'top': '0px',
                        'position': 'static'
                    });
                }
                
                // Remove any Google Translate classes
                $body.removeClass('translated-ltr translated-rtl');
                $('html').removeClass('translated-ltr translated-rtl');
            };

            // Initial fix
            fixBodyPosition();
            
            // Periodic check
            setInterval(fixBodyPosition, 500);
            
            // Watch for DOM changes
            const observer = new MutationObserver(fixBodyPosition);
            observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        },

        updateButtonStates() {
            $('.dga-translate-btn-xyz456').each((index, btn) => {
                const $btn = $(btn);
                const lang = $btn.data('lang');
                
                if (lang === this.currentLang) {
                    $btn.addClass('active').attr('aria-pressed', 'true');
                } else {
                    $btn.removeClass('active').attr('aria-pressed', 'false');
                }
            });
        },

        showLoading(show, message) {
            const $loading = $('.dga-translate-loading-xyz456');
            const $buttons = $('.dga-translate-buttons-xyz456');
            const $loadingText = $('.dga-loading-text-xyz456');
            
            if (show) {
                $loading.addClass('active');
                $buttons.addClass('loading');
                if (message) {
                    $loadingText.text(message);
                }
            } else {
                $loading.removeClass('active');
                $buttons.removeClass('loading');
                $loadingText.text('');
            }
        },

        showMessage(text) {
            // Create message element
            const $message = $('<div class="dga-translate-message-xyz456">')
                .text(text)
                .appendTo('body');
            
            // Animate in
            setTimeout(() => $message.addClass('show'), 10);
            
            // Remove after delay
            setTimeout(() => {
                $message.removeClass('show');
                setTimeout(() => $message.remove(), 300);
            }, 2000);
        },

        forcePageReload(targetLang) {
            // Force reload with multiple cache busting parameters
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000);
            const baseUrl = window.location.href.split('?')[0];
            const newUrl = baseUrl + '?lang_switch=' + targetLang + 
                          '&v=' + timestamp + '&r=' + random;
            
            // Clear cache and reload
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                });
            }
            
            window.location.href = newUrl;
        }
    };

    // Initialize on document ready
    $(document).ready(() => {
        DGATranslateEnhanced.init();
    });

    // Reinitialize after window load
    window.addEventListener('load', () => {
        setTimeout(() => {
            DGATranslateEnhanced.forceClearUnwantedCookies();
            DGATranslateEnhanced.checkAndApplyLanguage();
        }, 1000);
    });

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        if (DGATranslateEnhanced.cookieCleanInterval) {
            clearInterval(DGATranslateEnhanced.cookieCleanInterval);
        }
    });

})(jQuery);