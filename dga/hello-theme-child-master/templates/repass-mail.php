<?php
/**
 * DGA Password Reset Email Template
 * Professional email template inspired by government standards
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get template variables
$user_name = isset($args['user_name']) ? $args['user_name'] : '';
$reset_link = isset($args['reset_link']) ? $args['reset_link'] : '';
$site_name = get_bloginfo('name');
$site_url = home_url();
$logo_url = isset($args['logo_url']) ? $args['logo_url'] : '';
$user_email = isset($args['user_email']) ? $args['user_email'] : '';
$request_ip = isset($args['request_ip']) ? $args['request_ip'] : '';
$request_time = isset($args['request_time']) ? $args['request_time'] : current_time('mysql');
?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title><?php echo esc_html__('รีเซ็ทรหัสผ่าน', DGA_TEXT_DOMAIN); ?> - <?php echo esc_html($site_name); ?></title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        /* Reset styles */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        
        /* Remove default styling */
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100% !important; }
        
        /* Font import */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        /* Button styles for better compatibility */
        .button-link {
            background: #2563eb !important;
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%) !important;
            color: #ffffff !important;
            display: inline-block !important;
            text-decoration: none !important;
            font-weight: 600 !important;
            padding: 16px 10px !important;
            border-radius: 6px !important;
        }
        
        /* Mobile styles */
        @media screen and (max-width: 600px) {
            .mobile-hide { display: none !important; }
            .mobile-center { text-align: center !important; }
            .container { width: 100% !important; max-width: 100% !important; }
            .content { padding: 20px !important; }
            .header { padding: 20px !important; }
            .button { width: 100% !important; max-width: 300px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    
    <!-- Preheader Text -->
    <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        <?php echo esc_html__('คำขอรีเซ็ทรหัสผ่านสำหรับบัญชีของคุณ', DGA_TEXT_DOMAIN); ?> - <?php echo esc_html($site_name); ?>
    </div>
    
    <!-- Email Wrapper -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc;">
        <tr>
            <td align="center" style="padding: 20px;">
                
                <!-- Container -->
                <table cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td class="header" style="background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); padding: 25px 30px 20px 30px; text-align: center;">
                            <?php if ($logo_url): ?>
                                <img src="<?php echo esc_url($logo_url); ?>" alt="<?php echo esc_attr($site_name); ?>" style="max-height: 60px; max-width: 200px; width: auto; height: auto; margin-bottom: 8px;">
                            <?php else: ?>
                                <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">
                                    <?php echo esc_html($site_name); ?>
                                </h1>
                            <?php endif; ?>
                            <div style="width: 60px; height: 3px; background-color: #f97316; margin: 0 auto; border-radius: 2px;"></div>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td class="content" style="padding: 40px;">
                            
                            
                            
                            <!-- Greeting -->
                            <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 24px; font-weight: 600; text-align: center;">
                                <?php echo esc_html__('คำขอรีเซ็ทรหัสผ่าน', DGA_TEXT_DOMAIN); ?>
                            </h2>
                            
                            <p style="margin: 0 0 25px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                                <?php echo sprintf(esc_html__('เรียน %s', DGA_TEXT_DOMAIN), esc_html($user_name)); ?>,
                            </p>
                            
                            <p style="margin: 0 0 25px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                                <?php echo esc_html__('เราได้รับคำขอรีเซ็ทรหัสผ่านสำหรับบัญชีของคุณ หากคุณไม่ได้ทำการร้องขอนี้ กรุณาเพิกเฉยอีเมลฉบับนี้ได้เลย', DGA_TEXT_DOMAIN); ?>
                            </p>
                            
                            <!-- Request Info Box -->
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 0 0 30px 0;">
                                <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                    <?php echo esc_html__('รายละเอียดคำขอ', DGA_TEXT_DOMAIN); ?>
                                </h3>
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 5px 0; color: #64748b; font-size: 14px;">
                                            <strong><?php echo esc_html__('อีเมล:', DGA_TEXT_DOMAIN); ?></strong>
                                        </td>
                                        <td style="padding: 5px 0 5px 20px; color: #1e293b; font-size: 14px;">
                                            <?php echo esc_html($user_email); ?>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0; color: #64748b; font-size: 14px;">
                                            <strong><?php echo esc_html__('วันที่:', DGA_TEXT_DOMAIN); ?></strong>
                                        </td>
                                        <td style="padding: 5px 0 5px 20px; color: #1e293b; font-size: 14px;">
                                            <?php echo esc_html(date_i18n('j F Y เวลา H:i น.', strtotime($request_time))); ?>
                                        </td>
                                    </tr>
                                    
                                    <tr>
                                        <td style="padding: 5px 0 5px 20px; color: #1e293b; font-size: 14px;">
                                            <?php echo esc_html($request_ip); ?>
                                        </td>
                                    </tr>
                                    <?php endif; ?>
                                </table>
                            </div>
                            
                            <!-- CTA Section -->
                            <div style="text-align: center; margin: 0 0 30px 0;">
                                <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                                    <?php echo esc_html__('คลิกปุ่มด้านล่างเพื่อตั้งค่ารหัสผ่านใหม่:', DGA_TEXT_DOMAIN); ?>
                                </p>
                                
                                <!-- Button -->
                                <!--[if mso]>
                                <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                    <tr>
                                        <td align="center" bgcolor="#2563eb" style="background-color: #2563eb; border-radius: 6px; padding: 0;">
                                            <a href="<?php echo esc_url($reset_link); ?>" target="_blank" style="display: inline-block; padding: 16px 40px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px; font-family: 'Inter', Arial, sans-serif;">
                                                <?php echo esc_html__('ตั้งค่ารหัสผ่านใหม่', DGA_TEXT_DOMAIN); ?>
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <![endif]-->
                                <!--[if !mso]><!-->
                                <table cellpadding="0" cellspacing="0" border="0" align="center" class="button" style="margin: 0 auto;">
                                    <tr>
                                        <td align="center" style="background: #2563eb; background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); border-radius: 6px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.1);">
                                            <a href="<?php echo esc_url($reset_link); ?>" target="_blank" class="button-link" style="display: inline-block; padding: 16px 40px; color: #ffffff !important; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px; text-align: center; font-family: 'Inter', Arial, sans-serif;">
                                                <?php echo esc_html__('ตั้งค่ารหัสผ่านใหม่', DGA_TEXT_DOMAIN); ?>
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <!--<![endif]-->
                            </div>
                            
                            <!-- Alternative Link -->
                            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 15px; margin: 0 0 25px 0;">
                                <p style="margin: 0 0 8px 0; color: #92400e; font-size: 13px; font-weight: 600;">
                                    <?php echo esc_html__('หากปุ่มด้านบนไม่ทำงาน:', DGA_TEXT_DOMAIN); ?>
                                </p>
                                <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.5; word-break: break-all;">
                                    <?php echo esc_html__('คัดลอกและวางลิงก์นี้ในเบราว์เซอร์ของคุณ:', DGA_TEXT_DOMAIN); ?><br>
                                    <a href="<?php echo esc_url($reset_link); ?>" style="color: #ea580c; text-decoration: underline; font-size: 12px;">
                                        <?php echo esc_html($reset_link); ?>
                                    </a>
                                </p>
                            </div>
                            
                            <!-- Security Notice -->
                            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
                                <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                                    <strong><?php echo esc_html__('หมายเหตุด้านความปลอดภัย:', DGA_TEXT_DOMAIN); ?></strong>
                                </p>
                                <ul style="margin: 0; padding: 0 0 0 20px; color: #64748b; font-size: 13px; line-height: 1.6;">
                                    <li><?php echo esc_html__('ลิงก์นี้จะหมดอายุภายใน 24 ชั่วโมง', DGA_TEXT_DOMAIN); ?></li>
                                    <li><?php echo esc_html__('ลิงก์นี้สามารถใช้ได้เพียงครั้งเดียวเท่านั้น', DGA_TEXT_DOMAIN); ?></li>
                                    <li><?php echo esc_html__('หากคุณไม่ได้ขอรีเซ็ทรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบทันที', DGA_TEXT_DOMAIN); ?></li>
                                </ul>
                            </div>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px;">
                                <?php echo esc_html__('อีเมลนี้ส่งมาจาก', DGA_TEXT_DOMAIN); ?> 
                                <a href="<?php echo esc_url($site_url); ?>" style="color: #2563eb; text-decoration: none;">
                                    <?php echo esc_html($site_name); ?>
                                </a>
                            </p>
                            <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                                © <?php echo date('Y'); ?> <?php echo esc_html($site_name); ?>. 
                                <?php echo esc_html__('สงวนลิขสิทธิ์', DGA_TEXT_DOMAIN); ?>
                            </p>
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
    
</body>
</html>