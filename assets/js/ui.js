// UI Utilities - Modal dan Notifikasi

// Menampilkan pesan di modal kustom
function showModal(title, body, type = 'alert', onConfirm = null, onCancel = null) {
    const modal = document.getElementById('app-modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').textContent = body;
    
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    confirmBtn.onclick = () => { 
        modal.classList.add('hidden'); 
        if (onConfirm) onConfirm(); 
    };
    cancelBtn.onclick = () => { 
        modal.classList.add('hidden'); 
        if (onCancel) onCancel(); 
    };
    cancelBtn.classList.add('hidden');
    
    if (type === 'confirm') {
        cancelBtn.classList.remove('hidden');
    }

    modal.classList.remove('hidden', 'flex');
    modal.classList.add('flex');
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 px-6 py-4 rounded-lg shadow-lg z-40 animate-slide-in ${
        type === 'success' ? 'bg-green-500' : 
        type === 'warning' ? 'bg-yellow-500' : 
        type === 'error' ? 'bg-red-500' :
        'bg-blue-500'
    } text-white`;
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">✕</button>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
}

// Update user info di header
function updateUserInfo() {
    const userInfoEl = document.getElementById('user-info');
    if (window.userToken && window.userName) {
        userInfoEl.innerHTML = `
            <span class="text-sm font-medium text-gray-700 hidden sm:block">${window.userName} (${window.userRole.toUpperCase()})</span>
            <button onclick="logout()" class="px-3 py-1 bg-danger text-white rounded-lg text-sm hover:bg-red-600 transition duration-150 shadow-sm">
                Logout
            </button>
        `;
    } else {
        userInfoEl.innerHTML = '';
    }
}

// Fungsi logout
function logout() {
    window.userToken = null;
    window.userRole = null;
    window.userName = null;
    window.userId = null;
    localStorage.removeItem('absensiToken');
    localStorage.removeItem('absensiRole');
    localStorage.removeItem('absensiName');
    localStorage.removeItem('absensiId');
    window.currentView = 'login';
    renderApp();
    location.reload();
}
