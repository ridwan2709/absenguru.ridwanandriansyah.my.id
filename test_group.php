<?php
/**
 * Test kirim ke grup WhatsApp
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
date_default_timezone_set('Asia/Jakarta');

require_once 'fonnte_config.php';

echo "<h1>Test Kirim ke Grup WhatsApp</h1>";
echo "<hr>";

$token = FONNTE_TOKEN;
$groupId = FONNTE_GROUP_ID;

echo "<h2>Konfigurasi:</h2>";
echo "Token: " . substr($token, 0, 10) . "...<br>";
echo "Group ID: {$groupId}<br>";
echo "<hr>";

// Test message
$message = "*🧪 TEST KIRIM KE GRUP*\n\n";
$message .= "Pesan test dari sistem absensi guru.\n\n";
$message .= "Waktu: " . date('d/m/Y H:i:s');

echo "<h2>Pesan yang akan dikirim:</h2>";
echo "<pre style='background:#f5f5f5; padding:15px;'>";
echo htmlspecialchars($message);
echo "</pre>";

echo "<h2>Mengirim...</h2>";

// Kirim dengan cURL
$curl = curl_init();

$data = [
    'target' => $groupId,
    'message' => $message,
    'countryCode' => '62'
];

echo "<h3>Data yang dikirim:</h3>";
echo "<pre style='background:#f5f5f5; padding:15px;'>";
echo json_encode($data, JSON_PRETTY_PRINT);
echo "</pre>";

curl_setopt_array($curl, [
    CURLOPT_URL => FONNTE_API_URL,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => '',
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_POSTFIELDS => json_encode($data),
    CURLOPT_HTTPHEADER => [
        'Authorization: ' . $token,
        'Content-Type: application/json'
    ],
]);

$response = curl_exec($curl);
$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$curlError = curl_error($curl);
curl_close($curl);

echo "<h2>Response dari Fonnte:</h2>";
echo "<table border='1' cellpadding='10' style='border-collapse:collapse;'>";
echo "<tr><td><strong>HTTP Code</strong></td><td style='color:" . ($httpCode == 200 ? 'green' : 'red') . ";'><strong>{$httpCode}</strong></td></tr>";

if ($curlError) {
    echo "<tr><td><strong>cURL Error</strong></td><td style='color:red;'>{$curlError}</td></tr>";
}

echo "<tr><td><strong>Response</strong></td><td><pre>" . htmlspecialchars($response) . "</pre></td></tr>";
echo "</table>";

// Parse response
$responseData = json_decode($response, true);

if ($responseData) {
    echo "<h3>Detail Response:</h3>";
    echo "<pre style='background:#f5f5f5; padding:15px;'>";
    print_r($responseData);
    echo "</pre>";
    
    echo "<h3>Analisa:</h3>";
    echo "<div style='background:#fff3cd; padding:15px; border-left:4px solid #ffc107;'>";
    
    if (isset($responseData['status'])) {
        if ($responseData['status']) {
            echo "<p style='color:green;'><strong>✅ Status: SUCCESS</strong></p>";
            echo "<p>Pesan berhasil dikirim ke Fonnte.</p>";
            echo "<p><strong>Cek grup WhatsApp Anda!</strong></p>";
        } else {
            echo "<p style='color:red;'><strong>❌ Status: FAILED</strong></p>";
            
            $msg = strtolower($responseData['message'] ?? '');
            
            if (strpos($msg, 'device') !== false || strpos($msg, 'disconnect') !== false) {
                echo "<p><strong>Masalah: Device WhatsApp Disconnect</strong></p>";
                echo "<p>Solusi:</p>";
                echo "<ol>";
                echo "<li>Login ke <a href='https://fonnte.com' target='_blank'>fonnte.com</a></li>";
                echo "<li>Menu <strong>Device</strong></li>";
                echo "<li>Scan QR Code ulang dengan WhatsApp</li>";
                echo "<li>Tunggu status <strong>Connected</strong></li>";
                echo "<li>Test lagi</li>";
                echo "</ol>";
            } elseif (strpos($msg, 'unauthorized') !== false || strpos($msg, 'token') !== false) {
                echo "<p><strong>Masalah: Token Salah/Expired</strong></p>";
                echo "<p>Solusi:</p>";
                echo "<ol>";
                echo "<li>Login ke <a href='https://fonnte.com' target='_blank'>fonnte.com</a></li>";
                echo "<li>Menu <strong>API</strong></li>";
                echo "<li>Copy token baru</li>";
                echo "<li>Update di <code>fonnte_config.php</code></li>";
                echo "</ol>";
            } elseif (strpos($msg, 'group') !== false || strpos($msg, 'invalid') !== false) {
                echo "<p><strong>Masalah: Group ID Salah</strong></p>";
                echo "<p>Solusi:</p>";
                echo "<ol>";
                echo "<li>Pastikan nomor WhatsApp yang terhubung di Fonnte <strong>ada di grup</strong></li>";
                echo "<li>Pastikan nomor tersebut <strong>admin grup</strong></li>";
                echo "<li>Cek Group ID di dashboard Fonnte → Menu Groups</li>";
                echo "<li>Format harus: <code>628xxx-xxx@g.us</code></li>";
                echo "</ol>";
            } else {
                echo "<p><strong>Error:</strong> " . ($responseData['message'] ?? 'Unknown error') . "</p>";
            }
        }
    }
    
    echo "</div>";
}

echo "<hr>";
echo "<h3>Checklist Troubleshooting:</h3>";
echo "<ol>";
echo "<li>✅ Token sudah benar</li>";
echo "<li>✅ Group ID sudah diisi</li>";
echo "<li>❓ Device WhatsApp Connected? → <a href='https://fonnte.com' target='_blank'>Cek di sini</a></li>";
echo "<li>❓ Nomor ada di grup?</li>";
echo "<li>❓ Nomor admin grup?</li>";
echo "<li>❓ Saldo Fonnte cukup?</li>";
echo "</ol>";

echo "<hr>";
echo "<p><a href='test_group.php'>Test Lagi</a> | <a href='index.html'>Kembali</a></p>";
?>
