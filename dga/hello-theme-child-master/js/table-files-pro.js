/**
 * Table Files Pro JavaScript - Elementor Compatible
 * Version: 2.1.0
 */

(function() {
    'use strict';

    // Main Controller Class
    class TableFilesController {
        constructor() {
            this.containers = [];
            this.init();
        }
        
        init() {
            // Wait for DOM ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
            
            // Reinitialize for Elementor Editor
            if (window.elementorFrontend) {
                elementorFrontend.hooks.addAction('frontend/element_ready/global', () => {
                    this.setup();
                });
            }
        }
        
        setup() {
            // Find all containers
            const containers = document.querySelectorAll('.table-files-wrapper-abc123');
            
            containers.forEach(container => {
                // Skip if already initialized
                if (container.dataset.initialized === 'true') {
                    return;
                }
                
                container.dataset.initialized = 'true';
                this.setupContainer(container);
            });
        }
        
        setupContainer(wrapper) {
            const container = wrapper.querySelector('.tf-container-abc123');
            if (!container) return;
            
            // Setup search
            this.setupSearch(wrapper);
            
            // Setup view toggle
            this.setupViewToggle(wrapper);
            
            // Setup sorting
            this.setupSorting(wrapper);
            
            // Setup preview buttons
            this.setupPreviewButtons(wrapper);
            
            // Setup modal
            this.setupModal(wrapper);
            
            // Setup download tracking
            this.setupDownloadTracking(wrapper);
            
            // Auto detect mobile
            this.detectMobileView(wrapper);
            
            // Window resize handler
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    this.detectMobileView(wrapper);
                }, 250);
            });
        }
        
        setupSearch(wrapper) {
            const searchInput = wrapper.querySelector('.tf-search-input-abc123');
            if (!searchInput) return;
            
            let searchTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimer);
                searchTimer = setTimeout(() => {
                    this.handleSearch(wrapper, e.target.value);
                }, 300);
            });
            
            // Clear on Escape
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    e.target.value = '';
                    this.handleSearch(wrapper, '');
                }
            });
        }
        
        handleSearch(wrapper, searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            
            // Table rows
            const rows = wrapper.querySelectorAll('.tf-table-abc123 tbody tr');
            let visibleCount = 0;
            
            rows.forEach(row => {
                const filename = row.dataset.filename ? row.dataset.filename.toLowerCase() : '';
                const dateCell = row.querySelector('.tf-col-date-abc123');
                const date = dateCell ? dateCell.textContent.toLowerCase() : '';
                
                if (!term || filename.includes(term) || date.includes(term)) {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            });
            
            // Cards
            const cards = wrapper.querySelectorAll('.tf-card-abc123');
            cards.forEach(card => {
                const filename = card.dataset.filename ? card.dataset.filename.toLowerCase() : '';
                
                if (!term || filename.includes(term)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Show no results message
            const noResults = wrapper.querySelector('.tf-no-results-abc123');
            if (noResults) {
                noResults.style.display = visibleCount === 0 && term ? 'block' : 'none';
            }
            
            // Update counter
            this.updateFileCount(wrapper);
        }
        
        setupViewToggle(wrapper) {
            const toggleBtn = wrapper.querySelector('.tf-view-toggle-abc123');
            if (!toggleBtn) return;
            
            toggleBtn.addEventListener('click', () => {
                wrapper.classList.toggle('view-cards');
                
                // Save preference
                const isCards = wrapper.classList.contains('view-cards');
                if (window.localStorage) {
                    localStorage.setItem('tableFilesView', isCards ? 'cards' : 'table');
                }
            });
        }
        
        setupSorting(wrapper) {
            const headers = wrapper.querySelectorAll('.tf-table-abc123 th[data-sort]');
            
            headers.forEach(header => {
                header.addEventListener('click', () => {
                    this.sortTable(wrapper, header);
                });
            });
        }
        
        sortTable(wrapper, header) {
            const table = wrapper.querySelector('.tf-table-abc123');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const sortBy = header.dataset.sort;
            
            // Toggle sort direction
            const isAsc = header.classList.contains('sort-asc');
            
            // Remove all sort classes
            wrapper.querySelectorAll('th').forEach(th => {
                th.classList.remove('sort-asc', 'sort-desc');
            });
            
            // Add new sort class
            header.classList.add(isAsc ? 'sort-desc' : 'sort-asc');
            
            // Sort rows
            rows.sort((a, b) => {
                let aVal, bVal;
                
                if (sortBy === 'name') {
                    aVal = a.dataset.filename || '';
                    bVal = b.dataset.filename || '';
                } else if (sortBy === 'date') {
                    const aDate = a.querySelector('.tf-col-date-abc123').dataset.date || '';
                    const bDate = b.querySelector('.tf-col-date-abc123').dataset.date || '';
                    
                    // Parse DD/MM/YYYY format
                    const parseDate = (dateStr) => {
                        const parts = dateStr.split('/');
                        if (parts.length === 3) {
                            return new Date(parts[2], parts[1] - 1, parts[0]);
                        }
                        return new Date();
                    };
                    
                    aVal = parseDate(aDate);
                    bVal = parseDate(bDate);
                } else {
                    return 0;
                }
                
                if (aVal < bVal) return isAsc ? 1 : -1;
                if (aVal > bVal) return isAsc ? -1 : 1;
                return 0;
            });
            
            // Reorder rows
            rows.forEach(row => tbody.appendChild(row));
        }
        
        setupPreviewButtons(wrapper) {
            const previewButtons = wrapper.querySelectorAll('.tf-btn-preview-abc123');
            
            previewButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openPreview(wrapper, btn);
                });
            });
        }
        
        setupModal(wrapper) {
            const modal = wrapper.querySelector('.tf-modal-abc123');
            if (!modal) return;
            
            // Close button
            const closeBtn = modal.querySelector('.tf-modal-close-abc123');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeModal(modal);
                });
            }
            
            // Overlay click
            const overlay = modal.querySelector('.tf-modal-overlay-abc123');
            if (overlay) {
                overlay.addEventListener('click', () => {
                    this.closeModal(modal);
                });
            }
            
            // Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    this.closeModal(modal);
                }
            });
        }
        
        openPreview(wrapper, button) {
            const modal = wrapper.querySelector('.tf-modal-abc123');
            if (!modal) return;
            
            const url = button.dataset.url;
            const filename = button.dataset.filename;
            const downloadUrl = button.dataset.download;
            
            // Update modal content
            const filenameEl = modal.querySelector('.pdf-filename');
            if (filenameEl) {
                filenameEl.textContent = filename;
            }
            
            const iframe = modal.querySelector('.tf-pdf-frame-abc123');
            const loading = modal.querySelector('.tf-loading-abc123');
            
            if (iframe && loading) {
                // Show loading
                loading.style.display = 'block';
                iframe.classList.remove('loaded');
                
                // Set iframe source
                iframe.src = url;
                
                // Handle load event
                iframe.onload = () => {
                    loading.style.display = 'none';
                    iframe.classList.add('loaded');
                };
                
                // Handle error
                iframe.onerror = () => {
                    loading.innerHTML = '<p style="color: white;">ไม่สามารถโหลด PDF ได้</p>';
                };
            }
            
            // Update download link
            const downloadLink = modal.querySelector('.pdf-download-link');
            if (downloadLink) {
                downloadLink.href = downloadUrl;
            }
            
            // Show modal
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus for accessibility
            modal.setAttribute('aria-hidden', 'false');
            if (closeBtn) {
                const closeBtn = modal.querySelector('.tf-modal-close-abc123');
                closeBtn.focus();
            }
        }
        
        closeModal(modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            
            // Clear iframe
            const iframe = modal.querySelector('.tf-pdf-frame-abc123');
            if (iframe) {
                iframe.src = '';
                iframe.classList.remove('loaded');
            }
            
            // Reset loading
            const loading = modal.querySelector('.tf-loading-abc123');
            if (loading) {
                loading.style.display = 'block';
                loading.innerHTML = '<div class="tf-spinner-abc123"></div><p>กำลังโหลด...</p>';
            }
            
            modal.setAttribute('aria-hidden', 'true');
        }
        
        setupDownloadTracking(wrapper) {
            const downloadButtons = wrapper.querySelectorAll('.tf-btn-download-abc123:not(.tf-external)');
            
            downloadButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Get filename
                    const row = btn.closest('.tf-row-abc123, .tf-card-abc123');
                    let filename = 'Unknown';
                    
                    if (row) {
                        filename = row.dataset.filename || 'Unknown';
                    }
                    
                    // Show notification
                    this.showNotification(`กำลังดาวน์โหลด: ${filename}`);
                    
                    // Track with Google Analytics if available
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'download', {
                            'event_category': 'File Downloads',
                            'event_label': filename
                        });
                    }
                });
            });
            
            // External links
            const externalButtons = wrapper.querySelectorAll('.tf-btn-download-abc123.tf-external');
            
            externalButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const row = btn.closest('.tf-row-abc123, .tf-card-abc123');
                    let filename = 'Unknown';
                    
                    if (row) {
                        filename = row.dataset.filename || 'Unknown';
                    }
                    
                    this.showNotification(`กำลังเปิดลิงก์ภายนอก: ${filename}`);
                });
            });
        }
        
        showNotification(message) {
            // Remove existing notification
            const existing = document.querySelector('.tf-notification-abc123');
            if (existing) {
                existing.remove();
            }
            
            // Create notification
            const notification = document.createElement('div');
            notification.className = 'tf-notification-abc123';
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                background: #1e73be;
                color: white;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 999999;
                font-size: 14px;
                animation: slideInRight 0.3s ease;
            `;
            
            document.body.appendChild(notification);
            
            // Auto remove
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 3000);
        }
        
        updateFileCount(wrapper) {
            const visibleRows = wrapper.querySelectorAll('.tf-table-abc123 tbody tr:not([style*="display: none"])');
            const totalRows = wrapper.querySelectorAll('.tf-table-abc123 tbody tr');
            
            const counter = wrapper.querySelector('.tf-file-count-abc123');
            if (counter) {
                if (visibleRows.length < totalRows.length) {
                    counter.textContent = `แสดง ${visibleRows.length} จาก ${totalRows.length} ไฟล์`;
                } else {
                    counter.textContent = `แสดง ${totalRows.length} ไฟล์`;
                }
            }
        }
        
        detectMobileView(wrapper) {
            const isMobile = window.innerWidth < 1024;
            const layout = wrapper.dataset.layout || 'auto';
            
            if (layout === 'auto') {
                // Check saved preference
                const savedView = localStorage.getItem('tableFilesView');
                
                if (isMobile) {
                    // Force cards on mobile
                    wrapper.classList.add('view-cards');
                } else if (savedView === 'cards') {
                    wrapper.classList.add('view-cards');
                } else {
                    wrapper.classList.remove('view-cards');
                }
            } else if (layout === 'cards') {
                wrapper.classList.add('view-cards');
            } else if (layout === 'table') {
                wrapper.classList.remove('view-cards');
            }
        }
    }
    
    // Add animations CSS
    if (!document.querySelector('#tf-animations-style')) {
        const style = document.createElement('style');
        style.id = 'tf-animations-style';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize
    window.TableFilesController = new TableFilesController();
    
    // Reinitialize for Elementor
    if (window.jQuery) {
        jQuery(window).on('elementor/frontend/init', function() {
            if (window.TableFilesController) {
                window.TableFilesController.setup();
            }
        });
    }
})();