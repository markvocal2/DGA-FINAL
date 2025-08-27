<?php
/**
 * Template for List News Layout
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

<div class="news-module list-layout" data-post-type="<?php echo esc_attr($attributes['post_type']); ?>" role="region" aria-label="News List">
    <!-- Skeleton Loading Screen -->
    <div class="skeleton-loader" aria-hidden="true">
        <?php for ($i = 0; $i < 5; $i++) : ?>
            <div class="list-skeleton-item">
                <div class="skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton-category"></div>
                    <div class="skeleton-title"></div>
                    <div class="skeleton-meta"></div>
                    <div class="skeleton-excerpt"></div>
                </div>
            </div>
        <?php endfor; ?>
    </div>

    <!-- Main Content -->
    <div class="news-content" style="display: none;">
        <?php if ($posts->have_posts()) : ?>
            <!-- Optional Category Filter -->
            <?php if (!empty($attributes['show_filter']) && $taxonomy) : 
                $categories = get_terms([
                    'taxonomy' => $taxonomy,
                    'hide_empty' => true
                ]);
            ?>
                <div class="list-filter-section" role="navigation" aria-label="Category filter">
                    <div class="filter-label">Filter by:</div>
                    <div class="filter-buttons">
                        <button class="filter-btn active" data-category="all">
                            All Categories
                        </button>
                        <?php foreach ($categories as $category) : ?>
                            <button class="filter-btn" data-category="<?php echo esc_attr($category->slug); ?>">
                                <?php echo esc_html($category->name); ?>
                            </button>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Articles List -->
            <div class="articles-list" role="feed" aria-label="News articles list">
                <?php 
                while ($posts->have_posts()) : $posts->the_post();
                    $post_id = get_the_ID();
                    $image = get_the_post_thumbnail_url($post_id, 'medium');
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
                    <article class="list-article<?php echo esc_attr($category_classes); ?>" role="article">
                        <div class="article-inner">
                            <!-- Article Image -->
                            <div class="article-image-wrapper">
                                <?php if ($image) : ?>
                                    <a href="<?php echo esc_url(get_permalink()); ?>" class="image-link" aria-hidden="true" tabindex="-1">
                                        <img src="<?php echo esc_url($image); ?>"
                                             alt="<?php echo esc_attr(get_the_title()); ?>"
                                             class="article-image"
                                             loading="lazy"
                                             width="300"
                                             height="200">
                                    </a>
                                <?php endif; ?>
                            </div>

                            <!-- Article Content -->
                            <div class="article-content">
                                <!-- Categories -->
                                <?php if (!empty($category_names)) : ?>
                                    <div class="category-tags" role="group" aria-label="Article categories">
                                        <?php foreach ($category_names as $category_name) : ?>
                                            <span class="category-tag">
                                                <?php echo esc_html($category_name); ?>
                                            </span>
                                        <?php endforeach; ?>
                                    </div>
                                <?php endif; ?>

                                <!-- Title -->
                                <h2 class="article-title">
                                    <a href="<?php echo esc_url(get_permalink()); ?>" class="title-link">
                                        <?php echo esc_html(get_the_title()); ?>
                                    </a>
                                </h2>

                                <!-- Meta Information -->
                                <div class="article-meta">
                                    <span class="author" role="text">
                                        By <?php echo esc_html(get_the_author()); ?>
                                    </span>
                                    <time datetime="<?php echo get_the_date('c'); ?>" class="publish-date">
                                        <?php echo esc_html(get_the_date('F j, Y')); ?>
                                    </time>
                                    <?php if (comments_open()) : ?>
                                        <span class="comment-count">
                                            <?php comments_number('0 Comments', '1 Comment', '% Comments'); ?>
                                        </span>
                                    <?php endif; ?>
                                </div>

                                <!-- Excerpt -->
                                <div class="article-excerpt">
                                    <?php
                                    $excerpt = has_excerpt() ? get_the_excerpt() : wp_trim_words(get_the_content(), 30, '...');
                                    echo wp_kses_post($excerpt);
                                    ?>
                                </div>

                                <!-- Read More Link -->
                                <div class="article-footer">
                                    <a href="<?php echo esc_url(get_permalink()); ?>" 
                                       class="read-more-link"
                                       aria-label="Read more about <?php echo esc_attr(get_the_title()); ?>">
                                        Read Full Article
                                        <svg class="arrow-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                                        </svg>
                                    </a>
                                    <?php if (function_exists('get_reading_time')) : ?>
                                        <span class="reading-time">
                                            <?php echo esc_html(get_reading_time()); ?> min read
                                        </span>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                    </article>
                <?php endwhile; ?>
            </div>

            <!-- Pagination -->
            <?php if ($attributes['show_pagination'] && $posts->max_num_pages > 1) : ?>
                <nav class="list-pagination" role="navigation" aria-label="Articles pagination">
                    <?php
                    echo paginate_links(array(
                        'total' => $posts->max_num_pages,
                        'current' => max(1, get_query_var('paged')),
                        'prev_text' => '
                            <span class="screen-reader-text">Previous page</span>
                            <svg class="arrow-icon prev" width="20" height="20" viewBox="0 0 24 24">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                            </svg>
                        ',
                        'next_text' => '
                            <span class="screen-reader-text">Next page</span>
                            <svg class="arrow-icon next" width="20" height="20" viewBox="0 0 24 24">
                                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                            </svg>
                        ',
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
    const newsModule = document.querySelector('.news-module.list-layout');
    if (!newsModule) return;

    const skeletonLoader = newsModule.querySelector('.skeleton-loader');
    const newsContent = newsModule.querySelector('.news-content');
    const filterButtons = newsModule.querySelectorAll('.filter-btn');
    const articles = newsModule.querySelectorAll('.list-article');

    // Show content after loading
    setTimeout(() => {
        skeletonLoader.style.display = 'none';
        newsContent.style.display = 'block';
        
        // Add entrance animation classes
        articles.forEach((article, index) => {
            setTimeout(() => {
                article.classList.add('appear');
            }, index * 100);
        });
    }, 500);

    // Category filtering
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            
            // Update active button state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Filter articles with animation
            articles.forEach(article => {
                article.classList.remove('appear');
                
                setTimeout(() => {
                    if (category === 'all') {
                        article.style.display = 'block';
                        article.classList.add('appear');
                    } else {
                        if (article.classList.contains(`category-${category}`)) {
                            article.style.display = 'block';
                            article.classList.add('appear');
                        } else {
                            article.style.display = 'none';
                        }
                    }
                }, 300);
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

    // Optional: Add smooth scroll to top on pagination click
    const paginationLinks = newsModule.querySelectorAll('.list-pagination a');
    paginationLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (!e.ctrlKey && !e.shiftKey) {
                e.preventDefault();
                const href = link.getAttribute('href');
                newsModule.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    window.location.href = href;
                }, 500);
            }
        });
    });
});
</script>