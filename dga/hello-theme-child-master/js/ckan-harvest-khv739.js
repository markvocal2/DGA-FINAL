/**
 * CKAN Harvest Manager with Dynamic JSON Field Mapping
 * Reads actual JSON structure from endpoint before mapping
 */

class CKANHarvestManager {
    constructor() {
        this.modal = null;
        this.endpoints = [];
        this.acfFields = [];
        this.currentEndpointData = null;
        this.jsonStructure = null;
        this.init();
    }

    init() {
        this.setupModal();
        this.setupEventListeners();
        this.loadEndpoints();
        this.loadACFFields();
        this.updateStats();
    }

    setupModal() {
        this.modal = document.getElementById('ckan-harvest-modal');
        if (!this.modal) return;

        // Modal cannot be closed by clicking outside
        const closeBtn = this.modal.querySelector('.ckan-modal-close-khv739');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
    }

    openModal() {
        if (!this.modal) return;
        
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Load current data
        this.loadEndpoints();
        this.updateStats();
    }

    closeModal() {
        if (!this.modal) return;
        
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    setupEventListeners() {
        // Open modal button
        const openBtn = document.getElementById('ckan-harvest-btn');
        if (openBtn) {
            openBtn.addEventListener('click', () => this.openModal());
        }

        // Add endpoint button
        const addBtn = document.getElementById('ckan-add-endpoint');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showEndpointForm());
        }

        // Run harvester button
        const runBtn = document.getElementById('ckan-run-harvester');
        if (runBtn) {
            runBtn.addEventListener('click', () => this.runHarvester());
        }

