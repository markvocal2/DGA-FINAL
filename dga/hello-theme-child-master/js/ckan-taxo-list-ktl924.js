/**
 * CKAN Taxonomy List JavaScript
 * Version: 2.0.0 
 * Uses modern Fetch API instead of jQuery
 */

(function() {
    'use strict';
    
    // State management
    const state = {
        activeTerms: {},
        loading: {}
    };
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeContainers();
    });
    
    /**
     * Initialize all taxonomy containers
     */
    function initializeContainers() {
        const containers = document.querySelectorAll('.ckan-taxo-container-ktl924');
        
        containers.forEach(container => {
            const containerId = container.id;
            const taxonomy = container.dataset.taxonomy;
            
            // Show content after initial load
            setTimeout(() => {
                const skeleton = container.querySelector('.ckan-taxo-skeleton-ktl924');
                const content = container.querySelector('.ckan-taxo-content-ktl924');
                
                if (skeleton && content) {
                    skeleton.style.display = 'none';
                    content.style.display = 'block';
                    
                    // Announce to screen readers
                    announceToScreenReader(`${taxonomy} list loaded`);
                }
            }, 500);
            
            // Initialize click handlers
            initializeClickHandlers(container);
            
            // Check URL parameters for initial filter
            checkInitialFilter(container);
        });
    }
    
    /**
     * Initialize click handlers for a container
     */
    function initializeClickHandlers(container) {
        const items = container.querySelectorAll('.ckan-taxo-item-ktl924');
        
        items.forEach(item => {
            item.addEventListener('click', handleTermClick);
            
            // Add keyboard support
            item.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTermClick.call(this, e);
                }
            });
        });
    }
    
    /**
     * Handle term click event
     */
    async function handleTermClick(e) {
        const button = e.currentTarget;
        const container = button.closest('.ckan-taxo-container-ktl924');
        const containerId = container.id;
        const taxonomy = container.dataset.taxonomy;
        const termId = parseInt(button.dataset.termId);
        
        // Prevent double-clicking
        if (state.loading[containerId]) {
            return;
        }
        
        // Update active state
        updateActiveState(container, button);
        
        // Store active term
        state.activeTerms[containerId] = termId;
        
        // Update URL
        updateURL(taxonomy, termId);
        
        // Filter content
        await filterContent(taxonomy, termId, container);
    }
    
    /**
     * Update active state in UI
     */
    function updateActiveState(container, activeButton) {
        // Remove active from all buttons
        container.querySelectorAll('.ckan-taxo-item-ktl924').forEach(item => {
            item.classList.remove('active');
            item.setAttribute('aria-current', 'false');
        });
        
        // Add active to clicked button
        activeButton.classList.add('active');
        activeButton.setAttribute('aria-current', 'true');
    }
    
    /**
     * Update browser URL
     */
    function updateURL(taxonomy, termId) {
        const url = new URL(window.location.href);
        
        if (termId === 0) {
            url.searchParams.delete('term_id');
            url.searchParams.delete('taxonomy');
        } else {
            url.searchParams.set('term_id', termId);
            url.searchParams.set('taxonomy', taxonomy);
        }
        
        window.history.pushState({}, '', url.toString());
    }
    
    /**
     * Filter content via AJAX
     */
    async function filterContent(taxonomy, termId, container) {
        const containerId = container.id;
        
        // Set loading state
        state.loading[containerId] = true;
        showLoadingState();
        
        try {
            // Prepare form data
            const formData = new FormData();
            formData.append('action', 'ckan_taxo_filter_ktl924');
            formData.append('nonce', window.ckanTaxoConfig.nonce);
            formData.append('taxonomy', taxonomy);
            formData.append('term_id', termId);
            formData.append('page', 1);
            
            // Send request
            const response = await fetch(window.ckanTaxoConfig.ajaxUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                updateListContent(data.data);
                announceToScreenReader(`Filtered by ${data.data.term_name}, found ${data.data.found_posts} items`);
            } else {
                showError(container, data.data.message || window.ckanTaxoConfig.i18n.error);
            }
            
        } catch (error) {
            console.error('Filter error:', error);
            showError(container, window.ckanTaxoConfig.i18n.error);
        } finally {
            state.loading[containerId] = false;
            hideLoadingState();
        }
    }
    
    /**
     * Update list content with filtered results
     */
    function updateListContent(data) {
        const listContent = document.getElementById('ckan-list-content');
        const listSkeleton = document.getElementById('ckan-list-skeleton');
        
        if (!listContent) return;
        
        if (data.posts.length === 0) {
            listContent.innerHTML = `
                <div class="ckan-list-no-results">
                    <p>${window.ckanTaxoConfig.i18n.noData}</p>
                </div>
            `;
        } else {
            let html = '';
            
            data.posts.forEach(post => {
                html += buildPostHTML(post);
            });
            
            listContent.innerHTML = html;
        }
        
        // Hide skeleton, show content
        if (listSkeleton) listSkeleton.style.display = 'none';
        listContent.style.display = 'block';
        
        // Update pagination if exists
        updatePagination(data);
    }
    
    /**
     * Build HTML for a single post
     */
    function buildPostHTML(post) {
        return `
            <article class="ckan-list-item" data-post-id="${post.id}">
                <header class="ckan-list-item-header">
                    <h3 class="ckan-list-item-title">
                        <a href="${post.permalink}" 
                           data-post-id="${post.id}"
                           class="ckan-list-item-link">
                            ${escapeHtml(post.title)}
                        </a>
                    </h3>
                    <div class="ckan-list-item-views">
                        <span class="ckan-list-item-total-views" 
                              title="${window.ckanTaxoConfig.i18n.totalViews}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span aria-label="${post.total_views} views">${post.total_views}</span>
                        </span>
                        <span class="ckan-list-item-recent-views" 
                              title="${window.ckanTaxoConfig.i18n.recentViews}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span aria-label="${post.recent_views} recent views">${post.recent_views}</span>
                        </span>
                    </div>
                </header>
                
                <div class="ckan-list-item-excerpt">
                    ${escapeHtml(post.excerpt)}
                </div>
                
                ${buildTaxonomyTags(post)}
                
                <footer class="ckan-list-item-footer">
                    <time datetime="${post.creation_date}" class="ckan-list-item-date">
                        ${post.creation_date}
                    </time>
                </footer>
            </article>
        `;
    }
    
    /**
     * Build taxonomy tags HTML
     */
    function buildTaxonomyTags(post) {
        let html = '<div class="ckan-list-item-taxonomies">';
        
        // Process taxonomy data
        ['taxonomy_row1', 'taxonomy_row3', 'taxonomy_row4'].forEach(row => {
            if (post[row] && Array.isArray(post[row])) {
                post[row].forEach(taxArray => {
                    if (Array.isArray(taxArray)) {
                        taxArray.forEach(tax => {
                            html += `<span class="ckan-list-taxonomy-tag tag-${tax.taxonomy}">
                                ${escapeHtml(tax.term)}
                            </span>`;
                        });
                    }
                });
            }
        });
        
        html += '</div>';
        return html;
    }
    
    /**
     * Update pagination
     */
    function updatePagination(data) {
        const paginationContainer = document.querySelector('.ckan-list-pagination');
        if (!paginationContainer || data.max_pages <= 1) {
            if (paginationContainer) {
                paginationContainer.style.display = 'none';
            }
            return;
        }
        
        // Build pagination HTML
        let html = '';
        const currentPage = data.current_page || 1;
        const maxPages = data.max_pages;
        
        // Previous link
        if (currentPage > 1) {
            html += `<button type="button" class="ckan-list-pagination-prev" data-page="${currentPage - 1}">
                &laquo; ${window.ckanTaxoConfig.i18n.previous}
            </button>`;
        }
        
        // Page numbers
        for (let i = 1; i <= maxPages; i++) {
            if (i === currentPage) {
                html += `<span class="ckan-list-pagination-current" aria-current="page">${i}</span>`;
            } else {
                html += `<button type="button" class="ckan-list-pagination-number" data-page="${i}">${i}</button>`;
            }
        }
        
        // Next link
        if (currentPage < maxPages) {
            html += `<button type="button" class="ckan-list-pagination-next" data-page="${currentPage + 1}">
                ${window.ckanTaxoConfig.i18n.next} &raquo;
            </button>`;
        }
        
        paginationContainer.innerHTML = html;
        paginationContainer.style.display = 'flex';
    }
    
    /**
     * Check initial filter from URL
     */
    function checkInitialFilter(container) {
        const urlParams = new URLSearchParams(window.location.search);
        const taxonomy = container.dataset.taxonomy;
        
        if (urlParams.has('term_id') && urlParams.has('taxonomy')) {
            if (urlParams.get('taxonomy') === taxonomy) {
                const termId = parseInt(urlParams.get('term_id'));
                const button = container.querySelector(`[data-term-id="${termId}"]`);
                
                if (button) {
                    setTimeout(() => {
                        button.click();
                    }, 1000);
                }
            }
        }
    }
    
    /**
     * Show loading state
     */
    function showLoadingState() {
        const listContent = document.getElementById('ckan-list-content');
        const listSkeleton = document.getElementById('ckan-list-skeleton');
        
        if (listContent) listContent.style.display = 'none';
        if (listSkeleton) listSkeleton.style.display = 'block';
    }
    
    /**
     * Hide loading state
     */
    function hideLoadingState() {
        const listSkeleton = document.getElementById('ckan-list-skeleton');
        if (listSkeleton) listSkeleton.style.display = 'none';
    }
    
    /**
     * Show error message
     */
    function showError(container, message) {
        const errorDiv = container.querySelector('.ckan-taxo-error-msg-ktl924');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Announce to screen readers
     */
    function announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'screen-reader-text';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
})();