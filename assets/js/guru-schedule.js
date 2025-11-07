// Guru Schedule Module
// Fungsi-fungsi untuk mengelola jadwal guru

// Load jadwal hari ini
async function loadGuruSchedule() {
    if (window.isScheduleLoading) {
        console.log('Schedule is already loading, skipping...');
        return;
    }

    window.isScheduleLoading = true;
    const listEl = document.getElementById('schedule-list');
    const dayEl = document.getElementById('current-day');
    const loadingEl = document.getElementById('schedule-loading');
    
    if (loadingEl) loadingEl.classList.remove('hidden');
    listEl.innerHTML = ''; 

    try {
        console.log('Memuat jadwal hari ini...');
        const data = await apiFetch('guru/jadwal_hari_ini');
        console.log('Jadwal berhasil dimuat:', data);
        dayEl.textContent = data.hari;

        if (data.jadwal.length === 0) {
            listEl.innerHTML = '<div class="p-4 bg-yellow-50 rounded-lg text-center text-gray-600 border border-yellow-200">Tidak ada jadwal mengajar pada hari ' + data.hari + '.</div>';
            return;
        }

        data.jadwal.forEach(session => {
            const card = document.createElement('div');
            card.className = 'bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-md border border-blue-200 hover:shadow-lg transition duration-200';
            
            let buttonHtml = '';
            if (session.status === 'Hadir') {
                buttonHtml = `
                    <div class="flex items-center space-x-2">
                        <span class="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold">✓ Sudah Absen</span>
                        <span class="text-sm text-gray-600">Jam: ${session.jam_masuk ? session.jam_masuk.substring(0, 5) : '-'}</span>
                    </div>
                `;
            } else if (session.status === 'Terlambat') {
                buttonHtml = `
                    <div class="flex items-center space-x-2">
                        <span class="px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold">⚠ Terlambat</span>
                        <span class="text-sm text-gray-600">Jam: ${session.jam_masuk ? session.jam_masuk.substring(0, 5) : '-'}</span>
                    </div>
                `;
            } else {
                buttonHtml = `<button class="btn-absensi px-6 py-3 bg-primary text-white rounded-lg hover:bg-indigo-600 transition duration-150 shadow-md font-semibold" data-id="${session.id_jadwal}">Absen Sekarang</button>`;
            }
            
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-3">
                            <div class="bg-white p-3 rounded-lg shadow-sm">
                                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <span class="text-2xl font-bold text-gray-900">${session.jam_mulai.substring(0, 5)}</span>
                        </div>
                        <div class="space-y-2">
                            <div class="flex items-center space-x-2">
                                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                </svg>
                                <span class="text-lg font-semibold text-gray-800">${session.kelas}</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                </svg>
                                <span class="text-gray-700">${session.mapel}</span>
                            </div>
                        </div>
                    </div>
                    <div class="ml-4" id="status-${session.id_jadwal}">
                        ${buttonHtml}
                    </div>
                </div>
            `;
            listEl.appendChild(card);
        });

        const absensiButtons = document.querySelectorAll('.btn-absensi');
        absensiButtons.forEach(btn => {
            btn.addEventListener('click', handleAbsensi);
        });

    } catch (error) {
        console.error('Error loading schedule:', error);
        listEl.innerHTML = 
            '<div class="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">' +
                'Gagal memuat jadwal: ' + (error.message || 'Silakan refresh halaman') +
            '</div>';
    } finally {
        window.isScheduleLoading = false;
        if (loadingEl) loadingEl.classList.add('hidden');
    }
}

// Load semua jadwal
async function loadAllGuruSchedule() {
    const container = document.getElementById('all-schedule-list');
    
    try {
        const myJadwal = await apiFetch('guru/jadwal_semua');
        
        if (myJadwal.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">Anda belum memiliki jadwal mengajar.</div>';
            return;
        }
        
        const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const jadwalPerHari = {};
        
        hariList.forEach(hari => {
            jadwalPerHari[hari] = myJadwal.filter(j => j.hari === hari);
        });
        
        let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
        
        hariList.forEach(hari => {
            const jadwalHari = jadwalPerHari[hari];
            
            if (jadwalHari.length === 0) return;
            
            const hariColors = {
                'Senin': 'from-blue-500 to-blue-600',
                'Selasa': 'from-green-500 to-green-600',
                'Rabu': 'from-yellow-500 to-yellow-600',
                'Kamis': 'from-purple-500 to-purple-600',
                'Jumat': 'from-pink-500 to-pink-600',
                'Sabtu': 'from-indigo-500 to-indigo-600'
            };
            
            const hariIcons = {
                'Senin': '📘',
                'Selasa': '📗',
                'Rabu': '📙',
                'Kamis': '📕',
                'Jumat': '📓',
                'Sabtu': '📔'
            };
            
            html += `
                <div class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                    <div class="bg-gradient-to-r ${hariColors[hari]} text-white px-6 py-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <span class="text-3xl">${hariIcons[hari]}</span>
                                <div>
                                    <h4 class="text-xl font-bold">${hari}</h4>
                                    <p class="text-sm text-white text-opacity-90">${jadwalHari.length} Jadwal</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-4 space-y-3">
            `;
            
            jadwalHari.forEach((item, index) => {
                html += `
                    <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200 border border-gray-200">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center space-x-2">
                                <div class="bg-white p-2 rounded-lg shadow-sm">
                                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <span class="text-xl font-bold text-gray-900">${item.jam_mulai.substring(0, 5)}</span>
                            </div>
                            <span class="text-xs bg-blue-500 text-white px-3 py-1 rounded-full font-semibold shadow-sm">Sesi ${index + 1}</span>
                        </div>
                        
                        <div class="flex items-center space-x-2 mb-2">
                            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                            <span class="text-sm font-semibold text-gray-700">${item.kelas}</span>
                        </div>
                        
                        <div class="flex items-center space-x-2">
                            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span class="text-sm text-gray-700 font-medium">${item.mapel}</span>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        container.innerHTML = `<p class="text-center text-danger">Gagal memuat jadwal: ${error.message}</p>`;
    }
}

// Handle absensi
async function handleAbsensi(event) {
    const button = event.target.closest('button');
    const id_jadwal = button.getAttribute('data-id');
    const originalButtonText = button.textContent;

    if (!window.currentLatitude || !window.currentLongitude) {
        showModal('Error Lokasi', 'Lokasi GPS belum tersedia. Harap pastikan izin lokasi diberikan dan coba lagi.', 'alert', async () => {
            try {
                await getGeolocation();
                button.disabled = false;
                button.textContent = originalButtonText;
            } catch(err) {
                console.error('Retry Geolocation Failed:', err.message);
                showModal('Error', 'Tidak dapat mengakses lokasi. Pastikan izin lokasi diaktifkan.', 'alert');
            }
        });
        return;
    }

    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Memproses...';

    try {
        await loadSekolahData();
        
        const jarak = calculateDistance(
            window.currentLatitude, 
            window.currentLongitude, 
            window.sekolahData.latitude, 
            window.sekolahData.longitude
        );

        const jarakDibulatkan = Math.round(jarak * 1000) / 1000;
        const radiusDibulatkan = window.sekolahData.radius || 100;
        
        if (jarak * 1000 > radiusDibulatkan) {
            throw new Error(
                `Anda berada di luar radius absensi.\n` +
                `Jarak Anda: ${jarakDibulatkan} km dari sekolah\n` +
                `Radius maksimum: ${radiusDibulatkan} m`
            );
        }

        const result = await apiFetch(`guru/absensi/${id_jadwal}`, {
            method: 'POST',
            body: JSON.stringify({
                latitude: window.currentLatitude,
                longitude: window.currentLongitude
            })
        });

        showModal(
            'Absensi Berhasil', 
            `Absensi berhasil dicatat.\n` +
            `Jarak dari sekolah: ${jarakDibulatkan} km\n` +
            `Jam masuk: ${result.jam_masuk || new Date().toLocaleTimeString('id-ID')}`,
            'success', 
            loadGuruSchedule
        );

    } catch (error) {
        console.error('Absensi error:', error);
        showModal(
            'Gagal Melakukan Absensi', 
            error.message || 'Terjadi kesalahan saat melakukan absensi. Silakan coba lagi.',
            'alert'
        );
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalButtonText;
        }
        loadGuruSchedule();
    }
}
