/**
 * DGA reCAPTCHA V3 JavaScript with Contact Form Integration
 * ไฟล์นี้จะต้องถูกบันทึกใน child-theme/js/dga-recap-v3.js
 */

(function($) {
    'use strict';

    // Object สำหรับจัดการ reCAPTCHA V3
    var DGARecaptchaV3 = {
        
        // กำหนดค่าเริ่มต้น
        config: {
            siteKey: dga_recaptcha_ajax.site_key,
            ajaxUrl: dga_recaptcha_ajax.ajax_url,
            nonce: dga_recaptcha_ajax.nonce
        },

        // Initialize
        init: function() {
            var self = this;
            
            // รอให้ Google reCAPTCHA พร้อมใช้งาน
            grecaptcha.ready(function() {
                self.setupRecaptcha();
                self.integrateWithContactForm();
            });
        },

        // Setup reCAPTCHA
        setupRecaptcha: function() {
            var self = this;
            
            // ค้นหา container ทั้งหมดที่มี reCAPTCHA
            $('.dga-recaptcha-container').each(function() {
                var $container = $(this);
                var action = $container.data('action') || 'submit';
                var callback = $container.data('callback');
                var formId = $container.data('form-id');
                var buttonId = $container.data('button-id');
                
                // ถ้ามี form_id ให้ผูกกับ form submit
                if (formId) {
                    self.bindToForm($container, formId, action);
                }
                
                // ถ้ามี button_id ให้ผูกกับ button click
                if (buttonId) {
                    self.bindToButton($container, buttonId, action);
                }
                
                // ถ้าไม่มีทั้งสองอย่าง ให้ generate token อัตโนมัติ
                if (!formId && !buttonId) {
                    self.generateToken($container, action, function(token) {
                        // ถ้ามี callback function ให้เรียกใช้
                        if (callback && typeof window[callback] === 'function') {
                            window[callback](token);
                        }
                    });
                }
            });
        },

        // Integration กับ existing contact form
        integrateWithContactForm: function() {
            var self = this;
            var $form = $('#department-contact-form');
            
            if ($form.length === 0) return;
            
            // ถ้าไม่มี reCAPTCHA container ใน form อยู่แล้ว
            if ($form.find('.dga-recaptcha-container').length === 0) {
                var recaptchaHtml = `
                    <div class="dga-recaptcha-container" 
                         id="contact-form-recaptcha"
                         data-action="contact_form"
                         data-form-id="department-contact-form">
                        <input type="hidden" name="recaptcha_token" />
                        <input type="hidden" name="recaptcha_action" value="contact_form" />
                    </div>
                `;
                $form.append(recaptchaHtml);
            }
            
            // Override original form submission
            $form.off('submit').on('submit', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                var $container = $form.find('.dga-recaptcha-container');
                var $submitButton = $form.find('[type="submit"]');
                var $loadingOverlay = $('#loading-overlay');
                
                // Show loading
                $submitButton.prop('disabled', true);
                $loadingOverlay.show();
                
                // Generate reCAPTCHA token
                self.generateToken($container, 'contact_form', function(token) {
                    if (token) {
                        // Set token to hidden input
                        $container.find('input[name="recaptcha_token"]').val(token);
                        
                        // Prepare form data
                        var formData = $form.serialize();
                        formData += '&action=contact_form_submit';
                        formData += '&recaptcha_token=' + encodeURIComponent(token);
                        formData += '&recaptcha_action=contact_form';
                        
                        // Submit form via AJAX
                        $.ajax({
                            type: 'POST',
                            url: dga_recaptcha_ajax.ajax_url,
                            data: formData,
                            success: function(response) {
                                $loadingOverlay.hide();
                                $submitButton.prop('disabled', false);
                                
                                if (response.status === 'success') {
                                    // Show success message
                                    self.showMessage('success', response.message);
                                    
                                    // Reset form
                                    $form[0].reset();
                                    
                                    // Clear validation errors
                                    $('.error-message').empty();
                                    $('.form-control').removeClass('is-invalid');
                                    
                                    // Scroll to top
                                    $('html, body').animate({
                                        scrollTop: $form.offset().top - 100
                                    }, 300);
                                } else {
                                    self.showMessage('error', response.message);
                                }
                            },
                            error: function() {
                                $loadingOverlay.hide();
                                $submitButton.prop('disabled', false);
                                self.showMessage('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
                            }
                        });
                    } else {
                        $loadingOverlay.hide();
                        $submitButton.prop('disabled', false);
                        self.showMessage('error', 'เกิดข้อผิดพลาดในการตรวจสอบความปลอดภัย กรุณาลองใหม่อีกครั้ง');
                    }
                });
            });
        },

        // ผูก reCAPTCHA กับ form
        bindToForm: function($container, formId, action) {
            var self = this;
            var $form = $('#' + formId);
            
            if ($form.length === 0) {
                console.error('Form not found: ' + formId);
                return;
            }
            
            // ถ้าเป็น contact form ให้ใช้ integration method แทน
            if (formId === 'department-contact-form') {
                return;
            }
            
            $form.on('submit', function(e) {
                e.preventDefault();
                
                var $submitButton = $form.find('[type="submit"]');
                $submitButton.prop('disabled', true);
                
                self.generateToken($container, action, function(token) {
                    if (token) {
                        // ใส่ token ลงใน hidden input
                        $container.find('input[name="recaptcha_token"]').val(token);
                        
                        // ตรวจสอบ token กับ server
                        self.verifyToken(token, action, function(response) {
                            if (response.success) {
                                // ถ้าผ่านการตรวจสอบ ให้ submit form
                                $form.off('submit');
                                $form.submit();
                            } else {
                                alert('reCAPTCHA verification failed. Please try again.');
                                $submitButton.prop('disabled', false);
                            }
                        });
                    }
                });
            });
        },

        // ผูก reCAPTCHA กับ button
        bindToButton: function($container, buttonId, action) {
            var self = this;
            var $button = $('#' + buttonId);
            
            if ($button.length === 0) {
                console.error('Button not found: ' + buttonId);
                return;
            }
            
            $button.on('click', function(e) {
                e.preventDefault();
                
                $button.prop('disabled', true);
                
                self.generateToken($container, action, function(token) {
                    if (token) {
                        // ใส่ token ลงใน hidden input
                        $container.find('input[name="recaptcha_token"]').val(token);
                        
                        // ตรวจสอบ token กับ server
                        self.verifyToken(token, action, function(response) {
                            $button.prop('disabled', false);
                            
                            if (response.success) {
                                // Trigger custom event
                                $button.trigger('recaptcha:success', [token, response]);
                            } else {
                                $button.trigger('recaptcha:error', [response]);
                            }
                        });
                    }
                });
            });
        },

        // Generate reCAPTCHA token
        generateToken: function($container, action, callback) {
            var self = this;
            
            // แสดง loading state
            $container.addClass('dga-recaptcha-loading');
            
            grecaptcha.execute(self.config.siteKey, {action: action}).then(function(token) {
                $container.removeClass('dga-recaptcha-loading');
                
                if (callback && typeof callback === 'function') {
                    callback(token);
                }
            }).catch(function(error) {
                console.error('reCAPTCHA error:', error);
                $container.removeClass('dga-recaptcha-loading');
                
                if (callback && typeof callback === 'function') {
                    callback(null);
                }
            });
        },

        // Verify token กับ server
        verifyToken: function(token, action, callback) {
            var self = this;
            
            $.ajax({
                url: self.config.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'dga_verify_recaptcha',
                    token: token,
                    'recaptcha_action': action,
                    nonce: self.config.nonce
                },
                success: function(response) {
                    if (callback && typeof callback === 'function') {
                        callback(response);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('AJAX error:', error);
                    
                    if (callback && typeof callback === 'function') {
                        callback({
                            success: false,
                            message: 'AJAX request failed'
                        });
                    }
                }
            });
        },

        // Helper function: Show message
        showMessage: function(type, message) {
            var $form = $('#department-contact-form');
            var alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
            
            // Remove existing messages
            $('.dga-recaptcha-message').remove();
            
            // Create message element
            var $message = $('<div class="alert ' + alertClass + ' dga-recaptcha-message" role="alert">' +
                          '<span>' + message + '</span>' +
                          '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                          '<span aria-hidden="true">&times;</span>' +
                          '</button>' +
                          '</div>');
            
            // Insert before form
            $message.insertBefore($form);
            
            // Auto hide after 5 seconds
            setTimeout(function() {
                $message.fadeOut(function() {
                    $(this).remove();
                });
            }, 5000);
            
            // Bind close button
            $message.find('.close').on('click', function() {
                $message.remove();
            });
        },

        // Helper function: Reset token
        resetToken: function($container) {
            $container.find('input[name="recaptcha_token"]').val('');
        }
    };

    // Initialize เมื่อ document ready
    $(document).ready(function() {
        if (typeof grecaptcha !== 'undefined') {
            DGARecaptchaV3.init();
        } else {
            // ถ้า grecaptcha ยังไม่ ready ให้รอ
            $(window).on('load', function() {
                DGARecaptchaV3.init();
            });
        }
    });

    // Export to global scope
    window.DGARecaptchaV3 = DGARecaptchaV3;

})(jQuery);