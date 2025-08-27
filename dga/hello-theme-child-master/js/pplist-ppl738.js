/**
 * PPList - DGA Theme
 * Version: 2.0.0
 * Modern JavaScript without jQuery
 */

(function() {
    'use strict';
    
    // State management
    const PPList = {
        state: {
            page: 1,
            loading: false,
            hasMore: true,
            filters: {
                search: '',
                group: '',
                dateFrom: '',
                dateTo: '',
                sort: 'date_desc'
            },
            searchTimeout: null,
            container: null,
            total: 0
        },
        
        // Initialize
        init() {
            this.state.container = document.querySelector('.pplist-container-ppl738');
            if (!this.state.container) return;
            
            this.bindEvents();
            this.loadPosts();
        },
        
        // Bind events
        bindEvents() {
            // Search input
            const searchInput = this.state.container.querySelector('.pplist-search-input-ppl738');
            if (searchInput) {
                searchInput.addEventListener('input', this.handleSearch.bind(this));
                searchInput.addEventListener('focus', this.showSuggestions.bind(this));
            }
            
            // Search button
            const searchBtn = this.state.container.querySelector('.pplist-search-btn-ppl738');
            if (searchBtn) {
                searchBtn.addEventListener('click', this.performSearch.bind(this));
            }
            
            // Filters
            const groupSelect = this.state.container.querySelector('.pplist-filter-select-ppl738');
            if (groupSelect) {
                groupSelect.addEventListener('change', this.handleFilterChange.bind(this));
            }
            
            // Date filters
            const dateFrom = this.state.container.querySelector('.pplist-date-from-ppl738');
            const dateTo = this.state.container.querySelector('.pplist-date-to-ppl738');
            if (dateFrom) {
                dateFrom.addEventListener('change', this.handleDateChange.bind(this));
            }
            if (dateTo) {
                dateTo.addEventListener('change', this.handleDateChange.bind(this));
            }
            
            // Sort
            const sortSelect = this.state.container.querySelectorAll('.pplist-filter-select-ppl738')[1];
            if (sortSelect) {
                sortSelect.addEventListener('change', this.handleSortChange.bind(this));
            }
            
            // Clear filters
            const clearBtn = this.state.container.querySelector('.pplist-clear-filters-ppl738');
            if (clearBtn) {
                clearBtn.addEventListener('click', this.clearFilters.bind(this));
            }
            
            // Load more
            const loadMoreBtn = this.state.container.querySelector('.pplist-load-more-ppl738');
            if (loadMoreBtn) {
                loadMoreBtn.addEventListener('click', this.loadMore.bind(this));
            }
            
            // Click outside suggestions
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.pplist-search-wrapper-ppl738')) {
                    this.hideSuggestions();
                }
            });
            
            // Infinite scroll
            window.addEventListener('scroll', this.handleScroll.bind(this));
        },
        
        // Handle search input
        handleSearch(e) {
            const value = e.target.value.trim();
            
            clearTimeout(this.state.searchTimeout);
            
            this.state.searchTimeout = setTimeout(() => {
                if (value.length >= 2) {
                    this.fetchSuggestions(value);
                } else if (value.length === 0) {
                    this.hideSuggestions();
                    if (this.state.filters.search !== '') {
                        this.state.filters.search = '';
                        this.resetAndReload();
                    }
                }
            }, 300);
        },
        
        // Perform search
        performSearch() {
            const searchInput = this.state.container.querySelector('.pplist-search-input-ppl738');
            if (searchInput) {
                this.state.filters.search = searchInput.value.trim();
                this.resetAndReload();
            }
        },
        
        // Fetch search suggestions
        async fetchSuggestions(term) {
            try {
                const formData = new FormData();
                formData.append('action', 'pplist_search_ppl738');
                formData.append('nonce', window.pplistConfig.nonce);
                formData.append('search', term);
                
                const response = await fetch(window.pplistConfig.ajaxUrl, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                });
                
                const data = await response.json();
                
                if (data.success && data.data.length > 0) {
                    this.renderSuggestions(data.data);
                } else {
                    this.hideSuggestions();
                }
            } catch (error) {
                console.error('Search error:', error);
            }
        },
        
        // Render suggestions
        renderSuggestions(suggestions) {
            const container = this.state.container.querySelector('.pplist-search-suggestions-ppl738');
            if (!container) return;
            
            let html = '';
            suggestions.forEach(item => {
                html += `
                    <button type="button" 
                            class="pplist-suggestion-item-ppl738"
                            data-id="${item.id}"
                            data-title="${this.escapeHtml(item.title)}"
                            role="option">
                        <span class="pplist-suggestion-text-ppl738">
                            ${this.escapeHtml(item.title)}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </button>
                `;
            });
            
            container.innerHTML = html;
            container.style.display = 'block';
            
            // Add click handlers
            container.querySelectorAll('.pplist-suggestion-item-ppl738').forEach(item => {
                item.addEventListener('click', (e) => {
                    const title = item.dataset.title;
                    const searchInput = this.state.container.querySelector('.pplist-search-input-ppl738');
                    if (searchInput) {
                        searchInput.value = title;
                        this.state.filters.search = title;
                        this.resetAndReload();
                        this.hideSuggestions();
                    }
                });
            });
        },
        
        // Show/hide suggestions
        showSuggestions() {
            const container = this.state.container.querySelector('.pplist-search-suggestions-ppl738');
            if (container && container.innerHTML) {
                container.style.display = 'block';
            }
        },
        
        hideSuggestions() {
            const container = this.state.container.querySelector('.pplist-search-suggestions-ppl738');
            if (container) {
                container.style.display = 'none';
            }
        },
        
        // Handle filter change
        handleFilterChange(e) {
            this.state.filters.group = e.target.value;
            this.resetAndReload();
        },
        
        // Handle date change
        handleDateChange(e) {
            if (e.target.classList.contains('pplist-date-from-ppl738')) {
                this.state.filters.dateFrom = e.target.value;
            } else {
                this.state.filters.dateTo = e.target.value;
            }
            this.resetAndReload();
        },
        
        // Handle sort change
        handleSortChange(e) {
            this.state.filters.sort = e.target.value;
            this.resetAndReload();
        },
        
        // Clear all filters
        clearFilters() {
            // Reset state
            this.state.filters = {
                search: '',
                group: '',
                dateFrom: '',
                dateTo: '',
                sort: 'date_desc'
            };
            
            // Reset UI
            const searchInput = this.state.container.querySelector('.pplist-search-input-ppl738');
            if (searchInput) searchInput.value = '';
            
            const selects = this.state.container.querySelectorAll('.pplist-filter-select-ppl738');
            selects.forEach((select, index) => {
                select.value = index === 1 ? 'date_desc' : '';
            });
            
            const dateInputs = this.state.container.querySelectorAll('input[type="date"]');
            dateInputs.forEach(input => input.value = '');
            
            this.resetAndReload();
        },
        
        // Load posts
        async loadPosts(append = false) {
            if (this.state.loading) return;
            
            this.state.loading = true;
            this.showLoading(append);
            
            try {
                const formData = new FormData();
                formData.append('action', 'pplist_load_posts_ppl738');
                formData.append('nonce', window.pplistConfig.nonce);
                formData.append('page', this.state.page);
                formData.append('posts_per_page', window.pplistConfig.postsPerPage);
                formData.append('search', this.state.filters.search);
                formData.append('group', this.state.filters.group);
                formData.append('date_from', this.state.filters.dateFrom);
                formData.append('date_to', this.state.filters.dateTo);
                formData.append('sort', this.state.filters.sort);
                
                const response = await fetch(window.pplistConfig.ajaxUrl, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.renderPosts(data.data, append);
                    this.updateSummary(data.data);
                    
                    // Update state
                    this.state.hasMore = this.state.page < data.data.max_pages;
                    this.state.total = data.data.total;
                    
                    // Update load more button
                    this.updateLoadMoreButton();
                } else {
                    this.showError(data.data.message || window.pplistConfig.i18n.error);
                }
            } catch (error) {
                console.error('Load posts error:', error);
                this.showError(window.pplistConfig.i18n.error);
            } finally {
                this.state.loading = false;
                this.hideLoading();
            }
        },
        
        // Render posts
        renderPosts(data, append) {
            const container = this.state.container.querySelector('.pplist-items-ppl738');
            if (!container) return;
            
            if (data.posts.length === 0 && !append) {
                this.showEmptyState();
                return;
            }
            
            let html = append ? container.innerHTML : '';
            
            data.posts.forEach(post => {
                const filesHtml = this.renderFiles(post.files);
                const categoryHtml = post.category ? `
                    <span class="pplist-item-category-ppl738">
                        ${this.escapeHtml(post.category.name)}
                    </span>
                ` : '';
                
                html += `
                    <article class="pplist-item-ppl738" 
                             data-post-id="${post.id}"
                             role="listitem">
                        <div class="pplist-item-header-ppl738">
                            <h3 class="pplist-item-title-ppl738">
                                <a href="${post.link}" 
                                   class="pplist-item-link-ppl738"
                                   data-id="${post.id}">
                                    ${this.escapeHtml(post.title)}
                                </a>
                            </h3>
                            ${categoryHtml}
                        </div>
                        
                        ${post.excerpt ? `
                        <div class="pplist-item-excerpt-ppl738">
                            ${this.escapeHtml(post.excerpt)}
                        </div>
                        ` : ''}
                        
                        <div class="pplist-item-meta-ppl738">
                            <span class="pplist-meta-item-ppl738">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                <time datetime="${post.date_iso}">${post.date}</time>
                            </span>
                            
                            <span class="pplist-meta-item-ppl738">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                                <span class="pplist-views-count-ppl738">${post.views}</span> ${window.pplistConfig.i18n.views}
                            </span>
                            
                            ${post.files.length > 0 ? `
                            <span class="pplist-meta-item-ppl738">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                </svg>
                                ${post.files.length} ${window.pplistConfig.i18n.files}
                            </span>
                            ` : ''}
                        </div>
                        
                        ${filesHtml}
                    </article>
                `;
            });
            
            container.innerHTML = html;
            this.hideEmptyState();
            
            // Add click handlers for view tracking
            container.querySelectorAll('.pplist-item-link-ppl738').forEach(link => {
                link.addEventListener('click', (e) => {
                    this.trackView(link.dataset.id);
                });
            });
        },
        
        // Render files
        renderFiles(files) {
            if (!files || files.length === 0) return '';
            
            let html = '<div class="pplist-item-files-ppl738">';
            
            files.forEach(file => {
                const iconClass = this.getFileIconClass(file.type);
                
                html += `
                    <a href="${file.link}" 
                       class="pplist-file-item-ppl738"
                       target="_blank"
                       rel="noopener noreferrer"
                       title="${this.escapeHtml(file.name)}">
                        <span class="${iconClass}"></span>
                        <span class="pplist-file-name-ppl738">
                            ${this.escapeHtml(file.name)}
                        </span>
                        ${file.date ? `
                        <span class="pplist-file-date-ppl738">
                            ${file.date}
                        </span>
                        ` : ''}
                    </a>
                `;
            });
            
            html += '</div>';
            return html;
        },
        
        // Get file icon class
        getFileIconClass(type) {
            const types = {
                'PDF': 'pplist-icon-pdf-ppl738',
                'Word': 'pplist-icon-word-ppl738',
                'Excel': 'pplist-icon-excel-ppl738',
                'PowerPoint': 'pplist-icon-ppt-ppl738',
                'ZIP': 'pplist-icon-zip-ppl738'
            };
            
            return types[type] || 'pplist-icon-file-ppl738';
        },
        
        // Track view
        async trackView(postId) {
            try {
                const formData = new FormData();
                formData.append('action', 'pplist_increment_view_ppl738');
                formData.append('nonce', window.pplistConfig.nonce);
                formData.append('post_id', postId);
                
                const response = await fetch(window.pplistConfig.ajaxUrl, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Update view count in UI
                    const item = this.state.container.querySelector(`[data-post-id="${postId}"] .pplist-views-count-ppl738`);
                    if (item) {
                        item.textContent = data.data.views;
                    }
                }
            } catch (error) {
                console.error('Track view error:', error);
            }
        },
        
        // Update summary
        updateSummary(data) {
            const countEl = this.state.container.querySelector('.pplist-result-count-ppl738');
            if (countEl) {
                countEl.textContent = `พบ ${data.total} รายการ`;
            }
            
            const filtersEl = this.state.container.querySelector('.pplist-active-filters-ppl738');
            if (filtersEl) {
                const activeFilters = [];
                
                if (this.state.filters.search) {
                    activeFilters.push(`ค้นหา: "${this.state.filters.search}"`);
                }
                
                if (this.state.filters.group) {
                    const select = this.state.container.querySelector('.pplist-filter-select-ppl738');
                    const option = select.querySelector(`option[value="${this.state.filters.group}"]`);
                    if (option) {
                        activeFilters.push(`หมวดหมู่: ${option.textContent.split('(')[0].trim()}`);
                    }
                }
                
                if (this.state.filters.dateFrom || this.state.filters.dateTo) {
                    activeFilters.push('ช่วงวันที่');
                }
                
                filtersEl.textContent = activeFilters.length > 0 ? `(${activeFilters.join(', ')})` : '';
            }
        },
        
        // Load more
        loadMore() {
            this.state.page++;
            this.loadPosts(true);
        },
        
        // Reset and reload
        resetAndReload() {
            this.state.page = 1;
            this.state.hasMore = true;
            this.loadPosts(false);
        },
        
        // Handle scroll
        handleScroll() {
            if (!this.state.hasMore || this.state.loading) return;
            
            const scrollPosition = window.scrollY + window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            if (scrollPosition >= documentHeight - 200) {
                this.loadMore();
            }
        },
        
        // Update load more button
        updateLoadMoreButton() {
            const button = this.state.container.querySelector('.pplist-load-more-ppl738');
            if (button) {
                button.style.display = this.state.hasMore ? 'inline-flex' : 'none';
            }
        },
        
        // Show/hide loading
        showLoading(append) {
            const skeleton = this.state.container.querySelector('.pplist-skeleton-ppl738');
            const button = this.state.container.querySelector('.pplist-load-more-ppl738');
            
            if (!append && skeleton) {
                skeleton.style.display = 'grid';
            }
            
            if (button) {
                button.classList.add('is-loading');
            }
        },
        
        hideLoading() {
            const skeleton = this.state.container.querySelector('.pplist-skeleton-ppl738');
            const button = this.state.container.querySelector('.pplist-load-more-ppl738');
            
            if (skeleton) {
                skeleton.style.display = 'none';
            }
            
            if (button) {
                button.classList.remove('is-loading');
            }
        },
        
        // Show/hide empty state
        showEmptyState() {
            const emptyState = this.state.container.querySelector('.pplist-empty-state-ppl738');
            const itemsContainer = this.state.container.querySelector('.pplist-items-ppl738');
            
            if (emptyState) {
                emptyState.style.display = 'flex';
            }
            
            if (itemsContainer) {
                itemsContainer.style.display = 'none';
            }
        },
        
        hideEmptyState() {
            const emptyState = this.state.container.querySelector('.pplist-empty-state-ppl738');
            const itemsContainer = this.state.container.querySelector('.pplist-items-ppl738');
            
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            
            if (itemsContainer) {
                itemsContainer.style.display = '';
            }
        },
        
        // Show error
        showError(message) {
            const container = this.state.container.querySelector('.pplist-items-ppl738');
            if (container) {
                container.innerHTML = `
                    <div class="pplist-error-ppl738">
                        <p>${message}</p>
                    </div>
                `;
            }
        },
        
        // Escape HTML
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };
    
    // Initialize when DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        PPList.init();
    });
    
    // Public API
    window.PPList = PPList;
    
})();