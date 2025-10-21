# Setup Cron Job - Notifikasi Jadwal Otomatis

Panduan lengkap untuk setup notifikasi jadwal otomatis yang berjalan di server (tidak perlu buka aplikasi).

---

## 🪟 Windows - Task Scheduler

### Cara 1: Menggunakan GUI Task Scheduler

#### Step 1: Buka Task Scheduler
1. Tekan `Win + R`
2. Ketik `taskschd.msc`
3. Tekan Enter

#### Step 2: Create Basic Task
1. Klik **"Create Basic Task"** di panel kanan
2. Name: `Notifikasi Jadwal Pagi`
3. Description: `Kirim jadwal hari ini ke grup WhatsApp setiap pagi`
4. Klik **Next**

#### Step 3: Trigger (Jadwal)
1. Pilih **"Daily"**
2. Klik **Next**
3. Start: Pilih tanggal mulai (hari ini)
4. Time: `06:00:00` (jam 6 pagi)
5. Recur every: `1` days
6. Klik **Next**

#### Step 4: Action
1. Pilih **"Start a program"**
2. Klik **Next**
3. Program/script: `C:\xampp\php\php.exe` (sesuaikan path PHP Anda)
4. Add arguments: `"d:\SERVER\www\absen_guru\cron_jadwal_pagi.php"`
5. Klik **Next**

#### Step 5: Finish
1. Review settings
2. Centang **"Open the Properties dialog..."**
3. Klik **Finish**

#### Step 6: Advanced Settings (Optional)
Di Properties dialog:
1. Tab **General**:
   - Centang "Run whether user is logged on or not"
   - Centang "Run with highest privileges"

2. Tab **Conditions**:
   - Uncheck "Start the task only if the computer is on AC power"
   - Centang "Wake the computer to run this task"

3. Tab **Settings**:
   - Centang "Run task as soon as possible after a scheduled start is missed"
   - Centang "If the task fails, restart every: 5 minutes"

4. Klik **OK**

---

### Cara 2: Menggunakan Command Line (PowerShell)

Buka PowerShell sebagai Administrator dan jalankan:

```powershell
# Buat XML untuk Task Scheduler
$xml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Kirim jadwal hari ini ke grup WhatsApp setiap pagi</Description>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>2025-01-01T06:00:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay>
        <DaysInterval>1</DaysInterval>
      </ScheduleByDay>
    </CalendarTrigger>
  </Triggers>
  <Actions>
    <Exec>
      <Command>C:\xampp\php\php.exe</Command>
      <Arguments>d:\SERVER\www\absen_guru\cron_jadwal_pagi.php</Arguments>
    </Exec>
  </Actions>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>true</WakeToRun>
    <ExecutionTimeLimit>PT1H</ExecutionTimeLimit>
  </Settings>
</Task>
"@

# Simpan XML
$xml | Out-File -FilePath "$env:TEMP\jadwal_task.xml" -Encoding unicode

# Import task
schtasks /create /tn "Notifikasi Jadwal Pagi" /xml "$env:TEMP\jadwal_task.xml" /f

Write-Host "✅ Task berhasil dibuat!"
```

---

### Cara 3: Menggunakan Batch Script

Buat file `setup_cron.bat`:

```batch
@echo off
echo Setting up Cron Job for Jadwal Pagi...

schtasks /create /tn "Notifikasi Jadwal Pagi" /tr "C:\xampp\php\php.exe d:\SERVER\www\absen_guru\cron_jadwal_pagi.php" /sc daily /st 06:00 /f

echo.
echo ✅ Task Scheduler berhasil dibuat!
echo.
echo Untuk melihat task: taskschd.msc
echo Untuk test manual: schtasks /run /tn "Notifikasi Jadwal Pagi"
echo.
pause
```

Jalankan sebagai Administrator.

---

## 🐧 Linux - Crontab

### Step 1: Edit Crontab

```bash
crontab -e
```

### Step 2: Tambahkan Baris Ini

```bash
# Kirim jadwal setiap hari jam 06:00
0 6 * * * /usr/bin/php /path/to/absen_guru/cron_jadwal_pagi.php >> /path/to/absen_guru/logs/cron.log 2>&1
```

**Penjelasan:**
- `0 6 * * *` = Jam 06:00 setiap hari
- `/usr/bin/php` = Path ke PHP (cek dengan `which php`)
- `/path/to/...` = Path lengkap ke file cron
- `>> .../cron.log` = Simpan output ke log file
- `2>&1` = Redirect error ke log juga

