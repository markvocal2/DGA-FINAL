/**
 * CKAN Data Preview JavaScript
 */
jQuery(document).ready(function($) {
    
    // Get AJAX settings from container data attributes or fallback
    var $container = $('.ckan-assets-container');
    var ajaxUrl = $container.data('ajax-url') || 
                  (typeof ckan_rp_list_ajax !== 'undefined' ? ckan_rp_list_ajax.ajax_url : null) ||
                  (typeof ajaxurl !== 'undefined' ? ajaxurl : null) ||
                  window.location.origin + '/wp-admin/admin-ajax.php';
    
    var ajaxNonce = $container.data('nonce') || 
                    (typeof ckan_rp_list_ajax !== 'undefined' ? ckan_rp_list_ajax.nonce : '');
    
    // Preview button click handler
    $(document).on('click', '.ckan-preview-btn', function() {
        var $btn = $(this);
        var encodedUrl = $btn.data('url');
        var attachmentId = $btn.data('attachment-id') || 0;
        var index = $btn.data('index');
        var fileUrl = atob(encodedUrl); // Decode base64 URL
        
        // Show preview modal
        $('#ckan-preview-modal').addClass('show');
        $('.ckan-preview-loading').show();
        $('.ckan-preview-data').hide().empty();
        
        // Store current file index for API modal
        $('#current-file-index').val(index);
        
        // Update API endpoints
        var postId = $('.ckan-assets-container').data('post-id');
        var apiFileEndpoint = window.location.origin + '/wp-json/ckan/v1/file/' + postId + '_' + index;
        $('#ckan-api-file-endpoint').text(apiFileEndpoint);
        $('#ckan-api-file-data-link').attr('href', apiFileEndpoint);
        
        // Prepare AJAX data
        var ajaxData = {
            action: 'ckan_get_file_preview',
            nonce: ajaxNonce
        };
        
        // ใช้ attachment_id ถ้ามี
        if (attachmentId > 0) {
            ajaxData.attachment_id = attachmentId;
        }
        ajaxData.file_url = fileUrl; // ส่ง URL ไปด้วยเพื่อเป็น fallback
        
        // Send AJAX request to get file content
        $.ajax({
            url: ajaxUrl,
            type: 'POST',
            data: ajaxData,
            success: function(response) {
                if (response.success) {
                    $('.ckan-preview-loading').hide();
                    
                    var data = response.data;
                    var extension = data.extension ? data.extension.toLowerCase() : '';
                    
                    // Handle different file types
                    if (data.type === 'pdf' || extension === 'pdf') {
                        // Use special PDF URL for Thai filename support
                        displayPDFPreview(data.pdf_url || fileUrl);
                    } else if (extension === 'csv') {
                        displayCSVPreview(data.content);
                    } else if (extension === 'xls' || extension === 'xlsx') {
                        displayExcelPreview(data.content);
                    } else if (extension === 'txt') {
                        displayTextPreview(data.content);
                    } else if (extension === 'json') {
                        displayJSONPreview(data.content);
                    } else if (extension === 'jpg' || extension === 'jpeg' || extension === 'png' || extension === 'gif') {
                        displayImagePreview(fileUrl);
                    } else {
                        displayTextPreview(data.content);
                    }
                } else {
                    $('.ckan-preview-loading').hide();
                    $('.ckan-preview-data').html(
                        '<div class="ckan-preview-error">' +
                        '<i class="fa fa-exclamation-triangle"></i> ' +
                        'ไม่สามารถแสดงตัวอย่างไฟล์ได้: ' + response.data +
                        '</div>'
                    ).show();
                }
            },
            error: function(xhr, status, error) {
                $('.ckan-preview-loading').hide();
                var errorMsg = 'เกิดข้อผิดพลาดในการโหลดไฟล์';
                
                // Check for specific errors
                if (xhr.status === 403) {
                    errorMsg = 'ไม่มีสิทธิ์เข้าถึงไฟล์นี้';
                } else if (xhr.status === 404) {
                    errorMsg = 'ไม่พบไฟล์ที่ต้องการ';
                } else if (xhr.status === 500) {
                    errorMsg = 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์';
                }
                
                $('.ckan-preview-data').html(
                    '<div class="ckan-preview-error">' +
                    '<i class="fa fa-exclamation-triangle"></i> ' +
                    errorMsg +
                    '</div>'
                ).show();
            }
        });
    });
    
    // Close preview modal
    $('.ckan-preview-modal-close').on('click', function() {
        $('#ckan-preview-modal').removeClass('show');
        // Clear preview data
        $('.ckan-preview-data').empty();
    });
    
    // DATA API button click
    $(document).on('click', '.data-api-btn', function() {
        $('#ckan-api-modal').addClass('show');
    });
    
    // Close API modal
    $('.ckan-api-modal-close').on('click', function() {
        $('#ckan-api-modal').removeClass('show');
    });
    
    // API Tab switching
    $('.ckan-api-tab').on('click', function() {
        var tabId = $(this).data('tab');
        
        // Remove active class from all tabs and content
        $('.ckan-api-tab').removeClass('active');
        $('.ckan-api-tab-content').removeClass('active');
        
        // Add active class to clicked tab and corresponding content
        $(this).addClass('active');
        $('#' + tabId).addClass('active');
    });
    
    // Close modals when clicking outside
    $(window).on('click', function(e) {
        if ($(e.target).is($('#ckan-preview-modal'))) {
            $('#ckan-preview-modal').removeClass('show');
            $('.ckan-preview-data').empty();
        }
        if ($(e.target).is($('#ckan-api-modal'))) {
            $('#ckan-api-modal').removeClass('show');
        }
    });
    
    // Display functions for different file types
    function displayCSVPreview(content) {
        try {
            // Parse CSV
            var lines = content.split(/\r?\n/);
            var headers = parseCSVLine(lines[0]);
            
            var tableHtml = '<div class="ckan-preview-table-wrapper">';
            tableHtml += '<table class="ckan-preview-table">';
            tableHtml += '<thead><tr>';
            
            // Headers
            headers.forEach(function(header) {
                tableHtml += '<th>' + escapeHtml(header.trim()) + '</th>';
            });
            tableHtml += '</tr></thead><tbody>';
            
            // Rows - จำกัดที่ 30 แถว
            var maxRows = Math.min(lines.length, 31); // 30 + 1 for header
            for (var i = 1; i < maxRows; i++) {
                if (lines[i].trim()) {
                    var cells = parseCSVLine(lines[i]);
                    tableHtml += '<tr>';
                    cells.forEach(function(cell) {
                        tableHtml += '<td>' + escapeHtml(cell.trim()) + '</td>';
                    });
                    tableHtml += '</tr>';
                }
            }
            
            tableHtml += '</tbody></table>';
            
            if (lines.length > 31) {
                tableHtml += '<p class="ckan-preview-note">แสดงเพียง 30 แถวแรก จากทั้งหมด ' + 
                    (lines.length - 1) + ' แถว</p>';
            }
            
            tableHtml += '</div>';
            
            // Add filter controls
            tableHtml = addFilterControls() + tableHtml;
            
            $('.ckan-preview-data').html(tableHtml).show();
            
            // Initialize filter if script is loaded
            if (typeof initializeDataFilter === 'function') {
                initializeDataFilter();
            }
        } catch (e) {
            console.error('CSV Parse Error:', e);
            $('.ckan-preview-data').html(
                '<div class="ckan-preview-error">ไม่สามารถแปลงไฟล์ CSV ได้: ' + e.message + '</div>'
            ).show();
        }
    }
    
    function displayExcelPreview(base64Content) {
        try {
            // Check if XLSX is loaded
            if (typeof XLSX === 'undefined') {
                $('.ckan-preview-data').html(
                    '<div class="ckan-preview-error">ไม่สามารถโหลด Excel library ได้</div>'
                ).show();
                return;
            }
            
            // Convert base64 to ArrayBuffer
            var data = base64ToArrayBuffer(base64Content);
            
            // Read Excel file
            var workbook = XLSX.read(data, { 
                type: 'array', 
                cellDates: true,
                cellNF: false,
                cellText: false
            });
            
            // Get first sheet
            var firstSheetName = workbook.SheetNames[0];
            var worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to array of arrays
            var jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                raw: false,
                dateNF: 'YYYY-MM-DD'
            });
            
            // Build HTML table manually with row limit
            var tableHtml = '<div class="ckan-preview-excel-wrapper">';
            tableHtml += '<div class="ckan-preview-sheet-name">Sheet: ' + escapeHtml(firstSheetName) + '</div>';
            tableHtml += '<table class="ckan-preview-table" id="excel-preview-table">';
            
            if (jsonData.length > 0) {
                // Headers
                tableHtml += '<thead><tr>';
                var headers = jsonData[0];
                if (Array.isArray(headers)) {
                    headers.forEach(function(header) {
                        tableHtml += '<th>' + escapeHtml(String(header || '')) + '</th>';
                    });
                }
                tableHtml += '</tr></thead>';
                
                // Body - จำกัดที่ 30 แถว
                tableHtml += '<tbody>';
                var maxRows = Math.min(jsonData.length, 31); // 30 + 1 for header
                for (var i = 1; i < maxRows; i++) {
                    tableHtml += '<tr>';
                    var row = jsonData[i];
                    if (Array.isArray(row)) {
                        // Make sure we have same number of cells as headers
                        for (var j = 0; j < headers.length; j++) {
                            var cellValue = row[j] !== undefined ? row[j] : '';
                            tableHtml += '<td>' + escapeHtml(String(cellValue)) + '</td>';
                        }
                    }
                    tableHtml += '</tr>';
                }
                tableHtml += '</tbody>';
            }
            
            tableHtml += '</table>';
            tableHtml += '</div>';
            
            if (jsonData.length > 31) {
                tableHtml += '<p class="ckan-preview-note">แสดงเพียง 30 แถวแรก จากทั้งหมด ' + 
                    (jsonData.length - 1) + ' แถว';
                if (workbook.SheetNames.length > 1) {
                    tableHtml += ' และแสดงเพียง Sheet แรก จากทั้งหมด ' + workbook.SheetNames.length + ' Sheets';
                }
                tableHtml += '</p>';
            } else if (workbook.SheetNames.length > 1) {
                tableHtml += '<p class="ckan-preview-note">แสดงเพียง Sheet แรก จากทั้งหมด ' + 
                    workbook.SheetNames.length + ' Sheets</p>';
            }
            
            // Add filter controls
            tableHtml = addFilterControls() + tableHtml;
            
            $('.ckan-preview-data').html(tableHtml).show();
            
            // Initialize filter if available
            if (typeof initializeDataFilter === 'function') {
                initializeDataFilter();
            }
        } catch (e) {
            console.error('Excel Parse Error:', e);
            $('.ckan-preview-data').html(
                '<div class="ckan-preview-error">ไม่สามารถแปลงไฟล์ Excel ได้: ' + e.message + '</div>'
            ).show();
        }
    }
    
    function displayPDFPreview(pdfUrl) {
        var previewHtml = '<div class="ckan-preview-pdf-wrapper">';
        previewHtml += '<iframe src="' + escapeHtml(pdfUrl) + '" width="100%" height="600px" frameborder="0" ' +
                       'allowfullscreen webkitallowfullscreen mozallowfullscreen></iframe>';
        previewHtml += '</div>';
        previewHtml += '<div class="ckan-preview-pdf-fallback">';
        previewHtml += '<p class="ckan-preview-note">หากไม่สามารถแสดง PDF ได้ ';
        previewHtml += '<a href="' + escapeHtml(pdfUrl) + '" target="_blank" class="ckan-pdf-direct-link">คลิกที่นี่เพื่อเปิดในแท็บใหม่</a> ';
        previewHtml += 'หรือดาวน์โหลดไฟล์เพื่อดูเนื้อหา</p>';
        previewHtml += '</div>';
        $('.ckan-preview-data').html(previewHtml).show();
    }
    
    function displayTextPreview(content) {
        // Limit text preview to first 5000 characters for performance
        var displayContent = content;
        var isTruncated = false;
        
        if (content.length > 5000) {
            displayContent = content.substring(0, 5000);
            isTruncated = true;
        }
        
        var previewHtml = '<div class="ckan-preview-text-wrapper">';
        previewHtml += '<pre>' + escapeHtml(displayContent) + '</pre>';
        
        if (isTruncated) {
            previewHtml += '<p class="ckan-preview-note">แสดงเพียง 5,000 ตัวอักษรแรก จากทั้งหมด ' + 
                          content.length.toLocaleString() + ' ตัวอักษร</p>';
        }
        
        previewHtml += '</div>';
        $('.ckan-preview-data').html(previewHtml).show();
    }
    
    function displayJSONPreview(content) {
        try {
            var json = JSON.parse(content);
            var formatted = JSON.stringify(json, null, 2);
            
            // Limit JSON preview
            var displayContent = formatted;
            var isTruncated = false;
            
            if (formatted.length > 5000) {
                displayContent = formatted.substring(0, 5000);
                isTruncated = true;
            }
            
            var previewHtml = '<div class="ckan-preview-text-wrapper">';
            previewHtml += '<pre class="json-preview">' + escapeHtml(displayContent) + '</pre>';
            
            if (isTruncated) {
                previewHtml += '<p class="ckan-preview-note">แสดงเพียงส่วนหนึ่งของ JSON</p>';
            }
            
            previewHtml += '</div>';
            $('.ckan-preview-data').html(previewHtml).show();
        } catch (e) {
            displayTextPreview(content);
        }
    }
    
    function displayImagePreview(url) {
        var previewHtml = '<div class="ckan-preview-image-wrapper">';
        previewHtml += '<img src="' + escapeHtml(url) + '" alt="Preview" style="max-width: 100%; height: auto;" ' +
                      'onerror="this.onerror=null; this.src=\'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjEwMCIgeT0iMTAwIiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjE5cHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+SW1hZ2UgRXJyb3I8L3RleHQ+PC9zdmc+\';">';
        previewHtml += '</div>';
        $('.ckan-preview-data').html(previewHtml).show();
    }
    
    // Helper functions
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
    
    function base64ToArrayBuffer(base64) {
        try {
            var binaryString = window.atob(base64);
            var len = binaryString.length;
            var bytes = new Uint8Array(len);
            for (var i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        } catch (e) {
            console.error('Base64 decode error:', e);
            throw new Error('ไม่สามารถถอดรหัสข้อมูลไฟล์ได้');
        }
    }
    
    function parseCSVLine(line) {
        var result = [];
        var current = '';
        var inQuotes = false;
        
        if (!line) return result;
        
        for (var i = 0; i < line.length; i++) {
            var char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }
    
    function addFilterControls() {
        return '<div class="ckan-preview-filter-controls">' +
               '<input type="text" id="ckan-preview-search" placeholder="ค้นหาข้อมูล..." class="ckan-preview-search">' +
               '<button id="ckan-preview-export-csv" class="ckan-preview-export-btn">Export CSV</button>' +
               '<button id="ckan-preview-export-excel" class="ckan-preview-export-btn">Export Excel</button>' +
               '<span class="ckan-preview-info">* แสดงเฉพาะข้อมูลที่กรองแล้ว</span>' +
               '</div>';
    }
    
    // Export functions to global scope if needed
    window.CKANPreview = {
        displayCSVPreview: displayCSVPreview,
        displayExcelPreview: displayExcelPreview,
        displayPDFPreview: displayPDFPreview,
        displayTextPreview: displayTextPreview,
        displayJSONPreview: displayJSONPreview,
        displayImagePreview: displayImagePreview
    };
});