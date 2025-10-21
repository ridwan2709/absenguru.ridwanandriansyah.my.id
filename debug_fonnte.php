<?php
/**
 * Debug Fonnte - Cek detail response dan status
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
date_default_timezone_set('Asia/Jakarta');

require_once 'fonnte_config.php';

echo "<h1>🔍 Debug Fonnte WhatsApp</h1>";
echo "<hr>";

// Form input
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo "<h2>Masukkan Nomor HP untuk Test</h2>";
    echo "<form method='POST' style='background: #f5f5f5; padding: 20px; border-radius: 5px;'>";
    echo "<label style='display: block; margin-bottom: 15px;'>";
    echo "<strong>Nomor HP:</strong><br>";
    echo "<input type='text' name='phone' placeholder='081234567890' style='width: 300px; padding: 10px; margin-top: 5px;' required>";
    echo "</label>";
    echo "<button type='submit' style='padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;'>Test Kirim</button>";
    echo "</form>";
    echo "<hr>";
}

// Proses test
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['phone'])) {
    $phone = formatPhoneNumber($_POST['phone']);
    
    echo "<h2>📱 Informasi Pengiriman</h2>";
    echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
    echo "<tr><td><strong>Nomor Input</strong></td><td>{$_POST['phone']}</td></tr>";
    echo "<tr><td><strong>Nomor Format</strong></td><td>{$phone}</td></tr>";
    echo "<tr><td><strong>Token</strong></td><td>" . substr(FONNTE_TOKEN, 0, 10) . "...</td></tr>";
    echo "<tr><td><strong>API URL</strong></td><td>" . FONNTE_API_URL . "</td></tr>";
    echo "</table>";
    
    echo "<h2>📤 Mengirim Pesan Test...</h2>";
    
    $message = "*🧪 TEST DEBUG*\n\nPesan test dari sistem absensi guru.\n\nWaktu: " . date('d/m/Y H:i:s');
    
    // Kirim dengan detail response
    $curl = curl_init();
    
    $data = [
        'target' => $phone,
        'message' => $message,
        'countryCode' => '62'
    ];
    
    echo "<h3>📋 Data yang Dikirim:</h3>";
    echo "<pre style='background: #f5f5f5; padding: 15px; border-radius: 5px;'>";
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
            'Authorization: ' . FONNTE_TOKEN,
            'Content-Type: application/json'
        ],
    ]);
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curlError = curl_error($curl);
    $curlInfo = curl_getinfo($curl);
    curl_close($curl);
    
    echo "<h3>📥 Response dari Fonnte:</h3>";
    echo "<table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><td><strong>HTTP Code</strong></td><td style='color: " . ($httpCode == 200 ? 'green' : 'red') . ";'><strong>{$httpCode}</strong></td></tr>";
    
    if ($curlError) {
        echo "<tr><td><strong>cURL Error</strong></td><td style='color: red;'>{$curlError}</td></tr>";
    }
    
    echo "<tr><td><strong>Response Body</strong></td><td><pre>" . htmlspecialchars($response) . "</pre></td></tr>";
    echo "</table>";
    
    // Parse response
    $responseData = json_decode($response, true);
    
    if ($responseData) {
        echo "<h3>🔍 Detail Response (Parsed):</h3>";
        echo "<pre style='background: #f5f5f5; padding: 15px; border-radius: 5px;'>";
        print_r($responseData);
        echo "</pre>";
        
        // Analisa response
        echo "<h3>📊 Analisa:</h3>";
        echo "<div style='background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;'>";
        
        if (isset($responseData['status'])) {
            echo "<p><strong>Status:</strong> " . ($responseData['status'] ? '✅ Success' : '❌ Failed') . "</p>";
        }
        
        if (isset($responseData['message'])) {
            echo "<p><strong>Message:</strong> {$responseData['message']}</p>";
        }
        
        if (isset($responseData['detail'])) {
            echo "<p><strong>Detail:</strong> {$responseData['detail']}</p>";
        }
        
        // Cek kemungkinan masalah
        echo "<h4>🔍 Kemungkinan Masalah:</h4>";
        echo "<ul>";
        
        if ($httpCode != 200) {
            echo "<li style='color: red;'><strong>HTTP Code bukan 200</strong> - Ada error dari server Fonnte</li>";
        }
        
        if (isset($responseData['status']) && !$responseData['status']) {
            echo "<li style='color: red;'><strong>Status = false</strong> - Pesan gagal dikirim</li>";
            
            if (strpos(strtolower($responseData['message'] ?? ''), 'device') !== false) {
                echo "<li style='color: orange;'>⚠️ <strong>Device tidak terhubung</strong> - WhatsApp Anda disconnect dari Fonnte</li>";
                echo "<li>Solusi: Login ke <a href='https://fonnte.com' target='_blank'>fonnte.com</a> → Menu Device → Scan QR Code ulang</li>";
            }
            
            if (strpos(strtolower($responseData['message'] ?? ''), 'unauthorized') !== false) {
                echo "<li style='color: orange;'>⚠️ <strong>Token salah atau expired</strong></li>";
                echo "<li>Solusi: Generate token baru dari dashboard Fonnte</li>";
            }
            
            if (strpos(strtolower($responseData['message'] ?? ''), 'invalid') !== false) {
                echo "<li style='color: orange;'>⚠️ <strong>Nomor tidak valid</strong> atau tidak terdaftar di WhatsApp</li>";
                echo "<li>Solusi: Pastikan nomor aktif dan terdaftar di WhatsApp</li>";
            }
            
            if (strpos(strtolower($responseData['message'] ?? ''), 'quota') !== false || 
                strpos(strtolower($responseData['message'] ?? ''), 'limit') !== false) {
                echo "<li style='color: orange;'>⚠️ <strong>Kuota/Limit habis</strong></li>";
                echo "<li>Solusi: Top up saldo Fonnte</li>";
            }
        } else {
            echo "<li style='color: green;'>✅ Response OK - Pesan berhasil dikirim ke Fonnte</li>";
            echo "<li>Jika WhatsApp tidak masuk, kemungkinan:</li>";
            echo "<ul>";
            echo "<li>Device WhatsApp disconnect (cek di dashboard Fonnte)</li>";
            echo "<li>Nomor tidak terdaftar di WhatsApp</li>";
            echo "<li>Delay pengiriman (tunggu 1-2 menit)</li>";
            echo "</ul>";
        }
        
        echo "</ul>";
        echo "</div>";
    }
    
    // Info tambahan
    echo "<h3>ℹ️ Langkah Troubleshooting:</h3>";
    echo "<ol>";
    echo "<li><strong>Cek Status Device di Fonnte:</strong>";
    echo "<ul>";
    echo "<li>Login ke <a href='https://fonnte.com' target='_blank'>https://fonnte.com</a></li>";
    echo "<li>Menu <strong>Device</strong></li>";
    echo "<li>Status harus: <strong style='color: green;'>Connected</strong></li>";
    echo "<li>Jika Disconnect, scan QR Code ulang</li>";
    echo "</ul></li>";
    
    echo "<li><strong>Cek Logs di Fonnte:</strong>";
    echo "<ul>";
    echo "<li>Menu <strong>Logs</strong></li>";
    echo "<li>Lihat history pengiriman</li>";
    echo "<li>Cek status: Success / Failed</li>";
    echo "</ul></li>";
    
    echo "<li><strong>Cek Nomor HP:</strong>";
    echo "<ul>";
    echo "<li>Pastikan nomor aktif</li>";
    echo "<li>Terdaftar di WhatsApp</li>";
    echo "<li>Format benar: 628xxx</li>";
    echo "</ul></li>";
    
    echo "<li><strong>Cek Saldo:</strong>";
    echo "<ul>";
    echo "<li>Menu <strong>Balance</strong></li>";
    echo "<li>Pastikan saldo cukup</li>";
    echo "</ul></li>";
    echo "</ol>";
    
    echo "<hr>";
    echo "<p><a href='debug_fonnte.php'>Test Lagi</a> | <a href='index.html'>Kembali ke Aplikasi</a></p>";
}

// Info umum
echo "<h2>📖 Informasi Penting</h2>";
echo "<div style='background: #e3f2fd; padding: 15px; border-radius: 5px; border-left: 4px solid #2196F3;'>";
echo "<h3>Penyebab Umum Pesan Tidak Masuk:</h3>";
echo "<ol>";
echo "<li><strong>Device WhatsApp Disconnect</strong> (Paling Sering!)";
echo "<ul><li>Solusi: Scan QR Code ulang di dashboard Fonnte</li></ul></li>";

echo "<li><strong>Nomor Tidak Terdaftar di WhatsApp</strong>";
echo "<ul><li>Solusi: Pastikan nomor aktif dan ada WhatsApp-nya</li></ul></li>";

echo "<li><strong>Token Expired atau Salah</strong>";
echo "<ul><li>Solusi: Generate token baru</li></ul></li>";

echo "<li><strong>Saldo Habis</strong>";
echo "<ul><li>Solusi: Top up saldo Fonnte</li></ul></li>";

echo "<li><strong>Delay Pengiriman</strong>";
echo "<ul><li>Solusi: Tunggu 1-2 menit, kadang ada delay</li></ul></li>";
echo "</ol>";
echo "</div>";

echo "<hr>";
echo "<p style='text-align: center;'><strong>Dashboard Fonnte:</strong> <a href='https://fonnte.com' target='_blank'>https://fonnte.com</a></p>";
?>
