/**
 * Standard Loop Post - AJAX functionality with WCAG 2.1 AA Compliance
 * Handles filtering, sorting, view toggling, and accessibility features
 * Updated: เพิ่ม accessibility features และการจัดการ focus management
 */
(function($) {
    'use strict';
    
    // Store current filter state
    let filterState = {
        search: '',
        year: '',
        customField: '',
        taxonomyTerm: '',
        sort: 'newest',
        view: 'table',
        paged: 1
    };
    
    // Accessibility utilities
    const a11yUtils = {
        // Announce changes to screen readers
        announceToScreenReader: function(message, priority = 'polite') {
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', priority);
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = 'sr-only';
            announcement.textContent = message;
            
            document.body.appendChild(announcement);
            
            // Remove after announcement
            setTimeout(() => {
                document.body.removeChild(announcement);
            }, 1000);
        },
        
        // Manage focus for better keyboard navigation
        manageFocus: function($container, focusTarget = null) {
            if (focusTarget) {
                focusTarget.focus();
            } else {
                // Focus on first interactive element
                const $firstInteractive = $container.find('button, input, select, a, [tabindex="0"]').first();
                if ($firstInteractive.length) {
                    $firstInteractive.focus();
                }
            }
        },
        
        // Update ARIA labels dynamically
        updateAriaLabels: function($container, resultCount, currentPage, totalPages) {
            const $resultsContainer = $container.find('.std-looppost-posts-container');
            const $pagination = $container.find('.std-looppost-pagination');
            
            // Update results container ARIA label
            $resultsContainer.attr('aria-label', 
                `ผลการค้นหา: พบ ${resultCount} รายการ หน้าที่ ${currentPage} จาก ${totalPages}`
            );
            
            // Update pagination ARIA label
            $pagination.attr('aria-label', `การนำทางหน้า หน้าปัจจุบัน ${currentPage} จาก ${totalPages}`);
        },
        
        // Add loading state announcements
        announceLoadingState: function(isLoading, $container) {
            const $loadingRegion = $container.find('.std-looppost-loading-announcement');
            
            if (!$loadingRegion.length) {
                const $announcement = $('<div class="std-looppost-loading-announcement sr-only" aria-live="assertive" aria-atomic="true"></div>');
                $container.append($announcement);
            }
            
            const message = isLoading ? 'กำลังโหลดข้อมูล...' : 'โหลดข้อมูลเสร็จสิ้น';
            $container.find('.std-looppost-loading-announcement').text(message);
        }
    };
    
    // Initialize on document ready
    $(document).ready(function() {
        // Add CSS class for no-JS fallback
        $('html').removeClass('no-js').addClass('js');
        
        // Initialize event handlers for each looppost container
        $('.std-looppost-container').each(function() {
            initLoopPost($(this));
            loadPosts($(this));
        });
        
        // Add global keyboard shortcuts
        $(document).on('keydown', function(e) {
            // ALT + S: Focus on search input
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                $('.std-looppost-search-input').first().focus();
                a11yUtils.announceToScreenReader('โฟกัสที่ช่องค้นหา');
            }
            
            // ALT + F: Focus on filters
            if (e.altKey && e.key === 'f') {
                e.preventDefault();
                $('.std-looppost-year-select').first().focus();
                a11yUtils.announceToScreenReader('โฟกัสที่ตัวกรอง');
            }
        });
    });
    
    /**
     * Initialize a loop post container
     * @param {Object} $container - jQuery object of the container
     */
    function initLoopPost($container) {
        // Add accessibility attributes
        setupAccessibilityAttributes($container);
        
        // Load posts on custom event
        $container.on('std_looppost_load', function() {
            loadPosts($container);
        });
        
        // Search input handling (with debounce and accessibility)
        let searchTimer = null;
        const $searchInput = $container.find('.std-looppost-search-input');
        
        $searchInput.on('input', function() {
            const $this = $(this);
            const searchValue = $this.val();
            
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function() {
                filterState.search = searchValue;
                filterState.paged = 1;
                
                // Announce search to screen reader
                if (searchValue.length > 0) {
                    a11yUtils.announceToScreenReader(`ค้นหา: ${searchValue}`);
                } else {
                    a11yUtils.announceToScreenReader('ล้างการค้นหา');
                }
                
                loadPosts($container);
            }, 500);
        });
        
        // Add search instructions
        $searchInput.attr('aria-describedby', 'search-instructions-' + $container.attr('id'));
        $searchInput.after('<div id="search-instructions-' + $container.attr('id') + '" class="sr-only">พิมพ์คำค้นหาและรอ 0.5 วินาทีเพื่อค้นหาอัตโนมัติ</div>');
        
        // Year filter with accessibility
        $container.find('.std-looppost-year-select').on('change', function() {
            const selectedYear = $(this).val();
            const selectedText = $(this).find('option:selected').text();
            
            filterState.year = selectedYear;
            filterState.paged = 1;
            
            a11yUtils.announceToScreenReader(`เลือกปี: ${selectedText}`);
            loadPosts($container);
        });
        
        // Taxonomy filter with accessibility
        $container.find('.std-looppost-taxonomy-select').on('change', function() {
            const termSlug = $(this).val();
            const selectedText = $(this).find('option:selected').text();
            
            filterState.taxonomyTerm = termSlug;
            filterState.paged = 1;
            
            a11yUtils.announceToScreenReader(`เลือกประเภทมาตรฐาน: ${selectedText}`);
            loadPosts($container);
        });
        
        // Custom field filters (legacy support)
        $container.find('.std-looppost-filter-badge').on('click', function() {
            const $badge = $(this);
            const filterValue = $badge.data('filter');
            const badgeText = $badge.text();
            
            if ($badge.hasClass('active')) {
                $badge.removeClass('active');
                filterState.customField = '';
                a11yUtils.announceToScreenReader(`ยกเลิกตัวกรอง: ${badgeText}`);
            } else {
                $container.find('.std-looppost-filter-badge').removeClass('active');
                $badge.addClass('active');
                filterState.customField = filterValue;
                a11yUtils.announceToScreenReader(`เลือกตัวกรอง: ${badgeText}`);
            }
            
            filterState.paged = 1;
            loadPosts($container);
        });
        
        // Reset filters with accessibility
        $container.find('.std-looppost-filter-reset').on('click', function() {
            // Reset all form elements
            $container.find('.std-looppost-filter-badge').removeClass('active');
            $container.find('.std-looppost-year-select').val('');
            $container.find('.std-looppost-taxonomy-select').val('');
            $container.find('.std-looppost-search-input').val('');
            
            // Reset filter state
            filterState.search = '';
            filterState.year = '';
            filterState.customField = '';
            filterState.taxonomyTerm = '';
            filterState.paged = 1;
            
            a11yUtils.announceToScreenReader('รีเซ็ตตัวกรองทั้งหมดแล้ว');
            loadPosts($container);
        });
        
        // Sort select with accessibility
        $container.find('.std-looppost-sort-select').on('change', function() {
            const sortValue = $(this).val();
            const sortText = $(this).find('option:selected').text();
            
            filterState.sort = sortValue;
            a11yUtils.announceToScreenReader(`เรียงลำดับ: ${sortText}`);
            loadPosts($container);
        });
        
        // View toggle with enhanced accessibility
        $container.find('.std-looppost-view-btn').on('click', function() {
            const $btn = $(this);
            const view = $btn.data('view');
            const viewText = $btn.attr('title') || (view === 'card' ? 'มุมมองการ์ด' : 'มุมมองตาราง');
            
            if ($btn.hasClass('active')) {
                return;
            }
            
            // Update active button and ARIA states
            $container.find('.std-looppost-view-btn').removeClass('active').attr('aria-pressed', 'false');
            $btn.addClass('active').attr('aria-pressed', 'true');
            
            // Update view
            const $postsContainer = $container.find('.std-looppost-posts-container');
            $postsContainer.removeClass('card-view table-view').addClass(view + '-view');
            filterState.view = view;
            
            // Handle table header visibility
            const $tableHeader = $container.find('.std-looppost-table-header');
            if (view === 'table') {
                if ($tableHeader.length === 0) {
                    $postsContainer.before(createTableHeader());
                } else {
                    $tableHeader.show();
                }
            } else {
                $tableHeader.hide();
            }
            
            a11yUtils.announceToScreenReader(`เปลี่ยนเป็น${viewText}`);
            loadPosts($container);
        });
        
        // Enhanced keyboard navigation for table rows
        $container.on('keydown', '.std-looppost-table-row', function(e) {
            const $currentRow = $(this);
            const $allRows = $container.find('.std-looppost-table-row');
            const currentIndex = $allRows.index($currentRow);
            
            switch(e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    const postUrl = $currentRow.find('.std-looppost-table-link').attr('href');
                    if (postUrl) {
                        window.location.href = postUrl;
                    }
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    if (currentIndex < $allRows.length - 1) {
                        $allRows.eq(currentIndex + 1).focus();
                    }
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex > 0) {
                        $allRows.eq(currentIndex - 1).focus();
                    }
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    $allRows.first().focus();
                    break;
                    
                case 'End':
                    e.preventDefault();
                    $allRows.last().focus();
                    break;
            }
        });
        
        // Load more button with accessibility
        $container.find('.std-looppost-load-more').on('click', function() {
            const $btn = $(this);
            $btn.attr('aria-label', 'กำลังโหลดเพิ่ม...');
            
            filterState.paged++;
            loadPosts($container, true);
        });
        
        // Pagination with enhanced keyboard support
        $container.on('click', '.std-looppost-page-number', function(e) {
            e.preventDefault();
            
            const $pageBtn = $(this);
            const page = $pageBtn.data('page');
            
            if (page && !$pageBtn.hasClass('current')) {
                filterState.paged = page;
                
                a11yUtils.announceToScreenReader(`ไปหน้าที่ ${page}`);
                loadPosts($container);
                
                // Scroll to top of container
                $('html, body').animate({
                    scrollTop: $container.offset().top - 50
                }, 500);
                
                // Focus management after content loads
                setTimeout(() => {
                    a11yUtils.manageFocus($container, $container.find('.std-looppost-posts-container'));
                }, 100);
            }
        });
        
        // Enhanced hover and focus effects
        $container.on('mouseenter focusin', '.std-looppost-table-row', function() {
            $(this).addClass('hover');
        }).on('mouseleave focusout', '.std-looppost-table-row', function() {
            $(this).removeClass('hover');
        });
        
        // Click handler for table rows
        $container.on('click', '.std-looppost-table-row', function(e) {
            if ($(e.target).closest('a').length === 0) {
                const postUrl = $(this).find('.std-looppost-table-link').attr('href');
                if (postUrl) {
                    window.location.href = postUrl;
                }
            }
        });
    }
    
    /**
     * Setup accessibility attributes for the container
     * @param {Object} $container - jQuery object of the container
     */
    function setupAccessibilityAttributes($container) {
        // Add ARIA roles and labels
        $container.attr('role', 'region');
        $container.attr('aria-label', 'ระบบค้นหาและแสดงมาตรฐาน');
        
        // Setup search region
        const $searchRegion = $container.find('.std-looppost-controls');
        $searchRegion.attr('role', 'search');
        $searchRegion.attr('aria-label', 'ควบคุมการค้นหาและตัวกรอง');
        
        // Setup results region
        const $resultsRegion = $container.find('.std-looppost-posts-container');
        $resultsRegion.attr('role', 'region');
        $resultsRegion.attr('aria-live', 'polite');
        $resultsRegion.attr('aria-label', 'ผลการค้นหา');
        
        // Setup view toggle buttons
        $container.find('.std-looppost-view-btn').each(function() {
            const $btn = $(this);
            const view = $btn.data('view');
            const isActive = $btn.hasClass('active');
            
            $btn.attr('role', 'button');
            $btn.attr('aria-pressed', isActive ? 'true' : 'false');
            
            if (!$btn.attr('aria-label')) {
                const label = view === 'card' ? 'แสดงเป็นมุมมองการ์ด' : 'แสดงเป็นมุมมองตาราง';
                $btn.attr('aria-label', label);
            }
        });
        
        // Setup pagination region
        const $paginationRegion = $container.find('.std-looppost-pagination');
        $paginationRegion.attr('role', 'navigation');
        $paginationRegion.attr('aria-label', 'การนำทางหน้า');
    }
    
    /**
     * Create table header with accessibility
     */
    function createTableHeader() {
        return '<div class="std-looppost-table-header" role="row">' +
               '<div role="columnheader">เลขที่</div>' +
               '<div role="columnheader">ชื่อมาตรฐาน</div>' +
               '<div role="columnheader">วัตถุประสงค์</div>' +
               '</div>';
    }
    
    /**
     * Load posts via AJAX with accessibility support
     * @param {Object} $container - jQuery object of the container
     * @param {boolean} append - Whether to append new posts or replace existing ones
     */
    function loadPosts($container, append = false) {
        const $postsContainer = $container.find('.std-looppost-posts-container');
        const $skeleton = $container.find('.std-looppost-skeleton');
        const $pagination = $container.find('.std-looppost-pagination');
        const postsPerPage = $container.data('posts-per-page') || 15;
        
        // Announce loading state
        a11yUtils.announceLoadingState(true, $container);
        
        // Add loading class and ARIA state
        $postsContainer.addClass('loading');
        $postsContainer.attr('aria-busy', 'true');
        
        // Show skeleton loader if not appending
        if (!append) {
            if (filterState.view === 'table') {
                $postsContainer.find('.std-looppost-table-row').hide();
                $skeleton.find('.std-looppost-skeleton-cards').hide();
                $skeleton.find('.std-looppost-skeleton-table').show();
            } else {
                $postsContainer.find('.std-looppost-item').hide();
                $skeleton.find('.std-looppost-skeleton-table').hide();
                $skeleton.find('.std-looppost-skeleton-cards').show();
            }
            $skeleton.show();
        } else {
            $pagination.addClass('std-looppost-loading');
        }
        
        // Prepare AJAX data
        const data = {
            action: 'std_looppost_load',
            nonce: stdLoopPost.nonce,
            search: filterState.search,
            year: filterState.year,
            custom_field: filterState.customField,
            taxonomy_term: filterState.taxonomyTerm,
            sort: filterState.sort,
            view: filterState.view,
            paged: filterState.paged,
            posts_per_page: postsPerPage
        };
        
        // Send AJAX request
        $.ajax({
            url: stdLoopPost.ajaxurl,
            type: 'POST',
            data: data,
            success: function(response) {
                if (response.success && response.data) {
                    handleSuccessResponse($container, response, append);
                } else {
                    handleErrorResponse($container);
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX error:', error);
                handleErrorResponse($container);
            }
        });
    }
    
    /**
     * Handle successful AJAX response
     */
    function handleSuccessResponse($container, response, append) {
        const $postsContainer = $container.find('.std-looppost-posts-container');
        const $skeleton = $container.find('.std-looppost-skeleton');
        const $pagination = $container.find('.std-looppost-pagination');
        
        // Hide loading states
        $skeleton.hide();
        $pagination.removeClass('std-looppost-loading');
        $postsContainer.removeClass('loading');
        $postsContainer.attr('aria-busy', 'false');
        
        // Update posts content
        if (append) {
            $postsContainer.append(response.data.html);
            
            // Focus on first new item for screen readers
            const $newItems = $postsContainer.find('.std-looppost-table-row, .std-looppost-item').slice(-response.data.posts.length);
            if ($newItems.length > 0) {
                setTimeout(() => {
                    $newItems.first().focus();
                }, 100);
            }
        } else {
            $postsContainer.empty().append(response.data.html);
        }
        
        // Update pagination
        if (response.data.pagination) {
            $pagination.find('.std-looppost-page-numbers').html(response.data.pagination);
            
            // Update load more button
            const $loadMoreBtn = $pagination.find('.std-looppost-load-more');
            if (filterState.paged >= response.data.max_pages) {
                $loadMoreBtn.hide();
            } else {
                $loadMoreBtn.show().attr('aria-label', 'โหลดเพิ่ม');
            }
        }
        
        // Set view classes and handle table header
        $postsContainer.removeClass('card-view table-view').addClass(filterState.view + '-view');
        
        if (filterState.view === 'table') {
            if ($container.find('.std-looppost-table-header').length === 0) {
                $postsContainer.before(createTableHeader());
            } else {
                $container.find('.std-looppost-table-header').show();
            }
            
            // Make table rows focusable and add ARIA attributes
            $postsContainer.find('.std-looppost-table-row').each(function(index) {
                $(this).attr('tabindex', '0');
                $(this).attr('role', 'row');
                $(this).attr('aria-rowindex', index + 1);
            });
        } else {
            $container.find('.std-looppost-table-header').hide();
        }
        
        // Update ARIA labels
        a11yUtils.updateAriaLabels($container, response.data.found_posts, filterState.paged, response.data.max_pages);
        
        // Handle no results
        if (response.data.found_posts === 0) {
            $pagination.hide();
            a11yUtils.announceToScreenReader('ไม่พบผลการค้นหา');
        } else {
            $pagination.show();
            const resultMessage = `พบ ${response.data.found_posts} รายการ หน้าที่ ${filterState.paged} จาก ${response.data.max_pages}`;
            a11yUtils.announceToScreenReader(resultMessage);
        }
        
        // Stop loading announcement
        a11yUtils.announceLoadingState(false, $container);
    }
    
    /**
     * Handle error response
     */
    function handleErrorResponse($container) {
        const $postsContainer = $container.find('.std-looppost-posts-container');
        const $skeleton = $container.find('.std-looppost-skeleton');
        const $pagination = $container.find('.std-looppost-pagination');
        
        $skeleton.hide();
        $pagination.removeClass('std-looppost-loading');
        $postsContainer.removeClass('loading');
        $postsContainer.attr('aria-busy', 'false');
        
        const errorHtml = '<div class="std-looppost-error" role="alert">' +
                         '<p>เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง</p>' +
                         '</div>';
        $postsContainer.html(errorHtml);
        
        a11yUtils.announceToScreenReader('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'assertive');
        a11yUtils.announceLoadingState(false, $container);
    }
    
    // Export functions for external use
    window.stdLoopPostLoad = function($container) {
        if ($container) {
            loadPosts($container);
        } else {
            $('.std-looppost-container').each(function() {
                loadPosts($(this));
            });
        }
    };
    
    window.stdLoopPostFilterState = filterState;
    
    window.stdLoopPostSetView = function(view) {
        if (view !== 'card' && view !== 'table') {
            console.warn('Invalid view type. Use "card" or "table".');
            return;
        }
        
        $('.std-looppost-container').each(function() {
            const $container = $(this);
            const $viewBtn = $container.find('.std-looppost-view-btn[data-view="' + view + '"]');
            
            if ($viewBtn.length && !$viewBtn.hasClass('active')) {
                $viewBtn.trigger('click');
            }
        });
    };
    
    window.stdLoopPostFilterByTaxonomy = function(termSlug) {
        $('.std-looppost-container').each(function() {
            const $container = $(this);
            const $taxonomySelect = $container.find('.std-looppost-taxonomy-select');
            
            if ($taxonomySelect.length) {
                $taxonomySelect.val(termSlug).trigger('change');
            }
        });
    };
    
    // Add skip link for keyboard navigation
    $(document).ready(function() {
        if (!$('#skip-to-content').length) {
            $('body').prepend('<a href="#main-content" id="skip-to-content" class="sr-only">ข้ามไปยังเนื้อหาหลัก</a>');
        }
    });
    
})(jQuery);

// CSS for screen reader only content
const srOnlyCSS = `
.sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
}

.sr-only:focus {
    position: static !important;
    width: auto !important;
    height: auto !important;
    padding: 0.5rem 1rem !important;
    margin: 0 !important;
    overflow: visible !important;
    clip: auto !important;
    white-space: normal !important;
    background-color: #000 !important;
    color: #fff !important;
    z-index: 9999 !important;
    text-decoration: none !important;
}

#skip-to-content {
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 9999;
    border-radius: 4px;
}

#skip-to-content:focus {
    top: 6px;
}
`;

// Inject CSS if not already present
if (!document.getElementById('std-accessibility-css')) {
    const style = document.createElement('style');
    style.id = 'std-accessibility-css';
    style.textContent = srOnlyCSS;
    document.head.appendChild(style);
}