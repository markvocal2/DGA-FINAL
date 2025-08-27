/**** upload ******/

/**
 * EGP Upload Functionality
 * Version: 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * EGP FTP Handler Class
 */
class EGP_FTP_Handler {
    private $ftp_conn;
    private $settings;
    
    public function __construct() {
        $this->settings = array(
            'host' => '119.59.120.28',
            'user' => 'root@upload.wpdevs.co',
            'pass' => 'DBhvyu6RdYvEW8KBanfb',
            'port' => 2002,
            'timeout' => 90,
            'passive' => true,
            'remote_path' => '/',
            'base_url' => 'https://upload.wpdevs.co/dga/'
        );
    }
    
    public function connect() {
        try {
            error_log('Connecting to FTP server: ' . $this->settings['host']);
            
            $this->ftp_conn = ftp_connect(
                $this->settings['host'],
                $this->settings['port'],
                $this->settings['timeout']
            );
            
            if (!$this->ftp_conn) {
                throw new Exception('ไม่สามารถเชื่อมต่อกับ FTP Server ได้');
            }
            
            error_log('FTP connected, attempting login');
            
            if (!ftp_login($this->ftp_conn, $this->settings['user'], $this->settings['pass'])) {
                throw new Exception('ไม่สามารถเข้าสู่ระบบ FTP ได้');
            }
            
            ftp_pasv($this->ftp_conn, true);
            
            error_log('FTP login successful');
            return true;
            
        } catch (Exception $e) {
            error_log('FTP connection error: ' . $e->getMessage());
            if ($this->ftp_conn) {
                ftp_close($this->ftp_conn);
            }
            throw $e;
        }
    }
    
