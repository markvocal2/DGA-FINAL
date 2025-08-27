// widget-post-count-stats.js
(function() {
    'use strict';
    
    let activeChart = null;
    let activeModal = null;
    
    // Wait for DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeWidgets();
    });
    
    function initializeWidgets() {
        const widgets = document.querySelectorAll('.post-count-widget-xrt923');
        
        widgets.forEach(widget => {
            const postType = widget.dataset.posttype;
            const taxonomy = widget.dataset.taxonomy;
            const term = widget.dataset.term;
            const showStats = widget.dataset.showstats;
            
            // Fetch post count
            fetchPostCount(widget, postType, taxonomy, term, showStats);
        });
    }
    
    async function fetchPostCount(widget, postType, taxonomy, term, showStats) {
        const formData = new FormData();
        formData.append('action', 'get_post_count_xrt923');
        formData.append('nonce', postCountData.nonce);
        formData.append('posttype', postType);
        formData.append('taxonomy', taxonomy);
        formData.append('term', term);
        
        try {
            const response = await fetch(postCountData.ajax_url, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                updateWidget(widget, data.data.count, postType, taxonomy, term, showStats);
            } else {
                widget.innerHTML = `<span class="post-count-error-xrt923">${postCountData.i18n.error}</span>`;
            }
        } catch (error) {
            console.error('Error fetching post count:', error);
            widget.innerHTML = `<span class="post-count-error-xrt923">${postCountData.i18n.error}</span>`;
        }
    }
    
    function updateWidget(widget, count, postType, taxonomy, term, showStats) {
        let html = `<span class="post-count-number-xrt923">${count}</span>`;
        
        if (showStats === 'yes') {
            html += `
                <button class="post-stats-btn-xrt923" 
                        aria-label="${postCountData.i18n.statistics}"
                        data-posttype="${postType}"
                        data-taxonomy="${taxonomy}"
                        data-term="${term}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                        <line x1="9" y1="9" x2="21" y2="9"></line>
                    </svg>
                </button>
            `;
        }
        
        widget.innerHTML = html;
        
        // Add click handler to stats button
        if (showStats === 'yes') {
            const statsBtn = widget.querySelector('.post-stats-btn-xrt923');
            statsBtn.addEventListener('click', () => showStatsModal(postType, taxonomy, term));
        }
    }
    
    async function showStatsModal(postType, taxonomy, term) {
        // Remove existing modal if any
        if (activeModal) {
            activeModal.remove();
        }
        
        // Create modal structure
        const modal = document.createElement('div');
        modal.className = 'post-stats-modal-xrt923';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'stats-modal-title');
        modal.innerHTML = `
            <div class="post-stats-modal-content-xrt923">
                <div class="post-stats-modal-header-xrt923">
                    <h3 id="stats-modal-title">${postCountData.i18n.statistics}</h3>
                    <button class="post-stats-close-xrt923" aria-label="${postCountData.i18n.close}">×</button>
                </div>
                <div class="post-stats-controls-xrt923">
                    <select class="stats-year-select-xrt923" aria-label="Select year">
                        <option value="${new Date().getFullYear()}">${new Date().getFullYear()}</option>
                    </select>
                    <div class="stats-view-toggle-xrt923" role="group" aria-label="View options">
                        <button class="view-btn-xrt923 active" data-view="monthly">${postCountData.i18n.monthly}</button>
                        <button class="view-btn-xrt923" data-view="yearly">${postCountData.i18n.yearly}</button>
                    </div>
                </div>
                <div class="post-stats-chart-container-xrt923">
                    <canvas id="stats-chart-xrt923"></canvas>
                </div>
                <div class="post-stats-loading-xrt923">${postCountData.i18n.loading}</div>
            </div>
        `;
        
        document.body.appendChild(modal);
        activeModal = modal;
        
        // Setup event handlers
        const closeBtn = modal.querySelector('.post-stats-close-xrt923');
        const yearSelect = modal.querySelector('.stats-year-select-xrt923');
        const viewBtns = modal.querySelectorAll('.view-btn-xrt923');
        
        closeBtn.addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
        
        // Handle ESC key
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal(modal);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // View toggle handlers
        viewBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const view = btn.dataset.view;
                const year = yearSelect.value;
                
                if (view === 'yearly') {
                    yearSelect.style.display = 'none';
                } else {
                    yearSelect.style.display = 'block';
                }
                
                await loadStats(postType, taxonomy, term, year, view);
            });
        });
        
        // Year change handler
        yearSelect.addEventListener('change', async () => {
            const activeView = modal.querySelector('.view-btn-xrt923.active').dataset.view;
            await loadStats(postType, taxonomy, term, yearSelect.value, activeView);
        });
        
        // Load initial stats
        await loadStats(postType, taxonomy, term, new Date().getFullYear(), 'monthly');
    }
    
    async function loadStats(postType, taxonomy, term, year, view) {
        const loadingEl = document.querySelector('.post-stats-loading-xrt923');
        const chartContainer = document.querySelector('.post-stats-chart-container-xrt923');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (chartContainer) chartContainer.style.display = 'none';
        
        const formData = new FormData();
        formData.append('action', 'get_post_stats_xrt923');
        formData.append('nonce', postCountData.nonce);
        formData.append('posttype', postType);
        formData.append('taxonomy', taxonomy);
        formData.append('term', term);
        formData.append('year', year);
        formData.append('view', view);
        
        try {
            const response = await fetch(postCountData.ajax_url, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update year select options
                const yearSelect = document.querySelector('.stats-year-select-xrt923');
                if (yearSelect && data.data.available_years) {
                    const currentValue = yearSelect.value;
                    yearSelect.innerHTML = data.data.available_years
                        .map(y => `<option value="${y}" ${y == currentValue ? 'selected' : ''}>${y}</option>`)
                        .join('');
                }
                
                // Draw chart
                drawChart(data.data.stats, view);
                
                if (loadingEl) loadingEl.style.display = 'none';
                if (chartContainer) chartContainer.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            if (loadingEl) loadingEl.textContent = postCountData.i18n.error;
        }
    }
    
    function drawChart(stats, view) {
        const canvas = document.getElementById('stats-chart-xrt923');
        if (!canvas) return;
        
        // Destroy existing chart
        if (activeChart) {
            activeChart.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        
        // Prepare labels
        let labels;
        if (view === 'monthly') {
            const monthNames = [
                postCountData.i18n.jan, postCountData.i18n.feb, postCountData.i18n.mar,
                postCountData.i18n.apr, postCountData.i18n.may, postCountData.i18n.jun,
                postCountData.i18n.jul, postCountData.i18n.aug, postCountData.i18n.sep,
                postCountData.i18n.oct, postCountData.i18n.nov, postCountData.i18n.dec
            ];
            labels = stats.map(s => monthNames[s.label - 1]);
        } else {
            labels = stats.map(s => s.label);
        }
        
        const data = stats.map(s => s.count);
        
        // Create chart
        activeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: postCountData.i18n.posts,
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    hoverBackgroundColor: 'rgba(54, 162, 235, 0.7)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return postCountData.i18n.posts + ': ' + context.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            precision: 0
                        }
                    }
                }
            }
        });
    }
    
    function closeModal(modal) {
        if (activeChart) {
            activeChart.destroy();
            activeChart = null;
        }
        modal.remove();
        activeModal = null;
    }
    
})();