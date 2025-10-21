# Sistem Absensi Guru

Sistem absensi guru dengan notifikasi WhatsApp ke grup.

## Setup

1. Import database:
```bash
mysql -u root -p < setup_database.sql
php setup_passwords.php
```

2. Jalankan server:
```bash
php -S localhost:8000
```

3. Buka aplikasi:
```
http://localhost:8000/index.html
```

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

## Test WhatsApp

```
http://localhost:8000/test_fonnte.php
http://localhost:8000/test_group.php
http://localhost:8000/debug_fonnte.php
```
