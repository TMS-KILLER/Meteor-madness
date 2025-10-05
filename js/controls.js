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

// Set impact location - SYNCHRONIZED WITH MAP AND TEXTURE
function setImpactLocation(lat, lng, point = null) {
    impactLocation = { lat, lng };
    document.getElementById('lat').textContent = lat.toFixed(2) + '°';
    document.getElementById('lng').textContent = lng.toFixed(2) + '°';
    document.getElementById('lat-input').value = lat.toFixed(2);
    document.getElementById('lng-input').value = lng.toFixed(2);

    const radius = window.earthRadius || 15;
    const latRad = lat * Math.PI / 180;
    const lngRad = -lng * Math.PI / 180;  // INVERT longitude! Map is mirrored relative to texture

    // Correct formula for equirectangular NASA Blue Marble texture
    // lng=0° (Greenwich) looks at +X
    // lng=90°E (map) → -90° (3D) looks at -Z
    // lng=-90°W (map) → +90° (3D) looks at +Z
    const localPoint = new THREE.Vector3(
        radius * Math.cos(latRad) * Math.cos(lngRad),   // X = R*cos(lat)*cos(-lng)
        radius * Math.sin(latRad),                      // Y = R*sin(lat)
        radius * Math.cos(latRad) * Math.sin(lngRad)    // Z = R*cos(lat)*sin(-lng)
    );
    impactLocation.point = localPoint;

    // Reverse verification
    const verifyLat = Math.asin(localPoint.y / radius) * 180 / Math.PI;
    const verifyLng = -Math.atan2(localPoint.z, localPoint.x) * 180 / Math.PI;  // reverse inversion
    const dLat = Math.abs(lat - verifyLat);
    const dLng = Math.abs(lng - verifyLng);
    console.log(`🔍 VERIFY: ${verifyLat.toFixed(5)}°, ${verifyLng.toFixed(5)}°  ΔLat=${dLat.toFixed(5)} ΔLng=${dLng.toFixed(5)}`);

    console.log(`🌍 Impact set: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
    console.log(`📍 3D point: X=${localPoint.x.toFixed(3)}, Y=${localPoint.y.toFixed(3)}, Z=${localPoint.z.toFixed(3)}`);

    updateMapMarker(lat, lng);
    checkReadyToStart();
}

// Export for HTML
window.setImpactLocation = setImpactLocation;

// Test function for known coordinates
function testCoordinates() {
    console.log('=== TEST COORDINATES ===');
    const testPoints = [
        { name: 'Null point (0°, 0°)', lat: 0, lng: 0 },
        { name: 'London (51.5°N, 0°)', lat: 51.5, lng: 0 },
        { name: 'Moscow (55.75°N, 37.6°E)', lat: 55.75, lng: 37.6 },
        { name: 'New York (40.7°N, 74°W)', lat: 40.7, lng: -74 },
        { name: 'Tokyo (35.7°N, 139.7°E)', lat: 35.7, lng: 139.7 },
        { name: 'Sydney (33.9°S, 151.2°E)', lat: -33.9, lng: 151.2 }
    ];
    
    const radius = window.earthRadius || 15;
    testPoints.forEach(point => {
        const latRad = point.lat * (Math.PI / 180);
        const lngRad = -point.lng * (Math.PI / 180);  // inverted
        
        const pos = new THREE.Vector3(
            radius * Math.cos(latRad) * Math.cos(lngRad),
            radius * Math.sin(latRad),
            radius * Math.cos(latRad) * Math.sin(lngRad)
        );
        const verifyLat = Math.asin(pos.y / radius) * 180 / Math.PI;
        const verifyLng = -Math.atan2(pos.z, pos.x) * 180 / Math.PI;  // reverse inversion
        
        console.log(`${point.name}:`);
        console.log(`  3D: X=${pos.x.toFixed(3)}, Y=${pos.y.toFixed(3)}, Z=${pos.z.toFixed(3)}`);
        console.log(`  Verify: ${verifyLat.toFixed(2)}°, ${verifyLng.toFixed(2)}° ✓`);
    });
}

// Export for console testing
window.testCoordinates = testCoordinates;

// Visual test - mark known cities on globe
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
        const lngRad = -city.lng * (Math.PI / 180);  // invert
        
        const pos = new THREE.Vector3(
            radius * Math.cos(latRad) * Math.cos(lngRad),
            radius * Math.sin(latRad),
            radius * Math.cos(latRad) * Math.sin(lngRad)
        );
        
        const markerGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const markerMat = new THREE.MeshBasicMaterial({ color: city.color });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.copy(pos).normalize().multiplyScalar(radius + 0.4);
        marker.name = `test-marker-${city.name}`;
        earth.add(marker);
        
        console.log(`✓ ${city.name} marker added at ${city.lat}°, ${city.lng}°`);
    });
    
    console.log('✅ Test markers added! Check if they match real locations on the globe.');
}

// Remove test markers
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

// Check ready state
function checkReadyToStart() {
    const startButton = document.getElementById('start-simulation');
    if (selectedAsteroid && impactLocation) {
        startButton.disabled = false;
    }
}

// Update map marker
function updateMapMarker(lat, lng) {
    if (!window.mapInitialized) return;
    
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

// Add crater marker with damage zones
function addCraterToMap(lat, lng, craterDiameterKm) {
    if (!window.mapInitialized) return;
    
    console.log(`🗺️ Adding enhanced crater with damage zones to maps: ${craterDiameterKm.toFixed(2)} km at ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
    
    const megatons = window.impactCalculations ? window.impactCalculations.megatons : 1;
    const kilotons = megatons * 1000;
    
    const fireballRadiusKm = 0.28 * Math.pow(kilotons, 0.33);
    const severeRadiusKm = 0.54 * Math.pow(kilotons, 0.33);
    const moderateRadiusKm = 1.28 * Math.pow(kilotons, 0.33);
    const lightRadiusKm = 2.5 * Math.pow(kilotons, 0.33);
    const seismicRadiusKm = 4.5 * Math.pow(kilotons, 0.33);
    
    console.log(`📊 Damage zones (NASA):\n    - Fireball: ${fireballRadiusKm.toFixed(2)} km\n    - Severe (20 psi): ${severeRadiusKm.toFixed(2)} km\n    - Moderate (5 psi): ${moderateRadiusKm.toFixed(2)} km\n    - Light (1 psi): ${lightRadiusKm.toFixed(2)} km\n    - Seismic: ${seismicRadiusKm.toFixed(2)} km`);
    
    // Small map
    const seismicCircle = L.circle([lat, lng], {
        color: '#ddaa66',
        fillColor: '#ddaa66',
        fillOpacity: 0.15,
        radius: seismicRadiusKm * 1000,
        weight: 2
    }).addTo(window.map);
    seismicCircle.bindPopup(`<b>🌊 Seismic Zone</b><br>Radius: ${seismicRadiusKm.toFixed(2)} km<br>Earthquakes and tsunamis`);
    
    const lightCircle = L.circle([lat, lng], {
        color: '#ffaa33',
        fillColor: '#ffaa33',
        fillOpacity: 0.25,
        radius: lightRadiusKm * 1000,
        weight: 2
    }).addTo(window.map);
    lightCircle.bindPopup(`<b>⚠️ Light Damage (1 psi)</b><br>Radius: ${lightRadiusKm.toFixed(2)} km<br>Broken windows, minor injuries`);
    
    const moderateCircle = L.circle([lat, lng], {
        color: '#ff7700',
        fillColor: '#ff7700',
        fillOpacity: 0.35,
        radius: moderateRadiusKm * 1000,
        weight: 2
    }).addTo(window.map);
    moderateCircle.bindPopup(`<b>🏚️ Moderate Destruction (5 psi)</b><br>Radius: ${moderateRadiusKm.toFixed(2)} km<br>Building damage, serious injuries`);
    
    const severeCircle = L.circle([lat, lng], {
        color: '#ff4400',
        fillColor: '#ff4400',
        fillOpacity: 0.45,
        radius: severeRadiusKm * 1000,
        weight: 2
    }).addTo(window.map);
    severeCircle.bindPopup(`<b>💀 Severe Destruction (20 psi)</b><br>Radius: ${severeRadiusKm.toFixed(2)} km<br>Complete destruction, extreme lethality`);
    
    const fireballCircle = L.circle([lat, lng], {
        color: '#ffff00',
        fillColor: '#ff0000',
        fillOpacity: 0.6,
        radius: fireballRadiusKm * 1000,
        weight: 3
    }).addTo(window.map);
    fireballCircle.bindPopup(`<b>🔥 FIREBALL</b><br>Radius: ${fireballRadiusKm.toFixed(2)} km<br>Vaporization in impact zone`);
    
    const craterCircle = L.circle([lat, lng], {
        color: '#000000',
        fillColor: '#1a1a1a',
        fillOpacity: 0.9,
        radius: (craterDiameterKm / 2) * 1000,
        weight: 3
    }).addTo(window.map);
    craterCircle.bindPopup(`<b>🕳️ CRATER</b><br>Diameter: ${craterDiameterKm.toFixed(2)} km<br>Location: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
    
    // Fullscreen map
    const seismicCircleFs = L.circle([lat, lng], {
        color: '#ddaa66',
        fillColor: '#ddaa66',
        fillOpacity: 0.15,
        radius: seismicRadiusKm * 1000,
        weight: 2
    }).addTo(window.mapFullscreen);
    seismicCircleFs.bindPopup(`<b>🌊 Seismic Zone</b><br>Radius: ${seismicRadiusKm.toFixed(2)} km`);
    
    const lightCircleFs = L.circle([lat, lng], {
        color: '#ffaa33',
        fillColor: '#ffaa33',
        fillOpacity: 0.25,
        radius: lightRadiusKm * 1000,
        weight: 2
    }).addTo(window.mapFullscreen);
    lightCircleFs.bindPopup(`<b>⚠️ Light Damage</b><br>Radius: ${lightRadiusKm.toFixed(2)} km`);
    
    const moderateCircleFs = L.circle([lat, lng], {
        color: '#ff7700',
        fillColor: '#ff7700',
        fillOpacity: 0.35,
        radius: moderateRadiusKm * 1000,
        weight: 2
    }).addTo(window.mapFullscreen);
    moderateCircleFs.bindPopup(`<b>🏚️ Moderate Destruction</b><br>Radius: ${moderateRadiusKm.toFixed(2)} km`);
    
    const severeCircleFs = L.circle([lat, lng], {
        color: '#ff4400',
        fillColor: '#ff4400',
        fillOpacity: 0.45,
        radius: severeRadiusKm * 1000,
        weight: 2
    }).addTo(window.mapFullscreen);
    severeCircleFs.bindPopup(`<b>💀 Severe Destruction</b><br>Radius: ${severeRadiusKm.toFixed(2)} km`);
    
    const fireballCircleFs = L.circle([lat, lng], {
        color: '#ffff00',
        fillColor: '#ff0000',
        fillOpacity: 0.6,
        radius: fireballRadiusKm * 1000,
        weight: 3
    }).addTo(window.mapFullscreen);
    fireballCircleFs.bindPopup(`<b>🔥 FIREBALL</b><br>Radius: ${fireballRadiusKm.toFixed(2)} km`);
    
    const craterCircleFs = L.circle([lat, lng], {
        color: '#000000',
        fillColor: '#1a1a1a',
        fillOpacity: 0.9,
        radius: (craterDiameterKm / 2) * 1000,
        weight: 3
    }).addTo(window.mapFullscreen);
    craterCircleFs.bindPopup(`<b>🕳️ CRATER</b><br>Diameter: ${craterDiameterKm.toFixed(2)} km<br>Location: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
    
    if (!window.craterMarkers) {
        window.craterMarkers = [];
    }
    window.craterMarkers.push(
        seismicCircle, lightCircle, moderateCircle, severeCircle, fireballCircle, craterCircle,
        seismicCircleFs, lightCircleFs, moderateCircleFs, severeCircleFs, fireballCircleFs, craterCircleFs
    );
    
    console.log(`✅ Enhanced crater with all damage zones added to both maps!`);
}

window.toggleVisualization = toggleVisualization;
window.addCraterToMap = addCraterToMap;
