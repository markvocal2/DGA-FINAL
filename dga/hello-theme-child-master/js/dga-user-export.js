(function($) {
    'use strict';

    // Variables
    let currentPage = 1;
    let totalPages = 1;
    let currentSearch = '';
    let currentRole = '';
    let userData = [];

    // Initialize on document ready
    $(document).ready(function() {
        // Enqueue dashicons if they're not already loaded
        if (typeof wp !== 'undefined' && wp.dashicons) {
            wp.dashicons.init();
        } else {
            // Fallback for dashicons
            $('head').append('<link rel="stylesheet" href="' + (typeof ajaxurl !== 'undefined' ? ajaxurl.replace('admin-ajax.php', '') : '/wp-admin/') + 'css/dashicons.min.css" type="text/css" media="all">');
        }
        
        loadUsers();
        setupEventListeners();
    });

    // Set up event listeners
    function setupEventListeners() {
        // Pagination
        $('#dga-prev-page').on('click', function() {
            if (currentPage > 1) {
                currentPage--;
                loadUsers();
            }
        });

        $('#dga-next-page').on('click', function() {
            if (currentPage < totalPages) {
                currentPage++;
                loadUsers();
            }
        });

        // Search and filter
        let searchTimer;
        $('#dga-search-input').on('input', function() {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function() {
                currentSearch = $('#dga-search-input').val();
                currentPage = 1;
                loadUsers();
            }, 500);
        });

        $('#dga-role-filter').on('change', function() {
            currentRole = $(this).val();
            currentPage = 1;
            loadUsers();
        });

        // Export buttons
        $('#dga-print-button').on('click', function() {
            printUsers();
        });

        $('#dga-csv-button').on('click', function() {
            exportCSV();
        });
    }

    // Load users via AJAX
    function loadUsers() {
        const tbody = $('#dga-user-export-tbody');
        tbody.html('<tr><td colspan="6" class="dga-loading">กำลังโหลดข้อมูลผู้ใช้...</td></tr>');

        $.ajax({
            url: dga_user_export.ajax_url,
            type: 'POST',
            data: {
                action: 'dga_get_users',
                nonce: dga_user_export.nonce,
                page: currentPage,
                search: currentSearch,
                role: currentRole
            },
            success: function(response) {
                if (response.success) {
                    const data = response.data;
                    userData = data.users;
                    totalPages = data.total_pages;
                    currentPage = data.current_page;
                    
                    updatePagination();
                    renderUsers(userData);
                } else {
                    console.error('Error loading users:', response.data);
                    tbody.html('<tr><td colspan="6" class="dga-error">ข้อผิดพลาด: ' + response.data + '</td></tr>');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', status, error);
                if (xhr.responseText) {
                    console.error('Server response:', xhr.responseText);
                }
                tbody.html('<tr><td colspan="6" class="dga-error">ไม่สามารถโหลดข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง</td></tr>');
            }
        });
    }

    // Render users table
    function renderUsers(users) {
        const tbody = $('#dga-user-export-tbody');
        tbody.empty();

        if (users.length === 0) {
            tbody.html('<tr><td colspan="6" class="dga-no-results">ไม่พบข้อมูลผู้ใช้</td></tr>');
            return;
        }

        users.forEach(function(user) {
            const rolesList = user.roles.join(', ');
            let permissionsHtml = '';

            // Format permissions for display
            for (const role in user.permissions) {
                const p = user.permissions[role];
                
                // Create a summary of permissions
                const permissionSummary = [
                    p.read ? '<span class="permission-yes">อ่าน</span>' : '<span class="permission-no">อ่าน</span>',
                    p.write ? '<span class="permission-yes">เขียน</span>' : '<span class="permission-no">เขียน</span>',
                    p.edit ? '<span class="permission-yes">แก้ไข</span>' : '<span class="permission-no">แก้ไข</span>',
                    p.delete ? '<span class="permission-yes">ลบ</span>' : '<span class="permission-no">ลบ</span>',
                    p.publish ? '<span class="permission-yes">เผยแพร่</span>' : '<span class="permission-no">เผยแพร่</span>'
                ].join(' | ');
                
                // Detailed permissions (hidden by default, shown on click)
                const detailsList = p.details.map(function(cap) {
                    return '<li>' + formatCapabilityName(cap) + '</li>';
                }).join('');
                
                permissionsHtml += `
                    <div class="permission-role">
                        <strong>${role}</strong>: ${permissionSummary}
                        <button class="toggle-details">รายละเอียด</button>
                        <ul class="permission-details" style="display:none;">
                            ${detailsList}
                        </ul>
                    </div>
                `;
            }

            const row = `
                <tr data-user-id="${user.ID}">
                    <td>${user.ID}</td>
                    <td>${user.user_login}</td>
                    <td>${user.display_name}</td>
                    <td>${user.user_email}</td>
                    <td>${rolesList}</td>
                    <td class="permissions-cell">${permissionsHtml}</td>
                </tr>
            `;
            
            tbody.append(row);
        });

        // Add click handlers for permission details
        $('.toggle-details').on('click', function(e) {
            e.preventDefault();
            $(this).next('.permission-details').slideToggle();
        });
    }

    // Format capability name for better readability
    function formatCapabilityName(capability) {
        return capability
            .replace(/_/g, ' ')
            .replace(/\b\w/g, function(l) { return l.toUpperCase(); });
    }

    // Update pagination controls
    function updatePagination() {
        $('#dga-page-info').text('หน้า ' + currentPage + ' จาก ' + totalPages);
        $('#dga-prev-page').prop('disabled', currentPage <= 1);
        $('#dga-next-page').prop('disabled', currentPage >= totalPages);
    }

    // Print function
    function printUsers() {
        console.log('Print button clicked, preparing print request...');
        
        // Check if we have data
        if (!userData || userData.length === 0) {
            alert('ไม่มีข้อมูลสำหรับพิมพ์');
            return;
        }
        
        // Use iframe for printing to avoid affecting the main page
        const printFrame = $('<iframe>', {
            name: 'print-frame',
            class: 'print-frame',
            style: 'position:fixed; top:0; left:0; width:100%; height:100%; z-index:-999; visibility:hidden;'
        }).appendTo('body');
        
        // Get current filter state to pass to template
        const templateData = {
            users: userData,
            search: currentSearch,
            role: currentRole,
            pagination: {
                currentPage: currentPage,
                totalPages: totalPages
            }
        };
        
        // Show loading indicator
        const loadingOverlay = $('<div class="dga-loading-overlay"><div class="dga-loading-message">กำลังเตรียมเอกสารสำหรับพิมพ์...</div></div>');
        $('body').append(loadingOverlay);
        
        // Trigger print template via AJAX
        $.ajax({
            url: dga_user_export.ajax_url,
            type: 'POST',
            data: {
                action: 'dga_print_template',
                nonce: dga_user_export.nonce,
                data: JSON.stringify(templateData)
            },
            success: function(response) {
                loadingOverlay.remove();
                console.log('Print response received');
                
                if (response.success) {
                    const printContent = response.data;
                    
                    // Write to iframe and print
                    const frameDoc = printFrame[0].contentDocument || printFrame[0].contentWindow.document;
                    frameDoc.open();
                    frameDoc.write(printContent);
                    frameDoc.close();
                    
                    // Wait for iframe to load completely
                    setTimeout(function() {
                        try {
                            printFrame[0].contentWindow.focus();
                            printFrame[0].contentWindow.print();
                        } catch (e) {
                            console.error('Print error:', e);
                            alert('เกิดข้อผิดพลาดในการพิมพ์: ' + e.message);
                        }
                        
                        // Clean up iframe after printing
                        setTimeout(function() {
                            printFrame.remove();
                        }, 1000);
                    }, 1000);
                } else {
                    console.error('Print template error:', response.data);
                    alert('เกิดข้อผิดพลาดในการเตรียมเอกสารสำหรับพิมพ์: ' + response.data);
                }
            },
            error: function(xhr, status, error) {
                loadingOverlay.remove();
                console.error('AJAX error:', status, error);
                if (xhr.responseText) {
                    console.error('Server response:', xhr.responseText);
                }
                alert('ไม่สามารถสร้างเอกสารสำหรับพิมพ์ได้ โปรดตรวจสอบ Console สำหรับรายละเอียดเพิ่มเติม');
            }
        });
    }

    // Export CSV function
    function exportCSV() {
        // Show loading indicator
        const loadingOverlay = $('<div class="dga-loading-overlay"><div class="dga-loading-message">กำลังเตรียมไฟล์ CSV...</div></div>');
        $('body').append(loadingOverlay);
        
        // Get all users for CSV export (not just current page)
        $.ajax({
            url: dga_user_export.ajax_url,
            type: 'POST',
            data: {
                action: 'dga_get_users',
                nonce: dga_user_export.nonce,
                page: 1,
                per_page: 9999, // Get all users for export
                search: currentSearch,
                role: currentRole
            },
            success: function(response) {
                loadingOverlay.remove();
                
                if (response.success) {
                    const users = response.data.users;
                    let csvContent = "ID,ชื่อผู้ใช้,ชื่อแสดง,อีเมล,บทบาท,อ่าน,เขียน,แก้ไข,ลบ,เผยแพร่\n";
                    
                    // Generate CSV content
                    users.forEach(function(user) {
                        const roles = user.roles.join(' + ');
                        
                        // Aggregate permissions across all roles
                        let read = false, write = false, edit = false, 
                            delete_perm = false, publish = false;
                        
                        for (const role in user.permissions) {
                            const p = user.permissions[role];
                            read = read || p.read;
                            write = write || p.write;
                            edit = edit || p.edit;
                            delete_perm = delete_perm || p.delete;
                            publish = publish || p.publish;
                        }
                        
                        csvContent += [
                            user.ID,
                            '"' + user.user_login.replace(/"/g, '""') + '"',
                            '"' + user.display_name.replace(/"/g, '""') + '"',
                            '"' + user.user_email.replace(/"/g, '""') + '"',
                            '"' + roles.replace(/"/g, '""') + '"',
                            read ? 'ใช่' : 'ไม่',
                            write ? 'ใช่' : 'ไม่',
                            edit ? 'ใช่' : 'ไม่',
                            delete_perm ? 'ใช่' : 'ไม่',
                            publish ? 'ใช่' : 'ไม่'
                        ].join(',') + '\n';
                    });
                    
                    // Create download link with UTF-8 BOM for Thai character support
                    const BOM = '\uFEFF';
                    const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(BOM + csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', 'รายงานสิทธิ์ผู้ใช้-' + new Date().toISOString().slice(0, 10) + '.csv');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    alert('เกิดข้อผิดพลาดในการสร้างไฟล์ CSV: ' + response.data);
                }
            },
            error: function(xhr, status, error) {
                loadingOverlay.remove();
                console.error('CSV export error:', status, error);
                alert('ไม่สามารถสร้างไฟล์ CSV ได้ โปรดลองอีกครั้ง');
            }
        });
    }

})(jQuery);