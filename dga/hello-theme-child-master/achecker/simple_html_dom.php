<?php
/**
 * Simple HTML DOM Parser for WCAG Checker
 * 
 * This is an optimized version of Simple HTML DOM Parser
 * specifically designed for accessibility checking
 * 
 * @version 1.0.0
 */

define('HDOM_TYPE_ELEMENT', 1);
define('HDOM_TYPE_COMMENT', 2);
define('HDOM_TYPE_TEXT',    3);
define('HDOM_TYPE_ENDTAG',  4);
define('HDOM_TYPE_ROOT',    5);
define('HDOM_TYPE_UNKNOWN', 6);
define('HDOM_QUOTE_DOUBLE', 0);
define('HDOM_QUOTE_SINGLE', 1);
define('HDOM_QUOTE_NO',     3);
define('HDOM_INFO_BEGIN',   0);
define('HDOM_INFO_END',     1);
define('HDOM_INFO_QUOTE',   2);
define('HDOM_INFO_SPACE',   3);
define('HDOM_INFO_TEXT',    4);
define('HDOM_INFO_INNER',   5);
define('HDOM_INFO_OUTER',   6);
define('HDOM_INFO_ENDSPACE',7);

// Default settings
define('DEFAULT_TARGET_CHARSET', 'UTF-8');
define('DEFAULT_BR_TEXT', "\r\n");
define('DEFAULT_SPAN_TEXT', " ");
define('MAX_FILE_SIZE', 600000);

/**
 * Simple HTML DOM Node
 */
class simple_html_dom_node {
    public $nodetype = HDOM_TYPE_TEXT;
    public $tag = 'text';
    public $attr = array();
    public $children = array();
    public $nodes = array();
    public $parent = null;
    public $_ = array();
    public $tag_start = 0;
    private $dom = null;
    
    function __construct($dom) {
        $this->dom = $dom;
        $dom->nodes[] = $this;
    }
    
    function __destruct() {
        $this->clear();
    }
    
    function clear() {
        $this->dom = null;
        $this->nodes = null;
        $this->parent = null;
        $this->children = null;
    }
    
    function dump($show_attr = true, $depth = 0) {
        $lead = str_repeat('    ', $depth);
        echo $lead . $this->tag;
        
        if ($show_attr && isset($this->attr)) {
            foreach ($this->attr as $k => $v) {
                echo " [$k]=\"" . htmlspecialchars($v) . '"';
            }
        }
        echo "\n";
        
        if ($this->nodes) {
            foreach ($this->nodes as $n) {
                $n->dump($show_attr, $depth + 1);
            }
        }
    }
    
    // Get node's parent
    function parent($parent = null) {
        if ($parent !== null) {
            $this->parent = $parent;
            return $this;
        }
        return $this->parent;
    }
    
    // Check if node has children
    function has_child() {
        return !empty($this->children);
    }
    
    // Get children
    function children($idx = -1) {
        if ($idx === -1) {
            return $this->children;
        }
        if (isset($this->children[$idx])) {
            return $this->children[$idx];
        }
        return null;
    }
    
    // Get first child
    function first_child() {
        if (count($this->children) > 0) {
            return $this->children[0];
        }
        return null;
    }
    
    // Get last child
    function last_child() {
        if (($count = count($this->children)) > 0) {
            return $this->children[$count - 1];
        }
        return null;
    }
    
    // Get next sibling
    function next_sibling() {
        if ($this->parent === null) {
            return null;
        }
        
        $idx = 0;
        $count = count($this->parent->children);
        while ($idx < $count && $this !== $this->parent->children[$idx]) {
            ++$idx;
        }
        
        if (++$idx >= $count) {
            return null;
        }
        
        return $this->parent->children[$idx];
    }
    
    // Get previous sibling
    function prev_sibling() {
        if ($this->parent === null) {
            return null;
        }
        
        $idx = 0;
        $count = count($this->parent->children);
        while ($idx < $count && $this !== $this->parent->children[$idx]) {
            ++$idx;
        }
        
        if (--$idx < 0) {
            return null;
        }
        
        return $this->parent->children[$idx];
    }
    
    // Get all attributes
    function getAllAttributes() {
        return $this->attr;
    }
    
