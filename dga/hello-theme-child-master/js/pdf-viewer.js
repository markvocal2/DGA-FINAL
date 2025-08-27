/**
 * PDF Viewer JavaScript
 * Elementor-compatible with enhanced functionality and error handling
 */

class PDFViewer {
  constructor() {
    this.config = window.pdfViewerConfig || {};
    this.debug = this.config.debug || false;
    this.log('PDF Viewer initializing...');
    this.init();
  }

  log(message, data = null) {
    if (this.debug || window.location.search.includes('pdf_debug=1')) {
      console.log('[PDF Viewer]', message, data || '');
    }
  }

  init() {
    // Standard WordPress initialization
    jQuery(document).ready(() => this.initViewers());
    
    // Elementor compatibility - safe initialization
    this.initElementorHooks();
    
    // Event delegation for dynamic content
    jQuery(document).on('click', '.pdf-download-btn', this.handleDownload.bind(this));
    jQuery(document).on('click', '.pdf-fullscreen-btn', this.toggleFullscreen.bind(this));
    jQuery(document).on('load error', '.pdf-iframe', this.handleIframeEvents.bind(this));
    
    // Fullscreen change events
    jQuery(document).on('fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange', 
                       this.handleFullscreenChange.bind(this));
    
    // Keyboard shortcuts
    jQuery(document).on('keydown', this.handleKeyboard.bind(this));
  }

  initElementorHooks() {
    // Wait for Elementor to be ready
    if (typeof elementorFrontend !== 'undefined' && elementorFrontend.hooks) {
      elementorFrontend.hooks.addAction('frontend/element_ready/global', () => {
        this.initViewers();
      });
    } else {
      // Fallback: check for Elementor periodically
      let checkCount = 0;
      const checkElementor = () => {
        if (typeof elementorFrontend !== 'undefined' && elementorFrontend.hooks) {
          elementorFrontend.hooks.addAction('frontend/element_ready/global', () => {
            this.initViewers();
          });
        } else if (checkCount < 10) {
          checkCount++;
          setTimeout(checkElementor, 500);
        }
      };
      
      // Start checking after DOM is ready
      jQuery(document).ready(() => {
        setTimeout(checkElementor, 100);
      });
    }
    
    // Additional Elementor-specific events
    jQuery(window).on('elementor/frontend/init', () => {
      this.initViewers();
    });
    
    // Elementor preview mode
    jQuery(window).on('elementor:init', () => {
      setTimeout(() => this.initViewers(), 1000);
    });
  }

  initViewers() {
    jQuery('.pdf-viewer-wrapper').each((index, element) => {
      const $wrapper = jQuery(element);
      
      // Skip if already initialized
      if ($wrapper.data('pdf-initialized')) return;
      
      try {
        this.setupViewer($wrapper);
        $wrapper.data('pdf-initialized', true);
      } catch (error) {
        console.warn('PDF Viewer initialization error:', error);
        // Continue with other viewers even if one fails
      }
    });
  }

  setupViewer($wrapper) {
    const $container = $wrapper.find('.pdf-viewer-container');
    const $iframe = $wrapper.find('.pdf-iframe');
    const $loading = $wrapper.find('.pdf-loading');
    
    // Get data attributes with fallbacks
    const pdfUrl = $wrapper.data('pdf-url') || $wrapper.attr('data-pdf-url');
    const width = $wrapper.data('width') || $wrapper.attr('data-width') || '100%';
    const height = $wrapper.data('height') || $wrapper.attr('data-height') || '600px';
    
    if (!pdfUrl) {
      this.showError($container, 'PDF URL not provided');
      return;
    }

    // Set dimensions
    $iframe.css({ width, height });
    
    // Show loading state
    $loading.show();
    
    // Enhanced iframe loading with error handling
    $iframe.on('load', () => {
      try {
        $loading.fadeOut(300);
        $wrapper.addClass('pdf-loaded');
      } catch (error) {
        console.warn('PDF load handler error:', error);
      }
    });
    
    $iframe.on('error', () => {
      this.showError($container, this.config.error_text || 'Error loading PDF');
    });
    
    // Fallback timeout with error handling
    setTimeout(() => {
      try {
        if ($loading.is(':visible')) {
          $loading.fadeOut(300);
        }
      } catch (error) {
        console.warn('PDF timeout handler error:', error);
      }
    }, 5000);
  }

