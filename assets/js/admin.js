// Admin Dashboard Module
// File ini berisi fungsi-fungsi untuk dashboard admin

// Render Admin Dashboard
async function renderAdminDashboard() {
    const header = document.getElementById('main-header');
    if (header) header.classList.remove('hidden');
    
    const container = document.getElementById('app-container');
    container.className = 'flex-grow p-4 md:p-8';
    container.innerHTML = `
        <div class="w-full max-w-6xl space-y-6">
            <div class="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
                <h2 class="text-3xl font-bold">Dashboard Admin</h2>
                <p class="text-purple-100 mt-2">Selamat datang, ${window.userName}. Kelola sistem absensi dengan mudah.</p>
            </div>

            <!-- Content Area -->
            <div class="bg-white rounded-xl shadow-md overflow-hidden">
                <div id="admin-content" class="p-6">
                    <p class="text-center text-gray-500">Memuat...</p>
                </div>
            </div>
        </div>
    `;
    
    // Add bottom navigation bar (Android style)
    const bottomNav = document.createElement('div');
    bottomNav.className = 'fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50';
    bottomNav.innerHTML = `
        <div class="flex justify-around items-center p-2">
            <button onclick="switchAdminTab('dashboard')" data-admin-tab="dashboard" class="admin-menu-item flex flex-col items-center justify-center w-full py-2 px-1 text-primary relative">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
                <span class="text-xs mt-1">Dashboard</span>
            </button>
            <button onclick="switchAdminTab('guru')" data-admin-tab="guru" class="admin-menu-item flex flex-col items-center justify-center w-full py-2 px-1 text-gray-500 hover:text-primary relative">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span class="text-xs mt-1">Guru</span>
            </button>
            <button onclick="switchAdminTab('jadwal')" data-admin-tab="jadwal" class="admin-menu-item flex flex-col items-center justify-center w-full py-2 px-1 text-gray-500 hover:text-primary relative">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span class="text-xs mt-1">Jadwal</span>
            </button>
            <button onclick="switchAdminTab('laporan')" data-admin-tab="laporan" class="admin-menu-item flex flex-col items-center justify-center w-full py-2 px-1 text-gray-500 hover:text-primary relative">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span class="text-xs mt-1">Laporan</span>
            </button>
            <button onclick="switchAdminTab('maps')" data-admin-tab="maps" class="admin-menu-item flex flex-col items-center justify-center w-full py-2 px-1 text-gray-500 hover:text-primary relative">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span class="text-xs mt-1">Peta</span>
            </button>
        </div>
    `;
    document.body.appendChild(bottomNav);
    
    // Add padding to main content to prevent bottom nav from covering content
    const mainContent = document.querySelector('main');
    mainContent.style.paddingBottom = '70px';
    
    switchAdminTab('dashboard');
}

