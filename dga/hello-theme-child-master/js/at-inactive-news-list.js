/**
 * Inactive News List JavaScript - ปรับปรุงแล้ว
 * จัดการการแสดงรายการ posts ที่มีสถานะ inactive พร้อม real-time updates
 */
(function($) {
    'use strict';
    
    let currentPage = 1;
    let isLoading = false;
    let searchTimeout = null;
    
    $(document).ready(function() {
        const $container = $('.at-inactive-news-container');
        const postTypeFilter = $container.data('post-type') || '';
        
        // โหลดข้อมูลเริ่มต้น
        loadInactiveNews(1);
        
        // จัดการการค้นหา
        $('#at-news-search').on('input', function() {
            clearTimeout(searchTimeout);
            const searchValue = $(this).val();
            
            searchTimeout = setTimeout(function() {
                loadInactiveNews(1, searchValue);
            }, 500); // Debounce 500ms
        });
        
        // ปุ่มค้นหา
        $('#at-news-search-btn').on('click', function() {
            const searchValue = $('#at-news-search').val();
            loadInactiveNews(1, searchValue);
        });
        
        // ปุ่มรีเฟรช
        $('.at-refresh-btn').on('click', function() {
            $(this).addClass('spinning');
            loadInactiveNews(currentPage, $('#at-news-search').val());
        });
        
        // Enter key ในช่องค้นหา
        $('#at-news-search').on('keypress', function(e) {
            if (e.which === 13) {
                e.preventDefault();
                $('#at-news-search-btn').click();
            }
        });
        
        // จัดการ pagination clicks
        $(document).on('click', '.at-pagination-link', function(e) {
            e.preventDefault();
            const page = $(this).data('page');
            if (!$(this).hasClass('active') && !isLoading) {
                loadInactiveNews(page, $('#at-news-search').val());
            }
        });
        
        // จัดการ toggle ในตาราง
        $(document).on('click', '.at-table-toggle', function(e) {
            e.preventDefault();
            // ตรวจสอบว่า atStatusToggle พร้อมใช้งานหรือไม่
            if (typeof atStatusToggle !== 'undefined') {
                handleTableToggle($(this));
            } else {
                console.error('Status toggle script not loaded');
                alert('ไม่สามารถเปลี่ยนสถานะได้ กรุณารีเฟรชหน้าใหม่');
            }
        });
        
        // ฟังก์ชันโหลดข้อมูล
        function loadInactiveNews(page, search = '') {
            if (isLoading) return;
            
            isLoading = true;
            currentPage = page;
            
            // แสดงสถานะกำลังโหลด
            $('#at-news-table-body').html(`
                <tr>
                    <td colspan="7" class="at-loading-data">
                        <span class="spinner is-active"></span>
                        กำลังโหลดข้อมูล...
                    </td>
                </tr>
            `);
            
            $.ajax({
                url: atInactiveNewsList.ajaxurl,
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'at_load_inactive_news',
                    page: page,
                    per_page: atInactiveNewsList.perPage,
                    search: search,
                    post_type: postTypeFilter,
                    nonce: atInactiveNewsList.nonce
                },
                success: function(response) {
                    isLoading = false;
                    $('.at-refresh-btn').removeClass('spinning');
                    
                    if (response.success) {
                        displayNews(response.data.news);
                        updatePagination(response.data);
                        updateStatusMessage(response.data);
                    } else {
                        showError(response.data.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
                    }
                },
                error: function(xhr, status, error) {
                    isLoading = false;
                    $('.at-refresh-btn').removeClass('spinning');
                    console.error('AJAX Error:', status, error);
                    showError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
                }
            });
        }
        
        // ฟังก์ชันแสดงข้อมูลในตาราง
        function displayNews(newsItems) {
            const $tbody = $('#at-news-table-body');
            
            if (!newsItems || newsItems.length === 0) {
                $tbody.html(`
                    <tr>
                        <td colspan="7" class="at-no-data">
                            ไม่พบข้อมูลที่มีสถานะ Inactive
                        </td>
                    </tr>
                `);
                return;
            }
            
            let html = '';
            newsItems.forEach(function(item) {
                html += `
                    <tr data-post-id="${item.id}" data-post-type="${item.post_type}">
                        <td class="at-id-col">${item.id}</td>
                        <td class="at-type-col">
                            <span class="at-post-type-badge">${escapeHtml(item.post_type_label)}</span>
                        </td>
                        <td class="at-date-col">${item.date}</td>
                        <td class="at-title-col">
                            <a href="${item.permalink}" target="_blank" title="ดูโพสต์">
                                ${escapeHtml(item.title)}
                            </a>
                        </td>
                        <td class="at-docnum-col">
                            ${item.docnum_1 !== '-' ? `<div>มสพร: ${escapeHtml(item.docnum_1)}</div>` : ''}
                            ${item.docnum_2 !== '-' ? `<div>มรด: ${escapeHtml(item.docnum_2)}</div>` : '-'}
                        </td>
                        <td class="at-status-col">
                            <span class="at-status-badge inactive">Inactive</span>
                        </td>
                        <td class="at-action-col">
                            <button class="at-table-toggle at-btn-activate" 
                                    data-post-id="${item.id}" 
                                    data-current-status="inactive"
                                    title="เปลี่ยนเป็น Active">
                                <span class="dashicons dashicons-yes-alt"></span>
                                Active
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            $tbody.html(html);
        }
        
        // ฟังก์ชันจัดการ toggle ในตาราง
        function handleTableToggle($button) {
            const postId = $button.data('post-id');
            const currentStatus = $button.data('current-status');
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            const $row = $button.closest('tr');
            
            // ป้องกันการคลิกซ้ำ
            if ($button.hasClass('loading')) return;
            
            $button.addClass('loading').prop('disabled', true);
            $button.html('<span class="spinner is-active"></span> กำลังอัพเดต...');
            
            $.ajax({
                url: atInactiveNewsList.ajaxurl,
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'at_direct_status_toggle',
                    post_id: postId,
                    status: newStatus,
                    nonce: typeof atStatusToggle !== 'undefined' ? atStatusToggle.nonce : atInactiveNewsList.nonce
                },
                success: function(response) {
                    if (response.success) {
                        // Animate row removal
                        $row.addClass('removing');
                        setTimeout(function() {
                            $row.fadeOut(400, function() {
                                $(this).remove();
                                checkEmptyTable();
                                updateStatusMessage();
                            });
                        }, 200);
                        
                        // Trigger status changed event
                        $(document).trigger(window.atStatusEvents?.STATUS_CHANGED || 'at:statusChanged', {
                            postId: postId,
                            newStatus: newStatus,
                            source: 'table'
                        });
                        
                    } else {
                        // Reset button on error
                        resetToggleButton($button, currentStatus);
                        alert(response.data.message || 'เกิดข้อผิดพลาด');
                    }
                },
                error: function() {
                    resetToggleButton($button, currentStatus);
                    alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
                }
            });
        }
        
        // ฟังก์ชันรีเซ็ตปุ่ม toggle
        function resetToggleButton($button, status) {
            $button.removeClass('loading').prop('disabled', false);
            if (status === 'inactive') {
                $button.html('<span class="dashicons dashicons-yes-alt"></span> Active');
            } else {
                $button.html('<span class="dashicons dashicons-no-alt"></span> Inactive');
            }
        }
        
        // ฟังก์ชันตรวจสอบตารางว่าง
        function checkEmptyTable() {
            const $tbody = $('#at-news-table-body');
            if ($tbody.find('tr[data-post-id]').length === 0) {
                $tbody.html(`
                    <tr>
                        <td colspan="7" class="at-no-data">
                            ไม่พบข้อมูลที่มีสถานะ Inactive
                        </td>
                    </tr>
                `);
                $('#at-news-pagination').empty();
            }
        }
        
        // ฟังก์ชันอัพเดต pagination
        function updatePagination(data) {
            const $pagination = $('#at-news-pagination');
            
            if (data.total_pages <= 1) {
                $pagination.empty();
                return;
            }
            
            let html = '<div class="at-pagination-wrapper">';
            
            // Previous button
            if (data.current_page > 1) {
                html += `<a href="#" class="at-pagination-link at-prev" data-page="${data.current_page - 1}">
                    <span class="dashicons dashicons-arrow-left-alt2"></span> ก่อนหน้า
                </a>`;
            }
            
            // Page numbers
            html += '<div class="at-page-numbers">';
            for (let i = 1; i <= data.total_pages; i++) {
                if (
                    i === 1 || 
                    i === data.total_pages || 
                    (i >= data.current_page - 2 && i <= data.current_page + 2)
                ) {
                    const activeClass = i === data.current_page ? 'active' : '';
                    html += `<a href="#" class="at-pagination-link ${activeClass}" data-page="${i}">${i}</a>`;
                } else if (
                    i === data.current_page - 3 || 
                    i === data.current_page + 3
                ) {
                    html += '<span class="at-pagination-dots">...</span>';
                }
            }
            html += '</div>';
            
            // Next button
            if (data.current_page < data.total_pages) {
                html += `<a href="#" class="at-pagination-link at-next" data-page="${data.current_page + 1}">
                    ถัดไป <span class="dashicons dashicons-arrow-right-alt2"></span>
                </a>`;
            }
            
            html += '</div>';
            $pagination.html(html);
        }
        
        // ฟังก์ชันอัพเดตข้อความสถานะ
        function updateStatusMessage(data) {
            const $message = $('#at-news-status-message');
            if (data && data.total_posts > 0) {
                const start = ((data.current_page - 1) * atInactiveNewsList.perPage) + 1;
                const end = Math.min(start + atInactiveNewsList.perPage - 1, data.total_posts);
                $message.html(`แสดง ${start}-${end} จากทั้งหมด ${data.total_posts} รายการ`);
            } else {
                $message.empty();
            }
        }
        
        // ฟังก์ชันแสดงข้อผิดพลาด
        function showError(message) {
            $('#at-news-table-body').html(`
                <tr>
                    <td colspan="7" class="at-error-message">
                        <span class="dashicons dashicons-warning"></span>
                        ${escapeHtml(message)}
                    </td>
                </tr>
            `);
        }
        
        // ฟังก์ชัน escape HTML
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
        
        // Listen for status changes from other components
        $(document).on(window.atStatusEvents?.STATUS_CHANGED || 'at:statusChanged', function(e, data) {
            if (data.source !== 'table' && data.newStatus === 'inactive') {
                // Reload ถ้ามีการเปลี่ยนสถานะเป็น inactive จากที่อื่น
                setTimeout(() => {
                    loadInactiveNews(currentPage, $('#at-news-search').val());
                }, 500);
            }
        });
        
        // Listen for refresh requests
        $(document).on('at:needsRefresh', function(e, data) {
            if (data.remainingItems === 0 && currentPage > 1) {
                // ถ้าหน้าปัจจุบันไม่มีข้อมูลแล้ว ให้ไปหน้าก่อนหน้า
                loadInactiveNews(currentPage - 1, $('#at-news-search').val());
            }
        });
    });
    
})(jQuery);