        // Auto-map fields button
        const automapBtn = document.getElementById('ckan-automap-fields');
        if (automapBtn) {
            automapBtn.addEventListener('click', () => this.autoMapFields());
        }
    }

    async loadEndpoints() {
        try {
            const formData = new FormData();
            formData.append('action', 'handle_ckan_harvest_actions_khv739');
            formData.append('nonce', ckanHarvestData.nonce);
            formData.append('sub_action', 'get_endpoints');

            const response = await fetch(ckanHarvestData.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                this.endpoints = data.data.endpoints;
                this.renderEndpoints();
            }
        } catch (error) {
            console.error('Error loading endpoints:', error);
        }
    }

    loadACFFields() {
        // Get ACF fields from the main manager
        const fieldCards = document.querySelectorAll('.acf-field-card-mfs582');
        this.acfFields = Array.from(fieldCards).map(card => ({
            key: card.dataset.fieldKey,
            label: card.querySelector('.acf-field-label-mfs582').textContent,
            name: card.querySelector('.acf-field-name-mfs582').textContent
        }));
    }

    renderEndpoints() {
        const container = document.getElementById('ckan-endpoints-list');
        if (!container) return;

        if (this.endpoints.length === 0) {
            container.innerHTML = `
                <div class="ckan-empty-state-khv739">
                    <svg viewBox="0 0 24 24" width="36" height="36">
                        <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                    <p>${ckanHarvestData.strings.noEndpoints}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.endpoints.map(endpoint => `
            <div class="ckan-endpoint-card-khv739" data-endpoint-id="${endpoint.id}">
                <div class="ckan-endpoint-header-khv739">
                    <div class="ckan-endpoint-url-khv739">${this.escapeHtml(endpoint.url)}</div>
                    <div class="ckan-endpoint-status-khv739 ${endpoint.active ? 'active' : 'inactive'}">
                        ${endpoint.active ? ckanHarvestData.strings.active : ckanHarvestData.strings.inactive}
                    </div>
                </div>
                <div class="ckan-endpoint-body-khv739">
                    <div class="ckan-endpoint-info-khv739">
                        <div>
                            <span class="ckan-info-label-khv739">${ckanHarvestData.strings.apiType}:</span>
                            <span class="ckan-info-value-khv739">${endpoint.api_type || 'CKAN'}</span>
                        </div>
                        <div>
                            <span class="ckan-info-label-khv739">${ckanHarvestData.strings.updateFrequency}:</span>
                            <span class="ckan-info-value-khv739">${this.getFrequencyLabel(endpoint.frequency)}</span>
                        </div>
                    </div>
                    <div class="ckan-endpoint-actions-khv739">
                        <button class="ckan-btn-mapping-khv739" onclick="ckanManager.showFieldMapping('${endpoint.id}')">
                            <svg viewBox="0 0 24 24" width="14" height="14">
                                <path fill="currentColor" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                            </svg>
                            Field Mapping
                        </button>
                        <button class="ckan-btn-test-khv739" onclick="ckanManager.testEndpoint('${endpoint.id}')">
                            ${ckanHarvestData.strings.testConnection}
                        </button>
                        <button class="ckan-btn-edit-khv739" onclick="ckanManager.editEndpoint('${endpoint.id}')">
                            <svg viewBox="0 0 24 24" width="14" height="14">
                                <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="ckan-btn-delete-khv739" onclick="ckanManager.deleteEndpoint('${endpoint.id}')">
                            <svg viewBox="0 0 24 24" width="14" height="14">
                                <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showEndpointForm(endpoint = null) {
        const isEdit = endpoint !== null;
        
        const formHtml = `
            <div class="ckan-endpoint-form-khv739">
                <h3>${isEdit ? 'Edit Endpoint' : ckanHarvestData.strings.addEndpoint}</h3>
                <form id="ckan-endpoint-form">
                    <div class="ckan-form-group-khv739">
                        <label>${ckanHarvestData.strings.endpointUrl}</label>
                        <input type="url" id="endpoint-url" value="${endpoint ? endpoint.url : ''}" required>
                    </div>
                    
                    <div class="ckan-form-group-khv739">
                        <label>${ckanHarvestData.strings.apiType}</label>
                        <select id="endpoint-api-type">
                            <option value="ckan" ${endpoint?.api_type === 'ckan' ? 'selected' : ''}>CKAN Standard API</option>
                            <option value="mof_gov" ${endpoint?.api_type === 'mof_gov' ? 'selected' : ''}>MOF DataServices API</option>
                            <option value="custom" ${endpoint?.api_type === 'custom' ? 'selected' : ''}>Custom REST API</option>
                        </select>
                    </div>
                    
                    <div class="ckan-form-group-khv739">
                        <label>${ckanHarvestData.strings.updateFrequency}</label>
                        <select id="endpoint-frequency">
                            <option value="never">${ckanHarvestData.strings.never}</option>
                            <option value="hourly">${ckanHarvestData.strings.hourly}</option>
                            <option value="twicedaily">${ckanHarvestData.strings.twiceDaily}</option>
                            <option value="daily">${ckanHarvestData.strings.daily}</option>
                            <option value="weekly">${ckanHarvestData.strings.weekly}</option>
                            <option value="monthly">${ckanHarvestData.strings.monthly}</option>
                        </select>
                    </div>
                    
                    <div class="ckan-form-group-khv739">
                        <label>
                            <input type="checkbox" id="endpoint-active" ${!endpoint || endpoint.active ? 'checked' : ''}>
                            ${ckanHarvestData.strings.active}
                        </label>
                    </div>
                    
                    <div class="ckan-form-group-khv739">
                        <button type="button" class="ckan-btn-detect-khv739" onclick="ckanManager.detectStructure()">
                            <svg viewBox="0 0 24 24" width="14" height="14">
                                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            ${ckanHarvestData.strings.detectStructure}
                        </button>
                    </div>
                    
                    <div id="ckan-structure-preview" class="ckan-structure-preview-khv739" style="display:none;"></div>
                    
                    <div class="ckan-form-actions-khv739">
                        <button type="button" class="ckan-btn-cancel-khv739" onclick="ckanManager.loadEndpoints()">
                            ${ckanHarvestData.strings.cancel || 'Cancel'}
                        </button>
                        <button type="submit" class="ckan-btn-save-khv739">
                            ${ckanHarvestData.strings.save}
                        </button>
                    </div>
                </form>
            </div>
        `;

        const container = document.getElementById('ckan-endpoints-list');
        container.innerHTML = formHtml;

        // Handle form submission
        document.getElementById('ckan-endpoint-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveEndpoint(endpoint);
        });
    }

    async detectStructure() {
        const url = document.getElementById('endpoint-url').value;
        const apiType = document.getElementById('endpoint-api-type').value;
        
        if (!url) {
            this.showToast('warning', 'Please enter an endpoint URL first');
            return;
        }

        const button = event.target.closest('button');
        const originalHtml = button.innerHTML;
        button.innerHTML = '<span class="ckan-spinner-khv739"></span> Detecting...';
        button.disabled = true;

        try {
            const formData = new FormData();
            formData.append('action', 'handle_ckan_harvest_actions_khv739');
            formData.append('nonce', ckanHarvestData.nonce);
            formData.append('sub_action', 'detect_structure');
            formData.append('url', url);
            formData.append('api_type', apiType);

            const response = await fetch(ckanHarvestData.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                this.jsonStructure = data.data;
                this.displayStructurePreview(data.data);
                this.showToast('success', 'Structure detected successfully');
            } else {
                throw new Error(data.data?.message || 'Failed to detect structure');
            }
        } catch (error) {
            this.showToast('error', error.message);
        } finally {
            button.innerHTML = originalHtml;
            button.disabled = false;
        }
    }

    displayStructurePreview(structure) {
        const preview = document.getElementById('ckan-structure-preview');
        if (!preview) return;

        const html = `
            <div class="ckan-structure-info-khv739">
                <h4>Detected Structure</h4>
                <div class="ckan-structure-details-khv739">
                    <div>
                        <strong>API Type:</strong> ${structure.detected_type}
                    </div>
                    <div>
                        <strong>Data Path:</strong> ${structure.data_path || 'root'}
                    </div>
                    <div>
                        <strong>Total Items:</strong> ${structure.total_items}
                    </div>
                    <div>
                        <strong>Sample Fields:</strong>
                        <div class="ckan-fields-preview-khv739">
                            ${structure.sample_fields.map(field => `
                                <span class="ckan-field-tag-khv739">${field}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        preview.innerHTML = html;
        preview.style.display = 'block';
    }

    async showFieldMapping(endpointId) {
        const endpoint = this.endpoints.find(ep => ep.id === endpointId);
        if (!endpoint) return;

        // First, fetch the actual JSON data from the endpoint
        this.addLogEntry('info', `Fetching data from ${endpoint.url}...`);
        
        try {
            // Fetch JSON structure from endpoint
            const jsonData = await this.fetchEndpointData(endpoint);
            
            if (!jsonData) {
                this.showToast('error', 'Failed to fetch data from endpoint');
                return;
            }

            // Display mapping interface with actual JSON fields
            this.displayMappingInterface(endpoint, jsonData);
            
        } catch (error) {
            this.showToast('error', error.message);
            this.addLogEntry('error', error.message);
        }
    }

    async fetchEndpointData(endpoint) {
        try {
            const formData = new FormData();
            formData.append('action', 'handle_ckan_harvest_actions_khv739');
            formData.append('nonce', ckanHarvestData.nonce);
            formData.append('sub_action', 'fetch_json_structure');
            formData.append('url', endpoint.url);
            formData.append('api_type', endpoint.api_type || 'ckan');

            const response = await fetch(ckanHarvestData.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                return data.data;
            }
            
            return null;
        } catch (error) {
            console.error('Error fetching endpoint data:', error);
            return null;
        }
    }

    displayMappingInterface(endpoint, jsonData) {
        const container = document.getElementById('ckan-field-mapping');
        if (!container) return;

        // Extract all fields from JSON (including nested)
        const jsonFields = this.extractJsonFields(jsonData.sample_data || jsonData);
        
        const html = `
            <div class="ckan-mapping-interface-khv739">
                <div class="ckan-mapping-header-khv739">
                    <h4>Map JSON Fields to ACF Fields</h4>
                    <p class="ckan-mapping-help-khv739">
                        ${jsonData.total_count ? `Found ${jsonData.total_count} items in response` : ''}
                    </p>
                </div>
                
                <div class="ckan-mapping-controls-khv739">
                    <div class="ckan-form-group-khv739">
                        <label>${ckanHarvestData.strings.uniqueField}</label>
                        <select id="unique-field-select" class="ckan-field-select-khv739">
                            ${jsonFields.map(field => `
                                <option value="${field.path}" ${endpoint.unique_field === field.path ? 'selected' : ''}>
                                    ${field.path} ${field.preview ? `(${this.truncatePreview(field.preview)})` : ''}
                                </option>
                            `).join('')}
                        </select>
                        <small>${ckanHarvestData.strings.uniqueFieldHelp}</small>
                    </div>
                    
                    <div class="ckan-form-group-khv739">
                        <label>${ckanHarvestData.strings.titleField}</label>
                        <select id="title-field-select" class="ckan-field-select-khv739">
                            ${jsonFields.map(field => `
                                <option value="${field.path}" ${endpoint.title_field === field.path ? 'selected' : ''}>
                                    ${field.path} ${field.preview ? `(${this.truncatePreview(field.preview)})` : ''}
                                </option>
                            `).join('')}
                        </select>
                        <small>${ckanHarvestData.strings.titleFieldHelp}</small>
                    </div>
                    
                    <div class="ckan-form-group-khv739">
                        <label>${ckanHarvestData.strings.contentField}</label>
                        <select id="content-field-select" class="ckan-field-select-khv739">
                            <option value="">-- None --</option>
                            ${jsonFields.map(field => `
                                <option value="${field.path}" ${endpoint.content_field === field.path ? 'selected' : ''}>
                                    ${field.path} ${field.preview ? `(${this.truncatePreview(field.preview)})` : ''}
                                </option>
                            `).join('')}
                        </select>
                        <small>${ckanHarvestData.strings.contentFieldHelp}</small>
                    </div>
                </div>
                
                <div class="ckan-mapping-table-khv739">
                    <div class="ckan-mapping-header-row-khv739">
                        <div class="ckan-col-json-khv739">JSON Field</div>
                        <div class="ckan-col-preview-khv739">Data Preview</div>
                        <div class="ckan-col-arrow-khv739">→</div>
                        <div class="ckan-col-acf-khv739">ACF Field</div>
                    </div>
                    
                    <div class="ckan-mapping-body-khv739">
                        ${jsonFields.map(field => {
                            const currentMapping = endpoint.field_mapping && endpoint.field_mapping[field.path] || '';
                            return `
                                <div class="ckan-mapping-row-khv739">
                                    <div class="ckan-col-json-khv739">
                                        <span class="ckan-field-name-khv739 ${field.isNested ? 'nested' : ''}">
                                            ${field.isNested ? '└ ' : ''}${field.path}
                                        </span>
                                        <span class="ckan-field-type-khv739">${field.type}</span>
                                    </div>
                                    <div class="ckan-col-preview-khv739">
                                        <span class="ckan-preview-text-khv739" title="${this.escapeHtml(String(field.preview || ''))}">
                                            ${field.preview ? this.truncatePreview(field.preview) : '-'}
                                        </span>
                                    </div>
                                    <div class="ckan-col-arrow-khv739">→</div>
                                    <div class="ckan-col-acf-khv739">
                                        <select class="ckan-acf-select-khv739" data-json-field="${field.path}">
                                            <option value="">-- None --</option>
                                            ${this.acfFields.map(acfField => `
                                                <option value="${acfField.name}" ${currentMapping === acfField.name ? 'selected' : ''}>
                                                    ${acfField.label} (${acfField.name})
                                                </option>
                                            `).join('')}
                                        </select>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <div class="ckan-mapping-actions-khv739">
                    <button class="ckan-btn-automap-khv739" onclick="ckanManager.suggestMapping('${endpoint.id}')">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        Auto Suggest Mapping
                    </button>
                    <button class="ckan-btn-save-mapping-khv739" onclick="ckanManager.saveFieldMapping('${endpoint.id}')">
                        ${ckanHarvestData.strings.save} Mapping
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    extractJsonFields(data, prefix = '', isNested = false) {
        const fields = [];
        
        // If array, get first item
        if (Array.isArray(data) && data.length > 0) {
            data = data[0];
        }
        
        // Extract fields
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const value = data[key];
                const fieldPath = prefix ? `${prefix}.${key}` : key;
                
                // Determine field type
                let fieldType = typeof value;
                if (value === null) fieldType = 'null';
                if (Array.isArray(value)) fieldType = 'array';
                if (value instanceof Date) fieldType = 'date';
                
                // Add field
                fields.push({
                    path: fieldPath,
                    key: key,
                    type: fieldType,
                    preview: this.getFieldPreview(value),
                    isNested: isNested
                });
                
                // If object or array with objects, recurse
                if (fieldType === 'object' && value !== null) {
                    fields.push(...this.extractJsonFields(value, fieldPath, true));
                } else if (fieldType === 'array' && value.length > 0 && typeof value[0] === 'object') {
                    fields.push(...this.extractJsonFields(value[0], fieldPath, true));
                }
            }
        }
        
        return fields;
    }

    getFieldPreview(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        
        if (Array.isArray(value)) {
            if (value.length === 0) return '[]';
            if (typeof value[0] === 'object') return `[${value.length} objects]`;
            return `[${value.slice(0, 3).join(', ')}${value.length > 3 ? '...' : ''}]`;
        }
        
        if (typeof value === 'object') {
            const keys = Object.keys(value);
            if (keys.length === 0) return '{}';
            return `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
        }
        
        if (typeof value === 'string') {
            return value.length > 50 ? value.substring(0, 50) + '...' : value;
        }
        
        return String(value);
    }

    truncatePreview(text, length = 30) {
        text = String(text);
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }

    async suggestMapping(endpointId) {
        const endpoint = this.endpoints.find(ep => ep.id === endpointId);
        if (!endpoint) return;

        const button = event.target.closest('button');
        const originalHtml = button.innerHTML;
        button.innerHTML = '<span class="ckan-spinner-khv739"></span> Analyzing...';
        button.disabled = true;

        try {
            // Get all JSON fields from the selects
            const jsonFields = [];
            document.querySelectorAll('.ckan-acf-select-khv739').forEach(select => {
                const jsonField = select.dataset.jsonField;
                const fieldNameEl = select.closest('.ckan-mapping-row-khv739').querySelector('.ckan-field-name-khv739');
                const fieldPreviewEl = select.closest('.ckan-mapping-row-khv739').querySelector('.ckan-preview-text-khv739');
                
                jsonFields.push({
                    path: jsonField,
                    name: fieldNameEl.textContent.replace('└ ', '').trim(),
                    preview: fieldPreviewEl.textContent
                });
            });

            // Try to auto-map based on field names and content
            const mapping = this.suggestFieldMapping(jsonFields, this.acfFields);
            
            // Apply suggested mapping to selects
            for (const [jsonField, acfField] of Object.entries(mapping)) {
                const select = document.querySelector(`.ckan-acf-select-khv739[data-json-field="${jsonField}"]`);
                if (select) {
                    select.value = acfField;
                }
            }

            this.showToast('success', 'Mapping suggestions applied');
        } catch (error) {
            this.showToast('error', error.message);
        } finally {
            button.innerHTML = originalHtml;
            button.disabled = false;
        }
    }

    suggestFieldMapping(jsonFields, acfFields) {
        const mapping = {};
        const patterns = this.getFieldMappingPatterns();

        jsonFields.forEach(jsonField => {
            const matchedField = this.findMatchingAcfField(jsonField, acfFields, patterns);
            if (matchedField) {
                mapping[jsonField.path] = matchedField;
            }
        });
        
        return mapping;
    }

    getFieldMappingPatterns() {
        return {
            'id|identifier|key|รหัส': ['id', 'identifier', 'key', 'code'],
            'title|name|heading|ชื่อ|หัวข้อ': ['title', 'name', 'heading', 'subject'],
            'description|detail|content|notes|รายละเอียด|คำอธิบาย': ['description', 'content', 'detail', 'notes'],
            'date|time|created|modified|updated|วันที่': ['date', 'datetime', 'created', 'modified', 'updated'],
            'amount|value|price|cost|จำนวน|มูลค่า': ['amount', 'value', 'price', 'cost', 'total'],
            'status|state|สถานะ': ['status', 'state', 'condition'],
            'category|type|ประเภท|หมวด': ['category', 'type', 'classification'],
            'url|link|href|ลิงก์': ['url', 'link', 'source'],
            'email|อีเมล': ['email', 'mail'],
            'phone|tel|โทร': ['phone', 'telephone', 'mobile'],
            'address|location|ที่อยู่|สถานที่': ['address', 'location', 'place'],
            'image|picture|photo|รูป': ['image', 'picture', 'photo', 'thumbnail'],
            'file|document|ไฟล์|เอกสาร': ['file', 'document', 'attachment'],
            'organization|agency|org|หน่วยงาน|องค์กร': ['organization', 'agency', 'department'],
            'year|ปี|fiscal': ['year', 'fiscal_year', 'budget_year'],
            'budget|งบประมาณ': ['budget', 'allocation', 'fund'],
            'project|โครงการ': ['project', 'program', 'initiative']
        };
    }

    findMatchingAcfField(jsonField, acfFields, patterns) {
        const jsonName = jsonField.path.toLowerCase();
        const jsonPreview = (jsonField.preview || '').toLowerCase();
        
        for (const acfField of acfFields) {
            const matchedField = this.checkFieldMatch(jsonName, jsonPreview, acfField, patterns);
            if (matchedField) {
                return matchedField;
            }
        }
        
        return null;
    }

    checkFieldMatch(jsonName, jsonPreview, acfField, patterns) {
        const acfName = acfField.name.toLowerCase();
        const acfLabel = acfField.label.toLowerCase();
        
        // Check exact match
        if (this.isExactMatch(jsonName, acfName, acfLabel)) {
            return acfField.name;
        }
        
        // Check pattern matching
        const patternMatch = this.findPatternMatch(jsonName, jsonPreview, acfName, acfLabel, patterns);
        if (patternMatch) {
            return acfField.name;
        }
        
        // Check similarity (fuzzy matching)
        if (this.calculateSimilarity(jsonName, acfName) > 0.7) {
            return acfField.name;
        }
        
        return null;
    }

    isExactMatch(jsonName, acfName, acfLabel) {
        return jsonName === acfName || jsonName === acfLabel;
    }

    findPatternMatch(jsonName, jsonPreview, acfName, acfLabel, patterns) {
        for (const [pattern, keywords] of Object.entries(patterns)) {
            if (this.matchesPattern(jsonName, jsonPreview, pattern, keywords, acfName, acfLabel)) {
                return true;
            }
        }
        return false;
    }

    matchesPattern(jsonName, jsonPreview, pattern, keywords, acfName, acfLabel) {
        const regex = new RegExp(pattern);
        
        if (regex.test(jsonName) || regex.test(jsonPreview)) {
            return this.hasKeywordMatch(keywords, acfName, acfLabel);
        }
        
        return false;
    }

    hasKeywordMatch(keywords, acfName, acfLabel) {
        return keywords.some(keyword => 
            acfName.includes(keyword) || acfLabel.includes(keyword)
        );
    }

    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    async saveFieldMapping(endpointId) {
        const endpoint = this.endpoints.find(ep => ep.id === endpointId);
        if (!endpoint) return;

        // Collect mapping configuration
        const mapping = {};
        const specialFields = {};
        
        // Get special field selections
        const uniqueField = document.getElementById('unique-field-select')?.value || 'id';
        const titleField = document.getElementById('title-field-select')?.value || 'title';
        const contentField = document.getElementById('content-field-select')?.value || '';
        
        // Get field mappings
        document.querySelectorAll('.ckan-acf-select-khv739').forEach(select => {
            const jsonField = select.dataset.jsonField;
            const acfField = select.value;
            if (acfField) {
                mapping[jsonField] = acfField;
            }
        });

        try {
            const formData = new FormData();
            formData.append('action', 'handle_ckan_harvest_actions_khv739');
            formData.append('nonce', ckanHarvestData.nonce);
            formData.append('sub_action', 'save_endpoint_mapping');
            formData.append('endpoint_id', endpointId);
            formData.append('field_mapping', JSON.stringify(mapping));
            formData.append('unique_field', uniqueField);
            formData.append('title_field', titleField);
            formData.append('content_field', contentField);

            const response = await fetch(ckanHarvestData.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                this.showToast('success', 'Field mapping saved successfully');
                
                // Update local endpoint data
                const endpoint = this.endpoints.find(ep => ep.id === endpointId);
                if (endpoint) {
                    endpoint.field_mapping = mapping;
                    endpoint.unique_field = uniqueField;
                    endpoint.title_field = titleField;
                    endpoint.content_field = contentField;
                }
            } else {
                throw new Error(data.data?.message || 'Failed to save mapping');
            }
        } catch (error) {
            this.showToast('error', error.message);
        }
    }

    async saveEndpoint(existingEndpoint = null) {
        const url = document.getElementById('endpoint-url').value;
        const apiType = document.getElementById('endpoint-api-type').value;
        const frequency = document.getElementById('endpoint-frequency').value;
        const active = document.getElementById('endpoint-active').checked;

        try {
            const formData = new FormData();
            formData.append('action', 'handle_ckan_harvest_actions_khv739');
            formData.append('nonce', ckanHarvestData.nonce);
            formData.append('sub_action', 'save_endpoint');
            formData.append('url', url);
            formData.append('api_type', apiType);
            formData.append('frequency', frequency);
            formData.append('active', active);
            
            if (existingEndpoint) {
                formData.append('endpoint_id', existingEndpoint.id);
            }
            
            if (this.jsonStructure) {
                formData.append('data_path', this.jsonStructure.data_path || '');
            }

            const response = await fetch(ckanHarvestData.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                this.showToast('success', data.data.message);
                await this.loadEndpoints();
                
                // Show field mapping interface for new endpoint
                if (!existingEndpoint && data.data.endpoint) {
                    this.showFieldMapping(data.data.endpoint.id);
                }
            } else {
                throw new Error(data.data?.message || ckanHarvestData.strings.error);
            }
        } catch (error) {
            this.showToast('error', error.message);
        }
    }

    async deleteEndpoint(endpointId) {
        if (!confirm(ckanHarvestData.strings.confirmDelete)) return;

        try {
            const formData = new FormData();
            formData.append('action', 'handle_ckan_harvest_actions_khv739');
            formData.append('nonce', ckanHarvestData.nonce);
            formData.append('sub_action', 'delete_endpoint');
            formData.append('endpoint_id', endpointId);

            const response = await fetch(ckanHarvestData.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                this.showToast('success', data.data.message);
                await this.loadEndpoints();
            }
        } catch (error) {
            this.showToast('error', error.message);
        }
    }

    async testEndpoint(endpointId) {
        const endpoint = this.endpoints.find(ep => ep.id === endpointId);
        if (!endpoint) return;

        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Testing...';
        button.disabled = true;

        try {
            const formData = new FormData();
            formData.append('action', 'handle_ckan_harvest_actions_khv739');
            formData.append('nonce', ckanHarvestData.nonce);
            formData.append('sub_action', 'test_endpoint');
            formData.append('url', endpoint.url);
            formData.append('api_type', endpoint.api_type || 'ckan');

            const response = await fetch(ckanHarvestData.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                this.showToast('success', data.data.message);
                
                // Show structure info if available
                if (data.data.structure) {
                    this.addLogEntry('success', 
                        `Detected ${data.data.structure.total_items} items, ` +
                        `Fields: ${data.data.structure.sample_fields.slice(0, 5).join(', ')}`
                    );
                }
            } else {
                throw new Error(data.data?.message || 'Connection failed');
            }
        } catch (error) {
            this.showToast('error', error.message);
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    async runHarvester() {
        const button = document.getElementById('ckan-run-harvester');
        const originalHtml = button.innerHTML;
        
        button.innerHTML = `
            <span class="ckan-spinner-khv739"></span>
            ${ckanHarvestData.strings.harvesting}
        `;
        button.disabled = true;

        // Add log entry
        this.addLogEntry('info', 'Starting harvest process...');

        try {
            const formData = new FormData();
            formData.append('action', 'handle_ckan_harvest_actions_khv739');
            formData.append('nonce', ckanHarvestData.nonce);
            formData.append('sub_action', 'run_harvest');

            const response = await fetch(ckanHarvestData.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                this.showToast('success', data.data.message);
                this.addLogEntry('success', data.data.message);
                
                // Update stats
                this.updateStats();
                
                // Log any errors
                if (data.data.errors && data.data.errors.length > 0) {
                    data.data.errors.forEach(error => {
                        this.addLogEntry('error', error);
                    });
                }
            } else {
                throw new Error(data.data?.message || ckanHarvestData.strings.error);
            }
        } catch (error) {
            this.showToast('error', error.message);
            this.addLogEntry('error', error.message);
        } finally {
            button.innerHTML = originalHtml;
            button.disabled = false;
        }
    }

    updateStats() {
        // Update last run
        const lastRunEl = document.getElementById('ckan-last-run');
        if (lastRunEl) {
            lastRunEl.textContent = ckanHarvestData.lastRun || '-';
        }

        // Update total datasets
        const totalEl = document.getElementById('ckan-total-datasets');
        if (totalEl) {
            totalEl.textContent = ckanHarvestData.totalDatasets || '0';
        }
    }

    addLogEntry(type, message) {
        const logContainer = document.getElementById('ckan-harvest-log');
        if (!logContainer) return;

        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = `ckan-log-entry-khv739 ckan-log-${type}-khv739`;
        entry.innerHTML = `
            <span class="ckan-log-time-khv739">${timestamp}</span>
            <span class="ckan-log-message-khv739">${this.escapeHtml(message)}</span>
        `;

        logContainer.insertBefore(entry, logContainer.firstChild);

        // Keep only last 50 entries
        while (logContainer.children.length > 50) {
            logContainer.removeChild(logContainer.lastChild);
        }
    }

    getFrequencyLabel(frequency) {
        const labels = {
            'never': ckanHarvestData.strings.never,
            'hourly': ckanHarvestData.strings.hourly,
            'twicedaily': ckanHarvestData.strings.twiceDaily,
            'daily': ckanHarvestData.strings.daily,
            'weekly': ckanHarvestData.strings.weekly,
            'monthly': ckanHarvestData.strings.monthly
        };
        return labels[frequency] || frequency;
    }

    showToast(type, message) {
        // Use the existing toast system from ACF manager
        if (window.acfManager?.showToast) {
            window.acfManager.showToast(type, message);
        } else {
            // Fallback alert
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    editEndpoint(endpointId) {
        const endpoint = this.endpoints.find(ep => ep.id === endpointId);
        if (endpoint) {
            this.showEndpointForm(endpoint);
        }
    }
}

// Initialize CKAN Harvest Manager
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ckanManager = new CKANHarvestManager();
    });
} else {
    window.ckanManager = new CKANHarvestManager();
}