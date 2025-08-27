<?php
/**
 * CKAN API Integration
 * 
 * ไฟล์นี้รวมฟังก์ชันทั้งหมดสำหรับการทำงานของ CKAN API ใน WordPress
 * สร้าง REST API endpoints และฟังก์ชันสนับสนุนต่างๆ
 * 
 * วิธีการใช้งาน: เพิ่มไฟล์นี้ในโฟลเดอร์ของธีมลูก (Child Theme) 
 * แล้วเรียกใช้ผ่าน require_once ใน functions.php
 */

// ป้องกันการเรียกไฟล์โดยตรง
if (!defined('ABSPATH')) {
    exit;
}

/**
 * คลาสหลักสำหรับการทำงานของ CKAN API Integration
 */
class CKAN_API_Integration {
    /**
     * Instance ของคลาส (Singleton)
     * @var CKAN_API_Integration
     */
    private static $instance = null;
    
    /**
     * Constructor
     */
    private function __construct() {
        // เริ่มต้นการทำงาน
        $this->init();
    }
    
    /**
     * เริ่มต้นการทำงาน
     */
    private function init() {
        // ลงทะเบียนฮุคและฟังก์ชันต่างๆ
        add_action('rest_api_init', [$this, 'register_api_routes']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_action('init', [$this, 'includes_for_media_upload']);
        
        // เพิ่มฟังก์ชัน AJAX handlers
        add_action('wp_ajax_ckan_get_file_preview', [$this, 'handle_file_preview']);
        add_action('wp_ajax_nopriv_ckan_get_file_preview', [$this, 'handle_file_preview']);
        add_action('wp_ajax_ckan_download_file', [$this, 'handle_file_download']);
        add_action('wp_ajax_nopriv_ckan_download_file', [$this, 'handle_file_download']);
        add_action('wp_ajax_ckan_upload_file', [$this, 'handle_file_upload']);
        add_action('wp_ajax_ckan_save_asset', [$this, 'handle_save_asset']);
        add_action('wp_ajax_ckan_delete_asset', [$this, 'handle_delete_asset']);
    }
    
    /**
     * ลงทะเบียน REST API Routes
     */
    public function register_api_routes() {
        // ลงทะเบียน namespace
        $namespace = 'ckan-api/v1';
        
        // ลงทะเบียน route สำหรับค้นหาข้อมูล
        register_rest_route($namespace, '/datastore_search', array(
            'methods' => 'GET',
            'callback' => [$this, 'api_datastore_search'],
            'permission_callback' => '__return_true',
            'args' => array(
                'q' => array(
                    'description' => 'คำค้นหา',
                    'type' => 'string',
                    'required' => false,
                ),
                'resource_id' => array(
                    'description' => 'รหัสของ post (post ID)',
                    'type' => 'string',
                    'required' => false,
                ),
                'limit' => array(
                    'description' => 'จำนวนผลลัพธ์สูงสุดที่ต้องการ',
                    'type' => 'integer',
                    'default' => 10,
                    'required' => false,
                ),
            ),
        ));
        
        // ลงทะเบียน route สำหรับสร้างข้อมูลใหม่
        register_rest_route($namespace, '/datastore_create', array(
            'methods' => 'POST',
            'callback' => [$this, 'api_datastore_create'],
            'permission_callback' => [$this, 'check_api_permissions'],
        ));
        
        // ลงทะเบียน route สำหรับอัพเดทข้อมูล
        register_rest_route($namespace, '/datastore_upsert', array(
            'methods' => 'POST',
            'callback' => [$this, 'api_datastore_upsert'],
            'permission_callback' => [$this, 'check_api_permissions'],
        ));
        
        // ลงทะเบียน route สำหรับดูรายละเอียดของ post
        register_rest_route($namespace, '/post/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => [$this, 'api_get_post'],
            'permission_callback' => '__return_true',
            'args' => array(
                'id' => array(
                    'description' => 'รหัสของ post (post ID)',
                    'type' => 'integer',
                    'required' => true,
                ),
            ),
        ));
        
        // ลงทะเบียน route สำหรับดึงข้อมูล assets จาก ACF repeater
        register_rest_route($namespace, '/post/(?P<id>\d+)/assets', array(
            'methods' => 'GET',
            'callback' => [$this, 'api_get_post_assets'],
            'permission_callback' => '__return_true',
            'args' => array(
                'id' => array(
                    'description' => 'รหัสของ post (post ID)',
                    'type' => 'integer',
                    'required' => true,
                ),
            ),
        ));
        
        // ลงทะเบียน route สำหรับดึงข้อมูล metadata จาก ACF fields
        register_rest_route($namespace, '/post/(?P<id>\d+)/metadata', array(
            'methods' => 'GET',
            'callback' => [$this, 'api_get_post_metadata'],
            'permission_callback' => '__return_true',
            'args' => array(
                'id' => array(
                    'description' => 'รหัสของ post (post ID)',
                    'type' => 'integer',
                    'required' => true,
                ),
            ),
        ));
    }
    
