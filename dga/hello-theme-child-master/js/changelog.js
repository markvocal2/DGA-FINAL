/**
 * Changelog Form Functionality
 * Complete implementation with auto-save feature
 */
jQuery(document).ready(function($) {
    // Initialize Prism.js for syntax highlighting
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
    
    // Add copy buttons to code blocks
    $('.changelog-feature pre').each(function() {
        const $this = $(this);
        const $code = $this.find('code');
        const $button = $('<button class="copy-code-button">Copy</button>');
        
        $this.css('position', 'relative');
        $this.append($button);
        
        $button.on('click', createCopyButtonClickHandler($code, $button));
    });
    
    // Toggle version content
    $('.version-header').on('click', createVersionHeaderClickHandler());
    
    // Expand/collapse all versions
    $('.expand-all-btn').on('click', function() {
        $('.version-content').slideDown(300);
        $('.version-header').removeClass('version-header-collapsed');
        $('.version-header').css('border-left-color', '#1e40af');
    });
    
    $('.collapse-all-btn').on('click', function() {
        $('.version-content').slideUp(300);
        $('.version-header').addClass('version-header-collapsed');
        $('.version-header').css('border-left-color', '#f97316');
    });
    
    // Version filtering (if there are many versions)
    if ($('.changelog-version').length > 5) {
        const $filterContainer = $('<div class="changelog-filter"></div>');
        const $filterInput = $('<input type="text" placeholder="Filter by version or feature...">');
        
        $filterContainer.css({
            'padding': '10px 30px',
            'background-color': '#f8fafc',
            'border-bottom': '1px solid #e5e7eb'
        });
        
        $filterInput.css({
            'width': '100%',
            'padding': '8px',
            'border': '1px solid #e2e8f0',
            'border-radius': '4px'
        });
        
        $filterContainer.append($filterInput);
        $('.changelog-controls').after($filterContainer);
        
        $filterInput.on('input', createFilterInputHandler());
    }
    
    // Show modal when update button is clicked
    $('.update-changelog-btn').on('click', function() {
        // Set today's date as default
        let today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        today = yyyy + '-' + mm + '-' + dd;
        $('#date').val(today);
        
        $('.changelog-modal-overlay').css('display', 'flex');
    });
    
    // Close modal
    $('.close-modal-btn, .cancel-btn').on('click', function() {
        $('.changelog-modal-overlay').hide();
    });
    
    // Close modal when clicking outside
    $('.changelog-modal-overlay').on('click', function(e) {
        if (e.target === this) {
            $('.changelog-modal-overlay').hide();
        }
    });
    
    // Add new feature
    $('#add-feature-btn').on('click', function() {
        const featureTemplate = `
            <div class="feature-item" style="border: 1px solid #e5e7eb; border-radius: 4px; padding: 15px; margin-bottom: 15px;">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">หัวข้อ</label>
                    <input type="text" class="feature-title" name="feature_title[]" placeholder="เช่น ปรับปรุงหน้า Dashboard" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" required>
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">รายละเอียด</label>
                    <textarea class="feature-text" name="feature_text[]" rows="3" placeholder="อธิบายรายละเอียดการเปลี่ยนแปลง" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
                </div>
                
                <div class="form-group code-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">ตัวอย่างโค้ด (ถ้ามี)</label>
                    <select class="code-language" name="code_language[]" style="margin-bottom: 5px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="javascript">JavaScript</option>
                        <option value="php">PHP</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="sql">SQL</option>
                    </select>
                    <textarea class="code-content" name="code_content[]" rows="5" placeholder="// เพิ่มโค้ดตัวอย่างที่นี่" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace;"></textarea>
                </div>
                
                <button type="button" class="remove-feature-btn" style="background-color: #f97316; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;">ลบรายการนี้</button>
            </div>
        `;
        
        $('.features-container').append(featureTemplate);
    });
    
    // Remove feature
    $(document).on('click', '.remove-feature-btn', function() {
        // Don't remove if it's the only feature
        if ($('.feature-item').length > 1) {
            $(this).closest('.feature-item').remove();
        } else {
            alert('ต้องมีคุณสมบัติอย่างน้อย 1 รายการ');
        }
    });
    
    // Handle form submission with AJAX
    $('#changelog-form').on('submit', function(e) {
        e.preventDefault();
        
        // Show loading indicator
        const $submitBtn = $('.submit-btn');
        const originalBtnText = $submitBtn.text();
        $submitBtn.prop('disabled', true).text('กำลังบันทึก...');
        
        // Get post ID from the container
        let postId = $('.changelog-container').data('post-id');
        if (!postId) {
            postId = getCurrentPostId();
        }
        
        // Verify post ID
        if (!postId) {
            alert('ไม่พบ ID ของโพสต์ กรุณาลองอัพเดตหน้าเว็บและลองอีกครั้ง');
            $submitBtn.prop('disabled', false).text(originalBtnText);
            return;
        }
        
        // Collect form data
        const version = $('#version').val();
        let date = $('#date').val();
        
        if (!version) {
            alert('กรุณาระบุเวอร์ชัน');
            $submitBtn.prop('disabled', false).text(originalBtnText);
            return;
        }
        
        if (!date) {
            // Use current date if not specified
            const today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const yyyy = today.getFullYear();
            date = yyyy + '-' + mm + '-' + dd;
        }
        
        // Format date for display
        const displayDate = formatDate(date);
        
        // Collect features
        const features = [];
        
        $('.feature-item').each(function() {
            const $item = $(this);
            const title = $item.find('.feature-title').val();
            const text = $item.find('.feature-text').val();
            const codeLanguage = $item.find('.code-language').val();
            const codeContent = $item.find('.code-content').val();
            
            if (title) {
                features.push({
                    title: title,
                    text: text,
                    code_language: codeLanguage,
                    code_content: codeContent
                });
            }
        });
        
        if (features.length === 0) {
            alert('กรุณาเพิ่มคุณสมบัติอย่างน้อย 1 รายการ');
            $submitBtn.prop('disabled', false).text(originalBtnText);
            return;
        }
        
        // Prepare data for AJAX
        const formData = {
            action: 'save_changelog',
            nonce: changelogParams.nonce,
            post_id: postId,
            version: version,
            date: displayDate,
            features: features
        };
        
        // Send AJAX request
        $.ajax({
            url: changelogParams.ajaxUrl,
            type: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    // Success message
                    alert('บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว');
                    
                    // Reset form
                    $('#changelog-form')[0].reset();
                    $('.feature-item:not(:first)').remove();
                    $('.changelog-modal-overlay').hide();
                    
                    // Reload page to show updates
                    if (response.reload) {
                        location.reload();
                    } else {
                        // Manual DOM update if no reload
                        updateChangelogDOM(version, displayDate, features);
                    }
                } else {
                    // Error message
                    alert('เกิดข้อผิดพลาด: ' + (response.data || 'ไม่ทราบสาเหตุ'));
                }
            },
            error: function(xhr, status, error) {
                alert('เกิดข้อผิดพลาดในการติดต่อกับเซิร์ฟเวอร์: ' + error);
            },
            complete: function() {
                // Reset button state
                $submitBtn.prop('disabled', false).text(originalBtnText);
            }
        });
    });
    
    // Initialize the UI (collapsed by default except first item)
    $('.version-content').hide();
    $('.version-header').addClass('version-header-collapsed');
    $('.version-header').css('border-left-color', '#f97316');
    
    // Show first version by default
    $('.changelog-version:first .version-content').show();
    $('.changelog-version:first .version-header').removeClass('version-header-collapsed');
    $('.changelog-version:first .version-header').css('border-left-color', '#1e40af');
    
    // Helper Functions
    
    // Copy button click handler
    function createCopyButtonClickHandler($code, $button) {
        return function() {
            const code = $code.text();
            copyToClipboard(code);
            
            // Visual feedback
            const originalText = $button.text();
            $button.text('Copied!');
            $button.css('background-color', '#10b981');
            
            setTimeout(function() {
                $button.text(originalText);
                $button.css('background-color', '#1e3a8a');
            }, 2000);
        };
    }
    
    // Version header click handler
    function createVersionHeaderClickHandler() {
        return function() {
            const $content = $(this).next('.version-content');
            $content.slideToggle(300);
            
            $(this).toggleClass('version-header-collapsed');
            
            if ($(this).hasClass('version-header-collapsed')) {
                $(this).css('border-left-color', '#f97316');
            } else {
                $(this).css('border-left-color', '#1e40af');
            }
        };
    }
    
    // Add copy buttons to code blocks
    function addCopyButtonsToCodeBlocks($container) {
        $container.find('pre:not(:has(.copy-code-button))').each(function() {
            const $pre = $(this);
            const $code = $pre.find('code');
            const $button = $('<button class="copy-code-button">Copy</button>');
            
            $pre.css('position', 'relative');
            $pre.append($button);
            
            $button.on('click', createCopyButtonClickHandler($code, $button));
        });
    }
    
    // Process single changelog version for filtering
    function processVersionForFilter($version, filterText) {
        const versionText = $version.find('.version-number').text().toLowerCase();
        const featureTexts = [];
        
        $version.find('.feature-title').each(function() {
            featureTexts.push($(this).text().toLowerCase());
        });
        
        let hasMatch = versionText.indexOf(filterText) > -1;
        
        // Check features too
        for (let i = 0; i < featureTexts.length; i++) {
            if (featureTexts[i].indexOf(filterText) > -1) {
                hasMatch = true;
                break;
            }
        }
        
        if (hasMatch) {
            $version.show();
            
            // If filtering and match found, auto-expand
            if (filterText.length > 0) {
                $version.find('.version-content').slideDown(300);
                $version.find('.version-header').removeClass('version-header-collapsed');
                $version.find('.version-header').css('border-left-color', '#1e40af');
            }
        } else {
            $version.hide();
        }
    }
    
    // Filter input handler
    function createFilterInputHandler() {
        return function() {
            const filterText = $(this).val().toLowerCase();
            $('.changelog-version').each(function() {
                processVersionForFilter($(this), filterText);
            });
        };
    }
    
    // Get current post ID from various sources
    function getCurrentPostId() {
        // Try to get from URL first
        const urlParams = new URLSearchParams(window.location.search);
        let postId = urlParams.get('post');
        
        if (postId) {
            return postId;
        }
        
        // Try to get from the body class
        const bodyClasses = document.body.className.split(' ');
        for (let i = 0; i < bodyClasses.length; i++) {
            if (bodyClasses[i].indexOf('postid-') === 0) {
                return bodyClasses[i].replace('postid-', '');
            }
        }
        
        // Try to get from canonical link
        const canonicalLink = document.querySelector('link[rel="canonical"]');
        if (canonicalLink) {
            const href = canonicalLink.getAttribute('href');
            const match = href.match(/\/(\d+)\/?$/);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        // If all else fails, ask the user
        const manualPostId = prompt('ไม่สามารถระบุ ID ของโพสต์ได้โดยอัตโนมัติ กรุณาระบุ ID ของโพสต์:');
        if (manualPostId && !isNaN(parseInt(manualPostId))) {
            return parseInt(manualPostId);
        }
        
        return null;
    }
    
    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        
        try {
            return date.toLocaleDateString('th-TH', options);
        } catch (e) {
            // Fallback for browsers without th-TH locale
            const months = [
                'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
            ];
            
            const day = date.getDate();
            const month = months[date.getMonth()];
            const year = date.getFullYear();
            
            return day + ' ' + month + ' ' + year;
        }
    }
    
    // Copy text to clipboard
    function copyToClipboard(text) {
        // Try to use the modern navigator.clipboard API first
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text)
                .catch(function() {
                    // Fallback to the old execCommand method
                    execCopyToClipboard(text);
                });
        } else {
            // Fallback for browsers without clipboard API
            execCopyToClipboard(text);
        }
    }
    
    // Legacy method to copy text
    function execCopyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        
        const selected = document.getSelection().rangeCount > 0 ?
            document.getSelection().getRangeAt(0) : false;
            
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (selected) {
            document.getSelection().removeAllRanges();
            document.getSelection().addRange(selected);
        }
    }
    
    // Manual DOM update for changelog (if needed)
    function updateChangelogDOM(version, date, features) {
        // Check if there's already a version with the same date
        let sameDateFound = false;
        let $existingVersion = null;
        
        $('.changelog-version').each(function() {
            const versionDate = $(this).find('.version-date').text();
            if (versionDate === date) {
                sameDateFound = true;
                $existingVersion = $(this);
                return false; // Break loop
            }
        });
        
        if (sameDateFound && $existingVersion) {
            // Add features to existing version group
            const $versionContent = $existingVersion.find('.version-content');
            
            features.forEach(function(feature) {
                const featureHTML = `
                    <div class="changelog-feature">
                        <h3 class="feature-title">${escapeHTML(feature.title)}</h3>
                        <div class="feature-content">
                            ${feature.text ? `<p>${escapeHTML(feature.text)}</p>` : ''}
                            ${feature.code_content ? `<pre><code class="language-${feature.code_language}">${escapeHTML(feature.code_content)}</code></pre>` : ''}
                        </div>
                    </div>
                `;
                
                $versionContent.append(featureHTML);
            });
            
            // Highlight new code blocks
            if (typeof Prism !== 'undefined') {
                Prism.highlightAllUnder($versionContent[0]);
            }
            
            // Add copy buttons to new code blocks
            addCopyButtonsToCodeBlocks($versionContent);
        } else {
            // Create new version entry
            const versionHTML = `
                <div class="changelog-version">
                    <div class="version-header">
                        <span class="version-number">Version ${escapeHTML(version)}</span>
                        <span class="version-date">${escapeHTML(date)}</span>
                    </div>
                    
                    <div class="version-content">
                        ${features.map(function(feature) {
                            return `
                                <div class="changelog-feature">
                                    <h3 class="feature-title">${escapeHTML(feature.title)}</h3>
                                    <div class="feature-content">
                                        ${feature.text ? `<p>${escapeHTML(feature.text)}</p>` : ''}
                                        ${feature.code_content ? `<pre><code class="language-${feature.code_language}">${escapeHTML(feature.code_content)}</code></pre>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            
            // Add to the top of the list
            $('.changelog-versions').prepend(versionHTML);
            
            // Apply syntax highlighting
            if (typeof Prism !== 'undefined') {
                Prism.highlightAllUnder($('.changelog-version:first')[0]);
            }
            
            // Add copy buttons to new code blocks
            addCopyButtonsToCodeBlocks($('.changelog-version:first'));
            
            // Add toggle functionality to new version header
            $('.changelog-version:first .version-header').on('click', createVersionHeaderClickHandler());
            
            // Make sure the new version is expanded
            $('.changelog-version:first .version-content').show();
            $('.changelog-version:first .version-header').removeClass('version-header-collapsed');
            $('.changelog-version:first .version-header').css('border-left-color', '#1e40af');
        }
    }
    
    // Escape HTML to prevent XSS
    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});