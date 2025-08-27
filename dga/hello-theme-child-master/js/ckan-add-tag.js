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
    
    // เปิด modal เมื่อคลิกปุ่ม "เพิ่ม TAG"
    $('.ckan-add-tag-btn-def456').on('click', function() {
        var postId = $(this).data('post-id');
        
        // โหลด terms ทั้งหมดผ่าน AJAX
        $.ajax({
            url: ckanTagData.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_all_terms',
                nonce: ckanTagData.nonce,
                post_id: postId
            },
            beforeSend: function() {
                // แสดง loading indicator
                $('.ckan-modal-tags-def456').html('<p>' + ckanTagData.i18n.loading + '</p>');
            },
            success: function(response) {
                if (response.success) {
                    var terms = response.data;
                    var tagsHtml = '';
                    
                    // สร้าง HTML สำหรับ tags
                    if (terms.length > 0) {
                        for (var i = 0; i < terms.length; i++) {
                            var selectedClass = terms[i].selected ? 'selected' : '';
                            tagsHtml += '<span class="ckan-modal-tag-def456 ' + selectedClass + '" data-term-id="' + terms[i].id + '">';
                            tagsHtml += terms[i].name;
                            tagsHtml += '</span>';
                        }
                    } else {
                        tagsHtml = '<p>' + ckanTagData.i18n.no_tags + '</p>';
                    }
                    
                    // อัพเดตเนื้อหาใน modal
                    $('.ckan-modal-tags-def456').html(tagsHtml);
                    
                    // เก็บ post ID ไว้ใน modal เพื่อใช้ต่อ
                    $('#ckan-tag-modal-def456').data('post-id', postId);
                    
                    // Clear autocomplete input
                    $('.ckan-autocomplete-input-def456').val('');
                    $('.ckan-autocomplete-results-def456').hide().empty();
                    
                    // แสดง modal
                    $('#ckan-tag-modal-def456').show();
                } else {
                    alert(ckanTagData.i18n.error + ': ' + ckanTagData.i18n.no_tags);
                }
            },
            error: function() {
                alert(ckanTagData.i18n.connection_error);
            }
        });
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
        fetch(ckanTagData.ajax_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'ckan_get_term_info',
                nonce: ckanTagData.nonce,
                term_id: termId
            })
        })
        .then(response => response.json())
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
        
        // Delete term via AJAX
        fetch(ckanTagData.ajax_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'ckan_delete_term',
                nonce: ckanTagData.nonce,
                term_id: currentDeleteTermId,
                transfer_option: transferOption,
                target_term_id: targetTermId || ''
            })
        })
        .then(response => response.json())
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
        
        // Use Fetch API for modern approach
        fetch(ckanTagData.ajax_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'ckan_search_terms',
                nonce: ckanTagData.nonce,
                search: searchQuery
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                let resultsHtml = '';
                
                if (data.data.length > 0) {
                    // แสดงผลลัพธ์ที่พบ
                    data.data.forEach(function(term) {
                        resultsHtml += '<div class="ckan-autocomplete-item-def456" data-term-id="' + term.id + '" data-term-name="' + term.name + '">';
                        resultsHtml += term.name;
                        resultsHtml += '</div>';
                    });
                }
                
                // เพิ่มตัวเลือกสำหรับสร้างใหม่
                resultsHtml += '<div class="ckan-autocomplete-item-def456 create-new" data-create="' + searchQuery + '">';
                resultsHtml += ckanTagData.i18n.create_new + ' "' + searchQuery + '"';
                resultsHtml += '</div>';
                
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
        searchTerms(searchQuery);
    });
    
    // Handle autocomplete item click
    $(document).on('click', '.ckan-autocomplete-item-def456', function() {
        const $item = $(this);
        
        if ($item.hasClass('create-new')) {
            // สร้าง term ใหม่
            const termName = $item.data('create');
            
            fetch(ckanTagData.ajax_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'ckan_create_term',
                    nonce: ckanTagData.nonce,
                    term_name: termName
                })
            })
            .then(response => response.json())
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
    
    // Hide autocomplete results when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.ckan-autocomplete-wrapper-def456').length) {
            $('.ckan-autocomplete-results-def456').hide();
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
        var postId = $('#ckan-tag-modal-def456').data('post-id');
        var selectedTermIds = [];
        
        // เก็บ ID ของ terms ที่เลือกทั้งหมด
        $('.ckan-modal-tag-def456.selected').each(function() {
            selectedTermIds.push($(this).data('term-id'));
        });
        
        // อัพเดต terms ของโพสต์ผ่าน AJAX
        $.ajax({
            url: ckanTagData.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_update_post_terms',
                nonce: ckanTagData.nonce,
                post_id: postId,
                term_ids: selectedTermIds
            },
            beforeSend: function() {
                $('.ckan-save-tags-btn-def456').text(ckanTagData.i18n.saving);
            },
            success: function(response) {
                if (response.success) {
                    // อัพเดตการแสดง tags
                    var tagsHtml = '';
                    var terms = response.data.terms;
                    
                    for (var i = 0; i < terms.length; i++) {
                        tagsHtml += '<span class="ckan-tag-def456" data-term-id="' + terms[i].id + '">';
                        tagsHtml += terms[i].name;
                        
                        // เพิ่มปุ่มลบถ้ามีสิทธิ์
                        if (ckanTagData.can_manage_terms) {
                            tagsHtml += '<span class="ckan-tag-delete-def456" data-term-id="' + terms[i].id + '" data-term-name="' + terms[i].name + '" title="' + ckanTagData.i18n.delete_tag + '">&times;</span>';
                        }
                        
                        tagsHtml += '</span>';
                    }
                    
                    $('.ckan-tags-list-def456').html(tagsHtml);
                    
                    // ปิด modal
                    $('#ckan-tag-modal-def456').hide();
                } else {
                    alert(ckanTagData.i18n.error + ': ' + response.data.message);
                }
            },
            error: function() {
                alert(ckanTagData.i18n.connection_error);
            },
            complete: function() {
                $('.ckan-save-tags-btn-def456').text(ckanTagData.i18n.save);
            }
        });
    });
});