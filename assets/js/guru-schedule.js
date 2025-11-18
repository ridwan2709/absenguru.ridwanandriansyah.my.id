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
                        <span class="text-sm text-gray-600">Jam: ${session.jam_masuk ? session.jam_masuk.substring(0, 5) : '-'} </span>
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

async function uploadIzinFoto(file) {
    const url = `${API_URL_ROOT}?route=guru/izin/upload_foto`;
    const formData = new FormData();
    formData.append('foto', file);

    const headers = {};
    const currentToken = window.userToken || localStorage.getItem('absensiToken');
    if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Gagal mengunggah foto izin' }));
        throw new Error(data.message || 'Gagal mengunggah foto izin');
    }

    const result = await response.json();
    if (!result.success || !result.foto_path) {
        throw new Error(result.message || 'Gagal mengunggah foto izin');
    }
    return result.foto_path;
}

function openIzinFormFromSchedule(event) {
    const button = event.target.closest('button');
    const id_jadwal = button.getAttribute('data-id');
    const tanggal = button.getAttribute('data-tanggal');

    const initialData = {
        mode: 'per_jadwal',
        id_jadwal,
        tanggal
    };

    showIzinForm(initialData);
}

function showIzinForm(initialData = {}) {
    let overlay = document.getElementById('izin-overlay');
    if (overlay) {
        overlay.remove();
    }

    overlay = document.createElement('div');
    overlay.id = 'izin-overlay';
    overlay.className = 'fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50';

    const today = new Date().toISOString().split('T')[0];
    const defaultTanggalMulai = initialData.tanggal || today;

    overlay.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-semibold mb-4 text-gray-800">Ajukan Izin</h3>
            <form id="izin-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Mode Izin</label>
                    <select id="izin-mode" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="per_jadwal" ${initialData.mode === 'per_jadwal' ? 'selected' : ''}>Per Jadwal</option>
                        <option value="per_hari" ${initialData.mode === 'per_hari' ? 'selected' : ''}>Per Hari / Rentang Hari</option>
                    </select>
                </div>

                <div id="izin-per-jadwal" class="space-y-2 ${initialData.mode === 'per_hari' ? 'hidden' : ''}">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Izin</label>
                    <input type="date" id="izin-tanggal" value="${initialData.tanggal || today}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                    <div class="mt-3">
                        <p class="text-xs text-gray-500 mb-1">Pilih jadwal yang ingin diizinkan (bisa lebih dari satu):</p>
                        <div id="izin-jadwal-list" class="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 text-sm text-gray-700 bg-gray-50">
                            <p class="text-center text-gray-400 text-xs">Memuat jadwal...</p>
                        </div>
                    </div>
                </div>

                <div id="izin-per-hari" class="space-y-2 ${initialData.mode === 'per_hari' ? '' : 'hidden'}">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                    <input type="date" id="izin-tanggal-mulai" value="${defaultTanggalMulai}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                    <label class="block text-sm font-medium text-gray-700 mb-1 mt-2">Tanggal Selesai</label>
                    <input type="date" id="izin-tanggal-selesai" value="${defaultTanggalMulai}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Jenis Izin</label>
                    <select id="izin-jenis" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="Sakit">Sakit</option>
                        <option value="Dinas">Dinas</option>
                        <option value="Lainnya">Lainnya</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                    <textarea id="izin-keterangan" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Contoh: Sakit demam, ada surat dokter, dsb."></textarea>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Foto Bukti (opsional)</label>
                    <input type="file" id="izin-foto" accept="image/*" class="w-full text-sm text-gray-700">
                </div>

                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" id="izin-cancel" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Batal</button>
                    <button type="submit" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-600">Kirim Izin</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);

    const modeSelect = document.getElementById('izin-mode');
    const perJadwalSection = document.getElementById('izin-per-jadwal');
    const perHariSection = document.getElementById('izin-per-hari');

    async function ensureJadwalListLoaded() {
        const listEl = document.getElementById('izin-jadwal-list');
        if (!listEl || listEl.dataset.loaded === 'true') return;
        try {
            const jadwal = await apiFetch('guru/jadwal_semua');
            if (!jadwal || jadwal.length === 0) {
                listEl.innerHTML = '<p class="text-center text-gray-400 text-xs">Tidak ada jadwal terdaftar.</p>';
                listEl.dataset.loaded = 'true';
                return;
            }

            const hariOrder = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
            jadwal.sort((a,b) => {
                const ha = hariOrder.indexOf(a.hari);
                const hb = hariOrder.indexOf(b.hari);
                if (ha !== hb) return ha - hb;
                return a.jam_mulai.localeCompare(b.jam_mulai);
            });

            let html = '';
            jadwal.forEach(item => {
                html += `
                    <label class="flex items-start space-x-2 py-1">
                        <input type="checkbox" class="izin-jadwal-checkbox mt-1" value="${item.id_jadwal}">
                        <span>
                            <span class="font-semibold">${item.hari}</span> - ${item.jam_mulai.substring(0,5)}<br>
                            <span class="text-xs text-gray-600">${item.mapel} - ${item.kelas}</span>
                        </span>
                    </label>
                `;
            });

            listEl.innerHTML = html;
            listEl.dataset.loaded = 'true';
        } catch (e) {
            console.error('Gagal memuat jadwal untuk izin:', e);
            listEl.innerHTML = '<p class="text-center text-red-400 text-xs">Gagal memuat jadwal.</p>';
        }
    }

    modeSelect.addEventListener('change', () => {
        const mode = modeSelect.value;
        if (mode === 'per_jadwal') {
            perJadwalSection.classList.remove('hidden');
            perHariSection.classList.add('hidden');
            ensureJadwalListLoaded();
        } else {
            perJadwalSection.classList.add('hidden');
            perHariSection.classList.remove('hidden');
        }
    });

    // Jika awalnya mode per_jadwal, langsung muat jadwal
    if (modeSelect.value === 'per_jadwal') {
        ensureJadwalListLoaded();
    }

    document.getElementById('izin-cancel').addEventListener('click', () => {
        overlay.remove();
    });

    const form = document.getElementById('izin-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const mode = modeSelect.value;
        const jenis_izin = document.getElementById('izin-jenis').value;
        const keterangan = document.getElementById('izin-keterangan').value;
        const fotoInput = document.getElementById('izin-foto');

        let foto_path = null;
        try {
            if (fotoInput.files && fotoInput.files[0]) {
                foto_path = await uploadIzinFoto(fotoInput.files[0]);
            }

            let payload = {
                mode,
                jenis_izin,
                keterangan,
                foto_path
            };

            if (mode === 'per_jadwal') {
                const tanggal = document.getElementById('izin-tanggal').value;
                const checked = Array.from(document.querySelectorAll('.izin-jadwal-checkbox:checked')).map(el => el.value);

                if (!tanggal) {
                    throw new Error('Tanggal izin harus diisi untuk mode per jadwal.');
                }
                if (!checked.length) {
                    throw new Error('Silakan pilih minimal satu jadwal untuk diajukan izin.');
                }

                for (const id_jadwal of checked) {
                    const perJadwalPayload = {
                        ...payload,
                        mode: 'per_jadwal',
                        id_jadwal,
                        tanggal
                    };
                    await apiFetch('guru/izin', {
                        method: 'POST',
                        body: JSON.stringify(perJadwalPayload)
                    });
                }
            } else {
                const tanggal_mulai = document.getElementById('izin-tanggal-mulai').value;
                const tanggal_selesai = document.getElementById('izin-tanggal-selesai').value;
                payload.tanggal_mulai = tanggal_mulai;
                payload.tanggal_selesai = tanggal_selesai;
                await apiFetch('guru/izin', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }

            showModal('Izin Diajukan', 'Pengajuan izin berhasil dikirim dan menunggu persetujuan admin.', 'success');
            overlay.remove();
            if (typeof loadGuruIzinList === 'function') {
                loadGuruIzinList();
            }
        } catch (error) {
            console.error('Gagal mengajukan izin:', error);
            showModal('Gagal Mengajukan Izin', error.message || 'Terjadi kesalahan saat mengajukan izin.', 'alert');
        }
    });
}

