/**
 * DGA FAQs JavaScript - Updated Version
 * File: child-theme/js/dga-faqs.js
 */

jQuery(document).ready(function($) {
    let currentPage = 1;
    let perPage = $('#dga-faqs-container').data('per-page') || 20;
    let searchTerm = '';
    let currentFAQs = [];
    let deleteId = null;
    
    // Debug: ตรวจสอบสถานะ admin
    console.log('DGA FAQs Debug:', {
        is_admin: dga_faqs_ajax.is_admin,
        user_logged_in: dga_faqs_ajax.user_logged_in,
        debug: dga_faqs_ajax.debug
    });
    
    // Modal control
    const modal = $('#dga-faq-modal');
    const editModal = $('#dga-faq-edit-modal');
    const deleteModal = $('#dga-delete-confirm');
    
    const closeModal = () => {
        modal.fadeOut();
        $('#dga-modal-question').val('');
        $('#dga-modal-answer').val('');
    };
    
    const closeEditModal = () => {
        editModal.fadeOut();
        $('#dga-edit-question').val('');
        $('#dga-edit-answer').val('');
        $('#dga-edit-faq-id').val('');
    };
    
    const closeDeleteModal = () => {
        deleteModal.fadeOut();
        deleteId = null;
    };
    
    // Open modal when clicking add button
    $(document).on('click', '.dga-add-faq-btn', function() {
        modal.fadeIn();
    });
    
    // Close modal events
    $('.dga-modal-close, .dga-modal-cancel').on('click', function() {
        const parent = $(this).closest('.dga-modal');
        if (parent.attr('id') === 'dga-faq-modal') closeModal();
        else if (parent.attr('id') === 'dga-faq-edit-modal') closeEditModal();
        else if (parent.attr('id') === 'dga-delete-confirm') closeDeleteModal();
    });
    
    // Close modal when clicking outside
    $('.dga-modal').on('click', function(e) {
        if (e.target === this) {
            if ($(this).attr('id') === 'dga-faq-modal') closeModal();
            else if ($(this).attr('id') === 'dga-faq-edit-modal') closeEditModal();
            else if ($(this).attr('id') === 'dga-delete-confirm') closeDeleteModal();
        }
    });
    
    // Submit FAQ form from modal
    $('#dga-faqs-modal-form').on('submit', function(e) {
        e.preventDefault();
        
        const question = $('#dga-modal-question').val();
        const answer = $('#dga-modal-answer').val();
        
        if (!question || !answer) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        
        $.ajax({
            url: dga_faqs_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'dga_add_faq',
                nonce: dga_faqs_ajax.nonce,
                question: question,
                answer: answer
            },
            beforeSend: function() {
                $('#dga-faqs-modal-form button[type="submit"]').prop('disabled', true).text('กำลังเพิ่ม...');
            },
            success: function(response) {
                if (response.success) {
                    alert(response.data);
                    closeModal();
                    currentPage = 1;
                    loadFAQs();
                } else {
                    alert(response.data || 'เกิดข้อผิดพลาด');
                }
            },
            error: function() {
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            },
            complete: function() {
                $('#dga-faqs-modal-form button[type="submit"]').prop('disabled', false).text('เพิ่มคำถาม');
            }
        });
    });
    
    // Submit Edit FAQ form
    $('#dga-faqs-edit-form').on('submit', function(e) {
        e.preventDefault();
        
        const faqId = $('#dga-edit-faq-id').val();
        const question = $('#dga-edit-question').val();
        const answer = $('#dga-edit-answer').val();
        
        if (!question || !answer) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        
        $.ajax({
            url: dga_faqs_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'dga_update_faq',
                nonce: dga_faqs_ajax.nonce,
                faq_id: faqId,
                question: question,
                answer: answer
            },
            beforeSend: function() {
                $('#dga-faqs-edit-form button[type="submit"]').prop('disabled', true).text('กำลังบันทึก...');
            },
            success: function(response) {
                if (response.success) {
                    alert(response.data);
                    closeEditModal();
                    loadFAQs();
                } else {
                    alert(response.data || 'เกิดข้อผิดพลาด');
                }
            },
            error: function() {
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            },
            complete: function() {
                $('#dga-faqs-edit-form button[type="submit"]').prop('disabled', false).text('บันทึกการแก้ไข');
            }
        });
    });
    
    // Delete FAQ
    $('#dga-confirm-delete').on('click', function() {
        if (!deleteId) return;
        
        $.ajax({
            url: dga_faqs_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'dga_delete_faq',
                nonce: dga_faqs_ajax.nonce,
                faq_id: deleteId
            },
            beforeSend: function() {
                $('#dga-confirm-delete').prop('disabled', true).text('กำลังลบ...');
            },
            success: function(response) {
                if (response.success) {
                    alert(response.data);
                    closeDeleteModal();
                    loadFAQs();
                } else {
                    alert(response.data || 'เกิดข้อผิดพลาด');
                }
            },
            error: function() {
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            },
            complete: function() {
                $('#dga-confirm-delete').prop('disabled', false).text('ลบคำถาม');
            }
        });
    });
    
    // โหลด FAQs เมื่อเริ่มต้น
    loadFAQs();
    
    // Event Handlers
    $('#dga-faqs-search-btn').on('click', function() {
        searchTerm = $('#dga-faqs-search-input').val();
        currentPage = 1;
        loadFAQs();
    });
    
    $('#dga-faqs-search-input').on('keypress', function(e) {
        if (e.which === 13) {
            searchTerm = $(this).val();
            currentPage = 1;
            loadFAQs();
        }
    });
    
    // Load FAQs Function
    function loadFAQs() {
        $.ajax({
            url: dga_faqs_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'dga_load_faqs',
                nonce: dga_faqs_ajax.nonce,
                page: currentPage,
                per_page: perPage,
                search: searchTerm
            },
            beforeSend: function() {
                $('#dga-faqs-list').html('<div class="dga-loading">กำลังโหลด...</div>');
            },
            success: function(response) {
                if (response.success) {
                    displayFAQs(response.data.faqs);
                    displayPagination(response.data.total_pages, response.data.current_page);
                    currentFAQs = response.data.faqs;
                } else {
                    $('#dga-faqs-list').html('<div class="dga-error">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>');
                }
            },
            error: function() {
                $('#dga-faqs-list').html('<div class="dga-error">เกิดข้อผิดพลาดในการเชื่อมต่อ</div>');
            }
        });
    }
    
    // Display FAQs
    function displayFAQs(faqs) {
        let html = '';
        
        if (faqs.length === 0) {
            html = '<div class="dga-no-results">ไม่พบคำถามที่ตรงกับการค้นหา</div>';
        } else {
            faqs.forEach(function(faq) {
                const likeClass = faq.user_liked ? 'liked' : '';
                
                // สร้าง HTML สำหรับปุ่ม actions
                let actionsHtml = '<div class="dga-faq-actions">';
                
                // แสดงปุ่มแก้ไข/ลบเฉพาะ Administrator
                if (dga_faqs_ajax.is_admin === true || dga_faqs_ajax.is_admin === 'true' || dga_faqs_ajax.is_admin === 1) {
                    console.log('Admin mode active for FAQ:', faq.id);
                    actionsHtml += `
                        <button class="dga-edit-btn" data-id="${faq.id}" title="แก้ไข">
                            <span class="dashicons dashicons-edit"></span>
                        </button>
                        <button class="dga-delete-btn" data-id="${faq.id}" title="ลบ">
                            <span class="dashicons dashicons-trash"></span>
                        </button>
                    `;
                }
                
                // ปุ่ม Like แสดงสำหรับทุกคน
                actionsHtml += `
                    <button class="dga-like-btn ${likeClass}" data-id="${faq.id}">
                        <span class="dga-like-icon">👍</span>
                        <span class="dga-like-count">${faq.likes}</span>
                    </button>
                `;
                
                actionsHtml += '</div>';
                
                html += `
                    <div class="dga-faq-item" data-id="${faq.id}">
                        <div class="dga-faq-header">
                            <h3 class="dga-faq-question">${escapeHtml(faq.question)}</h3>
                            ${actionsHtml}
                        </div>
                        <div class="dga-faq-answer" style="display: none;">
                            <h4 class="dga-answer-title">${escapeHtml(faq.question)}</h4>
                            <p>${escapeHtml(faq.answer)}</p>
                        </div>
                    </div>
                `;
            });
        }
        
        $('#dga-faqs-list').html(html);
        
        // Bind click events
        bindFAQEvents();
    }
    
    // Display Pagination
    function displayPagination(totalPages, currentPageNum) {
        let html = '';
        
        if (totalPages > 1) {
            html += '<div class="dga-pagination-wrapper">';
            
            // Previous button
            if (currentPageNum > 1) {
                html += `<button class="dga-page-btn" data-page="${currentPageNum - 1}">« ก่อนหน้า</button>`;
            }
            
            // Page numbers
            for (let i = 1; i <= totalPages; i++) {
                const activeClass = i === currentPageNum ? 'active' : '';
                html += `<button class="dga-page-btn ${activeClass}" data-page="${i}">${i}</button>`;
            }
            
            // Next button
            if (currentPageNum < totalPages) {
                html += `<button class="dga-page-btn" data-page="${currentPageNum + 1}">ถัดไป »</button>`;
            }
            
            html += '</div>';
        }
        
        $('#dga-faqs-pagination').html(html);
        
        // Bind pagination events
        $('.dga-page-btn').on('click', function() {
            currentPage = $(this).data('page');
            loadFAQs();
            $('html, body').animate({
                scrollTop: $('#dga-faqs-container').offset().top - 50
            }, 500);
        });
    }
    
    // Bind FAQ Events
    function bindFAQEvents() {
        // Toggle answer on question click - คลิกแสดง/ซ่อนคำตอบ
        $('.dga-faq-header').on('click', function(e) {
            // ไม่ให้ trigger เมื่อคลิกปุ่ม like
            if ($(e.target).closest('.dga-like-btn').length) return;
            
            const $item = $(this).closest('.dga-faq-item');
            const $answer = $item.find('.dga-faq-answer');
            const $question = $item.find('.dga-faq-question');
            
            // Toggle การแสดงคำตอบ
            $answer.slideToggle(300);
            
            // Toggle class active สำหรับ styling
            $question.toggleClass('active');
            $item.toggleClass('expanded');
            
        });
        
        // Edit button click
        $('.dga-edit-btn').on('click', function(e) {
            e.stopPropagation();
            
            // ตรวจสอบ permission อีกครั้ง
            if (!dga_faqs_ajax.is_admin) {
                alert('คุณไม่มีสิทธิ์ในการแก้ไขคำถาม');
                return;
            }
            
            const faqId = $(this).data('id');
            const faq = currentFAQs.find(f => f.id == faqId);
            
            if (faq) {
                $('#dga-edit-faq-id').val(faq.id);
                $('#dga-edit-question').val(faq.question);
                $('#dga-edit-answer').val(faq.answer);
                editModal.fadeIn();
            }
        });
        
        // Delete button click
        $('.dga-delete-btn').on('click', function(e) {
            e.stopPropagation();
            
            // ตรวจสอบ permission อีกครั้ง
            if (!dga_faqs_ajax.is_admin) {
                alert('คุณไม่มีสิทธิ์ในการลบคำถาม');
                return;
            }
            
            const faqId = $(this).data('id');
            const faq = currentFAQs.find(f => f.id == faqId);
            
            if (faq) {
                deleteId = faqId;
                $('#dga-delete-question-text').text(faq.question);
                deleteModal.fadeIn();
            }
        });
        
        // Like button click
        $('.dga-like-btn').on('click', function(e) {
            e.stopPropagation();
            const faqId = $(this).data('id');
            const $btn = $(this);
            
            // เพิ่ม animation class
            $btn.addClass('animating');
            
            // สร้าง particle effects
            createParticles($btn);
            
            $.ajax({
                url: dga_faqs_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'dga_toggle_like',
                    nonce: dga_faqs_ajax.nonce,
                    faq_id: faqId
                },
                beforeSend: function() {
                    $btn.prop('disabled', true);
                },
                success: function(response) {
                    if (response.success) {
                        // อัพเดตจำนวน likes
                        const $count = $btn.find('.dga-like-count');
                        const currentCount = parseInt($count.text());
                        
                        // Animate number change
                        animateNumberChange($count, currentCount, response.data.likes);
                        
                        if (response.data.user_liked) {
                            $btn.addClass('liked');
                            createConfetti($btn);
                        } else {
                            $btn.removeClass('liked');
                        }
                    } else {
                        alert(response.data || 'เกิดข้อผิดพลาด');
                    }
                },
                error: function() {
                    alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
                },
                complete: function() {
                    $btn.prop('disabled', false);
                    setTimeout(function() {
                        $btn.removeClass('animating');
                    }, 500);
                }
            });
        });
    }
    
    // Secure random number generator for non-security purposes
    function getSecureRandom() {
        // For visual effects, we can use crypto.getRandomValues() with fallback to Math.random()
        if (window.crypto?.getRandomValues) {
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            return array[0] / (0xffffffff + 1);
        }
        // Fallback to Math.random() for visual effects only (not security-sensitive)
        return Math.random();
    }
    
    // Escape HTML - Fixed regex to prevent ReDoS
    function escapeHtml(text) {
        if (!text || typeof text !== 'string') return text;
        
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        // Simple character-by-character replacement to avoid ReDoS
        return text.split('').map(char => map[char] || char).join('');
    }
    
    // Create particle effects
    function createParticles($btn) {
        const particles = ['❤️', '👍', '✨', '🌟', '💫'];
        const btnOffset = $btn.offset();
        
        for (let i = 0; i < 5; i++) {
            setTimeout(function() {
                const particle = $('<div class="like-particle"></div>');
                particle.text(particles[Math.floor(getSecureRandom() * particles.length)]);
                particle.css({
                    position: 'absolute',
                    left: btnOffset.left + $btn.width() / 2 + (getSecureRandom() * 40 - 20),
                    top: btnOffset.top - $(window).scrollTop(),
                    fontSize: '20px'
                });
                
                $('body').append(particle);
                
                setTimeout(function() {
                    particle.remove();
                }, 1000);
            }, i * 100);
        }
    }
    
    // Create confetti effect for like
    function createConfetti($btn) {
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
        const btnOffset = $btn.offset();
        
        for (let i = 0; i < 10; i++) {
            const confetti = $('<div class="confetti"></div>');
            confetti.css({
                position: 'absolute',
                left: btnOffset.left + $btn.width() / 2,
                top: btnOffset.top - $(window).scrollTop(),
                width: '10px',
                height: '10px',
                background: colors[Math.floor(getSecureRandom() * colors.length)],
                borderRadius: '50%',
                opacity: 0.8
            });
            
            $('body').append(confetti);
            
            // Random animation
            const angle = getSecureRandom() * Math.PI * 2;
            const velocity = 50 + getSecureRandom() * 50;
            const rotateEnd = getSecureRandom() * 720 - 360;
            
            confetti.animate({
                left: btnOffset.left + $btn.width() / 2 + Math.cos(angle) * velocity,
                top: (btnOffset.top - $(window).scrollTop()) + Math.sin(angle) * velocity + 50,
                opacity: 0
            }, 1000, function() {
                confetti.remove();
            });
            
            confetti.css({
                transform: `rotate(${rotateEnd}deg)`
            });
        }
    }
    
    // Animate number change
    function animateNumberChange($element, start, end) {
        const duration = 300;
        const stepTime = 30;
        const steps = duration / stepTime;
        const increment = (end - start) / steps;
        let current = start;
        let step = 0;
        
        const timer = setInterval(function() {
            if (step >= steps) {
                clearInterval(timer);
                $element.text(end);
            } else {
                current += increment;
                $element.text(Math.round(current));
                step++;
            }
        }, stepTime);
    }
});