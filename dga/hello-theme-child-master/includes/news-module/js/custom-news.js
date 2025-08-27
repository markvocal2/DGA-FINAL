/**
 * Custom News Module JavaScript
 * 
 * @package CustomNewsModule
 * @version 1.0.0
 */

(function($) {
    'use strict';

    class CustomNews {
        constructor() {
            this.moduleSelector = '.news-module';
            this.skeletonSelector = '.skeleton-loader';
            this.contentSelector = '.news-content';
            this.filterButtonSelector = '.filter-btn, .filter-button';
            this.articleSelector = '.featured-article, .grid-article, .list-article';
            this.paginationSelector = '.pagination-nav a';
            this.readMoreSelector = '.read-more-link, .read-more-button';

            this.init();
        }

        init() {
            this.modules = document.querySelectorAll(this.moduleSelector);
            if (!this.modules.length) return;

            this.setupLoading();
            this.setupLazyLoading();
            this.setupFiltering();
            this.setupPagination();
            this.setupInteractions();
            this.setupAjaxLoading();
        }

        setupLoading() {
            this.modules.forEach(module => {
                const skeleton = module.querySelector(this.skeletonSelector);
                const content = module.querySelector(this.contentSelector);

                if (skeleton && content) {
                    // Show content after small delay
                    setTimeout(() => {
                        skeleton.style.display = 'none';
                        content.style.display = 'block';

                        // Add entrance animation to articles
                        const articles = content.querySelectorAll(this.articleSelector);
                        articles.forEach((article, index) => {
                            setTimeout(() => {
                                article.classList.add('appear');
                            }, index * 100);
                        });
                    }, 500);
                }
            });
        }

        setupLazyLoading() {
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            if (img.dataset.src) {
                                img.src = img.dataset.src;
                                img.removeAttribute('data-src');
                                img.classList.remove('lazy');
                            }
                            observer.unobserve(img);
                        }
                    });
                }, {
                    rootMargin: '50px'
                });

                document.querySelectorAll('img.lazy, img[data-src]').forEach(img => {
                    imageObserver.observe(img);
                });
            }
        }

        setupFiltering() {
            this.modules.forEach(module => {
                const filterButtons = module.querySelectorAll(this.filterButtonSelector);
                const articles = module.querySelectorAll(this.articleSelector);

                filterButtons.forEach(button => {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        const category = button.dataset.category;

                        // Update active state
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
            });
        }

        setupPagination() {
            this.modules.forEach(module => {
                const paginationLinks = module.querySelectorAll(this.paginationSelector);
                
                paginationLinks.forEach(link => {
                    link.addEventListener('click', (e) => {
                        if (!e.ctrlKey && !e.shiftKey) {
                            e.preventDefault();
                            const href = link.getAttribute('href');
                            
                            // Smooth scroll to top of module
                            module.scrollIntoView({ 
                                behavior: 'smooth',
                                block: 'start'
                            });

                            // Load new page after scroll
                            setTimeout(() => {
                                if (this.isAjaxEnabled()) {
                                    this.loadPageViaAjax(href, module);
                                } else {
                                    window.location.href = href;
                                }
                            }, 500);
                        }
                    });
                });
            });
        }

        setupInteractions() {
            // Add hover animations
            this.modules.forEach(module => {
                const articles = module.querySelectorAll(this.articleSelector);
                const readMoreLinks = module.querySelectorAll(this.readMoreSelector);

                // Hover effects
                articles.forEach(article => {
                    article.addEventListener('mouseenter', () => {
                        article.classList.add('hover');
                    });

                    article.addEventListener('mouseleave', () => {
                        article.classList.remove('hover');
                    });
                });

                // Focus management
                readMoreLinks.forEach(link => {
                    link.addEventListener('focus', () => {
                        link.closest(this.articleSelector)?.classList.add('focused');
                    });

                    link.addEventListener('blur', () => {
                        link.closest(this.articleSelector)?.classList.remove('focused');
                    });
                });
            });
        }

        setupAjaxLoading() {
            if (!this.isAjaxEnabled()) return;

            // Add loading indicator
            this.modules.forEach(module => {
                const loadingIndicator = document.createElement('div');
                loadingIndicator.className = 'ajax-loading';
                loadingIndicator.innerHTML = '<div class="loading-spinner"></div>';
                loadingIndicator.style.display = 'none';
                module.appendChild(loadingIndicator);
            });
        }

        isAjaxEnabled() {
            return typeof customNewsAjax !== 'undefined' && 
                   customNewsAjax.ajaxurl && 
                   customNewsAjax.nonce;
        }

        async loadPageViaAjax(url, module) {
            if (!this.isAjaxEnabled()) return;

            const loadingIndicator = module.querySelector('.ajax-loading');
            if (loadingIndicator) loadingIndicator.style.display = 'block';

            try {
                const response = await fetch(customNewsAjax.ajaxurl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'load_more_posts',
                        nonce: customNewsAjax.nonce,
                        page_url: url
                    })
                });

                if (!response.ok) throw new Error('Network response was not ok');

                const data = await response.json();
                
                if (data.success && data.content) {
                    const content = module.querySelector(this.contentSelector);
                    if (content) {
                        // Fade out current content
                        content.style.opacity = '0';
                        
                        setTimeout(() => {
                            // Update content
                            content.innerHTML = data.content;
                            
                            // Reinitialize features for new content
                            this.setupLazyLoading();
                            this.setupInteractions();
                            
                            // Fade in new content
                            content.style.opacity = '1';
                        }, 300);
                    }
                }
            } catch (error) {
                console.error('Error loading content:', error);
                // Fallback to regular page load
                window.location.href = url;
            } finally {
                if (loadingIndicator) loadingIndicator.style.display = 'none';
            }
        }
    }

    // Initialize when DOM is ready
    $(document).ready(() => {
        new CustomNews();
    });

})(jQuery);