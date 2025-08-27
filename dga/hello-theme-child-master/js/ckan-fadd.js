/**
 * CKAN Form Add JavaScript - Complete Version
 * File: /wp-content/themes/your-child-theme/js/ckan-fadd.js
 * Version: 1.0.4
 */

(function($) {
    'use strict';
    
    // Initialize when document is ready
    $(document).ready(function() {
        // Show skeleton loader initially
        $('.ckan-fadd-form-content').hide();
        $('.ckan-fadd-form-skeleton').show();
        
        // Initialize form after loading
        setTimeout(function() {
            $('.ckan-fadd-form-skeleton').hide();
            $('.ckan-fadd-form-content').fadeIn(300);
            
            // Initialize all components
            initSelect2();
            initThaiDatepicker();
            initCharacterCounters();
            initOtherFieldHandlers();
            initTooltips();
            initFieldHandlers();
        }, 800);
        
        // Form submission handler
        $('#ckan-fadd-form').on('submit', handleFormSubmit);
    });
    
    /**
     * Handle form submission
     */
    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            showStatus('กรุณากรอกข้อมูลให้ครบถ้วนและตรวจสอบจำนวนตัวอักษร', 'error');
            return false;
        }
        
        // Show loading state
        const submitBtn = $('.ckan-fadd-submit-btn');
        const originalText = submitBtn.text();
        submitBtn.prop('disabled', true).text('กำลังบันทึกข้อมูล...');
        
        // Gather all form data
        const formData = collectFormData();
        
        // Debug log
        console.log('Sending form data:', formData);
        
        // Send AJAX request
        $.ajax({
            url: ckan_fadd_ajax.ajax_url,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'ckan_fadd_submit',
                nonce: ckan_fadd_ajax.nonce,
                form_data: formData
            },
            success: function(response) {
                console.log('Server response:', response);
                
                if (response.success) {
                    showStatus(response.data.message || 'ข้อมูลถูกบันทึกเรียบร้อยแล้ว', 'success');
                    resetForm();
                    
                    // Redirect after 2 seconds
                    if (response.data.post_url) {
                        setTimeout(function() {
                            window.location.href = response.data.post_url;
                        }, 2000);
                    }
                } else {
                    showStatus(response.data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX error:', status, error);
                console.error('Response:', xhr.responseText);
                showStatus('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง', 'error');
            },
            complete: function() {
                submitBtn.prop('disabled', false).text(originalText);
            }
        });
    }
    
    /**
     * Collect all form data
     */
    function collectFormData() {
        const formData = {};
        
        // Mandatory Metadata (14 fields)
        formData.data_type = $('#data_type').val() || '';
        formData.title = $('#title').val() || '';
        formData.org_id = $('#org_id').val() || '';
        formData.org_standard_name = $('#org_standard_name').val() || '';
        formData.maintainer = $('#maintainer').val() || '';
        formData.maintainer_email = $('#maintainer_email').val() || '';
        formData.tag_string = $('#tag_string').val() || '';
        formData.notes = $('#notes').val() || '';
        formData.objective = $('#objective').val() || '';
        formData.update_frequency_unit = $('#update_frequency_unit').val() || '';
        formData.update_frequency_interval = $('#update_frequency_interval').val() || '1';
        formData.geo_coverage = $('#geo_coverage').val() || '';
        formData.data_source = $('#data_source').val() || '';
        formData.license_id = $('#license_id').val() || '';
        
        // Multiple select fields - ensure arrays
        formData.data_format = $('#data_format').val() || [];
        formData.data_category = $('#data_category').val() || [];
        formData.dataset_type = $('#dataset_type').val() || [];
        
        // Optional Metadata
        formData.data_classification = $('#data_classification').val() || '';
        formData.accessible_condition = $('#accessible_condition').val() || '';
        formData.created_date = $('#created_date').val() || '';
        formData.last_updated_date = $('#last_updated_date').val() || '';
        formData.url = $('#url').val() || '';
        formData.data_support = $('#data_support').val() || '';
        formData.data_collect = $('#data_collect').val() || '';
        formData.data_language = $('#data_language').val() || '';
        
        // Admin-only fields (only if not disabled)
        if (!$('#high_value_dataset').prop('disabled')) {
            formData.high_value_dataset = $('#high_value_dataset').val() || '';
        }
        if (!$('#reference_data').prop('disabled')) {
            formData.reference_data = $('#reference_data').val() || '';
        }
        if (!$('#official_statistics').prop('disabled')) {
            formData.official_statistics = $('#official_statistics').val() || '';
        }
        
        // "อื่น ๆ" fields
        if ($('#data_type').val() === '9') {
            formData.data_type_other = $('input[name="data_type_other"]').val() || '';
        }
        if ($('#objective').val() === '99') {
            formData.objective_other = $('input[name="objective_other"]').val() || '';
        }
        if ($('#update_frequency_unit').val() === 'X') {
            formData.update_frequency_unit_other = $('input[name="update_frequency_unit_other"]').val() || '';
        }
        if ($('#geo_coverage').val() === '99') {
            formData.geo_coverage_other = $('input[name="geo_coverage_other"]').val() || '';
        }
        if ($('#data_support').val() === '9') {
            formData.data_support_other = $('input[name="data_support_other"]').val() || '';
        }
        if ($('#data_collect').val() === '99') {
            formData.data_collect_other = $('input[name="data_collect_other"]').val() || '';
        }
        if ($('#data_language').val() === '99') {
            formData.data_language_other = $('input[name="data_language_other"]').val() || '';
        }
        
        return formData;
    }
    
    /**
     * Initialize Select2 for multiple select fields
     */
    function initSelect2() {
        if ($.fn.select2) {
            $('.ckan-select2').select2({
                placeholder: "เลือกรายการ...",
                allowClear: true,
                width: '100%',
                language: {
                    noResults: function() {
                        return "ไม่พบข้อมูล";
                    },
                    searching: function() {
                        return "กำลังค้นหา...";
                    },
                    removeAllItems: function() {
                        return "ลบทั้งหมด";
                    }
                }
            });
        }
    }
    
    /**
     * Initialize Thai Buddhist Era datepicker
     */
    function initThaiDatepicker() {
        if ($.datepicker) {
            $.datepicker.regional['th'] = {
                closeText: 'ปิด',
                prevText: 'ก่อนหน้า',
                nextText: 'ถัดไป',
                currentText: 'วันนี้',
                monthNames: ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                            'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'],
                monthNamesShort: ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
                                  'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'],
                dayNames: ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'],
                dayNamesShort: ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'],
                dayNamesMin: ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'],
                weekHeader: 'สัปดาห์',
                dateFormat: 'dd/mm/yy',
                firstDay: 0,
                isRTL: false,
                showMonthAfterYear: false,
                yearSuffix: ''
            };
            
            $.datepicker.setDefaults($.datepicker.regional['th']);
            
            $('.thai-datepicker').datepicker({
                changeMonth: true,
                changeYear: true,
                dateFormat: 'dd/mm/yy',
                yearRange: '1900:+0',
                beforeShow: function() {
                    setTimeout(function(){
                        $('.ui-datepicker').css('z-index', 99999);
                    }, 0);
                },
                onSelect: function(dateText, inst) {
                    const parts = dateText.split('/');
                    const day = parts[0];
                    const month = parts[1];
                    const year = parseInt(parts[2]) + 543;
                    $(this).val(day + '/' + month + '/' + year);
                }
            });
            
            // Set current date as default
            const today = new Date();
            const day = today.getDate().toString().padStart(2, '0');
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const year = today.getFullYear() + 543;
            const thaiDate = day + '/' + month + '/' + year;
            
            $('#created_date').val(thaiDate);
            $('#last_updated_date').val(thaiDate);
        }
    }
    
    /**
     * Initialize character counters
     */
    function initCharacterCounters() {
        const fieldsWithLimits = [
            'title', 'org_standard_name', 'maintainer', 
            'maintainer_email', 'tag_string', 'notes', 'data_source'
        ];
        
        fieldsWithLimits.forEach(function(fieldId) {
            const field = $('#' + fieldId);
            const counter = $('#' + fieldId + '_count');
            
            if (field.length && counter.length) {
                field.on('input', function() {
                    const currentLength = $(this).val().length;
                    const maxLength = $(this).attr('maxlength');
                    counter.text(currentLength);
                    
                    if (currentLength >= maxLength * 0.9) {
                        counter.parent().addClass('warning');
                    } else {
                        counter.parent().removeClass('warning');
                    }
                });
                
                counter.text(field.val().length);
            }
        });
    }
    
    /**
     * Initialize handlers for "อื่น ๆ" fields
     */
    function initOtherFieldHandlers() {
        const otherFieldMappings = {
            'data_type': { otherValue: '9', otherFieldId: 'data_type_other' },
            'objective': { otherValue: '99', otherFieldId: 'objective_other' },
            'update_frequency_unit': { otherValue: 'X', otherFieldId: 'update_frequency_unit_other' },
            'geo_coverage': { otherValue: '99', otherFieldId: 'geo_coverage_other' },
            'data_support': { otherValue: '9', otherFieldId: 'data_support_other' },
            'data_collect': { otherValue: '99', otherFieldId: 'data_collect_other' },
            'data_language': { otherValue: '99', otherFieldId: 'data_language_other' }
        };
        
        Object.keys(otherFieldMappings).forEach(function(fieldId) {
            const mapping = otherFieldMappings[fieldId];
            const selectField = $('#' + fieldId);
            const otherField = $('#' + mapping.otherFieldId);
            
            if (selectField.length && otherField.length) {
                selectField.on('change', function() {
                    const selectedValue = $(this).val();
                    
                    if (selectedValue === mapping.otherValue) {
                        otherField.slideDown(300);
                        otherField.find('input').attr('required', true);
                    } else {
                        otherField.slideUp(300);
                        otherField.find('input').removeAttr('required').val('');
                    }
                });
                
                // Initialize on load
                if (selectField.val() === mapping.otherValue) {
                    otherField.show();
                    otherField.find('input').attr('required', true);
                }
            }
        });
    }
    
    /**
     * Initialize additional field handlers
     */
    function initFieldHandlers() {
        // Handle frequency unit change
        $('#update_frequency_unit').on('change', function() {
            const unit = $(this).val();
            const valueField = $('#update_frequency_interval');
            
            if (unit === 'O') {
                valueField.val('0').prop('disabled', true);
            } else {
                valueField.prop('disabled', false);
                if (valueField.val() === '0') {
                    valueField.val('1');
                }
            }
        });
        
        // Handle org_id formatting
        $('#org_id').on('input', function() {
            let value = $(this).val().toUpperCase();
            value = value.replace(/[^0-9A-Z]/g, '');
            $(this).val(value);
        });
        
        // Handle data classification change
        $('#data_classification').on('change', function() {
            const classification = $(this).val();
            const accessCondition = $('#accessible_condition');
            
            accessCondition.empty().append('<option value="">-- เลือกเงื่อนไขการเข้าถึง --</option>');
            
            switch(classification) {
                case 'เปิดเผย':
                    accessCondition.append('<option value="ไม่มีการจำกัดการเข้าถึงข้อมูล">ไม่มีการจำกัดการเข้าถึงข้อมูล</option>');
                    break;
                case 'ชั้นเผยแพร่ภายในองค์กร':
                    accessCondition.append('<option value="เฉพาะบุคคลภายในหน่วยงาน">เฉพาะบุคคลภายในหน่วยงาน</option>');
                    break;
                case 'ลับ':
                    accessCondition.append('<option value="ต้องได้รับอนุมัติจากผู้บริหารระดับผู้ช่วยผู้อำนวยการขึ้นไป">ต้องได้รับอนุมัติจากผู้บริหารระดับผู้ช่วยผู้อำนวยการขึ้นไป</option>');
                    break;
                case 'ลับมาก':
                    accessCondition.append('<option value="ต้องได้รับอนุมัติจากผู้บริหารระดับรองผู้อำนวยการขึ้นไป">ต้องได้รับอนุมัติจากผู้บริหารระดับรองผู้อำนวยการขึ้นไป</option>');
                    break;
                default:
                    accessCondition.append('<option value="ไม่มีการจำกัดการเข้าถึงข้อมูล">ไม่มีการจำกัดการเข้าถึงข้อมูล</option>');
                    accessCondition.append('<option value="เฉพาะบุคคลภายในหน่วยงาน">เฉพาะบุคคลภายในหน่วยงาน</option>');
                    accessCondition.append('<option value="ต้องได้รับอนุมัติจากผู้บริหารระดับผู้ช่วยผู้อำนวยการขึ้นไป">ต้องได้รับอนุมัติจากผู้บริหารระดับผู้ช่วยผู้อำนวยการขึ้นไป</option>');
                    accessCondition.append('<option value="ต้องได้รับอนุมัติจากผู้บริหารระดับรองผู้อำนวยการขึ้นไป">ต้องได้รับอนุมัติจากผู้บริหารระดับรองผู้อำนวยการขึ้นไป</option>');
            }
        });
    }
    
    /**
     * Initialize tooltips
     */
    function initTooltips() {
        $('.tooltip-icon').on('click', function(e) {
            e.preventDefault();
        });
        
        // Optional: Add tooltip library initialization here
    }
    
    /**
     * Validate the form
     */
    function validateForm() {
        let isValid = true;
        
        // Remove all error classes
        $('.ckan-fadd-field').removeClass('error');
        
        // Check required fields
        $('#ckan-fadd-form input[required]:not([disabled]), #ckan-fadd-form textarea[required]:not([disabled]), #ckan-fadd-form select[required]:not([multiple]):not([disabled])').each(function() {
            if ($(this).val() === '' || $(this).val() === null) {
                $(this).closest('.ckan-fadd-field').addClass('error');
                isValid = false;
            }
        });
        
        // Check multiple select fields
        $('#ckan-fadd-form select[multiple][required]:not([disabled])').each(function() {
            if ($(this).val() === null || $(this).val().length === 0) {
                $(this).closest('.ckan-fadd-field').addClass('error');
                isValid = false;
            }
        });
        
        // Validate email
        const emailField = $('#maintainer_email');
        if (emailField.val() !== '' && !isValidEmail(emailField.val())) {
            emailField.closest('.ckan-fadd-field').addClass('error');
            isValid = false;
        }
        
        // Validate URL
        const urlField = $('#url');
        if (urlField.val() !== '' && !isValidUrl(urlField.val())) {
            urlField.closest('.ckan-fadd-field').addClass('error');
            isValid = false;
        }
        
        // Validate org_id
        const orgIdField = $('#org_id');
        if (orgIdField.val() !== '' && !/^[0-9A-Z]{4}$/.test(orgIdField.val())) {
            orgIdField.closest('.ckan-fadd-field').addClass('error');
            isValid = false;
        }
        
        // Validate character limits
        const fieldsWithLimits = {
            'title': 150,
            'org_standard_name': 255,
            'maintainer': 150,
            'maintainer_email': 50,
            'tag_string': 200,
            'notes': 1000,
            'data_source': 200
        };
        
        for (const [fieldId, maxLength] of Object.entries(fieldsWithLimits)) {
            const field = $('#' + fieldId);
            if (field.length && field.val().length > maxLength) {
                field.closest('.ckan-fadd-field').addClass('error');
                isValid = false;
            }
        }
        
        // Validate frequency interval
        const frequencyInterval = $('#update_frequency_interval');
        const frequencyUnit = $('#update_frequency_unit').val();
        
        if (frequencyInterval.val() !== '' && frequencyUnit !== 'O') {
            const intervalValue = parseInt(frequencyInterval.val());
            if (isNaN(intervalValue) || intervalValue < 1) {
                frequencyInterval.closest('.ckan-fadd-field').addClass('error');
                isValid = false;
            }
        }
        
        // Validate "อื่น ๆ" fields
        const otherFieldMappings = {
            'data_type': { otherValue: '9', otherInputName: 'data_type_other' },
            'objective': { otherValue: '99', otherInputName: 'objective_other' },
            'update_frequency_unit': { otherValue: 'X', otherInputName: 'update_frequency_unit_other' },
            'geo_coverage': { otherValue: '99', otherInputName: 'geo_coverage_other' },
            'data_support': { otherValue: '9', otherInputName: 'data_support_other' },
            'data_collect': { otherValue: '99', otherInputName: 'data_collect_other' },
            'data_language': { otherValue: '99', otherInputName: 'data_language_other' }
        };
        
        Object.keys(otherFieldMappings).forEach(function(fieldId) {
            const mapping = otherFieldMappings[fieldId];
            const selectField = $('#' + fieldId);
            const otherInput = $('input[name="' + mapping.otherInputName + '"]');
            
            if (selectField.val() === mapping.otherValue) {
                if (otherInput.val().trim() === '') {
                    otherInput.closest('.ckan-fadd-field').addClass('error');
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }
    
    /**
     * Validate email address
     */
    function isValidEmail(email) {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    }
    
    /**
     * Validate URL
     */
    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    /**
     * Show status message
     */
    function showStatus(message, type) {
        const statusEl = $('.ckan-fadd-status');
        statusEl.removeClass('success error').addClass(type);
        $('.ckan-fadd-status-message').text(message);
        statusEl.show();
        
        // Scroll to message
        $('html, body').animate({
            scrollTop: statusEl.offset().top - 100
        }, 300);
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(function() {
                statusEl.fadeOut(300);
            }, 5000);
        }
    }
    
    /**
     * Reset the form
     */
    function resetForm() {
        $('#ckan-fadd-form')[0].reset();
        $('.ckan-select2').val(null).trigger('change');
        $('.char-counter span').text('0');
        $('.ckan-fadd-other-field').hide();
        $('.ckan-fadd-field').removeClass('error');
    }
    
})(jQuery);