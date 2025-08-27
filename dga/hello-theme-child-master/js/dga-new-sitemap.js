/**
 * DGA Sitemap Interactive JavaScript - Complete Enhanced Version
 * Auto-expands on load with improved level visualization
 * Version: 1.0.2
 */

(function() {
    'use strict';
    
    // Wait for DOM ready
    document.addEventListener('DOMContentLoaded', initDgaSitemap);
    
    function initDgaSitemap() {
        const containers = document.querySelectorAll('.dga-sitemap-container-xkp492');
        
        containers.forEach(container => {
            loadSitemap(container);
            setupSearch(container);
        });
    }
    
    // Load sitemap via AJAX
    async function loadSitemap(container) {
        const menuLocation = container.dataset.menu;
        const autoExpand = container.dataset.autoExpand === 'yes';
        const showIndicators = container.dataset.showIndicators === 'yes';
        const loadingEl = container.querySelector('.dga-sitemap-loading-xkp492');
        const contentEl = container.querySelector('.dga-sitemap-content-xkp492');
        
        // Show loading state
        loadingEl.style.display = 'flex';
        
        // Prepare form data
        const formData = new FormData();
        formData.append('action', 'dga_get_sitemap');
        formData.append('nonce', dgaSitemapAjax.nonce);
        formData.append('menu', menuLocation);
        
        try {
            const response = await fetch(dgaSitemapAjax.ajaxurl, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                renderSitemap(data.data, contentEl, showIndicators);
                setupInteractions(contentEl);
                
                // Auto expand all items if enabled
                if (autoExpand || dgaSitemapAjax.auto_expand === 'true') {
                    setTimeout(() => {
                        expandCollapseAll(contentEl, true);
                    }, 100);
                }
            } else {
                showError(contentEl, data.data || dgaSitemapAjax.error_text);
            }
        } catch (error) {
            showError(contentEl, dgaSitemapAjax.error_text);
            console.error('Sitemap loading error:', error);
        } finally {
            loadingEl.style.display = 'none';
        }
    }
    
    // Render sitemap HTML with enhanced visualization
    function renderSitemap(menuItems, container, showIndicators) {
        const html = buildMenuHTML(menuItems, showIndicators);
        container.innerHTML = html;
    }
    
    // Build enhanced menu HTML
    function buildMenuHTML(items, showIndicators, isRoot = true) {
        if (!items || items.length === 0) return '';
        
        const ulClass = isRoot ? 'dga-sitemap-list-root-xkp492' : 'dga-sitemap-list-xkp492';
        let html = `<ul class="${ulClass}" role="list">`;
        
        items.forEach((item, index) => {
            const hasChildren = item.children && item.children.length > 0;
            const itemClass = hasChildren ? 'dga-has-children-xkp492' : '';
            const levelClass = `dga-level-${item.level}-xkp492`;
            const isLast = index === items.length - 1;
            
            html += `<li class="dga-sitemap-item-xkp492 ${itemClass} ${levelClass} ${isLast ? 'dga-last-item-xkp492' : ''}" role="listitem">`;
            
            // Add connection line
            html += '<div class="dga-connection-line-xkp492"></div>';
            
            if (hasChildren) {
                html += `
                    <div class="dga-item-wrapper-xkp492">
                        <button class="dga-toggle-btn-xkp492" 
                                aria-expanded="false" 
                                aria-label="Toggle ${escapeHtml(item.title)} submenu">
                            <span class="dga-toggle-icon-xkp492">▶</span>
                        </button>
                `;
                
                // Level indicator badge
                if (showIndicators) {
                    html += `<span class="dga-level-badge-xkp492 dga-badge-${item.level}-xkp492">L${item.level}</span>`;
                }
                
                html += `
                        <a href="${escapeHtml(item.url)}" 
                           target="${escapeHtml(item.target)}"
                           class="dga-sitemap-link-xkp492 ${escapeHtml(item.classes)}">
                            <span class="dga-link-text-xkp492">${escapeHtml(item.title)}</span>
                            ${hasChildren ? `<span class="dga-child-count-xkp492">(${item.child_count})</span>` : ''}
                        </a>
                    </div>
                `;
                html += buildMenuHTML(item.children, showIndicators, false);
            } else {
                html += '<div class="dga-item-wrapper-xkp492">';
                
                // Add dot indicator for leaf items
                html += '<span class="dga-leaf-indicator-xkp492">•</span>';
                
                // Level indicator badge
                if (showIndicators) {
                    html += `<span class="dga-level-badge-xkp492 dga-badge-${item.level}-xkp492">L${item.level}</span>`;
                }
                
                html += `
                    <a href="${escapeHtml(item.url)}" 
                       target="${escapeHtml(item.target)}"
                       class="dga-sitemap-link-xkp492 ${escapeHtml(item.classes)}">
                        <span class="dga-link-text-xkp492">${escapeHtml(item.title)}</span>
                    </a>
                </div>`;
            }
            
            html += '</li>';
        });
        
        html += '</ul>';
        return html;
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    // Setup expand/collapse interactions
    function setupInteractions(container) {
        const toggleButtons = container.querySelectorAll('.dga-toggle-btn-xkp492');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                toggleSubmenu(this);
            });
            
            // Keyboard navigation
            button.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSubmenu(this);
                }
            });
        });
        
        // Add control buttons
        addControlButtons(container);
    }
    
    // Enhanced toggle with smooth animation
    function toggleSubmenu(button) {
        const parentItem = button.closest('.dga-has-children-xkp492');
        const submenu = parentItem.querySelector('.dga-sitemap-list-xkp492');
        const icon = button.querySelector('.dga-toggle-icon-xkp492');
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
            // Collapse with animation
            submenu.style.maxHeight = submenu.scrollHeight + 'px';
            submenu.offsetHeight; // Force reflow
            submenu.style.maxHeight = '0';
            button.setAttribute('aria-expanded', 'false');
            icon.style.transform = 'rotate(0deg)';
            parentItem.classList.remove('dga-expanded-xkp492');
        } else {
            // Expand with animation
            submenu.style.maxHeight = submenu.scrollHeight + 'px';
            button.setAttribute('aria-expanded', 'true');
            icon.style.transform = 'rotate(90deg)';
            parentItem.classList.add('dga-expanded-xkp492');
            
            // Reset max-height after animation
            setTimeout(() => {
                if (button.getAttribute('aria-expanded') === 'true') {
                    submenu.style.maxHeight = 'none';
                }
            }, 300);
        }
    }
    
    // Add expand/collapse all buttons
    function addControlButtons(container) {
        // Check if controls already exist
        if (container.querySelector('.dga-sitemap-controls-xkp492')) {
            return;
        }
        
        const controls = document.createElement('div');
        controls.className = 'dga-sitemap-controls-xkp492';
        controls.innerHTML = `
            <button class="dga-control-btn-xkp492 dga-expand-all-xkp492">
                <span class="dga-btn-icon-xkp492">➕</span>
                <span class="dga-btn-text-xkp492">Expand All</span>
            </button>
            <button class="dga-control-btn-xkp492 dga-collapse-all-xkp492">
                <span class="dga-btn-icon-xkp492">➖</span>
                <span class="dga-btn-text-xkp492">Collapse All</span>
            </button>
            <button class="dga-control-btn-xkp492 dga-reset-view-xkp492">
                <span class="dga-btn-icon-xkp492">🔄</span>
                <span class="dga-btn-text-xkp492">Reset View</span>
            </button>
        `;
        
        container.insertBefore(controls, container.querySelector('.dga-sitemap-content-xkp492'));
        
        // Event listeners
        controls.querySelector('.dga-expand-all-xkp492').addEventListener('click', () => {
            expandCollapseAll(container, true);
        });
        
        controls.querySelector('.dga-collapse-all-xkp492').addEventListener('click', () => {
            expandCollapseAll(container, false);
        });
        
        controls.querySelector('.dga-reset-view-xkp492').addEventListener('click', () => {
            resetView(container);
        });
    }
    
    // Expand or collapse all items with stagger effect
    function expandCollapseAll(container, expand) {
        const toggleButtons = container.querySelectorAll('.dga-toggle-btn-xkp492');
        
        toggleButtons.forEach((button, index) => {
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            if ((expand && !isExpanded) || (!expand && isExpanded)) {
                // Add stagger effect for smooth animation
                setTimeout(() => {
                    toggleSubmenu(button);
                }, index * 30);
            }
        });
    }
    
    // Reset view to initial expanded state
    function resetView(container) {
        // Clear search
        const searchInput = container.querySelector('.dga-sitemap-search-input-xkp492');
        if (searchInput) {
            searchInput.value = '';
            performSearch(container, '');
        }
        
        // Expand all
        expandCollapseAll(container, true);
    }
    
    // Enhanced search functionality
    function setupSearch(container) {
        const searchInput = container.querySelector('.dga-sitemap-search-input-xkp492');
        if (!searchInput) return;
        
        let searchTimeout;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(container, this.value);
            }, 300);
        });
        
        // Clear search on ESC key
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                performSearch(container, '');
            }
        });
    }
    
    // Update search results count
    function updateSearchResultsCount(container, count) {
        const searchBox = container.querySelector('.dga-sitemap-search-xkp492');
        if (!searchBox) return;
        
        // Remove old badge
        const oldBadge = searchBox.querySelector('.dga-search-results-badge-xkp492');
        if (oldBadge) oldBadge.remove();
        
        if (count > 0) {
            // Create new badge
            const badge = document.createElement('span');
            badge.className = 'dga-search-results-badge-xkp492';
            badge.textContent = `${count} found`;
            searchBox.appendChild(badge);
        }
    }
    
    // Perform search with highlighting
    function performSearch(container, query) {
        const items = container.querySelectorAll('.dga-sitemap-item-xkp492');
        const normalizedQuery = query.toLowerCase().trim();
        let matchCount = 0;
        
        if (!normalizedQuery) {
            // Show all items and remove highlights
            items.forEach(item => {
                item.style.display = '';
                item.classList.remove('dga-search-match-xkp492', 'dga-search-hidden-xkp492');
                const link = item.querySelector('.dga-link-text-xkp492');
                if (link && link.dataset.originalText) {
                    link.textContent = link.dataset.originalText;
                    delete link.dataset.originalText;
                }
            });
            updateSearchResultsCount(container, 0);
            return;
        }
        
        // Search and highlight
        items.forEach(item => {
            const linkEl = item.querySelector('.dga-link-text-xkp492');
            const text = linkEl ? linkEl.textContent : '';
            const lowerText = text.toLowerCase();
            
            if (lowerText.includes(normalizedQuery)) {
                // Show item and highlight match
                item.style.display = '';
                item.classList.add('dga-search-match-xkp492');
                item.classList.remove('dga-search-hidden-xkp492');
                matchCount++;
                
                // Highlight matching text with stronger styling
                if (linkEl && !linkEl.dataset.originalText) {
                    linkEl.dataset.originalText = text;
                    const regex = new RegExp(`(${normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    linkEl.innerHTML = text.replace(regex, '<mark class="dga-highlight-xkp492">$1</mark>');
                }
                
                // Expand parent items
                let parent = item.parentElement.closest('.dga-has-children-xkp492');
                while (parent) {
                    const toggleBtn = parent.querySelector('.dga-toggle-btn-xkp492');
                    if (toggleBtn && toggleBtn.getAttribute('aria-expanded') === 'false') {
                        toggleSubmenu(toggleBtn);
                    }
                    parent = parent.parentElement.closest('.dga-has-children-xkp492');
                }
            } else {
                // Check if has matching children
                const hasMatchingChild = item.querySelectorAll('.dga-search-match-xkp492').length > 0;
                if (hasMatchingChild) {
                    item.style.display = '';
                    item.classList.remove('dga-search-match-xkp492');
                    item.classList.remove('dga-search-hidden-xkp492');
                } else {
                    item.style.display = 'none';
                    item.classList.add('dga-search-hidden-xkp492');
                    item.classList.remove('dga-search-match-xkp492');
                }
                
                // Reset text
                if (linkEl && linkEl.dataset.originalText) {
                    linkEl.textContent = linkEl.dataset.originalText;
                    delete linkEl.dataset.originalText;
                }
            }
        });
        
        // Update results count
        updateSearchResultsCount(container, matchCount);
        
        // Show message if no results
        if (matchCount === 0 && normalizedQuery) {
            showNoResultsMessage(container);
        } else {
            hideNoResultsMessage(container);
        }
    }
    
    // Show no results message
    function showNoResultsMessage(container) {
        const contentEl = container.querySelector('.dga-sitemap-content-xkp492');
        let noResultsEl = contentEl.querySelector('.dga-no-results-xkp492');
        
        if (!noResultsEl) {
            noResultsEl = document.createElement('div');
            noResultsEl.className = 'dga-no-results-xkp492';
            noResultsEl.innerHTML = `
                <p style="text-align: center; padding: 30px; color: #64748b; font-size: 16px;">
                    <span style="font-size: 24px; display: block; margin-bottom: 10px;">😔</span>
                    No results found. Try different keywords.
                </p>
            `;
            contentEl.appendChild(noResultsEl);
        }
    }
    
    // Hide no results message
    function hideNoResultsMessage(container) {
        const noResultsEl = container.querySelector('.dga-no-results-xkp492');
        if (noResultsEl) {
            noResultsEl.remove();
        }
    }
    
    // Show error message
    function showError(container, message) {
        container.innerHTML = `
            <div class="dga-sitemap-error-xkp492" role="alert">
                <span class="dga-error-icon-xkp492">⚠️</span>
                <p>${escapeHtml(message)}</p>
            </div>
        `;
    }
    
    // Utility function to debounce
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Accessibility improvements
    function enhanceAccessibility() {
        // Add keyboard navigation between items
        document.addEventListener('keydown', function(e) {
            const activeElement = document.activeElement;
            
            if (activeElement && activeElement.classList.contains('dga-sitemap-link-xkp492')) {
                const parentItem = activeElement.closest('.dga-sitemap-item-xkp492');
                let targetItem = null;
                
                switch(e.key) {
                    case 'ArrowDown':
                        targetItem = parentItem.nextElementSibling;
                        break;
                    case 'ArrowUp':
                        targetItem = parentItem.previousElementSibling;
                        break;
                    case 'ArrowRight':
                        const toggleBtn = parentItem.querySelector('.dga-toggle-btn-xkp492');
                        if (toggleBtn && toggleBtn.getAttribute('aria-expanded') === 'false') {
                            toggleSubmenu(toggleBtn);
                        }
                        break;
                    case 'ArrowLeft':
                        const parentToggleBtn = parentItem.querySelector('.dga-toggle-btn-xkp492');
                        if (parentToggleBtn && parentToggleBtn.getAttribute('aria-expanded') === 'true') {
                            toggleSubmenu(parentToggleBtn);
                        }
                        break;
                }
                
                if (targetItem) {
                    e.preventDefault();
                    const targetLink = targetItem.querySelector('.dga-sitemap-link-xkp492');
                    if (targetLink) {
                        targetLink.focus();
                    }
                }
            }
        });
    }
    
    // Initialize accessibility features
    enhanceAccessibility();
    
    // Expose public API for external usage
    window.DgaSitemap = {
        expandAll: function(containerId) {
            const container = document.querySelector(containerId || '.dga-sitemap-container-xkp492');
            if (container) {
                expandCollapseAll(container, true);
            }
        },
        collapseAll: function(containerId) {
            const container = document.querySelector(containerId || '.dga-sitemap-container-xkp492');
            if (container) {
                expandCollapseAll(container, false);
            }
        },
        search: function(query, containerId) {
            const container = document.querySelector(containerId || '.dga-sitemap-container-xkp492');
            if (container) {
                const searchInput = container.querySelector('.dga-sitemap-search-input-xkp492');
                if (searchInput) {
                    searchInput.value = query;
                    performSearch(container, query);
                }
            }
        },
        reset: function(containerId) {
            const container = document.querySelector(containerId || '.dga-sitemap-container-xkp492');
            if (container) {
                resetView(container);
            }
        }
    };
    
})();