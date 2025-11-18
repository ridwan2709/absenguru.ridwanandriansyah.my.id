ALTER TABLE `absensi` CHANGE `status` `status` ENUM('Hadir','Terlambat','Mangkir','Belum Absen','Izin') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Belum Absen';
-- 5. Tabel Izin Guru
CREATE TABLE izin_guru (
    id_izin INT AUTO_INCREMENT PRIMARY KEY,
    id_guru VARCHAR(50) NOT NULL,
    mode ENUM('per_jadwal', 'per_hari') NOT NULL,
    id_jadwal INT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    jenis_izin ENUM('Sakit', 'Dinas', 'Lainnya') NOT NULL,
    keterangan TEXT NULL,
    foto_path VARCHAR(255) NULL,
    status ENUM('Pending', 'Disetujui', 'Ditolak') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_izin_guru_guru FOREIGN KEY (id_guru) REFERENCES guru(id_guru) ON DELETE CASCADE,
    CONSTRAINT fk_izin_guru_jadwal FOREIGN KEY (id_jadwal) REFERENCES jadwal(id_jadwal) ON DELETE SET NULL
);
