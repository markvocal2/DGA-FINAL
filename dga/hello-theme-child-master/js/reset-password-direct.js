/**
 * Reset Password JavaScript - Updated Version
 * File: /js/reset-password-direct.js
 */

jQuery(document).ready(function($) {
    console.log('Reset Password JS Loaded');
    
    // Password strength checker
    function checkPasswordStrength(password) {
        var strength = 0;
        
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]+/)) strength++;
        if (password.match(/[A-Z]+/)) strength++;
        if (password.match(/[0-9]+/)) strength++;
        if (password.match(/[^a-zA-Z0-9]+/)) strength++;
        
        return strength;
    }
    
    // Update password strength indicator
    $('#pass1').on('keyup', function() {
        var password = $(this).val();
        var strength = checkPasswordStrength(password);
        var strengthIndicator = $('#password-strength');
        
        strengthIndicator.removeClass('weak medium strong');
        
        if (password.length === 0) {
            strengthIndicator.text('').hide();
        } else if (strength < 2) {
            strengthIndicator.text('Weak password').addClass('weak').show();
        } else if (strength < 4) {
            strengthIndicator.text('Medium strength').addClass('medium').show();
        } else {
            strengthIndicator.text('Strong password').addClass('strong').show();
        }
    });
    
    // Check password match
    $('#pass2').on('keyup', function() {
        var pass1 = $('#pass1').val();
        var pass2 = $(this).val();
        var messages = $('#form-messages');
        
        if (pass2.length > 0 && pass1 !== pass2) {
            messages.removeClass('success').addClass('error')
                   .text('Passwords do not match').show();
        } else if (pass2.length > 0 && pass1 === pass2) {
            messages.removeClass('error').addClass('success')
                   .text('Passwords match').show();
        } else {
            messages.hide();
        }
    });
    
    // Handle form submission
    $('#custom-set-password-form').on('submit', function(e) {
        e.preventDefault();
        
        console.log('Form submitted');
        
        var form = $(this);
        var submitButton = form.find('button[type="submit"]');
        var messages = $('#form-messages');
        var pass1 = $('#pass1').val();
        var pass2 = $('#pass2').val();
        
        // Clear previous messages
        messages.removeClass('error success').hide();
        
        // Validate
        if (pass1.length < 8) {
            messages.addClass('error').text('Password must be at least 8 characters').show();
            return false;
        }
        
        if (pass1 !== pass2) {
            messages.addClass('error').text('Passwords do not match').show();
            return false;
        }
        
        // Disable submit button
        submitButton.prop('disabled', true).text('Setting password...');
        
        // Get the correct variables name
        var ajaxVars = window.custom_reset_vars || window.reset_password_vars;
        
        if (!ajaxVars) {
            console.error('Ajax variables not found');
            messages.addClass('error').text('Configuration error. Please refresh and try again.').show();
            submitButton.prop('disabled', false).text('Set Password');
            return false;
        }
        
        // Prepare data
        var data = {
            action: 'custom_ajax_set_password',
            nonce: ajaxVars.nonce,
            pass1: pass1,
            pass2: pass2,
            key: $('input[name="reset_key"]').val(),
            login: $('input[name="user_login"]').val(),
            user_id: $('input[name="user_id"]').val()
        };
        
        console.log('Sending AJAX request', data);
        
        // Send AJAX request
        $.ajax({
            url: ajaxVars.ajax_url,
            type: 'POST',
            data: data,
            dataType: 'json',
            success: function(response) {
                console.log('AJAX response:', response);
                
                if (response.success) {
                    messages.removeClass('error').addClass('success')
                           .html(response.data.message).show();
                    
                    // Hide form
                    form.find('.actions input, .actions button').hide();
                    
                    // Redirect after 2 seconds
                    setTimeout(function() {
                        window.location.href = response.data.redirect_url || ajaxVars.redirect_url;
                    }, 2000);
                } else {
                    messages.addClass('error').text(response.data.message || 'An error occurred').show();
                    submitButton.prop('disabled', false).text('Set Password');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', status, error);
                console.error('Response:', xhr.responseText);
                
                messages.addClass('error').text('Connection error. Please try again.').show();
                submitButton.prop('disabled', false).text('Set Password');
            }
        });
    });
    
    // Auto-focus on password field if on reset form
    if ($('#custom-set-password-form').length > 0) {
        $('#pass1').focus();
    }
});