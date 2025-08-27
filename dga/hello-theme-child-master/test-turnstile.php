<?php
/**
 * Template Name: Test Turnstile
 * Description: Test page for CloudFlare Turnstile
 */

get_header();
?>

<div style="max-width: 600px; margin: 50px auto; padding: 20px;">
    <h1>ทดสอบ CloudFlare Turnstile</h1>
    
    <!-- Test 1: Simple Integration -->
    <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h2>Test 1: Simple CAPTCHA</h2>
        <div class="cf-turnstile" 
             data-sitekey="0x4AAAAAABpd_WTHpqQRJg6v"
             data-callback="testCallback"></div>
        <div id="result1" style="margin-top: 10px;"></div>
    </div>
    
    <!-- Test 2: Form with CAPTCHA -->
    <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h2>Test 2: Form with CAPTCHA</h2>
        <form id="test-form">
            <input type="email" placeholder="Enter email" style="width: 100%; padding: 10px; margin-bottom: 10px;">
            <div id="turnstile-container"></div>
            <button type="submit" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Submit Test
            </button>
        </form>
        <div id="result2" style="margin-top: 10px;"></div>
    </div>
    
    <!-- Test 3: Verify Token -->
    <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h2>Test 3: Verify Token (AJAX)</h2>
        <button onclick="testVerification()" style="padding: 10px 20px; background: #16a34a; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Test Server Verification
        </button>
        <div id="result3" style="margin-top: 10px;"></div>
    </div>
</div>

<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad" defer></script>
<script>
let testToken = null;

// Callback when Turnstile loads
function onTurnstileLoad() {
    console.log('Turnstile API loaded');
    
    // Render in container
    if (window.turnstile && document.getElementById('turnstile-container')) {
        turnstile.render('#turnstile-container', {
            sitekey: '0x4AAAAAABpd_WTHpqQRJg6v',
            callback: function(token) {
                testToken = token;
                document.getElementById('result2').innerHTML = 
                    '<strong style="color: green;">✅ Token received!</strong>';
                console.log('Token:', token.substring(0, 30) + '...');
            }
        });
    }
}

// Simple callback
function testCallback(token) {
    testToken = token;
    document.getElementById('result1').innerHTML = 
        '<strong style="color: green;">✅ CAPTCHA Success!</strong><br>' +
        'Token: ' + token.substring(0, 30) + '...';
}

// Test form submission
document.getElementById('test-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    if (testToken) {
        document.getElementById('result2').innerHTML += 
            '<br><strong style="color: blue;">Form submitted with token!</strong>';
    } else {
        document.getElementById('result2').innerHTML = 
            '<strong style="color: red;">❌ No token available</strong>';
    }
});

// Test server verification
function testVerification() {
    if (!testToken) {
        document.getElementById('result3').innerHTML = 
            '<strong style="color: red;">❌ No token to verify</strong>';
        return;
    }
    
    // Create test AJAX request
    const formData = new FormData();
    formData.append('action', 'test_turnstile_verify');
    formData.append('token', testToken);
    formData.append('nonce', '<?php echo wp_create_nonce("test_turnstile"); ?>');
    
    fetch('<?php echo admin_url("admin-ajax.php"); ?>', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('result3').innerHTML = 
            '<strong>Server Response:</strong><br>' +
            '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
    })
    .catch(error => {
        document.getElementById('result3').innerHTML = 
            '<strong style="color: red;">Error: ' + error + '</strong>';
    });
}
</script>

<?php
// Add test AJAX handler
add_action('wp_ajax_test_turnstile_verify', 'test_turnstile_verify_handler');
add_action('wp_ajax_nopriv_test_turnstile_verify', 'test_turnstile_verify_handler');

function test_turnstile_verify_handler() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'], 'test_turnstile')) {
        wp_send_json_error('Invalid nonce');
    }
    
    $token = $_POST['token'];
    
    // Use your verification function
    $result = verify_turnstile_token_kzn427($token);
    
    if ($result === true) {
        wp_send_json_success('Token verified successfully!');
    } else {
        wp_send_json_error('Verification failed: ' . $result);
    }
}

// Your working verification function
function verify_turnstile_token_kzn427($token) {
    $secret_key = '0x4AAAAAABpd_Sn33uhKowODW-wXtYOuHms';
    $verify_url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    
    $data = array(
        'secret' => $secret_key,
        'response' => $token,
        'remoteip' => $_SERVER['REMOTE_ADDR']
    );
    
    $response = wp_remote_post($verify_url, array(
        'body' => $data,
        'timeout' => 10,
        'sslverify' => true
    ));
    
    if (is_wp_error($response)) {
        return 'Connection error: ' . $response->get_error_message();
    }
    
    $body = wp_remote_retrieve_body($response);
    $result = json_decode($body, true);
    
    if (isset($result['success']) && $result['success'] === true) {
        return true;
    }
    
    $error_codes = isset($result['error-codes']) ? implode(', ', $result['error-codes']) : 'Unknown error';
    return $error_codes;
}

get_footer();
?>