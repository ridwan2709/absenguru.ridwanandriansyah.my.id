# 📁 Config Folder

Folder ini berisi template konfigurasi untuk database dan WhatsApp API.

---

## 📄 Files

### `koneksi.php.example`
Template konfigurasi database MySQL/MariaDB.

**Cara menggunakan:**
```bash
# Copy file
cp koneksi.php.example ../koneksi.php

# Edit file ../koneksi.php dengan kredensial database Anda
```

**Konfigurasi:**
```php
define('DB_HOST', 'localhost');      // Host database
define('DB_USER', 'root');           // Username database
define('DB_PASSWORD', '');           // Password database
define('DB_NAME', 'absensi_guru_db'); // Nama database
```

---

### `fonnte_config.php.example`
Template konfigurasi Fonnte WhatsApp API.

**Cara menggunakan:**
```bash
# Copy file
cp fonnte_config.php.example ../fonnte_config.php

# Edit file ../fonnte_config.php dengan token dan group ID Anda
```

**Konfigurasi:**
```php
define('FONNTE_TOKEN', 'your-token-here');           // Token dari fonnte.com
define('FONNTE_GROUP_ID', 'your-group-id@g.us');    // ID grup WhatsApp
```

**Cara mendapatkan:**
1. **Token:** Login ke https://fonnte.com → Dashboard → Copy token
2. **Group ID:** Kirim pesan ke bot Fonnte → Balas dengan "group" → Copy ID grup

---

## ⚠️ Security

File konfigurasi aktif (`koneksi.php` dan `fonnte_config.php`) sudah ada di `.gitignore` dan tidak akan di-commit ke Git.

**Jangan:**
- ❌ Commit file konfigurasi aktif ke Git
- ❌ Share token/password di public
- ❌ Hardcode credentials di code

**Lakukan:**
- ✅ Gunakan file `.example` sebagai template
- ✅ Copy dan rename untuk development/production
- ✅ Simpan credentials di environment variables (optional)

---

## 📝 Notes

- File `.example` adalah template dan aman untuk di-commit
- File aktif (tanpa `.example`) berisi credentials asli dan tidak boleh di-commit
- Pastikan file aktif ada di parent directory (`../`)
