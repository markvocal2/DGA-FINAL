<?php
/**
 * News Settings UI
 * 
 * @package CustomNewsModule
 * @version 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class NewsSettingsUI {
    private static $instance = null;
    private $default_settings;

    /**
     * Get singleton instance
     */
    public static function getInstance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->init_defaults();
        $this->init_hooks();
    }

    /**
     * Initialize default settings
     */
    private function init_defaults() {
        $this->default_settings = array(
            'layouts' => array(
                'featured' => array(
                    'title' => __('Featured Layout', 'your-theme'),
                    'description' => __('Large featured post with grid below', 'your-theme'),
                    'icon' => 'featured-layout.svg'
                ),
                'grid' => array(
                    'title' => __('Grid Layout', 'your-theme'),
                    'description' => __('Equal-sized grid layout', 'your-theme'),
                    'icon' => 'grid-layout.svg'
                ),
                'list' => array(
                    'title' => __('List Layout', 'your-theme'),
                    'description' => __('Vertical list with thumbnails', 'your-theme'),
                    'icon' => 'list-layout.svg'
                ),
                'compact' => array(
                    'title' => __('Compact Layout', 'your-theme'),
                    'description' => __('Condensed list view', 'your-theme'),
                    'icon' => 'compact-layout.svg'
                )
            ),
            'post_types' => array(
                'article' => __('Articles', 'your-theme'),
                'news' => __('News', 'your-theme')
            ),
            'image_sizes' => array(
                'featured' => 'large',
                'grid' => 'medium_large',
                'list' => 'medium',
                'compact' => 'thumbnail'
            )
        );
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        add_action('wp_ajax_save_news_settings', array($this, 'ajax_save_settings'));
        add_action('wp_ajax_load_preview', array($this, 'ajax_load_preview'));
        add_filter('the_content', array($this, 'add_settings_button'));
    }

    /**
     * Enqueue assets
     */
    public function enqueue_assets() {
        wp_enqueue_style(
            'news-settings-style',
            get_stylesheet_directory_uri() . '/css/news-settings.css',
            array(),
            filemtime(get_stylesheet_directory() . '/css/news-settings.css')
        );

        wp_enqueue_script(
            'news-settings-script',
            get_stylesheet_directory_uri() . '/js/news-settings.js',
            array('jquery'),
            filemtime(get_stylesheet_directory() . '/js/news-settings.js'),
            true
        );

        wp_localize_script('news-settings-script', 'newsSettings', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('news-settings-nonce'),
            'i18n' => array(
                'saving' => __('Saving...', 'your-theme'),
                'saved' => __('Settings saved!', 'your-theme'),
                'error' => __('Error saving settings', 'your-theme'),
                'preview' => __('Loading preview...', 'your-theme')
            )
        ));
    }

    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        if ($hook == 'post.php' || $hook == 'post-new.php') {
            wp_enqueue_style('wp-color-picker');
            wp_enqueue_script('wp-color-picker');
            wp_enqueue_media();
        }
    }

    /**
     * Add settings button to shortcode
     */
    public function add_settings_button($content) {
        // ตรวจสอบว่ามี shortcode อยู่ในเนื้อหา
        if (has_shortcode($content, 'custom_news_display')) {
            // แยกเนื้อหาเป็นส่วนๆ และหา shortcode
            $pattern = '/\[custom_news_display[^\]]*\]/';
            preg_match($pattern, $content, $matches);
            
            if (!empty($matches[0])) {
                $shortcode = $matches[0];
                
                // สร้าง wrapper พร้อมปุ่มตั้งค่า
                $wrapped_content = '<div class="news-settings-wrapper">';
                $wrapped_content .= '<div class="news-content">' . do_shortcode($shortcode) . '</div>';
                $wrapped_content .= '<button type="button" class="news-settings-toggle" aria-label="' . esc_attr__('Open news settings', 'your-theme') . '">
                    <svg xmlns="http://www.w3.org/2000/svg" class="settings-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                    </svg>
                </button>';
                $wrapped_content .= '<div class="news-settings-panel" style="display: none;">';
                $wrapped_content .= $this->get_settings_form_html();
                $wrapped_content .= '</div>';
                $wrapped_content .= '</div>';
                
                // แทนที่ shortcode ด้วยเนื้อหาที่มี wrapper
                $content = str_replace($shortcode, $wrapped_content, $content);
            }
        }
        return $content;
    }

    /**
     * Get settings form HTML
     */
    private function get_settings_form_html() {
        ob_start();
        ?>
        <form id="newsSettingsForm" class="news-settings-form">
            <?php wp_nonce_field('news_settings_nonce', 'news_settings_nonce'); ?>

            <!-- Layout Selection -->
            <div class="settings-section">
                <h3><?php _e('Layout Selection', 'your-theme'); ?></h3>
                <div class="layout-options">
                    <?php foreach ($this->default_settings['layouts'] as $key => $layout) : ?>
                    <div class="layout-option" data-layout="<?php echo esc_attr($key); ?>">
                        <img src="<?php echo esc_url(get_stylesheet_directory_uri() . '/images/' . $layout['icon']); ?>" 
                             alt="<?php echo esc_attr($layout['title']); ?>" 
                             class="layout-preview">
                        <h4><?php echo esc_html($layout['title']); ?></h4>
                        <p><?php echo esc_html($layout['description']); ?></p>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- Content Settings -->
            <div class="settings-section">
                <h3><?php _e('Content Settings', 'your-theme'); ?></h3>
                <div class="settings-grid">
                    <!-- Post Type -->
                    <div class="settings-field">
                        <label for="post_type"><?php _e('Post Type', 'your-theme'); ?></label>
                        <select id="post_type" name="post_type">
                            <?php foreach ($this->default_settings['post_types'] as $key => $label) : ?>
                            <option value="<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <!-- Posts Per Page -->
                    <div class="settings-field">
                        <label for="posts_per_page"><?php _e('Posts Per Page', 'your-theme'); ?></label>
                        <input type="number" id="posts_per_page" name="posts_per_page" value="6" min="1" max="24">
                    </div>

                    <!-- Category -->
                    <div class="settings-field">
                        <label for="category"><?php _e('Category', 'your-theme'); ?></label>
                        <select id="category" name="category[]" multiple>
                            <?php echo $this->get_taxonomy_options(); ?>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Display Options -->
            <div class="settings-section">
                <h3><?php _e('Display Options', 'your-theme'); ?></h3>
                <div class="settings-grid">
                    <div class="settings-field checkbox">
                        <label>
                            <input type="checkbox" name="show_filter" checked>
                            <?php _e('Show Category Filter', 'your-theme'); ?>
                        </label>
                    </div>
                    <div class="settings-field checkbox">
                        <label>
                            <input type="checkbox" name="show_pagination" checked>
                            <?php _e('Show Pagination', 'your-theme'); ?>
                        </label>
                    </div>
                    <div class="settings-field checkbox">
                        <label>
                            <input type="checkbox" name="show_excerpt" checked>
                            <?php _e('Show Excerpt', 'your-theme'); ?>
                        </label>
                    </div>
                    <div class="settings-field checkbox">
                        <label>
                            <input type="checkbox" name="show_author" checked>
                            <?php _e('Show Author', 'your-theme'); ?>
                        </label>
                    </div>
                    <div class="settings-field checkbox">
                        <label>
                            <input type="checkbox" name="show_date" checked>
                            <?php _e('Show Date', 'your-theme'); ?>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Advanced Options -->
            <div class="settings-section">
                <h3><?php _e('Advanced Options', 'your-theme'); ?></h3>
                <div class="settings-grid">
                    <div class="settings-field">
                        <label for="cache_time"><?php _e('Cache Duration (seconds)', 'your-theme'); ?></label>
                        <input type="number" id="cache_time" name="cache_time" value="3600" min="0">
                    </div>
                    <div class="settings-field">
                        <label for="custom_class"><?php _e('Custom CSS Class', 'your-theme'); ?></label>
                        <input type="text" id="custom_class" name="custom_class">
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="settings-actions">
                <button type="button" class="preview-button">
                    <?php _e('Preview', 'your-theme'); ?>
                </button>
                <button type="submit" class="save-button">
                    <?php _e('Save Changes', 'your-theme'); ?>
                </button>
            </div>
        </form>
        <?php
        return ob_get_clean();
    }

    /**
     * Get taxonomy options
     */
    private function get_taxonomy_options() {
        $options = '';
        $taxonomies = array(
            'article' => 'tarticle',
            'news' => 'tnew'
        );

        foreach ($taxonomies as $post_type => $taxonomy) {
            $terms = get_terms(array(
                'taxonomy' => $taxonomy,
                'hide_empty' => false
            ));

            if (!empty($terms) && !is_wp_error($terms)) {
                $options .= sprintf('<optgroup label="%s">', esc_attr(ucfirst($post_type)));
                foreach ($terms as $term) {
                    $options .= sprintf(
                        '<option value="%s">%s</option>',
                        esc_attr($term->slug),
                        esc_html($term->name)
                    );
                }
                $options .= '</optgroup>';
            }
        }

        return $options;
    }

    /**
     * AJAX save settings
     */
    public function ajax_save_settings() {
        check_ajax_referer('news-settings-nonce', 'nonce');

        if (!current_user_can('edit_posts')) {
            wp_send_json_error(__('Permission denied', 'your-theme'));
        }

        $settings = array();
        parse_str($_POST['form_data'], $settings);

        // Sanitize settings
        $sanitized_settings = $this->sanitize_settings($settings);

        // Build shortcode
        $shortcode = $this->build_shortcode($sanitized_settings);

        // Save to post meta if post_id is provided
        if (!empty($_POST['post_id'])) {
            update_post_meta($_POST['post_id'], '_news_display_settings', $sanitized_settings);
        }

        wp_send_json_success(array(
            'message' => __('Settings saved successfully', 'your-theme'),
            'shortcode' => $shortcode,
            'settings' => $sanitized_settings
        ));
    }

    /**
     * AJAX load preview
     */
    public function ajax_load_preview() {
        check_ajax_referer('news-settings-nonce', 'nonce');

        if (!current_user_can('edit_posts')) {
            wp_send_json_error(__('Permission denied', 'your-theme'));
        }

        $settings = array();
        parse_str($_POST['form_data'], $settings);

        // Sanitize settings
        $sanitized_settings = $this->sanitize_settings($settings);

        // Build shortcode
        $shortcode = $this->build_shortcode($sanitized_settings);

        // Get preview content
        $preview = do_shortcode($shortcode);

        wp_send_json_success(array(
            'preview' => $preview
        ));
    }

    /**
     * Sanitize settings
     */
    private function sanitize_settings($settings) {
        $sanitized = array();

        // Layout
        $sanitized['layout'] = isset($settings['layout']) ? 
            sanitize_key($settings['layout']) : 'featured';

        // Post Type
        $sanitized['post_type'] = isset($settings['post_type']) && 
            array_key_exists($settings['post_type'], $this->default_settings['post_types']) ?
            sanitize_key($settings['post_type']) : 'article';

        // Posts Per Page
        $sanitized['posts_per_page'] = isset($settings['posts_per_page']) ?
            absint($settings['posts_per_page']) : 6;

        // Category
        if (!empty($settings['category']) && is_array($settings['category'])) {
            $sanitized['category'] = array_map('sanitize_key', $settings['category']);
        }

        // Display Options
        $display_options = array(
            'show_filter',
            'show_pagination',
            'show_excerpt',
            'show_author',
            'show_date'
        );

        foreach ($display_options as $option) {
            $sanitized[$option] = isset($settings[$option]) ? 
                rest_sanitize_boolean($settings[$option]) : false;
        }

        // Cache Time
        $sanitized['cache_time'] = isset($settings['cache_time']) ?
            absint($settings['cache_time']) : 3600;

        // Custom Class
        $sanitized['custom_class'] = isset($settings['custom_class']) ?
            sanitize_html_class($settings['custom_class']) : '';

        return $sanitized;
    }

    /**
     * Build shortcode
     */
    private function build_shortcode($settings) {
        $attributes = array();

        foreach ($settings as $key => $value) {
            if (is_array($value)) {
                $value = implode(',', $value);
            } elseif (is_bool($value)) {
                $value = $value ? 'true' : 'false';
            }

            $attributes[] = sprintf('%s="%s"', $key, esc_attr($value));
        }

        return sprintf('[custom_news_display %s]', implode(' ', $attributes));
    }

    /**
     * Update post content with new shortcode
     */
    public function update_post_content($post_id, $shortcode) {
        $post = get_post($post_id);
        if (!$post) return false;

        $content = $post->post_content;
        $pattern = '/\[custom_news_display[^\]]*\]/';

        if (preg_match($pattern, $content)) {
            $content = preg_replace($pattern, $shortcode, $content);
        } else {
            $content .= "\n\n" . $shortcode;
        }

        $updated_post = array(
            'ID' => $post_id,
            'post_content' => $content
        );

        return wp_update_post($updated_post);
    }

    /**
     * Get saved settings
     */
    public function get_saved_settings($post_id) {
        $saved_settings = get_post_meta($post_id, '_news_display_settings', true);
        
        if (!empty($saved_settings)) {
            return wp_parse_args($saved_settings, $this->get_default_settings());
        }

        return $this->get_default_settings();
    }

    /**
     * Get default settings
     */
    private function get_default_settings() {
        return array(
            'layout' => 'featured',
            'post_type' => 'article',
            'posts_per_page' => 6,
            'category' => array(),
            'show_filter' => true,
            'show_pagination' => true,
            'show_excerpt' => true,
            'show_author' => true,
            'show_date' => true,
            'cache_time' => 3600,
            'custom_class' => ''
        );
    }
}

// Initialize the settings UI
NewsSettingsUI::getInstance();