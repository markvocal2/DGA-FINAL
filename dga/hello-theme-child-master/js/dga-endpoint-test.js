/**
 * DGA Endpoint Test JavaScript
 * จัดการการทดสอบ API endpoint และแสดงผลลัพธ์
 */
(function($) {
    'use strict';
    
    // ตัวแปรสำหรับเก็บสถานะ
    let currentResponse = null;
    let currentPreviewData = null;
    let isCompactView = false;
    
    $(document).ready(function() {
        initializeEndpointTester();
    });
    
    /**
     * เริ่มต้นการทำงาน
     */
    function initializeEndpointTester() {
        // ตรวจสอบว่ามี container หรือไม่
        if (!$('.dga-endpoint-test-container-xy34').length) {
            return;
        }
        
        bindEvents();
        setupFormValidation();
    }
    
    /**
     * ผูกเหตุการณ์ต่างๆ
     */
    function bindEvents() {
        // ปุ่มตัวอย่าง endpoint
        $(document).on('click', '.dga-example-btn-xy34', function(e) {
            e.preventDefault();
            const url = $(this).data('url');
            $('#dga-endpoint-url-xy34').val(url).focus();
            
            // เพิ่มสถานะ active
            $('.dga-example-btn-xy34').removeClass('active');
            $(this).addClass('active');
        });
        
        // ปุ่มทดสอบ
        $(document).on('click', '#dga-test-btn-xy34', function(e) {
            e.preventDefault();
            testApiEndpoint();
        });
        
        // การเปลี่ยน HTTP method
        $(document).on('change', '#dga-http-method-xy34', function() {
            const method = $(this).val();
            const postParams = $('#dga-post-params-xy34');
            
            if (method === 'POST') {
                postParams.slideDown(300);
            } else {
                postParams.slideUp(300);
            }
        });
        
        // Navigation ของ tabs
        $(document).on('click', '.dga-tab-btn-xy34', function() {
            const targetTab = $(this).data('tab');
            switchTab(targetTab);
        });
        
        // ปุ่มคัดลอก
        $(document).on('click', '#dga-copy-response-xy34', function() {
            copyResponseToClipboard();
        });
        
        // ปุ่มเปลี่ยนมุมมอง
        $(document).on('click', '#dga-toggle-view-xy34', function() {
            togglePreviewView();
        });
        
        // Enter key ใน URL input
        $(document).on('keypress', '#dga-endpoint-url-xy34', function(e) {
            if (e.which === 13) {
                e.preventDefault();
                testApiEndpoint();
            }
        });
        
        // Help section toggle
        $(document).on('click', '.dga-help-details-xy34 summary', function() {
            // ใช้ browser default behavior สำหรับ details/summary
        });
    }
    
    /**
     * ตั้งค่าการตรวจสอบฟอร์ม
     */
    function setupFormValidation() {
        // Real-time URL validation
        $(document).on('input', '#dga-endpoint-url-xy34', function() {
            const url = $(this).val().trim();
            const testBtn = $('#dga-test-btn-xy34');
            
            if (url && isValidUrl(url)) {
                testBtn.prop('disabled', false);
                $(this).removeClass('error');
            } else {
                testBtn.prop('disabled', true);
                if (url) {
                    $(this).addClass('error');
                }
            }
        });
        
        // JSON validation สำหรับ headers และ post data
        $(document).on('input', '#dga-custom-headers-xy34, #dga-post-data-xy34', function() {
            validateJsonInput($(this));
        });
    }
    
    /**
     * ตรวจสอบความถูกต้องของ URL
     */
    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }
    
    /**
     * ตรวจสอบ JSON input
     */
    function validateJsonInput($element) {
        const value = $element.val().trim();
        
        if (!value) {
            $element.removeClass('error valid');
            return true;
        }
        
        try {
            JSON.parse(value);
            $element.removeClass('error').addClass('valid');
            return true;
        } catch (e) {
            $element.removeClass('valid').addClass('error');
            return false;
        }
    }
    
    /**
     * ทดสอบ API endpoint
     */
    function testApiEndpoint() {
        const endpointUrl = $('#dga-endpoint-url-xy34').val().trim();
        const httpMethod = $('#dga-http-method-xy34').val();
        const customHeaders = $('#dga-custom-headers-xy34').val().trim();
        const postData = $('#dga-post-data-xy34').val().trim();
        
        // ตรวจสอบ URL
        if (!endpointUrl) {
            showNotification(dgaEndpointTestData.strings.error_url_required, 'error');
            return;
        }
        
        if (!isValidUrl(endpointUrl)) {
            showNotification('URL ไม่ถูกต้อง โปรดตรวจสอบรูปแบบ URL', 'error');
            return;
        }
        
        // ตรวจสอบ JSON ถ้ามี
        if (customHeaders && !validateJsonInput($('#dga-custom-headers-xy34'))) {
            showNotification('รูปแบบ Headers ไม่ถูกต้อง', 'error');
            return;
        }
        
        if (httpMethod === 'POST' && postData && !validateJsonInput($('#dga-post-data-xy34'))) {
            showNotification('รูปแบบ POST Data ไม่ถูกต้อง', 'error');
            return;
        }
        
        // แสดง loading state
        showLoadingState();
        
        // ส่ง AJAX request
        $.ajax({
            url: dgaEndpointTestData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'dga_test_api_endpoint',
                nonce: dgaEndpointTestData.nonce,
                endpoint: endpointUrl,
                method: httpMethod,
                headers: customHeaders,
                post_data: postData
            },
            timeout: 45000, // 45 seconds timeout
            success: function(response) {
                if (response.success) {
                    displayResults(response.data);
                    showNotification('ทดสอบ API สำเร็จ', 'success');
                } else {
                    displayError(response.data);
                }
            },
            error: function(xhr, status, error) {
                let errorMessage = dgaEndpointTestData.strings.error_connection;
                
                if (status === 'timeout') {
                    errorMessage = 'การเชื่อมต่อ API ใช้เวลานานเกินไป';
                } else if (xhr.responseText) {
                    try {
                        const errorData = JSON.parse(xhr.responseText);
                        errorMessage = errorData.message || errorMessage;
                    } catch (e) {
                        // ใช้ error message default
                    }
                }
                
                showNotification(errorMessage, 'error');
                hideLoadingState();
            },
            complete: function() {
                hideLoadingState();
            }
        });
    }
    
    /**
     * แสดง loading state
     */
    function showLoadingState() {
        const resultsContainer = $('#dga-results-xy34');
        const loadingIndicator = $('#dga-loading-xy34');
        const testBtn = $('#dga-test-btn-xy34');
        
        // แสดง results container และ loading
        resultsContainer.show();
        loadingIndicator.show();
        
        // Disable ปุ่มทดสอบ
        testBtn.prop('disabled', true).addClass('loading');
        
        // ซ่อนผลลัพธ์เก่า
        resetResultsDisplay();
    }
    
    /**
     * ซ่อน loading state
     */
    function hideLoadingState() {
        const loadingIndicator = $('#dga-loading-xy34');
        const testBtn = $('#dga-test-btn-xy34');
        
        loadingIndicator.hide();
        testBtn.prop('disabled', false).removeClass('loading');
    }
    
    /**
     * แสดงผลลัพธ์
     */
    function displayResults(data) {
        currentResponse = data.response;
        currentPreviewData = data.preview_data;
        
        // แสดงสถานะและเวลาตอบสนอง
        displayStatusInfo(data);
        
        // แสดงข้อมูลใน tabs
        displayResponseData(data);
        displayHeadersData(data);
        displayPreviewData(data.preview_data);
        
        // เปิด tab แรก
        switchTab('response');
        
        // แสดง results container
        $('#dga-results-xy34').show();
    }
    
    /**
     * แสดงข้อมูลสถานะ
     */
    function displayStatusInfo(data) {
        const statusElement = $('#dga-status-value-xy34');
        const timeElement = $('#dga-response-time-xy34');
        
        // แสดงสถานะ
        const statusCode = data.status_code;
        const statusText = statusCode + (statusCode >= 200 && statusCode < 300 ? ' (สำเร็จ)' : ' (ข้อผิดพลาด)');
        statusElement.text(statusText);
        
        // เพิ่ม CSS class ตามสถานะ
        statusElement.removeClass('success error');
        if (statusCode >= 200 && statusCode < 300) {
            statusElement.addClass('success');
        } else {
            statusElement.addClass('error');
        }
        
        // แสดงเวลาตอบสนอง
        timeElement.text(data.response_time);
    }
    
    /**
     * แสดงข้อมูล response
     */
    function displayResponseData(data) {
        const responseElement = $('#dga-response-json-xy34');
        const formattedJson = JSON.stringify(data.response, null, 2);
        responseElement.text(formattedJson);
    }
    
    /**
     * แสดงข้อมูล headers
     */
    function displayHeadersData(data) {
        const headersElement = $('#dga-response-headers-xy34');
        
        let headersText = '';
        if (data.headers && typeof data.headers === 'object') {
            for (const [key, value] of Object.entries(data.headers)) {
                headersText += `${key}: ${value}\n`;
            }
        } else {
            headersText = JSON.stringify(data.headers, null, 2);
        }
        
        headersElement.text(headersText);
    }
    
    /**
     * แสดงตัวอย่างข้อมูล
     */
    function displayPreviewData(previewData) {
        const previewElement = $('#dga-data-preview-xy34');
        
        if (!previewData || previewData.type === 'error') {
            previewElement.html(`
                <div class="dga-preview-message-xy34 error">
                    ${previewData?.message || 'ไม่สามารถแสดงตัวอย่างข้อมูลได้'}
                </div>
            `);
            return;
        }
        
        let html = '';
        
        switch (previewData.type) {
            case 'list':
                html = generateListPreview(previewData);
                break;
            case 'table':
                html = generateTablePreview(previewData);
                break;
            case 'raw':
                html = generateRawPreview(previewData);
                break;
            default:
                html = '<div class="dga-preview-message-xy34">รูปแบบข้อมูลไม่รองรับ</div>';
        }
        
        previewElement.html(html);
    }
    
    /**
     * สร้างตัวอย่างแบบรายการ
     */
    function generateListPreview(data) {
        let html = `<div class="dga-preview-header-xy34">
            <h5>${data.title}</h5>
            <span class="dga-preview-count-xy34">แสดง ${Math.min(data.data.length, 20)} จาก ${data.total} รายการ</span>
        </div>`;
        
        html += '<ul class="dga-preview-list-xy34">';
        data.data.slice(0, 20).forEach((item, index) => {
            html += `<li><span class="dga-list-index-xy34">${index + 1}.</span> ${escapeHtml(item)}</li>`;
        });
        html += '</ul>';
        
        if (data.total > 20) {
            html += `<div class="dga-preview-more-xy34">...และอีก ${data.total - 20} รายการ</div>`;
        }
        
        return html;
    }
    
    /**
     * สร้างตัวอย่างแบบตาราง
     */
    function generateTablePreview(data) {
        if (!Array.isArray(data.data) || data.data.length === 0) {
            return '<div class="dga-preview-message-xy34">ไม่มีข้อมูลสำหรับแสดง</div>';
        }
        
        const maxRows = isCompactView ? 5 : 10;
        const displayData = data.data.slice(0, maxRows);
        const firstItem = data.data[0];
        const columns = Object.keys(firstItem);
        const maxCols = isCompactView ? 4 : columns.length;
        
        let html = `<div class="dga-preview-header-xy34">
            <h5>${data.title}</h5>
            <span class="dga-preview-count-xy34">แสดง ${displayData.length} จาก ${data.total} รายการ</span>
        </div>`;
        
        html += '<div class="dga-table-container-xy34">';
        html += '<table class="dga-preview-table-xy34">';
        
        // Headers
        html += '<thead><tr>';
        columns.slice(0, maxCols).forEach(col => {
            html += `<th>${escapeHtml(col)}</th>`;
        });
        if (columns.length > maxCols) {
            html += '<th>...</th>';
        }
        html += '</tr></thead>';
        
        // Rows
        html += '<tbody>';
        displayData.forEach(row => {
            html += '<tr>';
            columns.slice(0, maxCols).forEach(col => {
                const value = row[col];
                html += `<td>${formatCellValue(value)}</td>`;
            });
            if (columns.length > maxCols) {
                html += '<td>...</td>';
            }
            html += '</tr>';
        });
        html += '</tbody>';
        
        html += '</table>';
        html += '</div>';
        
        if (data.total > maxRows) {
            html += `<div class="dga-preview-more-xy34">...และอีก ${data.total - maxRows} รายการ</div>`;
        }
        
        return html;
    }
    
    /**
     * สร้างตัวอย่างแบบข้อมูลดิบ
     */
    function generateRawPreview(data) {
        return `
            <div class="dga-preview-header-xy34">
                <h5>${data.title}</h5>
            </div>
            <pre class="dga-raw-preview-xy34">${JSON.stringify(data.data, null, 2)}</pre>
        `;
    }
    
    /**
     * จัดรูปแบบค่าในเซลล์ตาราง
     */
    function formatCellValue(value) {
        if (value === null || value === undefined) {
            return '<span class="dga-null-value-xy34">null</span>';
        }
        
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }
        
        if (typeof value === 'object') {
            const jsonStr = JSON.stringify(value);
            const truncated = jsonStr.length > 50 ? jsonStr.substring(0, 50) + '...' : jsonStr;
            return `<span class="dga-object-value-xy34" title="${escapeHtml(jsonStr)}">${escapeHtml(truncated)}</span>`;
        }
        
        const stringValue = String(value);
        const truncated = stringValue.length > 100 ? stringValue.substring(0, 100) + '...' : stringValue;
        return escapeHtml(truncated);
    }
    
    /**
     * แสดงข้อผิดพลาด
     */
    function displayError(errorData) {
        const resultsContainer = $('#dga-results-xy34');
        
        // แสดง error ใน preview tab
        const previewElement = $('#dga-data-preview-xy34');
        previewElement.html(`
            <div class="dga-error-display-xy34">
                <h5>เกิดข้อผิดพลาด</h5>
                <p>${errorData.message}</p>
                ${errorData.error_code ? `<p><strong>Error Code:</strong> ${errorData.error_code}</p>` : ''}
                ${errorData.response_time ? `<p><strong>Response Time:</strong> ${errorData.response_time}</p>` : ''}
            </div>
        `);
        
        // แสดง results container และเปิด preview tab
        resultsContainer.show();
        switchTab('preview');
        
        showNotification(errorData.message, 'error');
    }
    
    /**
     * เปลี่ยน tab
     */
    function switchTab(tabName) {
        // Update tab buttons
        $('.dga-tab-btn-xy34').removeClass('active');
        $(`.dga-tab-btn-xy34[data-tab="${tabName}"]`).addClass('active');
        
        // Update tab panes
        $('.dga-tab-pane-xy34').removeClass('active');
        $(`#dga-tab-${tabName}-xy34`).addClass('active');
    }
    
    /**
     * คัดลอกผลลัพธ์
     */
    function copyResponseToClipboard() {
        if (!currentResponse) {
            showNotification('ไม่มีข้อมูลให้คัดลอก', 'error');
            return;
        }
        
        const text = JSON.stringify(currentResponse, null, 2);
        
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                showNotification(dgaEndpointTestData.strings.success_copied, 'success');
            }).catch(() => {
                fallbackCopyToClipboard(text);
            });
        } else {
            fallbackCopyToClipboard(text);
        }
    }
    
    /**
     * Fallback method สำหรับคัดลอก
     */
    function fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showNotification(dgaEndpointTestData.strings.success_copied, 'success');
        } catch (err) {
            showNotification('ไม่สามารถคัดลอกได้', 'error');
        }
        
        document.body.removeChild(textArea);
    }
    
    /**
     * เปลี่ยนมุมมองตัวอย่าง
     */
    function togglePreviewView() {
        isCompactView = !isCompactView;
        const toggleBtn = $('#dga-toggle-view-xy34');
        
        toggleBtn.text(isCompactView ? 
            dgaEndpointTestData.strings.view_full : 
            dgaEndpointTestData.strings.view_compact
        );
        
        // Re-render preview with new view mode
        if (currentPreviewData) {
            displayPreviewData(currentPreviewData);
        }
    }
    
    /**
     * รีเซ็ตการแสดงผล
     */
    function resetResultsDisplay() {
        $('#dga-status-value-xy34').text('-').removeClass('success error');
        $('#dga-response-time-xy34').text('-');
        $('#dga-response-json-xy34').text('');
        $('#dga-response-headers-xy34').text('');
        $('#dga-data-preview-xy34').html('');
    }
    
    /**
     * แสดงการแจ้งเตือน
     */
    function showNotification(message, type = 'info') {
        // สร้าง notification element
        const notification = $(`
            <div class="dga-notification-xy34 dga-notification-${type}-xy34">
                <span class="dga-notification-message-xy34">${message}</span>
                <button class="dga-notification-close-xy34" type="button">&times;</button>
            </div>
        `);
        
        // เพิ่มลงใน container
        let container = $('.dga-notifications-container-xy34');
        if (!container.length) {
            container = $('<div class="dga-notifications-container-xy34"></div>');
            $('.dga-endpoint-test-container-xy34').prepend(container);
        }
        
        container.append(notification);
        
        // แสดงด้วย animation
        notification.addClass('show');
        
        // ปุ่มปิด
        notification.find('.dga-notification-close-xy34').on('click', function() {
            notification.removeClass('show');
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto-hide หลัง 5 วินาที
        setTimeout(() => {
            if (notification.length) {
                notification.removeClass('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
    
    /**
     * Escape HTML characters
     */
    function escapeHtml(text) {
        if (typeof text !== 'string') {
            return text;
        }
        
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return text.replace(/[&<>"']/g, m => map[m]);
    }
})(jQuery);