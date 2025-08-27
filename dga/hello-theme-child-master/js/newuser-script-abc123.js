/**
 * WordPress New User System JavaScript
 * Version: 2.0.0
 */

(function($) {
    'use strict';
    
    // Global variables
    const ajaxurl = newuserAjax.ajaxurl;
    const strings = newuserAjax.strings;
    
    /**
     * Initialize
     */
    $(document).ready(function() {
        initCreateUserForm();
        initPasswordResetModal();
    });
    
    /**
     * Initialize Create User Form
     */
    function initCreateUserForm() {
        const $form = $('#newuser-create-form-abc123');
        
        if (!$form.length) return;
        
        $form.on('submit', function(e) {
            e.preventDefault();
            
            const $button = $form.find('button[type="submit"]');
            const $messages = $('#newuser-messages-abc123');
            const formData = new FormData(this);
            
            // Add action
            formData.append('action', 'newuser_create_user');
            
            // Show loading state
            $button.prop('disabled', true).html(
                '<span class="newuser-spinner-abc123"></span> ' + strings.processing
            );
            $messages.empty();
            
            // Send AJAX request
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        showMessage($messages, 'success', response.data.message);
                        $form[0].reset();
                        
                        // Show user details if available
                        if (response.data.username) {
                            const details = `
                                <div class="newuser-created-details-abc123">
                                    <strong>${strings.success}</strong><br>
                                    Username: ${response.data.username}<br>
                                    Email: ${response.data.email}
                                </div>
                            `;
                            $messages.append(details);
                        }
                    } else {
                        showMessage($messages, 'error', response.data.message);
                    }
                },
                error: function(xhr, status, error) {
                    showMessage($messages, 'error', strings.error + ': ' + error);
                },
                complete: function() {
                    $button.prop('disabled', false).text($button.data('original-text') || 'สร้างผู้ใช้');
                }
            });
        });
        
        // Save original button text
        $form.find('button[type="submit"]').each(function() {
            $(this).data('original-text', $(this).text());
        });
    }
    
    /**
     * Initialize Password Reset Modal
     */
    function initPasswordResetModal() {
        // Check if we have reset data
        if (typeof window.newuserResetData === 'undefined') return;
        
        const $modal = $('#newuser-modal-abc123');
        const $form = $('#newuser-reset-form-abc123');
        
        if (!$modal.length || !$form.length) return;
        
        // Show modal
        setTimeout(() => {
            $modal.addClass('active');
            $('body').addClass('newuser-modal-open-abc123');
            $('#new_password_abc123').focus();
        }, 100);
        
        // Password strength indicator
        initPasswordStrength();
        
        // Handle form submission
        $form.on('submit', function(e) {
            e.preventDefault();
            
            const $button = $form.find('button[type="submit"]');
            const $messages = $('#newuser-form-messages-abc123');
            const password = $('#new_password_abc123').val();
            const confirmPassword = $('#confirm_password_abc123').val();
            
            // Clear previous messages
            $messages.empty();
            $('.newuser-field-error-abc123').removeClass('newuser-field-error-abc123');
            
            // Validate
            let isValid = true;
            
            if (password.length < 8) {
                showFieldError('#new_password_abc123', 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
                isValid = false;
            }
            
            if (password !== confirmPassword) {
                showFieldError('#confirm_password_abc123', strings.passwordMismatch);
                isValid = false;
            }
            
            if (!isValid) return;
            
            // Show loading
            $button.prop('disabled', true).html(
                '<span class="newuser-spinner-abc123"></span> ' + strings.processing
            );
            
            // Prepare data
            const data = {
                action: 'newuser_reset_password',
                nonce: window.newuserResetData.nonce,
                key: window.newuserResetData.key,
                user_id: window.newuserResetData.userId,
                password: password,
                password_confirm: confirmPassword
            };
            
            // Send request
            $.post(ajaxurl, data)
                .done(function(response) {
                    if (response.success) {
                        showMessage($messages, 'success', response.data.message);
                        $form.hide();
                        
                        // Show redirecting message
                        setTimeout(() => {
                            $messages.append(
                                '<div class="newuser-redirecting-abc123">' + 
                                strings.redirecting + 
                                '</div>'
                            );
                        }, 1000);
                        
                        // Redirect
                        setTimeout(() => {
                            window.location.href = response.data.redirect_url;
                        }, 2000);
                    } else {
                        showMessage($messages, 'error', response.data.message);
                        $button.prop('disabled', false).text('ตั้งรหัสผ่าน');
                    }
                })
                .fail(function(xhr, status, error) {
                    showMessage($messages, 'error', strings.error + ': ' + error);
                    $button.prop('disabled', false).text('ตั้งรหัสผ่าน');
                });
        });
        
        // Prevent modal close
        $modal.on('click', function(e) {
            if (e.target === this) {
                e.stopPropagation();
            }
        });
        
        // Prevent ESC key
        $(document).on('keydown', function(e) {
            if ($modal.hasClass('active') && e.keyCode === 27) {
                e.preventDefault();
            }
        });
    }
    
    /**
     * Initialize Password Strength Meter
     */
    function initPasswordStrength() {
        const $password = $('#new_password_abc123');
        const $strength = $('#password-strength-abc123');
        const $confirm = $('#confirm_password_abc123');
        
        if (!$password.length || !$strength.length) return;
        
        $password.on('keyup input', function() {
            const password = $(this).val();
            const strength = checkPasswordStrength(password);
            
            $strength.removeClass('weak medium strong');
            
            if (password.length === 0) {
                $strength.text('');
            } else if (strength < 3) {
                $strength.addClass('weak').text(strings.passwordWeak);
            } else if (strength < 4) {
                $strength.addClass('medium').text(strings.passwordMedium);
            } else {
                $strength.addClass('strong').text(strings.passwordStrong);
            }
            
            // Check match if confirm has value
            if ($confirm.val()) {
                checkPasswordMatch();
            }
        });
        
        $confirm.on('keyup input', checkPasswordMatch);
        
        function checkPasswordMatch() {
            const password = $password.val();
            const confirm = $confirm.val();
            
            if (confirm && password !== confirm) {
                showFieldError('#confirm_password_abc123', strings.passwordMismatch);
            } else {
                clearFieldError('#confirm_password_abc123');
            }
        }
    }
    
    /**
     * Check Password Strength
     */
    function checkPasswordStrength(password) {
        let strength = 0;
        
        // Length
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        
        // Character types
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        
        return strength;
    }
    
    /**
     * Show Message
     */
    function showMessage($container, type, message) {
        const alertClass = type === 'success' ? 
            'newuser-success-abc123' : 'newuser-error-abc123';
        
        const html = `<div class="${alertClass}" role="alert">${message}</div>`;
        
        $container.html(html);
        
        // Scroll to message
        $('html, body').animate({
            scrollTop: $container.offset().top - 100
        }, 300);
    }
    
    /**
     * Show Field Error
     */
    function showFieldError(field, message) {
        const $field = $(field);
        const $parent = $field.parent();
        
        $parent.addClass('newuser-field-error-abc123');
        
        // Remove existing error
        $parent.find('.newuser-field-error-message-abc123').remove();
        
        // Add new error
        $field.after(
            `<div class="newuser-field-error-message-abc123">${message}</div>`
        );
    }
    
    /**
     * Clear Field Error
     */
    function clearFieldError(field) {
        const $field = $(field);
        const $parent = $field.parent();
        
        $parent.removeClass('newuser-field-error-abc123');
        $parent.find('.newuser-field-error-message-abc123').remove();
    }
    
})(jQuery);