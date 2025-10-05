// Мобильная адаптация и touch события

// Определение мобильного устройства
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Определение размера экрана
function getScreenSize() {
    const width = window.innerWidth;
    if (width < 480) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    return 'lg';
}

// Инициализация мобильных функций
function initMobile() {
    const isMobile = isMobileDevice();
    const screenSize = getScreenSize();
    
    console.log(`📱 Device: ${isMobile ? 'Mobile' : 'Desktop'}, Screen: ${screenSize}`);
    
    if (isMobile) {
        document.body.classList.add('mobile-device');
        
        // Предотвращаем двойное нажатие для zoom на iOS
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Предотвращаем pull-to-refresh на мобильных
        document.body.addEventListener('touchmove', function(e) {
            if (e.target.closest('#canvas-container')) {
                // Разрешаем прокрутку внутри canvas для управления камерой
                return;
            }
        }, { passive: true });
        
        // Оптимизация производительности для мобильных
        optimizeForMobile();
    }
    
    // Адаптация при изменении ориентации
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);
}

// Оптимизация для мобильных устройств
function optimizeForMobile() {
    console.log('⚡ Optimizing for mobile...');
    
    // Уменьшаем качество рендеринга на слабых устройствах
    if (renderer) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        console.log('  • Pixel ratio set to:', renderer.getPixelRatio());
    }
    
    // Уменьшаем количество частиц для мобильных
    window.MOBILE_PARTICLE_REDUCTION = 0.5; // 50% от обычного количества
    
    // Отключаем тени на слабых устройствах
    const isMidRange = getScreenSize() === 'xs' || getScreenSize() === 'sm';
    if (isMidRange && renderer) {
        renderer.shadowMap.enabled = false;
        console.log('  • Shadows disabled for performance');
    }
}

// Обработка изменения ориентации
function handleOrientationChange() {
    setTimeout(() => {
        console.log('🔄 Orientation changed');
        
        // Обновляем размеры canvas
        if (camera && renderer) {
            const container = document.getElementById('canvas-container');
            const width = container.clientWidth;
            const height = container.clientHeight;
            
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }
        
        // Обновляем карты Leaflet
        if (window.map) {
            setTimeout(() => window.map.invalidateSize(), 100);
        }
        if (window.mapFullscreen) {
            setTimeout(() => window.mapFullscreen.invalidateSize(), 100);
        }
        
        // Показываем подсказку по ориентации
        showOrientationHint();
    }, 200);
}

// Обработка изменения размера окна
function handleResize() {
    if (camera && renderer) {
        const container = document.getElementById('canvas-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }
}

// Подсказка по ориентации экрана
function showOrientationHint() {
    const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    const screenSize = getScreenSize();
    
    if (screenSize === 'xs' || screenSize === 'sm') {
        const hint = document.createElement('div');
        hint.id = 'orientation-hint';
        hint.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 107, 53, 0.95);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 13px;
            z-index: 10000;
            animation: fadeInOut 3s ease;
        `;
        
        if (orientation === 'portrait') {
            hint.textContent = '💡 Поверните устройство для лучшего просмотра';
        } else {
            hint.textContent = '✓ Ландшафтный режим оптимален';
        }
        
        // Удаляем предыдущую подсказку
        const oldHint = document.getElementById('orientation-hint');
        if (oldHint) oldHint.remove();
        
        document.body.appendChild(hint);
        
        setTimeout(() => {
            hint.style.opacity = '0';
            setTimeout(() => hint.remove(), 1000);
        }, 2000);
    }
}

// Добавляем CSS для анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0); }
        80% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
    
    .mobile-device .btn-primary,
    .mobile-device .btn-secondary,
    .mobile-device .btn-visualization {
        -webkit-tap-highlight-color: rgba(255, 107, 53, 0.3);
        touch-action: manipulation;
    }
    
    .mobile-device #canvas-container {
        touch-action: pan-x pan-y;
    }
`;
document.head.appendChild(style);

// Touch-friendly controls для OrbitControls
function enhanceTouchControls() {
    if (controls && isMobileDevice()) {
        // Настраиваем для touch
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.rotateSpeed = 0.5;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        
        // Ограничения для более удобного управления на мобильных
        controls.minDistance = 20;
        controls.maxDistance = 80;
        controls.enablePan = false; // Отключаем pan на мобильных для упрощения
        
        console.log('✅ Touch controls enhanced');
    }
}

// Улучшение интерфейса для мобильных
function enhanceMobileUI() {
    const screenSize = getScreenSize();
    
    if (screenSize === 'xs' || screenSize === 'sm') {
        // Добавляем кнопку "наверх" для длинных панелей
        const backToTop = document.createElement('button');
        backToTop.id = 'back-to-top';
        backToTop.innerHTML = '↑';
        backToTop.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 25px;
            background: linear-gradient(135deg, #ff6b35, #ff8c42);
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            z-index: 1000;
            display: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            touch-action: manipulation;
        `;
        
        document.body.appendChild(backToTop);
        
        // Показываем кнопку при прокрутке
        const leftPanel = document.getElementById('left-panel');
        if (leftPanel) {
            leftPanel.addEventListener('scroll', () => {
                if (leftPanel.scrollTop > 200) {
                    backToTop.style.display = 'block';
                } else {
                    backToTop.style.display = 'none';
                }
            });
            
            backToTop.addEventListener('click', () => {
                leftPanel.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }
}

// Виброотклик для мобильных (если поддерживается)
function vibrate(pattern = 10) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// Добавляем виброотклик к важным действиям
function addVibrationFeedback() {
    if (!isMobileDevice()) return;
    
    // При выборе астероида
    document.addEventListener('click', (e) => {
        if (e.target.closest('.asteroid-card')) {
            vibrate(10);
        }
    });
    
    // При запуске симуляции
    const startBtn = document.getElementById('start-simulation');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            vibrate([30, 50, 30]);
        });
    }
    
    // При сбросе
    const resetBtn = document.getElementById('reset-simulation');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            vibrate(20);
        });
    }
}

// Инициализация при загрузке
window.addEventListener('DOMContentLoaded', () => {
    initMobile();
    
    // Ждем инициализации Three.js компонентов
    setTimeout(() => {
        enhanceTouchControls();
        enhanceMobileUI();
        addVibrationFeedback();
    }, 1000);
});

// Экспорт функций
window.isMobileDevice = isMobileDevice;
window.getScreenSize = getScreenSize;
window.vibrate = vibrate;
