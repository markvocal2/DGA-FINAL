// article-manager.js - Updated with Draft Support and Modal Lock
jQuery(document).ready(function($) {
    console.log('Article Manager JS loaded');
    
    // Track selected post types
    let selectedPostTypes = [];
    let hasSelectedNews = false;
    let currentUploadedImageId = 0;
    
    // Draft storage key
    const DRAFT_KEY = 'at_article_draft_kse749';
    let autoSaveTimeout = null;
    
    // Force scroll to top when page loads
    $(window).scrollTop(0);
    
    // Prevent automatic scrolling
    window.history.scrollRestoration = 'manual';
    
    // ============ MODAL HANDLING - NO OUTSIDE CLICK ============
    // Open modal with event delegation for dynamically loaded content
    $(document).on('click', '.at-add-article-btn-kse749', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Add article button clicked');
        
        const $modal = $('#at-article-modal-kse749');
        if ($modal.length) {
            $modal.addClass('show');
            $('body').css('overflow', 'hidden'); // Prevent body scroll
            console.log('Modal should be visible now');
            
            // Load draft if exists
            loadDraft();
        } else {
            console.error('Modal element not found!');
        }
        
        // Force scroll to top when modal opens
        $(window).scrollTop(0);
        // Reset post type error message
        $('.at-post-type-error-kse749').hide();
    });

    // Close modal ONLY with close button (X)
    $(document).on('click', '.at-close-kse749', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Close button clicked');
        
        $('#at-article-modal-kse749').removeClass('show');
        $('body').css('overflow', ''); // Restore body scroll
        resetForm();
    });

    // REMOVED: Click outside modal to close functionality
    // Now modal can ONLY be closed with X button

    // Prevent modal close when clicking inside modal content
    $(document).on('click', '.at-modal-content-kse749', function(e) {
        e.stopPropagation();
    });

    // ============ DRAFT FUNCTIONALITY ============
    
    // Helper functions for draft saving
    function collectSelectedPostTypes() {
        return $('input[name="post_types[]"]:checked').map(function() {
            return $(this).val();
        }).get();
    }
    
    function collectTaxonomyTerms() {
        const taxonomyTerms = {};
        $('.at-term-checkbox-kse749:checked').each(function() {
            const taxonomy = $(this).attr('name').match(/tax_input\[([^\]]+)\]/)[1];
            if (!taxonomyTerms[taxonomy]) {
                taxonomyTerms[taxonomy] = [];
            }
            taxonomyTerms[taxonomy].push($(this).val());
        });
        return taxonomyTerms;
    }
    
    function collectFileRows() {
        const fileRows = [];
        $('.file-repeater-row-kse749').each(function() {
            const fileName = $(this).find('input[name="file_name[]"]').val();
            const fileDate = $(this).find('input[name="file_date[]"]').val();
            if (fileName || fileDate) {
                fileRows.push({
                    name: fileName,
                    date: fileDate
                });
            }
        });
        return fileRows;
    }
    
    function getArticleContent() {
        return (typeof tinyMCE !== 'undefined' && tinyMCE.get('article_content_kse749')) 
            ? tinyMCE.get('article_content_kse749').getContent() 
            : $('#article_content_kse749').val();
    }
    
    // Save draft to localStorage
    function saveDraft() {
        const draftData = {
            postTypes: collectSelectedPostTypes(),
            articleTitle: $('#article_title_kse749').val(),
            dgaStandardNumber: $('#dga_standard_number_kse749').val(),
            dgthStandardNumber: $('#dgth_standard_number_kse749').val(),
            taxonomyTerms: collectTaxonomyTerms(),
            featuredImageId: $('#featured_image_id_kse749').val(),
            featuredImagePreview: $('#image-preview-kse749').html(),
            articleContent: getArticleContent(),
            documentsState: $('#toggle-documents-kse749').data('state'),
            fileRows: collectFileRows(),
            savedAt: new Date().toISOString()
        };
        
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
            console.log('Draft saved:', draftData);
            showDraftStatus();
        } catch (e) {
            console.error('Failed to save draft:', e);
        }
    }
    
    // Helper functions for draft restoration
    function restorePostTypes(draft) {
        if (!draft.postTypes || draft.postTypes.length === 0) return Promise.resolve();
        
        draft.postTypes.forEach(type => {
            $(`input[name="post_types[]"][value="${type}"]`).prop('checked', true);
        });
        selectedPostTypes = draft.postTypes;
        hasSelectedNews = selectedPostTypes.includes('news');
        
        return loadTaxonomyTerms().then(() => {
            restoreTaxonomySelections(draft.taxonomyTerms);
        });
    }
    
    function restoreTaxonomySelection(taxonomy, termId) {
        $(`.at-term-checkbox-kse749[name="tax_input[${taxonomy}][]"][value="${termId}"]`).prop('checked', true);
    }
    
    function restoreTaxonomyForType(taxonomy, termIds) {
        termIds.forEach(termId => {
            restoreTaxonomySelection(taxonomy, termId);
        });
    }
    
    function restoreTaxonomySelections(taxonomyTerms) {
        setTimeout(() => {
            Object.keys(taxonomyTerms).forEach(taxonomy => {
                restoreTaxonomyForType(taxonomy, taxonomyTerms[taxonomy]);
            });
            checkStandardTerms();
        }, 500);
    }
    
    function restoreBasicFields(draft) {
        $('#article_title_kse749').val(draft.articleTitle || '');
        $('#dga_standard_number_kse749').val(draft.dgaStandardNumber || '');
        $('#dgth_standard_number_kse749').val(draft.dgthStandardNumber || '');
    }
    
    function restoreFeaturedImage(draft) {
        if (draft.featuredImageId && draft.featuredImagePreview) {
            $('#featured_image_id_kse749').val(draft.featuredImageId);
            $('#image-preview-kse749').html(draft.featuredImagePreview);
            currentUploadedImageId = parseInt(draft.featuredImageId);
        }
    }
    
    function restoreArticleContent(draft) {
        if (!draft.articleContent) return;
        
        if (typeof tinyMCE !== 'undefined' && tinyMCE.get('article_content_kse749')) {
            tinyMCE.get('article_content_kse749').setContent(draft.articleContent);
        } else {
            $('#article_content_kse749').val(draft.articleContent);
        }
    }
    
    function restoreDocumentsState(draft) {
        if (draft.documentsState === 'hide') {
            $('#toggle-documents-kse749').data('state', 'hide').addClass('at-toggle-btn-active-kse749');
            $('#documents-section-kse749').hide();
        }
    }
    
    function restoreFileRows(draft) {
        if (!draft.fileRows || draft.fileRows.length === 0) return;
        
        $('#file-repeater-container-kse749').empty();
        draft.fileRows.forEach(row => {
            const newRow = `
                <div class="file-repeater-row-kse749">
                    <input type="text" name="file_name[]" placeholder="ชื่อไฟล์" value="${row.name || ''}">
                    <input type="date" name="file_date[]" value="${row.date || getCurrentDate()}">
                    <input type="file" name="file_upload[]" accept=".pdf,.doc,.docx">
                    <button type="button" class="remove-row-kse749">ลบ</button>
                </div>
            `;
            $('#file-repeater-container-kse749').append(newRow);
        });
    }
    
    // Load draft from localStorage
    function loadDraft() {
        try {
            const draftStr = localStorage.getItem(DRAFT_KEY);
            if (!draftStr) return;
            
            const draft = JSON.parse(draftStr);
            console.log('Loading draft:', draft);
            
            restorePostTypes(draft);
            restoreBasicFields(draft);
            restoreFeaturedImage(draft);
            restoreArticleContent(draft);
            restoreDocumentsState(draft);
            restoreFileRows(draft);
            
            showDraftStatus();
            
        } catch (e) {
            console.error('Failed to load draft:', e);
        }
    }
    
    // Clear draft
    function clearDraft() {
        try {
            localStorage.removeItem(DRAFT_KEY);
            $('#at-draft-status-kse749').fadeOut();
            console.log('Draft cleared');
        } catch (e) {
            console.error('Failed to clear draft:', e);
        }
    }
    
    // Show draft status
    function showDraftStatus() {
        const draftStr = localStorage.getItem(DRAFT_KEY);
        if (draftStr) {
            $('#at-draft-status-kse749').fadeIn();
        } else {
            $('#at-draft-status-kse749').fadeOut();
        }
    }
    
    // Clear draft button handler
    $(document).on('click', '#at-clear-draft-kse749', function(e) {
        e.preventDefault();
        if (confirm('คุณต้องการล้างแบบร่างที่บันทึกไว้หรือไม่?')) {
            clearDraft();
            resetForm();
        }
    });
    
    // Auto-save draft on input changes
    function setupAutoSave() {
        // Clear existing timeout
        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
        }
        
        // Set new timeout
        autoSaveTimeout = setTimeout(() => {
            saveDraft();
        }, 1000); // Save after 1 second of inactivity
    }
    
    // Bind auto-save to form inputs
    $(document).on('input change', '#at-article-form-kse749 input[type="text"], #at-article-form-kse749 input[type="date"], #at-article-form-kse749 input[type="checkbox"], #at-article-form-kse749 textarea', function() {
        setupAutoSave();
    });
    
    // Helper function for TinyMCE auto-save setup
    function setupTinyMCEAutoSave(editor) {
        editor.on('change keyup', function() {
            setupAutoSave();
        });
    }
    
    function handleTinyMCEEditor(e) {
        if (e.editor.id === 'article_content_kse749') {
            setupTinyMCEAutoSave(e.editor);
        }
    }
    
    // Auto-save when TinyMCE content changes
    if (typeof tinyMCE !== 'undefined') {
        tinyMCE.on('AddEditor', handleTinyMCEEditor);
    }

    // Helper functions for post type selection
    function updateSelectedPostTypes() {
        selectedPostTypes = $('input[name="post_types[]"]:checked').map(function() {
            return $(this).val();
        }).get();
        
        console.log('Selected post types:', selectedPostTypes);
        hasSelectedNews = selectedPostTypes.includes('news');
    }
    
    function handleStandardFieldsVisibility() {
        if (hasSelectedNews) {
            $('#standards-fields-container-kse749').slideDown(300);
        } else {
            $('#standards-fields-container-kse749').slideUp(300);
            $('#dga_standard_number_kse749, #dgth_standard_number_kse749').val('');
            $('#dga-standard-field-kse749, #dgth-standard-field-kse749').hide();
        }
    }
    
    function handleTaxonomyDisplay() {
        if (selectedPostTypes.length > 0) {
            $('.at-post-type-error-kse749').hide();
            loadTaxonomyTerms();
        } else {
            $('.at-post-type-error-kse749').show().text('กรุณาเลือกอย่างน้อย 1 ประเภทเนื้อหา');
            $('#taxonomy-terms-container-kse749').html('<div class="at-taxonomy-placeholder-kse749">กรุณาเลือกประเภทเนื้อหาก่อน เพื่อแสดงหมวดหมู่ที่เกี่ยวข้อง</div>');
        }
    }
    
    // Post type selection handling
    $(document).on('change', 'input[name="post_types[]"]', function() {
        updateSelectedPostTypes();
        handleStandardFieldsVisibility();
        handleTaxonomyDisplay();
        setupAutoSave();
    });
    
    // Helper functions for standard terms checking
    function checkTermForStandardField($checkbox) {
        const termName = $checkbox.next('.at-term-name-kse749').text().trim();
        
        if (termName === 'มาตรฐานสำนักงานพัฒนารัฐบาลดิจิทัล (มสพร.)') {
            $('#dga-standard-field-kse749').slideDown(300);
        }
        
        if (termName === 'มาตรฐานรัฐบาลดิจิทัล (มรด.)') {
            $('#dgth-standard-field-kse749').slideDown(300);
        }
    }
    
    // Function to check and show standard fields based on selected terms
    function checkStandardTerms() {
        $('#dga-standard-field-kse749, #dgth-standard-field-kse749').hide();
        
        if (!hasSelectedNews) return;
        
        $('.at-term-checkbox-kse749:checked').each(function() {
            checkTermForStandardField($(this));
        });
    }
    
    // Add event listener for taxonomy term selection
    $(document).on('change', '.at-term-checkbox-kse749', function() {
        checkStandardTerms();
        setupAutoSave();
    });
    
    // Toggle documents section
    $(document).on('click', '#toggle-documents-kse749', function() {
        const $btn = $(this);
        const $section = $('#documents-section-kse749');
        const currentState = $btn.data('state');
        
        if (currentState === 'show') {
            $section.slideUp(300);
            $btn.data('state', 'hide').addClass('at-toggle-btn-active-kse749');
            // Clear all file inputs and make them not required
            $section.find('input').prop('required', false).val('');
        } else {
            $section.slideDown(300);
            $btn.data('state', 'show').removeClass('at-toggle-btn-active-kse749');
        }
        
        setupAutoSave();
    });

    // File repeater handling
    $(document).on('click', '#add-file-row-kse749', function() {
        const newRow = `
            <div class="file-repeater-row-kse749">
                <input type="text" name="file_name[]" placeholder="ชื่อไฟล์">
                <input type="date" name="file_date[]" value="${getCurrentDate()}">
                <input type="file" name="file_upload[]" accept=".pdf,.doc,.docx">
                <button type="button" class="remove-row-kse749">ลบ</button>
            </div>
        `;
        $('#file-repeater-container-kse749').append(newRow);
        setupAutoSave();
    });

    // Helper function for removing file row
    function removeFileRowElement($element) {
        $element.remove();
        setupAutoSave();
    }
    
    // Remove file row
    $(document).on('click', '.remove-row-kse749', function() {
        const $row = $(this).closest('.file-repeater-row-kse749');
        $row.fadeOut(300, function() {
            removeFileRowElement($(this));
        });
    });

    // ============ Image upload handling ===============
    // Handle file selection - immediate upload
    $(document).on('change', '#article_images_kse749', function(e) {
        if (this.files && this.files.length > 0) {
            uploadFeaturedImage(this.files[0]);
        }
    });
    
    // Function to upload image immediately via AJAX
    function uploadFeaturedImage(file) {
        // Check if it's an image file
        if (!file.type.startsWith('image/')) {
            showImageUploadError('กรุณาอัพโหลดไฟล์ภาพเท่านั้น (JPEG, PNG, GIF, WebP)');
            return;
        }
        
        console.log('Uploading image:', file.name);
        
        // Show upload status
        $('#image-preview-kse749').html(`
            <div class="upload-status-kse749">
                <div class="upload-progress-kse749">
                    <div class="upload-progress-bar-kse749"></div>
                </div>
                <div class="upload-message-kse749">กำลังอัพโหลดภาพ...</div>
            </div>
        `);
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('action', 'at_upload_featured_image_kse749');
        formData.append('nonce', atAjax.nonce);
        formData.append('file', file);
        
        // Send upload request via AJAX
        $.ajax({
            url: atAjax.ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            xhr: createUploadXHR,
            success: handleUploadSuccess,
            error: handleUploadError
        });
    }
    
    // Helper functions for image upload
    function createUploadXHR() {
        const xhr = $.ajaxSettings.xhr();
        if (xhr.upload) {
            xhr.upload.addEventListener('progress', updateUploadProgress, false);
        }
        return xhr;
    }
    
    function updateUploadProgress(e) {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            $('.upload-progress-bar-kse749').css('width', percent + '%');
            $('.upload-message-kse749').text(`กำลังอัพโหลด... ${percent}%`);
        }
    }
    
    function handleUploadSuccess(response) {
        console.log('Upload response:', response);
        
        if (response.success) {
            processUploadSuccess(response.data);
        } else {
            showImageUploadError(response.data.message || 'เกิดข้อผิดพลาดในการอัพโหลดภาพ');
        }
    }
    
    function processUploadSuccess(data) {
        currentUploadedImageId = data.attachment_id;
        $('#featured_image_id_kse749').val(currentUploadedImageId);
        
        $('#image-preview-kse749').html(`
            <div class="preview-item-kse749">
                <img src="${data.thumbnail}" alt="ตัวอย่างภาพหน้าปก">
                <div class="preview-info-kse749">
                    <div class="preview-name-kse749">${data.filename}</div>
                    <div class="preview-size-kse749">${data.filesize}</div>
                </div>
                <button type="button" class="remove-image-kse749" title="ลบภาพ">×</button>
            </div>
        `);
        
        setupAutoSave();
    }
    
    function handleUploadError(xhr, status, error) {
        console.error('Upload error:', error);
        showImageUploadError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    }
    
    // Function to show upload error message
    function showImageUploadError(message) {
        $('#image-preview-kse749').html(`
            <div class="preview-error-kse749">
                <p>${message}</p>
            </div>
        `);
        // Clear file input
        $('#article_images_kse749').val('');
    }
    
    // Drag and drop functionality
    function initializeDragAndDrop() {
        const dropArea = document.getElementById('image-upload-area-kse749');
        if (!dropArea) return;
        
        setupDragEvents(dropArea);
        setupDropEvents(dropArea);
        dropArea.addEventListener('drop', handleDrop, false);
    }
    
    function setupDragEvents(dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => highlight(dropArea), false);
        });
    }
    
    function setupDropEvents(dropArea) {
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => unhighlight(dropArea), false);
        });
    }
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight(dropArea) {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight(dropArea) {
        dropArea.classList.remove('highlight');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            uploadFeaturedImage(files[0]);
        }
    }
    
    // Initialize drag and drop
    initializeDragAndDrop();
    
    // Handle image removal
    $(document).on('click', '.remove-image-kse749', function() {
        $('#image-preview-kse749').empty();
        $('#article_images_kse749').val('');
        currentUploadedImageId = 0;
        $('#featured_image_id_kse749').val(0);
        setupAutoSave();
    });
    
    // Function to load taxonomy terms
    function loadTaxonomyTerms() {
        if (selectedPostTypes.length === 0) return Promise.resolve();
        
        console.log('Loading taxonomies for:', selectedPostTypes);
        
        // Show loading indicator
        $('#taxonomy-terms-container-kse749').html('<div class="at-loading-kse749">กำลังโหลดหมวดหมู่...</div>');
        
        return $.ajax({
            url: atAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_post_type_taxonomies_kse749',
                post_types: selectedPostTypes,
                nonce: atAjax.nonce
            },
            success: handleTaxonomyResponse,
            error: handleTaxonomyError
        });
    }
    
    // Helper functions for taxonomy loading
    function handleTaxonomyResponse(response) {
        console.log('Taxonomy response:', response);
        
        if (response.success) {
            displayTaxonomyTerms(response.data);
            setTimeout(checkStandardTerms, 300);
        } else {
            $('#taxonomy-terms-container-kse749').html('<div class="at-taxonomy-error-kse749">ไม่สามารถโหลดหมวดหมู่ได้ กรุณาลองใหม่อีกครั้ง</div>');
        }
    }
    
    function handleTaxonomyError(xhr, status, error) {
        console.error('Taxonomy load error:', error);
        $('#taxonomy-terms-container-kse749').html('<div class="at-taxonomy-error-kse749">การเชื่อมต่อล้มเหลว กรุณาลองใหม่อีกครั้ง</div>');
    }
    
    // Function to display taxonomy terms
    function displayTaxonomyTerms(taxonomiesData) {
        const $container = $('#taxonomy-terms-container-kse749');
        $container.empty();
        
        if (Object.keys(taxonomiesData).length === 0) {
            $container.html('<div class="at-taxonomy-empty-kse749">ไม่พบหมวดหมู่สำหรับประเภทเนื้อหาที่เลือก</div>');
            return;
        }
        
        // Post type labels in Thai
        const postTypeLabels = {
            'article': 'บทความ',
            'mpeople': 'คู่มือประชาชน',
            'news': 'ข้อมูลทั่วไป/มาตรฐาน',
            'pha': 'ประชาพิจารณ์และกิจกรรม'
        };
        
        Object.keys(taxonomiesData).forEach(postType => {
            processPostTypeTaxonomies(postType, taxonomiesData[postType], postTypeLabels, $container);
        });
    }
    
    // Helper functions for taxonomy display
    function processPostTypeTaxonomies(postType, taxonomies, postTypeLabels, $container) {
        if (!taxonomies || taxonomies.length === 0) return;
        
        taxonomies.forEach(taxonomy => {
            processTaxonomy(postType, taxonomy, postTypeLabels, $container);
        });
    }
    
    function processTaxonomy(postType, taxonomy, postTypeLabels, $container) {
        const terms = taxonomy.terms;
        if (!terms || terms.length === 0) return;
        
        const taxonomyHeader = createTaxonomyHeader(postType, taxonomy.label, postTypeLabels);
        const termsList = createTermsList(taxonomy.name, terms);
        
        $container.append(createTaxonomyGroup(postType, taxonomy.name, taxonomyHeader, termsList));
    }
    
    function createTaxonomyHeader(postType, taxonomyLabel, postTypeLabels) {
        return `<div class="at-taxonomy-header-kse749">
            <span class="at-taxonomy-post-type-kse749">${postTypeLabels[postType]}</span>
            <span class="at-taxonomy-label-kse749">${taxonomyLabel}</span>
        </div>`;
    }
    
    function createTermsList(taxonomyName, terms) {
        return `<div class="at-terms-list-kse749">
            ${terms.map(term => createTermLabel(taxonomyName, term)).join('')}
        </div>`;
    }
    
    function createTermLabel(taxonomyName, term) {
        return `
            <label class="at-term-label-kse749" data-term-name="${term.name}">
                <input type="checkbox" name="tax_input[${taxonomyName}][]" value="${parseInt(term.id)}" class="at-term-checkbox-kse749">
                <span class="at-term-name-kse749">${term.name}</span>
            </label>
        `;
    }
    
    function createTaxonomyGroup(postType, taxonomyName, header, termsList) {
        return `
            <div class="at-taxonomy-group-kse749" data-post-type="${postType}" data-taxonomy="${taxonomyName}">
                ${header}
                ${termsList}
            </div>
        `;
    }

    // Helper functions for form validation
    function validatePostTypes() {
        selectedPostTypes = $('input[name="post_types[]"]:checked').map(function() {
            return $(this).val();
        }).get();
        
        if (selectedPostTypes.length === 0) {
            $('.at-post-type-error-kse749')
                .text('กรุณาเลือกอย่างน้อย 1 ประเภทเนื้อหา')
                .show();
            return false;
        }
        return true;
    }
    
    function validateArticleTitle() {
        if (!$('#article_title_kse749').val().trim()) {
            alert('กรุณาระบุชื่อบทความ');
            $('#article_title_kse749').focus();
            return false;
        }
        return true;
    }
    
    function prepareFormData(form) {
        if (currentUploadedImageId > 0) {
            $('#featured_image_id_kse749').val(currentUploadedImageId);
        }
        
        const formData = new FormData(form);
        formData.append('action', 'submit_article_kse749');
        
        if ($('#toggle-documents-kse749').data('state') === 'hide') {
            formData.delete('file_name[]');
            formData.delete('file_date[]');
            formData.delete('file_upload[]');
        }
        
        return formData;
    }
    
    function setSubmitButtonLoading() {
        $('.at-submit-btn-kse749')
            .prop('disabled', true)
            .html('<span class="spinner-kse749"></span> กำลังบันทึก...');
    }
    
    // Form submission
    $(document).on('submit', '#at-article-form-kse749', function(e) {
        e.preventDefault();
        
        console.log('Form submitted');
        
        if (!validatePostTypes() || !validateArticleTitle()) {
            return;
        }
        
        const formData = prepareFormData(this);
        setSubmitButtonLoading();

        $.ajax({
            url: atAjax.ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: handleFormSubmitSuccess,
            error: handleFormSubmitError,
            complete: handleFormSubmitComplete
        });
    });
    
    // Helper functions for form submission
    function handleFormSubmitSuccess(response) {
        console.log('Submit response:', response);
        
        if (response.success) {
            clearDraft();
            showToast(response.data.message, response.data.posts);
            resetForm();
            $('#at-article-modal-kse749').removeClass('show');
            $('body').css('overflow', '');
        } else {
            showToast('เกิดข้อผิดพลาด: ' + (response.data || 'กรุณาลองใหม่อีกครั้ง'));
        }
    }
    
    function handleFormSubmitError(xhr, status, error) {
        console.error('Submit error:', error);
        
        let errorMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง';
        try {
            const response = JSON.parse(xhr.responseText);
            if (response.data) {
                errorMsg = 'เกิดข้อผิดพลาด: ' + response.data;
            }
        } catch (e) {
            // JSON parsing failed, use default error message
            console.warn('Failed to parse error response as JSON:', e.message);
        }
        
        showToast(errorMsg);
    }
    
    function handleFormSubmitComplete() {
        $('.at-submit-btn-kse749')
            .prop('disabled', false)
            .text('บันทึกข้อมูล');
    }

    // Form reset function
    function resetForm() {
        $('#at-article-form-kse749')[0].reset();
        $('#image-preview-kse749').empty();
        $('.at-post-type-error-kse749').hide();
        
        // Reset featured image
        currentUploadedImageId = 0;
        $('#featured_image_id_kse749').val(0);
        
        // Reset taxonomy container
        $('#taxonomy-terms-container-kse749').html('<div class="at-taxonomy-placeholder-kse749">กรุณาเลือกประเภทเนื้อหาก่อน เพื่อแสดงหมวดหมู่ที่เกี่ยวข้อง</div>');
        
        // Hide standard fields
        $('#standards-fields-container-kse749').hide();
        $('#dga-standard-field-kse749, #dgth-standard-field-kse749').hide();
        $('#dga_standard_number_kse749, #dgth_standard_number_kse749').val('');
        
        // Reset documents section
        $('#documents-section-kse749').show();
        $('#toggle-documents-kse749')
            .data('state', 'show')
            .removeClass('at-toggle-btn-active-kse749');
        
        // Reset file repeater
        $('#file-repeater-container-kse749').html(`
            <div class="file-repeater-row-kse749">
                <input type="text" name="file_name[]" placeholder="ชื่อไฟล์">
                <input type="date" name="file_date[]" value="${getCurrentDate()}">
                <input type="file" name="file_upload[]" accept=".pdf,.doc,.docx">
                <button type="button" class="remove-row-kse749">ลบ</button>
            </div>
        `);

        // Reset post type selections
        selectedPostTypes = [];
        hasSelectedNews = false;
        $('input[name="post_types[]"]').prop('checked', false);
        
        // Reset TinyMCE editor if available
        if (typeof tinyMCE !== 'undefined' && tinyMCE.get('article_content_kse749')) {
            tinyMCE.get('article_content_kse749').setContent('');
        }
        
        // Hide draft status
        $('#at-draft-status-kse749').hide();
    }

    // Helper functions for toast notification
    function createPostLinks(posts) {
        if (Array.isArray(posts)) {
            return createMultiplePostLinks(posts);
        } else if (posts && posts.post_url) {
            return createSinglePostLink(posts.post_url);
        }
        return '';
    }
    
    function createMultiplePostLinks(posts) {
        const postTypeLabels = {
            'article': 'บทความ',
            'mpeople': 'คู่มือประชาชน',
            'news': 'ข้อมูลทั่วไป',
            'pha': 'ประชาพิจารณ์และกิจกรรม'
        };
        
        return posts.map(post => 
            `<a href="${post.url}" class="at-toast-link-kse749" target="_blank">
                ดู${postTypeLabels[post.type]}
            </a>`
        ).join('');
    }
    
    function createSinglePostLink(postUrl) {
        return `<a href="${postUrl}" class="at-toast-link-kse749" target="_blank">ดูบทความ</a>`;
    }
    
    function removeToastAfterDelay() {
        $('.at-toast-kse749').fadeOut(300, function() {
            $(this).remove();
        });
    }
    
    // Toast notification with support for multiple post links
    function showToast(message, posts = null) {
        $('.at-toast-kse749').remove();
        
        const linksHTML = createPostLinks(posts);
        
        const toastHTML = `
            <div class="at-toast-kse749">
                <div class="at-toast-message-kse749">${message}</div>
                ${linksHTML ? '<div class="at-toast-links-kse749">' + linksHTML + '</div>' : ''}
            </div>
        `;
        
        $('body').append(toastHTML);
        
        setTimeout(removeToastAfterDelay, 5000);
    }

    // Helper function to get current date in YYYY-MM-DD format
    function getCurrentDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Debug: Check if modal exists on page load
    setTimeout(function() {
        if ($('#at-article-modal-kse749').length) {
            console.log('Modal found in DOM');
        } else {
            console.error('Modal NOT found in DOM!');
        }
    }, 1000);
});