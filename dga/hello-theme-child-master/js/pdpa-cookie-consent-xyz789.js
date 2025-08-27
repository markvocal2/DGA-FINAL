/**
 * PDPA Cookie Consent JS - Enhanced Compatibility Version
 * แก้ไขปัญหาการขัดแย้งกับ components อื่นๆ
 * Version: 3.0.0
 */

(function($) {
    'use strict';
    
    // ฟังก์ชั่นสำหรับตรวจสอบว่า jQuery ทำงานถูกต้อง
    function checkJQuery() {
        if (typeof jQuery === 'undefined') {
            console.error('PDPA Consent: jQuery is not loaded. This script requires jQuery.');
            return false;
        }
        return true;
    }
    
    // ตรวจสอบความพร้อมของ jQuery
    if (!checkJQuery()) {
        return;
    }
    
    // ฟังก์ชันสำหรับดึงค่า cookie
    function getCookie(name) {
        let value = "; " + document.cookie;
        let parts = value.split("; " + name + "=");
        if (parts.length === 2) return parts.pop().split(";").shift();
        return "";
    }
    
    // ฟังก์ชันตั้งค่า cookie ด้วย JavaScript (fallback)
    function setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = name + "=" + value + ";expires=" + expires.toUTCString() + ";path=/;SameSite=Lax" + (location.protocol === 'https:' ? ';secure' : '');
    }
    
    // ฟังก์ชันป้องกันการ scroll - ปรับปรุงให้ไม่กระทบ components อื่น
    function disableScroll() {
        // เก็บ scroll position
        window.pdpaScrollPosition = window.scrollY;
        
        $('body').addClass('pdpa-scroll-lock-xyz789').css({
            'padding-right': getScrollbarWidth() + 'px'
        });
    }
    
    // ฟังก์ชันเปิดการ scroll
    function enableScroll() {
        $('body').removeClass('pdpa-scroll-lock-xyz789').css({
            'padding-right': ''
        });
        
        // กลับไปยังตำแหน่งเดิม
        if (window.pdpaScrollPosition !== undefined) {
            window.scrollTo(0, window.pdpaScrollPosition);
            delete window.pdpaScrollPosition;
        }
    }
    
    // คำนวณความกว้าง scrollbar
    function getScrollbarWidth() {
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll';
        outer.style.msOverflowStyle = 'scrollbar';
        document.body.appendChild(outer);
        
        const inner = document.createElement('div');
        outer.appendChild(inner);
        
        const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
        outer.parentNode.removeChild(outer);
        
        return scrollbarWidth;
    }
    
    // Force highest z-index for PDPA elements - ปรับปรุงให้ไม่กระทบ components อื่น
    function forceTopLayer() {
        try {
            // ใช้ z-index ที่สูงพอ แต่ไม่สูงเกินไป
            const pdpaZIndex = 999999;
            
            $('.pdpa-overlay-xyz789').css({
                'z-index': pdpaZIndex,
                'position': 'fixed'
            });
            
            $('.pdpa-consent-container-xyz789').css({
                'z-index': pdpaZIndex + 1,
                'position': 'fixed'
            });
            
            $('.pdpa-reopen-button-xyz789').css({
                'z-index': 99999,
                'position': 'fixed'
            });
            
            // สร้าง style element เพื่อจัดการ z-index และ pointer-events
            if ($('#pdpa-force-top-style').length === 0) {
                $('head').append(`
                    <style id="pdpa-force-top-style">
                        /* PDPA z-index management */
                        .pdpa-overlay-xyz789 {
                            z-index: ${pdpaZIndex} !important;
                            position: fixed !important;
                        }
                        
                        .pdpa-consent-container-xyz789 {
                            z-index: ${pdpaZIndex + 1} !important;
                            position: fixed !important;
                        }
                        
                        .pdpa-reopen-button-xyz789 {
                            z-index: 99999 !important;
                            position: fixed !important;
                        }
                        
                        /* Scroll lock without affecting position */
                        body.pdpa-scroll-lock-xyz789 {
                            overflow: hidden !important;
                            position: relative !important;
                        }
                        
                        /* Ensure interactive elements remain clickable */
                        .pdpa-cookie-consent-xyz789,
                        .pdpa-cookie-consent-xyz789 * {
                            pointer-events: auto !important;
                        }
                        
                        /* Exception for language switcher */
                        .dga-translate-api-abc456,
                        .dga-translate-api-abc456 * {
                            pointer-events: auto !important;
                            z-index: ${pdpaZIndex + 10} !important;
                        }
                        
                        /* Exception for WordPress admin bar */
                        #wpadminbar,
                        #wpadminbar * {
                            pointer-events: auto !important;
                        }
                        
                        /* Exception for common popup/modal classes */
                        .modal,
                        .modal *,
                        .popup,
                        .popup *,
                        .fancybox-container,
                        .fancybox-container * {
                            pointer-events: auto !important;
                        }
                        
                        /* When PDPA is active, dim background but keep clickable */
                        body.pdpa-active-xyz789 > *:not(.pdpa-cookie-consent-xyz789):not(.dga-translate-api-abc456):not(#wpadminbar) {
                            pointer-events: none !important;
                        }
                        
                        body.pdpa-active-xyz789 .pdpa-cookie-consent-xyz789,
                        body.pdpa-active-xyz789 .dga-translate-api-abc456 {
                            pointer-events: auto !important;
                        }
                    </style>
                `);
            }
            
            // ย้าย PDPA container ไปท้ายสุดของ body
            const $pdpaContainer = $('#pdpa-cookie-consent-xyz789');
            if ($pdpaContainer.parent().prop('tagName') !== 'BODY') {
                $pdpaContainer.appendTo('body');
            }
            
            console.log('PDPA: Applied compatibility layer with z-index:', pdpaZIndex);
            
        } catch (error) {
            console.error('PDPA: Error forcing top layer', error);
        }
    }
    
    // ตรวจสอบว่ามีการให้ความยินยอมแล้วหรือไม่
    function checkConsentStatus() {
        try {
            console.log('PDPA: Checking consent status');
            const consentGiven = (typeof pdpa_consent_data !== 'undefined' && pdpa_consent_data.consent_given === 'yes') 
                || getCookie('pdpa_consent_given_xyz789') === 'yes';
                
            if (pdpa_consent_data && pdpa_consent_data.debug) {
                console.log('PDPA debug - Consent given:', consentGiven);
                console.log('PDPA debug - Cookie value:', getCookie('pdpa_consent_given_xyz789'));
                console.log('PDPA debug - Data value:', pdpa_consent_data.consent_given);
            }
                
            if (consentGiven) {
                // ซ่อน overlay และ consent container
                $('.pdpa-overlay-xyz789').hide();
                $('.pdpa-consent-container-xyz789').hide();
                $('body').removeClass('pdpa-active-xyz789');
                
                // แสดงปุ่มตั้งค่า
                $('#pdpa-reopen-consent-xyz789').show();
                
                // เปิดการ scroll
                enableScroll();
                
                // โหลดสถานะ toggle จาก cookie
                if (getCookie('pdpa_analytics_cookies_xyz789') === 'accepted') {
                    $('#analytics-cookies-xyz789').prop('checked', true);
                } else {
                    $('#analytics-cookies-xyz789').prop('checked', false);
                }
                
                if (getCookie('pdpa_marketing_cookies_xyz789') === 'accepted') {
                    $('#marketing-cookies-xyz789').prop('checked', true);
                } else {
                    $('#marketing-cookies-xyz789').prop('checked', false);
                }
                
                if (getCookie('pdpa_functional_cookies_xyz789') === 'accepted') {
                    $('#functional-cookies-xyz789').prop('checked', true);
                } else {
                    $('#functional-cookies-xyz789').prop('checked', false);
                }
                
                return true; // มีการให้ความยินยอมแล้ว
            } else {
                // ถ้ายังไม่มีการให้ความยินยอม แสดง overlay และ consent container
                $('.pdpa-overlay-xyz789').show();
                $('.pdpa-consent-container-xyz789').show();
                $('#pdpa-reopen-consent-xyz789').hide();
                $('body').addClass('pdpa-active-xyz789');
                
                // ปิดการ scroll
                disableScroll();
                
                // ซ่อนพาเนลการตั้งค่า
                $('#pdpa-settings-panel-xyz789').hide();
                
                // Force top layer เมื่อแสดง dialog
                forceTopLayer();
                
                return false; // ยังไม่มีการให้ความยินยอม
            }
        } catch (error) {
            console.error('PDPA Consent: Error checking consent status', error);
            return false;
        }
    }
    
    // บันทึกการตั้งค่า cookie ผ่าน AJAX
    function saveCookieConsent(consentType, settings) {
        if (typeof pdpa_consent_data === 'undefined' || !pdpa_consent_data.ajax_url) {
            console.error('PDPA Consent: Missing AJAX configuration');
            // Fallback: ใช้ client-side cookies
            setCookie('pdpa_consent_given_xyz789', 'yes', 30);
            hideConsentDialog();
            return;
        }
        
        try {
            // ตั้งค่า client-side cookie ก่อนเพื่อความรวดเร็ว
            setCookie('pdpa_consent_given_xyz789', 'yes', 30);
            
            // แสดง loading state
            showLoading();
            
            // ส่งข้อมูลไปที่เซิร์ฟเวอร์เพื่อบันทึกอย่างถาวร
            $.ajax({
                url: pdpa_consent_data.ajax_url,
                type: 'POST',
                data: {
                    action: 'pdpa_save_cookie_consent',
                    nonce: pdpa_consent_data.nonce,
                    consent_type: consentType,
                    settings: settings
                },
                success: function(response) {
                    hideLoading();
                    
                    if (response.success) {
                        hideConsentDialog();
                        
                        // แสดงข้อความแจ้งเตือน
                        showNotification(response.data || 'บันทึกการตั้งค่าเรียบร้อยแล้ว');
                    } else {
                        console.error('PDPA Consent: Error saving consent:', response.data);
                        showNotification('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า: ' + response.data, 'error');
                    }
                },
                error: function(xhr, status, error) {
                    hideLoading();
                    console.error('PDPA Consent: AJAX Error:', error);
                    // Fallback: ซ่อน dialog ถ้า cookie ถูกตั้งแล้ว
                    if (getCookie('pdpa_consent_given_xyz789') === 'yes') {
                        hideConsentDialog();
                        showNotification('บันทึกการตั้งค่าเรียบร้อยแล้ว (offline mode)');
                    } else {
                        showNotification('เกิดข้อผิดพลาดในการติดต่อเซิร์ฟเวอร์', 'error');
                    }
                }
            });
        } catch (error) {
            hideLoading();
            console.error('PDPA Consent: Error in saveCookieConsent', error);
            // Fallback
            if (getCookie('pdpa_consent_given_xyz789') === 'yes') {
                hideConsentDialog();
            }
        }
    }
    
    // ซ่อน consent dialog
    function hideConsentDialog() {
        $('.pdpa-consent-container-xyz789').fadeOut(300, function() {
            $('.pdpa-overlay-xyz789').fadeOut(200);
            $('body').removeClass('pdpa-active-xyz789');
            enableScroll();
            $('#pdpa-reopen-consent-xyz789').fadeIn(300);
        });
    }
    
    // แสดง loading state
    function showLoading() {
        $('.pdpa-button-xyz789').prop('disabled', true);
        $('.pdpa-button-xyz789').css('opacity', '0.6');
    }
    
    // ซ่อน loading state
    function hideLoading() {
        $('.pdpa-button-xyz789').prop('disabled', false);
        $('.pdpa-button-xyz789').css('opacity', '1');
    }
    
    // แสดงการแจ้งเตือน
    function showNotification(message, type = 'success') {
        const bgColor = type === 'success' ? '#4caf50' : '#f44336';
        
        // ลบ notification เก่า
        $('.pdpa-notification-xyz789').remove();
        
        const notification = $('<div>', {
            class: 'pdpa-notification-xyz789',
            text: message
        }).css({
            'position': 'fixed',
            'bottom': '20px',
            'left': '50%',
            'transform': 'translateX(-50%)',
            'background-color': bgColor,
            'color': 'white',
            'padding': '15px 20px',
            'border-radius': '8px',
            'box-shadow': '0 4px 15px rgba(0,0,0,0.2)',
            'z-index': '1000000',
            'max-width': '90%',
            'font-size': '14px',
            'line-height': '1.5',
            'text-align': 'center',
            'pointer-events': 'none',
            'opacity': '0',
            'transition': 'opacity 0.3s ease'
        });
        
        $('body').append(notification);
        
        // แสดงการแจ้งเตือนด้วยการเคลื่อนไหว
        setTimeout(function() {
            notification.css('opacity', '1');
        }, 10);
        
        // ลบการแจ้งเตือนหลังจาก 3 วินาที
        setTimeout(function() {
            notification.css('opacity', '0');
            setTimeout(function() {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // ตรวจสอบความพร้อมของ DOM
    $(document).ready(function() {
        try {
            console.log('PDPA Consent: DOM ready');
            
            // ตรวจสอบว่า PDPA container มีอยู่หรือไม่
            if ($('#pdpa-cookie-consent-xyz789').length === 0) {
                console.log('PDPA Consent: Container not found. Shortcode may not be included.');
                return;
            }
            
            // Force top layer ทันที
            forceTopLayer();
            
            // ตรวจสอบสถานะความยินยอมเมื่อโหลดหน้า
            const hasConsent = checkConsentStatus();
            
            // ป้องกันการปิด dialog ด้วย ESC key ถ้ายังไม่มี consent
            $(document).on('keydown', function(e) {
                if (e.key === 'Escape' && !getCookie('pdpa_consent_given_xyz789')) {
                    e.preventDefault();
                    // แสดงการสั่น
                    $('.pdpa-consent-container-xyz789').addClass('pdpa-shake-xyz789');
                    setTimeout(function() {
                        $('.pdpa-consent-container-xyz789').removeClass('pdpa-shake-xyz789');
                    }, 500);
                }
            });
            
            // การทำงานของปุ่มตั้งค่า - เปิด/ปิด พาเนลการตั้งค่า
            $('#pdpa-settings-button-xyz789').off('click').on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $('#pdpa-settings-panel-xyz789').slideToggle(300);
            });
            
            // การทำงานของปุ่มยอมรับทั้งหมด
            $('#pdpa-accept-all-xyz789').off('click').on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                // ตั้งค่าให้ทุก toggle เป็น checked
                $('#analytics-cookies-xyz789, #marketing-cookies-xyz789, #functional-cookies-xyz789').prop('checked', true);
                saveCookieConsent('accept_all');
            });
            
            // การทำงานของปุ่มปฏิเสธทั้งหมด
            $('#pdpa-reject-all-xyz789').off('click').on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                // ตั้งค่าให้ทุก toggle เป็น unchecked ยกเว้น necessary
                $('#analytics-cookies-xyz789, #marketing-cookies-xyz789, #functional-cookies-xyz789').prop('checked', false);
                saveCookieConsent('reject_all');
            });
            
            // การทำงานของปุ่มบันทึกการตั้งค่า
            $('#pdpa-save-settings-xyz789').off('click').on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const settings = {
                    analytics: $('#analytics-cookies-xyz789').is(':checked').toString(),
                    marketing: $('#marketing-cookies-xyz789').is(':checked').toString(),
                    functional: $('#functional-cookies-xyz789').is(':checked').toString()
                };
                
                saveCookieConsent('custom_settings', settings);
                
                // ซ่อนพาเนลการตั้งค่าหลังจากบันทึก
                $('#pdpa-settings-panel-xyz789').slideUp(300);
            });
            
            // การทำงานของปุ่มเปิด dialog ใหม่
            $('#pdpa-reopen-consent-xyz789').off('click').on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).hide();
                $('.pdpa-overlay-xyz789').fadeIn(200);
                $('.pdpa-consent-container-xyz789').fadeIn(300);
                $('body').addClass('pdpa-active-xyz789');
                // ปิดการ scroll
                disableScroll();
                // ซ่อนพาเนลการตั้งค่าเมื่อเปิด dialog ใหม่
                $('#pdpa-settings-panel-xyz789').hide();
                // Force top layer
                forceTopLayer();
            });
            
            // ป้องกันการคลิก overlay เพื่อปิด dialog
            $('.pdpa-overlay-xyz789').on('click', function(e) {
                if (!getCookie('pdpa_consent_given_xyz789')) {
                    e.preventDefault();
                    e.stopPropagation();
                    // แสดงการสั่นเพื่อบอกว่าต้องเลือกตัวเลือก
                    $('.pdpa-consent-container-xyz789').addClass('pdpa-shake-xyz789');
                    setTimeout(function() {
                        $('.pdpa-consent-container-xyz789').removeClass('pdpa-shake-xyz789');
                    }, 500);
                }
            });
            
            // ป้องกัน click propagation จาก consent container
            $('.pdpa-consent-container-xyz789').on('click', function(e) {
                e.stopPropagation();
            });
            
            console.log('PDPA Consent: Event handlers initialized');
            
        } catch (error) {
            console.error('PDPA Consent: Error in document.ready', error);
        }
    });
    
    // จัดการ window resize
    $(window).on('resize', function() {
        if ($('.pdpa-consent-container-xyz789').is(':visible')) {
            // Update padding for scrollbar width
            if ($('body').hasClass('pdpa-scroll-lock-xyz789')) {
                $('body').css('padding-right', getScrollbarWidth() + 'px');
            }
        }
    });
    
})(jQuery);

/**
 * ฟังก์ชันสำหรับตรวจสอบการยินยอม cookie
 * สามารถเรียกใช้จากที่อื่นในธีมได้
 */
function pdpaIsConsentGiven(cookieType) {
    if (cookieType === 'necessary') {
        return true; // คุกกี้ที่จำเป็นได้รับการยอมรับเสมอ
    }
    
    const cookieName = 'pdpa_' + cookieType + '_cookies_xyz789';
    
    // ฟังก์ชันสำหรับดึงค่า cookie
    function getCookie(name) {
        let value = "; " + document.cookie;
        let parts = value.split("; " + name + "=");
        if (parts.length === 2) return parts.pop().split(";").shift();
        return "";
    }
    
    if (getCookie('pdpa_consent_given_xyz789') !== 'yes') {
        return false;
    }
    
    return getCookie(cookieName) === 'accepted';
}