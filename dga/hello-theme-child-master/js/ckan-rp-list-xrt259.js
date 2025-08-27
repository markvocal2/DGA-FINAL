/**
 * CKAN Repeater List JavaScript with Role-Based Access
 */
jQuery(document).ready(function($) {
    // Initialize
    var modal = $('#ckan-asset-modal-xrt259');
    var form = $('#ckan-asset-form-xrt259');
    var container = $('.ckan-assets-container-xrt259');
    var post_id = container.data('post-id') || 0;
    
    // Get AJAX settings and permissions
    var ajaxUrl = ckan_rp_list_ajax.ajax_url;
    var ajaxNonce = ckan_rp_list_ajax.nonce;
    
    // Check permission from both localized script and data attribute
    var canEditFromScript = ckan_rp_list_ajax.can_edit;
    var canEditFromData = container.data('can-edit');
    
    // Convert to boolean - check multiple formats
    var canEdit = false;
    if (canEditFromScript === true || canEditFromScript === 'true' || canEditFromScript === 1 || canEditFromScript === '1') {
        canEdit = true;
    }
    if (canEditFromData === true || canEditFromData === 'true' || canEditFromData === 1 || canEditFromData === '1') {
        canEdit = true;
    }
    
    // Debug logging
    console.log('CKAN Debug Info:');
    console.log('- canEditFromScript:', canEditFromScript, typeof canEditFromScript);
    console.log('- canEditFromData:', canEditFromData, typeof canEditFromData);
    console.log('- Final canEdit:', canEdit);
    console.log('- Add button exists:', $('.ckan-add-asset-btn-xrt259').length > 0);
    console.log('- Edit buttons count:', $('.ckan-edit-btn-xrt259').length);
    console.log('- Delete buttons count:', $('.ckan-delete-btn-xrt259').length);
    
    // Hide edit controls if user doesn't have permission
    if (!canEdit) {
        console.log('Hiding edit controls - user does not have permission');
        $('.ckan-add-asset-btn-xrt259').hide();
        $('.ckan-edit-btn-xrt259').hide();
        $('.ckan-delete-btn-xrt259').hide();
        
        // Also prevent any attempt to open edit modal
        if (modal.length > 0) {
            modal.remove();
        }
        if (form.length > 0) {
            form.remove();
        }
    } else {
        console.log('User has edit permission - showing all controls');
    }
    
    // Add asset button click (only if user has permission)
    if (canEdit) {
        $('.ckan-add-asset-btn-xrt259').on('click', function() {
            // Reset form
            form[0].reset();
            $('#ckan-asset-index-xrt259').val('');
            $('#ckan-asset-file-id-xrt259').val('');
            $('#ckan-asset-file-url-xrt259').val('');
            $('#ckan-asset-attachment-id-xrt259').val('');
            $('#ckan-current-file-xrt259').text('');
            $('.ckan-current-file-container-xrt259').hide();
            $('.ckan-upload-status-xrt259').empty();
            $('.ckan-modal-title-xrt259').text('เพิ่มรายการไฟล์');
            
            // Show modal
            modal.addClass('show');
        });
        
        // Edit asset button click
        $(document).on('click', '.ckan-edit-btn-xrt259', function() {
            if (!canEdit) {
                alert('คุณไม่มีสิทธิ์ในการแก้ไขรายการนี้');
                return;
            }
            
            var index = $(this).data('index');
            var attachmentId = $(this).data('attachment-id') || 0;
            var item = $('.ckan-asset-item-xrt259[data-index="' + index + '"]');
            var name = item.find('.ckan-asset-name-xrt259').text();
            var description = item.find('.ckan-asset-description-xrt259').text();
            var fileUrl = atob(item.find('.ckan-download-btn-xrt259').data('url'));
            var originalFilename = item.data('original-filename') || '';
            
            // Get display name
            var fileName = originalFilename || name || decodeURIComponent(fileUrl.split('/').pop());
            
            // Reset upload status
            $('.ckan-upload-status-xrt259').empty();
            
            // Set form values
            $('#ckan-asset-index-xrt259').val(index);
            $('#ckan-asset-name-xrt259').val(name);
            $('#ckan-asset-description-xrt259').val(description);
            $('#ckan-asset-file-url-xrt259').val(fileUrl);
            $('#ckan-asset-attachment-id-xrt259').val(attachmentId);
            $('#ckan-current-file-xrt259').text(fileName);
            $('.ckan-current-file-container-xrt259').show();
            $('.ckan-modal-title-xrt259').text('แก้ไขรายการไฟล์');
            
            // Show modal
            modal.addClass('show');
        });
        
        // Delete asset button click
        $(document).on('click', '.ckan-delete-btn-xrt259', function() {
            if (!canEdit) {
                alert('คุณไม่มีสิทธิ์ในการลบรายการนี้');
                return;
            }
            
            if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
                var index = $(this).data('index');
                var button = $(this);
                
                // Show loading state
                button.html('<i class="fa fa-spinner fa-spin"></i>');
                button.prop('disabled', true);
                
                // Send AJAX request
                $.ajax({
                    url: ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'ckan_delete_asset',
                        nonce: ajaxNonce,
                        post_id: post_id,
                        index: index
                    },
                    success: function(response) {
                        if (response.success) {
                            // Reload page to show updated list
                            location.reload();
                        } else {
                            alert('เกิดข้อผิดพลาด: ' + response.data);
                            // Reset button
                            button.html('<i class="fa fa-trash"></i>');
                            button.prop('disabled', false);
                        }
                    },
                    error: function() {
                        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
                        // Reset button
                        button.html('<i class="fa fa-trash"></i>');
                        button.prop('disabled', false);
                    }
                });
            }
        });
        
        // File input change - handle file upload immediately (only if user has permission)
        $('#ckan-asset-file-xrt259').on('change', function() {
            if (!canEdit) {
                alert('คุณไม่มีสิทธิ์ในการอัพโหลดไฟล์');
                $(this).val('');
                return;
            }
            
            if (this.files.length > 0) {
                var file = this.files[0];
                var statusDiv = $('.ckan-upload-status-xrt259');
                
                // Get file extension
                var fileName = file.name;
                var fileExtMatch = fileName.match(/\.([^.]+)$/);
                var fileExt = fileExtMatch ? fileExtMatch[1].toLowerCase() : '';
                
                // Check if file has extension
                if (!fileExt) {
                    statusDiv.html('<div class="ckan-upload-error-xrt259"><i class="fa fa-exclamation-circle"></i> ' +
                                  'ไฟล์ต้องมีนามสกุล (เช่น .pdf, .docx, .xlsx)</div>');
                    $(this).val('');
                    return;
                }
                
                // Check allowed file types
                var allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 
                                   'jpg', 'jpeg', 'png', 'gif', 'zip', 'rar', 'txt', 'csv', 'json'];
                
                if (!allowedTypes.includes(fileExt)) {
                    statusDiv.html('<div class="ckan-upload-error-xrt259"><i class="fa fa-exclamation-circle"></i> ' +
                                  'ประเภทไฟล์ไม่ได้รับอนุญาต. อนุญาตเฉพาะ: ' + allowedTypes.join(', ') + '</div>');
                    $(this).val('');
                    return;
                }
                
                // Check file size
                var maxSize = 100 * 1024 * 1024; // 100MB
                if (file.size > maxSize) {
                    statusDiv.html('<div class="ckan-upload-error-xrt259"><i class="fa fa-exclamation-circle"></i> ไฟล์มีขนาดใหญ่เกินไป (จำกัดที่ 100MB)</div>');
                    $(this).val('');
                    return;
                }
                
                // Show file info before upload
                var fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
                statusDiv.html('<div class="ckan-upload-info-xrt259"><i class="fa fa-info-circle"></i> ' +
                              'กำลังเตรียมอัพโหลด: ' + escapeHtml(fileName) + ' (' + fileSizeMB + ' MB)</div>');
                
                // Delay upload slightly to show info
                setTimeout(function() {
                    // Show loading indicator
                    statusDiv.html('<div class="ckan-upload-progress-xrt259"><i class="fa fa-spinner fa-spin"></i> กำลังอัพโหลด...</div>');
                    
                    // Create form data
                    var formData = new FormData();
                    formData.append('action', 'ckan_upload_file');
                    formData.append('nonce', ajaxNonce);
                    formData.append('file', file);
                    
                    // Upload file via AJAX
                    $.ajax({
                        url: ajaxUrl,
                        type: 'POST',
                        data: formData,
                        processData: false,
                        contentType: false,
                        xhr: function() {
                            var xhr = new window.XMLHttpRequest();
                            // Upload progress
                            xhr.upload.addEventListener("progress", function(evt) {
                                if (evt.lengthComputable) {
                                    var percentComplete = evt.loaded / evt.total;
                                    percentComplete = parseInt(percentComplete * 100);
                                    statusDiv.html('<div class="ckan-upload-progress-xrt259"><i class="fa fa-spinner fa-spin"></i> กำลังอัพโหลด... ' + percentComplete + '%</div>');
                                }
                            }, false);
                            return xhr;
                        },
                        success: function(response) {
                            if (response.success) {
                                // Store file info
                                $('#ckan-asset-file-id-xrt259').val(response.data.file_id);
                                $('#ckan-asset-file-url-xrt259').val(response.data.file_url);
                                $('#ckan-asset-attachment-id-xrt259').val(response.data.attachment_id);
                                
                                // Update UI with original filename
                                var displayName = response.data.file_name;
                                statusDiv.html('<div class="ckan-upload-success-xrt259"><i class="fa fa-check"></i> อัพโหลดสำเร็จ: ' + escapeHtml(displayName) + '</div>');
                                
                                // If name field is empty, use original file name as default
                                if ($('#ckan-asset-name-xrt259').val() === '') {
                                    var nameWithoutExt = displayName.split('.').slice(0, -1).join('.');
                                    $('#ckan-asset-name-xrt259').val(nameWithoutExt);
                                }
                            } else {
                                statusDiv.html('<div class="ckan-upload-error-xrt259"><i class="fa fa-exclamation-circle"></i> ข้อผิดพลาด: ' + response.data + '</div>');
                                $('#ckan-asset-file-xrt259').val('');
                            }
                        },
                        error: function(xhr, status, error) {
                            var errorMsg = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
                            if (xhr.status === 413) {
                                errorMsg = 'ไฟล์มีขนาดใหญ่เกินไป';
                            } else if (xhr.status === 415) {
                                errorMsg = 'ประเภทไฟล์ไม่ได้รับอนุญาต';
                            }
                            statusDiv.html('<div class="ckan-upload-error-xrt259"><i class="fa fa-exclamation-circle"></i> ข้อผิดพลาด: ' + errorMsg + '</div>');
                            $('#ckan-asset-file-xrt259').val('');
                        }
                    });
                }, 500);
            }
        });
        
        // Form submission (only if user has permission)
        form.on('submit', function(e) {
            e.preventDefault();
            
            if (!canEdit) {
                alert('คุณไม่มีสิทธิ์ในการบันทึกข้อมูล');
                return;
            }
            
            // Get form data
            var name = $('#ckan-asset-name-xrt259').val();
            var description = $('#ckan-asset-description-xrt259').val();
            var fileUrl = $('#ckan-asset-file-url-xrt259').val();
            var attachmentId = $('#ckan-asset-attachment-id-xrt259').val();
            var index = $('#ckan-asset-index-xrt259').val();
            
            // Validate
            if (!name) {
                alert('กรุณาระบุชื่อไฟล์');
                return;
            }
            
            if (!fileUrl && index === '') {
                alert('กรุณาอัพโหลดไฟล์');
                return;
            }
            
            // Show loading state on submit button
            var submitBtn = $('.ckan-submit-btn-xrt259');
            submitBtn.html('<i class="fa fa-spinner fa-spin"></i> กำลังบันทึก');
            submitBtn.prop('disabled', true);
            
            // Send AJAX request
            $.ajax({
                url: ajaxUrl,
                type: 'POST',
                data: {
                    action: 'ckan_save_asset',
                    nonce: ajaxNonce,
                    post_id: post_id,
                    index: index,
                    name: name,
                    description: description,
                    file_url: fileUrl,
                    attachment_id: attachmentId
                },
                success: function(response) {
                    if (response.success) {
                        // Close modal
                        modal.removeClass('show');
                        
                        // Reload page to show updated list
                        location.reload();
                    } else {
                        alert('เกิดข้อผิดพลาด: ' + response.data);
                        // Reset submit button
                        submitBtn.html('บันทึก');
                        submitBtn.prop('disabled', false);
                    }
                },
                error: function() {
                    alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
                    // Reset submit button
                    submitBtn.html('บันทึก');
                    submitBtn.prop('disabled', false);
                }
            });
        });
        
        // Close modal handlers
        $('.ckan-modal-close-xrt259, .ckan-cancel-btn-xrt259').on('click', function() {
            modal.removeClass('show');
        });
        
        // Close modal when clicking outside
        $(window).on('click', function(e) {
            if ($(e.target).is(modal)) {
                modal.removeClass('show');
            }
        });
    }
    
    // Download button click - available for all users
    $(document).on('click', '.ckan-download-btn-xrt259', function() {
        var attachmentId = $(this).data('attachment-id') || 0;
        var encodedUrl = $(this).data('url');
        
        var downloadUrl = ajaxUrl + '?action=ckan_download_file&nonce=' + ajaxNonce;
        
        if (attachmentId > 0) {
            downloadUrl += '&attachment_id=' + attachmentId;
        } else if (encodedUrl) {
            downloadUrl += '&file=' + encodedUrl;
        }
        
        window.location.href = downloadUrl;
    });
    
    // Preview button click - available for all users
    $(document).on('click', '.ckan-preview-btn-xrt259', function(e) {
        e.preventDefault();
        
        var button = $(this);
        var attachmentId = button.data('attachment-id') || 0;
        var encodedUrl = button.data('url');
        var fileIndex = button.data('index');
        
        // Decode URL
        var fileUrl = encodedUrl ? atob(encodedUrl) : '';
        
        console.log('Preview clicked - Attachment ID:', attachmentId, 'URL:', fileUrl);
        
        // Get or create preview modal
        var previewModal = $('#ckan-preview-modal-xrt259');
        if (previewModal.length === 0) {
            // Create modal if it doesn't exist
            createPreviewModal();
            previewModal = $('#ckan-preview-modal-xrt259');
        }
        
        // Show modal with loading state
        previewModal.addClass('show');
        $('.ckan-preview-data-xrt259').empty();
        $('.ckan-preview-loading-xrt259').show().html('<i class="fa fa-spinner fa-spin"></i> กำลังเตรียมข้อมูล...');
        
        // Store current file index for API modal
        $('#current-file-index').val(fileIndex);
        
        // Load preview data via AJAX
        $.ajax({
            url: ajaxUrl,
            type: 'POST',
            data: {
                action: 'ckan_get_file_preview',
                nonce: ajaxNonce,
                attachment_id: attachmentId,
                file_url: fileUrl
            },
            success: function(response) {
                $('.ckan-preview-loading-xrt259').hide();
                
                if (response.success) {
                    var data = response.data;
                    var previewContent = '';
                    
                    console.log('Preview data received:', data.type, data.extension);
                    
                    // Handle different file types
                    if (data.type === 'pdf') {
                        // PDF preview using iframe
                        var pdfUrl = data.pdf_url || data.pdf_url;
                        previewContent = '<iframe src="' + pdfUrl + '" style="width:100%;height:600px;border:none;"></iframe>';
                    } 
                    else if (data.type === 'excel') {
                        // Excel preview - limit to 20 rows
                        previewContent = '<div class="excel-preview-container">';
                        previewContent += '<div class="excel-loading"><i class="fa fa-spinner fa-spin"></i> กำลังประมวลผลไฟล์ Excel...</div>';
                        previewContent += '</div>';
                        
                        // Process Excel file
                        setTimeout(function() {
                            try {
                                var binaryData = atob(data.content);
                                var bytes = new Uint8Array(binaryData.length);
                                for (var i = 0; i < binaryData.length; i++) {
                                    bytes[i] = binaryData.charCodeAt(i);
                                }
                                
                                // Read Excel with SheetJS
                                var workbook = XLSX.read(bytes, {type: 'array'});
                                var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                                
                                // Convert to JSON to limit rows
                                var jsonData = XLSX.utils.sheet_to_json(firstSheet, {
                                    header: 1,
                                    defval: ''
                                });
                                
                                // Limit to first 20 rows (plus header if exists)
                                var maxRows = 20;
                                var totalRows = jsonData.length;
                                var displayData = jsonData.slice(0, maxRows);
                                
                                // Build HTML table manually
                                var table = '<table class="excel-preview-table">';
                                
                                // Add rows
                                displayData.forEach(function(row, rowIndex) {
                                    table += '<tr>';
                                    row.forEach(function(cell) {
                                        var tag = rowIndex === 0 ? 'th' : 'td';
                                        var cellValue = cell !== null && cell !== undefined ? cell : '';
                                        table += '<' + tag + '>' + escapeHtml(cellValue.toString()) + '</' + tag + '>';
                                    });
                                    table += '</tr>';
                                });
                                
                                table += '</table>';
                                
                                // Create info message
                                var infoMessage = '';
                                if (totalRows > maxRows) {
                                    infoMessage = '<div class="preview-info-message">' +
                                                 '<i class="fa fa-info-circle"></i> ' +
                                                 'แสดงข้อมูลตัวอย่าง ' + maxRows + ' แถวแรก จากทั้งหมด ' + totalRows + ' แถว' +
                                                 '</div>';
                                }
                                
                                $('.excel-preview-container').html(
                                    '<div class="excel-preview-wrapper">' +
                                    '<div class="excel-sheet-name">Sheet: ' + workbook.SheetNames[0] + '</div>' +
                                    infoMessage +
                                    table +
                                    '</div>'
                                );
                                
                            } catch(e) {
                                console.error('Excel parse error:', e);
                                $('.excel-preview-container').html(
                                    '<div class="preview-error">' +
                                    '<i class="fa fa-exclamation-triangle"></i> ' +
                                    'ไม่สามารถแสดงตัวอย่างไฟล์ Excel ได้' +
                                    '</div>'
                                );
                            }
                        }, 100);
                    }
                    else if (data.type === 'text' || data.extension === 'csv' || data.extension === 'txt' || data.extension === 'json') {
                        // Text file preview
                        var content = data.content || '';
                        
                        if (data.extension === 'csv') {
                            // Parse CSV - limit to 20 rows
                            previewContent = '<div class="csv-preview-container">';
                            previewContent += '<div class="csv-loading"><i class="fa fa-spinner fa-spin"></i> กำลังประมวลผลไฟล์ CSV...</div>';
                            previewContent += '</div>';
                            
                            setTimeout(function() {
                                try {
                                    // Parse CSV with limit
                                    var lines = content.split('\n').filter(function(line) {
                                        return line.trim() !== '';
                                    });
                                    
                                    var maxRows = 20;
                                    var totalRows = lines.length;
                                    var displayLines = lines.slice(0, maxRows);
                                    
                                    var table = '<table class="csv-preview-table">';
                                    
                                    displayLines.forEach(function(line, index) {
                                        if (line.trim()) {
                                            // Simple CSV parsing - handle comma-separated values
                                            // Handle quoted values that may contain commas
                                            var cells = [];
                                            var currentCell = '';
                                            var insideQuotes = false;
                                            
                                            for (var i = 0; i < line.length; i++) {
                                                var char = line[i];
                                                
                                                if (char === '"') {
                                                    insideQuotes = !insideQuotes;
                                                } else if (char === ',' && !insideQuotes) {
                                                    cells.push(currentCell);
                                                    currentCell = '';
                                                } else {
                                                    currentCell += char;
                                                }
                                            }
                                            cells.push(currentCell); // Add last cell
                                            
                                            table += '<tr>';
                                            cells.forEach(function(cell) {
                                                var tag = index === 0 ? 'th' : 'td';
                                                table += '<' + tag + '>' + escapeHtml(cell.trim()) + '</' + tag + '>';
                                            });
                                            table += '</tr>';
                                        }
                                    });
                                    
                                    table += '</table>';
                                    
                                    // Create info message
                                    var infoMessage = '';
                                    if (totalRows > maxRows) {
                                        infoMessage = '<div class="preview-info-message">' +
                                                     '<i class="fa fa-info-circle"></i> ' +
                                                     'แสดงข้อมูลตัวอย่าง ' + Math.min(maxRows, totalRows) + ' แถวแรก จากทั้งหมด ' + totalRows + ' แถว' +
                                                     '</div>';
                                    }
                                    
                                    $('.csv-preview-container').html(
                                        '<div class="csv-preview-wrapper">' +
                                        infoMessage +
                                        table +
                                        '</div>'
                                    );
                                    
                                } catch(e) {
                                    console.error('CSV parse error:', e);
                                    $('.csv-preview-container').html(
                                        '<div class="preview-error">' +
                                        '<i class="fa fa-exclamation-triangle"></i> ' +
                                        'ไม่สามารถแสดงตัวอย่างไฟล์ CSV ได้' +
                                        '</div>'
                                    );
                                }
                            }, 100);
                        }
                        else if (data.extension === 'json') {
                            // JSON preview with formatting
                            try {
                                var jsonObj = JSON.parse(content);
                                previewContent = '<pre class="json-preview">' + JSON.stringify(jsonObj, null, 2) + '</pre>';
                            } catch(e) {
                                previewContent = '<pre class="text-preview">' + escapeHtml(content) + '</pre>';
                            }
                        }
                        else {
                            // Plain text preview
                            previewContent = '<pre class="text-preview">' + escapeHtml(content) + '</pre>';
                        }
                    }
                    else {
                        // Unsupported file type
                        previewContent = '<div class="preview-not-available">';
                        previewContent += '<i class="fa fa-file-o" style="font-size:48px;color:#999;"></i>';
                        previewContent += '<p>ไม่สามารถแสดงตัวอย่างไฟล์ประเภทนี้ได้</p>';
                        previewContent += '<p>กรุณาดาวน์โหลดไฟล์เพื่อดูเนื้อหา</p>';
                        previewContent += '</div>';
                    }
                    
                    // Display preview content
                    $('.ckan-preview-data-xrt259').html(previewContent);
                    
                } else {
                    // Error
                    $('.ckan-preview-data-xrt259').html(
                        '<div class="preview-error">' +
                        '<i class="fa fa-exclamation-circle"></i> ' +
                        'เกิดข้อผิดพลาด: ' + (response.data || 'ไม่สามารถโหลดข้อมูลได้') +
                        '</div>'
                    );
                }
            },
            error: function(xhr, status, error) {
                $('.ckan-preview-loading-xrt259').hide();
                $('.ckan-preview-data-xrt259').html(
                    '<div class="preview-error">' +
                    '<i class="fa fa-exclamation-circle"></i> ' +
                    'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' +
                    '</div>'
                );
                console.error('Preview AJAX error:', status, error);
            }
        });
    });
    
    // Close preview modal
    $(document).on('click', '.ckan-preview-modal-close-xrt259', function() {
        $('#ckan-preview-modal-xrt259').removeClass('show');
    });
    
    // Close preview modal when clicking outside
    $(document).on('click', '#ckan-preview-modal-xrt259', function(e) {
        if ($(e.target).is('#ckan-preview-modal-xrt259')) {
            $(this).removeClass('show');
        }
    });
    
    // Data API button click
    $(document).on('click', '.data-api-btn-xrt259', function() {
        console.log('Data API button clicked');
        // Add API modal functionality here if needed
    });
    
    // Function to create preview modal dynamically if it doesn't exist
    function createPreviewModal() {
        var modalHtml = `
            <div class="ckan-preview-modal-xrt259" id="ckan-preview-modal-xrt259">
                <div class="ckan-preview-modal-content-xrt259">
                    <span class="ckan-preview-modal-close-xrt259">&times;</span>
                    <h3 class="ckan-preview-modal-title-xrt259">ดูตัวอย่าง</h3>
                    <button class="data-api-btn-xrt259">DATA API</button>
                    <div class="ckan-preview-modal-body-xrt259">
                        <div class="ckan-preview-loading-xrt259"><i class="fa fa-spinner fa-spin"></i> กำลังเตรียมข้อมูล...</div>
                        <div class="ckan-preview-data-xrt259"></div>
                    </div>
                </div>
            </div>
        `;
        $('body').append(modalHtml);
    }
    
    // Helper function to escape HTML
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
});