/**
 * DGA User Creation System - Horizontal Layout JavaScript
 * Version: 1.1.0
 * Pure JavaScript, no jQuery required
 */

(function() {
    'use strict';
    
    // Configuration
    const config = {
        debounceDelay: 500,
        emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        minPasswordLength: 8
    };
    
    // Cache DOM elements
    let elements = {};
    
    // State
    let state = {
        pendingSubmission: null,
        isSubmitting: false
    };
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', init);
    
    /**
     * Initialize the application
     */
    function init() {
        console.log('DGA User System: Initializing...');
        
        // Cache elements
        cacheElements();
        
        // Setup event listeners
        if (elements.form) {
            setupFormHandlers();
            setupModalHandlers();
        }
        
        // Setup password reset if on that page
        if (document.getElementById('dga-reset-form-hjk456')) {
            setupPasswordReset();
        }
    }
    
    /**
     * Cache DOM elements for better performance
     */
    function cacheElements() {
        elements = {
            form: document.getElementById('dga-create-user-form-hjk456'),
            emailInput: document.getElementById('user_email_hjk456'),
            roleSelect: document.getElementById('user_role_hjk456'),
            submitBtn: document.querySelector('.dga-btn-submit-hjk456'),
            notifications: document.getElementById('dga-notifications-hjk456'),
            clearBtn: document.querySelector('.dga-clear-btn-hjk456'),
            modal: document.getElementById('dga-modal-hjk456'),
            modalConfirmEmail: document.getElementById('dga-confirm-email-hjk456'),
            modalConfirmRole: document.getElementById('dga-confirm-role-hjk456'),
            modalConfirmBtn: document.querySelector('.dga-modal-confirm-hjk456'),
            modalCancelBtn: document.querySelector('.dga-modal-cancel-hjk456'),
            modalCloseBtn: document.querySelector('.dga-modal-close-hjk456')
        };
    }
    
    /**
     * Setup form event handlers
     */
    function setupFormHandlers() {
        // Email validation on input
        if (elements.emailInput) {
            elements.emailInput.addEventListener('input', handleEmailInput);
            elements.emailInput.addEventListener('blur', validateEmail);
        }
        
        // Clear button
        if (elements.clearBtn) {
            elements.clearBtn.addEventListener('click', clearEmailInput);
        }
        
        // Form submission - now opens modal instead
        elements.form.addEventListener('submit', handleFormPreSubmit);
    }
    
    /**
     * Setup modal event handlers
     */
    function setupModalHandlers() {
        // Modal buttons
        if (elements.modalConfirmBtn) {
            elements.modalConfirmBtn.addEventListener('click', confirmCreateUser);
        }
        
        if (elements.modalCancelBtn) {
            elements.modalCancelBtn.addEventListener('click', closeModal);
        }
        
        if (elements.modalCloseBtn) {
            elements.modalCloseBtn.addEventListener('click', closeModal);
        }
        
        // Click outside modal to close
        if (elements.modal) {
            elements.modal.addEventListener('click', function(e) {
                if (e.target === elements.modal) {
                    closeModal();
                }
            });
        }
        
        // ESC key to close modal
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && elements.modal.classList.contains('active')) {
                closeModal();
            }
        });
    }
    
    /**
     * Handle email input changes
     */
    function handleEmailInput(e) {
        const fieldGroup = elements.emailInput.closest('.dga-field-group-hjk456');
        const hasValue = e.target.value.trim().length > 0;
        
        // Toggle has-value class for clear button visibility
        if (hasValue) {
            fieldGroup.classList.add('has-value');
        } else {
            fieldGroup.classList.remove('has-value');
        }
        
        // Debounced validation
        debounce(validateEmail, config.debounceDelay)();
    }
    
    /**
     * Clear email input
     */
    function clearEmailInput() {
        elements.emailInput.value = '';
        elements.emailInput.focus();
        
        // Remove has-value class
        const fieldGroup = elements.emailInput.closest('.dga-field-group-hjk456');
        fieldGroup.classList.remove('has-value');
        
        // Clear validation states
        elements.emailInput.classList.remove('error');
        const statusIcon = fieldGroup.querySelector('.dga-field-status-hjk456');
        statusIcon.textContent = '';
        statusIcon.className = 'dga-field-status-hjk456';
    }
    
    /**
     * Validate email input
     */
    async function validateEmail() {
        const email = elements.emailInput.value.trim();
        const fieldGroup = elements.emailInput.closest('.dga-field-group-hjk456');
        const statusIcon = fieldGroup.querySelector('.dga-field-status-hjk456');
        
        // Reset status
        elements.emailInput.classList.remove('error');
        statusIcon.textContent = '';
        statusIcon.className = 'dga-field-status-hjk456';
        
        if (!email) {
            return true;
        }
        
        // Check email format
        if (!config.emailRegex.test(email)) {
            elements.emailInput.classList.add('error');
            statusIcon.textContent = '✗';
            statusIcon.classList.add('invalid');
            return false;
        }
        
        // Check if email exists via AJAX
        try {
            const response = await fetch(dgaAjax.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'dga_check_email',
                    email: email,
                    nonce: dgaAjax.nonce
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.data.exists) {
                elements.emailInput.classList.add('error');
                statusIcon.textContent = '✗';
                statusIcon.classList.add('invalid');
                showNotification(dgaAjax.strings.emailExists, 'error');
                return false;
            }
            
            // Email is valid and available
            statusIcon.textContent = '✓';
            statusIcon.classList.add('valid');
            return true;
            
        } catch (error) {
            console.error('Email check failed:', error);
            // Continue without server validation
            statusIcon.textContent = '✓';
            statusIcon.classList.add('valid');
            return true;
        }
    }
    
    /**
     * Handle form pre-submission (show modal)
     */
    async function handleFormPreSubmit(e) {
        e.preventDefault();
        
        // Clear previous notifications
        clearNotifications();
        
        // Validate email
        const emailValid = await validateEmail();
        if (!emailValid) {
            return;
        }
        
        // Store form data
        state.pendingSubmission = {
            email: elements.emailInput.value.trim(),
            role: elements.roleSelect.value,
            roleText: elements.roleSelect.options[elements.roleSelect.selectedIndex].text
        };
        
        // Show modal with confirmation
        showModal();
    }
    
    /**
     * Show confirmation modal
     */
    function showModal() {
        // Populate modal with data
        elements.modalConfirmEmail.textContent = state.pendingSubmission.email;
        elements.modalConfirmRole.textContent = state.pendingSubmission.roleText;
        
        // Show modal
        elements.modal.classList.add('active');
        document.body.classList.add('dga-modal-open-hjk456');
        
        // Focus on confirm button
        elements.modalConfirmBtn.focus();
        
        // Trap focus in modal
        trapFocus(elements.modal);
    }
    
    /**
     * Close modal
     */
    function closeModal() {
        elements.modal.classList.remove('active');
        document.body.classList.remove('dga-modal-open-hjk456');
        
        // Clear pending submission if not submitting
        if (!state.isSubmitting) {
            state.pendingSubmission = null;
        }
        
        // Return focus to submit button
        elements.submitBtn.focus();
    }
    
    /**
     * Confirm and create user
     */
    async function confirmCreateUser() {
        if (!state.pendingSubmission || state.isSubmitting) {
            return;
        }
        
        state.isSubmitting = true;
        
        // Show loading state on modal button
        elements.modalConfirmBtn.classList.add('loading');
        elements.modalConfirmBtn.disabled = true;
        elements.modalCancelBtn.disabled = true;
        elements.modalCloseBtn.disabled = true;
        
        // Prepare form data
        const formData = new FormData();
        formData.append('action', 'dga_create_user');
        formData.append('email', state.pendingSubmission.email);
        formData.append('role', state.pendingSubmission.role);
        formData.append('nonce', dgaAjax.nonce);
        
        try {
            const response = await fetch(dgaAjax.url, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            // Close modal first
            closeModal();
            
            if (result.success) {
                showNotification(result.data.message, result.data.warning ? 'warning' : 'success');
                elements.form.reset();
                
                // Clear field states
                const fieldGroup = elements.emailInput.closest('.dga-field-group-hjk456');
                fieldGroup.classList.remove('has-value');
                const statusIcon = fieldGroup.querySelector('.dga-field-status-hjk456');
                statusIcon.textContent = '';
                statusIcon.className = 'dga-field-status-hjk456';
            } else {
                showNotification(result.data.message || dgaAjax.strings.error, 'error');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            closeModal();
            showNotification(dgaAjax.strings.error, 'error');
        } finally {
            // Reset states
            state.isSubmitting = false;
            state.pendingSubmission = null;
            
            // Reset modal button
            elements.modalConfirmBtn.classList.remove('loading');
            elements.modalConfirmBtn.disabled = false;
            elements.modalCancelBtn.disabled = false;
            elements.modalCloseBtn.disabled = false;
        }
    }
    
    /**
     * Show notification message
     */
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `dga-notification-hjk456 dga-notification-${type}-hjk456`;
        
        const icon = document.createElement('span');
        icon.className = 'dashicons';
        
        switch(type) {
            case 'success':
                icon.classList.add('dashicons-yes-alt');
                break;
            case 'error':
                icon.classList.add('dashicons-dismiss');
                break;
            case 'warning':
                icon.classList.add('dashicons-warning');
                break;
            default:
                icon.classList.add('dashicons-info');
        }
        
        const text = document.createElement('span');
        text.textContent = message;
        
        notification.appendChild(icon);
        notification.appendChild(text);
        
        elements.notifications.appendChild(notification);
        
        // Auto-dismiss success messages
        if (type === 'success') {
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        }
        
        // Scroll to notification
        notification.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    /**
     * Clear all notifications
     */
    function clearNotifications() {
        if (elements.notifications) {
            elements.notifications.innerHTML = '';
        }
    }
    
    /**
     * Trap focus within element
     */
    function trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        element.addEventListener('keydown', function(e) {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    e.preventDefault();
                }
            }
        });
    }
    
    /**
     * Setup password reset form
     */
    function setupPasswordReset() {
        const form = document.getElementById('dga-reset-form-hjk456');
        const pass1 = document.getElementById('pass1');
        const pass2 = document.getElementById('pass2');
        const strengthBar = document.querySelector('.dga-strength-bar-hjk456');
        const strengthText = document.querySelector('.dga-strength-text-hjk456');
        
        // Password strength indicator
        if (pass1 && strengthBar) {
            pass1.addEventListener('input', function() {
                const strength = calculatePasswordStrength(this.value);
                updateStrengthIndicator(strength, strengthBar, strengthText);
            });
        }
        
        // Form submission
        if (form) {
            form.addEventListener('submit', handlePasswordReset);
        }
    }
    
    /**
     * Calculate password strength
     */
    function calculatePasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        
        return Math.min(strength, 4);
    }
    
    /**
     * Update strength indicator UI
     */
    function updateStrengthIndicator(strength, bar, text) {
        const strengthLevels = ['', 'อ่อน', 'ปานกลาง', 'แข็งแรง', 'แข็งแรงมาก'];
        const strengthColors = ['', '#e74c3c', '#f39c12', '#3498db', '#27ae60'];
        
        bar.style.width = (strength * 25) + '%';
        bar.style.background = strengthColors[strength];
        text.textContent = strengthLevels[strength];
    }
    
    /**
     * Handle password reset form submission
     */
    async function handlePasswordReset(e) {
        e.preventDefault();
        
        const form = e.target;
        const messages = document.getElementById('dga-messages-hjk456');
        const pass1 = form.pass1.value;
        const pass2 = form.pass2.value;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Clear previous messages
        messages.innerHTML = '';
        
        // Validate passwords
        if (pass1.length < config.minPasswordLength) {
            showResetMessage(`รหัสผ่านต้องมีอย่างน้อย ${config.minPasswordLength} ตัวอักษร`, 'error');
            return;
        }
        
        if (pass1 !== pass2) {
            showResetMessage('รหัสผ่านไม่ตรงกัน', 'error');
            return;
        }
        
        // Disable form
        submitBtn.disabled = true;
        submitBtn.textContent = 'กำลังดำเนินการ...';
        
        try {
            const formData = new FormData(form);
            formData.append('action', 'dga_reset_password');
            
            const response = await fetch(form.action || window.location.href, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showResetMessage(result.data.message || 'ตั้งรหัสผ่านสำเร็จ!', 'success');
                form.style.display = 'none';
                
                // Redirect after success
                setTimeout(() => {
                    window.location.href = result.data.redirect || '/';
                }, 2000);
            } else {
                showResetMessage(result.data.message || 'เกิดข้อผิดพลาด', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'ตั้งรหัสผ่าน';
            }
        } catch (error) {
            console.error('Password reset error:', error);
            showResetMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'ตั้งรหัสผ่าน';
        }
    }
    
    /**
     * Show message on password reset page
     */
    function showResetMessage(text, type) {
        const messages = document.getElementById('dga-messages-hjk456');
        const msg = document.createElement('div');
        msg.className = `dga-message-hjk456 ${type}`;
        msg.textContent = text;
        messages.appendChild(msg);
    }
    
    /**
     * Debounce utility function
     */
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
    
    // Expose API for debugging
    window.DGAUserSystem = {
        validateEmail,
        showNotification,
        clearNotifications,
        showModal,
        closeModal
    };
    
})();