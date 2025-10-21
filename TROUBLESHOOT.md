# Troubleshooting - Pesan Tidak Masuk ke Grup

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
