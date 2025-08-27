/**
 * DGA Complaint Form System
 * Version: 2.0.0
 * Features: 
 * - รับเรื่องร้องเรียนจากผู้ใช้
 * - รองรับการทำงานแบบ AJAX
 * - UI ทันสมัยตาม WCAG 2.1 AAA
 */

(function($) {
    // ใช้ IIFE เพื่อไม่ให้ตัวแปรชนกับระบบค้นหาเรื่องร้องเรียน

    document.addEventListener('DOMContentLoaded', function() {
        // Helper Functions
        const formGetElement = id => document.getElementById(id);
        const formShowElement = el => el && (el.style.display = 'block');
        const formHideElement = el => el && (el.style.display = 'none');
        const formLogDebug = (msg, data) => console.log(`[Complaint Form] ${msg}`, data || '');

        // Form Elements
        const complaintForm = formGetElement('complaint-form');
        const formTypeField = formGetElement('type');
        const formTypeOtherField = formGetElement('typeOther');
        const formTypeOtherWrapper = document.querySelector('.type-other-field');
        const formIsAnonymous = formGetElement('isAnonymous');
        const formPersonalInfo = document.querySelector('.personal-info');
        const formDetails = formGetElement('details');
        const formDetailsCount = formGetElement('detailsCount');
        const formSubmitButton = document.querySelector('.btn-submit');
        const formLoading = document.querySelector('.loading');
        const formMessage = formGetElement('form-message');
        const formStatus = formGetElement('form-status');
        const formAlert = formGetElement('form-alert');
        const successModal = formGetElement('complaint-success-modal');

        // Initialize Form
        if (complaintForm) {
            formLogDebug('Initializing complaint form system...');
            initForm();
        } else {
            // Form not found, exit gracefully
            return;
        }

        // Initialize form functionality
        function initForm() {
            // Handle Type Selection
            if (formTypeField) {
                formTypeField.addEventListener('change', function() {
                    const selectedType = this.value;
                    
                    if (selectedType === 'other') {
                        // Show "Other" type input field
                        if (formTypeOtherWrapper) {
                            formTypeOtherWrapper.style.display = 'block';
                            formTypeOtherWrapper.setAttribute('aria-hidden', 'false');
                            if (formTypeOtherField) {
                                formTypeOtherField.setAttribute('aria-required', 'true');
                                formTypeOtherField.required = true;
                                formTypeOtherField.focus();
                            }
                        }
                    } else {
                        // Hide "Other" type input field
                        if (formTypeOtherWrapper) {
                            formTypeOtherWrapper.style.display = 'none';
                            formTypeOtherWrapper.setAttribute('aria-hidden', 'true');
                            if (formTypeOtherField) {
                                formTypeOtherField.setAttribute('aria-required', 'false');
                                formTypeOtherField.required = false;
                                formTypeOtherField.value = '';
                            }
                        }
                    }
                });
            }

            // Handle Anonymous Checkbox
            if (formIsAnonymous) {
                formIsAnonymous.addEventListener('change', function() {
                    if (this.checked) {
                        // Disable personal info fields
                        if (formPersonalInfo) {
                            formPersonalInfo.setAttribute('aria-hidden', 'true');
                            formPersonalInfo.style.opacity = '0.5';
                            
                            // Remove required attributes
                            const requiredFields = formPersonalInfo.querySelectorAll('[required]');
                            requiredFields.forEach(field => {
                                field.required = false;
                                field.setAttribute('aria-required', 'false');
                            });
                        }
                    } else {
                        // Enable personal info fields
                        if (formPersonalInfo) {
                            formPersonalInfo.setAttribute('aria-hidden', 'false');
                            formPersonalInfo.style.opacity = '1';
                            
                            // Restore required attributes
                            const nameField = formGetElement('name');
                            if (nameField) {
                                nameField.required = true;
                                nameField.setAttribute('aria-required', 'true');
                            }
                        }
                    }
                });
            }

            // Character Counter for Details
            if (formDetails && formDetailsCount) {
                formDetails.addEventListener('input', function() {
                    const count = this.value.length;
                    const maxLength = parseInt(this.getAttribute('maxlength') || 2000);
                    
                    formDetailsCount.textContent = count;
                    
                    // Warn if approaching limit
                    if (count > maxLength * 0.9) {
                        formDetailsCount.style.color = '#b91c1c';
                    } else {
                        formDetailsCount.style.color = '';
                    }
                });
            }

            // Modal Close Buttons
            if (successModal) {
                const closeButtons = successModal.querySelectorAll('.modal-close, .btn-close-modal');
                closeButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        closeModal();
                    });
                });
            }

            // Form Submission
            if (complaintForm) {
                complaintForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    if (validateForm()) {
                        submitForm();
                    }
                });
            }

            // Keyboard Navigation Support
            document.addEventListener('keydown', function(e) {
                // Close modal with Escape key
                if (e.key === 'Escape' && successModal && successModal.style.display === 'block') {
                    closeModal();
                }
            });

            formLogDebug('Form initialized successfully');
        }

        // Validate the form before submission
        function validateForm() {
            let isValid = true;
            
            // Clear previous errors
            const errorMessages = document.querySelectorAll('.error-message');
            errorMessages.forEach(el => {
                el.textContent = '';
                el.setAttribute('aria-hidden', 'true');
            });
            
            // Required fields validation
            const requiredFields = document.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    const errorEl = formGetElement(`${field.id}-error`);
                    if (errorEl) {
                        errorEl.textContent = `กรุณากรอก${field.labels[0].textContent.split('*')[0].trim()}`;
                        errorEl.setAttribute('aria-hidden', 'false');
                    }
                    
                    field.setAttribute('aria-invalid', 'true');
                    isValid = false;
                    
                    // Focus the first invalid field
                    if (isValid === false && field === requiredFields[0]) {
                        field.focus();
                    }
                } else {
                    field.setAttribute('aria-invalid', 'false');
                }
            });
            
            // Specific validation for other type
            if (formTypeField && formTypeField.value === 'other') {
                if (!formTypeOtherField || !formTypeOtherField.value.trim()) {
                    const errorEl = formGetElement('typeOther-error');
                    if (errorEl) {
                        errorEl.textContent = 'กรุณาระบุประเภทเรื่องร้องเรียนอื่นๆ';
                        errorEl.setAttribute('aria-hidden', 'false');
                    }
                    
                    if (formTypeOtherField) {
                        formTypeOtherField.setAttribute('aria-invalid', 'true');
                        if (isValid === false) {
                            formTypeOtherField.focus();
                        }
                    }
                    
                    isValid = false;
                }
            }
            
            // Contact validation (at least one contact method when not anonymous)
            if (!formIsAnonymous || !formIsAnonymous.checked) {
                const phone = formGetElement('phone');
                const email = formGetElement('email');
                
                if ((!phone || !phone.value.trim()) && (!email || !email.value.trim())) {
                    const errorEl = formGetElement('contact-error');
                    if (errorEl) {
                        errorEl.textContent = 'กรุณากรอกเบอร์โทรศัพท์หรืออีเมลอย่างน้อย 1 ช่องทาง';
                        errorEl.setAttribute('aria-hidden', 'false');
                    }
                    
                    if (phone) phone.setAttribute('aria-invalid', 'true');
                    if (email) email.setAttribute('aria-invalid', 'true');
                    
                    if (isValid === false && phone) {
                        phone.focus();
                    }
                    
                    isValid = false;
                }
            }
            
            return isValid;
        }

        // Submit the form via AJAX
        function submitForm() {
            // Show loading state
            if (formLoading) formShowElement(formLoading);
            if (complaintForm) complaintForm.setAttribute('aria-busy', 'true');
            if (formSubmitButton) formSubmitButton.disabled = true;
            
            // Update screen reader status
            if (formStatus) {
                formStatus.textContent = complaintFormAjax.aria_labels.submitting;
            }
            
            // Collect form data
            const formData = {
                type: formTypeField ? formTypeField.value : '',
                typeOther: formTypeOtherField ? formTypeOtherField.value : '',
                department: formGetElement('department') ? formGetElement('department').value : '',
                details: formDetails ? formDetails.value : '',
                isAnonymous: formIsAnonymous ? formIsAnonymous.checked : false,
                name: formGetElement('name') ? formGetElement('name').value : '',
                address: formGetElement('address') ? formGetElement('address').value : '',
                phone: formGetElement('phone') ? formGetElement('phone').value : '',
                email: formGetElement('email') ? formGetElement('email').value : ''
            };
            
            formLogDebug('Submitting form data:', formData);
            
            // Send AJAX request
            $.ajax({
                url: complaintFormAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'submit_complaint',
                    nonce: complaintFormAjax.nonce,
                    data: JSON.stringify(formData)
                },
                success: function(response) {
                    formLogDebug('AJAX response:', response);
                    
                    if (response.success) {
                        handleSuccess(response.data);
                    } else {
                        handleError(response.data);
                    }
                },
                error: function(xhr, status, error) {
                    formLogDebug('AJAX error:', { status, error });
                    handleError({
                        message: complaintFormAjax.error_message
                    });
                },
                complete: function() {
                    // Reset loading state
                    if (formLoading) formHideElement(formLoading);
                    if (complaintForm) complaintForm.setAttribute('aria-busy', 'false');
                }
            });
        }

        // Handle successful form submission
        function handleSuccess(data) {
            formLogDebug('Form submitted successfully:', data);
            
            // Update status for screen readers
            if (formStatus) {
                formStatus.textContent = complaintFormAjax.aria_labels.success;
            }
            
            // Show success message
            if (formMessage) {
                formMessage.className = 'message success';
                formMessage.textContent = complaintFormAjax.success_message;
                formShowElement(formMessage);
            }
            
            // Reset form
            if (complaintForm) {
                complaintForm.reset();
                
                // Reset "Other" type field
                if (formTypeOtherWrapper) {
                    formTypeOtherWrapper.style.display = 'none';
                    formTypeOtherWrapper.setAttribute('aria-hidden', 'true');
                }
                
                // Reset character counter
                if (formDetailsCount) {
                    formDetailsCount.textContent = '0';
                    formDetailsCount.style.color = '';
                }
            }
            
            // Enable submit button
            if (formSubmitButton) {
                formSubmitButton.disabled = false;
            }
            
            // Show modal with details
            if (successModal) {
                const modalDetails = formGetElement('modal-details');
                if (modalDetails) {
                    modalDetails.innerHTML = `
                        <div class="modal-details">
                            <div class="detail-row">
                                <div class="detail-label">เลขที่เรื่องร้องเรียน</div>
                                <div class="detail-value">${data.ref_number}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">วันที่รับเรื่อง</div>
                                <div class="detail-value">${data.complaint_date}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">ประเภทเรื่องร้องเรียน</div>
                                <div class="detail-value">${data.complaint_type}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">หน่วยงานที่ถูกร้องเรียน</div>
                                <div class="detail-value">${data.department}</div>
                            </div>
                        </div>
                        <p>กรุณาเก็บหมายเลขเรื่องร้องเรียนไว้สำหรับติดตามสถานะ</p>
                    `;
                }
                
                successModal.style.display = 'block';
                successModal.setAttribute('aria-hidden', 'false');
                
                // Set focus to the modal for accessibility
                const closeButton = successModal.querySelector('.modal-close');
                if (closeButton) {
                    setTimeout(() => {
                        closeButton.focus();
                    }, 100);
                }
            }
        }

        // Handle form submission error
        function handleError(data) {
            formLogDebug('Form submission error:', data);
            
            // Update status for screen readers
            if (formStatus) {
                formStatus.textContent = complaintFormAjax.aria_labels.error;
            }
            
            // Show error message
            if (formMessage) {
                formMessage.className = 'message error';
                formMessage.textContent = data.message || complaintFormAjax.error_message;
                formShowElement(formMessage);
                
                // Announce error for screen readers
                if (formAlert) {
                    formAlert.textContent = data.message || complaintFormAjax.error_message;
                }
            }
            
            // Scroll to error message
            if (formMessage) {
                formMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            
            // Enable submit button
            if (formSubmitButton) {
                formSubmitButton.disabled = false;
            }
        }

        // Close success modal
        function closeModal() {
            if (successModal) {
                successModal.style.display = 'none';
                successModal.setAttribute('aria-hidden', 'true');
                
                // Return focus to the form
                if (formSubmitButton) {
                    formSubmitButton.focus();
                }
            }
        }

        // Add focus visibility for accessibility
        function setupFocusVisibility() {
            const focusableElements = document.querySelectorAll(
                'button, [tabindex]:not([tabindex="-1"]), input, select, textarea, a[href]'
            );
            
            focusableElements.forEach(el => {
                el.addEventListener('focus', function() {
                    this.classList.add('has-visible-focus');
                });
                
                el.addEventListener('blur', function() {
                    this.classList.remove('has-visible-focus');
                });
            });
        }

        // Initialize accessibility features
        setupFocusVisibility();
        
        // Log that system is ready
        formLogDebug('Complaint form system ready');
    });

})(jQuery);