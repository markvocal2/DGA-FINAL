<?php
/**
 * Email Template: Password Change Notification
 * 
 * Available variables:
 * $user - WP_User object
 * $subject - Email subject
 * $changed_by_admin - Boolean
 * $admin_name - Admin display name (if changed by admin)
 * $site_name - Site name
 * $site_url - Site URL
 * $logo_url - Logo URL
 * $change_time - Change timestamp
 * $ip_address - IP address
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}
?>
<!DOCTYPE html>
<html lang="<?php echo get_locale(); ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo esc_html($subject); ?></title>
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
                                        <span style="font-size: 20px; vertical-align: middle;">🔒</span> 
                                        <?php _e('SECURITY ALERT: PASSWORD SUCCESSFULLY CHANGED', DGA_TEXT_DOMAIN); ?>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content Body -->
                    <tr>
                        <td style="padding: 45px 35px;">
                            
                            <!-- Greeting -->
                            <h2 style="color: #003366; font-size: 22px; margin: 0 0 25px 0; font-weight: 600;">
                                <?php printf(__('Dear %s,', DGA_TEXT_DOMAIN), esc_html($user->display_name)); ?>
                            </h2>
                            
                            <!-- Success Confirmation -->
                            <div style="background: linear-gradient(135deg, #e8f4fd 0%, #f0f9ff 100%); border-left: 5px solid #003366; padding: 18px; margin-bottom: 30px; border-radius: 0 6px 6px 0;">
                                <p style="color: #003366; margin: 0; font-size: 16px; line-height: 1.7;">
                                    <strong>✓ <?php _e('Password change completed successfully', DGA_TEXT_DOMAIN); ?></strong><br>
                                    <span style="color: #004080; font-size: 14px;">
                                        <?php _e('Your account password has been updated and is now active.', DGA_TEXT_DOMAIN); ?>
                                    </span>
                                </p>
                            </div>
                            
                            <!-- Transaction Details -->
                            <div style="background-color: #fafbfc; border: 1px solid #e5e7eb; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
                                <h3 style="color: #003366; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 20px 0; font-weight: 700; border-bottom: 2px solid #ff6b35; padding-bottom: 10px; display: inline-block;">
                                    <?php _e('Transaction Details', DGA_TEXT_DOMAIN); ?>
                                </h3>
                                
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; width: 45%; vertical-align: top;">
                                            <strong><?php _e('Account Email:', DGA_TEXT_DOMAIN); ?></strong>
                                        </td>
                                        <td style="padding: 10px 0; color: #111827; font-size: 14px;">
                                            <?php echo esc_html($user->user_email); ?>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                                            <strong><?php _e('Username:', DGA_TEXT_DOMAIN); ?></strong>
                                        </td>
                                        <td style="padding: 10px 0; color: #111827; font-size: 14px;">
                                            <?php echo esc_html($user->user_login); ?>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                                            <strong><?php _e('Date & Time:', DGA_TEXT_DOMAIN); ?></strong>
                                        </td>
                                        <td style="padding: 10px 0; color: #111827; font-size: 14px;">
                                            <?php echo date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($change_time)); ?>
                                        </td>
                                    </tr>
                                    <?php if ($changed_by_admin) : ?>
                                    <tr>
                                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                                            <strong><?php _e('Modified By:', DGA_TEXT_DOMAIN); ?></strong>
                                        </td>
                                        <td style="padding: 10px 0; color: #111827; font-size: 14px;">
                                            <span style="color: #ff6b35; font-weight: 600;">
                                                <?php echo esc_html($admin_name); ?>
                                            </span>
                                            <span style="background-color: #003366; color: #ffffff; padding: 2px 8px; border-radius: 3px; font-size: 11px; margin-left: 8px;">
                                                ADMINISTRATOR
                                            </span>
                                        </td>
                                    </tr>
                                    <?php endif; ?>
                                    
                                </table>
                            </div>
                            
                            <!-- Security Warning -->
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%); border: 2px solid #fbbf24; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td style="width: 40px; vertical-align: top; padding-top: 2px;">
                                            <span style="font-size: 24px;">⚠️</span>
                                        </td>
                                        <td>
                                            <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 15px; font-weight: 700;">
                                                <?php _e('Important Security Notice', DGA_TEXT_DOMAIN); ?>
                                            </h4>
                                            <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.6;">
                                                <?php _e('If you did not authorize this password change, your account may be compromised. Please contact our security team immediately.', DGA_TEXT_DOMAIN); ?>
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- CTA Buttons -->
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="<?php echo esc_url(wp_login_url()); ?>" style="display: inline-block; background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 6px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 8px rgba(255,107,53,0.25); margin: 0 8px 10px 8px;">
                                    <?php _e('Sign In Now', DGA_TEXT_DOMAIN); ?>
                                </a>
                                <a href="<?php echo esc_url($site_url . '/contact'); ?>" style="display: inline-block; background: #ffffff; color: #003366; text-decoration: none; padding: 14px 35px; border-radius: 6px; font-weight: 600; font-size: 15px; border: 2px solid #003366; margin: 0 8px 10px 8px;">
                                    <?php _e('Contact Support', DGA_TEXT_DOMAIN); ?>
                                </a>
                            </div>
                            
                            <!-- Help Section -->
                            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                <p style="color: #6b7280; font-size: 13px; line-height: 1.8; margin: 0;">
                                    <?php _e('For security tips and best practices, visit our', DGA_TEXT_DOMAIN); ?>
                                    <a href="<?php echo esc_url($site_url . '/security'); ?>" style="color: #ff6b35; text-decoration: none; font-weight: 600;">
                                        <?php _e('Security Center', DGA_TEXT_DOMAIN); ?>
                                    </a><br>
                                    <?php _e('Available 24/7 for your protection', DGA_TEXT_DOMAIN); ?>
                                </p>
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
                                                <?php _e('Privacy Policy', DGA_TEXT_DOMAIN); ?>
                                            </a> | 
                                            <a href="<?php echo esc_url($site_url . '/terms'); ?>" style="color: #ff8c42; text-decoration: none;">
                                                <?php _e('Terms of Service', DGA_TEXT_DOMAIN); ?>
                                            </a>
                                        </p>
                                        <p style="color: #ffffff; font-size: 10px; margin: 15px 0 0 0; opacity: 0.6; line-height: 1.5;">
                                            <?php _e('This is an automated security notification from your account management system.', DGA_TEXT_DOMAIN); ?><br>
                                            <?php _e('Please do not reply to this email. For assistance, use the contact links above.', DGA_TEXT_DOMAIN); ?>
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