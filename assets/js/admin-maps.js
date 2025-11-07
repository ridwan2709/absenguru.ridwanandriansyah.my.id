// Admin Maps Settings Module
// Fungsi untuk pengaturan peta dan lokasi sekolah

async function renderMapsSettings() {
    const contentEl = document.getElementById('admin-content');
    
    // Load sekolah data first
    await loadSekolahData();
    
    contentEl.innerHTML = `
        <h3 class="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Pengaturan Peta & Lokasi</h3>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Form Pengaturan -->
            <div class="lg:col-span-1">
                <div class="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <h4 class="text-lg font-medium text-gray-800 mb-4">Pengaturan Lokasi Sekolah</h4>
                    <form id="maps-settings-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Sekolah</label>
                            <input type="text" id="nama_sekolah" name="nama_sekolah" value="${window.sekolahData.nama_sekolah || ''}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Alamat Sekolah</label>
                            <textarea id="alamat_sekolah" name="alamat_sekolah" rows="3"
                                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">${window.sekolahData.alamat || ''}</textarea>
                        </div>
                        <div class="space-y-2">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Koordinat (Latitude, Longitude)</label>
                                <div class="flex space-x-2">
                                    <input type="text" id="coordinates" placeholder="-6.948629, 106.980982" 
                                           class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                                    <button type="button" id="paste-coords" class="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                        Tempel
                                    </button>
                                </div>
                                <p class="text-xs text-gray-500 mt-1">Tempel koordinat dalam format: lat, lng</p>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                                    <input type="number" id="latitude" name="latitude" step="0.000000000000001" value="${window.sekolahData.latitude || ''}" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                                    <input type="number" id="longitude" name="longitude" step="0.000000000000001" value="${window.sekolahData.longitude || ''}" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                                </div>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Radius Absensi (meter)</label>
                            <input type="number" id="radius" name="radius" min="1" value="${window.sekolahData.radius || '50'}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                            <p class="text-xs text-gray-500 mt-1">Jarak maksimum yang diizinkan untuk absensi (dalam meter)</p>
                        </div>
                        <div class="pt-2">
                            <button type="submit" class="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-indigo-600 transition duration-150">
                                Simpan Pengaturan
                            </button>
                        </div>
                    </form>
                    
                    <div class="mt-6 pt-4 border-t border-gray-200">
                        <h4 class="text-md font-medium text-gray-800 mb-2">Petunjuk</h4>
                        <ul class="text-sm text-gray-600 space-y-2">
                            <li>• Klik pada peta untuk mengatur lokasi sekolah</li>
                            <li>• Geser marker untuk penempatan yang lebih akurat</li>
                            <li>• Atur radius sesuai kebutuhan area absensi</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Peta -->
            <div class="lg:col-span-2">
                <div class="bg-white p-4 rounded-xl shadow-md border border-gray-200 h-full">
                    <div id="admin-map" class="w-full h-[600px] rounded-lg overflow-hidden border border-gray-300 relative" style="z-index: 1;">
                        <div class="h-full flex items-center justify-center bg-gray-100">
                            <div class="text-center">
                                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
                                <p class="text-gray-500">Memuat peta...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize map after DOM is rendered
    setTimeout(() => {
        initAdminMap();
    }, 100);
    
    // Add form submit handler
    document.getElementById('maps-settings-form').addEventListener('submit', handleSaveMapsSettings);
    
    // Add paste coordinates handler
    document.getElementById('paste-coords').addEventListener('click', function() {
        const coordsInput = document.getElementById('coordinates');
        const coords = coordsInput.value.trim();
        
        if (!coords) {
            showModal('Error', 'Masukkan koordinat terlebih dahulu', 'alert');
            return;
        }
        
        // Parse the coordinates (handle different formats)
        const parts = coords.split(/[,\s]+/);
        if (parts.length < 2) {
            showModal('Format Salah', 'Gunakan format: latitude, longitude', 'alert');
            return;
        }
        
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        
        if (isNaN(lat) || isNaN(lng)) {
            showModal('Format Salah', 'Pastikan koordinat berisi angka yang valid', 'alert');
            return;
        }
        
        // Update the input fields
        document.getElementById('latitude').value = lat;
        document.getElementById('longitude').value = lng;
        
        // Update the map if it exists
        if (window.adminMap) {
            const newLatLng = L.latLng(lat, lng);
            if (window.schoolMarkerAdmin) {
                window.schoolMarkerAdmin.setLatLng(newLatLng);
            }
            if (window.radiusCircle) {
                window.radiusCircle.setLatLng(newLatLng);
            }
            window.adminMap.setView(newLatLng, 17);
        }
        
        showModal('Berhasil', 'Koordinat berhasil diperbarui', 'alert');
    });
}

async function handleSaveMapsSettings(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = {
        nama_sekolah: form.nama_sekolah.value.trim(),
        alamat: form.alamat_sekolah.value.trim(),
        latitude: parseFloat(form.latitude.value),
        longitude: parseFloat(form.longitude.value),
        radius: parseInt(form.radius.value) || 100
    };
    
    // Validate required fields
    if (!formData.nama_sekolah || isNaN(formData.latitude) || isNaN(formData.longitude)) {
        showModal('Error', 'Harap isi semua field yang diperlukan (Nama Sekolah, Latitude, Longitude)');
        return;
    }
    
    try {
        // Show loading
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm mr-2"></span> Menyimpan...';
        
        // Save to database
        const result = await apiFetch('sekolah/update', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        // Update global sekolahData
        Object.assign(window.sekolahData, formData);
        
        // Show success message
        showModal('Berhasil', 'Pengaturan peta berhasil disimpan!', 'alert', () => {
            // Reload the map to reflect changes
            renderMapsSettings();
        });
        
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        
    } catch (error) {
        console.error('Error saving maps settings:', error);
        showModal('Error', 'Gagal menyimpan pengaturan: ' + error.message);
        
        // Reset button state
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Simpan Pengaturan';
    }
}