    /**
     * เพิ่มไฟล์ JavaScript และ CSS ที่จำเป็น
     */
    public function enqueue_scripts() {
        // เพิ่มไฟล์ CSS
        wp_register_style('ckan-data-preview-css', get_stylesheet_directory_uri() . '/css/ckan-data-preview.css', array(), '1.0.0');
        wp_register_style('ckan-data-preview-filter-css', get_stylesheet_directory_uri() . '/css/ckan-data-preview-filter.css', array(), '1.0.0');
        wp_register_style('ckan-api-css', get_stylesheet_directory_uri() . '/css/ckan-api.css', array(), '1.0.0');
        
        // เพิ่มไฟล์ JavaScript
        wp_register_script('xlsx-js', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', array(), null, true);
        wp_register_script('ckan-data-preview-js', get_stylesheet_directory_uri() . '/js/ckan-data-preview.js', array('jquery', 'xlsx-js'), '1.0.0', true);
        wp_register_script('ckan-data-preview-filter-js', get_stylesheet_directory_uri() . '/js/ckan-data-preview-filter.js', array('jquery'), '1.0.0', true);
        
        // เพิ่มตัวแปร JavaScript สำหรับใช้ใน script
        wp_localize_script('ckan-data-preview-js', 'get_stylesheet_directory_uri', get_stylesheet_directory_uri());
    }
    
    /**
     * โหลดไฟล์ที่จำเป็นสำหรับการอัพโหลดไฟล์
     */
    public function includes_for_media_upload() {
        if (!function_exists('wp_handle_upload')) {
            require_once(ABSPATH . 'wp-admin/includes/file.php');
        }
        if (!function_exists('wp_generate_attachment_metadata')) {
            require_once(ABSPATH . 'wp-admin/includes/image.php');
        }
        if (!function_exists('media_handle_upload')) {
            require_once(ABSPATH . 'wp-admin/includes/media.php');
        }
    }
    
    /**
     * ตรวจสอบสิทธิ์การใช้งาน API (สำหรับ methods ที่ต้องมีการ authentication)
     */
    public function check_api_permissions(WP_REST_Request $request) {
        // ตรวจสอบว่าผู้ใช้มีสิทธิ์ในการแก้ไข posts หรือไม่
        return current_user_can('edit_posts');
    }
    
    /**
     * API Callback - ค้นหาข้อมูล
     */
    public function api_datastore_search(WP_REST_Request $request) {
        $search_query = $request->get_param('q');
        $resource_id = $request->get_param('resource_id');
        $limit = intval($request->get_param('limit'));
        
        // สร้าง query arguments
        $args = array(
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => $limit
        );
        
        // ถ้ามีคำค้นหา
        if (!empty($search_query)) {
            $args['s'] = $search_query;
        }
        
        // ถ้ามีการระบุ resource_id (post ID)
        if (!empty($resource_id)) {
            $args['p'] = intval($resource_id);
        }
        
        // ดึงข้อมูลจาก WordPress
        $query = new WP_Query($args);
        $posts = array();
        
        // จัดรูปแบบข้อมูลให้คล้ายกับ CKAN API
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                
                $post_data = array(
                    'id' => get_the_ID(),
                    'title' => get_the_title(),
                    'content' => get_the_excerpt(),
                    'date' => get_the_date('Y-m-d H:i:s'),
                    'modified' => get_the_modified_date('Y-m-d H:i:s'),
                    'author' => get_the_author(),
                    'permalink' => get_permalink(),
                    'categories' => wp_get_post_categories(get_the_ID(), array('fields' => 'names')),
                    'tags' => wp_get_post_tags(get_the_ID(), array('fields' => 'names')),
                );
                
                // เพิ่มข้อมูล custom fields จาก ACF ถ้ามี function get_fields()
                if (function_exists('get_fields')) {
                    $post_data['metadata'] = get_fields(get_the_ID());
                    
                    // ดึงข้อมูล assets จาก ACF repeater ถ้ามี
                    if (function_exists('get_field') && !empty(get_field('ckan_asset', get_the_ID()))) {
                        $post_data['assets'] = get_field('ckan_asset', get_the_ID());
                    }
                }
                
                $posts[] = $post_data;
            }
        }
        
        // คืนค่าในรูปแบบเดียวกับ CKAN API
        $response = array(
            'success' => true,
            'result' => array(
                'resource_id' => $resource_id,
                'fields' => array(
                    array('id' => 'id', 'type' => 'integer'),
                    array('id' => 'title', 'type' => 'text'),
                    array('id' => 'content', 'type' => 'text'),
                    array('id' => 'date', 'type' => 'timestamp'),
                    array('id' => 'modified', 'type' => 'timestamp'),
                    array('id' => 'author', 'type' => 'text'),
                    array('id' => 'permalink', 'type' => 'text'),
                    array('id' => 'categories', 'type' => 'array'),
                    array('id' => 'tags', 'type' => 'array'),
                    array('id' => 'metadata', 'type' => 'object'),
                    array('id' => 'assets', 'type' => 'array')
                ),
                'records' => $posts,
                'limit' => $limit,
                'total' => $query->found_posts
            )
        );
        
