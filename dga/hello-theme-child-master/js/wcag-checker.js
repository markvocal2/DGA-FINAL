/**
 * WCAG Checker JavaScript - Fixed Version
 * แก้ไขให้แสดง Logo WCAG ที่บันทึกไว้ได้เสมอ
 */

jQuery(document).ready(function($) {
    'use strict';
    
    // Cache DOM elements
    const $container = $('.wcag-checker-container');
    const $loading = $container.find('.wcag-loading');
    const $results = $container.find('.wcag-results');
    const $grade = $container.find('.wcag-grade');
    const $checkButton = $container.find('.wcag-check-now');
    const $detailsToggle = $container.find('.wcag-details-toggle');
    const $details = $container.find('.wcag-details');
    const $modal = $('#wcag-modal');
    const $modalContent = $('#wcag-modal-body');
    const $loadingText = $container.find('.wcag-loading-text');
    const $loadingDetails = $container.find('.wcag-loading-details');
    const $debug = $container.find('.wcag-debug');
    
    // Debug logging
    function debugLog(message, data) {
        if (wcagAjax.debug && $debug.length) {
            const timestamp = new Date().toLocaleTimeString();
            let logEntry = `[${timestamp}] ${message}`;
            if (data) {
                logEntry += '\n' + JSON.stringify(data, null, 2);
            }
            $debug.append(logEntry + '\n\n');
            $debug.scrollTop($debug[0].scrollHeight);
        }
        
        // Also log to console in debug mode
        if (wcagAjax.debug) {
            console.log('[WCAG Checker]', message, data || '');
        }
    }
    
    // Initialize - ไม่ต้องแสดง saved grade อีกเพราะ PHP แสดงไว้แล้ว
    function initializeDisplay() {
        debugLog('Initializing display', {
            savedGrade: wcagAjax.savedGrade,
            savedScore: wcagAjax.savedScore,
            isAdmin: wcagAjax.isAdmin,
            lastCheck: wcagAjax.lastCheck
        });
        
        // ถ้ามี saved grade และเป็น admin ให้แสดงปุ่ม details
        if (wcagAjax.savedGrade && wcagAjax.isAdmin) {
            $detailsToggle.show();
        }
        
        // ถ้า PHP ยังไม่ได้แสดง logo (กรณีที่อาจมีปัญหา) ให้ JS แสดงเอง
        if (wcagAjax.savedGrade && $grade.is(':empty')) {
            debugLog('Grade container is empty, displaying via JS');
            displayGradeLogo(wcagAjax.savedGrade, wcagAjax.savedScore);
        }
    }
    
    // Display grade logo พร้อมวันที่ตรวจสอบ
    function displayGradeLogo(grade, score, includeLastCheck = true) {
        let logoHtml = '';
        
        if (grade && wcagAjax.logoUrls[grade]) {
            logoHtml = `
                <div class="wcag-logo-container">
                    <img src="${wcagAjax.logoUrls[grade]}" 
                         alt="WCAG 2.1 Level ${grade} conformance" 
                         class="wcag-logo"
                         width="88" 
                         height="31" />
                    <span class="wcag-score">${score ? score.toFixed(1) : '0.0'}%</span>
                </div>
            `;
        } else {
            // No grade - show fail status
            logoHtml = `
                <div class="wcag-no-grade">
                    <p>ไม่ผ่านมาตรฐาน WCAG 2.1</p>
                    <span class="wcag-score">${score ? score.toFixed(1) : '0.0'}%</span>
                </div>
            `;
        }
        
        // เพิ่มวันที่ตรวจสอบล่าสุด
        if (includeLastCheck && wcagAjax.lastCheck) {
            const date = new Date(wcagAjax.lastCheck);
            const formattedDate = date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            logoHtml += `<div class="wcag-last-check">ตรวจสอบล่าสุด: ${formattedDate}</div>`;
        }
        
        $grade.html(logoHtml);
        
        debugLog('Grade logo displayed', { grade: grade, score: score });
    }
    
    // Refresh saved grade from server
    function refreshSavedGrade() {
        debugLog('Refreshing saved grade from server');
        
        $.ajax({
            url: wcagAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'wcag_get_saved_grade',
                url: wcagAjax.currentUrl,
                nonce: wcagAjax.nonce
            },
            success: function(response) {
                if (response.success && response.data.grade) {
                    debugLog('Saved grade retrieved', response.data);
                    
                    // Update global variables
                    wcagAjax.savedGrade = response.data.grade;
                    wcagAjax.savedScore = response.data.score;
                    wcagAjax.lastCheck = response.data.lastCheck;
                    
                    // Display the grade
                    displayGradeLogo(response.data.grade, response.data.score);
                    
                    // Show details toggle for admin
                    if (wcagAjax.isAdmin) {
                        $detailsToggle.show();
                    }
                }
            },
            error: function(xhr, status, error) {
                debugLog('Error refreshing saved grade', { status: status, error: error });
            }
        });
    }
    
    // Handle check button click (admin only)
    if (wcagAjax.isAdmin) {
        $checkButton.on('click', function() {
            debugLog('Starting WCAG check');
            runWCAGCheck();
        });
    }
    
    // Handle details toggle
    $detailsToggle.on('click', function() {
        $details.slideToggle();
        $(this).text($(this).text() === 'แสดงรายละเอียด' ? 'ซ่อนรายละเอียด' : 'แสดงรายละเอียด');
    });
    
    // Modal close
    $('.wcag-modal-close, .wcag-modal').on('click', function(e) {
        if (e.target === this) {
            $modal.fadeOut();
        }
    });
    
    // Run WCAG check
    function runWCAGCheck() {
        $loading.show();
        $results.addClass('loading');
        $checkButton.prop('disabled', true);
        $loadingText.text('กำลังตรวจสอบ...');
        $loadingDetails.text('กำลังเชื่อมต่อกับเซิร์ฟเวอร์...');
        
        const data = {
            action: 'wcag_check',
            url: wcagAjax.currentUrl,
            severity: wcagAjax.severity || 'medium',
            nonce: wcagAjax.nonce
        };
        
        debugLog('Sending AJAX request', data);
        
        $.ajax({
            url: wcagAjax.ajaxurl,
            type: 'POST',
            data: data,
            dataType: 'json',
            timeout: 120000, // 2 minutes timeout
            success: function(response) {
                debugLog('Raw response', response);
                
                if (response && response.success) {
                    debugLog('Success response data', response.data);
                    displayResults(response.data);
                    
                    // Update saved values
                    wcagAjax.savedGrade = response.data.grade;
                    wcagAjax.savedScore = response.data.score;
                    wcagAjax.lastCheck = new Date().toISOString();
                } else {
                    const errorMsg = response.data ? (response.data.message || 'Unknown error') : 'No error message';
                    debugLog('Error response', response.data);
                    showError(errorMsg);
                }
            },
            error: function(xhr, status, error) {
                debugLog('AJAX error', { 
                    status: status, 
                    error: error, 
                    responseText: xhr.responseText,
                    responseStatus: xhr.status
                });
                
                let errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
                
                if (status === 'timeout') {
                    errorMessage = 'หมดเวลาการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง';
                } else if (status === 'parsererror') {
                    errorMessage = 'ข้อมูลที่ได้รับจากเซิร์ฟเวอร์ไม่ถูกต้อง';
                } else if (xhr.status === 404) {
                    errorMessage = 'ไม่พบ AJAX endpoint (404)';
                } else if (xhr.status === 500) {
                    errorMessage = 'เซิร์ฟเวอร์เกิดข้อผิดพลาด (500)';
                }
                
                showError(errorMessage);
            },
            complete: function() {
                $loading.hide();
                $results.removeClass('loading');
                $checkButton.prop('disabled', false);
            }
        });
    }
    
    // Display results
    function displayResults(data) {
        debugLog('Displaying results', data);
        
        // Show grade logo with new check date
        displayGradeLogo(data.grade, data.score, false);
        
        // Add new check date
        const currentDate = new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        $grade.append(`<div class="wcag-last-check">ตรวจสอบล่าสุด: ${currentDate}</div>`);
        
        // Only show details for admin
        if (wcagAjax.isAdmin) {
            // Build details HTML
            let detailsHtml = '<div class="wcag-checks">';
            
            // Categories mapping
            const categoryNames = {
                'contrast': 'ความคมชัดของสี',
                'alt_text': 'ข้อความทางเลือกสำหรับรูปภาพ',
                'headers': 'โครงสร้างหัวข้อ',
                'aria': 'ARIA Labels',
                'keyboard': 'การใช้งานด้วยคีย์บอร์ด',
                'forms': 'ฟอร์มและป้ายกำกับ',
                'links': 'ลิงก์และการนำทาง'
            };
            
            // Display each category
            Object.keys(data.checks).forEach(function(category) {
                const check = data.checks[category];
                const passed = check.passed;
                const violations = check.violations || [];
                
                detailsHtml += `
                    <div class="wcag-check-item ${passed ? 'passed' : 'failed'}">
                        <div class="check-header">
                            <span class="check-icon">${passed ? '✓' : '✗'}</span>
                            <span class="check-name">${categoryNames[category] || category}</span>
                            <span class="check-stats">
                                ${check.checked}/${check.total} ตรวจสอบแล้ว
                                ${violations.length > 0 ? ` - ${violations.length} ข้อผิดพลาด` : ''}
                            </span>
                        </div>
                        ${!passed ? buildViolationsList(violations) : ''}
                    </div>
                `;
            });
            
            detailsHtml += '</div>';
            
            // Add processing info if available
            if (data.processing_info) {
                detailsHtml += `
                    <div class="wcag-processing-info">
                        <p>ใช้มาตรฐาน: ${data.processing_info.guideline_used}</p>
                        <p>จำนวนการตรวจสอบทั้งหมด: ${data.processing_info.total_checks} รายการ</p>
                    </div>
                `;
            }
            
            $details.html(detailsHtml);
            $detailsToggle.show();
            
            // Bind click events for violations
            $('.violation-item').on('click', function() {
                const $this = $(this);
                const elementHtml = $this.data('element');
                const message = $this.find('.violation-message').text();
                
                showElementDetails(message, elementHtml);
            });
        }
    }
    
    // Build violations list
    function buildViolationsList(violations) {
        if (violations.length === 0) return '';
        
        let html = '<div class="violations-list">';
        
        violations.forEach(function(violation, index) {
            const impactClass = getImpactClass(violation.impact);
            html += `
                <div class="violation-item" data-element="${escapeHtml(violation.element)}">
                    <span class="violation-impact ${impactClass}">${violation.impact || 'moderate'}</span>
                    <span class="violation-message">${escapeHtml(violation.message)}</span>
                    ${violation.line ? `<span class="violation-line">บรรทัด: ${violation.line}</span>` : ''}
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    // Show element details in modal
    function showElementDetails(message, elementHtml) {
        let content = `
            <h3>รายละเอียดข้อผิดพลาด</h3>
            <div class="modal-section">
                <h4>ข้อความ:</h4>
                <p>${escapeHtml(message)}</p>
            </div>
            <div class="modal-section">
                <h4>Element HTML:</h4>
                <pre class="element-code">${escapeHtml(elementHtml)}</pre>
            </div>
        `;
        
        $modalContent.html(content);
        $modal.fadeIn();
    }
    
    // Show error message
    function showError(message) {
        $grade.html(`
            <div class="wcag-error">
                <p>${escapeHtml(message)}</p>
            </div>
        `);
        $detailsToggle.hide();
    }
    
    // Get impact class
    function getImpactClass(impact) {
        switch (impact) {
            case 'critical': return 'impact-critical';
            case 'serious': return 'impact-serious';
            case 'moderate': return 'impact-moderate';
            case 'minor': return 'impact-minor';
            default: return 'impact-moderate';
        }
    }
    
    // Escape HTML
    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    // Initialize on page load
    initializeDisplay();
    
    // ถ้าไม่มี saved grade ให้ลองดึงจาก server อีกครั้ง
    if (!wcagAjax.savedGrade && !$grade.find('.wcag-logo-container').length) {
        debugLog('No saved grade found, attempting to refresh from server');
        refreshSavedGrade();
    }
});