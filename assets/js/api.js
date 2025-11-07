// API Configuration
const API_URL_ROOT = 'api.php';

// Fungsi Fetch API dengan handling token dan error
async function apiFetch(route, options = {}) {
    const url = `${API_URL_ROOT}?route=${route}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const currentToken = window.userToken || localStorage.getItem('absensiToken');
    
    if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
        console.log('Sending request with token:', currentToken);
    } else {
        console.warn('No token available for route:', route);
    }

    const fetchOptions = {
        method: options.method || 'GET',
        headers: headers,
        credentials: 'same-origin'
    };

    if (options.body && options.method && !['GET', 'HEAD'].includes(options.method.toUpperCase())) {
        fetchOptions.body = options.body;
    }

    try {
        console.log('Sending request:', {
            url,
            method: fetchOptions.method,
            headers: fetchOptions.headers,
            body: fetchOptions.body ? JSON.parse(fetchOptions.body) : null
        });
        
        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Server Error: ${response.statusText}` }));
            
            if ((response.status === 401 || response.status === 403) && route !== 'login') {
                const errorMsg = errorData.message || '';
                
                if (errorMsg.toLowerCase().includes('token tidak valid') || 
                    errorMsg.toLowerCase().includes('pengguna tidak ditemukan') ||
                    errorMsg.toLowerCase().includes('token tidak ditemukan')) {
                    
                    console.warn('Token tidak valid atau expired, melakukan logout...', errorMsg);
                    
                    localStorage.clear();
                    window.userToken = null;
                    window.userRole = null;
                    window.userName = null;
                    window.userId = null;
                    window.currentView = 'login';
                    
                    showModal('Sesi Berakhir', 'Sesi Anda telah berakhir. Silakan login kembali.', 'alert', () => {
                        renderApp();
                    });
                    return null;
                }
            }

            throw new Error(errorData.message || `API Error: ${response.statusText}`);
        }

        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return {};
        }
        return response.json();
        
    } catch (error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            console.error('Network error:', error);
            throw new Error('Gagal terhubung ke server. Periksa koneksi internet Anda.');
        }
        throw error;
    }
}

// Fungsi untuk mengambil data sekolah dari API
async function loadSekolahData() {
    try {
        const apiUrl = window.location.href.includes('localhost') 
            ? '/absen_guru/api.php?route=sekolah' 
            : 'api.php?route=sekolah';
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Gagal mengambil data sekolah');
        }
        const data = await response.json();
        window.sekolahData = {
            latitude: parseFloat(data.latitude) || -6.9486,
            longitude: parseFloat(data.longitude) || 106.9810,
            nama_sekolah: data.nama_sekolah || 'Sekolah Contoh',
            alamat: data.alamat || 'Jl. Contoh No. 123, SUKABUMI',
            radius: parseFloat(data.radius) || 100  
        };
        console.log('Data sekolah berhasil dimuat:', window.sekolahData);
    } catch (error) {
        console.error('Error saat memuat data sekolah:', error);
        window.sekolahData = {
            latitude: -6.9486,
            longitude: 106.9810,
            nama_sekolah: 'Sekolah Contoh',
            alamat: 'Gagal memuat data sekolah',
            radius: 100
        };
    }
}
