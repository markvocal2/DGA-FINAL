<?php
/**
 * Role Management AJAX Handlers
 * 
 * @package DepartmentRoleManager
 * @version 1.0.0
 */

// Prevent direct file access
if (!defined('ABSPATH')) {
    exit('Direct script access denied.');
}

/**
 * Register scripts and styles
 */
function register_role_manager_assets() {
    $version = '1.0.0';
    wp_register_style(
        'department-role-styles',
        get_stylesheet_directory_uri() . '/css/department-role.css',
        array(),
        $version
    );

    wp_register_script(
        'department-role-script',
        get_stylesheet_directory_uri() . '/js/department-role.js',
        array('jquery'),
        $version,
        true
    );

    wp_localize_script('department-role-script', 'departmentAjax', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('department_role_nonce')
    ));
}
add_action('init', 'register_role_manager_assets');

/**
 * Enqueue necessary assets
 */
function enqueue_role_manager_assets() {
    if (wp_style_is('department-role-styles', 'registered')) {
        wp_enqueue_style('department-role-styles');
    }
    if (wp_script_is('department-role-script', 'registered')) {
        wp_enqueue_script('department-role-script');
    }
}

/**
 * Generate table HTML
 */
function get_roles_table_html() {
    $roles = wp_roles()->roles;
    $default_roles = array('administrator', 'editor', 'author', 'contributor', 'subscriber');
    
    ob_start();
    ?>
    <table class="roles-table" role="table" aria-label="ตารางแสดงบทบาทผู้ใช้">
        <thead>
            <tr>
                <th scope="col">ชื่อบทบาท</th>
                <th scope="col">จำนวนผู้ใช้</th>
                <th scope="col">การจัดการ</th>
            </tr>
        </thead>
        <tbody>
            <?php 
            foreach ($roles as $role_slug => $role): 
                $user_count = count(get_users(['role' => $role_slug]));
                $is_default = in_array($role_slug, $default_roles);
            ?>
            <tr data-role="<?php echo esc_attr($role_slug); ?>">
                <td>
                    <?php echo esc_html($role['name']); ?>
                    <?php if ($is_default): ?>
                        <span class="role-type">(บทบาทระบบ)</span>
                    <?php endif; ?>
                </td>
                <td><?php echo esc_html($user_count); ?></td>
                <td>
                    <?php if (!$is_default): ?>
                    <div class="action-buttons">
                        <button type="button" 
                                class="edit-role-btn" 
                                aria-label="แก้ไข <?php echo esc_attr($role['name']); ?>"
                                data-role="<?php echo esc_attr($role_slug); ?>">
                            แก้ไข
                        </button>
                        <button type="button" 
                                class="delete-role-btn" 
                                aria-label="ลบ <?php echo esc_attr($role['name']); ?>"
                                data-role="<?php echo esc_attr($role_slug); ?>">
                            ลบ
                        </button>
                    </div>
                    <?php else: ?>
                    <span class="default-role-badge">บทบาทเริ่มต้น</span>
                    <?php endif; ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    <?php
    return ob_get_clean();
}

/**
 * AJAX handler for getting table content
 */
function handle_get_roles_table() {
    check_ajax_referer('department_role_nonce', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error(['message' => 'ไม่มีสิทธิ์ดำเนินการ']);
        return;
    }

    wp_send_json_success([
        'html' => get_roles_table_html()
    ]);
}
add_action('wp_ajax_get_roles_table', 'handle_get_roles_table');

/**
 * AJAX handler for role creation
 */
function handle_department_role_creation() {
    try {
        check_ajax_referer('department_role_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            throw new Exception('ไม่มีสิทธิ์ดำเนินการ');
        }

        if (!isset($_POST['department_name'])) {
            throw new Exception('ไม่พบข้อมูลที่ต้องการ');
        }

        $department_name = sanitize_text_field($_POST['department_name']);

        if (empty($department_name) || strlen($department_name) > 50) {
            throw new Exception('ชื่อแผนกไม่ถูกต้อง');
        }

        if (get_role($department_name) !== null) {
            throw new Exception('ชื่อบทบาทนี้มีอยู่แล้ว');
        }

        $subscriber = get_role('subscriber');
        if (!$subscriber) {
            throw new Exception('ไม่สามารถดึงข้อมูลสิทธิ์พื้นฐานได้');
        }

        $result = add_role($department_name, $department_name, $subscriber->capabilities);
        if (is_null($result)) {
            throw new Exception('ไม่สามารถสร้างบทบาทได้');
        }

        wp_send_json_success(['message' => 'เพิ่มกลุ่มใหม่เรียบร้อย']);

    } catch (Exception $e) {
        wp_send_json_error(['message' => $e->getMessage()]);
    }
}
add_action('wp_ajax_create_department_role', 'handle_department_role_creation');

