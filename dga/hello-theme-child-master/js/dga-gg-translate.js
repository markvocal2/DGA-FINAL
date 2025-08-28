/**
 * DGA Google Translate JavaScript
 * Version: 1.0.1
 */

// Initialize Google Translate Element
function googleTranslateElementInit() {
    const translateElement = new google.translate.TranslateElement({
        pageLanguage: 'th',
        includedLanguages: 'en,th',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
    }, 'google_translate_element_gt01');
    
    // Store reference for potential future use
    window.dgaTranslateElement = translateElement;
}

// Trigger translation programmatically
function triggerGoogleTranslation_gt01(targetLang) {
    const googleTranslateSelect = document.querySelector('#google_translate_element_gt01 select');
    if (googleTranslateSelect) {
        googleTranslateSelect.value = targetLang;
        googleTranslateSelect.dispatchEvent(new Event('change'));
    }
}

// Update internal links with language parameter
function updateInternalLinks_gt01(lang) {
    if (!lang) return;

    const internalLinks = document.querySelectorAll('a:not([data-lang-updated])');
    const currentHost = window.location.hostname;

    internalLinks.forEach(link => {
        link.setAttribute('data-lang-updated', 'true');
        const href = link.getAttribute('href');

        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
        }

        try {
            const url = new URL(href, document.baseURI);
            if (url.hostname === currentHost) {
                url.searchParams.set('lang', lang);
                link.href = url.toString();
            }
        } catch (error) {
            // Silently handle invalid URLs
        }
    });
}

// Save language preference via AJAX
function saveLanguagePreference(lang) {
    if (typeof dga_translate_vars !== 'undefined') {
        fetch(dga_translate_vars.ajax_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'dga_save_language',
                lang: lang,
                nonce: dga_translate_vars.nonce
            })
        });
    }
}

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetLang = urlParams.get('lang');

    if (targetLang) {
        // Save preference
        saveLanguagePreference(targetLang);
        
        // Wait for Google Translate to load
        const maxTries = 20;
        let currentTry = 0;

        const checkInterval = setInterval(() => {
            const googleSelect = document.querySelector('#google_translate_element_gt01 select');
            currentTry++;

            if (googleSelect) {
                clearInterval(checkInterval);
                triggerGoogleTranslation_gt01(targetLang);
                updateInternalLinks_gt01(targetLang);

                // Setup MutationObserver for dynamic content
                let debounceTimer;
                const observer = new MutationObserver(() => {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => {
                        updateInternalLinks_gt01(targetLang);
                    }, 250);
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

            } else if (currentTry > maxTries) {
                clearInterval(checkInterval);
                console.warn('DGA Translate: Could not find Google Translate select element.');
            }
        }, 100);
    }
});