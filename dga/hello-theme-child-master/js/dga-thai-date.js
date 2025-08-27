/**
 * File: /js/dga-thai-date.js
 * Description: สคริปต์สำหรับนับจำนวนผู้เข้าชมและแก้ไขโดย Admin
 */
document.addEventListener('DOMContentLoaded', function () {
    // ค้นหา element ของ shortcode ทั้งหมดในหน้า
    const viewCounters = document.querySelectorAll('.dga-container-sc19');

    // ถ้าไม่พบ element ใดๆ ให้หยุดการทำงาน
    if (viewCounters.length === 0) {
        return;
    }

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
        if (dga_ajax_obj.is_admin) {
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
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const countSpan = counterElement.querySelector('.dga-view-count-sc19');
                if (countSpan) {
                    countSpan.textContent = result.data.new_count;
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
        const countSpan = counterElement.querySelector('.dga-view-count-sc19');
        
        if (!countSpan) {
            return;
        }

        // เพิ่ม event listener สำหรับ Click ธรรมดา
        countSpan.addEventListener('click', function(e) {
            e.preventDefault();
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
        if (countSpan.querySelector('.dga-edit-input-sc19')) {
            return;
        }

        const originalText = countSpan.textContent.replace(/,/g, ''); // ลบคอมม่า
        const originalCount = parseInt(originalText) || 0;

        // สร้าง input element
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'dga-edit-input-sc19';
        input.value = originalCount;
        input.min = '0';
        input.max = '999999999';
        input.setAttribute('aria-label', dga_ajax_obj.strings.edit_hint);

        // สร้างปุ่ม Save และ Cancel
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'dga-edit-buttons-sc19';

        const saveButton = document.createElement('button');
        saveButton.textContent = dga_ajax_obj.strings.save_text;
        saveButton.className = 'dga-save-btn-sc19';
        saveButton.type = 'button';

        const cancelButton = document.createElement('button');
        cancelButton.textContent = dga_ajax_obj.strings.cancel_text;
        cancelButton.className = 'dga-cancel-btn-sc19';
        cancelButton.type = 'button';

        buttonContainer.appendChild(saveButton);
        buttonContainer.appendChild(cancelButton);

        // ซ่อนข้อความเดิมและแสดง input
        countSpan.style.display = 'none';
        countSpan.parentNode.insertBefore(input, countSpan.nextSibling);
        countSpan.parentNode.insertBefore(buttonContainer, input.nextSibling);

        // Focus ที่ input และเลือกข้อความทั้งหมด
        input.focus();
        input.select();

        // Event listeners สำหรับปุ่ม
        saveButton.addEventListener('click', () => saveNewCount(input, countSpan, postId, originalCount));
        cancelButton.addEventListener('click', () => cancelEdit(input, buttonContainer, countSpan));

        // Event listeners สำหรับ keyboard
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveNewCount(input, countSpan, postId, originalCount);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit(input, buttonContainer, countSpan);
            }
        });

        // ปิด edit mode เมื่อคลิกข้างนอก
        document.addEventListener('click', function closeEditOnClickOutside(e) {
            if (!input.contains(e.target) && !buttonContainer.contains(e.target)) {
                cancelEdit(input, buttonContainer, countSpan);
                document.removeEventListener('click', closeEditOnClickOutside);
            }
        });
    }

    /**
     * บันทึกจำนวนใหม่
     */
    function saveNewCount(input, countSpan, postId, originalCount) {
        const newCount = parseInt(input.value);

        // ตรวจสอบความถูกต้องของข้อมูล
        if (isNaN(newCount) || newCount < 0) {
            showMessage(dga_ajax_obj.strings.invalid_number, 'error');
            input.focus();
            return;
        }

        // ถ้าค่าไม่เปลี่ยน ให้ยกเลิกการแก้ไข
        if (newCount === originalCount) {
            cancelEdit(input, input.nextSibling, countSpan);
            return;
        }

        // แสดง loading state
        input.disabled = true;
        const saveButton = input.nextSibling.querySelector('.dga-save-btn-sc19');
        const originalSaveText = saveButton.textContent;
        saveButton.textContent = '...';

        // ส่งข้อมูลไปยัง server
        const formData = new FormData();
        formData.append('action', 'dga_edit_view_count');
        formData.append('post_id', postId);
        formData.append('new_count', newCount);
        formData.append('edit_nonce', dga_ajax_obj.edit_nonce);

        fetch(dga_ajax_obj.ajax_url, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // อัพเดทข้อความแสดงผล
                countSpan.textContent = result.data.new_count;
                countSpan.setAttribute('data-original-count', newCount);
                
                // แสดงข้อความสำเร็จ
                showMessage(dga_ajax_obj.strings.save_success, 'success');
                
                // ปิด edit mode
                cancelEdit(input, input.nextSibling, countSpan);
            } else {
                // แสดงข้อผิดพลาด
                showMessage(result.data || dga_ajax_obj.strings.save_error, 'error');
                
                // คืนค่า loading state
                input.disabled = false;
                saveButton.textContent = originalSaveText;
                input.focus();
            }
        })
        .catch(error => {
            console.error('Error saving view count:', error);
            showMessage(dga_ajax_obj.strings.save_error, 'error');
            
            // คืนค่า loading state
            input.disabled = false;
            saveButton.textContent = originalSaveText;
            input.focus();
        });
    }

    /**
     * ยกเลิกการแก้ไข
     */
    function cancelEdit(input, buttonContainer, countSpan) {
        if (input && input.parentNode) {
            input.parentNode.removeChild(input);
        }
        if (buttonContainer && buttonContainer.parentNode) {
            buttonContainer.parentNode.removeChild(buttonContainer);
        }
        countSpan.style.display = '';
    }

    /**
     * แสดงข้อความแจ้งเตือน
     */
    function showMessage(message, type = 'info') {
        // ลบข้อความเก่าถ้ามี
        const existingMessage = document.querySelector('.dga-message-sc19');
        if (existingMessage) {
            existingMessage.remove();
        }

        // สร้างข้อความใหม่
        const messageElement = document.createElement('div');
        messageElement.className = `dga-message-sc19 dga-message-${type}-sc19`;
        messageElement.textContent = message;
        messageElement.setAttribute('role', 'alert');
        messageElement.setAttribute('aria-live', 'polite');

        // แสดงข้อความ
        document.body.appendChild(messageElement);

        // ลบข้อความหลังจาก 3 วินาที
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 3000);
    }
});