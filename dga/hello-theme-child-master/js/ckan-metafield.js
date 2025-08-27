/**
 * CKAN Metafield System - Main JavaScript
 * Version: 2.1.0
 * Enhanced with all features from both versions
 * Updated: UI class names to xyz432
 */

(function($) {
    'use strict';
    
    // Global configuration
    const CKAN_CONFIG = {
        animationSpeed: 300,
        autoSaveDelay: 1000,
        maxRetries: 3,
        debugMode: false,
        classPrefix: 'xyz432'
    };
    
    // Main Class
    class CKANMetafieldSystem {
        constructor() {
            this.container = null;
            this.postId = null;
            this.nonce = null;
            this.isAdmin = false;
            this.ajaxUrl = null;
            this.texts = {};
            this.init();
        }

        init() {
            // Wait for DOM ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
            
            // Also init jQuery-based features
            $(document).ready(() => {
                this.initJQueryFeatures();
            });
        }

        setup() {
            this.container = document.querySelector('.ckan-metadata-container-xyz432');
            if (!this.container) return;

            this.postId = this.container.dataset.postId;
            this.nonce = this.container.dataset.nonce;
            
            // Check for both vanilla JS and jQuery configurations
            if (typeof ckanMetafield !== 'undefined') {
                this.ajaxUrl = ckanMetafield.ajaxurl;
                this.texts = ckanMetafield.texts || {};
                this.isAdmin = ckanMetafield.isAdmin === true || ckanMetafield.isAdmin === '1';
            }
            
            if (typeof ckanMetafieldAdmin !== 'undefined') {
                this.ajaxUrl = this.ajaxUrl || ckanMetafieldAdmin.ajaxurl;
                this.isAdmin = true;
            }

            this.initCoreFeatures();
        }

        initCoreFeatures() {
            this.initExpandCollapse();
            this.initFieldValueFormatting();
            this.initAccessibility();
            this.initFieldTooltips();
            this.initSectionHighlight();
            this.initKeyboardShortcuts();
        }

        initJQueryFeatures() {
            // Statistics and UI enhancements
            this.displayFieldStats();
            this.initFieldSearch();
            this.initPrintMode();
            
            // Admin features
            if (this.isAdmin) {
                this.initAdminFeatures();
            }
        }

        initExpandCollapse() {
            const expandBtn = document.querySelector('.ckan-expand-btn-xyz432');
            const optionalSection = document.querySelector('.ckan-section-optional-xyz432');
            
            if (!expandBtn || !optionalSection) return;

            // Restore saved state
            const savedState = localStorage.getItem('ckan_optional_expanded');
            if (savedState === 'true') {
                optionalSection.style.display = 'block';
                expandBtn.dataset.expanded = 'true';
                expandBtn.querySelector('.expand-text').style.display = 'none';
                expandBtn.querySelector('.collapse-text').style.display = 'block';
                expandBtn.querySelector('.expand-icon').style.transform = 'rotate(180deg)';
            }

            expandBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const isExpanded = expandBtn.dataset.expanded === 'true';
                
                if (isExpanded) {
                    this.collapseSection(expandBtn, optionalSection);
                } else {
                    this.expandSection(expandBtn, optionalSection);
                }
            });
        }

        expandSection(btn, section) {
            $(section).slideDown(CKAN_CONFIG.animationSpeed, () => {
                btn.dataset.expanded = 'true';
                btn.querySelector('.expand-text').style.display = 'none';
                btn.querySelector('.collapse-text').style.display = 'block';
                btn.querySelector('.expand-icon').style.transform = 'rotate(180deg)';
                btn.setAttribute('aria-expanded', 'true');
                section.setAttribute('aria-hidden', 'false');
                localStorage.setItem('ckan_optional_expanded', 'true');
                $(document).trigger('ckan:expanded');
            });
        }

        collapseSection(btn, section) {
            $(section).slideUp(CKAN_CONFIG.animationSpeed, () => {
                btn.dataset.expanded = 'false';
                btn.querySelector('.expand-text').style.display = 'block';
                btn.querySelector('.collapse-text').style.display = 'none';
                btn.querySelector('.expand-icon').style.transform = 'rotate(0deg)';
                btn.setAttribute('aria-expanded', 'false');
                section.setAttribute('aria-hidden', 'true');
                localStorage.setItem('ckan_optional_expanded', 'false');
                $(document).trigger('ckan:collapsed');
            });
        }

        initFieldTooltips() {
            const labels = document.querySelectorAll('.ckan-field-label-xyz432');
            labels.forEach(label => {
                const row = label.closest('.ckan-field-row-xyz432');
                if (!row) return;
                
                const fieldType = row.dataset.type;
                const fieldName = row.dataset.field;
                
                // Add tooltip
                label.setAttribute('title', `Field: ${fieldName} | Type: ${fieldType}`);
                
                // Add type indicator for non-text fields
                if (fieldType && fieldType !== 'text') {
                    const existing = label.querySelector('.field-type-indicator');
                    if (!existing) {
                        const indicator = document.createElement('span');
                        indicator.className = 'field-type-indicator';
                        indicator.textContent = `(${fieldType})`;
                        indicator.setAttribute('title', `Field Type: ${fieldType}`);
                        label.appendChild(indicator);
                    }
                }
            });
        }

        initSectionHighlight() {
            $('.ckan-field-row-xyz432').on('mouseenter', function() {
                $(this).addClass('row-hover');
            }).on('mouseleave', function() {
                $(this).removeClass('row-hover');
            });
            
            $('.ckan-field-row-xyz432').on('click', function(e) {
                if (!$(e.target).hasClass('ckan-edit-btn-xyz432') && 
                    !$(e.target).closest('.ckan-edit-btn-xyz432').length) {
                    $('.ckan-field-row-xyz432').removeClass('row-focused');
                    $(this).addClass('row-focused');
                }
            });
        }

        displayFieldStats() {
            const totalFields = $('.ckan-field-row-xyz432').length;
            const filledFields = $('.ckan-field-row-xyz432').filter(function() {
                const value = $(this).find('.ckan-field-value-xyz432').data('original') || 
                             $(this).find('.ckan-field-value-xyz432').data('original-value');
                return value && value !== '' && value !== '0';
            }).length;
            
            const mandatoryTotal = $('.ckan-section-mandatory-xyz432 .ckan-field-row-xyz432').length;
            const mandatoryFilled = $('.ckan-section-mandatory-xyz432 .ckan-field-row-xyz432').filter(function() {
                const value = $(this).find('.ckan-field-value-xyz432').data('original') || 
                             $(this).find('.ckan-field-value-xyz432').data('original-value');
                return value && value !== '' && value !== '0';
            }).length;
            
            const percentage = Math.round((filledFields / totalFields) * 100);
            const mandatoryPercentage = Math.round((mandatoryFilled / mandatoryTotal) * 100);
            
            const statsHtml = `
                <div class="ckan-field-stats-xyz432">
                    <div class="stats-row">
                        <span class="stats-label">ความสมบูรณ์ของข้อมูลทั้งหมด:</span>
                        <span class="stats-value">${filledFields}/${totalFields} (${percentage}%)</span>
                        <div class="stats-bar">
                            <div class="stats-progress" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                    <div class="stats-row">
                        <span class="stats-label">Mandatory Fields:</span>
                        <span class="stats-value ${mandatoryPercentage === 100 ? 'complete' : ''}">${mandatoryFilled}/${mandatoryTotal} (${mandatoryPercentage}%)</span>
                        <div class="stats-bar">
                            <div class="stats-progress ${mandatoryPercentage === 100 ? 'complete' : ''}" style="width: ${mandatoryPercentage}%"></div>
                        </div>
                    </div>
                </div>
            `;
            
            if ($('.ckan-field-stats-xyz432').length) {
                $('.ckan-field-stats-xyz432').replaceWith(statsHtml);
            } else {
                $('.ckan-metadata-header-xyz432').after(statsHtml);
            }
        }

        initFieldSearch() {
            if (!this.isAdmin) return;
            
            const searchHtml = `
                <div class="ckan-field-search-container-xyz432">
                    <input type="text" id="ckan-field-search-xyz432" 
                           class="ckan-field-search-xyz432" 
                           placeholder="ค้นหา field..." />
                    <span class="search-clear-xyz432" style="display:none;">✕</span>
                </div>
            `;
            
            $('.ckan-metadata-header-xyz432').append(searchHtml);
            
            $('#ckan-field-search-xyz432').on('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                this.filterFields(searchTerm);
            });
            
            $('.search-clear-xyz432').on('click', () => {
                $('#ckan-field-search-xyz432').val('').trigger('input');
            });
        }

        filterFields(searchTerm) {
            const clearBtn = $('.search-clear-xyz432');
            
            if (searchTerm) {
                clearBtn.show();
                
                $('.ckan-field-row-xyz432').each(function() {
                    const row = $(this);
                    const label = row.find('.ckan-field-label-xyz432').text().toLowerCase();
                    const value = row.find('.ckan-field-value-xyz432').text().toLowerCase();
                    const fieldName = row.data('field').toLowerCase();
                    
                    if (label.includes(searchTerm) || value.includes(searchTerm) || fieldName.includes(searchTerm)) {
                        row.show().addClass('search-match');
                    } else {
                        row.hide().removeClass('search-match');
                    }
                });
                
                // Auto-expand if matches in optional section
                if ($('.ckan-section-optional-xyz432 .search-match').length > 0) {
                    if ($('.ckan-expand-btn-xyz432').attr('data-expanded') !== 'true') {
                        $('.ckan-expand-btn-xyz432').trigger('click');
                    }
                }
            } else {
                clearBtn.hide();
                $('.ckan-field-row-xyz432').show().removeClass('search-match');
            }
        }

        initKeyboardShortcuts() {
            $(document).on('keydown', (e) => {
                // Alt + E: Expand/Collapse
                if (e.altKey && e.keyCode === 69) {
                    e.preventDefault();
                    $('.ckan-expand-btn-xyz432').trigger('click');
                }
                
                // Alt + S: Focus search
                if (e.altKey && e.keyCode === 83) {
                    e.preventDefault();
                    $('#ckan-field-search-xyz432').focus();
                }
                
                // Alt + P: Print
                if (e.altKey && e.keyCode === 80) {
                    e.preventDefault();
                    window.print();
                }
                
                // ESC: Clear search or close modals
                if (e.keyCode === 27) {
                    if ($('#ckan-field-search-xyz432').val()) {
                        $('#ckan-field-search-xyz432').val('').trigger('input');
                    }
                    $('.ckan-modal-xyz432').fadeOut(300);
                }
            });
        }

        initAdminFeatures() {
            // Add admin badge
            if (!$('.admin-badge').length) {
                $('.ckan-metadata-header-xyz432 h3').append(' <span class="admin-badge">Admin Mode</span>');
            }
            
            // Quick actions bar
            this.addQuickActions();
            
            // Double-click to edit
            $('.ckan-field-value-xyz432').on('dblclick', function() {
                const row = $(this).closest('.ckan-field-row-xyz432');
                row.find('.ckan-edit-btn-xyz432').trigger('click');
            });
            
            // Auto-save indicator
            this.initAutoSaveIndicator();
        }

        addQuickActions() {
            if ($('.ckan-quick-actions-xyz432').length) return;
            
            const quickActionsHtml = `
                <div class="ckan-quick-actions-xyz432">
                    <button class="quick-action-btn" data-action="expand-all">
                        <span>⊕</span> Expand All
                    </button>
                    <button class="quick-action-btn" data-action="collapse-all">
                        <span>⊖</span> Collapse All
                    </button>
                    <button class="quick-action-btn" data-action="copy-data">
                        <span>📋</span> Copy Data
                    </button>
                    <button class="quick-action-btn" data-action="validate">
                        <span>✓</span> Validate
                    </button>
                </div>
            `;
            
            $('.ckan-metadata-container-xyz432').prepend(quickActionsHtml);
            
            $('.quick-action-btn').on('click', (e) => {
                const action = $(e.currentTarget).data('action');
                this.handleQuickAction(action);
            });
        }

        handleQuickAction(action) {
            switch (action) {
                case 'expand-all':
                    this.expandAll();
                    break;
                case 'collapse-all':
                    this.collapseAll();
                    break;
                case 'copy-data':
                    this.copyDataToClipboard();
                    break;
                case 'validate':
                    this.validateAllFields();
                    break;
            }
        }

        expandAll() {
            const btn = $('.ckan-expand-btn-xyz432');
            if (btn.attr('data-expanded') !== 'true') {
                btn.trigger('click');
            }
        }

        collapseAll() {
            const btn = $('.ckan-expand-btn-xyz432');
            if (btn.attr('data-expanded') === 'true') {
                btn.trigger('click');
            }
        }

        copyDataToClipboard() {
            const data = this.collectAllData();
            const jsonData = JSON.stringify(data, null, 2);
            
            const textarea = $('<textarea>')
                .val(jsonData)
                .css({ position: 'fixed', left: '-9999px' })
                .appendTo('body');
            
            textarea[0].select();
            document.execCommand('copy');
            textarea.remove();
            
            this.showNotification('ข้อมูลถูกคัดลอกไปยัง clipboard แล้ว', 'success');
        }

        collectAllData() {
            const data = {
                post_id: this.postId,
                fields: {},
                statistics: {
                    total_fields: 0,
                    filled_fields: 0,
                    empty_fields: 0
                }
            };
            
            $('.ckan-field-row-xyz432').each(function() {
                const row = $(this);
                const fieldName = row.data('field');
                const fieldType = row.data('type');
                const fieldValue = row.find('.ckan-field-value-xyz432').data('original') || 
                                  row.find('.ckan-field-value-xyz432').data('original-value');
                const label = row.find('.ckan-field-label-xyz432').text()
                    .replace(/^\d+\.\s*/, '')
                    .replace(/\s*\(.*\)$/, '')
                    .trim();
                
                data.fields[fieldName] = {
                    label: label,
                    value: fieldValue,
                    type: fieldType,
                    filled: !!(fieldValue && fieldValue !== '' && fieldValue !== '0')
                };
                
                data.statistics.total_fields++;
                if (data.fields[fieldName].filled) {
                    data.statistics.filled_fields++;
                } else {
                    data.statistics.empty_fields++;
                }
            });
            
            data.statistics.completion_percentage = Math.round(
                (data.statistics.filled_fields / data.statistics.total_fields) * 100
            );
            
            return data;
        }

        validateAllFields() {
            let errors = [];
            let warnings = [];
            
            $('.ckan-section-mandatory-xyz432 .ckan-field-row-xyz432').each(function() {
                const row = $(this);
                const fieldValue = row.find('.ckan-field-value-xyz432').data('original') || 
                                  row.find('.ckan-field-value-xyz432').data('original-value');
                const fieldLabel = row.find('.ckan-field-label-xyz432').text();
                const fieldType = row.data('type');
                
                if (!fieldValue || fieldValue === '' || fieldValue === '0') {
                    errors.push(`ฟิลด์บังคับ "${fieldLabel}" ยังไม่มีข้อมูล`);
                    row.addClass('validation-error');
                } else {
                    row.removeClass('validation-error');
                    
                    // Type-specific validation
                    if (fieldType === 'email' && fieldValue && !this.isValidEmail(fieldValue)) {
                        warnings.push(`รูปแบบอีเมลในฟิลด์ "${fieldLabel}" ไม่ถูกต้อง`);
                        row.addClass('validation-warning');
                    }
                    
                    if (fieldType === 'url' && fieldValue && !this.isValidUrl(fieldValue)) {
                        warnings.push(`รูปแบบ URL ในฟิลด์ "${fieldLabel}" ไม่ถูกต้อง`);
                        row.addClass('validation-warning');
                    }
                }
            }.bind(this));
            
            this.showValidationResults(errors, warnings);
        }

        showValidationResults(errors, warnings) {
            if (errors.length === 0 && warnings.length === 0) {
                this.showNotification('✓ ข้อมูลครบถ้วนและถูกต้อง', 'success');
            } else {
                let message = '';
                
                if (errors.length > 0) {
                    message += `<div class="validation-errors"><strong>ข้อผิดพลาด (${errors.length}):</strong><ul>`;
                    errors.forEach(error => {
                        message += `<li>${error}</li>`;
                    });
                    message += '</ul></div>';
                }
                
                if (warnings.length > 0) {
                    message += `<div class="validation-warnings"><strong>คำเตือน (${warnings.length}):</strong><ul>`;
                    warnings.forEach(warning => {
                        message += `<li>${warning}</li>`;
                    });
                    message += '</ul></div>';
                }
                
                this.showValidationModal(message);
            }
        }

        showValidationModal(content) {
            const modalHtml = `
                <div class="ckan-validation-modal-xyz432">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4>ผลการตรวจสอบข้อมูล</h4>
                            <span class="modal-close">&times;</span>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        <div class="modal-footer">
                            <button class="btn-close">ปิด</button>
                        </div>
                    </div>
                </div>
            `;
            
            $('body').append(modalHtml);
            
            $('.ckan-validation-modal-xyz432 .modal-close, .ckan-validation-modal-xyz432 .btn-close').on('click', () => {
                $('.ckan-validation-modal-xyz432').fadeOut(300, function() {
                    $(this).remove();
                });
            });
            
            $('.ckan-validation-modal-xyz432').fadeIn(300);
        }

        initAutoSaveIndicator() {
            const indicatorHtml = '<div class="auto-save-indicator-xyz432" style="display:none;">กำลังบันทึกอัตโนมัติ...</div>';
            $('.ckan-metadata-header-xyz432').append(indicatorHtml);
        }

        showAutoSaveIndicator() {
            $('.auto-save-indicator-xyz432').fadeIn(200);
            setTimeout(() => {
                $('.auto-save-indicator-xyz432').fadeOut(200);
            }, 2000);
        }

        initPrintMode() {
            if (this.isAdmin) {
                const printBtn = '<button class="ckan-print-btn-xyz432" title="พิมพ์">🖨️ พิมพ์</button>';
                $('.ckan-admin-actions-xyz432').append(printBtn);
                
                $('.ckan-print-btn-xyz432').on('click', () => {
                    window.print();
                });
            }
            
            window.addEventListener('beforeprint', () => {
                this.expandAll();
                $('body').addClass('ckan-printing');
            });
            
            window.addEventListener('afterprint', () => {
                $('body').removeClass('ckan-printing');
            });
        }

        initFieldValueFormatting() {
            const fieldRows = document.querySelectorAll('.ckan-field-row-xyz432');
            
            fieldRows.forEach(row => {
                const fieldType = row.dataset.type;
                const valueElement = row.querySelector('.ckan-field-value-xyz432');
                
                if (!valueElement) return;
                
                switch(fieldType) {
                    case 'url':
                        this.formatUrlField(valueElement);
                        break;
                    case 'email':
                        this.formatEmailField(valueElement);
                        break;
                    case 'date':
                    case 'datetime':
                        this.formatDateField(valueElement, fieldType);
                        break;
                    case 'number':
                        this.formatNumberField(valueElement);
                        break;
                }
            });
        }

        formatUrlField(element) {
            const links = element.querySelectorAll('a');
            links.forEach(link => {
                link.setAttribute('rel', 'noopener noreferrer');
                link.setAttribute('title', link.href);
            });
        }

        formatEmailField(element) {
            const links = element.querySelectorAll('a[href^="mailto:"]');
            links.forEach(link => {
                link.setAttribute('title', 'Send email');
            });
        }

        formatDateField(element, type) {
            const dateText = element.textContent.trim();
            if (dateText && dateText !== 'ไม่มีข้อมูล') {
                element.setAttribute('title', dateText);
            }
        }

        formatNumberField(element) {
            const numberText = element.textContent.trim();
            if (numberText && !isNaN(numberText)) {
                element.setAttribute('data-raw-value', numberText);
            }
        }

        initAccessibility() {
            const expandBtn = document.querySelector('.ckan-expand-btn-xyz432');
            if (expandBtn) {
                expandBtn.setAttribute('aria-expanded', 'false');
                expandBtn.setAttribute('aria-controls', 'optional-fields');
            }

            const optionalSection = document.querySelector('.ckan-section-optional-xyz432');
            if (optionalSection) {
                optionalSection.setAttribute('id', 'optional-fields');
                optionalSection.setAttribute('aria-hidden', 'true');
            }
        }

        async makeRequest(action, data = {}) {
            const formData = new FormData();
            formData.append('action', action);
            formData.append('nonce', this.nonce);
            formData.append('post_id', this.postId);

            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    formData.append(key, data[key]);
                }
            }

            try {
                const response = await fetch(this.ajaxUrl, {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: formData
                });

                const result = await response.json();
                
                if (result.success) {
                    return result.data;
                } else {
                    throw new Error(result.data?.message || 'Request failed');
                }
            } catch (error) {
                console.error('AJAX Request Error:', error);
                throw error;
            }
        }

        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `ckan-notification-xyz432 ckan-notification-${type}-xyz432`;
            notification.textContent = message;
            notification.setAttribute('role', 'alert');
            notification.setAttribute('aria-live', 'polite');

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        isValidEmail(email) {
            const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return regex.test(email);
        }

        isValidUrl(url) {
            try {
                new URL(url);
                return true;
            } catch (_) {
                return false;
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
    }

    // Initialize the enhanced system
    window.ckanSystem = new CKANMetafieldSystem();
    
    // Public API
    window.CKANMetafield = {
        version: '2.1.0',
        config: CKAN_CONFIG,
        system: window.ckanSystem,
        
        // Public methods
        expandAll: () => window.ckanSystem.expandAll(),
        collapseAll: () => window.ckanSystem.collapseAll(),
        validateAllFields: () => window.ckanSystem.validateAllFields(),
        collectAllData: () => window.ckanSystem.collectAllData(),
        showNotification: (msg, type) => window.ckanSystem.showNotification(msg, type),
        refreshStats: () => window.ckanSystem.displayFieldStats(),
        
        // Get current state
        getState: function() {
            return {
                expanded: $('.ckan-expand-btn-xyz432').attr('data-expanded') === 'true',
                totalFields: $('.ckan-field-row-xyz432').length,
                filledFields: $('.ckan-field-row-xyz432').filter(function() {
                    const value = $(this).find('.ckan-field-value-xyz432').data('original') || 
                                 $(this).find('.ckan-field-value-xyz432').data('original-value');
                    return value && value !== '' && value !== '0';
                }).length,
                searchTerm: $('#ckan-field-search-xyz432').val() || ''
            };
        }
    };
    
})(jQuery);