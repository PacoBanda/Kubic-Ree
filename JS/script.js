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

document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') goToSlide(currentIndex + 1);
    if (e.key === 'ArrowLeft') goToSlide(currentIndex - 1);
});

// --- SELECTOR DENSIDAD REBAJE ---
function setDensity(val, btnId) {
    currentDensity = val;
    document.querySelectorAll('.mat-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(btnId).classList.add('active');
    document.getElementById('label_rebaje').innerText = `TOTAL REBAJE (D: ${val})`;
    calcRebaje();
}

// --- MOTOR GESTUAL ---
let isDragging = false;
let activeBox = null;
let startX, startY, baseE, baseD;

document.querySelectorAll('.gestural-box').forEach(box => {
    box.addEventListener('mousedown', e => onStart(e, box, e.clientX, e.clientY));
    box.addEventListener('touchstart', e => onStart(e, box, e.touches[0].clientX, e.touches[0].clientY), {passive: false});
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

    // --- AJUSTE DE RECORRIDO LARGO ---
    // dy/60 significa que mueves 60px para cambiar 1 entero
    // dx/100 significa que mueves 100px para cambiar 0.1 decimal
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
    
    // Forzamos actualización inmediata
    const target = document.getElementById('res_recorte');
    if(target) target.innerText = `${total} Tn`;
}