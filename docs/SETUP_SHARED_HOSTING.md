# Setup di Shared Hosting

Panduan lengkap untuk menjalankan notifikasi jadwal otomatis di **shared hosting** (cPanel, Plesk, dll).

---

## ✅ Ya, Bisa Berjalan di Shared Hosting!

Hampir semua shared hosting menyediakan fitur **Cron Jobs** melalui control panel (cPanel/Plesk).

---

## 📋 Persyaratan Shared Hosting:

| Fitur | Status | Keterangan |
|-------|--------|------------|
| PHP 7.4+ | ✅ Wajib | Hampir semua hosting punya |
| MySQL/MariaDB | ✅ Wajib | Untuk database |
| Cron Jobs | ✅ Wajib | Tersedia di cPanel/Plesk |
| `curl` atau `file_get_contents` | ✅ Wajib | Untuk API Fonnte |
| SSH Access | ❌ Tidak perlu | Bisa setup via cPanel |

---

## 🎛️ Setup via cPanel (Paling Umum)

### Step 1: Upload Files

1. Upload semua file ke hosting via FTP/File Manager
2. Struktur folder:
   ```
   public_html/absen_guru/
   ├── index.html
   ├── api.php
   ├── cron_jadwal_pagi.php  ← File ini yang akan dijadwalkan
   ├── fonnte_config.php
   ├── koneksi.php
   └── logs/
   ```

### Step 2: Konfigurasi Database

1. Buat database MySQL di cPanel
2. Import `setup_database.sql`
3. Edit `koneksi.php` dengan kredensial database hosting

### Step 3: Setup Cron Job di cPanel

#### A. Masuk ke Cron Jobs
1. Login ke **cPanel**
2. Cari menu **"Cron Jobs"** atau **"Advanced" → "Cron Jobs"**
3. Klik untuk membuka

#### B. Pilih Email Notification (Optional)
```
Email: your-email@example.com
```
Anda akan dapat email jika cron job error.

#### C. Add New Cron Job

**Common Settings:**
- Pilih: **"Once Per Day"** atau **"Common Settings"**
- Atau pilih **"Custom"** untuk kontrol penuh

**Minute:** `0`
**Hour:** `6` (jam 06:00 pagi)
**Day:** `*` (setiap hari)
**Month:** `*` (setiap bulan)
**Weekday:** `*` (setiap hari dalam seminggu)

**Command:**
```bash
/usr/bin/php /home/username/public_html/absen_guru/cron_jadwal_pagi.php
```

⚠️ **Ganti:**
- `/home/username/` dengan path home directory Anda
- Cek path PHP dengan: `which php` via SSH atau tanya hosting support

#### D. Alternative Command (Jika path PHP berbeda)

Beberapa hosting menggunakan path berbeda:

```bash
# PHP 7.4
/usr/bin/php74 /home/username/public_html/absen_guru/cron_jadwal_pagi.php

# PHP 8.0
/usr/bin/php80 /home/username/public_html/absen_guru/cron_jadwal_pagi.php

# PHP 8.1
/usr/bin/php81 /home/username/public_html/absen_guru/cron_jadwal_pagi.php

# Atau gunakan php-cli
/usr/bin/php-cli /home/username/public_html/absen_guru/cron_jadwal_pagi.php

# Atau via wget (jika PHP tidak bisa diakses langsung)
wget -q -O - https://yourdomain.com/absen_guru/cron_jadwal_pagi.php
```

#### E. Klik "Add New Cron Job"

---

## 🔧 Setup via Plesk

### Step 1: Masuk ke Scheduled Tasks

1. Login ke **Plesk**
2. Go to **"Tools & Settings"**
3. Klik **"Scheduled Tasks"** atau **"Cron Jobs"**

### Step 2: Add Task

**Task type:** `Run a PHP script`

**Script path:**
```
/httpdocs/absen_guru/cron_jadwal_pagi.php
```

**Schedule:**
- **Minute:** `0`
- **Hour:** `6`
- **Day of month:** `*`
- **Month:** `*`
- **Day of week:** `*`

**Notification:** Email jika error (optional)

### Step 3: Save

---

## 🌐 Alternative: Trigger via URL (Jika Cron Job Tidak Tersedia)

Beberapa shared hosting murah tidak punya cron jobs. Gunakan **external cron service**:

### Option 1: EasyCron (Free)

1. Daftar di https://www.easycron.com
2. Add Cron Job:
   - **URL:** `https://yourdomain.com/absen_guru/cron_jadwal_pagi.php`
   - **Schedule:** Daily at 06:00
3. Save

### Option 2: cron-job.org (Free)

1. Daftar di https://cron-job.org
2. Create Cronjob:
   - **Title:** Notifikasi Jadwal Pagi
   - **URL:** `https://yourdomain.com/absen_guru/cron_jadwal_pagi.php`
   - **Schedule:** Every day at 06:00
3. Save

### Option 3: SetCronJob (Free)

1. Daftar di https://www.setcronjob.com
2. Add Cron Job:
   - **URL:** `https://yourdomain.com/absen_guru/cron_jadwal_pagi.php`
   - **Time:** 06:00 daily
3. Save

⚠️ **Keamanan:** Jika menggunakan external service, tambahkan security token!

---

## 🔒 Keamanan untuk External Cron

Edit `cron_jadwal_pagi.php`:

```php
<?php
// Tambahkan di awal file, setelah require

// Security: Cek token untuk mencegah akses tidak sah
$secret_token = 'GANTI_DENGAN_TOKEN_RAHASIA_ANDA';
$request_token = $_GET['token'] ?? '';

if ($request_token !== $secret_token) {
    http_response_code(403);
    die('Unauthorized access');
}

// Lanjutkan script seperti biasa...
```

