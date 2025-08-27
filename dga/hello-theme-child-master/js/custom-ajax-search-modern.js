// Modern Custom Ajax Search JavaScript
jQuery(document).ready(function($) {
    let searchTimeout;
    let currentRequest;
    const searchInput = $('#search_query');
    const searchType = $('#search_type');
    const resultsContainer = $('.search-results-content');
    const searchResults = $('.search-results');
    const skeletonLoader = $('.search-skeleton');
    const searchContainer = $('.custom-search-container');
    
    // Configuration
    const CONFIG = {
        MIN_SEARCH_LENGTH: 2,
        DEBOUNCE_DELAY: 300,
        ERROR_DISPLAY_TIME: 3000,
        ANIMATION_DURATION: 200
    };
    
    // Initialize
    init();
    
    function init() {
        // Set initial state
        hideResults();
        
        // Ensure proper z-index handling
        searchResults.css({
            'position': 'absolute',
            'z-index': '2147483647'
        });
        
        // Force parent containers to have proper z-index
        searchContainer.css({
            'position': 'relative',
            'z-index': '999999'
        });
    }
    
    // Function to show skeleton loader
    function showSkeletonLoader() {
        skeletonLoader.removeClass('hidden');
        resultsContainer.empty();
        searchResults.removeClass('hidden');
    }
    
    // Function to hide skeleton loader
    function hideSkeletonLoader() {
        skeletonLoader.addClass('hidden');
    }
    
    // Function to hide results
    function hideResults() {
        searchResults.addClass('hidden');
        resultsContainer.empty();
        hideSkeletonLoader();
    }
    
    // Function to show results
    function showResults() {
        searchResults.removeClass('hidden').css({
            'opacity': '0',
            'transform': 'translateY(-10px)'
        }).animate({
            'opacity': '1',
            'transform': 'translateY(0)'
        }, CONFIG.ANIMATION_DURATION);
    }
    
    // Function to display error
    function showError(message = 'เกิดข้อผิดพลาดในการค้นหา') {
        hideSkeletonLoader();
        resultsContainer.html(`
            <div class="search-error" role="alert">
                ${message}
            </div>
        `);
        
        setTimeout(hideResults, CONFIG.ERROR_DISPLAY_TIME);
    }
    
    // Function to display no results
    function showNoResults() {
        hideSkeletonLoader();
        resultsContainer.html(`
            <div class="no-results" role="status">
                ไม่พบผลการค้นหา
            </div>
        `);
    }
    
    // Function to render search results
    function renderResults(results) {
        hideSkeletonLoader();
        
        if (!results || results.length === 0) {
            showNoResults();
            return;
        }
        
        const resultsHTML = results.map((item, index) => `
            <a href="${item.permalink}" 
               class="search-result-item" 
               role="option"
               aria-selected="false"
               tabindex="${index === 0 ? '0' : '-1'}"
               data-index="${index}">
                <div class="result-thumbnail">
                    <img src="${item.thumbnail}" 
                         alt="${item.title}" 
                         loading="lazy"
                         onerror="this.src='${customAjaxSearch.fallback_image || '/images/default-thumbnail.jpg'}'">
                </div>
                <div class="result-content">
                    <h3 class="result-title">${item.title}</h3>
                    <div class="result-date" aria-label="วันที่: ${item.date}">
                        ${item.date}
                    </div>
                </div>
            </a>
        `).join('');
        
        resultsContainer.html(resultsHTML);
        showResults();
    }
    
    // Function to perform search
    function performSearch() {
        const query = searchInput.val().trim();
        const type = searchType.val();
        
        // Cancel previous request if it exists
        if (currentRequest && currentRequest.readyState !== 4) {
            currentRequest.abort();
        }
        
        if (query.length < CONFIG.MIN_SEARCH_LENGTH) {
            hideResults();
            return;
        }
        
        // Show loader and ensure dropdown is visible
        showSkeletonLoader();
        
        currentRequest = $.ajax({
            url: customAjaxSearch.ajaxurl,
            type: 'POST',
            data: {
                action: 'custom_ajax_search',
                nonce: customAjaxSearch.nonce,
                search_query: query,
                search_type: type
            },
            success: function(response) {
                if (response.success) {
                    renderResults(response.data);
                } else {
                    showError('ไม่สามารถค้นหาได้ในขณะนี้');
                }
            },
            error: function(xhr, status) {
                if (status !== 'abort') {
                    showError();
                }
            }
        });
    }
    
    // Event Handlers
    
    // Handle input changes with debouncing
    searchInput.on('input', function() {
        clearTimeout(searchTimeout);
        
        const value = $(this).val().trim();
        
        if (value.length === 0) {
            hideResults();
            return;
        }
        
        searchTimeout = setTimeout(performSearch, CONFIG.DEBOUNCE_DELAY);
    });
    
    // Handle search type changes
    searchType.on('change', function() {
        if (searchInput.val().trim().length >= CONFIG.MIN_SEARCH_LENGTH) {
            performSearch();
        }
    });
    
    // Handle keyboard navigation
    searchContainer.on('keydown', function(e) {
        const results = resultsContainer.find('.search-result-item');
        const currentFocus = results.filter(':focus');
        let nextIndex;
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (currentFocus.length === 0) {
                    results.first().focus();
                } else {
                    nextIndex = currentFocus.data('index') + 1;
                    if (nextIndex < results.length) {
                        results.eq(nextIndex).focus();
                    }
                }
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                if (currentFocus.length > 0) {
                    nextIndex = currentFocus.data('index') - 1;
                    if (nextIndex >= 0) {
                        results.eq(nextIndex).focus();
                    } else {
                        searchInput.focus();
                    }
                }
                break;
                
            case 'Escape':
                hideResults();
                searchInput.focus();
                break;
                
            case 'Enter':
                if (currentFocus.length > 0) {
                    window.location.href = currentFocus.attr('href');
                }
                break;
        }
    });
    
    // Handle click outside to close
    $(document).on('click', function(e) {
        if (!searchContainer.is(e.target) && 
            !searchContainer.has(e.target).length) {
            hideResults();
        }
    });
    
    // Handle focus management
    searchInput.on('focus', function() {
        if ($(this).val().trim().length >= CONFIG.MIN_SEARCH_LENGTH) {
            showResults();
        }
    });
    
    // Prevent dropdown from closing when clicking inside
    searchResults.on('click', function(e) {
        e.stopPropagation();
    });
    
    // Handle result item clicks
    resultsContainer.on('click', '.search-result-item', function(e) {
        // Let the browser handle the navigation naturally
        // This ensures proper behavior with ctrl/cmd+click for new tabs
    });
    
    // Accessibility: Announce results to screen readers
    resultsContainer.on('DOMSubtreeModified', function() {
        const resultCount = $(this).find('.search-result-item').length;
        if (resultCount > 0) {
            $(this).attr('aria-label', `พบ ${resultCount} รายการ`);
        }
    });
    
    // Handle window resize
    let resizeTimeout;
    $(window).on('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            if (!searchResults.hasClass('hidden')) {
                // Adjust position if needed
                const containerOffset = searchContainer.offset();
                const containerWidth = searchContainer.outerWidth();
                
                searchResults.css({
                    'left': containerOffset.left,
                    'width': containerWidth
                });
            }
        }, 250);
    });
});