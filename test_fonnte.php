<?php
/**
 * Script test untuk Fonnte WhatsApp API
 * Akses via browser: http://localhost:8000/test_fonnte.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
date_default_timezone_set('Asia/Jakarta');

require_once 'fonnte_config.php';

echo "<h1>Test Fonnte WhatsApp API</h1>";
echo "<hr>";

// Cek konfigurasi
echo "<h2>1. Konfigurasi</h2>";
echo "API URL: " . FONNTE_API_URL . "<br>";
echo "Token: " . (FONNTE_TOKEN !== 'YOUR_FONNTE_TOKEN_HERE' ? '✅ Sudah diset' : '❌ Belum diset') . "<br>";

if (FONNTE_TOKEN === 'YOUR_FONNTE_TOKEN_HERE') {
    echo "<br><p style='color: red;'><strong>⚠️ PERHATIAN:</strong> Silakan edit file <code>fonnte_config.php</code> dan isi FONNTE_TOKEN!</p>";
    echo "<p>Panduan setup: <a href='SETUP_FONNTE.md'>SETUP_FONNTE.md</a></p>";
    exit;
}

// Form input nomor HP untuk test
echo "<h2>2. Test Kirim Pesan</h2>";
echo "<form method='POST' style='background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;'>";
echo "<label style='display: block; margin-bottom: 10px;'>";
echo "<strong>Nomor HP Tujuan:</strong><br>";
echo "<input type='text' name='test_phone' placeholder='08123456789 atau 628123456789' style='width: 300px; padding: 8px; margin-top: 5px;' required>";
echo "</label>";
echo "<button type='submit' style='padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;'>Kirim Test</button>";
echo "</form>";

// Proses test jika form disubmit
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['test_phone'])) {
    $test_phone = formatPhoneNumber($_POST['test_phone']);
    
    echo "<h3>Mengirim ke: {$test_phone}</h3>";
    echo "<p>Mengirim pesan test...</p>";
    
    $result = testFonnteConnection($test_phone);
    
    echo "<h3>Hasil:</h3>";
    echo "<pre>";
    print_r($result);
    echo "</pre>";
    
    if ($result['success']) {
        echo "<p style='color: green;'><strong>✅ BERHASIL!</strong> Pesan test telah dikirim ke {$test_phone}.</p>";
        echo "<p>Silakan cek WhatsApp Anda.</p>";
    } else {
        echo "<p style='color: red;'><strong>❌ GAGAL!</strong> Pesan tidak terkirim.</p>";
        echo "<h3>Kemungkinan Penyebab:</h3>";
        echo "<ul>";
        echo "<li>Token salah atau expired</li>";
        echo "<li>Nomor HP salah atau tidak terdaftar di WhatsApp</li>";
        echo "<li>WhatsApp tidak terhubung di Fonnte</li>";
        echo "<li>Saldo Fonnte habis</li>";
        echo "</ul>";
    }
    
    echo "<hr>";
}

// Test format pesan
echo "<h2>3. Preview Format Pesan Absensi</h2>";
$sample_message = formatAbsensiMessage(
    'Budi Santoso',
    '10 IPA 1',
    'Matematika',
    '07:00',
    '06:55',
    'Hadir',
    'Senin'
);

echo "<pre style='background: #f5f5f5; padding: 15px; border: 1px solid #ddd; border-radius: 5px;'>";
echo htmlspecialchars($sample_message);
echo "</pre>";

echo "<hr>";
echo "<p><a href='index.html'>Kembali ke Aplikasi</a></p>";
?>
