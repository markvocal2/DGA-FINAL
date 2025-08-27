/**
 * Enhanced Template Importer JavaScript
 * รองรับ Floating Button และ Slide-in Modal
 */
jQuery(document).ready(function($) {
    // ===============================
    // 1. Floating Button & Modal
    // ===============================
    // ฟังก์ชันปรับตำแหน่งปุ่ม Floating
    function updateFloatingButtonPosition() {
        var windowHeight = $(window).height();
        var scrollTop = $(window).scrollTop();
        var buttonTop = windowHeight / 2 + scrollTop;
        
        $('.template-floating-button').css('top', buttonTop + 'px');
    }
    
    // ปรับตำแหน่งปุ่มเมื่อโหลดหน้า
    updateFloatingButtonPosition();
    
    // ปรับตำแหน่งปุ่มเมื่อ scroll
    $(window).on('scroll resize', function() {
        updateFloatingButtonPosition();
    });


    // Let's add a new robust event handler
    $(document).on('click', '.template-floating-button button', function() {
        var modal = $('#template-floating-modal');
        
        // Force show the modal
        modal.addClass('active');
        
        // Add body class to prevent scrolling
        $('body').addClass('template-modal-open');
        
        // Log successful click for debugging
        console.log('Template modal button clicked, attempting to display modal');
        
        // Only fetch content if not already loaded
        if (modal.find('.template-modal-body .templates-grid').length === 0) {
            // Show loading indicator
            modal.find('.template-modal-body').html('<div class="template-modal-loading"><i class="fas fa-spinner fa-spin"></i> กำลังโหลด Template...</div>');
            
            // Fetch gallery content via AJAX
            $.ajax({
                url: template_importer_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'get_template_gallery_html',
                    nonce: template_importer_ajax.nonce
                },
                success: function(response) {
                    if (response.success) {
                        console.log('AJAX success: Gallery HTML loaded');
                        modal.find('.template-modal-body').html(response.data.html);
                        
                        // Select first category tab
                        setTimeout(function() {
                            modal.find('.template-category:first').trigger('click');
                        }, 100);
                    } else {
                        console.error('AJAX error:', response.data);
                        modal.find('.template-modal-body').html('<p>เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + response.data + '</p>');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('AJAX request failed:', error);
                    modal.find('.template-modal-body').html('<p>เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์</p>');
                }
            });
        }
    });
    
    // Make sure the close button works properly
    $(document).on('click', '.template-modal-close, .template-modal-overlay', function() {
        $('.template-modal-container').removeClass('active');
        $('body').removeClass('template-modal-open');
    });

    
    // เมื่อคลิกปุ่ม Floating Button
    $('.template-floating-button button').on('click', function() {
        var modal = $('#template-floating-modal');
        
        // แสดง Modal
        modal.addClass('active');
        
        // ป้องกันการเลื่อนหน้าจอ
        $('body').addClass('template-modal-open');
        
        // โหลด Gallery HTML ถ้ายังไม่มี
        if (modal.find('.template-modal-body .templates-grid').length === 0) {
            $.ajax({
                url: template_importer_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'get_template_gallery_html',
                    nonce: template_importer_ajax.nonce
                },
                success: function(response) {
                    if (response.success) {
                        modal.find('.template-modal-body').html(response.data.html);
                        
                        // เลือก Tab แรก
                        setTimeout(function() {
                            modal.find('.template-category:first').click();
                        }, 100);
                    } else {
                        modal.find('.template-modal-body').html('<p>เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + response.data + '</p>');
                    }
                },
                error: function() {
                    modal.find('.template-modal-body').html('<p>เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์</p>');
                }
            });
        }
    });
    
    // ปิด Modal
    $(document).on('click', '.template-modal-close, .template-modal-overlay', function() {
        $('.template-modal-container').removeClass('active');
        $('body').removeClass('template-modal-open');
    });
    
    // ป้องกันการปิด Modal เมื่อคลิกที่เนื้อหา
    $(document).on('click', '.template-modal-content', function(e) {
        e.stopPropagation();
    });
    
    // ปิด Modal เมื่อกด ESC
    $(document).keydown(function(e) {
        if (e.keyCode === 27 && $('.template-modal-container.active').length > 0) {
            $('.template-modal-container').removeClass('active');
            $('body').removeClass('template-modal-open');
        }
    });
    
    // ===============================
    // 2. Tab Gallery Toggle
    // ===============================
    $(document).on('click', '.template-gallery-toggle', function() {
        $(this).toggleClass('active');
        $(this).find('i').toggleClass('fa-chevron-down fa-chevron-up');
        $(this).next('.template-gallery-content').slideToggle(300);
    });
    
    // ===============================
    // 3. Category Tabs
    // ===============================
    $(document).on('click', '.template-category', function() {
        const category = $(this).data('category');
        const container = $(this).closest('.template-gallery-content, .template-modal-body');
        
        // Active state for category
        container.find('.template-category').removeClass('active');
        $(this).addClass('active');
        
        // Show templates for the selected category
        container.find('.templates-grid').removeClass('active');
        
        if (category === 'all') {
            container.find('.templates-grid').addClass('active');
        } else {
            container.find(`.templates-grid[data-category="${category}"]`).addClass('active');
        }
    });
    
    // ===============================
    // 4. Template Preview Lightbox
    // ===============================
    $(document).on('click', '.template-preview-button', function(e) {
        e.preventDefault();
        const previewUrl = $(this).data('preview');
        const title = $(this).closest('.template-item').find('.template-title').text();
        
        if (previewUrl) {
            // Create lightbox
            const lightbox = $(`
                <div class="template-lightbox">
                    <div class="template-lightbox-content">
                        <div class="template-lightbox-header">
                            <h3>${title}</h3>
                            <button class="template-lightbox-close"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="template-lightbox-body">
                            <img src="${previewUrl}" alt="${title}">
                        </div>
                    </div>
                </div>
            `);
            
            // Add to body and show
            $('body').append(lightbox);
            setTimeout(function() {
                lightbox.addClass('active');
            }, 10);
            
            // Close button event
            lightbox.find('.template-lightbox-close').on('click', function() {
                lightbox.removeClass('active');
                setTimeout(function() {
                    lightbox.remove();
                }, 300);
            });
            
            // Close on click outside
            lightbox.on('click', function(e) {
                if ($(e.target).hasClass('template-lightbox')) {
                    lightbox.removeClass('active');
                    setTimeout(function() {
                        lightbox.remove();
                    }, 300);
                }
            });
            
            // ปิด Lightbox เมื่อกด ESC
            $(document).keydown(function(e) {
                if (e.keyCode === 27 && $('.template-lightbox.active').length > 0) {
                    $('.template-lightbox').removeClass('active');
                    setTimeout(function() {
                        $('.template-lightbox').remove();
                    }, 300);
                }
            });
        }
    });
    
    // ===============================
    // 5. Template Icon Modal
    // ===============================
    $('.template-icon-button').on('click', function() {
        const modalId = $(this).data('modal-id');
        const modal = $(`#${modalId}`);
        
        // แสดง Modal
        modal.addClass('active');
        
        // ถ้ายังไม่ได้โหลดข้อมูล Gallery ให้โหลด
        if (modal.find('.template-modal-body .templates-grid').length === 0) {
            // ทำ AJAX เพื่อโหลด Gallery HTML
            $.ajax({
                url: template_importer_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'get_template_gallery_html',
                    nonce: template_importer_ajax.nonce
                },
                success: function(response) {
                    if (response.success) {
                        modal.find('.template-modal-body').html(response.data.html);
                        
                        // เลือก Tab แรกโดยค่าเริ่มต้น
                        modal.find('.template-category:first').click();
                    } else {
                        modal.find('.template-modal-body').html('<p>เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + response.data + '</p>');
                    }
                },
                error: function() {
                    modal.find('.template-modal-body').html('<p>เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์</p>');
                }
            });
        }
    });
    
    // ===============================
    // 6. Search Templates
    // ===============================
    $(document).on('keyup', '#template-search', function() {
        const searchTerm = $(this).val().toLowerCase();
        const container = $(this).closest('.template-gallery-content, .template-modal-body');
        
        if (searchTerm.length > 2) {
            container.find('.template-item').each(function() {
                const title = $(this).find('.template-title').text().toLowerCase();
                const description = $(this).find('.template-description').text().toLowerCase();
                const tags = $(this).data('tags') ? $(this).data('tags').toLowerCase() : '';
                
                if (title.includes(searchTerm) || description.includes(searchTerm) || tags.includes(searchTerm)) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
            
            // Show no results message if needed
            container.find('.templates-grid.active').each(function() {
                const visibleItems = $(this).find('.template-item:visible').length;
                
                if (visibleItems === 0) {
                    if ($(this).find('.no-results-message').length === 0) {
                        $(this).append('<p class="no-results-message">ไม่พบ Template ที่ตรงกับคำค้นหา</p>');
                    }
                } else {
                    $(this).find('.no-results-message').remove();
                }
            });
        } else if (searchTerm.length === 0) {
            // Reset search
            container.find('.template-item').show();
            container.find('.no-results-message').remove();
        }
    });
    
    // ===============================
    // 7. Template Import Button
    // ===============================
    $(document).on('click', '.template-import-button', function(e) {
        e.preventDefault();
        
        const templateId = $(this).data('template-id');
        const button = $(this);
        
        // Confirm import
        if (confirm('คุณต้องการนำเข้า Template นี้หรือไม่? การดำเนินการนี้จะแทนที่เนื้อหาเดิมทั้งหมดของหน้านี้')) {
            // แสดง loading
            button.html('<i class="fas fa-spinner fa-spin"></i> กำลังนำเข้า...');
            button.prop('disabled', true);
            
            // ดำเนินการ AJAX
            $.ajax({
                url: template_importer_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'import_json_template',
                    template_id: templateId,
                    nonce: template_importer_ajax.nonce,
                    post_id: template_importer_ajax.post_id
                },
                success: function(response) {
                    if (response.success) {
                        // แสดงข้อความสำเร็จ
                        showNotification('success', 'นำเข้า Template สำเร็จ!');
                        
                        // เปลี่ยนปุ่มเป็นสีเขียวเพื่อแสดงว่านำเข้าสำเร็จ
                        button.html('<i class="fas fa-check"></i> นำเข้าสำเร็จ');
                        button.removeClass('template-import-button').addClass('template-import-success');
                        
                        // ปิด Modal ถ้ากำลังแสดงอยู่
                        setTimeout(function() {
                            $('.template-modal-container').removeClass('active');
                            $('body').removeClass('template-modal-open');
                        }, 1000);
                        
                        // รีโหลดหน้า
                        setTimeout(function() {
                            window.location.reload();
                        }, 1500);
                    } else {
                        showNotification('error', 'เกิดข้อผิดพลาด: ' + response.data);
                        button.html('<i class="fas fa-exclamation-triangle"></i> ล้มเหลว');
                        
                        setTimeout(function() {
                            button.html('นำเข้า Template');
                            button.prop('disabled', false);
                        }, 2000);
                    }
                },
                error: function(xhr, status, error) {
                    showNotification('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
                    console.error(xhr.responseText);
                    
                    button.html('<i class="fas fa-exclamation-triangle"></i> ล้มเหลว');
                    
                    setTimeout(function() {
                        button.html('นำเข้า Template');
                        button.prop('disabled', false);
                    }, 2000);
                }
            });
        }
    });
    
    // ===============================
    // 8. Single Template Import (Legacy Support)
    // ===============================
    $('.single-template-import-button').on('click', function(e) {
        e.preventDefault();
        
        const templateId = $(this).data('template-id');
        const button = $(this);
        
        // แสดง loading
        button.html('<i class="fas fa-spinner fa-spin"></i> กำลังนำเข้า...');
        button.prop('disabled', true);
        
        $.ajax({
            url: template_importer_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'import_json_template',
                template_id: templateId,
                nonce: template_importer_ajax.nonce,
                post_id: template_importer_ajax.post_id
            },
            success: function(response) {
                if (response.success) {
                    // แสดงข้อความสำเร็จ
                    button.html('<i class="fas fa-check"></i> นำเข้าสำเร็จ');
                    alert('นำเข้า Template สำเร็จ! กรุณารีเฟรชหน้าเพื่อดูการเปลี่ยนแปลง');
                    window.location.reload();
                } else {
                    alert('เกิดข้อผิดพลาด: ' + response.data);
                    button.html('นำเข้า Template');
                    button.prop('disabled', false);
                }
            },
            error: function() {
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
                button.html('นำเข้า Template');
                button.prop('disabled', false);
            }
        });
    });
    
    // ===============================
    // 9. Filter Buttons
    // ===============================
    $(document).on('click', '.template-filter-button', function() {
        const filterValue = $(this).data('filter');
        const container = $(this).closest('.template-gallery-content, .template-modal-body');
        
        // Toggle active state
        $(this).toggleClass('active');
        
        // Get all active filters
        const activeFilters = [];
        container.find('.template-filter-button.active').each(function() {
            activeFilters.push($(this).data('filter'));
        });
        
        // Filter templates
        if (activeFilters.length > 0) {
            container.find('.template-item').hide();
            
            for (const filter of activeFilters) {
                container.find(`.template-item[data-tags*="${filter}"]`).show();
            }
        } else {
            // If no filters active, show all
            container.find('.template-item').show();
        }
    });
    
    // ===============================
    // 10. Sort Templates
    // ===============================
    $(document).on('change', '#template-sort', function() {
        const sortValue = $(this).val();
        const container = $(this).closest('.template-gallery-content, .template-modal-body');
        const activeGrid = container.find('.templates-grid.active');
        
        const templates = activeGrid.find('.template-item').get();
        
        templates.sort(function(a, b) {
            if (sortValue === 'name-asc') {
                const nameA = $(a).find('.template-title').text().toUpperCase();
                const nameB = $(b).find('.template-title').text().toUpperCase();
                return nameA.localeCompare(nameB);
            } else if (sortValue === 'name-desc') {
                const nameA = $(a).find('.template-title').text().toUpperCase();
                const nameB = $(b).find('.template-title').text().toUpperCase();
                return nameB.localeCompare(nameA);
            } else if (sortValue === 'date-new') {
                const dateA = $(a).data('date');
                const dateB = $(b).data('date');
                return dateB - dateA;
            } else if (sortValue === 'date-old') {
                const dateA = $(a).data('date');
                const dateB = $(b).data('date');
                return dateA - dateB;
            }
            return 0;
        });
        
        $.each(templates, function(index, item) {
            activeGrid.append(item);
        });
    });
    
    // ===============================
    // 11. Notification System
    // ===============================
    function showNotification(type, message) {
        // ลบการแจ้งเตือนก่อนหน้า
        $('.template-notification').remove();
        
        // สร้างการแจ้งเตือนใหม่
        const notification = $(`
            <div class="template-notification ${type}">
                <div class="template-notification-content">
                    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                    <span>${message}</span>
                </div>
                <button class="template-notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `);
        
        // เพิ่มลงในหน้าเว็บ
        $('body').append(notification);
        
        // แสดงการแจ้งเตือน
        setTimeout(function() {
            notification.addClass('active');
        }, 10);
        
        // ซ่อนการแจ้งเตือนอัตโนมัติ
        setTimeout(function() {
            notification.removeClass('active');
            setTimeout(function() {
                notification.remove();
            }, 300);
        }, 5000);
        
        // ปุ่มปิดการแจ้งเตือน
        notification.find('.template-notification-close').on('click', function() {
            notification.removeClass('active');
            setTimeout(function() {
                notification.remove();
            }, 300);
        });
    }
    
    // ===============================
    // 12. Initialize
    // ===============================
    function initTemplateGallery() {
        // เลือก Tab แรกโดยค่าเริ่มต้น หรือ 'all' ถ้ามี
        $('.template-gallery-content').each(function() {
            if ($(this).find('.template-category[data-category="all"]').length > 0) {
                $(this).find('.template-category[data-category="all"]').click();
            } else {
                $(this).find('.template-category:first').click();
            }
        });
        
        // เพิ่มสีขอบตามหมวดหมู่
        $('.template-item').each(function() {
            const category = $(this).data('category');
            if (category) {
                // เพิ่มคลาสเฉพาะสำหรับหมวดหมู่
                $(this).addClass('template-category-' + category);
            }
        });
    }
    
    // เริ่มต้นระบบ
    initTemplateGallery();
    
    // ปรับตำแหน่งปุ่ม Floating เมื่อโหลดหน้า
    updateFloatingButtonPosition();
});