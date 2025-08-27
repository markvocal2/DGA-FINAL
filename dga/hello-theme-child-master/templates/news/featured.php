<?php
/**
 * Template for Featured News Layout
 * 
 * @package CustomNewsModule
 * @version 1.0.0
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Ensure $posts and $taxonomy variables exist
if (!isset($posts) || !isset($taxonomy)) {
    return;
}
?>

<div class="news-module featured-layout" data-post-type="<?php echo esc_attr($attributes['post_type']); ?>" role="region" aria-label="Featured News Section">
    <!-- Skeleton Loading Screen -->
    <div class="skeleton-loader" aria-hidden="true">
        <div class="featured-skeleton">
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
                <div class="skeleton-category"></div>
                <div class="skeleton-title"></div>
                <div class="skeleton-excerpt"></div>
            </div>
        </div>
        <div class="grid-skeleton">
            <?php for ($i = 0; $i < 3; $i++) : ?>
                <div class="skeleton-item">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-category"></div>
                        <div class="skeleton-title"></div>
                    </div>
                </div>
            <?php endfor; ?>
        </div>
    </div>

    <!-- Main Content -->
    <div class="news-content" style="display: none;">
        <?php if ($posts->have_posts()) : ?>
            <!-- Featured Article Section -->
            <section class="featured-article-section">
                <?php
                // Get the first post for featured display
                $featured_post = $posts->posts[0];
                $featured_image = get_the_post_thumbnail_url($featured_post->ID, 'large');
                $featured_categories = get_the_terms($featured_post->ID, $taxonomy);
                $featured_date = get_the_date('F j, Y', $featured_post->ID);
                $featured_author = get_the_author_meta('display_name', $featured_post->post_author);
                ?>

                <article class="featured-article" role="article">
                    <div class="featured-image-wrapper">
                        <?php if ($featured_image) : ?>
                            <img src="<?php echo esc_url($featured_image); ?>"
                                 alt="<?php echo esc_attr($featured_post->post_title); ?>"
                                 class="featured-image"
                                 loading="lazy"
                                 width="1200"
                                 height="675">
                        <?php endif; ?>
                        
                        <?php if ($featured_categories && !is_wp_error($featured_categories)) : ?>
                            <div class="category-badge" role="text">
                                <?php echo esc_html($featured_categories[0]->name); ?>
                            </div>
                        <?php endif; ?>
                    </div>

                    <div class="article-content">
                        <h2 class="featured-title">
                            <a href="<?php echo get_permalink($featured_post->ID); ?>"
                               class="title-link"
                               aria-label="Read more about <?php echo esc_attr($featured_post->post_title); ?>">
                                <?php echo esc_html($featured_post->post_title); ?>
                            </a>
                        </h2>

                        <div class="article-meta">
                            <span class="author" role="text">
                                By <?php echo esc_html($featured_author); ?>
                            </span>
                            <time datetime="<?php echo get_the_date('c', $featured_post->ID); ?>" class="publish-date">
                                <?php echo esc_html($featured_date); ?>
                            </time>
                        </div>

                        <div class="article-excerpt">
                            <?php
                            $excerpt = has_excerpt($featured_post->ID) 
                                ? get_the_excerpt($featured_post->ID)
                                : wp_trim_words($featured_post->post_content, 30, '...');
                            echo wp_kses_post($excerpt);
                            ?>
                        </div>

                        <a href="<?php echo get_permalink($featured_post->ID); ?>" 
                           class="read-more-link"
                           aria-label="Continue reading about <?php echo esc_attr($featured_post->post_title); ?>">
                            Read More <span class="screen-reader-text">about <?php echo esc_attr($featured_post->post_title); ?></span>
                            <svg class="arrow-icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                            </svg>
                        </a>
                    </div>
                </article>
            </section>

            <!-- Grid Articles Section -->
            <?php if ($posts->post_count > 1) : ?>
                <section class="grid-articles-section" aria-label="Related Articles">
                    <div class="articles-grid">
                        <?php
                        // Skip the first post and show the rest in grid
                        $grid_posts = array_slice($posts->posts, 1, 3);
                        foreach ($grid_posts as $post) :
                            $image = get_the_post_thumbnail_url($post->ID, 'medium');
                            $categories = get_the_terms($post->ID, $taxonomy);
                            $date = get_the_date('F j, Y', $post->ID);
                        ?>
                            <article class="grid-article" role="article">
                                <div class="article-image-wrapper">
                                    <?php if ($image) : ?>
                                        <img src="<?php echo esc_url($image); ?>"
                                             alt="<?php echo esc_attr($post->post_title); ?>"
                                             class="article-image"
                                             loading="lazy"
                                             width="400"
                                             height="225">
                                    <?php endif; ?>

                                    <?php if ($categories && !is_wp_error($categories)) : ?>
                                        <div class="category-tag">
                                            <?php echo esc_html($categories[0]->name); ?>
                                        </div>
                                    <?php endif; ?>
                                </div>

                                <div class="grid-content">
                                    <h3 class="article-title">
                                        <a href="<?php echo get_permalink($post->ID); ?>"
                                           aria-label="Read more about <?php echo esc_attr($post->post_title); ?>">
                                            <?php echo esc_html($post->post_title); ?>
                                        </a>
                                    </h3>

                                    <time datetime="<?php echo get_the_date('c', $post->ID); ?>" class="grid-date">
                                        <?php echo esc_html($date); ?>
                                    </time>
                                </div>
                            </article>
                        <?php endforeach; ?>
                    </div>
                </section>
            <?php endif; ?>

            <?php if ($posts->max_num_pages > 1 && !empty($attributes['show_pagination'])) : ?>
                <nav class="pagination-nav" role="navigation" aria-label="Articles pagination">
                    <?php
                    echo paginate_links(array(
                        'total' => $posts->max_num_pages,
                        'current' => max(1, get_query_var('paged')),
                        'prev_text' => '<span class="screen-reader-text">Previous page</span>←',
                        'next_text' => '<span class="screen-reader-text">Next page</span>→',
                        'mid_size' => 2,
                        'type' => 'list'
                    ));
                    ?>
                </nav>
            <?php endif; ?>

        <?php else : ?>
            <div class="no-posts-found" role="alert">
                <p>No articles found. Please check back later.</p>
            </div>
        <?php endif; ?>
    </div>
</div>

<script type="text/javascript">
document.addEventListener('DOMContentLoaded', function() {
    const newsModule = document.querySelector('.news-module');
    const skeletonLoader = newsModule.querySelector('.skeleton-loader');
    const newsContent = newsModule.querySelector('.news-content');

    // Simulate loading time (remove in production)
    setTimeout(() => {
        skeletonLoader.style.display = 'none';
        newsContent.style.display = 'block';
    }, 500);

    // Initialize lazy loading for images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
});
</script>