<?php
/**
 * AChecker Standalone Basic Functions
 * 
 * This class provides basic accessibility checking functions
 * for use with AChecker WordPress Validator Engine
 * 
 * @version 1.0.0
 */

class ACheckerStandaloneBasicFunctions {
    
    private static $current_element = null;
    private static $current_dom = null;
    private static $language = 'eng';
    
    /**
     * Set the current element being checked
     * 
     * @param object $element Simple HTML DOM element
     */
    public static function setCurrentElement($element) {
        self::$current_element = $element;
    }
    
    /**
     * Clear the current element
     */
    public static function clearCurrentElement() {
        self::$current_element = null;
    }
    
    /**
     * Set the current DOM
     * 
     * @param object $dom Simple HTML DOM object
     */
    public static function setCurrentDOM($dom) {
        self::$current_dom = $dom;
    }
    
    /**
     * Clear the current DOM
     */
    public static function clearCurrentDOM() {
        self::$current_dom = null;
    }
    
    /**
     * Set the language
     * 
     * @param string $language Language code
     */
    public static function setLanguage($language) {
        self::$language = $language;
    }
    
    /**
     * Get current element
     * 
     * @return object|null Current element
     */
    public static function getCurrentElement() {
        return self::$current_element;
    }
    
    /**
     * Get current DOM
     * 
     * @return object|null Current DOM
     */
    public static function getCurrentDOM() {
        return self::$current_dom;
    }
    
    /* ========================================
     * IMAGE-RELATED CHECKS
     * ======================================== */
    
    /**
     * Check if image has alt attribute
     * 
     * @return bool
     */
    public static function hasAltAttribute() {
        if (!self::$current_element) return true;
        return isset(self::$current_element->alt);
    }
    
    /**
     * Check if image has non-empty alt text
     * 
     * @return bool
     */
    public static function hasNonEmptyAlt() {
        if (!self::$current_element) return true;
        
        $alt = self::$current_element->alt;
        return isset($alt) && trim($alt) !== '';
    }
    
