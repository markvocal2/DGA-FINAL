/**
 * DGA Update Post Date - Enhanced JavaScript with Collapsible UI
 * File: /js/dga-uptodate-v2.js
 * Version: 2.0.0
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
        const toggleHeader = widget.querySelector('.dga-toggle-header-kxt729');
        const toggleBtn = widget.querySelector('.dga-toggle-btn-kxt729');
        const updateBtn = widget.querySelector('.dga-update-btn-kxt729');
        const dateInput = widget.querySelector('.dga-datetime-input-kxt729');
        const messageDiv = widget.querySelector('.dga-message-kxt729');
        const spinner = widget.querySelector('.dga-spinner-kxt729');
        const btnText = widget.querySelector('.dga-btn-text-kxt729');
        const currentDateSpan = widget.querySelector('.dga-current-date-kxt729');
        const toggleDateSpan = widget.querySelector('.dga-toggle-date-kxt729');
        const quickButtons = widget.querySelectorAll('.dga-quick-btn-kxt729');
        
        if (!updateBtn || !dateInput) {
            console.error('DGA Update Date: Required elements not found');
            return;
        }
        
        const postId = widget.dataset.postId;
        const nonce = widget.dataset.nonce;
        const startCollapsed = widget.dataset.startCollapsed === 'true';
        
        // Store original button text
        const originalBtnText = btnText.textContent;
        
        // Initialize collapsed state from sessionStorage or data attribute
        const storageKey = 'dga_collapsed_' + postId;
        const savedState = sessionStorage.getItem(storageKey);
        
        if (savedState !== null) {
            if (savedState === 'false') {
                widget.classList.remove('dga-collapsed-kxt729');
                toggleBtn.setAttribute('aria-expanded', 'true');
            } else {
                widget.classList.add('dga-collapsed-kxt729');
                toggleBtn.setAttribute('aria-expanded', 'false');
            }
        } else if (startCollapsed) {
            widget.classList.add('dga-collapsed-kxt729');
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
        
        // Handle toggle functionality
        function toggleWidget() {
            const isCollapsed = widget.classList.contains('dga-collapsed-kxt729');
            
            if (isCollapsed) {
                widget.classList.remove('dga-collapsed-kxt729');
                toggleBtn.setAttribute('aria-expanded', 'true');
                sessionStorage.setItem(storageKey, 'false');
                
                // Focus on input when expanded
                setTimeout(() => dateInput.focus(), 300);
            } else {
                widget.classList.add('dga-collapsed-kxt729');
                toggleBtn.setAttribute('aria-expanded', 'false');
                sessionStorage.setItem(storageKey, 'true');
            }
        }
        
        // Toggle header click
        toggleHeader.addEventListener('click', function(e) {
            if (e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
                toggleWidget();
            }
        });
        
        // Toggle button click
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleWidget();
        });
        
        // Quick action buttons
        quickButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                const action = this.dataset.action;
                const now = new Date();
                let targetDate;
                
                switch(action) {
                    case 'now':
                        targetDate = now;
                        break;
                    case 'today':
                        targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0);
                        break;
                    case 'yesterday':
                        targetDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                        break;
                    case 'week-ago':
                        targetDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                }
                
                if (targetDate) {
                    // Format date for datetime-local input
                    const year = targetDate.getFullYear();
                    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
                    const day = String(targetDate.getDate()).padStart(2, '0');
                    const hours = String(targetDate.getHours()).padStart(2, '0');
                    const minutes = String(targetDate.getMinutes()).padStart(2, '0');
                    
                    dateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
                    
                    // Visual feedback
                    btn.style.background = '#667eea';
                    btn.style.color = 'white';
                    setTimeout(() => {
                        btn.style.background = '';
                        btn.style.color = '';
                    }, 300);
                }
            });
        });
        
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
                
                if (data.success) {
                    showMessage(data.data.message, 'success');
                    
                    // Update current date display
                    if (currentDateSpan && data.data.formatted_date) {
                        currentDateSpan.textContent = data.data.formatted_date;
                    }
                    
                    // Update toggle header date
                    if (toggleDateSpan && data.data.short_date) {
                        toggleDateSpan.textContent = data.data.short_date;
                    }
                    
                    // Add success animation
                    widget.classList.add('dga-success-animation-kxt729');
                    setTimeout(function() {
                        widget.classList.remove('dga-success-animation-kxt729');
                    }, 1000);
                    
                    // Auto-collapse after success (optional)
                    setTimeout(function() {
                        if (!widget.classList.contains('dga-collapsed-kxt729')) {
                            toggleWidget();
                        }
                    }, 3000);
                    
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
        
        // Keyboard shortcuts
        dateInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                updateBtn.click();
            }
        });
        
        // Add keyboard shortcut for toggle (Alt + D)
        document.addEventListener('keydown', function(e) {
            if (e.altKey && e.key === 'd') {
                e.preventDefault();
                toggleWidget();
            }
        });
        
        // Escape key to collapse
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !widget.classList.contains('dga-collapsed-kxt729')) {
                toggleWidget();
            }
        });
        
        // Add pulse animation on hover (subtle attention getter)
        let pulseTimeout;
        widget.addEventListener('mouseenter', function() {
            if (widget.classList.contains('dga-collapsed-kxt729')) {
                clearTimeout(pulseTimeout);
                widget.classList.add('dga-widget-pulse-kxt729');
            }
        });
        
        widget.addEventListener('mouseleave', function() {
            pulseTimeout = setTimeout(() => {
                widget.classList.remove('dga-widget-pulse-kxt729');
            }, 300);
        });
        
        // Accessibility: Focus management
        updateBtn.addEventListener('focus', function() {
            this.classList.add('dga-focused-kxt729');
        });
        
        updateBtn.addEventListener('blur', function() {
            this.classList.remove('dga-focused-kxt729');
        });
        
        // Debug helper (right-click on update button)
        updateBtn.addEventListener('contextmenu', function(e) {
            if (e.shiftKey) { // Only with Shift key for security
                e.preventDefault();
                console.log('Debug Info:', {
                    postId: postId,
                    nonce: nonce,
                    currentValue: dateInput.value,
                    ajaxUrl: dgaUpdateDate.ajaxurl,
                    isCollapsed: widget.classList.contains('dga-collapsed-kxt729')
                });
            }
        });
    }
    
    // Re-initialize on Elementor preview
    if (window.elementorFrontend) {
        window.elementorFrontend.hooks.addAction('frontend/element_ready/shortcode.default', function() {
            setTimeout(initializeDateUpdater, 100);
        });
    }
    
    // Re-initialize on AJAX page loads (for compatibility)
    document.addEventListener('ajaxComplete', function() {
        setTimeout(initializeDateUpdater, 100);
    });
})();