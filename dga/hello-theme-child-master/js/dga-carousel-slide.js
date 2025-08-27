/**
 * DGA Carousel Slide JavaScript - แก้ไขเพื่อให้คลิกลิงค์ไปยังโพสได้
 * Version: 1.0.5
 */
(function($) {
    'use strict';
    
    // ทำให้เป็น global function เพื่อให้เรียกใช้ได้จาก inline script
    window.initDgaCarousels = initDgaCarousels;
    
    // Initialize carousels when DOM is ready
    $(document).ready(function() {
        initDgaCarousels();
    });
    
    // Re-initialize on window resize with debounce
    let resizeTimer;
    $(window).on('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            $('.dga-carousel-container').each(function() {
                const carousel = $(this).data('dgaCarousel');
                if (carousel) {
                    carousel.updateLayout();
                }
            });
        }, 250);
    });
    
    // Re-initialize on AJAX content load
    $(document).on('ajaxComplete', function() {
        initDgaCarousels();
    });
    
    // Initialize all carousel instances
    function initDgaCarousels() {
        $('.dga-carousel-container').each(function() {
            // Skip if already initialized
            if ($(this).data('dgaCarousel')) {
                return;
            }
            
            // Create new carousel instance
            const carousel = new DgaCarousel(this);
            
            // Store carousel instance in element data
            $(this).data('dgaCarousel', carousel);
            
            // Initialize carousel
            carousel.init();
        });
    }
    
    /**
     * DGA Carousel Constructor
     * @param {HTMLElement} element - The carousel container element
     */
    function DgaCarousel(element) {
        // DOM Elements
        this.container = $(element);
        this.track = this.container.find('.dga-carousel-track');
        this.slides = this.container.find('.dga-carousel-slide');
        this.slideLinks = this.container.find('.dga-carousel-slide-link');
        this.dotsContainer = this.container.find('.dga-carousel-dots');
        this.prevButton = this.container.find('.dga-carousel-prev');
        this.nextButton = this.container.find('.dga-carousel-next');
        this.liveRegion = this.container.find('.dga-carousel-liveregion');
        this.dotTemplate = this.container.find('template').length ? 
                         this.container.find('template')[0] : null;
        
        // Carousel Data
        this.currentIndex = 2; // Start at slide 2
        this.slideCount = this.slides.length;
        this.slideWidth = 0;
        this.containerWidth = 0;
        this.mainSlidePercent = 60;   // Main slide takes 60% of container width
        this.sideSlidePercent = 20;   // Side slides take 20% each
        this.slideGap = 30;           // Gap between slides in pixels
        
        // Additional Variables
        this.isAnimating = false;
        this.autoPlayInterval = null;
        this.autoPlayDelay = 5000; // 5 seconds
        this.linkClickAllowed = false; // Flag to control link clicks
        
        // Touch and drag variables
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.isDragging = false;
        this.startDragX = 0;
        this.currentDragX = 0;
        this.currentLeft = 0;
        this.dragThreshold = 10; // Minimum pixel movement to consider as drag
        this.clickStartTime = 0;
        this.clickEndTime = 0;
    }
    
    /**
     * Initialize carousel functionality
     */
    DgaCarousel.prototype.init = function() {
        if (this.slideCount <= 0) {
            return; // No slides, nothing to do
        }
        
        // ตั้งค่า ARIA attributes สำหรับ accessibility
        this.setupAccessibility();
        
        // Generate dots for navigation
        this.generateDots();
        
        // Calculate layout
        this.updateLayout();
        
        // Set up event handlers
        this.setupEventHandlers();
        
        // Start autoplay
        this.startAutoPlay();
        
        // Set initial slide (to slide 2 as requested)
        // Make sure the index is valid
        const initialIndex = Math.min(2, this.slideCount - 1);
        this.goToSlide(initialIndex, false);
    };
    
    /**
     * ตั้งค่า ARIA attributes สำหรับการเข้าถึง
     */
    DgaCarousel.prototype.setupAccessibility = function() {
        // ตั้งค่าแอตทริบิวต์สำหรับแต่ละสไลด์
        this.slides.each((index, slide) => {
            // กำหนด tabindex=-1 เริ่มต้นสำหรับทุกลิงก์ยกเว้นลิงก์ในสไลด์ที่แสดงอยู่ (จะถูกอัปเดตใน goToSlide)
            $(slide).find('.dga-carousel-slide-link').attr('tabindex', '-1');
        });
    };
    
    /**
     * Generate dot navigation elements
     */
    DgaCarousel.prototype.generateDots = function() {
        this.dotsContainer.empty();
        
        // Only show dots if we have more than one slide
        if (this.slideCount <= 1) {
            return;
        }
        
        for (let i = 0; i < this.slideCount; i++) {
            let dot;
            
            // ใช้ template ถ้ามี หรือสร้างใหม่ถ้าไม่มี
            if (this.dotTemplate) {
                // คัดลอกจาก template
                const clone = document.importNode(this.dotTemplate.content, true);
                dot = $(clone).find('.dga-carousel-dot');
                
                // อัปเดตข้อความ screen reader
                dot.find('.screen-reader-text').text(`Go to slide ${i + 1}`);
            } else {
                // สร้างใหม่ถ้าไม่มี template
                const dotLabel = `Go to slide ${i + 1}`;
                dot = $('<button class="dga-carousel-dot" role="tab" aria-label="' + dotLabel + '"></button>');
            }
            
            const slideId = this.slides.eq(i).attr('id');
            
            // เพิ่ม aria-controls เพื่อระบุว่าปุ่มนี้ควบคุมสไลด์ใด
            dot.attr({
                'aria-controls': slideId,
                'id': 'tab-' + i + '-' + this.container.attr('id')
            });
            
            // Set active class for initial dot
            if (i === this.currentIndex) {
                dot.addClass('active').attr('aria-selected', 'true');
            } else {
                dot.attr('aria-selected', 'false');
            }
            
            // Set data attribute for index reference
            dot.data('slideIndex', i);
            
            // Append to dots container
            this.dotsContainer.append(dot);
        }
    };
    
    /**
     * Update carousel layout based on container width
     */
    DgaCarousel.prototype.updateLayout = function() {
        this.containerWidth = this.container.width();
        
        // Calculate slide width based on percentages
        this.slideWidth = (this.containerWidth * this.mainSlidePercent) / 100;
        
        // Set the width for each slide, accounting for the gap
        this.slides.css({
            'width': this.slideWidth + 'px',
            'margin-right': this.slideGap + 'px' // Add gap between slides
        });
        
        // Set width of the track to accommodate all slides with gaps
        const trackWidth = (this.slideWidth + this.slideGap) * this.slideCount;
        this.track.css('width', trackWidth + 'px');
        
        // Update current slide position
        this.goToSlide(this.currentIndex, false);
    };
    
    /**
     * Set up event handlers
     */
    DgaCarousel.prototype.setupEventHandlers = function() {
        const self = this;
        
        // Previous button click
        this.prevButton.on('click', function(e) {
            e.preventDefault();
            self.prevSlide();
        });
        
        // Next button click
        this.nextButton.on('click', function(e) {
            e.preventDefault();
            self.nextSlide();
        });
        
        // Dot navigation click
        this.dotsContainer.on('click', '.dga-carousel-dot', function() {
            const index = $(this).data('slideIndex');
            self.goToSlide(index);
        });
        
        // แก้ไข: จัดการ click event บนลิงค์ในสไลด์
        this.slideLinks.on('click', function(e) {
            // อนุญาตให้คลิกลิงค์ได้เฉพาะเมื่ออยู่ในสไลด์ปัจจุบัน
            const slideIndex = $(this).closest('.dga-carousel-slide').index();
            const isDragging = self.isDragging || Math.abs(self.currentDragX - self.startDragX) > self.dragThreshold;
            const isQuickClick = (self.clickEndTime - self.clickStartTime) < 300; // 300ms threshold for click
            
            // ตรวจสอบว่าเป็นการคลิกจริงๆ ไม่ใช่การลาก
            if ((slideIndex === self.currentIndex && !isDragging) || isQuickClick) {
                // ให้ไปที่ลิงค์ตามปกติ
                return true;
            } else {
                e.preventDefault();
                // ถ้าไม่ใช่สไลด์ปัจจุบัน ให้เลื่อนไปที่สไลด์นั้นแทน
                self.goToSlide(slideIndex);
                return false;
            }
        });
        
        // Touch events for swipe on mobile
        this.track.on('touchstart', function(e) {
            self.touchStartX = e.originalEvent.touches[0].clientX;
            self.currentLeft = parseFloat(self.track.css('left')) || 0;
            self.clickStartTime = new Date().getTime();
            self.linkClickAllowed = true;
            self.stopAutoPlay();
            
            // Disable transition for direct dragging
            self.track.css('transition', 'none');
        });
        
        this.track.on('touchmove', function(e) {
            if (!self.touchStartX) return;
            
            const touchX = e.originalEvent.touches[0].clientX;
            const diff = touchX - self.touchStartX;
            
            // ถ้าการลากเกินกว่า threshold ให้ถือว่ากำลังลาก ไม่ใช่คลิก
            if (Math.abs(diff) > self.dragThreshold) {
                self.linkClickAllowed = false;
            }
            
            // Move the carousel with finger
            self.track.css('left', (self.currentLeft + diff) + 'px');
            
            // Prevent page scrolling when swiping carousel
            e.preventDefault();
        });
        
        this.track.on('touchend', function(e) {
            self.touchEndX = e.originalEvent.changedTouches[0].clientX;
            const swipeDistance = self.touchEndX - self.touchStartX;
            self.clickEndTime = new Date().getTime();
            
            // Re-enable transition
            self.track.css('transition', 'left 0.4s ease');
            
            // ตรวจสอบว่าเป็นการลากหรือการคลิก
            if (Math.abs(swipeDistance) > 50) { // Minimum swipe distance
                if (swipeDistance > 0) {
                    self.prevSlide();
                } else {
                    self.nextSlide();
                }
            } else {
                // ถ้าลากน้อยมาก ให้กลับไปที่สไลด์ปัจจุบัน
                self.goToSlide(self.currentIndex);
            }
            
            self.touchStartX = 0;
            self.touchEndX = 0;
            self.startAutoPlay();
        });
        
        // Mouse events for drag on desktop
        this.track.on('mousedown', function(e) {
            if (e.which !== 1) return; // Only proceed with left mouse button
            
            self.isDragging = true;
            self.startDragX = e.clientX;
            self.currentDragX = e.clientX; // Initialize currentDragX
            self.currentLeft = parseFloat(self.track.css('left')) || 0;
            self.clickStartTime = new Date().getTime();
            self.linkClickAllowed = true;
            self.stopAutoPlay();
            
            // Disable transition for direct dragging
            self.track.css('transition', 'none');
            
            // Change cursor
            self.track.addClass('dga-dragging');
            
            // Prevent default to avoid text selection while dragging
            e.preventDefault();
        });
        
        $(document).on('mousemove', function(e) {
            if (!self.isDragging) return;
            
            self.currentDragX = e.clientX;
            const diff = self.currentDragX - self.startDragX;
            
            // ถ้าการลากเกินกว่า threshold ให้ถือว่ากำลังลาก ไม่ใช่คลิก
            if (Math.abs(diff) > self.dragThreshold) {
                self.linkClickAllowed = false;
            }
            
            // Move the carousel with mouse
            self.track.css('left', (self.currentLeft + diff) + 'px');
            
            // Prevent text selection while dragging
            e.preventDefault();
        });
        
        $(document).on('mouseup', function(e) {
            if (!self.isDragging) return;
            
            self.isDragging = false;
            self.clickEndTime = new Date().getTime();
            
            // Re-enable transition
            self.track.css('transition', 'left 0.4s ease');
            
            // Remove dragging class
            self.track.removeClass('dga-dragging');
            
            // Calculate drag distance
            const dragDistance = self.currentDragX - self.startDragX;
            
            // ตรวจสอบว่าเป็นการลากหรือการคลิก
            if (Math.abs(dragDistance) > 50) { // Minimum drag distance
                if (dragDistance > 0) {
                    self.prevSlide();
                } else {
                    self.nextSlide();
                }
            } else {
                // ถ้าลากน้อยมาก ให้กลับไปที่สไลด์ปัจจุบัน
                self.goToSlide(self.currentIndex);
            }
            
            self.startAutoPlay();
        });
        
        $(document).on('mouseleave', function() {
            if (self.isDragging) {
                self.isDragging = false;
                self.track.removeClass('dga-dragging');
                self.track.css('transition', 'left 0.4s ease');
                self.goToSlide(self.currentIndex);
                self.startAutoPlay();
            }
        });
        
        // Pause autoplay on hover
        this.container.hover(
            function() { self.stopAutoPlay(); },
            function() { self.startAutoPlay(); }
        );
        
        // Keyboard navigation
        $(document).on('keydown', function(e) {
            if (self.container.is(':visible')) {
                // เพิ่มการเช็คว่า focus อยู่ใน carousel หรือไม่
                let isCarouselFocused = $.contains(self.container[0], document.activeElement) || 
                                       self.container[0] === document.activeElement;
                
                if (isCarouselFocused) {
                    if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        self.prevSlide();
                    } else if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        self.nextSlide();
                    } else if (e.key === 'Home') {
                        e.preventDefault();
                        self.goToSlide(0);
                    } else if (e.key === 'End') {
                        e.preventDefault();
                        self.goToSlide(self.slideCount - 1);
                    } else if (e.key === 'Enter' || e.key === ' ') {
                        // ถ้ากด Enter หรือ Space ให้เปิดลิงค์ในสไลด์ปัจจุบัน
                        const activeSlideLink = self.slides.eq(self.currentIndex).find('.dga-carousel-slide-link');
                        if (activeSlideLink.length) {
                            e.preventDefault();
                            window.location.href = activeSlideLink.attr('href');
                        }
                    }
                }
            }
        });
    };
    
    /**
     * Go to a specific slide
     * @param {number} index - Slide index to go to
     * @param {boolean} animate - Whether to animate the transition
     */
    DgaCarousel.prototype.goToSlide = function(index, animate = true) {
        // Prevent going to same slide
        if (index === this.currentIndex && animate) {
            return;
        }
        
        // Ensure index is within bounds
        if (index < 0) {
            index = 0;
        } else if (index >= this.slideCount) {
            index = this.slideCount - 1;
        }
        
        // Calculate the side slide width based on container width
        const sideSlideWidth = (this.containerWidth * this.sideSlidePercent) / 100;
        
        // Calculate the offset to center the current slide
        // We need to account for the left side peek, so we offset by that amount
        const centeringOffset = sideSlideWidth + (this.slideGap / 2);
        
        // Calculate position for the track
        const position = -(index * (this.slideWidth + this.slideGap)) + centeringOffset;
        
        // Update current index
        this.currentIndex = index;
        
        // Re-enable transition if it was disabled
        if (animate) {
            this.track.css('transition', 'left 0.4s ease');
        } else {
            this.track.css('transition', 'none');
        }
        
        // Update track position with or without animation
        if (animate) {
            this.isAnimating = true;
            this.track.animate({
                left: position + 'px'
            }, 400, 'swing', () => {
                this.isAnimating = false;
            });
        } else {
            this.track.css('left', position + 'px');
        }
        
        // อัปเดต tabindex และ z-index สำหรับแต่ละสไลด์
        this.slides.each((i, slide) => {
            const link = $(slide).find('.dga-carousel-slide-link');
            
            // สไลด์ปัจจุบันควรสามารถโฟกัสได้ สไลด์อื่นๆ ไม่ควรโฟกัสได้
            if (i === index) {
                link.attr('tabindex', '0');
                $(slide).css('z-index', '10'); // เพิ่ม z-index ให้สไลด์ปัจจุบัน
                $(slide).addClass('active-slide'); // เพิ่มคลาสเพื่อให้สามารถคลิกได้
            } else {
                link.attr('tabindex', '-1');
                $(slide).css('z-index', '1');
                $(slide).removeClass('active-slide');
            }
        });
        
        // Update active dot and ARIA attributes
        this.dotsContainer.find('.dga-carousel-dot').removeClass('active').attr('aria-selected', 'false');
        this.dotsContainer.find('.dga-carousel-dot').eq(index).addClass('active').attr('aria-selected', 'true');
        
        // Update active slide class and ARIA attributes
        this.slides.removeClass('active prev next');
        this.slides.attr('aria-current', null);
        this.slides.eq(index).addClass('active').attr('aria-current', 'true');
        
        // เพิ่มคลาส active-card ให้กับสไลด์ปัจจุบัน เพื่อให้ CSS สามารถจัดการได้
        this.slides.removeClass('active-card');
        this.slides.eq(index).addClass('active-card');
        
        // Add prev class to previous slide if it exists
        if (index > 0) {
            this.slides.eq(index - 1).addClass('prev');
        }
        
        // Add next class to next slide if it exists
        if (index < this.slideCount - 1) {
            this.slides.eq(index + 1).addClass('next');
        }
        
        // ประกาศการเปลี่ยนแปลงสไลด์สำหรับโปรแกรมอ่านหน้าจอ
        if (animate) {
            const activeSlideLabel = this.slides.eq(index).attr('aria-label') || `Slide ${index + 1}`;
            this.announceSlideChange(`Now showing: ${activeSlideLabel}`);
        }
    };
    
    /**
     * Go to next slide
     */
    DgaCarousel.prototype.nextSlide = function() {
        if (this.isAnimating) {
            return;
        }
        
        let nextIndex;
        if (this.currentIndex >= this.slideCount - 1) {
            // If last slide, go to first slide
            nextIndex = 0;
        } else {
            nextIndex = this.currentIndex + 1;
        }
        
        this.goToSlide(nextIndex);
    };
    
    /**
     * Go to previous slide
     */
    DgaCarousel.prototype.prevSlide = function() {
        if (this.isAnimating) {
            return;
        }
        
        let prevIndex;
        if (this.currentIndex <= 0) {
            // If first slide, go to last slide
            prevIndex = this.slideCount - 1;
        } else {
            prevIndex = this.currentIndex - 1;
        }
        
        this.goToSlide(prevIndex);
    };
    
    /**
     * ประกาศการเปลี่ยนสไลด์สำหรับโปรแกรมอ่านหน้าจอ
     * @param {string} message - ข้อความที่จะประกาศ
     */
    DgaCarousel.prototype.announceSlideChange = function(message) {
        // อัปเดตข้อความใน live region
        this.liveRegion.text(message);
    };
    
    /**
     * Start auto play functionality
     */
    DgaCarousel.prototype.startAutoPlay = function() {
        const self = this;
        this.stopAutoPlay(); // Clear any existing interval
        
        // Only start autoplay if we have more than one slide
        if (this.slideCount > 1) {
            this.autoPlayInterval = setInterval(function() {
                self.nextSlide();
            }, this.autoPlayDelay);
        }
    };
    
    /**
     * Stop auto play functionality
     */
    DgaCarousel.prototype.stopAutoPlay = function() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    };
    
})(jQuery);