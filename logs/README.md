# 📁 Logs Folder

Folder ini berisi log files dari cron job dan sistem.

---

## 📄 Files

### `cron_jadwal.log`
Log file dari cron job notifikasi jadwal pagi.

**Format:**
```
[YYYY-MM-DD HH:MM:SS] Message
```

**Contoh:**
```
[2025-10-21 06:00:01] === CRON JOB START ===
[2025-10-21 06:00:01] Database connected
[2025-10-21 06:00:01] Hari ini: Senin, 21/10/2025
[2025-10-21 06:00:01] Ditemukan 5 jadwal
[2025-10-21 06:00:02] Mengirim notifikasi ke grup...
[2025-10-21 06:00:03] ✅ Notifikasi berhasil dikirim
[2025-10-21 06:00:03] Response: {"status":true,"message":"Success"}
[2025-10-21 06:00:03] === CRON JOB END ===
```

---

## 📊 Cara Membaca Log

### Status Sukses
```
✅ Notifikasi berhasil dikirim
```
Jadwal berhasil dikirim ke grup WhatsApp.

### Status Error
```
❌ Gagal mengirim notifikasi: [error message]
```
Ada masalah saat mengirim. Cek:
- Koneksi internet
- Token Fonnte valid
- Group ID benar
- Device WhatsApp connected

### Skip Hari Minggu
```
Hari Minggu - skip notifikasi
```
Cron job tidak mengirim notifikasi di hari Minggu.

### Tidak Ada Jadwal
```
Tidak ada jadwal pada hari [hari]
```
Tidak ada jadwal mengajar di hari tersebut.

---

## 🔍 Monitoring

### Windows

**View log:**
```powershell
type cron_jadwal.log
```

**View last 20 lines:**
```powershell
Get-Content cron_jadwal.log -Tail 20
```

**Search for errors:**
```powershell
Select-String -Path cron_jadwal.log -Pattern "Error"
```

### Linux

**View log:**
```bash
cat cron_jadwal.log
```

**View last 20 lines:**
```bash
tail -n 20 cron_jadwal.log
```

**Real-time monitoring:**
```bash
tail -f cron_jadwal.log
```

**Search for errors:**
```bash
grep "Error" cron_jadwal.log
```

---

## 🗑️ Log Rotation

Log file akan terus bertambah. Untuk menghindari file terlalu besar:

### Manual Cleanup

**Backup dan clear:**
```bash
# Backup
cp cron_jadwal.log cron_jadwal_backup_$(date +%Y%m%d).log

# Clear
> cron_jadwal.log
```

### Auto Rotation (Linux)

Buat file `/etc/logrotate.d/absensi-guru`:
```
/path/to/absen_guru/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
```

---

## 📝 Notes

- Log file dibuat otomatis oleh cron job
- Folder harus writable (chmod 755)
- File `.log` sudah ada di `.gitignore`
- Backup log secara berkala
- Clear log lama untuk hemat space
