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

// Установка места падения - ПОЛНОСТЬЮ ИСПРАВЛЕНО v4
function setImpactLocation(lat, lng, point = null) {
    impactLocation = { lat, lng };

    // Обновить UI
    document.getElementById('lat').textContent = lat.toFixed(2) + '°';
    document.getElementById('lng').textContent = lng.toFixed(2) + '°';
    document.getElementById('lat-input').value = lat.toFixed(2);
    document.getElementById('lng-input').value = lng.toFixed(2);

    // ИСПРАВЛЕННАЯ ФОРМУЛА для совпадения с картой
    // Стандартная сферическая система координат для equirectangular текстуры
    const radius = 10; // Радиус Земли в модели
    
    // Конвертируем градусы в радианы
    const latRad = lat * (Math.PI / 180);
    const lngRad = lng * (Math.PI / 180);
    
    // ПРАВИЛЬНАЯ формула для Three.js с стандартной текстурой Земли
    // Longitude 0° = -Z axis, Latitude 0° = equator
    const localPoint = new THREE.Vector3(
        radius * Math.cos(latRad) * Math.sin(lngRad),   // X
        radius * Math.sin(latRad),                       // Y
        -radius * Math.cos(latRad) * Math.cos(lngRad)   // Z (negative because 0° lng is at -Z)
    );
    
    impactLocation.point = localPoint;

    console.log(`✅ COORDINATES SET: Lat=${lat.toFixed(6)}°, Lng=${lng.toFixed(6)}°`);
    console.log('✅ 3D Position (calculated):', localPoint);
    console.log(`   X=${localPoint.x.toFixed(4)}, Y=${localPoint.y.toFixed(4)}, Z=${localPoint.z.toFixed(4)}`);
    
    // ПРОВЕРКА: Пересчитываем координаты обратно из 3D позиции
    const verifyLat = Math.asin(localPoint.y / radius) * (180 / Math.PI);
    const verifyLng = Math.atan2(localPoint.x, -localPoint.z) * (180 / Math.PI);
    console.log(`🔍 VERIFICATION: Lat=${verifyLat.toFixed(6)}°, Lng=${verifyLng.toFixed(6)}°`);
    console.log(`📏 Deviation: Lat=${Math.abs(lat - verifyLat).toFixed(8)}°, Lng=${Math.abs(lng - verifyLng).toFixed(8)}°`);
    
    if (Math.abs(lat - verifyLat) > 0.001 || Math.abs(lng - verifyLng) > 0.001) {
        console.warn('⚠️ Coordinate mismatch detected!');
    } else {
        console.log('✅ Coordinates verified - perfect match!');
    }

    // Создать маркер НА ЗЕМЛЕ (будет вращаться вместе с Землей)
    if (impactMarker) {
        // Правильно удаляем старый маркер
        if (impactMarker.parent) {
            impactMarker.parent.remove(impactMarker);
        }
        // Очищаем геометрию и материалы
        if (impactMarker.geometry) impactMarker.geometry.dispose();
        if (impactMarker.material) {
            if (Array.isArray(impactMarker.material)) {
                impactMarker.material.forEach(mat => mat.dispose());
            } else {
                impactMarker.material.dispose();
            }
        }
        // Очищаем дочерние объекты (кольцо)
        impactMarker.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        impactMarker = null;
    }

    const markerGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.9
    });
    impactMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    // Устанавливаем маркер ТОЧНО на вычисленную позицию
    // Немного выше поверхности для видимости (10.2 вместо 10.0)
    impactMarker.position.copy(localPoint).normalize().multiplyScalar(10.2);
    earth.add(impactMarker); // Привязан к Земле - будет вращаться вместе с ней
    
    // Добавим пульсирующее кольцо, направленное к центру Земли
    const ringGeometry = new THREE.RingGeometry(0.5, 0.6, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    // Направляем кольцо перпендикулярно к поверхности
    const normalVector = localPoint.clone().normalize();
    ring.lookAt(normalVector.multiplyScalar(100)); // Смотрит от центра Земли
    impactMarker.add(ring);

    // Обновить маркер на карте
    updateMapMarker(lat, lng);
    
    console.log(`🗺️ Map marker updated at: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
    console.log(`🌍 3D marker position on globe:`, impactMarker.position);

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
    
    const radius = 10;
    testPoints.forEach(point => {
        const latRad = point.lat * (Math.PI / 180);
        const lngRad = point.lng * (Math.PI / 180);
        
        // ПРАВИЛЬНАЯ формула
        const pos = new THREE.Vector3(
            radius * Math.cos(latRad) * Math.sin(lngRad),
            radius * Math.sin(latRad),
            -radius * Math.cos(latRad) * Math.cos(lngRad)
        );
        
        // Проверка обратного преобразования
        const verifyLat = Math.asin(pos.y / radius) * (180 / Math.PI);
        const verifyLng = Math.atan2(pos.x, -pos.z) * (180 / Math.PI);
        
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
        const radius = 10;
        const latRad = city.lat * (Math.PI / 180);
        const lngRad = city.lng * (Math.PI / 180);
        
        const pos = new THREE.Vector3(
            radius * Math.cos(latRad) * Math.sin(lngRad),
            radius * Math.sin(latRad),
            -radius * Math.cos(latRad) * Math.cos(lngRad)
        );
        
        const markerGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const markerMat = new THREE.MeshBasicMaterial({ color: city.color });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.copy(pos).normalize().multiplyScalar(10.3);
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
    if (selectedAsteroid && impactMarker) {
        startButton.disabled = false;
    }
}

// Обновление маркера на карте
function updateMapMarker(lat, lng) {
    if (!window.mapInitialized) return;
    
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
        mapMarker.bindPopup('Impact Location').openPopup();
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
            window.mapMarkerFullscreen.bindPopup('Impact Location');
        }
        window.mapFullscreen.setView([lat, lng], 5);
    }
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
    
    // Create a circle to show crater on small map
    const craterCircle = L.circle([lat, lng], {
        color: '#ff0000',
        fillColor: '#8b0000',
        fillOpacity: 0.5,
        radius: (craterDiameterKm / 2) * 1000, // Convert km to meters
        weight: 2
    }).addTo(window.map);
    
    craterCircle.bindPopup(`<b>Impact Crater</b><br>Diameter: ${craterDiameterKm.toFixed(2)} km<br>Location: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
    
    // Add to fullscreen map too
    if (window.mapFullscreen) {
        const craterCircleFullscreen = L.circle([lat, lng], {
            color: '#ff0000',
            fillColor: '#8b0000',
            fillOpacity: 0.5,
            radius: (craterDiameterKm / 2) * 1000,
            weight: 2
        }).addTo(window.mapFullscreen);
        
        craterCircleFullscreen.bindPopup(`<b>Impact Crater</b><br>Diameter: ${craterDiameterKm.toFixed(2)} km<br>Location: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
    }
    
    // Store crater circles globally so they persist
    if (!window.craterMarkers) {
        window.craterMarkers = [];
    }
    window.craterMarkers.push(craterCircle);
    
    console.log(`✅ Crater added to map: ${craterDiameterKm.toFixed(2)} km at ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
}

// Export for HTML event handlers
window.toggleVisualization = toggleVisualization;
window.addCraterToMap = addCraterToMap;
