/**
 * Enhanced JavaScript for Welcome User Widget with Tooltips Support
 * Compatible with WCAG 2.1 AAA and modern ES6+ features
 * Version: 1.2.0 - Added anti-autocomplete and anti-autofill features
 */

jQuery(document).ready(function($) {
    
    // Store original focus element for modal focus management
    let originalFocus = null;
    
    // Function to disable autocomplete and clear saved values
    function disableAutocomplete_tt25() {
        // Get the random suffix from hidden field
        const randomSuffix = $('#form-random-suffix-tt25').val();
        
        if (randomSuffix) {
            const $usernameField = $('#login-username-' + randomSuffix);
            const $passwordField = $('#login-password-' + randomSuffix);
            
            // Clear any saved values when form is shown
            $usernameField.val('');
            $passwordField.val('');
            
            // Additional measures to prevent autofill
            setTimeout(function() {
                $usernameField.val('');
                $passwordField.val('');
            }, 100);
            
            // Set readonly temporarily then remove it (tricks some browsers)
            $usernameField.add($passwordField).each(function() {
                const $field = $(this);
                $field.attr('readonly', true);
                setTimeout(function() {
                    $field.removeAttr('readonly');
                }, 50);
            });
            
            // Extra measure: change input type temporarily for username field
            setTimeout(function() {
                if ($usernameField.attr('type') === 'text') {
                    $usernameField.attr('type', 'text');
                }
            }, 200);
        }
    }
    
    // Handle logout button click (for logged-in users)
    $(document).on('click', '#welcome-user-logout-btn-tt25', function(e) {
        e.preventDefault();
        
        const currentURL = window.location.href;
        
        // Send AJAX request to logout
        $.ajax({
            type: 'POST',
            url: welcome_user_widget_ajax.ajax_url,
            data: {
                action: 'welcome_user_logout',
                nonce: welcome_user_widget_ajax.logout_nonce
            },
            success: function(response) {
                // Reload current page regardless of response
                window.location.href = currentURL;
            },
            error: function() {
                // Reload page even on error
                console.log('AJAX error occurred during logout. Reloading page anyway.');
                window.location.href = currentURL;
            },
            timeout: 5000
        });
        
        // Fallback reload after timeout
        setTimeout(function() {
            window.location.href = currentURL;
        }, 2000);
    });
    
    // Handle login trigger button click (for non-logged-in users)
    $(document).on('click', '#login-trigger-btn-tt25', function(e) {
        e.preventDefault();
        
        const $button = $(this);
        const $widget = $button.closest('.welcome-user-widget-tt25');
        const $formContainer = $widget.find('#login-form-container-tt25');
        const $guestButtons = $widget.find('.guest-user-buttons-tt25');
        const isTooltipsStyle = $widget.hasClass('tooltips-style');
        
        // Check if form is currently visible
        const isFormVisible = $formContainer.is(':visible');
        
        if (isFormVisible) {
            // Hide the form
            hideLoginForm_tt25($widget);
        } else {
            // Store original focus for restoration
            originalFocus = $button[0];
            
            // Show the form
            showLoginForm_tt25($widget, isTooltipsStyle);
        }
        
        // Update ARIA attributes
        $button.attr('aria-expanded', !isFormVisible);
    });
    
    // Handle form close button (for tooltips style)
    $(document).on('click', '.login-form-close-tt25', function(e) {
        e.preventDefault();
        const $widget = $(this).closest('.welcome-user-widget-tt25');
        hideLoginForm_tt25($widget);
    });
    
    // Handle login form submission with dynamic field names
    $(document).on('submit', '#ajax-login-form-tt25', function(e) {
        e.preventDefault();
        
        const $form = $(this);
        const $widget = $form.closest('.welcome-user-widget-tt25');
        const $message = $widget.find('.login-message-tt25');
        const $submitBtn = $form.find('#login-submit-btn-tt25');
        
        // Get the random suffix from hidden field
        const randomSuffix = $('#form-random-suffix-tt25').val();
        
        // Get form data using dynamic field names
        const username = $form.find('#login-username-' + randomSuffix).val();
        const password = $form.find('#login-password-' + randomSuffix).val();
        
        // Validate fields are not empty
        if (!username || !password) {
            $message
                .removeClass('success-tt25 loading-tt25')
                .addClass('error-tt25')
                .text('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน')
                .show();
            return false;
        }
        
        // Disable submit button and show loading state
        $submitBtn.prop('disabled', true).text('กำลังเข้าสู่ระบบ...');
        
        // Show processing message
        $message
            .removeClass('error-tt25 success-tt25')
            .addClass('loading-tt25')
            .text('กำลังเข้าสู่ระบบ...')
            .show();
        
        // Send AJAX request for login
        $.ajax({
            type: 'POST',
            url: welcome_user_widget_ajax.ajax_url,
            data: {
                action: 'welcome_user_login',
                username: username,
                password: password,
                nonce: welcome_user_widget_ajax.login_nonce
            },
            success: function(response) {
                if (response.success) {
                    // Show success message
                    $message
                        .removeClass('error-tt25 loading-tt25')
                        .addClass('success-tt25')
                        .text(response.data.message);
                    
                    // Clear form fields before reload
                    $form.find('#login-username-' + randomSuffix).val('');
                    $form.find('#login-password-' + randomSuffix).val('');
                    
                    // Reload page after successful login
                    setTimeout(function() {
                        window.location.href = window.location.href.split('#')[0];
                    }, 1000);
                } else {
                    // Show error message
                    $message
                        .removeClass('success-tt25 loading-tt25')
                        .addClass('error-tt25')
                        .text(response.data.message);
                    
                    // Re-enable submit button
                    $submitBtn.prop('disabled', false).text('เข้าสู่ระบบ');
                    
                    // Clear password field for security
                    $form.find('#login-password-' + randomSuffix).val('');
                    
                    // Focus on username field for retry
                    $form.find('#login-username-' + randomSuffix).focus().select();
                }
            },
            error: function() {
                // Show connection error message
                $message
                    .removeClass('success-tt25 loading-tt25')
                    .addClass('error-tt25')
                    .text('เกิดข้อผิดพลาดในการเชื่อมต่อ โปรดลองอีกครั้งภายหลัง');
                
                // Re-enable submit button
                $submitBtn.prop('disabled', false).text('เข้าสู่ระบบ');
                
                // Clear password field for security
                $form.find('#login-password-' + randomSuffix).val('');
            }
        });
    });
    
    // Handle clicking outside to close forms
    $(document).on('click', function(e) {
        const $target = $(e.target);
        const $widget = $('.welcome-user-widget-tt25.not-logged-in');
        
        // Check if click is outside the widget and form is visible
        if ($widget.length && 
            !$target.closest('.welcome-user-widget-tt25').length && 
            $widget.find('#login-form-container-tt25').is(':visible')) {
            hideLoginForm_tt25($widget);
        }
    });
    
    // Handle ESC key to close tooltips form
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            const $widget = $('.welcome-user-widget-tt25.tooltips-style');
            if ($widget.length && $widget.find('#login-form-container-tt25').is(':visible')) {
                hideLoginForm_tt25($widget);
            }
        }
    });
    
    // Function to show login form with anti-autocomplete
    function showLoginForm_tt25($widget, isTooltipsStyle) {
        const $formContainer = $widget.find('#login-form-container-tt25');
        const $guestButtons = $widget.find('.guest-user-buttons-tt25');
        const $triggerBtn = $widget.find('#login-trigger-btn-tt25');
        const randomSuffix = $('#form-random-suffix-tt25').val();
        
        // Disable autocomplete when showing form
        disableAutocomplete_tt25();
        
        if (isTooltipsStyle) {
            // For tooltips style - hide guest buttons and show form as dropdown
            $guestButtons.hide();
            
            // Calculate and set proper positioning
            calculateTooltipsPosition_tt25($widget);
            
            // Set modal attributes
            $formContainer.attr({
                'aria-modal': 'true',
                'aria-hidden': 'false'
            });
            
            // Disable page scrolling for modal
            $('body').addClass('modal-open-tt25');
            
            $formContainer.fadeIn(300, function() {
                // Clear fields again after animation
                disableAutocomplete_tt25();
                
                // Focus on username field after animation completes
                const $usernameField = $formContainer.find('#login-username-' + randomSuffix);
                if ($usernameField.length) {
                    setTimeout(function() {
                        $usernameField.focus();
                    }, 100);
                }
            });
        } else {
            // For inline style - hide guest buttons and show form inline
            $guestButtons.hide();
            
            $formContainer.attr('aria-hidden', 'false');
            $formContainer.slideDown(200, function() {
                // Clear fields again after animation
                disableAutocomplete_tt25();
                
                // Focus on username field after animation completes
                const $usernameField = $formContainer.find('#login-username-' + randomSuffix);
                if ($usernameField.length) {
                    setTimeout(function() {
                        $usernameField.focus();
                    }, 100);
                }
            });
        }
        
        // Update ARIA attributes
        $triggerBtn.attr('aria-expanded', 'true');
    }
    
    // Function to hide login form
    function hideLoginForm_tt25($widget) {
        const $formContainer = $widget.find('#login-form-container-tt25');
        const $guestButtons = $widget.find('.guest-user-buttons-tt25');
        const $triggerBtn = $widget.find('#login-trigger-btn-tt25');
        const isTooltipsStyle = $widget.hasClass('tooltips-style');
        
        if (isTooltipsStyle) {
            // For tooltips style
            $formContainer.fadeOut(200, function() {
                $guestButtons.show();
                clearLoginForm_tt25($widget);
                
                // Remove modal attributes
                $formContainer.attr({
                    'aria-modal': 'false',
                    'aria-hidden': 'true'
                });
                
                // Re-enable page scrolling
                $('body').removeClass('modal-open-tt25');
                
                // Restore focus to original element
                if (originalFocus) {
                    originalFocus.focus();
                    originalFocus = null;
                }
            });
        } else {
            // For inline style
            $formContainer.slideUp(200, function() {
                $guestButtons.show();
                clearLoginForm_tt25($widget);
                
                $formContainer.attr('aria-hidden', 'true');
                
                // Return focus to trigger button
                $triggerBtn.focus();
            });
        }
        
        // Update ARIA attributes
        $triggerBtn.attr('aria-expanded', 'false');
    }
    
    // Function to clear login form
    function clearLoginForm_tt25($widget) {
        const $form = $widget.find('#ajax-login-form-tt25');
        const $message = $widget.find('.login-message-tt25');
        const $submitBtn = $form.find('#login-submit-btn-tt25');
        const randomSuffix = $('#form-random-suffix-tt25').val();
        
        // Clear form fields using dynamic IDs
        if (randomSuffix) {
            $form.find('#login-username-' + randomSuffix).val('');
            $form.find('#login-password-' + randomSuffix).val('');
        }
        
        // Clear form using reset as backup
        $form[0].reset();
        
        // Clear messages
        $message.removeClass('error-tt25 success-tt25 loading-tt25').text('').hide();
        
        // Reset submit button
        $submitBtn.prop('disabled', false).text('เข้าสู่ระบบ');
    }
    
    // Function to calculate tooltips position
    function calculateTooltipsPosition_tt25($widget) {
        const $formContainer = $widget.find('#login-form-container-tt25');
        
        if (!$formContainer.hasClass('tooltips-form-tt25')) return;
        
        // Reset all positioning classes
        $formContainer.removeClass('above-trigger-tt25 center-align-tt25 right-align-tt25');
        
        // Get widget position and dimensions
        const widgetOffset = $widget.offset();
        const widgetWidth = $widget.outerWidth();
        const widgetHeight = $widget.outerHeight();
        
        // Get viewport dimensions
        const windowWidth = $(window).width();
        const windowHeight = $(window).height();
        const scrollTop = $(window).scrollTop();
        
        // Show form temporarily to get its dimensions
        $formContainer.css({
            visibility: 'hidden',
            display: 'block'
        });
        
        const formWidth = $formContainer.outerWidth();
        const formHeight = $formContainer.outerHeight();
        
        // Hide it again
        $formContainer.css({
            visibility: 'visible',
            display: 'none'
        });
        
        // Calculate if form fits below the widget
        const spaceBelow = windowHeight - (widgetOffset.top - scrollTop + widgetHeight);
        const spaceAbove = widgetOffset.top - scrollTop;
        
        // Check vertical positioning
        if (spaceBelow >= formHeight + 20) {
            // Show below (default)
            $formContainer.removeClass('above-trigger-tt25');
        } else if (spaceAbove >= formHeight + 20) {
            // Show above
            $formContainer.addClass('above-trigger-tt25');
        }
        
        // Check horizontal positioning
        const spaceRight = windowWidth - widgetOffset.left;
        const spaceLeft = widgetOffset.left;
        
        if (formWidth <= spaceRight) {
            // Align left (default)
            $formContainer.removeClass('center-align-tt25 right-align-tt25');
        } else if (formWidth <= spaceLeft) {
            // Align right
            $formContainer.addClass('right-align-tt25');
        } else {
            // Center align if both sides have insufficient space
            $formContainer.addClass('center-align-tt25');
        }
    }
    
    // Handle window resize for tooltips positioning
    $(window).on('resize', function() {
        const $widget = $('.welcome-user-widget-tt25.tooltips-style');
        if ($widget.length && $widget.find('#login-form-container-tt25').is(':visible')) {
            calculateTooltipsPosition_tt25($widget);
        }
    });
    
    // Handle scroll for tooltips positioning
    $(window).on('scroll', function() {
        const $widget = $('.welcome-user-widget-tt25.tooltips-style');
        if ($widget.length && $widget.find('#login-form-container-tt25').is(':visible')) {
            calculateTooltipsPosition_tt25($widget);
        }
    });
    
    // Clear all login form fields on page load
    $(window).on('load', function() {
        // Clear any fields with login-related classes
        $('.login-username-field-tt25, .login-password-field-tt25').val('');
        
        // Also clear by partial ID match
        $('input[id^="login-username-"], input[id^="login-password-"]').val('');
        
        // Force clear after a delay
        setTimeout(function() {
            $('.login-username-field-tt25, .login-password-field-tt25').val('');
            $('input[id^="login-username-"], input[id^="login-password-"]').val('');
        }, 500);
    });
    
    // Prevent browser from saving credentials on page unload
    $(window).on('beforeunload', function() {
        $('.login-username-field-tt25, .login-password-field-tt25').val('');
        $('input[id^="login-username-"], input[id^="login-password-"]').val('');
    });
    
    // Additional measure: periodically clear fields if form is hidden
    setInterval(function() {
        const $formContainer = $('#login-form-container-tt25');
        if ($formContainer.length && !$formContainer.is(':visible')) {
            const randomSuffix = $('#form-random-suffix-tt25').val();
            if (randomSuffix) {
                $('#login-username-' + randomSuffix).val('');
                $('#login-password-' + randomSuffix).val('');
            }
        }
    }, 5000);
    
    // Prevent paste in password field (optional security measure)
    $(document).on('paste', '.login-password-field-tt25', function(e) {
        // Allow paste but clear clipboard data from browser memory
        setTimeout(function() {
            $(e.target).trigger('input');
        }, 0);
    });
    
    // Handle input events to ensure fields stay clear when hidden
    $(document).on('input', '.login-username-field-tt25, .login-password-field-tt25', function(e) {
        const $formContainer = $(this).closest('#login-form-container-tt25');
        if (!$formContainer.is(':visible')) {
            $(this).val('');
        }
    });
    
});