#!/bin/bash
# ============================================
# Setup Cron Job untuk Notifikasi Jadwal Pagi
# Linux Crontab
# ============================================

echo ""
echo "========================================"
echo "  Setup Notifikasi Jadwal Otomatis"
echo "========================================"
echo ""

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCRIPT_PATH="$SCRIPT_DIR/cron_jadwal_pagi.php"
LOG_PATH="$SCRIPT_DIR/logs/cron_jadwal.log"

echo -e "${YELLOW}[INFO]${NC} Checking PHP installation..."

# Cek PHP
PHP_PATH=$(which php)
if [ -z "$PHP_PATH" ]; then
    echo -e "${RED}[ERROR]${NC} PHP tidak ditemukan!"
    echo "Silakan install PHP terlebih dahulu:"
    echo "  Ubuntu/Debian: sudo apt-get install php-cli"
    echo "  CentOS/RHEL: sudo yum install php-cli"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} PHP ditemukan: $PHP_PATH"
echo ""

# Cek file script
if [ ! -f "$SCRIPT_PATH" ]; then
    echo -e "${RED}[ERROR]${NC} File cron_jadwal_pagi.php tidak ditemukan!"
    echo "Path: $SCRIPT_PATH"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} Script ditemukan: $SCRIPT_PATH"
echo ""

# Buat folder logs jika belum ada
if [ ! -d "$SCRIPT_DIR/logs" ]; then
    echo -e "${YELLOW}[INFO]${NC} Membuat folder logs..."
    mkdir -p "$SCRIPT_DIR/logs"
    chmod 755 "$SCRIPT_DIR/logs"
fi

# Berikan permission execute
chmod +x "$SCRIPT_PATH"

echo -e "${YELLOW}[INFO]${NC} Membuat cron job..."
echo ""

# Cron job entry
CRON_JOB="0 6 * * * $PHP_PATH $SCRIPT_PATH >> $LOG_PATH 2>&1"

# Cek apakah cron job sudah ada
crontab -l 2>/dev/null | grep -q "$SCRIPT_PATH"
if [ $? -eq 0 ]; then
    echo -e "${YELLOW}[WARNING]${NC} Cron job sudah ada. Menghapus yang lama..."
    crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH" | crontab -
fi

# Tambahkan cron job baru
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo -e "  ${GREEN}✅ Setup Berhasil!${NC}"
    echo "========================================"
    echo ""
    echo "Cron job telah ditambahkan."
    echo "Jadwal akan otomatis terkirim setiap hari jam 06:00 pagi."
    echo ""
    echo "Informasi Cron Job:"
    echo "  Schedule: Setiap hari jam 06:00"
    echo "  PHP: $PHP_PATH"
    echo "  Script: $SCRIPT_PATH"
    echo "  Log: $LOG_PATH"
    echo ""
    echo "Untuk melihat crontab:"
    echo "  crontab -l"
    echo ""
    echo "Untuk edit crontab:"
    echo "  crontab -e"
    echo ""
    echo "Untuk melihat log:"
    echo "  tail -f $LOG_PATH"
    echo ""
else
    echo ""
    echo "========================================"
    echo -e "  ${RED}❌ Setup Gagal!${NC}"
    echo "========================================"
    echo ""
    echo "Terjadi kesalahan saat menambahkan cron job."
    echo "Silakan coba manual dengan: crontab -e"
    echo ""
    exit 1
fi

# Tanya apakah ingin test
read -p "Apakah Anda ingin test kirim jadwal sekarang? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}[INFO]${NC} Menjalankan test..."
    echo ""
    $PHP_PATH "$SCRIPT_PATH"
    echo ""
    echo -e "${YELLOW}[INFO]${NC} Test selesai. Cek grup WhatsApp Anda."
    echo -e "${YELLOW}[INFO]${NC} Cek log di: $LOG_PATH"
    echo ""
    if [ -f "$LOG_PATH" ]; then
        echo "Last 10 lines of log:"
        echo "---"
        tail -n 10 "$LOG_PATH"
    fi
fi

echo ""
echo "Setup selesai!"
echo ""
