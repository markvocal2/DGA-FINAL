// Enhanced Search System JavaScript with Custom Fields Support
jQuery(document).ready(function($) {
    'use strict';
    
    // Configuration
    const CONFIG = {
        MIN_SEARCH_LENGTH: 2,
        MAX_SEARCH_LENGTH: 100,
        DEBOUNCE_DELAY: 300,
        ERROR_DISPLAY_TIME: 5000,
        ANIMATION_DURATION: 200,
        KEYBOARD_DELAY: 50
    };
    
    // State management
    let searchTimeout;
    let currentRequest;
    let activeInstance = null;
    
    // Initialize all search instances
    $('.custom-search-container-mxz789').each(function() {
        initializeSearchInstance($(this));
    });
    
    /**
     * Initialize search instance
     */
    function initializeSearchInstance($container) {
        const instance = $container.data('instance') || 'default';
        const maxResults = parseInt($container.data('max-results')) || 10;
        const liveSearch = $container.data('live-search') === 'true';
        const enableHighlight = $container.data('highlight') === 'true';
        
        // Get DOM elements
        const elements = {
            container: $container,
            form: $container.find('.custom-search-form-mxz789'),
            input: $container.find('.search-input-mxz789'),
            typeSelect: $container.find('.search-type-select-mxz789'),
            button: $container.find('.search-button-mxz789'),
            resultsContainer: $container.find('.search-results-content-mxz789'),
            searchResults: $container.find('.search-results-mxz789'),
            skeletonLoader: $container.find('.search-skeleton-mxz789'),
            searchStatus: $container.find('[id^="search-status-"]')
        };
        
        // Instance data
        const instanceData = {
            id: instance,
            elements: elements,
            config: {
                maxResults: maxResults,
                liveSearch: liveSearch,
                enableHighlight: enableHighlight
            },
            state: {
                isSearching: false,
                hasResults: false,
                selectedIndex: -1,
                lastQuery: '',
                currentResults: []
            }
        };
        
        // Store instance
        $container.data('searchInstance', instanceData);
        
        // Initialize
        initializeInstance(instanceData);
    }
    
    /**
     * Initialize instance features
     */
    function initializeInstance(instance) {
        const { elements } = instance;
        
        // Set initial state
        hideResults(instance);
        setupEventListeners(instance);
        
        console.log('Search instance initialized:', instance.id);
    }
    
    /**
     * Setup event listeners
     */
    function setupEventListeners(instance) {
        const { elements, config } = instance;
        
        // Form submission
        elements.form.on('submit', function(e) {
            e.preventDefault();
            handleSearch(instance);
        });
        
        // Live search on input
        if (config.liveSearch) {
            elements.input.on('input', function() {
                handleInputChange(instance);
            });
        }
        
        // Search type change
        elements.typeSelect.on('change', function() {
            if (elements.input.val().trim().length >= CONFIG.MIN_SEARCH_LENGTH) {
                performSearch(instance);
            }
        });
        
        // Button click
        elements.button.on('click', function(e) {
            e.preventDefault();
            handleSearch(instance);
        });
        
        // Keyboard navigation
        setupKeyboardNavigation(instance);
        
        // Focus management
        setupFocusManagement(instance);
        
        // Outside click
        $(document).on('click', function(e) {
            if (!elements.container.is(e.target) && 
                !elements.container.has(e.target).length) {
                hideResults(instance);
            }
        });
    }
    
    /**
     * Handle input changes
     */
    function handleInputChange(instance) {
        const { elements, state } = instance;
        
        clearTimeout(searchTimeout);
        
        const value = elements.input.val().trim();
        state.lastQuery = value;
        
        if (value.length === 0) {
            hideResults(instance);
            return;
        }
        
        if (value.length >= CONFIG.MIN_SEARCH_LENGTH) {
            updateStatus(instance, customAjaxSearch.messages.searching);
            searchTimeout = setTimeout(() => performSearch(instance), CONFIG.DEBOUNCE_DELAY);
        }
    }
    
    /**
     * Handle search submission
     */
    function handleSearch(instance) {
        const { elements } = instance;
        const query = elements.input.val().trim();
        
        if (query.length < CONFIG.MIN_SEARCH_LENGTH) {
            const message = customAjaxSearch.messages.search_too_short.replace('%d', CONFIG.MIN_SEARCH_LENGTH);
            showError(instance, message);
            return;
        }
        
        if (query.length > CONFIG.MAX_SEARCH_LENGTH) {
            showError(instance, customAjaxSearch.messages.search_too_long);
            return;
        }
        
        performSearch(instance);
    }
    
    /**
     * Perform AJAX search
     */
    function performSearch(instance) {
        const { elements, config, state } = instance;
        const query = elements.input.val().trim();
        const type = elements.typeSelect.val() || 'article';
        
        // Cancel previous request
        if (currentRequest && currentRequest.readyState !== 4) {
            currentRequest.abort();
        }
        
        if (query.length < CONFIG.MIN_SEARCH_LENGTH) {
            hideResults(instance);
            return;
        }
        
        // Set searching state
        state.isSearching = true;
        activeInstance = instance;
        
        // Show loader
        showSkeletonLoader(instance);
        updateStatus(instance, customAjaxSearch.messages.searching);
        
        // Prepare request
        const requestData = {
            action: 'custom_ajax_search',
            nonce: customAjaxSearch.nonce,
            search_query: query,
            search_type: type,
            max_results: config.maxResults,
            enable_highlight: config.enableHighlight
        };
        
        // Make request
        currentRequest = $.ajax({
            url: customAjaxSearch.ajaxurl,
            type: 'POST',
            data: requestData,
            timeout: 10000,
            success: function(response) {
                state.isSearching = false;
                
                if (response.success && response.data) {
                    renderResults(instance, response.data);
                } else {
                    const errorMessage = response.data?.message || customAjaxSearch.messages.error;
                    showError(instance, errorMessage);
                }
            },
            error: function(xhr, status, error) {
                state.isSearching = false;
                
                if (status !== 'abort') {
                    showError(instance, customAjaxSearch.messages.error);
                }
            }
        });
    }
    
    /**
     * Render search results with custom fields support
     */
    function renderResults(instance, data) {
    const { elements, state, config } = instance;
    const { results, total, query } = data;
    
    hideSkeletonLoader(instance);
    
    if (!results || results.length === 0) {
        showNoResults(instance);
        return;
    }
    
    state.currentResults = results;
    state.selectedIndex = -1;
    
    // Build HTML with enhanced badges
    const resultsHTML = results.map((item, index) => {
        const title = config.enableHighlight && item.title ? item.title : item.title_plain;
        const excerpt = config.enableHighlight && item.excerpt ? item.excerpt : item.excerpt;
        const docNumbers = item.doc_numbers || '';
        const matchBadge = item.match_badge || '';
        
        // Create title with match badge
        const titleWithBadge = matchBadge ? 
            `${title}${matchBadge}` : title;
        
        return `
            <div role="option" 
                 class="search-result-item-mxz789" 
                 aria-selected="false"
                 tabindex="-1"
                 data-index="${index}"
                 data-url="${escapeHtml(item.permalink)}"
                 data-title="${escapeHtml(item.title_plain || item.title)}"
                 data-found-in="${(item.found_in || []).join(',')}"
                 id="result-${instance.id}-${index}">
                <div class="result-thumbnail-mxz789">
                    <img src="${escapeHtml(item.thumbnail)}" 
                         alt="" 
                         loading="lazy"
                         onerror="this.src='${customAjaxSearch.fallback_image}'">
                </div>
                <div class="result-content-mxz789">
                    <h3 class="result-title-mxz789">${titleWithBadge}</h3>
                    ${docNumbers ? `<div class="doc-badges-container-mxz789">${docNumbers}</div>` : ''}
                    <div class="result-date-mxz789">📅 ${escapeHtml(item.date)}</div>
                    ${excerpt ? `<div class="result-excerpt-mxz789">${excerpt}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    elements.resultsContainer.html(resultsHTML);
    showResults(instance);
    
    // Update status with enhanced message
    const statusMessage = customAjaxSearch.messages.results_found.replace('%d', total);
    updateStatus(instance, statusMessage);
    announceToScreenReader(statusMessage);
    
    setupResultClickHandlers(instance);
}
    
    /**
     * Setup result click handlers
     */
    function setupResultClickHandlers(instance) {
        const { elements } = instance;
        
        elements.resultsContainer.find('.search-result-item-mxz789').each(function() {
            const $item = $(this);
            const url = $item.data('url');
            const title = $item.data('title');
            
            // Click handler
            $item.on('click', function(e) {
                e.preventDefault();
                navigateToResult(url, e, title);
            });
            
            // Keyboard support
            $item.on('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigateToResult(url, e, title);
                }
            });
            
            // Hover effect
            $item.on('mouseenter', function() {
                const index = parseInt($(this).data('index'));
                selectResult(instance, index, false);
            });
        });
    }
    
    /**
     * Navigate to result
     */
    function navigateToResult(url, event, title) {
        if (!url || url === '#') {
            announceToScreenReader(customAjaxSearch.messages.link_unavailable);
            return;
        }
        
        const message = customAjaxSearch.messages.opening_link.replace('%s', title);
        announceToScreenReader(message);
        
        // Handle modifier keys
        if (event.ctrlKey || event.metaKey) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            window.location.href = url;
        }
    }
    
    /**
     * Keyboard navigation setup
     */
    function setupKeyboardNavigation(instance) {
        const { elements } = instance;
        
        // Input keyboard handling
        elements.input.on('keydown', function(e) {
            const results = elements.resultsContainer.find('.search-result-item-mxz789');
            
            switch(e.key) {
                case 'ArrowDown':
                    if (results.length > 0) {
                        e.preventDefault();
                        selectResult(instance, 0);
                        results.first().focus();
                    }
                    break;
                    
                case 'Escape':
                    hideResults(instance);
                    break;
            }
        });
        
        // Results keyboard handling
        elements.resultsContainer.on('keydown', '.search-result-item-mxz789', function(e) {
            const $current = $(this);
            const currentIndex = parseInt($current.data('index'));
            const results = elements.resultsContainer.find('.search-result-item-mxz789');
            
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (currentIndex < results.length - 1) {
                        selectResult(instance, currentIndex + 1);
                        results.eq(currentIndex + 1).focus();
                    }
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex > 0) {
                        selectResult(instance, currentIndex - 1);
                        results.eq(currentIndex - 1).focus();
                    } else {
                        elements.input.focus();
                    }
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    hideResults(instance);
                    elements.input.focus();
                    break;
            }
        });
    }
    
    /**
     * Select result
     */
    function selectResult(instance, index, announce = true) {
        const { elements, state } = instance;
        const results = elements.resultsContainer.find('.search-result-item-mxz789');
        
        if (index < 0 || index >= results.length) return;
        
        // Clear previous selection
        results.attr('aria-selected', 'false').attr('tabindex', '-1');
        
        // Select new result
        const selectedResult = results.eq(index);
        selectedResult.attr('aria-selected', 'true').attr('tabindex', '0');
        
        // Update state
        state.selectedIndex = index;
        
        // Announce if needed
        if (announce) {
            const title = selectedResult.data('title');
            const message = customAjaxSearch.messages.selected_result.replace('%s', title);
            announceToScreenReader(message);
        }
    }
    
    /**
     * Focus management
     */
    function setupFocusManagement(instance) {
        const { elements } = instance;
        
        elements.input.on('focus', function() {
            const query = $(this).val().trim();
            if (query.length >= CONFIG.MIN_SEARCH_LENGTH && 
                elements.resultsContainer.children().length > 0) {
                showResults(instance);
            }
        });
    }
    
    /**
     * Show skeleton loader
     */
    function showSkeletonLoader(instance) {
        const { elements } = instance;
        elements.skeletonLoader.removeClass('hidden-mxz789');
        elements.resultsContainer.empty();
        elements.searchResults.attr('aria-expanded', 'true');
    }
    
    /**
     * Hide skeleton loader
     */
    function hideSkeletonLoader(instance) {
        const { elements } = instance;
        elements.skeletonLoader.addClass('hidden-mxz789');
    }
    
    /**
     * Show results
     */
    function showResults(instance) {
        const { elements, state } = instance;
        elements.searchResults.attr('aria-expanded', 'true');
        elements.input.attr('aria-expanded', 'true');
        state.hasResults = true;
    }
    
    /**
     * Hide results
     */
    function hideResults(instance) {
        const { elements, state } = instance;
        elements.searchResults.attr('aria-expanded', 'false');
        elements.input.attr('aria-expanded', 'false');
        elements.resultsContainer.empty();
        hideSkeletonLoader(instance);
        updateStatus(instance, '');
        state.hasResults = false;
        state.selectedIndex = -1;
        state.currentResults = [];
    }
    
    /**
     * Show no results message
     */
    function showNoResults(instance) {
        const { elements } = instance;
        hideSkeletonLoader(instance);
        
        const noResultsHTML = `
            <div class="no-results-mxz789" role="status">
                ${customAjaxSearch.messages.no_results}
                <br><small>ลองเปลี่ยนคำค้นหาหรือประเภทการค้นหา</small>
            </div>
        `;
        
        elements.resultsContainer.html(noResultsHTML);
        showResults(instance);
        updateStatus(instance, customAjaxSearch.messages.no_results);
    }
    
    /**
     * Show error message
     */
    function showError(instance, message) {
        const { elements } = instance;
        hideSkeletonLoader(instance);
        
        const errorHTML = `
            <div class="search-error-mxz789" role="alert">
                <strong>ข้อผิดพลาด:</strong> ${escapeHtml(message)}
            </div>
        `;
        
        elements.resultsContainer.html(errorHTML);
        showResults(instance);
        announceToScreenReader(message);
        
        // Auto-hide error
        setTimeout(() => hideResults(instance), CONFIG.ERROR_DISPLAY_TIME);
    }
    
    /**
     * Update status for screen readers
     */
    function updateStatus(instance, message) {
        const { elements } = instance;
        elements.searchStatus.text(message);
    }
    
    /**
     * Announce to screen readers
     */
    function announceToScreenReader(message) {
        const $announcement = $('<div>')
            .addClass('accessible-announcement-mxz789')
            .attr({
                'aria-live': 'polite',
                'aria-atomic': 'true',
                'role': 'status'
            })
            .text(message);
        
        $('body').append($announcement);
        
        setTimeout(function() {
            $announcement.remove();
        }, 1000);
    }
    
    /**
     * Escape HTML
     */
    function escapeHtml(text) {
        if (typeof text !== 'string') return '';
        
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return text.replace(/[&<>"']/g, function(m) { 
            return map[m]; 
        });
    }
    
    /**
     * Handle window resize
     */
    let resizeTimeout;
    $(window).on('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            // Adjust results position if needed
            $('.search-results-mxz789[aria-expanded="true"]').each(function() {
                const $results = $(this);
                const $container = $results.closest('.custom-search-container-mxz789');
                
                // Recalculate position
                const containerWidth = $container.outerWidth();
                $results.css('width', containerWidth);
            });
        }, 250);
    });
    
    // Initialize message
    console.log('Enhanced Search System with Custom Fields initialized');
});