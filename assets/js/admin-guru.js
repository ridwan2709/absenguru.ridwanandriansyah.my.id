// Admin Guru Management Module

async function renderManajemenGuru() {
    const contentEl = document.getElementById('admin-content');
    contentEl.innerHTML = `
        <h3 class="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Manajemen Guru</h3>
        <button onclick="showAddGuruForm()" class="mb-4 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-emerald-600 transition duration-150 shadow-md">
            + Tambah Guru Baru
        </button>
        <div id="guru-form-container" class="mb-6 hidden"></div>
        <div id="guru-list-container" class="scrollable-content">
            <p class="text-center text-gray-500 mt-10">Memuat data guru...</p>
        </div>
    `;
    loadGuruList();
}

async function loadGuruList() {
    const container = document.getElementById('guru-list-container');
    try {
        const guruList = await apiFetch('admin/guru');
        
        if (guruList.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 mt-10">Belum ada data guru.</p>';
            return;
        }
        
        let html = `
            <table class="min-w-full divide-y divide-gray-200 border border-gray-100 rounded-lg overflow-hidden">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Guru</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomor HP</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
        `;
        
        guruList.forEach(guru => {
            html += `
                <tr class="hover:bg-gray-50 transition duration-100">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${guru.id_guru}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${guru.nama}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${guru.nomor_hp || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${guru.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
                            ${guru.role}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <button onclick="handleDeleteGuru('${guru.id_guru}')" class="text-red-600 hover:text-red-900">Hapus</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
    } catch (error) {
        container.innerHTML = `<p class="text-center text-danger mt-10">Gagal memuat data guru: ${error.message}</p>`;
    }
}

function showAddGuruForm() {
    const container = document.getElementById('guru-form-container');
    container.innerHTML = `
        <div class="p-6 bg-green-50 border border-green-200 rounded-lg shadow-inner">
            <h4 class="text-xl font-semibold mb-4 text-green-700">Tambah Guru Baru</h4>
            <form id="add-guru-form" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">ID Guru</label>
                        <input type="text" name="id_guru" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" placeholder="Contoh: G001">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                        <input type="text" name="nama" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" name="password" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Nomor HP</label>
                        <input type="tel" name="nomor_hp" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Role</label>
                        <select name="role" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                            <option value="guru">Guru</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
                <div class="flex justify-end space-x-3 mt-6">
                    <button type="button" onclick="hideAddGuruForm()" class="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition duration-150">Batal</button>
                    <button type="submit" class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-emerald-600 transition duration-150">Simpan Guru</button>
                </div>
            </form>
        </div>
    `;
    container.classList.remove('hidden');
    document.getElementById('add-guru-form').addEventListener('submit', handleAddGuru);
}

function hideAddGuruForm() {
    document.getElementById('guru-form-container').classList.add('hidden');
    document.getElementById('guru-form-container').innerHTML = '';
}

async function handleAddGuru(event) {
    event.preventDefault();
    const form = event.target;
    const data = {
        id_guru: form.id_guru.value,
        nama: form.nama.value,
        password: form.password.value,
        nomor_hp: form.nomor_hp.value,
        role: form.role.value
    };

    try {
        await apiFetch('admin/guru', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showModal('Berhasil', 'Guru berhasil ditambahkan!', 'alert', () => {
            hideAddGuruForm();
            loadGuruList();
        });
    } catch (error) {
        showModal('Error', 'Gagal menambah guru: ' + error.message);
    }
}

function handleDeleteGuru(id_guru) {
    showModal(
        'Konfirmasi Hapus',
        'Apakah Anda yakin ingin menghapus guru ini? Tindakan ini tidak dapat dibatalkan.',
        'confirm',
        async () => {
            try {
                await apiFetch(`admin/guru/${id_guru}`, { method: 'DELETE' });
                showModal('Berhasil', 'Guru berhasil dihapus.', 'alert', loadGuruList);
            } catch (error) {
                showModal('Error', 'Gagal menghapus guru: ' + error.message);
            }
        }
    );
}
