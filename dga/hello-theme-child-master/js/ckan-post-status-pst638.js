/**
 * CKAN Post Status Toggle - Consent Style
 * Version: 2.1.0
 */
(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Toggle switch click handler
        $('.ckan-status-toggle-pst638').on('click', function() {
            var $toggle = $(this);
            var container = $toggle.closest('.ckan-status-toggle-container-pst638');
            var postId = container.data('post-id');
            var confirmNeeded = container.data('confirm') === 'yes';
            
            // Get current state
            var isPublic = $toggle.hasClass('is-public');
            var newPublicState = !isPublic;
            
            console.log('Current state:', isPublic ? 'public' : 'private', 'New state:', newPublicState ? 'public' : 'private');
            
            // Prevent double clicks
            if (container.hasClass('is-loading')) {
                return false;
            }
            
            // Confirm if needed
            if (confirmNeeded) {
                var confirmMsg = newPublicState ? 
                    'ต้องการเผยแพร่โพสต์นี้หรือไม่?' : 
                    'ต้องการซ่อนโพสต์นี้หรือไม่?';
                
                if (!confirm(confirmMsg)) {
                    return false;
                }
            }
            
            // Show loading state
            container.addClass('is-loading');
            
            // Send AJAX request
            $.ajax({
                url: ckanStatusConfig.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'ckan_post_status_pst638',
                    nonce: ckanStatusConfig.nonce,
                    post_id: postId,
                    make_public: newPublicState ? 'true' : 'false'
                },
                success: function(response) {
                    console.log('Response:', response);
                    
                    if (response.success) {
                        // Update UI
                        if (newPublicState) {
                            // Switch to public state
                            $toggle.removeClass('is-private').addClass('is-public');
                            container.find('.status-text-pst638').text('สถานะ: เผยแพร่อยู่');
                            container.find('.ckan-status-display-pst638').removeClass('is-private').addClass('is-public');
                        } else {
                            // Switch to private state
                            $toggle.removeClass('is-public').addClass('is-private');
                            container.find('.status-text-pst638').text('สถานะ: ซ่อนอยู่');
                            container.find('.ckan-status-display-pst638').removeClass('is-public').addClass('is-private');
                        }
                        
                        // Show success notification
                        showNotification(container, 'success', response.data.message);
                        
                        // If changed to private/pending, reload after delay
                        if (!newPublicState) {
                            setTimeout(function() {
                                window.location.reload();
                            }, 2000);
                        }
                        
                    } else {
                        // Show error
                        showNotification(container, 'error', response.data.message || 'เกิดข้อผิดพลาด');
                        console.error('Error:', response.data);
                    }
                },
                error: function(xhr, status, error) {
                    showNotification(container, 'error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
                    console.error('AJAX Error:', error);
                },
                complete: function() {
                    setTimeout(function() {
                        container.removeClass('is-loading');
                    }, 500);
                }
            });
            
            return false;
        });
        
        // Function to show notifications
        function showNotification(container, type, message) {
            // Remove existing notifications
            container.find('.ckan-notification-pst638').remove();
            
            var notification = $('<div class="ckan-notification-pst638 ' + type + '">' + message + '</div>');
            container.append(notification);
            
            // Auto remove after 3 seconds
            setTimeout(function() {
                notification.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 3000);
        }
    });
})(jQuery);