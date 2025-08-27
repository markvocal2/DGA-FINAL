jQuery(document).ready(function($) {
    // ตรวจสอบว่ามีฟอร์มล็อกอินในหน้านี้หรือไม่
    if ($('#blue-orange-login-form').length === 0) {
        return; // ถ้าไม่มีฟอร์ม ออกจากสคริปต์โดยไม่ทำงาน
    }
    
    let currentUsername = '';
    
    // Initialize form
    initializeForm();
    
    function initializeForm() {
        // ตั้งค่าขั้นตอนเริ่มต้น
        goToStep(1);
        
        // ถ้ามีการจดจำชื่อผู้ใช้ในครั้งก่อนหน้า
        if (localStorage.getItem('remember_username')) {
            $('#username').val(localStorage.getItem('remember_username'));
        }
        
        // เพิ่ม animation effect เมื่อกรอกข้อมูล
        checkInputsForValue();
    }
    
    // ตรวจสอบว่า input มีการกรอกข้อมูลหรือไม่
    function checkInputsForValue() {
        $('input[type="text"], input[type="password"]').each(function() {
            if ($(this).val().trim() !== '') {
                $(this).addClass('has-value');
            } else {
                $(this).removeClass('has-value');
            }
        });
    }
    
    // Handle Enter key press
    $('#username').on('keypress', function(e) {
        if (e.which === 13) {
            e.preventDefault();
            $('.next-step-button').click();
        }
    });

    $('#password').on('keypress', function(e) {
        if (e.which === 13) {
            e.preventDefault();
            $('.login-button').click();
        }
    });

    // เมื่อมีการพิมพ์ข้อมูล
    $('input[type="text"], input[type="password"]').on('input', function() {
        checkInputsForValue();
    });

    // Step navigation - ไปยังขั้นตอนถัดไป
    $('.next-step-button').on('click', function() {
        const username = $('#username').val().trim();
        if (!username) {
            showError('กรุณากรอกชื่อผู้ใช้หรืออีเมล');
            return;
        }

        // เพิ่ม animation แสดงการโหลด
        $(this).addClass('loading');
        
        // Check if username exists via AJAX
        $.ajax({
            url: blueOrangeLoginAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'check_username',
                security: blueOrangeLoginAjax.security,
                username: username
            },
            success: function(response) {
                $('.next-step-button').removeClass('loading');
                
                if (response.success) {
                    currentUsername = username;
                    goToStep(2);
                    $('.username-display').text(username);
                } else {
                    showError('ไม่พบบัญชีผู้ใช้นี้ในระบบ');
                }
            },
            error: function() {
                $('.next-step-button').removeClass('loading');
                showError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            }
        });
    });

    // Change user button - กลับไปยังขั้นตอนแรก
    $('.change-user').on('click', function() {
        goToStep(1);
    });

    // ฟังก์ชันควบคุมการแสดงขั้นตอน
    function goToStep(step) {
        // ซ่อนทุกขั้นตอนก่อน
        $('.step-content').hide();
        
        // แสดงขั้นตอนที่ต้องการ
        $(`.step-content[data-step="${step}"]`).fadeIn(300);

        // ล้างข้อความแจ้งเตือนเก่า
        $('.login-message').removeClass('error success').hide();
    }

    // Toggle password visibility
    $('.toggle-password').on('click', function() {
        const passwordInput = $('#password');
        
        if (passwordInput.attr('type') === 'password') {
            passwordInput.attr('type', 'text');
            $(this).text('ซ่อน');
        } else {
            passwordInput.attr('type', 'password');
            $(this).text('แสดง');
        }
    });

    // Handle form submission
    $('#blue-orange-login-form').on('submit', function(e) {
        e.preventDefault();
        
        const form = $(this);
        const submitButton = form.find('.login-button');
        const loader = submitButton.find('.loader');
        
        // Disable form and show loader
        submitButton.prop('disabled', true).addClass('loading');

        // Collect form data
        const formData = {
            action: 'blue_orange_login',
            security: blueOrangeLoginAjax.security,
            username: currentUsername,
            password: form.find('#password').val(),
            remember: form.find('#remember').is(':checked')
        };

        // Send AJAX request
        $.ajax({
            url: blueOrangeLoginAjax.ajaxurl,
            type: 'POST',
            data: formData,
            success: function(response) {
                if (response.success) {
                    showSuccess(response.data.message);
                    
                    // Redirect after success message
                    setTimeout(function() {
                        window.location.href = response.data.redirect_url;
                    }, 1500);
                } else {
                    showError(response.data.message);
                    resetSubmitButton();
                }
            },
            error: function() {
                showError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
                resetSubmitButton();
            }
        });
    });

    // แสดงข้อความแจ้งเตือนข้อผิดพลาด
    function showError(message) {
        $('.login-message')
            .removeClass('success')
            .addClass('error')
            .html(message)
            .fadeIn();
    }

    // แสดงข้อความแจ้งเตือนสำเร็จ
    function showSuccess(message) {
        $('.login-message')
            .removeClass('error')
            .addClass('success')
            .html(message)
            .fadeIn();
    }

    // รีเซ็ตปุ่มส่งฟอร์ม
    function resetSubmitButton() {
        $('.login-button').prop('disabled', false).removeClass('loading');
    }

    // จัดการการจดจำชื่อผู้ใช้
    $('#blue-orange-login-form').on('submit', function() {
        if ($('#remember').is(':checked')) {
            localStorage.setItem('remember_username', currentUsername);
        } else {
            localStorage.removeItem('remember_username');
        }
    });
});