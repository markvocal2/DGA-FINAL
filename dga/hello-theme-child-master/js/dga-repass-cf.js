/**
 * DGA Password Reset with CloudFlare Turnstile - JavaScript
 * Version: 5.0.0 - Sandbox Fix Version
 */
(function() {
    'use strict';
    
    // Configuration
    const config = {
        captchaEnabled: window.dgaRepassCF && window.dgaRepassCF.captchaEnabled !== false,
        captchaBypass: false, // Will be set to true if CAPTCHA fails to load
        debug: window.dgaRepassCF && window.dgaRepassCF.debug
    };
    
    // Wait for DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[DGA Reset] JavaScript loaded and ready');
        console.log('[DGA Reset] CAPTCHA enabled:', config.captchaEnabled);
        initializePasswordReset();
    });
    
    // Initialize all functions
    function initializePasswordReset() {
        // Handle reset request form
        const resetForm = document.getElementById('dga-reset-form-cf');
        if (resetForm) {
            console.log('[DGA Reset] Reset form found');
            resetForm.addEventListener('submit', handleResetRequest);
            
            // Check CAPTCHA status after 3 seconds
            if (config.captchaEnabled) {
                setTimeout(checkCaptchaStatus, 3000);
            }
        }
        
        // Handle new password form
        const newPasswordForm = document.getElementById('dga-new-password-form-cf');
        if (newPasswordForm) {
            console.log('[DGA Reset] New password form found');
            newPasswordForm.addEventListener('submit', handleSetNewPassword);
            
            // Password strength checker
            const passwordInput = document.getElementById('new_password');
            if (passwordInput) {
                passwordInput.addEventListener('input', checkPasswordStrength);
            }
            
            // Password match checker
            const confirmInput = document.getElementById('confirm_password');
            if (confirmInput) {
                confirmInput.addEventListener('input', checkPasswordMatch);
            }
        }
        
        // Initialize password toggles
        initPasswordToggles();
    }
    
    /**
     * Check CAPTCHA loading status
     */
    function checkCaptchaStatus() {
        if (!config.captchaEnabled) return;
        
        const widget = document.getElementById('cf-turnstile-widget');
        const submitBtn = document.getElementById('reset-submit-btn');
        
        if (widget && !widget.querySelector('iframe') && !widget.querySelector('input')) {
            console.log('[DGA Reset] CAPTCHA not loaded after 3 seconds, enabling bypass');
            config.captchaBypass = true;
            
            if (submitBtn) {
                submitBtn.disabled = false;
            }
            
            // Show warning message
            const errorDiv = document.getElementById('captcha-error');
            if (errorDiv) {
                errorDiv.style.display = 'block';
            }
        }
    }
    
    /**
     * Handle password reset request
     */
    async function handleResetRequest(e) {
        e.preventDefault();
        console.log('[DGA Reset] Form submitted');
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const messageDiv = document.getElementById('reset-message');
        const email = form.user_email.value;
        
        // Validate email
        if (!validateEmail(email)) {
            showMessage(messageDiv, 'กรุณากรอกอีเมลให้ถูกต้อง', 'error');
            return;
        }
        
        // Get CAPTCHA token if enabled
        let captchaToken = '';
        if (config.captchaEnabled && !config.captchaBypass) {
            captchaToken = document.getElementById('cf-turnstile-response')?.value || window.turnstileToken || '';
            
            if (!captchaToken) {
                showMessage(messageDiv, 'กรุณายืนยัน CAPTCHA', 'error');
                return;
            }
        }
        
        showLoading(submitBtn, true);
        hideMessage(messageDiv);
        
        try {
            const formData = new FormData();
            formData.append('action', 'dga_password_reset_request_cf');
            formData.append('email', email);
            formData.append('cf_turnstile_response', captchaToken);
            formData.append('nonce', dgaRepassCF.nonce);
            
            // Add bypass flag if CAPTCHA failed to load
            if (config.captchaBypass) {
                formData.append('bypass_captcha', 'true');
            }
            
            const response = await fetch(dgaRepassCF.ajaxurl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            console.log('[DGA Reset] Response:', data);
            
            if (data.success) {
                showMessage(messageDiv, data.data.message, 'success');
                form.reset();
                
                // Disable form
                form.querySelectorAll('input, button').forEach(el => {
                    el.disabled = true;
                });
                
                // Show success icon
                showEmailSentAnimation();
                
            } else {
                showMessage(messageDiv, data.data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
                
                // Reset CAPTCHA if available
                if (window.turnstile && window.turnstile.reset) {
                    try {
                        window.turnstile.reset();
                    } catch(e) {
                        console.error('[DGA Reset] Failed to reset CAPTCHA:', e);
                    }
                }
            }
        } catch (error) {
            console.error('[DGA Reset] Error:', error);
            showMessage(messageDiv, 'เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
        } finally {
            showLoading(submitBtn, false);
        }
    }
    
    /**
     * Handle setting new password
     */
    async function handleSetNewPassword(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const messageDiv = document.getElementById('reset-message');
        const newPassword = form.new_password.value;
        const confirmPassword = form.confirm_password.value;
        
        // Validate passwords match
        if (newPassword !== confirmPassword) {
            showMessage(messageDiv, 'รหัสผ่านไม่ตรงกัน', 'error');
            highlightError(form.confirm_password);
            return;
        }
        
        // Validate password strength
        if (newPassword.length < 8) {
            showMessage(messageDiv, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร', 'error');
            highlightError(form.new_password);
            return;
        }
        
        showLoading(submitBtn, true);
        hideMessage(messageDiv);
        
        try {
            const formData = new FormData();
            formData.append('action', 'dga_set_new_password_cf');
            formData.append('key', form.key.value);
            formData.append('login', form.login.value);
            formData.append('password', newPassword);
            formData.append('nonce', dgaRepassCF.nonce);
            
            const response = await fetch(dgaRepassCF.ajaxurl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage(messageDiv, 'เปลี่ยนรหัสผ่านสำเร็จ ✓', 'success');
                
                // Disable form
                form.querySelectorAll('input, button').forEach(el => {
                    el.disabled = true;
                });
                
                // Redirect after 2 seconds
                setTimeout(() => {
                    showMessage(messageDiv, 'กำลังเข้าสู่ระบบ...', 'info');
                    setTimeout(() => {
                        window.location.href = data.data.redirect;
                    }, 1000);
                }, 1500);
                
            } else {
                showMessage(messageDiv, data.data.message || 'เกิดข้อผิดพลาด', 'error');
                showLoading(submitBtn, false);
            }
        } catch (error) {
            console.error('[DGA Reset] Error:', error);
            showMessage(messageDiv, 'เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
            showLoading(submitBtn, false);
        }
    }
    
    /**
     * Initialize password toggle buttons
     */
    function initPasswordToggles() {
        const toggleButtons = document.querySelectorAll('.dga-toggle-password-cfz357');
        
        toggleButtons.forEach(button => {
            button.type = 'button';
            
            // Set initial state
            const eyeOpen = button.querySelector('.eye-open');
            const eyeClosed = button.querySelector('.eye-closed');
            
            if (eyeOpen) eyeOpen.style.display = 'none';
            if (eyeClosed) eyeClosed.style.display = 'block';
            
            button.addEventListener('click', function(e) {
                e.preventDefault();
                togglePasswordVisibility(e);
            });
        });
    }
    
    /**
     * Toggle password visibility
     */
    function togglePasswordVisibility(e) {
        const button = e.currentTarget;
        const wrapper = button.closest('.dga-password-wrapper-cfz357');
        if (!wrapper) return;
        
        const input = wrapper.querySelector('input');
        if (!input) return;
        
        const eyeOpen = button.querySelector('.eye-open');
        const eyeClosed = button.querySelector('.eye-closed');
        
        if (input.type === 'password') {
            input.type = 'text';
            if (eyeOpen) eyeOpen.style.display = 'block';
            if (eyeClosed) eyeClosed.style.display = 'none';
        } else {
            input.type = 'password';
            if (eyeOpen) eyeOpen.style.display = 'none';
            if (eyeClosed) eyeClosed.style.display = 'block';
        }
    }
    
    /**
     * Check password strength
     */
    function checkPasswordStrength(e) {
        const password = e.target.value;
        const strengthDiv = document.getElementById('password-strength');
        
        if (!password) {
            strengthDiv.style.display = 'none';
            return;
        }
        
        let strength = 0;
        let feedback = [];
        
        // Length checks
        if (password.length >= 8) strength++;
        else feedback.push('อย่างน้อย 8 ตัวอักษร');
        
        if (password.length >= 12) strength++;
        
        // Character variety
        if (/[a-z]/.test(password)) strength++;
        else feedback.push('ตัวพิมพ์เล็ก');
        
        if (/[A-Z]/.test(password)) strength++;
        else feedback.push('ตัวพิมพ์ใหญ่');
        
        if (/[0-9]/.test(password)) strength++;
        else feedback.push('ตัวเลข');
        
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        else feedback.push('อักขระพิเศษ');
        
        // Display strength
        strengthDiv.style.display = 'block';
        strengthDiv.className = 'dga-password-strength-cfz357';
        
        let message = '';
        if (strength <= 2) {
            strengthDiv.classList.add('weak');
            message = '⚠️ รหัสผ่านอ่อน';
        } else if (strength <= 4) {
            strengthDiv.classList.add('medium');
            message = '⚡ รหัสผ่านปานกลาง';
        } else {
            strengthDiv.classList.add('strong');
            message = '✓ รหัสผ่านแข็งแรง';
        }
        
        if (feedback.length > 0 && strength <= 4) {
            message += ' (แนะนำ: ' + feedback.join(', ') + ')';
        }
        
        strengthDiv.textContent = message;
    }
    
    /**
     * Check if passwords match
     */
    function checkPasswordMatch(e) {
        const confirmPassword = e.target.value;
        const newPassword = document.getElementById('new_password').value;
        const confirmInput = e.target;
        
        if (confirmPassword && newPassword && confirmPassword !== newPassword) {
            confirmInput.style.borderColor = '#dc2626';
        } else {
            confirmInput.style.borderColor = '';
        }
    }
    
    /**
     * Email validation
     */
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    /**
     * Show loading state
     */
    function showLoading(button, loading) {
        if (!button) return;
        
        const textSpan = button.querySelector('.button-text');
        const loaderSpan = button.querySelector('.button-loader');
        
        if (loading) {
            button.disabled = true;
            if (textSpan) textSpan.style.display = 'none';
            if (loaderSpan) loaderSpan.style.display = 'inline-flex';
        } else {
            button.disabled = false;
            if (textSpan) textSpan.style.display = 'inline';
            if (loaderSpan) loaderSpan.style.display = 'none';
        }
    }
    
    /**
     * Show message
     */
    function showMessage(element, message, type) {
        if (!element) return;
        
        element.className = 'dga-message-cfz357';
        element.style.display = 'none';
        
        element.innerHTML = '<div class="message-content">' + message + '</div>';
        element.classList.add(type);
        
        setTimeout(() => {
            element.style.display = 'block';
        }, 10);
        
        // Auto hide success messages
        if (type === 'success') {
            setTimeout(() => {
                if (!element.classList.contains('info')) {
                    hideMessage(element);
                }
            }, 5000);
        }
    }
    
    /**
     * Hide message
     */
    function hideMessage(element) {
        if (!element) return;
        element.style.display = 'none';
        element.textContent = '';
        element.className = 'dga-message-cfz357';
    }
    
    /**
     * Highlight error field
     */
    function highlightError(input) {
        input.classList.add('error');
        setTimeout(() => {
            input.classList.remove('error');
        }, 3000);
    }
    
    /**
     * Show email sent animation
     */
    function showEmailSentAnimation() {
        const icon = document.querySelector('.dga-reset-icon-cfz357');
        if (icon) {
            icon.innerHTML = `
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                    <path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            icon.style.background = 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)';
        }
    }
    
    // Global error handler for Turnstile issues
    window.addEventListener('error', function(e) {
        if (e.message && e.message.includes('turnstile')) {
            console.error('[DGA Reset] Turnstile error caught:', e.message);
            config.captchaBypass = true;
            
            // Enable submit button
            const submitBtn = document.getElementById('reset-submit-btn');
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        }
    });
    
})();