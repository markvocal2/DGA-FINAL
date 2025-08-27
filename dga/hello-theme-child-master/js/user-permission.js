jQuery(document).ready(function($) {
    const user_permission_controller = {
        roles: {},
        isLoading: false,

        init: function() {
            this.bindEvents();
            this.checkPagePermissions();
        },

        bindEvents: function() {
            $(document).on('click', '.user-permission-icon', this.toggleSettingsPanel);
            $('body').on('click', '#user-permission-save', this.savePermissions);
            $('body').on('click', '#user-permission-login-btn', this.showLoginForm);
            $('body').on('click', '#user-permission-home-btn', this.redirectToHome);  // เพิ่ม event สำหรับปุ่มกลับหน้าหลัก
            $('body').on('submit', '#user-permission-login', this.handleLogin);
            $('body').on('click', '.user-permission-close', this.closePanel);
            $('body').on('click', '.cancel-btn', this.cancelLogin);
            
            // ป้องกันการ scroll เมื่อมี overlay
            if ($('.user-permission-overlay').length > 0) {
                $('body').addClass('no-scroll');
            }
        },

        toggleSettingsPanel: function(e) {
            e.preventDefault();
            const pageId = $(this).data('page-id');
            const panel = $('#user-permission-panel');
            
            if (panel.length === 0) {
                user_permission_controller.createSettingsPanel(pageId);
            } else {
                user_permission_controller.closePanel();
            }
        },

        closePanel: function() {
            const panel = $('#user-permission-panel');
            panel.removeClass('show');
            setTimeout(() => {
                panel.remove();
            }, 300);
        },

        createSettingsPanel: function(pageId) {
            $('#user-permission-panel').remove();

            const panel = `
                <div id="user-permission-panel" class="user-permission-panel">
                    <button class="user-permission-close" title="ปิด">×</button>
                    <h3>ตั้งค่าการเข้าถึง</h3>
                    <div class="user-permission-roles">
                        <div class="role-list">
                            <h4>บทบาทที่อนุญาต:</h4>
                            <div id="role-checkboxes">
                                <div class="loading-spinner">กำลังโหลด...</div>
                            </div>
                        </div>
                    </div>
                    <button id="user-permission-save" class="user-permission-save">บันทึก</button>
                </div>
            `;
            
            const panel_element = $(panel).appendTo('body');
            panel_element.css('display', 'block');
            
            requestAnimationFrame(() => {
                panel_element.addClass('show');
            });

            this.loadAllRoles(pageId);
        },

        loadAllRoles: function(pageId) {
            if (this.isLoading) return;
            this.isLoading = true;

            $.ajax({
                url: userPermissionAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'get_all_roles',
                    nonce: userPermissionAjax.nonce
                },
                success: (response) => {
                    if (response.success && response.data.roles) {
                        this.roles = response.data.roles;
                        this.renderRoleCheckboxes();
                        this.loadExistingSettings(pageId);
                    } else {
                        this.showToast('ไม่สามารถโหลดข้อมูลบทบาทได้', 'error');
                    }
                },
                error: () => {
                    $('#role-checkboxes').html('<div class="error-message">เกิดข้อผิดพลาดในการโหลดบทบาท</div>');
                    this.showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
                },
                complete: () => {
                    this.isLoading = false;
                }
            });
        },

        renderRoleCheckboxes: function() {
            // เพิ่มตัวเลือกสำหรับผู้ใช้ที่ไม่ได้ล็อกอิน (guest users)
            let checkboxesHtml = `
                <label class="role-checkbox guest-role">
                    <input type="checkbox" name="roles[]" value="guest">
                    <span class="role-name">บุคคลทั่วไป (ไม่ต้องล็อกอิน)</span>
                </label>
                <div class="role-divider"></div>
            `;
            
            // เพิ่ม roles อื่นๆ ที่มีอยู่แล้ว
            checkboxesHtml += Object.entries(this.roles).map(([roleKey, roleData]) => `
                <label class="role-checkbox">
                    <input type="checkbox" name="roles[]" value="${roleKey}">
                    <span class="role-name">${roleData.name}</span>
                </label>
            `).join('');
            
            $('#role-checkboxes').html(checkboxesHtml);
        },

        loadExistingSettings: function(pageId) {
            $.ajax({
                url: userPermissionAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'get_page_permissions',
                    page_id: pageId,
                    nonce: userPermissionAjax.nonce
                },
                success: (response) => {
                    if (response.success && response.data) {
                        const { roles } = response.data;
                        if (Array.isArray(roles)) {
                            roles.forEach(role => {
                                $(`input[name="roles[]"][value="${role}"]`).prop('checked', true);
                            });
                        }
                    }
                },
                error: () => {
                    this.showToast('ไม่สามารถโหลดการตั้งค่าที่มีอยู่', 'error');
                }
            });
        },

        savePermissions: function() {
            if (user_permission_controller.isLoading) return;
            
            const pageId = $('.user-permission-icon').data('page-id');
            const saveBtn = $(this);
            const originalText = saveBtn.text();
            const roles = [];
            
            $('input[name="roles[]"]:checked').each(function() {
                roles.push($(this).val());
            });

            user_permission_controller.isLoading = true;
            saveBtn.prop('disabled', true).text('กำลังบันทึก...');

            $.ajax({
                url: userPermissionAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'update_page_permissions',
                    nonce: userPermissionAjax.nonce,
                    page_id: pageId,
                    roles: roles
                },
                success: function(response) {
                    if (response.success) {
                        user_permission_controller.showToast('บันทึกการตั้งค่าเรียบร้อยแล้ว');
                        user_permission_controller.closePanel();
                    } else {
                        user_permission_controller.showToast('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
                    }
                },
                error: function() {
                    user_permission_controller.showToast('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
                },
                complete: function() {
                    saveBtn.prop('disabled', false).text(originalText);
                    user_permission_controller.isLoading = false;
                }
            });
        },

        checkPagePermissions: function() {
            const pageId = $('.user-permission-icon').data('page-id');
            if (!pageId) return;
            
            $('.protected-content').hide();
            
            $.ajax({
                url: userPermissionAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'check_page_permissions',
                    page_id: pageId,
                    nonce: userPermissionAjax.nonce
                },
                success: (response) => {
                    if (response.success && response.data && response.data.allowed) {
                        $('.protected-content').fadeIn();
                        $('.user-permission-overlay').remove();
                        $('body').removeClass('no-scroll');
                    } else {
                        this.showBlurOverlay();
                    }
                },
                error: () => {
                    this.showBlurOverlay();
                }
            });
        },

        showBlurOverlay: function() {
            if ($('.user-permission-overlay').length) {
                $('body').addClass('no-scroll'); // ล็อค scroll
                return;
            }

            const overlay = `
                <div class="user-permission-overlay">
                    <div class="user-permission-modal">
                        <div class="modal-header">
                            <div class="lock-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                            </div>
                        </div>
                        <div class="user-permission-message">
                            <h2>การเข้าถึงถูกจำกัด</h2>
                            <p>หน้านี้ต้องการสิทธิ์พิเศษในการเข้าถึง</p>
                            <div class="button-group">
                                <button id="user-permission-login-btn" class="user-permission-login-btn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                        <polyline points="10 17 15 12 10 7"></polyline>
                                        <line x1="15" y1="12" x2="3" y2="12"></line>
                                    </svg>
                                    ลงชื่อเข้าใช้
                                </button>
                                <button id="user-permission-home-btn" class="user-permission-home-btn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                    </svg>
                                    กลับสู่หน้าหลัก
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            $('body').append(overlay).addClass('no-scroll'); // ล็อค scroll
        },

        showLoginForm: function() {
            const loginForm = `
                <div class="user-permission-login-form">
                    <h3>เข้าสู่ระบบ</h3>
                    <form id="user-permission-login">
                        <div class="form-group">
                            <input type="text" name="username" placeholder="ชื่อผู้ใช้" required>
                        </div>
                        <div class="form-group">
                            <input type="password" name="password" placeholder="รหัสผ่าน" required>
                        </div>
                        <div class="button-group vertical">
                            <button type="submit" class="login-btn">เข้าสู่ระบบ</button>
                            <button type="button" class="cancel-btn">ยกเลิก</button>
                        </div>
                    </form>
                </div>
            `;
            
            $('.user-permission-modal').html(loginForm);
        },

        cancelLogin: function() {
            $('.user-permission-modal').html(`
                <div class="modal-header">
                    <div class="lock-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>
                </div>
                <div class="user-permission-message">
                    <h2>การเข้าถึงถูกจำกัด</h2>
                    <p>หน้านี้ต้องการสิทธิ์พิเศษในการเข้าถึง</p>
                    <div class="button-group">
                        <button id="user-permission-login-btn" class="user-permission-login-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                <polyline points="10 17 15 12 10 7"></polyline>
                                <line x1="15" y1="12" x2="3" y2="12"></line>
                            </svg>
                            ลงชื่อเข้าใช้
                        </button>
                        <button id="user-permission-home-btn" class="user-permission-home-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            กลับสู่หน้าหลัก
                        </button>
                    </div>
                </div>
            `);
        },

        redirectToHome: function() {
            window.location.href = userPermissionAjax.homeUrl;
        },

        handleLogin: function(e) {
            e.preventDefault();
            
            if (user_permission_controller.isLoading) return;
            
            const form = $(this);
            const submitBtn = form.find('button[type="submit"]');
            const originalBtnText = submitBtn.text();
            
            user_permission_controller.isLoading = true;
            submitBtn.prop('disabled', true).text('กำลังเข้าสู่ระบบ...');
            
            $.ajax({
                url: userPermissionAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'user_permission_login',
                    username: form.find('input[name="username"]').val(),
                    password: form.find('input[name="password"]').val(),
                    nonce: userPermissionAjax.nonce
                },
                success: (response) => {
                    if (response.success) {
                        user_permission_controller.showToast('เข้าสู่ระบบสำเร็จ');
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    } else {
                        submitBtn.prop('disabled', false).text(originalBtnText);
                        user_permission_controller.showToast('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'error');
                    }
                },
                error: () => {
                    submitBtn.prop('disabled', false).text(originalBtnText);
                    user_permission_controller.showToast('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
                },
                complete: () => {
                    user_permission_controller.isLoading = false;
                }
            });
        },

        showToast: function(message, type = 'success') {
            $('.user-permission-toast').remove();
            
            const toast = $(`
                <div class="user-permission-toast ${type}">
                    ${message}
                </div>
            `).appendTo('body');
            
            // Trigger reflow and add show class
            toast[0].offsetHeight;
            toast.addClass('show');
            
            setTimeout(() => {
                toast.removeClass('show');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 3000);
        }
    };

    // Initialize the controller
    user_permission_controller.init();
});