        wp_reset_postdata();
        
        return rest_ensure_response($response);
    }
    
    /**
     * API Callback - สร้างข้อมูลใหม่
     */
    public function api_datastore_create(WP_REST_Request $request) {
        $params = $request->get_json_params();
        
        // ตรวจสอบข้อมูลที่จำเป็น
        if (empty($params['title'])) {
            return new WP_Error('missing_title', 'ต้องระบุหัวข้อ', array('status' => 400));
        }
        
        // สร้าง post ใหม่
        $post_data = array(
            'post_title' => sanitize_text_field($params['title']),
            'post_content' => isset($params['content']) ? wp_kses_post($params['content']) : '',
            'post_status' => 'publish',
            'post_type' => 'post'
        );
        
        $post_id = wp_insert_post($post_data);
        
        if (is_wp_error($post_id)) {
            return $post_id; // ส่งกลับข้อผิดพลาด
        }
        
        // บันทึก metadata ถ้ามีและ ACF ทำงานอยู่
        if (!empty($params['metadata']) && function_exists('update_field')) {
            foreach ($params['metadata'] as $key => $value) {
                update_field($key, $value, $post_id);
            }
        }
        
        // บันทึก assets ถ้ามีและ ACF ทำงานอยู่
        if (!empty($params['assets']) && function_exists('update_field')) {
            update_field('ckan_asset', $params['assets'], $post_id);
        }
        
        // ส่งคืนข้อมูลที่สร้าง
        $response = array(
            'success' => true,
            'result' => array(
                'resource_id' => $post_id,
                'message' => 'บันทึกข้อมูลสำเร็จ'
            )
        );
        
        return rest_ensure_response($response);
    }
    
    /**
     * API Callback - อัพเดทข้อมูล
     */
    public function api_datastore_upsert(WP_REST_Request $request) {
        $params = $request->get_json_params();
        
        // ต้องมี resource_id (post ID)
        if (empty($params['resource_id'])) {
            return new WP_Error('missing_resource_id', 'ต้องระบุ resource_id', array('status' => 400));
        }
        
        $post_id = intval($params['resource_id']);
        
        // ตรวจสอบว่ามี post อยู่จริง
        $post = get_post($post_id);
        if (!$post) {
            return new WP_Error('post_not_found', 'ไม่พบข้อมูลที่ต้องการอัพเดต', array('status' => 404));
        }
        
        // อัพเดตข้อมูล post
        $post_data = array(
            'ID' => $post_id
        );
        
        if (!empty($params['title'])) {
            $post_data['post_title'] = sanitize_text_field($params['title']);
        }
        
        if (isset($params['content'])) {
            $post_data['post_content'] = wp_kses_post($params['content']);
        }
        
        // อัพเดต post
        $update_result = wp_update_post($post_data);
        
        if (is_wp_error($update_result)) {
            return $update_result; // ส่งกลับข้อผิดพลาด
        }
        
        // อัพเดต metadata ถ้ามีและ ACF ทำงานอยู่
        if (!empty($params['metadata']) && function_exists('update_field')) {
            foreach ($params['metadata'] as $key => $value) {
                update_field($key, $value, $post_id);
            }
        }
        
        // อัพเดต assets ถ้ามีและ ACF ทำงานอยู่
        if (!empty($params['assets']) && function_exists('update_field')) {
            update_field('ckan_asset', $params['assets'], $post_id);
        }
        
        // ส่งคืนข้อมูลที่อัพเดต
        $response = array(
            'success' => true,
            'result' => array(
                'resource_id' => $post_id,
                'message' => 'อัพเดตข้อมูลสำเร็จ'
            )
        );
        
        return rest_ensure_response($response);
    }
    
    /**
     * API Callback - ดึงข้อมูล post ตาม ID
     */
    public function api_get_post(WP_REST_Request $request) {
        $post_id = $request->get_param('id');
        $post = get_post($post_id);
        
        if (!$post) {
            return new WP_Error('post_not_found', 'ไม่พบข้อมูลที่ต้องการ', array('status' => 404));
        }
        
        $post_data = array(
            'id' => $post->ID,
            'title' => $post->post_title,
            'content' => $post->post_content,
            'excerpt' => $post->post_excerpt,
            'date' => $post->post_date,
            'modified' => $post->post_modified,
            'author' => get_the_author_meta('display_name', $post->post_author),
            'permalink' => get_permalink($post->ID),
            'categories' => wp_get_post_categories($post->ID, array('fields' => 'names')),
            'tags' => wp_get_post_tags($post->ID, array('fields' => 'names')),
        );
        
        // เพิ่มข้อมูล custom fields จาก ACF ถ้ามี function get_fields()
        if (function_exists('get_fields')) {
            $post_data['metadata'] = get_fields($post->ID);
        }
        
        $response = array(
            'success' => true,
            'result' => $post_data
        );
        
        return rest_ensure_response($response);
    }
    
    /**
     * API Callback - ดึงข้อมูล assets ของ post
     */
    public function api_get_post_assets(WP_REST_Request $request) {
        $post_id = $request->get_param('id');
        
        // ตรวจสอบว่ามี post อยู่จริง
        $post = get_post($post_id);
        if (!$post) {
            return new WP_Error('post_not_found', 'ไม่พบข้อมูลที่ต้องการ', array('status' => 404));
        }
        
        // ดึงข้อมูล assets จาก ACF repeater
        $assets = array();
        if (function_exists('get_field')) {
            $assets = get_field('ckan_asset', $post_id);
        }
        
        if (!$assets) {
            $assets = array();
        }
        
        $response = array(
            'success' => true,
            'result' => array(
                'resource_id' => $post_id,
                'total' => count($assets),
                'records' => $assets
            )
        );
        
        return rest_ensure_response($response);
    }
    
    /**
     * API Callback - ดึงข้อมูล metadata ของ post
     */
    public function api_get_post_metadata(WP_REST_Request $request) {
        $post_id = $request->get_param('id');
        
        // ตรวจสอบว่ามี post อยู่จริง
        $post = get_post($post_id);
        if (!$post) {
            return new WP_Error('post_not_found', 'ไม่พบข้อมูลที่ต้องการ', array('status' => 404));
        }
        
        // ดึงข้อมูล metadata ทั้งหมดจาก ACF
        $metadata = array();
        if (function_exists('get_fields')) {
            $metadata = get_fields($post_id);
        }
        
        if (!$metadata) {
            $metadata = array();
        }
        
        // ฟังก์ชันสำหรับการเข้าถึง metadata fields ตาม schema
        $metadata_fields = array();
        if (function_exists('ckan_get_metadata_fields')) {
            $metadata_fields = ckan_get_metadata_fields();
        }
        
        $formatted_metadata = array();
        
        // จัดรูปแบบข้อมูลตามเมตาดาต้าฟิลด์ที่กำหนด
        if (!empty($metadata_fields)) {
            foreach ($metadata_fields as $field) {
                $field_name = $field['field'];
                $field_value = isset($metadata[$field_name]) ? $metadata[$field_name] : null;
                
                $formatted_metadata[$field_name] = array(
                    'label' => $field['label'],
                    'value' => $field_value,
                    'type' => $field['type']
                );
            }
        } else {
            // กรณีไม่สามารถเข้าถึงฟังก์ชัน ckan_get_metadata_fields ได้
            foreach ($metadata as $key => $value) {
                $formatted_metadata[$key] = array(
                    'label' => $key,
                    'value' => $value,
                    'type' => 'text'
                );
            }
        }
        
        $response = array(
            'success' => true,
            'result' => array(
                'resource_id' => $post_id,
                'metadata' => $formatted_metadata
            )
        );
        
        return rest_ensure_response($response);
    }
    
    /**
     * AJAX handler สำหรับแสดงตัวอย่างไฟล์
     */
    public function handle_file_preview() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'ckan_rp_list_nonce')) {
            wp_send_json_error('Security check failed');
        }
        
        // Get file URL
        $file_url = isset($_POST['file_url']) ? esc_url_raw($_POST['file_url']) : '';
        
        if (empty($file_url)) {
            wp_send_json_error('Invalid file URL');
        }
        
        // Get file extension
        $file_ext = strtolower(pathinfo($file_url, PATHINFO_EXTENSION));
        
        // Use WordPress HTTP API to get file content
        $response = wp_remote_get($file_url, array(
            'timeout' => 60,
            'sslverify' => false
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error($response->get_error_message());
        }
        
        $file_content = wp_remote_retrieve_body($response);
        
        if (empty($file_content)) {
            wp_send_json_error('File is empty or could not be read');
        }
        
        // For Excel files, send as base64 to handle binary data
        if ($file_ext === 'xls' || $file_ext === 'xlsx') {
            wp_send_json_success(array(
                'content' => base64_encode($file_content),
                'type' => 'excel',
                'extension' => $file_ext
            ));
        } else {
            // For text-based files, send as is
            wp_send_json_success(array(
                'content' => $file_content,
                'type' => 'text',
                'extension' => $file_ext
            ));
        }
    }
    
    /**
     * AJAX handler สำหรับดาวน์โหลดไฟล์
     */
    public function handle_file_download() {
        // Check nonce
        if (!isset($_GET['nonce']) || !wp_verify_nonce($_GET['nonce'], 'ckan_rp_list_nonce')) {
            wp_die('Security check failed');
        }
        
        // Get encoded URL and decode
        if (isset($_GET['file']) && !empty($_GET['file'])) {
            $file_url = base64_decode($_GET['file']);
            
            // Redirect to file
            wp_redirect($file_url);
            exit;
        }
        
        wp_die('Invalid file request');
    }
    
    /**
     * AJAX handler สำหรับอัพโหลดไฟล์
     */
    public function handle_file_upload() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'ckan_rp_list_nonce')) {
            wp_send_json_error('Security check failed');
        }
        
        // Check if file exists
        if (!isset($_FILES['file']) || empty($_FILES['file']['name'])) {
            wp_send_json_error('No file was uploaded');
        }
        
        // Set up the required input for media_handle_upload
        $_FILES['upload_file'] = $_FILES['file'];
        
        // Handle the upload - automatically adds to media library
        $attachment_id = media_handle_upload('upload_file', 0);
        
        if (is_wp_error($attachment_id)) {
            wp_send_json_error($attachment_id->get_error_message());
        } else {
            // Get file URL
            $file_url = wp_get_attachment_url($attachment_id);
            
            wp_send_json_success(array(
                'file_id' => $attachment_id,
                'file_url' => $file_url,
                'file_name' => basename($file_url)
            ));
        }
    }
    
    /**
     * AJAX handler สำหรับบันทึก asset
     */
    public function handle_save_asset() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'ckan_rp_list_nonce')) {
            wp_send_json_error('Security check failed');
        }
        
        $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
        $index = isset($_POST['index']) && $_POST['index'] !== '' ? intval($_POST['index']) : -1;
        $name = isset($_POST['name']) ? sanitize_text_field($_POST['name']) : '';
        $description = isset($_POST['description']) ? sanitize_textarea_field($_POST['description']) : '';
        $file_url = isset($_POST['file_url']) ? esc_url_raw($_POST['file_url']) : '';
        
        // Get current assets
        $ckan_assets = get_field('ckan_asset', $post_id);
        
        if (!is_array($ckan_assets)) {
            $ckan_assets = array();
        }
        
        // Update or add new asset
        $asset = array(
            'ckan_asset_name' => $name,
            'ckan_asset_discription' => $description,
            'ckan_asset_link' => $file_url
        );
        
        if ($index >= 0 && isset($ckan_assets[$index])) {
            // Update existing asset
            $ckan_assets[$index] = $asset;
        } else {
            // Add new asset
            $ckan_assets[] = $asset;
        }
        
        // Update the field
        update_field('ckan_asset', $ckan_assets, $post_id);
        
        wp_send_json_success(array(
            'message' => 'Asset saved successfully',
            'assets' => $ckan_assets
        ));
    }
    
    /**
     * AJAX handler สำหรับลบ asset
     */
    public function handle_delete_asset() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'ckan_rp_list_nonce')) {
            wp_send_json_error('Security check failed');
        }
        
        $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
        $index = isset($_POST['index']) ? intval($_POST['index']) : -1;
        
        // Get current assets
        $ckan_assets = get_field('ckan_asset', $post_id);
        
        if (!is_array($ckan_assets) || !isset($ckan_assets[$index])) {
            wp_send_json_error('Asset not found');
        }
        
        // Remove asset
        array_splice($ckan_assets, $index, 1);
        
        // Update the field
        update_field('ckan_asset', $ckan_assets, $post_id);
        
        wp_send_json_success(array(
            'message' => 'Asset deleted successfully',
            'assets' => $ckan_assets
        ));
    }
    
    /**
     * Shortcode สำหรับแสดงรายการไฟล์
     */
    public function shortcode_rp_list($atts) {
        // Enqueue necessary styles and scripts
        wp_enqueue_style('font-awesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');
        wp_enqueue_style('ckan-rp-list-css', get_stylesheet_directory_uri() . '/css/ckan-rp-list.css');
        wp_enqueue_style('ckan-data-preview-css', get_stylesheet_directory_uri() . '/css/ckan-data-preview.css');
        wp_enqueue_style('ckan-data-preview-filter-css', get_stylesheet_directory_uri() . '/css/ckan-data-preview-filter.css');
        wp_enqueue_style('ckan-api-css', get_stylesheet_directory_uri() . '/css/ckan-api.css');
        
        wp_enqueue_script('xlsx-js', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', array(), null, true);
        wp_enqueue_script('ckan-rp-list-js', get_stylesheet_directory_uri() . '/js/ckan-rp-list.js', array('jquery'), null, true);
        wp_enqueue_script('ckan-data-preview-js', get_stylesheet_directory_uri() . '/js/ckan-data-preview.js', array('jquery', 'xlsx-js'), null, true);
        wp_enqueue_script('ckan-data-preview-filter-js', get_stylesheet_directory_uri() . '/js/ckan-data-preview-filter.js', array('jquery'), null, true);
        
        // Localize script with AJAX URL and nonce
        wp_localize_script('ckan-rp-list-js', 'ckan_rp_list_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('ckan_rp_list_nonce')
        ));
        
        // เพิ่มตัวแปร JavaScript สำหรับใช้ใน script
        wp_add_inline_script('ckan-data-preview-js', 'var get_stylesheet_directory_uri = "' . get_stylesheet_directory_uri() . '";', 'before');
        
        // Get current post ID
        $post_id = get_the_ID();
        
        // Get repeater field values (using ACF)
        $ckan_assets = get_field('ckan_asset', $post_id);
        
        // Start output buffering to capture HTML
        ob_start();
        
        // Main container
        echo '<div class="ckan-assets-container" data-post-id="' . $post_id . '">';
        
        // Table header
        echo '<div class="ckan-assets-header">';
        echo '<h3>ข้อมูลและทรัพยากร</h3>';
        echo '<button class="ckan-add-asset-btn"><i class="fa fa-plus-circle"></i> เพิ่มรายการ</button>';
        echo '</div>';
        
        // Assets table
        echo '<div class="ckan-assets-table">';
        
        // Display assets if they exist
        if ($ckan_assets && is_array($ckan_assets) && count($ckan_assets) > 0) {
            foreach ($ckan_assets as $index => $asset) {
                $name = isset($asset['ckan_asset_name']) ? $asset['ckan_asset_name'] : '';
                $description = isset($asset['ckan_asset_discription']) ? $asset['ckan_asset_discription'] : '';
                $file_url = isset($asset['ckan_asset_link']) ? $asset['ckan_asset_link'] : '';
                
                // Get file extension and icon
                $file_ext = pathinfo($file_url, PATHINFO_EXTENSION);
                $file_icon = $this->get_file_icon_class($file_ext);
                
                // Encode file URL for security
                $encoded_url = base64_encode($file_url);
                
                echo '<div class="ckan-asset-item" data-index="' . $index . '">';
                echo '<div class="ckan-asset-icon"><i class="' . $file_icon . '"></i></div>';
                echo '<div class="ckan-asset-info">';
                echo '<div class="ckan-asset-name">' . esc_html($name) . '</div>';
                echo '<div class="ckan-asset-description">' . esc_html($description) . '</div>';
                echo '</div>';
                echo '<div class="ckan-asset-actions">';
                echo '<button class="ckan-download-btn" data-url="' . esc_attr($encoded_url) . '">ดาวน์โหลด</button>';
                echo '<button class="ckan-preview-btn" data-url="' . esc_attr($encoded_url) . '">ดูตัวอย่าง</button>';
                echo '<button class="ckan-edit-btn" data-index="' . $index . '"><i class="fa fa-pencil"></i></button>';
                echo '<button class="ckan-delete-btn" data-index="' . $index . '"><i class="fa fa-trash"></i></button>';
                echo '</div>';
                echo '</div>';
            }
        } else {
            echo '<div class="ckan-no-assets">ไม่มีรายการไฟล์</div>';
        }
        
        echo '</div>'; // End assets table
        
        // Modal for adding/editing assets
        echo '<div class="ckan-modal" id="ckan-asset-modal">';
        echo '<div class="ckan-modal-content">';
        echo '<span class="ckan-modal-close">&times;</span>';
        echo '<h3 class="ckan-modal-title">เพิ่มรายการไฟล์</h3>';
        
        echo '<form id="ckan-asset-form" enctype="multipart/form-data">';
        echo '<input type="hidden" id="ckan-asset-index" name="asset_index" value="">';
        echo '<input type="hidden" id="ckan-asset-file-id" name="asset_file_id" value="">';
        echo '<input type="hidden" id="ckan-asset-file-url" name="asset_file_url" value="">';
        
        echo '<div class="ckan-form-group">';
        echo '<label for="ckan-asset-name">ชื่อไฟล์</label>';
        echo '<input type="text" id="ckan-asset-name" name="asset_name" required>';
        echo '</div>';
        
        echo '<div class="ckan-form-group">';
        echo '<label for="ckan-asset-description">คำอธิบายไฟล์</label>';
        echo '<textarea id="ckan-asset-description" name="asset_description"></textarea>';
        echo '</div>';
        
        echo '<div class="ckan-form-group">';
        echo '<label for="ckan-asset-file">อัพโหลดไฟล์</label>';
        echo '<div class="ckan-file-upload-wrapper">';
        echo '<input type="file" id="ckan-asset-file" name="asset_file">';
        echo '<div class="ckan-upload-status"></div>';
        echo '</div>';
        echo '<div class="ckan-current-file-container" style="display:none;">';
        echo '<span class="ckan-current-file-label">ไฟล์ปัจจุบัน: </span>';
        echo '<span id="ckan-current-file"></span>';
        echo '</div>';
        echo '</div>';
        
        echo '<div class="ckan-form-actions">';
        echo '<button type="submit" class="ckan-submit-btn">บันทึก</button>';
        echo '<button type="button" class="ckan-cancel-btn">ยกเลิก</button>';
        echo '</div>';
        
        echo '</form>';
        echo '</div>'; // End modal content
        echo '</div>'; // End modal
        
        // Modal for previewing files
        echo '<div class="ckan-preview-modal" id="ckan-preview-modal">';
        echo '<div class="ckan-preview-modal-content">';
        echo '<span class="ckan-preview-modal-close">&times;</span>';
        echo '<h3 class="ckan-preview-modal-title">ดูตัวอย่าง</h3>';
        echo '<div class="ckan-preview-modal-body">';
        echo '<div class="ckan-preview-loading"><i class="fa fa-spinner fa-spin"></i> กำลังโหลด...</div>';
        echo '<div class="ckan-preview-data"></div>';
        echo '</div>'; // End modal body
        echo '</div>'; // End modal content
        echo '</div>'; // End modal
        
        echo '</div>'; // End main container
        
        // Return the buffered content
        return ob_get_clean();
    }
    
    /**
     * ฟังก์ชันหาไอคอนของไฟล์ตามนามสกุล
     */
    private function get_file_icon_class($ext) {
        $ext = strtolower($ext);
        
        $icons = array(
            'pdf' => 'fa fa-file-pdf-o',
            'doc' => 'fa fa-file-word-o',
            'docx' => 'fa fa-file-word-o',
            'xls' => 'fa fa-file-excel-o',
            'xlsx' => 'fa fa-file-excel-o',
            'ppt' => 'fa fa-file-powerpoint-o',
            'pptx' => 'fa fa-file-powerpoint-o',
            'jpg' => 'fa fa-file-image-o',
            'jpeg' => 'fa fa-file-image-o',
            'png' => 'fa fa-file-image-o',
            'gif' => 'fa fa-file-image-o',
            'zip' => 'fa fa-file-archive-o',
            'rar' => 'fa fa-file-archive-o',
            'txt' => 'fa fa-file-text-o',
        );
        
        return isset($icons[$ext]) ? $icons[$ext] : 'fa fa-file-o';
    }
    
    /**
     * เรียกใช้ instance ของคลาส (Singleton pattern)
     * @return CKAN_API_Integration
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        
        return self::$instance;
    }
}

// เริ่มต้นการทำงานของคลาส
function ckan_api_integration_init() {
    // สร้าง instance ของคลาส
    $ckan_api = CKAN_API_Integration::get_instance();
    
    // ลงทะเบียน shortcode
    add_shortcode('ckan_rp_list', array($ckan_api, 'shortcode_rp_list'));
}
add_action('init', 'ckan_api_integration_init');

/**
 * Shortcode สำหรับแสดงเมตาดาต้า
 */
