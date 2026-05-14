// --- ESTADO GLOBAL ---
let currentIndex = 0;
let currentDensity = 2.0; 
const slider = document.getElementById('slider');
const dots = document.querySelectorAll('.dot');

// --- NAVEGACIÓN ---
function goToSlide(index) {
    if (index < 0 || index > 2) return;
    currentIndex = index;
    slider.style.transform = `translateX(-${currentIndex * 100}vw)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
}

// Navegación por flechas (Teclado)
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') goToSlide(currentIndex + 1);
    if (e.key === 'ArrowLeft') goToSlide(currentIndex - 1);
});

// --- NUEVA NAVEGACIÓN TÁCTIL (SWIPE) REFORZADA ---
let touchStartX = 0;
let touchStartY = 0;

// Escuchamos el inicio del toque en todo el documento
document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, {passive: true});

document.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    
    // Solo disparamos el cambio de pantalla si NO estamos arrastrando un valor
    if (!isDragging) {
        handleSwipe(touchStartX, touchEndX, touchStartY, touchEndY);
    }
}, {passive: true});

function handleSwipe(startX, endX, startY, endY) {
    const diffX = startX - endX;
    const diffY = startY - endY;
    const threshold = 50; // Sensibilidad del swipe

    // Comprobamos que el movimiento sea más horizontal que vertical
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) goToSlide(currentIndex + 1); // Izquierda
            else goToSlide(currentIndex - 1); // Derecha
        }
    }
}

// --- SELECTOR DENSIDAD REBAJE ---
function setDensity(val, btnId) {
    currentDensity = val;
    document.querySelectorAll('.mat-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(btnId).classList.add('active');
    document.getElementById('label_rebaje').innerText = `TOTAL REBAJE (D: ${val})`;
    calcRebaje();
}

// --- MOTOR GESTUAL (AJUSTE DE NÚMEROS) ---
let isDragging = false;
let activeBox = null;
let startX, startY, baseE, baseD;

document.querySelectorAll('.gestural-box').forEach(box => {
    box.addEventListener('mousedown', e => onStart(e, box, e.clientX, e.clientY));
    box.addEventListener('touchstart', e => {
        // Detenemos la propagación para que el swipe global no se active al tocar una caja
        e.stopPropagation(); 
        onStart(e, box, e.touches[0].clientX, e.touches[0].clientY);
    }, {passive: false});
});

function onStart(e, box, x, y) {
    isDragging = true;
    activeBox = box;
    activeBox.classList.add('active');
    startX = x; startY = y;
    const v = parseFloat(activeBox.querySelector('.val').innerText) || 0;
    baseE = Math.floor(v);
    baseD = v - baseE;
}

function onMove(x, y) {
    if (!isDragging || !activeBox) return;
    const dx = x - startX;
    const dy = startY - y;

    // Sensibilidad baja solicitada (60px y 100px)
    let nE = baseE + Math.round(dy / 60); 
    let nD = baseD + (Math.round(dx / 100) * 0.1);
    
    nE = Math.max(0, Math.min(100, nE));
    nD = Math.max(0, Math.min(0.9, nD));

    activeBox.querySelector('.val').innerText = (nE + nD).toFixed(1);

    const id = activeBox.getAttribute('data-id');
    if (id.startsWith('av')) calcAvance();
    if (id.startsWith('re')) calcRebaje(); 
    if (id.startsWith('rec')) calcRecorte();
}

function onEnd() {
    if (activeBox) activeBox.classList.remove('active');
    isDragging = false;
    activeBox = null;
}

window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
window.addEventListener('mouseup', onEnd);

window.addEventListener('touchmove', e => {
    if (isDragging) {
        // Bloquea el movimiento de la pantalla solo cuando estamos ajustando un valor
        if (e.cancelable) e.preventDefault();
        onMove(e.touches[0].clientX, e.touches[0].clientY);
    }
}, {passive: false});

window.addEventListener('touchend', onEnd);

// --- LÓGICA DE CÁLCULO ---
function getVal(id) {
    const box = document.querySelector(`.gestural-box[data-id="${id}"]`);
    return box ? (parseFloat(box.querySelector('.val').innerText) || 0) : 0;
}

function calcAvance() {
    const lI = getVal('av_lI'), lD = getVal('av_lD');
    let lMedia = (lI + lD) / ((lI > 0 ? 1 : 0) + (lD > 0 ? 1 : 0) || 1);
    let hSum = 0, hm = 0;
    ['av_h1','av_h2','av_h3','av_h4','av_h5','av_h6'].forEach(id => {
        let v = getVal(id); if(v > 0) { hSum += v; hm++; }
    });
    let altMedia = (hm === 0) ? 5.1 : (hSum / hm);
    let aSum = 0, am = 0;
    ['av_a1','av_a2','av_a3'].forEach(id => {
        let v = getVal(id); if(v > 0) { aSum += v; am++; }
    });
    let anchoMedia = (am === 0) ? 8.2 : (aSum / am);
    let total = Math.ceil((9.5 * lMedia * 2.0) + ((altMedia - 1.5) * (anchoMedia * lMedia) * 2.0));
    document.getElementById('res_avance').innerText = `${total} Tn`;
}

function calcRebaje() {
    const lI = getVal('re_lI'), lD = getVal('re_lD');
    let lMedia = (lI + lD) / ((lI > 0 ? 1 : 0) + (lD > 0 ? 1 : 0) || 1);
    let hSum = 0, hm = 0;
    ['re_h1','re_h2','re_h3'].forEach(id => {
        let v = getVal(id); if(v > 0) { hSum += v; hm++; }
    });
    let altMedia = (hm === 0) ? 2.0 : (hSum / hm);
    let aSum = 0, am = 0;
    ['re_a1','re_a2','re_a3'].forEach(id => {
        let v = getVal(id); if(v > 0) { aSum += v; am++; }
    });
    let anchoMedia = (am === 0) ? 8.0 : (aSum / am);
    let total = Math.ceil(lMedia * anchoMedia * altMedia * currentDensity);
    document.getElementById('res_rebaje').innerText = `${total} Tn`;
}

function calcRecorte() {
    const a = getVal('rec_anch');
    const l = getVal('rec_lng');
    const h = getVal('rec_alt');
    const total = Math.ceil(a * l * h);
    const target = document.getElementById('res_recorte');
    if(target) target.innerText = `${total} Tn`;
}