    // Get attribute value
    function getAttribute($name) {
        if (isset($this->attr[$name])) {
            return $this->attr[$name];
        }
        return null;
    }
    
    // Set attribute value
    function setAttribute($name, $value) {
        $this->attr[$name] = $value;
    }
    
    // Remove attribute
    function removeAttribute($name) {
        if (isset($this->attr[$name])) {
            unset($this->attr[$name]);
        }
    }
    
    // Get inner text
    function innertext() {
        if (isset($this->_[HDOM_INFO_INNER])) {
            return $this->_[HDOM_INFO_INNER];
        }
        
        if (isset($this->_[HDOM_INFO_TEXT])) {
            return $this->_[HDOM_INFO_TEXT];
        }
        
        $ret = '';
        foreach ($this->nodes as $n) {
            $ret .= $n->outertext();
        }
        
        return $ret;
    }
    
    // Get outer text
    function outertext() {
        if ($this->tag === 'root') {
            return $this->innertext();
        }
        
        // Render begin tag
        if ($this->dom && $this->dom->nodes[$this->_[HDOM_INFO_BEGIN]]) {
            $ret = $this->dom->nodes[$this->_[HDOM_INFO_BEGIN]]->makeup();
        } else {
            $ret = '';
        }
        
        // Render inner text
        if (isset($this->_[HDOM_INFO_INNER])) {
            if ($this->tag !== 'br') {
                $ret .= $this->_[HDOM_INFO_INNER];
            }
        } else {
            if ($this->nodes) {
                foreach ($this->nodes as $n) {
                    $ret .= $n->outertext();
                }
            }
        }
        
        // Render end tag
        if (isset($this->_[HDOM_INFO_END]) && $this->_[HDOM_INFO_END] != 0) {
            $ret .= '</' . $this->tag . '>';
        }
        
        return $ret;
    }
    
    // Get plain text
    function text() {
        if (isset($this->_[HDOM_INFO_INNER])) {
            return $this->_[HDOM_INFO_INNER];
        }
        
        switch ($this->nodetype) {
            case HDOM_TYPE_TEXT:
                return $this->_[HDOM_INFO_TEXT];
            case HDOM_TYPE_COMMENT:
                return '';
            case HDOM_TYPE_UNKNOWN:
                return '';
        }
        
        if (strcasecmp($this->tag, 'script') === 0) {
            return '';
        }
        
        if (strcasecmp($this->tag, 'style') === 0) {
            return '';
        }
        
        $ret = '';
        if (strcasecmp($this->tag, 'br') === 0) {
            $ret .= $this->dom->default_br_text;
        } elseif (strcasecmp($this->tag, 'span') !== 0) {
            $ret .= $this->dom->default_span_text;
        }
        
        if ($this->nodes) {
            foreach ($this->nodes as $n) {
                $ret .= $n->text();
            }
        }
        
        return $ret;
    }
    
    // Find elements
    function find($selector, $idx = null, $lowercase = false) {
        $selectors = $this->parse_selector($selector);
        if (($count = count($selectors)) === 0) {
            return array();
        }
        
        $found_keys = array();
        
        // Find each selector
        for ($c = 0; $c < $count; ++$c) {
            if (($level = count($selectors[$c])) === 0) {
                return array();
            }
            
            $head = array($this->_[HDOM_INFO_BEGIN] => 1);
            
            // Handle descendant selectors
            for ($l = 0; $l < $level; ++$l) {
                $ret = array();
                foreach ($head as $k => $v) {
                    $n = ($k === -1) ? $this->dom->root : $this->dom->nodes[$k];
                    $n->seek($selectors[$c][$l], $ret, $lowercase);
                }
                $head = $ret;
            }
            
            foreach ($head as $k => $v) {
                if (!isset($found_keys[$k])) {
                    $found_keys[$k] = 1;
                }
            }
        }
        
        // Sort keys
        ksort($found_keys);
        
        $found = array();
        foreach ($found_keys as $k => $v) {
            $found[] = $this->dom->nodes[$k];
        }
        
        // Return nth element or array
        if (is_null($idx)) {
            return $found;
        } elseif ($idx < 0) {
            $idx = count($found) + $idx;
        }
        
        return (isset($found[$idx])) ? $found[$idx] : null;
    }
    
