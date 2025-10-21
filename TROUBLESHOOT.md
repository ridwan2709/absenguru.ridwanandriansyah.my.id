# Troubleshooting Guide

## 1. Masalah "Sesi Berakhir" Setelah Login

### Penyebab:
Aplikasi menampilkan pesan "Sesi Berakhir" setelah login berhasil.

### Solusi yang Sudah Diterapkan:
1. **Logika autentikasi diperbaiki** - Hanya logout jika pesan error secara eksplisit menyebutkan token tidak valid
2. **Logging ditambahkan** - Untuk debugging di browser console
3. **Network error handling** - Membedakan antara error server dan error koneksi

### Cara Debug:
1. Buka **Browser Console** (F12 → Console)
2. Login ke aplikasi
3. Perhatikan log yang muncul:
   - `Attempting login for: [ID]`
   - `Login berhasil: [data]`
   - `Data tersimpan di localStorage, redirect ke dashboard...`
   - `Memuat jadwal hari ini...`
   - `Jadwal berhasil dimuat: [data]`

### Kemungkinan Masalah:

#### A. Database Tidak Terhubung
**Gejala:** Error "Koneksi database gagal"

**Solusi:**
1. Pastikan MySQL/MariaDB berjalan
2. Cek file `koneksi.php` (copy dari `koneksi.php.example`)
3. Sesuaikan kredensial database:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'root');
   define('DB_PASSWORD', '');
   define('DB_NAME', 'absensi_guru_db');
   ```

#### B. Data Guru Tidak Ada
**Gejala:** Error "ID Guru atau Password salah" atau "Token tidak valid atau pengguna tidak ditemukan"

**Solusi:**
1. Jalankan `setup_passwords.php` untuk membuat password guru
2. Atau import ulang `schema.sql`

#### C. Browser Cache
**Gejala:** Masih muncul "Sesi Berakhir" meskipun sudah diperbaiki

**Solusi:**
1. Klik tombol **"Bersihkan Data Login Lama"** di halaman login
2. Atau clear localStorage manual:
   - Buka Console (F12)
   - Ketik: `localStorage.clear()`
   - Refresh halaman (Ctrl+R)

#### D. CORS Error
**Gejala:** Error "Failed to fetch" di console

**Solusi:**
1. Pastikan akses melalui `localhost/absen_guru` (bukan file:// protocol)
2. Pastikan PHP server berjalan (XAMPP/WAMP/Laragon)

### Test Koneksi API:
Buka di browser:
```
http://localhost/absen_guru/api.php?route=login
```

Jika muncul error atau blank, berarti ada masalah di backend.

#### E. Authorization Header Tidak Diterima
**Gejala:** Error "Akses ditolak. Token tidak ditemukan" setelah login berhasil

**Penyebab:** Apache/PHP tidak meneruskan Authorization header

**Solusi:**
1. File `.htaccess` sudah dibuat otomatis dengan konfigurasi yang benar
2. Pastikan `mod_rewrite` dan `mod_headers` aktif di Apache
3. Restart Apache/XAMPP/WAMP

**Test Authorization Header:**
Buka Console browser (F12) dan jalankan:
```javascript
fetch('http://localhost/absen_guru/test_auth.php', {
    headers: {
        'Authorization': 'Bearer TEST123'
    }
}).then(r => r.json()).then(console.log)
```

Lihat output - harus ada Authorization header yang terdeteksi.

**Jika masih tidak terdeteksi:**
- Cek file `php.ini` → pastikan `cgi.fix_pathinfo=1`
- Restart web server
- Coba akses via `127.0.0.1` bukan `localhost`

---

## 2. Troubleshooting - Pesan Tidak Masuk ke Grup

## Kemungkinan Penyebab:

### 1. Device WhatsApp Disconnect (90% kasus!)

**Cek:**
- Login ke https://fonnte.com
- Menu **Device**
- Lihat status: Harus **Connected** (hijau)

**Solusi:**
1. Klik "Scan QR Code"
2. Scan dengan WhatsApp Anda
3. Tunggu status Connected
4. Test lagi

### 2. Nomor Tidak Ada di Grup

**Cek:**
- Nomor WhatsApp yang terhubung di Fonnte harus **ada di grup**
- Nomor tersebut harus **admin grup**

**Solusi:**
1. Tambahkan nomor ke grup
2. Jadikan admin grup
3. Test lagi

### 3. Group ID Salah

**Cek:**
- Format: `628xxx-xxx@g.us`
- Cek di dashboard Fonnte → Menu **Groups**

**Solusi:**
1. Copy Group ID yang benar
2. Update di `fonnte_config.php`
3. Test lagi

### 4. Token Expired

**Cek:**
- Dashboard Fonnte → Menu **API**

**Solusi:**
1. Generate token baru
2. Update di `fonnte_config.php`
3. Test lagi

## Cara Test:

```
http://localhost:8000/test_group.php
```

Tool ini akan:
- Kirim pesan test ke grup
- Tampilkan response detail
- Berikan solusi spesifik

## Langkah Debug:

1. Buka `test_group.php`
2. Lihat response dari Fonnte
3. Ikuti solusi yang diberikan
4. Test ulang

## Penyebab Paling Sering:

**Device Disconnect!**

Solusi tercepat:
1. https://fonnte.com → Login
2. Device → Scan QR Code
3. Test lagi
