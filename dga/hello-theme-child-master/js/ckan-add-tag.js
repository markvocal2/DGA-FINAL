jQuery(document).ready(function($) {
    // Store current delete term ID
    let currentDeleteTermId = null;
    
    // Debounce function for autocomplete
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
    
    // Utility functions
    const validateResponse = (response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    };

    const showError = (message, error = null) => {
        if (error) {
            console.error('CKAN Tag Error:', error);
        }
        alert(message);
    };

    const validatePostId = (postId) => {
        if (!postId || isNaN(postId)) {
            throw new Error('Invalid post ID');
        }
        return parseInt(postId);
    };

    // Create API request helper
    const makeApiRequest = async (action, data = {}) => {
        const response = await fetch(ckanTagData.ajax_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action,
                nonce: ckanTagData.nonce,
                ...data
            })
        });
        
        return validateResponse(response);
    };

    // Create tag HTML helper
    const createTagHtml = (term, isSelected = false, includeDeleteBtn = false) => {
        const selectedClass = isSelected ? 'selected' : '';
        let html = `<span class="ckan-modal-tag-def456 ${selectedClass}" data-term-id="${term.id}">${term.name}`;
        
        if (includeDeleteBtn && ckanTagData.can_manage_terms) {
            html += `<span class="ckan-tag-delete-def456" data-term-id="${term.id}" data-term-name="${term.name}" title="${ckanTagData.i18n.delete_tag}">&times;</span>`;
        }
        
        html += '</span>';
        return html;
    };

    // Update modal tags display
    const updateModalTags = (terms) => {
        let tagsHtml = '';
        if (terms.length > 0) {
            terms.forEach(term => {
                tagsHtml += createTagHtml(term, term.selected);
            });
        } else {
            tagsHtml = '<p>' + ckanTagData.i18n.no_tags + '</p>';
        }
        $('.ckan-modal-tags-def456').html(tagsHtml);
    };

    // Update tags list display
    const updateTagsList = (terms) => {
        let tagsHtml = '';
        terms.forEach(term => {
            tagsHtml += `<span class="ckan-tag-def456" data-term-id="${term.id}">${term.name}`;
            if (ckanTagData.can_manage_terms) {
                tagsHtml += `<span class="ckan-tag-delete-def456" data-term-id="${term.id}" data-term-name="${term.name}" title="${ckanTagData.i18n.delete_tag}">&times;</span>`;
            }
            tagsHtml += '</span>';
        });
        $('.ckan-tags-list-def456').html(tagsHtml);
    };

    // เปิด modal เมื่อคลิกปุ่ม "เพิ่ม TAG"
    $('.ckan-add-tag-btn-def456').on('click', function() {
        try {
            const postId = validatePostId($(this).data('post-id'));
        
            // แสดง loading indicator
            $('.ckan-modal-tags-def456').html('<p>' + ckanTagData.i18n.loading + '</p>');
            
            // โหลด terms ทั้งหมดผ่าน API helper
            makeApiRequest('ckan_get_all_terms', { post_id: postId })
                .then(data => {
                    if (data.success) {
                        updateModalTags(data.data);
                        
                        // เก็บ post ID ไว้ใน modal เพื่อใช้ต่อ
                        $('#ckan-tag-modal-def456').data('post-id', postId);
                        
                        // Clear autocomplete input
                        $('.ckan-autocomplete-input-def456').val('');
                        $('.ckan-autocomplete-results-def456').hide().empty();
                        
                        // แสดง modal
                        $('#ckan-tag-modal-def456').show();
                    } else {
                        alert(ckanTagData.i18n.error + ': ' + (data.data?.message || ckanTagData.i18n.no_tags));
                    }
                })
        .catch(error => {
            showError(ckanTagData.i18n.connection_error, error);
        });
        
        } catch (error) {
            showError(ckanTagData.i18n.error + ': Invalid post ID', error);
        }
    });
    
    // Handle delete tag click
    $(document).on('click', '.ckan-tag-delete-def456', function(e) {
        e.stopPropagation();
        
        if (!ckanTagData.can_manage_terms) {
            return;
        }
        
        const termId = $(this).data('term-id');
        const termName = $(this).data('term-name');
        currentDeleteTermId = termId;
        
        // Load term info and other terms for transfer
        makeApiRequest('ckan_get_term_info', { term_id: termId })
            .then(data => {
            if (data.success) {
                // Update delete modal content
                let infoText = `Tag "${data.data.term_name}" ${ckanTagData.i18n.post_count} ${data.data.post_count}`;
                $('.ckan-delete-info-def456').text(infoText);
                
                // Populate transfer select
                let selectOptions = `<option value="">${ckanTagData.i18n.select_destination}</option>`;
                if (data.data.other_terms.length > 0) {
                    data.data.other_terms.forEach(term => {
                        selectOptions += `<option value="${term.id}">${term.name}</option>`;
                    });
                }
                $('.ckan-transfer-select-def456').html(selectOptions);
                
                // Reset radio to transfer option
                $('input[name="transfer_option"][value="transfer"]').prop('checked', true);
                
                // Show delete modal
                $('#ckan-delete-modal-def456').show();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(ckanTagData.i18n.error);
        });
    });
    
    // Handle delete confirmation
    $('.ckan-confirm-delete-btn-def456').on('click', function() {
        const transferOption = $('input[name="transfer_option"]:checked').val();
        const targetTermId = $('.ckan-transfer-select-def456').val();
        
        // Validate transfer option
        if (transferOption === 'transfer' && !targetTermId) {
            alert(ckanTagData.i18n.select_destination);
            return;
        }
        
        const $button = $(this);
        $button.text(ckanTagData.i18n.deleting);
        
        // Delete term via API helper
        makeApiRequest('ckan_delete_term', {
            term_id: currentDeleteTermId,
            transfer_option: transferOption,
            target_term_id: targetTermId || ''
        })
            .then(data => {
            if (data.success) {
                // Remove deleted tag from display
                $(`.ckan-tag-def456[data-term-id="${currentDeleteTermId}"]`).fadeOut(300, function() {
                    $(this).remove();
                });
                
                // Close modal
                $('#ckan-delete-modal-def456').hide();
                
                // Reset button text
                $button.text(ckanTagData.i18n.save);
            } else {
                alert(ckanTagData.i18n.error + ': ' + data.data.message);
                $button.text(ckanTagData.i18n.save);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(ckanTagData.i18n.connection_error);
            $button.text(ckanTagData.i18n.save);
        });
    });
    
    // Handle cancel delete
    $('.ckan-cancel-delete-btn-def456').on('click', function() {
        $('#ckan-delete-modal-def456').hide();
        currentDeleteTermId = null;
    });
    
    // Autocomplete functionality
    const searchTerms = debounce(function(searchQuery) {
        if (searchQuery.length < 2) {
            $('.ckan-autocomplete-results-def456').hide().empty();
            return;
        }
        
        // Search terms using API helper
        makeApiRequest('ckan_search_terms', { search: searchQuery })
            .then(data => {
            if (data.success) {
                let resultsHtml = '';
                
                if (data.data.length > 0) {
                    // แสดงผลลัพธ์ที่พบ
                    data.data.forEach(function(term, index) {
                        const activeClass = index === 0 ? ' active' : '';
                        resultsHtml += `<div class="ckan-autocomplete-item-def456${activeClass}" data-term-id="${term.id}" data-term-name="${term.name}">`;
                        resultsHtml += term.name;
                        resultsHtml += '</div>';
                    });
                    
                    // เพิ่มตัวเลือกสำหรับสร้างใหม่
                    resultsHtml += `<div class="ckan-autocomplete-item-def456 create-new" data-create="${searchQuery}">`;
                } else {
                    // ถ้าไม่พบผลลัพธ์ ให้ตัวเลือกสร้างใหม่เป็น active
                    resultsHtml += `<div class="ckan-autocomplete-item-def456 create-new active" data-create="${searchQuery}">`;
                }
                
                resultsHtml += `${ckanTagData.i18n.create_new} "${searchQuery}"</div>`;
                $('.ckan-autocomplete-results-def456').html(resultsHtml).show();
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }, 300);
    
    // Handle autocomplete input
    $(document).on('input', '.ckan-autocomplete-input-def456', function() {
        const searchQuery = $(this).val().trim();
        
        // Validate and sanitize input
        if (searchQuery.length > 100) {
            $(this).val(searchQuery.substring(0, 100));
            return;
        }
        
        // Remove potentially harmful characters
        const sanitizedQuery = searchQuery.replace(/[<>]/g, '');
        if (sanitizedQuery !== searchQuery) {
            $(this).val(sanitizedQuery);
            return;
        }
        
        searchTerms(sanitizedQuery);
    });
    
    // Handle autocomplete item click
    $(document).on('click', '.ckan-autocomplete-item-def456', function() {
        const $item = $(this);
        
        if ($item.hasClass('create-new')) {
            // สร้าง term ใหม่
            const termName = $item.data('create');
            
            makeApiRequest('ckan_create_term', { term_name: termName })
                .then(data => {
                if (data.success) {
                    // เพิ่ม tag ใหม่ในรายการและเลือกมันโดยอัตโนมัติ
                    const newTagHtml = '<span class="ckan-modal-tag-def456 selected" data-term-id="' + data.data.id + '">' + data.data.name + '</span>';
                    $('.ckan-modal-tags-def456').append(newTagHtml);
                    
                    // Clear input and results
                    $('.ckan-autocomplete-input-def456').val('');
                    $('.ckan-autocomplete-results-def456').hide().empty();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert(ckanTagData.i18n.error);
            });
        } else {
            // เลือก term ที่มีอยู่แล้ว
            const termId = $item.data('term-id');
            const termName = $item.data('term-name');
            
            // ตรวจสอบว่า tag นี้ถูกเลือกอยู่แล้วหรือไม่
            const $existingTag = $('.ckan-modal-tag-def456[data-term-id="' + termId + '"]');
            
            if ($existingTag.length > 0) {
                // ถ้ามีอยู่แล้ว ให้เลือกมัน
                $existingTag.addClass('selected');
            } else {
                // ถ้าไม่มี ให้เพิ่มเข้าไป
                const newTagHtml = '<span class="ckan-modal-tag-def456 selected" data-term-id="' + termId + '">' + termName + '</span>';
                $('.ckan-modal-tags-def456').append(newTagHtml);
            }
            
            // Clear input and results
            $('.ckan-autocomplete-input-def456').val('');
            $('.ckan-autocomplete-results-def456').hide().empty();
        }
    });
    
    // Hide autocomplete results when clicking outside or pressing Escape
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.ckan-autocomplete-wrapper-def456').length) {
            $('.ckan-autocomplete-results-def456').hide();
        }
    });

    // Handle keyboard navigation in autocomplete
    $(document).on('keydown', '.ckan-autocomplete-input-def456', function(e) {
        const $results = $('.ckan-autocomplete-results-def456');
        const $items = $results.find('.ckan-autocomplete-item-def456');
        const $active = $items.filter('.active');
        
        switch(e.keyCode) {
            case 27: // Escape
                $results.hide();
                break;
            case 38: // Arrow Up
                e.preventDefault();
                if ($active.length) {
                    $active.removeClass('active').prev().addClass('active');
                } else {
                    $items.last().addClass('active');
                }
                break;
            case 40: // Arrow Down
                e.preventDefault();
                if ($active.length) {
                    $active.removeClass('active').next().addClass('active');
                } else {
                    $items.first().addClass('active');
                }
                break;
            case 13: // Enter
                e.preventDefault();
                if ($active.length) {
                    $active.click();
                }
                break;
        }
    });

    // Handle Enter key on modal tags
    $(document).on('keydown', '.ckan-modal-tag-def456', function(e) {
        if (e.keyCode === 13 || e.keyCode === 32) { // Enter or Space
            e.preventDefault();
            $(this).click();
        }
    });
    
    // ปิด modal เมื่อคลิกปุ่มปิด
    $(document).on('click', '.ckan-modal-close-def456', function() {
        $(this).closest('.ckan-modal-def456').hide();
    });
    
    // ปิด modal เมื่อคลิกนอกพื้นที่ modal
    $(window).on('click', function(event) {
        if ($(event.target).hasClass('ckan-modal-def456')) {
            $(event.target).hide();
        }
    });
    
    // สลับการเลือกเมื่อคลิกที่ tag ใน modal
    $(document).on('click', '.ckan-modal-tag-def456', function() {
        $(this).toggleClass('selected');
    });
    
    // จัดการคลิกปุ่มบันทึก
    $('.ckan-save-tags-btn-def456').on('click', function() {
        try {
            const postId = validatePostId($('#ckan-tag-modal-def456').data('post-id'));
            const selectedTermIds = [];
            
            // เก็บ ID ของ terms ที่เลือกทั้งหมด
            $('.ckan-modal-tag-def456.selected').each(function() {
                const termId = $(this).data('term-id');
                if (termId) {
                    selectedTermIds.push(parseInt(termId));
                }
            });
        
            // แสดง loading state
            const $saveBtn = $('.ckan-save-tags-btn-def456');
            $saveBtn.text(ckanTagData.i18n.saving).prop('disabled', true);
            
            // อัพเดต terms ของโพสต์ผ่าน API helper
            makeApiRequest('ckan_update_post_terms', {
                post_id: postId,
                term_ids: selectedTermIds.join(',')
            })
                .then(data => {
                    if (data.success) {
                        updateTagsList(data.data.terms);
                        
                        // ปิด modal
                        $('#ckan-tag-modal-def456').hide();
                        
                        // แสดงข้อความสำเร็จ
                        if (data.data.terms.length > 0) {
                            console.log('Tags updated successfully');
                        }
                    } else {
                        alert(ckanTagData.i18n.error + ': ' + (data.data?.message || 'Unknown error'));
                    }
                })
        .catch(error => {
            showError(ckanTagData.i18n.connection_error, error);
        })
        .finally(() => {
            // รีเซ็ต button state
            $saveBtn.text(ckanTagData.i18n.save).prop('disabled', false);
        });
        
        } catch (error) {
            showError(ckanTagData.i18n.error + ': Invalid data', error);
        }
    });
});