/**
 * AJAX handler for role deletion
 */
function handle_role_deletion() {
    try {
        check_ajax_referer('department_role_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            throw new Exception('ไม่มีสิทธิ์ดำเนินการ');
        }

        if (!isset($_POST['role'])) {
            throw new Exception('ไม่พบข้อมูลที่ต้องการ');
        }

        $role = sanitize_text_field($_POST['role']);
        $default_roles = array('administrator', 'editor', 'author', 'contributor', 'subscriber');
        
        if (empty($role) || in_array($role, $default_roles)) {
            throw new Exception('ไม่สามารถลบบทบาทเริ่มต้นได้');
        }

        if (!get_role($role)) {
            throw new Exception('ไม่พบบทบาทที่ต้องการลบ');
        }

        $users = get_users(['role' => $role]);
        foreach ($users as $user) {
            $user->set_role('subscriber');
        }
        
        remove_role($role);
        wp_send_json_success(['message' => 'ลบบทบาทเรียบร้อยแล้ว']);

    } catch (Exception $e) {
        wp_send_json_error(['message' => $e->getMessage()]);
    }
}
add_action('wp_ajax_delete_role', 'handle_role_deletion');

/**
 * AJAX handler for role editing
 */
function handle_role_edit() {
    try {
        check_ajax_referer('department_role_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            throw new Exception('ไม่มีสิทธิ์ดำเนินการ');
        }

        if (!isset($_POST['old_role']) || !isset($_POST['new_role'])) {
            throw new Exception('ไม่พบข้อมูลที่ต้องการ');
        }

        $old_role = sanitize_text_field($_POST['old_role']);
        $new_role = sanitize_text_field($_POST['new_role']);
        $default_roles = array('administrator', 'editor', 'author', 'contributor', 'subscriber');
        
        if (empty($old_role) || empty($new_role) || strlen($new_role) > 50) {
            throw new Exception('ข้อมูลไม่ถูกต้อง');
        }

        if (in_array($old_role, $default_roles)) {
            throw new Exception('ไม่สามารถแก้ไขบทบาทเริ่มต้นได้');
        }
        
        if (get_role($new_role) !== null && $new_role !== $old_role) {
            throw new Exception('ชื่อบทบาทนี้มีอยู่แล้ว');
        }

        $role_obj = get_role($old_role);
        if (!$role_obj) {
            throw new Exception('ไม่พบบทบาทที่ต้องการแก้ไข');
        }

        $result = add_role($new_role, $new_role, $role_obj->capabilities);
        if (is_null($result)) {
            throw new Exception('ไม่สามารถสร้างบทบาทใหม่ได้');
        }
        
        $users = get_users(['role' => $old_role]);
        foreach ($users as $user) {
            $user->set_role($new_role);
        }
        
        remove_role($old_role);
        wp_send_json_success(['message' => 'อัปเดตบทบาทเรียบร้อยแล้ว']);

    } catch (Exception $e) {
        wp_send_json_error(['message' => $e->getMessage()]);
    }
}
add_action('wp_ajax_edit_role', 'handle_role_edit');

/**
 * Shortcode handlers
 */
