// CONTROL DE NAVEGACIÓN
let currentIndex = 0;
const slider = document.getElementById('slider');
const dots = document.querySelectorAll('.dot');

function goToSlide(index) {
    if (index < 0) index = 0;
    if (index > 2) index = 2;
    currentIndex = index;
    slider.style.transform = `translateX(-${currentIndex * 100}vw)`;
    
    // Actualizar puntos
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
    });
}

// Eventos de teclado (PC)
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goToSlide(currentIndex + 1);
    if (e.key === 'ArrowLeft') goToSlide(currentIndex - 1);
});

// Eventos táctiles (Móvil)
let touchStartX = 0;
window.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX);
window.addEventListener('touchend', e => {
    let touchEndX = e.changedTouches[0].screenX;
    let diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) { // Umbral de 50px
        if (diff > 0) goToSlide(currentIndex + 1);
        else goToSlide(currentIndex - 1);
    }
});

// LÓGICA DE CÁLCULO (Extraída de tus archivos Kotlin)

function calcAvance() {
    const lI = parseFloat(document.getElementById('av_lI').value) || 0;
    const lD = parseFloat(document.getElementById('av_lD').value) || 0;
    
    // Cálculo de L Media
    let lm = (lI > 0 ? 1 : 0) + (lD > 0 ? 1 : 0) || 1;
    let lMedia = (lI + lD) / lm;

    // Cálculo de Altura Media (h1-h6)
    let hSum = 0, hm = 0;
    for (let i = 1; i <= 6; i++) {
        let val = parseFloat(document.getElementById(`av_h${i}`).value) || 0;
        if (val > 0) { hSum += val; hm++; }
    }
    let altMedia = (hm === 0) ? 5.1 : (hSum / hm);

    const areaBoveda = 9.5;
    const densidad = 2.0;
    const anchoMedia = 8.2;

    let boveda = areaBoveda * lMedia * densidad;
    let galeria = (altMedia - 1.5) * (anchoMedia * lMedia) * densidad;
    let total = Math.ceil(boveda + galeria);

    document.getElementById('res_avance').innerText = 
        `${Math.ceil(boveda)} + ${Math.ceil(galeria)} = ${total} Tn`;
}

function calcRebaje(densidad) {
    const lI = parseFloat(document.getElementById('re_lI').value) || 0;
    const lD = parseFloat(document.getElementById('re_lD').value) || 0;
    
    let lm = (lI > 0 ? 1 : 0) + (lD > 0 ? 1 : 0) || 1;
    let lMedia = (lI + lD) / lm;

    // Usando valores fijos de tus fragmentos (Ancho: 8.0, Altura: 2.0)
    let resultado = Math.ceil(lMedia * 8.0 * 2.0 * densidad);
    document.getElementById('res_rebaje').innerText = `${resultado} Tn`;
}

function calcRecorte() {
    const anch = parseFloat(document.getElementById('rec_anch').value) || 0;
    const lng = parseFloat(document.getElementById('rec_lng').value) || 0;
    const alt = parseFloat(document.getElementById('rec_alt').value) || 0;

    let resultado = Math.ceil(lng * anch * alt);
    document.getElementById('res_recorte').innerText = `${resultado} Tn`;
}