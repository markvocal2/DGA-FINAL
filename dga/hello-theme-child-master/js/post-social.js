(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Initialize all post social widgets with unique class
        $('.post-social-widget-ps34').each(function() {
            initPostSocialWidget_ps34($(this));
        });
        
        // Handle social share clicks with updated class names
        $(document).on('click', '.share-line-ps34', handleLineShare_ps34);
        $(document).on('click', '.share-facebook-ps34', handleFacebookShare_ps34);
        $(document).on('click', '.share-twitter-ps34', handleTwitterShare_ps34);
    });
    
    function initPostSocialWidget_ps34($widget) {
        const postId = $widget.data('post-id');
        
        // Validate post ID
        if (!postId || postId <= 0) {
            handleAjaxError_ps34($widget, 'Invalid post ID');
            return;
        }
        
        // Show loading state
        $widget.find('.post-social-loading-ps34').show();
        $widget.find('.post-social-content-ps34').hide();
        
        // Fetch post data via AJAX with updated action name
        $.ajax({
            url: post_social_data_ps34.ajax_url,
            type: 'POST',
            data: {
                action: 'post_social_get_data_ps34',
                post_id: postId,
                nonce: post_social_data_ps34.nonce
            },
            timeout: 10000, // 10 second timeout
            success: function(response) {
                if (response?.success && response?.data) {
                    updateWidgetContent_ps34($widget, response.data);
                } else {
                    const errorMessage = response?.data?.message || 'Unknown error occurred';
                    handleAjaxError_ps34($widget, errorMessage);
                }
            },
            error: function(xhr, status, error) {
                let errorMessage = 'Connection error';
                if (status === 'timeout') {
                    errorMessage = 'Request timeout';
                } else if (xhr.status === 404) {
                    errorMessage = 'Endpoint not found';
                } else if (xhr.status >= 500) {
                    errorMessage = 'Server error';
                }
                handleAjaxError_ps34($widget, errorMessage + ': ' + error);
            }
        });
    }
    
    function updateWidgetContent_ps34($widget, data) {
        // Get visibility settings from data attributes
        const showDate = $widget.data('show-date') === true;
        const showCount = $widget.data('show-count') === true;
        const showSocial = $widget.data('show-social') === true;
        
        try {
            if (showDate && data.date_text) {
                // Update date with sanitized content
                const $dateElement = $widget.find('.post-social-date-ps34');
                const $dateText = $dateElement.find('.date-text-ps34');
                if ($dateText.length) {
                    $dateText.text(data.date_text);
                    $dateElement.show();
                }
            } else {
                $widget.find('.post-social-date-ps34').hide();
            }
            
            if (showCount && typeof data.views === 'number') {
                // Update views with formatted number
                const $viewsElement = $widget.find('.post-social-views-ps34');
                const $viewsText = $viewsElement.find('.views-text-ps34');
                if ($viewsText.length) {
                    $viewsText.text(formatNumber_ps34(data.views));
                    $viewsElement.show();
                }
            } else {
                $widget.find('.post-social-views-ps34').hide();
            }
            
            if (showSocial && data?.post_url && data?.post_title) {
                // Show share section and update URLs
                const $shareElement = $widget.find('.post-social-share-ps34');
                
                // Validate URLs before setting
                if (isValidUrl_ps34(data.post_url)) {
                    $shareElement.find('.share-line-ps34').attr({
                        'data-url': data.post_url,
                        'data-title': data.post_title
                    });
                    $shareElement.find('.share-facebook-ps34').attr({
                        'data-url': data.post_url,
                        'data-title': data.post_title
                    });
                    $shareElement.find('.share-twitter-ps34').attr({
                        'data-url': data.post_url,
                        'data-title': data.post_title
                    });
                    $shareElement.show();
                } else {
                    $shareElement.hide();
                }
            } else {
                $widget.find('.post-social-share-ps34').hide();
            }
            
            // Hide loading, show content
            $widget.find('.post-social-loading-ps34').hide();
            $widget.find('.post-social-content-ps34').show();
            
            // Update ARIA live region
            $widget.attr('aria-live', 'polite');
            
        } catch (error) {
            console.error('Error updating widget content:', error);
            handleAjaxError_ps34($widget, 'Content update failed');
        }
    }
    
    function handleAjaxError_ps34($widget, message) {
        console.error('Post Social Widget Error:', message);
        const $loading = $widget.find('.post-social-loading-ps34');
        $loading.html('Error loading content').addClass('error');
        $widget.find('.post-social-content-ps34').hide();
        
        // Update ARIA attributes for accessibility
        $widget.attr('aria-live', 'assertive');
    }
    
    function formatNumber_ps34(num) {
        // Ensure num is a valid number
        const number = parseInt(num, 10);
        if (isNaN(number) || number < 0) {
            return '0';
        }
        
        if (number >= 1000000) {
            return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (number >= 1000) {
            return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return number.toLocaleString();
    }
    
    function isValidUrl_ps34(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }
    
    function handleLineShare_ps34(e) {
        e.preventDefault();
        const $link = $(this);
        const url = $link.attr('data-url');
        
        if (!url || !isValidUrl_ps34(url)) {
            console.error('Invalid URL for Line sharing');
            return;
        }
        
        const shareUrl = 'https://social-plugins.line.me/lineit/share?url=' + 
                        encodeURIComponent(url);
        
        openShareWindow_ps34(shareUrl, 'share-line');
    }
    
    function handleFacebookShare_ps34(e) {
        e.preventDefault();
        const $link = $(this);
        const url = $link.attr('data-url');
        
        if (!url || !isValidUrl_ps34(url)) {
            console.error('Invalid URL for Facebook sharing');
            return;
        }
        
        const shareUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + 
                        encodeURIComponent(url);
        
        openShareWindow_ps34(shareUrl, 'share-facebook');
    }
    
    function handleTwitterShare_ps34(e) {
        e.preventDefault();
        const $link = $(this);
        const url = $link.attr('data-url');
        const title = $link.attr('data-title') || '';
        
        if (!url || !isValidUrl_ps34(url)) {
            console.error('Invalid URL for Twitter sharing');
            return;
        }
        
        const shareUrl = 'https://twitter.com/intent/tweet?text=' + 
                        encodeURIComponent(title) + '&url=' + encodeURIComponent(url);
        
        openShareWindow_ps34(shareUrl, 'share-twitter');
    }
    
    function openShareWindow_ps34(url, windowName) {
        // Check if popup blocker might interfere
        try {
            const newWindow = window.open(
                url, 
                windowName, 
                'width=550,height=500,scrollbars=yes,resizable=yes,status=yes,toolbar=no,menubar=no'
            );
            
            // Focus on the new window if it opened
            if (newWindow) {
                newWindow.focus();
            } else {
                // Fallback: open in same tab if popup blocked
                window.location.href = url;
            }
        } catch (error) {
            console.error('Error opening share window:', error);
            // Fallback: open in same tab
            window.location.href = url;
        }
    }
    
    // Initialize any widgets that may be added dynamically
    $(document).on('DOMNodeInserted', function(e) {
        if ($(e.target).hasClass('post-social-widget-ps34')) {
            initPostSocialWidget_ps34($(e.target));
        }
    });
    
})(jQuery);