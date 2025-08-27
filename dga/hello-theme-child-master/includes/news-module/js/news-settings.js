/**
 * News Settings JavaScript
 * Handles all interactions for the news settings panel
 */


(function($) {
    'use strict';
    

    class NewsSettings {
        constructor() {
            // Elements
            this.wrapper = $('.news-settings-wrapper');
            this.toggle = $('.news-settings-toggle');
            this.panel = $('.news-settings-panel');
            this.form = $('#newsSettingsForm');
            this.previewButton = $('.preview-button');
            this.applyButton = $('.apply-button');

            // State
            this.currentSettings = {};
            this.isLoading = false;

            this.init();
        }
        

        /**
         * Initialize the module
         */
        init() {
            this.loadInitialSettings();
            this.bindEvents();
            this.setupLayoutSelection();
            this.setupCategoryDependencies();
        }

        /**
         * Load initial settings from current shortcode
         */
        loadInitialSettings() {
            const shortcode = this.wrapper.find('.custom-news-display').data('settings');
            if (shortcode) {
                this.currentSettings = this.parseShortcode(shortcode);
                this.populateForm();
            }
        }

        /**
         * Bind all event listeners
         */
        bindEvents() {
            // Toggle panel
            this.toggle.on('click', (e) => {
                e.preventDefault();
                this.togglePanel();
            });

            // Close panel on outside click
            $(document).on('click', (e) => {
                if (!this.panel.is(e.target) && 
                    !this.toggle.is(e.target) && 
                    this.panel.has(e.target).length === 0) {
                    this.closePanel();
                }
            });

            // Form submission
            this.form.on('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });

            // Preview button
            this.previewButton.on('click', (e) => {
                e.preventDefault();
                this.loadPreview();
            });

            // Live updates for certain fields
            this.form.find('select, input[type="number"]').on('change', () => {
                this.updatePreviewDebounced();
            });

            // Post type change
            this.form.find('#post_type').on('change', (e) => {
                this.updateCategoryOptions(e.target.value);
            });

            // Keyboard navigation
            $(document).on('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closePanel();
                }
            });
        }

        /**
         * Toggle settings panel
         */
        togglePanel() {
            if (this.panel.hasClass('active')) {
                this.closePanel();
            } else {
                this.openPanel();
            }
        }

        /**
         * Open settings panel
         */
        openPanel() {
            this.panel.addClass('active').slideDown(300);
            this.toggle.addClass('active');
            this.panel.attr('aria-hidden', 'false');
            this.setFocusTrap();
        }

        /**
         * Close settings panel
         */
        closePanel() {
            this.panel.removeClass('active').slideUp(300);
            this.toggle.removeClass('active');
            this.panel.attr('aria-hidden', 'true');
            this.removeFocusTrap();
        }

        /**
         * Setup layout selection
         */
        setupLayoutSelection() {
            const layoutOptions = this.form.find('.layout-option');
            
            layoutOptions.on('click', (e) => {
                const option = $(e.currentTarget);
                layoutOptions.removeClass('active');
                option.addClass('active');
                this.form.find('input[name="layout"]').val(option.data('layout'));
                this.updatePreviewDebounced();
            });
        }

        /**
         * Setup category dependencies
         */
        setupCategoryDependencies() {
            const postTypeSelect = this.form.find('#post_type');
            const categorySelect = this.form.find('#category');

            postTypeSelect.on('change', (e) => {
                this.updateCategoryOptions(e.target.value);
            });

            categorySelect.chosen({
                width: '100%',
                placeholder_text_multiple: 'Select categories'
            });
        }

        /**
         * Update category options based on post type
         */
        async updateCategoryOptions(postType) {
            try {
                this.setLoading(true);
                const response = await $.ajax({
                    url: newsSettings.ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'get_categories',
                        nonce: newsSettings.nonce,
                        post_type: postType
                    }
                });

                if (response.success) {
                    const categorySelect = this.form.find('#category');
                    categorySelect.html(response.data.options);
                    categorySelect.trigger('chosen:updated');
                }
            } catch (error) {
                this.showError('Error loading categories');
                console.error('Error:', error);
            } finally {
                this.setLoading(false);
            }
        }

        /**
         * Save settings
         */
        async saveSettings() {
            try {
                this.setLoading(true);
                const settings = this.form.serializeArray();
                
                const response = await $.ajax({
                    url: newsSettings.ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'save_news_settings',
                        nonce: newsSettings.nonce,
                        settings: settings
                    }
                });

                if (response.success) {
                    this.updateShortcode(response.data.shortcode);
                    this.showSuccess('Settings saved successfully');
                    this.closePanel();
                }
            } catch (error) {
                this.showError('Error saving settings');
                console.error('Error:', error);
            } finally {
                this.setLoading(false);
            }
        }

        /**
         * Load preview
         */
        async loadPreview() {
            try {
                this.setLoading(true);
                const settings = this.form.serializeArray();
                
                const response = await $.ajax({
                    url: newsSettings.ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'load_preview',
                        nonce: newsSettings.nonce,
                        settings: settings
                    }
                });

                if (response.success) {
                    this.updatePreviewContent(response.data.preview);
                }
            } catch (error) {
                this.showError('Error loading preview');
                console.error('Error:', error);
            } finally {
                this.setLoading(false);
            }
        }

        /**
         * Update preview content
         */
        updatePreviewContent(content) {
            const previewContainer = this.wrapper.find('.news-content');
            previewContainer.fadeOut(300, function() {
                $(this).html(content).fadeIn(300);
            });
        }

        /**
         * Set loading state
         */
        setLoading(isLoading) {
            this.isLoading = isLoading;
            if (isLoading) {
                this.form.addClass('loading');
                this.applyButton.prop('disabled', true);
                this.previewButton.prop('disabled', true);
            } else {
                this.form.removeClass('loading');
                this.applyButton.prop('disabled', false);
                this.previewButton.prop('disabled', false);
            }
        }

        /**
         * Show success message
         */
        showSuccess(message) {
            const messageEl = $('<div>', {
                class: 'settings-message success',
                text: message
            });

            this.form.prepend(messageEl);
            setTimeout(() => messageEl.fadeOut(300, function() {
                $(this).remove();
            }), 3000);
        }

        /**
         * Show error message
         */
        showError(message) {
            const messageEl = $('<div>', {
                class: 'settings-message error',
                text: message
            });

            this.form.prepend(messageEl);
            setTimeout(() => messageEl.fadeOut(300, function() {
                $(this).remove();
            }), 3000);
        }

        /**
         * Update shortcode in content
         */
        updateShortcode(shortcode) {
            const shortcodeEl = this.wrapper.find('.custom-news-display');
            shortcodeEl.replaceWith(shortcode);
        }

        /**
         * Parse shortcode to settings object
         */
        parseShortcode(shortcode) {
            const settings = {};
            const regex = /(\w+)="([^"]+)"/g;
            let match;

            while ((match = regex.exec(shortcode)) !== null) {
                settings[match[1]] = match[2];
            }

            return settings;
        }

        /**
         * Populate form with settings
         */
        populateForm() {
            for (const [key, value] of Object.entries(this.currentSettings)) {
                const field = this.form.find(`[name="${key}"]`);
                if (field.length) {
                    if (field.is(':checkbox')) {
                        field.prop('checked', value === 'true');
                    } else {
                        field.val(value);
                    }
                }
            }

            // Update layout selection
            if (this.currentSettings.layout) {
                this.form.find(`.layout-option[data-layout="${this.currentSettings.layout}"]`)
                    .addClass('active');
            }

            // Update chosen select if exists
            this.form.find('select').trigger('chosen:updated');
        }

        /**
         * Set focus trap for accessibility
         */
        setFocusTrap() {
            const focusableElements = this.panel.find(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ).toArray();

            if (focusableElements.length) {
                const firstFocusable = focusableElements[0];
                const lastFocusable = focusableElements[focusableElements.length - 1];

                this.panel.on('keydown.focusTrap', function(e) {
                    if (e.key === 'Tab') {
                        if (e.shiftKey) {
                            if (document.activeElement === firstFocusable) {
                                e.preventDefault();
                                lastFocusable.focus();
                            }
                        } else {
                            if (document.activeElement === lastFocusable) {
                                e.preventDefault();
                                firstFocusable.focus();
                            }
                        }
                    }
                });

                firstFocusable.focus();
            }
        }

        /**
         * Remove focus trap
         */
        removeFocusTrap() {
            this.panel.off('keydown.focusTrap');
        }

        /**
         * Debounced preview update
         */
        updatePreviewDebounced() {
            clearTimeout(this.previewTimeout);
            this.previewTimeout = setTimeout(() => {
                this.loadPreview();
            }, 500);
        }
    }

    // Initialize on document ready
    $(document).ready(() => {
        new NewsSettings();
    });

})(jQuery);


document.addEventListener('DOMContentLoaded', function() {
    // จัดการการแสดง/ซ่อนแผงควบคุม
    const toggleButtons = document.querySelectorAll('.news-settings-toggle');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const wrapper = this.closest('.news-settings-wrapper');
            const panel = wrapper.querySelector('.news-settings-panel');
            
            if (panel.style.display === 'none') {
                panel.style.display = 'block';
                button.classList.add('active');
            } else {
                panel.style.display = 'none';
                button.classList.remove('active');
            }
        });
    });
});