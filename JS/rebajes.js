window.onload = function() {
    const canvas3D = document.getElementById('canvas3D');
    const canvasPlanta = document.getElementById('canvasPlanta');
    const ctx3D = canvas3D.getContext('2d');
    const ctxPlanta = canvasPlanta.getContext('2d');

    const inputs = document.querySelectorAll('input');
    const buttons = document.querySelectorAll('.mat-btn');

    buttons.forEach(btn => {
        btn.onclick = function() {
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('tipoMaterial').value = this.dataset.val;
            procesar();
        };
    });

    inputs.forEach(inp => inp.oninput = procesar);

    function procesar() {
        canvas3D.width = canvas3D.clientWidth;
        canvas3D.height = canvas3D.clientHeight;
        canvasPlanta.width = canvasPlanta.clientWidth;
        canvasPlanta.height = canvasPlanta.clientHeight;

        const ld = parseFloat(document.getElementById('longDer').value) || 0;
        const li = parseFloat(document.getElementById('longIzq').value) || 0;
        const hi = parseFloat(document.getElementById('hInicial').value) || 0;
        const hf = parseFloat(document.getElementById('hFinal').value) || 0;
        const wb = parseFloat(document.getElementById('wBase').value) || 0;
        const dens = parseFloat(document.getElementById('tipoMaterial').value) || 2.0;

        const lMax = Math.max(ld, li);
        const lProm = (ld + li) / 2;
        const hProm = (hi + hf) / 2;
        const toneladas = (wb * lProm * hProm) * dens;
        const pendiente = lProm > 0 ? ((hf - hi) / lProm) * 100 : 0;

        document.getElementById('resMasa').innerText = toneladas.toLocaleString('es-ES', { minimumFractionDigits: 2 });
        document.getElementById('resPendiente').innerText = `Pendiente: ${pendiente.toFixed(2)}%`;

        if (wb > 0 && lMax > 0) {
            dibujar3D(ctx3D, hi, hf, wb, ld, li, lMax);
            dibujarPlanta(ctxPlanta, wb, ld, li, lMax);
        }
    }

    function dibujar3D(ctx, hi, hf, wb, ld, li, lMax) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const ESCALA = Math.min((ctx.canvas.width * 0.45) / (wb + lMax*0.5), (ctx.canvas.height * 0.45) / (hf + 2));
        const vpx = ctx.canvas.width / 2;
        const vpy = ctx.canvas.height / 1.6;

        let historial = [];
        for (let i = 0; i <= 20; i++) {
            let p = i / 20;
            let hVis = hi + (hf - hi) * p;
            let zL = p * lMax;
            let pts = [
                {x: -wb/2, y: 2 + hVis, z: zL}, {x: wb/2, y: 2 + hVis, z: zL}, 
                {x: wb/2, y: 2, z: zL}, {x: -wb/2, y: 2, z: zL}
            ];
            let proj = pts.map(pt => proyectar(pt, vpx, vpy, ESCALA));
            historial.push(proj);

            ctx.globalAlpha = (i===0 || i===20) ? 1 : 0.2;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = (i===0 || i===20) ? 1.5 : 0.5;
            ctx.beginPath();
            proj.forEach((pt,idx) => idx===0?ctx.moveTo(pt.x,pt.y):ctx.lineTo(pt.x,pt.y));
            ctx.closePath(); ctx.stroke();
        }

        // Medidas de Altura
        ctx.globalAlpha = 1; ctx.font = "bold 10px Arial"; ctx.fillStyle = "#27ae60";
        ctx.fillText(`H: ${hi}m`, historial[0][1].x + 10, historial[0][1].y + 10);
        ctx.fillText(`H: ${hf}m`, historial[20][1].x + 10, historial[20][1].y + 10);
        
        // Líneas de color (Entrada/Salida)
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#3498db"; ctx.beginPath(); ctx.moveTo(historial[0][2].x, historial[0][2].y); ctx.lineTo(historial[0][3].x, historial[0][3].y); ctx.stroke();
        ctx.strokeStyle = "#e74c3c"; ctx.beginPath(); ctx.moveTo(historial[20][2].x, historial[20][2].y); ctx.lineTo(historial[20][3].x, historial[20][3].y); ctx.stroke();
    }

    function dibujarPlanta(ctx, wb, ld, li, lMax) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const padding = 40;
        const ESCALA_P = Math.min((ctx.canvas.width - 100) / (wb * 1.5), (ctx.canvas.height - padding*2) / lMax);
        
        ctx.save();
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height - padding);
        
        const w = wb * ESCALA_P;
        const hd = ld * ESCALA_P;
        const hi = li * ESCALA_P;

        // Dibujo de Planta con colores
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#3498db"; ctx.beginPath(); ctx.moveTo(-w/2, 0); ctx.lineTo(w/2, 0); ctx.stroke(); // Base
        ctx.strokeStyle = "#ff9f43"; ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, -hd); ctx.stroke(); // Der
        ctx.strokeStyle = "#e74c3c"; ctx.beginPath(); ctx.moveTo(w/2, -hd); ctx.lineTo(-w/2, -hi); ctx.stroke(); // Tope
        ctx.strokeStyle = "#a29bfe"; ctx.beginPath(); ctx.moveTo(-w/2, -hi); ctx.lineTo(-w/2, 0); ctx.stroke(); // Izq

        // Etiquetas de Medidas
        ctx.font = "bold 11px Arial"; ctx.textAlign = "center";
        ctx.fillStyle = "#ff9f43"; ctx.fillText(`${ld}m`, w/2 + 25, -hd/2);
        ctx.fillStyle = "#a29bfe"; ctx.fillText(`${li}m`, -w/2 - 25, -hi/2);
        ctx.fillStyle = "#ffffff"; ctx.fillText(`Ancho: ${wb}m`, 0, 20);
        
        ctx.restore();
    }

    function proyectar(pt, vpx, vpy, ESCALA) {
        let x1 = pt.x * 0.7 + pt.z * 0.7;
        let z1 = -pt.x * 0.7 + pt.z * 0.7;
        let y2 = pt.y * 0.9 - z1 * 0.3;
        let z2 = pt.y * 0.3 + z1 * 0.9;
        let f = 400 / (400 + z2);
        return { x: vpx + x1 * ESCALA * f, y: vpy + y2 * ESCALA * f };
    }

    // Redibujar al deslizar
    document.querySelector('.viewport-slider').addEventListener('scroll', () => {
        clearTimeout(window.t);
        window.t = setTimeout(procesar, 100);
    });

    window.onresize = procesar;
    procesar();
};