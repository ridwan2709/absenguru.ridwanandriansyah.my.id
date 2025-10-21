# Sistem Absensi Guru

Sistem absensi guru dengan notifikasi WhatsApp ke grup.

## Setup

### 1. Konfigurasi Database
```bash
# Copy file konfigurasi
cp koneksi.php.example koneksi.php

# Edit koneksi.php sesuai dengan database Anda
# DB_HOST = 'localhost'
# DB_USER = 'root'
# DB_PASSWORD = ''
# DB_NAME = 'absensi_guru_db'
```

### 2. Import Database
```bash
mysql -u root -p < setup_database.sql
php setup_passwords.php
```

### 3. Pastikan Apache Module Aktif
Untuk XAMPP/WAMP, pastikan module ini aktif di `httpd.conf`:
- `mod_rewrite`
- `mod_headers`

Restart Apache setelah mengaktifkan module.

### 4. Akses Aplikasi
```
http://localhost/absen_guru
```

**PENTING:** Jangan gunakan `php -S` built-in server, gunakan Apache/XAMPP/WAMP karena aplikasi membutuhkan `.htaccess` untuk Authorization header.

## Login

- Admin: `ADM01` / `admin123`
- Guru: `G001` / `guru123`

## Fitur

### Dashboard Admin
- ✅ Manajemen Guru (tambah, hapus)
- ✅ Manajemen Jadwal (tambah, **edit**, hapus)
- ✅ Laporan Absensi (filter tanggal & guru)

### Dashboard Guru
- ✅ Lihat jadwal hari ini
- ✅ Absensi dengan GPS
- ✅ Riwayat absensi

### Notifikasi WhatsApp
- ✅ Otomatis ke grup saat guru absen
- ✅ Info lengkap (nama, kelas, mapel, status)

## API Endpoints

### Guru
- `GET /api.php?route=guru/jadwal_hari_ini` - Jadwal hari ini
- `GET /api.php?route=guru/jadwal_semua` - Semua jadwal guru
- `POST /api.php?route=guru/absensi/{id}` - Catat absensi

### Admin - Jadwal
- `GET /api.php?route=admin/jadwal` - List semua jadwal
- `POST /api.php?route=admin/jadwal` - Tambah jadwal
- `PUT /api.php?route=admin/jadwal/{id}` - Edit jadwal
- `DELETE /api.php?route=admin/jadwal/{id}` - Hapus jadwal

## Konfigurasi WhatsApp

Edit `fonnte_config.php`:
- Token Fonnte sudah diisi
- Group ID sudah diisi
- Notifikasi otomatis ke grup saat guru absen

## Test & Debugging

### Test WhatsApp
```
http://localhost/absen_guru/test_fonnte.php
http://localhost/absen_guru/test_group.php
http://localhost/absen_guru/debug_fonnte.php
```

### Test Authorization Header
Buka Console browser (F12) dan jalankan:
```javascript
fetch('http://localhost/absen_guru/test_auth.php', {
    headers: {
        'Authorization': 'Bearer TEST123'
    }
}).then(r => r.json()).then(console.log)
```

Harus menampilkan Authorization header yang terdeteksi.

## Troubleshooting

Jika mengalami masalah, lihat file `TROUBLESHOOT.md` untuk panduan lengkap:
- Masalah "Sesi Berakhir" setelah login
- Authorization header tidak diterima
- WhatsApp notifikasi tidak masuk
- Dan lainnya
