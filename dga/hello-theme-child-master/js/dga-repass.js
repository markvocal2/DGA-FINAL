/**
 * DGA Password Reset JavaScript - Enhanced Version
 * Fixed: Initial eye icon state and dual notifications
 */
(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        // Handle reset request form
        const resetForm = document.getElementById('dga-reset-form');
        if (resetForm) {
            resetForm.addEventListener('submit', handleResetRequest);
        }
        
        // Handle new password form
        const newPasswordForm = document.getElementById('dga-new-password-form');
        if (newPasswordForm) {
            newPasswordForm.addEventListener('submit', handleSetNewPassword);
            
            // Password strength checker
            const passwordInput = document.getElementById('new_password');
            if (passwordInput) {
                passwordInput.addEventListener('input', checkPasswordStrength);
            }
        }
        
        // Toggle password visibility - Initialize with correct state
        initPasswordToggles();
    });
    
    /**
     * Initialize password toggle buttons with correct initial state
     */
    function initPasswordToggles() {
        const toggleButtons = document.querySelectorAll('.dga-toggle-password-xyz789');
        
        toggleButtons.forEach(button => {
            // Prevent default button behavior
            button.type = 'button';
            
            // Set initial state - eye closed (password hidden)
            const eyeOpen = button.querySelector('.eye-open');
            const eyeClosed = button.querySelector('.eye-closed');
            
            if (eyeOpen) eyeOpen.style.display = 'none';
            if (eyeClosed) eyeClosed.style.display = 'block';
            button.setAttribute('aria-label', 'แสดงรหัสผ่าน');
            
            // Add click event with improved handling
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                togglePasswordVisibility(e);
            });
            
            // Prevent focus loss on mobile
            button.addEventListener('touchend', function(e) {
                e.preventDefault();
                this.click();
            });
        });
    }
    
    /**
     * Toggle password visibility with improved stability
     */
    function togglePasswordVisibility(e) {
        const button = e.currentTarget;
        const wrapper = button.closest('.dga-password-wrapper-xyz789');
        if (!wrapper) return;
        
        const input = wrapper.querySelector('input');
        if (!input) return;
        
        const eyeOpen = button.querySelector('.eye-open');
        const eyeClosed = button.querySelector('.eye-closed');
        
        // Store current cursor position and value
        const cursorPosition = input.selectionStart;
        const currentValue = input.value;
        
        // Store current scroll position
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Toggle input type
        if (input.type === 'password') {
            input.type = 'text';
            if (eyeOpen) eyeOpen.style.display = 'block';
            if (eyeClosed) eyeClosed.style.display = 'none';
            button.setAttribute('aria-label', 'ซ่อนรหัสผ่าน');
        } else {
            input.type = 'password';
            if (eyeOpen) eyeOpen.style.display = 'none';
            if (eyeClosed) eyeClosed.style.display = 'block';
            button.setAttribute('aria-label', 'แสดงรหัสผ่าน');
        }
        
        // Restore value (sometimes needed in certain browsers)
        input.value = currentValue;
        
        // Restore cursor position
        if (input.setSelectionRange && cursorPosition !== null) {
            // Use setTimeout to ensure it happens after the type change
            setTimeout(() => {
                try {
                    input.setSelectionRange(cursorPosition, cursorPosition);
                } catch (e) {
                    // Some browsers don't support setSelectionRange on certain input types
                }
            }, 0);
        }
        
        // Restore scroll position (prevent jump on mobile)
        window.scrollTo(0, scrollTop);
        
        // Keep focus on input for better UX
        input.focus();
    }
    
    // Handle password reset request
    async function handleResetRequest(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const messageDiv = document.getElementById('reset-message');
        const email = form.user_email.value;
        
        // Validate email
        if (!validateEmail(email)) {
            showMessage(messageDiv, 'กรุณากรอกอีเมลให้ถูกต้อง', 'error');
            return;
        }
        
        // Show loading state
        showLoading(submitBtn, true);
        hideMessage(messageDiv);
        
        try {
            const formData = new FormData();
            formData.append('action', 'dga_password_reset_request');
            formData.append('email', email);
            formData.append('nonce', dgaRepass.nonce);
            
            const response = await fetch(dgaRepass.ajaxurl, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage(messageDiv, data.data.message, 'success');
                form.reset();
            } else {
                showMessage(messageDiv, data.data.message, 'error');
            }
        } catch (error) {
            showMessage(messageDiv, dgaRepass.messages.error_occurred, 'error');
        } finally {
            showLoading(submitBtn, false);
        }
    }
    
    // Handle setting new password with dual notifications
    async function handleSetNewPassword(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const messageDiv = document.getElementById('reset-message');
        const newPassword = form.new_password.value;
        const confirmPassword = form.confirm_password.value;
        
        // Validate passwords match
        if (newPassword !== confirmPassword) {
            showMessage(messageDiv, dgaRepass.messages.passwords_not_match, 'error');
            // Highlight mismatched fields
            form.confirm_password.classList.add('error');
            setTimeout(() => {
                form.confirm_password.classList.remove('error');
            }, 3000);
            return;
        }
        
        // Validate password strength (minimum 6 characters)
        if (newPassword.length < 6) {
            showMessage(messageDiv, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'error');
            return;
        }
        
        // Show loading state
        showLoading(submitBtn, true);
        hideMessage(messageDiv);
        
        try {
            const formData = new FormData();
            formData.append('action', 'dga_set_new_password');
            formData.append('key', form.key.value);
            formData.append('login', form.login.value);
            formData.append('password', newPassword);
            formData.append('nonce', dgaRepass.nonce);
            
            const response = await fetch(dgaRepass.ajaxurl, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                // First notification: Success message
                showMessage(messageDiv, 'เปลี่ยนรหัสผ่านสำเร็จแล้ว', 'success');
                
                // Disable form to prevent re-submission
                form.querySelectorAll('input, button').forEach(el => {
                    el.disabled = true;
                });
                
                // Second notification: Login message after 1.5 seconds
                setTimeout(() => {
                    showMessage(messageDiv, 'กำลังล็อคอินใหม่...', 'info');
                    
                    // Add loading animation to message
                    const currentMessage = messageDiv.querySelector('.message-content') || messageDiv;
                    currentMessage.innerHTML = '<span style="display: inline-flex; align-items: center;">กำลังล็อคอินใหม่... <svg class="dga-spinner-xyz789" style="margin-left: 8px;" width="16" height="16" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></span>';
                    
                    // Redirect after showing login message
                    setTimeout(() => {
                        window.location.href = data.data.redirect;
                    }, 1000);
                }, 1500);
                
            } else {
                showMessage(messageDiv, data.data.message, 'error');
                showLoading(submitBtn, false);
            }
        } catch (error) {
            showMessage(messageDiv, dgaRepass.messages.error_occurred, 'error');
            showLoading(submitBtn, false);
        }
    }
    
    // Check password strength
    function checkPasswordStrength(e) {
        const password = e.target.value;
        const strengthDiv = document.getElementById('password-strength');
        
        if (!password) {
            strengthDiv.style.display = 'none';
            return;
        }
        
        let strength = 0;
        let message = '';
        
        // Length check
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        
        // Character variety checks
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        
        // Set message and class based on strength
        strengthDiv.style.display = 'block';
        strengthDiv.className = 'dga-password-strength-xyz789';
        
        if (strength <= 2) {
            strengthDiv.classList.add('weak');
            message = 'รหัสผ่านอ่อน';
        } else if (strength <= 4) {
            strengthDiv.classList.add('medium');
            message = 'รหัสผ่านปานกลาง';
        } else {
            strengthDiv.classList.add('strong');
            message = 'รหัสผ่านแข็งแรง';
        }
        
        // Add additional hint
        if (password.length < 8) {
            message += ' (แนะนำอย่างน้อย 8 ตัวอักษร)';
        }
        
        strengthDiv.textContent = message;
    }
    
    // Email validation
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Show loading state
    function showLoading(button, loading) {
        if (!button) return;
        
        const textSpan = button.querySelector('.button-text');
        const loaderSpan = button.querySelector('.button-loader');
        
        if (loading) {
            button.disabled = true;
            button.style.cursor = 'not-allowed';
            if (textSpan) textSpan.style.display = 'none';
            if (loaderSpan) loaderSpan.style.display = 'inline-flex';
        } else {
            button.disabled = false;
            button.style.cursor = 'pointer';
            if (textSpan) textSpan.style.display = 'inline';
            if (loaderSpan) loaderSpan.style.display = 'none';
        }
    }
    
    // Show message with animation - Enhanced for multiple types
    function showMessage(element, message, type) {
        if (!element) return;
        
        // Reset classes
        element.className = 'dga-message-xyz789';
        element.style.display = 'none';
        
        // Create message content wrapper
        element.innerHTML = '<div class="message-content">' + message + '</div>';
        element.classList.add(type);
        
        // Show with animation
        setTimeout(() => {
            element.style.display = 'block';
        }, 10);
        
        // Auto hide success messages (but not info messages during redirect)
        if (type === 'success' && message !== 'กำลังล็อคอินใหม่...') {
            setTimeout(() => {
                if (!element.classList.contains('info')) {
                    hideMessage(element);
                }
            }, 5000);
        }
        
        // Scroll to message if needed
        if (element.getBoundingClientRect().top < 0) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    // Hide message
    function hideMessage(element) {
        if (!element) return;
        
        element.style.display = 'none';
        element.textContent = '';
        element.className = 'dga-message-xyz789';
    }
    
    // Add error class style dynamically
    const style = document.createElement('style');
    style.textContent = `
        .dga-form-group-xyz789 input.error {
            border-color: #dc2626 !important;
            animation: shake 0.3s ease-in-out;
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
    
})();