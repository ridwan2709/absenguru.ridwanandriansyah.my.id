// Authentication Module

// Render halaman login
function renderLogin() {
    const header = document.getElementById('main-header');
    if (header) header.classList.add('hidden');
    
    const container = document.getElementById('app-container');
    container.classList.add('items-center');
    container.innerHTML = `
        <div class="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl transition duration-300">
            <div class="text-center mb-6">
                <img src="logo.png" class="mx-auto h-24 w-auto mb-4">
                <h2 class="text-3xl font-extrabold text-gray-900">Login Aplikasi Absensi</h2>
            </div>
            <form id="login-form" class="space-y-4">
                <div>
                    <label for="id_guru" class="block text-sm font-medium text-gray-700">ID Guru / Admin</label>
                    <input type="text" id="id_guru" required class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary transition duration-150" placeholder="Masukkan ID (e.g., G001)">
                </div>
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" id="password" required class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary transition duration-150" placeholder="Masukkan Password">
                </div>
                <button type="submit" id="login-btn" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-primary hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150">
                    <span id="login-text">Masuk</span>
                    <div id="login-spinner" class="hidden spinner ml-2 h-5 w-5 border-2 border-t-2 border-white rounded-full animate-spin"></div>
                </button>
            </form>
            <p class="mt-4 text-center text-xs text-gray-500">
                
            </p>
            <p id="login-message" class="mt-3 text-sm font-medium text-center text-danger hidden"></p>
            <button type="button" id="clear-storage-btn" class="mt-4 w-full text-xs text-gray-400 hover:text-gray-600 underline">
                Bersihkan Data Login Lama
            </button>
        </div>
    `;
    
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('clear-storage-btn').addEventListener('click', () => {
        localStorage.clear();
        showModal('Berhasil', 'Data login lama telah dihapus. Silakan login kembali.', 'alert');
    });
    updateUserInfo();
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    const id_guru = document.getElementById('id_guru').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('login-btn');
    const textEl = document.getElementById('login-text');
    const spinner = document.getElementById('login-spinner');
    const messageEl = document.getElementById('login-message');

    messageEl.classList.add('hidden');
    btn.disabled = true;
    textEl.textContent = 'Memuat...';
    spinner.classList.remove('hidden');

    try {
        console.log('Attempting login for:', id_guru);
        
        const data = await apiFetch('login', {
            method: 'POST',
            body: JSON.stringify({ id_guru, password })
        });

        if (data && data.token) {
            console.log('Login berhasil:', data);
            
            window.userToken = data.token;
            window.userRole = data.role;
            window.userName = data.nama;
            window.userId = id_guru;

            localStorage.setItem('absensiToken', window.userToken);
            localStorage.setItem('absensiRole', window.userRole);
            localStorage.setItem('absensiName', window.userName);
            localStorage.setItem('absensiId', window.userId);

            console.log('Data tersimpan di localStorage, redirect ke dashboard...');
            
            window.currentView = window.userRole === 'admin' ? 'admin' : 'guru';
            
            setTimeout(() => {
                renderApp();
            }, 100);
        } else {
            throw new Error('Data login tidak lengkap dari server');
        }
    } catch (error) {
        console.error('Login error:', error);
        messageEl.textContent = error.message;
        messageEl.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        textEl.textContent = 'Masuk';
        spinner.classList.add('hidden');
    }
}
