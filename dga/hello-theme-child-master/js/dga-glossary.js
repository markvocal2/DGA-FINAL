/**
 * DGA Glossary JavaScript
 * File: /js/dga-glossary.js
 * Complete Version with Database System
 */

jQuery(document).ready(function($) {
    let currentPage = 1;
    let currentSearch = '';
    let currentLetter = '';
    let currentLetterType = '';
    let currentEditingCell = null;

    // Initialize
    loadGlossaryData();

    // Add modal functionality if admin
    if (dga_glossary_ajax.is_admin) {
        setupModalFunctionality();
    }

    // Search functionality with debounce
    let searchTimeout;
    $('#dga-search-input').on('input', function() {
        const searchValue = $(this).val();
        
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function() {
            currentSearch = searchValue;
            currentPage = 1;
            loadGlossaryData();
        }, 500);
    });

    // Clear search
    $('#dga-clear-search').on('click', function() {
        // Reset all values
        $('#dga-search-input').val('');
        currentSearch = '';
        currentPage = 1;
        currentLetter = '';
        currentLetterType = '';
        
        // Remove active state with smooth transition
        $('.alphabet-filter.active').each(function() {
            $(this).css('transition', 'all 0.3s ease');
            $(this).removeClass('active');
        });
        
        // Reset selected letter display
        updateSelectedLetterDisplay('');
        
        // Reload data to initial state
        loadGlossaryData();
    });

    // Alphabet filter with enhanced animation
    $('.alphabet-filter').on('click', function() {
        const $this = $(this);
        const wasActive = $this.hasClass('active');
        
        // Remove active from all filters
        $('.alphabet-filter').removeClass('active');
        
        if (!wasActive) {
            // Add active to clicked filter with animation
            $this.addClass('active');
            currentLetter = $this.data('char');
            currentLetterType = $this.data('type');
            
            // Add visual feedback
            $this.css('animation', 'none');
            setTimeout(function() {
                $this.css('animation', 'pulse 0.5s ease-in-out');
            }, 10);
            
            // Update selected letter display
            updateSelectedLetterDisplay(currentLetter);
        } else {
            // If clicking the same letter, deactivate it
            currentLetter = '';
            currentLetterType = '';
            updateSelectedLetterDisplay('');
        }
        
        currentPage = 1;
        loadGlossaryData();
    });

    // Load glossary data
    function loadGlossaryData() {
        showSkeletonLoader();
        
        $.ajax({
            url: dga_glossary_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'dga_fetch_glossary',
                nonce: dga_glossary_ajax.nonce,
                page: currentPage,
                search: currentSearch,
                letter: currentLetter,
                letter_type: currentLetterType
            },
            success: function(response) {
                if (response.success) {
                    renderTable(response.data);
                    renderPagination(response.pagination);
                } else {
                    showError('ไม่พบข้อมูล: ' + (response.message || ''));
                }
            },
            error: function(xhr, status, error) {
                showError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error);
            }
        });
    }

    // Render table
    function renderTable(data) {
        const tbody = $('#dga-glossary-tbody');
        tbody.empty();

        const isAdmin = dga_glossary_ajax.is_admin;
        const colCount = isAdmin ? 6 : 5;

        if (data.length === 0) {
            tbody.html('<tr><td colspan="' + colCount + '" class="no-data">ไม่พบข้อมูล</td></tr>');
            return;
        }

        data.forEach(function(item) {
            const row = $('<tr>');
            
            // Thai term with edit button
            let thaiHtml = '<div class="editable-cell">' +
                '<span class="cell-value">' + highlightSearchTerm(item.thai || '') + '</span>';
            
            if (isAdmin) {
                thaiHtml += '<button class="edit-btn" data-id="' + item.id + '" data-field="thai"><i class="edit-icon">✏️</i></button>';
            }
            thaiHtml += '</div>';
            
            const thaiCell = $('<td data-label="คำศัพท์ (ไทย):">').html(thaiHtml);
            
            // English term with edit button
            let englishHtml = '<div class="editable-cell">' +
                '<span class="cell-value">' + highlightSearchTerm(item.english || '') + '</span>';
            
            if (isAdmin) {
                englishHtml += '<button class="edit-btn" data-id="' + item.id + '" data-field="english"><i class="edit-icon">✏️</i></button>';
            }
            englishHtml += '</div>';
            
            const englishCell = $('<td data-label="คำศัพท์ (English):">').html(englishHtml);
            
            // Content
            const contentCell = $('<td data-label="คำอธิบาย:">').html(highlightSearchTerm(item.content || ''));
            
            // Source
            const sourceCell = $('<td data-label="ที่มา:">').text(item.source || '');
            
            // URL
            let urlHtml = item.url ? '<a href="' + item.url + '" class="view-btn" target="_blank">ดูข้อมูล</a>' : '-';
            const urlCell = $('<td data-label="URL:">').html(urlHtml);
            
            row.append(thaiCell, englishCell, contentCell, sourceCell, urlCell);
            
            // Add management buttons if admin
            if (isAdmin) {
                const actionCell = $('<td data-label="จัดการ:">').html(
                    '<button class="edit-full-btn" data-id="' + item.id + '">แก้ไข</button> ' +
                    '<button class="btn-delete" data-id="' + item.id + '">ลบ</button>'
                );
                row.append(actionCell);
            }
            
            tbody.append(row);
        });

        // Attach edit functionality if admin
        if (isAdmin) {
            attachEditFunctionality();
            attachFullEditFunctionality();
            attachDeleteFunctionality();
        }
    }

    // Setup modal functionality
    function setupModalFunctionality() {
        const modal = $('#dga-modal');
        const addBtn = $('#dga-add-new-btn');
        const closeBtn = $('.modal-close');
        const cancelBtn = $('.btn-cancel');
        const form = $('#dga-glossary-form');

        // Open modal for new entry
        addBtn.on('click', function() {
            $('#modal-title').text('เพิ่มคำศัพท์ใหม่');
            form[0].reset();
            $('#modal-id').val('');
            modal.show();
        });

        // Close modal
        closeBtn.add(cancelBtn).on('click', function() {
            modal.hide();
        });

        // Close modal on outside click
        $(window).on('click', function(event) {
            if (event.target == modal[0]) {
                modal.hide();
            }
        });

        // Submit form
        form.on('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                action: 'dga_save_glossary_entry',
                nonce: dga_glossary_ajax.nonce,
                id: $('#modal-id').val(),
                thai_term: $('#modal-thai').val(),
                english_term: $('#modal-english').val(),
                description: $('#modal-description').val(),
                source: $('#modal-source').val(),
                url: $('#modal-url').val()
            };

            $.ajax({
                url: dga_glossary_ajax.ajax_url,
                type: 'POST',
                data: formData,
                success: function(response) {
                    if (response.success) {
                        showNotification(response.message, 'success');
                        modal.hide();
                        loadGlossaryData();
                    } else {
                        showNotification(response.message, 'error');
                    }
                },
                error: function() {
                    showNotification('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
                }
            });
        });
    }

    // Attach inline edit functionality (quick edit for Thai/English)
    function attachEditFunctionality() {
        $('.edit-btn').off('click').on('click', function() {
            const btn = $(this);
            const cell = btn.closest('.editable-cell');
            const currentValue = cell.find('.cell-value').text();
            const postId = btn.data('id');
            const field = btn.data('field');

            // If already editing another cell, cancel it
            if (currentEditingCell && currentEditingCell !== cell[0]) {
                cancelEdit($(currentEditingCell));
            }

            // Create edit input
            const input = $('<input type="text" class="edit-input">').val(currentValue);
            const saveBtn = $('<button class="save-btn">บันทึก</button>');
            const cancelBtn = $('<button class="cancel-btn">ยกเลิก</button>');
            const editContainer = $('<div class="edit-container">').append(input, saveBtn, cancelBtn);

            // Replace cell content
            cell.empty().append(editContainer);
            currentEditingCell = cell[0];
            input.focus().select();

            // Save functionality
            saveBtn.on('click', function() {
                const newValue = input.val();
                saveEdit(postId, field, newValue, cell, currentValue);
            });

            // Cancel functionality
            cancelBtn.on('click', function() {
                cancelEdit(cell, currentValue);
            });

            // Enter key to save, Escape to cancel
            input.on('keypress', function(e) {
                if (e.which === 13) {
                    saveBtn.click();
                }
            }).on('keydown', function(e) {
                if (e.which === 27) {
                    cancelBtn.click();
                }
            });
        });
    }

    // Save inline edit
    function saveEdit(postId, field, value, cell, originalValue) {
        $.ajax({
            url: dga_glossary_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'dga_update_glossary_term',
                nonce: dga_glossary_ajax.nonce,
                post_id: postId,
                field: field,
                value: value
            },
            success: function(response) {
                if (response.success) {
                    // Update cell with new value
                    cell.html(
                        '<span class="cell-value">' + highlightSearchTerm(value) + '</span>' +
                        '<button class="edit-btn" data-id="' + postId + '" data-field="' + field + '"><i class="edit-icon">✏️</i></button>'
                    );
                    currentEditingCell = null;
                    attachEditFunctionality();
                    showNotification('บันทึกข้อมูลสำเร็จ', 'success');
                } else {
                    showNotification(response.message || 'เกิดข้อผิดพลาด', 'error');
                    cancelEdit(cell, originalValue);
                }
            },
            error: function() {
                showNotification('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
                cancelEdit(cell, originalValue);
            }
        });
    }

    // Cancel inline edit
    function cancelEdit(cell, originalValue) {
        if (!cell || cell.length === 0) return;
        
        const container = cell.closest('.editable-cell');
        const postId = container.find('.edit-btn').data('id') || container.find('button').first().data('id');
        const field = container.find('.edit-btn').data('field') || container.find('button').first().data('field');
        
        cell.html(
            '<span class="cell-value">' + highlightSearchTerm(originalValue || '') + '</span>' +
            '<button class="edit-btn" data-id="' + postId + '" data-field="' + field + '"><i class="edit-icon">✏️</i></button>'
        );
        currentEditingCell = null;
        attachEditFunctionality();
    }

    // Attach full edit functionality (edit all fields via modal)
    function attachFullEditFunctionality() {
        $('.edit-full-btn').off('click').on('click', function() {
            const id = $(this).data('id');
            
            $.ajax({
                url: dga_glossary_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'dga_get_glossary_entry',
                    nonce: dga_glossary_ajax.nonce,
                    id: id
                },
                success: function(response) {
                    if (response.success) {
                        $('#modal-title').text('แก้ไขคำศัพท์');
                        $('#modal-id').val(response.data.id);
                        $('#modal-thai').val(response.data.thai_term);
                        $('#modal-english').val(response.data.english_term);
                        $('#modal-description').val(response.data.description);
                        $('#modal-source').val(response.data.source);
                        $('#modal-url').val(response.data.url);
                        $('#dga-modal').show();
                    } else {
                        showNotification('ไม่สามารถโหลดข้อมูลได้', 'error');
                    }
                },
                error: function() {
                    showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
                }
            });
        });
    }

    // Attach delete functionality
    function attachDeleteFunctionality() {
        $('.btn-delete').off('click').on('click', function() {
            const id = $(this).data('id');
            const row = $(this).closest('tr');
            
            if (confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) {
                row.css('opacity', '0.5');
                
                $.ajax({
                    url: dga_glossary_ajax.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'dga_delete_glossary_entry',
                        nonce: dga_glossary_ajax.nonce,
                        id: id
                    },
                    success: function(response) {
                        if (response.success) {
                            row.fadeOut(300, function() {
                                showNotification(response.message, 'success');
                                loadGlossaryData();
                            });
                        } else {
                            row.css('opacity', '1');
                            showNotification(response.message, 'error');
                        }
                    },
                    error: function() {
                        row.css('opacity', '1');
                        showNotification('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
                    }
                });
            }
        });
    }

    // Render pagination
    function renderPagination(pagination) {
        const container = $('#dga-glossary-pagination');
        container.empty();

        if (pagination.total_pages <= 1) {
            return;
        }

        // Previous button
        if (pagination.current_page > 1) {
            container.append(
                $('<button class="pagination-btn prev">ก่อนหน้า</button>').on('click', function() {
                    currentPage = pagination.current_page - 1;
                    loadGlossaryData();
                    scrollToTop();
                })
            );
        }

        // Page numbers
        const pageNumbers = $('<div class="page-numbers">');
        const maxVisiblePages = 5;
        let startPage = Math.max(1, pagination.current_page - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(pagination.total_pages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // First page and dots
        if (startPage > 1) {
            pageNumbers.append(
                $('<button class="page-number">1</button>').on('click', function() {
                    currentPage = 1;
                    loadGlossaryData();
                    scrollToTop();
                })
            );
            if (startPage > 2) {
                pageNumbers.append('<span class="pagination-dots">...</span>');
            }
        }

        // Page number buttons
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = $('<button class="page-number">' + i + '</button>');
            
            if (i === pagination.current_page) {
                pageBtn.addClass('active');
            }
            
            pageBtn.on('click', function() {
                currentPage = i;
                loadGlossaryData();
                scrollToTop();
            });
            
            pageNumbers.append(pageBtn);
        }

        // Last page and dots
        if (endPage < pagination.total_pages) {
            if (endPage < pagination.total_pages - 1) {
                pageNumbers.append('<span class="pagination-dots">...</span>');
            }
            pageNumbers.append(
                $('<button class="page-number">' + pagination.total_pages + '</button>').on('click', function() {
                    currentPage = pagination.total_pages;
                    loadGlossaryData();
                    scrollToTop();
                })
            );
        }
        
        container.append(pageNumbers);

        // Next button
        if (pagination.current_page < pagination.total_pages) {
            container.append(
                $('<button class="pagination-btn next">ถัดไป</button>').on('click', function() {
                    currentPage = pagination.current_page + 1;
                    loadGlossaryData();
                    scrollToTop();
                })
            );
        }

        // Page info
        container.append(
            $('<div class="page-info">').text(
                'หน้า ' + pagination.current_page + ' จาก ' + pagination.total_pages +
                ' (ทั้งหมด ' + pagination.total_posts + ' รายการ)'
            )
        );
    }

    // Highlight search term
    function highlightSearchTerm(text) {
        if (!currentSearch || !text) {
            return text;
        }

        const regex = new RegExp('(' + escapeRegExp(currentSearch) + ')', 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    // Show skeleton loader
    function showSkeletonLoader() {
        const tbody = $('#dga-glossary-tbody');
        const colCount = dga_glossary_ajax.is_admin ? 6 : 5;
        let skeletonRows = '';
        
        // Generate 5 skeleton rows
        for (let i = 0; i < 5; i++) {
            skeletonRows += 
                '<tr class="skeleton-row">' +
                    '<td colspan="' + colCount + '">' +
                        '<div class="skeleton-wrapper">';
            
            for (let j = 0; j < colCount; j++) {
                skeletonRows += '<div class="skeleton-item"></div>';
            }
            
            skeletonRows += '</div></td></tr>';
        }
        
        tbody.html(skeletonRows);
    }

    // Show notification
    function showNotification(message, type) {
        // Remove existing notifications
        $('.dga-notification').remove();
        
        const notification = $('<div class="dga-notification ' + type + '">' + message + '</div>');
        $('body').append(notification);
        
        setTimeout(function() {
            notification.addClass('show');
        }, 100);
        
        setTimeout(function() {
            notification.removeClass('show');
            setTimeout(function() {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Show error
    function showError(message) {
        const tbody = $('#dga-glossary-tbody');
        const colCount = dga_glossary_ajax.is_admin ? 6 : 5;
        tbody.html(
            '<tr><td colspan="' + colCount + '" class="error-message">' + message + '</td></tr>'
        );
    }

    // Update selected letter display
    function updateSelectedLetterDisplay(letter) {
        const displayBox = $('.selected-letter-box');
        const displayText = $('#selected-letter-text');
        
        if (letter) {
            displayText.text(letter);
            displayBox.addClass('active');
            // Add pulse animation
            displayBox.css('animation', 'none');
            setTimeout(function() {
                displayBox.css('animation', 'pulse 0.5s ease-in-out');
            }, 10);
        } else {
            displayText.text('-');
            displayBox.removeClass('active');
        }
    }

    // Scroll to top of table
    function scrollToTop() {
        const container = $('#dga-glossary-container');
        if (container.length) {
            $('html, body').animate({
                scrollTop: container.offset().top - 100
            }, 300);
        }
    }

    // Add visual feedback
    function addVisualFeedback(element) {
        const $el = $(element);
        $el.addClass('pulse-once');
        setTimeout(function() {
            $el.removeClass('pulse-once');
        }, 600);
    }

    // Utility functions
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Keyboard shortcuts for admin
    if (dga_glossary_ajax.is_admin) {
        $(document).on('keydown', function(e) {
            // Ctrl + N for new entry
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                $('#dga-add-new-btn').click();
            }
            // Escape to close modal
            if (e.key === 'Escape') {
                $('#dga-modal').hide();
            }
        });
    }

    // Auto-refresh every 5 minutes (optional)
    // setInterval(function() {
    //     loadGlossaryData();
    // }, 300000);

    // Handle responsive table on resize
    let resizeTimeout;
    $(window).on('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            adjustTableResponsive();
        }, 250);
    });

    function adjustTableResponsive() {
        const width = $(window).width();
        const table = $('#dga-glossary-table');
        
        if (width < 768) {
            table.addClass('responsive-mode');
        } else {
            table.removeClass('responsive-mode');
        }
    }

    // Initialize responsive mode
    adjustTableResponsive();

    // Export functionality (for future enhancement)
    window.dgaGlossary = {
        reload: loadGlossaryData,
        search: function(term) {
            $('#dga-search-input').val(term).trigger('input');
        },
        filterByLetter: function(letter, type) {
            $('.alphabet-filter').removeClass('active');
            $('.alphabet-filter[data-char="' + letter + '"][data-type="' + type + '"]').click();
        },
        clearFilters: function() {
            $('#dga-clear-search').click();
        }
    };
});