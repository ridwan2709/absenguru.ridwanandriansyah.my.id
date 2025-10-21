# 📁 Scripts Folder

Folder ini berisi script automation untuk cron job dan setup.

---

## 📄 Files

### `cron_jadwal_pagi.php`
Script PHP yang dijalankan oleh cron job untuk mengirim jadwal pagi otomatis.

**Fungsi:**
- Ambil jadwal hari ini dari database
- Tambahkan status kehadiran (✅/⚠️)
- Format pesan WhatsApp
- Kirim ke grup via Fonnte API
- Simpan log ke `../logs/cron_jadwal.log`

**Jadwal:**
- Setiap hari jam 06:00 pagi
- Skip hari Minggu

**Test manual:**
```bash
# Via browser
http://localhost/absen_guru/scripts/cron_jadwal_pagi.php

# Via command line
php cron_jadwal_pagi.php
```

---

### `setup_cron_windows.bat`
Script batch untuk setup cron job di Windows Task Scheduler.

**Cara menggunakan:**
1. Klik kanan file
2. Pilih **"Run as administrator"**
3. Ikuti instruksi di layar
4. Test kirim jadwal (optional)

**Yang dilakukan:**
- ✅ Cek instalasi PHP
- ✅ Buat folder logs
- ✅ Buat Task Scheduler
- ✅ Set jadwal jam 06:00 setiap hari
- ✅ Test kirim jadwal (opsional)

**Requirements:**
- Windows 7/8/10/11
- XAMPP/WAMP atau PHP standalone
- Run as Administrator

---

### `setup_cron_linux.sh`
Script bash untuk setup cron job di Linux crontab.

**Cara menggunakan:**
```bash
# Berikan permission execute
chmod +x setup_cron_linux.sh

# Jalankan script
./setup_cron_linux.sh
```

**Yang dilakukan:**
- ✅ Cek instalasi PHP
- ✅ Buat folder logs
- ✅ Tambah cron job ke crontab
- ✅ Set jadwal jam 06:00 setiap hari
- ✅ Test kirim jadwal (opsional)

**Requirements:**
- Linux (Ubuntu/Debian/CentOS/etc)
- PHP CLI installed
- Cron service running

---

## 🔧 Konfigurasi Cron Job

### Windows Task Scheduler

**Command:**
```
C:\xampp\php\php.exe "d:\SERVER\www\absen_guru\scripts\cron_jadwal_pagi.php"
```

**Schedule:**
- Trigger: Daily
- Time: 06:00 AM
- Recur every: 1 days

### Linux Crontab

**Entry:**
```bash
0 6 * * * /usr/bin/php /path/to/absen_guru/scripts/cron_jadwal_pagi.php >> /path/to/absen_guru/logs/cron_jadwal.log 2>&1
```

**Format:**
```
* * * * * command
│ │ │ │ │
│ │ │ │ └─ Day of week (0-7, 0=Sunday)
│ │ │ └─── Month (1-12)
│ │ └───── Day of month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

---

## 📊 Monitoring

### Cek Log File

**Windows:**
```powershell
type "..\logs\cron_jadwal.log"
```

**Linux:**
```bash
tail -f ../logs/cron_jadwal.log
```

### Contoh Log

```
[2025-10-21 06:00:01] === CRON JOB START ===
[2025-10-21 06:00:01] Database connected
[2025-10-21 06:00:01] Hari ini: Senin, 21/10/2025
[2025-10-21 06:00:01] Ditemukan 5 jadwal
[2025-10-21 06:00:02] Mengirim notifikasi ke grup...
[2025-10-21 06:00:03] ✅ Notifikasi berhasil dikirim
[2025-10-21 06:00:03] === CRON JOB END ===
```

---

## 🧪 Testing

### Test Manual

**Windows:**
```powershell
# Run task now
schtasks /run /tn "Notifikasi Jadwal Pagi"

# View task
taskschd.msc
```

**Linux:**
```bash
# Run script directly
php cron_jadwal_pagi.php

# View crontab
crontab -l
```

### Test via Browser

```
http://localhost/absen_guru/scripts/cron_jadwal_pagi.php
```

---

## 🔄 Ubah Jadwal

### Kirim 2x Sehari

**Linux:**
```bash
# Pagi jam 06:00
0 6 * * * /usr/bin/php /path/to/cron_jadwal_pagi.php

# Siang jam 12:00
0 12 * * * /usr/bin/php /path/to/cron_jadwal_pagi.php
```

**Windows:** Buat 2 task terpisah dengan waktu berbeda

### Kirim Setiap Jam (Senin-Jumat)

**Linux:**
```bash
# Setiap jam, Senin-Jumat, jam 07:00-17:00
0 7-17 * * 1-5 /usr/bin/php /path/to/cron_jadwal_pagi.php
```

---

## 📝 Notes

- Script menggunakan path relatif (`__DIR__ . '/../'`)
- Log file disimpan di `../logs/`
- Pastikan folder logs writable (chmod 755)
- Cron job tidak perlu aplikasi dibuka
- Berjalan di background server