async function renderGuruIzin() {
    const container = document.getElementById('izin-content');
    if (!container) return;

    container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h4 class="text-lg font-semibold text-gray-800">Riwayat Izin</h4>
            <button id="btn-tambah-izin" class="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-indigo-600">Ajukan Izin Baru</button>
        </div>
        <div id="izin-list" class="space-y-3">
            <p class="text-center text-gray-500">Memuat data izin...</p>
        </div>
    `;

    const btnTambah = document.getElementById('btn-tambah-izin');
    btnTambah.addEventListener('click', () => {
        showIzinForm({ mode: 'per_hari' });
    });

    loadGuruIzinList();
}

async function loadGuruIzinList() {
    const listContainer = document.getElementById('izin-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<p class="text-center text-gray-500">Memuat data izin...</p>';

    try {
        const data = await apiFetch('guru/izin');

        if (!data || data.length === 0) {
            listContainer.innerHTML = '<p class="text-center text-gray-500">Belum ada pengajuan izin.</p>';
            return;
        }

        let html = '';
        data.forEach(item => {
            const statusColor = item.status === 'Disetujui'
                ? 'bg-green-100 text-green-800'
                : item.status === 'Ditolak'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800';

            const periode = item.tanggal_mulai === item.tanggal_selesai
                ? item.tanggal_mulai
                : `${item.tanggal_mulai} s/d ${item.tanggal_selesai}`;

            html += `
                <div class="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <p class="font-semibold text-gray-900">${item.jenis_izin}</p>
                            <p class="text-xs text-gray-500">Mode: ${item.mode}</p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColor}">${item.status}</span>
                    </div>
                    <p class="text-sm text-gray-700 mb-1"><span class="font-semibold">Periode:</span> ${periode}</p>
                    ${item.keterangan ? `<p class="text-sm text-gray-700 mb-1"><span class="font-semibold">Keterangan:</span> ${item.keterangan.replace(/\n/g, '<br>')}</p>` : ''}
                    ${item.foto_path ? `<p class="text-sm"><a href="${item.foto_path}" target="_blank" class="text-primary underline">Lihat Foto Bukti</a></p>` : ''}
                </div>
            `;
        });

        listContainer.innerHTML = html;
    } catch (error) {
        console.error('Gagal memuat daftar izin:', error);
        listContainer.innerHTML = `<p class="text-center text-red-500">Gagal memuat data izin: ${error.message}</p>`;
    }
}
