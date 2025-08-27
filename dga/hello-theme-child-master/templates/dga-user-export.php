<?php
/**
 * Print template for User Roles and Permissions Report
 * 
 * This file is included by the dga_print_template_ajax function
 */

// Prevent direct file access
if (!defined('ABSPATH')) {
    exit;
}

// Access $users variable that was passed from the AJAX handler
if (!isset($users) || !is_array($users)) {
    echo "No data available";
    return;
}

// Get current date and time for the report
$date = current_time('Y-m-d H:i:s');
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>รายงานบทบาทและสิทธิ์ของผู้ใช้</title>
    <style>
        /* Print-specific styling */
        body {
            font-family: 'TH Sarabun New', 'Sarabun', 'Times New Roman', Times, serif;
            color: #000;
            margin: 0;
            padding: 20px;
            font-size: 12pt;
        }
        
        .print-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #002868;
            position: relative;
        }
        
        .print-logo {
            position: absolute;
            top: 0;
            left: 10px;
            width: 80px;
            height: auto;
        }
        
        .print-header h1 {
            color: #002868;
            font-size: 24pt;
            margin: 0 0 10px 0;
        }
        
        .print-header .print-meta {
            font-size: 10pt;
            color: #666;
            text-align: left;
            padding-left: 100px; /* เพิ่ม padding เพื่อให้ตรงกับหัวเรื่อง */
        }
        
        .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .print-table th {
            background-color: #002868;
            color: white;
            padding: 8px;
            text-align: left;
            font-size: 10pt;
        }
        
        .print-table td {
            padding: 6px 8px;
            border-bottom: 1px solid #ddd;
            font-size: 10pt;
        }
        
        .print-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .permission-yes {
            color: green;
            font-weight: bold;
        }
        
        .permission-no {
            color: #999;
        }
        
        .print-footer {
            text-align: center;
            font-size: 9pt;
            color: #666;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    
    <?php
    // Pagination for A4 (40 items per page as requested)
    $users_per_page = 40;
    $total_pages = ceil(count($users) / $users_per_page);
    
    for ($page = 0; $page < $total_pages; $page++) {
        $start = $page * $users_per_page;
        $page_users = array_slice($users, $start, $users_per_page);
        
        // Add page break except for the first page
        if ($page > 0) {
            echo '<div class="page-break"></div>';
        }

        // Header on each page - ส่วนนี้ให้แสดงโลโก้ใหม่
        echo '<div class="print-header">
            <img src="https://www.dga.or.th/wp-content/uploads/2023/01/cropped-LOGO_DGA.png" class="print-logo" alt="DGA Logo">
            <h1>รายงานบทบาทและสิทธิ์ของผู้ใช้</h1>
            <div class="print-meta">
                วันที่สร้าง: ' . esc_html($date) . '
            </div>
        </div>';
        
        echo '<table class="print-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>ชื่อผู้ใช้</th>
                    <th>ชื่อแสดง</th>
                    <th>อีเมล</th>
                    <th>บทบาท</th>
                    <th>สิทธิ์การเข้าถึง</th>
                </tr>
            </thead>
            <tbody>';
        
        foreach ($page_users as $user) {
            $roles_list = implode(', ', $user['roles']);
            $permissions_html = '';
            
            // Format permissions for print
            foreach ($user['permissions'] as $role => $p) {
                $permission_summary = [
                    $p['read'] ? '<span class="permission-yes">อ่าน</span>' : '<span class="permission-no">อ่าน</span>',
                    $p['write'] ? '<span class="permission-yes">เขียน</span>' : '<span class="permission-no">เขียน</span>',
                    $p['edit'] ? '<span class="permission-yes">แก้ไข</span>' : '<span class="permission-no">แก้ไข</span>',
                    $p['delete'] ? '<span class="permission-yes">ลบ</span>' : '<span class="permission-no">ลบ</span>',
                    $p['publish'] ? '<span class="permission-yes">เผยแพร่</span>' : '<span class="permission-no">เผยแพร่</span>'
                ];
                
                $permissions_html .= "<div><strong>" . esc_html($role) . ":</strong> " . 
                    implode(' | ', $permission_summary) . "</div>";
            }
            
            echo '<tr>
                <td>' . esc_html($user['ID']) . '</td>
                <td>' . esc_html($user['user_login']) . '</td>
                <td>' . esc_html($user['display_name']) . '</td>
                <td>' . esc_html($user['user_email']) . '</td>
                <td>' . esc_html($roles_list) . '</td>
                <td>' . $permissions_html . '</td>
            </tr>';
        }
        
        echo '</tbody></table>';
        
        // Page number footer
        echo '<div class="print-footer">
            หน้า ' . ($page + 1) . ' จาก ' . $total_pages . '
        </div>';
    }
    ?>
    
    <script>
        // Auto-print when loaded
        window.onload = function() {
            window.print();
        };
    </script>
</body>
</html>