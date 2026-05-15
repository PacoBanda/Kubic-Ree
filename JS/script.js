// --- ESTADO GLOBAL ---
let currentIndex = 0;
let currentDensity = 2.0;
const slider = document.getElementById("slider");
const dots = document.querySelectorAll(".dot");

let totalAvance = 0;
let totalRebaje = 0;
let totalRecorte = 0;

// --- NAVEGACIÓN ---
function goToSlide(index) {
  if (index < 0 || index > 3) return; // Rango 0-3 para 4 pantallas
  currentIndex = index;
  slider.style.transform = `translateX(-${currentIndex * 100}vw)`;
  const dotsList = document.querySelectorAll(".dot");
  dotsList.forEach((dot, i) => dot.classList.toggle("active", i === currentIndex));
}

// Teclado
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") goToSlide(currentIndex + 1);
  if (e.key === "ArrowLeft") goToSlide(currentIndex - 1);
});

// --- SWIPE MÓVIL ---
let tStartX = 0;
let tStartY = 0;

slider.addEventListener("touchstart", (e) => {
  if (!e.target.closest(".gestural-box")) {
    tStartX = e.changedTouches[0].screenX;
    tStartY = e.changedTouches[0].screenY;
  }
}, { passive: true });

slider.addEventListener("touchend", (e) => {
  if (isDragging) return;
  const dx = tStartX - e.changedTouches[0].screenX;
  const dy = tStartY - e.changedTouches[0].screenY;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 70) {
    if (dx > 0) goToSlide(currentIndex + 1);
    else goToSlide(currentIndex - 1);
  }
}, { passive: true });

// --- CÁLCULOS Y RESUMEN ---
function updateGlobal() {
  document.getElementById("sum_av").innerText = `${totalAvance} Tn`;
  document.getElementById("sum_re").innerText = `${totalRebaje} Tn`;
  document.getElementById("sum_rec").innerText = `${totalRecorte} Tn`;
  document.getElementById("res_total_general").innerText = `${totalAvance + totalRebaje + totalRecorte} Tn`;
}

function getVal(id) {
  const box = document.querySelector(`.gestural-box[data-id="${id}"]`);
  return box ? parseFloat(box.querySelector(".val").innerText) || 0 : 0;
}

function calcAvance() {
  const lI = getVal("av_lI"), lD = getVal("av_lD");
  let lMedia = (lI + lD) / ((lI > 0 ? 1 : 0) + (lD > 0 ? 1 : 0) || 1);
  let hSum = 0, hm = 0;
  ["av_h1", "av_h2", "av_h3", "av_h4", "av_h5", "av_h6"].forEach((id) => {
    let v = getVal(id); if (v > 0) { hSum += v; hm++; }
  });
  let altMedia = hm === 0 ? 5.1 : hSum / hm;
  let aSum = 0, am = 0;
  ["av_a1", "av_a2", "av_a3"].forEach((id) => {
    let v = getVal(id); if (v > 0) { aSum += v; am++; }
  });
  let anchoMedia = am === 0 ? 8.2 : aSum / am;
  totalAvance = Math.ceil(9.5 * lMedia * 2.0 + (altMedia - 1.5) * (anchoMedia * lMedia) * 2.0);
  document.getElementById("res_avance").innerText = `${totalAvance} Tn`;
  updateGlobal();
}

function calcRebaje() {
  const lI = getVal("re_lI"), lD = getVal("re_lD");
  let lMedia = (lI + lD) / ((lI > 0 ? 1 : 0) + (lD > 0 ? 1 : 0) || 1);
  let hSum = 0, hm = 0;
  ["re_h1", "re_h2", "re_h3", "re_h4", "re_h5", "re_h6"].forEach((id) => {
    let v = getVal(id); if (v > 0) { hSum += v; hm++; }
  });
  let altMedia = hm === 0 ? 2.0 : hSum / hm;
  let aSum = 0, am = 0;
  ["re_a1", "re_a2", "re_a3"].forEach((id) => {
    let v = getVal(id); if (v > 0) { aSum += v; am++; }
  });
  let anchoMedia = am === 0 ? 8.0 : aSum / am;
  totalRebaje = Math.ceil(lMedia * anchoMedia * altMedia * currentDensity);
  document.getElementById("res_rebaje").innerText = `${totalRebaje} Tn`;
  updateGlobal();
}

function calcRecorte() {
  totalRecorte = Math.ceil(getVal("rec_anch") * getVal("rec_lng") * getVal("rec_alt"));
  document.getElementById("res_recorte").innerText = `${totalRecorte} Tn`;
  updateGlobal();
}

function setDensity(val, btnId) {
  currentDensity = val;
  document.querySelectorAll(".mat-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById(btnId).classList.add("active");
  calcRebaje();
}

// --- MOTOR GESTUAL HÍBRIDO ---
let isDragging = false;
let activeBox = null;
let startX, startY, baseE, baseD;

function onStart(x, y, box) {
  isDragging = true;
  activeBox = box;
  activeBox.classList.add("active");
  startX = x;
  startY = y;
  const v = parseFloat(activeBox.querySelector(".val").innerText) || 0;
  baseE = Math.floor(v);
  baseD = v - baseE;
}

function onMove(x, y) {
  if (!isDragging || !activeBox) return;
  const dx = x - startX;
  const dy = startY - y;
  let nE = baseE + Math.round(dy / 60);
  let nD = baseD + Math.round(dx / 60) * 0.1;
  nE = Math.max(0, Math.min(100, nE));
  nD = Math.max(0, Math.min(0.9, nD));
  activeBox.querySelector(".val").innerText = (nE + nD).toFixed(1);
  const id = activeBox.getAttribute("data-id");
  if (id.startsWith("av")) calcAvance();
  if (id.startsWith("re")) calcRebaje();
  if (id.startsWith("rec")) calcRecorte();
}

document.querySelectorAll(".gestural-box").forEach((box) => {
  box.addEventListener("mousedown", (e) => onStart(e.clientX, e.clientY, box));
  box.addEventListener("touchstart", (e) => {
    e.stopPropagation();
    onStart(e.touches[0].clientX, e.touches[0].clientY, box);
  }, { passive: false });
});

window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
window.addEventListener("touchmove", (e) => {
  if (isDragging) { if (e.cancelable) e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }
}, { passive: false });
window.addEventListener("mouseup", () => { isDragging = false; if (activeBox) activeBox.classList.remove("active"); });
window.addEventListener("touchend", () => { isDragging = false; if (activeBox) activeBox.classList.remove("active"); });

// Inicializar
calcAvance(); calcRebaje(); calcRecorte();