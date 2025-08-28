<?php
/**
 * Contact Form Email Template
 * Location: /wp-content/themes/your-child-theme/templates/contact-mail.php
 * 
 * Available variables:
 * $type - 'admin' or 'user'
 * $site_name, $site_url, $site_description
 * $logo_url - Site logo URL
 * $contact_name, $contact_email, $contact_message, $contact_phone
 * $ip_address, $submission_time
 * $current_date, $current_time, $current_year
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}
?>
<!DOCTYPE html>
<html lang="th" xml:lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title><?php echo $type === 'admin' ? 'ข้อความติดต่อใหม่' : 'ยืนยันการส่งข้อความ'; ?></title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #374151; background-color: #f9fafb;">
    
    <!-- Email Wrapper -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                
                <!-- Email Container -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
                    
                    <!-- Header Section -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
                            
                            <?php if (!empty($logo_url)): ?>
                            <!-- Logo -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <img src="<?php echo esc_url($logo_url); ?>" 
                                             alt="<?php echo esc_attr($site_name); ?>" 
                                             style="max-height: 60px; max-width: 250px; width: auto; height: auto; display: block;"
                                             border="0">
                                    </td>
                                </tr>
                            </table>
                            <?php endif; ?>
                            
                            <!-- Site Name -->
                            <h1 style="margin: 0; color: #222222ff; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <?php echo esc_html($site_name); ?>
                            </h1>
                            
                            <?php if (!empty($site_description)): ?>
                            <p style="margin: 10px 0 0 0; color: rgba(54, 54, 54, 0.9); font-size: 14px;">
                                <?php echo esc_html($site_description); ?>
                            </p>
                            <?php endif; ?>
                        </td>
                    </tr>
                    
                    <!-- Date Bar -->
                    <tr>
                        <td style="background-color: #ea580c; padding: 10px 30px; text-align: center;">
                            <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 500;">
                                📅 <?php echo esc_html($current_date); ?> | ⏰ <?php echo esc_html($current_time); ?>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            
                            <?php if ($type === 'admin'): ?>
                            <!-- Admin Email Content -->
                            
                            <!-- Title -->
                            <h2 style="margin: 0 0 20px 0; color: #1e3a8a; font-size: 24px; font-weight: 600;">
                                📨 ข้อความติดต่อใหม่
                            </h2>
                            
                            <!-- Introduction -->
                            <p style="margin: 0 0 30px 0; color: #374151;">
                                มีผู้ติดต่อส่งข้อความผ่านแบบฟอร์มติดต่อหน่วยงาน โดยมีรายละเอียดดังนี้:
                            </p>
                            
                            <!-- Contact Information Box -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 6px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        
                                        <!-- Contact Name -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 15px;">
                                            <tr>
                                                <td width="35%" style="padding: 8px 0; color: #6b7280; font-weight: 600; font-size: 14px; vertical-align: top;">
                                                    👤 ชื่อผู้ติดต่อ:
                                                </td>
                                                <td style="padding: 8px 0; color: #1e3a8a; font-weight: 500; font-size: 16px;">
                                                    <?php echo esc_html($contact_name); ?>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Email -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 15px;">
                                            <tr>
                                                <td width="35%" style="padding: 8px 0; color: #6b7280; font-weight: 600; font-size: 14px; vertical-align: top;">
                                                    ✉️ อีเมล:
                                                </td>
                                                <td style="padding: 8px 0;">
                                                    <a href="mailto:<?php echo esc_attr($contact_email); ?>" 
                                                       style="color: #ea580c; text-decoration: none; font-weight: 500; font-size: 16px;">
                                                        <?php echo esc_html($contact_email); ?>
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <?php if (!empty($contact_phone)): ?>
                                        <!-- Phone -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="35%" style="padding: 8px 0; color: #6b7280; font-weight: 600; font-size: 14px; vertical-align: top;">
                                                    📱 โทรศัพท์:
                                                </td>
                                                <td style="padding: 8px 0; color: #374151; font-weight: 500; font-size: 16px;">
                                                    <?php echo esc_html($contact_phone); ?>
                                                </td>
                                            </tr>
                                        </table>
                                        <?php endif; ?>
                                        
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Message Section -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
                                <tr>
                                    <td>
                                        <h3 style="margin: 0 0 15px 0; color: #1e3a8a; font-size: 18px; font-weight: 600;">
                                            📝 ข้อความ:
                                        </h3>
                                        <div style="background-color: #ffffff; border: 2px solid #ea580c; border-radius: 6px; padding: 20px;">
                                            <p style="margin: 0; color: #374151; white-space: pre-wrap; word-wrap: break-word;">
<?php echo esc_html($contact_message); ?>
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Meta Information -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-radius: 6px; padding: 15px;">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 5px 0; color: #92400e; font-size: 13px;">
                                            <strong>📍 ข้อมูลเพิ่มเติม:</strong>
                                        </p>
                                        <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.8;">
                                            IP Address: <?php echo esc_html($ip_address); ?><br>
                                            เวลาที่ส่ง: <?php echo esc_html($submission_time); ?>
                                            <?php if (!empty($user_agent)): ?>
                                            <br>Browser: <?php echo esc_html(substr($user_agent, 0, 100)); ?>
                                            <?php endif; ?>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Quick Actions -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 30px;">
                                <tr>
                                    <td align="center">
                                        <a href="mailto:<?php echo esc_attr($contact_email); ?>?subject=Re: ติดต่อจาก <?php echo esc_attr($site_name); ?>" 
                                           style="display: inline-block; padding: 12px 30px; background-color: #ea580c; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                                            ↩️ ตอบกลับอีเมล
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <?php else: ?>
                            <!-- User Email Content -->
                            
                            <!-- Title -->
                            <h2 style="margin: 0 0 20px 0; color: #1e3a8a; font-size: 24px; font-weight: 600;">
                                ✅ ยืนยันการส่งข้อความสำเร็จ
                            </h2>
                            
                            <!-- Greeting -->
                            <p style="margin: 0 0 10px 0; color: #374151; font-size: 16px;">
                                เรียน คุณ<?php echo esc_html($contact_name); ?>
                            </p>
                            
                            <!-- Confirmation Message -->
                            <p style="margin: 0 0 30px 0; color: #374151;">
                                ขอบคุณที่ติดต่อเรา เราได้รับข้อความของคุณเรียบร้อยแล้ว และจะดำเนินการตรวจสอบและติดต่อกลับโดยเร็วที่สุด
                            </p>
                            
                            <!-- Message Copy -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; border-left: 4px solid #ea580c; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h3 style="margin: 0 0 15px 0; color: #1e3a8a; font-size: 16px; font-weight: 600;">
                                            📋 สำเนาข้อความของคุณ:
                                        </h3>
                                        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px; padding: 15px;">
                                            <p style="margin: 0; color: #374151; white-space: pre-wrap; word-wrap: break-word;">
<?php echo esc_html($contact_message); ?>
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Working Hours Info -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #dbeafe; border-radius: 6px; text-align: center; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <h3 style="margin: 0 0 10px 0; color: #1e3a8a; font-size: 16px; font-weight: 600;">
                                            🕐 เวลาทำการ
                                        </h3>
                                        <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.8;">
                                            จันทร์ - ศุกร์ | 08:30 - 16:30 น.<br>
                                            <strong>เราจะติดต่อกลับภายใน 1-2 วันทำการ</strong>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Additional Info -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0fdf4; border-radius: 6px; padding: 15px;">
                                <tr>
                                    <td>
                                        <p style="margin: 0; color: #166534; font-size: 14px; text-align: center;">
                                            💡 <strong>เคล็ดลับ:</strong> กรุณาเก็บอีเมลนี้ไว้เป็นหลักฐานการติดต่อ
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Reference Number -->
                            <p style="margin: 25px 0 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                Reference: #<?php echo date('Ymd-His', strtotime($submission_time)); ?>
                            </p>
                            
                            <?php endif; ?>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer Section -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 2px solid #e5e7eb;">
                            
                            <!-- Organization Info -->
                            <h3 style="margin: 0 0 10px 0; color: #1e3a8a; font-size: 18px; font-weight: 600;">
                                <?php echo esc_html($site_name); ?>
                            </h3>
                            
                            <?php if (!empty($admin_email)): ?>
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                                📧 <a href="mailto:<?php echo esc_attr($admin_email); ?>" style="color: #ea580c; text-decoration: none;">
                                    <?php echo esc_html($admin_email); ?>
                                </a>
                            </p>
                            <?php endif; ?>
                            
                            <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px;">
                                🌐 <a href="<?php echo esc_url($site_url); ?>" style="color: #ea580c; text-decoration: none;">
                                    <?php echo esc_html(str_replace(['http://', 'https://'], '', $site_url)); ?>
                                </a>
                            </p>
                            
                            <!-- Social Media (Optional) -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 0 5px;">
                                        <a href="#" style="display: inline-block; width: 32px; height: 32px; background-color: #1e3a8a; border-radius: 50%; text-align: center; line-height: 32px;">
                                            <img src="https://cdn-icons-png.flaticon.com/32/733/733547.png" alt="Facebook" width="16" height="16" style="vertical-align: middle;">
                                        </a>
                                    </td>
                                    <td style="padding: 0 5px;">
                                        <a href="#" style="display: inline-block; width: 32px; height: 32px; background-color: #1e3a8a; border-radius: 50%; text-align: center; line-height: 32px;">
                                            <img src="https://cdn-icons-png.flaticon.com/32/733/733579.png" alt="Twitter" width="16" height="16" style="vertical-align: middle;">
                                        </a>
                                    </td>
                                    <td style="padding: 0 5px;">
                                        <a href="#" style="display: inline-block; width: 32px; height: 32px; background-color: #1e3a8a; border-radius: 50%; text-align: center; line-height: 32px;">
                                            <img src="https://cdn-icons-png.flaticon.com/32/174/174857.png" alt="LinkedIn" width="16" height="16" style="vertical-align: middle;">
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Copyright -->
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © <?php echo esc_html($current_year); ?> <?php echo esc_html($site_name); ?>. All rights reserved.
                            </p>
                            
                            <!-- Unsubscribe (for user emails) -->
                            <?php if ($type === 'user'): ?>
                            <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 11px;">
                                อีเมลนี้ส่งมาจากแบบฟอร์มติดต่อบนเว็บไซต์ <?php echo esc_html($site_name); ?>
                            </p>
                            <?php endif; ?>
                            
                        </td>
                    </tr>
                    
                </table>
                <!-- End Email Container -->
                
            </td>
        </tr>
    </table>
    <!-- End Email Wrapper -->
    
</body>
</html>