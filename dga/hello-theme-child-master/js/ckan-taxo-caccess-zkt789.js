/**
 * Enhanced CKAN CACCESS JavaScript
 * Handles edit mode functionality (read-only mode is handled by PHP)
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if the container exists
    const container = document.querySelector('.ckan-taxo-caccess-container-zkt789');
    if (!container) return;
    
    // Check if we're in edit mode
    const form = document.getElementById('ckan-taxo-caccess-form-zkt789');
    if (!form) {
        // Read-only mode - add interactivity to tags
        initReadOnlyInteractions();
        return;
    }
    
    // Get permission status
    const canEdit = form.dataset.canEdit === 'true';
    if (!canEdit) return;
    
    // Initialize edit mode
    initEditMode();
    
    /**
     * Initialize read-only interactions (tooltips, etc.)
     */
    function initReadOnlyInteractions() {
        // Add hover effects to tags
        const tags = document.querySelectorAll('.ckan-taxo-tag-zkt789');
        tags.forEach(tag => {
            tag.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
            });
            tag.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        });
        
        // Initialize tooltips
        const tooltips = document.querySelectorAll('.tag-tooltip');
        tooltips.forEach(tooltip => {
            tooltip.addEventListener('click', function(e) {
                e.stopPropagation();
                alert(this.getAttribute('title'));
            });
        });
    }
    
    /**
     * Initialize edit mode functionality
     */
    function initEditMode() {
        const selectAllCheckbox = document.getElementById('ckan-taxo-select-all-zkt789');
        const searchInput = document.getElementById('ckan-taxo-search-zkt789');
        const submitBtn = document.getElementById('ckan-taxo-submit-zkt789');
        const spinner = document.querySelector('.ckan-taxo-spinner-zkt789');
        const messageContainer = document.getElementById('ckan-taxo-message-zkt789');
        
        // Select all functionality
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                const isChecked = this.checked;
                const visibleCheckboxes = document.querySelectorAll('.ckan-taxo-term-item-zkt789:not([style*="display: none"]) input[type="checkbox"]');
                visibleCheckboxes.forEach(cb => cb.checked = isChecked);
                updateSelectAllState();
            });
        }
        
        // Update select all state when individual checkboxes change
        const termCheckboxes = document.querySelectorAll('.ckan-taxo-term-item-zkt789 input[type="checkbox"]');
        termCheckboxes.forEach(cb => {
            cb.addEventListener('change', updateSelectAllState);
        });
        
        // Search functionality
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const termItems = document.querySelectorAll('.ckan-taxo-term-item-zkt789');
                
                termItems.forEach(item => {
                    const termName = item.querySelector('.term-name').textContent.toLowerCase();
                    const termDesc = item.querySelector('.term-description');
                    const descText = termDesc ? termDesc.textContent.toLowerCase() : '';
                    
                    if (termName.includes(searchTerm) || descText.includes(searchTerm)) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
                
                updateSelectAllState();
            });
        }
        
        // Form submission
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const postId = this.dataset.postId;
            const selectedTerms = [];
            
            // Get selected terms
            const checkedBoxes = form.querySelectorAll('input[name="ckan_taxo_terms[]"]:checked');
            checkedBoxes.forEach(cb => selectedTerms.push(cb.value));
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = ckan_taxo_caccess_vars.strings.updating;
            spinner.classList.add('is-active');
            
            // Prepare form data
            const formData = new FormData();
            formData.append('action', 'ckan_taxo_caccess_update');
            formData.append('post_id', postId);
            formData.append('nonce', ckan_taxo_caccess_vars.nonce);
            selectedTerms.forEach(term => formData.append('terms[]', term));
            
            // Send AJAX request
            fetch(ckan_taxo_caccess_vars.ajax_url, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage(data.data.message, 'success');
                    
                    // Highlight updated items
                    const termItems = document.querySelectorAll('.ckan-taxo-term-item-zkt789');
                    termItems.forEach(item => item.classList.remove('just-updated'));
                    
                    checkedBoxes.forEach(cb => {
                        cb.closest('.ckan-taxo-term-item-zkt789').classList.add('just-updated');
                    });
                    
                    setTimeout(() => {
                        termItems.forEach(item => item.classList.remove('just-updated'));
                    }, 2000);
                } else {
                    showMessage(data.data.message || 'Error occurred', 'error');
                    if (data.data.permission_info) {
                        messageContainer.insertAdjacentHTML('beforeend', data.data.permission_info);
                    }
                }
            })
            .catch(error => {
                showMessage(ckan_taxo_caccess_vars.strings.connection_error + error, 'error');
            })
            .finally(() => {
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.textContent = ckan_taxo_caccess_vars.strings.update_terms;
                spinner.classList.remove('is-active');
            });
        });
    }
    
    /**
     * Update select all checkbox state
     */
    function updateSelectAllState() {
        const selectAll = document.getElementById('ckan-taxo-select-all-zkt789');
        if (!selectAll) return;
        
        const visibleCheckboxes = document.querySelectorAll('.ckan-taxo-term-item-zkt789:not([style*="display: none"]) input[type="checkbox"]');
        const checkedVisibleCheckboxes = document.querySelectorAll('.ckan-taxo-term-item-zkt789:not([style*="display: none"]) input[type="checkbox"]:checked');
        
        if (visibleCheckboxes.length === 0) {
            selectAll.checked = false;
            selectAll.indeterminate = false;
        } else if (checkedVisibleCheckboxes.length === 0) {
            selectAll.checked = false;
            selectAll.indeterminate = false;
        } else if (checkedVisibleCheckboxes.length === visibleCheckboxes.length) {
            selectAll.checked = true;
            selectAll.indeterminate = false;
        } else {
            selectAll.checked = false;
            selectAll.indeterminate = true;
        }
    }
    
    /**
     * Show message to user
     */
    function showMessage(message, type) {
        const messageContainer = document.getElementById('ckan-taxo-message-zkt789');
        if (!messageContainer) return;
        
        // Clear and show message
        messageContainer.className = 'ckan-taxo-message-zkt789 ' + type;
        messageContainer.innerHTML = '<p>' + message + '</p>';
        messageContainer.style.display = 'block';
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                messageContainer.style.display = 'none';
                messageContainer.innerHTML = '';
            }, 5000);
        }
    }
});