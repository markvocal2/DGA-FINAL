// JavaScript สำหรับจัดการการแสดง/ซ่อน WordPress Menu Bar
// ไฟล์: /js/dga-hide_menubar.js

jQuery(document).ready(function($) {
    // ตรวจสอบว่าเป็นผู้ใช้ที่มีสิทธิ์เห็น menu bar
    if (!$('body').hasClass('dga-menubar-enabled')) {
        return;
    }
    
    var body = $('body');
    var tabText = dga_menubar_params.tab_text || 'Admin menu';
    
    // สร้างปุ่ม Tab
    var tabButton = $('<div>', {
        'class': 'dga-menubar-tab',
        text: tabText
    }).appendTo('body');
    
    // ตรวจสอบและปรับตำแหน่งปุ่มให้เหมาะสมกับ layout ของเว็บ
    function adjustTabPosition() {
        var header = $('.site-header, #masthead, .header-main');
        if (header.length && header.css('position') === 'fixed') {
            var headerHeight = header.outerHeight();
            tabButton.css('top', (headerHeight + 10) + 'px');
            $('body').addClass('site-header-fixed');
        }
        
        // ตรวจสอบ top bar อื่นๆ
        var topBar = $('.top-bar, .topbar, #top-bar');
        if (topBar.length && topBar.is(':visible')) {
            $('body').addClass('has-top-bar');
        }
    }
    
    // เรียกใช้เมื่อโหลดหน้า
    adjustTabPosition();
    
    // เรียกใช้เมื่อ resize หน้าจอ
    $(window).on('resize', function() {
        adjustTabPosition();
    });
    
    // Function สำหรับ toggle menu bar
    function toggleMenuBar() {
        body.toggleClass('dga-menubar-show');
    }
    
    // Event handler สำหรับปุ่ม Tab
    tabButton.on('click', function(e) {
        e.stopPropagation();
        toggleMenuBar();
    });
    
    // Keyboard shortcut (optional): กด Ctrl+M เพื่อแสดง/ซ่อน menu bar
    $(document).on('keydown', function(e) {
        if (e.ctrlKey && e.keyCode === 77) { // Ctrl + M
            e.preventDefault();
            toggleMenuBar();
        }
    });
    
    // จัดการ touch events สำหรับ mobile
    tabButton.on('touchstart', function(e) {
        e.preventDefault();
        toggleMenuBar();
    });
    
    // Optional: เพิ่ม localStorage เพื่อจำสถานะ
    function saveMenuBarState(state) {
        if (typeof(Storage) !== "undefined") {
            localStorage.setItem('dga_menubar_state', state);
        }
    }
    
    function loadMenuBarState() {
        if (typeof(Storage) !== "undefined") {
            var state = localStorage.getItem('dga_menubar_state');
            if (state === 'show') {
                body.addClass('dga-menubar-show');
            }
        }
    }
    
    // โหลดสถานะเมื่อเริ่มต้น
    loadMenuBarState();
    
    // บันทึกสถานะเมื่อมีการเปลี่ยนแปลง
    tabButton.on('click', function() {
        setTimeout(function() {
            var isShowing = body.hasClass('dga-menubar-show');
            saveMenuBarState(isShowing ? 'show' : 'hide');
        }, 100);
    });
});