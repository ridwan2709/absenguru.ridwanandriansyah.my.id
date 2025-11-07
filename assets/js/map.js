// Map & Geolocation Utilities

// Geolocation State
let currentLatitude = null;
let currentLongitude = null;

// Map variables
let map;
let userMarker;
let schoolMarker;

// Fungsi untuk mengubah derajat ke radian
function toRad(degrees) {
    return degrees * Math.PI / 180;
}

// Fungsi untuk menghitung jarak antara dua koordinat (dalam km)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius bumi dalam km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Mendapatkan Geolocation (wajib untuk absensi)
function getGeolocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation tidak didukung oleh browser Anda."));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLatitude = position.coords.latitude;
                currentLongitude = position.coords.longitude;
                
                // Set ke window agar bisa diakses dari modul lain
                window.currentLatitude = currentLatitude;
                window.currentLongitude = currentLongitude;
                
                console.log(`Lokasi berhasil didapatkan: ${currentLatitude}, ${currentLongitude}`);
                
                const geoStatusEl = document.getElementById('geo-status');
                if (geoStatusEl) {
                    geoStatusEl.textContent = 'Status: Lokasi Berhasil Didapatkan';
                    geoStatusEl.classList.remove('text-sm');
                    geoStatusEl.classList.add('text-secondary', 'font-bold');
                }
                
                initMap();
                resolve(true);
            },
            (error) => {
                console.error("Geolocation Error:", error.message);
                reject(new Error(`Gagal mendapatkan lokasi GPS: ${error.message}. Pastikan izin lokasi diberikan.`));
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
}

// Fungsi untuk menginisialisasi peta
async function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Elemen peta tidak ditemukan');
        return;
    }
    
    await loadSekolahData();

    if (currentLatitude === null || currentLongitude === null) {
        console.error('Koordinat pengguna belum tersedia');
        const geoStatusEl = document.getElementById('geo-status');
        if (geoStatusEl) {
            geoStatusEl.textContent = 'Menunggu lokasi...';
        }
        return;
    }
    
    try {
        if (map) {
            map.remove();
        }
        
        map = L.map('map').setView([currentLatitude, currentLongitude], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);
        
        if (userMarker) {
            map.removeLayer(userMarker);
        }
        if (schoolMarker) {
            map.removeLayer(schoolMarker);
        }
        
        userMarker = L.marker([currentLatitude, currentLongitude], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                shadowSize: [41, 41]
            })
        }).addTo(map).bindPopup('Lokasi Anda');
        
        schoolMarker = L.marker([window.sekolahData.latitude, window.sekolahData.longitude], {
            title: window.sekolahData.nama_sekolah,
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                shadowSize: [41, 41]
            })
        }).addTo(map).bindPopup('Lokasi Sekolah');
        
        const distance = calculateDistance(
            currentLatitude, 
            currentLongitude, 
            window.sekolahData.latitude, 
            window.sekolahData.longitude
        ).toFixed(2);
        
        const line = L.polyline([
            [currentLatitude, currentLongitude],
            [window.sekolahData.latitude, window.sekolahData.longitude]
        ], {
            color: 'blue',
            dashArray: '5, 5',
            weight: 2
        }).addTo(map);
        
        const midPoint = line.getBounds().getCenter();
        L.popup()
            .setLatLng(midPoint)
            .setContent(`
                <div class="text-center">
                    <div class="font-bold">${window.sekolahData.nama_sekolah}</div>
                    <div class="text-sm">${window.sekolahData.alamat}</div>
                    <div class="mt-2 font-semibold">Jarak: ${distance} km</div>
                </div>
            `)
            .openOn(map);
            
        console.log('Peta berhasil diinisialisasi');
        
        const geoStatusEl = document.getElementById('geo-status');
        if (geoStatusEl) {
            geoStatusEl.textContent = 'Peta berhasil dimuat';
        }
        
    } catch (error) {
        console.error('Gagal menginisialisasi peta:', error);
        const geoStatusEl = document.getElementById('geo-status');
        if (geoStatusEl) {
            geoStatusEl.textContent = 'Gagal memuat peta: ' + error.message;
            geoStatusEl.classList.add('text-danger');
        }
    }
}

// Initialize Admin Map
function initAdminMap() {
    const mapElement = document.getElementById('admin-map');
    if (!mapElement) {
        console.error('Admin map element not found');
        return;
    }
    
    // Remove existing map if any
    if (window.adminMap) {
        window.adminMap.remove();
        window.adminMap = null;
    }
    
    const defaultLat = window.sekolahData.latitude || -6.9486;
    const defaultLng = window.sekolahData.longitude || 106.9810;
    
    const adminMap = L.map('admin-map', {
        zoomControl: true,
        scrollWheelZoom: true
    }).setView([defaultLat, defaultLng], 17);
    window.adminMap = adminMap;
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(adminMap);
    
    let marker = L.marker([defaultLat, defaultLng], {
        draggable: true,
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(adminMap);
    
    // Store marker globally
    window.schoolMarkerAdmin = marker;
    
    marker.on('dragend', function(e) {
        const latlng = marker.getLatLng();
        document.getElementById('latitude').value = latlng.lat.toFixed(6);
        document.getElementById('longitude').value = latlng.lng.toFixed(6);
        
        if (window.radiusCircle) {
            adminMap.removeLayer(window.radiusCircle);
        }
        
        const radius = parseInt(document.getElementById('radius').value) || 100;
        window.radiusCircle = L.circle([latlng.lat, latlng.lng], {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            radius: radius
        }).addTo(adminMap);
    });
    
    adminMap.on('click', function(e) {
        const latlng = e.latlng;
        marker.setLatLng(latlng);
        document.getElementById('latitude').value = latlng.lat.toFixed(6);
        document.getElementById('longitude').value = latlng.lng.toFixed(6);
        
        if (window.radiusCircle) {
            adminMap.removeLayer(window.radiusCircle);
        }
        
        const radius = parseInt(document.getElementById('radius').value) || 100;
        window.radiusCircle = L.circle([latlng.lat, latlng.lng], {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            radius: radius
        }).addTo(adminMap);
    });
    
    const radius = parseInt(window.sekolahData.radius) || 100;
    window.radiusCircle = L.circle([defaultLat, defaultLng], {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        radius: radius
    }).addTo(adminMap);
    
    document.getElementById('radius').addEventListener('input', function() {
        const radius = parseInt(this.value) || 100;
        if (window.radiusCircle) {
            window.radiusCircle.setRadius(radius);
        } else {
            const latlng = marker.getLatLng();
            window.radiusCircle = L.circle([latlng.lat, latlng.lng], {
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
                radius: radius
            }).addTo(adminMap);
        }
    });
}

// Export untuk digunakan di file lain
window.currentLatitude = currentLatitude;
window.currentLongitude = currentLongitude;
window.calculateDistance = calculateDistance;
window.getGeolocation = getGeolocation;
window.initMap = initMap;
window.initAdminMap = initAdminMap;
