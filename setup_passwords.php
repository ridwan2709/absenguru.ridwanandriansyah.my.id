<?php
/**
 * ============================================
 * SETUP PASSWORD - Sistem Absensi Guru
 * ============================================
 * 
 * Script untuk generate dan update password hash di database
 * Jalankan sekali saja saat pertama kali setup
 * 
 * Cara menjalankan:
 * 1. Via browser: http://localhost:8000/setup_passwords.php
 * 2. Via CLI: php setup_passwords.php
 */

date_default_timezone_set('Asia/Jakarta');

// Konfigurasi Database
$db_host = 'localhost';
$db_user = 'root';
$db_password = '';
$db_name = 'absensi_guru_db';

try {
    $conn = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== Setup Password untuk Absensi Guru ===\n\n";
    
    // Generate hash untuk password
    $guru123_hash = password_hash('guru123', PASSWORD_BCRYPT);
    $admin123_hash = password_hash('admin123', PASSWORD_BCRYPT);
    
    echo "Password Hashes:\n";
    echo "guru123  -> $guru123_hash\n";
    echo "admin123 -> $admin123_hash\n\n";
    
    // Update password untuk guru
    $stmt = $conn->prepare("UPDATE guru SET password_hash = ? WHERE id_guru IN ('G001', 'G002')");
    $stmt->execute([$guru123_hash]);
    echo "✅ Password untuk G001 dan G002 berhasil diupdate\n";
    
    // Update password untuk admin
    $stmt = $conn->prepare("UPDATE guru SET password_hash = ? WHERE id_guru = 'ADM01'");
    $stmt->execute([$admin123_hash]);
    echo "✅ Password untuk ADM01 berhasil diupdate\n\n";
    
    // Verifikasi
    $stmt = $conn->query("SELECT id_guru, nama, role, LEFT(password_hash, 20) as hash_preview FROM guru");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Data Guru:\n";
    foreach ($users as $user) {
        echo "- {$user['id_guru']} | {$user['nama']} | {$user['role']} | {$user['hash_preview']}...\n";
    }
    
    echo "\n✅ Setup selesai!\n";
    echo "\nKredensial Login:\n";
    echo "Guru  : G001 / guru123\n";
    echo "Guru  : G002 / guru123\n";
    echo "Admin : ADM01 / admin123\n\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
