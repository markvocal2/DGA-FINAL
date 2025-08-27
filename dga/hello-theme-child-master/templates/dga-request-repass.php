<?php
/**
 * Email Template: Password Reset Request
 * 
 * Available variables:
 * $user - WP_User object
 * $user_login - Username
 * $reset_key - Password reset key
 * $reset_url - Complete reset URL
 * $site_name - Site name
 * $site_url - Site URL
 * $logo_url - Logo URL
 * $request_time - Request timestamp
 * $ip_address - IP address
 * $expiry_hours - Link expiry in hours
 * $user_agent - User agent string
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Calculate expiry time
$expiry_time = date_i18n(get_option('date_format') . ' ' . get_option('time_format'), 
                         strtotime($request_time) + ($expiry_hours * 3600));

// Detect browser
$browser = 'Unknown';
if (strpos($user_agent, 'Chrome') !== false) $browser = 'Chrome';
elseif (strpos($user_agent, 'Safari') !== false) $browser = 'Safari';
elseif (strpos($user_agent, 'Firefox') !== false) $browser = 'Firefox';
elseif (strpos($user_agent, 'Edge') !== false) $browser = 'Edge';
?>
<!DOCTYPE html>
<html lang="<?php echo get_locale(); ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php _e('Password Reset Request', DGA_TEXT_DOMAIN); ?></title>
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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    
    <!-- Wrapper -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f7fa; min-height: 100vh;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                
                <!-- Main Container -->
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Header Section -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #003366 0%, #004080 100%); padding: 35px 30px; text-align: center; position: relative;">
                            <!-- Pattern Overlay -->
                            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1; background-image: repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px);"></div>
                            
                            <?php if (!empty($logo_url)) : ?>
                                <img src="<?php echo esc_url($logo_url); ?>" alt="<?php echo esc_attr($site_name); ?>" style="max-width: 180px; height: auto; margin-bottom: 15px; filter: brightness(0) invert(1);">
                            <?php endif; ?>
                            
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 1px; text-transform: uppercase;">
                                <?php echo esc_html($site_name); ?>
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Alert Status Bar -->
                    <tr>
                        <td style="background: linear-gradient(90deg, #ff6b35 0%, #ff8c42 100%); padding: 18px; text-align: center;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="color: #ffffff; font-size: 15px; font-weight: 600; letter-spacing: 0.5px;">
                                        <span style="font-size: 20px; vertical-align: middle;">🔐</span> 
                                        <?php _e('PASSWORD RESET REQUEST', DGA_TEXT_DOMAIN); ?>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Urgent Notice Bar -->
                    <tr>
                        <td style="background-color: #fef3c7; padding: 12px; text-align: center; border-bottom: 2px solid #fbbf24;">
                            <p style="color: #92400e; margin: 0; font-size: 13px; font-weight: 600;">
                                ⏰ <?php printf(__('This link expires in %d hours', DGA_TEXT_DOMAIN), $expiry_hours); ?>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content Body -->
                    <tr>
                        <td style="padding: 45px 35px;">
                            
                            <!-- Greeting -->
                            <h2 style="color: #003366; font-size: 22px; margin: 0 0 25px 0; font-weight: 600;">
                                <?php printf(__('Dear %s,', DGA_TEXT_DOMAIN), esc_html($user->display_name)); ?>
                            </h2>
                            
                            <!-- Request Confirmation -->
                            <div style="background: linear-gradient(135deg, #e8f4fd 0%, #f0f9ff 100%); border-left: 5px solid #003366; padding: 18px; margin-bottom: 30px; border-radius: 0 6px 6px 0;">
                                <p style="color: #003366; margin: 0; font-size: 16px; line-height: 1.7;">
                                    <strong>🔑 <?php _e('Password Reset Requested', DGA_TEXT_DOMAIN); ?></strong><br>
                                    <span style="color: #004080; font-size: 14px;">
                                        <?php _e('Someone requested a password reset for your account. If this was you, click the button below to create a new password.', DGA_TEXT_DOMAIN); ?>
                                    </span>
                                </p>
                            </div>
                            
                            <!-- Request Information -->
                            <div style="background-color: #fafbfc; border: 1px solid #e5e7eb; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
                                <h3 style="color: #003366; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 20px 0; font-weight: 700; border-bottom: 2px solid #ff6b35; padding-bottom: 10px; display: inline-block;">
                                    <?php _e('Request Information', DGA_TEXT_DOMAIN); ?>
                                </h3>
                                
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; width: 45%; vertical-align: top;">
                                            <strong><?php _e('Account Email:', DGA_TEXT_DOMAIN); ?></strong>
                                        </td>
                                        <td style="padding: 10px 0; color: #111827; font-size: 14px;">
                                            <span style="background-color: #e8f4fd; padding: 3px 8px; border-radius: 4px;">
                                                <?php echo esc_html($user->user_email); ?>
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                                            <strong><?php _e('Username:', DGA_TEXT_DOMAIN); ?></strong>
                                        </td>
                                        <td style="padding: 10px 0; color: #111827; font-size: 14px;">
                                            <?php echo esc_html($user_login); ?>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                                            <strong><?php _e('Request Time:', DGA_TEXT_DOMAIN); ?></strong>
                                        </td>
                                        <td style="padding: 10px 0; color: #111827; font-size: 14px;">
                                            <?php echo date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($request_time)); ?>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                                            <strong><?php _e('From IP:', DGA_TEXT_DOMAIN); ?></strong>
                                        </td>
                                        <td style="padding: 10px 0; color: #111827; font-size: 14px; font-family: 'Courier New', monospace;">
                                            <?php echo esc_html($ip_address); ?>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                                            <strong><?php _e('Browser:', DGA_TEXT_DOMAIN); ?></strong>
                                        </td>
                                        <td style="padding: 10px 0; color: #111827; font-size: 14px;">
                                            <?php echo esc_html($browser); ?>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                                            <strong><?php _e('Valid Until:', DGA_TEXT_DOMAIN); ?></strong>
                                        </td>
                                        <td style="padding: 10px 0;">
                                            <span style="color: #ff6b35; font-size: 14px; font-weight: 600;">
                                                <?php echo $expiry_time; ?>
                                            </span>
                                            <span style="background-color: #ff6b35; color: #ffffff; padding: 2px 8px; border-radius: 3px; font-size: 11px; margin-left: 8px;">
                                                <?php echo sprintf(__('%d HRS', DGA_TEXT_DOMAIN), $expiry_hours); ?>
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Reset Password CTA -->
                            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e8f4fd 100%); padding: 35px; border-radius: 8px; text-align: center; margin-bottom: 30px; border: 2px dashed #003366;">
                                <div style="margin-bottom: 20px;">
                                    <span style="font-size: 48px;">🔐</span>
                                </div>
                                
                                <h3 style="color: #003366; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">
                                    <?php _e('Ready to Reset Your Password?', DGA_TEXT_DOMAIN); ?>
                                </h3>
                                
                                <p style="color: #6b7280; font-size: 14px; margin: 0 0 25px 0; line-height: 1.6;">
                                    <?php _e('Click the button below to create a new secure password for your account.', DGA_TEXT_DOMAIN); ?>
                                </p>
                                
                                <a href="<?php echo esc_url($reset_url); ?>" style="display: inline-block; background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 6px; font-weight: 700; font-size: 16px; box-shadow: 0 6px 16px rgba(255,107,53,0.35); text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.3s;">
                                    <?php _e('RESET PASSWORD NOW', DGA_TEXT_DOMAIN); ?>
                                </a>
                                
                                <div style="margin-top: 25px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
                                    <p style="color: #6b7280; font-size: 11px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                                        <?php _e('Or copy this link:', DGA_TEXT_DOMAIN); ?>
                                    </p>
                                    <div style="background-color: #ffffff; padding: 12px; border-radius: 4px; border: 1px solid #e5e7eb;">
                                        <a href="<?php echo esc_url($reset_url); ?>" style="color: #ff6b35; word-break: break-all; font-size: 12px; text-decoration: none; font-family: 'Courier New', monospace;">
                                            <?php echo esc_html($reset_url); ?>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Security Alert -->
                            <div style="background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%); border: 2px solid #ef4444; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td style="width: 40px; vertical-align: top; padding-top: 2px;">
                                            <span style="font-size: 24px;">🚨</span>
                                        </td>
                                        <td>
                                            <h4 style="color: #991b1b; margin: 0 0 8px 0; font-size: 15px; font-weight: 700;">
                                                <?php _e('Didn\'t Request This?', DGA_TEXT_DOMAIN); ?>
                                            </h4>
                                            <p style="color: #7f1d1d; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
                                                <?php _e('If you did not request a password reset, someone may be trying to access your account.', DGA_TEXT_DOMAIN); ?>
                                            </p>
                                            <ul style="color: #7f1d1d; font-size: 13px; margin: 10px 0 0 0; padding-left: 20px; line-height: 1.8;">
                                                <li><?php _e('Ignore this email - your password won\'t change', DGA_TEXT_DOMAIN); ?></li>
                                                <li><?php _e('Review your recent account activity', DGA_TEXT_DOMAIN); ?></li>
                                                <li><?php _e('Enable two-factor authentication for extra security', DGA_TEXT_DOMAIN); ?></li>
                                            </ul>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Password Tips -->
                            <div style="background-color: #fafbfc; padding: 20px; border-radius: 6px; border-left: 3px solid #ff6b35;">
                                <h4 style="color: #003366; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
                                    💡 <?php _e('Password Security Tips:', DGA_TEXT_DOMAIN); ?>
                                </h4>
                                <ul style="color: #6b7280; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                    <li><?php _e('Use at least 12 characters', DGA_TEXT_DOMAIN); ?></li>
                                    <li><?php _e('Mix uppercase, lowercase, numbers, and symbols', DGA_TEXT_DOMAIN); ?></li>
                                    <li><?php _e('Avoid common words or personal information', DGA_TEXT_DOMAIN); ?></li>
                                    <li><?php _e('Use a unique password for this account', DGA_TEXT_DOMAIN); ?></li>
                                    <li><?php _e('Consider using a password manager', DGA_TEXT_DOMAIN); ?></li>
                                </ul>
                            </div>
                            
                            <!-- Support Section -->
                            <div style="text-align: center; padding-top: 30px; border-top: 1px solid #e5e7eb; margin-top: 30px;">
                                <h4 style="color: #003366; font-size: 14px; margin: 0 0 15px 0; font-weight: 600;">
                                    <?php _e('Need Assistance?', DGA_TEXT_DOMAIN); ?>
                                </h4>
                                <p style="color: #6b7280; font-size: 13px; line-height: 1.8; margin: 0;">
                                    <?php _e('Our security team is available 24/7 to help you', DGA_TEXT_DOMAIN); ?>
                                </p>
                                <div style="margin-top: 15px;">
                                    <a href="<?php echo esc_url($site_url . '/support'); ?>" style="display: inline-block; color: #003366; text-decoration: none; padding: 10px 20px; border: 2px solid #003366; border-radius: 4px; font-weight: 600; font-size: 13px; margin: 0 5px;">
                                        <?php _e('Contact Support', DGA_TEXT_DOMAIN); ?>
                                    </a>
                                    <a href="<?php echo esc_url($site_url . '/security'); ?>" style="display: inline-block; color: #003366; text-decoration: none; padding: 10px 20px; border: 2px solid #003366; border-radius: 4px; font-weight: 600; font-size: 13px; margin: 0 5px;">
                                        <?php _e('Security Center', DGA_TEXT_DOMAIN); ?>
                                    </a>
                                </div>
                            </div>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #003366 0%, #001a33 100%); padding: 30px; text-align: center;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td>
                                        <p style="color: #ffffff; font-size: 13px; margin: 0 0 12px 0; opacity: 0.95;">
                                            <strong><?php echo esc_html($site_name); ?></strong>
                                        </p>
                                        <p style="color: #ffffff; font-size: 11px; margin: 0 0 8px 0; opacity: 0.8; line-height: 1.6;">
                                            © <?php echo date('Y'); ?> <?php _e('All Rights Reserved', DGA_TEXT_DOMAIN); ?> | 
                                            <a href="<?php echo esc_url($site_url . '/privacy'); ?>" style="color: #ff8c42; text-decoration: none;">
                                                <?php _e('Privacy', DGA_TEXT_DOMAIN); ?>
                                            </a> | 
                                            <a href="<?php echo esc_url($site_url . '/terms'); ?>" style="color: #ff8c42; text-decoration: none;">
                                                <?php _e('Terms', DGA_TEXT_DOMAIN); ?>
                                            </a> | 
                                            <a href="<?php echo esc_url($site_url . '/security'); ?>" style="color: #ff8c42; text-decoration: none;">
                                                <?php _e('Security', DGA_TEXT_DOMAIN); ?>
                                            </a>
                                        </p>
                                        <p style="color: #ffffff; font-size: 10px; margin: 15px 0 0 0; opacity: 0.6; line-height: 1.5;">
                                            <?php _e('This is an automated security email. Please do not reply.', DGA_TEXT_DOMAIN); ?><br>
                                            <?php _e('For your protection, this email was sent to the address associated with your account.', DGA_TEXT_DOMAIN); ?>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
    
</body>
</html>