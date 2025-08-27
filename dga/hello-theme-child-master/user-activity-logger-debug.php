<?php
/**
 * User Activity Logger Debug Tool
 * 
 * Add this code to your functions.php to help debug activity logging issues
 */

// Shortcode for debugging the logger
add_shortcode('debug_activity_logger', 'debug_activity_logger_shortcode');
function debug_activity_logger_shortcode() {
    ob_start();
    ?>
    <div class="debug-logger-container">
        <h2>Activity Logger Debug</h2>
        
        <div class="debug-section">
            <h3>1. Test Activity Logging</h3>
            <p>Click the buttons below to manually trigger activity logging:</p>
            <button id="test-view-activity" class="debug-btn">Log View Activity</button>
            <button id="test-add-activity" class="debug-btn">Log Add Activity</button>
            <button id="test-edit-activity" class="debug-btn">Log Edit Activity</button>
            <button id="test-delete-activity" class="debug-btn">Log Delete Activity</button>
            <div id="log-result" class="debug-result"></div>
        </div>
        
        <div class="debug-section">
            <h3>2. Check Database</h3>
            <p>This section shows the raw data from your activity logs table:</p>
            <div class="debug-table-container">
                <?php
                global $wpdb;
                $table_name = $wpdb->prefix . 'user_activity_logs';
                
                // Check if table exists
                $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'") === $table_name;
                
                if (!$table_exists) {
                    echo '<div class="debug-error">Error: Table does not exist! Please activate the plugin to create the table.</div>';
                } else {
                    // Get the latest 10 records
                    $logs = $wpdb->get_results("SELECT * FROM $table_name ORDER BY activity_date DESC LIMIT 10");
                    
                    if (empty($logs)) {
                        echo '<div class="debug-warning">No logs found in the database.</div>';
                    } else {
                        echo '<table class="debug-table">';
                        echo '<thead><tr><th>ID</th><th>User</th><th>Date/Time</th><th>IP Address</th><th>Action</th></tr></thead>';
                        echo '<tbody>';
                        foreach ($logs as $log) {
                            echo '<tr>';
                            echo '<td>' . esc_html($log->id) . '</td>';
                            echo '<td>' . esc_html($log->user_name) . '</td>';
                            echo '<td>' . esc_html($log->activity_date) . '</td>';
                            echo '<td>' . esc_html($log->ip_address) . '</td>';
                            echo '<td>' . esc_html($log->action_type) . '</td>';
                            echo '</tr>';
                        }
                        echo '</tbody></table>';
                    }
                }
                ?>
            </div>
        </div>
        
        <div class="debug-section">
            <h3>3. System Information</h3>
            <div class="debug-info">
                <p><strong>WordPress Version:</strong> <?php echo esc_html(get_bloginfo('version')); ?></p>
                <p><strong>PHP Version:</strong> <?php echo esc_html(PHP_VERSION); ?></p>
                <p><strong>jQuery Loaded:</strong> <span id="jquery-loaded">Checking...</span></p>
                <p><strong>Current User:</strong> <?php 
                    $current_user = wp_get_current_user();
                    echo $current_user->ID ? esc_html($current_user->display_name) : 'Guest (Not logged in)';
                ?></p>
                <p><strong>AJAX URL:</strong> <?php echo esc_url(admin_url('admin-ajax.php')); ?></p>
                <p><strong>User IP:</strong> <?php echo esc_html($_SERVER['REMOTE_ADDR']); ?></p>
            </div>
        </div>
        
        <div class="debug-section">
            <h3>4. Force Log Creation</h3>
            <p>Click this button to directly insert a test log entry into the database:</p>
            <button id="force-insert-log" class="debug-btn">Insert Test Log</button>
            <div id="force-result" class="debug-result"></div>
        </div>
    </div>
    
    <script>
    jQuery(document).ready(function($) {
        // Check if jQuery is loaded
        $('#jquery-loaded').text('Yes');
        
        // Test activity logging
        $('#test-view-activity').on('click', function() {
            logTestActivity('view_content');
        });
        
        $('#test-add-activity').on('click', function() {
            logTestActivity('add_content');
        });
        
        $('#test-edit-activity').on('click', function() {
            logTestActivity('edit_content');
        });
        
        $('#test-delete-activity').on('click', function() {
            logTestActivity('delete_content');
        });
        
        function logTestActivity(actionType) {
            $('#log-result').html('<div class="loading">Sending request...</div>');
            
            $.ajax({
                url: '<?php echo admin_url('admin-ajax.php'); ?>',
                type: 'POST',
                data: {
                    action: 'log_user_activity',
                    nonce: '<?php echo wp_create_nonce('user_activity_logger_nonce'); ?>',
                    user_name: '<?php echo is_user_logged_in() ? wp_get_current_user()->display_name : 'Guest'; ?>',
                    action_type: actionType
                },
                success: function(response) {
                    if (response.success) {
                        $('#log-result').html('<div class="success">Success! Activity logged.</div>');
                        // Reload the page after 2 seconds to show the new log
                        setTimeout(function() {
                            location.reload();
                        }, 2000);
                    } else {
                        $('#log-result').html('<div class="error">Error: ' + (response.data || 'Unknown error') + '</div>');
                    }
                },
                error: function(xhr, status, error) {
                    $('#log-result').html('<div class="error">AJAX Error: ' + error + '</div>');
                    console.error('Full error:', xhr.responseText);
                }
            });
        }
        
        // Force insert log
        $('#force-insert-log').on('click', function() {
            $('#force-result').html('<div class="loading">Inserting test log...</div>');
            
            $.ajax({
                url: '<?php echo admin_url('admin-ajax.php'); ?>',
                type: 'POST',
                data: {
                    action: 'force_insert_test_log',
                    nonce: '<?php echo wp_create_nonce('force_insert_test_log_nonce'); ?>'
                },
                success: function(response) {
                    if (response.success) {
                        $('#force-result').html('<div class="success">Success! Test log inserted.</div>');
                        // Reload the page after 2 seconds
                        setTimeout(function() {
                            location.reload();
                        }, 2000);
                    } else {
                        $('#force-result').html('<div class="error">Error: ' + (response.data || 'Unknown error') + '</div>');
                    }
                },
                error: function(xhr, status, error) {
                    $('#force-result').html('<div class="error">AJAX Error: ' + error + '</div>');
                }
            });
        });
    });
    </script>
    
    <style>
    .debug-logger-container {
        background: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        margin: 20px 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    .debug-logger-container h2 {
        color: #1a237e;
        border-bottom: 2px solid #1a237e;
        padding-bottom: 10px;
        margin-top: 0;
    }
    
    .debug-section {
        margin-bottom: 30px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 5px;
    }
    
    .debug-section h3 {
        margin-top: 0;
        color: #1a237e;
    }
    
    .debug-btn {
        background: #1a237e;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
        margin-right: 10px;
        margin-bottom: 10px;
    }
    
    .debug-btn:hover {
        background: #0d1642;
    }
    
    .debug-result {
        margin-top: 15px;
        padding: 10px;
        border-radius: 4px;
    }
    
    .debug-result .success {
        background: #e8f5e9;
        color: #2e7d32;
        padding: 10px;
        border-radius: 4px;
    }
    
    .debug-result .error {
        background: #ffebee;
        color: #c62828;
        padding: 10px;
        border-radius: 4px;
    }
    
    .debug-result .loading {
        background: #e3f2fd;
        color: #1565c0;
        padding: 10px;
        border-radius: 4px;
    }
    
    .debug-table-container {
        overflow-x: auto;
    }
    
    .debug-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
    }
    
    .debug-table th, .debug-table td {
        padding: 8px 10px;
        text-align: left;
        border: 1px solid #ddd;
    }
    
    .debug-table th {
        background: #1a237e;
        color: white;
    }
    
    .debug-table tr:nth-child(even) {
        background: #f5f5f5;
    }
    
    .debug-error {
        background: #ffebee;
        color: #c62828;
        padding: 15px;
        border-radius: 4px;
        margin: 10px 0;
    }
    
    .debug-warning {
        background: #fff8e1;
        color: #f57c00;
        padding: 15px;
        border-radius: 4px;
        margin: 10px 0;
    }
    
    .debug-info {
        background: #f5f5f5;
        padding: 15px;
        border-radius: 4px;
    }
    </style>
    <?php
    
    // Add handler for force insert
    add_action('wp_ajax_force_insert_test_log', 'force_insert_test_log_callback');
    add_action('wp_ajax_nopriv_force_insert_test_log', 'force_insert_test_log_callback');
    function force_insert_test_log_callback() {
        // Verify nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'force_insert_test_log_nonce')) {
            wp_send_json_error('Invalid nonce');
        }
        
        // Get user info
        $user_name = is_user_logged_in() ? wp_get_current_user()->display_name : 'Guest';
        $ip_address = $_SERVER['REMOTE_ADDR'];
        
        // Insert test log
        global $wpdb;
        $table_name = $wpdb->prefix . 'user_activity_logs';
        
        // Check if table exists
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'") === $table_name;
        
        if (!$table_exists) {
            // Create table if it doesn't exist
            $charset_collate = $wpdb->get_charset_collate();
            
            $sql = "CREATE TABLE $table_name (
                id mediumint(9) NOT NULL AUTO_INCREMENT,
                user_name varchar(100) NOT NULL,
                activity_date datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
                ip_address varchar(100) NOT NULL,
                action_type varchar(100) NOT NULL,
                PRIMARY KEY  (id)
            ) $charset_collate;";
            
            require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
            dbDelta($sql);
            
            // Check if table was created
            $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'") === $table_name;
            
            if (!$table_exists) {
                wp_send_json_error('Failed to create table');
                return;
            }
        }
        
        // Insert the test log
        $result = $wpdb->insert(
            $table_name,
            array(
                'user_name' => $user_name,
                'ip_address' => $ip_address,
                'action_type' => 'test_log',
            ),
            array('%s', '%s', '%s')
        );
        
        if ($result === false) {
            wp_send_json_error('Database insert error: ' . $wpdb->last_error);
        } else {
            wp_send_json_success('Test log inserted successfully');
        }
    }
    
    return ob_get_clean();
}