function ckan_metafield_shortcode($atts) {
    // Enqueue necessary styles and scripts
    wp_enqueue_style('ckan-metafield-css', get_stylesheet_directory_uri() . '/css/ckan-metafield.css', array(), '1.0.0');
    wp_enqueue_script('ckan-metafield-js', get_stylesheet_directory_uri() . '/js/ckan-metafield.js', array('jquery'), '1.0.0', true);
    
    // Get current post ID
    $post_id = get_the_ID();
    
    // Define metadata fields and their labels
    $metadata_fields = ckan_get_metadata_fields();
    
    // Start output buffering to capture HTML
    ob_start();
    
    // Main container
    echo '<div class="ckan-metadata-container" data-post-id="' . $post_id . '">';
    
    // Section header
    echo '<div class="ckan-metadata-header">';
    echo '<h3>ข้อมูลชุดข้อมูล</h3>';
    echo '</div>';
    
    // Metadata table
    echo '<div class="ckan-metadata-table">';
    
    // Display all fields directly
    foreach ($metadata_fields as $field) {
        $field_value = get_field($field['field'], $post_id);
        
        // Format value based on type
        $formatted_value = ckan_format_field_value($field_value, $field['type']);
        
        echo '<div class="ckan-metadata-row">';
        echo '<div class="ckan-metadata-label">' . esc_html($field['label']) . '</div>';
        echo '<div class="ckan-metadata-value">' . $formatted_value . '</div>';
        echo '</div>';
    }
    
    echo '</div>'; // End metadata table
    
    echo '</div>'; // End main container
    
    // Return the buffered content
    return ob_get_clean();
}
add_shortcode('ckan_metafield', 'ckan_metafield_shortcode');

