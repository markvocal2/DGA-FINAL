/**
 * Enhanced DGA Mobile Menu JavaScript - Performance Optimized
 * Version: 2.0.0
 * Author: DGA Team
 */

(function($) {
    'use strict';
    
    // Configuration
    const CONFIG = {
        animationSpeed: 300,
        debounceDelay: 250,
        swipeThreshold: 50,
        cacheExpiry: 3600000, // 1 hour in milliseconds
        breakpoint: 992
    };
    
    // Menu Manager Class
    class DGAMobileMenu {
        constructor(container) {
            this.container = $(container);
            this.instance = this.container.data('instance');
            this.position = this.container.data('position') || 'right';
            this.theme = this.container.data('theme') || 'light';
            this.menuLocation = this.container.data('menu-location') || 'primary';
            
            // DOM Elements
            this.elements = {
                toggle: this.container.find('.dga-mobile-menu-toggle-kxm892'),
                close: this.container.find('.dga-mobile-menu-close-kxm892'),
                overlay: this.container.find('.dga-mobile-menu-overlay-kxm892'),
                wrapper: this.container.find('.dga-mobile-menu-wrapper-kxm892'),
                content: this.container.find('.dga-mobile-menu-content-kxm892'),
                search: this.container.find('.dga-mobile-menu-search-kxm892')
            };
            
            // State
            this.state = {
                isOpen: false,
                isLoading: false,
                menuLoaded: false,
                touchStartX: 0,
                touchStartY: 0
            };
            
            // Initialize
            this.init();
        }
        
        init() {
            this.bindEvents();
            this.checkCache();
            this.setupAccessibility();
            
            // Log initialization
            console.log(`DGA Mobile Menu initialized: ${this.instance}`);
        }
        
        bindEvents() {
            // Toggle button
            this.elements.toggle.on('click.dgamenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggle();
            });
            
            // Close button
            this.elements.close.on('click.dgamenu', (e) => {
                e.preventDefault();
                this.close();
            });
            
            // Overlay click
            this.elements.overlay.on('click.dgamenu', (e) => {
                e.preventDefault();
                this.close();
            });
            
            // Keyboard events
            $(document).on('keydown.dgamenu', (e) => {
                if (e.key === 'Escape' && this.state.isOpen) {
                    this.close();
                }
            });
            
            // Touch events for swipe-to-close
            if (this.isTouchDevice()) {
                this.setupTouchEvents();
            }
            
            // Window resize
            let resizeTimer;
            $(window).on('resize.dgamenu', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    if ($(window).width() >= CONFIG.breakpoint && this.state.isOpen) {
                        this.close(false);
                    }
                }, CONFIG.debounceDelay);
            });
            
            // Prevent body scroll when menu is open
            this.elements.wrapper.on('touchmove.dgamenu', (e) => {
                const target = $(e.target);
                const scrollable = target.closest('.dga-mobile-menu-content-kxm892');
                
                if (scrollable.length) {
                    const scrollTop = scrollable[0].scrollTop;
                    const scrollHeight = scrollable[0].scrollHeight;
                    const height = scrollable.height();
                    
                    if ((scrollTop === 0 && e.originalEvent.touches[0].clientY > this.state.touchStartY) ||
                        (scrollTop + height >= scrollHeight && e.originalEvent.touches[0].clientY < this.state.touchStartY)) {
                        e.preventDefault();
                    }
                } else {
                    e.preventDefault();
                }
            });
        }
        
        setupTouchEvents() {
            let touchStartX = 0;
            let touchEndX = 0;
            let touchStartY = 0;
            let touchEndY = 0;
            
            this.elements.wrapper.on('touchstart.dgamenu', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                this.state.touchStartY = touchStartY;
            });
            
            this.elements.wrapper.on('touchend.dgamenu', (e) => {
                touchEndX = e.changedTouches[0].clientX;
                touchEndY = e.changedTouches[0].clientY;
                
                // Calculate swipe distance
                const diffX = touchEndX - touchStartX;
                const diffY = Math.abs(touchEndY - touchStartY);
                
                // Check if horizontal swipe (not vertical scroll)
                if (Math.abs(diffX) > CONFIG.swipeThreshold && diffY < 100) {
                    if ((this.position === 'right' && diffX > 0) ||
                        (this.position === 'left' && diffX < 0)) {
                        this.close();
                    }
                }
            });
        }
        
        setupAccessibility() {
            // Set initial ARIA attributes
            this.elements.toggle.attr({
                'role': 'button',
                'aria-expanded': 'false',
                'aria-haspopup': 'true'
            });
            
            this.elements.wrapper.attr({
                'role': 'navigation',
                'aria-label': dgaMobileMenu.messages.open
            });
        }
        
        toggle() {
            if (this.state.isOpen) {
                this.close();
            } else {
                this.open();
            }
        }
        
        open() {
            if (this.state.isOpen || this.state.isLoading) return;
            
            // Load menu if not loaded
            if (!this.state.menuLoaded) {
                this.loadMenu();
            }
            
            // Set opening state
            this.state.isOpen = true;
            
            // Add classes
            $('body').addClass('menu-active');
            this.container.addClass('menu-active');
            this.elements.overlay.addClass('active');
            this.elements.wrapper.addClass('active');
            
            // Update ARIA
            this.elements.toggle.attr('aria-expanded', 'true');
            this.elements.wrapper.attr('aria-hidden', 'false');
            
            // Focus management
            setTimeout(() => {
                this.elements.close.focus();
            }, CONFIG.animationSpeed);
            
            // Trigger event
            this.container.trigger('dgamenu:opened');
        }
        
        close(animate = true) {
            if (!this.state.isOpen) return;
            
            // Set closing state
            this.state.isOpen = false;
            
            // Remove classes
            $('body').removeClass('menu-active');
            this.container.removeClass('menu-active');
            this.elements.overlay.removeClass('active');
            this.elements.wrapper.removeClass('active');
            
            // Update ARIA
            this.elements.toggle.attr('aria-expanded', 'false');
            this.elements.wrapper.attr('aria-hidden', 'true');
            
            // Return focus to toggle button
            if (animate) {
                setTimeout(() => {
                    this.elements.toggle.focus();
                }, CONFIG.animationSpeed);
            }
            
            // Trigger event
            this.container.trigger('dgamenu:closed');
        }
        
        loadMenu() {
            if (this.state.menuLoaded || this.state.isLoading) return;
            
            // Check cache first
            const cachedMenu = this.getCache();
            if (cachedMenu) {
                this.renderMenu(cachedMenu);
                return;
            }
            
            // Set loading state
            this.state.isLoading = true;
            this.elements.content.attr('aria-busy', 'true');
            
            // Show loader
            this.showLoader();
            
            // AJAX request
            $.ajax({
                url: dgaMobileMenu.ajaxurl,
                type: 'POST',
                data: {
                    action: 'dga_get_mobile_menu',
                    nonce: dgaMobileMenu.nonce,
                    menu_location: this.menuLocation
                },
                success: (response) => {
                    if (response.success) {
                        this.renderMenu(response.data.html);
                        
                        // Cache the menu
                        if (dgaMobileMenu.settings.cacheMenu) {
                            this.setCache(response.data.html);
                        }
                    } else {
                        this.showError(response.data.message || dgaMobileMenu.messages.error);
                    }
                },
                error: (xhr, status, error) => {
                    console.error('Menu load error:', error);
                    this.showError(dgaMobileMenu.messages.error);
                },
                complete: () => {
                    this.state.isLoading = false;
                    this.elements.content.attr('aria-busy', 'false');
                }
            });
        }
        
        renderMenu(html) {
            this.elements.content.html(html);
            this.state.menuLoaded = true;
            this.initAccordion();
            this.highlightCurrentPage();
        }
        
        initAccordion() {
            const $accordionToggles = this.elements.content.find('.dga-accordion-toggle-kxm892');
            
            $accordionToggles.off('click.accordion').on('click.accordion', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const $toggle = $(this);
                const $parent = $toggle.closest('.menu-item-kxm892');
                const $submenu = $parent.children('.dga-submenu-kxm892');
                const isExpanded = $toggle.attr('aria-expanded') === 'true';
                
                // Toggle state
                $toggle.attr('aria-expanded', !isExpanded);
                $submenu.attr('aria-hidden', isExpanded);
                
                // Animate submenu
                if (!isExpanded) {
                    $submenu.css('display', 'block');
                    const height = $submenu[0].scrollHeight;
                    $submenu.css('max-height', '0');
                    
                    requestAnimationFrame(() => {
                        $submenu.css('max-height', height + 'px');
                    });
                    
                    setTimeout(() => {
                        $submenu.css('max-height', '');
                    }, CONFIG.animationSpeed);
                } else {
                    $submenu.css('max-height', $submenu[0].scrollHeight + 'px');
                    
                    requestAnimationFrame(() => {
                        $submenu.css('max-height', '0');
                    });
                    
                    setTimeout(() => {
                        $submenu.css('display', 'none');
                        $submenu.css('max-height', '');
                    }, CONFIG.animationSpeed);
                }
            });
            
            // Open active menu items
            this.elements.content.find('.current-menu-item-kxm892').each(function() {
                const $item = $(this);
                const $parents = $item.parents('.has-children-kxm892');
                
                $parents.each(function() {
                    const $parent = $(this);
                    const $toggle = $parent.children('.dga-menu-item-header-kxm892').find('.dga-accordion-toggle-kxm892');
                    const $submenu = $parent.children('.dga-submenu-kxm892');
                    
                    $toggle.attr('aria-expanded', 'true');
                    $submenu.attr('aria-hidden', 'false').css('display', 'block');
                });
            });
        }
        
        highlightCurrentPage() {
            const currentUrl = window.location.href;
            
            this.elements.content.find('.dga-menu-link-kxm892').each(function() {
                const $link = $(this);
                const href = $link.attr('href');
                
                if (href === currentUrl) {
                    $link.closest('.menu-item-kxm892').addClass('current-menu-item-kxm892');
                }
            });
        }
        
        showLoader() {
            const loaderHTML = `
                <div class="dga-loading-kxm892">
                    <div class="dga-spinner-kxm892"></div>
                    <div class="dga-loading-text-kxm892">${dgaMobileMenu.messages.loading}</div>
                </div>
            `;
            this.elements.content.html(loaderHTML);
        }
        
        showError(message) {
            const errorHTML = `
                <div class="dga-error-kxm892">
                    <p>${message}</p>
                    <button class="dga-retry-button-kxm892">${dgaMobileMenu.messages.retry || 'ลองใหม่'}</button>
                </div>
            `;
            this.elements.content.html(errorHTML);
            
            // Bind retry button
            this.elements.content.find('.dga-retry-button-kxm892').on('click', () => {
                this.state.menuLoaded = false;
                this.loadMenu();
            });
        }
        
        // Cache management
        getCache() {
            if (!dgaMobileMenu.settings.cacheMenu) return null;
            
            const cacheKey = `dgamenu_${this.menuLocation}_${this.theme}`;
            const cached = localStorage.getItem(cacheKey);
            
            if (cached) {
                const data = JSON.parse(cached);
                const now = Date.now();
                
                if (now - data.timestamp < CONFIG.cacheExpiry) {
                    return data.html;
                } else {
                    localStorage.removeItem(cacheKey);
                }
            }
            
            return null;
        }
        
        setCache(html) {
            if (!dgaMobileMenu.settings.cacheMenu) return;
            
            const cacheKey = `dgamenu_${this.menuLocation}_${this.theme}`;
            const data = {
                html: html,
                timestamp: Date.now()
            };
            
            try {
                localStorage.setItem(cacheKey, JSON.stringify(data));
            } catch (e) {
                console.warn('Failed to cache menu:', e);
            }
        }
        
        checkCache() {
            // Clear old cache entries
            const keys = Object.keys(localStorage);
            const now = Date.now();
            
            keys.forEach(key => {
                if (key.startsWith('dgamenu_')) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        if (now - data.timestamp > CONFIG.cacheExpiry) {
                            localStorage.removeItem(key);
                        }
                    } catch (e) {
                        localStorage.removeItem(key);
                    }
                }
            });
        }
        
        isTouchDevice() {
            return 'ontouchstart' in window || 
                   navigator.maxTouchPoints > 0 || 
                   navigator.msMaxTouchPoints > 0;
        }
        
        destroy() {
            // Unbind events
            this.elements.toggle.off('.dgamenu');
            this.elements.close.off('.dgamenu');
            this.elements.overlay.off('.dgamenu');
            this.elements.wrapper.off('.dgamenu');
            $(document).off('.dgamenu');
            $(window).off('.dgamenu');
            
            // Close menu if open
            if (this.state.isOpen) {
                this.close(false);
            }
            
            // Clear cache
            this.container.removeData('dgaMobileMenu');
        }
    }
    
    // jQuery plugin
    $.fn.dgaMobileMenu = function(options) {
        return this.each(function() {
            const $element = $(this);
            
            if (!$element.data('dgaMobileMenu')) {
                const instance = new DGAMobileMenu(this);
                $element.data('dgaMobileMenu', instance);
            }
        });
    };
    
    // Auto-initialize on document ready
    $(document).ready(function() {
        // Initialize all menu instances
        $('.dga-mobile-menu-container-kxm892').dgaMobileMenu();
        
        // Performance: Use passive event listeners for scroll
        if ('addEventListener' in window && window.addEventListener) {
            window.addEventListener('touchstart', function() {}, { passive: true });
            window.addEventListener('touchmove', function() {}, { passive: true });
        }
        
        console.log('DGA Mobile Menu System Ready');
    });
    
})(jQuery);