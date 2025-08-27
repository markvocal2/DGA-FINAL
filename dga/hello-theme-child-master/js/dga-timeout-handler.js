/**
 * DGA Timeout Handler JavaScript
 * ไฟล์: /js/dga-timeout-handler.js
 */

(function($) {
    'use strict';
    
    // ถ้าไม่มีการเปิดใช้งาน timeout หรือไม่ได้ login
    if (typeof dga_timeout_config === 'undefined') {
        return;
    }
    
    let timeoutMinutes = parseInt(dga_timeout_config.timeout_minutes);
    let warningMinutes = parseInt(dga_timeout_config.warning_minutes);
    let lastActivity = Date.now();
    let warningShown = false;
    let timeoutTimer = null;
    let warningTimer = null;
    let countdownInterval = null;
    
    // สร้าง warning modal
    function createWarningModal() {
        if ($('#dga-timeout-warning-modal').length) {
            return;
        }
        
        const modalHtml = `
            <div id="dga-timeout-warning-modal" class="dga-timeout-modal" style="display:none;">
                <div class="dga-timeout-modal-content">
                    <div class="dga-timeout-modal-header">
                        <h3>Session Timeout Warning</h3>
                    </div>
                    <div class="dga-timeout-modal-body">
                        <p>Your session will expire in <span id="dga-timeout-countdown"></span>.</p>
                        <p>Click "Stay Logged In" to continue your session.</p>
                    </div>
                    <div class="dga-timeout-modal-footer">
                        <button id="dga-timeout-stay" class="button button-primary">Stay Logged In</button>
                        <button id="dga-timeout-logout" class="button">Logout Now</button>
                    </div>
                </div>
            </div>
        `;
        
        $('body').append(modalHtml);
        
        // เพิ่ม CSS styles
        const modalStyles = `
            <style>
                .dga-timeout-modal {
                    position: fixed;
                    z-index: 99999;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .dga-timeout-modal-content {
                    background-color: #fff;
                    padding: 0;
                    border-radius: 5px;
                    width: 400px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                }
                .dga-timeout-modal-header {
                    background-color: #f1f1f1;
                    padding: 15px 20px;
                    border-bottom: 1px solid #ddd;
                }
                .dga-timeout-modal-header h3 {
                    margin: 0;
                    color: #333;
                }
                .dga-timeout-modal-body {
                    padding: 20px;
                }
                .dga-timeout-modal-body p {
                    margin: 10px 0;
                }
                #dga-timeout-countdown {
                    font-weight: bold;
                    color: #dc3232;
                }
                .dga-timeout-modal-footer {
                    padding: 15px 20px;
                    border-top: 1px solid #ddd;
                    text-align: right;
                    background-color: #f9f9f9;
                }
                .dga-timeout-modal-footer button {
                    margin-left: 10px;
                }
            </style>
        `;
        
        $('head').append(modalStyles);
    }
    
    // แสดง warning modal
    function showWarningModal() {
        if (warningShown) {
            return;
        }
        
        warningShown = true;
        createWarningModal();
        
        const $modal = $('#dga-timeout-warning-modal');
        const $countdown = $('#dga-timeout-countdown');
        let remainingSeconds = warningMinutes * 60;
        
        // อัปเดต countdown
        function updateCountdown() {
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            $countdown.text(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            
            if (remainingSeconds <= 0) {
                clearInterval(countdownInterval);
                performLogout();
            }
            
            remainingSeconds--;
        }
        
        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
        
        $modal.fadeIn();
        
        // จัดการปุ่ม Stay Logged In
        $('#dga-timeout-stay').on('click', function() {
            resetTimers();
            $modal.fadeOut();
            warningShown = false;
            clearInterval(countdownInterval);
            updateActivity();
        });
        
        // จัดการปุ่ม Logout Now
        $('#dga-timeout-logout').on('click', function() {
            performLogout();
        });
    }
    
    // ดำเนินการ logout
    function performLogout() {
        clearAllTimers();
        
        $.ajax({
            url: dga_timeout_config.ajax_url,
            type: 'POST',
            data: {
                action: 'dga_session_logout',
                nonce: dga_timeout_config.logout_nonce
            },
            success: function() {
                window.location.href = '/wp-login.php?loggedout=true';
            },
            error: function() {
                window.location.href = '/wp-login.php?loggedout=true';
            }
        });
    }
    
    // อัปเดตเวลา activity
    function updateActivity() {
        lastActivity = Date.now();
        
        $.ajax({
            url: dga_timeout_config.ajax_url,
            type: 'POST',
            data: {
                action: 'dga_update_activity'
            }
        });
    }
    
    // รีเซ็ต timers
    function resetTimers() {
        clearAllTimers();
        
        // ตั้ง timer สำหรับแสดง warning
        warningTimer = setTimeout(function() {
            showWarningModal();
        }, (timeoutMinutes - warningMinutes) * 60 * 1000);
        
        // ตั้ง timer สำหรับ logout
        timeoutTimer = setTimeout(function() {
            if (!warningShown) {
                performLogout();
            }
        }, timeoutMinutes * 60 * 1000);
    }
    
    // ล้าง timers ทั้งหมด
    function clearAllTimers() {
        if (timeoutTimer) {
            clearTimeout(timeoutTimer);
        }
        if (warningTimer) {
            clearTimeout(warningTimer);
        }
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
    }
    
    // ตรวจจับ user activity
    function detectActivity() {
        const events = ['mousedown', 'keypress', 'scroll', 'touchstart'];
        
        events.forEach(function(event) {
            $(document).on(event, function() {
                const now = Date.now();
                
                // อัปเดตถ้าเวลาผ่านไปมากกว่า 1 นาที
                if (now - lastActivity > 60000) {
                    updateActivity();
                    
                    // รีเซ็ต timers ถ้ายังไม่แสดง warning
                    if (!warningShown) {
                        resetTimers();
                    }
                }
            });
        });
    }
    
    // เริ่มต้นระบบ
    function init() {
        createWarningModal();
        resetTimers();
        detectActivity();
        
        // อัปเดต activity ทุก 5 นาที
        setInterval(function() {
            if (!warningShown) {
                updateActivity();
            }
        }, 300000);
    }
    
    // เริ่มต้นเมื่อ document ready
    $(document).ready(function() {
        init();
    });
    
})(jQuery);