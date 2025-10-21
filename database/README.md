# 📁 Database Folder

Folder ini berisi SQL files dan script untuk setup database.

---

## 📄 Files

### `setup_database.sql`
SQL script untuk membuat database dan tabel.

**Cara menggunakan:**
```bash
# Via command line
mysql -u root -p < setup_database.sql

# Via phpMyAdmin
# 1. Buka phpMyAdmin
# 2. Klik "Import"
# 3. Pilih file setup_database.sql
# 4. Klik "Go"
```

**Isi:**
- Membuat database `absensi_guru_db`
- Membuat tabel: `guru`, `jadwal`, `absensi`
- Insert data admin default
- Insert data guru sample

---

### `schema.sql`
Database schema (struktur tabel saja, tanpa data).

**Gunakan jika:**
- Hanya ingin melihat struktur database
- Ingin membuat tabel di database yang sudah ada
- Untuk dokumentasi

---

### `setup_passwords.php`
Script PHP untuk setup/reset password guru.

**Cara menggunakan:**
```bash
# Via browser
http://localhost/absen_guru/database/setup_passwords.php

# Via command line
php setup_passwords.php
```

**Fungsi:**
- Hash password guru dengan `password_hash()`
- Update password di database
- Menampilkan list guru dengan password baru

**Default passwords:**
- Admin (ADM01): `admin123`
- Guru (G001, G002, dst): `guru123`

---

## 🗄️ Database Structure

### Tabel `guru`
```sql
- id_guru (VARCHAR, PRIMARY KEY)
- nama (VARCHAR)
- nomor_hp (VARCHAR)
- password (VARCHAR, hashed)
- role (ENUM: 'admin', 'guru')
```

### Tabel `jadwal`
```sql
- id_jadwal (INT, AUTO_INCREMENT, PRIMARY KEY)
- id_guru (VARCHAR, FOREIGN KEY)
- kelas (VARCHAR)
- mapel (VARCHAR)
- hari (ENUM: Senin-Minggu)
- jam_mulai (TIME)
```

### Tabel `absensi`
```sql
- id_absensi (INT, AUTO_INCREMENT, PRIMARY KEY)
- id_jadwal (INT, FOREIGN KEY)
- tanggal (DATE)
- jam_masuk (TIME)
- status (ENUM: 'Hadir', 'Terlambat')
- latitude (DECIMAL)
- longitude (DECIMAL)
```

---

## 🔄 Migration

Jika ingin update struktur database:

1. Backup database terlebih dahulu
2. Buat file migration baru (misal: `migration_v2.sql`)
3. Jalankan migration
4. Test aplikasi

---

## 📝 Notes

- Pastikan MySQL/MariaDB sudah running
- Cek kredensial database di `../koneksi.php`
- Untuk production, ubah password default
- Backup database secara berkala
