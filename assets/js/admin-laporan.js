// Admin Laporan Absensi Module

async function renderLaporanAbsensi() {
    const contentEl = document.getElementById('admin-content');
    
    let guruList = [];
    try {
        guruList = await apiFetch('admin/guru');
    } catch (error) {
        console.error("Gagal memuat daftar guru untuk filter:", error);
    }
    const guruOptions = guruList.map(g => `<option value="${g.id_guru}">${g.nama}</option>`).join('');

    contentEl.innerHTML = `
        <h3 class="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Laporan Absensi Guru</h3>
        
        <form id="laporan-filter-form" class="mb-6 p-4 bg-gray-50 rounded-lg border flex flex-wrap gap-4 items-end">
            <div>
                <label for="filter-tanggal" class="block text-sm font-medium text-gray-700">Tanggal</label>
                <input type="date" id="filter-tanggal" name="tanggal" class="mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary">
            </div>
            <div>
                <label for="filter-guru" class="block text-sm font-medium text-gray-700">Guru</label>
                <select id="filter-guru" name="id_guru" class="mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary">
                    <option value="">Semua Guru</option>
                    ${guruOptions}
                </select>
            </div>
            <button type="submit" class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-emerald-600 transition duration-150 shadow-md">Terapkan Filter</button>
        </form>

        <div id="laporan-table-container" class="scrollable-content">
            <p class="text-center text-gray-500 mt-10">Silakan terapkan filter untuk melihat laporan.</p>
        </div>
    `;
    
    document.getElementById('laporan-filter-form').addEventListener('submit', handleLaporanFilter);
    loadLaporanAbsensi();
}

async function loadLaporanAbsensi(filters = {}) {
    const tableContainer = document.getElementById('laporan-table-container');
    const queryString = new URLSearchParams(filters).toString();
    tableContainer.innerHTML = '<p class="text-center text-gray-500 mt-10">Memuat laporan...</p>';

    try {
        const laporan = await apiFetch(`admin/laporan_absensi&${queryString}`);
        
        if (laporan.length === 0) {
            tableContainer.innerHTML = '<p class="text-center text-gray-500 mt-10">Tidak ada data absensi yang ditemukan untuk filter ini.</p>';
            return;
        }

        let html = `
            <table class="min-w-full divide-y divide-gray-200 border border-gray-100 rounded-lg overflow-hidden">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guru</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sesi</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Masuk</th>
                        <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
        `;
        laporan.forEach(item => {
            let statusClass = '';
            switch (item.status) {
                case 'Hadir': statusClass = 'bg-secondary text-white'; break;
                case 'Terlambat': statusClass = 'bg-warning text-gray-900'; break;
                case 'Mangkir': 
                case 'Belum Absen': statusClass = 'bg-danger text-white'; break;
            }

            const datePart = item.tanggal;
            const timePart = item.jam_masuk ? item.jam_masuk.substring(11, 16) : '-';

            html += `
                <tr class="hover:bg-gray-50 transition duration-100">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${datePart}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.nama_guru}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">${item.mapel} / ${item.kelas} (${item.jam_mulai.substring(0, 5)})</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${timePart}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                            ${item.status}
                        </span>
                    </td>
                </tr>
            `;
        });
        html += `</tbody></table>`;
        tableContainer.innerHTML = html;

    } catch (error) {
        tableContainer.innerHTML = `<p class="text-center text-danger mt-10">Gagal memuat laporan: ${error.message}</p>`;
    }
}

function handleLaporanFilter(event) {
    event.preventDefault();
    const form = event.target;
    const filters = {
        tanggal: form.tanggal.value,
        id_guru: form.id_guru.value
    };
    loadLaporanAbsensi(filters);
}
