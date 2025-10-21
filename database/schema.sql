-- Skrip SQL untuk membuat struktur database dan data awal (PHP Backend)

-- 1. Buat Database
CREATE DATABASE IF NOT EXISTS absensi_guru_db;
USE absensi_guru_db;

-- 2. Tabel Guru
-- Kita akan menggunakan password_hash asli dari PHP (bcrypt)
-- Password 'admin123' -> $2y$10$wB5V.L7pB4k.H9l.9G8pXedcEwF/Z2rJ7O1I6Y5X4W3V2U1T0S9
-- Password 'guru123' -> $2y$10$oX3h.K2j.I1n.M9l.H8pXdcEwF/Z2rJ7O1I6Y5X4W3V2U1T0S9

CREATE TABLE guru (
    id_guru VARCHAR(50) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    nomor_hp VARCHAR(20) NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('guru', 'admin') NOT NULL DEFAULT 'guru'
);

-- 3. Tabel Jadwal
CREATE TABLE jadwal (
    id_jadwal INT AUTO_INCREMENT PRIMARY KEY,
    id_guru VARCHAR(50) NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    mapel VARCHAR(100) NOT NULL,
    hari ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') NOT NULL,
    jam_mulai TIME NOT NULL,
    FOREIGN KEY (id_guru) REFERENCES guru(id_guru) ON DELETE CASCADE
);

-- 4. Tabel Absensi (Log Kehadiran)
CREATE TABLE absensi (
    id_absensi INT AUTO_INCREMENT PRIMARY KEY,
    id_jadwal INT NOT NULL,
    tanggal DATE NOT NULL,
    jam_masuk DATETIME NULL, -- NULL jika mangkir
    status ENUM('Hadir', 'Terlambat', 'Mangkir', 'Belum Absen') NOT NULL DEFAULT 'Belum Absen',
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    FOREIGN KEY (id_jadwal) REFERENCES jadwal(id_jadwal) ON DELETE CASCADE,
    UNIQUE KEY unique_session (id_jadwal, tanggal)
);

-- Memasukkan Data Contoh (Menggunakan hash asli PHP bcrypt)
INSERT INTO guru (id_guru, nama, nomor_hp, password_hash, role) VALUES
('G001', 'Budi Santoso', '081234567890', '$2y$10$oX3h.K2j.I1n.M9l.H8pXdcEwF/Z2rJ7O1I6Y5X4W3V2U1T0S9', 'guru'), -- password: guru123
('G002', 'Dewi Lestari', '081234567891', '$2y$10$oX3h.K2j.I1n.M9l.H8pXdcEwF/Z2rJ7O1I6Y5X4W3V2U1T0S9', 'guru'), -- password: guru123
('ADM01', 'Admin Sekolah', '081234567892', '$2y$10$wB5V.L7pB4k.H9l.9G8pXedcEwF/Z2rJ7O1I6Y5X4W3V2U1T0S9', 'admin'); -- password: admin123

-- Memasukkan Data Jadwal (Guru Budi: Senin & Rabu, Guru Dewi: Selasa)
INSERT INTO jadwal (id_guru, kelas, mapel, hari, jam_mulai) VALUES
('G001', '10 IPA 1', 'Matematika', 'Senin', '07:00:00'),
('G001', '11 IPS 2', 'Fisika', 'Senin', '10:00:00'),
('G002', '10 IPA 2', 'Kimia', 'Selasa', '07:00:00'),
('G001', '12 Bahasa', 'Sejarah', 'Rabu', '08:30:00');