/**
 * Get metadata fields configuration
 */
function ckan_get_metadata_fields() {
    return array(
        // หมวดที่ 1
        array(
            'label' => 'ประเภทชุดข้อมูล',
            'field' => 'ckan_cdata',
            'type' => 'text'
        ),
        array(
            'label' => 'ยินยอมให้นำข้อมูลชุดข้อมูลไปใช้ที่ GD-Catalog',
            'field' => 'ckan_gd_agree',
            'type' => 'boolean'
        ),
        array(
            'label' => 'ชื่อผู้ติดต่อ',
            'field' => 'ckan_org_name',
            'type' => 'text'
        ),
        array(
            'label' => 'อีเมล์ผู้ติดต่อ',
            'field' => 'ckan_org_mail',
            'type' => 'email'
        ),
        array(
            'label' => 'วัตถุประสงค์',
            'field' => 'ckan_objective',
            'type' => 'text'
        ),
        array(
            'label' => 'หน่วยความถี่ของการปรับปรุงข้อมูล',
            'field' => 'ckan_fr_update',
            'type' => 'text'
        ),
        array(
            'label' => 'ค่าความถี่ของการปรับปรุงข้อมูล (ความถี่เป็นปี)',
            'field' => 'ckan_fr_year',
            'type' => 'text'
        ),
        array(
            'label' => 'ขอบเขตเชิงภูมิศาสตร์หรือเชิงพื้นที่',
            'field' => 'ckan_area',
            'type' => 'text'
        ),
        array(
            'label' => 'แหล่งที่มา',
            'field' => 'ckan_source',
            'type' => 'text'
        ),
        array(
            'label' => 'รูปแบบการเก็บข้อมูล',
            'field' => 'ckan_cformat',
            'type' => 'text'
        ),
        array(
            'label' => 'หมวดหมู่ข้อมูลตามธรรมาภิบาลข้อมูลภาครัฐ',
            'field' => 'ckan_gov',
            'type' => 'text'
        ),
        array(
            'label' => 'สัญญาอนุญาตให้ใช้ข้อมูล',
            'field' => 'ckan_clicense',
            'type' => 'text'
        ),
        // หมวดที่ 2
        array(
            'label' => 'เงื่อนไขในการเข้าถึงข้อมูล',
            'field' => 'ckan_caccess',
            'type' => 'text'
        ),
        array(
            'label' => 'URL',
            'field' => 'ckan_url',
            'type' => 'url'
        ),
        array(
            'label' => 'ภาษาที่ใช้',
            'field' => 'ckan_language',
            'type' => 'text'
        ),
        array(
            'label' => 'วันที่เริ่มสร้าง',
            'field' => 'ckan_data_create',
            'type' => 'date'
        ),
        array(
            'label' => 'วันที่ปรับปรุง',
            'field' => 'ckan_data_update',
            'type' => 'date'
        ),
        array(
            'label' => 'ชุดข้อมูลที่มีคุณค่าสูง',
            'field' => 'ckan_height_value',
            'type' => 'text'
        ),
        array(
            'label' => 'ข้อมูลอ้างอิง',
            'field' => 'ckan_ref',
            'type' => 'text'
        ),
        array(
            'label' => 'สร้างโดย',
            'field' => 'ckan_create_by',
            'type' => 'text'
        ),
        array(
            'label' => 'สร้างในระบบเมื่อ',
            'field' => 'ckan_auto_createpost',
            'type' => 'datetime'
        ),
        array(
            'label' => 'ปรับปรุงครั้งล่าสุดในระบบเมื่อ',
            'field' => 'ckan_auto_updatepost',
            'type' => 'datetime'
        )
    );
}

