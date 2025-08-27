/**
 * CKAN API JavaScript
 */
jQuery(document).ready(function($) {
    
    // API modal is handled in ckan-data-preview.js
    // This file is for additional API-related functionality if needed
    
    // Copy to clipboard functionality for API endpoints
    $(document).on('click', '.ckan-api-code code', function() {
        const $code = $(this);
        const text = $code.text();
        
        // Create temporary textarea
        const $temp = $('<textarea>');
        $('body').append($temp);
        $temp.val(text).select();
        
        try {
            document.execCommand('copy');
            
            // Show feedback
            const originalText = $code.text();
            $code.text('คัดลอกแล้ว!');
            setTimeout(function() {
                $code.text(originalText);
            }, 1000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
        
        $temp.remove();
    });
    
    // Test API endpoint
    $(document).on('click', '#ckan-api-file-data-link', function(e) {
        e.preventDefault();
        
        const url = $(this).attr('href');
        if (!url || url === '#') {
            alert('กรุณาเลือกไฟล์ก่อน');
            return;
        }
        
        // Open in new tab
        window.open(url, '_blank');
    });
    
});