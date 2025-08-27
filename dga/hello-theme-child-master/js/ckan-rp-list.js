/**
 * CKAN Repeater List JavaScript with Permission Control
 */
jQuery(document).ready(function($) {
    // Initialize
    var modal = $('#ckan-asset-modal');
    var form = $('#ckan-asset-form');
    var container = $('.ckan-assets-container');
    var post_id = container.data('post-id') || 0;
    var canEdit = container.data('can-edit') === true || container.data('can-edit') === 'true';
    
    // Get AJAX settings
    var ajaxUrl = ckan_rp_list_ajax.ajax_url;
    var ajaxNonce = ckan_rp_list_ajax.nonce;
    
    // Also check from localized script
    if (typeof ckan_rp_list_ajax.can_edit !== 'undefined') {
        canEdit = ckan_rp_list_ajax.can_edit === true || ckan_rp_list_ajax.can_edit === 'true';
    }
    
    // Exit early if user cannot edit and prevent unauthorized actions
    if (!canEdit) {
        // Hide all edit/delete buttons and add button if they somehow exist
        $('.ckan-add-asset-btn, .ckan-edit-btn, .ckan-delete-btn').remove();
        
        // Prevent modal operations
        $('#ckan-asset-modal').remove();
        
        console.log('Edit permissions not granted for this user.');
    }
    
    // Only initialize edit functionality if user has permission
    if (canEdit) {
        
        // Add asset button click
        $('.ckan-add-asset-btn').on('click', function() {
            // Reset form
            form[0].reset();
            $('#ckan-asset-index').val('');
            $('#ckan-asset-file-id').val('');
            $('#ckan-asset-file-url').val('');
            $('#ckan-asset-attachment-id').val('');
            $('#ckan-current-file').text('');
            $('.ckan-current-file-container').hide();
            $('.ckan-upload-status').empty();
            $('.ckan-modal-title').text('เพิ่มรายการไฟล์');
            
            // Show modal
            modal.addClass('show');
        });
        
        // Edit asset button click
        $(document).on('click', '.ckan-edit-btn', function() {
            var index = $(this).data('index');
            var attachmentId = $(this).data('attachment-id') || 0;
            var item = $('.ckan-asset-item[data-index="' + index + '"]');
            var name = item.find('.ckan-asset-name').text();
            var description = item.find('.ckan-asset-description').text();
            var fileUrl = atob(item.find('.ckan-download-btn').data('url'));
            var originalFilename = item.data('original-filename') || '';
            
            // Get display name - prioritize original filename, then asset name, then extract from URL
            var fileName = originalFilename || name || decodeURIComponent(fileUrl.split('/').pop());
            
            // Reset upload status
            $('.ckan-upload-status').empty();
            
            // Set form values
            $('#ckan-asset-index').val(index);
            $('#ckan-asset-name').val(name);
            $('#ckan-asset-description').val(description);
            $('#ckan-asset-file-url').val(fileUrl);
            $('#ckan-asset-attachment-id').val(attachmentId);
            $('#ckan-current-file').text(fileName);
            $('.ckan-current-file-container').show();
            $('.ckan-modal-title').text('แก้ไขรายการไฟล์');
            
            // Show modal
            modal.addClass('show');
        });
        
        // Delete asset button click
        $(document).on('click', '.ckan-delete-btn', function() {
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
        
        // Close modal
        $('.ckan-modal-close, .ckan-cancel-btn').on('click', function() {
            modal.removeClass('show');
        });
        
        // File input change - handle file upload immediately
        $('#ckan-asset-file').on('change', function() {
            if (this.files.length > 0) {
                var file = this.files[0];
                var statusDiv = $('.ckan-upload-status');
                
                // Get file extension
                var fileName = file.name;
                var fileExtMatch = fileName.match(/\.([^.]+)$/);
                var fileExt = fileExtMatch ? fileExtMatch[1].toLowerCase() : '';
                
                // Check if file has extension
                if (!fileExt) {
                    statusDiv.html('<div class="ckan-upload-error"><i class="fa fa-exclamation-circle"></i> ' +
                                  'ไฟล์ต้องมีนามสกุล (เช่น .pdf, .docx, .xlsx)</div>');
                    $(this).val(''); // Clear file input
                    return;
                }
                
                // Check allowed file types
                var allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 
                                   'jpg', 'jpeg', 'png', 'gif', 'zip', 'rar', 'txt', 'csv', 'json'];
                
                if (!allowedTypes.includes(fileExt)) {
                    statusDiv.html('<div class="ckan-upload-error"><i class="fa fa-exclamation-circle"></i> ' +
                                  'ประเภทไฟล์ไม่ได้รับอนุญาต. อนุญาตเฉพาะ: ' + allowedTypes.join(', ') + '</div>');
                    $(this).val(''); // Clear file input
                    return;
                }
                
                // Check file size (optional - WordPress default is 2MB for basic users)
                var maxSize = 100 * 1024 * 1024; // 100MB
                if (file.size > maxSize) {
                    statusDiv.html('<div class="ckan-upload-error"><i class="fa fa-exclamation-circle"></i> ไฟล์มีขนาดใหญ่เกินไป (จำกัดที่ 100MB)</div>');
                    $(this).val(''); // Clear file input
                    return;
                }
                
                // Show file info before upload
                var fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
                statusDiv.html('<div class="ckan-upload-info"><i class="fa fa-info-circle"></i> ' +
                              'กำลังเตรียมอัพโหลด: ' + escapeHtml(fileName) + ' (' + fileSizeMB + ' MB)</div>');
                
                // Delay upload slightly to show info
                setTimeout(function() {
                    // Show loading indicator
                    statusDiv.html('<div class="ckan-upload-progress"><i class="fa fa-spinner fa-spin"></i> กำลังอัพโหลด...</div>');
                    
                    // Create form data
                    var formData = new FormData();
                    formData.append('action', 'ckan_upload_file');
                    formData.append('nonce', ajaxNonce);
                    formData.append('post_id', post_id);
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
                                    statusDiv.html('<div class="ckan-upload-progress"><i class="fa fa-spinner fa-spin"></i> กำลังอัพโหลด... ' + percentComplete + '%</div>');
                                }
                            }, false);
                            return xhr;
                        },
                        success: function(response) {
                            if (response.success) {
                                // Store file info
                                $('#ckan-asset-file-id').val(response.data.file_id);
                                $('#ckan-asset-file-url').val(response.data.file_url);
                                $('#ckan-asset-attachment-id').val(response.data.attachment_id);
                                
                                // Update UI with original filename
                                var displayName = response.data.file_name; // ใช้ชื่อไฟล์ต้นฉบับ
                                statusDiv.html('<div class="ckan-upload-success"><i class="fa fa-check"></i> อัพโหลดสำเร็จ: ' + escapeHtml(displayName) + '</div>');
                                
                                // Show actual filename that was saved (for debugging)
                                if (response.data.actual_filename) {
                                    console.log('File saved as:', response.data.actual_filename);
                                }
                                
                                // If name field is empty, use original file name as default
                                if ($('#ckan-asset-name').val() === '') {
                                    // Remove file extension from the name
                                    var nameWithoutExt = displayName.split('.').slice(0, -1).join('.');
                                    $('#ckan-asset-name').val(nameWithoutExt);
                                }
                            } else {
                                statusDiv.html('<div class="ckan-upload-error"><i class="fa fa-exclamation-circle"></i> ข้อผิดพลาด: ' + response.data + '</div>');
                                $('#ckan-asset-file').val(''); // Clear file input
                            }
                        },
                        error: function(xhr, status, error) {
                            var errorMsg = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
                            if (xhr.status === 413) {
                                errorMsg = 'ไฟล์มีขนาดใหญ่เกินไป';
                            } else if (xhr.status === 415) {
                                errorMsg = 'ประเภทไฟล์ไม่ได้รับอนุญาต';
                            } else if (xhr.status === 403) {
                                errorMsg = 'คุณไม่มีสิทธิ์ในการอัพโหลดไฟล์';
                            }
                            statusDiv.html('<div class="ckan-upload-error"><i class="fa fa-exclamation-circle"></i> ข้อผิดพลาด: ' + errorMsg + '</div>');
                            $('#ckan-asset-file').val(''); // Clear file input
                        }
                    });
                }, 500); // Delay 500ms to show file info
            }
        });
        
        // Form submission
        form.on('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            var name = $('#ckan-asset-name').val();
            var description = $('#ckan-asset-description').val();
            var fileUrl = $('#ckan-asset-file-url').val();
            var attachmentId = $('#ckan-asset-attachment-id').val();
            var index = $('#ckan-asset-index').val();
            
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
            var submitBtn = $('.ckan-submit-btn');
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
                error: function(xhr) {
                    var errorMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
                    if (xhr.status === 403) {
                        errorMsg = 'คุณไม่มีสิทธิ์ในการบันทึกข้อมูล';
                    }
                    alert(errorMsg);
                    // Reset submit button
                    submitBtn.html('บันทึก');
                    submitBtn.prop('disabled', false);
                }
            });
        });
        
        // Close modal when clicking outside
        $(window).on('click', function(e) {
            if ($(e.target).is(modal)) {
                modal.removeClass('show');
            }
        });
    }
    
    // Download button click - available for all users
    $(document).on('click', '.ckan-download-btn', function() {
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
    
    // Helper function to escape HTML
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
});