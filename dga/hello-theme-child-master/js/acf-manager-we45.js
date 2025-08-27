// FILE: /js/acf-manager-we45.js

document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('acf-manager-app-we45');
    if (!app) return;

    const form = document.getElementById('acf-field-form-we45');
    const fieldKeyInput = document.getElementById('field_key_we45');
    const labelInput = document.getElementById('field_label_we45');
    const nameInput = document.getElementById('field_name_we45');
    const formTitle = document.getElementById('form-title-we45');
    const submitButton = document.getElementById('submit-button-we45');
    const cancelButton = document.getElementById('cancel-edit-button-we45');
    const fieldsList = document.getElementById('acf-fields-list-we45');
    const feedbackDiv = document.getElementById('manager-feedback-we45');
    const noFieldsMessage = document.getElementById('no-fields-message-we45');

    // --- State Management ---
    const resetForm = () => {
        form.reset();
        fieldKeyInput.value = '';
        formTitle.textContent = 'Add New Field';
        submitButton.textContent = 'Add Field';
        cancelButton.style.display = 'none';
        form.dataset.mode = 'add';
    };

    // --- UI Update Functions ---
    const showFeedback = (message, isError = false) => {
        feedbackDiv.textContent = message;
        feedbackDiv.className = isError ? 'feedback-we45 error' : 'feedback-we45 success';
        feedbackDiv.style.display = 'block';
        setTimeout(() => { feedbackDiv.style.display = 'none'; }, 4000);
    };
    
    const renderFieldItem = (field) => {
        return `
            <div class="field-item-we45" data-field-key="${field.key}">
                <div class="field-info-we45">
                    <strong class="field-label-we45">${field.label}</strong>
                    <span class="field-name-we45"> (${field.name})</span>
                </div>
                <div class="field-actions-we45">
                    <button class="edit-btn-we45" data-key="${field.key}" data-label="${field.label}" data-name="${field.name}">Edit</button>
                    <button class="delete-btn-we45" data-key="${field.key}">Delete</button>
                </div>
            </div>
        `;
    };

    // --- Event Handlers ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mode = form.dataset.mode || 'add';
        const action = (mode === 'edit') ? 'update' : 'add';

        const formData = new FormData();
        formData.append('action', 'handle_acf_field_actions_we45');
        formData.append('nonce', acfManagerData_we45.nonce);
        formData.append('group_key', acfManagerData_we45.group_key);
        formData.append('sub_action', action);
        formData.append('key', fieldKeyInput.value);
        formData.append('label', labelInput.value);
        formData.append('name', nameInput.value);
        
        submitButton.disabled = true;

        try {
            const response = await fetch(acfManagerData_we45.ajax_url, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                showFeedback(result.data.message);
                const newFieldData = result.data.field;
                if (action === 'add') {
                    if (noFieldsMessage) noFieldsMessage.remove();
                    fieldsList.insertAdjacentHTML('beforeend', renderFieldItem(newFieldData));
                } else { // update
                    const itemToUpdate = fieldsList.querySelector(`[data-field-key="${newFieldData.key}"]`);
                    itemToUpdate.querySelector('.field-label-we45').textContent = newFieldData.label;
                    itemToUpdate.querySelector('.field-name-we45').textContent = ` (${newFieldData.name})`;
                    // also update the data attributes on the edit button
                    const editBtn = itemToUpdate.querySelector('.edit-btn-we45');
                    editBtn.dataset.label = newFieldData.label;
                    editBtn.dataset.name = newFieldData.name;
                }
                resetForm();
            } else {
                showFeedback(result.data.message, true);
            }
        } catch (error) {
            showFeedback(acfManagerData_we45.strings.error_unexpected, true);
        } finally {
            submitButton.disabled = false;
        }
    });

    fieldsList.addEventListener('click', async (e) => {
        // Edit button clicked
        if (e.target.matches('.edit-btn-we45')) {
            const btn = e.target;
            formTitle.textContent = 'Edit Field';
            submitButton.textContent = 'Update Field';
            cancelButton.style.display = 'inline-block';
            form.dataset.mode = 'edit';

            fieldKeyInput.value = btn.dataset.key;
            labelInput.value = btn.dataset.label;
            nameInput.value = btn.dataset.name;
            
            window.scrollTo({ top: form.offsetTop - 20, behavior: 'smooth' });
            labelInput.focus();
            showFeedback(acfManagerData_we45.strings.field_name_warning);
        }
        // Delete button clicked
        if (e.target.matches('.delete-btn-we45')) {
             if (!confirm(acfManagerData_we45.strings.confirm_delete)) return;
            
            const btn = e.target;
            const keyToDelete = btn.dataset.key;

            const formData = new FormData();
            formData.append('action', 'handle_acf_field_actions_we45');
            formData.append('nonce', acfManagerData_we45.nonce);
            formData.append('group_key', acfManagerData_we45.group_key);
            formData.append('sub_action', 'delete');
            formData.append('key', keyToDelete);

            btn.disabled = true;

            try {
                const response = await fetch(acfManagerData_we45.ajax_url, {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();

                if (result.success) {
                    showFeedback(result.data.message);
                    const itemToRemove = fieldsList.querySelector(`[data-field-key="${keyToDelete}"]`);
                    itemToRemove.remove();
                     if (fieldsList.children.length === 0) {
                         fieldsList.innerHTML = `<p id="no-fields-message-we45">No fields found in this group.</p>`;
                     }
                } else {
                    showFeedback(result.data.message, true);
                    btn.disabled = false;
                }
            } catch (error) {
                 showFeedback(acfManagerData_we45.strings.error_unexpected, true);
                 btn.disabled = false;
            }
        }
    });
    
    cancelButton.addEventListener('click', resetForm);
});