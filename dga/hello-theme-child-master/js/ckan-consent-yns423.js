/**
 * CKAN Consent Toggle - JavaScript
 */
(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Toggle switch click handler
        $('.ckan-consent-toggle-yns423').on('click', function() {
            var $toggle = $(this);
            var container = $toggle.closest('.ckan-consent-toggle-container-yns423');
            var postId = container.data('post-id');
            
            // Get current state from class
            var hasConsent = $toggle.hasClass('is-consent');
            // Toggle to opposite state
            var newConsentState = !hasConsent;
            
            console.log('Current consent:', hasConsent, 'New consent:', newConsentState);
            
            // Prevent double clicks
            if (container.hasClass('is-loading')) {
                return false;
            }
            
            // Show loading state
            container.addClass('is-loading');
            
            // Send AJAX request to update consent status
            $.ajax({
                url: ckanConsentData.ajax_url,
                type: 'POST',
                data: {
                    action: 'ckan_consent_update_yns423',
                    nonce: ckanConsentData.nonce,
                    post_id: postId,
                    give_consent: newConsentState ? 'true' : 'false'
                },
                success: function(response) {
                    console.log('Response:', response);
                    
                    if (response.success) {
                        // Update UI based on new state
                        if (newConsentState) {
                            // Switch to consent state
                            $toggle.removeClass('is-no-consent').addClass('is-consent');
                            container.find('.status-text-yns423').text('สถานะ: ยินยอม');
                            $toggle.attr('data-current-consent', 'true');
                        } else {
                            // Switch to no-consent state
                            $toggle.removeClass('is-consent').addClass('is-no-consent');
                            container.find('.status-text-yns423').text('สถานะ: ไม่ยินยอม');
                            $toggle.attr('data-current-consent', 'false');
                        }
                        
                        // Update status icon color
                        if (newConsentState) {
                            container.find('.ckan-consent-status-yns423').removeClass('is-no-consent').addClass('is-consent');
                        } else {
                            container.find('.ckan-consent-status-yns423').removeClass('is-consent').addClass('is-no-consent');
                        }
                        
                        // Show success notification
                        showNotification(container, 'success', response.data.message);
                        
                        // If changing to no-consent (pending), reload after delay
                        if (!newConsentState) {
                            setTimeout(function() {
                                window.location.reload();
                            }, 2000);
                        }
                        
                    } else {
                        // Show error and revert UI
                        showNotification(container, 'error', response.data.message || 'เกิดข้อผิดพลาด');
                        console.error('Error details:', response.data);
                    }
                },
                error: function(xhr, status, error) {
                    // Show error notification
                    showNotification(container, 'error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
                    console.error('AJAX Error:', error);
                },
                complete: function() {
                    // Remove loading state
                    setTimeout(function() {
                        container.removeClass('is-loading');
                    }, 500);
                }
            });
            
            return false; // Prevent default
        });
        
        // Function to show notifications
        function showNotification(container, type, message) {
            // Remove existing notifications
            container.find('.ckan-notification-yns423').remove();
            
            var notification = $('<div class="ckan-notification-yns423 ' + type + '">' + message + '</div>');
            container.append(notification);
            
            // Auto remove notification after 3 seconds
            setTimeout(function() {
                notification.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 3000);
        }
    });
})(jQuery);