// Switch admin tab
function switchAdminTab(tabName) {
    // Remove active state from all menu items
    const menuItems = document.querySelectorAll('.admin-menu-item');
    menuItems.forEach(item => {
        item.classList.remove('text-primary');
        item.classList.add('text-gray-500', 'hover:text-primary');
        const icon = item.querySelector('svg');
        if (icon) {
            icon.classList.remove('text-primary');
            icon.classList.add('text-gray-500');
        }
    });
    
    // Activate selected menu item
    const activeTab = document.querySelector(`[data-admin-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.remove('text-gray-500', 'hover:text-primary');
        activeTab.classList.add('text-primary');
        const icon = activeTab.querySelector('svg');
        if (icon) {
            icon.classList.remove('text-gray-500');
            icon.classList.add('text-primary');
        }
    }
    
    switch (tabName) {
        case 'dashboard':
            renderAdminStats();
            break;
        case 'guru':
            renderManajemenGuru();
            break;
        case 'jadwal':
            renderManajemenJadwal();
            break;
        case 'laporan':
            renderLaporanAbsensi();
            break;
        case 'maps':
            renderMapsSettings();
            break;
    }
    
    // Scroll to top of the content
    window.scrollTo(0, 0);
}

// Render admin stats (dashboard)
async function renderAdminStats() {
    const contentEl = document.getElementById('admin-content');
    contentEl.innerHTML = `
        <h3 class="text-2xl font-semibold mb-6 text-gray-800">Statistik Sistem</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-blue-100 text-sm">Total Guru</p>
                        <p id="stat-total-guru" class="text-3xl font-bold mt-2">-</p>
                    </div>
                    <svg class="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                </div>
            </div>
            
            <div class="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-green-100 text-sm">Hadir Hari Ini</p>
                        <p id="stat-hadir-hari-ini" class="text-3xl font-bold mt-2">-</p>
                    </div>
                    <svg class="w-12 h-12 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
            </div>
            
            <div class="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-red-100 text-sm">Belum Absen</p>
                        <p id="stat-belum-absen" class="text-3xl font-bold mt-2">-</p>
                    </div>
                    <svg class="w-12 h-12 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
            </div>
        </div>
        
        <div class="mt-8">
            <h4 class="text-xl font-semibold mb-4 text-gray-800">Absensi Terbaru</h4>
            <div id="recent-attendance" class="bg-white rounded-lg border border-gray-200">
                <p class="p-4 text-center text-gray-500">Memuat data...</p>
            </div>
        </div>
    `;
    
    loadAdminStats();
}

// Load admin statistics
async function loadAdminStats() {
    try {
        // Hitung statistik manual dari data yang ada
        const guruList = await apiFetch('admin/guru');
        const today = new Date().toISOString().split('T')[0];
        const absensiToday = await apiFetch(`admin/laporan_absensi&tanggal=${today}`);
        
        // Hitung total guru
        const totalGuru = guruList.length;
        
        // Hitung yang sudah hadir (status Hadir atau Terlambat)
        const hadirToday = absensiToday.filter(a => a.status === 'Hadir' || a.status === 'Terlambat').length;
        
        // Hitung yang belum absen
        const belumAbsen = totalGuru - hadirToday;
        
        // Update UI
        document.getElementById('stat-total-guru').textContent = totalGuru;
        document.getElementById('stat-hadir-hari-ini').textContent = hadirToday;
        document.getElementById('stat-belum-absen').textContent = belumAbsen >= 0 ? belumAbsen : 0;
        
        // Load absensi terbaru (gunakan data absensiToday yang sudah di-fetch)
        const recentContainer = document.getElementById('recent-attendance');
        const recent = absensiToday;
        
        if (!recent || recent.length === 0) {
            recentContainer.innerHTML = '<p class="p-4 text-center text-gray-500">Belum ada data absensi hari ini</p>';
            return;
        }
        
        // Sort by jam_masuk descending (terbaru dulu)
        const sortedRecent = recent.sort((a, b) => {
            if (!a.jam_masuk) return 1;
            if (!b.jam_masuk) return -1;
            return b.jam_masuk.localeCompare(a.jam_masuk);
        }).slice(0, 10); // Ambil 10 terbaru
        
        let html = '<div class="divide-y divide-gray-200">';
        sortedRecent.forEach(item => {
            const statusClass = item.status === 'Hadir' ? 'bg-green-100 text-green-800' : 
                               item.status === 'Terlambat' ? 'bg-yellow-100 text-yellow-800' : 
                               'bg-red-100 text-red-800';
            
            const jamMasuk = item.jam_masuk ? item.jam_masuk.substring(11, 16) : '-';
            
            html += `
                <div class="p-4 hover:bg-gray-50 transition-colors">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="font-semibold text-gray-900">${item.nama_guru}</p>
                            <p class="text-sm text-gray-600">${item.mapel} - ${item.kelas} (${item.jam_mulai.substring(0, 5)})</p>
                        </div>
                        <div class="text-right">
                            <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusClass}">${item.status}</span>
                            <p class="text-sm text-gray-500 mt-1">${jamMasuk}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        recentContainer.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading admin stats:', error);
        showNotification('Gagal memuat statistik: ' + error.message, 'error');
        
        // Set default values on error
        document.getElementById('stat-total-guru').textContent = '-';
        document.getElementById('stat-hadir-hari-ini').textContent = '-';
        document.getElementById('stat-belum-absen').textContent = '-';
        document.getElementById('recent-attendance').innerHTML = '<p class="p-4 text-center text-red-500">Gagal memuat data</p>';
    }
}

// Lihat file admin-guru.js untuk fungsi renderManajemenGuru dan terkait
// Lihat file admin-jadwal.js untuk fungsi renderManajemenJadwal dan terkait
// Lihat file admin-laporan.js untuk fungsi renderLaporanAbsensi
// Lihat file admin-maps.js untuk fungsi renderMapsSettings
