<?php
/**
 * ACheckerStandalone WordPress Integration
 * ไฟล์นี้ควรบันทึกเป็น /achecker/ACheckerStandalone.class.php ใน Child Theme
 */

class ACheckerStandalone {
    private $htmlDom;
    private $results = [];
    private $allChecksData = [];
    private $wcagAAMapping = [];
    private $wpdb;

    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->loadChecksData();
        $this->loadGuidelineMapping();
    }

    private function loadChecksData() {
        global $wpdb;
        
        // ดึงข้อมูล checks ทั้งหมดจาก WordPress database
        $checks = $wpdb->get_results("
            SELECT * FROM {$wpdb->prefix}checks
        ", ARRAY_A);
        
        foreach ($checks as $check) {
            $this->allChecksData[$check['check_id']] = $check;
        }
    }

    private function loadGuidelineMapping() {
        global $wpdb;
        
        // ดึง guideline_id สำหรับ WCAG 2.1 AA (อาจต้องปรับตาม database)
        $guideline = $wpdb->get_row("
            SELECT guideline_id 
            FROM {$wpdb->prefix}guidelines 
            WHERE abbr LIKE '%WCAG%2%A%' 
            ORDER BY guideline_id DESC 
            LIMIT 1
        ");
        
        if (!$guideline) {
            // Fallback สำหรับ WCAG 2.0 AA
            $guideline = $wpdb->get_row("
                SELECT guideline_id 
                FROM {$wpdb->prefix}guidelines 
                WHERE abbr = 'WCAG2-AA'
            ");
        }
        
        if ($guideline) {
            // ดึง check_ids ที่เกี่ยวข้องกับ guideline นี้
            $check_ids = $wpdb->get_col($wpdb->prepare("
                SELECT DISTINCT cg.check_id 
                FROM {$wpdb->prefix}checks_guidelines cg
                JOIN {$wpdb->prefix}guideline_groups gg ON cg.guideline_id = gg.group_id
                JOIN {$wpdb->prefix}guideline_subgroups gs ON gg.group_id = gs.group_id
                WHERE gs.guideline_id = %d
            ", $guideline->guideline_id));
            
            $this->wcagAAMapping = $check_ids;
        }
    }

    public function validateHTML($htmlContent) {
        // ใช้ WordPress function สำหรับ parse HTML
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        
        // Ensure UTF-8 encoding
        $htmlContent = mb_convert_encoding($htmlContent, 'HTML-ENTITIES', 'UTF-8');
        $dom->loadHTML('<?xml encoding="UTF-8">' . $htmlContent, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();
        
        $xpath = new DOMXPath($dom);
        
        // Process all elements
        $elements = $xpath->query('//*');
        
        foreach ($elements as $element) {
            $this->checkElement($element, $dom, $xpath);
        }
        
        return $this->results;
    }

    private function checkElement($element, $dom, $xpath) {
        $tagName = strtolower($element->nodeName);
        
        foreach ($this->allChecksData as $checkId => $checkData) {
            if (!in_array($checkId, $this->wcagAAMapping)) {
                continue;
            }
            
            // Check if this check applies to current element
            if ($checkData['html_tag'] == 'all elements' || $checkData['html_tag'] == $tagName) {
                // Process prerequisites if any
                if ($this->checkPrerequisites($checkId, $element, $xpath)) {
                    continue; // Skip if prerequisites not met
                }
                
                // Execute check function
                $passed = $this->executeCheck($checkData, $element, $dom, $xpath);
                
                if (!$passed) {
                    $this->addResult($checkData, $element);
                }
            }
        }
    }

    private function checkPrerequisites($checkId, $element, $xpath) {
        global $wpdb;
        
        $prerequisites = $wpdb->get_results($wpdb->prepare("
            SELECT * FROM {$wpdb->prefix}check_prerequisites 
            WHERE check_id = %d
        ", $checkId), ARRAY_A);
        
        foreach ($prerequisites as $prereq) {
            $prereqCheck = $this->allChecksData[$prereq['prerequisite_check_id']] ?? null;
            if ($prereqCheck) {
                $passed = $this->executeCheck($prereqCheck, $element);
                if ($passed) {
                    return true; // Prerequisites not met
                }
            }
        }
        
        return false; // All prerequisites met
    }

    private function executeCheck($checkData, $element, $dom = null, $xpath = null) {
        // แปลง function string เป็นการเรียกใช้งานจริง
        // ตัวอย่างการ implement checks พื้นฐาน
        
        switch ($checkData['check_id']) {
            case 1: // Image alt attribute check
                return $element->hasAttribute('alt');
                
            case 4: // Link text check
                if ($element->nodeName === 'a') {
                    $text = trim($element->textContent);
                    return !empty($text);
                }
                return true;
                
            case 301: // Color contrast check
                return $this->checkColorContrast($element, $dom, $xpath);
                
            // เพิ่ม checks อื่นๆ ตามต้องการ
            default:
                // สำหรับ checks ที่ยังไม่ได้ implement ให้ return true (pass)
                return true;
        }
    }

    private function checkColorContrast($element, $dom, $xpath) {
        // Simplified color contrast check
        // ในการ implementation จริง ต้องมีการคำนวณ contrast ratio
        
        if ($element->nodeType === XML_TEXT_NODE) {
            return true; // Skip text nodes
        }
        
        // Check if element has text
        $text = trim($element->textContent);
        if (empty($text)) {
            return true;
        }
        
        // ตรวจสอบ style attributes (simplified)
        $style = $element->getAttribute('style');
        if (strpos($style, 'color:') !== false || strpos($style, 'background') !== false) {
            // ในการ implementation จริง ต้องคำนวณ contrast ratio
            // return $this->calculateContrastRatio($element) >= 4.5;
            return true; // Placeholder
        }
        
        return true;
    }

    private function addResult($checkData, $element) {
        // ดึงข้อความ error จาก language_text table
        global $wpdb;
        
        $errorText = $wpdb->get_var($wpdb->prepare("
            SELECT text 
            FROM {$wpdb->prefix}language_text 
            WHERE term = %s AND language_code = 'eng'
        ", $checkData['err']));
        
        if (!$errorText) {
            $errorText = "Accessibility issue found";
        }
        
        $this->results[] = [
            'line' => $element->getLineNo(),
            'col' => 0, // DOMDocument ไม่มี column position
            'check_id' => $checkData['check_id'],
            'message' => $errorText . " (Tag: <{$element->nodeName}>)",
            'html_snippet' => $this->getElementSnippet($element),
            'confidence' => $checkData['confidence']
        ];
    }

    private function getElementSnippet($element) {
        $doc = new DOMDocument();
        $doc->appendChild($doc->importNode($element, false));
        $html = $doc->saveHTML();
        return htmlspecialchars(substr($html, 0, 100));
    }
}

/**
 * Integration with existing WordPress WCAG Checker
 */
function wcag_achecker_standalone_validate($url) {
    // ดึง HTML content จาก URL
    $response = wp_remote_get($url);
    
    if (is_wp_error($response)) {
        return ['error' => 'Could not fetch URL: ' . $response->get_error_message()];
    }
    
    $html_content = wp_remote_retrieve_body($response);
    
    // ใช้ ACheckerStandalone สำหรับตรวจสอบ
    $checker = new ACheckerStandalone();
    $results = $checker->validateHTML($html_content);
    
    // แปลงผลลัพธ์ให้ตรงกับรูปแบบที่ระบบเดิมคาดหวัง
    return process_standalone_results($results);
}

function process_standalone_results($results) {
    $checks = [
        'contrast' => ['passed' => true, 'violations' => [], 'total' => 1],
        'alt_text' => ['passed' => true, 'violations' => [], 'total' => 1],
        'headers' => ['passed' => true, 'violations' => [], 'total' => 1],
        'aria' => ['passed' => true, 'violations' => [], 'total' => 1],
        'keyboard' => ['passed' => true, 'violations' => [], 'total' => 1],
        'forms' => ['passed' => true, 'violations' => [], 'total' => 1],
        'links' => ['passed' => true, 'violations' => [], 'total' => 1]
    ];
    
    foreach ($results as $result) {
        $category = determine_category_by_check_id($result['check_id']);
        $checks[$category]['total']++;
        
        $violation = [
            'message' => $result['message'],
            'impact' => determine_impact_by_confidence($result['confidence']),
            'element' => $result['html_snippet']
        ];
        
        $checks[$category]['violations'][] = $violation;
        $checks[$category]['passed'] = false;
    }
    
    $score = calculate_score_from_checks($checks);
    $grade = determine_grade_from_score($score);
    
    return [
        'grade' => $grade,
        'checks' => $checks,
        'score' => $score,
        'severity' => 'medium'
    ];
}

function determine_category_by_check_id($check_id) {
    // Map check_id to categories based on database
    $mapping = [
        1 => 'alt_text',    // img alt attribute
        4 => 'links',       // link text
        301 => 'contrast',  // color contrast
        // เพิ่ม mapping อื่นๆ
    ];
    
    return $mapping[$check_id] ?? 'headers';
}

function determine_impact_by_confidence($confidence) {
    switch ($confidence) {
        case 0: return 'critical';  // Known issues
        case 1: return 'serious';   // Likely issues
        case 2: return 'moderate';  // Potential issues
        default: return 'moderate';
    }
}

function calculate_score_from_checks($checks) {
    // คำนวณคะแนนเหมือนระบบเดิม
    $weights = [
        'contrast' => 15,
        'alt_text' => 15,
        'headers' => 10,
        'aria' => 10,
        'keyboard' => 15,
        'forms' => 15,
        'links' => 15
    ];
    
    $total_weight = 0;
    $total_score = 0;
    
    foreach ($checks as $category => $check) {
        $weight = $weights[$category] ?? 10;
        $total_weight += $weight;
        
        if ($check['total'] > 0) {
            $passed_count = $check['total'] - count($check['violations']);
            $pass_percentage = $passed_count / $check['total'];
            $total_score += $pass_percentage * $weight;
        } else {
            $total_score += $weight;
        }
    }
    
    return ($total_score / $total_weight) * 100;
}

function determine_grade_from_score($score) {
    if ($score >= 90) return 'AAA';
    if ($score >= 80) return 'AA';
    if ($score >= 70) return 'A';
    return null;
}