    // Seek elements
    protected function seek($selector, &$ret, $lowercase = false) {
        global $debugObject;
        list($tag, $id, $class, $attributes, $cmb) = $selector;
        
        // Check tag
        if ($tag && $tag != '*' && strcasecmp($this->tag, $tag)) {
            return;
        }
        
        // Check ID
        if ($id && !isset($this->attr['id']) && strcasecmp($this->attr['id'], $id)) {
            return;
        }
        
        // Check class
        if ($class && (!isset($this->attr['class']) || !preg_match('/\b' . preg_quote($class, '/') . '\b/', $this->attr['class']))) {
            return;
        }
        
        // Check attributes
        if ($attributes) {
            foreach ($attributes as $a) {
                if (isset($a[4])) { // Attribute with value
                    $check = $this->match($a[1], $a[2], $a[3], $a[4]);
                } else { // Attribute without value
                    $check = isset($this->attr[$a[1]]);
                }
                
                if (!$check) {
                    return;
                }
            }
        }
        
        // It's a match!
        $ret[$this->_[HDOM_INFO_BEGIN]] = 1;
        unset($ret[$this->_[HDOM_INFO_END]]);
        
        // Seek children
        if ($cmb === ' ' && $this->children) {
            foreach ($this->children as $c) {
                $c->seek($selector, $ret, $lowercase);
            }
        }
    }
    
    // Match attribute values
    protected function match($name, $exp, $pattern, $value) {
        if ($name == 'class') {
            $pattern = preg_quote($pattern, '/');
            $value = $this->attr['class'];
        } else {
            $pattern = strtolower($pattern);
            $value = strtolower($value);
        }
        
        switch ($exp) {
            case '=':
                return ($value === $pattern);
            case '!=':
                return ($value !== $pattern);
            case '^=':
                return preg_match("/^" . preg_quote($pattern, '/') . "/", $value);
            case '$=':
                return preg_match("/" . preg_quote($pattern, '/') . "$/", $value);
            case '*=':
                return preg_match("/" . preg_quote($pattern, '/') . "/i", $value);
        }
        
        return false;
    }
    
    // Parse CSS selector
    protected function parse_selector($selector_string) {
        $pattern = '/([a-z0-9_-]*)(?:\#([a-z0-9_-]+))?(?:\.([a-z0-9_-]+))?(?:\[@?([a-z0-9_-]+)(?:([!*^$]?=)["\']?([^"\']*)["\']?)?\])?/i';
        preg_match_all($pattern, trim($selector_string), $matches, PREG_SET_ORDER);
        
        $selectors = array();
        $result = array();
        
        foreach ($matches as $m) {
            if ($m[0] !== '') {
                if ($m[1] !== '') {
                    $result[] = $m[1];
                }
                
                if ($m[2] !== '') {
                    $result[] = '#' . $m[2];
                }
                
                if ($m[3] !== '') {
                    $result[] = '.' . $m[3];
                }
                
                if ($m[4] !== '') {
                    $result[] = $m[4];
                }
            }
        }
        
        $selectors[] = $result;
        return $selectors;
    }
    
    // Prepare node
    function makeup() {
        if (isset($this->_[HDOM_INFO_TEXT])) {
            return $this->_[HDOM_INFO_TEXT];
        }
        
        $ret = '<' . $this->tag;
        
        foreach ($this->attr as $key => $val) {
            $ret .= ' ' . $key;
            if ($val !== true && $val !== null) {
                $quote = '"';
                if (strpos($val, '"') !== false) {
                    $quote = "'";
                }
                $ret .= '=' . $quote . htmlspecialchars($val, ENT_QUOTES) . $quote;
            }
        }
        
        $ret .= '>';
        return $ret;
    }
    
    // Magic methods for property access
    function __get($name) {
        switch ($name) {
            case 'outertext':
                return $this->outertext();
            case 'innertext':
                return $this->innertext();
            case 'plaintext':
                return $this->text();
            case 'xmltext':
                return $this->xmltext();
            default:
                if (array_key_exists($name, $this->attr)) {
                    return $this->attr[$name];
                }
                return null;
        }
    }
    
