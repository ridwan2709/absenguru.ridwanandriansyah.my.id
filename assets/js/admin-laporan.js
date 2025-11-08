// Admin Laporan Absensi Module

let laporanState = { data: [], filters: {} };

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
            <div class="flex gap-2">
                <button type="submit" class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-emerald-600 transition duration-150 shadow-md">Terapkan Filter</button>
                <button type="button" id="btn-cetak-pdf" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-600 transition duration-150 shadow-md">
                    <i class="fas fa-file-pdf mr-2"></i>Cetak PDF
                </button>
            </div>
        </form>

        <div id="laporan-table-container" class="scrollable-content">
            <p class="text-center text-gray-500 mt-10">Silakan terapkan filter untuk melihat laporan.</p>
        </div>
    `;
    
    document.getElementById('laporan-filter-form').addEventListener('submit', handleLaporanFilter);
    document.getElementById('btn-cetak-pdf').addEventListener('click', exportLaporanPDF);
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
            laporanState = { data: [], filters: filters };
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
        laporanState = { data: laporan, filters: filters };

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

function exportLaporanPDF() {
    let guruLabel = 'Semua Guru';
    if (!laporanState.data || laporanState.data.length === 0) {
        if (typeof showModal === 'function') {
            showModal('Cetak PDF', 'Tidak ada data untuk dicetak. Terapkan filter terlebih dahulu.', 'alert');
        } else {
            alert('Tidak ada data untuk dicetak.');
        }
        return;
    }

    const { jsPDF } = window.jspdf || {};
    if (!jsPDF || !window.jspdf || !window.jspdf.jsPDF || typeof window.jspdf.jsPDF !== 'function') {
        if (typeof showModal === 'function') {
            showModal('Cetak PDF', 'Library PDF tidak tersedia.', 'alert');
        } else {
            alert('Library PDF tidak tersedia.');
        }
        return;
    }

    // Inisialisasi dokumen dengan margin yang lebih lebar
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });
    
    // Warna tema
    const primaryColor = [79, 70, 229]; // Indigo-600
    const successColor = [16, 185, 129]; // Emerald-500
    const warningColor = [245, 158, 11]; // Amber-500
    const dangerColor = [239, 68, 68]; // Red-500
    const lightGray = [243, 244, 246]; // Gray-50
    const darkGray = [75, 85, 99]; // Gray-600
    
    const filters = laporanState.filters || {};
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const tableStartY = 45;
    
    // Format tanggal dan waktu
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('id-ID', options);
    };
    
    const formatTime = (dateTimeStr) => {
        if (!dateTimeStr) return '-';
        return new Date(dateTimeStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };
    
    // Header dengan logo dan judul
    const addHeader = () => {
        // Garis header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 10, 'F');
        
        // Judul laporan
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('LAPORAN ABSENSI GURU SMK MIHADUNAL ULA', pageWidth / 2, 25, { align: 'center' });
        
        // Informasi filter
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Tanggal: ${filters.tanggal ? formatDate(filters.tanggal) : 'Semua Tanggal'}`, margin, 35);
        
        const guruSelect = document.getElementById('filter-guru');
        if (guruSelect && filters.id_guru) {
            const opt = [...guruSelect.options].find(o => o.value === String(filters.id_guru));
            if (opt) guruLabel = opt.text;
        }
        doc.text(`Guru: ${guruLabel}`, margin + 70, 35);
        
        // Tanggal cetak
        const now = new Date();
        doc.text(`Dicetak: ${now.toLocaleDateString('id-ID', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`, pageWidth - margin, 35, { align: 'right' });
    };
    
    // Footer dengan nomor halaman
    const addFooter = () => {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(...darkGray);
            doc.text(
                `Halaman ${i} dari ${pageCount}`, 
                pageWidth - margin, 
                doc.internal.pageSize.getHeight() - 5, 
                { align: 'right' }
            );
            doc.text(
                'Sistem Informasi Absensi Guru', 
                margin, 
                doc.internal.pageSize.getHeight() - 5, 
                { align: 'left' }
            );
        }
    };
    
    // Warna status
    const getStatusColor = (status) => {
        switch(status) {
            case 'Hadir': return successColor;
            case 'Terlambat': return warningColor;
            case 'Mangkir':
            case 'Belum Absen':
            default: return dangerColor;
        }
    };
    
    // Format data untuk tabel
    const head = [
        { 
            content: 'No',
            styles: { 
                fillColor: primaryColor,
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
            }
        },
        { 
            content: 'Tanggal',
            styles: { 
                fillColor: primaryColor,
                textColor: 255,
                fontStyle: 'bold'
            }
        },
        { 
            content: 'Nama Guru',
            styles: { 
                fillColor: primaryColor,
                textColor: 255,
                fontStyle: 'bold'
            }
        },
        { 
            content: 'Mata Pelajaran',
            styles: { 
                fillColor: primaryColor,
                textColor: 255,
                fontStyle: 'bold'
            }
        },
        { 
            content: 'Kelas / Jam',
            styles: { 
                fillColor: primaryColor,
                textColor: 255,
                fontStyle: 'bold'
            }
        },
        { 
            content: 'Jam Masuk',
            styles: { 
                fillColor: primaryColor,
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
            }
        },
        { 
            content: 'Status',
            styles: { 
                fillColor: primaryColor,
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
            }
        }
    ];
    
    const body = laporanState.data.map((item, index) => {
        const statusColor = getStatusColor(item.status);
        return [
            { 
                content: (index + 1).toString(),
                styles: { halign: 'center' }
            },
            formatDate(item.tanggal),
            item.nama_guru || '-',
            item.mapel || '-',
            `${item.kelas || '-'} (${item.jam_mulai ? item.jam_mulai.substring(0, 5) : '-'})`,
            { 
                content: item.jam_masuk ? item.jam_masuk.substring(11, 16) : '-',
                styles: { halign: 'center' }
            },
            { 
                content: item.status || '-',
                styles: { 
                    fillColor: statusColor,
                    textColor: item.status === 'Terlambat' ? [0, 0, 0] : [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center',
                    cellPadding: 3,
                    lineWidth: 0,
                    lineColor: statusColor,
                    textColor: [255, 255, 255],
                    fillColor: statusColor,
                    valign: 'middle',
                    cellWidth: 'wrap'
                }
            }
        ];
    });

    // Tambahkan header
    addHeader();
    
    // Buat tabel
    doc.autoTable({
        head: [head],
        body: body,
        startY: tableStartY,
        margin: { top: 10, right: margin, bottom: 20, left: margin },
        styles: { 
            fontSize: 9, 
            cellPadding: 4,
            lineColor: [209, 213, 219], // gray-300
            lineWidth: 0.3,
            valign: 'middle'
        },
        headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontStyle: 'bold',
            lineWidth: 0.1,
            lineColor: [255, 255, 255]
        },
        alternateRowStyles: {
            fillColor: lightGray
        },
        columnStyles: {
            0: { cellWidth: 'auto', halign: 'center' }, // No
            1: { cellWidth: 25 }, // Tanggal
            2: { cellWidth: 40 }, // Nama Guru
            3: { cellWidth: 50 }, // Mapel
            4: { cellWidth: 30 }, // Kelas/Jam
            5: { cellWidth: 20, halign: 'center' }, // Jam Masuk
            6: { cellWidth: 25, halign: 'center' } // Status
        },
        didDrawPage: function(data) {
            // Reset font after drawing table
            doc.setFont('helvetica');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
        }
    });
    
    // Tambahkan footer
    addFooter();
    
    // Simpan file
    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const stamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    const safeGuru = (guruLabel || 'SemuaGuru').replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
    const safeTgl = (filters.tanggal || 'SemuaTanggal').replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
    const filename = `Laporan_Absensi_${safeTgl}_${safeGuru}_${stamp}.pdf`;
    
    // Tampilkan preview di tab baru (opsional)
    // const pdfOutput = doc.output('datauristring');
    // window.open(pdfOutput);
    
    // Simpan file
    doc.save(filename);
}