    public function upload_file($local_file, $remote_file) {
        try {
            $file_info = pathinfo($remote_file);
            $unique_filename = sprintf(
                '%s_%s_%s.%s',
                time(),
                uniqid(),
                preg_replace('/[^a-z0-9]/', '', strtolower($file_info['filename'])),
                $file_info['extension']
            );
            
            $remote_path = $this->settings['remote_path'] . $unique_filename;
            
            error_log('Uploading file: ' . $remote_path);
            
            if (!ftp_put($this->ftp_conn, $remote_path, $local_file, FTP_BINARY)) {
                throw new Exception('ไม่สามารถอัพโหลดไฟล์ไปยัง FTP Server ได้');
            }
            
            $url = $this->settings['base_url'] . $unique_filename;
            error_log('File uploaded successfully: ' . $url);
            
            return $url;
            
        } catch (Exception $e) {
            error_log('FTP upload error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public function disconnect() {
        if ($this->ftp_conn) {
            ftp_close($this->ftp_conn);
        }
    }
    
    public function process_multiple_uploads($files) {
        $results = array();
        $success = false;

        try {
            $this->connect();

            foreach ($files['name'] as $key => $filename) {
                if ($files['error'][$key] === UPLOAD_ERR_OK) {
                    $file = array(
                        'name' => $files['name'][$key],
                        'type' => $files['type'][$key],
                        'tmp_name' => $files['tmp_name'][$key],
                        'error' => $files['error'][$key],
                        'size' => $files['size'][$key]
                    );

                    try {
                        $file_url = $this->upload_file($file['tmp_name'], $file['name']);
                        $results[] = array(
                            'success' => true,
                            'url' => $file_url,
                            'filename' => basename($file_url)
                        );
                        $success = true;
                    } catch (Exception $e) {
                        $results[] = array(
                            'success' => false,
                            'error' => $e->getMessage(),
                            'filename' => $file['name']
                        );
                    }
                }
            }

        } catch (Exception $e) {
            $results[] = array(
                'success' => false,
                'error' => $e->getMessage()
            );
        } finally {
            $this->disconnect();
        }

        return array(
            'success' => $success,
            'results' => $results
        );
    }
}

/**
 * Register shortcode and handlers
 */
function egp_upload_init() {
    add_shortcode('egpupload', 'egp_upload_shortcode');
    add_action('wp_enqueue_scripts', 'egp_upload_enqueue_assets');
}
add_action('init', 'egp_upload_init');

/**
 * Enqueue assets
 */
function egp_upload_enqueue_assets() {
    global $post;
    if (!is_a($post, 'WP_Post') || !has_shortcode($post->post_content, 'egpupload')) {
        return;
    }

    // Enqueue jQuery UI
    wp_enqueue_script('jquery');
    wp_enqueue_script('jquery-ui-core');
    wp_enqueue_script('jquery-ui-widget');

    // Enqueue custom scripts
    wp_enqueue_script(
        'egp-upload',
        get_stylesheet_directory_uri() . '/js/egp-upload.js',
        array('jquery'),
        filemtime(get_stylesheet_directory() . '/js/egp-upload.js'),
        array('in_footer' => true)
    );
    
    wp_enqueue_style(
        'egp-upload',
        get_stylesheet_directory_uri() . '/css/egp-upload.css',
        array(),
        filemtime(get_stylesheet_directory() . '/css/egp-upload.css')
    );
    
    wp_localize_script('egp-upload', 'egpAjax', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('egp_upload_nonce'),
        'post_id' => get_the_ID(),
        'maxSize' => wp_max_upload_size(),
        'messages' => array(
            'maxSize' => sprintf(
                __('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด: %s)', 'egp-upload'),
                size_format(wp_max_upload_size())
            ),
            'invalidType' => __('ประเภทไฟล์ไม่ได้รับอนุญาต', 'egp-upload'),
            'uploadError' => __('เกิดข้อผิดพลาดในการอัพโหลด', 'egp-upload'),
            'success' => __('อัพโหลดไฟล์เสร็จสมบูรณ์', 'egp-upload')
        ),
        'allowed_types' => array('pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png')
    ));
}

/**
 * Shortcode callback
 */
function egp_upload_shortcode($atts) {
    if (!current_user_can('upload_files')) {
        return '<p class="egp-error">' . __('คุณไม่มีสิทธิ์อัพโหลดไฟล์', 'egp-upload') . '</p>';
    }
    
    ob_start();
    ?>
    <div class="egp-upload-container">
        <div class="egp-upload-area" id="egpDropZone">
            <div class="egp-upload-content">
                <i class="upload-icon"></i>
                <h3><?php _e('ลากไฟล์มาวางที่นี่ หรือ', 'egp-upload'); ?></h3>
                <button type="button" class="egp-upload-button">
                    <?php _e('เลือกไฟล์', 'egp-upload'); ?>
                </button>
                <input type="file" id="egpFileInput" multiple style="display: none;">
                <p class="upload-info">
                    <?php printf(
                        __('ขนาดไฟล์สูงสุด: %s', 'egp-upload'),
                        size_format(wp_max_upload_size())
                    ); ?>
                </p>
            </div>
        </div>
        
        <div class="egp-file-list">
            <ul id="egpFileList"></ul>
        </div>
        
        <button type="button" class="egp-upload-submit" id="egpUploadSubmit" disabled>
            <?php _e('อัพโหลดไฟล์', 'egp-upload'); ?>
        </button>
        
        <div class="egp-upload-progress" style="display: none;">
            <div class="progress-bar"></div>
            <div class="progress-text">0%</div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}

/**
 * Ajax upload handler
 */
function egp_handle_file_upload() {
    try {
        check_ajax_referer('egp_upload_nonce', 'nonce');
        
        if (!current_user_can('upload_files')) {
            throw new Exception(__('คุณไม่มีสิทธิ์อัพโหลดไฟล์', 'egp-upload'));
        }
        
        if (empty($_FILES['files'])) {
            throw new Exception(__('ไม่พบไฟล์ที่อัพโหลด', 'egp-upload'));
        }
        
        $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
        if (!$post_id) {
            throw new Exception(__('ไม่พบ Post ID', 'egp-upload'));
        }
        
        $ftp_handler = new EGP_FTP_Handler();
        $upload_result = $ftp_handler->process_multiple_uploads($_FILES['files']);
        
        if ($upload_result['success']) {
            $uploaded_urls = array_reduce($upload_result['results'], function($urls, $result) {
                if ($result['success']) {
                    $urls[] = $result['url'];
                }
                return $urls;
            }, array());
            
            if (!empty($uploaded_urls)) {
                $existing_files = get_post_meta($post_id, 'egp_files', true);
                $new_files = $existing_files 
                    ? $existing_files . ',' . implode(',', $uploaded_urls)
                    : implode(',', $uploaded_urls);
                
                update_post_meta($post_id, 'egp_files', $new_files);
                
                wp_send_json_success(array(
                    'message' => __('อัพโหลดไฟล์เสร็จสมบูรณ์', 'egp-upload'),
                    'urls' => $uploaded_urls,
                    'results' => $upload_result['results']
                ));
            } else {
                throw new Exception(__('ไม่สามารถอัพโหลดไฟล์ได้', 'egp-upload'));
            }
        } else {
            throw new Exception(__('เกิดข้อผิดพลาดในการอัพโหลด', 'egp-upload'));
        }
        
    } catch (Exception $e) {
        wp_send_json_error(array(
            'message' => $e->getMessage()
        ));
    }
    
    wp_die();
}

add_action('wp_ajax_egp_upload_files', 'egp_handle_file_upload');
add_action('wp_ajax_nopriv_egp_upload_files', 'egp_handle_file_upload');