/**
 * CKAN Preview Handler - เพิ่มการรองรับไฟล์ภาษาไทย
 * ไฟล์นี้ทำงานร่วมกับ ckan-data-preview.js ที่มีอยู่แล้ว
 */
jQuery(document).ready(function($) {
    
    // Override preview button click เพื่อส่ง attachment ID
    $(document).on('click', '.ckan-preview-btn', function(e) {
        e.preventDefault();
        
        var $btn = $(this);
        var encodedUrl = $btn.data('url');
        var attachmentId = $btn.data('attachment-id');
        var index = $btn.data('index');
        
        // ถ้ามี attachment ID ให้ใช้เป็นหลัก
        if (attachmentId) {
            // เก็บ attachment ID ไว้ใน data attribute ของ modal
            $('#ckan-preview-modal').data('attachment-id', attachmentId);
            $('#ckan-preview-modal').data('file-url', atob(encodedUrl));
            $('#ckan-preview-modal').data('file-index', index);
            
            // Trigger event ให้ ckan-data-preview.js จัดการ
            $(document).trigger('ckan-preview-file', {
                attachmentId: attachmentId,
                fileUrl: atob(encodedUrl),
                index: index
            });
        } else {
            // ถ้าไม่มี attachment ID ใช้ URL ตามปกติ
            $('#ckan-preview-modal').data('file-url', atob(encodedUrl));
            $('#ckan-preview-modal').data('file-index', index);
            
            // Trigger event
            $(document).trigger('ckan-preview-file', {
                fileUrl: atob(encodedUrl),
                index: index
            });
        }
    });
    
    // เพิ่ม event listener สำหรับ AJAX preview request
    $(document).ajaxSend(function(event, jqxhr, settings) {
        // ตรวจสอบว่าเป็น request สำหรับ preview หรือไม่
        if (settings.data && settings.data.indexOf('action=ckan_get_file_preview') !== -1) {
            var attachmentId = $('#ckan-preview-modal').data('attachment-id');
            
            // ถ้ามี attachment ID ให้เพิ่มเข้าไปใน request
            if (attachmentId && settings.type === 'POST') {
                settings.data += '&attachment_id=' + attachmentId;
            }
        }
    });
    
    // Helper function สำหรับแสดง error
    window.showPreviewError = function(message) {
        $('.ckan-preview-loading').hide();
        $('.ckan-preview-data').html(
            '<div class="ckan-preview-error">' +
            '<i class="fa fa-exclamation-triangle"></i> ' +
            message +
            '</div>'
        ).show();
    };
    
    // Helper function สำหรับตรวจสอบไฟล์ภาษาไทย
    window.isThaiFilename = function(filename) {
        return /[\u0E00-\u0E7F]/.test(filename);
    };
    
});