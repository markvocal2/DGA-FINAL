/**
 * Complaint Statistics System - DEBUG VERSION
 * Version: 1.0.1
 */

jQuery(document).ready(function($) {
    'use strict';

    // Debug mode
    const DEBUG = true;
    
    function debugLog(message, data = null) {
        if (DEBUG) {
            console.log('[Complaint Stats]', message, data || '');
        }
    }

    /**
     * Configuration
     */
    const CONFIG = {
        dateFormat: complaintStatsData?.date_format || 'DD/MM/YYYY',
        defaultAnimationDuration: 300,
        chartColors: [
            '#0d6efd', '#fd7e14', '#198754', '#dc3545', 
            '#6c757d', '#6610f2', '#0dcaf0', '#ffc107'
        ],
        statusColors: {
            'complaint_pending': '#ffc107',
            'complaint_in_progress': '#0dcaf0',
            'complaint_completed': '#198754',
            'complaint_rejected': '#dc3545',
            'complaint_closed': '#6c757d'
        },
        statusLabels: complaintStatsData?.status_labels || {
            'complaint_pending': 'รอดำเนินการ',
            'complaint_in_progress': 'กำลังดำเนินการ',
            'complaint_completed': 'เสร็จสิ้น',
            'complaint_rejected': 'ไม่รับพิจารณา',
            'complaint_closed': 'ปิดเรื่อง'
        }
    };

    // ตรวจสอบการโหลด dependencies
    debugLog('Checking dependencies...');
    debugLog('jQuery loaded:', typeof jQuery !== 'undefined');
    debugLog('Highcharts loaded:', typeof Highcharts !== 'undefined');
    debugLog('complaintStatsData loaded:', typeof complaintStatsData !== 'undefined');
    
    if (typeof complaintStatsData !== 'undefined') {
        debugLog('complaintStatsData content:', complaintStatsData);
    }

    /**
     * State Management
     */
    const state = {
        statistics: null,
        isLoading: false,
        filters: {
            period: 'monthly',
            startDate: '',
            endDate: ''
        }
    };

    /**
     * DOM Elements
     */
    const elements = {
        container: $('.complaint-stats-container'),
        periodFilter: $('#period-filter'),
        startDateInput: $('#date-start'),
        endDateInput: $('#date-end'),
        applyFiltersBtn: $('#apply-stats-filters'),
        exportExcelBtn: $('#export-excel-btn'),
        trendStatusFilter: $('#trend-status-filter'),
        alert: $('#stats-alert'),
        totalComplaints: $('#total-complaints'),
        dailyAverage: $('#daily-average'),
        activeComplaints: $('#active-complaints'),
        statusStats: $('#status-stats'),
        complaintsByStatus: $('#complaints-by-status'),
        complaintsByType: $('#complaints-by-type'),
        complaintsByDepartment: $('#complaints-by-department'),
        complaintsTrend: $('#complaints-trend')
    };

    debugLog('DOM Elements found:', {
        container: elements.container.length,
        periodFilter: elements.periodFilter.length,
        startDateInput: elements.startDateInput.length,
        endDateInput: elements.endDateInput.length,
        applyFiltersBtn: elements.applyFiltersBtn.length
    });

    /**
     * Initialize the application
     */
    function init() {
        debugLog('Initializing complaint statistics...');
        
        // ตรวจสอบว่ามีการตั้งค่า AJAX หรือไม่
        if (!complaintStatsData || !complaintStatsData.ajaxurl) {
            showAlert('ไม่พบการตั้งค่า AJAX ที่จำเป็น โปรดรีเฟรชหน้าเว็บ', 'danger');
            debugLog('ERROR: AJAX settings not found!');
            return;
        }

        // กำหนดค่าเริ่มต้นสำหรับตัวกรอง
        setDefaultDates();

        // ติดตั้งตัวจัดการเหตุการณ์
        setupEventListeners();

        // โหลดข้อมูลเริ่มต้น
        loadStatistics();
    }

    /**
     * Set default dates for filter
     */
    function setDefaultDates() {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        if (!elements.startDateInput.val()) {
            elements.startDateInput.val(formatDateForInput(thirtyDaysAgo));
            state.filters.startDate = formatDateForInput(thirtyDaysAgo);
        } else {
            state.filters.startDate = elements.startDateInput.val();
        }
        
        if (!elements.endDateInput.val()) {
            elements.endDateInput.val(formatDateForInput(today));
            state.filters.endDate = formatDateForInput(today);
        } else {
            state.filters.endDate = elements.endDateInput.val();
        }
        
        debugLog('Default dates set:', state.filters);
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        debugLog('Setting up event listeners...');
        
        // ปุ่มใช้ตัวกรอง
        elements.applyFiltersBtn.on('click', function() {
            debugLog('Apply filters clicked');
            applyFilters();
            loadStatistics();
        });

        // ตัวกรอง period
        elements.periodFilter.on('change', function() {
            state.filters.period = $(this).val();
            debugLog('Period changed:', state.filters.period);
        });

        // ตัวกรอง date
        elements.startDateInput.on('change', function() {
            state.filters.startDate = $(this).val();
            debugLog('Start date changed:', state.filters.startDate);
        });

        elements.endDateInput.on('change', function() {
            state.filters.endDate = $(this).val();
            debugLog('End date changed:', state.filters.endDate);
        });

        // ตัวกรอง trend status
        elements.trendStatusFilter.on('change', function() {
            debugLog('Trend status filter changed:', $(this).val());
            if (state.statistics && state.statistics.trend) {
                createTrendChart(state.statistics.trend);
            }
        });

        // ปุ่มส่งออก Excel
        elements.exportExcelBtn.on('click', function() {
            debugLog('Export Excel clicked');
            exportToExcel();
        });
    }

    /**
     * Apply filters
     */
    function applyFilters() {
        state.filters.period = elements.periodFilter.val();
        state.filters.startDate = elements.startDateInput.val();
        state.filters.endDate = elements.endDateInput.val();
        debugLog('Filters applied:', state.filters);
    }

    /**
     * Load statistics from the server
     */
    function loadStatistics() {
        state.isLoading = true;
        showLoading();
        
        const requestData = {
            action: 'get_complaint_statistics',
            nonce: complaintStatsData.nonce,
            period: state.filters.period,
            start_date: state.filters.startDate,
            end_date: state.filters.endDate
        };
        
        debugLog('Sending AJAX request:', requestData);

        $.ajax({
            url: complaintStatsData.ajaxurl,
            type: 'POST',
            data: requestData,
            success: function(response) {
                debugLog('AJAX response received:', response);
                
                if (response.success) {
                    state.statistics = response.data;
                    
                    // แสดง debug info ถ้ามี
                    if (response.data.debug) {
                        debugLog('Debug info from server:', response.data.debug);
                    }
                    
                    updateStatisticsUI();
                } else {
                    const errorMsg = response.data?.message || complaintStatsData.messages.error;
                    showAlert(errorMsg, 'danger');
                    debugLog('ERROR:', errorMsg);
                }
            },
            error: function(xhr, status, error) {
                debugLog('AJAX error:', {
                    status: status,
                    error: error,
                    responseText: xhr.responseText
                });
                showAlert(complaintStatsData.messages.error, 'danger');
            },
            complete: function() {
                state.isLoading = false;
                hideLoading();
            }
        });
    }

    /**
     * Update statistics UI
     */
    function updateStatisticsUI() {
        const stats = state.statistics;
        
        debugLog('Updating UI with statistics:', stats);
        
        if (!stats) {
            showAlert(complaintStatsData.messages.no_data, 'warning');
            return;
        }

        // อัพเดตค่าสรุป
        elements.totalComplaints.text(stats.total);
        elements.dailyAverage.text(stats.daily_average.toFixed(2));
        elements.activeComplaints.text(stats.active_complaints);
        
        debugLog('Summary updated:', {
            total: stats.total,
            dailyAverage: stats.daily_average,
            activeComplaints: stats.active_complaints
        });
        
        // อัพเดตสถิติสถานะ
        updateStatusStats(stats.by_status);
        
        // สร้างกราฟ
        if (typeof Highcharts !== 'undefined') {
            createStatusChart(stats.by_status);
            createTypeChart(stats.by_type);
            createDepartmentChart(stats.by_department);
            createTrendChart(stats.trend);
        } else {
            debugLog('ERROR: Highcharts not loaded!');
            showAlert('ไม่สามารถแสดงกราฟได้ เนื่องจาก Highcharts ไม่ได้ถูกโหลด', 'warning');
        }
    }

    /**
     * Update status statistics
     */
    function updateStatusStats(statusData) {
        debugLog('Updating status stats:', statusData);
        
        let html = '<div class="status-grid">';
        
        Object.entries(statusData).forEach(([status, count]) => {
            const statusLabel = CONFIG.statusLabels[status] || status;
            const statusClass = status.replace('complaint_', '');
            const percentage = state.statistics.total > 0 
                ? ((count / state.statistics.total) * 100).toFixed(1) 
                : '0.0';
            
            html += `
                <div class="status-item">
                    <div class="status-color status-${statusClass}"></div>
                    <div class="status-info">
                        <div class="status-label">${statusLabel}</div>
                        <div class="status-count">${count} <span class="text-secondary">(${percentage}%)</span></div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        elements.statusStats.html(html);
    }

    /**
     * Create status chart
     */
    function createStatusChart(statusData) {
        debugLog('Creating status chart:', statusData);
        
        if (!Highcharts) {
            console.error('Highcharts is not loaded');
            return;
        }

        const chartData = [];
        
        Object.entries(statusData).forEach(([status, count]) => {
            if (count > 0) {
                chartData.push({
                    name: CONFIG.statusLabels[status] || status,
                    y: count,
                    color: CONFIG.statusColors[status]
                });
            }
        });

        debugLog('Status chart data prepared:', chartData);

        try {
            Highcharts.chart('complaints-by-status', {
                chart: {
                    type: 'pie',
                    height: 260
                },
                title: {
                    text: ''
                },
                tooltip: {
                    pointFormat: '{series.name}: <b>{point.y}</b> ({point.percentage:.1f}%)'
                },
                accessibility: {
                    point: {
                        valueSuffix: '%'
                    }
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                            distance: -30,
                            style: {
                                fontWeight: 'normal',
                                color: 'white',
                                textOutline: 'none'
                            }
                        },
                        showInLegend: false,
                        size: '100%'
                    }
                },
                credits: {
                    enabled: false
                },
                series: [{
                    name: 'จำนวน',
                    colorByPoint: true,
                    innerSize: '60%',
                    data: chartData
                }]
            });
            debugLog('Status chart created successfully');
        } catch (error) {
            debugLog('ERROR creating status chart:', error);
        }
    }

    /**
     * Create type chart
     */
    function createTypeChart(typeData) {
        debugLog('Creating type chart:', typeData);
        
        if (!Highcharts) {
            console.error('Highcharts is not loaded');
            return;
        }

        const chartData = [];
        
        Object.entries(typeData).forEach(([type, count]) => {
            if (count > 0) {
                chartData.push({
                    name: type,
                    y: count
                });
            }
        });

        // เรียงลำดับข้อมูลจากมากไปน้อย
        chartData.sort((a, b) => b.y - a.y);

        try {
            Highcharts.chart('complaints-by-type', {
                chart: {
                    type: 'pie'
                },
                title: {
                    text: ''
                },
                tooltip: {
                    pointFormat: '{series.name}: <b>{point.y}</b> ({point.percentage:.1f}%)'
                },
                accessibility: {
                    point: {
                        valueSuffix: '%'
                    }
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        colors: CONFIG.chartColors,
                        dataLabels: {
                            enabled: true,
                            format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                        }
                    }
                },
                credits: {
                    enabled: false
                },
                series: [{
                    name: 'จำนวน',
                    colorByPoint: true,
                    data: chartData
                }]
            });
            debugLog('Type chart created successfully');
        } catch (error) {
            debugLog('ERROR creating type chart:', error);
        }
    }

    /**
     * Create department chart
     */
    function createDepartmentChart(departmentData) {
        debugLog('Creating department chart:', departmentData);
        
        if (!Highcharts) {
            console.error('Highcharts is not loaded');
            return;
        }

        const sortedData = Object.entries(departmentData)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        const categories = sortedData.map(item => item[0]);
        const data = sortedData.map(item => item[1]);

        try {
            Highcharts.chart('complaints-by-department', {
                chart: {
                    type: 'bar'
                },
                title: {
                    text: ''
                },
                xAxis: {
                    categories: categories,
                    title: {
                        text: null
                    }
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'จำนวนเรื่องร้องเรียน',
                        align: 'high'
                    },
                    labels: {
                        overflow: 'justify'
                    }
                },
                tooltip: {
                    valueSuffix: ' เรื่อง'
                },
                plotOptions: {
                    bar: {
                        dataLabels: {
                            enabled: true
                        },
                        colorByPoint: true,
                        colors: CONFIG.chartColors
                    }
                },
                legend: {
                    enabled: false
                },
                credits: {
                    enabled: false
                },
                series: [{
                    name: 'จำนวน',
                    data: data
                }]
            });
            debugLog('Department chart created successfully');
        } catch (error) {
            debugLog('ERROR creating department chart:', error);
        }
    }

    /**
     * Create trend chart
     */
    function createTrendChart(trendData) {
        debugLog('Creating trend chart:', trendData);
        
        if (!Highcharts) {
            console.error('Highcharts is not loaded');
            return;
        }

        const selectedStatus = elements.trendStatusFilter.val();
        let series = [];
        
        if (selectedStatus === 'all') {
            Object.entries(trendData).forEach(([status, data]) => {
                if (data.length > 0) {
                    series.push({
                        name: CONFIG.statusLabels[status] || status,
                        data: data.map(item => item.count),
                        color: CONFIG.statusColors[status]
                    });
                }
            });
        } else {
            if (trendData[selectedStatus] && trendData[selectedStatus].length > 0) {
                series = [{
                    name: CONFIG.statusLabels[selectedStatus] || selectedStatus,
                    data: trendData[selectedStatus].map(item => item.count),
                    color: CONFIG.statusColors[selectedStatus]
                }];
            }
        }

        let categories = [];
        for (const status in trendData) {
            if (trendData[status] && trendData[status].length > 0) {
                categories = trendData[status].map(item => item.period);
                break;
            }
        }

        debugLog('Trend chart series:', series);
        debugLog('Trend chart categories:', categories);

        if (series.length === 0) {
            Highcharts.chart('complaints-trend', {
                title: {
                    text: 'ไม่มีข้อมูลในช่วงเวลาที่เลือก',
                    style: {
                        color: '#999',
                        fontSize: '14px'
                    }
                },
                credits: {
                    enabled: false
                }
            });
            return;
        }

        try {
            Highcharts.chart('complaints-trend', {
                chart: {
                    type: 'line'
                },
                title: {
                    text: ''
                },
                xAxis: {
                    categories: categories,
                    title: {
                        text: 'ช่วงเวลา'
                    }
                },
                yAxis: {
                    title: {
                        text: 'จำนวนเรื่องร้องเรียน'
                    },
                    min: 0
                },
                tooltip: {
                    shared: true,
                    crosshairs: true,
                    valueSuffix: ' เรื่อง'
                },
                plotOptions: {
                    line: {
                        dataLabels: {
                            enabled: true
                        },
                        enableMouseTracking: true
                    }
                },
                legend: {
                    layout: 'horizontal',
                    align: 'center',
                    verticalAlign: 'bottom',
                    borderWidth: 0
                },
                credits: {
                    enabled: false
                },
                series: series
            });
            debugLog('Trend chart created successfully');
        } catch (error) {
            debugLog('ERROR creating trend chart:', error);
        }
    }

    /**
     * Export data to Excel
     */
    function exportToExcel() {
        showLoading();
        elements.exportExcelBtn.prop('disabled', true);
        elements.exportExcelBtn.html('<i class="fas fa-spinner fa-spin me-1"></i> กำลังส่งออก...');

        const requestData = {
            action: 'export_complaint_data',
            nonce: complaintStatsData.nonce,
            start_date: state.filters.startDate,
            end_date: state.filters.endDate
        };
        
        debugLog('Export request:', requestData);

        $.ajax({
            url: complaintStatsData.ajaxurl,
            type: 'POST',
            data: requestData,
            success: function(response) {
                debugLog('Export response:', response);
                
                if (response.success) {
                    generateExcelFile(response.data);
                    showAlert(`ส่งออกข้อมูลเรียบร้อยแล้ว (${response.data.count} รายการ)`, 'success');
                } else {
                    showAlert(response.data?.message || complaintStatsData.messages.error, 'danger');
                }
            },
            error: function(xhr, status, error) {
                debugLog('Export error:', {
                    status: status,
                    error: error,
                    responseText: xhr.responseText
                });
                showAlert(complaintStatsData.messages.error, 'danger');
            },
            complete: function() {
                hideLoading();
                elements.exportExcelBtn.prop('disabled', false);
                elements.exportExcelBtn.html('<i class="fas fa-file-excel me-1"></i> ส่งออกข้อมูล Excel');
            }
        });
    }

    /**
     * Generate Excel file from data
     */
    function generateExcelFile(data) {
        if (typeof XLSX === 'undefined') {
            console.error('XLSX library is not loaded');
            showAlert('ไม่สามารถสร้างไฟล์ Excel ได้ เนื่องจากไม่พบ library ที่จำเป็น', 'danger');
            return;
        }

        try {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(data.data);
            
            const wsCols = [
                {wch: 15}, {wch: 20}, {wch: 25}, {wch: 20}, 
                {wch: 50}, {wch: 20}, {wch: 15}, {wch: 15}, 
                {wch: 20}, {wch: 20}
            ];
            ws['!cols'] = wsCols;
            
            XLSX.utils.book_append_sheet(wb, ws, 'เรื่องร้องเรียน');
            XLSX.writeFile(wb, data.filename);
            
            debugLog('Excel file generated successfully');
        } catch (error) {
            console.error('Error generating Excel file:', error);
            showAlert('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel', 'danger');
        }
    }

    /**
     * Show alert message
     */
    function showAlert(message, type = 'info') {
        debugLog('Alert:', { message, type });
        
        elements.alert.removeClass('d-none alert-info alert-success alert-warning alert-danger');
        elements.alert.addClass(`alert-${type}`);
        elements.alert.html(message);
        elements.alert.slideDown(CONFIG.defaultAnimationDuration);
        
        if (type !== 'danger') {
            setTimeout(function() {
                elements.alert.slideUp(CONFIG.defaultAnimationDuration, function() {
                    elements.alert.addClass('d-none');
                });
            }, 5000);
        }
    }

    /**
     * Show loading state
     */
    function showLoading() {
        elements.container.addClass('stats-loading');
        elements.applyFiltersBtn.prop('disabled', true);
    }

    /**
     * Hide loading state
     */
    function hideLoading() {
        elements.container.removeClass('stats-loading');
        elements.applyFiltersBtn.prop('disabled', false);
    }

    /**
     * Format date for input field (YYYY-MM-DD)
     */
    function formatDateForInput(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // เริ่มต้นแอปพลิเคชัน
    init();
});