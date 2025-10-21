<?php
/**
 * Backend API Absensi Guru (PHP)
 * Timezone: Asia/Jakarta (WIB)
 */

// Error reporting untuk development (matikan di production)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Set ke 0 untuk production
ini_set('log_errors', 1);

// Set timezone ke Jakarta
date_default_timezone_set('Asia/Jakarta');

// Include Fonnte Configuration
require_once 'fonnte_config.php';

// Include Koneksi Database
require_once 'koneksi.php';

// Batas Waktu Absensi (dalam menit)
define('ABSENSI_LIMIT_MINUTES', 30);

// Header untuk API
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight request
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

// Menerima data JSON dari frontend
$input_data = json_decode(file_get_contents("php://input"), true);
$request_method = $_SERVER["REQUEST_METHOD"];

// Koneksi Database
function getDBConnection() {
    try {
        $conn = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASSWORD);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $conn;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Koneksi database gagal: " . $e->getMessage()]);
        exit();
    }
}

// =========================================================
//                  MIDDLEWARE AUTHENTICATION
// =========================================================

function getAuthInfo() {
    // Coba beberapa cara untuk mendapatkan Authorization header
    // Karena Apache/PHP tidak selalu meneruskan HTTP_AUTHORIZATION
    
    $authHeader = null;
    
    // Method 1: HTTP_AUTHORIZATION
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }
    // Method 2: REDIRECT_HTTP_AUTHORIZATION (untuk Apache dengan mod_rewrite)
    elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    // Method 3: apache_request_headers() jika tersedia
    elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
        } elseif (isset($headers['authorization'])) {
            $authHeader = $headers['authorization'];
        }
    }
    // Method 4: getallheaders() sebagai fallback
    elseif (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
        } elseif (isset($headers['authorization'])) {
            $authHeader = $headers['authorization'];
        }
    }
    
    // Parse Bearer token
    if ($authHeader && preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        return $matches[1];
    }
    
    return null;
}

function authenticateUser($db) {
    $id_guru = getAuthInfo();
    if (!$id_guru) {
        http_response_code(401);
        echo json_encode(["message" => "Akses ditolak. Token tidak ditemukan."]);
        exit();
    }
    
    $stmt = $db->prepare("SELECT id_guru, nama, role FROM guru WHERE id_guru = ?");
    $stmt->execute([$id_guru]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(403);
        echo json_encode(["message" => "Token tidak valid atau pengguna tidak ditemukan."]);
        exit();
    }

    return $user;
}

function isAdmin($user) {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(["message" => "Akses ditolak. Hanya Admin yang diizinkan."]);
        exit();
    }
}

// =========================================================
//                  ENDPOINT HANDLERS
// =========================================================

$db = getDBConnection();
$route = $_GET['route'] ?? '';

// --- 1. LOGIN ---
if ($route === 'login' && $request_method === 'POST') {
    $id_guru = $input_data['id_guru'] ?? '';
    $password = $input_data['password'] ?? '';

    if (empty($id_guru) || empty($password)) {
        http_response_code(400);
        echo json_encode(["message" => "ID Guru dan Password harus diisi."]);
        exit();
    }

    $stmt = $db->prepare("SELECT id_guru, nama, password_hash, role FROM guru WHERE id_guru = ?");
    $stmt->execute([$id_guru]);
    $guru = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$guru || !password_verify($password, $guru['password_hash'])) {
        http_response_code(401);
        echo json_encode(["message" => "ID Guru atau Password salah."]);
        exit();
    }

    // Menggunakan ID Guru sebagai "token" untuk demo
    $token = $guru['id_guru'];

    echo json_encode([
        "token" => $token,
        "role" => $guru['role'],
        "nama" => $guru['nama']
    ]);
    exit();
}

// --- 2. GURU: JADWAL HARI INI ---
if ($route === 'guru/jadwal_hari_ini' && $request_method === 'GET') {
    $user = authenticateUser($db);
    $id_guru = $user['id_guru'];
    
    // Mendapatkan hari dalam bahasa Indonesia (timezone Jakarta)
    $hari_map = [
        'Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu', 
        'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu', 'Sunday' => 'Minggu'
    ];
    $hari_ini_id = $hari_map[date('l')] ?? date('l');
    $today_date = date('Y-m-d');

    // Dapatkan Jadwal Hari Ini
    $stmt = $db->prepare(
        "SELECT id_jadwal, kelas, mapel, jam_mulai FROM jadwal WHERE id_guru = ? AND hari = ? ORDER BY jam_mulai ASC"
    );
    $stmt->execute([$id_guru, $hari_ini_id]);
    $jadwal_result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Gabungkan dengan Status Absensi
    $jadwal_with_status = [];
    foreach ($jadwal_result as $item) {
        $stmt_absensi = $db->prepare(
            "SELECT status, jam_masuk FROM absensi WHERE id_jadwal = ? AND tanggal = ?"
        );
        $stmt_absensi->execute([$item['id_jadwal'], $today_date]);
        $absensi_log = $stmt_absensi->fetch(PDO::FETCH_ASSOC);

        $item['status'] = $absensi_log['status'] ?? 'Belum Absen';
        $item['jam_masuk'] = $absensi_log['jam_masuk'] ?? null;
        $jadwal_with_status[] = $item;
    }

    echo json_encode([
        "hari" => $hari_ini_id,
        "jadwal" => $jadwal_with_status
    ]);
    exit();
}

