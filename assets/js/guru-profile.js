// Guru Profile Module
// Fungsi-fungsi untuk mengelola profil guru

// Load data profil
async function loadProfileData() {
    try {
        const response = await apiFetch('guru/profile');
        if (response && response.success && response.data) {
            document.getElementById('profile-nama').value = response.data.nama || '';
            document.getElementById('profile-nomor-hp').value = response.data.nomor_hp || '';
        } else {
            throw new Error(response?.message || 'Gagal memuat data profil');
        }
    } catch (error) {
        console.error('Gagal memuat data profil:', error);
        showModal('Error', error.message || 'Gagal memuat data profil');
    }
}

// Update profil
async function updateProfile(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const submitText = submitBtn.querySelector('#profile-submit-text');
    const submitSpinner = submitBtn.querySelector('#profile-submit-spinner');
    
    submitBtn.disabled = true;
    submitText.textContent = 'Menyimpan...';
    submitSpinner.classList.remove('hidden');
    
    try {
        const formData = {
            nama: document.getElementById('profile-nama').value.trim(),
            nomor_hp: document.getElementById('profile-nomor-hp').value.trim(),
            current_password: document.getElementById('current-password').value,
            new_password: document.getElementById('new-password').value,
            confirm_password: document.getElementById('confirm-password').value
        };
        
        if (!formData.new_password) {
            delete formData.current_password;
            delete formData.new_password;
            delete formData.confirm_password;
        }
        
        const response = await apiFetch('guru/update_profile', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (response.success) {
            if (response.data) {
                localStorage.setItem('absensiName', response.data.nama || '');
                window.userName = response.data.nama || window.userName;
                updateUserInfo();
                
                document.getElementById('current-password').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
            }
            
            showModal('Berhasil', 'Profil berhasil diperbarui', 'success');
        } else {
            throw new Error(response.message || 'Gagal memperbarui profil');
        }
    } catch (error) {
        console.error('Update profile error:', error);
        showModal('Error', error.message || 'Terjadi kesalahan saat memperbarui profil');
    } finally {
        submitBtn.disabled = false;
        submitText.textContent = 'Simpan Perubahan';
        submitSpinner.classList.add('hidden');
    }
}
