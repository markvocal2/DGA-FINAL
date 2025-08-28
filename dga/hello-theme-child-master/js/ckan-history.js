/**
 * CKAN History Report - Complete JavaScript
 * Version: 5.0
 * File: /js/ckan-history.js
 * Description: ระบบแสดงผล Activity Log แบบ Real-time พร้อม Charts และ Filters
 */

jQuery(document).ready(function($) {
    'use strict';
    
    // ============================================
    // ========== CONFIGURATION ===================
    // ============================================
    
    // Action types configuration - รองรับทุก action types
    const allActionTypes = {
        // กิจกรรมหลัก
        'Created': { label: 'สร้าง', color: '#4CAF50', icon: 'dashicons-plus-alt' },
        'Edited': { label: 'แก้ไข', color: '#2196F3', icon: 'dashicons-edit' },
        'Deleted': { label: 'ลบ', color: '#F44336', icon: 'dashicons-trash' },
        'Viewed': { label: 'ดู', color: '#9C27B0', icon: 'dashicons-visibility' },
        'Downloaded': { label: 'ดาวน์โหลด', color: '#FF9800', icon: 'dashicons-download' },
        'API_Request': { label: 'เรียก API', color: '#00BCD4', icon: 'dashicons-cloud' },
        'Published': { label: 'เผยแพร่', color: '#8BC34A', icon: 'dashicons-admin-site' },
        'Unpublished': { label: 'ยกเลิกเผยแพร่', color: '#FFC107', icon: 'dashicons-hidden' },
        // กิจกรรม User
        'User_Login': { label: 'เข้าสู่ระบบ', color: '#4CAF50', icon: 'dashicons-unlock' },
        'User_Logout': { label: 'ออกจากระบบ', color: '#9E9E9E', icon: 'dashicons-lock' },
        'Failed_Login': { label: 'เข้าสู่ระบบไม่สำเร็จ', color: '#F44336', icon: 'dashicons-warning' },
        // กิจกรรมอื่นๆ
        'Uploaded': { label: 'อัพโหลด', color: '#00BCD4', icon: 'dashicons-upload' },
        'Search': { label: 'ค้นหา', color: '#FF5722', icon: 'dashicons-search' },
        'Commented': { label: 'แสดงความคิดเห็น', color: '#607D8B', icon: 'dashicons-admin-comments' }
    };
    
    // Merge with server config if available
    if (window.ckanReport?.actionTypes) {
        Object.assign(allActionTypes, window.ckanReport.actionTypes);
    }
    
    // ============================================
    // ========== STATE MANAGEMENT ================
    // ============================================
    
    const state = {
        charts: {},
        currentPage: 1,
        period: ckanReport.period || 'month',
        isLoading: false,
        filters: {
            action: 'all',
            user: 'all',
            taxonomy: 'all'
        },
        autoRefreshInterval: null,
        lastUpdate: new Date()
    };
    
    // ============================================
    // ========== INITIALIZATION ==================
    // ============================================
    
    function init() {
        console.log('CKAN History Report initialized');
        
        // Initial load
        loadData();
        
        // Bind events
        bindEvents();
        
        // Initialize filters UI
        initFilters();
        
        // Setup auto refresh
        setupAutoRefresh();
        
        // Initialize tooltips if available
        initTooltips();
    }
    
    // ============================================
    // ========== DATA LOADING ====================
    // ============================================
    
    function loadData() {
        if (state.isLoading) {
            console.log('Already loading, skipping...');
            return;
        }
        
        state.isLoading = true;
        showLoading();
        
        // Main data request
        $.ajax({
            url: ckanReport.ajaxUrl,
            type: 'POST',
            timeout: 15000,
            data: {
                action: 'ckan_get_data_hjk729',
                nonce: ckanReport.nonce,
                period: state.period,
                filters: state.filters
            }
        })
        .done(function(response) {
            if (response.success) {
                updateDashboard(response.data);
                renderCharts(response.data);
                state.lastUpdate = new Date();
                updateLastUpdateTime();
            } else {
                showError('ไม่สามารถโหลดข้อมูลได้: ' + (response.data || 'Unknown error'));
            }
        })
        .fail(function(xhr, status, error) {
            handleAjaxError(xhr, status, error);
        })
        .always(function() {
            state.isLoading = false;
            hideLoading();
        });
        
        // Load activities separately
        loadActivities(state.currentPage);
    }
    
    function loadActivities(page) {
        // Show loading in table
        $('#activities-tbody').html('<tr><td colspan="6" class="text-center"><span class="spinner"></span> กำลังโหลด...</td></tr>');
        
        $.ajax({
            url: ckanReport.ajaxUrl,
            type: 'POST',
            timeout: 10000,
            data: {
                action: 'ckan_get_activities_hjk729',
                nonce: ckanReport.nonce,
                page: page,
                per_page: ckanReport.limit || 10,
                period: state.period,
                filters: state.filters
            }
        })
        .done(function(response) {
            if (response.success) {
                renderActivities(response.data);
            } else {
                $('#activities-tbody').html('<tr><td colspan="6" class="text-center text-danger">เกิดข้อผิดพลาด: ' + (response.data || 'Unknown error') + '</td></tr>');
            }
        })
        .fail(function(xhr, status, error) {
            $('#activities-tbody').html('<tr><td colspan="6" class="text-center text-danger">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>');
        });
    }
    
    // ============================================
    // ========== UI UPDATES ======================
    // ============================================
    
    function updateDashboard(data) {
        if (!data.summary) return;
        
        // Animate main cards
        animateValue('#total-created', data.summary.created || 0);
        animateValue('#total-edited', data.summary.edited || 0);
        animateValue('#total-deleted', data.summary.deleted || 0);
        animateValue('#total-users', data.summary.users || 0);
        
        // Add additional cards dynamically if data exists
        if (data.summary.uploads && $('#total-uploads').length === 0) {
            addDynamicCard('uploads', 'อัพโหลด', data.summary.uploads, '#00BCD4', 'dashicons-upload');
        } else if (data.summary.uploads) {
            animateValue('#total-uploads', data.summary.uploads);
        }
        
        if (data.summary.logins && $('#total-logins').length === 0) {
            addDynamicCard('logins', 'เข้าสู่ระบบ', data.summary.logins, '#4CAF50', 'dashicons-unlock');
        } else if (data.summary.logins) {
            animateValue('#total-logins', data.summary.logins);
        }
        
        // Update summary text
        updateSummaryText(data.summary);
    }
    
    function addDynamicCard(id, label, value, color, icon) {
        const cardHtml = `
            <div class="ckan-card-hjk729 fade-in">
                <div class="ckan-card-icon-hjk729" style="color: ${color};">
                    <span class="dashicons ${icon}"></span>
                </div>
                <div class="ckan-card-body-hjk729">
                    <div class="ckan-card-label-hjk729">${label}</div>
                    <div class="ckan-card-value-hjk729" id="total-${id}">0</div>
                </div>
            </div>
        `;
        $('.ckan-cards-hjk729').append(cardHtml);
        
        // Animate after adding
        setTimeout(() => {
            animateValue('#total-' + id, value);
        }, 100);
    }
    
    function updateSummaryText(summary) {
        const total = Object.values(summary).reduce((a, b) => parseInt(a) + parseInt(b), 0);
        
        // Add summary info if container exists
        if ($('.ckan-summary-text').length === 0 && total > 0) {
            $('.ckan-header-hjk729').after(`
                <div class="ckan-summary-text" style="padding: 10px; background: #e3f2fd; border-radius: 4px; margin-bottom: 20px;">
                    <strong>สรุป:</strong> มีกิจกรรมทั้งหมด <span id="total-activities">${total}</span> รายการในช่วง <span id="period-text">${getPeriodText()}</span>
                </div>
            `);
        } else if (total > 0) {
            $('#total-activities').text(total);
            $('#period-text').text(getPeriodText());
        }
    }
    
    // ============================================
    // ========== CHARTS RENDERING ================
    // ============================================
    
    function renderCharts(data) {
        // Destroy existing charts to prevent memory leaks
        destroyCharts();
        
        // Render each chart
        if (data.trend) renderTrendChart(data.trend);
        if (data.actions) renderActionChart(data.actions);
        if (data.users) renderUsersChart(data.users);
    }
    
    function renderTrendChart(data) {
        const ctx = document.getElementById('trend-chart');
        if (!ctx) return;
        
        ctx.height = 250;
        
        // Filter out empty datasets
        const datasets = data.datasets.filter(dataset => 
            dataset.data && dataset.data.some(value => value > 0)
        );
        
        if (datasets.length === 0) {
            // Show no data message
            $(ctx).parent().html('<div class="no-data-message">ไม่มีข้อมูลในช่วงเวลาที่เลือก</div>');
            return;
        }
        
        state.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 10,
                            font: { 
                                size: 12,
                                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            },
                            generateLabels: function(chart) {
                                const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                                // Add total count to labels
                                labels.forEach(label => {
                                    const dataset = chart.data.datasets[label.datasetIndex];
                                    const total = dataset.data.reduce((a, b) => a + b, 0);
                                    label.text += ` (${total})`;
                                });
                                return labels;
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return 'วันที่: ' + context[0].label;
                            },
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value} กิจกรรม`;
                            },
                            footer: function(tooltipItems) {
                                let sum = 0;
                                tooltipItems.forEach(function(tooltipItem) {
                                    sum += tooltipItem.parsed.y;
                                });
                                return 'รวม: ' + sum + ' กิจกรรม';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            maxTicksLimit: 8,
                            callback: function(value) {
                                return value.toLocaleString('th-TH');
                            }
                        },
                        title: {
                            display: true,
                            text: 'จำนวนกิจกรรม'
                        }
                    },
                    x: {
                        ticks: {
                            maxTicksLimit: 12,
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                }
            }
        });
    }
    
    function renderActionChart(data) {
        const ctx = document.getElementById('action-chart');
        if (!ctx) return;
        
        ctx.height = 200;
        
        if (!data.data || data.data.length === 0) {
            $(ctx).parent().html('<div class="no-data-message">ไม่มีข้อมูล</div>');
            return;
        }
        
        state.charts.action = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: data.colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            padding: 8,
                            font: { size: 11 },
                            generateLabels: function(chart) {
                                const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                                const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                labels.forEach((label, i) => {
                                    const value = chart.data.datasets[0].data[i];
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    label.text += ` (${percentage}%)`;
                                });
                                return labels;
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    function renderUsersChart(data) {
        const ctx = document.getElementById('users-chart');
        if (!ctx) return;
        
        ctx.height = 200;
        
        if (!data.data || data.data.length === 0) {
            $(ctx).parent().html('<div class="no-data-message">ไม่มีข้อมูล</div>');
            return;
        }
        
        state.charts.users = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels.map(label => truncateText(label, 15)),
                datasets: [{
                    label: 'กิจกรรม',
                    data: data.data,
                    backgroundColor: '#2196F3',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                // Show full username in tooltip
                                return data.labels[context[0].dataIndex];
                            },
                            label: function(context) {
                                return 'กิจกรรม: ' + context.parsed.x + ' ครั้ง';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            callback: function(value) {
                                return value.toLocaleString('th-TH');
                            }
                        },
                        title: {
                            display: true,
                            text: 'จำนวนกิจกรรม'
                        }
                    },
                    y: {
                        ticks: {
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }
    
    function destroyCharts() {
        Object.keys(state.charts).forEach(key => {
            if (state.charts[key]) {
                state.charts[key].destroy();
                state.charts[key] = null;
            }
        });
    }
    
    // ============================================
    // ========== ACTIVITIES TABLE ================
    // ============================================
    
    function renderActivities(data) {
        const tbody = $('#activities-tbody');
        
        if (!data.activities || data.activities.length === 0) {
            tbody.html('<tr><td colspan="6" class="text-center">ไม่พบข้อมูลในช่วงเวลาที่เลือก</td></tr>');
            updatePagination(1, 1);
            return;
        }
        
        let html = '';
        data.activities.forEach(function(activity, index) {
            const actionInfo = allActionTypes[activity.action] || {
                label: activity.action,
                color: '#999',
                icon: 'dashicons-marker'
            };
            
            // Generate badge class dynamically
            const actionClass = activity.action.toLowerCase().replace(/_/g, '-');
            const badgeClass = `ckan-badge-${actionClass}-hjk729`;
            
            // Format details with better styling
            let formattedDetails = formatActivityDetails(activity.details);
            
            // Format user name
            let userName = formatUserName(activity.user_name);
            
            // Add row with animation delay
            html += `
                <tr class="fade-in" style="animation-delay: ${index * 0.05}s">
                    <td>
                        <span class="datetime-badge">
                            ${formatDateTime(activity.time)}
                        </span>
                    </td>
                    <td>
                        <span class="ckan-badge-hjk729 ${badgeClass}" 
                              style="background: ${actionInfo.color}20; color: ${actionInfo.color};"
                              title="${actionInfo.label}">
                            <span class="dashicons ${actionInfo.icon}"></span>
                            <span class="badge-label">${actionInfo.label}</span>
                        </span>
                    </td>
                    <td class="term-name" title="${escapeHtml(activity.term_name || '-')}">
                        ${truncateText(activity.term_name || '-', 30)}
                    </td>
                    <td class="ckan-details-hjk729">
                        ${formattedDetails}
                    </td>
                    <td class="user-name">
                        ${userName}
                    </td>
                    <td class="taxonomy-name">
                        <span class="taxonomy-badge">
                            ${activity.taxonomy || '-'}
                        </span>
                    </td>
                </tr>
            `;
        });
        
        tbody.html(html);
        
        // Update pagination
        updatePagination(data.current_page, data.total_pages);
        
        // Add hover effects
        tbody.find('tr').hover(
            function() { $(this).addClass('row-hover'); },
            function() { $(this).removeClass('row-hover'); }
        );
    }
    
    function formatActivityDetails(details) {
        if (!details || details === '-') return '-';
        
        // Format different types of details
        if (details.includes('→')) {
            // Format changes
            const parts = details.split('→');
            if (parts.length === 2) {
                return `<span class="change-detail">
                    <span class="old-value">${escapeHtml(parts[0].trim())}</span>
                    <span class="arrow">→</span>
                    <span class="new-value">${escapeHtml(parts[1].trim())}</span>
                </span>`;
            }
        } else if (details.includes(':')) {
            // Format key-value pairs
            const colonIndex = details.indexOf(':');
            const key = details.substring(0, colonIndex);
            const value = details.substring(colonIndex + 1);
            return `<strong>${escapeHtml(key)}:</strong>${escapeHtml(value)}`;
        }
        
        return escapeHtml(details);
    }
    
    function formatUserName(userName) {
        if (!userName) return '<span class="unknown-user">Unknown</span>';
        
        if (userName.includes('Guest')) {
            // Format guest user
            const match = userName.match(/Guest \(([\d.]+)\)/);
            if (match) {
                return `<span class="guest-user" title="Guest User">
                    <span class="dashicons dashicons-admin-users"></span>
                    Guest
                    <small>(${match[1]})</small>
                </span>`;
            }
        }
        
        return `<span class="registered-user">
            <span class="dashicons dashicons-admin-users"></span>
            ${escapeHtml(userName)}
        </span>`;
    }
    
    function updatePagination(currentPage, totalPages) {
        state.currentPage = currentPage;
        
        $('#current-page').text(currentPage);
        $('#total-pages').text(totalPages);
        
        $('#prev-page').prop('disabled', currentPage <= 1);
        $('#next-page').prop('disabled', currentPage >= totalPages);
        
        // Add page info
        if ($('.page-info').length === 0) {
            $('.ckan-pagination-hjk729').prepend(`
                <span class="page-info">
                    แสดงหน้า ${currentPage} จาก ${totalPages}
                </span>
            `);
        } else {
            $('.page-info').text(`แสดงหน้า ${currentPage} จาก ${totalPages}`);
        }
    }
    
    // ============================================
    // ========== FILTERS =========================
    // ============================================
    
    function initFilters() {
        // Check if filters already exist
        if ($('#ckan-filters').length > 0) return;
        
        const filterHtml = `
            <div id="ckan-filters" class="ckan-filters-xyz456">
                <div class="filter-row">
                    <div class="filter-group">
                        <label for="filter-action">การดำเนินการ:</label>
                        <select id="filter-action" class="ckan-select-hjk729">
                            <option value="all">ทั้งหมด</option>
                            ${Object.entries(allActionTypes).map(([key, val]) => 
                                `<option value="${key}">${val.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="filter-user">ผู้ใช้:</label>
                        <input type="text" 
                               id="filter-user" 
                               class="ckan-input-xyz456" 
                               placeholder="พิมพ์ชื่อผู้ใช้...">
                    </div>
                    
                    <div class="filter-buttons">
                        <button id="apply-filters" class="ckan-btn-hjk729 btn-primary">
                            <span class="dashicons dashicons-filter"></span> กรอง
                        </button>
                        <button id="reset-filters" class="ckan-btn-hjk729 btn-secondary">
                            <span class="dashicons dashicons-dismiss"></span> รีเซ็ต
                        </button>
                    </div>
                </div>
                
                <div class="active-filters" id="active-filters" style="display: none;">
                    <span class="filter-label">กำลังกรอง:</span>
                    <div class="filter-tags" id="filter-tags"></div>
                </div>
            </div>
        `;
        
        // Insert before activities table
        $('.ckan-table-section-hjk729').prepend(filterHtml);
        
        // Add CSS for filters
        addFilterStyles();
    }
    
    function addFilterStyles() {
        if ($('#ckan-filter-styles').length > 0) return;
        
        const styles = `
            <style id="ckan-filter-styles">
                .ckan-filters-xyz456 {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    border: 1px solid #dee2e6;
                }
                
                .filter-row {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                    align-items: flex-end;
                }
                
                .filter-group {
                    flex: 1;
                    min-width: 200px;
                }
                
                .filter-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                    color: #495057;
                    font-size: 13px;
                }
                
                .ckan-input-xyz456 {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    font-size: 14px;
                }
                
                .filter-buttons {
                    display: flex;
                    gap: 10px;
                }
                
                .btn-primary {
                    background: #2196F3;
                    color: white;
                }
                
                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }
                
                .active-filters {
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid #dee2e6;
                }
                
                .filter-tags {
                    display: inline-flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                
                .filter-tag {
                    background: #2196F3;
                    color: white;
                    padding: 4px 10px;
                    border-radius: 15px;
                    font-size: 12px;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }
                
                .filter-tag .remove {
                    cursor: pointer;
                    font-weight: bold;
                }
                
                .no-data-message {
                    text-align: center;
                    padding: 40px;
                    color: #6c757d;
                    font-size: 14px;
                }
                
                .datetime-badge {
                    font-size: 12px;
                    color: #495057;
                }
                
                .badge-label {
                    margin-left: 3px;
                }
                
                .taxonomy-badge {
                    background: #e9ecef;
                    padding: 2px 8px;
                    border-radius: 3px;
                    font-size: 12px;
                }
                
                .row-hover {
                    background: #f8f9fa !important;
                }
                
                .fade-in {
                    animation: fadeIn 0.3s ease-in;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .change-detail {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .old-value {
                    color: #dc3545;
                    text-decoration: line-through;
                }
                
                .arrow {
                    color: #6c757d;
                    font-weight: bold;
                }
                
                .new-value {
                    color: #28a745;
                    font-weight: 500;
                }
                
                .guest-user, .unknown-user {
                    color: #6c757d;
                    font-style: italic;
                }
                
                .guest-user small {
                    opacity: 0.7;
                }
                
                .registered-user {
                    color: #212529;
                }
                
                .spinner {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(0,0,0,.1);
                    border-radius: 50%;
                    border-top-color: #2196F3;
                    animation: spin 0.8s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;
        
        $('head').append(styles);
    }
    
    function updateActiveFilters() {
        const activeTags = [];
        
        if (state.filters.action !== 'all') {
            const actionInfo = allActionTypes[state.filters.action];
            activeTags.push({
                type: 'action',
                label: 'การดำเนินการ: ' + (actionInfo ? actionInfo.label : state.filters.action),
                value: state.filters.action
            });
        }
        
        if (state.filters.user && state.filters.user !== 'all') {
            activeTags.push({
                type: 'user',
                label: 'ผู้ใช้: ' + state.filters.user,
                value: state.filters.user
            });
        }
        
        if (activeTags.length > 0) {
            let tagsHtml = activeTags.map(tag => `
                <span class="filter-tag" data-type="${tag.type}" data-value="${tag.value}">
                    ${tag.label}
                    <span class="remove" data-type="${tag.type}">×</span>
                </span>
            `).join('');
            
            $('#filter-tags').html(tagsHtml);
            $('#active-filters').show();
            
            // Bind remove events
            $('.filter-tag .remove').on('click', function() {
                const type = $(this).data('type');
                if (type === 'action') {
                    state.filters.action = 'all';
                    $('#filter-action').val('all');
                } else if (type === 'user') {
                    state.filters.user = 'all';
                    $('#filter-user').val('');
                }
                loadActivities(1);
                updateActiveFilters();
            });
        } else {
            $('#active-filters').hide();
        }
    }
    
    // ============================================
    // ========== EVENT HANDLERS ==================
    // ============================================
    
    function bindEvents() {
        // Period selector
        $('#ckan-period').on('change', function() {
            state.period = $(this).val();
            state.currentPage = 1;
            loadData();
            showMessage('กำลังโหลดข้อมูลสำหรับ ' + getPeriodText(), 'info');
        });
        
        // Refresh button
        $('#ckan-refresh').on('click', function(e) {
            e.preventDefault();
            loadData();
            showMessage('รีเฟรชข้อมูลเรียบร้อย', 'success');
        });
        
        // Export CSV
        $('#ckan-export').on('click', function(e) {
            e.preventDefault();
            exportCSV();
        });
        
        // Pagination
        $('#prev-page').on('click', function() {
            if (state.currentPage > 1) {
                loadActivities(state.currentPage - 1);
            }
        });
        
        $('#next-page').on('click', function() {
            loadActivities(state.currentPage + 1);
        });
        
        // Filters
        $(document).on('click', '#apply-filters', function(e) {
            e.preventDefault();
            state.filters.action = $('#filter-action').val();
            state.filters.user = $('#filter-user').val().trim();
            state.currentPage = 1;
            loadActivities(1);
            updateActiveFilters();
            showMessage('กำลังกรองข้อมูล...', 'info');
        });
        
        $(document).on('click', '#reset-filters', function(e) {
            e.preventDefault();
            state.filters = { action: 'all', user: 'all', taxonomy: 'all' };
            $('#filter-action').val('all');
            $('#filter-user').val('');
            state.currentPage = 1;
            loadActivities(1);
            updateActiveFilters();
            showMessage('รีเซ็ตตัวกรองเรียบร้อย', 'success');
        });
        
        // Real-time search for user filter
        $(document).on('keyup', '#filter-user', debounce(function(e) {
            if (e.key === 'Enter') {
                $('#apply-filters').click();
            }
        }, 300));
        
        // Keyboard shortcuts
        $(document).on('keydown', function(e) {
            // Alt+R = Refresh
            if (e.altKey && e.key === 'r') {
                e.preventDefault();
                $('#ckan-refresh').click();
            }
            // Alt+E = Export
            if (e.altKey && e.key === 'e') {
                e.preventDefault();
                $('#ckan-export').click();
            }
        });
    }
    
    // ============================================
    // ========== EXPORT FUNCTIONALITY ============
    // ============================================
    
    function exportCSV() {
        showLoading();
        showMessage('กำลังเตรียมข้อมูลสำหรับส่งออก...', 'info');
        
        $.ajax({
            url: ckanReport.ajaxUrl,
            type: 'POST',
            timeout: 30000,
            data: {
                action: 'ckan_export_csv_hjk729',
                nonce: ckanReport.nonce,
                period: state.period,
                filters: state.filters
            }
        })
        .done(function(response) {
            if (response.success && response.data.csv_data) {
                downloadCSV(response.data.csv_data);
                showMessage('ส่งออกข้อมูลเรียบร้อย', 'success');
            } else {
                showError('ไม่สามารถส่งออกข้อมูลได้');
            }
        })
        .fail(function(xhr, status, error) {
            if (status === 'timeout') {
                showError('การส่งออกใช้เวลานานเกินไป กรุณาลองใหม่');
            } else {
                showError('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
            }
        })
        .always(function() {
            hideLoading();
        });
    }
    
    function downloadCSV(data) {
        // Create CSV with BOM for UTF-8
        let csv = '\uFEFF';
        
        data.forEach(function(row) {
            csv += row.map(cell => {
                const value = (cell === null || cell === undefined) ? '' : cell.toString();
                // Escape quotes and wrap in quotes
                return '"' + value.replace(/"/g, '""') + '"';
            }).join(',') + '\n';
        });
        
        // Create and download file
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const filename = 'ckan-report-' + formatDate() + '.csv';
        
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(function() {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    // ============================================
    // ========== UTILITY FUNCTIONS ===============
    // ============================================
    
    function animateValue(selector, end) {
        const $el = $(selector);
        if ($el.length === 0) return;
        
        const start = parseInt($el.text().replace(/,/g, '')) || 0;
        const duration = 600;
        const startTime = Date.now();
        
        function update() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const value = Math.floor(start + (end - start) * easeOutQuart);
            
            $el.text(value.toLocaleString('th-TH'));
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }
    
    function formatDateTime(dateStr) {
        if (!dateStr) return '-';
        
        // Already formatted
        if (dateStr.includes('/')) return dateStr;
        
        try {
            const date = new Date(dateStr);
            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            };
            
            return date.toLocaleString('th-TH', options);
        } catch (e) {
            return dateStr;
        }
    }
    
    function formatDate() {
        const now = new Date();
        return now.getFullYear() +
               ('0' + (now.getMonth() + 1)).slice(-2) +
               ('0' + now.getDate()).slice(-2) + '-' +
               ('0' + now.getHours()).slice(-2) +
               ('0' + now.getMinutes()).slice(-2);
    }
    
    function truncateText(text, maxLength) {
        if (!text) return '-';
        text = text.toString();
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.toString().replace(/[&<>"']/g, m => map[m]);
    }
    
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
    
    function getPeriodText() {
        const periods = {
            'today': 'วันนี้',
            'week': '7 วันที่ผ่านมา',
            'month': '30 วันที่ผ่านมา',
            'year': '1 ปีที่ผ่านมา'
        };
        return periods[state.period] || state.period;
    }
    
    // ============================================
    // ========== UI FEEDBACK =====================
    // ============================================
    
    function showMessage(message, type = 'info') {
        // Remove existing messages
        $('.ckan-message').remove();
        
        const types = {
            'success': { bg: '#d4edda', color: '#155724', icon: 'dashicons-yes-alt' },
            'error': { bg: '#f8d7da', color: '#721c24', icon: 'dashicons-warning' },
            'info': { bg: '#d1ecf1', color: '#0c5460', icon: 'dashicons-info' },
            'warning': { bg: '#fff3cd', color: '#856404', icon: 'dashicons-warning' }
        };
        
        const config = types[type] || types.info;
        
        const $message = $(`
            <div class="ckan-message fade-in" style="
                background: ${config.bg};
                color: ${config.color};
                padding: 12px 16px;
                border-radius: 4px;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
                border-left: 4px solid ${config.color};
            ">
                <span class="dashicons ${config.icon}"></span>
                <span>${message}</span>
            </div>
        `);
        
        $('.ckan-container-hjk729').prepend($message);
        
        // Auto remove after 5 seconds
        setTimeout(function() {
            $message.fadeOut(function() {
                $(this).remove();
            });
        }, 5000);
    }
    
    function showError(message) {
        showMessage(message, 'error');
        console.error('CKAN Error:', message);
    }
    
    function showLoading() {
        // Add loading overlay
        if ($('.ckan-loading-overlay').length === 0) {
            $('body').append(`
                <div class="ckan-loading-overlay" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                ">
                    <div style="
                        background: white;
                        padding: 20px 30px;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    ">
                        <span class="spinner"></span>
                        <span style="margin-left: 10px;">กำลังโหลด...</span>
                    </div>
                </div>
            `);
        }
        
        $('.ckan-container-hjk729').addClass('is-loading');
    }
    
    function hideLoading() {
        $('.ckan-loading-overlay').fadeOut(function() {
            $(this).remove();
        });
        $('.ckan-container-hjk729').removeClass('is-loading');
    }
    
    function handleAjaxError(xhr, status, error) {
        console.error('AJAX Error:', status, error);
        
        if (status === 'timeout') {
            showError('การเชื่อมต่อหมดเวลา กรุณาลองใหม่');
        } else if (xhr.status === 403) {
            showError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้');
        } else if (xhr.status === 404) {
            showError('ไม่พบ endpoint ที่ร้องขอ');
        } else if (xhr.status === 500) {
            showError('เกิดข้อผิดพลาดที่เซิร์ฟเวอร์');
        } else {
            showError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + (error || 'Unknown error'));
        }
    }
    
    // ============================================
    // ========== AUTO REFRESH ====================
    // ============================================
    
    function setupAutoRefresh() {
        // Clear existing interval
        if (state.autoRefreshInterval) {
            clearInterval(state.autoRefreshInterval);
        }
        
        // Set auto refresh every 5 minutes
        state.autoRefreshInterval = setInterval(function() {
            if (document.visibilityState === 'visible' && !state.isLoading) {
                console.log('Auto refreshing data...');
                loadData();
            }
        }, 300000); // 5 minutes
        
        // Stop auto refresh when page is hidden
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                console.log('Page hidden, pausing auto refresh');
            } else {
                console.log('Page visible, resuming auto refresh');
                updateLastUpdateTime();
            }
        });
    }
    
    function updateLastUpdateTime() {
        if ($('.last-update').length === 0) {
            $('.ckan-controls-hjk729').append(`
                <span class="last-update" style="
                    font-size: 12px;
                    color: #6c757d;
                    margin-left: 10px;
                "></span>
            `);
        }
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        $('.last-update').text('อัพเดตล่าสุด: ' + timeStr);
    }
    
    // ============================================
    // ========== TOOLTIPS ========================
    // ============================================
    
    function initTooltips() {
        // Add tooltips to buttons
        $('#ckan-refresh').attr('title', 'รีเฟรชข้อมูล (Alt+R)');
        $('#ckan-export').attr('title', 'ส่งออก CSV (Alt+E)');
        
        // Initialize tooltips if library available
        if (typeof $.fn.tooltip === 'function') {
            $('[title]').tooltip({
                container: 'body',
                placement: 'top',
                trigger: 'hover'
            });
        }
    }
    
    // ============================================
    // ========== INITIALIZATION ==================
    // ============================================
    
    // Start the application
    init();
    
    // Log version
    console.log('CKAN History Report v5.0 loaded successfully');
    
}); // End jQuery ready