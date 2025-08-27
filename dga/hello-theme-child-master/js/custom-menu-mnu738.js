/**
 * Custom Menu JavaScript - Fixed Version
 * Version: 1.3
 * Unique ID: mnu738
 * Fixed mouseX/mouseY scope issues and improved stability
 */

(function() {
    'use strict';
    
    // Global variables for mouse tracking (declared at top level)
    let globalMouseX = 0;
    let globalMouseY = 0;
    
    // Wait for DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        const menuContainer = document.querySelector('.custom-menu-container-mnu738');
        if (!menuContainer) return;
        
        const isMobile = () => window.innerWidth <= 768;
        
        // Initialize menu based on screen size
        const initMenu = () => {
            if (isMobile()) {
                initMobileMenu();
            } else {
                initDesktopMenu();
            }
        };
        
        // Check if element is out of viewport
        const isOutOfViewport = (element, side = 'right') => {
            const rect = element.getBoundingClientRect();
            const viewport = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            
            if (side === 'right') {
                return rect.right > viewport.width;
            } else if (side === 'left') {
                return rect.left < 0;
            } else if (side === 'bottom') {
                return rect.bottom > viewport.height;
            }
            return false;
        };
        
        // Position submenu to avoid viewport overflow
        const positionSubmenu = (submenu, parentItem) => {
            // Reset positioning classes
            submenu.classList.remove('position-left-mnu738', 'position-right-mnu738', 'position-top-mnu738');
            
            // Temporarily show to get dimensions
            submenu.style.visibility = 'hidden';
            submenu.style.display = 'block';
            
            const isNestedSubmenu = parentItem.closest('.sub-menu-mnu738') !== null;
            
            if (isNestedSubmenu) {
                // Nested submenu positioning
                submenu.classList.add('position-right-mnu738');
                
                // Check if it overflows right
                if (isOutOfViewport(submenu, 'right')) {
                    submenu.classList.remove('position-right-mnu738');
                    submenu.classList.add('position-left-mnu738');
                }
            } else {
                // Top-level submenu - check if it overflows bottom
                if (isOutOfViewport(submenu, 'bottom')) {
                    const parentRect = parentItem.getBoundingClientRect();
                    const submenuHeight = submenu.offsetHeight;
                    
                    // If there's enough space above, show it above the parent
                    if (parentRect.top >= submenuHeight) {
                        submenu.classList.add('position-top-mnu738');
                    }
                }
                
                // Check horizontal overflow for top-level items
                if (isOutOfViewport(submenu, 'right')) {
                    const parentRect = parentItem.getBoundingClientRect();
                    const submenuWidth = submenu.offsetWidth;
                    
                    // Align to right edge of parent if it fits
                    submenu.style.left = 'auto';
                    submenu.style.right = '0';
                    
                    // If still overflows, position from right edge of viewport
                    if (isOutOfViewport(submenu, 'right')) {
                        const rightSpace = window.innerWidth - parentRect.right;
                        submenu.style.right = `-${rightSpace - 10}px`;
                    }
                }
            }
            
            // Reset visibility
            submenu.style.visibility = '';
            submenu.style.display = '';
        };
        
        // Desktop menu functionality
        const initDesktopMenu = () => {
            // Remove mobile event listeners
            removeMobileListeners();
            
            const menuItems = menuContainer.querySelectorAll('.has-children-mnu738');
            
            menuItems.forEach(item => {
                const subMenu = item.querySelector(':scope > .sub-menu-mnu738');
                if (!subMenu) return;
                
                let hoverIntent = null;
                let leaveTimeout = null;
                
                // Check if mouse is moving towards submenu
                const isMovingTowardsSubmenu = (fromElement, toElement) => {
                    const fromRect = fromElement.getBoundingClientRect();
                    const toRect = toElement.getBoundingClientRect();
                    
                    // Get the general direction
                    const isRightSubmenu = toRect.left >= fromRect.right - 10;
                    const isLeftSubmenu = toRect.right <= fromRect.left + 10;
                    
                    if (isRightSubmenu && globalMouseX > fromRect.right - 50) {
                        return true;
                    }
                    if (isLeftSubmenu && globalMouseX < fromRect.left + 50) {
                        return true;
                    }
                    
                    return false;
                };
                
                // Show submenu function
                const showSubmenu = () => {
                    clearTimeout(leaveTimeout);
                    
                    // Close other open menus at same level
                    const siblings = Array.from(item.parentElement.children);
                    siblings.forEach(sibling => {
                        if (sibling !== item && sibling.classList.contains('has-children-mnu738')) {
                            const siblingSubmenu = sibling.querySelector(':scope > .sub-menu-mnu738');
                            if (siblingSubmenu) {
                                siblingSubmenu.style.display = 'none';
                                siblingSubmenu.classList.remove('active-submenu-mnu738');
                                sibling.classList.remove('active-mnu738');
                            }
                        }
                    });
                    
                    positionSubmenu(subMenu, item);
                    subMenu.style.display = 'block';
                    subMenu.classList.add('active-submenu-mnu738');
                    item.classList.add('active-mnu738');
                };
                
                // Hide submenu function
                const hideSubmenu = () => {
                    leaveTimeout = setTimeout(() => {
                        // Double-check mouse isn't over menu elements
                        const menuRect = item.getBoundingClientRect();
                        const submenuRect = subMenu.getBoundingClientRect();
                        
                        // Add buffer zone
                        const buffer = 50;
                        const isOverMenu = (
                            globalMouseX >= menuRect.left - buffer && 
                            globalMouseX <= menuRect.right + buffer && 
                            globalMouseY >= menuRect.top - buffer && 
                            globalMouseY <= menuRect.bottom + buffer
                        );
                        
                        const isOverSubmenu = subMenu.style.display === 'block' && (
                            globalMouseX >= submenuRect.left - buffer && 
                            globalMouseX <= submenuRect.right + buffer && 
                            globalMouseY >= submenuRect.top - buffer && 
                            globalMouseY <= submenuRect.bottom + buffer
                        );
                        
                        if (!isOverMenu && !isOverSubmenu) {
                            subMenu.style.display = 'none';
                            subMenu.classList.remove('active-submenu-mnu738');
                            item.classList.remove('active-mnu738');
                        }
                    }, 300); // Increased delay
                };
                
                // Mouse enter on parent item
                item.addEventListener('mouseenter', function(e) {
                    clearTimeout(hoverIntent);
                    
                    hoverIntent = setTimeout(() => {
                        showSubmenu();
                    }, 100); // Slight delay to prevent accidental triggers
                });
                
                // Mouse leave from parent item
                item.addEventListener('mouseleave', function(e) {
                    clearTimeout(hoverIntent);
                    
                    // Check if moving towards submenu
                    if (subMenu.style.display === 'block' && isMovingTowardsSubmenu(item, subMenu)) {
                        // Give extra time when moving towards submenu
                        setTimeout(() => {
                            if (!item.matches(':hover') && !subMenu.matches(':hover')) {
                                hideSubmenu();
                            }
                        }, 500);
                    } else {
                        hideSubmenu();
                    }
                });
                
                // Mouse enter on submenu
                subMenu.addEventListener('mouseenter', function() {
                    clearTimeout(leaveTimeout);
                    clearTimeout(hoverIntent);
                });
                
                // Mouse leave from submenu
                subMenu.addEventListener('mouseleave', function(e) {
                    // Check if returning to parent
                    const parentRect = item.getBoundingClientRect();
                    if (globalMouseX >= parentRect.left && globalMouseX <= parentRect.right && 
                        globalMouseY >= parentRect.top && globalMouseY <= parentRect.bottom) {
                        return; // Don't hide if going back to parent
                    }
                    
                    hideSubmenu();
                });
                
                // Keyboard accessibility
                const link = item.querySelector(':scope > a');
                link.addEventListener('focus', function() {
                    showSubmenu();
                });
                
                // Handle keyboard navigation
                link.addEventListener('keydown', function(e) {
                    if (e.key === 'ArrowRight' || e.key === 'Enter') {
                        e.preventDefault();
                        const firstSubLink = subMenu.querySelector('a');
                        if (firstSubLink) firstSubLink.focus();
                    } else if (e.key === 'Escape') {
                        subMenu.style.display = 'none';
                        item.classList.remove('active-mnu738');
                    }
                });
                
                // Better focus management
                subMenu.addEventListener('focusin', function() {
                    clearTimeout(leaveTimeout);
                });
                
                subMenu.addEventListener('focusout', function(e) {
                    setTimeout(() => {
                        if (!item.contains(document.activeElement) && !subMenu.contains(document.activeElement)) {
                            subMenu.style.display = 'none';
                            item.classList.remove('active-mnu738');
                        }
                    }, 100);
                });
            });
            
            // Handle window scroll
            let scrollTimeout;
            window.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    const activeMenus = menuContainer.querySelectorAll('.active-mnu738');
                    activeMenus.forEach(item => {
                        const subMenu = item.querySelector(':scope > .sub-menu-mnu738');
                        if (subMenu && subMenu.style.display === 'block') {
                            positionSubmenu(subMenu, item);
                        }
                    });
                }, 10);
            });
        };
        
        // Mobile menu functionality
        const initMobileMenu = () => {
            const menuItems = menuContainer.querySelectorAll('.has-children-mnu738 > a');
            
            menuItems.forEach(link => {
                link.addEventListener('click', handleMobileClick);
                link.addEventListener('touchstart', handleTouchStart);
            });
        };
        
        // Handle touch start to improve mobile responsiveness
        const handleTouchStart = (e) => {
            e.currentTarget.classList.add('touched-mnu738');
        };
        
        // Handle mobile menu clicks
        const handleMobileClick = (e) => {
            e.preventDefault();
            
            const menuItem = e.currentTarget.parentElement;
            const subMenu = menuItem.querySelector(':scope > .sub-menu-mnu738');
            
            if (!subMenu) return;
            
            // Close other menus at same level
            const siblings = Array.from(menuItem.parentElement.children);
            siblings.forEach(sibling => {
                if (sibling !== menuItem && sibling.classList.contains('expanded')) {
                    const siblingSubmenu = sibling.querySelector(':scope > .sub-menu-mnu738');
                    if (siblingSubmenu) {
                        slideUp(siblingSubmenu);
                        sibling.classList.remove('expanded');
                    }
                }
            });
            
            if (menuItem.classList.contains('expanded')) {
                slideUp(subMenu);
                menuItem.classList.remove('expanded');
            } else {
                slideDown(subMenu);
                menuItem.classList.add('expanded');
            }
        };
        
        // Remove mobile event listeners
        const removeMobileListeners = () => {
            const menuItems = menuContainer.querySelectorAll('.has-children-mnu738 > a');
            menuItems.forEach(link => {
                link.removeEventListener('click', handleMobileClick);
                link.removeEventListener('touchstart', handleTouchStart);
                link.classList.remove('touched-mnu738');
            });
            
            // Reset expanded states and positioning
            const expandedItems = menuContainer.querySelectorAll('.expanded, .active-mnu738');
            expandedItems.forEach(item => {
                item.classList.remove('expanded', 'active-mnu738');
                const subMenu = item.querySelector(':scope > .sub-menu-mnu738');
                if (subMenu) {
                    subMenu.style.display = '';
                    subMenu.style.height = '';
                    subMenu.style.left = '';
                    subMenu.style.right = '';
                    subMenu.classList.remove('active-submenu-mnu738');
                }
            });
        };
        
        // Slide animations
        const slideUp = (element, duration = 200) => {
            element.style.height = element.offsetHeight + 'px';
            element.style.overflow = 'hidden';
            element.style.transition = `height ${duration}ms ease`;
            
            element.offsetHeight; // Force reflow
            element.style.height = '0';
            
            setTimeout(() => {
                element.style.display = 'none';
                element.style.height = '';
                element.style.overflow = '';
                element.style.transition = '';
            }, duration);
        };
        
        const slideDown = (element, duration = 200) => {
            element.style.display = 'block';
            const height = element.offsetHeight;
            element.style.height = '0';
            element.style.overflow = 'hidden';
            element.style.transition = `height ${duration}ms ease`;
            
            element.offsetHeight; // Force reflow
            element.style.height = height + 'px';
            
            setTimeout(() => {
                element.style.height = '';
                element.style.overflow = '';
                element.style.transition = '';
            }, duration);
        };
        
        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                initMenu();
            }, 250);
        });
        
        // Initialize on load
        initMenu();
    });
    
    // Global mouse position tracking (outside DOMContentLoaded)
    document.addEventListener('mousemove', (e) => {
        globalMouseX = e.clientX;
        globalMouseY = e.clientY;
    });
})();