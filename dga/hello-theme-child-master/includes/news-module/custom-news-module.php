<?php
/**
 * Custom News Module
 * 
 * @package CustomNewsModule
 * @version 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class CustomNewsModule {
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
            'post_type' => 'article',
            'layout' => 'featured',
            'posts_per_page' => 6,
            'offset' => 0,
            'category' => '',
            'show_filter' => true,
            'show_pagination' => true,
            'show_excerpt' => true,
            'excerpt_length' => 20,
            'show_author' => true,
            'show_date' => true,
            'show_comments' => true,
            'image_size' => 'large',
            'cache_time' => 3600 // 1 hour
        );
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        add_shortcode('custom_news_display', array($this, 'render_shortcode'));
        add_action('wp_ajax_load_more_posts', array($this, 'ajax_load_more_posts'));
        add_action('wp_ajax_nopriv_load_more_posts', array($this, 'ajax_load_more_posts'));
        add_action('save_post', array($this, 'clear_cache'));
    }

    /**
     * Enqueue necessary assets
     */
    public function enqueue_assets() {
        // Styles
        wp_enqueue_style(
            'custom-news-style',
            get_stylesheet_directory_uri() . '/css/custom-news.css',
            array(),
            filemtime(get_stylesheet_directory() . '/css/custom-news.css')
        );

        // Scripts
        wp_enqueue_script(
            'custom-news-script',
            get_stylesheet_directory_uri() . '/js/custom-news.js',
            array('jquery'),
            filemtime(get_stylesheet_directory() . '/js/custom-news.js'),
            true
        );

        // Localize script
        wp_localize_script('custom-news-script', 'customNewsAjax', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('custom-news-nonce'),
            'i18n' => array(
                'loading' => __('Loading...', 'custom-news'),
                'no_posts' => __('No posts found.', 'custom-news'),
                'error' => __('Error loading posts.', 'custom-news')
            )
        ));
    }

    /**
     * Render shortcode
     */
    public function render_shortcode($atts) {
        // Parse attributes
        $attributes = shortcode_atts($this->default_settings, $atts);
        
        // Validate post type
        $valid_post_types = array('article' => 'tarticle', 'news' => 'tnew');
        if (!isset($valid_post_types[$attributes['post_type']])) {
            return '<p>' . __('Invalid post type specified.', 'custom-news') . '</p>';
        }

        // Set taxonomy based on post type
        $taxonomy = $valid_post_types[$attributes['post_type']];

        // Get cached content
        $cache_key = $this->get_cache_key($attributes);
        $cached_content = get_transient($cache_key);

        if (false !== $cached_content && !is_preview()) {
            return $cached_content;
        }

        // Query arguments
        $args = array(
            'post_type' => $attributes['post_type'],
            'posts_per_page' => $attributes['posts_per_page'],
            'offset' => $attributes['offset'],
            'post_status' => 'publish',
            'orderby' => 'date',
            'order' => 'DESC',
            'ignore_sticky_posts' => true
        );

        // Add category if specified
        if (!empty($attributes['category'])) {
            $args['tax_query'] = array(
                array(
                    'taxonomy' => $taxonomy,
                    'field' => 'slug',
                    'terms' => explode(',', $attributes['category'])
                )
            );
        }

        // Get posts
        $posts = new WP_Query($args);
        
        // Start output buffering
        ob_start();

        // Include template based on layout
        $template_path = $this->get_template_path($attributes['layout']);
        if (file_exists($template_path)) {
            // Make variables available to template
            $module = $this;
            include $template_path;
        } else {
            echo '<p>' . __('Template not found.', 'custom-news') . '</p>';
        }

        // Get the buffered content
        $content = ob_get_clean();

        // Cache the content
        if (!is_preview()) {
            set_transient($cache_key, $content, $attributes['cache_time']);
        }

        return $content;
    }

    /**
     * Get template path
     */
    private function get_template_path($layout) {
        $template_dir = get_stylesheet_directory() . '/templates/news/';
        $layouts = array(
            'featured' => 'featured.php',
            'grid' => 'grid.php',
            'list' => 'list.php',
            'compact' => 'compact.php'
        );

        // Allow theme to override template location
        $template_dir = apply_filters('custom_news_template_directory', $template_dir);
        
        return $template_dir . (isset($layouts[$layout]) ? $layouts[$layout] : 'featured.php');
    }

    /**
     * Generate cache key
     */
    private function get_cache_key($attributes) {
        return 'custom_news_' . md5(serialize($attributes) . get_locale());
    }

    /**
     * Clear cache when posts are updated
     */
    public function clear_cache($post_id) {
        if (wp_is_post_revision($post_id)) {
            return;
        }

        $post_type = get_post_type($post_id);
        if (in_array($post_type, array('article', 'news'))) {
            $this->clear_all_cache();
        }
    }

    /**
     * Clear all module cache
     */
    public function clear_all_cache() {
        global $wpdb;
        
        $wpdb->query(
            "DELETE FROM $wpdb->options 
            WHERE option_name LIKE '_transient_custom_news_%' 
            OR option_name LIKE '_transient_timeout_custom_news_%'"
        );
    }

    /**
     * AJAX load more posts
     */
    public function ajax_load_more_posts() {
        // Verify nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'custom-news-nonce')) {
            wp_send_json_error('Invalid nonce');
        }

        // Get page URL and parse query parameters
        $page_url = isset($_POST['page_url']) ? $_POST['page_url'] : '';
        $url_components = parse_url($page_url);
        parse_str($url_components['query'] ?? '', $query_params);

        // Get posts
        $args = array(
            'post_type' => isset($query_params['post_type']) ? $query_params['post_type'] : 'article',
            'posts_per_page' => isset($query_params['posts_per_page']) ? intval($query_params['posts_per_page']) : 6,
            'paged' => isset($query_params['paged']) ? intval($query_params['paged']) : 1,
            'post_status' => 'publish'
        );

        $posts = new WP_Query($args);

        ob_start();
        
        if ($posts->have_posts()) {
            while ($posts->have_posts()) {
                $posts->the_post();
                // Include appropriate template part based on layout
                get_template_part('templates/news/content', get_post_format());
            }
        } else {
            echo '<p>' . __('No more posts to load.', 'custom-news') . '</p>';
        }

        $content = ob_get_clean();
        wp_reset_postdata();

        wp_send_json_success(array(
            'content' => $content,
            'has_more' => $posts->max_num_pages > $args['paged']
        ));
    }

    /**
     * Helper function to get post thumbnail with fallback
     */
    public function get_post_thumbnail($post_id, $size = 'large', $attr = array()) {
        if (has_post_thumbnail($post_id)) {
            return get_the_post_thumbnail($post_id, $size, $attr);
        }

        // Fallback image
        $fallback_image = apply_filters('custom_news_fallback_image', '');
        if ($fallback_image) {
            return sprintf(
                '<img src="%s" alt="%s" class="fallback-image" />',
                esc_url($fallback_image),
                esc_attr(get_the_title($post_id))
            );
        }

        return '';
    }

    /**
     * Helper function to get custom excerpt
     */
    public function get_custom_excerpt($post_id, $length = 20) {
        $post = get_post($post_id);
        
        if (has_excerpt($post_id)) {
            return get_the_excerpt($post_id);
        }

        $content = get_the_content(null, false, $post);
        $content = strip_shortcodes($content);
        $content = excerpt_remove_blocks($content);
        $content = wp_strip_all_tags($content);
        
        return wp_trim_words($content, $length, '...');
    }

    /**
     * Helper function to get reading time
     */
    public function get_reading_time($post_id) {
        $content = get_post_field('post_content', $post_id);
        $word_count = str_word_count(strip_tags($content));
        $reading_time = ceil($word_count / 200); // Assuming 200 words per minute

        return sprintf(
            _n('%d minute read', '%d minutes read', $reading_time, 'custom-news'),
            $reading_time
        );
    }
}

// Initialize the module
CustomNewsModule::getInstance();