**URL untuk external cron:**
```
https://yourdomain.com/absen_guru/cron_jadwal_pagi.php?token=GANTI_DENGAN_TOKEN_RAHASIA_ANDA
```

---

## 📍 Cara Cek Path di Shared Hosting

### Method 1: Buat file `info.php`

```php
<?php
// Upload file ini ke hosting
echo "PHP Path: " . PHP_BINARY . "<br>";
echo "Home Directory: " . $_SERVER['HOME'] ?? $_SERVER['DOCUMENT_ROOT'] . "<br>";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "<br>";
echo "Script Path: " . __DIR__ . "<br>";
?>
```

Akses: `https://yourdomain.com/absen_guru/info.php`

### Method 2: Via SSH (jika tersedia)

```bash
# Login SSH
ssh username@yourdomain.com

# Cek PHP path
which php
which php74
which php80

# Cek home directory
pwd
echo $HOME
```

### Method 3: Tanya Support Hosting

Kirim ticket ke support hosting:
```
Subject: PHP CLI Path untuk Cron Job

Halo, saya ingin setup cron job untuk menjalankan PHP script.
Mohon informasi:
1. Path lengkap ke PHP CLI
2. Path home directory saya
3. Cara setup cron job di cPanel

Terima kasih.
```

---

## 🧪 Testing di Shared Hosting

### Test 1: Akses via Browser

```
https://yourdomain.com/absen_guru/cron_jadwal_pagi.php
```

Jika berhasil, Anda akan melihat output atau jadwal terkirim ke WhatsApp.

### Test 2: Cek Log File

Via File Manager cPanel:
```
/public_html/absen_guru/logs/cron_jadwal.log
```

### Test 3: Test Cron Job Manual

Di cPanel Cron Jobs, ada tombol **"Run Now"** atau **"Test"** (tergantung hosting).

---

## ⚠️ Troubleshooting Shared Hosting

### Problem: Permission Denied

**Solusi:**
```bash
# Via File Manager cPanel, set permission:
# Folder logs/ → 755
# File cron_jadwal_pagi.php → 644
```

### Problem: PHP Path Wrong

**Solusi:**
Coba path alternatif:
```bash
/usr/bin/php
/usr/local/bin/php
/opt/cpanel/ea-php74/root/usr/bin/php
php
```

### Problem: Database Connection Failed

**Solusi:**
1. Cek `koneksi.php` → host biasanya `localhost`
2. Beberapa hosting pakai `127.0.0.1` atau `mysql.yourdomain.com`
3. Cek username & password database

### Problem: Fonnte API Timeout

**Solusi:**
1. Cek `allow_url_fopen` enabled di PHP
2. Atau gunakan cURL (sudah ada fallback di `fonnte_config.php`)
3. Whitelist IP hosting di Fonnte (jika perlu)

### Problem: Cron Job Tidak Jalan

**Solusi:**
1. Cek email notifikasi dari cPanel
2. Lihat log file
3. Test manual via browser
4. Hubungi support hosting

---

## 📊 Monitoring di Shared Hosting

### Via cPanel:

1. **Cron Jobs** → Lihat last run time
2. **Email** → Cek error notification
3. **File Manager** → Buka `logs/cron_jadwal.log`

### Via FTP:

Download dan buka file:
```
/public_html/absen_guru/logs/cron_jadwal.log
```

---

## 💰 Rekomendasi Hosting

Hosting yang **sudah ditest** dan support cron jobs:

| Hosting | Cron Jobs | PHP | Harga/bulan |
|---------|-----------|-----|-------------|
| Niagahoster | ✅ | 7.4-8.2 | ~20rb |
| Hostinger | ✅ | 7.4-8.2 | ~15rb |
| Rumahweb | ✅ | 7.4-8.2 | ~25rb |
| IDCloudHost | ✅ | 7.4-8.2 | ~15rb |
| Dewaweb | ✅ | 7.4-8.2 | ~20rb |

Semua hosting di atas punya cPanel dan support cron jobs.

---

## ✅ Checklist Setup Shared Hosting

- [ ] Files uploaded ke hosting
- [ ] Database dibuat dan diimport
- [ ] `koneksi.php` dikonfigurasi
- [ ] `fonnte_config.php` dikonfigurasi
- [ ] Folder `logs/` ada dan writable (755)
- [ ] Test manual via browser berhasil
- [ ] Cron job ditambahkan di cPanel
- [ ] Test cron job manual berhasil
- [ ] Email notification diset (optional)
- [ ] Log file terisi setelah cron run

---

## 🎯 Kesimpulan

**Ya, sistem ini 100% bisa berjalan di shared hosting!**

**Yang Anda butuhkan:**
1. ✅ Shared hosting dengan cPanel/Plesk
2. ✅ PHP 7.4+ dan MySQL
3. ✅ Fitur Cron Jobs (hampir semua hosting punya)
4. ✅ 5-10 menit untuk setup

**Tidak perlu:**
- ❌ VPS atau dedicated server
- ❌ SSH access
- ❌ Root access
- ❌ Server sendiri

---

## 📞 Support

Jika masih ada masalah:
1. Cek log file di `logs/cron_jadwal.log`
2. Test manual via browser
3. Hubungi support hosting untuk bantuan cron job
4. Gunakan external cron service sebagai backup

---

**Sistem ini dirancang untuk shared hosting dan sudah ditest di berbagai provider!** 🎉
