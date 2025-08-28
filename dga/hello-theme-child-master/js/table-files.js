/**
 * Table Files JavaScript with PDF Preview and Secure Links
 * ปรับปรุงล่าสุด: เพิ่มระบบเข้ารหัสลิงก์และความปลอดภัยสำหรับการแสดงตัวอย่าง PDF
 */
jQuery(document).ready(function($) {
    /**
     * ฟังก์ชันนับและแสดงจำนวนไฟล์ทั้งหมด
     */
    function updateFileCounter() {
        const visibleFiles = $('.table-files tbody tr:visible').length;
        const totalFiles = $('.table-files tbody tr').length;
        
        if (visibleFiles < totalFiles) {
            $('#file-count').text(visibleFiles + ' จาก ' + totalFiles);
        } else {
            $('#file-count').text(totalFiles);
        }
    }
    
    // เรียกใช้ฟังก์ชันนับไฟล์เมื่อโหลดหน้า
    updateFileCounter();

    /**
     * เพิ่มเอฟเฟกต์เมื่อ hover ที่ปุ่มลิงค์ภายนอก
     */
    $('.external-button').hover(
        function() {
            $(this).find('.external-icon').addClass('animate-bounce');
        },
        function() {
            $(this).find('.external-icon').removeClass('animate-bounce');
        }
    );

    /**
     * เพิ่มเอฟเฟกต์เมื่อคลิกที่ปุ่มลิงค์ภายนอก
     */
    $('.external-button').on('click', function(e) {
        // ป้องกันกรณีที่ยังคลิกที่ลิงก์แล้วไม่มีการตอบสนอง
        const externalUrl = $(this).attr('href');
        if (!externalUrl || externalUrl === '#') {
            e.preventDefault();
            alert('ไม่สามารถเปิดลิงค์ภายนอกได้ กรุณาลองอีกครั้งในภายหลัง');
            return;
        }
        
        // สร้างแอนิเมชันแจ้งเตือนการเปิดลิงค์ภายนอก
        const filename = $(this).closest('tr').find('.file-name').text().trim();
        const notification = $('<div class="download-notification">กำลังเปิด: ' + filename + '</div>');
        
        $('body').append(notification);
        
        notification.fadeIn(300);
        
        setTimeout(function() {
            notification.fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    });
    
    /**
     * ฟังก์ชันตรวจสอบและไฮไลท์ไฟล์ใหม่
     */
    function highlightNewFiles() {
        $('.table-files tbody tr').each(function() {
            const fileDate = $(this).find('.column-date').text().trim();
            
            if (fileDate && isRecentFile(fileDate)) {
                markAsNewFile($(this));
            }
        });
    }

    function isRecentFile(fileDate) {
        const today = new Date();
        const fileDateTime = parseDateString(fileDate);
        
        if (!fileDateTime) {
            return false;
        }
        
        const diffTime = Math.abs(today - fileDateTime);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= 7;
    }

    function markAsNewFile($row) {
        $row.addClass('new-file');
        $row.find('.file-name').append('<span class="new-badge">ใหม่</span>');
    }
    
    // เรียกใช้ฟังก์ชันไฮไลท์ไฟล์ใหม่
    highlightNewFiles();
    
    /**
     * ฟังก์ชันสำหรับการแสดง PDF Preview ที่ปลอดภัย
     */
    function createSecurePdfPreview(fileUrl, secureUrl) {
        // เตรียม URL สำหรับ iframe (ถ้าเป็น URL ที่เข้ารหัสแล้ว ให้แก้ไข action)
        let previewUrl = secureUrl;
        
        // ถ้า URL มีส่วนของ secure_file_download ให้แทนที่ด้วย secure_pdf_preview
        if (secureUrl.indexOf('secure_file_download') > -1) {
            previewUrl = secureUrl.replace('secure_file_download', 'secure_pdf_preview');
        }
        
        return {
            previewUrl: previewUrl,
            downloadUrl: secureUrl
        };
    }
    
    /**
     * ฟังก์ชันค้นหาไฟล์
     */
    $('#file-search-input').on('keyup', function() {
        const searchText = $(this).val().toLowerCase();
        const hasResults = filterTableRows(searchText);
        
        handleSearchResults(hasResults, searchText);
        updateFileCounter();
    });

    function filterTableRows(searchText) {
        let hasResults = false;
        
        $('.table-files tbody tr').each(function() {
            const fileName = $(this).find('.file-name').text().toLowerCase();
            
            if (fileName.includes(searchText)) {
                $(this).show();
                hasResults = true;
            } else {
                $(this).hide();
            }
        });
        
        return hasResults;
    }

    function handleSearchResults(hasResults, searchText) {
        if (!hasResults) {
            showNoResultsMessage(searchText);
        } else {
            hideNoResultsMessage();
        }
    }

    function showNoResultsMessage(searchText) {
        if ($('.no-results-message').length === 0) {
            const messageHtml = createNoResultsHtml(searchText);
            $('.table-files tbody').append(messageHtml);
        } else {
            $('.search-term').text(searchText);
        }
    }

    function createNoResultsHtml(searchText) {
        return '<tr class="no-results-message"><td colspan="4">' +
            '<div class="no-results-content">' +
            '<div class="no-results-icon"></div>' +
            '<p>ไม่พบไฟล์ที่ตรงกับคำค้นหา "<span class="search-term">' + searchText + '</span>"</p>' +
            '</div></td></tr>';
    }

    function hideNoResultsMessage() {
        $('.no-results-message').remove();
    }
    
    /**
     * ฟังก์ชันสำหรับเรียงลำดับตาราง
     */
    $('.table-files th').on('click', function() {
        const table = $(this).parents('table').eq(0);
        const rows = table.find('tbody tr:not(.no-results-message)').toArray();
        const index = $(this).index();
        
        if (!canSortColumn($(this))) {
            return;
        }
        
        updateSortDirection($(this));
        sortTableRows(rows, index, this.asc);
        appendSortedRows(table, rows);
    });

    function canSortColumn($column) {
        return !$column.hasClass('column-download') && !$column.hasClass('column-preview');
    }

    function updateSortDirection($column) {
        $column[0].asc = !$column[0].asc;
        $('.table-files th').removeClass('sort-asc sort-desc');
        $column.addClass($column[0].asc ? 'sort-asc' : 'sort-desc');
    }

    function sortTableRows(rows, index, isAscending) {
        rows.sort(function(a, b) {
            const A = $(a).children('td').eq(index).text().trim().toLowerCase();
            const B = $(b).children('td').eq(index).text().trim().toLowerCase();
            
            if (index === 1) {
                return compareDateColumns(A, B, isAscending);
            }
            
            return compareTextColumns(A, B, isAscending);
        });
    }

    function compareDateColumns(A, B, isAscending) {
        const dateA = parseDateString(A);
        const dateB = parseDateString(B);
        
        if (dateA && dateB) {
            return isAscending ? dateA - dateB : dateB - dateA;
        }
        
        return compareTextColumns(A, B, isAscending);
    }

    function parseDateString(dateStr) {
        const parts = dateStr.split('/');
        
        if (parts.length === 3) {
            return new Date(
                parseInt(parts[2]), // ปี
                parseInt(parts[1]) - 1, // เดือน (0-11)
                parseInt(parts[0]) // วัน
            );
        }
        
        return null;
    }

    function compareTextColumns(A, B, isAscending) {
        if (A < B) {
            return isAscending ? -1 : 1;
        }
        if (A > B) {
            return isAscending ? 1 : -1;
        }
        return 0;
    }

    function appendSortedRows(table, rows) {
        $.each(rows, function(index, row) {
            table.children('tbody').append(row);
        });
    }
    
    /**
     * เพิ่ม tooltip สำหรับชื่อไฟล์ที่ยาวเกินไป
     */
    $('.file-name').each(function() {
        const fileName = $(this).text().trim();
        $(this).attr('title', fileName);
    });
    
    /**
     * เพิ่มเอฟเฟกต์เมื่อ hover ที่ปุ่มดาวน์โหลด
     */
    $('.download-button').hover(
        function() {
            $(this).find('.download-icon').addClass('animate-bounce');
        },
        function() {
            $(this).find('.download-icon').removeClass('animate-bounce');
        }
    );
    
    /**
     * เพิ่มเอฟเฟกต์เมื่อคลิกที่ปุ่มดาวน์โหลด
     */
    $('.download-button').on('click', function(e) {
        // ป้องกันกรณีที่ยังคลิกที่ลิงก์ดาวน์โหลดแล้วไม่มีการตอบสนอง
        const downloadUrl = $(this).attr('href');
        if (!downloadUrl || downloadUrl === '#') {
            e.preventDefault();
            alert('ไม่สามารถดาวน์โหลดไฟล์ได้ กรุณาลองอีกครั้งในภายหลัง');
            return;
        }
        
        // สร้างแอนิเมชันแจ้งเตือนการดาวน์โหลด
        const filename = $(this).closest('tr').find('.file-name').text().trim();
        const notification = $('<div class="download-notification">กำลังดาวน์โหลด: ' + filename + '</div>');
        
        $('body').append(notification);
        
        notification.fadeIn(300);
        
        setTimeout(function() {
            notification.fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    });
    
    /**
     * เพิ่มฟังก์ชัน PDF Preview
     */
    $('.preview-button').on('click', function() {
        const fileUrl = $(this).data('file');
        const fileName = $(this).data('filename');
        const secureUrl = $(this).data('secure');
        
        // ตรวจสอบว่ามีข้อมูลที่จำเป็นหรือไม่
        if (!fileUrl || !secureUrl) {
            alert('ไม่สามารถแสดงตัวอย่างไฟล์ได้ ข้อมูลไม่ครบถ้วน');
            return;
        }
        
        // เตรียม URL สำหรับ Preview และดาวน์โหลด
        const urls = createSecurePdfPreview(fileUrl, secureUrl);
        
        // แสดงส่วน Preview
        $('.pdf-preview-container').slideDown(300);
        
        // เลื่อนไปที่ส่วน Preview
        $('html, body').animate({
            scrollTop: $('.pdf-preview-container').offset().top - 20
        }, 500);
        
        // กำหนดค่าสำหรับ Preview
        $('.pdf-preview-filename').text(fileName);
        $('#pdf-preview-frame').attr('src', urls.previewUrl);
        $('.pdf-download-button').attr('href', urls.downloadUrl);
        
        // ไฮไลท์แถวที่เลือก
        $('.table-files tbody tr').removeClass('selected-file');
        $(this).closest('tr').addClass('selected-file');
    });
    
    /**
     * ปุ่มปิด PDF Preview
     */
    $('.pdf-preview-close').on('click', function() {
        $('.pdf-preview-container').slideUp(300);
        $('.table-files tbody tr').removeClass('selected-file');
        
        // เคลียร์ iframe src หลังจากซ่อน
        setTimeout(function() {
            $('#pdf-preview-frame').attr('src', '');
        }, 300);
    });
    
    /**
     * ฟังก์ชันสำหรับจัดการการเข้าถึงด้วยแป้นพิมพ์ (keyboard accessibility)
     */
    $('.preview-button, .pdf-preview-close').on('keydown', function(e) {
        // Enter หรือ Space
        if (e.keyCode === 13 || e.keyCode === 32) {
            e.preventDefault();
            $(this).click();
        }
    });
    
    /**
     * รองรับการจัดการความผิดพลาดสำหรับการโหลด iframe
     */
    $('#pdf-preview-frame').on('load', function() {
        // ตรวจสอบว่า iframe ถูกโหลดสำเร็จหรือไม่
        try {
            const frameContent = $(this).contents();
            // ถ้าสามารถเข้าถึงเนื้อหาได้ แสดงว่าไม่มีปัญหา Cross-Origin
        } catch (e) {
            // หากมีปัญหา Cross-Origin หรืออื่นๆ
            console.log('ไม่สามารถโหลดเนื้อหา PDF ได้: ', e);
        }
    }).on('error', function() {
        alert('ไม่สามารถแสดงตัวอย่าง PDF ได้ กรุณาลองดาวน์โหลดไฟล์แทน');
        $('.pdf-preview-close').click();
    });
    
    /**
     * ระบบจัดการสถานะการโหลดของ Preview
     */
    let previewLoading = false;
    
    $('#pdf-preview-frame').on('load', function() {
        previewLoading = false;
        $('.pdf-preview-container').removeClass('loading');
    });
    
    $('.preview-button').on('click', function() {
        previewLoading = true;
        $('.pdf-preview-container').addClass('loading');
        
        // ตั้งเวลาตรวจสอบว่าโหลดนานเกินไปหรือไม่
        setTimeout(function() {
            if (previewLoading) {
                $('.pdf-preview-container').removeClass('loading');
                previewLoading = false;
            }
        }, 10000); // 10 วินาที
    });
    
    /**
     * ตรวจจับการเปลี่ยนแปลงขนาดหน้าจอเพื่อปรับขนาด iframe
     */
    $(window).on('resize', function() {
        if ($('.pdf-preview-container').is(':visible')) {
            adjustPreviewHeight();
        }
    });
    
    function adjustPreviewHeight() {
        const windowHeight = $(window).height();
        const containerTop = $('.pdf-preview-container').offset().top;
        const headerHeight = $('.pdf-preview-header').outerHeight();
        const footerHeight = $('.pdf-preview-actions').outerHeight();
        const padding = 40; // padding ด้านล่าง
        
        let availableHeight = windowHeight - containerTop - headerHeight - footerHeight - padding;
        availableHeight = Math.max(300, availableHeight); // ขนาดขั้นต่ำ 300px
        
        $('#pdf-preview-frame').css('height', availableHeight + 'px');
    }
    
    /**
     * เพิ่มความสามารถในการลากเพื่อเปลี่ยนขนาด iframe (resize)
     */
    let isResizing = false;
    let startY, startHeight;
    
    // เพิ่ม handle สำหรับการ resize
    $('.pdf-preview-content').append('<div class="pdf-resize-handle"></div>');
    
    $('.pdf-resize-handle').on('mousedown', function(e) {
        isResizing = true;
        startY = e.clientY;
        startHeight = $('#pdf-preview-frame').height();
        $('body').css('cursor', 'ns-resize');
        e.preventDefault();
    });
    
    $(document).on('mousemove', function(e) {
        if (!isResizing) {
            return;
        }
        
        let newHeight = startHeight + (e.clientY - startY);
        newHeight = Math.max(300, newHeight); // ขนาดขั้นต่ำ 300px
        
        $('#pdf-preview-frame').css('height', newHeight + 'px');
    }).on('mouseup', function() {
        if (isResizing) {
            isResizing = false;
            $('body').css('cursor', '');
        }
    });
});