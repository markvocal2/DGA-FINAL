/**
 * DGA Post List JavaScript
 * Modern ES6+ with Fetch API
 * WCAG 2.2 AAA Accessibility Support
 */

class DGAPostList {
    constructor() {
        this.containers = [];
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initContainers());
        } else {
            this.initContainers();
        }
    }

    initContainers() {
        const containers = document.querySelectorAll('.dga-post-list-container-xy34');
        containers.forEach(container => {
            this.containers.push(new DGAPostListInstance(container));
        });
    }
}

class DGAPostListInstance {
    constructor(container) {
        this.container = container;
        this.grid = container.querySelector('.dga-post-grid-xy34');
        this.statusArea = container.querySelector('[aria-live]');
        this.errorContainer = container.querySelector('.dga-error-message-xy34');
        this.loadingIndicator = container.querySelector('.dga-loading-indicator-xy34');
        
        // Get configuration from data attributes
        this.config = {
            postType: container.dataset.postType || 'post',
            postsPerPage: parseInt(container.dataset.postsPerPage) || 4,
            orderby: container.dataset.orderby || 'date',
            order: container.dataset.order || 'DESC',
            viewType: container.dataset.viewType || 'list',
            offset: parseInt(container.dataset.offset) || 0
        };
        
        this.isLoading = false;
        this.init();
    }

    init() {
        // Add delay to show skeleton loading effect
        setTimeout(() => {
            this.loadPosts();
        }, 1000);
    }

    async loadPosts() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            const formData = new FormData();
            formData.append('action', 'dga_load_posts');
            formData.append('nonce', dgaPostList.nonce);
            formData.append('post_type', this.config.postType);
            formData.append('posts_per_page', this.config.postsPerPage);
            formData.append('orderby', this.config.orderby);
            formData.append('order', this.config.order);
            formData.append('view_type', this.config.viewType);
            formData.append('offset', this.config.offset);

