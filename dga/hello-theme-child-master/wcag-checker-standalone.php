<?php
/**
 * WCAG CHECKER 2.1 AA - STANDALONE INTEGRATION
 * ไฟล์นี้ควรบันทึกเป็น /functions/wcag-checker-standalone.php ใน Child Theme
 */

// Include ACheckerStandalone class
require_once get_stylesheet_directory() . '/achecker/ACheckerStandalone.class.php';

// Add shortcode
function wcag_compliance_checker_shortcode() {
    wp_enqueue_style('wcag-checker-style', get_stylesheet_directory_uri() . '/css/wcag-checker.css');
    wp_enqueue_script('wcag-checker-script', get_stylesheet_directory_uri() . '/js/wcag-checker.js', array('jquery'), '1.0', true);
    
    wp_localize_script('wcag-checker-script', 'wcagAjax', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('wcag_checker_nonce'),
        'currentUrl' => get_permalink() // ส่ง URL ปัจจุบันไปยัง JavaScript
    ));
    
    $output = '
        <div class="wcag-checker-container">
            <div class="wcag-results">
                <div class="wcag-grade"></div>
                <button class="wcag-check-now">ตรวจสอบเลย</button>
                <button class="wcag-details-toggle" style="display: none;">แสดงรายละเอียด</button>
                <div class="wcag-details" style="display: none;"></div>
            </div>
            <div class="wcag-loading">
                <div class="wcag-spinner"></div>
                <div>กำลังตรวจสอบ...</div>
            </div>
            
            <!-- Modal Popup -->
            <div id="wcag-modal" class="wcag-modal">
                <div class="wcag-modal-content">
                    <span class="wcag-modal-close">&times;</span>
                    <div id="wcag-modal-content"></div>
                </div>
            </div>
        </div>
    ';
    
    return $output;
}
add_shortcode('wcag_checker', 'wcag_compliance_checker_shortcode');

// AJAX handler for WCAG check
function wcag_run_compliance_check() {
    check_ajax_referer('wcag_checker_nonce', 'nonce');
    
    $current_url = isset($_POST['url']) ? esc_url_raw($_POST['url']) : get_permalink();
    $severity = isset($_POST['severity']) ? sanitize_text_field($_POST['severity']) : 'medium';
    
    try {
        // ใช้ ACheckerStandalone สำหรับตรวจสอบ
        $results = wcag_achecker_standalone_validate($current_url);
        
        if (isset($results['error'])) {
            wp_send_json_error(array('message' => $results['error']));
            return;
        }
        
        // เพิ่ม severity ลงในผลลัพธ์
        $results['severity'] = $severity;
        
        wp_send_json_success($results);
    } catch (Exception $e) {
        wp_send_json_error(array('message' => $e->getMessage()));
    }
}
add_action('wp_ajax_wcag_check', 'wcag_run_compliance_check');
add_action('wp_ajax_nopriv_wcag_check', 'wcag_run_compliance_check');

// Admin menu สำหรับจัดการ WCAG Checker
function wcag_checker_admin_menu() {
    add_options_page(
        'WCAG Checker',
        'WCAG Checker',
        'manage_options',
        'wcag-checker',
        'wcag_checker_admin_page'
    );
}
add_action('admin_menu', 'wcag_checker_admin_menu');

