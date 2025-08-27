/**
 * CKAN Metafield System - Admin JavaScript Fixed
 * Version: 2.2.0
 * Fixed: Edit functionality
 * Updated: UI class names to xyz432
 */

(function($) {
    'use strict';

    class CKANMetafieldAdmin {
        constructor() {
            this.container = $('.ckan-metadata-container-xyz432');
            if (!this.container.length || !this.container.hasClass('ckan-admin-mode-xyz432')) {
                console.log('Admin mode not enabled or container not found');
                return;
            }

            this.postId = this.container.data('post-id');
            this.nonce = this.container.data('nonce');
            
            // Check both sources for ajax URL
            if (typeof ckanMetafieldAdmin !== 'undefined') {
                this.ajaxUrl = ckanMetafieldAdmin.ajaxurl;
                this.texts = ckanMetafieldAdmin.texts || {};
            } else if (typeof ckanMetafield !== 'undefined') {
                this.ajaxUrl = ckanMetafield.ajaxurl;
                this.texts = ckanMetafield.texts || {};
            } else {
                console.error('CKAN: No configuration found');
                return;
            }
            
            this.modals = {};
            this.currentEditingField = null;
            this.currentEditingRow = null;
            
            console.log('CKAN Admin initialized', {
                postId: this.postId,
                ajaxUrl: this.ajaxUrl
            });
            
            this.init();
        }

        init() {
            this.initEditButtons();
            this.initSettingsButton();
            this.initFieldManager();
            this.initAdminActions();
            this.initModals();
            this.setupKeyboardShortcuts();
        }

        initEditButtons() {
            // Use event delegation for dynamically added elements
            const self = this;
            
            // Click on edit icon in value cell
            $(document).off('click.ckan-edit').on('click.ckan-edit', '.ckan-edit-icon-xyz432', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Edit icon clicked');
                
                const fieldRow = $(this).closest('.ckan-field-row-xyz432, .ckan-metadata-row-xyz432');
                if (fieldRow.length) {
                    self.editFieldInline(fieldRow);
                }
            });
            
            // Alternative: Double click on value to edit
            $(document).on('dblclick', '.ckan-field-value-xyz432, .ckan-metadata-value-xyz432', function(e) {
                if (self.container.hasClass('ckan-admin-mode-xyz432')) {
                    e.preventDefault();
                    const fieldRow = $(this).closest('.ckan-field-row-xyz432, .ckan-metadata-row-xyz432');
                    if (fieldRow.length) {
                        self.editFieldInline(fieldRow);
                    }
                }
            });
        }

        editFieldInline(row) {
            console.log('Starting inline edit', row.data('field'));
            
            // Cancel any existing edit
            if (this.currentEditingRow) {
                this.cancelEdit(this.currentEditingRow);
            }
            
            this.currentEditingRow = row;
            row.addClass('editing');
            
            const fieldType = row.data('type') || 'text';
            const fieldName = row.data('field');
            const valueCell = row.find('.ckan-field-value-xyz432, .ckan-metadata-value-xyz432').first();
            const originalValue = valueCell.data('original-value') || valueCell.data('original') || '';
            const fieldOptions = row.data('field-options');
            
            console.log('Field details:', {
                type: fieldType,
                name: fieldName,
                value: originalValue,
                options: fieldOptions
            });
            
            // Store original HTML
            valueCell.data('original-html', valueCell.html());
            
            // Create editor
            const editorHtml = this.createFieldEditor(row, fieldType, originalValue, fieldOptions);
            
            // Replace with editor
            valueCell.html(editorHtml);
            
            // Add action buttons
            const actionsHtml = `
                <div class="ckan-edit-actions-xyz432">
                    <button type="button" class="ckan-save-btn-xyz432">${this.texts.saveText || 'บันทึก'}</button>
                    <button type="button" class="ckan-cancel-btn-xyz432">${this.texts.cancelText || 'ยกเลิก'}</button>
                </div>
            `;
            valueCell.append(actionsHtml);
            
            // Focus first input
            setTimeout(() => {
                valueCell.find('input, select, textarea').first().focus().select();
            }, 100);
            
            // Bind save/cancel with proper context
            valueCell.find('.ckan-save-btn-xyz432').off('click').on('click', () => {
                this.saveInlineEdit(row);
            });
            
            valueCell.find('.ckan-cancel-btn-xyz432').off('click').on('click', () => {
                this.cancelEdit(row);
            });
            
            // Enter to save, Escape to cancel
            valueCell.find('input, select, textarea').on('keydown', (e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.saveInlineEdit(row);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.cancelEdit(row);
                }
            });
        }

        createFieldEditor(row, fieldType, originalValue, fieldOptions) {
            let editorHtml = '<div class="ckan-field-editor-xyz432">';
            
            // Parse field options if string
            if (typeof fieldOptions === 'string') {
                try {
                    fieldOptions = JSON.parse(fieldOptions);
                } catch (e) {
                    fieldOptions = {};
                }
            }
            
            switch (fieldType) {
                case 'select':
                    editorHtml += this.createSelectEditor(originalValue, fieldOptions);
                    break;
                    
                case 'taxonomy':
                    editorHtml += this.createTaxonomyEditor(row, originalValue);
                    break;
                    
                case 'boolean':
                    editorHtml += this.createBooleanEditor(originalValue);
                    break;
                    
                case 'email':
                    editorHtml += `<input type="email" value="${this.escapeHtml(originalValue || '')}" 
                                  placeholder="example@email.com" class="field-input" />`;
                    break;
                    
                case 'url':
                    editorHtml += `<input type="url" value="${this.escapeHtml(originalValue || '')}" 
                                  placeholder="https://example.com" class="field-input" />`;
                    break;
                    
                case 'date':
                    editorHtml += this.createDateEditor(originalValue);
                    break;
                    
                case 'datetime':
                    editorHtml += this.createDateTimeEditor(originalValue);
                    break;
                    
                case 'number':
                    editorHtml += `<input type="number" value="${this.escapeHtml(originalValue || '')}" 
                                  class="field-input" />`;
                    break;
                    
                case 'textarea':
                    editorHtml += `<textarea rows="4" class="field-input">${this.escapeHtml(originalValue || '')}</textarea>`;
                    break;
                    
                default:
                    editorHtml += `<input type="text" value="${this.escapeHtml(originalValue || '')}" 
                                  class="field-input" />`;
            }
            
            editorHtml += '</div>';
            return editorHtml;
        }

        createSelectEditor(originalValue, options) {
            let html = '<select class="field-select field-input">';
            html += '<option value="">-- เลือก --</option>';
            
            if (options && typeof options === 'object') {
                for (const [value, label] of Object.entries(options)) {
                    const selected = (originalValue === value) ? 'selected' : '';
                    html += `<option value="${this.escapeHtml(value)}" ${selected}>${this.escapeHtml(label)}</option>`;
                }
            }
            
            html += '</select>';
            return html;
        }

        createTaxonomyEditor(row, originalValue) {
            const taxonomySlug = row.data('taxonomy') || '';
            let html = `<select class="field-select taxonomy-select field-input" 
                        data-taxonomy="${taxonomySlug}">`;
            html += '<option value="">กำลังโหลด...</option>';
            html += '</select>';
            
            // Load taxonomy terms after rendering
            setTimeout(() => {
                this.loadTaxonomyTerms(row, taxonomySlug, originalValue);
            }, 100);
            
            return html;
        }

        createBooleanEditor(originalValue) {
            const isChecked = (originalValue === true || originalValue === 1 || 
                              originalValue === '1' || originalValue === 'true' || 
                              originalValue === 'ยินยอม') ? 'checked' : '';
            
            return `<label class="boolean-editor">
                    <input type="checkbox" class="field-input" ${isChecked} /> 
                    <span>ยินยอม / ใช่</span>
                    </label>`;
        }

        createDateEditor(originalValue) {
            let dateValue = originalValue;
            
            if (dateValue && !isNaN(dateValue)) {
                const date = new Date(parseInt(dateValue) * 1000);
                dateValue = date.toISOString().split('T')[0];
            } else if (dateValue && dateValue.includes('/')) {
                const parts = dateValue.split('/');
                if (parts.length === 3) {
                    const year = parseInt(parts[2]) > 2500 ? parseInt(parts[2]) - 543 : parts[2];
                    dateValue = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
            
            return `<input type="date" value="${this.escapeHtml(dateValue || '')}" 
                    class="field-input date-input" />`;
        }

        createDateTimeEditor(originalValue) {
            let datetimeValue = originalValue;
            
            if (datetimeValue && !isNaN(datetimeValue)) {
                const datetime = new Date(parseInt(datetimeValue) * 1000);
                datetimeValue = datetime.toISOString().slice(0, 16);
            }
            
            return `<input type="datetime-local" value="${this.escapeHtml(datetimeValue || '')}" 
                    class="field-input datetime-input" />`;
        }

        loadTaxonomyTerms(row, taxonomySlug, currentValue) {
            if (!taxonomySlug) return;
            
            const selectField = row.find('.taxonomy-select');
            
            $.ajax({
                url: this.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'ckan_get_taxonomy_terms',
                    nonce: this.nonce,
                    taxonomy: taxonomySlug
                },
                success: (response) => {
                    if (response.success && response.data.terms) {
                        selectField.empty();
                        selectField.append('<option value="">-- เลือก --</option>');
                        
                        let currentValues = [];
                        if (currentValue) {
                            if (typeof currentValue === 'string') {
                                currentValues = currentValue.split(',').map(v => v.trim());
                            } else if (Array.isArray(currentValue)) {
                                currentValues = currentValue;
                            }
                        }
                        
                        response.data.terms.forEach(term => {
                            const selected = currentValues.includes(term.name) || 
                                           currentValues.includes(term.slug) ? 'selected' : '';
                            selectField.append(
                                `<option value="${this.escapeHtml(term.slug)}" ${selected}>
                                ${this.escapeHtml(term.name)}</option>`
                            );
                        });
                    }
                },
                error: (xhr, status, error) => {
                    selectField.html('<option value="">เกิดข้อผิดพลาดในการโหลดข้อมูล</option>');
                    console.error('Error loading taxonomy terms:', error);
                }
            });
        }

        saveInlineEdit(row) {
            const fieldName = row.data('field');
            const fieldType = row.data('type');
            const taxonomy = row.data('taxonomy');
            const fieldValue = this.getFieldValueFromEditor(row, fieldType);
            
            console.log('Saving field:', {
                name: fieldName,
                type: fieldType,
                value: fieldValue
            });
            
            // Show saving state
            const saveBtn = row.find('.ckan-save-btn-xyz432');
            const originalText = saveBtn.text();
            saveBtn.text(this.texts.savingText || 'กำลังบันทึก...').prop('disabled', true);
            
            $.ajax({
                url: this.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'ckan_update_field',
                    nonce: this.nonce,
                    post_id: this.postId,
                    field_name: fieldName,
                    field_value: fieldValue,
                    field_type: fieldType,
                    taxonomy: taxonomy
                },
                success: (response) => {
                    console.log('Save response:', response);
                    
                    if (response.success) {
                        const valueCell = row.find('.ckan-field-value-xyz432, .ckan-metadata-value-xyz432').first();
                        valueCell.html(response.data.formatted_value);
                        valueCell.data('original-value', response.data.raw_value);
                        valueCell.data('original', response.data.raw_value);
                        
                        // Add edit icon back
                        if (!valueCell.find('.ckan-edit-icon-xyz432').length) {
                            valueCell.append(`
                                <span class="ckan-edit-icon-xyz432" title="แก้ไข">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                    </svg>
                                </span>
                            `);
                        }
                        
                        row.removeClass('editing');
                        row.addClass('field-updated');
                        setTimeout(() => row.removeClass('field-updated'), 1000);
                        
                        this.currentEditingRow = null;
                        
                        // Show success message
                        this.showFieldMessage(row, response.data.message || this.texts.successText || 'บันทึกสำเร็จ', 'success');
                        
                        // Refresh stats if available
                        if (window.ckanSystem && typeof window.ckanSystem.displayFieldStats === 'function') {
                            window.ckanSystem.displayFieldStats();
                        }
                    } else {
                        this.showFieldMessage(row, response.data.message || this.texts.errorText, 'error');
                        saveBtn.text(originalText).prop('disabled', false);
                    }
                },
                error: (xhr, status, error) => {
                    console.error('Save error:', error);
                    this.showFieldMessage(row, this.texts.errorText || 'เกิดข้อผิดพลาด', 'error');
                    saveBtn.text(originalText).prop('disabled', false);
                }
            });
        }

        getFieldValueFromEditor(row, fieldType) {
            const editor = row.find('.ckan-field-editor-xyz432');
            let fieldValue;
            
            switch (fieldType) {
                case 'boolean':
                    fieldValue = editor.find('input[type="checkbox"]').is(':checked') ? '1' : '0';
                    break;
                    
                case 'select':
                case 'taxonomy':
                    fieldValue = editor.find('select').val();
                    break;
                    
                case 'textarea':
                    fieldValue = editor.find('textarea').val().trim();
                    break;
                    
                default:
                    fieldValue = editor.find('.field-input').val().trim();
            }
            
            return fieldValue;
        }

        cancelEdit(row) {
            const valueCell = row.find('.ckan-field-value-xyz432, .ckan-metadata-value-xyz432').first();
            const originalHtml = valueCell.data('original-html');
            
            if (originalHtml) {
                valueCell.html(originalHtml);
            }
            
            row.removeClass('editing');
            this.currentEditingRow = null;
        }

        showFieldMessage(row, message, type) {
            const msgHtml = `<span class="field-message ${type}">${message}</span>`;
            const label = row.find('.ckan-field-label-xyz432, .ckan-metadata-label-xyz432').first();
            
            label.find('.field-message').remove();
            label.append(msgHtml);
            
            setTimeout(() => {
                label.find('.field-message').fadeOut(300, function() {
                    $(this).remove();
                });
            }, 3000);
        }

        initSettingsButton() {
            $(document).on('click', '.ckan-settings-btn-xyz432, .ckan-settings-link-xyz432', (e) => {
                e.preventDefault();
                this.showModal('settings');
            });
        }

        initFieldManager() {
            $(document).on('click', '.ckan-field-manager-link-xyz432', (e) => {
                e.preventDefault();
                this.loadFieldManagerModal();
            });
        }

        loadFieldManagerModal() {
            $.ajax({
                url: this.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'ckan_get_field_config',
                    nonce: this.nonce
                },
                success: (response) => {
                    if (response.success) {
                        this.showFieldManagerModal(response.data);
                    }
                },
                error: (xhr, status, error) => {
                    console.error('Error loading field config:', error);
                }
            });
        }

        showFieldManagerModal(data) {
            const modal = $('#ckan-field-manager-modal-xyz432');
            if (!modal.length) return;
            
            const container = modal.find('.ckan-field-manager-list-xyz432');
            let tableHtml = '<table class="ckan-field-manager-table-xyz432">';
            tableHtml += '<thead><tr><th>Field</th><th>Label</th><th>Name</th><th>Type</th></tr></thead>';
            tableHtml += '<tbody>';
            
            data.fields.forEach(field => {
                const currentLabel = data.custom_labels[field.key] || field.label;
                const currentName = data.custom_names[field.key] || field.field;
                
                tableHtml += `
                    <tr data-field-key="${field.key}">
                        <td><code>${field.key}</code></td>
                        <td>
                            <input type="text" class="field-label-input" 
                                   value="${this.escapeHtml(currentLabel)}" 
                                   data-original="${this.escapeHtml(field.label)}" />
                        </td>
                        <td>
                            <input type="text" class="field-name-input" 
                                   value="${this.escapeHtml(currentName)}" 
                                   data-original="${this.escapeHtml(field.field)}" />
                        </td>
                        <td><span class="field-type-badge">${field.type}</span></td>
                    </tr>
                `;
            });
            
            tableHtml += '</tbody></table>';
            container.html(tableHtml);
            
            // Track changes
            container.find('input').on('input', function() {
                const input = $(this);
                const original = input.data('original');
                if (input.val() !== original) {
                    input.addClass('field-changed');
                } else {
                    input.removeClass('field-changed');
                }
            });
            
            this.showModal('fieldManager');
        }

        initAdminActions() {
            // Update API button
            $(document).on('click', '.ckan-update-api-btn-xyz432', (e) => {
                e.preventDefault();
                const endpoint = $(e.currentTarget).data('endpoint');
                this.updateAPI(endpoint);
            });
            
            // Test API button
            $(document).on('click', '.ckan-api-test-btn-xyz432', (e) => {
                e.preventDefault();
                this.testAPI();
            });
            
            // Export CSV button
            $(document).on('click', '.ckan-export-csv-btn-xyz432, .ckan-csv-export-btn-xyz432', (e) => {
                e.preventDefault();
                this.exportCSV();
            });
            
            // Close JSON response
            $(document).on('click', '.ckan-close-json-btn-xyz432', () => {
                $('.ckan-api-response-container-xyz432').fadeOut(300);
            });
        }

        updateAPI(endpoint) {
            if (!endpoint) {
                this.showNotification('กรุณาตั้งค่า API endpoint ก่อน', 'warning');
                this.showModal('settings');
                return;
            }
            
            const confirmUpdate = confirm(this.texts.confirmText || 'ต้องการอัพเดต API?');
            if (!confirmUpdate) return;
            
            const updateBtn = $('.ckan-update-api-btn-xyz432');
            const originalText = updateBtn.text();
            
            updateBtn.prop('disabled', true).text(this.texts.apiUpdateText || 'กำลังอัพเดต API...');
            
            // Collect all data
            const data = this.collectAllMetadata();
            
            $.ajax({
                url: this.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'ckan_update_api',
                    nonce: this.nonce,
                    post_id: this.postId,
                    endpoint: endpoint,
                    data: JSON.stringify(data)
                },
                success: (response) => {
                    if (response.success) {
                        this.showAPIResponse(response.data);
                        this.showNotification(response.data.message || this.texts.apiSuccessText, 'success');
                    } else {
                        this.showNotification(response.data.message || this.texts.apiErrorText, 'error');
                    }
                },
                error: (xhr, status, error) => {
                    this.showNotification(this.texts.apiErrorText || 'Failed to update API', 'error');
                    console.error('API update error:', error);
                },
                complete: () => {
                    updateBtn.prop('disabled', false).text(originalText);
                }
            });
        }

        testAPI() {
            const data = this.collectAllMetadata();
            const jsonData = JSON.stringify(data, null, 2);
            
            $('.ckan-api-response-json-xyz432').text(jsonData);
            $('.ckan-api-response-container-xyz432').fadeIn(300);
        }

        collectAllMetadata() {
            const metadata = {};
            
            $('.ckan-field-row-xyz432, .ckan-metadata-row-xyz432').each(function() {
                const row = $(this);
                const fieldName = row.data('field');
                const fieldType = row.data('type');
                const fieldLabel = row.find('.ckan-field-label-xyz432, .ckan-metadata-label-xyz432').text()
                    .replace(/^\d+\.\s*/, '').replace(/\s*\*$/, '').trim();
                const fieldValue = row.find('.ckan-field-value-xyz432, .ckan-metadata-value-xyz432').data('original') || 
                                  row.find('.ckan-field-value-xyz432, .ckan-metadata-value-xyz432').data('original-value') || '';
                
                metadata[fieldName] = {
                    label: fieldLabel,
                    value: fieldValue,
                    type: fieldType
                };
            });
            
            return {
                post_id: this.postId,
                post_title: $('[data-field="post_title"] .ckan-field-value-xyz432').text(),
                post_url: window.location.href,
                metadata: metadata,
                timestamp: new Date().toISOString()
            };
        }

        showAPIResponse(data) {
            const container = $('.ckan-api-response-container-xyz432');
            const jsonDisplay = container.find('.ckan-api-response-json-xyz432');
            
            let content = '';
            if (data.response) {
                content = JSON.stringify(data.response, null, 2);
            } else {
                content = JSON.stringify(data, null, 2);
            }
            
            jsonDisplay.text(content);
            container.fadeIn(300);
        }

        exportCSV() {
            const exportBtn = $('.ckan-export-csv-btn-xyz432, .ckan-csv-export-btn-xyz432');
            const originalText = exportBtn.text();
            
            exportBtn.prop('disabled', true).text(this.texts.exportCsvText || 'กำลังสร้างไฟล์ CSV...');
            
            const metadata = this.collectAllMetadata();
            
            $.ajax({
                url: this.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'ckan_export_csv',
                    nonce: this.nonce,
                    post_id: this.postId,
                    metadata: JSON.stringify(metadata.metadata)
                },
                success: (response) => {
                    if (response.success && response.data.csv_content) {
                        this.downloadCSV(response.data.csv_content, response.data.filename);
                        this.showNotification(response.data.message || 'CSV exported successfully', 'success');
                    }
                },
                error: (xhr, status, error) => {
                    this.showNotification('Failed to export CSV', 'error');
                    console.error('CSV export error:', error);
                },
                complete: () => {
                    exportBtn.prop('disabled', false).text(originalText);
                }
            });
        }

        downloadCSV(base64Content, filename) {
            const csvContent = atob(base64Content);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        initModals() {
            // Settings modal
            const settingsModal = $('#ckan-settings-modal-xyz432');
            if (settingsModal.length) {
                this.modals.settings = settingsModal[0];
                this.initModalEvents(settingsModal, 'settings');
            }
            
            // Field manager modal
            const fieldManagerModal = $('#ckan-field-manager-modal-xyz432');
            if (fieldManagerModal.length) {
                this.modals.fieldManager = fieldManagerModal[0];
                this.initModalEvents(fieldManagerModal, 'fieldManager');
            }
        }

        initModalEvents(modal, type) {
            const $modal = $(modal);
            
            // Close button
            $modal.find('.ckan-modal-close-xyz432').on('click', () => {
                this.hideModal(type);
            });
            
            // Cancel button
            $modal.find('.ckan-cancel-endpoint-btn-xyz432, .ckan-cancel-field-manager-btn-xyz432').on('click', () => {
                this.hideModal(type);
            });
            
            // Save buttons
            if (type === 'settings') {
                $modal.find('.ckan-save-endpoint-btn-xyz432').on('click', () => {
                    this.saveEndpoint();
                });
            } else if (type === 'fieldManager') {
                $modal.find('.ckan-save-field-labels-btn-xyz432').on('click', () => {
                    this.saveFieldLabels();
                });
                $modal.find('.ckan-reset-field-labels-btn-xyz432').on('click', () => {
                    this.resetFieldLabels();
                });
            }
            
            // Click outside to close
            $modal.on('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(type);
                }
            });
        }

        showModal(type) {
            const modal = this.modals[type];
            if (!modal) return;
            
            $(modal).fadeIn(300).addClass('show');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        hideModal(type) {
            const modal = this.modals[type];
            if (!modal) return;
            
            $(modal).fadeOut(300).removeClass('show');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        saveEndpoint() {
            const input = $('#ckan-endpoint-url-xyz432');
            const endpoint = input.val();
            
            if (!this.isValidUrl(endpoint) && endpoint !== '') {
                this.showNotification('รูปแบบ URL ไม่ถูกต้อง', 'error');
                return;
            }
            
            const saveBtn = $('.ckan-save-endpoint-btn-xyz432');
            const originalText = saveBtn.text();
            
            saveBtn.prop('disabled', true).text(this.texts.endpointSavingText || 'กำลังบันทึก...');
            
            $.ajax({
                url: this.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'ckan_save_endpoint',
                    nonce: this.nonce,
                    post_id: this.postId,
                    endpoint: endpoint
                },
                success: (response) => {
                    if (response.success) {
                        $('.ckan-update-api-btn-xyz432').data('endpoint', endpoint);
                        this.showNotification(response.data.message || this.texts.endpointSavedText, 'success');
                        this.hideModal('settings');
                    } else {
                        this.showNotification(response.data.message || 'Failed to save', 'error');
                    }
                },
                error: () => {
                    this.showNotification('Failed to save endpoint', 'error');
                },
                complete: () => {
                    saveBtn.prop('disabled', false).text(originalText);
                }
            });
        }

        saveFieldLabels() {
            const labels = {};
            const names = {};
            
            $('.ckan-field-manager-table-xyz432 tbody tr').each(function() {
                const row = $(this);
                const key = row.data('field-key');
                const labelInput = row.find('.field-label-input');
                const nameInput = row.find('.field-name-input');
                
                if (labelInput.hasClass('field-changed')) {
                    labels[key] = labelInput.val();
                }
                
                if (nameInput.hasClass('field-changed')) {
                    names[key] = nameInput.val();
                }
            });
            
            $.ajax({
                url: this.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'ckan_save_field_labels',
                    nonce: this.nonce,
                    labels: JSON.stringify(labels),
                    names: JSON.stringify(names)
                },
                success: (response) => {
                    if (response.success) {
                        this.showNotification(this.texts.fieldLabelsSavedText || 'Settings saved', 'success');
                        location.reload();
                    }
                },
                error: () => {
                    this.showNotification('Failed to save settings', 'error');
                }
            });
        }

        resetFieldLabels() {
            if (!confirm(this.texts.confirmResetText || 'Reset all field labels?')) {
                return;
            }
            
            $.ajax({
                url: this.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'ckan_reset_field_labels',
                    nonce: this.nonce
                },
                success: (response) => {
                    if (response.success) {
                        this.showNotification(this.texts.fieldLabelsResetText || 'Settings reset', 'success');
                        location.reload();
                    }
                },
                error: () => {
                    this.showNotification('Failed to reset settings', 'error');
                }
            });
        }

        setupKeyboardShortcuts() {
            $(document).on('keydown', (e) => {
                // Ctrl/Cmd + S to save in modals
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    
                    if (this.currentEditingRow) {
                        this.saveInlineEdit(this.currentEditingRow);
                    }
                }
                
                // Ctrl/Cmd + E to export CSV
                if ((e.ctrlKey || e.metaKey) && e.key === 'e' && this.container.hasClass('ckan-admin-mode-xyz432')) {
                    e.preventDefault();
                    this.exportCSV();
                }
            });
        }

        showNotification(message, type = 'info') {
            if (window.ckanSystem && typeof window.ckanSystem.showNotification === 'function') {
                window.ckanSystem.showNotification(message, type);
            } else {
                const notification = $(`<div class="ckan-notification-xyz432 ckan-notification-${type}-xyz432">${message}</div>`);
                $('body').append(notification);
                
                setTimeout(() => {
                    notification.addClass('fade-out');
                    setTimeout(() => notification.remove(), 300);
                }, 3000);
            }
        }

        escapeHtml(str) {
            if (str === null || str === undefined) return '';
            
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        isValidUrl(string) {
            try {
                new URL(string);
                return true;
            } catch (_) {
                return false;
            }
        }
    }

    // Initialize admin features when DOM is ready
    $(document).ready(() => {
        // Check if we're in admin mode
        if ((typeof ckanMetafieldAdmin !== 'undefined' && ckanMetafieldAdmin.isAdmin) ||
            (typeof ckanMetafield !== 'undefined' && ckanMetafield.isAdmin)) {
            console.log('Initializing CKAN Admin...');
            window.ckanAdmin = new CKANMetafieldAdmin();
        }
    });

})(jQuery);