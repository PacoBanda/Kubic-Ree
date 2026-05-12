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
        const toneladas = (wb * lProm * ((hi + hf) / 2)) * dens;
        const pendiente = lMax > 0 ? ((hf - hi) / lMax) * 100 : 0;

        document.getElementById('resMasa').innerText = toneladas.toLocaleString('es-ES', { minimumFractionDigits: 2 });
        document.getElementById('resPendiente').innerText = `Pendiente: ${pendiente.toFixed(2)}%`;

        if (wb > 0 && lMax > 0) {
            dibujar3D(ctx3D, hi, hf, wb, ld, li, lMax);
            dibujarPlanta(ctxPlanta, wb, ld, li, lMax);
        }
    }

    function dibujar3D(ctx, hi, hf, wb, ld, li, lMax) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        const ESCALA = Math.min(22, (ctx.canvas.width * 0.4) / (lMax/2 + wb/2));
        
        // CAMBIO 1: Desplazamos a la IZQUIERDA (vpx de 0.5 a 0.25)
        const vpx = ctx.canvas.width * 0.25; 
        const vpy = ctx.canvas.height * 0.55;

        // Lógica de giro para el 3D
        const esRecto = Math.abs(ld - li) < 0.01;
        const radioM = esRecto ? 0 : (wb * (li + ld)) / (2 * (ld - li));
        const angT = esRecto ? 0 : (ld - li) / wb;

        let historial = [];
        for (let i = 0; i <= 20; i++) {
            let p = i / 20;
            let t = angT * p;
            let zL = esRecto ? (p * (ld+li)/2) : Math.abs(radioM * Math.sin(t));
            let xL = esRecto ? 0 : radioM * (Math.cos(t) - 1);
            let hVis = hi + (hf - hi) * p;

            let pts = [
                {x: xL-wb/2, y: 2 + hVis, z: zL}, 
                {x: xL+wb/2, y: 2 + hVis, z: zL}, 
                {x: xL+wb/2, y: 2, z: zL}, 
                {x: xL-wb/2, y: 2, z: zL}
            ];

            let proj = pts.map(pt => proyectar(pt, vpx, vpy, ESCALA));
            historial.push(proj);

            ctx.globalAlpha = (i === 0 || i === 20) ? 1 : 0.2;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = (i === 0 || i === 20) ? 2 : 0.5;
            ctx.beginPath();
            proj.forEach((pt, idx) => idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
            ctx.closePath(); ctx.stroke();
        }

        // Colores de aristas según original
        ctx.globalAlpha = 1; ctx.lineWidth = 3;
        ctx.strokeStyle = "#3498db"; ctx.beginPath(); ctx.moveTo(historial[0][2].x, historial[0][2].y); ctx.lineTo(historial[0][3].x, historial[0][3].y); ctx.stroke();
        ctx.strokeStyle = "#ff9f43"; ctx.beginPath(); ctx.moveTo(historial[0][2].x, historial[0][2].y); historial.forEach(h => ctx.lineTo(h[2].x, h[2].y)); ctx.stroke();
        ctx.strokeStyle = "#a29bfe"; ctx.beginPath(); ctx.moveTo(historial[0][3].x, historial[0][3].y); historial.forEach(h => ctx.lineTo(h[3].x, h[3].y)); ctx.stroke();
        ctx.strokeStyle = "#e74c3c"; ctx.beginPath(); ctx.moveTo(historial[20][2].x, historial[20][2].y); ctx.lineTo(historial[20][3].x, historial[20][3].y); ctx.stroke();
        
        ctx.font = "bold 11px Arial"; ctx.fillStyle = "#27ae60";
        ctx.fillText(`H: ${hi}m`, historial[0][1].x + 10, historial[0][1].y);
        ctx.fillText(`H: ${hf}m`, historial[20][1].x + 10, historial[20][1].y);
    }

    function dibujarPlanta(ctx, wb, ld, li, lMax) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const padding = 60;
        const ESCALA_P = Math.min((ctx.canvas.height - padding * 2) / lMax, (ctx.canvas.width - 120) / (wb * 1.5));
        
        ctx.save();
        ctx.translate(ctx.canvas.width/2, ctx.canvas.height - padding);
        
        // CAMBIO 2: Lógica de giro (Arco)
        const radioM = (wb * (li + ld)) / (2 * (ld - li));
        const angT = (ld - li) / wb;
        const R = Math.abs(radioM) * ESCALA_P;
        const Wp = wb * ESCALA_P;

        if (Math.abs(ld - li) < 0.01) {
            // Caso recto
            const w = Wp, h = ld * ESCALA_P;
            ctx.lineWidth = 4;
            ctx.strokeStyle = "#3498db"; ctx.strokeRect(-w/2, 0, w, 0); // Entrada
            ctx.strokeStyle = "#ff9f43"; ctx.strokeRect(w/2, 0, 0, -h); // Der
            ctx.strokeStyle = "#a29bfe"; ctx.strokeRect(-w/2, 0, 0, -h); // Izq
            ctx.strokeStyle = "#e74c3c"; ctx.strokeRect(-w/2, -h, w, 0); // Salida
            
            ctx.fillStyle = "#ff9f43"; ctx.fillText(`${ld}m`, w/2 + 25, -h/2);
            ctx.fillStyle = "#a29bfe"; ctx.fillText(`${li}m`, -w/2 - 45, -h/2);
        } else {
            // Caso con giro (Arco)
            const dir = radioM > 0 ? -1 : 1;
            const cx = dir * R;
            const sA = dir === -1 ? 0 : Math.PI;
            const eA = sA - angT;

            ctx.lineWidth = 5;
            // Arcos laterales
            ctx.strokeStyle = ld > li ? "#ff9f43" : "#a29bfe";
            ctx.beginPath(); ctx.arc(cx, 0, R+Wp/2, sA, eA, radioM > 0); ctx.stroke();
            ctx.strokeStyle = ld > li ? "#a29bfe" : "#ff9f43";
            ctx.beginPath(); ctx.arc(cx, 0, R-Wp/2, sA, eA, radioM > 0); ctx.stroke();
            
            // Líneas de cierre (Entrada y Salida)
            ctx.strokeStyle = "#3498db"; ctx.beginPath(); ctx.moveTo(cx+(R+Wp/2)*Math.cos(sA), (R+Wp/2)*Math.sin(sA)); ctx.lineTo(cx+(R-Wp/2)*Math.cos(sA), (R-Wp/2)*Math.sin(sA)); ctx.stroke();
            ctx.strokeStyle = "#e74c3c"; ctx.beginPath(); ctx.moveTo(cx+(R+Wp/2)*Math.cos(eA), (R+Wp/2)*Math.sin(eA)); ctx.lineTo(cx+(R-Wp/2)*Math.cos(eA), (R-Wp/2)*Math.sin(eA)); ctx.stroke();

            // Cotas Rotadas
            const angMedio = sA - angT / 2;
            ctx.font = "bold 11px Arial"; ctx.textAlign = "center";
            
            ctx.save(); ctx.translate(cx+(R+Wp/2+35)*Math.cos(angMedio), (R+Wp/2+35)*Math.sin(angMedio)); ctx.rotate(angMedio+Math.PI/2); 
            ctx.fillStyle = ld > li ? "#ff9f43" : "#a29bfe"; ctx.fillText(`${Math.max(ld,li)}m`,0,0); ctx.restore();

            ctx.save(); ctx.translate(cx+(R-Wp/2-35)*Math.cos(angMedio), (R-Wp/2-35)*Math.sin(angMedio)); ctx.rotate(angMedio+Math.PI/2); 
            ctx.fillStyle = ld > li ? "#a29bfe" : "#ff9f43"; ctx.fillText(`${Math.min(ld,li)}m`,0,0); ctx.restore();
        }
        ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.fillText(`Base: ${wb}m`, 0, 30);
        ctx.restore();
    }

    function proyectar(pt, vpx, vpy, ESCALA) {
        let x1 = pt.x * 0.7 + pt.z * 0.7;
        let z1 = -pt.x * 0.7 + pt.z * 0.7;
        let y2 = pt.y * 0.9 - z1 * 0.3;
        let z2 = pt.y * 0.3 + z1 * 0.9;
        let f = 500 / (500 + z2);
        return { x: vpx + x1 * ESCALA * f, y: vpy + y2 * ESCALA * f };
    }

    window.addEventListener('resize', procesar);
    procesar();
};