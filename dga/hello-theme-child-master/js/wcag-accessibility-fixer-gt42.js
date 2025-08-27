/**
 * WCAG 2.1 AA Accessibility Fixer for Google Translate Widget
 * Version: 3.0.0
 * Fixes common accessibility issues automatically
 */

(function() {
    'use strict';

    class WCAGAccessibilityFixerGt42 {
        constructor() {
            this.config = window.wcagFixerConfigGt42 || {};
            this.observer = null;
            this.fixCount = 0;
            this.processedElements = new Set();
            this.retryCount = 0;
            this.maxRetries = 20;
            
            this.init();
        }

        init() {
            // เริ่มต้น monitoring ทันที
            this.startMonitoring();
            
            // เพิ่ม event listeners
            this.bindEvents();
            
            // ตรวจสอบเป็นระยะสำหรับ elements ที่โหลดช้า
            this.schedulePeriodicCheck();
        }

        startMonitoring() {
            // หยุด observer เก่าก่อน
            if (this.observer) {
                this.observer.disconnect();
            }

            // สร้าง MutationObserver ใหม่
            this.observer = new MutationObserver((mutations) => {
                this.handleMutations(mutations);
            });
        }

        enableClickEvents() {
            // เปิดใช้งาน click events สำหรับ Google Translate elements
            const gadgets = document.querySelectorAll('.goog-te-gadget-simple');
            const menuValues = document.querySelectorAll('.goog-te-menu-value');
            const gadgetIcons = document.querySelectorAll('.goog-te-gadget-icon');
            
            [...gadgets, ...menuValues, ...gadgetIcons].forEach((element, index) => {
                const elementId = `clickable-${index}-${Date.now()}`;
                
                if (this.processedElements.has(elementId)) return;
                
                // เพิ่ม event listeners
                if (!element.dataset.clickEnabled) {
                    // Mouse events
                    element.addEventListener('click', this.handleTranslateClick.bind(this));
                    element.addEventListener('mousedown', this.handleTranslateMouseDown.bind(this));
                    
                    // Touch events สำหรับ mobile
                    element.addEventListener('touchstart', this.handleTranslateTouch.bind(this));
                    element.addEventListener('touchend', this.handleTranslateClick.bind(this));
                    
                    // Keyboard events
                    element.addEventListener('keydown', this.handleTranslateKeydown.bind(this));
                    
                    // Focus events
                    element.addEventListener('focus', this.handleTranslateFocus.bind(this));
                    element.addEventListener('blur', this.handleTranslateBlur.bind(this));
                    
                    element.dataset.clickEnabled = 'true';
                    
                    if (this.config.debug) {
                        console.log('Enabled click events for element:', element);
                    }
                }
                
                this.processedElements.add(elementId);
            });
            
            // เปิดใช้งาน select/combo box events
            const combos = document.querySelectorAll('.goog-te-combo');
            combos.forEach((combo, index) => {
                const comboId = `combo-${index}-${Date.now()}`;
                
                if (this.processedElements.has(comboId)) return;
                
                if (!combo.dataset.eventsEnabled) {
                    combo.addEventListener('change', this.handleLanguageChange.bind(this));
                    combo.addEventListener('focus', this.handleComboFocus.bind(this));
                    combo.addEventListener('blur', this.handleComboBlur.bind(this));
                    
                    combo.dataset.eventsEnabled = 'true';
                    
                    if (this.config.debug) {
                        console.log('Enabled events for combo:', combo);
                    }
                }
                
                this.processedElements.add(comboId);
            });
        }

        handleTranslateClick(e) {
            if (this.config.debug) {
                console.log('Translate click detected:', e.target);
            }
            
            // ป้องกัน event bubbling ที่อาจทำให้เกิดปัญหา
            e.stopPropagation();
            
            // ตรวจสอบว่าเป็น valid click
            const target = e.target.closest('.goog-te-gadget-simple, .goog-te-menu-value, .goog-te-gadget-icon');
            if (target) {
                // ให้ Google Translate จัดการ click ตามปกติ
                this.announceToScreenReader('เปิดตัวเลือกภาษา');
                
                // เพิ่ม visual feedback
                target.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    target.style.transform = '';
                }, 150);
            }
        }

        handleTranslateMouseDown(e) {
            const target = e.target.closest('.goog-te-gadget-simple, .goog-te-menu-value');
            if (target) {
                target.style.transform = 'scale(0.95)';
            }
        }

        handleTranslateTouch(e) {
            // จัดการ touch events สำหรับ mobile
            const target = e.target.closest('.goog-te-gadget-simple, .goog-te-menu-value');
            if (target) {
                target.style.transform = 'scale(0.95)';
                
                if (this.config.debug) {
                    console.log('Touch detected on translate element');
                }
            }
        }

        handleTranslateKeydown(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                
                if (this.config.debug) {
                    console.log('Keyboard activation of translate element');
                }
                
                // จำลอง click event
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                
                e.target.dispatchEvent(clickEvent);
                this.announceToScreenReader('เปิดตัวเลือกภาษาด้วยแป้นพิมพ์');
            }
        }

        handleTranslateFocus(e) {
            const target = e.target;
            target.style.outline = '2px solid #0d6efd';
            target.style.outlineOffset = '2px';
            
            this.announceToScreenReader('โฟกัสที่ตัวเลือกภาษา');
        }

        handleTranslateBlur(e) {
            const target = e.target;
            target.style.outline = '';
            target.style.outlineOffset = '';
            target.style.transform = '';
        }

        handleLanguageChange(e) {
            const selectedValue = e.target.value;
            const selectedText = e.target.options[e.target.selectedIndex]?.text || selectedValue;
            
            if (this.config.debug) {
                console.log('Language changed to:', selectedValue, selectedText);
            }
            
            this.announceToScreenReader(`เปลี่ยนภาษาเป็น ${selectedText}`);
            
            // รีเซ็ต aria-expanded
            e.target.setAttribute('aria-expanded', 'false');
        }

        handleComboFocus(e) {
            e.target.setAttribute('aria-expanded', 'false');
            this.announceToScreenReader('เข้าสู่ตัวเลือกภาษา');
        }

        handleComboBlur(e) {
            e.target.setAttribute('aria-expanded', 'false');

            // เริ่ม observe
            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'id', 'style']
            });

            // แก้ไข elements ที่มีอยู่แล้ว
            this.fixExistingElements();
        }

        handleMutations(mutations) {
            let shouldFix = false;
            let shouldReinitialize = false;

            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (this.isGoogleTranslateElement(node)) {
                                shouldFix = true;
                            }
                            // ตรวจสอบว่ามี Google Translate elements ใหม่
                            if (node.classList && (
                                node.classList.contains('goog-te-gadget') ||
                                node.classList.contains('goog-te-combo') ||
                                node.classList.contains('goog-te-gadget-simple')
                            )) {
                                shouldReinitialize = true;
                            }
                        }
                    });
                }
            });

            if (shouldFix || shouldReinitialize) {
                // ใช้ setTimeout เพื่อให้ Google Translate สร้าง DOM เสร็จก่อน
                setTimeout(() => {
                    this.fixAllElements();
                    if (shouldReinitialize) {
                        this.enableClickEvents();
                    }
                }, 100);
            }
        }

        isGoogleTranslateElement(element) {
            if (!element.classList) return false;
            
            const gtClasses = [
                'goog-te-gadget',
                'goog-te-combo',
                'goog-te-banner-frame',
                'goog-te-menu',
                'VIpgJd-yAWNEb-hvhgNd-aXYTce'
            ];

            return gtClasses.some(className => 
                element.classList.contains(className) || 
                element.querySelector(`.${className}`)
            );
        }

        fixExistingElements() {
            this.fixAllElements();
        }

        fixAllElements() {
            try {
                // Debug: ตรวจสอบ elements ที่มีอยู่
                this.debugCurrentElements();
                
                this.fixGoogleTranslateForms();
                this.fixInputFields();
                this.fixIframes();
                this.fixSelectElements();
                this.addMissingSubmitButtons();
                this.enhanceKeyboardNavigation();
                this.updateAriaLabels();
                this.ensureWidgetVisibility();
                this.enableClickEvents(); // เพิ่มการเปิดใช้งาน click events
                
                this.fixCount++;
                
                if (this.config.debug) {
                    console.log(`WCAG fixes applied: ${this.fixCount}`);
                }
                
            } catch (error) {
                console.error('Error applying WCAG fixes:', error);
            }
        }

        debugCurrentElements() {
            if (!this.config.debug) return;
            
            const translateElements = document.querySelectorAll('.google-translate-element-gt42');
            const gadgets = document.querySelectorAll('.goog-te-gadget');
            const combos = document.querySelectorAll('.goog-te-combo');
            const loadingElements = document.querySelectorAll('.translate-loading-gt42');
            
            console.log('Debug - Current elements:', {
                translateElements: translateElements.length,
                gadgets: gadgets.length,
                combos: combos.length,
                loadingElements: loadingElements.length,
                bodyHasClass: document.body.classList.contains('translate-loaded-gt42')
            });
        }

        ensureWidgetVisibility() {
            // มั่นใจว่า Google Translate widget จะแสดงอยู่เสมอ
            const gadgets = document.querySelectorAll('.goog-te-gadget, .goog-te-gadget-simple');
            const combos = document.querySelectorAll('.goog-te-combo');
            
            [...gadgets, ...combos].forEach(element => {
                if (element) {
                    // บังคับให้แสดง
                    element.style.display = 'inline-block';
                    element.style.visibility = 'visible';
                    element.style.opacity = '1';
                    
                    // ซ่อน loading indicator ในตัวเอง
                    const loadingInside = element.querySelector('.translate-loading-gt42');
                    if (loadingInside) {
                        loadingInside.style.display = 'none';
                        loadingInside.setAttribute('aria-hidden', 'true');
                    }
                }
            });

            // ซ่อน loading indicators แยกต่างหาก
            const loadingElements = document.querySelectorAll('.translate-loading-gt42');
            loadingElements.forEach(loading => {
                const parent = loading.closest('.google-translate-element-gt42');
                const hasWidget = parent && (
                    parent.querySelector('.goog-te-gadget') ||
                    parent.querySelector('.goog-te-combo') ||
                    parent.querySelector('.goog-te-gadget-simple')
                );
                
                if (hasWidget) {
                    loading.style.display = 'none';
                    loading.setAttribute('aria-hidden', 'true');
                    
                    if (this.config.debug) {
                        console.log('Hidden loading indicator - widget found');
                    }
                }
            });
        }

        fixGoogleTranslateForms() {
            const forms = document.querySelectorAll('form[action*="translate.googleapis.com"]');
            
            forms.forEach(form => {
                const formId = form.id || 'translate-form-gt42';
                
                if (this.processedElements.has(formId)) return;
                
                // เพิ่ม aria-label สำหรับฟอร์ม
                if (!form.getAttribute('aria-label')) {
                    form.setAttribute('aria-label', this.config.labels?.translateForm || 'Translation voting form');
                }
                
                // เพิ่ม role
                if (!form.getAttribute('role')) {
                    form.setAttribute('role', 'form');
                }
                
                // เพิ่ม submit button หากไม่มี
                if (!form.querySelector('input[type="submit"], button[type="submit"], button:not([type])')) {
                    const submitBtn = document.createElement('button');
                    submitBtn.type = 'submit';
                    submitBtn.style.cssText = 'position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden;';
                    submitBtn.textContent = this.config.labels?.submitTranslation || 'Submit translation';
                    submitBtn.setAttribute('aria-label', this.config.labels?.submitTranslation || 'Submit translation');
                    form.appendChild(submitBtn);
                }
                
                this.processedElements.add(formId);
            });
        }

        fixInputFields() {
            const inputs = document.querySelectorAll('input[id*="goog-gt-voting"], input[name*="sl"], input[name*="tl"], input[name*="query"], input[name*="gtrans"], input[name*="vote"]');
            
            inputs.forEach((input, index) => {
                const inputId = input.id || `translate-input-${index}`;
                
                if (this.processedElements.has(inputId)) return;
                
                // เพิ่ม aria-label ตาม name attribute
                if (!input.getAttribute('aria-label')) {
                    const labelText = this.getLabelForInput(input);
                    input.setAttribute('aria-label', labelText);
                }
                
                // เพิ่ม aria-describedby หากจำเป็น
                if (!input.getAttribute('aria-describedby')) {
                    input.setAttribute('aria-describedby', `${inputId}-description`);
                }
                
                // ซ่อนจากผู้ใช้ทั่วไปเนื่องจากเป็น internal field
                if (!input.style.position) {
                    input.setAttribute('aria-hidden', 'true');
                    input.style.cssText = 'position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden;';
                }
                
                this.processedElements.add(inputId);
            });
        }

        getLabelForInput(input) {
            const name = input.name;
            const labels = this.config.labels || {};
            
            switch (name) {
                case 'sl': return labels.sourceLanguage || 'Source language code';
                case 'tl': return labels.targetLanguage || 'Target language code';
                case 'query': return labels.sourceText || 'Original text';
                case 'gtrans': return labels.translatedText || 'Translated text';
                case 'vote': return labels.vote || 'Translation vote';
                default: return `Translation field: ${name}`;
            }
        }

        fixIframes() {
            const iframes = document.querySelectorAll('iframe[name="votingFrame"], iframe[sandbox*="allow-scripts"]');
            
            iframes.forEach((iframe, index) => {
                const iframeId = iframe.name || `translate-iframe-${index}`;
                
                if (this.processedElements.has(iframeId)) return;
                
                // เพิ่ม title attribute
                if (!iframe.getAttribute('title')) {
                    const title = iframe.name === 'votingFrame' 
                        ? (this.config.labels?.votingFrame || 'Translation voting frame')
                        : (this.config.labels?.processingFrame || 'Translation processing frame');
                    iframe.setAttribute('title', title);
                }
                
                // เพิ่ม aria-label
                if (!iframe.getAttribute('aria-label')) {
                    iframe.setAttribute('aria-label', iframe.getAttribute('title'));
                }
                
                // ซ่อนจากผู้ใช้ทั่วไปเนื่องจากเป็น internal frame
                iframe.setAttribute('aria-hidden', 'true');
                
                this.processedElements.add(iframeId);
            });
        }

        fixSelectElements() {
            const selects = document.querySelectorAll('.goog-te-combo');
            
            selects.forEach((select, index) => {
                const selectId = select.id || `translate-select-${index}`;
                
                if (this.processedElements.has(selectId)) return;
                
                // เพิ่ม aria-label
                if (!select.getAttribute('aria-label')) {
                    select.setAttribute('aria-label', this.config.labels?.selectLanguage || 'Select language for translation');
                }
                
                // เพิ่ม role หากจำเป็น
                if (!select.getAttribute('role')) {
                    select.setAttribute('role', 'combobox');
                }
                
                // เพิ่ม aria-expanded
                select.setAttribute('aria-expanded', 'false');
                
                // เพิ่ม event listeners สำหรับ aria-expanded
                select.addEventListener('mousedown', () => {
                    select.setAttribute('aria-expanded', 'true');
                });
                
                select.addEventListener('blur', () => {
                    select.setAttribute('aria-expanded', 'false');
                });
                
                select.addEventListener('change', () => {
                    select.setAttribute('aria-expanded', 'false');
                });
                
                this.processedElements.add(selectId);
            });
        }

        addMissingSubmitButtons() {
            const gadgets = document.querySelectorAll('.goog-te-gadget-simple');
            
            gadgets.forEach((gadget, index) => {
                const gadgetId = `gadget-${index}`;
                
                if (this.processedElements.has(gadgetId)) return;
                
                // เพิ่ม role และ aria-label
                if (!gadget.getAttribute('role')) {
                    gadget.setAttribute('role', 'button');
                }
                
                if (!gadget.getAttribute('aria-label')) {
                    gadget.setAttribute('aria-label', this.config.labels?.selectLanguage || 'Select language for translation');
                }
                
                // เพิ่ม tabindex หากไม่มี
                if (!gadget.getAttribute('tabindex')) {
                    gadget.setAttribute('tabindex', '0');
                }
                
                // เพิ่ม keyboard support
                gadget.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        gadget.click();
                    }
                });
                
                this.processedElements.add(gadgetId);
            });
        }

        enhanceKeyboardNavigation() {
            // เพิ่ม keyboard navigation support สำหรับ elements ที่เกี่ยวข้อง
            const clickableElements = document.querySelectorAll('.goog-te-menu-value, .goog-te-gadget-icon');
            
            clickableElements.forEach(element => {
                if (!element.getAttribute('tabindex')) {
                    element.setAttribute('tabindex', '0');
                }
                
                if (!element.getAttribute('role')) {
                    element.setAttribute('role', 'button');
                }
                
                element.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        element.click();
                    }
                });
            });
        }

        updateAriaLabels() {
            // อัพเดท aria-labels สำหรับ elements ต่างๆ
            const menuValues = document.querySelectorAll('.goog-te-menu-value span');
            menuValues.forEach(span => {
                const text = span.textContent.trim();
                if (text && !span.parentElement.getAttribute('aria-label')) {
                    span.parentElement.setAttribute('aria-label', `${this.config.labels?.currentLanguage || 'Current language'}: ${text}`);
                }
            });
        }

        schedulePeriodicCheck() {
            // ตรวจสอบเป็นระยะเพื่อจับ elements ที่โหลดช้า
            const checkInterval = setInterval(() => {
                this.retryCount++;
                
                if (this.retryCount >= this.maxRetries) {
                    clearInterval(checkInterval);
                    return;
                }
                
                // ตรวจสอบว่ามี Google Translate elements ใหม่หรือไม่
                const hasNewElements = document.querySelector('.goog-te-gadget:not([data-wcag-fixed])');
                if (hasNewElements) {
                    this.fixAllElements();
                }
                
            }, 1000);
        }

        bindEvents() {
            // Listen สำหรับการเปลี่ยนภาษา
            document.addEventListener('change', (e) => {
                if (e.target.classList.contains('goog-te-combo')) {
                    setTimeout(() => this.fixAllElements(), 500);
                }
            });
            
            // Listen สำหรับ focus events
            document.addEventListener('focus', (e) => {
                if (this.isGoogleTranslateElement(e.target)) {
                    this.announceToScreenReader(e.target);
                }
            }, true);
        }

        announceToScreenReader(element) {
            // สร้างการประกาศสำหรับ screen reader
            const announcement = this.createScreenReaderAnnouncement(element);
            if (announcement) {
                this.announce(announcement);
            }
        }

        createScreenReaderAnnouncement(element) {
            if (element.classList.contains('goog-te-combo')) {
                return this.config.labels?.selectLanguage || 'Language selector';
            }
            if (element.classList.contains('goog-te-gadget-simple')) {
                return this.config.labels?.translateTo || 'Translation options';
            }
            return null;
        }

        announce(message) {
            // สร้าง live region สำหรับประกาศ
            let announcer = document.getElementById('wcag-announcer-gt42');
            if (!announcer) {
                announcer = document.createElement('div');
                announcer.id = 'wcag-announcer-gt42';
                announcer.setAttribute('aria-live', 'polite');
                announcer.setAttribute('aria-atomic', 'true');
                announcer.style.cssText = 'position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden;';
                document.body.appendChild(announcer);
            }
            
            announcer.textContent = message;
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        }

        // Public method สำหรับการเรียกใช้จากภายนอก
        forceRecheck() {
            this.processedElements.clear();
            this.fixAllElements();
        }
    }

    // สร้าง instance และเก็บไว้ใน global scope
    window.WCAGAccessibilityFixerGt42 = new WCAGAccessibilityFixerGt42();

    // Export startMonitoring method สำหรับการเรียกใช้จากภายนอก
    window.WCAGAccessibilityFixerGt42.startMonitoring = function() {
        window.WCAGAccessibilityFixerGt42.startMonitoring();
    };

})();