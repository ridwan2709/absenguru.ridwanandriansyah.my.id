# 📚 Sistem Absensi Guru

Sistem absensi guru dengan notifikasi WhatsApp otomatis ke grup.

---

## 📂 Struktur Folder

```
absen_guru/
├── 📱 Frontend & Backend
│   ├── index.html              - Aplikasi utama (frontend)
│   ├── api.php                 - REST API backend
│   ├── kirim_jadwal.php        - Endpoint kirim jadwal
│   ├── koneksi.php             - Konfigurasi database (buat dari example)
│   └── fonnte_config.php       - Konfigurasi WhatsApp (buat dari example)
│
├── 📁 config/                  - File konfigurasi
│   ├── koneksi.php.example     - Template konfigurasi database
│   └── fonnte_config.php.example - Template konfigurasi WhatsApp
│
├── 📁 database/                - Database & setup
│   ├── setup_database.sql      - SQL untuk membuat database
│   ├── schema.sql              - Schema database
│   └── setup_passwords.php     - Setup password guru
│
├── 📁 scripts/                 - Script automation
│   ├── cron_jadwal_pagi.php    - Cron job notifikasi pagi
│   ├── setup_cron_windows.bat  - Setup cron Windows
│   └── setup_cron_linux.sh     - Setup cron Linux
│
├── 📁 docs/                    - Dokumentasi
│   ├── README.md               - Dokumentasi utama (ini)
│   ├── TROUBLESHOOT.md         - Panduan troubleshooting
│   ├── SETUP_CRON.md           - Panduan setup cron job
│   └── SETUP_SHARED_HOSTING.md - Panduan setup di shared hosting
│
├── 📁 logs/                    - Log files
│   └── cron_jadwal.log         - Log cron job
│
└── 🔒 Server Config
    ├── .htaccess               - Apache configuration
    └── .gitignore              - Git ignore rules
```

---

## 🚀 Quick Start

### 1. Setup Database

```bash
# Copy konfigurasi
cp config/koneksi.php.example koneksi.php
cp config/fonnte_config.php.example fonnte_config.php

# Edit koneksi.php dengan kredensial database Anda
# Edit fonnte_config.php dengan token Fonnte Anda

# Import database
mysql -u root -p < database/setup_database.sql

# Setup password guru
php database/setup_passwords.php
```

### 2. Akses Aplikasi

```
http://localhost/absen_guru
```

### 3. Login

**Admin:**
- ID: `ADM01`
- Password: `admin123`

**Guru:**
- ID: `G001`
- Password: `guru123`

### 4. Setup Notifikasi Otomatis (Optional)

**Windows:**
```bash
# Jalankan sebagai Administrator
scripts\setup_cron_windows.bat
```

**Linux:**
```bash
chmod +x scripts/setup_cron_linux.sh
./scripts/setup_cron_linux.sh
```

**Shared Hosting:**
Lihat panduan di `docs/SETUP_SHARED_HOSTING.md`

---

## ✨ Fitur

### Dashboard Admin
- ✅ Manajemen Guru (tambah, hapus)
- ✅ Manajemen Jadwal (tambah, edit, hapus)
- ✅ Laporan Absensi (filter tanggal & guru)
- ✅ **Kirim Jadwal ke Grup** (tombol di dashboard)

### Dashboard Guru
- ✅ Lihat jadwal hari ini
- ✅ Absensi dengan GPS
- ✅ Riwayat absensi

### Notifikasi WhatsApp
- ✅ Otomatis saat guru absen
- ✅ Jadwal lengkap dengan status kehadiran (✅/⚠️)
- ✅ Statistik real-time (Hadir: X/Y sesi)
- ✅ Kirim manual dari dashboard admin
- ✅ Auto-kirim pagi hari via cron job

---

## 📱 Format Notifikasi WhatsApp

```
📚 *Jadwal KBM Senin, 21 Okt 2025*

1️⃣ *07:00*
• Matematika - Budi Santoso (10A) ✅
• Fisika - Siti Aminah (10B)

2️⃣ *08:30*
• Bahasa Indonesia - Ahmad Yani (11A) ✅

_Hadir: 2/3 sesi_
```

---

## 🔧 Konfigurasi

### Database (`koneksi.php`)

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'absensi_guru_db');
```

### WhatsApp (`fonnte_config.php`)

```php
define('FONNTE_TOKEN', 'your-token-here');
define('FONNTE_GROUP_ID', 'your-group-id@g.us');
```

---

## 📖 Dokumentasi Lengkap

| Dokumen | Keterangan |
|---------|------------|
| `docs/README.md` | Dokumentasi utama (ini) |
| `docs/TROUBLESHOOT.md` | Panduan troubleshooting |
| `docs/SETUP_CRON.md` | Setup cron job (Windows/Linux) |
| `docs/SETUP_SHARED_HOSTING.md` | Setup di shared hosting |

---

## 🛠️ Tech Stack

- **Frontend:** HTML, TailwindCSS, Vanilla JavaScript
- **Backend:** PHP 7.4+, MySQL/MariaDB
- **WhatsApp API:** Fonnte
- **Server:** Apache/Nginx

---

## 📊 API Endpoints

### Guru
- `GET /api.php?route=guru/jadwal_hari_ini` - Jadwal hari ini
- `GET /api.php?route=guru/jadwal_semua` - Semua jadwal guru
- `POST /api.php?route=guru/absensi/{id}` - Catat absensi

### Admin
- `GET /api.php?route=admin/jadwal` - List semua jadwal
- `POST /api.php?route=admin/jadwal` - Tambah jadwal
- `PUT /api.php?route=admin/jadwal/{id}` - Edit jadwal
- `DELETE /api.php?route=admin/jadwal/{id}` - Hapus jadwal
- `GET /api.php?route=admin/laporan_absensi` - Laporan absensi

### Notifikasi
- `POST /kirim_jadwal.php` - Kirim jadwal ke grup

---

## 🔒 Keamanan

- ✅ Password hashing dengan `password_hash()`
- ✅ Prepared statements (SQL injection protection)
- ✅ CORS headers
- ✅ Authorization header untuk API
- ✅ `.htaccess` untuk Apache configuration

---

## 📞 Support

Jika ada masalah:
1. Cek `docs/TROUBLESHOOT.md`
2. Cek log di `logs/cron_jadwal.log`
3. Test manual via browser
4. Cek koneksi database & Fonnte API

---

## 📝 License

MIT License - Free to use and modify

---

## 🎯 Version

**v1.0.0** - Production Ready

- ✅ Full CRUD operations
- ✅ WhatsApp notifications
- ✅ Auto-send schedule
- ✅ Real-time status updates
- ✅ Shared hosting compatible

---

**Dibuat dengan ❤️ untuk memudahkan absensi guru**