/**
 * Helper function to format field values based on type
 */
function ckan_format_field_value($value, $type) {
    if (empty($value) && $value !== '0' && $value !== 0) {
        return '<span class="ckan-empty-value">ไม่มีข้อมูล</span>';
    }
    
    switch ($type) {
        case 'boolean':
            if ($value === true || $value === 1 || $value === '1' || strtolower($value) === 'true' || strtolower($value) === 'yes') {
                return '<span class="boolean-true">ใช่</span>';
            } else {
                return '<span class="boolean-false">ไม่ใช่</span>';
            }
            
        case 'email':
            return '<a href="mailto:' . esc_attr($value) . '">' . esc_html($value) . '</a>';
            
        case 'url':
            $display_url = esc_html($value);
            // ตัดข้อความ URL ที่ยาวเกินไปและแสดงเป็น tooltip
            if (strlen($display_url) > 50) {
                $display_url = substr($display_url, 0, 47) . '...';
            }
            return '<a href="' . esc_url($value) . '" target="_blank" title="' . esc_attr($value) . '">' . $display_url . '</a>';
            
        case 'date':
            // Assuming value is in standard format or timestamp
            if (is_numeric($value)) {
                return date_i18n(get_option('date_format'), $value);
            } elseif (strtotime($value)) {
                return date_i18n(get_option('date_format'), strtotime($value));
            } else {
                return esc_html($value);
            }
            
        case 'datetime':
            // Assuming value is in standard format or timestamp
            if (is_numeric($value)) {
                return date_i18n(get_option('date_format') . ' ' . get_option('time_format'), $value);
            } elseif (strtotime($value)) {
                return date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($value));
            } else {
                return esc_html($value);
            }
            
        default:
            return esc_html($value);
    }
}