### Step 3: Simpan dan Keluar

- Vim/Vi: Tekan `ESC`, ketik `:wq`, Enter
- Nano: Tekan `Ctrl+X`, `Y`, Enter

### Step 4: Verifikasi

```bash
# Lihat crontab yang aktif
crontab -l

# Cek status cron service
sudo systemctl status cron
```

---

## 🧪 Testing

### Test Manual di Windows

```powershell
# Test run task
schtasks /run /tn "Notifikasi Jadwal Pagi"

# Lihat hasil
Get-Content "d:\SERVER\www\absen_guru\logs\cron_jadwal.log" -Tail 20
```

### Test Manual di Linux

```bash
# Jalankan script langsung
php /path/to/absen_guru/cron_jadwal_pagi.php

# Lihat log
tail -f /path/to/absen_guru/logs/cron_jadwal.log
```

### Test via Browser

Buka: `http://localhost/absen_guru/cron_jadwal_pagi.php`

---

## 📊 Monitoring

### Windows - Event Viewer

1. Buka Event Viewer (`eventvwr.msc`)
2. Navigate: **Task Scheduler** → **Microsoft** → **Windows** → **TaskScheduler**
3. Lihat log eksekusi task

### Linux - Log File

```bash
# Lihat log real-time
tail -f /path/to/absen_guru/logs/cron_jadwal.log

# Lihat 50 baris terakhir
tail -n 50 /path/to/absen_guru/logs/cron_jadwal.log

# Cari error
grep "Error" /path/to/absen_guru/logs/cron_jadwal.log
```

---

## 🔧 Troubleshooting

### Problem: Task tidak jalan

**Windows:**
```powershell
# Cek status task
schtasks /query /tn "Notifikasi Jadwal Pagi" /v /fo list

# Cek last run result
Get-ScheduledTask -TaskName "Notifikasi Jadwal Pagi" | Get-ScheduledTaskInfo
```

**Linux:**
```bash
# Cek cron service
sudo systemctl status cron

# Restart cron service
sudo systemctl restart cron

# Cek syslog
grep CRON /var/log/syslog
```

### Problem: PHP tidak ditemukan

**Windows:**
- Cek path PHP: `where php`
- Atau gunakan full path: `C:\xampp\php\php.exe`

**Linux:**
- Cek path PHP: `which php`
- Atau gunakan full path: `/usr/bin/php`

### Problem: Permission denied

**Linux:**
```bash
# Berikan permission execute
chmod +x /path/to/absen_guru/cron_jadwal_pagi.php

# Cek permission
ls -la /path/to/absen_guru/cron_jadwal_pagi.php
```

---

## 📝 Konfigurasi Waktu Lain

### Kirim 2x Sehari (Pagi & Siang)

**Windows:** Buat 2 task terpisah dengan waktu berbeda

**Linux:**
```bash
# Pagi jam 06:00
0 6 * * * /usr/bin/php /path/to/cron_jadwal_pagi.php

# Siang jam 12:00
0 12 * * * /usr/bin/php /path/to/cron_jadwal_pagi.php
```

### Kirim Setiap Jam (Senin-Jumat)

**Linux:**
```bash
# Setiap jam, Senin-Jumat, jam kerja 07:00-17:00
0 7-17 * * 1-5 /usr/bin/php /path/to/cron_jadwal_pagi.php
```

### Kirim Setiap 30 Menit

**Linux:**
```bash
# Setiap 30 menit
*/30 * * * * /usr/bin/php /path/to/cron_jadwal_pagi.php
```

---

## ✅ Checklist Setup

- [ ] PHP path sudah benar
- [ ] File path sudah benar (absolute path)
- [ ] Folder `logs/` sudah dibuat
- [ ] Permission file sudah benar (Linux)
- [ ] Database connection berfungsi
- [ ] Fonnte API token valid
- [ ] Group ID WhatsApp benar
- [ ] Test manual berhasil
- [ ] Cron job/Task terdaftar
- [ ] Log file terisi

---

## 📞 Support

Jika masih ada masalah:
1. Cek log file di `logs/cron_jadwal.log`
2. Test manual via browser
3. Cek koneksi database
4. Cek Fonnte API status

---

**Setelah setup, jadwal akan otomatis terkirim setiap pagi tanpa perlu buka aplikasi!** 🎉
