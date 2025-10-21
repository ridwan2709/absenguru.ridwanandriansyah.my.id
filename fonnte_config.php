<?php
/**
 * ============================================
 * KONFIGURASI FONNTE API - WHATSAPP NOTIFICATION
 * ============================================
 * 
 * Dokumentasi: https://fonnte.com/api
 * Dashboard: https://fonnte.com
 * 
 * Setup:
 * 1. Daftar di fonnte.com
 * 2. Hubungkan WhatsApp via QR Code
 * 3. Copy token dari dashboard
 * 4. Paste token di bawah ini
 */

// ============================================
// KONFIGURASI
// ============================================

define('FONNTE_API_URL', 'https://api.fonnte.com/send');
define('FONNTE_TOKEN', 'rGPXg5Fj2MKkWwX7cmuf'); // Token dari dashboard Fonnte
define('FONNTE_GROUP_ID', '120363420233041426@g.us'); // ID Grup WhatsApp

// ============================================
// FUNGSI UTAMA
// ============================================

/**
 * Fungsi untuk mengirim pesan WhatsApp ke nomor tertentu
 * @param string $message - Pesan yang akan dikirim
 * @param string $target - Nomor HP tujuan (format: 628xxx atau grup ID)
 */
function sendWhatsAppNotification($message, $target = null) {
    // Jika target tidak diset, gunakan GROUP_ID (untuk backward compatibility)
    if ($target === null) {
        $target = FONNTE_GROUP_ID;
    }
    
    // Skip jika target kosong
    if (empty($target)) {
        error_log("WhatsApp target is empty, skipping notification");
        return ['success' => false, 'message' => 'Target is empty'];
    }
    
    $curl = curl_init();

    $data = [
        'target' => $target,
        'message' => $message,
        'countryCode' => '62' // Indonesia
    ];

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
    curl_close($curl);

    // Log response untuk debugging
    error_log("Fonnte Response: " . $response);
    
    return [
        'success' => $httpCode == 200,
        'response' => json_decode($response, true),
        'http_code' => $httpCode
    ];
}

// ============================================
// FUNGSI HELPER
// ============================================

/**
 * Format pesan absensi untuk WhatsApp
 * @param string $guru_nama - Nama guru
 * @param string $kelas - Kelas yang diajar
 * @param string $mapel - Mata pelajaran
 * @param string $jam_mulai - Jam mulai mengajar
 * @param string $jam_masuk - Jam absen masuk
 * @param string $status - Status absensi (Hadir/Terlambat)
 * @param string $hari - Hari mengajar
 * @return string - Pesan terformat
 */
function formatAbsensiMessage($guru_nama, $kelas, $mapel, $jam_mulai, $jam_masuk, $status, $hari) {
    $emoji_status = $status === 'Hadir' ? '✅' : '⚠️';
    $tanggal = date('d/m/Y');
    
    $message = "*🔔 NOTIFIKASI ABSENSI GURU*\n\n";
    $message .= "━━━━━━━━━━━━━━━━━━━━\n";
    $message .= "*Guru:* {$guru_nama}\n";
    $message .= "*Hari/Tanggal:* {$hari}, {$tanggal}\n";
    $message .= "*Kelas:* {$kelas}\n";
    $message .= "*Mata Pelajaran:* {$mapel}\n";
    $message .= "*Jam Mengajar:* {$jam_mulai}\n";
    $message .= "*Jam Absen:* {$jam_masuk}\n";
    $message .= "*Status:* {$emoji_status} *{$status}*\n";
    $message .= "━━━━━━━━━━━━━━━━━━━━\n\n";
    $message .= "_Sistem Absensi Guru - " . date('H:i:s') . "_";
    
    return $message;
}

/**
 * Test koneksi Fonnte
 * @param string $target - Nomor HP atau Group ID untuk test (opsional)
 * @return array - Result dari pengiriman
 */
function testFonnteConnection($target = null) {
    $testMessage = "*🧪 TEST KONEKSI*\n\n";
    $testMessage .= "Sistem Absensi Guru berhasil terhubung dengan Fonnte API.\n\n";
    $testMessage .= "Waktu: " . date('d/m/Y H:i:s');
    
    return sendWhatsAppNotification($testMessage, $target);
}

/**
 * Format nomor HP Indonesia ke format internasional
 * Mengubah 08xxx menjadi 628xxx
 * @param string $phone - Nomor HP (08xxx atau 628xxx)
 * @return string|null - Nomor terformat atau null jika kosong
 */
function formatPhoneNumber($phone) {
    if (empty($phone)) {
        return null;
    }
    
    // Hapus karakter non-digit
    $phone = preg_replace('/[^0-9]/', '', $phone);
    
    // Jika dimulai dengan 0, ganti dengan 62
    if (substr($phone, 0, 1) === '0') {
        $phone = '62' . substr($phone, 1);
    }
    
    // Jika tidak dimulai dengan 62, tambahkan 62
    if (substr($phone, 0, 2) !== '62') {
        $phone = '62' . $phone;
    }
    
    return $phone;
}
?>
