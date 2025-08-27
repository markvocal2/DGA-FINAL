/**
 * DGA Timeout Settings JavaScript
 * ไฟล์: /js/dga-timeout.js
 */

jQuery(document).ready(function($) {
    'use strict';
    
    // จัดการการ submit form
    $('#dga-timeout-form').on('submit', function(e) {
        e.preventDefault();
        
        const $form = $(this);
        const $submitButton = $form.find('button[type="submit"]');
        const $message = $('#dga-timeout-message');
        
        // แสดงสถานะกำลังบันทึก
        $submitButton.prop('disabled', true).text('Saving...');
        $message.hide();
        
        // เตรียมข้อมูลสำหรับส่ง
        const formData = {
            action: 'dga_save_timeout_settings',
            nonce: $('#dga_timeout_nonce_field').val(),
            timeout_minutes: $('#dga_timeout_minutes').val(),
            timeout_enabled: $('#dga_timeout_enabled').is(':checked') ? 1 : 0,
            timeout_warning: $('#dga_timeout_warning').val()
        };
        
        // ส่งข้อมูลด้วย AJAX
        $.ajax({
            url: dga_timeout_ajax.ajax_url,
            type: 'POST',
            data: formData,
            success: function(response) {
                if (response.success) {
                    $message
                        .removeClass('notice-error')
                        .addClass('notice-success')
                        .html('<p>' + response.data + '</p>')
                        .fadeIn();
                    
                    // ซ่อนข้อความหลังจาก 3 วินาที
                    setTimeout(function() {
                        $message.fadeOut();
                    }, 3000);
                } else {
                    $message
                        .removeClass('notice-success')
                        .addClass('notice-error')
                        .html('<p>Error: ' + response.data + '</p>')
                        .fadeIn();
                }
            },
            error: function(xhr, status, error) {
                $message
                    .removeClass('notice-success')
                    .addClass('notice-error')
                    .html('<p>Error: ' + error + '</p>')
                    .fadeIn();
            },
            complete: function() {
                $submitButton.prop('disabled', false).text('Save Settings');
            }
        });
    });
    
    // ตรวจสอบความสัมพันธ์ของค่า warning กับ timeout
    $('#dga_timeout_minutes, #dga_timeout_warning').on('change', function() {
        const timeoutMinutes = parseInt($('#dga_timeout_minutes').val());
        const warningMinutes = parseInt($('#dga_timeout_warning').val());
        
        if (warningMinutes >= timeoutMinutes) {
            alert('Warning time must be less than timeout duration');
            $('#dga_timeout_warning').val(Math.min(warningMinutes, timeoutMinutes - 1));
        }
    });
    
    // แสดง/ซ่อน warning field ตามสถานะ enabled
    $('#dga_timeout_enabled').on('change', function() {
        if ($(this).is(':checked')) {
            $('.form-table tr:nth-child(3)').show();
        } else {
            $('.form-table tr:nth-child(3)').hide();
        }
    }).trigger('change');
});