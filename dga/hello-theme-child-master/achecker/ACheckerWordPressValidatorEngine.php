<?php
/**
 * AChecker WordPress Validator Engine
 * 
 * This class provides WCAG validation functionality for WordPress
 * Based on AChecker open-source accessibility checker
 * 
 * @version 1.0.0
 */

class ACheckerWordPressValidatorEngine {
    
    private $language_code;
    private $guideline_id;
    private $checks = array();
    private $prerequisites = array();
    private $error = null;
    
    /**
     * Constructor
     * 
     * @param string $language_code Language code (default: 'eng')
     */
    public function __construct($language_code = 'eng') {
        $this->language_code = $language_code;
        
        // Initialize WordPress database
        global $wpdb;
        $this->wpdb = $wpdb;
        
        // Verify required Simple HTML DOM
        if (!function_exists('str_get_html')) {
            $simple_html_dom = dirname(__FILE__) . '/simple_html_dom.php';
            if (file_exists($simple_html_dom)) {
                require_once $simple_html_dom;
            } else {
                $this->error = 'Simple HTML DOM library not found';
            }
        }
        
        // Load basic functions if not already loaded
        if (!class_exists('ACheckerStandaloneBasicFunctions')) {
            $basic_functions = dirname(__FILE__) . '/ACheckerStandaloneBasicFunctions.class.php';
            if (file_exists($basic_functions)) {
                require_once $basic_functions;
            } else {
                $this->error = 'ACheckerStandaloneBasicFunctions class not found';
            }
        }
    }
    
    /**
     * Validate HTML content against specified guideline
     * 
     * @param string $html_content HTML content to validate
     * @param string $guideline_abbr Guideline abbreviation (e.g., 'WCAG2-AA')
     * @return array Array of violations found
     */
    public function validate($html_content, $guideline_abbr = 'WCAG2-AA') {
        // Check for initialization errors
        if ($this->error) {
            return array(array('error' => $this->error));
        }
        
        // Get guideline ID
        $this->guideline_id = $this->getGuidelineId($guideline_abbr);
        if (!$this->guideline_id) {
            // If not found in database, use default checks
            return $this->performDefaultValidation($html_content);
        }
        
        // Load checks for this guideline
        $this->loadChecksForGuideline();
        
        // Parse HTML
        $dom = str_get_html($html_content);
        if (!$dom) {
            return array(array('error' => 'Failed to parse HTML content'));
        }
        
        // Perform validation
        $violations = array();
        
        foreach ($this->checks as $check) {
            $check_violations = $this->runSingleCheck($check, $dom);
            if (!empty($check_violations)) {
                $violations = array_merge($violations, $check_violations);
            }
        }
        
        // Clean up
        $dom->clear();
        
        return $violations;
    }
    
