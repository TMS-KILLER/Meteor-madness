// Set coordinates manually
function setCoordinatesFromInput() {
    const latInput = parseFloat(document.getElementById('lat-input').value);
    const lngInput = parseFloat(document.getElementById('lng-input').value);
    
    if (isNaN(latInput) || isNaN(lngInput)) {
        alert('Please enter valid coordinates!');
        return;
    }
    
    if (latInput < -90 || latInput > 90) {
        alert('Latitude must be between -90 and 90');
        return;
    }
    
    if (lngInput < -180 || lngInput > 180) {
        alert('Longitude must be between -180 and 180');
        return;
    }
    
    setImpactLocation(latInput, lngInput);
}

// Установка места падения - СИНХРОНИЗИРОВАНО С КАРТОЙ И ТЕКСТУРОЙ
function setImpactLocation(lat, lng, point = null) {
    impactLocation = { lat, lng };
    document.getElementById('lat').textContent = lat.toFixed(2) + '°';
    document.getElementById('lng').textContent = lng.toFixed(2) + '°';
    document.getElementById('lat-input').value = lat.toFixed(2);
    document.getElementById('lng-input').value = lng.toFixed(2);

    const radius = window.earthRadius || 15;
    const latRad = lat * Math.PI / 180;
    const lngRad = -lng * Math.PI / 180;  // ИНВЕРТИРУЕМ долготу! Карта зеркальна к текстуре

    // ПРАВИЛЬНАЯ ФОРМУЛА для Equirectangular текстуры (стандарт NASA Blue Marble)
    // lng=0° (Greenwich) смотрит на +X
    // lng=90°E (карта) → -90° (3D) смотрит на -Z
    // lng=-90°W (карта) → +90° (3D) смотрит на +Z
    const localPoint = new THREE.Vector3(
        radius * Math.cos(latRad) * Math.cos(lngRad),   // X = R*cos(lat)*cos(-lng)
        radius * Math.sin(latRad),                        // Y = R*sin(lat)
        radius * Math.cos(latRad) * Math.sin(lngRad)    // Z = R*cos(lat)*sin(-lng)
    );
    impactLocation.point = localPoint;

    // Обратная проверка
    const verifyLat = Math.asin(localPoint.y / radius) * 180 / Math.PI;
    const verifyLng = -Math.atan2(localPoint.z, localPoint.x) * 180 / Math.PI;  // Обратная инверсия
    const dLat = Math.abs(lat - verifyLat);
    const dLng = Math.abs(lng - verifyLng);
    console.log(`🔍 VERIFY: ${verifyLat.toFixed(5)}°, ${verifyLng.toFixed(5)}°  ΔLat=${dLat.toFixed(5)} ΔLng=${dLng.toFixed(5)}`);

    console.log(`🌍 Impact set: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
    console.log(`📍 3D point: X=${localPoint.x.toFixed(3)}, Y=${localPoint.y.toFixed(3)}, Z=${localPoint.z.toFixed(3)}`);

    updateMapMarker(lat, lng);
    checkReadyToStart();
}

// Экспорт для использования из HTML
window.setImpactLocation = setImpactLocation;

// Тестовая функция для проверки координат известных мест
function testCoordinates() {
    console.log('=== ТЕСТ КООРДИНАТ ===');
    const testPoints = [
        { name: 'Нулевая точка (0°, 0°)', lat: 0, lng: 0 },
        { name: 'Лондон (51.5°N, 0°)', lat: 51.5, lng: 0 },
        { name: 'Москва (55.75°N, 37.6°E)', lat: 55.75, lng: 37.6 },
        { name: 'Нью-Йорк (40.7°N, 74°W)', lat: 40.7, lng: -74 },
        { name: 'Токио (35.7°N, 139.7°E)', lat: 35.7, lng: 139.7 },
        { name: 'Сидней (33.9°S, 151.2°E)', lat: -33.9, lng: 151.2 }
    ];
    
    const radius = window.earthRadius || 15;
    testPoints.forEach(point => {
        const latRad = point.lat * (Math.PI / 180);
        const lngRad = -point.lng * (Math.PI / 180);  // ИНВЕРТИРУЕМ
        
        // ИНВЕРТИРОВАННАЯ ФОРМУЛА: -lng
        const pos = new THREE.Vector3(
            radius * Math.cos(latRad) * Math.cos(lngRad),
            radius * Math.sin(latRad),
            radius * Math.cos(latRad) * Math.sin(lngRad)
        );
        const verifyLat = Math.asin(pos.y / radius) * 180 / Math.PI;
        const verifyLng = -Math.atan2(pos.z, pos.x) * 180 / Math.PI;  // Обратная инверсия
        
        console.log(`${point.name}:`);
        console.log(`  3D: X=${pos.x.toFixed(3)}, Y=${pos.y.toFixed(3)}, Z=${pos.z.toFixed(3)}`);
        console.log(`  Verify: ${verifyLat.toFixed(2)}°, ${verifyLng.toFixed(2)}° ✓`);
    });
}

// Экспорт для тестирования из консоли
window.testCoordinates = testCoordinates;

// Визуальный тест - отметить известные города на глобусе
function showTestMarkers() {
    console.log('🗺️ Adding test markers for known cities...');
    
    const testCities = [
        { name: 'London', lat: 51.5, lng: 0, color: 0x00ff00 },
        { name: 'Moscow', lat: 55.75, lng: 37.6, color: 0xff0000 },
        { name: 'New York', lat: 40.7, lng: -74, color: 0x0000ff },
        { name: 'Tokyo', lat: 35.7, lng: 139.7, color: 0xffff00 },
        { name: 'Sydney', lat: -33.9, lng: 151.2, color: 0xff00ff }
    ];
    
    testCities.forEach(city => {
        const radius = window.earthRadius || 15;
        const latRad = city.lat * (Math.PI / 180);
        const lngRad = -city.lng * (Math.PI / 180);  // ИНВЕРТИРУЕМ
        
        // ИНВЕРТИРОВАННАЯ ФОРМУЛА: -lng
        const pos = new THREE.Vector3(
            radius * Math.cos(latRad) * Math.cos(lngRad),
            radius * Math.sin(latRad),
            radius * Math.cos(latRad) * Math.sin(lngRad)
        );
        
        const markerGeo = new THREE.SphereGeometry(0.4, 16, 16); // Увеличен размер
        const markerMat = new THREE.MeshBasicMaterial({ color: city.color });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.copy(pos).normalize().multiplyScalar(radius + 0.4);
        marker.name = `test-marker-${city.name}`;
        earth.add(marker);
        
        console.log(`✓ ${city.name} marker added at ${city.lat}°, ${city.lng}°`);
    });
    
    console.log('✅ Test markers added! Check if they match real locations on the globe.');
}

// Удалить тестовые маркеры
function clearTestMarkers() {
    const markers = earth.children.filter(child => child.name && child.name.startsWith('test-marker-'));
    markers.forEach(marker => {
        earth.remove(marker);
        if (marker.geometry) marker.geometry.dispose();
        if (marker.material) marker.material.dispose();
    });
    console.log('🗑️ Test markers cleared');
}

window.showTestMarkers = showTestMarkers;
window.clearTestMarkers = clearTestMarkers;

// Проверка готовности к запуску
function checkReadyToStart() {
    const startButton = document.getElementById('start-simulation');
    // Проверяем наличие астероида и координат удара (маркер только на карте, не на глобусе!)
    if (selectedAsteroid && impactLocation) {
        startButton.disabled = false;
    }
}

// Обновление маркера на карте
function updateMapMarker(lat, lng) {
    if (!window.mapInitialized) return;
    
    // ПОКАЗЫВАЕМ геомаркер НА КАРТЕ (но не на глобусе!)
    // Update marker on small map
    if (mapMarker) {
        mapMarker.setLatLng([lat, lng]);
    } else {
        mapMarker = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(window.map);
        mapMarker.bindPopup('🎯 Impact Target').openPopup();
    }
    
    window.map.setView([lat, lng], 5);
    
    // Update marker on fullscreen map too
    if (window.mapFullscreen) {
        if (window.mapMarkerFullscreen) {
            window.mapMarkerFullscreen.setLatLng([lat, lng]);
        } else {
            window.mapMarkerFullscreen = L.marker([lat, lng], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(window.mapFullscreen);
            window.mapMarkerFullscreen.bindPopup('🎯 Impact Target');
        }
        window.mapFullscreen.setView([lat, lng], 5);
    }
    
    console.log(`🗺️ Map marker updated at: ${lat.toFixed(4)}°, ${lng.toFixed(4)}° (visible on maps only)`);
}

// Toggle fall visualization
function toggleVisualization() {
    showFallVisualization = !showFallVisualization;
    const button = document.getElementById('toggle-visualization');
    
    if (showFallVisualization) {
        button.textContent = '🔥 Fall Visualization: ON';
        button.classList.add('active');
    } else {
        button.textContent = '🔥 Fall Visualization: OFF';
        button.classList.remove('active');
    }
}

// Add crater marker to map after impact
function addCraterToMap(lat, lng, craterDiameterKm) {
    if (!window.mapInitialized) return;
    
    console.log(`🗺️ Adding crater to maps: ${craterDiameterKm.toFixed(2)} km at ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
    
    // Create a circle to show crater on small map
    const craterCircle = L.circle([lat, lng], {
        color: '#ff0000',
        fillColor: '#8b0000',
        fillOpacity: 0.5,
        radius: (craterDiameterKm / 2) * 1000, // Convert km to meters for Leaflet
        weight: 2
    }).addTo(window.map);
    
    craterCircle.bindPopup(`<b>🕳️ Impact Crater</b><br>Diameter: ${craterDiameterKm.toFixed(2)} km<br>Location: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
    
    // Add to fullscreen map too
    const craterCircleFullscreen = L.circle([lat, lng], {
        color: '#ff0000',
        fillColor: '#8b0000',
        fillOpacity: 0.5,
        radius: (craterDiameterKm / 2) * 1000,
        weight: 2
    }).addTo(window.mapFullscreen);
    
    craterCircleFullscreen.bindPopup(`<b>🕳️ Impact Crater</b><br>Diameter: ${craterDiameterKm.toFixed(2)} km<br>Location: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
    
    // Store BOTH crater circles globally so they persist
    if (!window.craterMarkers) {
        window.craterMarkers = [];
    }
    window.craterMarkers.push(craterCircle);
    window.craterMarkers.push(craterCircleFullscreen);
    
    console.log(`✅ Crater added to BOTH maps: ${craterDiameterKm.toFixed(2)} km at ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
}

// Export for HTML event handlers
window.toggleVisualization = toggleVisualization;
window.addCraterToMap = addCraterToMap;
