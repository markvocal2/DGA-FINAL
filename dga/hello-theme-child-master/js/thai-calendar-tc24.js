jQuery(document).ready(function($) {
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth() + 1;
    let isLoading = false;
    let currentPopupData = null;
    let showingAllPosts = false;

    // Initialize calendar without auto-scroll
    loadCalendarData(currentYear, currentMonth);
    initializeKeyboardNavigation();

    // Enhanced keyboard navigation
    function initializeKeyboardNavigation() {
        $(document).on('keydown', '.thai-calendar-wrapper-tc24', function(e) {
            if (!$('.event-popup-tc24').attr('aria-hidden') === 'false') {
                handleCalendarKeyboard(e);
            }
        });

        $(document).on('keydown', '.event-popup-tc24[aria-hidden="false"]', function(e) {
            handlePopupKeyboard(e);
        });
    }

    function handleCalendarKeyboard(e) {
        const key = e.key;
        const $calendar = $('.thai-calendar-wrapper-tc24');
        const $days = $calendar.find('.day-tc24:not(.empty-tc24)');
        const $focusedDay = $days.filter(':focus');
        
        let currentIndex = $focusedDay.length ? $days.index($focusedDay) : -1;
        let newIndex = currentIndex;

        switch(key) {
            case 'ArrowLeft':
                e.preventDefault();
                newIndex = Math.max(0, currentIndex - 1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                newIndex = Math.min($days.length - 1, currentIndex + 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                newIndex = Math.max(0, currentIndex - 7);
                break;
            case 'ArrowDown':
                e.preventDefault();
                newIndex = Math.min($days.length - 1, currentIndex + 7);
                break;
            case 'Home':
                e.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                e.preventDefault();
                newIndex = $days.length - 1;
                break;
            case 'Enter':
            case ' ':
                if ($focusedDay.hasClass('has-posts-tc24')) {
                    e.preventDefault();
                    $focusedDay.click();
                }
                break;
        }

        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < $days.length) {
            $days.eq(newIndex).focus();
        }
    }

    function handlePopupKeyboard(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            closePopup();
        } else if (e.key === 'Tab') {
            trapFocus(e);
        }
    }

    function trapFocus(e) {
        const $popup = $('.event-popup-tc24[aria-hidden="false"]');
        const $focusableElements = $popup.find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const $firstElement = $focusableElements.first();
        const $lastElement = $focusableElements.last();

        if (e.shiftKey) {
            if (document.activeElement === $firstElement[0]) {
                e.preventDefault();
                $lastElement.focus();
            }
        } else {
            if (document.activeElement === $lastElement[0]) {
                e.preventDefault();
                $firstElement.focus();
            }
        }
    }

    // Load calendar data with enhanced error handling
    function loadCalendarData(year, month) {
        if (isLoading) return;
        
        isLoading = true;
        announceToScreenReader(thaiCalendarData_tc24.i18n.loading);
        
        // Show loading state
        $('.days-grid-tc24').html('<div class="loading-tc24">' + thaiCalendarData_tc24.i18n.loading + '</div>');

        $.ajax({
            url: thaiCalendarData_tc24.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_calendar_posts',
                nonce: thaiCalendarData_tc24.nonce,
                year: year,
                month: month
            },
            timeout: 15000,
            success: function(response) {
                if (response.success) {
                    renderCalendar(response.month_info, response.posts);
                    const monthName = thaiCalendarData_tc24.months[month - 1];
                    announceToScreenReader(monthName + ' ' + response.month_info.buddhist_year + ' โหลดเสร็จแล้ว');
                } else {
                    showError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + (response.data?.message || 'ไม่ทราบสาเหตุ'));
                }
            },
            error: function(xhr, status, error) {
                let errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
                if (status === 'timeout') {
                    errorMessage = 'หมดเวลาการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง';
                } else if (xhr.status === 403) {
                    errorMessage = 'ไม่มีสิทธิ์เข้าถึงข้อมูล';
                } else if (xhr.status === 500) {
                    errorMessage = 'เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่ในภายหลัง';
                }
                showError(errorMessage);
            },
            complete: function() {
                isLoading = false;
            }
        });
    }

    function showError(message) {
        $('.days-grid-tc24').html(
            '<div class="error-message-tc24">' + 
            '<div class="error-icon-tc24">⚠️</div>' +
            '<div class="error-text-tc24">' +
            '<strong>เกิดข้อผิดพลาด:</strong><br>' + message + 
            '</div>' +
            '<button class="retry-btn-tc24">ลองใหม่</button>' +
            '</div>'
        );
        
        $('.retry-btn-tc24').on('click', function() {
            loadCalendarData(currentYear, currentMonth);
        });
        
        announceToScreenReader('เกิดข้อผิดพลาด: ' + message);
    }

    // Render calendar - REMOVED auto-focus to prevent scrolling
    function renderCalendar(monthInfo, postsData) {
        const daysGrid = $('.days-grid-tc24');
        daysGrid.empty();

        // Update month/year display
        const monthName = thaiCalendarData_tc24.months[monthInfo.month - 1];
        $('.current-month-year-tc24').text(monthName + ' ' + monthInfo.buddhist_year);

        // Create empty cells for days before month start
        for (let i = 0; i < monthInfo.first_day; i++) {
            daysGrid.append('<div class="day-tc24 empty-tc24" role="gridcell" aria-hidden="true"></div>');
        }

        // Create days of the month
        for (let day = 1; day <= monthInfo.days_in_month; day++) {
            const currentDate = monthInfo.year + '-' + 
                              String(monthInfo.month).padStart(2, '0') + '-' + 
                              String(day).padStart(2, '0');
            
            const dayPosts = postsData[currentDate] || { preview: [], all: [], count: 0, types: [] };
            const hasPostsClass = dayPosts.all.length > 0 ? 'has-posts-tc24' : '';
            
            // Create accessible day cell
            const postsCount = dayPosts.all.length;
            const ariaLabel = day + ' ' + monthName + ' ' + monthInfo.buddhist_year + 
                            (postsCount > 0 ? ', มี ' + postsCount + ' รายการ' : ', ไม่มีรายการ');
            
            let dayHtml = `
                <div class="day-tc24 ${hasPostsClass}" 
                     data-date="${currentDate}"
                     role="gridcell"
                     tabindex="${hasPostsClass ? '0' : '-1'}"
                     aria-label="${ariaLabel}"
                     ${hasPostsClass ? 'aria-haspopup="dialog"' : ''}>
                    <div class="day-content-tc24">
                        <span class="day-number-tc24">${day}</span>`;

            // Add post indicators and count
            if (postsCount > 0) {
                dayHtml += '<div class="post-indicators-tc24">';
                dayPosts.types.forEach(type => {
                    dayHtml += `<div class="post-indicator-tc24 ${type}-tc24" 
                                     aria-hidden="true" 
                                     title="${getPostTypeLabel(type)}"></div>`;
                });
                dayHtml += '</div>';
                
                if (postsCount > 5) {
                    dayHtml += `<div class="posts-count-tc24" aria-hidden="true">${postsCount}+</div>`;
                } else {
                    dayHtml += `<div class="posts-count-tc24" aria-hidden="true">${postsCount}</div>`;
                }
            }

            dayHtml += '</div></div>';
            daysGrid.append(dayHtml);
        }

        // Bind click events
        $('.day-tc24.has-posts-tc24').on('click', function() {
            const date = $(this).data('date');
            const posts = postsData[date];
            showPostsPopup(date, posts);
        });

        // NO AUTO-FOCUS - Removed to prevent scrolling
        // Calendar loads quietly without forcing focus
    }

    function getPostTypeLabel(type) {
        return thaiCalendarData_tc24.i18n.post_types[type] || type;
    }

    // Enhanced popup with better design and functionality
    function showPostsPopup(date, postsData) {
        if (!postsData || !postsData.all) return;
        
        currentPopupData = { date, postsData };
        showingAllPosts = false;
        
        const popup = $('.event-popup-tc24');
        const [year, month, day] = date.split('-');
        const thaiMonth = thaiCalendarData_tc24.months[parseInt(month) - 1];
        const buddhistYear = parseInt(year) + 543;
        
        // Format date
        const formattedDate = `${parseInt(day)} ${thaiMonth} ${buddhistYear}`;
        popup.find('.popup-date-display-tc24').text(formattedDate);
        
        // Update popup title for screen readers
        popup.find('#popup-title-tc24').text('รายการในวันที่ ' + formattedDate);
        
        // Show summary
        const totalPosts = postsData.all.length;
        const postTypes = postsData.types;
        let summaryText = `ทั้งหมด ${totalPosts} รายการ`;
        
        if (postTypes.length > 1) {
            const typeLabels = postTypes.map(type => getPostTypeLabel(type));
            summaryText += ` (${typeLabels.join(', ')})`;
        }
        
        popup.find('.posts-summary-tc24').html(`
            <div class="summary-stats-tc24">
                <span class="total-count-tc24">${summaryText}</span>
            </div>
        `);
        
        // Show initial posts (preview or all if <=5)
        const postsToShow = totalPosts <= 5 ? postsData.all : postsData.preview;
        renderPostsList(postsToShow);
        
        // Show/hide "View All" button
        const $viewAllBtn = popup.find('.view-all-posts-tc24');
        if (totalPosts > 5) {
            $viewAllBtn.show().text(`ดูทั้งหมด ${totalPosts} รายการ`);
        } else {
            $viewAllBtn.hide();
        }
        
        // Show popup with animation
        popup.attr('aria-hidden', 'false');
        $('body').addClass('popup-open-tc24');
        
        // Focus management
        setTimeout(() => {
            popup.find('.close-popup-tc24').focus();
        }, 200);
        
        // Announce to screen readers
        announceToScreenReader(`เปิดหน้าต่างรายการในวันที่ ${formattedDate}, ${summaryText}`);
    }

    function renderPostsList(posts) {
        const postsList = $('.posts-list-tc24');
        postsList.empty();
        
        if (posts.length === 0) {
            postsList.append(`
                <li class="no-posts-tc24">
                    <div class="no-posts-icon-tc24">📅</div>
                    <div class="no-posts-text-tc24">${thaiCalendarData_tc24.i18n.no_posts}</div>
                </li>
            `);
            return;
        }

        posts.forEach((post, index) => {
            const postHtml = `
                <li class="post-item-tc24 ${post.type}-tc24" role="listitem">
                    <div class="post-type-indicator-tc24" 
                         aria-label="${getPostTypeLabel(post.type)}"
                         title="${getPostTypeLabel(post.type)}"></div>
                    <div class="post-content-tc24">
                        <div class="post-header-tc24">
                            <a href="${post.url}" 
                               class="post-link-tc24" 
                               target="_blank"
                               rel="noopener noreferrer"
                               aria-describedby="post-meta-${index}">
                               <span class="post-title-tc24">${post.title}</span>
                               <span class="external-link-icon-tc24" aria-hidden="true">↗</span>
                            </a>
                        </div>
                        <div class="post-meta-tc24" id="post-meta-${index}">
                            <span class="post-time-tc24">🕐 ${post.time}</span>
                            <span class="post-type-tc24">📂 ${getPostTypeLabel(post.type)}</span>
                        </div>
                        ${post.excerpt ? `<div class="post-excerpt-tc24">${post.excerpt}</div>` : ''}
                    </div>
                </li>
            `;
            postsList.append(postHtml);
        });
    }

    function closePopup() {
        const popup = $('.event-popup-tc24');
        popup.attr('aria-hidden', 'true');
        $('body').removeClass('popup-open-tc24');
        
        // Reset popup state
        currentPopupData = null;
        showingAllPosts = false;
        
        // NO AUTO-FOCUS RETURN - Let user stay where they were
        announceToScreenReader('ปิดหน้าต่างรายการแล้ว');
    }

    function announceToScreenReader(message) {
        const $announcer = $('.sr-only-tc24');
        $announcer.text(message);
        
        // Clear after announcement
        setTimeout(() => {
            $announcer.empty();
        }, 1000);
    }

    // Event handlers
    $('.prev-month-tc24').on('click', function() {
        if (isLoading) return;
        
        currentMonth--;
        if (currentMonth < 1) {
            currentMonth = 12;
            currentYear--;
        }
        loadCalendarData(currentYear, currentMonth);
    });

    $('.next-month-tc24').on('click', function() {
        if (isLoading) return;
        
        currentMonth++;
        if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
        }
        loadCalendarData(currentYear, currentMonth);
    });

    $('.close-popup-tc24').on('click', closePopup);

    // View all posts button
    $(document).on('click', '.view-all-posts-tc24', function() {
        if (!currentPopupData) return;
        
        const { postsData } = currentPopupData;
        showingAllPosts = !showingAllPosts;
        
        if (showingAllPosts) {
            renderPostsList(postsData.all);
            $(this).text('ดูน้อยลง');
        } else {
            renderPostsList(postsData.preview);
            $(this).text(`ดูทั้งหมด ${postsData.all.length} รายการ`);
        }
        
        announceToScreenReader(showingAllPosts ? 'แสดงรายการทั้งหมดแล้ว' : 'ย่อรายการแล้ว');
    });

    // Close popup on background click
    $('.event-popup-tc24').on('click', function(e) {
        if ($(e.target).hasClass('popup-overlay-tc24') || $(e.target).hasClass('event-popup-tc24')) {
            closePopup();
        }
    });

    // Prevent body scroll when popup is open
    $('body').on('keydown', function(e) {
        if ($('body').hasClass('popup-open-tc24') && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            if (!$(e.target).closest('.posts-list-tc24').length) {
                e.preventDefault();
            }
        }
    });

    // Auto-retry on network error with exponential backoff
    let retryCount = 0;
    const maxRetries = 3;

    function retryLoadCalendar() {
        if (retryCount < maxRetries) {
            retryCount++;
            const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
            setTimeout(() => {
                announceToScreenReader(`กำลังลองใหม่ครั้งที่ ${retryCount}`);
                loadCalendarData(currentYear, currentMonth);
            }, delay);
        }
    }

    // Enhanced error handling for AJAX failures
    $(document).ajaxError(function(event, xhr, settings) {
        if (settings.data?.includes('get_calendar_posts')) {
            if (retryCount < maxRetries) {
                retryLoadCalendar();
            }
        }
    });

    // Reset retry count on successful load
    $(document).ajaxSuccess(function(event, xhr, settings) {
        if (settings.data?.includes('get_calendar_posts')) {
            retryCount = 0;
        }
    });

    // Handle window resize for responsive popup
    let resizeTimer;
    $(window).on('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if ($('.event-popup-tc24').attr('aria-hidden') === 'false') {
                // Recalculate popup dimensions if needed
                adjustPopupSize();
            }
        }, 250);
    });

    function adjustPopupSize() {
        const $popup = $('.popup-content-tc24');
        const windowHeight = $(window).height();
        const maxHeight = windowHeight * 0.85;
        
        $popup.css('max-height', maxHeight + 'px');
    }

    // Initialize smooth animations
    const animationCSS = `
        <style>
        .thai-calendar-wrapper-tc24.loading {
            position: relative;
            pointer-events: none;
            opacity: 0.7;
        }
        .thai-calendar-wrapper-tc24.loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 32px;
            height: 32px;
            border: 3px solid var(--border-color);
            border-top: 3px solid var(--primary-color);
            border-radius: 50%;
            animation: spin-tc24 1s linear infinite;
            transform: translate(-50%, -50%);
            z-index: 10;
        }
        @keyframes spin-tc24 {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        body.popup-open-tc24 {
            overflow: hidden;
        }
        .error-message-tc24 {
            text-align: center;
            padding: 40px 20px;
            color: var(--error-color);
        }
        .error-icon-tc24 {
            font-size: 2rem;
            margin-bottom: 16px;
        }
        .error-text-tc24 {
            margin-bottom: 20px;
            line-height: 1.5;
        }
        .retry-btn-tc24 {
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background-color 0.2s;
        }
        .retry-btn-tc24:hover {
            background: var(--primary-hover);
        }
        </style>
    `;
    
    $('head').append(animationCSS);
});