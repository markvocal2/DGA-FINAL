/**
 * AJAX Contact Form Handler (ES6+, Fetch API)
 * File: /js/contact-form-xy34.js
 */
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('ajaxContactForm_ef56');
    if (!contactForm) {
        return;
    }

    const messagesDiv = contactForm.querySelector('.form-messages-pq45');
    const submitButton = contactForm.querySelector('.submit-button-pq45');
    const originalButtonText = submitButton.textContent;

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Prevent multiple submissions
        if (submitButton.disabled) {
            return;
        }

        // Show loading state
        submitButton.disabled = true;
        submitButton.textContent = cf_data_rs56.sending;
        messagesDiv.innerHTML = '';
        messagesDiv.className = 'form-messages-pq45';

        try {
            // 1. Get reCAPTCHA token
            const token = await grecaptcha.execute(cf_data_rs56.site_key, { action: 'contact' });

            // 2. Prepare form data
            const formData = new FormData(contactForm);
            formData.append('action', 'send_contact_form_ef56');
            formData.append('nonce', cf_data_rs56.nonce);
            formData.append('g-recaptcha-response', token);

            // 3. Send data via Fetch API
            const response = await fetch(cf_data_rs56.ajax_url, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            // 4. Display result
            if (result.success) {
                messagesDiv.classList.add('success');
                messagesDiv.textContent = result.data.message || cf_data_rs56.success;
                contactForm.reset();
            } else {
                throw new Error(result.data.message || cf_data_rs56.error);
            }
        } catch (error) {
            messagesDiv.classList.add('error');
            messagesDiv.textContent = error.message;
        } finally {
            // Restore button state
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
});