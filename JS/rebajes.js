window.onload = function() {
    const canvas3D = document.getElementById('canvas3D');
    const canvasPlanta = document.getElementById('canvasPlanta');
    const ctx3D = canvas3D.getContext('2d');
    const ctxPlanta = canvasPlanta.getContext('2d');

    const buttons = document.querySelectorAll('.mat-btn');
    buttons.forEach(btn => {
        btn.onclick = function() {
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('tipoMaterial').value = this.dataset.val;
            procesar();
        };
    });

    function procesar() {
        canvas3D.width = canvas3D.clientWidth;
        canvas3D.height = canvas3D.clientHeight;
        canvasPlanta.width = canvasPlanta.clientWidth;
        canvasPlanta.height = canvasPlanta.clientHeight;

        const ld = parseFloat(document.getElementById('longDer').value) || 0;
        const li = parseFloat(document.getElementById('longIzq').value) || 0;
        const hi = parseFloat(document.getElementById('hInicial').value) || 0;
        const h1 = parseFloat(document.getElementById('hInter1').value) || 0;
        const h2 = parseFloat(document.getElementById('hInter2').value) || 0;
        const hf = parseFloat(document.getElementById('hFinal').value) || 0;
        const wb = parseFloat(document.getElementById('wBase').value) || 0;
        const dens = parseFloat(document.getElementById('tipoMaterial').value) || 2.0;

        const lMax = Math.max(ld, li);
        const lProm = (ld + li) / 2;
        const hProm = (hi + h1 + h2 + hf) / 4;
        
        const toneladas = (wb * lProm * hProm) * dens;
        const pendiente = lProm > 0 ? ((hf - hi) / lProm) * 100 : 0;

        document.getElementById('resMasa').innerText = toneladas.toLocaleString('es-ES', { minimumFractionDigits: 2 });
        document.getElementById('resPendiente').innerText = `Pendiente: ${pendiente.toFixed(2)}%`;

        if (wb > 0 && lMax > 0) {
            dibujar3D(ctx3D, hi, hf, wb, ld, li, lMax);
            dibujarPlanta(ctxPlanta, wb, ld, li, lMax);
        }
    }

    function dibujar3D(ctx, hi, hf, wb, ld, li, largoMax) {
        const ESCALA = Math.min(25, (ctx.canvas.width * 0.4) / (largoMax/2 + wb/2));
        const vpx = ctx.canvas.width * 0.2;
        const vpy = ctx.canvas.height * 0.5;
        const esRecto = Math.abs(ld - li) < 0.01;
        const radioM = esRecto ? 0 : (wb * (li + ld)) / (2 * (ld - li));
        const angT = esRecto ? 0 : (ld - li) / wb;
        
        let historial = [];
        for (let i = 0; i <= 20; i++) {
            let p = i / 20;
            let t = angT * p;
            let zL = esRecto ? (p * (ld+li)/2) : Math.abs(radioM * Math.sin(t));
            let xL = esRecto ? 0 : radioM * (Math.cos(t) - 1);
            let hVisual = hi + (hf - hi) * p;

            let pts = [
                {x: xL-wb/2, y: 2 + hVisual, z: zL}, 
                {x: xL+wb/2, y: 2 + hVisual, z: zL}, 
                {x: xL+wb/2, y: 2, z: zL}, 
                {x: xL-wb/2, y: 2, z: zL}
            ];

            let proj = pts.map(pt => proyectar(pt, vpx, vpy, ESCALA));
            historial.push(proj);

            ctx.globalAlpha = (i===0 || i===20) ? 1 : 0.3;
            ctx.strokeStyle = "#ffffff"; 
            ctx.lineWidth = (i===0 || i===20) ? 2 : 0.5;
            ctx.beginPath();
            proj.forEach((pt,idx) => idx===0?ctx.moveTo(pt.x,pt.y):ctx.lineTo(pt.x,pt.y));
            ctx.closePath(); ctx.stroke();
        }

        // --- ALTURAS (POSICIÓN SOLICITADA) ---
        ctx.globalAlpha = 1;
        ctx.font = "bold 11px Arial";
        ctx.fillStyle = "#27ae60";
        ctx.fillText(`H: ${hi}m`, historial[0][1].x + 15, historial[0][1].y + 15);
        ctx.fillText(`H: ${hf}m`, historial[20][1].x + 15, historial[20][1].y + 15);
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#3498db"; ctx.beginPath(); ctx.moveTo(historial[0][2].x, historial[0][2].y); ctx.lineTo(historial[0][3].x, historial[0][3].y); ctx.stroke();
        ctx.strokeStyle = "#e74c3c"; ctx.beginPath(); ctx.moveTo(historial[20][2].x, historial[20][2].y); ctx.lineTo(historial[20][3].x, historial[20][3].y); ctx.stroke();
    }

    function dibujarPlanta(ctx, wb, ld, li, largoMax) {
        // ZOOM DINÁMICO MEJORADO
        const padding = 50; 
        const cotaSpace = 80; // Espacio extra para las etiquetas exteriores
        
        const availableW = ctx.canvas.width - cotaSpace;
        const availableH = ctx.canvas.height - padding * 2;
        
        // Escala que se adapta al tamaño del canvas
        const ESCALA_P = Math.min(availableH / largoMax, availableW / (wb * 1.2));
        
        ctx.save();
        ctx.translate(ctx.canvas.width/2, ctx.canvas.height - padding);
        
        if (Math.abs(ld - li) < 0.01) {
            const w = wb * ESCALA_P, h = ld * ESCALA_P;
            dibujarCapaPlanta(ctx, -w/2, 0, w/2, 0, w/2, -h, -w/2, -h);
            ctx.font = "bold 12px Arial"; ctx.textAlign = "center";
            ctx.fillStyle = "#ff9f43"; ctx.fillText(`${ld}m`, w/2 + 35, -h/2);
            ctx.fillStyle = "#a29bfe"; ctx.fillText(`${li}m`, -w/2 - 35, -h/2);
        } else {
            const radioM = (wb * (li + ld)) / (2 * (ld - li));
            const angT = (ld - li) / wb;
            const R = Math.abs(radioM) * ESCALA_P;
            const Wp = wb * ESCALA_P;
            const dir = radioM > 0 ? -1 : 1;
            const cx = dir * R;
            const sA = dir === -1 ? 0 : Math.PI;
            const eA = sA - angT;

            ctx.lineWidth = 5;
            ctx.strokeStyle = ld > li ? "#ff9f43" : "#a29bfe";
            ctx.beginPath(); ctx.arc(cx, 0, R+Wp/2, sA, eA, radioM > 0); ctx.stroke();
            ctx.strokeStyle = ld > li ? "#a29bfe" : "#ff9f43";
            ctx.beginPath(); ctx.arc(cx, 0, R-Wp/2, sA, eA, radioM > 0); ctx.stroke();
            
            ctx.strokeStyle = "#3498db"; ctx.beginPath(); ctx.moveTo(cx+(R+Wp/2)*Math.cos(sA), (R+Wp/2)*Math.sin(sA)); ctx.lineTo(cx+(R-Wp/2)*Math.cos(sA), (R-Wp/2)*Math.sin(sA)); ctx.stroke();
            ctx.strokeStyle = "#e74c3c"; ctx.beginPath(); ctx.moveTo(cx+(R+Wp/2)*Math.cos(eA), (R+Wp/2)*Math.sin(eA)); ctx.lineTo(cx+(R-Wp/2)*Math.cos(eA), (R-Wp/2)*Math.sin(eA)); ctx.stroke();

            ctx.font = "bold 11px Arial"; ctx.textAlign = "center";
            const angMedio = sA - angT / 2;
            const offsetCota = 35;

            ctx.save();
            ctx.translate(cx + (R + Wp/2 + offsetCota) * Math.cos(angMedio), (R + Wp/2 + offsetCota) * Math.sin(angMedio));
            ctx.rotate(angMedio + Math.PI/2);
            ctx.fillStyle = ld > li ? "#ff9f43" : "#a29bfe";
            ctx.fillText(`${Math.max(ld, li)}m`, 0, 0);
            ctx.restore();

            ctx.save();
            ctx.translate(cx + (R - Wp/2 - offsetCota) * Math.cos(angMedio), (R - Wp/2 - offsetCota) * Math.sin(angMedio));
            ctx.rotate(angMedio + Math.PI/2);
            ctx.fillStyle = ld > li ? "#a29bfe" : "#ff9f43";
            ctx.fillText(`${Math.min(ld, li)}m`, 0, 0);
            ctx.restore();
        }

        ctx.fillStyle = "#ffffff"; ctx.textAlign = "center";
        ctx.fillText(`Ancho: ${wb}m`, 0, 20);
        ctx.restore();
    }

    function dibujarCapaPlanta(ctx, x1, y1, x2, y2, x3, y3, x4, y4) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#3498db"; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.strokeStyle = "#ff9f43"; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke();
        ctx.strokeStyle = "#e74c3c"; ctx.beginPath(); ctx.moveTo(x3, y3); ctx.lineTo(x4, y4); ctx.stroke();
        ctx.strokeStyle = "#a29bfe"; ctx.beginPath(); ctx.moveTo(x4, y4); ctx.lineTo(x1, y1); ctx.stroke();
    }

    function proyectar(pt, vpx, vpy, ESCALA) {
        let x1 = pt.x * 0.7 + pt.z * 0.7;
        let z1 = -pt.x * 0.7 + pt.z * 0.7;
        let y2 = pt.y * 0.9 - z1 * 0.3;
        let z2 = pt.y * 0.3 + z1 * 0.9;
        let f = 500 / (500 + z2);
        return { x: vpx + x1 * ESCALA * f, y: vpy + y2 * ESCALA * f };
    }

    document.querySelectorAll('input').forEach(inp => inp.oninput = procesar);
    window.onresize = procesar;
    procesar();
};