    /**
     * Check if image has valid alt text
     * 
     * @return bool
     */
    public static function hasValidAltText() {
        if (!self::$current_element) return true;
        
        if (!self::hasNonEmptyAlt()) {
            return false;
        }
        
        $alt = self::$current_element->alt;
        
        // Check for placeholder text
        $placeholder_patterns = array(
            '/^image$/i',
            '/^img$/i',
            '/^photo$/i',
            '/^picture$/i',
            '/^\d+$/i',
            '/^untitled$/i',
            '/^no_name$/i',
            '/^dsc\d+$/i'
        );
        
        foreach ($placeholder_patterns as $pattern) {
            if (preg_match($pattern, $alt)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Check if decorative image has empty alt
     * 
     * @return bool
     */
    public static function isDecorativeImageWithEmptyAlt() {
        if (!self::$current_element) return true;
        
        // Check if alt is empty
        if (self::$current_element->alt !== '') {
            return false;
        }
        
        // Check if image has role="presentation" or role="none"
        $role = self::$current_element->role;
        if ($role === 'presentation' || $role === 'none') {
            return true;
        }
        
        // Check if image is in decorative context (e.g., within <figure> with <figcaption>)
        $parent = self::$current_element->parent();
        if ($parent && $parent->tag === 'figure') {
            $figcaption = $parent->find('figcaption', 0);
            if ($figcaption) {
                return true;
            }
        }
        
        return true;
    }
    
    /* ========================================
     * FORM-RELATED CHECKS
     * ======================================== */
    
    /**
     * Check if form element has label
     * 
     * @return bool
     */
    public static function hasLabel() {
        if (!self::$current_element || !self::$current_dom) return true;
        
        // Check if element has aria-label
        if (self::$current_element->getAttribute('aria-label')) {
            return true;
        }
        
        // Check if element has aria-labelledby
        if (self::$current_element->getAttribute('aria-labelledby')) {
            return true;
        }
        
        // Check if element has id and matching label
        $id = self::$current_element->id;
        if ($id) {
            $label = self::$current_dom->find("label[for=$id]", 0);
            if ($label) {
                return true;
            }
        }
        
        // Check if element is wrapped in label
        $parent = self::$current_element->parent();
        if ($parent && $parent->tag === 'label') {
            return true;
        }
        
        // Check if element has title attribute (not ideal but acceptable)
        if (self::$current_element->title) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if form element has accessible name
     * 
     * @return bool
     */
    public static function hasAccessibleName() {
        if (!self::$current_element) return true;
        
        // For buttons, check value or inner text
        if (self::$current_element->tag === 'button' || 
            (self::$current_element->tag === 'input' && 
             (self::$current_element->type === 'submit' || 
              self::$current_element->type === 'button' || 
              self::$current_element->type === 'reset'))) {
            
            if (self::$current_element->value || trim(self::$current_element->plaintext)) {
                return true;
            }
        }
        
        return self::hasLabel();
    }
    
    /**
     * Check if form has submit button
     * 
     * @return bool
     */
    public static function hasSubmitButton() {
        if (!self::$current_element) return true;
        
        // Find submit buttons within form
        $submit_buttons = self::$current_element->find('input[type=submit], button[type=submit], button:not([type])');
        
        return count($submit_buttons) > 0;
    }
    
    /* ========================================
     * LINK-RELATED CHECKS
     * ======================================== */
    
    /**
     * Check if link has accessible text
     * 
     * @return bool
     */
    public static function hasLinkText() {
        if (!self::$current_element) return true;
        
        // Check for text content
        $text = trim(self::$current_element->plaintext);
        if ($text !== '') {
            return true;
        }
        
        // Check for aria-label
        if (self::$current_element->getAttribute('aria-label')) {
            return true;
        }
        
        // Check for images with alt text inside link
        $images = self::$current_element->find('img');
        foreach ($images as $img) {
            if ($img->alt) {
                return true;
            }
        }
        
        // Check for title attribute (not ideal)
        if (self::$current_element->title) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if link text is descriptive
     * 
     * @return bool
     */
    public static function hasDescriptiveLinkText() {
        if (!self::$current_element) return true;
        
        $text = trim(self::$current_element->plaintext);
        
        // Check for non-descriptive link text
        $non_descriptive = array(
            'click here',
            'here',
            'more',
            'read more',
            'link',
            'click',
            'download',
            'learn more'
        );
        
        $lower_text = strtolower($text);
        foreach ($non_descriptive as $phrase) {
            if ($lower_text === $phrase) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Check if link opens in new window without warning
     * 
     * @return bool
     */
    public static function hasNewWindowWarning() {
        if (!self::$current_element) return true;
        
        $target = self::$current_element->target;
        if ($target !== '_blank') {
            return true;
        }
        
        // Check if link text or title indicates new window
        $text = strtolower(self::$current_element->plaintext . ' ' . self::$current_element->title);
        
        $new_window_indicators = array(
            'new window',
            'new tab',
            'opens in',
            'external'
        );
        
        foreach ($new_window_indicators as $indicator) {
            if (strpos($text, $indicator) !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    /* ========================================
     * HEADING-RELATED CHECKS
     * ======================================== */
    
    /**
     * Check if heading has content
     * 
     * @return bool
     */
    public static function hasHeadingContent() {
        if (!self::$current_element) return true;
        
        $text = trim(self::$current_element->plaintext);
        return $text !== '';
    }
    
    /**
     * Check heading hierarchy
     * 
     * @return bool
     */
    public static function hasProperHeadingHierarchy() {
        if (!self::$current_element || !self::$current_dom) return true;
        
        $current_level = intval(substr(self::$current_element->tag, 1));
        
        // Find all headings
        $headings = self::$current_dom->find('h1,h2,h3,h4,h5,h6');
        
        $found_current = false;
        $previous_level = 0;
        
        foreach ($headings as $heading) {
            if ($heading === self::$current_element) {
                $found_current = true;
                
                // Check if we're skipping levels
                if ($previous_level > 0 && $current_level > $previous_level + 1) {
                    return false;
                }
                break;
            }
            
            $previous_level = intval(substr($heading->tag, 1));
        }
        
        return true;
    }
    
    /* ========================================
     * ARIA-RELATED CHECKS
     * ======================================== */
    
    /**
     * Check if ARIA role is valid
     * 
     * @return bool
     */
    public static function hasValidAriaRole() {
        if (!self::$current_element) return true;
        
        $role = self::$current_element->role;
        if (!$role) return true;
        
        // List of valid ARIA roles
        $valid_roles = array(
            'alert', 'alertdialog', 'application', 'article', 'banner',
            'button', 'cell', 'checkbox', 'columnheader', 'combobox',
            'complementary', 'contentinfo', 'definition', 'dialog', 'directory',
            'document', 'feed', 'figure', 'form', 'grid', 'gridcell',
            'group', 'heading', 'img', 'link', 'list', 'listbox',
            'listitem', 'log', 'main', 'marquee', 'math', 'menu',
            'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
            'navigation', 'none', 'note', 'option', 'presentation',
            'progressbar', 'radio', 'radiogroup', 'region', 'row',
            'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox',
            'separator', 'slider', 'spinbutton', 'status', 'switch',
            'tab', 'table', 'tablist', 'tabpanel', 'term', 'textbox',
            'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
        );
        
        return in_array($role, $valid_roles);
    }
    
    /**
     * Check if ARIA properties are valid
     * 
     * @return bool
     */
    public static function hasValidAriaProperties() {
        if (!self::$current_element) return true;
        
        $attributes = self::$current_element->getAllAttributes();
        
        foreach ($attributes as $name => $value) {
            if (strpos($name, 'aria-') === 0) {
                // Check for empty aria attributes
                if (trim($value) === '') {
                    return false;
                }
                
                // Check for invalid ID references
                if (in_array($name, array('aria-labelledby', 'aria-describedby', 'aria-controls'))) {
                    if (self::$current_dom) {
                        $ids = preg_split('/\s+/', $value);
                        foreach ($ids as $id) {
                            if (!self::$current_dom->find("#$id", 0)) {
                                return false;
                            }
                        }
                    }
                }
            }
        }
        
        return true;
    }
    
    /* ========================================
     * KEYBOARD-RELATED CHECKS
     * ======================================== */
    
    /**
     * Check if element has proper tabindex
     * 
     * @return bool
     */
    public static function hasProperTabindex() {
        if (!self::$current_element) return true;
        
        $tabindex = self::$current_element->tabindex;
        
        // No tabindex is usually fine
        if (!isset($tabindex)) {
            return true;
        }
        
        // Check for positive tabindex (usually bad)
        if (intval($tabindex) > 0) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if interactive element is keyboard accessible
     * 
     * @return bool
     */
    public static function isKeyboardAccessible() {
        if (!self::$current_element) return true;
        
        $tag = self::$current_element->tag;
        
        // Native interactive elements are keyboard accessible
        $interactive_tags = array('a', 'button', 'input', 'select', 'textarea');
        if (in_array($tag, $interactive_tags)) {
            return true;
        }
        
        // Check for click handlers on non-interactive elements
        $onclick = self::$current_element->onclick;
        if ($onclick) {
            // Should have tabindex and keyboard handlers
            $tabindex = self::$current_element->tabindex;
            $onkeypress = self::$current_element->onkeypress;
            $onkeydown = self::$current_element->onkeydown;
            $onkeyup = self::$current_element->onkeyup;
            
            if (!isset($tabindex) || (!$onkeypress && !$onkeydown && !$onkeyup)) {
                return false;
            }
        }
        
        return true;
    }
    
    /* ========================================
     * CONTRAST-RELATED CHECKS
     * ======================================== */
    
    /**
     * Check color contrast ratio
     * 
     * @param string $foreground Foreground color
     * @param string $background Background color
     * @param float $min_ratio Minimum contrast ratio
     * @return bool
     */
    public static function hasAdequateContrast($foreground = null, $background = null, $min_ratio = 4.5) {
        if (!self::$current_element) return true;
        
        // Try to get colors from element if not provided
        if (!$foreground || !$background) {
            $style = self::$current_element->style;
            if (!$style) return true;
            
            // Extract color values from style (simplified)
            if (preg_match('/color:\s*([^;]+);?/i', $style, $matches)) {
                $foreground = $matches[1];
            }
            if (preg_match('/background-color:\s*([^;]+);?/i', $style, $matches)) {
                $background = $matches[1];
            }
        }
        
        if (!$foreground || !$background) {
            return true; // Can't determine colors
        }
        
        $ratio = self::calculateContrastRatio($foreground, $background);
        
        return $ratio >= $min_ratio;
    }
    
    /**
     * Calculate contrast ratio between two colors
     * 
     * @param string $color1 First color
     * @param string $color2 Second color
     * @return float Contrast ratio
     */
    private static function calculateContrastRatio($color1, $color2) {
        $rgb1 = self::colorToRGB($color1);
        $rgb2 = self::colorToRGB($color2);
        
        if (!$rgb1 || !$rgb2) {
            return 21; // Return max ratio if can't parse colors
        }
        
        $l1 = self::relativeLuminance($rgb1);
        $l2 = self::relativeLuminance($rgb2);
        
        $lighter = max($l1, $l2);
        $darker = min($l1, $l2);
        
        return ($lighter + 0.05) / ($darker + 0.05);
    }
    
    /**
     * Convert color string to RGB array
     * 
     * @param string $color Color string
     * @return array|null RGB array or null
     */
    private static function colorToRGB($color) {
        $color = trim($color);
        
        // Hex color
        if (preg_match('/^#?([a-f0-9]{3}|[a-f0-9]{6})$/i', $color, $matches)) {
            $hex = $matches[1];
            if (strlen($hex) === 3) {
                $hex = $hex[0].$hex[0].$hex[1].$hex[1].$hex[2].$hex[2];
            }
            return array(
                hexdec(substr($hex, 0, 2)),
                hexdec(substr($hex, 2, 2)),
                hexdec(substr($hex, 4, 2))
            );
        }
        
        // RGB color
        if (preg_match('/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i', $color, $matches)) {
            return array(
                intval($matches[1]),
                intval($matches[2]),
                intval($matches[3])
            );
        }
        
        // Named colors (basic set)
        $named_colors = array(
            'black' => array(0, 0, 0),
            'white' => array(255, 255, 255),
            'red' => array(255, 0, 0),
            'green' => array(0, 128, 0),
            'blue' => array(0, 0, 255),
            'yellow' => array(255, 255, 0),
            'cyan' => array(0, 255, 255),
            'magenta' => array(255, 0, 255),
            'gray' => array(128, 128, 128),
            'grey' => array(128, 128, 128)
        );
        
        $lower_color = strtolower($color);
        if (isset($named_colors[$lower_color])) {
            return $named_colors[$lower_color];
        }
        
        return null;
    }
    
    /**
     * Calculate relative luminance
     * 
     * @param array $rgb RGB values
     * @return float Relative luminance
     */
    private static function relativeLuminance($rgb) {
        $rgb = array_map(function($val) {
            $val = $val / 255;
            return $val <= 0.03928 ? $val / 12.92 : pow(($val + 0.055) / 1.055, 2.4);
        }, $rgb);
        
        return 0.2126 * $rgb[0] + 0.7152 * $rgb[1] + 0.0722 * $rgb[2];
    }
    
    /* ========================================
     * DOCUMENT-RELATED CHECKS
     * ======================================== */
    
    /**
     * Check if page has title
     * 
     * @return bool
     */
    public static function hasPageTitle() {
        if (!self::$current_dom) return true;
        
        $title = self::$current_dom->find('title', 0);
        if (!$title) return false;
        
        $title_text = trim($title->plaintext);
        return $title_text !== '';
    }
    
    /**
     * Check if page has proper language attribute
     * 
     * @return bool
     */
    public static function hasLanguageAttribute() {
        if (!self::$current_dom) return true;
        
        $html = self::$current_dom->find('html', 0);
        if (!$html) return false;
        
        $lang = $html->lang;
        if (!$lang) {
            $lang = $html->getAttribute('xml:lang');
        }
        
        return !empty($lang);
    }
    
    /**
     * Check if page has main landmark
     * 
     * @return bool
     */
    public static function hasMainLandmark() {
        if (!self::$current_dom) return true;
        
        // Check for <main> element
        $main = self::$current_dom->find('main', 0);
        if ($main) return true;
        
        // Check for role="main"
        $role_main = self::$current_dom->find('[role=main]', 0);
        if ($role_main) return true;
        
        return false;
    }
    
    /* ========================================
     * TABLE-RELATED CHECKS
     * ======================================== */
    
    /**
     * Check if table has headers
     * 
     * @return bool
     */
    public static function hasTableHeaders() {
        if (!self::$current_element) return true;
        
        // Check for <th> elements
        $headers = self::$current_element->find('th');
        if (count($headers) > 0) return true;
        
        // Check for scope attribute on td
        $scoped_cells = self::$current_element->find('td[scope]');
        if (count($scoped_cells) > 0) return true;
        
        return false;
    }
    
    /**
     * Check if table has caption or summary
     * 
     * @return bool
     */
    public static function hasTableDescription() {
        if (!self::$current_element) return true;
        
        // Check for caption
        $caption = self::$current_element->find('caption', 0);
        if ($caption && trim($caption->plaintext) !== '') {
            return true;
        }
        
        // Check for summary attribute (deprecated but still used)
        if (self::$current_element->summary) {
            return true;
        }
        
        // Check for aria-label or aria-describedby
        if (self::$current_element->getAttribute('aria-label') || 
            self::$current_element->getAttribute('aria-describedby')) {
            return true;
        }
        
        return false;
    }
    
    /* ========================================
     * MULTIMEDIA-RELATED CHECKS
     * ======================================== */
    
    /**
     * Check if video has captions
     * 
     * @return bool
     */
    public static function hasVideoCaptions() {
        if (!self::$current_element) return true;
        
        // Check for track element with kind="captions"
        $captions = self::$current_element->find('track[kind=captions]');
        if (count($captions) > 0) return true;
        
        // Check for track element with kind="subtitles"
        $subtitles = self::$current_element->find('track[kind=subtitles]');
        if (count($subtitles) > 0) return true;
        
        return false;
    }
    
    /**
     * Check if audio has transcript
     * 
     * @return bool
     */
    public static function hasAudioTranscript() {
        if (!self::$current_element) return true;
        
        // Check for aria-describedby pointing to transcript
        $describedby = self::$current_element->getAttribute('aria-describedby');
        if ($describedby && self::$current_dom) {
            $transcript = self::$current_dom->find("#$describedby", 0);
            if ($transcript) return true;
        }
        
        // Check for adjacent element with transcript
        $next = self::$current_element->next_sibling();
        if ($next && (strpos(strtolower($next->plaintext), 'transcript') !== false)) {
            return true;
        }
        
        return false;
    }
    
    /* ========================================
     * UTILITY FUNCTIONS
     * ======================================== */
    
    /**
     * Check if element is hidden
     * 
     * @return bool
     */
    public static function isHidden() {
        if (!self::$current_element) return false;
        
        // Check for hidden attribute
        if (self::$current_element->hidden === 'hidden' || self::$current_element->hidden === true) {
            return true;
        }
        
        // Check for display:none or visibility:hidden in style
        $style = self::$current_element->style;
        if ($style) {
            if (preg_match('/display:\s*none/i', $style) || 
                preg_match('/visibility:\s*hidden/i', $style)) {
                return true;
            }
        }
        
        // Check for aria-hidden="true"
        if (self::$current_element->getAttribute('aria-hidden') === 'true') {
            return true;
        }
        
        return false;
    }
    
    /**
     * Get element's text content
     * 
     * @return string
     */
    public static function getTextContent() {
        if (!self::$current_element) return '';
        
        return trim(self::$current_element->plaintext);
    }
    
    /**
     * Get element's accessible name
     * 
     * @return string
     */
    public static function getAccessibleName() {
        if (!self::$current_element) return '';
        
        // Check aria-label
        $aria_label = self::$current_element->getAttribute('aria-label');
        if ($aria_label) return $aria_label;
        
        // Check aria-labelledby
        $labelledby = self::$current_element->getAttribute('aria-labelledby');
        if ($labelledby && self::$current_dom) {
            $labels = array();
            $ids = preg_split('/\s+/', $labelledby);
            foreach ($ids as $id) {
                $element = self::$current_dom->find("#$id", 0);
                if ($element) {
                    $labels[] = trim($element->plaintext);
                }
            }
            if (!empty($labels)) {
                return implode(' ', $labels);
            }
        }
        
        // For form elements, check associated label
        if (self::hasLabel()) {
            $id = self::$current_element->id;
            if ($id && self::$current_dom) {
                $label = self::$current_dom->find("label[for=$id]", 0);
                if ($label) {
                    return trim($label->plaintext);
                }
            }
        }
        
        // Check title attribute
        if (self::$current_element->title) {
            return self::$current_element->title;
        }
        
        // Default to text content
        return self::getTextContent();
    }
}