// Admin page
function wcag_checker_admin_page() {
    global $wpdb;
    
    // ตรวจสอบ tables
    $tables_exist = true;
    $required_tables = ['checks', 'guidelines', 'check_prerequisites', 'language_text'];
    $missing_tables = [];
    
    foreach ($required_tables as $table) {
        $table_name = $wpdb->prefix . $table;
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            $tables_exist = false;
            $missing_tables[] = $table;
        }
    }
    
    ?>
    <div class="wrap">
        <h1>WCAG Checker Settings</h1>
        
        <div class="card">
            <h2>Database Status</h2>
            <?php if ($tables_exist): ?>
                <p style="color: green;">✓ ตาราง AChecker ถูกติดตั้งเรียบร้อยแล้ว</p>
            <?php else: ?>
                <p style="color: red;">✗ ตารางที่ขาดหาย: <?php echo implode(', ', $missing_tables); ?></p>
                <p>กรุณา import ไฟล์ achecker_schema.sql เข้าสู่ database ของคุณ</p>
            <?php endif; ?>
        </div>
        
        <div class="card">
            <h2>ตรวจสอบการทำงาน</h2>
            <?php
            // ตรวจสอบจำนวน checks
            $checks_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}checks");
            $guidelines_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}guidelines");
            ?>
            <p>จำนวน Checks: <?php echo $checks_count ?: 0; ?></p>
            <p>จำนวน Guidelines: <?php echo $guidelines_count ?: 0; ?></p>
        </div>
        
        <div class="card">
            <h2>วิธีใช้งาน</h2>
            <p>ใช้ shortcode <code>[wcag_checker]</code> เพื่อเพิ่มตัวตรวจสอบ WCAG ในหน้าหรือโพสต์ใดๆ</p>
            <p>ระบบจะตรวจสอบ URL ปัจจุบันโดยอัตโนมัติเมื่อหน้าโหลด</p>
            <p>ผู้ใช้สามารถกด "ตรวจสอบเลย" เพื่อตรวจสอบซ้ำได้</p>
        </div>
        
        <div class="card">
            <h2>ทดสอบการทำงาน</h2>
            <p>URL ปัจจุบัน: <code><?php echo get_site_url(); ?></code></p>
            <button id="test-achecker" class="button button-primary">ทดสอบ AChecker</button>
            <div id="test-results" style="margin-top: 20px;"></div>
        </div>
    </div>
    
    <script>
    jQuery(document).ready(function($) {
        $('#test-achecker').on('click', function() {
            var $button = $(this);
            var $results = $('#test-results');
            
            $button.prop('disabled', true).text('กำลังทดสอบ...');
            $results.html('<p>กำลังทดสอบการทำงาน...</p>');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'wcag_check',
                    url: '<?php echo get_site_url(); ?>',
                    severity: 'medium',
                    nonce: '<?php echo wp_create_nonce('wcag_checker_nonce'); ?>'
                },
                success: function(response) {
                    $button.prop('disabled', false).text('ทดสอบ AChecker');
                    
                    if (response.success) {
                        var html = '<h4>ผลการทดสอบ:</h4>';
                        html += '<p>Grade: ' + (response.data.grade || 'N/A') + '</p>';
                        html += '<p>Score: ' + Math.round(response.data.score) + '%</p>';
                        html += '<ul>';
                        
                        for (var check in response.data.checks) {
                            var result = response.data.checks[check];
                            html += '<li>' + check + ': ' + 
                                    (result.passed ? 'ผ่าน' : 'ไม่ผ่าน') + 
                                    ' (' + result.violations.length + ' ปัญหา)</li>';
                        }
                        
                        html += '</ul>';
                        $results.html(html);
                    } else {
                        $results.html('<p style="color: red;">เกิดข้อผิดพลาด: ' + 
                                     response.data.message + '</p>');
                    }
                },
                error: function() {
                    $button.prop('disabled', false).text('ทดสอบ AChecker');
                    $results.html('<p style="color: red;">ไม่สามารถเชื่อมต่อกับ server ได้</p>');
                }
            });
        });
    });
    </script>
    <?php
}

// ฟังก์ชันสำหรับดึงข้อมูล checks จาก database
function wcag_get_all_checks() {
    global $wpdb;
    
    $checks = $wpdb->get_results("
        SELECT c.*, lt.text as error_text
        FROM {$wpdb->prefix}checks c
        LEFT JOIN {$wpdb->prefix}language_text lt ON c.err = lt.term
        WHERE lt.language_code = 'eng' OR lt.language_code IS NULL
    ", ARRAY_A);
    
    return $checks;
}

// ฟังก์ชันสำหรับดึง guideline mapping
function wcag_get_guideline_checks($guideline_abbr = 'WCAG2-AA') {
    global $wpdb;
    
    $checks = $wpdb->get_col($wpdb->prepare("
        SELECT DISTINCT c.check_id
        FROM {$wpdb->prefix}checks c
        JOIN {$wpdb->prefix}checks_guidelines cg ON c.check_id = cg.check_id
        JOIN {$wpdb->prefix}guidelines g ON cg.guideline_id = g.guideline_id
        WHERE g.abbr = %s
    ", $guideline_abbr));
    
    return $checks;
}