    /**
     * Get guideline ID from abbreviation
     * 
     * @param string $guideline_abbr Guideline abbreviation
     * @return int|false Guideline ID or false if not found
     */
    private function getGuidelineId($guideline_abbr) {
        $table_name = $this->wpdb->prefix . 'guidelines';
        
        // Check if table exists
        if ($this->wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            return false;
        }
        
        $guideline = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT guideline_id FROM $table_name WHERE abbr = %s AND status = 1",
            $guideline_abbr
        ));
        
        return $guideline ? $guideline->guideline_id : false;
    }
    
    /**
     * Load checks for the specified guideline
     */
    private function loadChecksForGuideline() {
        if (!$this->guideline_id) {
            return;
        }
        
        $checks_table = $this->wpdb->prefix . 'checks';
        $subgroup_checks_table = $this->wpdb->prefix . 'subgroup_checks';
        $guideline_subgroups_table = $this->wpdb->prefix . 'guideline_subgroups';
        $guideline_groups_table = $this->wpdb->prefix . 'guideline_groups';
        $language_text_table = $this->wpdb->prefix . 'language_text';
        
        // Get all checks for this guideline
        $query = "
            SELECT DISTINCT c.*, 
                   lt1.text as name_text,
                   lt2.text as error_text,
                   lt3.text as test_procedure
            FROM $checks_table c
            INNER JOIN $subgroup_checks_table sc ON c.check_id = sc.check_id
            INNER JOIN $guideline_subgroups_table gs ON sc.subgroup_id = gs.subgroup_id
            INNER JOIN $guideline_groups_table gg ON gs.group_id = gg.group_id
            LEFT JOIN $language_text_table lt1 ON c.name = lt1.term AND lt1.language_code = %s AND lt1.variable = '_check'
            LEFT JOIN $language_text_table lt2 ON c.err = lt2.term AND lt2.language_code = %s AND lt2.variable = '_msg'
            LEFT JOIN $language_text_table lt3 ON c.name = lt3.term AND lt3.language_code = %s AND lt3.variable = '_test'
            WHERE gg.guideline_id = %d AND c.open_to_public = 1
            ORDER BY c.check_id
        ";
        
        $this->checks = $this->wpdb->get_results($this->wpdb->prepare(
            $query,
            $this->language_code,
            $this->language_code,
            $this->language_code,
            $this->guideline_id
        ), ARRAY_A);
        
        // Load prerequisites
        $this->loadPrerequisites();
    }
    
    /**
     * Load prerequisites for checks
     */
    private function loadPrerequisites() {
        $check_prerequisites_table = $this->wpdb->prefix . 'check_prerequisites';
        
        if ($this->wpdb->get_var("SHOW TABLES LIKE '$check_prerequisites_table'") != $check_prerequisites_table) {
            return;
        }
        
        $prerequisites = $this->wpdb->get_results(
            "SELECT * FROM $check_prerequisites_table",
            ARRAY_A
        );
        
        foreach ($prerequisites as $prereq) {
            if (!isset($this->prerequisites[$prereq['check_id']])) {
                $this->prerequisites[$prereq['check_id']] = array();
            }
            $this->prerequisites[$prereq['check_id']][] = $prereq['prerequisite_check_id'];
        }
    }
    
    /**
     * Run a single check against the DOM
     * 
     * @param array $check Check data
     * @param object $dom Simple HTML DOM object
     * @return array Array of violations
     */
    private function runSingleCheck($check, $dom) {
        $violations = array();
        
        // Set up context for ACheckerStandaloneBasicFunctions
        ACheckerStandaloneBasicFunctions::setCurrentDOM($dom);
        
        // Find relevant elements
        if ($check['html_tag'] === 'all elements') {
            $elements = $dom->find('*');
        } else {
            $elements = $dom->find($check['html_tag']);
        }
        
        if (empty($elements)) {
            return $violations;
        }
        
        // Check prerequisites
        if (isset($this->prerequisites[$check['check_id']])) {
            $prerequisites_met = $this->checkPrerequisites($check['check_id'], $dom);
            if (!$prerequisites_met) {
                return $violations;
            }
        }
        
        // Run check on each element
        foreach ($elements as $element) {
            ACheckerStandaloneBasicFunctions::setCurrentElement($element);
            
            try {
                $passed = $this->executeCheckFunction($check, $element);
                
                if (!$passed) {
                    $violations[] = array(
                        'check_id' => $check['check_id'],
                        'name' => $check['name'],
                        'message' => $check['error_text'] ?: $check['err'] ?: 'Check failed',
                        'html_snippet' => $this->getElementSnippet($element),
                        'line' => $element->line ?: 0,
                        'confidence_code' => $check['confidence'] ?: 2,
                        'confidence_text' => $this->getConfidenceText($check['confidence'])
                    );
                }
            } catch (Exception $e) {
                // Log error but continue checking
                error_log('AChecker check error: ' . $e->getMessage());
            }
            
            ACheckerStandaloneBasicFunctions::clearCurrentElement();
        }
        
        return $violations;
    }
    
    /**
     * Execute check function
     * 
     * @param array $check Check data
     * @param object $element HTML element
     * @return bool True if check passed, false if failed
     */
    private function executeCheckFunction($check, $element) {
        if (empty($check['func'])) {
            return true;
        }
        
        // Replace BasicFunctions:: with ACheckerStandaloneBasicFunctions::
        $func_code = str_replace('BasicFunctions::', 'ACheckerStandaloneBasicFunctions::', $check['func']);
        
        // Safety check - only allow specific function patterns
        if (!preg_match('/^return\s+ACheckerStandaloneBasicFunctions::[a-zA-Z0-9_]+\(.*\);?$/', trim($func_code))) {
            return true; // Skip unsafe functions
        }
        
        // Use a safer approach than eval() if possible
        if (strpos($func_code, 'return ACheckerStandaloneBasicFunctions::') === 0) {
            $func_code = substr($func_code, 7); // Remove 'return '
            $func_code = rtrim($func_code, ';'); // Remove trailing semicolon
            
            // Parse function call
            if (preg_match('/ACheckerStandaloneBasicFunctions::([a-zA-Z0-9_]+)\((.*)\)/', $func_code, $matches)) {
                $method_name = $matches[1];
                
                // Check if method exists
                if (method_exists('ACheckerStandaloneBasicFunctions', $method_name)) {
                    // For simple methods without parameters
                    if (empty($matches[2])) {
                        return ACheckerStandaloneBasicFunctions::$method_name();
                    }
                }
            }
        }
        
        // Fallback to eval for complex functions (use with caution)
        try {
            $result = @eval($func_code);
            return $result !== false;
        } catch (Exception $e) {
            return true; // Skip on error
        }
    }
    
    /**
     * Check prerequisites for a check
     * 
     * @param int $check_id Check ID
     * @param object $dom Simple HTML DOM object
     * @return bool True if prerequisites are met
     */
    private function checkPrerequisites($check_id, $dom) {
        if (!isset($this->prerequisites[$check_id])) {
            return true;
        }
        
        foreach ($this->prerequisites[$check_id] as $prereq_id) {
            // Find prerequisite check
            $prereq_check = null;
            foreach ($this->checks as $check) {
                if ($check['check_id'] == $prereq_id) {
                    $prereq_check = $check;
                    break;
                }
            }
            
            if (!$prereq_check) {
                continue;
            }
            
            // Run prerequisite check
            $prereq_violations = $this->runSingleCheck($prereq_check, $dom);
            if (!empty($prereq_violations)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Get element snippet for violation reporting
     * 
     * @param object $element HTML element
     * @return string HTML snippet
     */
    private function getElementSnippet($element) {
        $html = $element->outertext;
        
        // Limit length
        if (strlen($html) > 200) {
            $html = substr($html, 0, 197) . '...';
        }
        
        return htmlspecialchars($html);
    }
    
    /**
     * Get confidence text from code
     * 
     * @param int $confidence_code Confidence code
     * @return string Confidence text
     */
    private function getConfidenceText($confidence_code) {
        switch ($confidence_code) {
            case 0:
                return 'Known';
            case 1:
                return 'Likely';
            case 2:
                return 'Potential';
            default:
                return 'Unknown';
        }
    }
    
    /**
     * Perform default validation when database is not available
     * 
     * @param string $html_content HTML content to validate
     * @return array Array of violations
     */
    private function performDefaultValidation($html_content) {
        $violations = array();
        
        $dom = str_get_html($html_content);
        if (!$dom) {
            return array(array('error' => 'Failed to parse HTML content'));
        }
        
        // Basic accessibility checks
        
        // Check 1: Images without alt text
        $images = $dom->find('img');
        foreach ($images as $img) {
            if (!$img->alt && !$img->getAttribute('aria-label') && !$img->getAttribute('aria-labelledby')) {
                $violations[] = array(
                    'check_id' => 1,
                    'name' => 'img_alt_missing',
                    'message' => 'Image missing alternative text',
                    'html_snippet' => $this->getElementSnippet($img),
                    'line' => $img->line ?: 0,
                    'confidence_code' => 0,
                    'confidence_text' => 'Known'
                );
            }
        }
        
        // Check 2: Form inputs without labels
        $inputs = $dom->find('input[type!=hidden], select, textarea');
        foreach ($inputs as $input) {
            $has_label = false;
            
            // Check for associated label
            if ($input->id) {
                $label = $dom->find("label[for={$input->id}]", 0);
                if ($label) {
                    $has_label = true;
                }
            }
            
            // Check for aria-label
            if (!$has_label && ($input->getAttribute('aria-label') || $input->getAttribute('aria-labelledby'))) {
                $has_label = true;
            }
            
            // Check for parent label
            if (!$has_label) {
                $parent = $input->parent();
                if ($parent && $parent->tag === 'label') {
                    $has_label = true;
                }
            }
            
            if (!$has_label) {
                $violations[] = array(
                    'check_id' => 118,
                    'name' => 'form_label_missing',
                    'message' => 'Form control missing label',
                    'html_snippet' => $this->getElementSnippet($input),
                    'line' => $input->line ?: 0,
                    'confidence_code' => 0,
                    'confidence_text' => 'Known'
                );
            }
        }
        
        // Check 3: Empty headings
        $headings = $dom->find('h1,h2,h3,h4,h5,h6');
        foreach ($headings as $heading) {
            $text = trim($heading->plaintext);
            if (empty($text)) {
                $violations[] = array(
                    'check_id' => 37,
                    'name' => 'heading_empty',
                    'message' => 'Heading element is empty',
                    'html_snippet' => $this->getElementSnippet($heading),
                    'line' => $heading->line ?: 0,
                    'confidence_code' => 0,
                    'confidence_text' => 'Known'
                );
            }
        }
        
        // Check 4: Links without accessible name
        $links = $dom->find('a[href]');
        foreach ($links as $link) {
            $has_accessible_name = false;
            
            // Check for text content
            if (trim($link->plaintext)) {
                $has_accessible_name = true;
            }
            
            // Check for aria-label
            if (!$has_accessible_name && $link->getAttribute('aria-label')) {
                $has_accessible_name = true;
            }
            
            // Check for images with alt text inside link
            if (!$has_accessible_name) {
                $imgs = $link->find('img');
                foreach ($imgs as $img) {
                    if ($img->alt) {
                        $has_accessible_name = true;
                        break;
                    }
                }
            }
            
            if (!$has_accessible_name) {
                $violations[] = array(
                    'check_id' => 17,
                    'name' => 'link_text_missing',
                    'message' => 'Link missing accessible name',
                    'html_snippet' => $this->getElementSnippet($link),
                    'line' => $link->line ?: 0,
                    'confidence_code' => 0,
                    'confidence_text' => 'Known'
                );
            }
        }
        
        // Check 5: Page missing main landmark
        $main_landmark = $dom->find('main, [role=main]', 0);
        if (!$main_landmark) {
            $violations[] = array(
                'check_id' => 200,
                'name' => 'landmark_main_missing',
                'message' => 'Page missing main landmark',
                'html_snippet' => '<body>...</body>',
                'line' => 0,
                'confidence_code' => 1,
                'confidence_text' => 'Likely'
            );
        }
        
        // Check 6: Duplicate IDs
        $all_elements = $dom->find('[id]');
        $id_map = array();
        foreach ($all_elements as $element) {
            $id = $element->id;
            if (!isset($id_map[$id])) {
                $id_map[$id] = 0;
            }
            $id_map[$id]++;
            
            if ($id_map[$id] > 1) {
                $violations[] = array(
                    'check_id' => 300,
                    'name' => 'duplicate_id',
                    'message' => 'Duplicate ID found: ' . $id,
                    'html_snippet' => $this->getElementSnippet($element),
                    'line' => $element->line ?: 0,
                    'confidence_code' => 0,
                    'confidence_text' => 'Known'
                );
            }
        }
        
        $dom->clear();
        
        return $violations;
    }
}