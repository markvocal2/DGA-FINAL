/**
 * Post Status Toggle JavaScript - ปรับปรุงแล้ว
 * จัดการ Toggle Switch และส่ง AJAX พร้อม real-time updates
 */
(function($) {
    'use strict';
    
    // Custom event สำหรับ status change
    const STATUS_CHANGED_EVENT = 'at:statusChanged';
    
    $(document).ready(function() {
        // จัดการ toggle switch clicks
        $(document).on('click', '.at-status-toggle-switch', function(e) {
            e.preventDefault();
            
            const $toggle = $(this);
            const $container = $toggle.closest('.at-status-toggle-container');
            const postId = $container.data('post-id');
            const postType = $container.data('post-type') || 'post';
            const $messageBox = $container.find('.at-status-toggle-message');
            const $labelBox = $container.find('.at-status-toggle-label');
            
            // ป้องกันการคลิกซ้ำขณะกำลังประมวลผล
            if ($toggle.hasClass('loading')) {
                return;
            }
            
            // กำหนดสถานะใหม่
            const currentStatus = $toggle.hasClass('active') ? 'active' : 'inactive';
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            
            // แสดงสถานะกำลังโหลด
            $toggle.addClass('loading');
            $messageBox.html('<span class="loading">กำลังอัพเดต...</span>');
            
            // ส่ง AJAX request
            $.ajax({
                url: atStatusToggle.ajaxurl,
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'at_status_toggle',
                    post_id: postId,
                    status: newStatus,
                    nonce: atStatusToggle.nonce
                },
                success: function(response) {
                    $toggle.removeClass('loading');
                    
                    if (response.success) {
                        // อัพเดต UI
                        updateToggleUI($toggle, $labelBox, newStatus);
                        
                        // แสดงข้อความสำเร็จ
                        showMessage($messageBox, 'อัพเดตสำเร็จ!', 'success');
                        
                        // Trigger custom event สำหรับ components อื่นๆ
                        $(document).trigger(STATUS_CHANGED_EVENT, {
                            postId: postId,
                            postType: postType,
                            newStatus: newStatus,
                            element: $container[0]
                        });
                        
                        // อัพเดตตารางถ้ามี
                        updateTableRow(postId, newStatus);
                        
                    } else {
                        // แสดงข้อความผิดพลาด
                        const errorMsg = response.data && response.data.message 
                            ? response.data.message 
                            : 'เกิดข้อผิดพลาด';
                        showMessage($messageBox, errorMsg, 'error');
                    }
                },
                error: function(xhr, status, error) {
                    $toggle.removeClass('loading');
                    console.error('AJAX Error:', status, error);
                    showMessage($messageBox, 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
                }
            });
        });
        
        // ฟังก์ชันอัพเดต UI ของ toggle
        function updateToggleUI($toggle, $label, status) {
            $toggle.removeClass('active inactive').addClass(status);
            const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
            $label.text(displayStatus);
        }
        
        // ฟังก์ชันแสดงข้อความ
        function showMessage($messageBox, message, type) {
            $messageBox.html(`<span class="${type}">${message}</span>`);
            
            // ล้างข้อความหลังจากเวลาที่กำหนด
            const duration = type === 'error' ? 3000 : 2000;
            setTimeout(function() {
                $messageBox.fadeOut(300, function() {
                    $(this).html('').show();
                });
            }, duration);
        }
        
        // ฟังก์ชันอัพเดตแถวในตาราง (สำหรับ inactive list)
        function updateTableRow(postId, newStatus) {
            const $row = $(`tr[data-post-id="${postId}"]`);
            
            if ($row.length && newStatus === 'active') {
                // ถ้าสถานะเปลี่ยนเป็น active ให้ลบแถวออกจากตาราง inactive
                $row.fadeOut(400, function() {
                    $(this).remove();
                    
                    // ตรวจสอบว่ายังมีแถวเหลืออยู่หรือไม่
                    const $tbody = $('#at-news-table-body');
                    if ($tbody.find('tr[data-post-id]').length === 0) {
                        $tbody.html(`
                            <tr>
                                <td colspan="7" class="at-no-data">
                                    ไม่พบข้อมูลที่มีสถานะ Inactive
                                </td>
                            </tr>
                        `);
                    }
                    
                    // อัพเดต pagination ถ้าจำเป็น
                    updatePaginationCount();
                });
            }
        }
        
        // ฟังก์ชันอัพเดตจำนวนใน pagination
        function updatePaginationCount() {
            const $pagination = $('#at-news-pagination');
            const currentCount = $('#at-news-table-body tr[data-post-id]').length;
            
            // Trigger event เพื่อให้ list component จัดการ pagination
            $(document).trigger('at:needsRefresh', {
                remainingItems: currentCount
            });
        }
        
        // จัดการ keyboard navigation สำหรับ accessibility
        $(document).on('keydown', '.at-status-toggle-switch', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                $(this).click();
            }
        });
        
        // เพิ่ม ARIA attributes สำหรับ accessibility
        $('.at-status-toggle-switch').each(function() {
            const $toggle = $(this);
            const isActive = $toggle.hasClass('active');
            
            $toggle.attr({
                'role': 'switch',
                'aria-checked': isActive,
                'tabindex': '0'
            });
        });
    });
    
    // Export event name สำหรับใช้ใน modules อื่น
    window.atStatusEvents = {
        STATUS_CHANGED: STATUS_CHANGED_EVENT
    };
    
})(jQuery);