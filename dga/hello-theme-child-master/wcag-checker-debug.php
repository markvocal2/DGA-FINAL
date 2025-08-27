<?php
/**
 * WCAG CHECKER 2.1 AA - DEBUG VERSION
 * ไฟล์นี้ควรบันทึกเป็น /functions/wcag-checker-debug.php ใน Child Theme
 */

// Debug mode
define('WCAG_DEBUG', true);

// Error logging function
function wcag_log_error($message, $data = null) {
    if (WCAG_DEBUG) {
        error_log('[WCAG Checker] ' . $message . ($data ? ' - Data: ' . print_r($data, true) : ''));
    }
}

// Add shortcode
function wcag_compliance_checker_shortcode() {
    wp_enqueue_style('wcag-checker-style', get_stylesheet_directory_uri() . '/css/wcag-checker.css');
    wp_enqueue_script('wcag-checker-script', get_stylesheet_directory_uri() . '/js/wcag-checker.js', array('jquery'), '1.0', true);
    
    wp_localize_script('wcag-checker-script', 'wcagAjax', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('wcag_checker_nonce'),
        'currentUrl' => get_permalink(),
        'debug' => WCAG_DEBUG
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
            
            <!-- Debug panel -->
            ' . (WCAG_DEBUG ? '<div class="wcag-debug" style="margin-top: 20px; padding: 10px; background: #f0f0f0; border: 1px solid #ccc; font-family: monospace; font-size: 12px;"></div>' : '') . '
            
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

// AJAX handler with debug
function wcag_run_compliance_check() {
    wcag_log_error('AJAX request received');
    
    // Check nonce
    if (!check_ajax_referer('wcag_checker_nonce', 'nonce', false)) {
        wcag_log_error('Nonce verification failed');
        wp_send_json_error(array('message' => 'Security check failed'));
        return;
    }
    
    $current_url = isset($_POST['url']) ? esc_url_raw($_POST['url']) : '';
    $severity = isset($_POST['severity']) ? sanitize_text_field($_POST['severity']) : 'medium';
    
    wcag_log_error('Check parameters', array('url' => $current_url, 'severity' => $severity));
    
    try {
        // First test: Check if we can fetch the URL
        $response = wp_remote_get($current_url);
        
        if (is_wp_error($response)) {
            wcag_log_error('Failed to fetch URL', $response->get_error_message());
            wp_send_json_error(array(
                'message' => 'ไม่สามารถเข้าถึง URL ได้: ' . $response->get_error_message(),
                'debug' => $response->get_error_message()
            ));
            return;
        }
        
        $html_content = wp_remote_retrieve_body($response);
        wcag_log_error('HTML content length', strlen($html_content));
        
        // Test simple check without database
        $results = wcag_simple_accessibility_check($html_content);
        
        // Add severity to results
        $results['severity'] = $severity;
        
        wcag_log_error('Check completed', $results);
        wp_send_json_success($results);
        
    } catch (Exception $e) {
        wcag_log_error('Exception occurred', $e->getMessage());
        wp_send_json_error(array(
            'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
            'debug' => $e->getMessage()
        ));
    }
}
add_action('wp_ajax_wcag_check', 'wcag_run_compliance_check');
add_action('wp_ajax_nopriv_wcag_check', 'wcag_run_compliance_check');

// Simple accessibility check for testing
function wcag_simple_accessibility_check($html_content) {
    wcag_log_error('Starting simple accessibility check');
    
    $checks = array(
        'contrast' => array('passed' => true, 'violations' => array(), 'total' => 1),
        'alt_text' => array('passed' => true, 'violations' => array(), 'total' => 1),
        'headers' => array('passed' => true, 'violations' => array(), 'total' => 1),
        'aria' => array('passed' => true, 'violations' => array(), 'total' => 1),
        'keyboard' => array('passed' => true, 'violations' => array(), 'total' => 1),
        'forms' => array('passed' => true, 'violations' => array(), 'total' => 1),
        'links' => array('passed' => true, 'violations' => array(), 'total' => 1)
    );
    
    // Create DOMDocument
    $dom = new DOMDocument();
    libxml_use_internal_errors(true);
    
    // Load HTML
    $loaded = $dom->loadHTML('<?xml encoding="UTF-8">' . $html_content, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    
    if (!$loaded) {
        wcag_log_error('Failed to parse HTML');
        return array(
            'grade' => null,
            'checks' => $checks,
            'score' => 0,
            'error' => 'Failed to parse HTML'
        );
    }
    
    libxml_clear_errors();
    
    // Check for images without alt
    $images = $dom->getElementsByTagName('img');
    $checks['alt_text']['total'] = $images->length > 0 ? $images->length : 1;
    
    foreach ($images as $img) {
        if (!$img->hasAttribute('alt') || trim($img->getAttribute('alt')) === '') {
            $checks['alt_text']['violations'][] = array(
                'message' => 'รูปภาพไม่มี alt text',
                'impact' => 'critical',
                'element' => '<img src="' . htmlspecialchars($img->getAttribute('src')) . '">'
            );
            $checks['alt_text']['passed'] = false;
        }
    }
    
    // Check for empty links
    $links = $dom->getElementsByTagName('a');
    $checks['links']['total'] = $links->length > 0 ? $links->length : 1;
    
    foreach ($links as $link) {
        $text = trim($link->textContent);
        if (empty($text) && !$link->getElementsByTagName('img')->length) {
            $checks['links']['violations'][] = array(
                'message' => 'ลิงก์ว่างเปล่า',
                'impact' => 'serious',
                'element' => htmlspecialchars($dom->saveHTML($link))
            );
            $checks['links']['passed'] = false;
        }
    }
    
    // Check headings structure
    $headings = array();
    for ($i = 1; $i <= 6; $i++) {
        $h_tags = $dom->getElementsByTagName('h' . $i);
        foreach ($h_tags as $h) {
            $headings[] = $i;
        }
    }
    
    if (count($headings) > 0) {
        $checks['headers']['total'] = count($headings);
        // Simple check: look for heading level skips
        sort($headings);
        $prev = 0;
        foreach ($headings as $level) {
            if ($prev > 0 && $level - $prev > 1) {
                $checks['headers']['violations'][] = array(
                    'message' => 'ข้ามระดับหัวข้อจาก H' . $prev . ' ไป H' . $level,
                    'impact' => 'moderate',
                    'element' => 'Heading structure'
                );
                $checks['headers']['passed'] = false;
                break;
            }
            $prev = $level;
        }
    }
    
    // Calculate score
    $total_weight = 0;
    $total_score = 0;
    $weights = array(
        'contrast' => 15,
        'alt_text' => 15,
        'headers' => 10,
        'aria' => 10,
        'keyboard' => 15,
        'forms' => 15,
        'links' => 15
    );
    
    foreach ($checks as $category => $check) {
        $weight = isset($weights[$category]) ? $weights[$category] : 10;
        $total_weight += $weight;
        
        if ($check['total'] > 0) {
            $passed_count = $check['total'] - count($check['violations']);
            $pass_percentage = $passed_count / $check['total'];
            $total_score += $pass_percentage * $weight;
        } else {
            $total_score += $weight;
        }
    }
    
    $score = ($total_score / $total_weight) * 100;
    
    // Determine grade
    $grade = null;
    if ($score >= 90) $grade = 'AAA';
    else if ($score >= 80) $grade = 'AA';
    else if ($score >= 70) $grade = 'A';
    
    wcag_log_error('Check completed', array('score' => $score, 'grade' => $grade));
    
    return array(
        'grade' => $grade,
        'checks' => $checks,
        'score' => $score
    );
}

// Admin page with debug info
function wcag_checker_admin_page() {
    global $wpdb;
    
    ?>
    <div class="wrap">
        <h1>WCAG Checker Settings</h1>
        
        <div class="card">
            <h2>Debug Mode</h2>
            <p>Debug mode is: <strong><?php echo WCAG_DEBUG ? 'ENABLED' : 'DISABLED'; ?></strong></p>
            <?php if (WCAG_DEBUG): ?>
                <p>Check your PHP error log for debug messages.</p>
            <?php endif; ?>
        </div>
        
        <div class="card">
            <h2>System Check</h2>
            <?php
            // Check PHP version
            echo '<p>PHP Version: ' . PHP_VERSION . '</p>';
            
            // Check if DOMDocument is available
            echo '<p>DOMDocument: ' . (class_exists('DOMDocument') ? '✓ Available' : '✗ Not available') . '</p>';
            
            // Check if wp_remote_get works
            $test = wp_remote_get(get_site_url());
            echo '<p>wp_remote_get: ' . (is_wp_error($test) ? '✗ Error: ' . $test->get_error_message() : '✓ Working') . '</p>';
            
            // Check database tables
            $tables = array('checks', 'guidelines', 'check_prerequisites', 'language_text');
            foreach ($tables as $table) {
                $table_name = $wpdb->prefix . $table;
                $exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'") == $table_name;
                echo '<p>Table ' . $table_name . ': ' . ($exists ? '✓ Exists' : '✗ Missing') . '</p>';
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Test Check</h2>
            <p>Current site URL: <code><?php echo get_site_url(); ?></code></p>
            <button id="test-wcag" class="button button-primary">Test WCAG Check</button>
            <div id="test-results" style="margin-top: 20px;">
                <pre style="background: #f0f0f0; padding: 10px; display: none;"></pre>
            </div>
        </div>
    </div>
    
    <script>
    jQuery(document).ready(function($) {
        $('#test-wcag').on('click', function() {
            var $button = $(this);
            var $results = $('#test-results pre');
            
            $button.prop('disabled', true).text('Testing...');
            $results.text('Sending request...').show();
            
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
                    $button.prop('disabled', false).text('Test WCAG Check');
                    $results.text(JSON.stringify(response, null, 2));
                },
                error: function(xhr, status, error) {
                    $button.prop('disabled', false).text('Test WCAG Check');
                    $results.text('Error: ' + status + '\n' + error + '\n\nResponse:\n' + xhr.responseText);
                }
            });
        });
    });
    </script>
    <?php
}

// Add admin menu
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