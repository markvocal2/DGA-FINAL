<?php
/**
 * AChecker Configuration File
 *
 * This file attempts to automatically detect and use WordPress database credentials
 * if AChecker is running within or alongside a WordPress installation.
 */

// --- Attempt to load WordPress Environment to get DB credentials ---
$wp_load_path = false;

// Common relative paths to wp-load.php from AChecker's root directory
// Adjust these paths if your AChecker installation is located differently relative to WordPress
$potential_wp_load_paths = [
    dirname(__FILE__) . '/wp-load.php',         // WordPress in the same directory as AChecker root
    dirname(__FILE__) . '/../wp-load.php',      // WordPress one level up from AChecker root
    dirname(__FILE__) . '/../../wp-load.php',   // WordPress two levels up
    // Add more potential paths if needed based on your typical setup
];

foreach ($potential_wp_load_paths as $path) {
    if (file_exists($path)) {
        $wp_load_path = $path;
        break;
    }
}

$wordpress_loaded_successfully = false;
if ($wp_load_path) {
    // Define a guard to ensure wp-settings.php (loaded by wp-load.php) doesn't try to run wp_ob_end_flush_all()
    // if output has already started, which can happen if this config is loaded early.
    if (!defined('WP_ADMIN')) { // A common check, or pick another specific to your needs
        define('WP_ADMIN', false); // Define it to prevent potential issues if not already set.
                                   // This is a simplistic guard; more robust checks might be needed
                                   // depending on how AChecker integrates.
    }
    // Try to load WordPress environment.
    // Suppress errors during inclusion as it might fail if paths are incorrect or WP is not there.
    // Note: Including wp-load.php will execute a significant portion of WordPress.
    // For performance, if AChecker is a true plugin, this logic might be better handled
    // by hooking into WordPress's initialization.
    @include_once($wp_load_path);

    // Check if WordPress environment (specifically DB constants and $wpdb) is available
    if (defined('DB_HOST') && defined('DB_USER') && defined('DB_PASSWORD') && defined('DB_NAME') && isset($GLOBALS['wpdb'])) {
        $wordpress_loaded_successfully = true;
    }
}


// --- Database Configuration ---
if ($wordpress_loaded_successfully) {
    // --- Use WordPress Database Credentials ---
    if (!defined('ACHECKER_DB_HOST'))        define('ACHECKER_DB_HOST', DB_HOST);
    if (!defined('ACHECKER_DB_USER'))        define('ACHECKER_DB_USER', DB_USER);
    if (!defined('ACHECKER_DB_PASS'))        define('ACHECKER_DB_PASS', DB_PASSWORD);
    if (!defined('ACHECKER_DB_NAME'))        define('ACHECKER_DB_NAME', DB_NAME);
    if (!defined('ACHECKER_DB_TYPE'))        define('ACHECKER_DB_TYPE', 'mysql'); // AChecker typically uses mysql

    global $wpdb;
    if (isset($wpdb->prefix) && !defined('ACHECKER_DB_TABLE_PREFIX')) {
        // This assumes AChecker tables (e.g., 'guidelines', 'checks')
        // are named like 'wp_guidelines', 'wp_checks' in the WordPress database.
        // AChecker's DAOs will use ACHECKER_TABLE_PREFIX . "original_table_name"
        define('ACHECKER_DB_TABLE_PREFIX', $wpdb->prefix);
    } else if (!defined('ACHECKER_DB_TABLE_PREFIX')) {
        // Fallback if $wpdb is not available or if tables have a different prefix structure.
        // For example, if AChecker tables are prefixed 'wp_AT_', set this to $wpdb->prefix . 'AT_'.
        // This is a critical setting.
        define('ACHECKER_DB_TABLE_PREFIX', (isset($wpdb->prefix) ? $wpdb->prefix : 'wp_') ); // Default to 'wp_' if unsure. ADJUST AS NEEDED.
    }

} else {
    // --- Fallback to Manual Configuration ---
    // This section is used if WordPress environment could not be loaded.
    // YOU MUST MANUALLY CONFIGURE THESE SETTINGS if not using WordPress integration.
    // Replace placeholders with your actual AChecker database details.
    if (!defined('ACHECKER_DB_HOST'))        define('ACHECKER_DB_HOST', 'localhost');
    if (!defined('ACHECKER_DB_USER'))        define('ACHECKER_DB_USER', 'your_manual_db_user');
    if (!defined('ACHECKER_DB_PASS'))        define('ACHECKER_DB_PASS', 'your_manual_db_password');
    if (!defined('ACHECKER_DB_NAME'))        define('ACHECKER_DB_NAME', 'your_manual_achecker_db_name');
    if (!defined('ACHECKER_DB_TYPE'))        define('ACHECKER_DB_TYPE', 'mysql');
    if (!defined('ACHECKER_DB_TABLE_PREFIX'))define('ACHECKER_DB_TABLE_PREFIX', 'AT_'); // Default AChecker prefix
}

