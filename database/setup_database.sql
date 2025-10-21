-- Skrip SQL untuk membuat struktur database dan data awal (Node.js Backend)

-- 1. Buat Database
CREATE DATABASE IF NOT EXISTS absensi_guru_db;
USE absensi_guru_db;

-- 2. Tabel Guru
CREATE TABLE IF NOT EXISTS guru (
    id_guru VARCHAR(50) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('guru', 'admin') NOT NULL DEFAULT 'guru'
);

-- 3. Tabel Jadwal
CREATE TABLE IF NOT EXISTS jadwal (
    id_jadwal INT AUTO_INCREMENT PRIMARY KEY,
    id_guru VARCHAR(50) NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    mapel VARCHAR(100) NOT NULL,
    hari ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') NOT NULL,
    jam_mulai TIME NOT NULL,
    FOREIGN KEY (id_guru) REFERENCES guru(id_guru) ON DELETE CASCADE
);

-- 4. Tabel Absensi (Log Kehadiran)
CREATE TABLE IF NOT EXISTS absensi (
    id_absensi INT AUTO_INCREMENT PRIMARY KEY,
    id_jadwal INT NOT NULL,
    tanggal DATE NOT NULL,
    jam_masuk DATETIME NULL,
    status ENUM('Hadir', 'Terlambat', 'Mangkir', 'Belum Absen') NOT NULL DEFAULT 'Belum Absen',
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    FOREIGN KEY (id_jadwal) REFERENCES jadwal(id_jadwal) ON DELETE CASCADE,
    UNIQUE KEY unique_session (id_jadwal, tanggal)
);

-- Hapus data lama jika ada
DELETE FROM absensi;
DELETE FROM jadwal;
DELETE FROM guru;

-- Memasukkan Data Guru dengan bcrypt hash yang valid untuk Node.js
-- Password hash di-generate menggunakan bcryptjs
INSERT INTO guru (id_guru, nama, password_hash, role) VALUES
('G001', 'Budi Santoso', '$2b$10$28Znpc8J3/bQn0ksW2bMK.fAR546xYe5iktcr24ha0n2PMKkXyXwm', 'guru'),    -- password: guru123
('G002', 'Dewi Lestari', '$2b$10$28Znpc8J3/bQn0ksW2bMK.fAR546xYe5iktcr24ha0n2PMKkXyXwm', 'guru'),   -- password: guru123
('ADM01', 'Admin Sekolah', '$2b$10$9KvcBCSsoRsTt8YkylGmNu0iVZLQ/gz1yNm7WC8Qm2FCfrNYZtLoG', 'admin'); -- password: admin123

-- Memasukkan Data Jadwal
INSERT INTO jadwal (id_guru, kelas, mapel, hari, jam_mulai) VALUES
('G001', '10 IPA 1', 'Matematika', 'Senin', '07:00:00'),
('G001', '11 IPS 2', 'Fisika', 'Senin', '10:00:00'),
('G002', '10 IPA 2', 'Kimia', 'Selasa', '07:00:00'),
('G001', '12 Bahasa', 'Sejarah', 'Rabu', '08:30:00');

-- Verifikasi data
SELECT 'Data Guru:' as Info;
SELECT id_guru, nama, role FROM guru;

SELECT 'Data Jadwal:' as Info;
SELECT j.id_jadwal, g.nama, j.kelas, j.mapel, j.hari, j.jam_mulai 
FROM jadwal j 
JOIN guru g ON j.id_guru = g.id_guru;