    function __set($name, $value) {
        switch ($name) {
            case 'outertext':
                return $this->_[HDOM_INFO_OUTER] = $value;
            case 'innertext':
                if (isset($this->_[HDOM_INFO_TEXT])) {
                    return $this->_[HDOM_INFO_TEXT] = $value;
                }
                return $this->_[HDOM_INFO_INNER] = $value;
            case 'plaintext':
                return $this->text($value);
            default:
                if (!isset($this->attr[$name])) {
                    $this->_[HDOM_INFO_SPACE][] = array(' ', '', '');
                }
                $this->attr[$name] = $value;
        }
    }
    
    function __isset($name) {
        switch ($name) {
            case 'outertext':
            case 'innertext':
            case 'plaintext':
                return true;
            default:
                return (array_key_exists($name, $this->attr)) ? true : isset($this->attr[$name]);
        }
    }
    
    function __unset($name) {
        if (isset($this->attr[$name])) {
            unset($this->attr[$name]);
        }
    }
}

/**
 * Simple HTML DOM
 */
class simple_html_dom {
    public $root = null;
    public $nodes = array();
    public $callback = null;
    public $lowercase = false;
    public $original_size;
    public $size;
    protected $pos;
    protected $doc;
    protected $char;
    protected $cursor;
    protected $parent;
    protected $noise = array();
    protected $token_blank = " \t\r\n";
    protected $token_equal = ' =/>';
    protected $token_slash = " />\r\n\t";
    protected $token_attr = ' >';
    public $_charset = '';
    public $_target_charset = '';
    protected $default_br_text = "";
    protected $default_span_text = "";
    public $current_line = 1;
    
    function __construct($str = null, $lowercase = true, $stripRN = true, $defaultBRText = DEFAULT_BR_TEXT, $defaultSpanText = DEFAULT_SPAN_TEXT) {
        if ($str) {
            if (preg_match("/^http:\/\//i", $str) || is_file($str)) {
                $this->load_file($str);
            } else {
                $this->load($str, $lowercase, $stripRN, $defaultBRText, $defaultSpanText);
            }
        }
        
        if (!is_null($defaultBRText)) {
            $this->default_br_text = $defaultBRText;
        }
        
        if (!is_null($defaultSpanText)) {
            $this->default_span_text = $defaultSpanText;
        }
    }
    
    function __destruct() {
        $this->clear();
    }
    
    // Load HTML from string
    function load($str, $lowercase = true, $stripRN = true, $defaultBRText = DEFAULT_BR_TEXT, $defaultSpanText = DEFAULT_SPAN_TEXT) {
        $this->prepare($str, $lowercase, $stripRN, $defaultBRText, $defaultSpanText);
        $this->remove_noise("'<!--(.*?)-->'is");
        $this->remove_noise("'<!\[CDATA\[(.*?)\]\]>'is");
        $this->remove_noise("'<\s*script[^>]*>(.*?)<\s*/\s*script\s*>'is");
        $this->remove_noise("'<\s*style[^>]*>(.*?)<\s*/\s*style\s*>'is");
        
        while ($this->parse());
        
        $this->root->_[HDOM_INFO_END] = $this->cursor;
        $this->parse_charset();
        
        return $this;
    }
    
    // Load HTML from file
    function load_file() {
        $args = func_get_args();
        $this->load(call_user_func_array('file_get_contents', $args), true);
        
        if (($error = error_get_last()) !== null) {
            $this->clear();
            return false;
        }
        
        return $this;
    }
    
    // Set callback function
    function set_callback($function_name) {
        $this->callback = $function_name;
    }
    
    // Remove callback function
    function remove_callback() {
        $this->callback = null;
    }
    
    // Save DOM as string
    function save($filepath = '') {
        $ret = $this->root->innertext();
        
        if ($filepath !== '') {
            file_put_contents($filepath, $ret, LOCK_EX);
        }
        
        return $ret;
    }
    
    // Find elements
    function find($selector, $idx = null, $lowercase = false) {
        return $this->root->find($selector, $idx, $lowercase);
    }
    
