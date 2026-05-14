// --- NAVEGACIÓN ---
let currentIndex = 0;
const slider = document.getElementById('slider');
const dots = document.querySelectorAll('.dot');

function goToSlide(index) {
    if (index < 0) index = 0;
    if (index > 2) index = 2;
    currentIndex = index;
    slider.style.transform = `translateX(-${currentIndex * 100}vw)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
}

// Teclado PC
window.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') goToSlide(currentIndex + 1);
    if (e.key === 'ArrowLeft') goToSlide(currentIndex - 1);
});

// Swipe Móvil (Navegación)
let touchStartX = 0;
window.addEventListener('touchstart', e => {
    if (!e.target.closest('.gestural-box')) {
        touchStartX = e.changedTouches[0].screenX;
    }
}, {passive: true});

window.addEventListener('touchend', e => {
    if (e.target.closest('.gestural-box')) return;
    let touchEndX = e.changedTouches[0].screenX;
    let diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 80) {
        if (diff > 0) goToSlide(currentIndex + 1);
        else goToSlide(currentIndex - 1);
    }
}, {passive: true});

// --- CONTROL GESTUAL DIRECTO ---
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
    startX = x;
    startY = y;

    const v = parseFloat(activeBox.querySelector('.val').innerText) || 0;
    baseE = Math.floor(v);
    baseD = v - baseE;
}

function onMove(x, y) {
    if (!isDragging || !activeBox) return;

    const dx = x - startX;
    const dy = startY - y;

    let nE = baseE + Math.round(dy / 15);
    let nD = baseD + (Math.round(dx / 20) * 0.1);

    nE = Math.max(0, Math.min(100, nE));
    nD = Math.max(0, Math.min(0.9, nD));

    activeBox.querySelector('.val').innerText = (nE + nD).toFixed(1);
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

function onEnd() {
    if (activeBox) activeBox.classList.remove('active');
    isDragging = false;
    activeBox = null;
}

// --- CÁLCULOS ---
function getVal(id) {
    const box = document.querySelector(`.gestural-box[data-id="${id}"]`);
    return box ? parseFloat(box.querySelector('.val').innerText) : 0;
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

    let boveda = 9.5 * lMedia * 2.0;
    let galeria = (altMedia - 1.5) * (anchoMedia * lMedia) * 2.0;
    document.getElementById('res_avance').innerText = `${Math.ceil(boveda + galeria)} Tn`;
}

function calcRebaje(densidad) {
    const lI = getVal('re_lI'), lD = getVal('re_lD');
    let lMedia = (lI + lD) / ((lI > 0 ? 1 : 0) + (lD > 0 ? 1 : 0) || 1);

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

    document.getElementById('res_rebaje').innerText = `${Math.ceil(lMedia * anchoMedia * altMedia * densidad)} Tn`;
}

function calcRecorte() {
    const anch = getVal('rec_anch'), lng = getVal('rec_lng'), alt = getVal('rec_alt');
    document.getElementById('res_recorte').innerText = `${Math.ceil(lng * anch * alt)} Tn`;
}