<?php
/**
 * Cron Job: Kirim Notifikasi Jadwal Pagi
 * 
 * Jalankan setiap pagi untuk mengirim jadwal hari ini ke grup WhatsApp
 * 
 * Setup Cron (Linux):
 * 0 6 * * * php /path/to/cron_jadwal_pagi.php
 * 
 * Setup Task Scheduler (Windows):
 * - Buka Task Scheduler
 * - Create Basic Task
 * - Trigger: Daily at 6:00 AM
 * - Action: Start a program
 * - Program: C:\xampp\php\php.exe
 * - Arguments: "d:\SERVER\www\absen_guru\cron_jadwal_pagi.php"
 */

require_once __DIR__ . '/../koneksi.php';
require_once __DIR__ . '/../fonnte_config.php';

// Set timezone
date_default_timezone_set('Asia/Jakarta');

// Log file
$log_file = __DIR__ . '/../logs/cron_jadwal.log';
$log_dir = dirname($log_file);
if (!is_dir($log_dir)) {
    mkdir($log_dir, 0755, true);
}

function writeLog($message) {
    global $log_file;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[{$timestamp}] {$message}\n", FILE_APPEND);
    echo "[{$timestamp}] {$message}\n";
}

writeLog("=== CRON JOB START ===");

try {
    // Koneksi database
    $db = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASSWORD);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    writeLog("Database connected");
    
    // Dapatkan hari ini
    $hari_map = [
        'Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu', 
        'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu', 'Sunday' => 'Minggu'
    ];
    $hari_ini = $hari_map[date('l')] ?? date('l');
    $tanggal_indo = date('d/m/Y');
    
    writeLog("Hari ini: {$hari_ini}, {$tanggal_indo}");
    
    // Skip jika hari Minggu
    if ($hari_ini === 'Minggu') {
        writeLog("Hari Minggu - skip notifikasi");
        writeLog("=== CRON JOB END ===");
        exit;
    }
    
    // Ambil semua jadwal hari ini dengan status absensi
    $today_date = date('Y-m-d');
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
        writeLog("Tidak ada jadwal pada hari {$hari_ini}");
        writeLog("=== CRON JOB END ===");
        exit;
    }
    
    writeLog("Ditemukan " . count($jadwal_list) . " jadwal");
    
    // Ambil semua jam unik dari database untuk hari ini
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
    $message = "☀️ *Selamat Pagi!*\n";
    $message .= "📚 *Jadwal KBM {$hari_ini}, {$tgl} {$bln} {$thn}*\n\n";
    
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
    
    $message .= "_Hadir: {$total_hadir}/{$total_jadwal} sesi. Semangat! 💪_";
    
    writeLog("Mengirim notifikasi ke grup...");
    
    // Kirim ke WhatsApp
    $result = sendWhatsAppNotification($message, FONNTE_GROUP_ID);
    
    if ($result['success']) {
        writeLog("✅ Notifikasi berhasil dikirim");
        writeLog("Response: " . json_encode($result['response']));
    } else {
        writeLog("❌ Gagal mengirim notifikasi: " . $result['error']);
        writeLog("Response: " . json_encode($result['response']));
    }
    
} catch (PDOException $e) {
    writeLog("❌ Database Error: " . $e->getMessage());
} catch (Exception $e) {
    writeLog("❌ Error: " . $e->getMessage());
}

writeLog("=== CRON JOB END ===");
writeLog("");
