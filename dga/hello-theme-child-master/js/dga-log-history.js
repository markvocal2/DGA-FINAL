/**
 * JavaScript for DGA Log History
 */
jQuery(document).ready(function($) {
    // ดึงอ้างอิงองค์ประกอบ UI
    const historyList = $('#dga-history-list');
    const startDateInput = $('#dga-start-date');
    const endDateInput = $('#dga-end-date');
    const actionTypeSelect = $('#dga-action-type');
    const filterButton = $('#dga-filter-button');
    const resetButton = $('#dga-reset-button');
    
    // ตั้งค่าตัวกรองวันที่ให้เริ่มต้นที่วันปัจจุบัน
    setDefaultDates();
    
    // เพิ่ม event listeners
    initializeEventListeners();
    
    // ซ่อนรายละเอียด custom field เมื่อโหลดเพจ
    $('.log-details-cf').hide();
    
    // ฟังก์ชันตั้งค่าวันที่เริ่มต้น
    function setDefaultDates() {
        // ไม่ตั้งค่าวันที่เริ่มต้นเพื่อให้แสดงข้อมูลทั้งหมด
        // แต่เตรียมวันที่ปัจจุบันสำหรับเลือกใช้ภายหลัง
        const today = new Date();
        const currentDate = formatDate(today);
        
        // เก็บค่าวันที่ปัจจุบันไว้ใน data attribute
        startDateInput.attr('data-current-date', currentDate);
        endDateInput.attr('data-current-date', currentDate);
        
        // ตั้งค่า max attribute เพื่อป้องกันการเลือกวันที่ในอนาคต
        startDateInput.attr('max', currentDate);
        endDateInput.attr('max', currentDate);
    }
    
    // ฟังก์ชันเพิ่ม event listeners
    function initializeEventListeners() {
        // Event listener สำหรับปุ่มกรอง
        filterButton.on('click', function() {
            const postId = $(this).data('post-id');
            const nonce = $(this).data('nonce');
            applyFilter(postId, nonce);
        });
        
        // Event listener สำหรับปุ่มรีเซ็ต
        resetButton.on('click', function() {
            resetFilters();
        });
        
        // Event listener สำหรับปุ่มแสดง/ซ่อนรายละเอียด
        $(document).on('click', '.toggle-details', function() {
            const detailsElement = $(this).closest('li').find('.log-details-cf');
            detailsElement.slideToggle(200);
            
            $(this).toggleClass('active');
            
            // เปลี่ยนข้อความปุ่ม
            const buttonText = $(this).hasClass('active') ? 
                '<i class="dashicons dashicons-arrow-up-alt2"></i> ซ่อนรายละเอียด' : 
                '<i class="dashicons dashicons-arrow-down-alt2"></i> แสดงรายละเอียด';
            $(this).html(buttonText);
        });
        
        // Event listener เพื่อตรวจสอบความถูกต้องของวันที่
        startDateInput.on('change', function() {
            validateDateRange();
        });
        
        endDateInput.on('change', function() {
            validateDateRange();
        });
    }
    
    // ฟังก์ชันตรวจสอบช่วงวันที่
    function validateDateRange() {
        const startDate = startDateInput.val();
        const endDate = endDateInput.val();
        
        if (startDate && endDate) {
            if (new Date(startDate) > new Date(endDate)) {
                // ถ้าวันที่เริ่มต้นมากกว่าวันที่สิ้นสุด ให้ปรับวันที่สิ้นสุดเป็นวันที่เริ่มต้น
                endDateInput.val(startDate);
            }
        }
    }
    
    // ฟังก์ชันรีเซ็ตตัวกรอง
    function resetFilters() {
        startDateInput.val('');
        endDateInput.val('');
        actionTypeSelect.val('all');
        
        // ดึงข้อมูลจาก API เพื่อกลับไปแสดงข้อมูลทั้งหมด
        const postId = filterButton.data('post-id');
        const nonce = filterButton.data('nonce');
        applyFilter(postId, nonce);
    }
    
    // ฟังก์ชันใช้ตัวกรองและดึงข้อมูล
    function applyFilter(postId, nonce) {
        const startDate = startDateInput.val();
        const endDate = endDateInput.val();
        const actionType = actionTypeSelect.val();
        
        // แสดงสถานะ loading
        showLoading();
        
        // ส่งคำขอ AJAX
        $.ajax({
            url: dgaData.ajaxurl,
            type: 'POST',
            data: {
                action: 'dga_ajax_get_filtered_history',
                post_id: postId,
                start_date: startDate,
                end_date: endDate,
                action_type: actionType,
                nonce: nonce
            },
            success: function(response) {
                if (response.success && response.data.html) {
                    // อัปเดตรายการประวัติ
                    historyList.html(response.data.html);
                    
                    // ซ่อนรายละเอียด custom field
                    $('.log-details-cf').hide();
                } else {
                    // แสดงข้อผิดพลาด
                    showError();
                }
            },
            error: function() {
                showError();
            },
            complete: function() {
                // ซ่อนสถานะ loading
                hideLoading();
            }
        });
    }
    
    // ฟังก์ชันแสดงสถานะ loading
    function showLoading() {
        historyList.html('<li class="dga-loading"><div class="dga-spinner"></div>' + dgaData.loading_text + '</li>');
    }
    
    // ฟังก์ชันซ่อนสถานะ loading
    function hideLoading() {
        // จัดการใน success หรือ error callback
    }
    
    // ฟังก์ชันแสดงข้อผิดพลาด
    function showError() {
        historyList.html('<li class="dga-log-history-error">' + dgaData.error_text + '</li>');
    }
    
    // ฟังก์ชันช่วยจัดรูปแบบวันที่
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
});