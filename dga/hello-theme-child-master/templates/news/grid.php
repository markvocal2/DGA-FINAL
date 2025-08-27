<?php
/**
 * Template for Grid News Layout
 * 
 * @package CustomNewsModule
 * @version 1.0.0
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Ensure required variables exist
if (!isset($posts) || !isset($taxonomy)) {
    return;
}
?>

<div class="news-module grid-layout" data-post-type="<?php echo esc_attr($attributes['post_type']); ?>" role="region" aria-label="News Grid">
    <!-- Skeleton Loading Screen -->
    <div class="skeleton-loader" aria-hidden="true">
        <div class="grid-skeleton">
            <?php for ($i = 0; $i < 6; $i++) : ?>
                <div class="skeleton-item">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-category"></div>
                        <div class="skeleton-title"></div>
                        <div class="skeleton-meta"></div>
                    </div>
                </div>
            <?php endfor; ?>
        </div>
    </div>

    <!-- Main Content -->
    <div class="news-content" style="display: none;">
        <?php if ($posts->have_posts()) : ?>
            <div class="grid-filter-bar">
                <?php if (!empty($attributes['show_filter']) && $taxonomy) : 
                    $categories = get_terms([
                        DGA_TAXONOMY_FIELD => $taxonomy,
                        DGA_HIDE_EMPTY_FIELD => true
                    ]);
                ?>
                    <div class="filter-wrapper" role="navigation" aria-label="Category filter">
                        <button class="filter-button active" data-category="all">
                            All Categories
                        </button>
                        <?php foreach ($categories as $category) : ?>
                            <button class="filter-button" data-category="<?php echo esc_attr($category->slug); ?>">
                                <?php echo esc_html($category->name); ?>
                            </button>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>

            <div class="articles-grid" role="feed" aria-label="News articles grid">
                <?php 
                while ($posts->have_posts()) : $posts->the_post();
                    $post_id = get_the_ID();
                    $image = get_the_post_thumbnail_url($post_id, 'medium_large');
                    $categories = get_the_terms($post_id, $taxonomy);
                    $category_classes = '';
                    $category_names = [];
                    
                    if ($categories && !is_wp_error($categories)) {
                        foreach ($categories as $category) {
                            $category_classes .= ' category-' . $category->slug;
                            $category_names[] = $category->name;
                        }
                    }
                ?>
                    <article class="grid-article<?php echo esc_attr($category_classes); ?>" role="article">
                        <div class="article-image-wrapper">
                            <?php if ($image) : ?>
                                <img src="<?php echo esc_url($image); ?>"
                                     alt="<?php echo esc_attr(get_the_title()); ?>"
                                     class="article-image"
                                     loading="lazy"
                                     width="400"
                                     height="225">
                            <?php endif; ?>

                            <?php if (!empty($category_names)) : ?>
                                <div class="category-badges">
                                    <?php foreach (array_slice($category_names, 0, 2) as $category_name) : ?>
                                        <span class="category-badge">
                                            <?php echo esc_html($category_name); ?>
                                        </span>
                                    <?php endforeach; ?>
                                </div>
                            <?php endif; ?>
                        </div>

                        <div class="article-content">
                            <h2 class="article-title">
                                <a href="<?php echo esc_url(get_permalink()); ?>"
                                   aria-label="Read more about <?php echo esc_attr(get_the_title()); ?>">
                                    <?php echo esc_html(get_the_title()); ?>
                                </a>
                            </h2>

                            <div class="article-meta">
                                <span class="author">
                                    By <?php echo esc_html(get_the_author()); ?>
                                </span>
                                <time datetime="<?php echo get_the_date('c'); ?>" class="publish-date">
                                    <?php echo esc_html(get_the_date()); ?>
                                </time>
                                <?php if (comments_open()) : ?>
                                    <span class="comment-count">
                                        <?php comments_number('0 Comments', '1 Comment', '% Comments'); ?>
                                    </span>
                                <?php endif; ?>
                            </div>

                            <div class="article-excerpt">
                                <?php
                                $excerpt = has_excerpt() ? get_the_excerpt() : wp_trim_words(get_the_content(), 20, '...');
                                echo wp_kses_post($excerpt);
                                ?>
                            </div>

                            <a href="<?php echo esc_url(get_permalink()); ?>" 
                               class="read-more-button"
                               aria-label="Continue reading about <?php echo esc_attr(get_the_title()); ?>">
                                Read More
                                <svg class="arrow-icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                                </svg>
                            </a>
                        </div>
                    </article>
                <?php endwhile; ?>
            </div>

            <?php if ($attributes['show_pagination'] && $posts->max_num_pages > 1) : ?>
                <nav class="pagination-nav" role="navigation" aria-label="Articles pagination">
                    <div class="pagination-wrapper">
                        <?php
                        echo paginate_links(array(
                            'total' => $posts->max_num_pages,
                            'current' => max(1, get_query_var('paged')),
                            'prev_text' => sprintf(
                                '<span class="screen-reader-text">%s</span><svg class="arrow-icon" width="20" height="20" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>',
                                __('Previous page')
                            ),
                            'next_text' => sprintf(
                                '<span class="screen-reader-text">%s</span><svg class="arrow-icon" width="20" height="20" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>',
                                __('Next page')
                            ),
                            'type' => 'list'
                        ));
                        ?>
                    </div>
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
    const newsModule = document.querySelector('.news-module.grid-layout');
    if (!newsModule) return;

    const skeletonLoader = newsModule.querySelector('.skeleton-loader');
    const newsContent = newsModule.querySelector('.news-content');
    const filterButtons = newsModule.querySelectorAll('.filter-button');
    const articles = newsModule.querySelectorAll('.grid-article');

    // Show content after loading
    setTimeout(() => {
        skeletonLoader.style.display = 'none';
        newsContent.style.display = 'block';
    }, 500);

    // Category filtering
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            
            // Update active button state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Filter articles
            articles.forEach(article => {
                if (category === 'all') {
                    article.style.display = 'block';
                } else {
                    article.style.display = article.classList.contains(`category-${category}`) 
                        ? 'block' 
                        : 'none';
                }
            });
        });
    });

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

        newsModule.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
});
</script>