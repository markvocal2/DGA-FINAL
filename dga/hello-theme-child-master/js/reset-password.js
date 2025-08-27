/**
 * DGA New User Creation และ Password Reset Modal JavaScript
 * Version 1.0.1 - แก้ไขปัญหาการส่งฟอร์มและการแสดง Modal
 */

jQuery(document).ready(function($) {
    // Debug mode
    var debug = true;
    
    if (debug) {
        console.log('DGA Password Reset JS loaded');
    }
    
    // ตรวจสอบว่ามี modal หรือไม่
    var passwordResetModal = $('#dga-password-reset-modal');
    
    if (passwordResetModal.length) {
        if (debug) console.log('Password reset modal found');
        
        // แสดง Modal โดยอัตโนมัติเมื่อโหลดหน้า
        setTimeout(function() {
            passwordResetModal.addClass('active');
            $('body').addClass('dga-modal-open');
            
            if (debug) console.log('Modal activated');
        }, 100);
        
        // ป้องกันการกดคลิกนอก modal เพื่อปิด
        passwordResetModal.on('click', function(e) {
            if (e.target === this) {
                e.stopPropagation();
                return false;
            }
        });
        
        // ป้องกันการกดปุ่ม Escape และปุ่มเลื่อนหน้า
        $(document).on('keydown', function(e) {
            if (passwordResetModal.hasClass('active')) {
                if (e.keyCode === 27) { // ESC key
                    e.preventDefault();
                    return false;
                }
                
                // ป้องกันการเลื่อนหน้าด้วยปุ่มลูกศร PageUp/PageDown
                if (e.keyCode >= 33 && e.keyCode <= 40) {
                    e.preventDefault();
                    return false;
                }
            }
        });
        
        // ป้องกันการเลื่อนหน้าด้วยล้อเลื่อนเมาส์
        $(window).on('wheel', function(e) {
            if (passwordResetModal.hasClass('active')) {
                e.preventDefault();
                return false;
            }
        });
        
        // ตรวจสอบความแข็งแกร่งของรหัสผ่าน
        var pass1 = $('#pass1');
        var pass2 = $('#pass2');
        var strengthIndicator = $('#password-strength');
        
        pass1.on('keyup', function() {
            var password = $(this).val();
            var strength = checkPasswordStrength(password);
            
            // แสดงความแข็งแกร่งของรหัสผ่าน
            strengthIndicator.removeClass('strength-very-weak strength-weak strength-medium strength-strong');
            
            if (password.length === 0) {
                strengthIndicator.text('');
            } else if (password.length < 6) {
                strengthIndicator.addClass('strength-very-weak').text('รหัสผ่านอ่อนมาก');
            } else if (strength < 2) {
                strengthIndicator.addClass('strength-weak').text('รหัสผ่านอ่อน');
            } else if (strength < 4) {
                strengthIndicator.addClass('strength-medium').text('รหัสผ่านปานกลาง');
            } else {
                strengthIndicator.addClass('strength-strong').text('รหัสผ่านแข็งแรง');
            }
        });
        
        // ตรวจสอบการตรงกันของรหัสผ่าน
        pass2.on('keyup', function() {
            if (pass1.val() !== pass2.val()) {
                if (!pass2.next('.dga-inline-error').length) {
                    pass2.addClass('dga-input-error');
                    pass2.after('<div class="dga-inline-error">รหัสผ่านไม่ตรงกัน</div>');
                }
            } else {
                pass2.removeClass('dga-input-error');
                pass2.next('.dga-inline-error').remove();
            }
        });
        
        // จัดการกับการส่งฟอร์มตั้งรหัสผ่าน
        $('#dga-reset-password-form').on('submit', function(e) {
            e.preventDefault();
            
            if (debug) console.log('Reset password form submitted');
            
            var password = pass1.val();
            var confirmPassword = pass2.val();
            var formMessages = $('#dga-form-messages');
            var submitButton = $('.dga-submit-button');
            var isValid = true;
            
            // ล้างข้อความแจ้งเตือนเดิม
            formMessages.empty();
            
            // ตรวจสอบความยาวรหัสผ่าน
            if (password.length < 8) {
                pass1.addClass('dga-input-error');
                if (!pass1.next('.dga-inline-error').length) {
                    pass1.after('<div class="dga-inline-error">รหัสผ่านควรมีอย่างน้อย 8 ตัวอักษร</div>');
                }
                isValid = false;
            } else {
                pass1.removeClass('dga-input-error');
                pass1.next('.dga-inline-error').remove();
            }
            
            // ตรวจสอบการตรงกันของรหัสผ่าน
            if (password !== confirmPassword) {
                pass2.addClass('dga-input-error');
                if (!pass2.next('.dga-inline-error').length) {
                    pass2.after('<div class="dga-inline-error">รหัสผ่านไม่ตรงกัน</div>');
                }
                isValid = false;
            } else {
                pass2.removeClass('dga-input-error');
                pass2.next('.dga-inline-error').remove();
            }
            
            if (isValid) {
                // แสดงสถานะกำลังโหลด
                submitButton.prop('disabled', true).val('กำลังประมวลผล...');
                if (!$('.dga-loading').length) {
                    submitButton.after('<span class="dga-loading"></span>');
                }
                
                // รวบรวมข้อมูลจากฟอร์ม
                var key = $('input[name="key"]').val();
                var login = $('input[name="login"]').val();
                var user_id = $('input[name="user_id"]').val();
                var nonce = $('input[name="dga_reset_nonce"]').val();
                
                if (debug) {
                    console.log('Form data:', {
                        key: key,
                        login: login,
                        user_id: user_id,
                        nonce: nonce
                    });
                }
                
                // กำหนด ajaxurl ถ้าไม่มี
                var ajaxurl = '/wp-admin/admin-ajax.php';
                if (typeof window.ajaxurl !== 'undefined') {
                    ajaxurl = window.ajaxurl;
                }
                if (typeof window.dga_reset_params !== 'undefined' && window.dga_reset_params.ajaxurl) {
                    ajaxurl = window.dga_reset_params.ajaxurl;
                }
                
                if (debug) console.log('Using AJAX URL:', ajaxurl);
                
                // ส่งข้อมูลผ่าน AJAX
                $.ajax({
                    type: 'POST',
                    url: ajaxurl,
                    data: {
                        action: 'dga_reset_password',
                        pass1: password,
                        pass2: confirmPassword,
                        key: key,
                        login: login,
                        user_id: user_id,
                        nonce: nonce
                    },
                    dataType: 'json',
                    timeout: 30000, // 30 วินาที timeout
                    success: function(response) {
                        if (debug) console.log('AJAX Response:', response);
                        
                        if (response && response.success) {
                            // แสดงข้อความสำเร็จ
                            formMessages.html('<div class="dga-success-message">' + (response.data && response.data.message ? response.data.message : 'ตั้งรหัสผ่านสำเร็จ! กำลังเข้าสู่ระบบ...') + '</div>');
                            
                            // ปิดฟอร์ม
                            $('#dga-reset-password-form').hide();
                            
                            // ล็อกอินอัตโนมัติ
                            setTimeout(function() {
                                // ล็อกอินผ่านหน้าที่มี user_id และ token
                                var loginUrl = window.location.protocol + '//' + window.location.host + '?user_id=' + response.data.user_id + '&token=' + response.data.token;
                                
                                if (debug) console.log('Redirecting to:', loginUrl);
                                
                                // ล้าง URL ปัจจุบันก่อนเปลี่ยนเส้นทาง
                                window.history.replaceState({}, document.title, window.location.pathname);
                                
                                // เปลี่ยนเส้นทาง
                                window.location.href = loginUrl;
                            }, 1500);
                        } else {
                            // แสดงข้อความผิดพลาด
                            var errorMessage = 'เกิดข้อผิดพลาดในการตั้งรหัสผ่าน';
                            
                            if (response && response.data && response.data.message) {
                                errorMessage = response.data.message;
                            }
                            
                            formMessages.html('<div class="dga-error-message">' + errorMessage + '</div>');
                            
                            // รีเซ็ตปุ่ม
                            submitButton.prop('disabled', false).val('ตั้งรหัสผ่าน');
                            $('.dga-loading').remove();
                        }
                    },
                    error: function(xhr, status, error) {
                        if (debug) {
                            console.log('AJAX Error:');
                            console.log('Status:', status);
                            console.log('Error:', error);
                            try {
                                console.log('Response:', xhr.responseText);
                            } catch (e) {
                                console.log('Could not log response text:', e);
                            }
                        }
                        
                        // แสดงข้อความผิดพลาด
                        formMessages.html('<div class="dga-error-message">เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + (status || 'unknown') + '. กรุณาลองใหม่อีกครั้ง</div>');
                        
                        // เพิ่มลิงก์เข้าสู่ระบบด้วยตนเอง
                        formMessages.append('<div class="dga-manual-login"><p>คุณสามารถเข้าสู่ระบบด้วยตนเองที่ <a href="/wp-login.php" class="dga-login-link">หน้าเข้าสู่ระบบ</a></p></div>');
                        
                        // รีเซ็ตปุ่ม
                        submitButton.prop('disabled', false).val('ตั้งรหัสผ่าน');
                        $('.dga-loading').remove();
                    },
                    complete: function() {
                        if (debug) console.log('AJAX request completed');
                        
                        // ตรวจสอบอีกครั้งว่าปุ่มถูกรีเซ็ตแล้วหรือไม่
                        setTimeout(function() {
                            if (submitButton.prop('disabled')) {
                                submitButton.prop('disabled', false).val('ตั้งรหัสผ่าน');
                                $('.dga-loading').remove();
                            }
                        }, 500);
                    }
                });
            }
        });
    }
    
    // ตรวจสอบพารามิเตอร์ auto login และล้าง URL
    if (window.location.search.indexOf('user_id') > -1 && window.location.search.indexOf('token') > -1) {
        if (debug) console.log('Auto login parameters detected');
        
        // ล้าง URL หลังจากล็อกอินสำเร็จ
        setTimeout(function() {
            var cleanURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
            if (debug) console.log('Cleaning URL to:', cleanURL);
            
            try {
                window.history.replaceState({}, document.title, cleanURL);
            } catch (e) {
                if (debug) console.log('Error cleaning URL:', e);
            }
        }, 2000);
    }
    
    // ฟังก์ชันตรวจสอบความแข็งแกร่งของรหัสผ่าน
    function checkPasswordStrength(password) {
        var strength = 0;
        
        // ตรวจสอบความยาว
        if (password.length >= 8) {
            strength += 1;
        }
        
        // ตรวจสอบตัวเลข
        if (password.match(/\d+/)) {
            strength += 1;
        }
        
        // ตรวจสอบตัวอักษรพิมพ์เล็ก
        if (password.match(/[a-z]+/)) {
            strength += 1;
        }
        
        // ตรวจสอบตัวอักษรพิมพ์ใหญ่
        if (password.match(/[A-Z]+/)) {
            strength += 1;
        }
        
        // ตรวจสอบอักขระพิเศษ
        if (password.match(/[^a-zA-Z0-9]+/)) {
            strength += 1;
        }
        
        return strength;
    }
});