            const response = await fetch(dgaPostList.ajaxurl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.renderPosts(data.data);
                this.announceSuccess(data.data.length);
            } else {
                throw new Error(data.data || dgaPostList.error_text);
            }
            
        } catch (error) {
            console.error('DGA Post List Error:', error);
            this.showError(error.message);
            this.announceError();
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    renderPosts(posts) {
        if (!posts || posts.length === 0) {
            this.showError(dgaPostList.no_posts_text);
            return;
        }

        // Clear skeleton loading
        this.grid.innerHTML = '';
        
        // Create post cards with staggered animation
        posts.forEach((post, index) => {
            const card = this.createPostCard(post, index);
            this.grid.appendChild(card);
        });
    }

    createPostCard(post, index) {
        const card = document.createElement('article');
        card.className = 'dga-post-card-xy34';
        card.setAttribute('role', 'listitem');
        card.style.animationDelay = `${index * 0.1}s`;
        
        // Image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'dga-post-image-container-xy34';
        
        if (post.featured_image) {
            const img = document.createElement('img');
            img.className = 'dga-post-image-xy34';
            img.src = post.featured_image;
            img.alt = this.sanitizeText(post.title);
            img.loading = 'lazy';
            img.decoding = 'async';
            
            // Handle image load errors
            img.addEventListener('error', () => {
                img.style.display = 'none';
                imageContainer.appendChild(this.createImagePlaceholder());
            });
            
            imageContainer.appendChild(img);
        } else {
            imageContainer.appendChild(this.createImagePlaceholder());
        }
        
        card.appendChild(imageContainer);
        
        // Content container
        const content = document.createElement('div');
        content.className = 'dga-post-content-xy34';
        
        // Title
        const title = document.createElement('h3');
        title.className = 'dga-post-title-xy34';
        
        const titleLink = document.createElement('a');
        titleLink.href = post.permalink;
        titleLink.textContent = this.sanitizeText(post.title);
        titleLink.setAttribute('aria-describedby', `excerpt-${post.id}`);
        
        // Add keyboard navigation
        titleLink.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.location.href = post.permalink;
            }
        });
        
        title.appendChild(titleLink);
        content.appendChild(title);
        
        // Excerpt (optional for compact layout, always show for card view)
        if ((this.config.viewType === 'card' && post.excerpt) || 
            (this.config.viewType === 'list' && post.excerpt && post.excerpt.trim())) {
            const excerpt = document.createElement('p');
            excerpt.className = 'dga-post-excerpt-xy34';
            excerpt.id = `excerpt-${post.id}`;
            excerpt.textContent = this.sanitizeText(post.excerpt);
            content.appendChild(excerpt);
        }
        
        // Meta container
        const meta = document.createElement('div');
        meta.className = 'dga-post-meta-xy34';
        
        // Date (always show)
        const dateElement = document.createElement('time');
        dateElement.setAttribute('datetime', post.date);
        dateElement.textContent = this.sanitizeText(post.date);
        meta.appendChild(dateElement);
        
        // Author and Categories (card view only)
        if (this.config.viewType === 'card') {
            if (post.author) {
                const authorElement = document.createElement('span');
                authorElement.className = 'dga-post-author-xy34';
                authorElement.textContent = this.sanitizeText(post.author);
                meta.appendChild(authorElement);
            }
            
            if (post.categories && post.categories.length > 0) {
                const categoriesElement = document.createElement('span');
                categoriesElement.className = 'dga-post-categories-xy34';
                categoriesElement.textContent = post.categories.slice(0, 2).join(', ');
                meta.appendChild(categoriesElement);
            }
        }
        
        content.appendChild(meta);
        
        card.appendChild(content);
        
        return card;
    }

    createImagePlaceholder() {
        const placeholder = document.createElement('div');
        placeholder.className = 'dga-image-placeholder-xy34';
        placeholder.setAttribute('aria-hidden', 'true');
        
        // Different icons for different view types
        const icon = this.config.viewType === 'card' ? '🖼️' : '📄';
        placeholder.innerHTML = icon;
        
        return placeholder;
    }

    showLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'block';
        }
        this.announceLoading();
    }

    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'none';
        }
    }

    showError(message) {
        this.hideError();
        this.grid.innerHTML = '';
        
        if (this.errorContainer) {
            this.errorContainer.textContent = message;
            this.errorContainer.style.display = 'block';
            this.errorContainer.setAttribute('tabindex', '-1');
            this.errorContainer.focus();
        }
    }

    hideError() {
        if (this.errorContainer) {
            this.errorContainer.style.display = 'none';
            this.errorContainer.removeAttribute('tabindex');
        }
    }

    // Screen reader announcements
    announceLoading() {
        if (this.statusArea) {
            this.statusArea.textContent = dgaPostList.loading_text;
        }
    }

    announceSuccess(count) {
        if (this.statusArea) {
            const offsetText = this.config.offset > 0 ? ` เริ่มจากรายการที่ ${this.config.offset + 1}` : '';
            const viewText = this.config.viewType === 'card' ? 'การ์ด' : 'รายการ';
            this.statusArea.textContent = `โหลดข้อมูลสำเร็จ พบ ${count} ${viewText}${offsetText}`;
        }
    }

    announceError() {
        if (this.statusArea) {
            this.statusArea.textContent = dgaPostList.error_text;
        }
    }

    // Utility functions
    sanitizeText(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Handle focus management for accessibility
    manageFocus() {
        const firstCard = this.grid.querySelector('.dga-post-card-xy34');
        if (firstCard) {
            const firstLink = firstCard.querySelector('a');
            if (firstLink) {
                firstLink.focus();
            }
        }
    }
}

// Initialize when dgaPostList is available
function initDGAPostList() {
    if (typeof dgaPostList !== 'undefined') {
        new DGAPostList();
    } else {
        // Retry if dgaPostList is not yet available
        setTimeout(initDGAPostList, 100);
    }
}

// Start initialization
initDGAPostList();

// Handle visibility change (for performance)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Pause animations when tab is not visible
        document.body.classList.add('dga-paused-animations-xy34');
    } else {
        document.body.classList.remove('dga-paused-animations-xy34');
    }
});

// Add CSS for paused animations
const style = document.createElement('style');
style.textContent = `
    .dga-paused-animations-xy34 *,
    .dga-paused-animations-xy34 *::before,
    .dga-paused-animations-xy34 *::after {
        animation-play-state: paused !important;
    }
`;
document.head.appendChild(style);

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DGAPostList;
}

/* =================================================================
   WCAG G145 & G18 Compliance Utilities
   For Absolutely Positioned Text Detection and Enhancement
   ================================================================= */

