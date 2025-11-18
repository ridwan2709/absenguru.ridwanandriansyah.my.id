// Guru Dashboard Module
// File ini berisi fungsi-fungsi untuk dashboard guru

let isScheduleLoading = false;

// Render Guru Dashboard
async function renderGuruDashboard() {
    const header = document.getElementById('main-header');
    if (header) header.classList.remove('hidden');
    
    const container = document.getElementById('app-container');
    container.className = 'flex-grow p-4 md:p-8';
    container.innerHTML = `
        <div class="w-full max-w-6xl space-y-8">
            <div class="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
                <h2 class="text-3xl font-bold">Dashboard Guru</h2>
                <p class="text-blue-100 mt-2">Selamat datang, ${window.userName}. Kelola jadwal mengajar Anda dengan mudah.</p>
            </div>

            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div id="content-today" class="p-6">
                    <h3 id="today-schedule-title" class="text-xl font-semibold mb-4 text-gray-800">
                        Jadwal Hari Ini: <span id="current-day" class="font-normal text-primary">Loading...</span>
                    </h3>
                    <div id="schedule-list" class="space-y-4">
                        <p class="text-center text-gray-500" id="schedule-loading">Memuat jadwal...</p>
                    </div>
                </div>

                <div id="content-all" class="p-6 hidden">
                    <h3 class="text-xl font-semibold mb-4 text-gray-800">Semua Jadwal Mengajar</h3>
                    <div id="all-schedule-list">
                        <p class="text-center text-gray-500">Memuat semua jadwal...</p>
                    </div>
                </div>

                <div id="content-profile" class="p-6 hidden">
                    <h3 class="text-xl font-semibold mb-6 text-gray-800">Profil Saya</h3>
                    <form onsubmit="updateProfile(event)" class="max-w-lg mx-auto">
                        <div class="space-y-4">
                            <div>
                                <label for="profile-nama" class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                <input type="text" id="profile-nama" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            </div>
                            <div>
                                <label for="profile-nomor-hp" class="block text-sm font-medium text-gray-700 mb-1">Nomor HP</label>
                                <input type="tel" id="profile-nomor-hp"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            </div>
                            
                            <div class="pt-4 mt-6 border-t border-gray-200">
                                <h4 class="text-md font-medium text-gray-800 mb-4">Ubah Password</h4>
                                <div class="space-y-4">
                                    <div>
                                        <label for="current-password" class="block text-sm font-medium text-gray-700 mb-1">Password Saat Ini</label>
                                        <input type="password" id="current-password"
                                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    </div>
                                    <div>
                                        <label for="new-password" class="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                                        <input type="password" id="new-password"
                                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Kosongkan jika tidak ingin mengubah">
                                    </div>
                                    <div>
                                        <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
                                        <input type="password" id="confirm-password"
                                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="pt-4">
                                <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-150 flex items-center justify-center">
                                    <span id="profile-submit-text">Simpan Perubahan</span>
                                    <div id="profile-submit-spinner" class="hidden ml-2">
                                        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
                <div id="content-izin" class="p-6 hidden">
                    <h3 class="text-xl font-semibold mb-4 text-gray-800">Izin Saya</h3>
                    <div id="izin-content">
                        <p class="text-center text-gray-500">Memuat data izin...</p>
                    </div>
                </div>
            </div>

            <div class="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
                <div class="flex items-center space-x-3">
                    <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-800">Status Geolocation</h3>
                        <p id="geo-status" class="text-sm text-gray-600">Meminta izin lokasi...</p>
                        <p id="geo-coords" class="text-xs text-gray-400 mt-1"></p>
                        
                        <div id="map" class="mt-4 h-64 w-full rounded-lg border border-gray-200"></div>
                        <p class="text-xs text-gray-500 mt-1">Peta menunjukkan lokasi Anda saat ini</p>
                        
                        <div class="flex items-center mt-3 space-x-4 text-xs text-gray-600">
                            <div class="flex items-center">
                                <div class="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                                <span>Lokasi Anda</span>
                            </div>
                            <div class="flex items-center">
                                <div class="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                                <span>Lokasi Sekolah</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const geoStatusEl = document.getElementById('geo-status');
    const geoCoordsEl = document.getElementById('geo-coords');

    try {
        await getGeolocation();
        geoStatusEl.textContent = 'Status: Lokasi Berhasil Didapatkan.';
        geoStatusEl.classList.remove('text-sm');
        geoStatusEl.classList.add('text-secondary', 'font-bold');
        geoCoordsEl.textContent = `Lat: ${window.currentLatitude}, Lon: ${window.currentLongitude}`;
        
        initMap();
    } catch (error) {
        geoStatusEl.textContent = `Status: ${error.message}`;
        geoStatusEl.classList.remove('text-sm');
        geoStatusEl.classList.add('text-danger', 'font-bold');
    }

    loadGuruSchedule();
    loadAllGuruSchedule();
    
    // Add bottom navigation bar
    const bottomNav = document.createElement('div');
    bottomNav.className = 'fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50';
    bottomNav.innerHTML = `
        <div class="flex justify-around items-center p-2">
            <button onclick="showGuruTab('today')" data-tab="today" class="menu-item flex flex-col items-center justify-center w-full py-2 px-1 text-primary relative">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span class="text-xs mt-1">Jadwal Hari Ini</span>
            </button>
            <button onclick="showGuruTab('all')" data-tab="all" class="menu-item flex flex-col items-center justify-center w-full py-2 px-1 text-gray-500 hover:text-primary relative">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <span class="text-xs mt-1">Semua Jadwal</span>
            </button>
            <button onclick="showGuruTab('izin')" data-tab="izin" class="menu-item flex flex-col items-center justify-center w-full py-2 px-1 text-gray-500 hover:text-primary relative">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-xs mt-1">Izin</span>
            </button>
            <button onclick="showGuruTab('profile')" data-tab="profile" class="menu-item flex flex-col items-center justify-center w-full py-2 px-1 text-gray-500 hover:text-primary relative">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <span class="text-xs mt-1">Profil</span>
            </button>
        </div>
    `;
    document.body.appendChild(bottomNav);
    
    const mainContent = document.querySelector('main');
    mainContent.style.paddingBottom = '70px';
}

// Switch tab guru
function showGuruTab(tab) {
    document.getElementById('content-today').classList.add('hidden');
    document.getElementById('content-all').classList.add('hidden');
    document.getElementById('content-profile').classList.add('hidden');
    const izinEl = document.getElementById('content-izin');
    if (izinEl) izinEl.classList.add('hidden');
    if (window.guruIzinInterval) {
        clearInterval(window.guruIzinInterval);
        window.guruIzinInterval = null;
    }
    if (window.guruTodayInterval) {
        clearInterval(window.guruTodayInterval);
        window.guruTodayInterval = null;
    }
    
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.classList.remove('text-primary', 'border-primary');
        item.classList.add('text-gray-500', 'hover:text-primary');
        const icon = item.querySelector('svg');
        if (icon) {
            icon.classList.remove('text-primary');
            icon.classList.add('text-gray-500');
        }
    });
    
    if (tab === 'today') {
        document.getElementById('content-today').classList.remove('hidden');
        const menuItem = document.querySelector('[data-tab="today"]');
        menuItem.classList.remove('text-gray-500', 'hover:text-primary');
        menuItem.classList.add('text-primary');
        const icon = menuItem.querySelector('svg');
        if (icon) {
            icon.classList.remove('text-gray-500');
            icon.classList.add('text-primary');
        }
        loadGuruSchedule();
        if (typeof loadGuruSchedule === 'function') {
            window.guruTodayInterval = setInterval(() => {
                loadGuruSchedule();
            }, 15000);
        }
    } else if (tab === 'all') {
        document.getElementById('content-all').classList.remove('hidden');
        const menuItem = document.querySelector('[data-tab="all"]');
        menuItem.classList.remove('text-gray-500', 'hover:text-primary');
        menuItem.classList.add('text-primary');
        const icon = menuItem.querySelector('svg');
        if (icon) {
            icon.classList.remove('text-gray-500');
            icon.classList.add('text-primary');
        }
        loadAllGuruSchedule();
    } else if (tab === 'profile') {
        document.getElementById('content-profile').classList.remove('hidden');
        const menuItem = document.querySelector('[data-tab="profile"]');
        menuItem.classList.remove('text-gray-500', 'hover:text-primary');
        menuItem.classList.add('text-primary');
        const icon = menuItem.querySelector('svg');
        if (icon) {
            icon.classList.remove('text-gray-500');
            icon.classList.add('text-primary');
        }
        loadProfileData();
    } else if (tab === 'izin') {
        document.getElementById('content-izin').classList.remove('hidden');
        const menuItem = document.querySelector('[data-tab="izin"]');
        menuItem.classList.remove('text-gray-500', 'hover:text-primary');
        menuItem.classList.add('text-primary');
        const icon = menuItem.querySelector('svg');
        if (icon) {
            icon.classList.remove('text-gray-500');
            icon.classList.add('text-primary');
        }
        if (typeof renderGuruIzin === 'function') {
            renderGuruIzin();
            if (typeof loadGuruIzinList === 'function') {
                window.guruIzinInterval = setInterval(() => {
                    loadGuruIzinList();
                }, 15000);
            }
        }
    }
}

// Lihat file guru-schedule.js untuk fungsi loadGuruSchedule, loadAllGuruSchedule, handleAbsensi
// Lihat file guru-profile.js untuk fungsi loadProfileData, updateProfile
