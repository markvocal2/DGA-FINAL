/**
 * Template Selector JavaScript
 * Handles UI interactions for the template selector modal
 */
(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Cache DOM elements
        const templateToggle = $('#dga-template-toggle');
        const templateModal = $('#dga-template-modal');
        const closeBtn = $('.dga-template-close');
        const messageContainer = $('#dga-template-message');
        
        // Open modal when toggle button is clicked
        templateToggle.on('click', function(e) {
            e.preventDefault();
            templateModal.addClass('dga-modal-open');
            $('body').addClass('dga-modal-active');
        });
        
        // Close modal when close button is clicked
        closeBtn.on('click', function() {
            closeModal();
        });
        
        // Close modal when clicking outside the modal content
        $(document).on('click', function(e) {
            if ($(e.target).is(templateModal)) {
                closeModal();
            }
        });
        
        // Close with ESC key
        $(document).on('keydown', function(e) {
            if (e.keyCode === 27 && templateModal.hasClass('dga-modal-open')) {
                closeModal();
            }
        });
        
        // Apply template button click handler
        $(document).on('click', '.dga-template-apply-btn', function() {
            const templateId = $(this).data('template-id');
            const confirmApply = confirm('คุณแน่ใจหรือไม่ว่าต้องการใช้เทมเพลตนี้? การดำเนินการนี้จะแทนที่เนื้อหาปัจจุบันและไม่สามารถย้อนกลับได้');
            
            if (confirmApply) {
                applyTemplate(templateId);
            }
        });
        
        // Apply template function with improved error handling
        function applyTemplate(templateId) {
            messageContainer.html('<div class="dga-loading">กำลังนำเทมเพลตมาใช้... โปรดรอสักครู่</div>');
            
            $.ajax({
                url: dga_template_vars.ajax_url,
                type: 'POST',
                data: {
                    action: 'dga_clone_template',
                    template_id: templateId,
                    current_page_id: dga_template_vars.current_page_id,
                    nonce: dga_template_vars.nonce
                },
                success: function(response) {
                    if (response.success) {
                        messageContainer.html('<div class="dga-success">' + dga_template_vars.success_message + '</div>');
                        
                        // แสดงข้อความว่ากำลังรีโหลด
                        setTimeout(function() {
                            messageContainer.html('<div class="dga-loading">กำลังรีโหลดหน้าเว็บ...</div>');
                        }, 1000);
                        
                        // รีโหลดหน้าเพื่อแสดงเทมเพลตใหม่
                        setTimeout(function() {
                            window.location.reload();
                        }, 1500);
                    } else {
                        let errorMsg = dga_template_vars.error_message;
                        if (response.data && response.data.message) {
                            errorMsg = response.data.message;
                        }
                        messageContainer.html('<div class="dga-error">' + errorMsg + '</div>');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('AJAX Error:', status, error);
                    messageContainer.html('<div class="dga-error">' + dga_template_vars.error_message + ' (' + status + ')</div>');
                }
            });
        }
        
        // Close modal function
        function closeModal() {
            templateModal.removeClass('dga-modal-open');
            $('body').removeClass('dga-modal-active');
            messageContainer.html('');
        }
        
        // Preview hover effect - using event delegation
        $(document).on('mouseenter', '.dga-template-item', function() {
            $(this).addClass('dga-template-hover');
        }).on('mouseleave', '.dga-template-item', function() {
            $(this).removeClass('dga-template-hover');
        });
    });
    
})(jQuery);