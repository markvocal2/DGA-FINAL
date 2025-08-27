/**
 * Frontend Post Editor - Optimized JavaScript
 * Version: 2.0.0
 */

(function($) {
    'use strict';
    
    class FrontendPostEditor {
        constructor() {
            this.config = window.fpeConfig || {};
            this.editorInstance = null;
            this.currentPostId = null;
            this.init();
        }
        
        init() {
            this.bindEvents();
            console.log('Frontend Post Editor initialized v2.0.0');
        }
        
        bindEvents() {
            // Edit button
            $(document).on('click', '.fpe-edit-btn-vkj785', (e) => this.openEditor(e));
            
            // Modal controls
            $(document).on('click', '.fpe-close-vkj785, .fpe-cancel-vkj785', () => this.closeModal());
            $(document).on('click', '.fpe-modal-vkj785', (e) => {
                if ($(e.target).hasClass('fpe-modal-vkj785')) this.closeModal();
            });
            
            // Form submission
            $(document).on('submit', '.fpe-form-vkj785', (e) => this.savePost(e));
            
            // Delete post
            $(document).on('click', '.fpe-delete-vkj785', (e) => this.deletePost(e));
            
            // File management
            $(document).on('click', '.fpe-add-file-vkj785', () => this.addFileRow());
            $(document).on('click', '.fpe-remove-file-vkj785', (e) => this.removeFileRow(e));
            $(document).on('click', '.fpe-upload-file-vkj785', (e) => this.uploadFile(e));
            
            // ESC key
            $(document).on('keydown', (e) => {
                if (e.keyCode === 27) this.closeModal();
            });
        }
        
        openEditor(e) {
            e.preventDefault();
            const $btn = $(e.currentTarget);
            this.currentPostId = $btn.data('post-id');
            const $modal = $(`#fpe-modal-${this.currentPostId}`);
            
            // Show modal with fade effect
            $modal.fadeIn(300);
            
            // Prevent body scroll
            $('body').css('overflow', 'hidden');
            
            // Initialize WordPress editor
            this.initEditor();
        }
        
        initEditor() {
            const editorId = `fpe-content-${this.currentPostId}`;
            
            // Check if wp.editor is available
            if (typeof wp !== 'undefined' && wp.editor) {
                // Remove existing instance
                if (wp.editor.remove) {
                    wp.editor.remove(editorId);
                }
                
                // Initialize with settings
                const settings = {
                    tinymce: this.config.editorSettings?.tinymce || {
                        toolbar1: 'formatselect,bold,italic,bullist,numlist,link,unlink',
                        toolbar2: '',
                        plugins: 'lists,link,paste',
                        height: 400
                    },
                    quicktags: true,
                    mediaButtons: true
                };
                
                // Initialize editor
                wp.editor.initialize(editorId, settings);
                this.editorInstance = editorId;
                
                // Set content if available
                if (this.config.currentContent) {
                    setTimeout(() => {
                        const editor = tinymce.get(editorId);
                        if (editor) {
                            editor.setContent(this.config.currentContent);
                        }
                    }, 500);
                }
            }
        }
        
        closeModal() {
            // Remove editor instance
            if (this.editorInstance && wp.editor && wp.editor.remove) {
                wp.editor.remove(this.editorInstance);
            }
            
            // Hide modal
            $('.fpe-modal-vkj785').fadeOut(300);
            
            // Restore body scroll
            $('body').css('overflow', '');
            
            this.currentPostId = null;
            this.editorInstance = null;
        }
        
        async savePost(e) {
            e.preventDefault();
            const $form = $(e.currentTarget);
            const $saveBtn = $form.find('.fpe-save-vkj785');
            
            // Get editor content
            if (this.editorInstance) {
                const editor = tinymce.get(this.editorInstance);
                if (editor) {
                    $(`#${this.editorInstance}`).val(editor.getContent());
                }
            }
            
            // Show loading state
            const originalText = $saveBtn.text();
            $saveBtn.prop('disabled', true).text(this.config.strings?.saving || 'Saving...');
            
            // Prepare data
            const formData = new FormData($form[0]);
            formData.append('action', 'fpe_save');
            formData.append('nonce', this.config.nonce);
            
            try {
                const response = await $.ajax({
                    url: this.config.ajaxUrl,
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false
                });
                
                if (response.success) {
                    this.showNotification(response.data.message, 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    throw new Error(response.data || 'Save failed');
                }
            } catch (error) {
                this.showNotification(error.message || this.config.strings?.error, 'error');
                $saveBtn.prop('disabled', false).text(originalText);
            }
        }
        
        async deletePost(e) {
            e.preventDefault();
            
            if (!confirm(this.config.strings?.confirmDelete || 'Delete this post?')) {
                return;
            }
            
            const $btn = $(e.currentTarget);
            const originalText = $btn.text();
            $btn.prop('disabled', true).text('Deleting...');
            
            try {
                const response = await $.ajax({
                    url: this.config.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'fpe_delete',
                        post_id: this.currentPostId,
                        nonce: this.config.nonce
                    }
                });
                
                if (response.success) {
                    this.showNotification(response.data.message, 'success');
                    setTimeout(() => {
                        window.location.href = response.data.redirect;
                    }, 1500);
                } else {
                    throw new Error(response.data || 'Delete failed');
                }
            } catch (error) {
                this.showNotification(error.message || 'Delete failed', 'error');
                $btn.prop('disabled', false).text(originalText);
            }
        }
        
        addFileRow() {
            const $container = $(`.fpe-files-container-vkj785`);
            const newIndex = $container.children().length;
            
            const template = `
                <div class="fpe-file-row-vkj785" data-index="${newIndex}">
                    <input type="text" name="at_file_standard[${newIndex}][at_rp_file_name]" placeholder="ชื่อไฟล์">
                    <input type="text" name="at_file_standard[${newIndex}][at_rp_file_create]" placeholder="วันที่" value="${this.getCurrentDate()}">
                    <input type="hidden" name="at_file_standard[${newIndex}][at_rp_file_link]" class="fpe-file-url-vkj785">
                    <button type="button" class="fpe-upload-file-vkj785">อัพโหลด</button>
                    <button type="button" class="fpe-remove-file-vkj785">ลบ</button>
                </div>
            `;
            
            $container.append(template);
        }
        
        removeFileRow(e) {
            const $row = $(e.currentTarget).closest('.fpe-file-row-vkj785');
            const $container = $row.parent();
            
            if ($container.children().length > 1) {
                $row.fadeOut(300, function() {
                    $(this).remove();
                });
            } else {
                // Clear values if only one row
                $row.find('input[type="text"]').val('');
                $row.find('.fpe-file-url-vkj785').val('');
            }
        }
        
        uploadFile(e) {
            const $btn = $(e.currentTarget);
            const $row = $btn.closest('.fpe-file-row-vkj785');
            
            if (!wp.media) {
                this.showNotification('Media library not available', 'error');
                return;
            }
            
            const uploader = wp.media({
                title: 'Select File',
                multiple: false
            });
            
            uploader.on('select', () => {
                const attachment = uploader.state().get('selection').first().toJSON();
                $row.find('.fpe-file-url-vkj785').val(attachment.url);
                
                // Auto-fill filename if empty
                const $nameInput = $row.find('input[name*="[at_rp_file_name]"]');
                if (!$nameInput.val()) {
                    $nameInput.val(attachment.title || attachment.filename);
                }
            });
            
            uploader.open();
        }
        
        showNotification(message, type = 'info') {
            const $notification = $(`<div class="fpe-notification-vkj785 ${type}">${message}</div>`);
            
            $('body').append($notification);
            $notification.fadeIn(300);
            
            setTimeout(() => {
                $notification.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 3000);
        }
        
        getCurrentDate() {
            const date = new Date();
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
    }
    
    // Initialize when DOM is ready
    $(document).ready(() => {
        new FrontendPostEditor();
    });
    
})(jQuery);