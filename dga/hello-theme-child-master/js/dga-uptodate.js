/**
 * DGA Update Post Date - JavaScript Handler
 * File: /js/dga-uptodate.js
 */

(function() {
    'use strict';
    
    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDateUpdater);
    } else {
        initializeDateUpdater();
    }
    
    function initializeDateUpdater() {
        const widgets = document.querySelectorAll('.dga-update-date-widget-kxt729');
        
        widgets.forEach(function(widget) {
            setupWidget(widget);
        });
    }
    
    function setupWidget(widget) {
        const updateBtn = widget.querySelector('.dga-update-btn-kxt729');
        const dateInput = widget.querySelector('.dga-datetime-input-kxt729');
        const messageDiv = widget.querySelector('.dga-message-kxt729');
        const spinner = widget.querySelector('.dga-spinner-kxt729');
        const btnText = widget.querySelector('.dga-btn-text-kxt729');
        const currentDateSpan = widget.querySelector('.dga-current-date-kxt729');
        
        if (!updateBtn || !dateInput) {
            console.error('DGA Update Date: Required elements not found');
            return;
        }
        
        const postId = widget.dataset.postId;
        const nonce = widget.dataset.nonce;
        
        // Store original button text
        const originalBtnText = btnText.textContent;
        
        // Handle update button click
        updateBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const datetime = dateInput.value;
            
            // Validate input
            if (!datetime) {
                showMessage(dgaUpdateDate.messages.invalid_date, 'error');
                return;
            }
            
            // Show loading state
            updateBtn.disabled = true;
            spinner.style.display = 'inline-block';
            btnText.textContent = dgaUpdateDate.messages.updating;
            messageDiv.className = 'dga-message-kxt729';
            messageDiv.textContent = '';
            
            try {
                // Prepare form data
                const formData = new FormData();
                formData.append('action', 'dga_update_post_date');
                formData.append('post_id', postId);
                formData.append('datetime', datetime);
                formData.append('nonce', nonce);
                
                console.log('Sending request with:', {
                    action: 'dga_update_post_date',
                    post_id: postId,
                    datetime: datetime,
                    ajaxurl: dgaUpdateDate.ajaxurl
                });
                
                // Send AJAX request
                const response = await fetch(dgaUpdateDate.ajaxurl, {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                
                const data = await response.json();
                console.log('Response:', data);
                
                if (data.success) {
                    showMessage(data.data.message, 'success');
                    
                    // Update current date display
                    if (currentDateSpan && data.data.formatted_date) {
                        currentDateSpan.textContent = data.data.formatted_date;
                    }
                    
                    // Add success animation
                    widget.classList.add('dga-success-animation-kxt729');
                    setTimeout(function() {
                        widget.classList.remove('dga-success-animation-kxt729');
                    }, 1000);
                    
                    // Optionally reload page after success
                    // setTimeout(() => window.location.reload(), 2000);
                } else {
                    const errorMsg = data.data && data.data.message ? data.data.message : dgaUpdateDate.messages.error;
                    showMessage(errorMsg, 'error');
                    console.error('Update failed:', data);
                }
            } catch (error) {
                console.error('Update error:', error);
                showMessage(dgaUpdateDate.messages.error, 'error');
            } finally {
                // Reset button state
                updateBtn.disabled = false;
                spinner.style.display = 'none';
                btnText.textContent = originalBtnText;
            }
        });
        
        // Show message function
        function showMessage(message, type) {
            messageDiv.className = 'dga-message-kxt729 dga-message-' + type + '-kxt729';
            messageDiv.textContent = message;
            
            // Auto-hide message after 5 seconds
            setTimeout(function() {
                messageDiv.className = 'dga-message-kxt729';
                messageDiv.textContent = '';
            }, 5000);
        }
        
        // Add keyboard support for Enter key
        dateInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                updateBtn.click();
            }
        });
        
        // Add focus styles for accessibility
        updateBtn.addEventListener('focus', function() {
            this.classList.add('dga-focused-kxt729');
        });
        
        updateBtn.addEventListener('blur', function() {
            this.classList.remove('dga-focused-kxt729');
        });
        
        // Debug helper - can be removed in production
        updateBtn.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            console.log('Debug Info:', {
                postId: postId,
                nonce: nonce,
                currentValue: dateInput.value,
                ajaxUrl: dgaUpdateDate.ajaxurl
            });
        });
    }
    
    // Also initialize on Elementor preview
    if (window.elementorFrontend) {
        window.elementorFrontend.hooks.addAction('frontend/element_ready/shortcode.default', function() {
            setTimeout(initializeDateUpdater, 100);
        });
    }
})();