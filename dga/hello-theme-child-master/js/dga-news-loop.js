(function($) {
    'use strict';

    // Carousel configuration
    const CONFIG = {
        slidesToShow: 6,
        slidesToScroll: 1,
        activeIndex: 0,
        totalSlides: 0,
        isAnimating: false,
        currentOffset: 0
    };

    $(document).ready(function() {
        initDgaNewsCarousel();
    });

    function initDgaNewsCarousel() {
        // Initialize all carousels on the page
        $('.dga-news-container').each(function() {
            const $carousel = $(this);
            const $items = $carousel.find('.dga-news-item');
            
            // Set total slides
            CONFIG.totalSlides = $items.length;
            
            // Set initial state
            updateActiveItem($carousel);
            setupCarouselLayout($carousel);
        });
        
        // Initialize navigation buttons
        $('.dga-news-navigator').each(function() {
            const $nav = $(this);
            const targetSelector = $nav.data('target') || '.dga-news-container';
            const $target = $(targetSelector).first();
            
            if ($target.length) {
                // Attach navigation events
                $nav.find('.dga-nav-prev').on('click', function() {
                    navigateCarousel($target, 'prev');
                });
                
                $nav.find('.dga-nav-next').on('click', function() {
                    navigateCarousel($target, 'next');
                });
                
                // Initial state of nav buttons
                updateNavButtons($nav, $target);
            }
        });
        
        // Initialize lazy loading and other features
        initLazyLoading();
        initAccessibility();
        initSwipeSupport();
        initKeyboardNavigation();
    }
    
    // Set up responsive layout
    function setupCarouselLayout($carousel) {
        const viewportWidth = window.innerWidth;
        
        // Determine number of slides to show based on viewport width
        if (viewportWidth < 768) {
            CONFIG.slidesToShow = 1;
        } else if (viewportWidth < 992) {
            CONFIG.slidesToShow = 2;
        } else if (viewportWidth < 1200) {
            CONFIG.slidesToShow = 3;
        } else {
            CONFIG.slidesToShow = 4;
        }
        
        // Position the carousel to show the active item
        updateCarouselPosition($carousel);
    }
    
    // Update active item styling
    function updateActiveItem($carousel) {
        const $items = $carousel.find('.dga-news-item');
        
        $items.removeClass('dga-news-active');
        $items.eq(CONFIG.activeIndex).addClass('dga-news-active');
    }
    
    // Update carousel position based on active index
    function updateCarouselPosition($carousel) {
        const $slider = $carousel.find('.dga-news-carousel');
        const $items = $carousel.find('.dga-news-item');
        const itemWidth = $items.first().outerWidth(true);
        
        // คำนวณค่า translate เพื่อให้ item ที่ active อยู่ซ้ายมือเสมอ
        // ใช้ค่า activeIndex เพื่อกำหนดว่าต้องเลื่อนไปข้างซ้ายกี่ item
        let translateValue = -(CONFIG.activeIndex * itemWidth);
        
        // ไม่ต้องปรับให้อยู่ตรงกลาง เพราะต้องการให้อยู่ซ้ายมือเสมอ
        
        $slider.css('transform', `translateX(${translateValue}px)`);
        
        // Update navigation buttons if available
        const $nav = $(`.dga-news-navigator[data-target=".dga-news-container"]`);
        if ($nav.length) {
            updateNavButtons($nav, $carousel);
        }
    }
    
    // Navigate the carousel in a direction
    function navigateCarousel($carousel, direction) {
        if (CONFIG.isAnimating) return;
        
        const $items = $carousel.find('.dga-news-item');
        const lastIndex = $items.length - 1;
        
        CONFIG.isAnimating = true;
        
        if (direction === 'prev' && CONFIG.activeIndex > 0) {
            CONFIG.activeIndex--;
        } else if (direction === 'next' && CONFIG.activeIndex < lastIndex) {
            CONFIG.activeIndex++;
        }
        
        // Check if we need to load more posts
        if (direction === 'next' && CONFIG.activeIndex >= $items.length - CONFIG.slidesToShow) {
            loadMorePosts($carousel);
        }
        
        updateActiveItem($carousel);
        updateCarouselPosition($carousel);
        
        // Reset animation flag after transition
        setTimeout(() => {
            CONFIG.isAnimating = false;
        }, 500); // Match transition duration
    }
    
    // Update navigation button states
    function updateNavButtons($nav, $carousel) {
        const $items = $carousel.find('.dga-news-item');
        const $prevBtn = $nav.find('.dga-nav-prev');
        const $nextBtn = $nav.find('.dga-nav-next');
        
        // Disable prev button if at the beginning
        if (CONFIG.activeIndex <= 0) {
            $prevBtn.addClass('disabled').attr('aria-disabled', 'true');
        } else {
            $prevBtn.removeClass('disabled').attr('aria-disabled', 'false');
        }
        
        // Disable next button if at the end
        if (CONFIG.activeIndex >= $items.length - 1) {
            $nextBtn.addClass('disabled').attr('aria-disabled', 'true');
        } else {
            $nextBtn.removeClass('disabled').attr('aria-disabled', 'false');
        }
    }
    
    // Load more posts via AJAX
    function loadMorePosts($carousel) {
        const postType = $carousel.data('post-type') || 'article';
        const taxonomy = $carousel.data('taxonomy') || 'category';
        const term = $carousel.data('term') || 'stdnews';
        const postsPerPage = $carousel.data('posts-per-page') || 8;
        const offset = $carousel.find('.dga-news-item').length;
        
        $.ajax({
            url: dga_news_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'dga_load_more_posts',
                nonce: dga_news_ajax.nonce,
                post_type: postType,
                taxonomy: taxonomy,
                term: term,
                posts_per_page: postsPerPage,
                offset: offset
            },
            beforeSend: function() {
                $carousel.addClass('dga-loading');
            },
            success: function(response) {
                if (response.success && response.data.posts) {
                    // Append new posts
                    const $slider = $carousel.find('.dga-news-carousel');
                    $slider.append(response.data.posts);
                    
                    // Update total slides
                    CONFIG.totalSlides = $carousel.find('.dga-news-item').length;
                    
                    // Initialize effects for new items
                    initLazyLoading();
                    initAccessibility();
                }
                $carousel.removeClass('dga-loading');
            },
            error: function() {
                $carousel.removeClass('dga-loading');
            }
        });
    }
    
    // Initialize lazy loading for images
    function initLazyLoading() {
        const images = document.querySelectorAll('.dga-news-thumbnail:not(.loaded)');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for browsers without IntersectionObserver
            images.forEach(img => img.classList.add('loaded'));
        }
    }
    
    // Initialize accessibility features
    function initAccessibility() {
        // Add appropriate ARIA labels
        $('.dga-news-link').each(function() {
            const title = $(this).find('.dga-news-title').text();
            $(this).attr('aria-label', 'อ่านบทความ: ' + title);
        });

        // Add keyboard focus handling
        $('.dga-news-link').on('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.location.href = $(this).attr('href');
            }
        });
        
        // Add ARIA roles
        $('.dga-news-container').attr('role', 'region').attr('aria-label', 'ข่าวสารล่าสุด');
        $('.dga-news-carousel').attr('role', 'list');
        $('.dga-news-item').attr('role', 'listitem');
    }
    
    // Keyboard navigation for carousel
    function initKeyboardNavigation() {
        $(document).on('keydown', function(e) {
            const $carousel = $('.dga-news-container').first();
            if (!$carousel.length) return;
            
            if (e.key === 'ArrowLeft') {
                navigateCarousel($carousel, 'prev');
            } else if (e.key === 'ArrowRight') {
                navigateCarousel($carousel, 'next');
            }
        });
    }
    
    // Initialize swipe support for touch devices
    function initSwipeSupport() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        $('.dga-news-container').each(function() {
            const $carousel = $(this);
            
            $carousel[0].addEventListener('touchstart', function(e) {
                touchStartX = e.changedTouches[0].screenX;
            }, false);
            
            $carousel[0].addEventListener('touchend', function(e) {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe($carousel);
            }, false);
        });
        
        function handleSwipe($carousel) {
            const swipeThreshold = 50; // Minimum difference to register a swipe
            
            if (touchEndX < touchStartX - swipeThreshold) {
                // Swipe left - go to next slide
                navigateCarousel($carousel, 'next');
            }
            
            if (touchEndX > touchStartX + swipeThreshold) {
                // Swipe right - go to previous slide
                navigateCarousel($carousel, 'prev');
            }
        }
    }
    
    // Handle window resize
    $(window).on('resize', function() {
        $('.dga-news-container').each(function() {
            setupCarouselLayout($(this));
        });
    });

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
        $('.dga-news-carousel, .dga-news-item, .dga-news-thumbnail').css('transition', 'none');
    }

})(jQuery);