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
try {
    $db = getDBConnection();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'message' => 'Gagal terhubung ke database',
        'error' => $e->getMessage()
    ]);
    exit();
}

$route = $_GET['route'] ?? '';

// Endpoint untuk mendapatkan data sekolah
if ($route === 'sekolah' && $request_method === 'GET') {
    try {
        // Cek apakah tabel school_location ada
        $tableExists = $db->query("SHOW TABLES LIKE 'school_location'")->rowCount() > 0;
        
        if (!$tableExists) {
            // Buat tabel jika belum ada
            $db->exec("
                CREATE TABLE IF NOT EXISTS school_location (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    address TEXT NOT NULL,
                    latitude DECIMAL(10, 8) NOT NULL,
                    longitude DECIMAL(11, 8) NOT NULL,
                    radius DECIMAL(10, 2) NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
                
                -- Insert data default jika tabel kosong
                INSERT INTO school_location (name, address, latitude, longitude, radius)
                SELECT 'Sekolah Dasar Contoh', 'Jl. Contoh No. 123, Jakarta', -6.9486, 106.9810, 100.00
                FROM DUAL
                WHERE NOT EXISTS (SELECT 1 FROM school_location LIMIT 1);
            
            ");
        }
        
        $stmt = $db->query("SELECT * FROM school_location LIMIT 1");
        $sekolah = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$sekolah) {
            // Jika data sekolah belum ada, kembalikan nilai default
            echo json_encode([
                'latitude' => -6.9486,
                'longitude' => 106.9810,
                'nama_sekolah' => 'Sekolah',
                'alamat' => 'Jl. Contoh No. 123, SUKABUMI',
                'radius' => 100.00
            ]);
            exit();
        }
        
        echo json_encode([
            'latitude' => (float)$sekolah['latitude'],
            'longitude' => (float)$sekolah['longitude'],
            'nama_sekolah' => $sekolah['name'],
            'alamat' => $sekolah['address'],
            'radius' => (float)$sekolah['radius']
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'message' => 'Gagal mengambil data sekolah',
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
    }
    exit();
}

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

function applyIzinToAbsensi($db, $izin)
{
    $id_guru = $izin['id_guru'];
    $mode = $izin['mode'];
    $id_jadwal_izin = $izin['id_jadwal'];
    $tanggal_mulai = new DateTime($izin['tanggal_mulai']);
    $tanggal_selesai = new DateTime($izin['tanggal_selesai']);

    $hari_map = [
        'Monday' => 'Senin',
        'Tuesday' => 'Selasa',
        'Wednesday' => 'Rabu',
        'Thursday' => 'Kamis',
        'Friday' => 'Jumat',
        'Saturday' => 'Sabtu',
        'Sunday' => 'Minggu'
    ];

    $periode = new DatePeriod($tanggal_mulai, new DateInterval('P1D'), $tanggal_selesai->modify('+1 day'));

    foreach ($periode as $tanggal) {
        $tanggal_str = $tanggal->format('Y-m-d');

        if ($mode === 'per_jadwal' && $id_jadwal_izin) {
            $id_jadwal_list = [$id_jadwal_izin];
        } else {
            $hari_en = $tanggal->format('l');
            $hari_id = $hari_map[$hari_en] ?? $hari_en;

            $stmt_jadwal = $db->prepare("SELECT id_jadwal FROM jadwal WHERE id_guru = ? AND hari = ?");
            $stmt_jadwal->execute([$id_guru, $hari_id]);
            $id_jadwal_list = $stmt_jadwal->fetchAll(PDO::FETCH_COLUMN);
        }

        foreach ($id_jadwal_list as $id_jadwal) {
            $waResult = null;
        try {
                $stmt_insert = $db->prepare("INSERT INTO absensi (id_jadwal, tanggal, jam_masuk, status, latitude, longitude) VALUES (?, ?, NULL, 'Izin', NULL, NULL)");
                $stmt_insert->execute([$id_jadwal, $tanggal_str]);
            } catch (PDOException $e) {
                if ($e->getCode() == '23000') {
                    $stmt_update = $db->prepare("UPDATE absensi SET status = 'Izin', jam_masuk = NULL WHERE id_jadwal = ? AND tanggal = ?");
                    $stmt_update->execute([$id_jadwal, $tanggal_str]);
                } else {
                    throw $e;
                }
            }
        }
    }
}

// =========================================================
//                  ENDPOINT HANDLERS
// =========================================================

// Pastikan koneksi database tersedia
$db = getDBConnection();
$route = $_GET['route'] ?? '';

// Endpoint untuk mendapatkan data sekolah
if ($route === 'sekolah' && $request_method === 'GET') {
    try {
        // Cek apakah tabel school_location ada
        $tableExists = $db->query("SHOW TABLES LIKE 'school_location'")->rowCount() > 0;
        
        if (!$tableExists) {
            // Jika tabel tidak ada, buat tabel
            $db->exec("
                CREATE TABLE IF NOT EXISTS school_location (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    address TEXT,
                    latitude FLOAT(10, 6) NOT NULL,
                    longitude FLOAT(10, 6) NOT NULL,
                    radius FLOAT(10, 2) DEFAULT 100.00,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                
                -- Insert data default jika tabel kosong
                INSERT INTO school_location (name, address, latitude, longitude, radius)
                SELECT 'Sekolah Dasar Contoh', 'Jl. Contoh No. 123, Jakarta', -6.9486, 106.9810, 100.00
                FROM DUAL
                WHERE NOT EXISTS (SELECT 1 FROM school_location LIMIT 1);
            ");
        }
        
        $stmt = $db->query("SELECT * FROM school_location LIMIT 1");
        $sekolah = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$sekolah) {
            // Jika data sekolah belum ada, kembalikan nilai default
            echo json_encode([
                'latitude' => -6.9486,
                'longitude' => 106.9810,
                'nama_sekolah' => 'Sekolah',
                'alamat' => 'Jl. Contoh No. 123, SUKABUMi',
                'radius' => 100.00
            ]);
            exit();
        }
        
        echo json_encode([
            'latitude' => (float)$sekolah['latitude'],
            'longitude' => (float)$sekolah['longitude'],
            'nama_sekolah' => $sekolah['name'],
            'alamat' => $sekolah['address'],
            'radius' => (float)$sekolah['radius']
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'message' => 'Gagal mengambil data sekolah',
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
    }
}

// Endpoint untuk mengupdate data sekolah
if ($route === 'sekolah/update' && $request_method === 'POST') {
    try {
        $user = authenticateUser($db);
        
        // Pastikan hanya admin yang bisa mengupdate
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['message' => 'Anda tidak memiliki izin untuk mengubah data sekolah']);
            exit();
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validasi input
        if (empty($data['nama_sekolah']) || empty($data['alamat']) || 
            !isset($data['latitude']) || !isset($data['longitude']) || 
            !isset($data['radius'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Semua field harus diisi']);
            exit();
        }

        // Pastikan tabel school_location ada
        $tableExists = $db->query("SHOW TABLES LIKE 'school_location'")->rowCount() > 0;
        
        if (!$tableExists) {
            // Buat tabel jika belum ada
            $db->exec("
                CREATE TABLE IF NOT EXISTS school_location (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    address TEXT NOT NULL,
                    latitude DECIMAL(10, 8) NOT NULL,
                    longitude DECIMAL(11, 8) NOT NULL,
                    radius DECIMAL(10, 2) NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            
                -- Insert data default jika tabel kosong
                INSERT INTO school_location (name, address, latitude, longitude, radius)
                SELECT 'Sekolah Dasar Contoh', 'Jl. Contoh No. 123, Jakarta', -6.9486, 106.9810, 100.00
                FROM DUAL
                WHERE NOT EXISTS (SELECT 1 FROM school_location LIMIT 1);
            ");
        }

        // Cek apakah data sekolah sudah ada
        $checkStmt = $db->query("SELECT id FROM school_location LIMIT 1");
        $schoolExists = $checkStmt->rowCount() > 0;
        
        if ($schoolExists) {
            // Update data sekolah yang sudah ada
            $stmt = $db->prepare("UPDATE school_location SET 
                name = :name, 
                address = :address, 
                latitude = :latitude, 
                longitude = :longitude, 
                radius = :radius
                ORDER BY id ASC LIMIT 1");
                
            $stmt->execute([
                ':name' => $data['nama_sekolah'],
                ':address' => $data['alamat'],
                ':latitude' => (float)$data['latitude'],
                ':longitude' => (float)$data['longitude'],
                ':radius' => (float)$data['radius']
            ]);
        } else {
            // Insert data sekolah baru
            $stmt = $db->prepare("INSERT INTO school_location 
                (name, address, latitude, longitude, radius) 
                VALUES (:name, :address, :latitude, :longitude, :radius)");
                
            $stmt->execute([
                ':name' => $data['nama_sekolah'],
                ':address' => $data['alamat'],
                ':latitude' => (float)$data['latitude'],
                ':longitude' => (float)$data['longitude'],
                ':radius' => (float)$data['radius']
            ]);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Data sekolah berhasil diperbarui',
            'data' => [
                'nama_sekolah' => $data['nama_sekolah'],
                'alamat' => $data['alamat'],
                'latitude' => (float)$data['latitude'],
                'longitude' => (float)$data['longitude'],
                'radius' => (float)$data['radius']
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Gagal memperbarui data sekolah',
            'error' => $e->getMessage()
        ]);
    }
    exit();
}


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

// --- 2A. GURU: UPLOAD FOTO IZIN ---
if ($route === 'guru/izin/upload_foto' && $request_method === 'POST') {
    $user = authenticateUser($db);

    if (!isset($_FILES['foto'])) {
        http_response_code(400);
        echo json_encode(["message" => "File foto tidak ditemukan."]);
        exit();
    }

    $upload_dir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'izin';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0775, true);
    }

    $file = $_FILES['foto'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["message" => "Gagal mengunggah foto."]);
        exit();
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $safe_ext = preg_replace('/[^a-zA-Z0-9]/', '', $ext);
    $new_name = 'izin_' . $user['id_guru'] . '_' . time() . '_' . bin2hex(random_bytes(4)) . ($safe_ext ? ('.' . $safe_ext) : '');
    $target_path = $upload_dir . DIRECTORY_SEPARATOR . $new_name;

    if (!move_uploaded_file($file['tmp_name'], $target_path)) {
        http_response_code(500);
        echo json_encode(["message" => "Gagal menyimpan file di server."]);
        exit();
    }

    $relative_path = 'uploads/izin/' . $new_name;

    echo json_encode([
        'success' => true,
        'foto_path' => $relative_path
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

// --- 2B. GURU: GET PROFIL ---
if ($route === 'guru/profile' && $request_method === 'GET') {
    try {
        $user = authenticateUser($db);
        
        // Ambil data profil dari database menggunakan PDO
        $stmt = $db->prepare("SELECT nama, nomor_hp FROM guru WHERE id_guru = :id_guru");
        $stmt->execute([':id_guru' => $user['id_guru']]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$profile) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Data guru tidak ditemukan']);
            exit;
        }
        
        echo json_encode(['success' => true, 'data' => $profile]);
        
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Error in guru/profile: ' . $e->getMessage());
        echo json_encode([
            'success' => false, 
            'message' => 'Terjadi kesalahan server',
            'debug' => (isset($e) ? $e->getMessage() : 'Unknown error')
        ]);
    }
    exit;
}

// --- 2C. GURU: UPDATE PROFIL ---
if ($route === 'guru/update_profile' && $request_method === 'POST') {
    $user = authenticateUser($db);
    $id_guru = $user['id_guru'];
    
    $nama = $input_data['nama'] ?? null;
    $nomor_hp = $input_data['nomor_hp'] ?? null;
    $current_password = $input_data['current_password'] ?? '';
    $new_password = $input_data['new_password'] ?? '';
    $confirm_password = $input_data['confirm_password'] ?? '';
    
    try {
        // Validasi input
        if (empty($nama)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nama tidak boleh kosong']);
            exit();
        }
        
        // Jika ada input password baru, validasi
        if (!empty($new_password)) {
            if (strlen($new_password) < 6) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Password baru minimal 6 karakter']);
                exit();
            }
            
            if ($new_password !== $confirm_password) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Konfirmasi password tidak cocok']);
                exit();
            }
            
            // Verifikasi password lama jika ingin ganti password
            $stmt = $db->prepare("SELECT password_hash FROM guru WHERE id_guru = ?");
            $stmt->execute([$id_guru]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!password_verify($current_password, $user['password_hash'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Password saat ini tidak valid']);
                exit();
            }
            
            // Hash password baru
            $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
        }
        
        // Update data guru
        if (isset($password_hash)) {
            $stmt = $db->prepare("UPDATE guru SET nama = ?, nomor_hp = ?, password_hash = ? WHERE id_guru = ?");
            $result = $stmt->execute([$nama, $nomor_hp, $password_hash, $id_guru]);
        } else {
            $stmt = $db->prepare("UPDATE guru SET nama = ?, nomor_hp = ? WHERE id_guru = ?");
            $result = $stmt->execute([$nama, $nomor_hp, $id_guru]);
        }
        
        if ($result) {
            echo json_encode([
                'success' => true, 
                'message' => 'Profil berhasil diperbarui',
                'data' => [
                    'nama' => $nama,
                    'nomor_hp' => $nomor_hp
                ]
            ]);
        } else {
            throw new Exception('Gagal memperbarui profil');
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Terjadi kesalahan: ' . $e->getMessage()
        ]);
    }
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
    
    // Dapatkan data lokasi sekolah
    $stmt_sekolah = $db->query("SELECT * FROM school_location LIMIT 1");
    $sekolah = $stmt_sekolah->fetch(PDO::FETCH_ASSOC);
    
    if ($sekolah) {
        // Hitung jarak dari lokasi guru ke sekolah (dalam km)
        $lat1 = deg2rad($sekolah['latitude']);
        $lon1 = deg2rad($sekolah['longitude']);
        $lat2 = deg2rad($latitude);
        $lon2 = deg2rad($longitude);
        
        // Rumus Haversine
        $dlat = $lat2 - $lat1;
        $dlon = $lon2 - $lon1;
        $a = sin($dlat / 2) * sin($dlat / 2) + 
             cos($lat1) * cos($lat2) * sin($dlon / 2) * sin($dlon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        $distance = 6371 * $c; // Radius bumi dalam km
        
        // Jika jarak melebihi radius yang diizinkan
        if ($distance > $sekolah['radius']) {
            http_response_code(400);
            echo json_encode([
                "message" => "Anda berada di luar radius absensi yang diizinkan. ".
                            "Jarak Anda: " . round($distance, 2) . " km dari sekolah. ".
                            "Radius maksimum: " . $sekolah['radius'] . " km.",
                "jarak" => round($distance, 2),
                "radius_maksimal" => $sekolah['radius']
            ]);
            exit();
        }
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

    // Kirim jadwal hari ini dengan status kehadiran terupdate ke grup
    try {
        $whatsapp_result = sendJadwalHariIniKeGrup($db);
        
        // Log hasil pengiriman
        error_log("Jadwal terupdate sent to group: " . json_encode($whatsapp_result));
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

// --- 3B. GURU: AJUKAN IZIN ---
if ($route === 'guru/izin' && $request_method === 'POST') {
    $user = authenticateUser($db);
    $id_guru = $user['id_guru'];

    $mode = $input_data['mode'] ?? null;
    $jenis_izin = $input_data['jenis_izin'] ?? null;
    $keterangan = $input_data['keterangan'] ?? null;
    $foto_path = $input_data['foto_path'] ?? null;

    if (empty($mode) || empty($jenis_izin)) {
        http_response_code(400);
        echo json_encode(["message" => "Mode dan jenis_izin wajib diisi."]);
        exit();
    }

    if (!in_array($mode, ['per_jadwal', 'per_hari'])) {
        http_response_code(400);
        echo json_encode(["message" => "Mode tidak valid."]);
        exit();
    }

    if (!in_array($jenis_izin, ['Sakit', 'Dinas', 'Lainnya'])) {
        http_response_code(400);
        echo json_encode(["message" => "Jenis izin tidak valid."]);
        exit();
    }

    $id_jadwal = null;
    $tanggal_mulai = null;
    $tanggal_selesai = null;

    if ($mode === 'per_jadwal') {
        $id_jadwal = $input_data['id_jadwal'] ?? null;
        $tanggal = $input_data['tanggal'] ?? null;

        if (empty($id_jadwal) || empty($tanggal)) {
            http_response_code(400);
            echo json_encode(["message" => "id_jadwal dan tanggal wajib diisi untuk mode per_jadwal."]);
            exit();
        }

        $tanggal_mulai = $tanggal;
        $tanggal_selesai = $tanggal;
    } else {
        $tanggal_mulai = $input_data['tanggal_mulai'] ?? null;
        $tanggal_selesai = $input_data['tanggal_selesai'] ?? null;

        if (empty($tanggal_mulai) || empty($tanggal_selesai)) {
            http_response_code(400);
            echo json_encode(["message" => "tanggal_mulai dan tanggal_selesai wajib diisi untuk mode per_hari."]);
            exit();
        }
    }

    try {
        $stmt = $db->prepare("INSERT INTO izin_guru (id_guru, mode, id_jadwal, tanggal_mulai, tanggal_selesai, jenis_izin, keterangan, foto_path, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')");
        $stmt->execute([
            $id_guru,
            $mode,
            $id_jadwal,
            $tanggal_mulai,
            $tanggal_selesai,
            $jenis_izin,
            $keterangan,
            $foto_path
        ]);

        $id_izin_baru = $db->lastInsertId();

        try {
            $stmt_guru = $db->prepare("SELECT nama FROM guru WHERE id_guru = ?");
            $stmt_guru->execute([$id_guru]);
            $guruData = $stmt_guru->fetch(PDO::FETCH_ASSOC);

            $nama_guru = $guruData['nama'] ?? $id_guru;

            $periode_text = $tanggal_mulai === $tanggal_selesai
                ? date('d/m/Y', strtotime($tanggal_mulai))
                : date('d/m/Y', strtotime($tanggal_mulai)) . ' s/d ' . date('d/m/Y', strtotime($tanggal_selesai));

            $jadwal_text = '';
            if ($mode === 'per_jadwal' && $id_jadwal) {
                $stmt_jadwal = $db->prepare("SELECT kelas, mapel, jam_mulai FROM jadwal WHERE id_jadwal = ?");
                $stmt_jadwal->execute([$id_jadwal]);
                $jadwal = $stmt_jadwal->fetch(PDO::FETCH_ASSOC);
                if ($jadwal) {
                    $jam_mulai = substr($jadwal['jam_mulai'], 0, 5);
                    $jadwal_text = "\\n*Jadwal:* {$jadwal['mapel']} - {$jadwal['kelas']} ({$jam_mulai})";
                }
            }

            $message  = "*📄 PENGAJUAN IZIN GURU*\n\n";
            $message .= "*Guru:* {$nama_guru} ({$id_guru})\n";
            $message .= "*Jenis Izin:* {$jenis_izin}\n";
            $message .= "*Mode:* " . ($mode === 'per_jadwal' ? 'Per Jadwal' : 'Per Hari') . "\n";
            $message .= "*Periode:* {$periode_text}{$jadwal_text}\n";
            if (!empty($keterangan)) {
                $message .= "*Keterangan:* {$keterangan}\n";
            }
            $message .= "\n_Status: Pending persetujuan admin_";

            $mediaUrl = null;
            if (!empty($foto_path)) {
                $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
                $host = $_SERVER['HTTP_HOST'] ?? '';
                $basePath = rtrim(str_replace('api.php', '', $_SERVER['SCRIPT_NAME'] ?? ''), '/');
                $relativePath = ltrim($foto_path, '/');

                // Hanya gunakan mediaUrl jika host bukan localhost/127.0.0.1 dan tidak kosong
                if (!empty($host) && $host !== 'localhost' && $host !== '127.0.0.1') {
                    $mediaUrl = rtrim($scheme . $host . $basePath, '/') . '/' . $relativePath;
                }
            }

            $waResult = sendWhatsAppNotification($message, FONNTE_GROUP_ID, $mediaUrl);
        } catch (Exception $e) {
            error_log('Gagal mengirim notifikasi WA izin: ' . $e->getMessage());
        }

        echo json_encode([
            'success' => true,
            'message' => 'Izin berhasil diajukan dan menunggu persetujuan admin.',
            'id_izin' => $id_izin_baru,
            'media_url' => $mediaUrl,
            'wa_result' => $waResult
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Gagal mengajukan izin.',
            'error' => $e->getMessage()
        ]);
    }
    exit();
}

// --- 3C. GURU: DAFTAR IZIN ---
if ($route === 'guru/izin' && $request_method === 'GET') {
    $user = authenticateUser($db);
    $id_guru = $user['id_guru'];

    $stmt = $db->prepare("SELECT * FROM izin_guru WHERE id_guru = ? ORDER BY created_at DESC");
    $stmt->execute([$id_guru]);
    $izin_list = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($izin_list);
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

// --- 8B. ADMIN: DAFTAR IZIN GURU ---
if ($route === 'admin/izin' && $request_method === 'GET') {
    $user = authenticateUser($db);
    isAdmin($user);

    $status = $_GET['status'] ?? null;
    $id_guru = $_GET['id_guru'] ?? null;

    $query = "SELECT i.*, g.nama AS nama_guru, j.kelas, j.mapel, j.jam_mulai FROM izin_guru i JOIN guru g ON i.id_guru = g.id_guru LEFT JOIN jadwal j ON i.id_jadwal = j.id_jadwal WHERE 1=1";
    $params = [];

    if ($status) {
        $query .= ' AND i.status = ?';
        $params[] = $status;
    }

    if ($id_guru) {
        $query .= ' AND i.id_guru = ?';
        $params[] = $id_guru;
    }

    $query .= ' ORDER BY i.created_at DESC';

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $izin_list = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($izin_list);
    exit();
}

// --- 8C. ADMIN: SETUJUI IZIN ---
if (preg_match('/^admin\/izin\/(\d+)\/approve$/', $route, $matches) && $request_method === 'POST') {
    $user = authenticateUser($db);
    isAdmin($user);
    $id_izin = $matches[1];

    try {
        $stmt = $db->prepare("SELECT * FROM izin_guru WHERE id_izin = ?");
        $stmt->execute([$id_izin]);
        $izin = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$izin) {
            http_response_code(404);
            echo json_encode(["message" => "Izin tidak ditemukan."]);
            exit();
        }

        if ($izin['status'] === 'Disetujui') {
            echo json_encode([
                'success' => true,
                'message' => 'Izin sudah dalam status Disetujui.'
            ]);
            exit();
        }

        $stmt_update = $db->prepare("UPDATE izin_guru SET status = 'Disetujui' WHERE id_izin = ?");
        $stmt_update->execute([$id_izin]);

        applyIzinToAbsensi($db, $izin);

        echo json_encode([
            'success' => true,
            'message' => 'Izin berhasil disetujui dan diterapkan ke absensi.'
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Gagal menyetujui izin.',
            'error' => $e->getMessage()
        ]);
    }
    exit();
}

// --- 8D. ADMIN: TOLAK IZIN ---
if (preg_match('/^admin\/izin\/(\d+)\/reject$/', $route, $matches) && $request_method === 'POST') {
    $user = authenticateUser($db);
    isAdmin($user);
    $id_izin = $matches[1];

    $alasan = $input_data['alasan'] ?? null;

    try {
        $stmt = $db->prepare("SELECT * FROM izin_guru WHERE id_izin = ?");
        $stmt->execute([$id_izin]);
        $izin = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$izin) {
            http_response_code(404);
            echo json_encode(["message" => "Izin tidak ditemukan."]);
            exit();
        }

        $stmt_update = $db->prepare("UPDATE izin_guru SET status = 'Ditolak', keterangan = IFNULL(CONCAT(COALESCE(keterangan, ''), '\n[Ditolak]: ', ?), '\n[Ditolak]: ') WHERE id_izin = ?");
        $stmt_update->execute([$alasan, $id_izin]);

        echo json_encode([
            'success' => true,
            'message' => 'Izin berhasil ditolak.'
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Gagal menolak izin.',
            'error' => $e->getMessage()
        ]);
    }
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
echo json_encode([
    'message' => 'Endpoint tidak ditemukan: ' . $route,
    'method' => $request_method,
    'available_endpoints' => [
        'GET /api.php?route=sekolah' => 'Mendapatkan data sekolah',
        'POST /api.php?route=sekolah/update' => 'Mengupdate data sekolah (admin only)'
    ]
]);
?>
