/**
 * Profile Management JavaScript - Modern ES6+ Version
 * Version: 2.0.0
 * No jQuery dependency
 */

(function() {
    'use strict';
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize profile management
        initProfileManagement();
    });
    
    function initProfileManagement() {
        // Cache DOM elements
        const elements = {
            profileForm: document.getElementById('profile-editor-form'),
            passwordForm: document.getElementById('password-reset-form'),
            toast: document.getElementById('toast-notification'),
            avatarUpload: document.getElementById('avatar-upload'),
            avatarPreview: document.getElementById('profile-avatar-preview'),
            resetPasswordBtn: document.getElementById('reset-password-button'),
            passwordResetModal: document.getElementById('password-reset-modal'),
            logoutConfirmModal: document.getElementById('logout-confirm-modal'),
            newPasswordInput: document.getElementById('new-password'),
            confirmPasswordInput: document.getElementById('confirm-password'),
            passwordStrength: document.getElementById('password-strength')
        };
        
        // Check if we're on the profile page
        if (!elements.profileForm) return;
        
        // Initialize event listeners
        initEventListeners(elements);
        
        // Initialize password toggles
        initPasswordToggles();
    }
    
    /**
     * Initialize all event listeners
     */
    function initEventListeners(elements) {
        // Profile form submission
        if (elements.profileForm) {
            elements.profileForm.addEventListener('submit', handleProfileSubmit);
        }
        
        // Password reset form submission
        if (elements.passwordForm) {
            elements.passwordForm.addEventListener('submit', handlePasswordSubmit);
            
            // Password strength checker
            if (elements.newPasswordInput) {
                elements.newPasswordInput.addEventListener('input', checkPasswordStrength);
            }
        }
        
        // Avatar upload preview
        if (elements.avatarUpload) {
            elements.avatarUpload.addEventListener('change', handleAvatarChange);
        }
        
        // Reset password button
        if (elements.resetPasswordBtn) {
            elements.resetPasswordBtn.addEventListener('click', () => {
                showModal('password-reset-modal');
            });
        }
        
        // Modal controls
        initModalControls();
        
        // Logout decision buttons
        const logoutAllBtn = document.getElementById('logout-all-devices');
        const stayLoggedInBtn = document.getElementById('stay-logged-in');
        
        if (logoutAllBtn) {
            logoutAllBtn.addEventListener('click', () => updatePassword(true));
        }
        
        if (stayLoggedInBtn) {
            stayLoggedInBtn.addEventListener('click', () => updatePassword(false));
        }
    }
    
    /**
     * Initialize password toggle buttons
     */
    function initPasswordToggles() {
        const toggleButtons = document.querySelectorAll('.toggle-password-pmg728');
        
        toggleButtons.forEach(button => {
            button.type = 'button';
            
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                togglePasswordVisibility(e);
            });
            
            // Mobile touch support
            button.addEventListener('touchend', function(e) {
                e.preventDefault();
                this.click();
            });
        });
    }
    
    /**
     * Toggle password visibility
     */
    function togglePasswordVisibility(e) {
        const button = e.currentTarget;
        const wrapper = button.closest('.password-wrapper-pmg728');
        if (!wrapper) return;
        
        const input = wrapper.querySelector('input');
        if (!input) return;
        
        const eyeOpen = button.querySelector('.eye-open');
        const eyeClosed = button.querySelector('.eye-closed');
        
        // Store cursor position
        const cursorPosition = input.selectionStart;
        const currentValue = input.value;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Toggle type
        if (input.type === 'password') {
            input.type = 'text';
            if (eyeOpen) eyeOpen.style.display = 'none';
            if (eyeClosed) eyeClosed.style.display = 'block';
            button.setAttribute('aria-label', 'ซ่อนรหัสผ่าน');
        } else {
            input.type = 'password';
            if (eyeOpen) eyeOpen.style.display = 'block';
            if (eyeClosed) eyeClosed.style.display = 'none';
            button.setAttribute('aria-label', 'แสดงรหัสผ่าน');
        }
        
        // Restore value and cursor position
        input.value = currentValue;
        if (input.setSelectionRange && cursorPosition !== null) {
            setTimeout(() => {
                try {
                    input.setSelectionRange(cursorPosition, cursorPosition);
                } catch (e) {}
            }, 0);
        }
        
        // Restore scroll position
        window.scrollTo(0, scrollTop);
        input.focus();
    }
    
    /**
     * Initialize modal controls
     */
    function initModalControls() {
        // Close buttons and overlays
        const closeButtons = document.querySelectorAll('.profile-modal-close-pmg728');
        const overlays = document.querySelectorAll('.profile-modal-overlay-pmg728');
        
        closeButtons.forEach(button => {
            button.addEventListener('click', hideAllModals);
        });
        
        overlays.forEach(overlay => {
            overlay.addEventListener('click', hideAllModals);
        });
        
        // Prevent closing when clicking inside modal
        const modalContainers = document.querySelectorAll('.profile-modal-container-pmg728');
        modalContainers.forEach(container => {
            container.addEventListener('click', (e) => e.stopPropagation());
        });
        
        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideAllModals();
            }
        });
    }
    
    /**
     * Handle avatar change
     */
    function handleAvatarChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            showToast(profileManagement.messages.fileTypeError, 'error');
            e.target.value = '';
            return;
        }
        
        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast(profileManagement.messages.fileSizeError, 'error');
            e.target.value = '';
            return;
        }
        
        // Preview image
        const reader = new FileReader();
        reader.onload = function(event) {
            const preview = document.getElementById('profile-avatar-preview');
            if (preview) {
                preview.src = event.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
    
    /**
     * Handle profile form submission
     */
    async function handleProfileSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const formData = new FormData();
        
        // Add form data
        formData.append('action', 'update_profile');
        formData.append('nonce', profileManagement.nonce);
        formData.append('first_name', document.getElementById('first-name').value);
        formData.append('last_name', document.getElementById('last-name').value);
        
        // Add avatar if selected
        const avatarInput = document.getElementById('avatar-upload');
        if (avatarInput && avatarInput.files[0]) {
            formData.append('avatar', avatarInput.files[0]);
        }
        
        // Show loading state
        showLoading(submitBtn, true);
        
        try {
            const response = await fetch(profileManagement.ajaxurl, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast(data.data.message || profileManagement.messages.success, 'success');
                
                // Update avatar if new URL provided
                if (data.data.avatar_url) {
                    const preview = document.getElementById('profile-avatar-preview');
                    if (preview) {
                        preview.src = data.data.avatar_url;
                    }
                }
                
                // Clear file input
                if (avatarInput) {
                    avatarInput.value = '';
                }
            } else {
                showToast(data.data || profileManagement.messages.error, 'error');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            showToast(profileManagement.messages.error, 'error');
        } finally {
            showLoading(submitBtn, false);
        }
    }
    
    /**
     * Handle password form submission
     */
    async function handlePasswordSubmit(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validate passwords match
        if (newPassword !== confirmPassword) {
            showToast(profileManagement.messages.passwordMismatch, 'error');
            
            // Highlight error field
            const confirmInput = document.getElementById('confirm-password');
            confirmInput.classList.add('error');
            setTimeout(() => {
                confirmInput.classList.remove('error');
            }, 3000);
            return;
        }
        
        // Validate password length
        if (newPassword.length < 8) {
            showToast('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร', 'error');
            return;
        }
        
        // Show logout confirmation modal
        hideModal('password-reset-modal');
        showModal('logout-confirm-modal');
    }
    
    /**
     * Update password with logout option
     */
    async function updatePassword(logoutAll) {
        const newPassword = document.getElementById('new-password').value;
        const formData = new FormData();
        
        formData.append('action', 'reset_password');
        formData.append('nonce', profileManagement.nonce);
        formData.append('new_password', newPassword);
        formData.append('logout_all', logoutAll);
        
        // Show loading on appropriate button
        const button = logoutAll 
            ? document.getElementById('logout-all-devices')
            : document.getElementById('stay-logged-in');
        
        if (button) {
            button.disabled = true;
            button.textContent = profileManagement.messages.updating;
        }
        
        try {
            const response = await fetch(profileManagement.ajaxurl, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (data.data.redirect) {
                    showToast(data.data.message || 'กำลังไปยังหน้าแรก...', 'success');
                    
                    // Disable both buttons to prevent multiple clicks
                    const logoutBtn = document.getElementById('logout-all-devices');
                    const stayBtn = document.getElementById('stay-logged-in');
                    if (logoutBtn) logoutBtn.disabled = true;
                    if (stayBtn) stayBtn.disabled = true;
                    
                    // Show redirecting state
                    if (button) {
                        button.innerHTML = '<svg class="profile-spinner-pmg728" width="20" height="20" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> กำลังไปยังหน้าแรก...';
                    }
                    
                    // Redirect immediately to homepage
                    setTimeout(() => {
                        window.location.href = data.data.redirect;
                    }, 500); // Reduced delay for better UX
                } else {
                    showToast(data.data.message || profileManagement.messages.passwordUpdated, 'success');
                    hideAllModals();
                    
                    // Reset password form
                    const passwordForm = document.getElementById('password-reset-form');
                    if (passwordForm) {
                        passwordForm.reset();
                    }
                    
                    // Clear password strength indicator
                    const strengthDiv = document.getElementById('password-strength');
                    if (strengthDiv) {
                        strengthDiv.style.display = 'none';
                    }
                }
            } else {
                
                showToast(data.data || profileManagement.messages.error, 'error');
                
                // Re-enable button
                if (button) {
                    button.disabled = false;
                    button.textContent = button.id === 'logout-all-devices' 
                        ? 'ออกจากระบบทุกอุปกรณ์' 
                        : 'คงอยู่ในระบบ';
                }
            }
        } catch (error) {
            console.error('Password update error:', error);
            showToast(profileManagement.messages.error, 'error');
        }
    }
    
    /**
     * Check password strength
     */
    function checkPasswordStrength(e) {
        const password = e.target.value;
        const strengthDiv = document.getElementById('password-strength');
        
        if (!password || !strengthDiv) {
            if (strengthDiv) strengthDiv.style.display = 'none';
            return;
        }
        
        let strength = 0;
        let message = '';
        
        // Length checks
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        
        // Character variety checks
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        
        // Display strength indicator
        strengthDiv.style.display = 'block';
        strengthDiv.className = 'password-strength-pmg728';
        
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
        
        if (password.length < 8) {
            message += ' (ต้องมีอย่างน้อย 8 ตัวอักษร)';
        }
        
        strengthDiv.textContent = message;
    }
    
    /**
     * Show modal
     */
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            
            // Focus first input in modal
            setTimeout(() => {
                const firstInput = modal.querySelector('input:not([type="hidden"])');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    }
    
    /**
     * Hide modal
     */
    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
        }
    }
    
    /**
     * Hide all modals
     */
    function hideAllModals() {
        const modals = document.querySelectorAll('.profile-modal-pmg728');
        modals.forEach(modal => {
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
        });
        document.body.classList.remove('modal-open');
    }
    
    /**
     * Show toast notification
     */
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast-notification');
        if (!toast) return;
        
        // Reset classes
        toast.className = 'profile-toast-pmg728';
        
        // Set message and type
        toast.textContent = message;
        toast.classList.add(type);
        toast.classList.add('show');
        
        // Auto hide after 3 seconds
        clearTimeout(window.toastTimeout);
        window.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    /**
     * Show/hide loading state on button
     */
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
    
    // Add dynamic error animation style
    const style = document.createElement('style');
    style.textContent = `
        .form-input-pmg728.error {
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