// AChecker's internal constants mapping (used by its own code, e.g., DAO.class.php)
// These should now use the ACHECKER_ prefixed constants defined above.
if (!defined('DB_HOST'))        define('DB_HOST', ACHECKER_DB_HOST);
if (!defined('DB_USER'))        define('DB_USER', ACHECKER_DB_USER);
if (!defined('DB_PASS'))        define('DB_PASS', ACHECKER_DB_PASS);
if (!defined('DB_NAME'))        define('DB_NAME', ACHECKER_DB_NAME);
if (!defined('DB_TYPE'))        define('DB_TYPE', ACHECKER_DB_TYPE);
if (!defined('DB_TABLE_PREFIX'))define('DB_TABLE_PREFIX', ACHECKER_DB_TABLE_PREFIX);
if (!defined('TABLE_PREFIX'))   define('TABLE_PREFIX', DB_TABLE_PREFIX);


// --- AChecker Standard Configuration (Continued) ---

if (!defined('MAX_PAGE_SIZE'))      define('MAX_PAGE_SIZE', 1024); //KB
if (!defined('SECURE_SESSION'))     define('SECURE_SESSION', false);

// Adjust TMP_DIR if config.inc.php is not in AChecker's root, or use an absolute path.
// This assumes config.inc.php is in the AChecker root directory.
if (!defined('TMP_DIR'))            define('TMP_DIR', dirname(__FILE__) . '/tmp/');
if (!defined('USER_CACHE_DIR'))     define('USER_CACHE_DIR', TMP_DIR . 'users/');

if (!defined('AUTHENTICATION'))     define('AUTHENTICATION', 'mysql_auth'); // Consider 'wordpress_auth' for full WP integration (requires custom code)
if (!defined('ALLOW_REGISTRATION')) define('ALLOW_REGISTRATION', 1);

if (!defined('SYSTEM_SENDER_EMAIL'))define('SYSTEM_SENDER_EMAIL', ($wordpress_loaded_successfully && function_exists('get_option')) ? get_option('admin_email') : 'achecker@example.com');
if (!defined('SYSTEM_SENDER_NAME')) define('SYSTEM_SENDER_NAME', ($wordpress_loaded_successfully && function_exists('get_option')) ? get_option('blogname') . ' AChecker' : 'AChecker System');

// IMPORTANT: Set ACHECKER_BASE_URL correctly.
if (!defined('ACHECKER_BASE_URL')) {
    if ($wordpress_loaded_successfully && function_exists('site_url')) {
        // Assuming AChecker is in a subdirectory named 'AChecker-main' relative to WordPress root.
        // Adjust '/AChecker-main/' if your path is different.
        define('ACHECKER_BASE_URL', site_url('/AChecker-main/')); // MODIFY AS NEEDED
    } else {
        // Fallback if not in WordPress context or site_url() is not available
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443)) ? "https://" : "http://";
        $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
        // Assuming AChecker is in a subdirectory named 'AChecker-main' from the web root
        define('ACHECKER_BASE_URL', $protocol . $host . '/AChecker-main/'); // MODIFY AS NEEDED
    }
}

if (!defined('DEBUG_MODE'))         define('DEBUG_MODE', 0); // 0=off, 1=on (Set to 0 for production)
if (!defined('SESSION_NAME'))       define('SESSION_NAME', 'ACHECKER_WP_SESSION'); // Unique session name

if (!defined('DEFAULT_THEME'))      define('DEFAULT_THEME', 1);
if (!defined('DEFAULT_LANGUAGE'))   define('DEFAULT_LANGUAGE', 'en'); // Available: en, fr, th, etc.

if (!defined('VALIDATE_HTML'))      define('VALIDATE_HTML', 1);
if (!defined('VALIDATE_CSS'))       define('VALIDATE_CSS',  1);

if (!defined('ACHECKER_VERSION'))   define('ACHECKER_VERSION', '2.1.0'); // Replace with your AChecker version

// Optional: Proxy settings
if (!defined('PROXY_HOST'))         define('PROXY_HOST', '');
if (!defined('PROXY_PORT'))         define('PROXY_PORT', '');
if (!defined('PROXY_USER'))         define('PROXY_USER', '');
if (!defined('PROXY_PASS'))         define('PROXY_PASS', '');

// Paths for includes (usually set in vitals.inc.php but good for reference)
if (!defined('AT_INCLUDE_PATH'))    define('AT_INCLUDE_PATH', dirname(__FILE__) . '/include/');
if (!defined('AT_CLASS_PATH'))      define('AT_CLASS_PATH', AT_INCLUDE_PATH . 'classes/');


// After defining TMP_DIR and USER_CACHE_DIR, you might want to add checks for writability
// and attempt to create them if they don't exist.
/*
if (defined('TMP_DIR') && !is_writable(TMP_DIR)) {
    @mkdir(TMP_DIR, 0775, true);
    if (!is_writable(TMP_DIR)) {
        // Consider logging an error or displaying a warning if still not writable
        // error_log('AChecker Error: TMP_DIR ('.TMP_DIR.') is not writable.');
    }
}
if (defined('USER_CACHE_DIR') && !is_writable(USER_CACHE_DIR)) {
    @mkdir(USER_CACHE_DIR, 0775, true);
    if (!is_writable(USER_CACHE_DIR)) {
        // error_log('AChecker Error: USER_CACHE_DIR ('.USER_CACHE_DIR.') is not writable.');
    }
}
*/

?>