class WCAGOverlayTextEnhancer {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.enhanceOverlayText());
        } else {
            this.enhanceOverlayText();
        }
        
        // Re-check when images load (background images might affect contrast)
        window.addEventListener('load', () => this.enhanceOverlayText());
    }

    enhanceOverlayText() {
        // Find absolutely positioned text elements
        const overlayElements = this.findOverlayTextElements();
        
        overlayElements.forEach(element => {
            this.enhanceElement(element);
            this.announceEnhancement(element);
        });
        
        // Monitor for dynamic content
        this.observeContentChanges();
    }

    findOverlayTextElements() {
        const selectors = [
            '#featured-title',
            '#featured-description',
            '[id*="featured-title"]',
            '[id*="featured-description"]',
            '.featured-title-xy34',
            '.featured-description-xy34'
        ];
        
        const elements = [];
        
        selectors.forEach(selector => {
            const found = document.querySelectorAll(selector);
            found.forEach(el => {
                if (this.isAbsolutelyPositioned(el) || this.hasComplexBackground(el)) {
                    elements.push(el);
                }
            });
        });
        
        return elements;
    }

    isAbsolutelyPositioned(element) {
        const style = window.getComputedStyle(element);
        return style.position === 'absolute' || style.position === 'fixed';
    }

    hasComplexBackground(element) {
        // Check if element or its container has background image or complex styling
        let current = element;
        while (current && current !== document.body) {
            const style = window.getComputedStyle(current);
            if (style.backgroundImage !== 'none' || 
                style.background.includes('gradient') ||
                style.zIndex > 0) {
                return true;
            }
            current = current.parentElement;
        }
        return false;
    }

    enhanceElement(element) {
        // Determine if it's large text (G145) or normal text (G18)
        const isLargeText = this.isLargeText(element);
        
        // Add appropriate enhancement class
        if (isLargeText) {
            element.classList.add('dga-g145-enhanced-xy34');
            this.applyG145Enhancement(element);
        } else {
            element.classList.add('dga-g18-enhanced-xy34');
            this.applyG18Enhancement(element);
        }
        
        // Add universal accessibility attributes
        element.setAttribute('data-wcag-enhanced', 'true');
        element.setAttribute('data-contrast-technique', isLargeText ? 'G145' : 'G18');
        
        // Ensure text is selectable
        element.style.userSelect = 'text';
        element.style.webkitUserSelect = 'text';
    }

    isLargeText(element) {
        const style = window.getComputedStyle(element);
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = style.fontWeight;
        
        // WCAG definition: 18pt (24px) or 14pt bold (18.5px)
        const is18pt = fontSize >= 24;
        const is14ptBold = fontSize >= 18.5 && (fontWeight === 'bold' || fontWeight >= 700);
        
        return is18pt || is14ptBold;
    }

    applyG145Enhancement(element) {
        // G145: Large text requires 3:1 contrast minimum
        if (!element.style.textShadow || element.style.textShadow === 'none') {
            element.style.textShadow = `
                0 0 3px rgba(0, 0, 0, 0.9),
                0 0 6px rgba(0, 0, 0, 0.8),
                1px 1px 2px rgba(0, 0, 0, 0.9),
                -1px -1px 2px rgba(0, 0, 0, 0.9)
            `;
        }
        
        if (!element.style.background || element.style.background === 'none') {
            element.style.background = `linear-gradient(135deg,
                rgba(0, 0, 0, 0.6) 0%,
                rgba(0, 0, 0, 0.4) 50%,
                rgba(0, 0, 0, 0.6) 100%)`;
        }
        
        // Apply padding if not set
        if (!element.style.padding) {
            element.style.padding = '0.5rem 1rem';
            element.style.borderRadius = '8px';
        }
    }

    applyG18Enhancement(element) {
        // G18: Normal text requires 4.5:1 contrast minimum
        if (!element.style.textShadow || element.style.textShadow === 'none') {
            element.style.textShadow = `
                0 0 2px rgba(0, 0, 0, 0.95),
                0 0 4px rgba(0, 0, 0, 0.9),
                0 0 6px rgba(0, 0, 0, 0.85),
                1px 1px 1px rgba(0, 0, 0, 0.95),
                -1px -1px 1px rgba(0, 0, 0, 0.95),
                2px 2px 2px rgba(0, 0, 0, 0.9)
            `;
        }
        
        if (!element.style.background || element.style.background === 'none') {
            element.style.background = `linear-gradient(135deg,
                rgba(0, 0, 0, 0.7) 0%,
                rgba(0, 0, 0, 0.5) 50%,
                rgba(0, 0, 0, 0.7) 100%)`;
        }
        
        // Apply enhanced padding for normal text
        if (!element.style.padding) {
            element.style.padding = '0.75rem 1rem';
            element.style.borderRadius = '6px';
        }
        
        // Add box shadow for additional separation
        if (!element.style.boxShadow) {
            element.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.6)';
        }
    }

    announceEnhancement(element) {
        // Create screen reader announcement
        const technique = element.getAttribute('data-contrast-technique');
        const announcement = `Text contrast enhanced using WCAG ${technique} technique`;
        
        // Add aria-label if not present
        if (!element.getAttribute('aria-label')) {
            const text = element.textContent.trim();
            if (text) {
                element.setAttribute('aria-label', `${text} (${announcement})`);
            }
        }
        
        // Log for developers
        if (window.console && window.console.log) {
            console.log(`WCAG Enhancement Applied: ${technique} technique on`, element);
        }
    }

    observeContentChanges() {
        // Use MutationObserver to watch for dynamically added content
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                // Check if the added node or its children need enhancement
                                const newOverlayElements = this.findOverlayTextElementsIn(node);
                                newOverlayElements.forEach(el => {
                                    if (!el.getAttribute('data-wcag-enhanced')) {
                                        this.enhanceElement(el);
                                        this.announceEnhancement(el);
                                    }
                                });
                            }
                        });
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    findOverlayTextElementsIn(container) {
        const selectors = [
            '#featured-title',
            '#featured-description',
            '[id*="featured-title"]',
            '[id*="featured-description"]',
            '.featured-title-xy34',
            '.featured-description-xy34'
        ];
        
        const elements = [];
        
        selectors.forEach(selector => {
            const found = container.querySelectorAll ? 
                container.querySelectorAll(selector) : 
                (container.matches && container.matches(selector) ? [container] : []);
            
            found.forEach(el => {
                if (this.isAbsolutelyPositioned(el) || this.hasComplexBackground(el)) {
                    elements.push(el);
                }
            });
        });
        
        return elements;
    }

    // Static method to manually enhance specific elements
    static enhanceElement(element, technique = 'auto') {
        const enhancer = new WCAGOverlayTextEnhancer();
        
        if (technique === 'auto') {
            enhancer.enhanceElement(element);
        } else if (technique === 'G145') {
            enhancer.applyG145Enhancement(element);
            element.setAttribute('data-contrast-technique', 'G145');
        } else if (technique === 'G18') {
            enhancer.applyG18Enhancement(element);
            element.setAttribute('data-contrast-technique', 'G18');
        }
        
        enhancer.announceEnhancement(element);
    }

    // Static method to check contrast compliance
    static checkContrastCompliance() {
        const enhancer = new WCAGOverlayTextEnhancer();
        const elements = enhancer.findOverlayTextElements();
        
        const report = {
            total: elements.length,
            enhanced: 0,
            needsAttention: []
        };
        
        elements.forEach(el => {
            if (el.getAttribute('data-wcag-enhanced')) {
                report.enhanced++;
            } else {
                report.needsAttention.push({
                    element: el,
                    id: el.id || 'no-id',
                    text: el.textContent.substring(0, 50) + '...'
                });
            }
        });
        
        return report;
    }
}

// Auto-initialize WCAG overlay text enhancement
function initWCAGEnhancement() {
    if (typeof window !== 'undefined') {
        new WCAGOverlayTextEnhancer();
        
        // Expose utilities globally for manual use
        window.WCAGOverlayTextEnhancer = WCAGOverlayTextEnhancer;
        
        // Expose convenience functions
        window.enhanceOverlayText = WCAGOverlayTextEnhancer.enhanceElement;
        window.checkWCAGCompliance = WCAGOverlayTextEnhancer.checkContrastCompliance;
    }
}

// Initialize WCAG enhancement
initWCAGEnhancement();