    // Clear DOM object
    function clear() {
        foreach ($this->nodes as $n) {
            $n->clear();
            $n = null;
        }
        
        if (isset($this->children)) {
            foreach ($this->children as $n) {
                $n->clear();
                $n = null;
            }
        }
        
        if (isset($this->parent)) {
            $this->parent->clear();
            unset($this->parent);
        }
        
        if (isset($this->root)) {
            $this->root->clear();
            unset($this->root);
        }
        
        unset($this->doc);
        unset($this->noise);
    }
    
    // Dump DOM tree
    function dump($show_attr = true) {
        $this->root->dump($show_attr);
    }
    
    // Prepare DOM tree
    protected function prepare($str, $lowercase = true, $stripRN = true, $defaultBRText = DEFAULT_BR_TEXT, $defaultSpanText = DEFAULT_SPAN_TEXT) {
        $this->clear();
        
        $this->doc = trim($str);
        $this->size = strlen($this->doc);
        $this->original_size = $this->size;
        $this->pos = 0;
        $this->cursor = 1;
        $this->noise = array();
        $this->nodes = array();
        $this->lowercase = $lowercase;
        $this->default_br_text = $defaultBRText;
        $this->default_span_text = $defaultSpanText;
        
        $this->root = new simple_html_dom_node($this);
        $this->root->tag = 'root';
        $this->root->_[HDOM_INFO_BEGIN] = -1;
        $this->root->nodetype = HDOM_TYPE_ROOT;
        $this->parent = $this->root;
        
        if ($this->size > 0) {
            $this->char = $this->doc[0];
        }
    }
    
    // Parse DOM tree
    protected function parse() {
        if (($s = $this->copy_until_char('<')) === '') {
            return $this->read_tag();
        }
        
        $node = new simple_html_dom_node($this);
        ++$this->cursor;
        $node->_[HDOM_INFO_TEXT] = $s;
        $this->link_nodes($node, false);
        
        return true;
    }
    
    // Parse charset
    protected function parse_charset() {
        global $debugObject;
        
        $charset = null;
        
        if (function_exists('get_last_retrieve_url_contents_content_type')) {
            $contentTypeHeader = get_last_retrieve_url_contents_content_type();
            $charset = $this->get_charset_from_content_type($contentTypeHeader);
        }
        
        if (empty($charset)) {
            $el = $this->root->find('meta[http-equiv=Content-Type]', 0);
            
            if (!empty($el)) {
                $fullvalue = $el->content;
                if (!empty($fullvalue)) {
                    $charset = $this->get_charset_from_content_type($fullvalue);
                }
            }
        }
        
        if (empty($charset)) {
            $el = $this->root->find('meta[charset]', 0);
            
            if (!empty($el)) {
                $charset = $el->charset;
            }
        }
        
        if (empty($charset)) {
            $charset = DEFAULT_TARGET_CHARSET;
        }
        
        if ((strtolower($charset) == strtolower(DEFAULT_TARGET_CHARSET))) {
            return true;
        }
        
        return true;
    }
    
