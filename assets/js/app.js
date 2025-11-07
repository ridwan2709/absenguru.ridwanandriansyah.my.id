// Main Application Module
// File ini mengatur state global dan render aplikasi

// State Aplikasi Global
window.userToken = localStorage.getItem('absensiToken') || null;
window.userRole = localStorage.getItem('absensiRole') || null;
window.userName = localStorage.getItem('absensiName') || null;
window.userId = localStorage.getItem('absensiId') || null;
window.currentView = window.userToken ? (window.userRole === 'admin' ? 'admin' : 'guru') : 'login';

// Data sekolah global
window.sekolahData = {
    latitude: -6.9486,
    longitude: 106.9810,
    nama_sekolah: 'Sekolah Contoh',
    alamat: 'Jl. Contoh No. 123, SUKABUMI',
    radius: 100
};

// Render aplikasi sesuai view
function renderApp() {
    updateUserInfo();
    const container = document.getElementById('app-container');
    container.innerHTML = '';
    
    // Reset container classes untuk setiap view
    container.className = 'flex-grow p-4 md:p-8 flex justify-center items-start';
    
    switch (window.currentView) {
        case 'guru':
            renderGuruDashboard();
            break;
        case 'admin':
            renderAdminDashboard();
            break;
        case 'login':
        default:
            renderLogin();
            break;
    }
}

// Auto-kirim jadwal pagi jika admin login di pagi hari
async function autoKirimJadwalPagi() {
    if (window.userRole !== 'admin') return;
    
    const now = new Date();
    const hour = now.getHours();
    const lastSent = localStorage.getItem('lastJadwalSent');
    const today = now.toISOString().split('T')[0];
    
    if (lastSent === today) {
        console.log('Jadwal hari ini sudah dikirim');
        return;
    }
    
    if (hour >= 6 && hour < 8) {
        console.log('Waktu pagi terdeteksi, mengirim jadwal otomatis...');
        
        try {
            const response = await fetch('kirim_jadwal.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('lastJadwalSent', today);
                console.log('✅ Jadwal pagi berhasil dikirim otomatis');
                showNotification('✅ Jadwal pagi telah dikirim ke grup WhatsApp', 'success');
            }
        } catch (error) {
            console.error('Error auto-kirim jadwal:', error);
        }
    } else if (hour >= 8 && hour < 12) {
        showNotification('⚠️ Reminder: Belum mengirim jadwal hari ini. Klik tombol "Kirim Jadwal" di dashboard.', 'warning');
    }
}

// Fungsi untuk mengirim jadwal ke grup WhatsApp
async function kirimJadwalKeGrup() {
    const btn = event.target.closest('button');
    const textEl = document.getElementById('kirim-jadwal-text');
    const spinner = document.getElementById('kirim-jadwal-spinner');
    
    btn.disabled = true;
    textEl.textContent = 'Mengirim...';
    spinner.classList.remove('hidden');
    
    try {
        const response = await fetch('kirim_jadwal.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem('lastJadwalSent', today);
            
            showNotification('✅ Jadwal berhasil dikirim ke grup WhatsApp!', 'success');
        } else {
            showNotification('❌ Gagal mengirim jadwal: ' + (data.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ Terjadi kesalahan saat mengirim jadwal: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        textEl.textContent = '📤 Kirim Jadwal';
        spinner.classList.add('hidden');
    }
}

// Event listener saat DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.userToken && window.userRole && window.userName && window.userId) {
        console.log('Token ditemukan, login otomatis sebagai:', window.userName);
        window.currentView = window.userRole === 'admin' ? 'admin' : 'guru';
        
        setTimeout(() => autoKirimJadwalPagi(), 2000);
    } else {
        if (window.userToken || window.userRole || window.userName || window.userId) {
            console.log('Data login tidak lengkap, membersihkan localStorage...');
            localStorage.clear();
            window.userToken = null;
            window.userRole = null;
            window.userName = null;
            window.userId = null;
        }
        window.currentView = 'login';
    }
    renderApp();
});
