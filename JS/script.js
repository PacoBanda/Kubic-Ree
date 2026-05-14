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

// Teclado
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') goToSlide(currentIndex + 1);
    if (e.key === 'ArrowLeft') goToSlide(currentIndex - 1);
});

// --- MOTOR DE NAVEGACIÓN MÓVIL (SWIPE) REFORZADO ---
let tStartX = 0;
let tStartY = 0;

slider.addEventListener('touchstart', e => {
    // Si el toque no es en una caja de números, activamos lógica de swipe
    if (!e.target.closest('.gestural-box')) {
        tStartX = e.changedTouches[0].screenX;
        tStartY = e.changedTouches[0].screenY;
    }
}, {passive: true});

slider.addEventListener('touchend', e => {
    if (isDragging) return;
    
    const tEndX = e.changedTouches[0].screenX;
    const tEndY = e.changedTouches[0].screenY;
    
    const dx = tStartX - tEndX;
    const dy = tStartY - tEndY;

    // Solo navega si el movimiento es horizontal y supera el umbral
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 70) {
        if (dx > 0) goToSlide(currentIndex + 1);
        else goToSlide(currentIndex - 1);
    }
}, {passive: true});

// --- SELECTOR DENSIDAD REBAJE ---
function setDensity(val, btnId) {
    currentDensity = val;
    document.querySelectorAll('.mat-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(btnId).classList.add('active');
    document.getElementById('label_rebaje').innerText = `TOTAL REBAJE (D: ${val})`;
    calcRebaje();
}

// --- MOTOR GESTUAL (AJUSTE VALORES) ---
let isDragging = false;
let activeBox = null;
let startX, startY, baseE, baseD;

document.querySelectorAll('.gestural-box').forEach(box => {
    box.addEventListener('mousedown', e => onStart(e, box, e.clientX, e.clientY));
    box.addEventListener('touchstart', e => {
        e.stopPropagation(); // Evita que el swipe se active al ajustar números
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

    // SENSIBILIDAD SOLICITADA (60px entero / 100px decimal)
    let nE = baseE + Math.round(dy / 60); 
    let nD = baseD + (Math.round(dx / 60) * 0.1);
    
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
    
    // Calculo con 6 alturas
    let hSum = 0, hm = 0;
    ['re_h1','re_h2','re_h3','re_h4','re_h5','re_h6'].forEach(id => {
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
    const a = getVal('rec_anch'), l = getVal('rec_lng'), h = getVal('rec_alt');
    const total = Math.ceil(a * l * h);
    const target = document.getElementById('res_recorte');
    if(target) target.innerText = `${total} Tn`;
}