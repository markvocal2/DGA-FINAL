jQuery(document).ready(function($) {
    // Handle edit button click
    $(document).on('click', '.wptax-edit-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const container = $(this).closest('.wptax-term-display');
        const editForm = container.find('.wptax-edit-form');
        const section = container.closest('.wptax-taxonomy-section');
        
        // Close other open forms
        $('.wptax-edit-form').not(editForm).fadeOut(200);
        $('.wptax-taxonomy-section').not(section).css('z-index', 'auto');
        
        if (editForm.is(':visible')) {
            editForm.fadeOut(200);
            section.css('z-index', 'auto');
        } else {
            // Set higher z-index for active section
            section.css('z-index', '1001');
            editForm.fadeIn(200);
            
            // Position adjustment for edge cases
            const formWidth = editForm.outerWidth();
            const windowWidth = $(window).width();
            const formOffset = editForm.offset();
            
            if (formOffset.left + formWidth > windowWidth - 20) {
                editForm.css('left', 'auto').css('right', '0');
            }
            
            // Mobile handling
            if (windowWidth <= 480) {
                if ($('.wptax-overlay').length === 0) {
                    $('body').append('<div class="wptax-overlay"></div>');
                }
                $('.wptax-overlay').fadeIn(200);
            }
        }
    });
    
    // Handle cancel button click
    $(document).on('click', '.wptax-cancel-btn', function(e) {
        e.preventDefault();
        const container = $(this).closest('.wptax-term-display');
        const section = container.closest('.wptax-taxonomy-section');
        
        container.find('.wptax-edit-form').fadeOut(200, function() {
            section.css('z-index', 'auto');
        });
        
        // Remove overlay
        $('.wptax-overlay').fadeOut(200, function() {
            $(this).remove();
        });
    });
    
    // Close when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.wptax-taxonomy-section').length) {
            $('.wptax-edit-form').fadeOut(200);
            $('.wptax-taxonomy-section').css('z-index', 'auto');
            $('.wptax-overlay').fadeOut(200, function() {
                $(this).remove();
            });
        }
    });
    
    // Handle save button click
    $(document).on('click', '.wptax-save-btn', function(e) {
        e.preventDefault();
        const container = $(this).closest('.wptax-term-display');
        const section = container.closest('.wptax-taxonomy-section');
        const postId = container.data('post-id');
        const taxonomy = container.data('taxonomy');
        
        // Get selected term IDs
        let termIds = [];
        container.find('.wptax-term-checkbox:checked').each(function() {
            termIds.push($(this).val());
        });
        
        // Show loading state
        section.addClass('wptax-loading');
        
        $.ajax({
            url: wptaxAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'wptax_update_taxonomy',
                nonce: wptaxAjax.nonce,
                post_id: postId,
                term_ids: termIds,
                taxonomy: taxonomy
            },
            success: function(response) {
                if (response.success) {
                    // Update the display
                    if (response.data.terms.length === 0) {
                        // No terms selected
                        if (container.find('.wptax-no-term').length === 0) {
                            // Remove terms container and add no-term message
                            container.find('.wptax-terms-container').remove();
                            container.prepend('<span class="wptax-no-term">ไม่มีหมวดหมู่กำหนด</span>');
                        } else {
                            container.find('.wptax-no-term').show();
                            container.find('.wptax-terms-container').hide();
                        }
                    } else {
                        // Terms selected
                        const termLinks = response.data.terms.map(function(term) {
                            return '<a href="' + term.link + '" class="wptax-term-link">' + term.name + '</a>';
                        });
                        
                        // Remove no-term message if exists
                        container.find('.wptax-no-term').remove();
                        
                        if (container.find('.wptax-terms-container').length === 0) {
                            container.prepend('<div class="wptax-terms-container">' + termLinks.join('') + '</div>');
                        } else {
                            container.find('.wptax-terms-container').html(termLinks.join('')).show();
                        }
                    }
                    
                    // Hide form
                    container.find('.wptax-edit-form').fadeOut(200, function() {
                        section.css('z-index', 'auto');
                    });
                    
                    // Remove overlay
                    $('.wptax-overlay').fadeOut(200, function() {
                        $(this).remove();
                    });
                    
                    // Show success message
                    showMessage('บันทึกเรียบร้อย', 'success');
                } else if (response.data) {
                    showMessage('เกิดข้อผิดพลาด: ' + response.data, 'error');
                }
            },
            error: function(xhr, status, error) {
                showMessage('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
            },
            complete: function() {
                section.removeClass('wptax-loading');
            }
        });
    });
    
    // Helper function to show messages
    function showMessage(text, type) {
        const message = $('<div class="wptax-message wptax-' + type + '">' + text + '</div>');
        $('body').append(message);
        
        setTimeout(function() {
            message.addClass('show');
        }, 10);
        
        setTimeout(function() {
            message.removeClass('show');
            setTimeout(function() {
                message.remove();
            }, 300);
        }, 2500);
    }
    
    // Handle checkbox clicks on labels
    $(document).on('click', '.wptax-checkbox-item', function(e) {
        if (!$(e.target).is('input')) {
            const checkbox = $(this).find('input[type="checkbox"]');
            checkbox.prop('checked', !checkbox.prop('checked'));
        }
    });
    
    // Prevent form from closing when clicking inside
    $(document).on('click', '.wptax-edit-form', function(e) {
        e.stopPropagation();
    });
});