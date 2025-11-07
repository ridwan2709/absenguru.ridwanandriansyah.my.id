// Admin Jadwal Management Module

async function renderManajemenJadwal() {
    const contentEl = document.getElementById('admin-content');
    contentEl.innerHTML = `
        <h3 class="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Manajemen Jadwal Mengajar</h3>
        <div class="flex justify-end mb-4">
            <button onclick="showAddJadwalForm()" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-600 transition duration-150 shadow-md">Tambah Jadwal Baru</button>
        </div>
        
        <div id="jadwal-form-container" class="mb-6 hidden"></div>

        <div id="jadwal-table-container" class="scrollable-content">
            <p class="text-center text-gray-500 mt-10">Memuat data jadwal...</p>
        </div>
    `;
    loadJadwalList();
}

async function loadJadwalList() {
    const tableContainer = document.getElementById('jadwal-table-container');
    try {
        const jadwal = await apiFetch('admin/jadwal');
        if (jadwal.length === 0) {
            tableContainer.innerHTML = '<p class="text-center text-gray-500 mt-10">Belum ada jadwal yang terdaftar.</p>';
            return;
        }

        // Group jadwal by hari
        const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const jadwalPerHari = {};
        
        hariList.forEach(hari => {
            jadwalPerHari[hari] = jadwal.filter(item => item.hari === hari);
        });

        let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
        
        hariList.forEach(hari => {
            const jadwalHari = jadwalPerHari[hari];
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
                    <!-- Header Card -->
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
                    
                    <!-- Body Card -->
                    <div class="p-4">
            `;
            
            if (jadwalHari.length === 0) {
                html += `
                    <div class="text-center py-8 text-gray-400">
                        <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <p class="mt-2 text-sm">Tidak ada jadwal</p>
                    </div>
                `;
            } else {
                html += '<div class="space-y-3">';
                
                jadwalHari.forEach((item, index) => {
                    html += `
                        <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200 border border-gray-200">
                            <!-- Jam -->
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center space-x-2">
                                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <span class="text-lg font-bold text-gray-900">${item.jam_mulai.substring(0, 5)}</span>
                                </div>
                                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">#${index + 1}</span>
                            </div>
                            
                            <!-- Guru -->
                            <div class="flex items-start space-x-2 mb-2">
                                <svg class="w-5 h-5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                                <div>
                                    <p class="text-sm font-semibold text-gray-900">${item.nama || item.nama_guru || 'Nama tidak tersedia'}</p>
                                    <p class="text-xs text-gray-500">${item.id_guru}</p>
                                </div>
                            </div>
                            
                            <!-- Kelas & Mapel -->
                            <div class="space-y-1 mb-3">
                                <div class="flex items-center space-x-2">
                                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                    </svg>
                                    <span class="text-sm text-gray-700">${item.kelas}</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                    </svg>
                                    <span class="text-sm text-gray-700 font-medium">${item.mapel}</span>
                                </div>
                            </div>
                            
                            <!-- Aksi -->
                            <div class="flex items-center justify-end space-x-2 pt-2 border-t border-gray-200">
                                <button onclick="showEditJadwalForm(${item.id_jadwal}, '${item.id_guru}', '${item.kelas.replace(/'/g, "\\'")}', '${item.mapel.replace(/'/g, "\\'")}', '${item.hari}', '${item.jam_mulai}')" 
                                    class="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition duration-150 px-3 py-1.5 rounded-md hover:bg-blue-50">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                    </svg>
                                    <span>Edit</span>
                                </button>
                                <button onclick="handleDeleteJadwal(${item.id_jadwal})" 
                                    class="flex items-center space-x-1 text-xs text-red-600 hover:text-red-800 font-medium transition duration-150 px-3 py-1.5 rounded-md hover:bg-red-50">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                    <span>Hapus</span>
                                </button>
                            </div>
                        </div>
                    `;
                });
                
                html += '</div>';
            }
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        tableContainer.innerHTML = html;

    } catch (error) {
        tableContainer.innerHTML = `<p class="text-center text-danger mt-10">Gagal memuat jadwal: ${error.message}</p>`;
    }
}

async function showAddJadwalForm() {
    const container = document.getElementById('jadwal-form-container');
    let guruList = [];
    try {
        guruList = await apiFetch('admin/guru');
    } catch (error) {
        showModal('Error', 'Gagal memuat daftar guru: ' + error.message);
        return;
    }

    const guruOptions = guruList.map(g => `<option value="${g.id_guru}">${g.nama} (${g.id_guru})</option>`).join('');

    container.innerHTML = `
        <div class="p-6 bg-blue-50 border border-blue-200 rounded-lg shadow-inner">
            <h4 class="text-xl font-semibold mb-4 text-primary">Tambah Jadwal</h4>
            <form id="add-jadwal-form" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Guru</label>
                        <select name="id_guru" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                            <option value="">Pilih Guru</option>
                            ${guruOptions}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Kelas</label>
                        <input type="text" name="kelas" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" placeholder="Contoh: 10 IPA 1">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
                        <input type="text" name="mapel" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" placeholder="Contoh: Matematika">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Hari</label>
                        <select name="hari" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                            <option value="Senin">Senin</option>
                            <option value="Selasa">Selasa</option>
                            <option value="Rabu">Rabu</option>
                            <option value="Kamis">Kamis</option>
                            <option value="Jumat">Jumat</option>
                            <option value="Sabtu">Sabtu</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Jam Mulai (HH:MM)</label>
                        <input type="time" name="jam_mulai" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                    </div>
                </div>
                <div class="flex justify-end space-x-3 mt-6">
                    <button type="button" onclick="hideAddJadwalForm()" class="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition duration-150">Batal</button>
                    <button type="submit" class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-emerald-600 transition duration-150">Simpan Jadwal</button>
                </div>
            </form>
        </div>
    `;
    container.classList.remove('hidden');
    document.getElementById('add-jadwal-form').addEventListener('submit', handleAddJadwal);
}

function hideAddJadwalForm() {
    document.getElementById('jadwal-form-container').classList.add('hidden');
    document.getElementById('jadwal-form-container').innerHTML = '';
}

async function handleAddJadwal(event) {
    event.preventDefault();
    const form = event.target;
    const data = {
        id_guru: form.id_guru.value,
        kelas: form.kelas.value,
        mapel: form.mapel.value,
        hari: form.hari.value,
        jam_mulai: form.jam_mulai.value + ':00'
    };

    try {
        await apiFetch('admin/jadwal', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showModal('Berhasil', 'Jadwal berhasil ditambahkan!', 'alert', () => {
            hideAddJadwalForm();
            loadJadwalList();
        });
    } catch (error) {
        showModal('Error', 'Gagal menambah jadwal: ' + error.message);
    }
}

async function showEditJadwalForm(id_jadwal, id_guru, kelas, mapel, hari, jam_mulai) {
    const container = document.getElementById('jadwal-form-container');
    let guruList = [];
    try {
        guruList = await apiFetch('admin/guru');
    } catch (error) {
        showModal('Error', 'Gagal memuat daftar guru: ' + error.message);
        return;
    }

    const guruOptions = guruList.map(g => 
        `<option value="${g.id_guru}" ${g.id_guru === id_guru ? 'selected' : ''}>${g.nama} (${g.id_guru})</option>`
    ).join('');

    const hariOptions = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(h =>
        `<option value="${h}" ${h === hari ? 'selected' : ''}>${h}</option>`
    ).join('');

    container.innerHTML = `
        <div class="p-6 bg-yellow-50 border border-yellow-200 rounded-lg shadow-inner">
            <h4 class="text-xl font-semibold mb-4 text-yellow-700">Edit Jadwal</h4>
            <form id="edit-jadwal-form" class="space-y-4">
                <input type="hidden" name="id_jadwal" value="${id_jadwal}">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Guru</label>
                        <select name="id_guru" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                            <option value="">Pilih Guru</option>
                            ${guruOptions}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Kelas</label>
                        <input type="text" name="kelas" value="${kelas}" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
                        <input type="text" name="mapel" value="${mapel}" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Hari</label>
                        <select name="hari" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                            ${hariOptions}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Jam Mulai</label>
                        <input type="time" name="jam_mulai" value="${jam_mulai.substring(0, 5)}" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                    </div>
                </div>
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" onclick="hideAddJadwalForm()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-150">Batal</button>
                    <button type="submit" class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition duration-150">Update</button>
                </div>
            </form>
        </div>
    `;
    container.classList.remove('hidden');
    document.getElementById('edit-jadwal-form').addEventListener('submit', handleEditJadwal);
}

async function handleEditJadwal(event) {
    event.preventDefault();
    const form = event.target;
    const id_jadwal = form.id_jadwal.value;
    const data = {
        id_guru: form.id_guru.value,
        kelas: form.kelas.value.trim(),
        mapel: form.mapel.value.trim(),
        hari: form.hari.value,
        jam_mulai: form.jam_mulai.value
    };

    try {
        await apiFetch(`admin/jadwal/${id_jadwal}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        showModal('Berhasil', 'Jadwal berhasil diupdate!', 'alert', () => {
            hideAddJadwalForm();
            loadJadwalList();
        });
    } catch (error) {
        showModal('Error', 'Gagal update jadwal: ' + error.message);
    }
}

function handleDeleteJadwal(id_jadwal) {
    showModal(
        'Konfirmasi Hapus',
        'Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan.',
        'confirm',
        async () => {
            try {
                await apiFetch(`admin/jadwal/${id_jadwal}`, { method: 'DELETE' });
                showModal('Berhasil', 'Jadwal berhasil dihapus.', 'alert', loadJadwalList);
            } catch (error) {
                showModal('Error', 'Gagal menghapus jadwal: ' + error.message);
            }
        }
    );
}
