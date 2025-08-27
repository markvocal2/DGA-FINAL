// Enhanced Contact Form with Cloudflare Turnstile - Modern ES6+ JavaScript
(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        selectors: {
            form: '#department-contact-form-kzn427',
            toast: '#toast-notification-kzn427',
            status: '#form-status-kzn427',
            turnstile: '#cf-turnstile-kzn427',
            submitBtn: '.submit-button-kzn427'
        },
        validation: {
            minMessageLength: 10,
            emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phoneRegex: /^[0-9\-\+\(\)\s]+$/
        },
        animation: {
            duration: 300,
            toastDuration: 5000
        }
    };
    
    // State management
    let formState = {
        isSubmitting: false,
        turnstileToken: null,
        turnstileWidgetId: null
    };
    
    // Clean up any existing Turnstile widgets on page load
    window.addEventListener('DOMContentLoaded', () => {
        // Clean up any stale Turnstile widgets
        const container = document.querySelector(CONFIG.selectors.turnstile);
        if (container && container.querySelector('iframe')) {
            container.innerHTML = '';
        }
        
        // Initialize form after cleanup
        initializeContactForm();
    });
    
    // Prevent multiple initializations
    let isInitialized = false;
    
    function initializeContactForm() {
        // Prevent multiple initializations
        if (isInitialized) {
            return;
        }
        
        const form = document.querySelector(CONFIG.selectors.form);
        if (!form) return;
        
        isInitialized = true;
        
        // Setup form components
        setupFormValidation(form);
        setupFormSubmission(form);
        setupKeyboardNavigation(form);
        setupTurnstile();
        setupAccessibility();
        
        // Add smooth animations
        addFormAnimations(form);
    }
    
    // Cloudflare Turnstile setup
    function setupTurnstile() {
        // Check if already initialized
        if (formState.turnstileWidgetId !== null) {
            return;
        }
        
        if (typeof window.turnstile === 'undefined') {
            // Wait for Turnstile to load
            const loadHandler = () => {
                initializeTurnstile();
                window.removeEventListener('load', loadHandler);
            };
            window.addEventListener('load', loadHandler);
        } else {
            initializeTurnstile();
        }
    }
    
    function initializeTurnstile() {
        const container = document.querySelector(CONFIG.selectors.turnstile);
        
        // Prevent duplicate initialization
        if (!container || !window.turnstile || formState.turnstileWidgetId !== null) {
            return;
        }
        
        // Check if already rendered
        if (container.innerHTML.trim() !== '') {
            console.warn('Turnstile already rendered');
            return;
        }
        
        // Mark container as initialized
        container.setAttribute('data-initialized', 'true');
        
        try {
            // Remove any existing Turnstile widgets in the container
            container.innerHTML = '';
            
            formState.turnstileWidgetId = window.turnstile.render(container, {
                sitekey: contact_ajax_kzn427.turnstile_sitekey,
                theme: 'light',
                size: 'normal',
                callback: function(token) {
                    formState.turnstileToken = token;
                    clearError(document.getElementById('captcha-error-kzn427'));
                },
                'expired-callback': function() {
                    formState.turnstileToken = null;
                    showError(document.getElementById('captcha-error-kzn427'), 
                             'CAPTCHA หมดอายุ กรุณายืนยันใหม่อีกครั้ง');
                },
                'error-callback': function() {
                    formState.turnstileToken = null;
                    showError(document.getElementById('captcha-error-kzn427'), 
                             'เกิดข้อผิดพลาดกับ CAPTCHA กรุณารีเฟรชหน้าและลองใหม่');
                }
            });
        } catch (error) {
            console.error('Turnstile initialization error:', error);
            formState.turnstileWidgetId = null;
        }
    }
    
    // Form validation setup
    function setupFormValidation(form) {
        const inputs = form.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            // Real-time validation on input
            input.addEventListener('input', debounce(() => {
                if (input.value.trim()) {
                    validateField(input);
                }
            }, 300));
            
            // Validation on blur
            input.addEventListener('blur', () => {
                validateField(input);
            });
            
            // Clear error on focus
            input.addEventListener('focus', () => {
                if (input.classList.contains('error')) {
                    input.classList.remove('error');
                }
            });
        });
    }
    
    // Field validation
    function validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        const errorElement = document.getElementById(`${fieldName.replace('contact_', '')}-error-kzn427`);
        
        // Reset error state
        clearError(errorElement);
        field.classList.remove('error');
        
        // Required field check
        if (field.hasAttribute('required') && !value) {
            showError(errorElement, 'กรุณากรอกข้อมูลในช่องนี้');
            field.classList.add('error');
            return false;
        }
        
        // Specific field validation
        switch (field.type) {
            case 'email':
                if (value && !CONFIG.validation.emailRegex.test(value)) {
                    showError(errorElement, 'รูปแบบอีเมลไม่ถูกต้อง');
                    field.classList.add('error');
                    return false;
                }
                break;
                
            case 'tel':
                if (value && !CONFIG.validation.phoneRegex.test(value)) {
                    showError(errorElement, 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง');
                    field.classList.add('error');
                    return false;
                }
                break;
                
            case 'textarea':
                if (value && value.length < CONFIG.validation.minMessageLength) {
                    showError(errorElement, `กรุณากรอกข้อความอย่างน้อย ${CONFIG.validation.minMessageLength} ตัวอักษร`);
                    field.classList.add('error');
                    return false;
                }
                break;
        }
        
        // Add success animation
        field.classList.add('valid');
        setTimeout(() => field.classList.remove('valid'), 1000);
        
        return true;
    }
    
    // Form submission
    function setupFormSubmission(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (formState.isSubmitting) return;
            
            // Validate all fields
            const isValid = validateAllFields(form);
            if (!isValid) {
                showToast('กรุณาตรวจสอบข้อมูลให้ครบถ้วน', 'error');
                return;
            }
            
            // Check Turnstile token
            if (!formState.turnstileToken) {
                showError(document.getElementById('captcha-error-kzn427'), 
                         'กรุณายืนยันว่าคุณไม่ใช่โปรแกรมอัตโนมัติ');
                showToast('กรุณายืนยัน CAPTCHA', 'error');
                return;
            }
            
            await submitForm(form);
        });
    }
    
    // Validate all fields
    function validateAllFields(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        let firstErrorField = null;
        
        requiredFields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
                if (!firstErrorField) {
                    firstErrorField = field;
                }
            }
        });
        
        // Focus first error field
        if (firstErrorField) {
            firstErrorField.focus();
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        return isValid;
    }
    
    // Submit form via AJAX
    async function submitForm(form) {
        formState.isSubmitting = true;
        
        const submitBtn = form.querySelector(CONFIG.selectors.submitBtn);
        const btnText = submitBtn.querySelector('.button-text-kzn427');
        const btnLoader = submitBtn.querySelector('.button-loader-kzn427');
        const originalText = btnText.textContent;
        
        // Update button state
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        btnText.textContent = contact_ajax_kzn427.messages.sending;
        
        // Prepare form data
        const formData = new FormData(form);
        formData.append('action', 'contact_form_submit_kzn427');
        formData.append('nonce', contact_ajax_kzn427.nonce);
        formData.append('cf_turnstile_response', formState.turnstileToken || '');
        
        try {
            const response = await fetch(contact_ajax_kzn427.ajax_url, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            // Check if response is OK
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Get response text first
            const responseText = await response.text();
            
            // Try to parse as JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Response is not valid JSON:', responseText);
                
                // Check if it's a PHP error
                if (responseText.includes('Fatal error') || responseText.includes('Warning')) {
                    throw new Error('Server error occurred. Please check server logs.');
                } else {
                    throw new Error('Invalid server response');
                }
            }
            
            // Handle response
            if (data.success) {
                // Success handling
                handleSubmissionSuccess(form, data.data.message);
                
                // Reset form
                form.reset();
                resetTurnstile();
                
            } else {
                // Error handling
                const errorMessage = data.data?.message || contact_ajax_kzn427.messages.error;
                
                // Log debug info if available
                if (data.data?.debug && console.debug) {
                    console.debug('Form submission debug:', data.data.debug);
                }
                
                handleSubmissionError(errorMessage);
            }
            
        } catch (error) {
            console.error('Submission error:', error);
            
            // Provide user-friendly error message
            let userMessage = contact_ajax_kzn427.messages.error;
            
            if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                userMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
            } else if (error.message.includes('500')) {
                userMessage = 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่ในภายหลัง';
            }
            
            handleSubmissionError(userMessage);
            
        } finally {
            // Reset button state
            formState.isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            btnText.textContent = originalText;
        }
    }
    
    // Handle successful submission
    function handleSubmissionSuccess(form, message) {
        // Show success message
        showToast(message, 'success');
        showFormStatus(message, 'success');
        
        // Add success animation to form
        form.classList.add('submission-success');
        setTimeout(() => form.classList.remove('submission-success'), 2000);
        
        // Clear all errors
        form.querySelectorAll('.error-message-kzn427').forEach(error => {
            error.textContent = '';
        });
        
        form.querySelectorAll('.error').forEach(field => {
            field.classList.remove('error');
        });
        
        // Announce to screen readers
        announceToScreenReader('ส่งแบบฟอร์มสำเร็จ');
    }
    
    // Handle submission error
    function handleSubmissionError(message) {
        showToast(message, 'error');
        showFormStatus(message, 'error');
        
        // Reset Turnstile on error
        resetTurnstile();
        
        // Announce to screen readers
        announceToScreenReader('เกิดข้อผิดพลาด: ' + message);
    }
    
    // Reset Turnstile widget
    function resetTurnstile() {
        if (window.turnstile && formState.turnstileWidgetId !== null) {
            try {
                window.turnstile.reset(formState.turnstileWidgetId);
                formState.turnstileToken = null;
            } catch (error) {
                console.error('Error resetting Turnstile:', error);
                // If reset fails, remove the widget and reinitialize
                const container = document.querySelector(CONFIG.selectors.turnstile);
                if (container) {
                    container.innerHTML = '';
                    container.removeAttribute('data-initialized');
                    formState.turnstileWidgetId = null;
                    formState.turnstileToken = null;
                    // Reinitialize after a short delay
                    setTimeout(() => initializeTurnstile(), 100);
                }
            }
        }
    }
    
    // Show error message
    function showError(element, message) {
        if (!element) return;
        element.textContent = message;
        element.classList.add('show');
    }
    
    // Clear error message
    function clearError(element) {
        if (!element) return;
        element.textContent = '';
        element.classList.remove('show');
    }
    
    // Show toast notification
    function showToast(message, type = 'success') {
        const toast = document.querySelector(CONFIG.selectors.toast);
        if (!toast) return;
        
        const toastMessage = toast.querySelector('.toast-message-kzn427');
        const toastIcon = toast.querySelector('.toast-icon-kzn427');
        
        // Update toast content
        toastMessage.textContent = message;
        toast.className = `toast-notification-kzn427 ${type}`;
        
        // Update icon based on type
        if (type === 'error') {
            toastIcon.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
        } else {
            toastIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
        }
        
        // Show toast with animation
        toast.style.display = 'flex';
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Hide after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.style.display = 'none', CONFIG.animation.duration);
        }, CONFIG.animation.toastDuration);
    }
    
    // Show form status message
    function showFormStatus(message, type = 'success') {
        const status = document.querySelector(CONFIG.selectors.status);
        if (!status) return;
        
        status.textContent = message;
        status.className = `form-status-kzn427 ${type}`;
        status.style.display = 'block';
        
        // Auto hide after delay
        setTimeout(() => {
            status.style.display = 'none';
        }, 10000);
    }
    
    // Keyboard navigation setup
    function setupKeyboardNavigation(form) {
        const focusableElements = form.querySelectorAll(
            'input, textarea, button, [tabindex]:not([tabindex="-1"])'
        );
        
        focusableElements.forEach((element, index) => {
            element.addEventListener('keydown', (e) => {
                // Enter key navigation (except for textarea and submit button)
                if (e.key === 'Enter' && !element.matches('textarea, button[type="submit"]')) {
                    e.preventDefault();
                    const nextElement = focusableElements[index + 1];
                    if (nextElement) {
                        nextElement.focus();
                    }
                }
                
                // Escape key to clear errors
                if (e.key === 'Escape' && element.classList.contains('error')) {
                    const errorElement = document.getElementById(
                        `${element.name.replace('contact_', '')}-error-kzn427`
                    );
                    clearError(errorElement);
                    element.classList.remove('error');
                }
            });
        });
    }
    
    // Accessibility setup
    function setupAccessibility() {
        // Create screen reader announcement element
        const announcer = document.createElement('div');
        announcer.id = 'form-announcer-kzn427';
        announcer.className = 'sr-only';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(announcer);
        
        // Add skip link if needed
        addSkipLink();
    }
    
    // Add skip link for keyboard navigation
    function addSkipLink() {
        const form = document.querySelector(CONFIG.selectors.form);
        if (!form || document.querySelector('.skip-to-form-kzn427')) return;
        
        const skipLink = document.createElement('a');
        skipLink.href = '#' + form.id;
        skipLink.className = 'skip-to-form-kzn427';
        skipLink.textContent = 'ข้ามไปยังแบบฟอร์ม';
        document.body.insertBefore(skipLink, document.body.firstChild);
    }
    
    // Announce to screen readers
    function announceToScreenReader(message) {
        const announcer = document.getElementById('form-announcer-kzn427');
        if (announcer) {
            announcer.textContent = message;
            setTimeout(() => announcer.textContent = '', 1000);
        }
    }
    
    // Add form animations
    function addFormAnimations(form) {
        // Animate form fields on focus
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            const wrapper = input.closest('.input-wrapper-kzn427');
            
            input.addEventListener('focus', () => {
                wrapper?.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                if (!input.value.trim()) {
                    wrapper?.classList.remove('focused');
                }
            });
        });
        
        // Add entrance animation
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(form);
    }
    
    // Utility: Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
})();