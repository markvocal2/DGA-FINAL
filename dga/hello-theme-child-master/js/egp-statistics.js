/**
 * EGP Statistics JavaScript
 */
(function($) {
    'use strict';

    // ตัวแปรกลาง
    var egpStatistics = {
        chart: null,
        data: null,
        
        // สีสำหรับกราฟ
        chartColors: [
            '#1e3a8a', // สีน้ำเงินเข้ม
            '#2563eb', // สีน้ำเงิน
            '#3b82f6', // สีน้ำเงินอ่อน
            '#60a5fa', // สีฟ้า
            '#93c5fd', // สีฟ้าอ่อน
            '#f97316', // สีส้ม
            '#fb923c', // สีส้มอ่อน
            '#fdba74', // สีส้มซีด
            '#38bdf8', // สีฟ้าสว่าง
            '#0ea5e9', // สีฟ้าเข้ม
            '#0284c7', // สีฟ้าน้ำเงิน
            '#0369a1'  // สีน้ำเงินเข้ม
        ],
        
        init: function() {
            // ตรวจสอบว่า element กราฟมีอยู่ในหน้าเว็บหรือไม่
            if (!document.getElementById('egp-chart')) {
                return;
            }
            
            // Debug: แสดงข้อมูล localized script
            if (egp_ajax_vars && egp_ajax_vars.debug) {
                console.log('EGP Statistics initialized');
                console.log('AJAX URL:', egp_ajax_vars.ajax_url);
                console.log('Nonce:', egp_ajax_vars.nonce);
                console.log('User logged in:', egp_ajax_vars.is_user_logged_in);
            }
            
            // กำหนดเหตุการณ์ (event) ต่างๆ
            this.setupEventListeners();
            
            // จัดการการแสดง/ซ่อนฟิลเตอร์เดือน
            this.toggleMonthFilter();
            
            // โหลดข้อมูลเริ่มต้น
            this.loadData();
        },
        
        setupEventListeners: function() {
            // เมื่อคลิกปุ่มแสดงข้อมูล
            $('#egp-filter-submit').on('click', function(e) {
                e.preventDefault();
                egpStatistics.loadData();
            });
            
            // เมื่อเปลี่ยนประเภทการดูข้อมูล
            $('#egp-view-type').on('change', function() {
                egpStatistics.toggleMonthFilter();
            });
            
            // เมื่อเปลี่ยนประเภทกราฟ
            $('#egp-chart-type').on('change', function() {
                if (egpStatistics.data) {
                    egpStatistics.updateChart(egpStatistics.data);
                }
            });
        },
        
        toggleMonthFilter: function() {
            var viewType = $('#egp-view-type').val();
            
            if (viewType === 'yearly') {
                $('.month-filter').hide();
            } else {
                $('.month-filter').show();
            }
        },
        
        loadData: function() {
            // ตรวจสอบว่า element กราฟมีอยู่ในหน้าเว็บหรือไม่
            if (!document.getElementById('egp-chart')) {
                return;
            }
            
            // แสดง loading
            $('#egp-loading').show();
            
            // ตรวจสอบว่ามี egp_ajax_vars object หรือไม่
            if (typeof egp_ajax_vars === 'undefined') {
                $('#egp-loading').hide();
                alert('ไม่พบข้อมูล AJAX configuration กรุณารีเฟรชหน้าใหม่');
                return;
            }
            
            // ดึงค่าจากฟิลเตอร์
            var filters = {
                view_type: $('#egp-view-type').val(),
                year: $('#egp-year').val(),
                month: $('#egp-month').val(),
                announcement_type: $('#egp-announcement-type').val(),
                procurement_method: $('#egp-procurement-method').val(),
                department: $('#egp-department').val(),
                action: 'egp_statistics',
                _ajax_nonce: egp_ajax_vars.nonce
            };
            
            // Debug: แสดงข้อมูลที่จะส่ง
            if (egp_ajax_vars.debug) {
                console.log('Sending AJAX request with filters:', filters);
            }
            
            // ส่ง AJAX request
            $.ajax({
                url: egp_ajax_vars.ajax_url,
                type: 'POST',
                dataType: 'json',
                data: filters,
                success: function(response) {
                    // ซ่อน loading
                    $('#egp-loading').hide();
                    
                    // Debug
                    if (egp_ajax_vars.debug) {
                        console.log('AJAX Response:', response);
                    }
                    
                    if (response.success) {
                        egpStatistics.data = response.data;
                        egpStatistics.updateChart(response.data);
                        egpStatistics.updateSummary(response.data);
                        egpStatistics.updateTable(response.data);
                    } else {
                        var errorMessage = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
                        
                        if (response.data && response.data.message) {
                            errorMessage += ': ' + response.data.message;
                        }
                        
                        // แสดง debug info ถ้ามี
                        if (response.data && response.data.debug) {
                            console.error('Debug info:', response.data.debug);
                        }
                        
                        alert(errorMessage);
                    }
                },
                error: function(xhr, status, error) {
                    // ซ่อน loading
                    $('#egp-loading').hide();
                    
                    // Debug
                    if (egp_ajax_vars.debug) {
                        console.error('AJAX Error:', {
                            status: status,
                            error: error,
                            responseText: xhr.responseText,
                            statusCode: xhr.status
                        });
                    }
                    
                    var errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + error;
                    
                    if (xhr.status === 403) {
                        errorMessage = 'ไม่มีสิทธิ์เข้าถึงข้อมูล';
                    } else if (xhr.status === 500) {
                        errorMessage = 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์';
                    } else if (xhr.status === 0) {
                        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
                    }
                    
                    alert(errorMessage);
                }
            });
        },
        
        updateChart: function(data) {
            // ตรวจสอบว่า element กราฟมีอยู่ในหน้าเว็บหรือไม่
            var chartElement = document.getElementById('egp-chart');
            if (!chartElement) {
                return;
            }
            
            var chartType = $('#egp-chart-type').val();
            var chartData = {};
            var chartOptions = {};
            var chartContext = chartElement.getContext('2d');
            
            // ทำลายกราฟเดิม (ถ้ามี)
            if (this.chart) {
                this.chart.destroy();
            }
            
            // สร้างข้อมูลตามประเภทกราฟที่เลือก
            if (chartType === 'pie') {
                // สำหรับกราฟวงกลม ใช้ข้อมูลตามประเภทประกาศ
                chartData = {
                    labels: Object.keys(data.by_type),
                    datasets: [{
                        data: Object.values(data.by_type),
                        backgroundColor: this.chartColors.slice(0, Object.keys(data.by_type).length),
                        borderWidth: 1
                    }]
                };
                
                chartOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                font: {
                                    family: 'Sarabun, sans-serif',
                                    size: 14
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: 'สัดส่วนตามประเภทประกาศ',
                            font: {
                                family: 'Sarabun, sans-serif',
                                size: 18,
                                weight: 'bold'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var label = context.label || '';
                                    var value = context.raw || 0;
                                    var total = context.dataset.data.reduce(function(acc, val) { return acc + val; }, 0);
                                    var percentage = Math.round((value / total) * 100);
                                    
                                    return label + ': ' + value + ' รายการ (' + percentage + '%)';
                                }
                            }
                        }
                    }
                };
            } else {
                // สำหรับกราฟแท่งและกราฟเส้น ใช้ข้อมูลตามวันที่
                chartData = {
                    labels: Object.keys(data.by_date),
                    datasets: [{
                        label: 'จำนวนประกาศ',
                        data: Object.values(data.by_date),
                        backgroundColor: this.chartColors[0],
                        borderColor: this.chartColors[0],
                        borderWidth: 1,
                        fill: chartType === 'line' ? false : true
                    }]
                };
                
                chartOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'จำนวนประกาศตามช่วงเวลา',
                            font: {
                                family: 'Sarabun, sans-serif',
                                size: 18,
                                weight: 'bold'
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
                };
            }
            
            // สร้างกราฟใหม่
            this.chart = new Chart(chartContext, {
                type: chartType,
                data: chartData,
                options: chartOptions
            });
        },
        
        updateSummary: function(data) {
            var viewType = $('#egp-view-type').val();
            var year = $('#egp-year').val();
            var yearThai = parseInt(year) + 543;
            var month = $('#egp-month').val();
            var monthName = '';
            
            if (month !== 'all') {
                var thaiMonths = [
                    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
                    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
                    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
                ];
                monthName = thaiMonths[parseInt(month) - 1];
            }
            
            var timeframe = viewType === 'yearly' ? 
                'ปี พ.ศ. ' + yearThai : 
                (month === 'all' ? 'ปี พ.ศ. ' + yearThai : 'เดือน' + monthName + ' พ.ศ. ' + yearThai);
            
            // สร้าง HTML สำหรับสรุปข้อมูล
            var summaryHtml = '<div class="egp-summary">';
            
            // จำนวนทั้งหมด
            summaryHtml += '<div class="egp-summary-item egp-total">';
            summaryHtml += '<h4>จำนวนประกาศทั้งหมด</h4>';
            summaryHtml += '<p class="egp-number">' + data.total + '</p>';
            summaryHtml += '<p>รายการ (' + timeframe + ')</p>';
            summaryHtml += '</div>';
            
            // สรุปตามวิธีจัดหา
            summaryHtml += '<div class="egp-summary-item">';
            summaryHtml += '<h4>แยกตามวิธีจัดหา</h4>';
            
            $.each(data.by_method, function(method, count) {
                var percentage = data.total > 0 ? Math.round((count / data.total) * 100) : 0;
                summaryHtml += '<div class="egp-method-item">';
                summaryHtml += '<span class="egp-method-name">' + method + ':</span>';
                summaryHtml += '<span class="egp-method-count">' + count + ' รายการ (' + percentage + '%)</span>';
                summaryHtml += '</div>';
            });
            
            summaryHtml += '</div>';
            
            // สรุปหน่วยงานที่มีประกาศมากที่สุด
            if (Object.keys(data.by_department).length > 0) {
                var maxDept = '';
                var maxCount = 0;
                
                $.each(data.by_department, function(dept, count) {
                    if (count > maxCount) {
                        maxCount = count;
                        maxDept = dept;
                    }
                });
                
                var percentage = data.total > 0 ? Math.round((maxCount / data.total) * 100) : 0;
                
                summaryHtml += '<div class="egp-summary-item">';
                summaryHtml += '<h4>หน่วยงานที่มีประกาศมากที่สุด</h4>';
                summaryHtml += '<p>' + maxDept + '</p>';
                summaryHtml += '<p>' + maxCount + ' รายการ (' + percentage + '%)</p>';
                summaryHtml += '</div>';
            }
            
            summaryHtml += '</div>';
            
            // แสดงผล
            $('#egp-summary-data').html(summaryHtml);
        },
        
        updateTable: function(data) {
            // สร้างตารางข้อมูล
            var tableHtml = '<div class="egp-table-wrapper">';
            tableHtml += '<table class="egp-table">';
            tableHtml += '<thead>';
            tableHtml += '<tr>';
            tableHtml += '<th>เรื่อง</th>';
            tableHtml += '<th>ประเภทประกาศ</th>';
            tableHtml += '<th>วิธีจัดหา</th>';
            tableHtml += '<th>สำนัก/กอง</th>';
            tableHtml += '<th>วันที่ประกาศ</th>';
            tableHtml += '</tr>';
            tableHtml += '</thead>';
            tableHtml += '<tbody>';
            
            // เรียงข้อมูลตามวันที่ (ล่าสุดก่อน)
            data.table_data.sort(function(a, b) {
                var dateA = a.date ? new Date(a.date) : new Date(0);
                var dateB = b.date ? new Date(b.date) : new Date(0);
                return dateB - dateA;
            });
            
            // จำกัดจำนวนรายการที่แสดง (แสดง 20 รายการล่าสุด)
            var limitedData = data.table_data.slice(0, 20);
            
            // ฟังก์ชันสำหรับแปลงวันที่เป็นรูปแบบไทย
            function formatThaiDate(dateStr) {
                if (!dateStr) return "-";
                
                var date = new Date(dateStr);
                
                // ตรวจสอบว่าวันที่ถูกต้องหรือไม่
                if (isNaN(date.getTime())) {
                    // ลองแปลงรูปแบบวันที่ไทย
                    var parts = dateStr.split('/');
                    if (parts.length === 3) {
                        var day = parseInt(parts[0], 10);
                        var month = parseInt(parts[1], 10) - 1;
                        var year = parseInt(parts[2], 10) - 543;
                        
                        date = new Date(year, month, day);
                        
                        if (isNaN(date.getTime())) {
                            return dateStr;
                        }
                    } else {
                        return dateStr;
                    }
                }
                
                var day = date.getDate();
                var month = date.getMonth() + 1;
                var year = date.getFullYear() + 543;
                
                return (day < 10 ? '0' + day : day) + '/' + 
                       (month < 10 ? '0' + month : month) + '/' + 
                       year;
            }
            
            // สร้างแถวข้อมูล
            $.each(limitedData, function(index, item) {
                tableHtml += '<tr>';
                tableHtml += '<td><a href="' + item.link + '" target="_blank">' + item.title + '</a></td>';
                tableHtml += '<td>' + (item.type || '-') + '</td>';
                tableHtml += '<td>' + (item.method || '-') + '</td>';
                tableHtml += '<td>' + (item.department || '-') + '</td>';
                tableHtml += '<td>' + formatThaiDate(item.date) + '</td>';
                tableHtml += '</tr>';
            });
            
            tableHtml += '</tbody>';
            tableHtml += '</table>';
            
            // แสดงข้อความถ้ามีรายการมากกว่า 20 รายการ
            if (data.table_data.length > 20) {
                tableHtml += '<div class="egp-table-note">';
                tableHtml += '<p>* แสดงเฉพาะ 20 รายการล่าสุด จากทั้งหมด ' + data.table_data.length + ' รายการ</p>';
                tableHtml += '</div>';
            }
            
            tableHtml += '</div>';
            
            // แสดงผล
            $('#egp-table-data').html(tableHtml);
        }
    };
    
    // เริ่มการทำงานเมื่อเอกสารโหลดเสร็จ
    $(document).ready(function() {
        // Debug: ตรวจสอบว่ามี egp_ajax_vars object หรือไม่
        if (typeof egp_ajax_vars !== 'undefined') {
            console.log('egp_ajax_vars object found:', egp_ajax_vars);
        } else {
            console.error('egp_ajax_vars object not found!');
        }
        
        // ตรวจสอบว่ามีอีลิเมนต์ที่จำเป็นอยู่ในหน้าเว็บหรือไม่ก่อนเริ่มทำงาน
        if (document.getElementById('egp-chart')) {
            egpStatistics.init();
        }
    });
    
})(jQuery);