// --- 2B. GURU: SEMUA JADWAL (GET ALL) ---
if ($route === 'guru/jadwal_semua' && $request_method === 'GET') {
    $user = authenticateUser($db);
    $id_guru = $user['id_guru'];

    $stmt = $db->prepare("
        SELECT j.*, g.nama 
        FROM jadwal j 
        JOIN guru g ON j.id_guru = g.id_guru 
        WHERE j.id_guru = ?
        ORDER BY FIELD(j.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'), j.jam_mulai
    ");
    $stmt->execute([$id_guru]);
    $jadwal_list = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($jadwal_list);
    exit();
}

// --- 3. GURU: ABSENSI SESI ---
if (preg_match('/^guru\/absensi\/(\d+)$/', $route, $matches) && $request_method === 'POST') {
    $id_jadwal = $matches[1];
    $user = authenticateUser($db);
    $id_guru = $user['id_guru'];
    
    $latitude = $input_data['latitude'] ?? null;
    $longitude = $input_data['longitude'] ?? null;

    if (empty($latitude) || empty($longitude)) {
        http_response_code(400);
        echo json_encode(["message" => "Koordinat GPS wajib disertakan."]);
        exit();
    }

    $today_date = date('Y-m-d');
    $current_time = new DateTime('now', new DateTimeZone('Asia/Jakarta'));

    // Verifikasi Jadwal dan Guru (ambil data lengkap untuk notifikasi)
    $stmt = $db->prepare("
        SELECT j.jam_mulai, j.kelas, j.mapel, j.hari, g.nama as guru_nama, g.nomor_hp 
        FROM jadwal j 
        JOIN guru g ON j.id_guru = g.id_guru 
        WHERE j.id_jadwal = ? AND j.id_guru = ?
    ");
    $stmt->execute([$id_jadwal, $id_guru]);
    $jadwal = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$jadwal) {
        http_response_code(404);
        echo json_encode(["message" => "Jadwal tidak ditemukan atau bukan milik Anda."]);
        exit();
    }

    // Cek Batasan Waktu Absensi (± 15 menit)
    $jam_mulai_str = $jadwal['jam_mulai'];
    $jam_mulai = new DateTime($today_date . ' ' . $jam_mulai_str, new DateTimeZone('Asia/Jakarta'));
    
    $early_limit = (clone $jam_mulai)->modify('-' . 5 . ' minutes');
    $late_limit = (clone $jam_mulai)->modify('+' . ABSENSI_LIMIT_MINUTES . ' minutes');


    if ($current_time < $early_limit || $current_time > $late_limit) {
        http_response_code(400);
        echo json_encode([
            "message" => "Absensi hanya dapat dilakukan antara " . $early_limit->format('H:i') . " sampai " . $late_limit->format('H:i') . "."
        ]);
        exit();
    }
    
    // Tentukan Status Kehadiran
    // $status = ($current_time <= $jam_mulai) ? 'Hadir' : 'Terlambat';
    $status = 'Hadir';
    $jam_masuk_db = $current_time->format('Y-m-d H:i:s');

    // Catat Absensi (UPSERT)
    try {
        $stmt_insert = $db->prepare(
            "INSERT INTO absensi (id_jadwal, tanggal, jam_masuk, status, latitude, longitude) 
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt_insert->execute([$id_jadwal, $today_date, $jam_masuk_db, $status, $latitude, $longitude]);
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') {
            $stmt_update = $db->prepare(
                "UPDATE absensi SET jam_masuk = ?, status = ?, latitude = ?, longitude = ? 
                 WHERE id_jadwal = ? AND tanggal = ?"
            );
            $stmt_update->execute([$jam_masuk_db, $status, $latitude, $longitude, $id_jadwal, $today_date]);
        } else {
            throw $e;
        }
    }

    // Kirim notifikasi WhatsApp ke grup
    try {
        $message = formatAbsensiMessage(
            $jadwal['guru_nama'],
            $jadwal['kelas'],
            $jadwal['mapel'],
            substr($jadwal['jam_mulai'], 0, 5), // Format HH:MM
            $current_time->format('H:i'),
            $status,
            $jadwal['hari']
        );
        
        // Kirim ke grup (gunakan GROUP_ID dari config)
        $whatsapp_result = sendWhatsAppNotification($message, FONNTE_GROUP_ID);
        
        // Log hasil pengiriman
        error_log("WhatsApp notification sent to group: " . json_encode($whatsapp_result));
    } catch (Exception $e) {
        // Jangan gagalkan absensi jika notifikasi gagal
        error_log("WhatsApp notification failed: " . $e->getMessage());
    }

    echo json_encode([
        "message" => "Absensi berhasil dicatat! Status: " . $status . ".",
        "jam_masuk" => $current_time->format('H:i:s')
    ]);
    exit();
}

// --- 4. ADMIN: DAFTAR GURU ---
if ($route === 'admin/guru' && $request_method === 'GET') {
    $user = authenticateUser($db);
    isAdmin($user);

    $stmt = $db->query("SELECT id_guru, nama, nomor_hp, role FROM guru");
    $guru_list = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($guru_list);
    exit();
}

// --- 4B. ADMIN: TAMBAH GURU ---
if ($route === 'admin/guru' && $request_method === 'POST') {
    $user = authenticateUser($db);
    isAdmin($user);

    $id_guru = $input_data['id_guru'] ?? null;
    $nama = $input_data['nama'] ?? null;
    $nomor_hp = $input_data['nomor_hp'] ?? null;
    $password = $input_data['password'] ?? null;
    $role = $input_data['role'] ?? 'guru';

    if (empty($id_guru) || empty($nama) || empty($password)) {
        http_response_code(400);
        echo json_encode(["message" => "ID Guru, Nama, dan Password wajib diisi."]);
        exit();
    }

    // Validasi role
    if (!in_array($role, ['guru', 'admin'])) {
        http_response_code(400);
        echo json_encode(["message" => "Role harus 'guru' atau 'admin'."]);
        exit();
    }

    // Cek apakah ID sudah ada
    $stmt = $db->prepare("SELECT id_guru FROM guru WHERE id_guru = ?");
    $stmt->execute([$id_guru]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(["message" => "ID Guru sudah digunakan."]);
        exit();
    }

    // Hash password
    $password_hash = password_hash($password, PASSWORD_BCRYPT);

    // Insert guru baru
    $stmt = $db->prepare(
        "INSERT INTO guru (id_guru, nama, nomor_hp, password_hash, role) VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->execute([$id_guru, $nama, $nomor_hp, $password_hash, $role]);

    echo json_encode([
        "message" => "Guru berhasil ditambahkan.",
        "id_guru" => $id_guru
    ]);
    exit();
}

// --- 4C. ADMIN: HAPUS GURU ---
if (preg_match('/^admin\/guru\/(.+)$/', $route, $matches) && $request_method === 'DELETE') {
    $user = authenticateUser($db);
    isAdmin($user);
    $id_guru = $matches[1];

    // Cek apakah guru ada
    $stmt = $db->prepare("SELECT id_guru FROM guru WHERE id_guru = ?");
    $stmt->execute([$id_guru]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(["message" => "Guru tidak ditemukan."]);
        exit();
    }

    // Hapus guru (CASCADE akan menghapus jadwal dan absensi terkait)
    $stmt = $db->prepare("DELETE FROM guru WHERE id_guru = ?");
    $stmt->execute([$id_guru]);

    echo json_encode(["message" => "Guru berhasil dihapus."]);
    exit();
}

// --- 5. ADMIN: MANAJEMEN JADWAL (GET ALL) ---
if ($route === 'admin/jadwal' && $request_method === 'GET') {
    $user = authenticateUser($db);
    isAdmin($user);

    $stmt = $db->query("
        SELECT j.*, g.nama 
        FROM jadwal j 
        JOIN guru g ON j.id_guru = g.id_guru 
        ORDER BY FIELD(j.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'), j.jam_mulai
    ");
    $jadwal_list = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($jadwal_list);
    exit();
}

// --- 6. ADMIN: TAMBAH JADWAL (POST) ---
if ($route === 'admin/jadwal' && $request_method === 'POST') {
    $user = authenticateUser($db);
    isAdmin($user);

    $id_guru = $input_data['id_guru'] ?? null;
    $kelas = $input_data['kelas'] ?? null;
    $mapel = $input_data['mapel'] ?? null;
    $hari = $input_data['hari'] ?? null;
    $jam_mulai = $input_data['jam_mulai'] ?? null;

    if (empty($id_guru) || empty($kelas) || empty($mapel) || empty($hari) || empty($jam_mulai)) {
        http_response_code(400);
        echo json_encode(["message" => "Semua field jadwal wajib diisi."]);
        exit();
    }

    $stmt = $db->prepare(
        "INSERT INTO jadwal (id_guru, kelas, mapel, hari, jam_mulai) VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->execute([$id_guru, $kelas, $mapel, $hari, $jam_mulai]);

    echo json_encode([
        "message" => "Jadwal berhasil ditambahkan.", 
        "id_jadwal" => $db->lastInsertId()
    ]);
    exit();
}

// --- 6B. ADMIN: EDIT JADWAL (PUT) ---
if (preg_match('/^admin\/jadwal\/(\d+)$/', $route, $matches) && $request_method === 'PUT') {
    $user = authenticateUser($db);
    isAdmin($user);
    $id_jadwal = $matches[1];

    $id_guru = $input_data['id_guru'] ?? null;
    $kelas = $input_data['kelas'] ?? null;
    $mapel = $input_data['mapel'] ?? null;
    $hari = $input_data['hari'] ?? null;
    $jam_mulai = $input_data['jam_mulai'] ?? null;

    if (empty($id_guru) || empty($kelas) || empty($mapel) || empty($hari) || empty($jam_mulai)) {
        http_response_code(400);
        echo json_encode(["message" => "Semua field jadwal wajib diisi."]);
        exit();
    }

    // Cek apakah jadwal exists
    $stmt = $db->prepare("SELECT id_jadwal FROM jadwal WHERE id_jadwal = ?");
    $stmt->execute([$id_jadwal]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(["message" => "Jadwal tidak ditemukan."]);
        exit();
    }

    // Update jadwal
    $stmt = $db->prepare(
        "UPDATE jadwal SET id_guru = ?, kelas = ?, mapel = ?, hari = ?, jam_mulai = ? WHERE id_jadwal = ?"
    );
    $stmt->execute([$id_guru, $kelas, $mapel, $hari, $jam_mulai, $id_jadwal]);

    echo json_encode([
        "message" => "Jadwal berhasil diupdate.",
        "id_jadwal" => $id_jadwal
    ]);
    exit();
}

// --- 7. ADMIN: HAPUS JADWAL (DELETE) ---
if (preg_match('/^admin\/jadwal\/(\d+)$/', $route, $matches) && $request_method === 'DELETE') {
    $user = authenticateUser($db);
    isAdmin($user);
    $id_jadwal = $matches[1];

    $stmt = $db->prepare("DELETE FROM jadwal WHERE id_jadwal = ?");
    $stmt->execute([$id_jadwal]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(["message" => "Jadwal tidak ditemukan."]);
        exit();
    }
    
    echo json_encode(["message" => "Jadwal berhasil dihapus."]);
    exit();
}

// --- 8. ADMIN: LAPORAN ABSENSI ---
if ($route === 'admin/laporan_absensi' && $request_method === 'GET') {
    $user = authenticateUser($db);
    isAdmin($user);

    $tanggal = $_GET['tanggal'] ?? null;
    $id_guru = $_GET['id_guru'] ?? null;
    
    $query = "
        SELECT 
            a.tanggal, a.jam_masuk, a.status, 
            g.nama AS nama_guru,
            j.kelas, j.mapel, j.jam_mulai
        FROM absensi a
        JOIN jadwal j ON a.id_jadwal = j.id_jadwal
        JOIN guru g ON j.id_guru = g.id_guru
        WHERE 1=1 
    ";
    $params = [];

    if ($tanggal) {
        $query .= ' AND a.tanggal = ?';
        $params[] = $tanggal;
    }
    if ($id_guru) {
        $query .= ' AND j.id_guru = ?';
        $params[] = $id_guru;
    }

    $query .= ' ORDER BY a.tanggal DESC, g.nama, j.jam_mulai';

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $laporan = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($laporan);
    exit();
}

// --- 9. ADMIN: TEST WHATSAPP NOTIFICATION ---
if ($route === 'admin/test_whatsapp' && $request_method === 'POST') {
    $user = authenticateUser($db);
    isAdmin($user);

    // Ambil target dari input (nomor HP atau group ID)
    $target = $input_data['target'] ?? null;
    
    // Jika target adalah nomor HP, format dulu
    if ($target && !strpos($target, '@g.us')) {
        $target = formatPhoneNumber($target);
    }

    try {
        $result = testFonnteConnection($target);
        
        if ($result['success']) {
            echo json_encode([
                "message" => "Test notifikasi WhatsApp berhasil dikirim ke " . ($target ?: 'default target') . "!",
                "result" => $result
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "message" => "Gagal mengirim test notifikasi.",
                "result" => $result
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "message" => "Error: " . $e->getMessage()
        ]);
    }
    exit();
}

// --- ROUTE NOT FOUND ---
http_response_code(404);
echo json_encode(["message" => "Endpoint tidak ditemukan."]);
?>
