<?php
/**
 * Template for Compact News Layout
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

<div class="news-module compact-layout" data-post-type="<?php echo esc_attr($attributes['post_type']); ?>" role="region" aria-label="News Compact View">
    <!-- Skeleton Loading Screen -->
    <div class="skeleton-loader" aria-hidden="true">
        <?php for ($i = 0; $i < 6; $i++) : ?>
            <div class="compact-skeleton-item">
                <div class="skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-meta"></div>
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
                    DGA_TAXONOMY_FIELD => $taxonomy,
                    DGA_HIDE_EMPTY_FIELD => true
                ]);
            ?>
                <div class="compact-filter-section" role="navigation" aria-label="Category filter">
                    <div class="filter-buttons">
                        <button class="filter-btn active" data-category="all">
                            <span class="filter-text">All</span>
                            <span class="filter-count"><?php echo $posts->found_posts; ?></span>
                        </button>
                        <?php foreach ($categories as $category) : ?>
                            <button class="filter-btn" data-category="<?php echo esc_attr($category->slug); ?>">
                                <span class="filter-text"><?php echo esc_html($category->name); ?></span>
                                <span class="filter-count"><?php echo esc_html($category->count); ?></span>
                            </button>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Articles List -->
            <div class="compact-articles-list" role="feed" aria-label="News articles">
                <?php 
                while ($posts->have_posts()) : $posts->the_post();
                    $post_id = get_the_ID();
                    $image = get_the_post_thumbnail_url($post_id, 'thumbnail');
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
                    <article class="compact-article<?php echo esc_attr($category_classes); ?>">
                        <!-- Article Link Wrapper -->
                        <a href="<?php echo esc_url(get_permalink()); ?>" 
                           class="article-link"
                           aria-label="Read <?php echo esc_attr(get_the_title()); ?>">
                            
                            <!-- Article Image -->
                            <?php if ($image) : ?>
                                <div class="article-image-wrapper">
                                    <img src="<?php echo esc_url($image); ?>"
                                         alt="<?php echo esc_attr(get_the_title()); ?>"
                                         class="article-image"
                                         loading="lazy"
                                         width="100"
                                         height="100">
                                </div>
                            <?php endif; ?>

                            <!-- Article Content -->
                            <div class="article-content">
                                <h2 class="article-title">
                                    <?php echo esc_html(get_the_title()); ?>
                                </h2>

                                <!-- Meta Information -->
                                <div class="article-meta">
                                    <?php if (!empty($category_names)) : ?>
                                        <span class="category-tag">
                                            <?php echo esc_html($category_names[0]); ?>
                                        </span>
                                    <?php endif; ?>

                                    <time datetime="<?php echo get_the_date('c'); ?>" class="publish-date">
                                        <?php echo esc_html(get_the_date('M j, Y')); ?>
                                    </time>

                                    <?php if (function_exists('get_reading_time')) : ?>
                                        <span class="reading-time" aria-label="Estimated reading time">
                                            <?php echo esc_html(get_reading_time($post_id)); ?>
                                        </span>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <!-- Arrow Icon -->
                            <div class="arrow-icon" aria-hidden="true">
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                                </svg>
                            </div>
                        </a>
                    </article>
                <?php endwhile; ?>
            </div>

            <!-- Load More Button / Pagination -->
            <?php if ($attributes['show_pagination'] && $posts->max_num_pages > 1) : ?>
                <?php if ($attributes['use_load_more']) : ?>
                    <button class="load-more-button" 
                            data-page="1" 
                            data-max-pages="<?php echo esc_attr($posts->max_num_pages); ?>"
                            aria-label="Load more articles">
                        <span class="button-text">Load More</span>
                        <span class="loading-indicator" aria-hidden="true"></span>
                    </button>
                <?php else : ?>
                    <nav class="compact-pagination" role="navigation" aria-label="Articles pagination">
                        <?php
                        echo paginate_links(array(
                            'total' => $posts->max_num_pages,
                            'current' => max(1, get_query_var('paged')),
                            'prev_text' => '
                                <span class="screen-reader-text">Previous page</span>
                                <svg class="arrow-icon" width="20" height="20" viewBox="0 0 24 24">
                                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                                </svg>
                            ',
                            'next_text' => '
                                <span class="screen-reader-text">Next page</span>
                                <svg class="arrow-icon" width="20" height="20" viewBox="0 0 24 24">
                                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                                </svg>
                            ',
                            'type' => 'list'
                        ));
                        ?>
                    </nav>
                <?php endif; ?>
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
    const moduleEl = document.querySelector('.news-module.compact-layout');
    if (!moduleEl) return;

    const skeletonLoader = moduleEl.querySelector('.skeleton-loader');
    const newsContent = moduleEl.querySelector('.news-content');
    const filterButtons = moduleEl.querySelectorAll('.filter-btn');
    const articles = moduleEl.querySelectorAll('.compact-article');
    const loadMoreButton = moduleEl.querySelector('.load-more-button');

    // Show content after loading
    setTimeout(() => {
        skeletonLoader.style.display = 'none';
        newsContent.style.display = 'block';
        
        // Add entrance animation to articles
        articles.forEach((article, index) => {
            setTimeout(() => {
                article.classList.add('appear');
            }, index * 50); // Faster animation for compact layout
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
                }, 200);
            });
        });
    });

    // Load More functionality
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', async function() {
            const currentPage = parseInt(loadMoreButton.dataset.page);
            const maxPages = parseInt(loadMoreButton.dataset.maxPages);
            
            if (currentPage >= maxPages) {
                loadMoreButton.style.display = 'none';
                return;
            }

            loadMoreButton.classList.add('loading');
            
            try {
                const response = await fetch(customNewsAjax.ajaxurl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'load_more_posts',
                        nonce: customNewsAjax.nonce,
                        page: currentPage + 1,
                        layout: 'compact'
                    })
                });

                const data = await response.json();
                
                if (data.success && data.content) {
                    const articlesList = moduleEl.querySelector('.compact-articles-list');
                    const tempContainer = document.createElement('div');
                    tempContainer.innerHTML = data.content;
                    
                    const newArticles = tempContainer.querySelectorAll('.compact-article');
                    newArticles.forEach(article => {
                        articlesList.appendChild(article);
                        setTimeout(() => {
                            article.classList.add('appear');
                        }, 100);
                    });

                    loadMoreButton.dataset.page = currentPage + 1;
                    
                    if (currentPage + 1 >= maxPages) {
                        loadMoreButton.style.display = 'none';
                    }
                }
            } catch (error) {
                console.error('Error loading more posts:', error);
            } finally {
                loadMoreButton.classList.remove('loading');
            }
        });
    }
});
</script>