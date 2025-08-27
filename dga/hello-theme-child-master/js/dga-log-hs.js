/**
 * DGA Log History System JavaScript
 */
(function($) {
    'use strict';

    // ฟังก์ชันบันทึกกิจกรรมผ่าน AJAX
    function recordActivity(postId, actionType, fieldName = '', oldValue = '', newValue = '') {
        $.ajax({
            url: dga_log_hs_vars.ajax_url,
            type: 'POST',
            data: {
                action: 'dga_log_hs_record_activity',
                nonce: dga_log_hs_vars.nonce,
                post_id: postId,
                action_type: actionType,
                field_name: fieldName,
                old_value: oldValue,
                new_value: newValue
            },
            success: function(response) {
                console.log('Activity recorded successfully');
            },
            error: function(error) {
                console.error('Error recording activity:', error);
            }
        });
    }

    // บันทึกการดูโพสต์
    function recordPostView() {
        if ($('body').hasClass('single')) {
            var postId = $('article').attr('id').replace('post-', '');
            if (postId) {
                // บันทึกผ่าน AJAX (เสริมจากการบันทึกฝั่ง Server)
                recordActivity(postId, 'view');
            }
        }
    }

    // ติดตามการดาวน์โหลดไฟล์
    function trackDownloads() {
        $(document).on('click', '.dga-download-link', function(e) {
            var $this = $(this);
            var postId = $this.data('post-id');
            var fileName = $this.data('file-name');
            
            if (postId && fileName) {
                recordActivity(postId, 'download', fileName);
            }
        });
    }

    // ติดตามการเปลี่ยนแปลง Custom Fields ที่แสดงบนหน้าเว็บ
    function trackCustomFieldChanges() {
        var trackedFields = [
            'ckan_cdata', 'ckan_gd_agree', 'ckan_org_name', 'ckan_org_mail', 
            'ckan_objective', 'ckan_fr_update', 'ckan_fr_year', 'ckan_area', 
            'ckan_source', 'ckan_cformat', 'ckan_cgov', 'ckan_clicense', 
            'ckan_caccess', 'ckan_url', 'ckan_language', 'ckan_data_create', 
            'ckan_data_update', 'ckan_height_value', 'ckan_ref', 'ckan_create_by', 
            'ckan_auto_createpost', 'ckan_auto_updatepost', 'ckan_asset'
        ];
        
        $(document).on('change', '.dga-editable-field[data-field]', function() {
            var $this = $(this);
            var fieldName = $this.data('field');
            var postId = $this.data('post-id');
            var oldValue = $this.data('original-value');
            var newValue = $this.val();
            
            if (trackedFields.includes(fieldName) && oldValue !== newValue) {
                recordActivity(postId, 'update_field', fieldName, oldValue, newValue);
                $this.data('original-value', newValue);
            }
        });
    }

    // การกรองและการแสดงหน้าประวัติการใช้งาน
    function setupLogFiltering() {
        var $container = $('.dga-log-container');
        
        if ($container.length === 0) {
            return;
        }
        
        var postId = $container.closest('article').attr('id').replace('post-', '');
        var currentPage = 1;
        var totalPages = 1;
        
        // ฟังก์ชันโหลดข้อมูลประวัติการใช้งาน
        function loadLogs(page, filterAction, filterDate) {
            $.ajax({
                url: dga_log_hs_vars.ajax_url,
                type: 'POST',
                data: {
                    action: 'dga_log_hs_get_logs',
                    nonce: dga_log_hs_vars.nonce,
                    post_id: postId,
                    page: page,
                    limit: 20,
                    filter_action: filterAction,
                    filter_date: filterDate
                },
                beforeSend: function() {
                    $container.addClass('loading');
                },
                success: function(response) {
                    if (response.success) {
                        $container.find('.dga-log-table tbody').html(response.data.html);
                        totalPages = response.data.total_pages;
                        currentPage = response.data.current_page;
                        
                        // อัพเดตปุ่มเพจจิเนชัน
                        $('.dga-log-prev').prop('disabled', currentPage <= 1);
                        $('.dga-log-next').prop('disabled', currentPage >= totalPages);
                        
                        // อัพเดตข้อมูลหน้า
                        $('#dga-log-current-page').text(currentPage);
                        $('#dga-log-total-pages').text(totalPages);
                    } else {
                        alert(response.data.message);
                    }
                },
                error: function(error) {
                    console.error('Error loading logs:', error);
                },
                complete: function() {
                    $container.removeClass('loading');
                }
            });
        }
        
        // การกรองข้อมูล
        $('#dga-log-filter-button').on('click', function() {
            var filterAction = $('#dga-log-filter-action').val();
            var filterDate = $('#dga-log-filter-date').val();
            
            loadLogs(1, filterAction, filterDate);
        });
        
        // การเปลี่ยนหน้า
        $('.dga-log-prev').on('click', function() {
            if (currentPage > 1) {
                var filterAction = $('#dga-log-filter-action').val();
                var filterDate = $('#dga-log-filter-date').val();
                
                loadLogs(currentPage - 1, filterAction, filterDate);
            }
        });
        
        $('.dga-log-next').on('click', function() {
            if (currentPage < totalPages) {
                var filterAction = $('#dga-log-filter-action').val();
                var filterDate = $('#dga-log-filter-date').val();
                
                loadLogs(currentPage + 1, filterAction, filterDate);
            }
        });
        
        // การส่งออก CSV
        $('#dga-log-export-csv').on('click', function() {
            var filterAction = $('#dga-log-filter-action').val();
            var filterDate = $('#dga-log-filter-date').val();
            var postId = $(this).data('post-id');
            
            $.ajax({
                url: dga_log_hs_vars.ajax_url,
                type: 'POST',
                data: {
                    action: 'dga_log_hs_export_csv',
                    nonce: dga_log_hs_vars.nonce,
                    post_id: postId,
                    filter_action: filterAction,
                    filter_date: filterDate
                },
                beforeSend: function() {
                    $container.addClass('loading');
                },
                success: function(response) {
                    if (response.success) {
                        // สร้างไฟล์ CSV และดาวน์โหลด
                        var blob = new Blob([response.data.content], { type: 'text/csv;charset=utf-8;' });
                        var link = document.createElement('a');
                        
                        if (navigator.msSaveBlob) { // IE 10+
                            navigator.msSaveBlob(blob, response.data.filename);
                        } else {
                            var url = URL.createObjectURL(blob);
                            link.href = url;
                            link.download = response.data.filename;
                            link.style.visibility = 'hidden';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                        
                        // บันทึกกิจกรรมการดาวน์โหลด CSV
                        recordActivity(postId, 'download', 'activity_log_csv');
                    } else {
                        alert(response.data.message);
                    }
                },
                error: function(error) {
                    console.error('Error exporting CSV:', error);
                },
                complete: function() {
                    $container.removeClass('loading');
                }
            });
        });
    }

    // เริ่มต้นการทำงานเมื่อเอกสารโหลดเสร็จ
    $(document).ready(function() {
        recordPostView();
        trackDownloads();
        trackCustomFieldChanges();
        setupLogFiltering();
    });

})(jQuery);