/**
 * DGA STAX CORG Taxonomy Table JavaScript
 * Location: /wp-content/themes/your-child-theme/js/dga-stax-corg.js
 */

(function() {
    'use strict';
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        const wrapper = document.querySelector('.dga-corg-wrapper-qhx728');
        if (!wrapper) return;
        
        // Elements
        const tbody = document.getElementById('dga-corg-tbody');
        const pagination = document.getElementById('dga-corg-pagination');
        const searchInput = document.querySelector('.dga-corg-search-qhx728');
        const sortSelect = document.querySelector('.dga-corg-sort-qhx728');
        const loadingDiv = document.querySelector('.dga-loading-qhx728');
        const table = document.querySelector('.dga-corg-table-qhx728');
        
        // State
        let currentPage = 1;
        let searchTimer = null;
        
        // Get data attributes
        const perPage = parseInt(wrapper.dataset.perPage) || 10;
        const showCount = table.dataset.showCount === 'true';
        const showDescription = table.dataset.showDescription === 'true';
        
        /**
         * Load terms via AJAX
         */
        async function loadTerms(page = 1) {
            // Show loading
            showLoading(true);
            
            // Get sort values
            let orderby = 'name';
            let order = 'ASC';
            
            if (sortSelect) {
                const sortValue = sortSelect.value.split('-');
                orderby = sortValue[0];
                order = sortValue[1].toUpperCase();
            }
            
            // Prepare data
            const formData = new FormData();
            formData.append('action', 'dga_load_corg_terms');
            formData.append('nonce', dgaCorgAjax.nonce);
            formData.append('page', page);
            formData.append('per_page', perPage);
            formData.append('orderby', orderby);
            formData.append('order', order);
            formData.append('show_count', showCount);
            formData.append('show_description', showDescription);
            
            // Add search term if exists
            if (searchInput && searchInput.value.trim()) {
                formData.append('search', searchInput.value.trim());
            }
            
            try {
                // Make AJAX request using Fetch API
                const response = await fetch(dgaCorgAjax.ajaxurl, {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                
                const data = await response.json();
                
                if (data.success) {
                    // Update table body
                    tbody.innerHTML = data.data.html;
                    
                    // Update pagination
                    pagination.innerHTML = data.data.pagination;
                    
                    // Update current page
                    currentPage = page;
                    
                    // Attach pagination event listeners
                    attachPaginationEvents();
                    
                    // Announce to screen readers
                    announceResults(data.data.total);
                } else {
                    showError(data.data.message || dgaCorgAjax.error_text);
                }
            } catch (error) {
                console.error('Error loading terms:', error);
                showError(dgaCorgAjax.error_text);
            } finally {
                showLoading(false);
            }
        }
        
        /**
         * Show/hide loading indicator
         */
        function showLoading(show) {
            if (loadingDiv) {
                loadingDiv.style.display = show ? 'flex' : 'none';
            }
            
            // Add loading class to table
            if (show) {
                table.classList.add('loading');
            } else {
                table.classList.remove('loading');
            }
        }
        
        /**
         * Show error message
         */
        function showError(message) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${showDescription && showCount ? 5 : showDescription || showCount ? 4 : 3}" class="dga-error-qhx728">
                        ${message}
                    </td>
                </tr>
            `;
        }
        
        /**
         * Attach pagination event listeners
         */
        function attachPaginationEvents() {
            const pageButtons = document.querySelectorAll('.dga-page-btn-qhx728');
            
            pageButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const page = parseInt(this.dataset.page);
                    if (page && page !== currentPage) {
                        loadTerms(page);
                        
                        // Scroll to top of table
                        wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
        }
        
        /**
         * Announce results to screen readers
         */
        function announceResults(total) {
            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'polite');
            announcement.className = 'screen-reader-text';
            
            if (total > 0) {
                announcement.textContent = `${total} results found`;
            } else {
                announcement.textContent = dgaCorgAjax.no_results;
            }
            
            document.body.appendChild(announcement);
            
            // Remove after announcement
            setTimeout(() => {
                document.body.removeChild(announcement);
            }, 1000);
        }
        
        /**
         * Debounce function for search
         */
        function debounce(func, delay) {
            return function() {
                const context = this;
                const args = arguments;
                
                clearTimeout(searchTimer);
                searchTimer = setTimeout(() => {
                    func.apply(context, args);
                }, delay);
            };
        }
        
        // Event listeners
        
        // Search input
        if (searchInput) {
            const debouncedSearch = debounce(() => {
                currentPage = 1; // Reset to first page
                loadTerms(1);
            }, 500);
            
            searchInput.addEventListener('input', debouncedSearch);
            
            // Clear search
            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    this.value = '';
                    currentPage = 1;
                    loadTerms(1);
                }
            });
        }
        
        // Sort select
        if (sortSelect) {
            sortSelect.addEventListener('change', function() {
                currentPage = 1; // Reset to first page
                loadTerms(1);
            });
        }
        
        // Initial load
        loadTerms(1);
        
        // Keyboard navigation for table
        table.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const pageButtons = pagination.querySelectorAll('.dga-page-btn-qhx728');
                
                if (e.key === 'ArrowLeft' && currentPage > 1) {
                    // Go to previous page
                    const prevButton = pagination.querySelector(`[data-page="${currentPage - 1}"]`);
                    if (prevButton) prevButton.click();
                } else if (e.key === 'ArrowRight') {
                    // Go to next page
                    const nextButton = pagination.querySelector(`[data-page="${currentPage + 1}"]`);
                    if (nextButton) nextButton.click();
                }
            }
        });
    });
})();