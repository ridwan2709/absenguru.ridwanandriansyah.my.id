<?php
/**
 * Kirim Jadwal Hari Ini ke Grup WhatsApp
 * File production untuk mengirim jadwal dengan status kehadiran
 */

require_once 'koneksi.php';
require_once 'fonnte_config.php';

// Set timezone
date_default_timezone_set('Asia/Jakarta');

// Header JSON
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

// Hanya terima POST request
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

try {
    // Koneksi database
    $db = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASSWORD);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Kirim jadwal ke grup
    $result = sendJadwalHariIniKeGrup($db);
    
    if ($result['success']) {
        echo json_encode([
            "success" => true,
            "message" => "Jadwal berhasil dikirim ke grup WhatsApp",
            "response" => $result['response']
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Gagal mengirim jadwal",
            "error" => $result['error']
        ]);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}