  handleDownload(event) {
    const $btn = jQuery(event.currentTarget);
    const url = $btn.attr('href');
    
    // Analytics tracking (if available)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pdf_download', {
        event_category: 'PDF Viewer',
        event_label: url
      });
    }
    
    // Visual feedback
    const originalText = $btn.text();
    $btn.text('Downloading...').prop('disabled', true);
    
    setTimeout(() => {
      $btn.text(originalText).prop('disabled', false);
    }, 2000);
  }

  handleIframeEvents(event) {
    const $iframe = jQuery(event.target);
    const $wrapper = $iframe.closest('.pdf-viewer-wrapper');
    const $loading = $wrapper.find('.pdf-loading');
    
    if (event.type === 'load') {
      $loading.fadeOut(300);
      $wrapper.addClass('pdf-loaded');
    } else if (event.type === 'error') {
      const $container = $wrapper.find('.pdf-viewer-container');
      this.showError($container, this.config.error_text || 'Failed to load PDF');
    }
  }

  showError($container, message) {
    const $loading = $container.find('.pdf-loading');
    $loading.html(`<span style="color: #dc3545;">${message}</span>`).show();
    
    // Hide iframe on error
    $container.find('.pdf-iframe').hide();
  }

  toggleFullscreen(event) {
    event.preventDefault();
    
    try {
      const $btn = jQuery(event.currentTarget);
      const $wrapper = $btn.closest('.pdf-viewer-wrapper');
      
      if (!$wrapper.length) {
        this.log('Error: Could not find PDF wrapper');
        return;
      }
      
      if ($wrapper.hasClass('pdf-fullscreen')) {
        this.exitFullscreen($wrapper);
      } else {
        this.enterFullscreen($wrapper);
      }
    } catch (error) {
      console.error('PDF Viewer fullscreen error:', error);
    }
  }

  enterFullscreen($wrapper) {
    try {
      const element = $wrapper[0];
      
      if (!element) {
        this.log('Error: Invalid wrapper element');
        return;
      }
      
      // Add fullscreen class
      $wrapper.addClass('pdf-fullscreen');
      this.log('Entering fullscreen mode');
      
      // Update button text
      const $btn = $wrapper.find('.pdf-fullscreen-btn');
      if ($btn.length) {
        $btn.find('.fullscreen-icon').text('⛘');
        $btn.find('.fullscreen-text').text('Exit');
        $btn.attr('title', 'Exit Fullscreen');
      }
      
      // Try native fullscreen API with better error handling
      const requestFullscreen = element.requestFullscreen ||
                               element.webkitRequestFullscreen ||
                               element.mozRequestFullScreen ||
                               element.msRequestFullscreen;
      
      if (requestFullscreen && typeof requestFullscreen === 'function') {
        const promise = requestFullscreen.call(element);
        if (promise && promise.catch) {
          promise.catch((error) => {
            this.log('Native fullscreen failed, using CSS fallback:', error);
            this.cssFullscreen($wrapper);
          });
        }
      } else {
        // Fallback for older browsers
        this.log('Native fullscreen not supported, using CSS fallback');
        this.cssFullscreen($wrapper);
      }
      
      // Analytics tracking
      this.trackEvent('pdf_fullscreen_enter');
      
    } catch (error) {
      console.error('Enter fullscreen error:', error);
      // Ensure CSS fallback works even if other methods fail
      this.cssFullscreen($wrapper);
    }
  }

  exitFullscreen($wrapper) {
    try {
      // Remove fullscreen class
      $wrapper.removeClass('pdf-fullscreen');
      this.log('Exiting fullscreen mode');
      
      // Update button text
      const $btn = $wrapper.find('.pdf-fullscreen-btn');
      if ($btn.length) {
        $btn.find('.fullscreen-icon').text('⛶');
        $btn.find('.fullscreen-text').text('Fullscreen');
        $btn.attr('title', 'Toggle Fullscreen');
      }
      
      // Exit native fullscreen with better error handling
      const exitFullscreen = document.exitFullscreen ||
                            document.webkitExitFullscreen ||
                            document.mozCancelFullScreen ||
                            document.msExitFullscreen;
      
      if (exitFullscreen && typeof exitFullscreen === 'function') {
        const promise = exitFullscreen.call(document);
        if (promise && promise.catch) {
          promise.catch((error) => {
            this.log('Exit fullscreen failed:', error);
          });
        }
      }
      
      // Remove CSS fullscreen styles
      $wrapper.removeAttr('style');
      
      // Analytics tracking
      this.trackEvent('pdf_fullscreen_exit');
      
    } catch (error) {
      console.error('Exit fullscreen error:', error);
      // Ensure we can always exit by removing classes and styles
      $wrapper.removeClass('pdf-fullscreen').removeAttr('style');
    }
  }

  cssFullscreen($wrapper) {
    // Pure CSS fullscreen fallback
    $wrapper.css({
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 999999,
      background: '#000'
    });
  }

  handleFullscreenChange(event) {
    const isFullscreen = !!(document.fullscreenElement || 
                           document.webkitFullscreenElement || 
                           document.mozFullScreenElement || 
                           document.msFullscreenElement);
    
    // Find active fullscreen wrapper
    const $activeWrapper = jQuery('.pdf-viewer-wrapper.pdf-fullscreen');
    
    if (!isFullscreen && $activeWrapper.length) {
      // Native fullscreen was exited, update UI
      this.exitFullscreen($activeWrapper);
    }
  }

  handleKeyboard(event) {
    // ESC key to exit fullscreen
    if (event.keyCode === 27) {
      const $fullscreenWrapper = jQuery('.pdf-viewer-wrapper.pdf-fullscreen');
      if ($fullscreenWrapper.length) {
        this.exitFullscreen($fullscreenWrapper);
      }
    }
    
    // F11 alternative (F key) when focused on PDF
    if (event.keyCode === 70 && event.ctrlKey) {
      const $focusedPdf = jQuery(event.target).closest('.pdf-viewer-wrapper');
      if ($focusedPdf.length && $focusedPdf.find('[data-fullscreen="true"]').length) {
        event.preventDefault();
        this.toggleFullscreen({ 
          currentTarget: $focusedPdf.find('.pdf-fullscreen-btn')[0],
          preventDefault: () => {}
        });
      }
    }
  }

  trackEvent(action) {
    // Google Analytics 4 tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', action, {
        event_category: 'PDF Viewer',
        event_label: 'Fullscreen Toggle'
      });
    }
    
    // Legacy GA tracking
    if (typeof ga !== 'undefined') {
      ga('send', 'event', 'PDF Viewer', action, 'Fullscreen Toggle');
    }
  }

  // Utility method for manual initialization
  static initSingle(selector) {
    const viewer = new PDFViewer();
    jQuery(selector).each((index, element) => {
      const $wrapper = jQuery(element);
      if (!$wrapper.data('pdf-initialized')) {
        viewer.setupViewer($wrapper);
        $wrapper.data('pdf-initialized', true);
      }
    });
  }
}

// Initialize when DOM is ready with error handling
jQuery(() => {
  try {
    window.pdfViewerInstance = new PDFViewer();
  } catch (error) {
    console.error('PDF Viewer initialization failed:', error);
    
    // Fallback initialization
    setTimeout(() => {
      try {
        if (!window.pdfViewerInstance) {
          console.log('Attempting PDF Viewer fallback initialization...');
          window.pdfViewerInstance = new PDFViewer();
        }
      } catch (fallbackError) {
        console.error('PDF Viewer fallback initialization also failed:', fallbackError);
      }
    }, 2000);
  }
});

// Additional safety check for late-loading scripts
jQuery(window).on('load', () => {
  setTimeout(() => {
    if (typeof window.pdfViewerInstance === 'undefined') {
      console.log('PDF Viewer late initialization...');
      try {
        window.pdfViewerInstance = new PDFViewer();
      } catch (error) {
        console.error('PDF Viewer late initialization failed:', error);
      }
    }
  }, 1000);
});

// Expose for manual initialization
window.PDFViewer = PDFViewer;