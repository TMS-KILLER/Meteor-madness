// ONLINE NASA DATA MODULE (restored)
// Fetches real Near Earth Object data from NASA API + fallback
// All physical values (velocity, diameters) sourced from NASA NeoWs responses

async function loadNASAData() {
    try {
        console.log('Attempting to load NASA data (online)...');
        const response = await fetch(`${NASA_API_URL}?page=${currentPage}&size=20&api_key=${NASA_API_KEY}`, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();
        const newAsteroids = data.near_earth_objects || [];
        allAsteroids = allAsteroids.concat(newAsteroids);
        await addImpactor2025();
        displayAsteroids(allAsteroids);
        const loadMoreBtn = document.getElementById('load-more-asteroids');
        if (data.links && data.links.next) {
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.textContent = `📥 Load More Asteroids (loaded: ${allAsteroids.length})`;
        } else {
            loadMoreBtn.style.display = 'none';
        }
        console.log('✅ NASA page loaded. Total:', allAsteroids.length);
    } catch (e) {
        console.warn('NASA fetch failed, using fallback. Reason:', e.message);
        loadFallbackData();
    }
}

function loadFallbackData() {
    allAsteroids = [
        { id:'IMPACTOR-2025', name:'IMPACTOR-2025 (Simulation)', is_potentially_hazardous_asteroid:true, estimated_diameter:{ meters:{ estimated_diameter_min:800, estimated_diameter_max:1200 } }, close_approach_data:[{ relative_velocity:{ kilometers_per_second:'25.5' }, miss_distance:{ kilometers:'0' } }] },
        { id:'2023-ABC', name:'2023 ABC (Simulation)', is_potentially_hazardous_asteroid:true, estimated_diameter:{ meters:{ estimated_diameter_min:400, estimated_diameter_max:600 } }, close_approach_data:[{ relative_velocity:{ kilometers_per_second:'20.0' }, miss_distance:{ kilometers:'50000' } }] },
        { id:'2024-XYZ', name:'2024 XYZ (Simulation)', is_potentially_hazardous_asteroid:false, estimated_diameter:{ meters:{ estimated_diameter_min:100, estimated_diameter_max:200 } }, close_approach_data:[{ relative_velocity:{ kilometers_per_second:'15.0' }, miss_distance:{ kilometers:'100000' } }] }
    ];
    displayAsteroids(allAsteroids);
    const loadMoreBtn = document.getElementById('load-more-asteroids');
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    console.log('✅ Fallback asteroid list loaded');
}

function loadMoreAsteroids(){ currentPage++; loadNASAData(); }

function displayAsteroids(asteroids) {
    const selectElement = document.getElementById('asteroid-select');
    if (!selectElement) return;
    selectElement.innerHTML = '<option value="">-- Select Asteroid --</option>';
    const sorted = [...asteroids].sort((a,b)=>{
        if (a.is_potentially_hazardous_asteroid && !b.is_potentially_hazardous_asteroid) return -1;
        if (!a.is_potentially_hazardous_asteroid && b.is_potentially_hazardous_asteroid) return 1;
        const sizeA = (a.estimated_diameter.meters.estimated_diameter_min + a.estimated_diameter.meters.estimated_diameter_max)/2;
        const sizeB = (b.estimated_diameter.meters.estimated_diameter_min + b.estimated_diameter.meters.estimated_diameter_max)/2;
        return sizeB - sizeA;
    });
    sorted.forEach((a,i)=>{
        const dMin=a.estimated_diameter.meters.estimated_diameter_min.toFixed(0);
        const dMax=a.estimated_diameter.meters.estimated_diameter_max.toFixed(0);
        const dAvg=((+dMin+ +dMax)/2).toFixed(0);
        let v='N/A';
        if (a.close_approach_data && a.close_approach_data[0]) v=parseFloat(a.close_approach_data[0].relative_velocity.kilometers_per_second).toFixed(1);
        const opt=document.createElement('option');
        opt.value=i; opt.textContent=`${a.is_potentially_hazardous_asteroid?'⚠️ ':''}${a.name} (${dAvg}m, ${v} km/s)`; opt.dataset.asteroidData=JSON.stringify(a);
        selectElement.appendChild(opt);
    });
    selectElement.onchange=function(){ if(this.value==='')return; const data=JSON.parse(this.options[this.selectedIndex].dataset.asteroidData); selectAsteroid(data); };
}

function selectAsteroid(a){
    selectedAsteroid=a; if(asteroid) scene.remove(asteroid);
    const avg=(a.estimated_diameter.meters.estimated_diameter_min+a.estimated_diameter.meters.estimated_diameter_max)/2;
    asteroid=createAsteroidModel(avg); asteroid.position.set(30,20,-30); scene.add(asteroid);
    const info=document.getElementById('asteroid-info'); const details=document.getElementById('asteroid-details');
    const vel=a.close_approach_data&&a.close_approach_data[0]?parseFloat(a.close_approach_data[0].relative_velocity.kilometers_per_second).toFixed(2):'20';
    details.innerHTML=`<div class="detail-row"><span class="detail-label">Name:</span><span class="detail-value">${a.name}</span></div>
    <div class="detail-row"><span class="detail-label">Diameter:</span><span class="detail-value">${avg.toFixed(0)} m</span></div>
    <div class="detail-row"><span class="detail-label">Velocity:</span><span class="detail-value">${vel} km/s</span></div>
    <div class="detail-row"><span class="detail-label">Hazardous:</span><span class="detail-value" style="color:${a.is_potentially_hazardous_asteroid?'#ff4444':'#88ff88'};">${a.is_potentially_hazardous_asteroid?'YES ⚠️':'NO ✓'}</span></div>`;
    info.style.display='block';
    checkReadyToStart();
}

function createAsteroidModel(diameter){
    // ПРАВИЛЬНОЕ МАСШТАБИРОВАНИЕ относительно Земли
    // Земля имеет радиус 15 единиц и диаметр ~12,742 км
    // Формула: размер_астероида = (диаметр_м / диаметр_Земли_м) * радиус_Земли_единиц
    const earthDiameterMeters = 12742000; // 12,742 км в метрах
    const earthRadiusUnits = 15; // радиус Земли в единицах сцены
    
    // Правильный масштаб: астероид к Земле
    const asteroidSize = (diameter / earthDiameterMeters) * earthRadiusUnits * 2; // *2 т.к. diameter vs radius
    
    // Минимальный размер для видимости (но пропорциональный!)
    const size = Math.max(asteroidSize, 0.15); // минимум 0.15 для видимости
    
    console.log(`🪨 Asteroid size: ${diameter}m → ${size.toFixed(4)} units (Earth radius: ${earthRadiusUnits})`);
    
    const geometry=new THREE.SphereGeometry(size,32,32);
    const textures=['textures/asteroid_1.jpg','textures/asteroid_2.jpg','textures/asteroid_3.jpg','textures/moon.jpg'];
    const tex=textures[Math.floor(Math.random()*textures.length)];
    const texture=new THREE.TextureLoader().load(tex,()=>console.log('🪨 Texture:',tex));
    const material=new THREE.MeshPhongMaterial({map:texture,bumpMap:texture,bumpScale:0.04,shininess:4});
    const mesh=new THREE.Mesh(geometry,material); 
    mesh.rotation.x=Math.random()*Math.PI; 
    mesh.rotation.y=Math.random()*Math.PI; 
    return mesh;
}

async function addImpactor2025(){
    const exists=allAsteroids.find(a=>a.name&&a.name.includes('IMPACTOR-2025')); if(exists) return;
    try {
        const today=new Date(); const end=new Date(today); end.setDate(today.getDate()+7);
        const startStr=today.toISOString().split('T')[0]; const endStr=end.toISOString().split('T')[0];
        const resp=await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${startStr}&end_date=${endStr}&api_key=${NASA_API_KEY}`);
        const data=await resp.json(); let most=null; let max=0;
        for(const date in data.near_earth_objects){ for(const ast of data.near_earth_objects[date]){ if(ast.is_potentially_hazardous_asteroid){ const size=(ast.estimated_diameter.meters.estimated_diameter_min+ast.estimated_diameter.meters.estimated_diameter_max)/2; if(size>max){ max=size; most=ast; }}}}
        if(most){ most.name=`⚠️ IMPACTOR-2025 (${most.name})`; most.is_potentially_hazardous_asteroid=true; allAsteroids.unshift(most); console.log('✅ Real IMPACTOR-2025 added'); return; }
    } catch(e){ console.warn('Impactor fetch failed:', e.message); }
    const synthetic={ name:'⚠️ IMPACTOR-2025 (Synthetic Threat)', is_potentially_hazardous_asteroid:true, absolute_magnitude_h:18.5, estimated_diameter:{ meters:{ estimated_diameter_min:800, estimated_diameter_max:1200 } }, close_approach_data:[{ relative_velocity:{ kilometers_per_second:'28.5' }, miss_distance:{ kilometers:'75000' }, orbiting_body:'Earth' }] };
    allAsteroids.unshift(synthetic); console.log('✅ Synthetic IMPACTOR-2025 added');
}

// Export globals
window.loadNASAData=loadNASAData;
window.loadMoreAsteroids=loadMoreAsteroids;
window.displayAsteroids=displayAsteroids;
window.selectAsteroid=selectAsteroid;