function department_role_manager_shortcode() {
    if (!current_user_can('manage_options')) {
        return '<p>คุณไม่มีสิทธิ์เข้าถึงส่วนนี้</p>';
    }

    wp_enqueue_style('department-role-styles');
    wp_enqueue_script('department-role-script');

    ob_start();
    ?>
    <div class="department-role-container">
        <form id="department-role-form" class="department-form">
            <?php wp_nonce_field('create_department_role', 'department_role_nonce'); ?>
            <div class="form-group">
                <label for="department_name" class="form-label">ชื่อแผนก</label>
                <input type="text" 
                       id="department_name" 
                       name="department_name" 
                       class="form-input" 
                       aria-label="ชื่อแผนก" 
                       aria-required="true"
                       maxlength="50"
                       pattern="[a-zA-Z0-9ก-๙\s-_]+"
                       required>
                <span class="error-message" aria-live="polite"></span>
            </div>
            <button type="submit" class="submit-btn" aria-label="เพิ่มแผนก">เพิ่มแผนก</button>
        </form>
        <div id="toast" class="toast" role="alert" aria-live="polite"></div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('department_role_manager', 'department_role_manager_shortcode');

function department_role_table_manager_shortcode() {
    if (!current_user_can('manage_options')) {
        return '<p>คุณไม่มีสิทธิ์เข้าถึงส่วนนี้</p>';
    }

    wp_enqueue_style('department-role-styles');
    wp_enqueue_script('department-role-script');

    ob_start();
    ?>
    <div class="roles-table-container">
        <div class="roles-table-wrapper">
            <?php echo get_roles_table_html(); ?>
        </div>
    </div>

    <!-- Edit Role Modal -->
    <div id="edit-role-modal" class="modal" aria-hidden="true">
        <div class="modal-content" role="dialog" aria-labelledby="modal-title">
            <h2 id="modal-title">แก้ไขบทบาท</h2>
            <form id="edit-role-form">
                <input type="hidden" id="original-role-name" name="original_role_name">
                <div class="form-group">
                    <label for="edit-role-name">ชื่อบทบาท</label>
                    <input type="text" 
                           id="edit-role-name" 
                           name="role_name" 
                           required 
                           aria-required="true" 
                           maxlength="50">
                    <span class="error-message" aria-live="polite"></span>
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-btn" aria-label="ยกเลิก">ยกเลิก</button>
                    <button type="submit" class="save-btn" aria-label="บันทึก">บันทึก</button>
                </div>
            </form>
        </div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('department_role_table_manager', 'department_role_table_manager_shortcode');

/**
 * Utility Functions
 */
function is_valid_role_name($name) {
    if (empty($name) || strlen($name) > 50) {
        return false;
    }
    
    // Check for valid characters (letters, numbers, Thai characters, spaces, hyphens, and underscores)
    return preg_match('/^[a-zA-Z0-9ก-๙\s-_]+$/', $name);
}

function get_safe_role_name($name) {
    // Remove any characters that aren't alphanumeric, spaces, hyphens, or underscores
    $safe_name = preg_replace('/[^a-zA-Z0-9\s-_]/', '', $name);
    
    // Convert spaces to underscores
    $safe_name = str_replace(' ', '_', $safe_name);
    
    // Remove multiple consecutive underscores
    $safe_name = preg_replace('/_+/', '_', $safe_name);
    
    // Trim underscores from beginning and end
    $safe_name = trim($safe_name, '_');
    
    // Ensure the name isn't empty and doesn't exceed 50 characters
    if (empty($safe_name)) {
        $safe_name = 'role_' . time();
    }
    
    return substr($safe_name, 0, 50);
}

/**
 * Error Handling Functions
 */
function log_role_error($message, $context = array()) {
    if (defined('WP_DEBUG') && WP_DEBUG === true) {
        error_log(sprintf(
            '[Department Role Manager] %s | Context: %s',
            $message,
            json_encode($context)
        ));
    }
}

/**
 * Initialize the modal functionality
 */
function init_role_modal() {
    ?>
    <script type="text/javascript">
    jQuery(document).ready(function($) {
        // Close modal when clicking outside
        $(window).on('click', function(e) {
            if ($(e.target).hasClass('modal')) {
                closeModal();
            }
        });

        // Close modal when pressing ESC
        $(document).on('keydown', function(e) {
            if (e.keyCode === 27) { // ESC key
                closeModal();
            }
        });

        function closeModal() {
            $('#edit-role-modal')
                .attr('aria-hidden', 'true')
                .removeClass('modal-visible');
            $('#edit-role-name').val('');
            $('.error-message').text('');
        }

        // Make closeModal available globally
        window.closeRoleModal = closeModal;
    });
    </script>
    <?php
}
add_action('wp_footer', 'init_role_modal');

/**
 * Plugin Activation/Deactivation
 */
function activate_role_manager() {
    // Ensure subscriber role exists
    add_role('subscriber', 'Subscriber', array(
        'read' => true
    ));
}
register_activation_hook(__FILE__, 'activate_role_manager');

function deactivate_role_manager() {
    // Clean up if necessary
    // Note: We don't remove custom roles on deactivation
    // as that could break user access
}
register_deactivation_hook(__FILE__, 'deactivate_role_manager');

/**
 * Admin Notices
 */
function role_manager_admin_notices() {
    if (!current_user_can('manage_options')) {
        return;
    }

    $subscriber = get_role('subscriber');
    if (!$subscriber) {
        ?>
        <div class="notice notice-error">
            <p>
                Role Manager: ไม่พบบทบาท Subscriber ซึ่งจำเป็นสำหรับการทำงานของระบบ 
                กรุณาติดต่อผู้ดูแลระบบ
            </p>
        </div>
        <?php
    }

    $css_path = get_stylesheet_directory() . '/css/department-role.css';
    $js_path = get_stylesheet_directory() . '/js/department-role.js';

    if (!file_exists($css_path) || !file_exists($js_path)) {
        ?>
        <div class="notice notice-warning">
            <p>
                Role Manager: ไม่พบไฟล์ CSS หรือ JavaScript ที่จำเป็น 
                กรุณาตรวจสอบว่าไฟล์ต่อไปนี้มีอยู่ในธีมลูก:
            </p>
            <ul style="list-style-type: disc; margin-left: 20px;">
                <?php if (!file_exists($css_path)): ?>
                    <li>/css/department-role.css</li>
                <?php endif; ?>
                <?php if (!file_exists($js_path)): ?>
                    <li>/js/department-role.js</li>
                <?php endif; ?>
            </ul>
        </div>
        <?php
    }
}
add_action('admin_notices', 'role_manager_admin_notices');

// Get role capabilities
add_action('wp_ajax_get_role_capabilities', 'handle_get_role_capabilities');
function handle_get_role_capabilities() {
    // ตรวจสอบ nonce
    if (!check_ajax_referer('department_role_nonce', 'nonce', false)) {
        wp_send_json_error(array('message' => 'Invalid security token'));
    }

    // ตรวจสอบสิทธิ์
    if (!current_user_can('manage_options')) {
        wp_send_json_error(array('message' => 'Permission denied'));
    }

    $role_name = sanitize_text_field($_POST['role']);
    $role = get_role($role_name);

    if (!$role) {
        wp_send_json_error(array('message' => 'Role not found'));
    }

    wp_send_json_success(array(
        'capabilities' => $role->capabilities
    ));
}

// Update role capabilities
add_action('wp_ajax_update_role_capabilities', 'handle_update_role_capabilities');
function handle_update_role_capabilities() {
    // ตรวจสอบ nonce
    if (!check_ajax_referer('department_role_nonce', 'nonce', false)) {
        wp_send_json_error(array('message' => 'Invalid security token'));
    }

    // ตรวจสอบสิทธิ์
    if (!current_user_can('manage_options')) {
        wp_send_json_error(array('message' => 'Permission denied'));
    }

    $role_name = sanitize_text_field($_POST['role']);
    $capabilities = isset($_POST['capabilities']) ? $_POST['capabilities'] : array();

    // ตรวจสอบว่าเป็น role เริ่มต้นหรือไม่
    if (in_array($role_name, array('administrator', 'editor', 'author', 'contributor', 'subscriber'))) {
        wp_send_json_error(array('message' => 'Cannot modify default WordPress roles'));
    }

    $role = get_role($role_name);
    if (!$role) {
        wp_send_json_error(array('message' => 'Role not found'));
    }

    // อัพเดท capabilities
    foreach ($capabilities as $cap => $grant) {
        if ($grant) {
            $role->add_cap($cap);
        } else {
            $role->remove_cap($cap);
        }
    }

    wp_send_json_success(array('message' => 'Capabilities updated successfully'));
}

// End of file
?>