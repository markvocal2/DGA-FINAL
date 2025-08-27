/**
 * Modern UI JavaScript for CKAN Taxonomy Management
 * Uses Fetch API and modern ES6+ features
 */

class CKANTermManager {
    constructor() {
        this.modal = null;
        this.currentAction = null;
        this.currentData = null;
        this.init();
    }

    init() {
        this.setupModal();
        this.setupEventListeners();
        this.setupSearch();
    }

    // Modal Management
    setupModal() {
        this.modal = document.getElementById('ckan-edit-modal');
        if (!this.modal) return;

        const backdrop = this.modal.querySelector('.ckan-modal-backdrop-wkp789');
        const closeBtn = this.modal.querySelector('.ckan-modal-close-wkp789');

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

    openModal(title, body, footer) {
        if (!this.modal) return;

        const titleEl = this.modal.querySelector('.ckan-modal-title-wkp789');
        const bodyEl = this.modal.querySelector('.ckan-modal-body-wkp789');
        const footerEl = this.modal.querySelector('.ckan-modal-footer-wkp789');

        if (titleEl) titleEl.textContent = title;
        if (bodyEl) bodyEl.innerHTML = body;
        if (footerEl) footerEl.innerHTML = footer;

        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus on input if exists
        setTimeout(() => {
            const input = this.modal.querySelector('input[type="text"]');
            if (input) input.focus();
        }, 100);
    }

    closeModal() {
        if (!this.modal) return;
        
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentAction = null;
        this.currentData = null;
    }

    // Event Listeners
    setupEventListeners() {
        // Edit buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.ckan-btn-edit-wkp789')) {
                e.preventDefault();
                this.handleEdit(e.target.closest('.ckan-btn-edit-wkp789'));
            }
        });

        // Delete buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.ckan-btn-delete-wkp789')) {
                e.preventDefault();
                this.handleDelete(e.target.closest('.ckan-btn-delete-wkp789'));
            }
        });
    }

    // Search functionality
    setupSearch() {
        const searchInput = document.querySelector('.ckan-search-input-wkp789');
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
        const termItems = document.querySelectorAll('.ckan-term-item-wkp789');
        
        termItems.forEach(item => {
            const termName = item.querySelector('.ckan-term-name-wkp789').textContent.toLowerCase();
            const termSlug = item.querySelector('.ckan-term-slug-wkp789').textContent.toLowerCase();
            
            if (termName.includes(query) || termSlug.includes(query)) {
                item.style.display = '';
                item.classList.add('highlight');
                setTimeout(() => item.classList.remove('highlight'), 500);
            } else {
                item.style.display = 'none';
            }
        });

        // Show/hide empty state for each taxonomy card
        document.querySelectorAll('.ckan-taxonomy-card-wkp789').forEach(card => {
            const visibleTerms = card.querySelectorAll('.ckan-term-item-wkp789:not([style*="display: none"])');
            const emptyState = card.querySelector('.ckan-empty-terms-wkp789');
            
            if (visibleTerms.length === 0 && !emptyState) {
                // Show no results message
                const termsList = card.querySelector('.ckan-terms-list-wkp789');
                if (termsList && !termsList.querySelector('.ckan-no-results-wkp789')) {
                    const noResults = document.createElement('div');
                    noResults.className = 'ckan-no-results-wkp789';
                    noResults.innerHTML = `
                        <svg viewBox="0 0 24 24">
                            <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        <p>${ckanModernAjax.strings.noResults || 'ไม่พบผลการค้นหา'}</p>
                    `;
                    termsList.appendChild(noResults);
                }
            } else {
                // Remove no results message if exists
                const noResults = card.querySelector('.ckan-no-results-wkp789');
                if (noResults) noResults.remove();
            }
        });
    }

    // Edit Term
    handleEdit(button) {
        const termId = button.dataset.termId;
        const taxonomy = button.dataset.taxonomy;
        const termName = button.dataset.termName;

        this.currentAction = 'edit';
        this.currentData = { termId, taxonomy };

        const bodyContent = `
            <div class="ckan-form-group-wkp789">
                <label class="ckan-label-wkp789">${ckanModernAjax.strings.termName}</label>
                <input type="text" 
                       class="ckan-input-wkp789" 
                       id="term-name-input" 
                       value="${this.escapeHtml(termName)}"
                       placeholder="${ckanModernAjax.strings.termNamePlaceholder}">
            </div>
        `;

        const footerContent = `
            <button class="ckan-btn-wkp789 ckan-btn-secondary-wkp789" onclick="ckanManager.closeModal()">
                ${ckanModernAjax.strings.cancel}
            </button>
            <button class="ckan-btn-wkp789 ckan-btn-primary-wkp789" onclick="ckanManager.saveEdit()">
                <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                </svg>
                ${ckanModernAjax.strings.save}
            </button>
        `;

        this.openModal(ckanModernAjax.strings.editTitle, bodyContent, footerContent);

        // Handle Enter key
        const input = document.getElementById('term-name-input');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveEdit();
                }
            });
        }
    }

    async saveEdit() {
        const input = document.getElementById('term-name-input');
        if (!input || !input.value.trim()) {
            this.showToast('error', 'กรุณากรอกชื่อ Term');
            return;
        }

        const button = this.modal.querySelector('.ckan-btn-primary-wkp789');
        this.setButtonLoading(button, true, ckanModernAjax.strings.saving);

        try {
            const formData = new FormData();
            formData.append('action', 'ckan_modern_edit_term_wkp789');
            formData.append('nonce', ckanModernAjax.nonce);
            formData.append('term_id', this.currentData.termId);
            formData.append('taxonomy', this.currentData.taxonomy);
            formData.append('new_name', input.value.trim());

            const response = await fetch(ckanModernAjax.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.updateTermInUI(data.data.term);
                this.showToast('success', data.data.message);
                this.closeModal();
                this.triggerLogUpdate();
            } else {
                throw new Error(data.data?.message || ckanModernAjax.strings.error);
            }
        } catch (error) {
            this.showToast('error', error.message);
        } finally {
            this.setButtonLoading(button, false, ckanModernAjax.strings.save);
        }
    }

    // Delete Term
    handleDelete(button) {
        const termId = button.dataset.termId;
        const taxonomy = button.dataset.taxonomy;
        const termName = button.dataset.termName;

        this.currentAction = 'delete';
        this.currentData = { termId, taxonomy };

        const bodyContent = `
            <div class="ckan-delete-confirm-wkp789">
                <svg viewBox="0 0 24 24" class="ckan-warning-icon-wkp789">
                    <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
                <p class="ckan-confirm-text-wkp789">
                    ${ckanModernAjax.strings.deleteConfirm} <strong>"${this.escapeHtml(termName)}"</strong>?
                </p>
                <p class="ckan-warning-text-wkp789">${ckanModernAjax.strings.deleteWarning}</p>
            </div>
        `;

        const footerContent = `
            <button class="ckan-btn-wkp789 ckan-btn-secondary-wkp789" onclick="ckanManager.closeModal()">
                ${ckanModernAjax.strings.cancel}
            </button>
            <button class="ckan-btn-wkp789 ckan-btn-danger-wkp789" onclick="ckanManager.confirmDelete()">
                <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                ${ckanModernAjax.strings.delete}
            </button>
        `;

        this.openModal(`${ckanModernAjax.strings.deleteConfirm}?`, bodyContent, footerContent);
    }

    async confirmDelete() {
        const button = this.modal.querySelector('.ckan-btn-danger-wkp789');
        this.setButtonLoading(button, true, ckanModernAjax.strings.deleting);

        try {
            const formData = new FormData();
            formData.append('action', 'ckan_modern_delete_term_wkp789');
            formData.append('nonce', ckanModernAjax.nonce);
            formData.append('term_id', this.currentData.termId);
            formData.append('taxonomy', this.currentData.taxonomy);

            const response = await fetch(ckanModernAjax.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.removeTermFromUI(this.currentData.termId);
                this.showToast('success', data.data.message);
                this.closeModal();
                this.triggerLogUpdate();
            } else {
                throw new Error(data.data?.message || ckanModernAjax.strings.error);
            }
        } catch (error) {
            this.showToast('error', error.message);
        } finally {
            this.setButtonLoading(button, false, ckanModernAjax.strings.delete);
        }
    }

    // UI Updates
    updateTermInUI(term) {
        const termItem = document.querySelector(`[data-term-id="${term.term_id}"]`);
        if (!termItem) return;

        const nameEl = termItem.querySelector('.ckan-term-name-wkp789');
        const slugEl = termItem.querySelector('.ckan-term-slug-wkp789');
        const editBtn = termItem.querySelector('.ckan-btn-edit-wkp789');

        if (nameEl) nameEl.textContent = term.name;
        if (slugEl) slugEl.textContent = term.slug;
        if (editBtn) editBtn.dataset.termName = term.name;

        // Add highlight animation
        termItem.classList.add('updated');
        setTimeout(() => termItem.classList.remove('updated'), 1000);
    }

    removeTermFromUI(termId) {
        const termItem = document.querySelector(`[data-term-id="${termId}"]`);
        if (!termItem) return;

        termItem.classList.add('removing');
        setTimeout(() => {
            termItem.remove();
            // Update term counts
            this.updateTermCounts();
        }, 300);
    }

    updateTermCounts() {
        document.querySelectorAll('.ckan-taxonomy-card-wkp789').forEach(card => {
            const termCount = card.querySelectorAll('.ckan-term-item-wkp789').length;
            const countEl = card.querySelector('.ckan-term-count-wkp789');
            if (countEl) {
                countEl.textContent = termCount;
            }

            // Show empty state if no terms
            if (termCount === 0) {
                const body = card.querySelector('.ckan-card-body-wkp789');
                if (body) {
                    body.innerHTML = `
                        <div class="ckan-empty-terms-wkp789">
                            <svg viewBox="0 0 24 24">
                                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                            </svg>
                            <p>${ckanModernAjax.strings.noTerms}</p>
                        </div>
                    `;
                }
            }
        });

        // Update header stats
        const totalTerms = document.querySelectorAll('.ckan-term-item-wkp789').length;
        const statNumbers = document.querySelectorAll('.ckan-stat-number-wkp789');
        if (statNumbers.length > 1) {
            statNumbers[1].textContent = totalTerms;
        }
    }

    // Toast Notifications
    showToast(type, message) {
        const container = document.getElementById('ckan-toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `ckan-toast-wkp789 ckan-toast-${type}-wkp789`;
        
        const icon = type === 'success' 
            ? '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
            : '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';

        toast.innerHTML = `
            ${icon}
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Utilities
    setButtonLoading(button, loading, text) {
        if (!button) return;
        
        if (loading) {
            button.disabled = true;
            button.classList.add('loading');
            button.innerHTML = `
                <span class="ckan-spinner-wkp789"></span>
                ${text}
            `;
        } else {
            button.disabled = false;
            button.classList.remove('loading');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    triggerLogUpdate() {
        // Trigger update for log shortcode if exists
        if (document.getElementById('ckan-log-container')) {
            document.dispatchEvent(new CustomEvent('ckanLogNeedsUpdate'));
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ckanManager = new CKANTermManager();
    });
} else {
    window.ckanManager = new CKANTermManager();
}