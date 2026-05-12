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
        // Ajustar resolución interna al tamaño real del elemento
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
        const toneladas = (wb * lProm * ((hi + hf) / 2)) * dens;
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
        
        // Escala dinámica basada en el ancho del canvas
        const factorAncho = ctx.canvas.width / (wb + lMax * 0.8);
        const ESCALA = factorAncho * 0.85; 
        
        const vpx = ctx.canvas.width / 2;
        const vpy = ctx.canvas.height / 1.5;

        let historial = [];
        for (let i = 0; i <= 10; i++) {
            let p = i / 10;
            let hVis = hi + (hf - hi) * p;
            let zL = p * lMax;
            
            let pts = [
                {x: -wb/2, y: 2 + hVis, z: zL}, 
                {x: wb/2, y: 2 + hVis, z: zL}, 
                {x: wb/2, y: 2, z: zL}, 
                {x: -wb/2, y: 2, z: zL}
            ];

            let proj = pts.map(pt => proyectar(pt, vpx, vpy, ESCALA));
            historial.push(proj);

            ctx.globalAlpha = (i === 0 || i === 10) ? 1 : 0.3;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = (i === 0 || i === 10) ? 2 : 0.5;
            ctx.beginPath();
            proj.forEach((pt, idx) => idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
            ctx.closePath(); ctx.stroke();
        }

        // Medidas de altura corregidas
        ctx.globalAlpha = 1; ctx.font = "bold 13px Arial"; ctx.fillStyle = "#27ae60";
        ctx.fillText(`H: ${hi}m`, historial[0][0].x - 45, historial[0][0].y);
        ctx.fillText(`H: ${hf}m`, historial[10][1].x + 10, historial[10][1].y);
        
        // Colores de entrada (azul) y salida (rojo)
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#3498db"; ctx.beginPath(); ctx.moveTo(historial[0][2].x, historial[0][2].y); ctx.lineTo(historial[0][3].x, historial[0][3].y); ctx.stroke();
        ctx.strokeStyle = "#e74c3c"; ctx.beginPath(); ctx.moveTo(historial[10][2].x, historial[10][2].y); ctx.lineTo(historial[10][3].x, historial[10][3].y); ctx.stroke();
    }

    function dibujarPlanta(ctx, wb, ld, li, lMax) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const margin = 50;
        const ESCALA_P = Math.min((ctx.canvas.width - 120) / wb, (ctx.canvas.height - 120) / lMax);
        
        ctx.save();
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height - margin);
        
        const w = wb * ESCALA_P;
        const hd = ld * ESCALA_P;
        const hi = li * ESCALA_P;

        // Dibujo de líneas por color
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#3498db"; ctx.beginPath(); ctx.moveTo(-w/2, 0); ctx.lineTo(w/2, 0); ctx.stroke();
        ctx.strokeStyle = "#ff9f43"; ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, -hd); ctx.stroke();
        ctx.strokeStyle = "#a29bfe"; ctx.beginPath(); ctx.moveTo(-w/2, 0); ctx.lineTo(-w/2, -hi); ctx.stroke();
        ctx.strokeStyle = "#e74c3c"; ctx.beginPath(); ctx.moveTo(w/2, -hd); ctx.lineTo(-w/2, -hi); ctx.stroke();

        // Etiquetas de medidas en planta
        ctx.font = "bold 13px Arial"; ctx.textAlign = "center";
        ctx.fillStyle = "#ff9f43"; ctx.fillText(`${ld}m`, w/2 + 25, -hd/2);
        ctx.fillStyle = "#a29bfe"; ctx.fillText(`${li}m`, -w/2 - 25, -hi/2);
        ctx.fillStyle = "#ffffff"; ctx.fillText(`Ancho Base: ${wb}m`, 0, 30);
        ctx.restore();
    }

    function proyectar(pt, vpx, vpy, ESCALA) {
        let x1 = pt.x * 0.8 + pt.z * 0.5;
        let z1 = -pt.x * 0.5 + pt.z * 0.8;
        let y2 = pt.y * 1.0 - z1 * 0.4;
        let z2 = pt.y * 0.4 + z1 * 1.0;
        let f = 600 / (600 + z2);
        return { x: vpx + x1 * ESCALA * f, y: vpy + y2 * ESCALA * f };
    }

    window.addEventListener('resize', procesar);
    document.querySelector('.viewport-slider').addEventListener('scroll', procesar);
    procesar();
};