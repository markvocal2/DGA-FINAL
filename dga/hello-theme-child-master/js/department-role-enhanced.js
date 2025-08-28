/**
 * Enhanced Department Role Manager - JavaScript
 * Version 2.0.0
 * Complete capability management system
 */

jQuery(document).ready(function($) {
    'use strict';
    
    // Global variables
    let currentRole = null;
    let searchTimeout = null;
    
    // Initialize
    init();
    
    function init() {
        // Tab functionality
        $('.tab-button').on('click', function() {
            const tab = $(this).data('tab');
            $('.tab-button').removeClass('active');
            $(this).addClass('active');
            $('.tab-content').hide();
            $(`#${tab}-tab`).fadeIn();
            
            if (tab === 'manage') {
                loadRolesTable();
            }
        });
        
        // Create role form
        $('#enhanced-create-role-form').on('submit', createNewRole);
        
        // Preset template change
        $('#preset_template').on('change', function() {
            const preset = $(this).val();
            if (preset) {
                showPresetInfo(preset);
            }
        });
        
        // Modal close
        $('.modal-close, .modal-enhanced').on('click', function(e) {
            if (e.target === this || $(e.target).hasClass('modal-close') || $(e.target).parent().hasClass('modal-close')) {
                closeModal();
            }
        });
        
        // Keyboard events
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
    }
    
    /**
     * Create new role
     */
    function createNewRole(e) {
        e.preventDefault();
        
        const $form = $(this);
        const $submitBtn = $form.find('button[type="submit"]');
        
        const formData = {
            action: 'create_role_with_preset',
            role_name: $('#role_name').val().toLowerCase().replace(/[^a-z0-9_-]/g, ''),
            display_name: $('#display_name').val(),
            preset: $('#preset_template').val(),
            nonce: departmentRoleEnhanced.nonce
        };
        
        // Validation
        if (!formData.role_name || !formData.display_name) {
            showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
            return;
        }
        
        $submitBtn.prop('disabled', true).addClass('loading');
        
        $.ajax({
            url: departmentRoleEnhanced.ajaxurl,
            type: 'POST',
            data: formData,
            success: function(response) {
                if (response.success) {
                    showToast(response.data.message, 'success');
                    $form[0].reset();
                    // Switch to manage tab
                    $('.tab-button[data-tab="manage"]').click();
                } else {
                    showToast(response.data.message, 'error');
                }
            },
            error: function() {
                showToast(departmentRoleEnhanced.messages.generalError, 'error');
            },
            complete: function() {
                $submitBtn.prop('disabled', false).removeClass('loading');
            }
        });
    }
    
    /**
     * Load roles table
     */
    function loadRolesTable() {
        const $wrapper = $('.roles-table-wrapper');
        
        $wrapper.html('<div class="loading-indicator">กำลังโหลดข้อมูล...</div>');
        
        $.ajax({
            url: departmentRoleEnhanced.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_roles_table',
                nonce: departmentRoleEnhanced.nonce
            },
            success: function(response) {
                if (response.success) {
                    $wrapper.html(response.data.html);
                    initTableEvents();
                } else {
                    $wrapper.html('<div class="error-message">' + response.data.message + '</div>');
                }
            },
            error: function() {
                $wrapper.html('<div class="error-message">' + departmentRoleEnhanced.messages.generalError + '</div>');
            }
        });
    }
    
    /**
     * Initialize table events
     */
    function initTableEvents() {
        // Edit capabilities button
        $('.edit-capabilities-btn').on('click', function() {
            currentRole = $(this).data('role');
            openCapabilitiesModal(currentRole);
        });
        
        // Delete role button
        $('.delete-role-btn').on('click', function() {
            const role = $(this).data('role');
            deleteRole(role);
        });
        
        // View users button
        $('.view-users-btn').on('click', function() {
            const role = $(this).data('role');
            viewRoleUsers(role);
        });
    }
    
    /**
     * Open capabilities modal
     */
    function openCapabilitiesModal(role) {
        const $modal = $('#edit-capabilities-modal');
        const $modalBody = $modal.find('.modal-body');
        
        $modalBody.html('<div class="loading-indicator">กำลังโหลดข้อมูลสิทธิ์...</div>');
        $modal.attr('aria-hidden', 'false').addClass('modal-visible');
        
        $.ajax({
            url: departmentRoleEnhanced.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_role_all_capabilities',
                role: role,
                nonce: departmentRoleEnhanced.nonce
            },
            success: function(response) {
                if (response.success) {
                    renderCapabilitiesForm(response.data);
                } else {
                    $modalBody.html('<div class="error-message">' + response.data.message + '</div>');
                    showToast(response.data.message, 'error');
                }
            },
            error: function() {
                $modalBody.html('<div class="error-message">' + departmentRoleEnhanced.messages.generalError + '</div>');
                showToast(departmentRoleEnhanced.messages.generalError, 'error');
            }
        });
    }
    
    /**
     * Render capabilities form
     */
    function renderCapabilitiesForm(data) {
        let html = `
            <form id="capabilities-form" data-role="${data.role_name}">
                <div class="form-header">
                    <h3>${data.display_name}</h3>
                    <div class="form-controls">
                        <input type="text" 
                               id="capability-search" 
                               placeholder="${departmentRoleEnhanced.messages.searchPlaceholder}"
                               class="search-input">
                        <select id="preset-selector" class="preset-select">
                            <option value="">-- เลือกเทมเพลต --</option>
                            ${Object.entries(departmentRoleEnhanced.presetTemplates).map(([key, preset]) => 
                                `<option value="${key}">${preset.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="capabilities-tabs">
                    <button type="button" class="cap-tab active" data-tab="core">
                        <span class="dashicons dashicons-wordpress"></span> WordPress Core
                    </button>
                    <button type="button" class="cap-tab" data-tab="posttypes">
                        <span class="dashicons dashicons-admin-post"></span> Post Types
                    </button>
                    <button type="button" class="cap-tab" data-tab="taxonomies">
                        <span class="dashicons dashicons-category"></span> Taxonomies
                    </button>
                </div>
                
                <div class="cap-tab-content" id="core-content">
                    ${renderCoreCapabilities(data)}
                </div>
                
                <div class="cap-tab-content" id="posttypes-content" style="display:none;">
                    ${renderPostTypeCapabilities(data)}
                </div>
                
                <div class="cap-tab-content" id="taxonomies-content" style="display:none;">
                    ${renderTaxonomyCapabilities(data)}
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="button-primary">
                        <span class="dashicons dashicons-saved"></span> บันทึกการเปลี่ยนแปลง
                    </button>
                    <button type="button" class="button-secondary reset-caps">
                        <span class="dashicons dashicons-backup"></span> รีเซ็ตสิทธิ์
                    </button>
                    <button type="button" class="button-link close-modal">ยกเลิก</button>
                </div>
            </form>
        `;
        
        $('#edit-capabilities-modal .modal-body').html(html);
        initCapabilityEvents();
    }
    
    /**
     * Render core capabilities
     */
    function renderCoreCapabilities(data) {
        let html = '<div class="capabilities-grid">';
        
        Object.entries(departmentRoleEnhanced.capabilityGroups).forEach(([groupKey, group]) => {
            html += `
                <div class="capability-group" data-group="${groupKey}">
                    <div class="group-header">
                        <span class="${group.icon}"></span>
                        <h4>${group.label}</h4>
                        <label class="select-all-label">
                            <input type="checkbox" class="select-all-group" data-group="${groupKey}">
                            <span>เลือกทั้งหมด</span>
                        </label>
                    </div>
                    <div class="group-capabilities">
            `;
            
            Object.entries(group.capabilities).forEach(([cap, label]) => {
                const isChecked = data.capabilities[cap] ? 'checked' : '';
                const isImportant = ['read', 'manage_options', 'edit_posts'].includes(cap) ? 'important' : '';
                
                html += `
                    <label class="capability-item ${isImportant}" data-cap="${cap}">
                        <input type="checkbox" 
                               name="capabilities[${cap}]" 
                               value="true" 
                               ${isChecked}
                               ${cap === 'read' ? 'disabled' : ''}>
                        <span class="cap-label">${label}</span>
                        ${cap === 'read' ? '<small>(จำเป็น)</small>' : ''}
                    </label>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    /**
     * Render post type capabilities
     */
    function renderPostTypeCapabilities(data) {
        let html = '<div class="post-types-grid">';
        
        Object.entries(data.post_types).forEach(([postType, ptData]) => {
            html += `
                <div class="post-type-group" data-posttype="${postType}">
                    <div class="group-header">
                        <h4>${ptData.label}</h4>
                        <label class="select-all-label">
                            <input type="checkbox" class="select-all-posttype" data-posttype="${postType}">
                            <span>เลือกทั้งหมด</span>
                        </label>
                    </div>
                    <div class="pt-capabilities">
            `;
            
            const capLabels = {
                'read': 'อ่าน',
                'create': 'สร้าง',
                'edit': 'แก้ไข',
                'edit_others': 'แก้ไขของผู้อื่น',
                'edit_published': 'แก้ไขที่เผยแพร่แล้ว',
                'edit_private': 'แก้ไขส่วนตัว',
                'publish': 'เผยแพร่',
                'delete': 'ลบ',
                'delete_others': 'ลบของผู้อื่น',
                'delete_published': 'ลบที่เผยแพร่แล้ว',
                'delete_private': 'ลบส่วนตัว',
                'read_private': 'อ่านส่วนตัว'
            };
            
            Object.entries(capLabels).forEach(([capType, label]) => {
                const isChecked = ptData.capabilities[capType] ? 'checked' : '';
                const capName = `${capType}_${ptData.cap_type}`;
                
                html += `
                    <label class="capability-item pt-cap" data-cap="${capName}">
                        <input type="checkbox" 
                               name="capabilities[${capName}]" 
                               value="true" 
                               ${isChecked}>
                        <span class="cap-label">${label}</span>
                    </label>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    /**
     * Render taxonomy capabilities
     */
    function renderTaxonomyCapabilities(data) {
        let html = '<div class="taxonomies-grid">';
        
        Object.entries(data.taxonomies).forEach(([taxonomy, taxData]) => {
            html += `
                <div class="taxonomy-group" data-taxonomy="${taxonomy}">
                    <div class="group-header">
                        <h4>${taxData.label}</h4>
                        <label class="select-all-label">
                            <input type="checkbox" class="select-all-taxonomy" data-taxonomy="${taxonomy}">
                            <span>เลือกทั้งหมด</span>
                        </label>
                    </div>
                    <div class="tax-capabilities">
            `;
            
            const capLabels = {
                'manage': 'จัดการ',
                'edit': 'แก้ไข',
                'delete': 'ลบ',
                'assign': 'กำหนด'
            };
            
            Object.entries(capLabels).forEach(([capType, label]) => {
                const isChecked = taxData.capabilities[capType] ? 'checked' : '';
                const capName = `${capType}_${taxonomy}`;
                
                html += `
                    <label class="capability-item tax-cap" data-cap="${capName}">
                        <input type="checkbox" 
                               name="capabilities[${capName}]" 
                               value="true" 
                               ${isChecked}>
                        <span class="cap-label">${label}</span>
                    </label>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    /**
     * Initialize capability events
     */
    function initCapabilityEvents() {
        // Tab switching
        $('.cap-tab').on('click', function() {
            const tab = $(this).data('tab');
            $('.cap-tab').removeClass('active');
            $(this).addClass('active');
            $('.cap-tab-content').hide();
            $(`#${tab}-content`).fadeIn();
        });
        
        // Search capabilities
        $('#capability-search').on('input', function() {
            clearTimeout(searchTimeout);
            const query = $(this).val().toLowerCase();
            
            searchTimeout = setTimeout(() => {
                searchCapabilities(query);
            }, 300);
        });
        
        // Preset selector
        $('#preset-selector').on('change', function() {
            const preset = $(this).val();
            if (preset) {
                applyPresetTemplate(preset);
            }
        });
        
        // Select all checkboxes
        $('.select-all-group').on('change', function() {
            const group = $(this).data('group');
            const isChecked = $(this).is(':checked');
            $(`.capability-group[data-group="${group}"] input[type="checkbox"]:not(:disabled)`).prop('checked', isChecked);
        });
        
        $('.select-all-posttype').on('change', function() {
            const postType = $(this).data('posttype');
            const isChecked = $(this).is(':checked');
            $(`.post-type-group[data-posttype="${postType}"] input[type="checkbox"]`).prop('checked', isChecked);
        });
        
        $('.select-all-taxonomy').on('change', function() {
            const taxonomy = $(this).data('taxonomy');
            const isChecked = $(this).is(':checked');
            $(`.taxonomy-group[data-taxonomy="${taxonomy}"] input[type="checkbox"]`).prop('checked', isChecked);
        });
        
        // Related capabilities
        $('input[name*="[edit_"], input[name*="[delete_"], input[name*="[publish_"]').on('change', function() {
            if ($(this).is(':checked')) {
                const capName = $(this).attr('name');
                const readCap = capName.replace(/\[(edit_|delete_|publish_)/, '[read_');
                $(`input[name="${readCap}"]`).prop('checked', true);
            }
        });
        
        // Form submit
        $('#capabilities-form').on('submit', saveCapabilities);
        
        // Reset capabilities
        $('.reset-caps').on('click', function() {
            if (confirm(departmentRoleEnhanced.messages.confirmReset)) {
                $('input[type="checkbox"]:not(:disabled)').prop('checked', false);
                $('input[name="capabilities[read]"]').prop('checked', true);
            }
        });
        
        // Close modal
        $('.close-modal').on('click', closeModal);
    }
    
    /**
     * Search capabilities
     */
    function searchCapabilities(query) {
        if (!query) {
            $('.capability-item').show();
            $('.capability-group, .post-type-group, .taxonomy-group').show();
            return;
        }
        
        $('.capability-item').each(function() {
            const $item = $(this);
            const label = $item.find('.cap-label').text().toLowerCase();
            const cap = $item.data('cap').toLowerCase();
            
            if (label.includes(query) || cap.includes(query)) {
                $item.show();
            } else {
                $item.hide();
            }
        });
        
        // Hide empty groups
        $('.capability-group, .post-type-group, .taxonomy-group').each(function() {
            const $group = $(this);
            const visibleItems = $group.find('.capability-item:visible').length;
            
            if (visibleItems === 0) {
                $group.hide();
            } else {
                $group.show();
            }
        });
    }
    
    /**
     * Apply preset template
     */
    function applyPresetTemplate(preset) {
        $.ajax({
            url: departmentRoleEnhanced.ajaxurl,
            type: 'POST',
            data: {
                action: 'apply_preset_template',
                preset: preset,
                nonce: departmentRoleEnhanced.nonce
            },
            success: function(response) {
                if (response.success) {
                    // Uncheck all first
                    $('input[type="checkbox"]:not(:disabled)').prop('checked', false);
                    
                    // Check preset capabilities
                    response.data.capabilities.forEach(cap => {
                        $(`input[name="capabilities[${cap}]"]`).prop('checked', true);
                    });
                    
                    showToast(response.data.message, 'success');
                }
            }
        });
    }
    
    /**
     * Save capabilities
     */
    function saveCapabilities(e) {
        e.preventDefault();
        
        const $form = $(this);
        const $submitBtn = $form.find('button[type="submit"]');
        const role = $form.data('role');
        
        // Collect all capabilities
        const capabilities = {};
        $form.find('input[type="checkbox"][name^="capabilities"]').each(function() {
            const cap = $(this).attr('name').match(/\[(.+)\]/)[1];
            capabilities[cap] = $(this).is(':checked');
        });
        
        $submitBtn.prop('disabled', true).addClass('loading');
        
        $.ajax({
            url: departmentRoleEnhanced.ajaxurl,
            type: 'POST',
            data: {
                action: 'update_role_capabilities_complete',
                role: role,
                capabilities: capabilities,
                nonce: departmentRoleEnhanced.nonce
            },
            success: function(response) {
                if (response.success) {
                    showToast(response.data.message, 'success');
                    setTimeout(() => {
                        closeModal();
                        loadRolesTable();
                    }, 1000);
                } else {
                    showToast(response.data.message, 'error');
                }
            },
            error: function() {
                showToast(departmentRoleEnhanced.messages.generalError, 'error');
            },
            complete: function() {
                $submitBtn.prop('disabled', false).removeClass('loading');
            }
        });
    }
    
    /**
     * Delete role
     */
    function deleteRole(role) {
        if (!confirm(departmentRoleEnhanced.messages.confirmDelete)) {
            return;
        }
        
        // Show reassign dialog
        const reassignRole = prompt('กำหนดบทบาทใหม่สำหรับผู้ใช้ในบทบาทนี้ (เช่น subscriber):', 'subscriber');
        
        if (!reassignRole) {
            return;
        }
        
        $.ajax({
            url: departmentRoleEnhanced.ajaxurl,
            type: 'POST',
            data: {
                action: 'delete_role_with_reassign',
                role: role,
                reassign_role: reassignRole,
                nonce: departmentRoleEnhanced.nonce
            },
            success: function(response) {
                if (response.success) {
                    showToast(response.data.message, 'success');
                    loadRolesTable();
                } else {
                    showToast(response.data.message, 'error');
                }
            },
            error: function() {
                showToast(departmentRoleEnhanced.messages.generalError, 'error');
            }
        });
    }
    
    /**
     * View role users
     */
    function viewRoleUsers(role) {
        // Create a simple modal for users
        const $modal = $('<div class="modal-enhanced modal-visible">').html(`
            <div class="modal-content-enhanced modal-small">
                <div class="modal-header">
                    <h2>ผู้ใช้ในบทบาท: ${role}</h2>
                    <button type="button" class="modal-close">
                        <span class="dashicons dashicons-no"></span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="loading-indicator">กำลังโหลดข้อมูล...</div>
                </div>
            </div>
        `);
        
        $('body').append($modal);
        
        // Close event
        $modal.on('click', '.modal-close, .modal-enhanced', function(e) {
            if (e.target === this || $(e.target).hasClass('modal-close') || $(e.target).parent().hasClass('modal-close')) {
                $modal.remove();
            }
        });
        
        $.ajax({
            url: departmentRoleEnhanced.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_users_by_role',
                role: role,
                nonce: departmentRoleEnhanced.nonce
            },
            success: function(response) {
                if (response.success) {
                    $modal.find('.modal-body').html(response.data.html);
                } else {
                    $modal.find('.modal-body').html('<div class="error-message">' + response.data.message + '</div>');
                }
            },
            error: function() {
                $modal.find('.modal-body').html('<div class="error-message">' + departmentRoleEnhanced.messages.generalError + '</div>');
            }
        });
    }
    
    /**
     * Show preset info
     */
    function showPresetInfo(preset) {
        const presetData = departmentRoleEnhanced.presetTemplates[preset];
        if (presetData) {
            const info = `<div class="preset-info">
                <p><strong>${presetData.label}</strong></p>
                <p>${presetData.description}</p>
            </div>`;
            
            if (!$('.preset-info').length) {
                $('#preset_template').after(info);
            } else {
                $('.preset-info').replaceWith(info);
            }
        }
    }
    
    /**
     * Close modal
     */
    function closeModal() {
        $('.modal-enhanced').attr('aria-hidden', 'true').removeClass('modal-visible');
        setTimeout(() => {
            $('.modal-body').empty();
        }, 300);
    }
    
    /**
     * Show toast notification
     */
    function showToast(message, type = 'success') {
        const $toast = $('<div class="toast-notification">').addClass(`toast-${type}`).text(message);
        
        $('body').append($toast);
        
        setTimeout(() => {
            $toast.addClass('toast-show');
        }, 100);
        
        setTimeout(() => {
            $toast.removeClass('toast-show');
            setTimeout(() => {
                $toast.remove();
            }, 300);
        }, 3000);
    }
});