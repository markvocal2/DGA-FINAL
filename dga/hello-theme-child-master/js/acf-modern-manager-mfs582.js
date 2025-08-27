/**
 * Modern ACF Field Manager JavaScript
 * Uses ES6 classes and Fetch API
 */

class ACFFieldManager {
    constructor() {
        this.modal = null;
        this.currentAction = null;
        this.currentField = null;
        this.init();
    }

    init() {
        this.setupModal();
        this.setupEventListeners();
        this.setupSearch();
    }

    // Modal Management
    setupModal() {
        this.modal = document.getElementById('acf-field-modal');
        if (!this.modal) return;

        const backdrop = this.modal.querySelector('.acf-modal-backdrop-mfs582');
        const closeBtn = this.modal.querySelector('.acf-modal-close-mfs582');
        
        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeModal());
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    openModal(title, action = 'add', field = null) {
        if (!this.modal) return;

        const titleEl = this.modal.querySelector('.acf-modal-title-mfs582');
        const form = document.getElementById('acf-field-form-mfs582');
        const saveBtn = document.getElementById('modal-save-btn');
        
        this.currentAction = action;
        this.currentField = field;

        if (titleEl) titleEl.textContent = title;
        
        if (action === 'add') {
            form.reset();
            document.getElementById('field-key-mfs582').value = '';
            if (saveBtn) {
                saveBtn.innerHTML = `
                    <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                    </svg>
                    ${acfModernData.strings.save}
                `;
            }
        } else if (action === 'edit' && field) {
            document.getElementById('field-key-mfs582').value = field.key;
            document.getElementById('field-label-mfs582').value = field.label;
            document.getElementById('field-name-mfs582').value = field.name;
            
            // Show warning about changing metadata name
            this.showToast('warning', acfModernData.strings.nameChangeWarning);
            
            if (saveBtn) {
                saveBtn.innerHTML = `
                    <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                    </svg>
                    ${acfModernData.strings.save}
                `;
            }
        }

        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus on first input
        setTimeout(() => {
            const firstInput = document.getElementById('field-label-mfs582');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    closeModal() {
        if (!this.modal) return;
        
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentAction = null;
        this.currentField = null;
    }

    // Event Listeners
    setupEventListeners() {
        // Add field button
        const addBtn = document.getElementById('add-field-btn');
        const addFirstBtn = document.getElementById('add-first-field-btn');
        
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.openModal(acfModernData.strings.addField, 'add');
            });
        }
        
        if (addFirstBtn) {
            addFirstBtn.addEventListener('click', () => {
                this.openModal(acfModernData.strings.addField, 'add');
            });
        }

        // Edit buttons (delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.acf-btn-edit-mfs582')) {
                e.preventDefault();
                const btn = e.target.closest('.acf-btn-edit-mfs582');
                this.handleEdit(btn);
            }
        });

        // Delete buttons (delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.acf-btn-delete-mfs582')) {
                e.preventDefault();
                const btn = e.target.closest('.acf-btn-delete-mfs582');
                this.handleDelete(btn);
            }
        });

        // Modal save button
        const saveBtn = document.getElementById('modal-save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveField());
        }

        // Modal cancel button
        const cancelBtn = document.getElementById('modal-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }

        // Form submit
        const form = document.getElementById('acf-field-form-mfs582');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveField();
            });
        }

        // Auto-generate field name from label
        const labelInput = document.getElementById('field-label-mfs582');
        const nameInput = document.getElementById('field-name-mfs582');
        
        if (labelInput && nameInput) {
            labelInput.addEventListener('input', (e) => {
                if (this.currentAction === 'add') {
                    const generatedName = this.generateFieldName(e.target.value);
                    nameInput.value = generatedName;
                }
            });
        }
    }

    // Search functionality
    setupSearch() {
        const searchInput = document.querySelector('.acf-search-input-mfs582');
        if (!searchInput) return;

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value.toLowerCase());
            }, 300);
        });
    }

    performSearch(query) {
        const fieldCards = document.querySelectorAll('.acf-field-card-mfs582');
        
        fieldCards.forEach(card => {
            const label = card.querySelector('.acf-field-label-mfs582').textContent.toLowerCase();
            const name = card.querySelector('.acf-field-name-mfs582').textContent.toLowerCase();
            
            if (label.includes(query) || name.includes(query)) {
                card.style.display = '';
                card.classList.add('highlight');
                setTimeout(() => card.classList.remove('highlight'), 500);
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Handle Edit
    handleEdit(button) {
        const field = {
            key: button.dataset.key,
            label: button.dataset.label,
            name: button.dataset.name
        };
        
        this.openModal(acfModernData.strings.editField, 'edit', field);
    }

    // Handle Delete
    handleDelete(button) {
        const fieldLabel = button.dataset.label;
        
        this.showConfirmDialog(
            `${acfModernData.strings.confirmDelete}`,
            fieldLabel,
            acfModernData.strings.deleteWarning,
            async () => {
                await this.deleteField(button.dataset.key);
            }
        );
    }

    // Save Field (Add or Update)
    async saveField() {
        const form = document.getElementById('acf-field-form-mfs582');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const saveBtn = document.getElementById('modal-save-btn');
        const fieldKey = document.getElementById('field-key-mfs582').value;
        const fieldLabel = document.getElementById('field-label-mfs582').value;
        const fieldName = document.getElementById('field-name-mfs582').value;
        
        this.setButtonLoading(saveBtn, true, acfModernData.strings.saving);

        try {
            const formData = new FormData();
            formData.append('action', 'handle_acf_modern_actions_mfs582');
            formData.append('nonce', acfModernData.nonce);
            formData.append('group_key', acfModernData.groupKey);
            // Fix: Change 'edit' to 'update' to match PHP handler
            formData.append('sub_action', this.currentAction === 'edit' ? 'update' : this.currentAction);
            formData.append('key', fieldKey);
            formData.append('label', fieldLabel);
            formData.append('name', fieldName);

            const response = await fetch(acfModernData.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('success', data.data.message);
                
                if (this.currentAction === 'add') {
                    this.addFieldToUI(data.data.field);
                } else {
                    this.updateFieldInUI(data.data.field);
                }
                
                this.closeModal();
            } else {
                throw new Error(data.data?.message || acfModernData.strings.error);
            }
        } catch (error) {
            this.showToast('error', error.message);
        } finally {
            this.setButtonLoading(saveBtn, false, acfModernData.strings.save);
        }
    }

    // Delete Field
    async deleteField(fieldKey) {
        try {
            const formData = new FormData();
            formData.append('action', 'handle_acf_modern_actions_mfs582');
            formData.append('nonce', acfModernData.nonce);
            formData.append('group_key', acfModernData.groupKey);
            formData.append('sub_action', 'delete');
            formData.append('key', fieldKey);

            const response = await fetch(acfModernData.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('success', data.data.message);
                this.removeFieldFromUI(fieldKey);
            } else {
                throw new Error(data.data?.message || acfModernData.strings.error);
            }
        } catch (error) {
            this.showToast('error', error.message);
        }
    }

    // UI Updates
    addFieldToUI(field) {
        const grid = document.querySelector('.acf-fields-grid-mfs582');
        const emptyState = document.querySelector('.acf-empty-state-mfs582');
        
        if (emptyState) {
            emptyState.remove();
        }

        const fieldCard = this.createFieldCard(field);
        grid.insertAdjacentHTML('beforeend', fieldCard);
        
        // Update stats
        this.updateStats();
        
        // Highlight new field
        setTimeout(() => {
            const newCard = grid.querySelector(`[data-field-key="${field.key}"]`);
            if (newCard) {
                newCard.classList.add('updated');
                setTimeout(() => newCard.classList.remove('updated'), 1000);
            }
        }, 10);
    }

    updateFieldInUI(field) {
        const card = document.querySelector(`[data-field-key="${field.key}"]`);
        if (!card) return;

        card.querySelector('.acf-field-label-mfs582').textContent = field.label;
        card.querySelector('.acf-field-name-mfs582').textContent = field.name;
        
        // Update data attributes
        const editBtn = card.querySelector('.acf-btn-edit-mfs582');
        if (editBtn) {
            editBtn.dataset.label = field.label;
            editBtn.dataset.name = field.name;
        }
        
        const deleteBtn = card.querySelector('.acf-btn-delete-mfs582');
        if (deleteBtn) {
            deleteBtn.dataset.label = field.label;
        }

        // Highlight updated field
        card.classList.add('updated');
        setTimeout(() => card.classList.remove('updated'), 1000);
    }

    removeFieldFromUI(fieldKey) {
        const card = document.querySelector(`[data-field-key="${fieldKey}"]`);
        if (!card) return;

        card.classList.add('removing');
        setTimeout(() => {
            card.remove();
            this.updateStats();
            
            // Show empty state if no fields left
            const remainingCards = document.querySelectorAll('.acf-field-card-mfs582');
            if (remainingCards.length === 0) {
                const grid = document.querySelector('.acf-fields-grid-mfs582');
                grid.innerHTML = `
                    <div class="acf-empty-state-mfs582">
                        <svg viewBox="0 0 24 24" width="48" height="48">
                            <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                        </svg>
                        <p>${acfModernData.strings.noFields}</p>
                        <button class="acf-btn-primary-mfs582" id="add-first-field-btn">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                            ${acfModernData.strings.addField}
                        </button>
                    </div>
                `;
                
                // Re-attach event listener for the new button
                const newBtn = document.getElementById('add-first-field-btn');
                if (newBtn) {
                    newBtn.addEventListener('click', () => {
                        this.openModal(acfModernData.strings.addField, 'add');
                    });
                }
            }
        }, 300);
    }

    createFieldCard(field) {
        return `
            <div class="acf-field-card-mfs582" data-field-key="${field.key}">
                <div class="acf-card-header-mfs582">
                    <div class="acf-field-title-mfs582">
                        <span class="acf-field-label-mfs582">${field.label}</span>
                        <span class="acf-field-type-badge-mfs582">${field.type}</span>
                    </div>
                    <div class="acf-field-actions-mfs582">
                        <button class="acf-btn-icon-mfs582 acf-btn-edit-mfs582"
                                data-key="${field.key}"
                                data-label="${field.label}"
                                data-name="${field.name}"
                                title="${acfModernData.strings.edit || 'Edit'}">
                            <svg viewBox="0 0 24 24">
                                <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="acf-btn-icon-mfs582 acf-btn-delete-mfs582"
                                data-key="${field.key}"
                                data-label="${field.label}"
                                title="${acfModernData.strings.delete || 'Delete'}">
                            <svg viewBox="0 0 24 24">
                                <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="acf-card-body-mfs582">
                    <div class="acf-field-info-mfs582">
                        <div class="acf-info-row-mfs582">
                            <span class="acf-info-label-mfs582">Name:</span>
                            <span class="acf-info-value-mfs582 acf-field-name-mfs582">${field.name}</span>
                        </div>
                        <div class="acf-info-row-mfs582">
                            <span class="acf-info-label-mfs582">Key:</span>
                            <span class="acf-info-value-mfs582 acf-field-key-text-mfs582">${field.key}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateStats() {
        const fieldCount = document.querySelectorAll('.acf-field-card-mfs582').length;
        const statNumber = document.querySelector('.acf-stat-number-mfs582');
        if (statNumber) {
            statNumber.textContent = fieldCount;
        }
    }

    // Confirm Dialog
    showConfirmDialog(title, message, warning, onConfirm) {
        const modal = this.modal;
        const titleEl = modal.querySelector('.acf-modal-title-mfs582');
        const bodyEl = modal.querySelector('.acf-modal-body-mfs582');
        const footerEl = modal.querySelector('.acf-modal-footer-mfs582');

        titleEl.textContent = title;
        bodyEl.innerHTML = `
            <div class="acf-delete-confirm-mfs582">
                <svg viewBox="0 0 24 24" class="acf-warning-icon-mfs582">
                    <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
                <p class="acf-confirm-text-mfs582">
                    <strong>"${this.escapeHtml(message)}"</strong>
                </p>
                <p class="acf-warning-text-mfs582">${warning}</p>
            </div>
        `;
        footerEl.innerHTML = `
            <button class="acf-btn-mfs582 acf-btn-secondary-mfs582" id="confirm-cancel">
                ${acfModernData.strings.cancel}
            </button>
            <button class="acf-btn-mfs582 acf-btn-danger-mfs582" id="confirm-delete">
                <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                ${acfModernData.strings.delete}
            </button>
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const cancelBtn = document.getElementById('confirm-cancel');
        const deleteBtn = document.getElementById('confirm-delete');

        const cleanup = () => {
            this.closeModal();
            cancelBtn.removeEventListener('click', cleanup);
            deleteBtn.removeEventListener('click', handleDelete);
        };

        const handleDelete = async () => {
            this.setButtonLoading(deleteBtn, true, acfModernData.strings.deleting);
            await onConfirm();
            cleanup();
        };

        cancelBtn.addEventListener('click', cleanup);
        deleteBtn.addEventListener('click', handleDelete);
    }

    // Toast Notifications
    showToast(type, message) {
        const container = document.getElementById('acf-toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `acf-toast-mfs582 acf-toast-${type}-mfs582`;
        
        const icons = {
            success: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
            error: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
            warning: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>'
        };

        toast.innerHTML = `
            ${icons[type] || icons.error}
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Utilities
    setButtonLoading(button, loading, text) {
        if (!button) return;
        
        if (loading) {
            button.disabled = true;
            button.classList.add('loading');
            button.innerHTML = `
                <span class="acf-spinner-mfs582"></span>
                ${text}
            `;
        } else {
            button.disabled = false;
            button.classList.remove('loading');
        }
    }

    generateFieldName(label) {
        return label
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 50);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.acfManager = new ACFFieldManager();
    });
} else {
    window.acfManager = new ACFFieldManager();
}