/**
 * File: /js/dga-thai-date-zxk429.js
 * Description: สคริปต์สำหรับนับจำนวนผู้เข้าชมและแก้ไขโดย Admin
 */
document.addEventListener('DOMContentLoaded', function () {
    // ค้นหา element ของ shortcode ทั้งหมดในหน้า
    const viewCounters = document.querySelectorAll('.dga-container-zxk429');

    // ถ้าไม่พบ element ใดๆ ให้หยุดการทำงาน
    if (viewCounters.length === 0) {
        return;
    }

    // Debug: ตรวจสอบสถานะ Admin
    console.log('DGA Thai Date: Script loaded');
    console.log('Is Admin:', dga_ajax_obj.is_admin);
    console.log('Is Logged In:', dga_ajax_obj.user_logged_in);

    // วนลูปสำหรับแต่ละ shortcode ที่พบ
    viewCounters.forEach(counterElement => {
        const postId = counterElement.dataset.postid;

        // ถ้าไม่มี post ID ให้ข้ามไป
        if (!postId) {
            return;
        }

        // เพิ่มจำนวนวิวเมื่อโหลดหน้า (สำหรับผู้เข้าชมทั่วไป)
        incrementViewCount(counterElement, postId);

        // เพิ่มฟังก์ชันแก้ไขสำหรับ Administrator
        const countSpan = counterElement.querySelector('.dga-view-count-zxk429');
        if (countSpan && countSpan.dataset.isAdmin === 'true') {
            console.log('Setting up admin edit for post:', postId);
            setupAdminEdit(counterElement, postId);
        }
    });

    /**
     * ฟังก์ชันเพิ่มจำนวนผู้เข้าชม
     */
    function incrementViewCount(counterElement, postId) {
        const formData = new FormData();
        formData.append('action', 'dga_increment_view');
        formData.append('post_id', postId);
        formData.append('nonce', dga_ajax_obj.nonce);

        fetch(dga_ajax_obj.ajax_url, {
            method: 'POST',
            credentials: 'same-origin', // สำคัญสำหรับการส่ง cookies
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const countSpan = counterElement.querySelector('.dga-view-count-zxk429');
                if (countSpan) {
                    countSpan.textContent = result.data.new_count;
                    countSpan.setAttribute('data-original-count', result.data.raw_count);
                }
                if (result.data.already_counted) {
                    console.log('View already counted in this session');
                }
            } else {
                console.error('Failed to update view count:', result.data);
            }
        })
        .catch(error => {
            console.error('Error with AJAX request:', error);
        });
    }

    /**
     * ตั้งค่าฟังก์ชันแก้ไขสำหรับ Administrator
     */
    function setupAdminEdit(counterElement, postId) {
        const countSpan = counterElement.querySelector('.dga-view-count-zxk429');
        
        if (!countSpan || !countSpan.classList.contains('dga-editable-zxk429')) {
            console.log('Count span not editable');
            return;
        }

        // เพิ่ม visual indicator ว่าสามารถแก้ไขได้
        countSpan.style.cursor = 'pointer';

        // เพิ่ม event listener สำหรับ Click
        countSpan.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Admin clicked on count');
            showEditInput(countSpan, postId);
        });

        // รองรับ keyboard navigation
        countSpan.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showEditInput(countSpan, postId);
            }
        });
    }

    /**
     * แสดง input field สำหรับแก้ไขจำนวน
     */
    function showEditInput(countSpan, postId) {
        // ป้องกันการเปิด edit mode หลายครั้ง
        if (countSpan.querySelector('.dga-edit-input-zxk429')) {
            return;
        }

        const originalText = countSpan.textContent.replace(/,/g, ''); // ลบคอมม่า
        const originalCount = parseInt(originalText) || 0;

        console.log('Entering edit mode. Original count:', originalCount);

        // ซ่อนข้อความเดิม
        const originalDisplay = countSpan.style.display;
        countSpan.style.display = 'none';

        // สร้าง wrapper สำหรับ input และปุ่ม
        const editWrapper = document.createElement('span');
        editWrapper.className = 'dga-edit-wrapper-zxk429';

        // สร้าง input element
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'dga-edit-input-zxk429';
        input.value = originalCount;
        input.min = '0';
        input.max = '999999999';
        input.setAttribute('aria-label', dga_ajax_obj.strings.edit_hint);

        // สร้างปุ่ม Save และ Cancel
        const buttonContainer = document.createElement('span');
        buttonContainer.className = 'dga-edit-buttons-zxk429';

        const saveButton = document.createElement('button');
        saveButton.textContent = dga_ajax_obj.strings.save_text;
        saveButton.className = 'dga-save-btn-zxk429';
        saveButton.type = 'button';

        const cancelButton = document.createElement('button');
        cancelButton.textContent = dga_ajax_obj.strings.cancel_text;
        cancelButton.className = 'dga-cancel-btn-zxk429';
        cancelButton.type = 'button';

        buttonContainer.appendChild(saveButton);
        buttonContainer.appendChild(cancelButton);

        // เพิ่ม elements
        editWrapper.appendChild(input);
        editWrapper.appendChild(buttonContainer);
        countSpan.parentNode.insertBefore(editWrapper, countSpan.nextSibling);

        // Focus ที่ input และเลือกข้อความทั้งหมด
        input.focus();
        input.select();

        // Function to clean up edit mode
        function cleanupEditMode() {
            if (editWrapper && editWrapper.parentNode) {
                editWrapper.parentNode.removeChild(editWrapper);
            }
            countSpan.style.display = originalDisplay;
        }

        // Event listeners สำหรับปุ่ม
        saveButton.addEventListener('click', () => {
            saveNewCount(input, countSpan, postId, originalCount, cleanupEditMode);
        });

        cancelButton.addEventListener('click', () => {
            console.log('Edit cancelled');
            cleanupEditMode();
        });

        // Event listeners สำหรับ keyboard
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveNewCount(input, countSpan, postId, originalCount, cleanupEditMode);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cleanupEditMode();
            }
        });

        // ปิด edit mode เมื่อคลิกข้างนอก
        setTimeout(() => {
            document.addEventListener('click', function closeEditOnClickOutside(e) {
                if (editWrapper && !editWrapper.contains(e.target) && !countSpan.contains(e.target)) {
                    cleanupEditMode();
                    document.removeEventListener('click', closeEditOnClickOutside);
                }
            });
        }, 100);
    }

    /**
     * บันทึกจำนวนใหม่
     */
    function saveNewCount(input, countSpan, postId, originalCount, cleanupCallback) {
        const newCount = parseInt(input.value);

        console.log('Saving new count:', newCount);

        // ตรวจสอบความถูกต้องของข้อมูล
        if (isNaN(newCount) || newCount < 0) {
            showMessage(dga_ajax_obj.strings.invalid_number, 'error');
            input.focus();
            return;
        }

        // ถ้าค่าไม่เปลี่ยน ให้ยกเลิกการแก้ไข
        if (newCount === originalCount) {
            cleanupCallback();
            return;
        }

        // แสดง loading state
        input.disabled = true;
        const saveButton = input.parentNode.querySelector('.dga-save-btn-zxk429');
        const originalSaveText = saveButton.textContent;
        saveButton.textContent = '...';
        saveButton.disabled = true;

        // ส่งข้อมูลไปยัง server
        const formData = new FormData();
        formData.append('action', 'dga_edit_view_count');
        formData.append('post_id', postId);
        formData.append('new_count', newCount);
        formData.append('edit_nonce', dga_ajax_obj.edit_nonce);

        console.log('Sending edit request...');

        fetch(dga_ajax_obj.ajax_url, {
            method: 'POST',
            credentials: 'same-origin', // สำคัญสำหรับการส่ง cookies
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            console.log('Edit response:', result);
            
            if (result.success) {
                // อัพเดทข้อความแสดงผล
                countSpan.textContent = result.data.new_count;
                countSpan.setAttribute('data-original-count', result.data.raw_count);
                
                // แสดงข้อความสำเร็จ
                showMessage(dga_ajax_obj.strings.save_success, 'success');
                
                // ปิด edit mode
                cleanupCallback();
            } else {
                // แสดงข้อผิดพลาด
                const errorMsg = result.data?.message || dga_ajax_obj.strings.save_error;
                showMessage(errorMsg, 'error');
                
                // คืนค่า loading state
                input.disabled = false;
                saveButton.textContent = originalSaveText;
                saveButton.disabled = false;
                input.focus();
            }
        })
        .catch(error => {
            console.error('Error saving view count:', error);
            showMessage(dga_ajax_obj.strings.save_error, 'error');
            
            // คืนค่า loading state
            input.disabled = false;
            saveButton.textContent = originalSaveText;
            saveButton.disabled = false;
            input.focus();
        });
    }

    /**
     * แสดงข้อความแจ้งเตือน
     */
    function showMessage(message, type = 'info') {
        // ลบข้อความเก่าถ้ามี
        const existingMessage = document.querySelector('.dga-message-zxk429');
        if (existingMessage) {
            existingMessage.remove();
        }

        // สร้างข้อความใหม่
        const messageElement = document.createElement('div');
        messageElement.className = `dga-message-zxk429 dga-message-${type}-zxk429`;
        messageElement.textContent = message;
        messageElement.setAttribute('role', 'alert');
        messageElement.setAttribute('aria-live', 'polite');

        // แสดงข้อความ
        document.body.appendChild(messageElement);

        // Animation
        setTimeout(() => {
            messageElement.classList.add('dga-message-show-zxk429');
        }, 10);

        // ลบข้อความหลังจาก 3 วินาที
        setTimeout(() => {
            messageElement.classList.remove('dga-message-show-zxk429');
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 300);
        }, 3000);
    }

    // Debug function - ตรวจสอบสถานะ Admin
    window.dgaCheckAdminStatus = function() {
        const formData = new FormData();
        formData.append('action', 'dga_check_admin_status');
        formData.append('nonce', dga_ajax_obj.nonce);

        fetch(dga_ajax_obj.ajax_url, {
            method: 'POST',
            credentials: 'same-origin',
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            console.log('Admin Status Check:', result);
        });
    };
});