(function($) {
    'use strict';
    
    // Wait for DOM ready
    $(document).ready(function() {
        // Initialize all containers
        $('.dynamic-post-cards-container-dpc734').each(function() {
            const container = $(this);
            initPostCards(container);
        });
        
        // Main initialization function
        function initPostCards(container) {
            const contentContainer = container.find('.dynamic-post-cards-content-dpc734');
            const loadingContainer = container.find('.dynamic-post-cards-loading-dpc734');
            const loadMoreBtn = container.find('.load-more-btn-dpc734');
            const noResultsMessage = container.find('.no-results-message-dpc734');
            
            // State management
            const state = {
                postType: container.data('post-type'),
                postsPerPage: container.data('posts-per-page'),
                category: container.data('category'),
                orderby: container.data('orderby'),
                order: container.data('order'),
                paged: 1,
                maxPages: 1,
                view: container.data('view'),
                isLoading: false,
                search: '',
                year: '',
                searchTimer: null,
                allPosts: []
            };
            
            // Setup mobile filter toggle
            setupMobileFilterToggle();
            
            // Initial load
            loadPosts();
            
            // Setup all event listeners
            setupEventListeners();
            
            // Helper: Truncate text
            function truncateText(text, maxLength = 95) {
                if (!text || text.length <= maxLength) return text;
                
                let truncated = text.substr(0, maxLength);
                const lastSpaceIndex = truncated.lastIndexOf(' ');
                
                if (lastSpaceIndex > 0) {
                    truncated = truncated.substr(0, lastSpaceIndex);
                }
                
                return truncated + '...';
            }
            
            // Helper: Escape HTML
            function escapeHtml(text) {
                const map = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#039;'
                };
                return text.replace(/[&<>"']/g, m => map[m]);
            }
            
            // Setup mobile filter toggle
            function setupMobileFilterToggle() {
                const toggleButtonId = container.attr('id') + '-mobile-toggle';
                const toggleButton = $('<button>', {
                    id: toggleButtonId,
                    class: 'mobile-filter-toggle-dpc734',
                    'aria-label': 'Toggle filters',
                    'aria-expanded': 'false',
                    html: '<span class="dashicons dashicons-admin-generic"></span>'
                });
                
                // Add button to controls
                const controls = container.find('.dynamic-post-cards-controls-dpc734');
                if (controls.length) {
                    controls.prepend(toggleButton);
                    
                    // Handle toggle click
                    toggleButton.on('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const filterControls = container.find('.filter-controls-dpc734');
                        const isActive = filterControls.hasClass('active');
                        
                        filterControls.toggleClass('active');
                        toggleButton.attr('aria-expanded', !isActive);
                    });
                    
                    // Close on outside click
                    $(document).on('click.dpc734', function(event) {
                        if (!$(event.target).closest('.filter-controls-dpc734, .mobile-filter-toggle-dpc734', container).length) {
                            container.find('.filter-controls-dpc734').removeClass('active');
                            toggleButton.attr('aria-expanded', 'false');
                        }
                    });
                }
            }
            
            // Setup event listeners
            function setupEventListeners() {
                // View mode toggle
                container.find('.view-mode-btn-dpc734').on('click', function() {
                    const viewMode = $(this).data('view');
                    
                    // Update active button
                    container.find('.view-mode-btn-dpc734').removeClass('active');
                    $(this).addClass('active');
                    
                    // Update container class
                    contentContainer.removeClass('card-view list-view').addClass(viewMode + '-view');
                    
                    // Update state
                    state.view = viewMode;
                    
                    // Re-render current posts
                    if (state.allPosts.length > 0) {
                        renderPosts(state.allPosts.slice(0, state.paged * state.postsPerPage));
                    }
                });
                
                // Sorting
                container.find('.sorting-select-dpc734').on('change', function() {
                    const sortValue = $(this).val();
                    const [sortBy, sortOrder] = sortValue.split('-');
                    
                    state.orderby = sortBy;
                    state.order = sortOrder.toUpperCase();
                    state.paged = 1;
                    state.allPosts = [];
                    
                    loadPosts();
                });
                
                // Search with debounce
                container.find('.search-input-dpc734').on('input', function() {
                    const searchTerm = $(this).val().trim();
                    
                    // Clear existing timer
                    if (state.searchTimer) {
                        clearTimeout(state.searchTimer);
                    }
                    
                    // Set new timer
                    state.searchTimer = setTimeout(function() {
                        if (state.search !== searchTerm) {
                            state.search = searchTerm;
                            state.paged = 1;
                            state.allPosts = [];
                            loadPosts();
                        }
                    }, 500); // 500ms debounce
                });
                
                // Enter key on search
                container.find('.search-input-dpc734').on('keypress', function(e) {
                    if (e.which === 13) { // Enter key
                        e.preventDefault();
                        const searchTerm = $(this).val().trim();
                        
                        if (state.searchTimer) {
                            clearTimeout(state.searchTimer);
                        }
                        
                        state.search = searchTerm;
                        state.paged = 1;
                        state.allPosts = [];
                        loadPosts();
                    }
                });
                
                // Year filter
                container.find('.year-filter-select-dpc734').on('change', function() {
                    const yearValue = $(this).val();
                    
                    state.year = yearValue;
                    state.paged = 1;
                    state.allPosts = [];
                    
                    loadPosts();
                });
                
                // Load more button
                loadMoreBtn.on('click', function() {
                    if (state.paged < state.maxPages && !state.isLoading) {
                        state.paged++;
                        loadPosts(true); // append mode
                    }
                });
            }
            
            // Load posts via AJAX
            function loadPosts(append = false) {
                if (state.isLoading) return;
                
                state.isLoading = true;
                
                // Hide no results message
                noResultsMessage.hide();
                
                // Show loading state
                if (!append) {
                    contentContainer.empty();
                    loadingContainer.show();
                    // Announce loading for screen readers
                    noResultsMessage.text(dynamic_post_cards_params.loading_text);
                } else {
                    loadMoreBtn.text(dynamic_post_cards_params.loading_text).prop('disabled', true);
                }
                
                // AJAX request
                $.ajax({
                    url: dynamic_post_cards_params.ajax_url,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        action: 'dynamic_post_cards_load_posts',
                        nonce: dynamic_post_cards_params.nonce,
                        post_type: state.postType,
                        posts_per_page: state.postsPerPage,
                        paged: state.paged,
                        category: state.category,
                        orderby: state.orderby,
                        order: state.order,
                        search: state.search,
                        year: state.year
                    },
                    success: function(response) {
                        if (response.success && response.data) {
                            const data = response.data;
                            
                            // Store posts
                            if (append) {
                                state.allPosts = state.allPosts.concat(data.posts);
                            } else {
                                state.allPosts = data.posts;
                            }
                            
                            state.maxPages = data.max_pages;
                            
                            // Render posts
                            renderPosts(data.posts, append);
                            
                            // Handle no results
                            if (data.posts.length === 0 && !append) {
                                noResultsMessage.text(dynamic_post_cards_params.no_results_text).show();
                            } else {
                                noResultsMessage.hide();
                            }
                            
                            // Handle load more button
                            if (state.paged < state.maxPages) {
                                loadMoreBtn.text(dynamic_post_cards_params.load_more_text)
                                    .show()
                                    .prop('disabled', false);
                            } else {
                                loadMoreBtn.hide();
                            }
                        } else {
                            handleError();
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('AJAX error:', error);
                        handleError();
                    },
                    complete: function() {
                        state.isLoading = false;
                        loadingContainer.hide();
                    }
                });
            }
            
            // Handle errors
            function handleError() {
                if (!state.allPosts.length) {
                    contentContainer.empty();
                    noResultsMessage.text(dynamic_post_cards_params.error_text).show();
                }
                loadMoreBtn.text(dynamic_post_cards_params.load_more_text).prop('disabled', false);
            }
            
            // Render posts to DOM
            function renderPosts(posts, append = false) {
                if (!append) {
                    contentContainer.empty();
                }
                
                // Check if no posts
                if (!Array.isArray(posts) || posts.length === 0) {
                    if (!append) {
                        noResultsMessage.show();
                    }
                    return;
                }
                
                // Hide no results message
                noResultsMessage.hide();
                
                // Create HTML for each post
                posts.forEach(function(post) {
                    let postHtml = '';
                    
                    // Sanitize data
                    const safeTitle = escapeHtml(post.title);
                    const truncatedTitle = truncateText(safeTitle, 95);
                    const safeExcerpt = escapeHtml(post.excerpt);
                    const safeDate = escapeHtml(post.date);
                    const safeVisitorCount = post.visitor_count || '';
                    
                    // Create badge HTML
                    let badgeHtml = '';
                    if (post.at_docnum_2) {
                        badgeHtml = '<div class="doc-badge-dpc734 gold-badge">' +
                            'เลขที่ มรด. ' + escapeHtml(post.at_docnum_2) + '</div>';
                    } else if (post.at_docnum_1) {
                        badgeHtml = '<div class="doc-badge-dpc734 orange-badge">' +
                            'เลขที่ มสพร. ' + escapeHtml(post.at_docnum_1) + '</div>';
                    }
                    
                    // Build HTML based on view mode
                    if (state.view === 'card') {
                        postHtml = `
                            <article class="card-item-dpc734">
                                <a href="${post.permalink}" class="card-image-link-dpc734">
                                    <img src="${post.featured_image}" 
                                         alt="${safeTitle}" 
                                         loading="lazy" 
                                         decoding="async" 
                                         class="card-image-dpc734">
                                    ${badgeHtml}
                                </a>
                                <div class="card-meta-dpc734">
                                    <span class="post-date">${safeDate}</span>
                                    ${safeVisitorCount ? '<span class="visitor-count">' + safeVisitorCount + '</span>' : ''}
                                </div>
                                <h3 class="card-title-dpc734" title="${safeTitle}">
                                    <a href="${post.permalink}">${truncatedTitle}</a>
                                </h3>
                                <div class="card-excerpt-dpc734">${safeExcerpt}</div>
                                <div class="card-footer-dpc734">
                                    <a href="${post.permalink}" class="read-more-btn-dpc734">อ่านต่อ</a>
                                </div>
                            </article>
                        `;
                    } else {
                        postHtml = `
                            <article class="list-item-dpc734">
                                <a href="${post.permalink}" class="list-image-link-dpc734">
                                    <img src="${post.featured_image}" 
                                         alt="${safeTitle}" 
                                         loading="lazy" 
                                         decoding="async" 
                                         class="list-image-dpc734">
                                    ${badgeHtml}
                                </a>
                                <div class="list-content-dpc734">
                                    <h3 class="list-title-dpc734" title="${safeTitle}">
                                        <a href="${post.permalink}">${truncatedTitle}</a>
                                    </h3>
                                    <div class="list-meta-dpc734">
                                        <span class="post-date">${safeDate}</span>
                                        ${safeVisitorCount ? '<span class="visitor-count">' + safeVisitorCount + '</span>' : ''}
                                    </div>
                                    <div class="list-excerpt-dpc734">${safeExcerpt}</div>
                                    <div class="list-footer-dpc734">
                                        <a href="${post.permalink}" class="read-more-btn-dpc734">อ่านต่อ</a>
                                    </div>
                                </div>
                            </article>
                        `;
                    }
                    
                    contentContainer.append(postHtml);
                });
                
                // Smooth scroll to new content if appending
                if (append && posts.length > 0) {
                    const offset = contentContainer.children().eq(-posts.length).offset();
                    if (offset) {
                        $('html, body').animate({
                            scrollTop: offset.top - 100
                        }, 500);
                    }
                }
            }
        }
    });
    
})(jQuery);