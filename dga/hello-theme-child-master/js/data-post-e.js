/**
 * Data Post E JavaScript - WordPress Native Safe Version
 * Version: 1.5.2 - Fixed Modal Scrolling Issue
 * Description: Frontend post editor with safe WordPress TinyMCE (no external plugin loading)
 */

jQuery(document).ready(function($) {
    'use strict';
    
    // Global variables
    var editorInstances = {};
    var activeEditorId = '';
    var editorInitialized = false;
    var bodyScrollPosition = 0; // เก็บตำแหน่ง scroll เดิม
    
    /**
     * Initialize the post editor
     */
    function init() {
        bindEvents();
        checkWordPressTinyMCE();
        console.log('Data Post E Editor initialized - Version 1.5.2 (WordPress Native - Safe Mode with Fixed Scrolling)');
    }
    
    /**
     * Check WordPress TinyMCE availability and override settings
     */
    function checkWordPressTinyMCE() {
        if (typeof tinyMCE !== 'undefined' || typeof tinymce !== 'undefined') {
            console.log('WordPress TinyMCE is available');
            
            // Override global TinyMCE settings to prevent external plugin loading
            var MCE = window.tinyMCE || window.tinymce;
            if (MCE && MCE.overrideDefaults) {
                MCE.overrideDefaults({
                    plugins: 'lists,fullscreen,wordpress,wplink,textcolor,image,link,paste,wpgallery,wpdialogs,wpview',
                    external_plugins: {},
                    plugin_base_urls: {}
                });
            }
            
            editorInitialized = true;
        } else {
            console.log('WordPress TinyMCE not yet loaded, waiting...');
            setTimeout(checkWordPressTinyMCE, 1000);
        }
    }
    
    /**
     * Bind all event handlers
     */
    function bindEvents() {
        // Open modal
        $(document).on('click', '.data-post-e-icon-ab12', handleEditClick);
        
        // Close modal
        $(document).on('click', '.data-post-e-close-ab12, .cancel-btn-ab12', closeModal);
        $(document).on('click', function(e) {
            if ($(e.target).hasClass('data-post-e-modal-ab12')) {
                closeModal();
            }
        });
        
        // Form submission
        $(document).on('submit', '.data-post-e-form-ab12', handleFormSubmit);
        
        // Delete post
        $(document).on('click', '.delete-post-btn-ab12', handleDeleteClick);
        $(document).on('click', '.confirm-delete-btn-ab12', handleDeleteConfirm);
        $(document).on('click', '.cancel-delete-btn-ab12', closeDeleteModal);
        
        // Notification modal
        $(document).on('click', '.notification-confirm-btn-ab12', closeNotificationModal);
        
        // Repeater fields
        $(document).on('click', '#add-row-btn-ab12', addRepeaterRow);
        $(document).on('click', '.remove-row-btn-ab12', removeRepeaterRow);
        $(document).on('click', '.upload-new-file-btn-ab12', handleFileUpload);
        $(document).on('click', '.link-file-btn-ab12', toggleUrlField);
        $(document).on('change', '.manual-url-input-ab12', updateFileLink);
        
        // Escape key to close modal
        $(document).on('keydown', function(e) {
            if (e.keyCode === 27) { // ESC key
                closeModal();
                closeDeleteModal();
                closeNotificationModal();
            }
        });
    }
    
    /**
     * จัดการการเปิด modal และการเลื่อนหน้าจอ
     */
    function openModal($modal) {
        // เก็บตำแหน่ง scroll ปัจจุบัน
        bodyScrollPosition = $(window).scrollTop();
        
        // แสดง modal
        $modal.fadeIn(300);
        
        // สำหรับมือถือ - ป้องกันการเลื่อนหน้าเว็บหลัก
        if (isMobileDevice()) {
            $('body').css({
                'position': 'fixed',
                'top': -bodyScrollPosition + 'px',
                'width': '100%',
                'overflow': 'hidden'
            });
        } else {
            // สำหรับ desktop - เก็บ scrollbar space
            var scrollbarWidth = getScrollbarWidth();
            $('body').css({
                'overflow': 'hidden',
                'padding-right': scrollbarWidth + 'px'
            });
        }
    }
    
    /**
     * จัดการการปิด modal และคืนค่าการเลื่อน
     */
    function closeModalScrollHandling() {
        // ซ่อน modal
        $('.data-post-e-modal-ab12').fadeOut(300);
        
        // คืนค่าการเลื่อนหน้าเว็บ
        if (isMobileDevice()) {
            $('body').css({
                'position': '',
                'top': '',
                'width': '',
                'overflow': ''
            });
            // คืนตำแหน่ง scroll
            $(window).scrollTop(bodyScrollPosition);
        } else {
            $('body').css({
                'overflow': '',
                'padding-right': ''
            });
        }
    }
    
    /**
     * ตรวจสอบว่าเป็นอุปกรณ์มือถือหรือไม่
     */
    function isMobileDevice() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * คำนวณความกว้างของ scrollbar
     */
    function getScrollbarWidth() {
        // สร้าง element ชั่วคราวเพื่อวัด scrollbar
        var outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll';
        outer.style.msOverflowStyle = 'scrollbar';
        document.body.appendChild(outer);
        
        var inner = document.createElement('div');
        outer.appendChild(inner);
        
        var scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);
        outer.parentNode.removeChild(outer);
        
        return scrollbarWidth;
    }
    
    /**
     * Handle edit icon click
     */
    function handleEditClick(e) {
        e.preventDefault();
        var postId = $(this).data('post-id');
        activeEditorId = 'at_content_ab12_' + postId;
        
        var $modal = $('#data-post-e-modal-ab12-' + postId);
        
        // เปิด modal ด้วย scroll handling
        openModal($modal);
        
        // Initialize editor after modal is visible
        setTimeout(function() {
            initWordPressEditor(postId);
        }, 300);
    }
    
    /**
     * Initialize WordPress Native Editor
     */
    function initWordPressEditor(postId) {
        var editorId = 'at_content_ab12_' + postId;
        var $container = $('#wp-editor-container-ab12-' + postId);
        
        console.log('Initializing WordPress editor for post:', postId);
        
        if (!$container.length) {
            console.error('Editor container not found');
            return;
        }
        
        // Get content from global variable
        var content = '';
        if (typeof window.dataPostEContent !== 'undefined' && window.dataPostEContent[postId]) {
            content = window.dataPostEContent[postId];
        }
        
        // Create editor HTML structure
        var editorHTML = `
            <div id="wp-${editorId}-wrap" class="wp-core-ui wp-editor-wrap html-active">
                <div id="wp-${editorId}-editor-tools" class="wp-editor-tools hide-if-no-js">
                    <div id="wp-${editorId}-media-buttons" class="wp-media-buttons">
                        <button type="button" id="insert-media-button-${editorId}" class="button insert-media add_media" data-editor="${editorId}">
                            <span class="wp-media-buttons-icon"></span> เพิ่มสื่อ
                        </button>
                    </div>
                    <div class="wp-editor-tabs">
                        <button type="button" id="${editorId}-tmce" class="wp-switch-editor switch-tmce" onclick="switchEditors.switchto(this);">Visual</button>
                        <button type="button" id="${editorId}-html" class="wp-switch-editor switch-html" onclick="switchEditors.switchto(this);">Text</button>
                    </div>
                </div>
                <div id="wp-${editorId}-editor-container" class="wp-editor-container">
                    <textarea class="wp-editor-area" rows="20" cols="40" name="at_content" id="${editorId}">${escapeHtml(content)}</textarea>
                </div>
            </div>
        `;
        
        $container.html(editorHTML);
        
        // Initialize TinyMCE
        setTimeout(function() {
            initTinyMCEEditor(editorId);
        }, 100);
        
        // Bind media button
        $('#insert-media-button-' + editorId).on('click', function(e) {
            e.preventDefault();
            openWordPressMedia(editorId);
        });
    }
    
    /**
     * Initialize TinyMCE Editor with WordPress settings
     */
    function initTinyMCEEditor(editorId) {
        if (typeof tinyMCE === 'undefined' && typeof tinymce === 'undefined') {
            console.warn('TinyMCE not available, using textarea fallback');
            return;
        }
        
        var MCE = window.tinyMCE || window.tinymce;
        
        // Remove existing editor
        if (MCE.get(editorId)) {
            MCE.get(editorId).remove();
        }
        
        // TinyMCE settings with safe WordPress core plugins only
        var mceSettings = {
            selector: '#' + editorId,
            height: 400,
            menubar: false,
            statusbar: true,
            resize: true,
            branding: false,
            
            // ใช้เฉพาะ plugins ที่ WordPress รองรับแน่นอน
            plugins: 'lists,fullscreen,wordpress,wplink,textcolor,image,link,paste,wpgallery,wpdialogs,wpview',
            
            // Toolbar แบบปลอดภัย
            toolbar1: 'formatselect | fontsizeselect | forecolor backcolor | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify',
            toolbar2: 'bullist numlist outdent indent | link unlink | image | wp_adv | fullscreen',
            toolbar3: 'undo redo | copy paste | removeformat | wp_help',
            
            // Font size options
            fontsize_formats: '8px 9px 10px 11px 12px 14px 16px 18px 20px 22px 24px 26px 28px 30px 32px 36px 48px 60px 72px 96px',
            
            // Format options with H1-H6
            block_formats: 'Paragraph=p;Heading 1=h1;Heading 2=h2;Heading 3=h3;Heading 4=h4;Heading 5=h5;Heading 6=h6;Preformatted=pre',
            
            // Advanced features
            wordpress_adv_hidden: false,
            wpeditimage_html5_captions: true,
            
            // Content options
            forced_root_block: 'p',
            remove_linebreaks: false,
            
            // ป้องกันการโหลด external plugins
            external_plugins: {},
            plugin_base_urls: {},
            
            // URL options
            relative_urls: false,
            remove_script_host: false,
            convert_urls: true,
            
            // Content styling
            content_style: `
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Thai', sans-serif; 
                    font-size: 16px; 
                    line-height: 1.6; 
                    color: #333;
                    max-width: 100%;
                    padding: 10px;
                }
                img { max-width: 100%; height: auto; }
                table { border-collapse: collapse; width: 100%; margin: 10px 0; }
                table td, table th { border: 1px solid #ddd; padding: 8px; }
                h1, h2, h3, h4, h5, h6 { margin: 20px 0 10px 0; }
                p { margin: 10px 0; }
            `,
            
            // Setup callback
            setup: function(editor) {
                console.log('WordPress TinyMCE setup:', editor.id);
                
                // Store editor instance
                editorInstances[editorId] = editor;
                
                // ป้องกัน plugin loading errors
                editor.on('PluginLoadError', function(e) {
                    console.warn('Plugin load error (ignoring):', e.name || e);
                    // ไม่ทำอะไร - ปล่อยให้ TinyMCE ทำงานต่อ
                });
                
                // Override plugin loading to prevent external requests
                if (editor.settings && editor.settings.plugins) {
                    // Force plugins to be only what we want
                    editor.settings.plugins = 'lists,fullscreen,wordpress,wplink,textcolor,image,link,paste,wpgallery,wpdialogs,wpview';
                }
                
                // On init
                editor.on('init', function() {
                    console.log('WordPress TinyMCE initialized successfully:', editor.id);
                    
                    // Focus editor
                    setTimeout(function() {
                        editor.focus();
                    }, 100);
                    
                    showNotification(data_post_e_vars_ab12.strings.editor_ready, 'success');
                });
                
                // Auto save on change
                editor.on('change keyup', function() {
                    try {
                        editor.save();
                    } catch (e) {
                        console.warn('Error saving editor content:', e);
                    }
                });
                
                // Handle errors gracefully
                editor.on('LoadError', function(e) {
                    console.warn('WordPress TinyMCE load error (continuing):', e);
                    // ไม่แสดง error - ปล่อยให้ editor ทำงานต่อ
                });
                
                // Prevent external plugin loading
                editor.on('BeforeExecCommand', function(e) {
                    // Block commands that might trigger plugin loading
                    if (e.command === 'mceInsertContent' && e.value && e.value.indexOf('plugin') !== -1) {
                        console.log('Blocked potential plugin command');
                        e.preventDefault();
                    }
                });
            }
        };
        
        // Initialize TinyMCE with safe overrides
        try {
            // Override global TinyMCE settings to prevent external plugin loading
            if (typeof window.tinyMCEPreInit !== 'undefined' && window.tinyMCEPreInit.mceInit) {
                // Force safe plugins for all editors
                for (var editorConfig in window.tinyMCEPreInit.mceInit) {
                    if (window.tinyMCEPreInit.mceInit[editorConfig]) {
                        window.tinyMCEPreInit.mceInit[editorConfig].plugins = 'lists,fullscreen,wordpress,wplink,textcolor,image,link,paste,wpgallery,wpdialogs,wpview';
                        window.tinyMCEPreInit.mceInit[editorConfig].external_plugins = {};
                    }
                }
            }
            
            MCE.init(mceSettings);
        } catch (error) {
            console.error('Error initializing WordPress TinyMCE:', error);
            showNotification('Error initializing editor', 'error');
        }
    }
    
    /**
     * Open WordPress Media Library
     */
    function openWordPressMedia(editorId) {
        if (typeof wp !== 'undefined' && wp.media) {
            var mediaUploader = wp.media({
                title: 'เลือกหรืออัพโหลดสื่อ',
                multiple: false
            });
            
            mediaUploader.on('select', function() {
                var attachment = mediaUploader.state().get('selection').first().toJSON();
                var html = '';
                
                if (attachment.type === 'image') {
                    var url = attachment.url;
                    // Use full size image URL if available
                    if (attachment.sizes && attachment.sizes.full) {
                        url = attachment.sizes.full.url;
                    }
                    html = '<img src="' + url + '" alt="' + (attachment.alt || attachment.title || '') + '" style="max-width: 100%; height: auto;" />';
                } else {
                    html = '<a href="' + attachment.url + '" target="_blank">' + (attachment.title || attachment.filename) + '</a>';
                }
                
                // Insert into editor
                var MCE = window.tinyMCE || window.tinymce;
                if (MCE && MCE.get(editorId)) {
                    MCE.get(editorId).insertContent(html);
                } else {
                    // Fallback to textarea
                    var $textarea = $('#' + editorId);
                    if ($textarea.length) {
                        var currentContent = $textarea.val();
                        $textarea.val(currentContent + html);
                    }
                }
            });
            
            mediaUploader.open();
        } else {
            console.warn('WordPress Media Library not available');
            showNotification('Media Library ไม่พร้อมใช้งาน', 'error');
        }
    }
    
    /**
     * Remove editor safely
     */
    function removeEditor() {
        if (activeEditorId) {
            var MCE = window.tinyMCE || window.tinymce;
            
            // Save and remove TinyMCE editor
            if (MCE && MCE.get(activeEditorId)) {
                try {
                    MCE.get(activeEditorId).save();
                    MCE.get(activeEditorId).remove();
                } catch (e) {
                    console.warn('Error removing WordPress TinyMCE editor:', e);
                }
                delete editorInstances[activeEditorId];
            }
            
            // Clean up editor container
            var postId = activeEditorId.replace('at_content_ab12_', '');
            $('#wp-editor-container-ab12-' + postId).empty();
        }
    }
    
    /**
     * Close modal - ใช้ scroll handling ใหม่
     */
    function closeModal() {
        removeEditor();
        closeModalScrollHandling(); // ใช้ฟังก์ชันใหม่
        activeEditorId = '';
    }
    
    /**
     * Close notification modal
     */
    function closeNotificationModal() {
        $('.notification-modal-ab12').fadeOut(300);
        setTimeout(function() {
            location.reload();
        }, 300);
    }
    
    /**
     * Close delete confirmation modal
     */
    function closeDeleteModal() {
        $('.delete-confirm-modal-ab12').fadeOut(300);
    }
    
    /**
     * Handle form submission
     */
    function handleFormSubmit(e) {
        e.preventDefault();
        
        var $form = $(this);
        var $submitBtn = $form.find('.save-post-btn-ab12');
        var postId = $form.find('input[name="post_id"]').val();
        
        // Save editor content
        if (activeEditorId) {
            var MCE = window.tinyMCE || window.tinymce;
            if (MCE && MCE.get(activeEditorId)) {
                try {
                    MCE.get(activeEditorId).save();
                } catch (e) {
                    console.warn('Error saving WordPress TinyMCE content:', e);
                }
            }
        }
        
        // Show saving status
        var originalText = $submitBtn.text();
        $submitBtn.prop('disabled', true).text(data_post_e_vars_ab12.strings.saving || 'กำลังบันทึก...');
        
        // Prepare form data
        var formData = $form.serializeArray();
        formData.push({name: 'action', value: 'data_post_e_save'});
        formData.push({name: 'nonce', value: data_post_e_vars_ab12.nonce});
        
        // Send AJAX request
        $.ajax({
            type: 'POST',
            url: data_post_e_vars_ab12.ajax_url,
            data: formData,
            timeout: 30000,
            success: function(response) {
                if (response.success) {
                    closeModal();
                    $('#notification-modal-ab12-' + postId).fadeIn(300);
                } else {
                    showNotification(response.data.message || data_post_e_vars_ab12.strings.error, 'error');
                    $submitBtn.prop('disabled', false).text(originalText);
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX error:', status, error);
                showNotification('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
                $submitBtn.prop('disabled', false).text(originalText);
            }
        });
    }
    
    /**
     * Handle delete button click
     */
    function handleDeleteClick() {
        var postId = $(this).closest('form').find('input[name="post_id"]').val();
        $('#delete-confirm-modal-ab12-' + postId).fadeIn(300);
    }
    
    /**
     * Handle delete confirmation
     */
    function handleDeleteConfirm() {
        var $btn = $(this);
        var postId = $(this).closest('.delete-confirm-modal-ab12').attr('id').replace('delete-confirm-modal-ab12-', '');
        
        var originalText = $btn.text();
        $btn.text('กำลังลบ...').prop('disabled', true);
        
        $.ajax({
            type: 'POST',
            url: data_post_e_vars_ab12.ajax_url,
            data: {
                action: 'data_post_e_delete',
                post_id: postId,
                nonce: data_post_e_vars_ab12.nonce
            },
            timeout: 30000,
            success: function(response) {
                if (response.success) {
                    showNotification('ลบโพสเรียบร้อยแล้ว', 'success');
                    setTimeout(function() {
                        window.location.href = response.data.redirect;
                    }, 2000);
                } else {
                    closeDeleteModal();
                    showNotification(response.data.message || 'เกิดข้อผิดพลาด', 'error');
                    $btn.text(originalText).prop('disabled', false);
                }
            },
            error: function() {
                closeDeleteModal();
                showNotification('เกิดข้อผิดพลาดในการลบโพส', 'error');
                $btn.text(originalText).prop('disabled', false);
            }
        });
    }
    
    /**
     * Add repeater row
     */
    function addRepeaterRow() {
        var $repeater = $('#at_file_standard_repeater_ab12');
        var index = $repeater.children('.repeater-row-ab12').length;
        var currentDate = getCurrentDate();
        
        var newRow = `
            <div class="repeater-row-ab12">
                <div class="repeater-field-ab12">
                    <label>ชื่อไฟล์:</label>
                    <input type="text" name="at_file_standard[${index}][at_rp_file_name]" value="">
                </div>
                <div class="repeater-field-ab12">
                    <label>วันที่นำเข้า:</label>
                    <input type="text" name="at_file_standard[${index}][at_rp_file_create]" value="${currentDate}">
                </div>
                <div class="repeater-field-ab12 file-actions-ab12">
                    <input type="hidden" name="at_file_standard[${index}][at_rp_file_link]" class="file-link-input-ab12" value="">
                    <a href="#" class="download-file-btn-ab12" target="_blank" style="display:none;">ดาวน์โหลดไฟล์</a>
                    <button type="button" class="upload-new-file-btn-ab12">อัพโหลดไฟล์ใหม่</button>
                    <button type="button" class="link-file-btn-ab12">ลิงค์</button>
                    <button type="button" class="remove-row-btn-ab12">ลบ</button>
                </div>
                <div class="repeater-field-ab12 url-field-ab12" style="display:none;">
                    <label>URL:</label>
                    <input type="text" name="at_file_standard[${index}][at_rp_file_url]" class="manual-url-input-ab12" value="">
                </div>
            </div>
        `;
        
        $repeater.append(newRow);
        reindexRepeaterFields();
    }
    
    /**
     * Remove repeater row
     */
    function removeRepeaterRow() {
        var $repeater = $('#at_file_standard_repeater_ab12');
        var $rows = $repeater.children('.repeater-row-ab12');
        
        if ($rows.length === 1) {
            // Clear values if only one row
            $(this).closest('.repeater-row-ab12').find('input[type="text"]').val('');
            $(this).closest('.repeater-row-ab12').find('.file-link-input-ab12').val('');
            $(this).closest('.repeater-row-ab12').find('.download-file-btn-ab12').attr('href', '#').hide();
            $(this).closest('.repeater-row-ab12').find('.url-field-ab12').hide();
        } else {
            $(this).closest('.repeater-row-ab12').remove();
            reindexRepeaterFields();
        }
    }
    
    /**
     * Handle file upload
     */
    function handleFileUpload() {
        var $button = $(this);
        var $row = $button.closest('.repeater-row-ab12');
        var $fileInput = $row.find('.file-link-input-ab12');
        var $downloadBtn = $row.find('.download-file-btn-ab12');
        var $fileNameInput = $row.find('input[name*="[at_rp_file_name]"]');
        var $manualUrlInput = $row.find('.manual-url-input-ab12');
        
        // Check if Media Library is available
        if (!window.wp || !window.wp.media) {
            showNotification('Media Library ไม่พร้อมใช้งาน', 'error');
            return;
        }
        
        // Open WordPress Media Library
        var mediaUploader = wp.media({
            title: 'เลือกหรืออัพโหลดไฟล์',
            button: {
                text: 'เลือกไฟล์นี้'
            },
            multiple: false
        });
        
        mediaUploader.on('select', function() {
            var attachment = mediaUploader.state().get('selection').first().toJSON();
            
            // Update file URL
            $fileInput.val(attachment.url);
            $downloadBtn.attr('href', attachment.url).show();
            $manualUrlInput.val(attachment.url);
            
            // Update filename if empty
            if ($fileNameInput.val() === '') {
                $fileNameInput.val(attachment.title || attachment.filename);
            }
        });
        
        mediaUploader.open();
    }
    
    /**
     * Toggle URL field
     */
    function toggleUrlField() {
        var $row = $(this).closest('.repeater-row-ab12');
        var $urlField = $row.find('.url-field-ab12');
        
        if ($urlField.is(':visible')) {
            $urlField.slideUp(200);
        } else {
            $urlField.slideDown(200);
        }
    }
    
    /**
     * Update file link
     */
    function updateFileLink() {
        var $row = $(this).closest('.repeater-row-ab12');
        var $fileLink = $row.find('.file-link-input-ab12');
        var $downloadBtn = $row.find('.download-file-btn-ab12');
        var url = $(this).val();
        
        $fileLink.val(url);
        if (url) {
            $downloadBtn.attr('href', url).show();
        } else {
            $downloadBtn.attr('href', '#').hide();
        }
    }
    
    /**
     * Reindex repeater fields
     */
    function reindexRepeaterFields() {
        $('#at_file_standard_repeater_ab12 .repeater-row-ab12').each(function(index) {
            $(this).find('input, select').each(function() {
                var name = $(this).attr('name');
                if (name) {
                    var newName = name.replace(/\[\d+\]/, '[' + index + ']');
                    $(this).attr('name', newName);
                }
            });
        });
    }
    
    /**
     * Show notification
     */
    function showNotification(message, type) {
        var typeClass = type || 'info';
        var $notification = $('<div class="data-post-e-notification-ab12 ' + typeClass + '">' + message + '</div>');
        $('body').append($notification);
        
        $notification.fadeIn(300);
        
        setTimeout(function() {
            $notification.fadeOut(300, function() {
                $(this).remove();
            });
        }, 5000);
    }
    
    /**
     * Get current date in Thai format
     */
    function getCurrentDate() {
        var date = new Date();
        var day = date.getDate();
        var month = date.getMonth() + 1;
        var year = date.getFullYear();
        
        day = day < 10 ? '0' + day : day;
        month = month < 10 ? '0' + month : month;
        
        return day + '/' + month + '/' + year;
    }
    
    /**
     * Escape HTML for safe insertion
     */
    function escapeHtml(text) {
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
    
    // Initialize
    init();
});