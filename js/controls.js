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

    // ПРЯМАЯ ФОРМУЛА из географических координат (БЕЗ учета вращения)
    const radius = 10; // Радиус Земли в модели
    
    // Конвертируем градусы в радианы
    const latRad = lat * (Math.PI / 180);
    const lngRad = lng * (Math.PI / 180);
    
    // Three.js standard formula for sphere with equirectangular texture
    // Testing: negative Z to match texture orientation
    const localPoint = new THREE.Vector3(
        -radius * Math.cos(latRad) * Math.sin(lngRad),
        radius * Math.sin(latRad),
        -radius * Math.cos(latRad) * Math.cos(lngRad)
    );
    
    impactLocation.point = localPoint;

    console.log(`✅ COORDINATES SET: Lat=${lat.toFixed(6)}°, Lng=${lng.toFixed(6)}°`);
    console.log('✅ 3D Position (calculated):', localPoint);
    console.log(`   X=${localPoint.x.toFixed(4)}, Y=${localPoint.y.toFixed(4)}, Z=${localPoint.z.toFixed(4)}`);

    // Создать маркер НА ЗЕМЛЕ (будет вращаться вместе с Землей)
    if (impactMarker) {
        earth.remove(impactMarker);
    }

    const markerGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.9
    });
    impactMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    // Маркер на поверхности Земли в локальных координатах
    impactMarker.position.copy(localPoint).normalize().multiplyScalar(10.2);
    earth.add(impactMarker); // Привязан к Земле - будет вращаться вместе с ней
    
    // Добавим пульсирующее кольцо для лучшей видимости
    const ringGeometry = new THREE.RingGeometry(0.5, 0.6, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.lookAt(new THREE.Vector3(0, 0, 0));
    impactMarker.add(ring);

    // Обновить маркер на карте
    updateMapMarker(lat, lng);

    checkReadyToStart();
}

// Экспорт для использования из HTML
window.setImpactLocation = setImpactLocation;

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
