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
 * Kirim jadwal hari ini dengan status kehadiran ke grup
 * @param PDO $db - Database connection
 * @return array - Result dari pengiriman
 */
function sendJadwalHariIniKeGrup($db) {
    // Dapatkan hari ini
    $hari_map = [
        'Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu', 
        'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu', 'Sunday' => 'Minggu'
    ];
    $hari_ini = $hari_map[date('l')] ?? date('l');
    $today_date = date('Y-m-d');
    
    // Ambil semua jadwal hari ini dengan status absensi
    $stmt = $db->prepare("
        SELECT j.*, g.nama as nama_guru,
               a.status as status_absensi,
               a.jam_masuk
        FROM jadwal j
        JOIN guru g ON j.id_guru = g.id_guru
        LEFT JOIN absensi a ON j.id_jadwal = a.id_jadwal AND a.tanggal = ?
        WHERE j.hari = ?
        ORDER BY j.jam_mulai ASC
    ");
    $stmt->execute([$today_date, $hari_ini]);
    $jadwal_list = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($jadwal_list) === 0) {
        return ['success' => false, 'error' => 'Tidak ada jadwal hari ini'];
    }
    
    // Ambil semua jam unik
    $stmt_jam = $db->prepare("
        SELECT DISTINCT jam_mulai 
        FROM jadwal 
        WHERE hari = ?
        ORDER BY jam_mulai ASC
    ");
    $stmt_jam->execute([$hari_ini]);
    $jam_unik = $stmt_jam->fetchAll(PDO::FETCH_COLUMN);
    
    // Buat mapping jam_mulai ke jam ke-X
    $jam_ke_map = [];
    foreach ($jam_unik as $index => $jam) {
        $jam_ke_map[$jam] = $index + 1;
    }
    
    // Group jadwal berdasarkan jam_mulai
    $jadwal_per_jam = [];
    foreach ($jadwal_list as $jadwal) {
        $jam_mulai = $jadwal['jam_mulai'];
        $jam_ke = $jam_ke_map[$jam_mulai] ?? '?';
        
        if (!isset($jadwal_per_jam[$jam_ke])) {
            $jadwal_per_jam[$jam_ke] = [
                'jam_mulai' => substr($jam_mulai, 0, 5),
                'jadwal' => []
            ];
        }
        $jadwal_per_jam[$jam_ke]['jadwal'][] = $jadwal;
    }
    
    ksort($jadwal_per_jam);
    
    // Format bulan
    $bulan_map = [
        '01' => 'Jan', '02' => 'Feb', '03' => 'Mar', '04' => 'Apr',
        '05' => 'Mei', '06' => 'Jun', '07' => 'Jul', '08' => 'Agu',
        '09' => 'Sep', '10' => 'Okt', '11' => 'Nov', '12' => 'Des'
    ];
    $tgl = date('d');
    $bln = $bulan_map[date('m')];
    $thn = date('Y');
    
    // Format pesan WhatsApp singkat dengan status kehadiran
    $message = "📚 *Jadwal KBM {$hari_ini}, {$tgl} {$bln} {$thn}*\n\n";
    
    // Icon untuk jam pelajaran
    $jam_icons = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    
    $total_hadir = 0;
    $total_jadwal = count($jadwal_list);
    
    foreach ($jadwal_per_jam as $jam_ke => $data) {
        $jam_mulai = $data['jam_mulai'];
        $jadwal_items = $data['jadwal'];
        
        // Gunakan icon angka jika tersedia
        $icon = isset($jam_icons[$jam_ke - 1]) ? $jam_icons[$jam_ke - 1] : "#{$jam_ke}";
        
        $message .= "{$icon} *{$jam_mulai}*\n";
        
        foreach ($jadwal_items as $jadwal) {
            // Cek status kehadiran
            $status_icon = '';
            if (!empty($jadwal['status_absensi'])) {
                if ($jadwal['status_absensi'] === 'Hadir') {
                    $status_icon = ' ✅';
                    $total_hadir++;
                } elseif ($jadwal['status_absensi'] === 'Terlambat') {
                    $status_icon = ' ⚠️';
                    $total_hadir++;
                }
            }
            
            $message .= "• {$jadwal['mapel']} - {$jadwal['nama_guru']} ({$jadwal['kelas']}){$status_icon}\n";
        }
        
        $message .= "\n";
    }
    
    $message .= "_Hadir: {$total_hadir}/{$total_jadwal} sesi_";
    
    // Kirim ke grup
    return sendWhatsAppNotification($message, FONNTE_GROUP_ID);
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
