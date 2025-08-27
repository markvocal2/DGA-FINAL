/**
 * DGA Complaint Search System
 * Version: 1.2.0
 * แก้ไขการแสดงผลให้อยู่ในรูปแบบ Popup แยกออกจาก ShortCode
 */

(function($) {
    // เพื่อให้รู้ว่า script นี้ถูกโหลดแล้ว
    console.log('[Complaint Search] External JS loaded v1.2.0');
    
    // ประกาศตัวแปรทั่วไป
    let isInitialized = false;
    let isAnimating = false;
    
    function initialize() {
        if (isInitialized) return;
        
        const toggleBtn = document.getElementById('dga-complaint-toggle-btn');
        const searchForm = document.getElementById('dga-complaint-search-form');
        const refInput = document.getElementById('complaint-ref');
        const form = document.getElementById('complaint-search-form');
        const resultPopup = document.getElementById('complaint-result-popup');
        const popupOverlay = document.querySelector('.complaint-popup-overlay');
        
        if (!toggleBtn || !searchForm || !refInput || !form || !resultPopup) {
            // หากยังไม่พบองค์ประกอบที่จำเป็น รอและลองใหม่อีกครั้ง
            setTimeout(initialize, 100);
            return;
        }
        
        console.log('[Complaint Search] All elements found, initializing...');
        
        // ล้าง event listeners เดิม
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        
        // เพิ่ม event listener สำหรับปุ่มแสดงฟอร์ม (แก้ไขปัญหาคลิกสองครั้ง)
        newToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // ป้องกันการคลิกซ้ำระหว่างที่กำลัง animate
            if (isAnimating) return;
            isAnimating = true;
            
            const isExpanded = newToggleBtn.getAttribute('aria-expanded') === 'true';
            
            if (isExpanded) {
                // ปิดฟอร์ม
                searchForm.classList.remove('expanded');
                newToggleBtn.setAttribute('aria-expanded', 'false');
                searchForm.setAttribute('aria-hidden', 'true');
                searchForm.style.width = '0';
                searchForm.style.opacity = '0';
                searchForm.style.padding = '0';
                searchForm.style.visibility = 'hidden';
            } else {
                // เปิดฟอร์ม
                searchForm.classList.add('expanded');
                newToggleBtn.setAttribute('aria-expanded', 'true');
                searchForm.setAttribute('aria-hidden', 'false');
                searchForm.style.width = '500px';
                searchForm.style.opacity = '1';
                searchForm.style.padding = '1.5rem';
                searchForm.style.visibility = 'visible';
                
                // โฟกัสที่ช่องค้นหาหลังจาก animation เสร็จสิ้น
                setTimeout(function() {
                    if (refInput) {
                        refInput.focus();
                        
                        // เลือกข้อความในช่องค้นหาเพื่อให้ผู้ใช้พิมพ์ทับได้ทันที
                        refInput.setSelectionRange(4, refInput.value.length);
                    }
                }, 300);
            }
            
            // รีเซ็ตสถานะ animation หลังจากเสร็จสิ้น
            setTimeout(function() {
                isAnimating = false;
            }, 300);
        });
        
        // Auto-format CPL- prefix ในช่องค้นหา
        if (refInput) {
            // ตั้งค่าเริ่มต้นให้มี CPL-
            if (!refInput.value) {
                refInput.value = complaintSearchAjax.prefix || 'CPL-';
            }
            
            // เมื่อมีการพิมพ์ ตรวจสอบว่ามี prefix หรือไม่
            refInput.addEventListener('input', function() {
                const prefix = complaintSearchAjax.prefix || 'CPL-';
                
                // ถ้าลบ prefix ออกไป ใส่กลับมาใหม่
                if (!this.value.startsWith(prefix)) {
                    this.value = prefix + this.value.replace(prefix, '');
                }
                
                // ล้างข้อความแจ้งเตือนข้อผิดพลาด
                const refError = document.getElementById('complaint-ref-error');
                if (refError) refError.textContent = '';
            });
            
            // เมื่อคลิกที่ช่องค้นหา ให้เลือกข้อความหลัง prefix
            refInput.addEventListener('click', function() {
                const prefix = complaintSearchAjax.prefix || 'CPL-';
                
                if (this.value.startsWith(prefix) && this.value.length >= prefix.length) {
                    this.setSelectionRange(prefix.length, this.value.length);
                }
            });
            
            // เมื่อ focus ที่ช่องค้นหา ให้เลือกข้อความหลัง prefix
            refInput.addEventListener('focus', function() {
                const prefix = complaintSearchAjax.prefix || 'CPL-';
                
                if (this.value.startsWith(prefix) && this.value.length >= prefix.length) {
                    this.setSelectionRange(prefix.length, this.value.length);
                }
            });
        }
        
        // เพิ่ม event listener สำหรับการปิด popup เมื่อคลิกที่ overlay
        if (popupOverlay) {
            popupOverlay.addEventListener('click', function() {
                closePopup();
            });
        }

        // ปิด popup เมื่อกด Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && resultPopup.classList.contains('active')) {
                closePopup();
            }
        });
        
        // เพิ่ม event listener สำหรับฟอร์มค้นหา
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                if (!refInput || !refInput.value.trim()) {
                    const refError = document.getElementById('complaint-ref-error');
                    if (refError) {
                        refError.textContent = 'กรุณาระบุหมายเลขเรื่องร้องเรียน';
                    }
                    if (refInput) refInput.focus();
                    return;
                }
                
                searchComplaint();
            });
        }
        
        isInitialized = true;
    }
    
    // ฟังก์ชันค้นหาเรื่องร้องเรียน
    function searchComplaint() {
        const refInput = document.getElementById('complaint-ref');
        const refError = document.getElementById('complaint-ref-error');
        const loadingEl = document.getElementById('complaint-search-loading');
        const resultEl = document.getElementById('complaint-search-result');
        
        if (!refInput) {
            console.error('[Complaint Search] Reference input not found');
            return;
        }
        
        const refNumber = refInput.value.trim();
        console.log('[Complaint Search] Searching for: ' + refNumber);
        
        // ตรวจสอบค่าที่กรอก
        if (!refNumber) {
            if (refError) {
                refError.textContent = 'กรุณาระบุหมายเลขเรื่องร้องเรียน';
            }
            refInput.focus();
            return;
        }
        
        // ซ่อนผลลัพธ์เดิมและแสดงไอคอนกำลังโหลด
        if (resultEl) resultEl.innerHTML = '';
        if (loadingEl) loadingEl.style.display = 'block';
        
        // เรียกใช้ AJAX เพื่อค้นหา
        $.ajax({
            url: complaintSearchAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'complaint_search',
                nonce: complaintSearchAjax.nonce,
                ref_number: refNumber
            },
            success: function(response) {
                console.log('[Complaint Search] AJAX success:', response);
                if (loadingEl) loadingEl.style.display = 'none';
                
                if (response.success && response.data) {
                    displayResult(response.data);
                } else {
                    displayError(response.data ? response.data.message : complaintSearchAjax.error_system);
                }
            },
            error: function(xhr, status, error) {
                console.error('[Complaint Search] AJAX error:', error);
                if (loadingEl) loadingEl.style.display = 'none';
                displayError(complaintSearchAjax.error_system);
            }
        });
    }
    
    // แสดงข้อความแจ้งเตือนข้อผิดพลาด
    function displayError(message) {
        const resultEl = document.getElementById('complaint-search-result');
        const resultPopup = document.getElementById('complaint-result-popup');
        
        if (!resultEl || !resultPopup) return;
        
        resultEl.innerHTML = `
            <div class="result-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
                </div>
                <p>${message}</p>
                <button type="button" class="close-popup-btn">ปิด</button>
            </div>
        `;
        
        // แสดง popup
        resultPopup.classList.add('active');
        resultPopup.setAttribute('aria-hidden', 'false');
        
        // เพิ่ม event listener สำหรับปุ่มปิด
        const closeBtn = resultEl.querySelector('.close-popup-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closePopup);
        }
        
        // เพิ่ม attribute สำหรับ screen reader
        resultEl.setAttribute('role', 'alert');
    }
    
    // แสดงผลลัพธ์การค้นหาใน popup
    function displayResult(data) {
        const resultEl = document.getElementById('complaint-search-result');
        const resultPopup = document.getElementById('complaint-result-popup');
        
        if (!resultEl || !resultPopup) return;
        
        // สร้าง progress steps
        const progressHtml = buildProgressBar(data.current_step);
        
        // สร้าง status class
        const statusClass = getStatusClass(data.status);
        
        // สร้าง HTML สำหรับผลลัพธ์ - ปรับแต่งใหม่ให้เหมาะกับ popup
        const resultHtml = `
            <div class="result-container">
                <div class="result-header">
                    <h3>ข้อมูลเรื่องร้องเรียน</h3>
                    <button type="button" class="close-popup-btn" aria-label="${complaintSearchAjax.aria_labels.close_result || 'ปิดผลการค้นหา'}">
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>
                
                <div class="result-ref-number">
                    <span class="ref-label">เลขที่เรื่องร้องเรียน:</span>
                    <span class="ref-value">${data.ref_number}</span>
                </div>
                
                <div class="result-status-highlight">
                    <div class="status-banner ${statusClass}">
                        <div class="status-icon">
                            ${getStatusIcon(data.status)}
                        </div>
                        <div class="status-text">
                            <span>สถานะ: ${data.status}</span>
                        </div>
                    </div>
                </div>
                
                <div class="result-progress">
                    <h4>ความคืบหน้าการดำเนินการ</h4>
                    ${progressHtml}
                </div>
                
                <div class="result-details">
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">ประเภทเรื่องร้องเรียน</div>
                            <div class="detail-value">${data.complaint_type}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">หน่วยงานที่เกี่ยวข้อง</div>
                            <div class="detail-value">${data.department}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">วันที่รับเรื่อง</div>
                            <div class="detail-value">${data.complaint_date}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">กำหนดตอบกลับ</div>
                            <div class="detail-value">${data.due_date || '-'}</div>
                        </div>
                    </div>
                </div>
                
                <div class="result-summary">
                    <h4>รายละเอียดเรื่องร้องเรียน</h4>
                    <div class="summary-content">
                        ${data.details || 'ไม่มีรายละเอียดเพิ่มเติม'}
                    </div>
                </div>
            </div>
        `;
        
        resultEl.innerHTML = resultHtml;
        
        // แสดง popup
        resultPopup.classList.add('active');
        resultPopup.setAttribute('aria-hidden', 'false');
        document.body.classList.add('complaint-popup-open');
        
        // เพิ่ม event listener สำหรับปุ่มปิด
        const closeBtn = resultEl.querySelector('.close-popup-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closePopup);
        }
        
        // ลบ attribute สำหรับ screen reader
        resultEl.removeAttribute('role');
    }
    
    // ฟังก์ชันปิด popup
    function closePopup() {
        const resultPopup = document.getElementById('complaint-result-popup');
        if (!resultPopup) return;
        
        resultPopup.classList.remove('active');
        resultPopup.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('complaint-popup-open');
    }
    
    // สร้างไอคอนสำหรับสถานะ
    function getStatusIcon(status) {
        const iconMapping = {
            'รอดำเนินการ': '<i class="fas fa-clock" aria-hidden="true"></i>',
            'กำลังดำเนินการ': '<i class="fas fa-spinner" aria-hidden="true"></i>',
            'ดำเนินการเสร็จสิ้น': '<i class="fas fa-check-circle" aria-hidden="true"></i>',
            'ไม่รับพิจารณา': '<i class="fas fa-ban" aria-hidden="true"></i>',
            'ปิดเรื่อง': '<i class="fas fa-folder" aria-hidden="true"></i>'
        };
        
        return iconMapping[status] || '<i class="fas fa-info-circle" aria-hidden="true"></i>';
    }
    
    // สร้าง class สำหรับสถานะ
    function getStatusClass(status) {
        const statusMappings = {
            'รอดำเนินการ': 'status-pending',
            'กำลังดำเนินการ': 'status-in-progress',
            'ดำเนินการเสร็จสิ้น': 'status-completed',
            'ไม่รับพิจารณา': 'status-rejected',
            'ปิดเรื่อง': 'status-closed'
        };
        
        return statusMappings[status] || 'status-default';
    }
    
    // สร้าง progress bar
    function buildProgressBar(currentStep) {
        const steps = [
            { number: 1, label: 'รับเรื่อง' },
            { number: 2, label: 'ดำเนินการ' },
            { number: 3, label: 'เสร็จสิ้น' }
        ];
        
        let html = '<div class="progress-bar">';
        
        steps.forEach((step, index) => {
            const isActive = step.number <= currentStep;
            const isCompleted = step.number < currentStep;
            
            html += `
                <div class="progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
                    <div class="step-number">
                        ${isCompleted ? '<i class="fas fa-check" aria-hidden="true"></i>' : step.number}
                    </div>
                    <div class="step-label">${step.label}</div>
                </div>
            `;
            
            // เพิ่มเส้นเชื่อมระหว่างขั้นตอน (ยกเว้นหลังขั้นตอนสุดท้าย)
            if (index < steps.length - 1) {
                html += `<div class="progress-connector ${step.number < currentStep ? 'active' : ''}"></div>`;
            }
        });
        
        html += '</div>';
        return html;
    }
    
    // เปิด global access สำหรับฟังก์ชันค้นหา
    window.searchComplaint = searchComplaint;
    window.closeComplaintPopup = closePopup;
    
    // เริ่มต้นทำงานเมื่อ DOM โหลดเสร็จ
    $(document).ready(initialize);
    
    // ทำงานอีกครั้งเมื่อ window โหลดเสร็จ
    $(window).on('load', initialize);
    
})(jQuery);