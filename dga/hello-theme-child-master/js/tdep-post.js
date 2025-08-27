jQuery(document).ready(function($) {
    const modal = $('#tdep-post-modal');
    const btn = $('#tdep-post-btn');
    const closeBtn = $('.tdep-close');
    const form = $('#tdep-post-form');
    let mediaUploader;

    // Open modal
    btn.on('click', function() {
        modal.fadeIn(300);
        resetForm();
    });

    // Close modal
    closeBtn.on('click', function() {
        modal.fadeOut(300);
    });

    // Close modal when clicking outside
    $(window).on('click', function(e) {
        if ($(e.target).is(modal)) {
            modal.fadeOut(300);
        }
    });

    // Handle image upload
    $('#tdep-upload-btn').on('click', function(e) {
        e.preventDefault();

        if (mediaUploader) {
            mediaUploader.open();
            return;
        }

        mediaUploader = wp.media({
            title: 'เลือกรูปภาพ',
            button: {
                text: 'ใช้รูปภาพนี้'
            },
            multiple: false
        });

        mediaUploader.on('select', function() {
            const attachment = mediaUploader.state().get('selection').first().toJSON();
            $('#tdep-featured-image-id').val(attachment.id);
            $('#tdep-image-preview').html(`
                <img src="${attachment.url}" alt="Preview">
                <button type="button" class="tdep-remove-image">&times;</button>
            `);
            $('#tdep-upload-btn').hide();
        });

        mediaUploader.open();
    });

    // Remove selected image
    $(document).on('click', '.tdep-remove-image', function() {
        $('#tdep-featured-image-id').val('');
        $('#tdep-image-preview').empty();
        $('#tdep-upload-btn').show();
    });

    // Form submission
    form.on('submit', function(e) {
        e.preventDefault();

        const submitBtn = form.find('button[type="submit"]');
        submitBtn.prop('disabled', true).text('กำลังบันทึก...');

        // Add loading overlay
        const loadingOverlay = $('<div class="tdep-loading-overlay"><div class="tdep-spinner"></div></div>');
        modal.find('.tdep-modal-content').append(loadingOverlay);

        $.ajax({
            url: tdep_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'tdep_create_post',
                nonce: tdep_ajax.nonce,
                title: $('#tdep-title').val(),
                content: $('#tdep-content').val(),
                department: $('#tdep-department').val(),
                featured_image_id: $('#tdep-featured-image-id').val()
            },
            success: function(response) {
                if (response.success) {
                    modal.fadeOut(300);
                    
                    // Show success toast with view link
                    const toast = $(`
                        <div class="tdep-toast">
                            <div class="tdep-toast-content">
                                <div class="tdep-toast-message">สร้างโพสสำเร็จ</div>
                                <a href="${response.data.post_url}" class="tdep-toast-link" target="_blank">ดูเนื้อหา</a>
                            </div>
                            <button class="tdep-toast-close">&times;</button>
                        </div>
                    `).appendTo('body');

                    setTimeout(() => {
                        toast.addClass('show');
                    }, 100);

                    // Auto close toast after 5 seconds
                    setTimeout(() => {
                        toast.removeClass('show');
                        setTimeout(() => toast.remove(), 300);
                    }, 5000);

                    // Close toast on button click
                    toast.find('.tdep-toast-close').on('click', function() {
                        toast.removeClass('show');
                        setTimeout(() => toast.remove(), 300);
                    });

                    resetForm();
                } else {
                    Swal.fire({
                        title: 'ข้อผิดพลาด!',
                        text: response.data.message,
                        icon: 'error',
                        confirmButtonColor: '#007bff'
                    });
                }
            },
            error: function() {
                Swal.fire({
                    title: 'ข้อผิดพลาด!',
                    text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
                    icon: 'error',
                    confirmButtonColor: '#007bff'
                });
            },
            complete: function() {
                loadingOverlay.remove();
                submitBtn.prop('disabled', false).text('บันทึก');
            }
        });
    });

    // Reset form
    function resetForm() {
        form[0].reset();
        $('#tdep-featured-image-id').val('');
        $('#tdep-image-preview').empty();
        $('#tdep-upload-btn').show();
    }
});