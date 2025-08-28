/**
 * CKAN Organization Editor - Admin Only JavaScript
 * Compact and efficient implementation
 */

(function() {
    'use strict';
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        const wrapper = document.querySelector('.ckan-org-wrapper-adm347');
        if (!wrapper) return;
        
        const editBtn = wrapper.querySelector('.ckan-edit-btn-adm347');
        if (!editBtn) return; // No edit button = not admin
        
        new OrgEditor(wrapper);
    }
    
    class OrgEditor {
        constructor(wrapper) {
            this.wrapper = wrapper;
            this.editBtn = wrapper.querySelector('.ckan-edit-btn-adm347');
            this.modal = wrapper.querySelector('.ckan-modal-adm347');
            this.select = wrapper.querySelector('.ckan-org-select-adm347');
            this.updateBtn = wrapper.querySelector('.ckan-update-btn-adm347');
            this.cancelBtn = wrapper.querySelector('.ckan-cancel-btn-adm347');
            this.orgNameEl = wrapper.querySelector('.ckan-org-name-adm347');
            this.postId = this.editBtn.dataset.postId;
            
            this.bindEvents();
        }
        
        bindEvents() {
            // Open modal
            this.editBtn.addEventListener('click', () => this.openModal());
            
            // Close modal
            this.modal.querySelectorAll('[data-close="modal"]').forEach(el => {
                el.addEventListener('click', () => this.closeModal());
            });
            
            // Update organization
            this.updateBtn.addEventListener('click', () => this.updateOrg());
            
            // ESC to close
            this.modal.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.closeModal();
            });
        }
        
        async openModal() {
            this.modal.classList.add('is-open');
            this.modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            
            // Store last focus
            this.lastFocus = document.activeElement;
            
            // Load organizations
            await this.loadOrganizations();
            
            // Focus select
            setTimeout(() => this.select.focus(), 100);
        }
        
        closeModal() {
            this.modal.classList.remove('is-open');
            this.modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            
            // Restore focus
            if (this.lastFocus) this.lastFocus.focus();
        }
        
        async loadOrganizations() {
            this.select.disabled = true;
            this.select.innerHTML = `<option>${ckanOrgAdmin.strings.loading}</option>`;
            
            try {
                const formData = new FormData();
                formData.append('action', 'ckan_get_all_org_terms_adm347');
                formData.append('nonce', ckanOrgAdmin.nonce);
                formData.append('post_id', this.postId);
                
                const response = await fetch(ckanOrgAdmin.ajaxUrl, {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.populateSelect(data.data);
                } else {
                    throw new Error(data.data?.message || ckanOrgAdmin.strings.error);
                }
            } catch (error) {
                this.showNotification(error.message, 'error');
                this.select.innerHTML = '<option>-- Error --</option>';
            } finally {
                this.select.disabled = false;
            }
        }
        
        populateSelect(data) {
            let html = '<option value="">-- Select Organization --</option>';
            
            if (data.terms?.length) {
                data.terms.forEach(term => {
                    const selected = term.selected ? 'selected' : '';
                    html += `<option value="${term.id}" ${selected}>${this.escapeHtml(term.name)}</option>`;
                });
            }
            
            this.select.innerHTML = html;
        }
        
        async updateOrg() {
            const termId = this.select.value;
            
            // Disable button
            this.updateBtn.disabled = true;
            const originalText = this.updateBtn.textContent;
            this.updateBtn.textContent = ckanOrgAdmin.strings.updating;
            
            try {
                const formData = new FormData();
                formData.append('action', 'ckan_update_post_org_adm347');
                formData.append('nonce', ckanOrgAdmin.nonce);
                formData.append('post_id', this.postId);
                formData.append('term_id', termId);
                
                const response = await fetch(ckanOrgAdmin.ajaxUrl, {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Update display
                    if (data.data.term_name) {
                        this.orgNameEl.textContent = data.data.term_name;
                        this.orgNameEl.classList.remove('empty');
                    } else {
                        this.orgNameEl.textContent = ckanOrgAdmin.strings.noOrgData;
                        this.orgNameEl.classList.add('empty');
                    }
                    
                    this.showNotification(data.data.message || ckanOrgAdmin.strings.success, 'success');
                    
                    // Close modal
                    setTimeout(() => this.closeModal(), 500);
                } else {
                    throw new Error(data.data?.message || ckanOrgAdmin.strings.error);
                }
            } catch (error) {
                this.showNotification(error.message, 'error');
            } finally {
                this.updateBtn.disabled = false;
                this.updateBtn.textContent = originalText;
            }
        }
        
        showNotification(message, type = 'info') {
            // Get or create container
            let container = document.querySelector('.ckan-notifications-adm347');
            if (!container) {
                container = document.createElement('div');
                container.className = 'ckan-notifications-adm347';
                container.setAttribute('role', 'region');
                container.setAttribute('aria-live', 'polite');
                document.body.appendChild(container);
            }
            
            // Create notification
            const notification = document.createElement('div');
            notification.className = `ckan-notification-adm347 ${type}`;
            notification.setAttribute('role', 'alert');
            
            const icon = type === 'success' 
                ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
                : '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
            
            notification.innerHTML = `
                ${icon}
                <span class="message">${this.escapeHtml(message)}</span>
                <button class="close" aria-label="Close">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `;
            
            container.appendChild(notification);
            
            // Show animation
            requestAnimationFrame(() => {
                notification.classList.add('show');
            });
            
            // Close button
            notification.querySelector('.close').addEventListener('click', () => {
                this.removeNotification(notification);
            });
            
            // Auto remove
            setTimeout(() => this.removeNotification(notification), 4000);
        }
        
        removeNotification(notification) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
        
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }
})();