    // Read tag
    protected function read_tag() {
        if ($this->char !== '<') {
            $this->root->_[HDOM_INFO_END] = $this->cursor;
            return false;
        }
        
        $begin_tag_pos = $this->pos;
        $this->char = (++$this->pos < $this->size) ? $this->doc[$this->pos] : null;
        
        if ($this->char === '/') {
            $this->char = (++$this->pos < $this->size) ? $this->doc[$this->pos] : null;
            $this->skip($this->token_blank);
            $tag = $this->copy_until($this->token_slash);
            
            if (($pos = strpos($tag, ' ')) !== false) {
                $tag = substr($tag, 0, $pos);
            }
            
            $parent_lower = strtolower($this->parent->tag);
            $tag_lower = strtolower($tag);
            
            if ($parent_lower !== $tag_lower) {
                if (isset($this->optional_closing_tags[$parent_lower]) && isset($this->block_tags[$tag_lower])) {
                    $this->parent->_[HDOM_INFO_END] = 0;
                    $org_parent = $this->parent;
                    
                    while (($this->parent->parent) && strtolower($this->parent->tag) !== $tag_lower) {
                        $this->parent = $this->parent->parent;
                    }
                    
                    if (strtolower($this->parent->tag) !== $tag_lower) {
                        $this->parent = $org_parent;
                        
                        if ($this->parent->parent) {
                            $this->parent = $this->parent->parent;
                        }
                        
                        $this->parent->_[HDOM_INFO_END] = $this->cursor;
                        return $this->as_text_node($tag);
                    }
                } elseif (($this->parent->parent) && isset($this->block_tags[$tag_lower])) {
                    $this->parent->_[HDOM_INFO_END] = 0;
                    $org_parent = $this->parent;
                    
                    while (($this->parent->parent) && strtolower($this->parent->tag) !== $tag_lower) {
                        $this->parent = $this->parent->parent;
                    }
                    
                    if (strtolower($this->parent->tag) !== $tag_lower) {
                        $this->parent = $org_parent;
                        $this->parent->_[HDOM_INFO_END] = $this->cursor;
                        return $this->as_text_node($tag);
                    }
                } elseif (($this->parent->parent) && strtolower($this->parent->parent->tag) === $tag_lower) {
                    $this->parent->_[HDOM_INFO_END] = 0;
                    $this->parent = $this->parent->parent;
                } else {
                    return $this->as_text_node($tag);
                }
            }
            
            $this->parent->_[HDOM_INFO_END] = $this->cursor;
            
            if ($this->parent->parent) {
                $this->parent = $this->parent->parent;
            }
            
            $this->char = (++$this->pos < $this->size) ? $this->doc[$this->pos] : null;
            $this->copy_until_char('>');
            return true;
        }
        
        $node = new simple_html_dom_node($this);
        $node->_[HDOM_INFO_BEGIN] = $this->cursor;
        ++$this->cursor;
        $tag = $this->copy_until($this->token_slash);
        
        if (isset($tag[0]) && $tag[0] === '!') {
            $node->_[HDOM_INFO_TEXT] = '<' . $tag . $this->copy_until_char('>');
            
            if (isset($tag[2]) && $tag[1] === '-' && $tag[2] === '-') {
                $node->nodetype = HDOM_TYPE_COMMENT;
                $node->tag = 'comment';
            } else {
                $node->nodetype = HDOM_TYPE_UNKNOWN;
                $node->tag = 'unknown';
            }
            
            if ($this->char === '>') {
                $node->_[HDOM_INFO_TEXT] .= '>';
            }
            
            $this->link_nodes($node, true);
            $this->char = (++$this->pos < $this->size) ? $this->doc[$this->pos] : null;
            return true;
        }
        
        if ($tag === '?') {
            $tag = '?';
            $node->nodetype = HDOM_TYPE_UNKNOWN;
            $node->_[HDOM_INFO_TEXT] = '<' . $tag . $this->copy_until_char('>');
            
            $this->link_nodes($node, true);
            $this->char = (++$this->pos < $this->size) ? $this->doc[$this->pos] : null;
            return true;
        }
        
        if (!preg_match("/^[\w\d:-]+$/", $tag)) {
            $node->_[HDOM_INFO_TEXT] = '<' . $tag . $this->copy_until('<>');
            
            if ($this->char === '>') {
                $node->_[HDOM_INFO_TEXT] .= '>';
                $this->char = (++$this->pos < $this->size) ? $this->doc[$this->pos] : null;
            }
            
            $this->link_nodes($node, false);
            return true;
        }
        
        $node->nodetype = HDOM_TYPE_ELEMENT;
        $tag_lower = strtolower($tag);
        $node->tag = ($this->lowercase) ? $tag_lower : $tag;
        
        if (isset($this->optional_closing_tags[$tag_lower])) {
            while (isset($this->optional_closing_tags[$tag_lower][strtolower($this->parent->tag)])) {
                $this->parent->_[HDOM_INFO_END] = 0;
                $this->parent = $this->parent->parent;
            }
            $node->parent = $this->parent;
        }
        
        $guard = 0;
        $space = array($this->copy_skip($this->token_blank), '', '');
        
        do {
            $name = $this->copy_until($this->token_equal);
            
            if ($guard === $this->pos) {
                $this->char = (++$this->pos < $this->size) ? $this->doc[$this->pos] : null;
                continue;
            }
            
            $guard = $this->pos;
            
            if ($this->pos >= $this->size - 1 && $this->char !== '>') {
                $node->nodetype = HDOM_TYPE_TEXT;
                $node->_[HDOM_INFO_END] = 0;
                $node->_[HDOM_INFO_TEXT] = '<' . $tag . $space[0] . $name;
                $node->tag = 'text';
                $this->link_nodes($node, false);
                return true;
            }
            
            if ($this->doc[$this->pos - 1] == '<') {
                $node->nodetype = HDOM_TYPE_TEXT;
                $node->tag = 'text';
                $node->attr = array();
                $node->_[HDOM_INFO_END] = 0;
                $node->_[HDOM_INFO_TEXT] = '<' . $tag . $space[0] . $name;
                $this->pos -= 2;
                $this->char = (++$this->pos < $this->size) ? $this->doc[$this->pos] : null;
                $this->link_nodes($node, false);
                return true;
            }
            
            if ($name !== '/' && $name !== '') {
                $space[1] = $this->copy_skip($this->token_blank);
                
                if ($this->lowercase) {
                    $name = strtolower($name);
                }
                
                if ($this->char === '=') {
                    $this->char = (++$this->pos < $this->size) ? $this->doc[$this->pos] : null;
                    $this->parse_attr($node, $name, $space);
                } else {
                    $node->_[HDOM_INFO_QUOTE][$name] = HDOM_QUOTE_NO;
                    $node->attr[$name] = '';
                    $space[2] = '';
                }
                
                $space = array($this->copy_skip($this->token_blank), '', '');
            }
        } while ($this->char !== '>' && $this->char !== '/');
        
        $this->link_nodes($node, true);
        
        $this->char = (++$this->pos < $this->size) ? $this->doc[$this->pos] : null;
        
        return true;
    }
    
