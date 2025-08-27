/**
 * DGA Custom Admin Login AJAX Functionality
 */
(function($) {
    'use strict';

    // เมื่อ DOM พร้อม
    $(document).ready(function() {
        const $loginForm = $('#loginform');
        const $responseDiv = $('.dga-login-response');
        const $submitButton = $('#wp-submit');
        const originalButtonText = $submitButton.val();

        // แสดงโลโก้ของเว็บไซต์
        setWebsiteLogo();

        // ปรับปรุง UI
        enhanceLoginUI();

        // จัดการ Submit Form
        $loginForm.on('submit', function(e) {
            e.preventDefault();

            // เคลียร์ข้อความตอบกลับเก่า
            $responseDiv.hide().removeClass('error success');

            // ตรวจสอบข้อมูลที่กรอก
            const username = $('#user_login').val();
            const password = $('#user_pass').val();
            const remember = $('#rememberme').is(':checked');

            if (!username || !password) {
                showResponse('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', 'error');
                return;
            }

            // เริ่มกระบวนการ Login ด้วย AJAX
            showLoading(true);

            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: dga_login_params.ajax_url,
                data: {
                    action: 'dga_ajax_login',
                    username: username,
                    password: password,
                    remember: remember,
                    security: dga_login_params.login_nonce
                },
                success: function(response) {
                    if (response.success) {
                        showResponse(response.data.message, 'success');
                        // เปลี่ยนเส้นทางไปยังหน้า Dashboard
                        setTimeout(function() {
                            window.location.href = response.data.redirect;
                        }, 1000);
                    } else {
                        showResponse(response.data.message, 'error');
                        showLoading(false);
                    }
                },
                error: function(xhr, status, error) {
                    showResponse('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง', 'error');
                    showLoading(false);
                }
            });
        });

        // ฟังก์ชันเพิ่มเติมเพื่อปรับปรุง UI
        function enhanceLoginUI() {
            // เพิ่ม placeholder ให้กับ input
            $('#user_login').attr('placeholder', 'ชื่อผู้ใช้หรืออีเมล');
            $('#user_pass').attr('placeholder', 'รหัสผ่าน');

            // เพิ่มไอคอนให้กับฟอร์ม (ใช้ Font Awesome หรือ SVG inline แทน)
            $('#user_login').before('<div class="input-icon username-icon"></div>');
            $('#user_pass').before('<div class="input-icon password-icon"></div>');

            // เพิ่ม animation ให้กับการเปลี่ยนหน้า
            $('body').addClass('fade-in');
        }

        // ฟังก์ชันแสดงโลโก้ของเว็บไซต์
        function setWebsiteLogo() {
            // ใช้ AJAX เพื่อดึงโลโก้จากเว็บไซต์
            $.ajax({
                url: dga_login_params.ajax_url,
                type: 'POST',
                data: {
                    action: 'get_site_logo'
                },
                success: function(response) {
                    // ถ้ามีโลโก้ ให้แสดงโลโก้ของเว็บไซต์
                    if (response.success && response.data.logo_url) {
                        $('.login h1 a').css('background-image', 'url(' + response.data.logo_url + ')');
                    }
                }
            });
        }

        // ฟังก์ชันแสดงข้อความตอบกลับ
        function showResponse(message, type) {
            $responseDiv.html(message).addClass(type).fadeIn();
        }

        // ฟังก์ชันแสดง/ซ่อนการโหลด
        function showLoading(isLoading) {
            if (isLoading) {
                $submitButton.addClass('dga-loading').val(dga_login_params.loading_text);
            } else {
                $submitButton.removeClass('dga-loading').val(originalButtonText);
            }
        }
    });

})(jQuery);