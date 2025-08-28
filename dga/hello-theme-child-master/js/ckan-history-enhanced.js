/**
 * CKAN History Report JavaScript - FIXED VERSION
 * Compatible with existing ckan_term_log data structure
 */

jQuery(document).ready(function($) {
    'use strict';
    
    // Store chart instances
    let charts = {
        activityTrend: null,
        actionTypes: null,
        topUsers: null
    };
    
    // ============================================
    // ========== Load Dashboard Summary ==========
    // ============================================
    
    function loadDashboardSummary() {
        $.ajax({
            url: ckan_report.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_dashboard_summary_fix927',
                nonce: ckan_report.nonce,
                period: ckan_report.period
            },
            success: function(response) {
                if (response.success) {
                    // Update card values with animation
                    animateCounter('#total-created', response.data.created);
                    animateCounter('#total-edited', response.data.edited);
                    animateCounter('#total-deleted', response.data.deleted);
                    animateCounter('#total-users', response.data.users);
                } else {
                    console.error('Failed to load dashboard summary');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', error);
                $('.ckan-card-value').html('<span class="error">เกิดข้อผิดพลาด</span>');
            }
        });
    }
    
    // ============================================
    // ========== Load Activity Trend Chart =======
    // ============================================
    
    function loadActivityTrend() {
        $.ajax({
            url: ckan_report.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_activity_trend_fix927',
                nonce: ckan_report.nonce,
                period: ckan_report.period,
                type: ckan_report.type
            },
            success: function(response) {
                if (response.success && response.data) {
                    renderActivityTrendChart(response.data);
                }
            },
            error: function(xhr, status, error) {
                console.error('Failed to load activity trend:', error);
            }
        });
    }
    
    function renderActivityTrendChart(data) {
        const ctx = document.getElementById('activity-trend-chart');
        if (!ctx) return;
        
        // Destroy existing chart if any
        if (charts.activityTrend) {
            charts.activityTrend.destroy();
        }
        
        // Create new chart
        charts.activityTrend = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return 'วันที่ ' + context[0].label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }
    
    // ============================================
    // ========== Load Action Types Chart =========
    // ============================================
    
    function loadActionTypes() {
        $.ajax({
            url: ckan_report.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_action_types_fix927',
                nonce: ckan_report.nonce,
                period: ckan_report.period,
                type: ckan_report.type
            },
            success: function(response) {
                if (response.success && response.data) {
                    renderActionTypesChart(response.data);
                }
            },
            error: function(xhr, status, error) {
                console.error('Failed to load action types:', error);
            }
        });
    }
    
    function renderActionTypesChart(data) {
        const ctx = document.getElementById('action-types-chart');
        if (!ctx) return;
        
        // Destroy existing chart if any
        if (charts.actionTypes) {
            charts.actionTypes.destroy();
        }
        
        // Create new chart
        charts.actionTypes = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // ============================================
    // ========== Load Top Users Chart ============
    // ============================================
    
    function loadTopUsers() {
        $.ajax({
            url: ckan_report.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_top_users_fix927',
                nonce: ckan_report.nonce,
                period: ckan_report.period,
                type: ckan_report.type
            },
            success: function(response) {
                if (response.success && response.data) {
                    renderTopUsersChart(response.data);
                }
            },
            error: function(xhr, status, error) {
                console.error('Failed to load top users:', error);
            }
        });
    }
    
    function renderTopUsersChart(data) {
        const ctx = document.getElementById('top-users-chart');
        if (!ctx) return;
        
        // Destroy existing chart if any
        if (charts.topUsers) {
            charts.topUsers.destroy();
        }
        
        // Create new chart
        charts.topUsers = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Horizontal bar chart
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `กิจกรรม: ${context.parsed.x} ครั้ง`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }
    
    // ============================================
    // ========== Load Recent Activities ==========
    // ============================================
    
    function loadRecentActivities() {
        $.ajax({
            url: ckan_report.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_recent_activities_fix927',
                nonce: ckan_report.nonce,
                limit: ckan_report.limit || 10
            },
            success: function(response) {
                if (response.success && response.data?.activities) {
                    renderActivitiesTable(response.data.activities);
                }
            },
            error: function(xhr, status, error) {
                console.error('Failed to load recent activities:', error);
                $('#recent-activities-tbody').html(
                    '<tr><td colspan="5" class="error">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>'
                );
            }
        });
    }
    
    function renderActivitiesTable(activities) {
        const tbody = $('#recent-activities-tbody');
        
        if (activities.length === 0) {
            tbody.html('<tr><td colspan="5" class="no-data">ไม่พบข้อมูลกิจกรรม</td></tr>');
            return;
        }
        
        let html = '';
        activities.forEach(function(activity) {
            // Determine badge class based on action
            let badgeClass = 'badge-default';
            if (activity.action_class === 'created') badgeClass = 'badge-success';
            else if (activity.action_class === 'edited') badgeClass = 'badge-primary';
            else if (activity.action_class === 'deleted') badgeClass = 'badge-danger';
            
            html += `
                <tr>
                    <td>${activity.time}</td>
                    <td><span class="badge ${badgeClass}">${activity.action}</span></td>
                    <td>${activity.term_name || '-'}</td>
                    <td>${activity.user || '-'}</td>
                    <td>${activity.taxonomy || '-'}</td>
                </tr>
            `;
        });
        
        tbody.html(html);
    }
    
    // ============================================
    // ========== Helper Functions ================
    // ============================================
    
    function animateCounter(selector, targetValue) {
        const $element = $(selector);
        const startValue = 0;
        const duration = 1000;
        const startTime = Date.now();
        
        function updateCounter() {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            const currentValue = Math.floor(progress * targetValue);
            
            $element.text(formatNumber(currentValue));
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                $element.text(formatNumber(targetValue));
            }
        }
        
        updateCounter();
    }
    
    function formatNumber(num) {
        // Use Intl.NumberFormat for safe number formatting
        try {
            return new Intl.NumberFormat('en-US').format(num);
        } catch (error) {
            // Log the error for debugging purposes
            console.warn('Number formatting failed:', error.message, 'for value:', num);
            // Fallback to simple string conversion
            return num.toString();
        }
    }
    
    // ============================================
    // ========== Event Handlers ==================
    // ============================================
    
    // Refresh button
    $('#refresh-report').on('click', function() {
        loadDashboardSummary();
        loadActivityTrend();
        loadActionTypes();
        loadTopUsers();
        loadRecentActivities();
    });
    
    // Export button
    $('#export-report').on('click', function() {
        exportToCSV();
    });
    
    // Print button  
    $('#print-report').on('click', function() {
        window.print();
    });
    
    // Export to CSV function
    function exportToCSV() {
        // Get table data
        const table = document.querySelector('.ckan-data-table');
        let csv = [];
        const rows = table.querySelectorAll('tr');
        
        for (let i = 0; i < rows.length; i++) {
            const row = [];
            const cols = rows[i].querySelectorAll('td, th');
            
            for (let j = 0; j < cols.length; j++) {
                let text = cols[j].innerText.replace(/,/g, '');
                row.push('"' + text + '"');
            }
            
            csv.push(row.join(','));
        }
        
        // Download CSV
        const csvContent = '\uFEFF' + csv.join('\n'); // Add BOM for UTF-8
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', 'ckan-report-' + Date.now() + '.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // ============================================
    // ========== Initialize ======================
    // ============================================
    
    // Set Chart.js defaults
    if (typeof Chart !== 'undefined') {
        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        Chart.defaults.font.size = 13;
        Chart.defaults.color = '#333333';
    }
    
    // Load all data on page load
    loadDashboardSummary();
    loadActivityTrend();
    loadActionTypes();
    loadTopUsers();
    loadRecentActivities();
    
    // Auto-refresh every 30 seconds (optional)
    if (ckan_report.auto_refresh === 'true') {
        setInterval(function() {
            loadDashboardSummary();
            loadRecentActivities();
        }, 30000);
    }
});