    // Parse attributes
    protected function parse_attr($node, $name, &$space) {
        $space[2] = $this->copy_skip($this->token_blank);
        
        switch ($this->char) {
            case '"':
                $node->_[HDOM_INFO_QUOTE][$name] = HDOM_QUOTE_DOUBLE;
                $this->char = (++$this->pos < $this->size) ? $this->doc[$this->pos] : null;
                $node->attr[$name] = $this->restore_noise($this->copy_until_char('"'));
                $this->char = (++$this->pos < $this->size) ? $this->doc[$this->pos] : null;
                break;
                
            case '\'':
                $node->_[HDOM_INFO_QUOTE][$name] = HDOM_QUOTE_SINGLE;
                $this->char = (++$this->pos < $this->size) ? $this->doc[$this->pos] : null;
                $node->attr[$name] = $this->restore_noise($this->copy_until_char('\''));
                $this->char = (++$this->pos < $this->size) ? $this->doc[$this->pos] : null;
                break;
                
            default:
                $node->_[HDOM_INFO_QUOTE][$name] = HDOM_QUOTE_NO;
                $node->attr[$name] = $this->restore_noise($this->copy_until($this->token_attr));
        }
    }
    
    // Link nodes
    protected function link_nodes(&$node, $is_child) {
        $node->parent = $this->parent;
        $this->parent->nodes[] = $node;
        
        if ($is_child) {
            $this->parent->children[] = $node;
        }
    }
    
    // Convert text node
    protected function as_text_node($tag) {
        $node = new simple_html_dom_node($this);
        ++$this->cursor;
        $node->_[HDOM_INFO_TEXT] = '</' . $tag . '>';
        $this->link_nodes($node, false);
        $this->char = (++$this->pos < $this->size) ? $this->doc[$this->pos] : null;
        return true;
    }
    
    // Skip characters
    protected function skip($chars) {
        $this->pos += strspn($this->doc, $chars, $this->pos);
        $this->char = ($this->pos < $this->size) ? $this->doc[$this->pos] : null;
    }
    
    // Copy and skip
    protected function copy_skip($chars) {
        $pos = $this->pos;
        $this->skip($chars);
        return substr($this->doc, $pos, $this->pos - $pos);
    }
    
    // Copy until
    protected function copy_until($chars) {
        $pos = $this->pos;
        $this->pos += strcspn($this->doc, $chars, $pos);
        $this->char = ($this->pos < $this->size) ? $this->doc[$this->pos] : null;
        return substr($this->doc, $pos, $this->pos - $pos);
    }
    
    // Copy until char
    protected function copy_until_char($char) {
        if ($this->char === $char) {
            return '';
        }
        
        if (($pos = strpos($this->doc, $char, $this->pos)) === false) {
            $ret = substr($this->doc, $this->pos, $this->size - $this->pos);
            $this->char = null;
            $this->pos = $this->size;
            return $ret;
        }
        
        $pos_old = $this->pos;
        $this->char = $this->doc[$pos];
        $this->pos = $pos;
        return substr($this->doc, $pos_old, $pos - $pos_old);
    }
    
    // Remove noise
    protected function remove_noise($pattern) {
        $count = preg_match_all($pattern, $this->doc, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
        
        for ($i = $count - 1; $i > -1; --$i) {
            $key = '___noise___' . sprintf('% 5d', count($this->noise) + 1);
            
            $this->noise[$key] = $matches[$i][0][0];
            $this->doc = substr_replace($this->doc, $key, $matches[$i][0][1], strlen($matches[$i][0][0]));
        }
        
        $this->size = strlen($this->doc);
        
        if ($this->size > 0) {
            $this->char = $this->doc[0];
        }
    }
    
    // Restore noise
    protected function restore_noise($text) {
        while (($pos = strpos($text, '___noise___')) !== false) {
            $key = substr($text, $pos, 15);
            
            if (isset($this->noise[$key])) {
                $text = str_replace($key, $this->noise[$key], $text);
            } else {
                $text = str_replace($key, '', $text);
            }
        }
        
        return $text;
    }
    
    // Magic methods
    function __toString() {
        return $this->root->innertext();
    }
    
    function __get($name) {
        switch ($name) {
            case 'outertext':
                return $this->root->innertext();
            case 'innertext':
                return $this->root->innertext();
            case 'plaintext':
                return $this->root->text();
            case 'charset':
                return $this->_charset;
            case 'target_charset':
                return $this->_target_charset;
            default:
                return '';
        }
    }
    
    // Get charset from content type
    protected function get_charset_from_content_type($content_type) {
        if (!$content_type) {
            return null;
        }
        
        $content_type_parts = explode(';', $content_type);
        
        foreach ($content_type_parts as $part) {
            $part = trim($part);
            
            if (strpos($part, 'charset=') === 0) {
                $charset = substr($part, 8);
                return trim($charset, " \"'");
            }
        }
        
        return null;
    }
    
    // Define some useful arrays
    protected $self_closing_tags = array(
        'img' => 1,
        'br' => 1,
        'input' => 1,
        'meta' => 1,
        'link' => 1,
        'hr' => 1,
        'base' => 1,
        'embed' => 1,
        'spacer' => 1,
        'area' => 1
    );
    
    protected $block_tags = array(
        'div' => 1,
        'table' => 1,
        'form' => 1
    );
    
    protected $optional_closing_tags = array(
        'tr' => array('td' => 1, 'th' => 1),
        'th' => array('td' => 1, 'th' => 1),
        'td' => array('td' => 1, 'th' => 1),
        'li' => array('li' => 1),
        'dt' => array('dd' => 1, 'dt' => 1),
        'dd' => array('dd' => 1, 'dt' => 1),
        'dl' => array('dd' => 1, 'dt' => 1),
        'p' => array('p' => 1),
        'option' => array('option' => 1)
    );
}

// Global functions
function str_get_html($str, $lowercase = true, $stripRN = true, $defaultBRText = DEFAULT_BR_TEXT, $defaultSpanText = DEFAULT_SPAN_TEXT) {
    return new simple_html_dom($str, $lowercase, $stripRN, $defaultBRText, $defaultSpanText);
}

function file_get_html($url, $use_include_path = false, $context = null, $offset = 0, $maxLen = -1, $lowercase = true, $stripRN = true, $defaultBRText = DEFAULT_BR_TEXT, $defaultSpanText = DEFAULT_SPAN_TEXT) {
    $contents = file_get_contents($url, $use_include_path, $context, $offset, $maxLen);
    
    if (empty($contents) || strlen($contents) > MAX_FILE_SIZE) {
        return false;
    }
    
    return str_get_html($contents, $lowercase, $stripRN, $defaultBRText, $defaultSpanText);
}

// Dump HTML DOM Tree
function dump_html_tree($node, $show_attr = true, $deep = 0) {
    $node->dump($show_attr, $deep);
}