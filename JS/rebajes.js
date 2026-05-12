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
        // Ajustar resolución del canvas al tamaño real visible
        canvas3D.width = canvas3D.offsetWidth;
        canvas3D.height = canvas3D.offsetHeight;
        canvasPlanta.width = canvasPlanta.offsetWidth;
        canvasPlanta.height = canvasPlanta.offsetHeight;

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
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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

        ctx.globalAlpha = 1;
        ctx.font = "bold 11px Arial";
        ctx.fillStyle = "#27ae60";
        ctx.fillText(`H: ${hi}m`, historial[0][1].x + 10, historial[0][1].y + 10);
        ctx.fillText(`H: ${hf}m`, historial[20][1].x + 10, historial[20][1].y + 10);
    }

    function dibujarPlanta(ctx, wb, ld, li, largoMax) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const padding = 40; 
        const ESCALA_P = Math.min((ctx.canvas.height - padding*2) / largoMax, (ctx.canvas.width - padding*2) / (wb * 1.5));
        
        ctx.save();
        ctx.translate(ctx.canvas.width/2, ctx.canvas.height - padding);
        
        if (Math.abs(ld - li) < 0.01) {
            const w = wb * ESCALA_P, h = ld * ESCALA_P;
            dibujarCapaPlanta(ctx, -w/2, 0, w/2, 0, w/2, -h, -w/2, -h);
        } else {
            const radioM = (wb * (li + ld)) / (2 * (ld - li));
            const angT = (ld - li) / wb;
            const R = Math.abs(radioM) * ESCALA_P;
            const Wp = wb * ESCALA_P;
            const dir = radioM > 0 ? -1 : 1;
            const cx = dir * R;
            const sA = dir === -1 ? 0 : Math.PI;
            const eA = sA - angT;

            ctx.lineWidth = 4;
            ctx.strokeStyle = "#ff9f43"; ctx.beginPath(); ctx.arc(cx, 0, R+Wp/2, sA, eA, radioM > 0); ctx.stroke();
            ctx.strokeStyle = "#a29bfe"; ctx.beginPath(); ctx.arc(cx, 0, R-Wp/2, sA, eA, radioM > 0); ctx.stroke();
        }
        ctx.restore();
    }

    function dibujarCapaPlanta(ctx, x1, y1, x2, y2, x3, y3, x4, y4) {
        ctx.lineWidth = 3;
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

    // --- ESCUCHADORES DE EVENTOS ---
    document.querySelectorAll('input').forEach(inp => inp.oninput = procesar);
    
    // Redibujar cuando el usuario termina de deslizar en el móvil
    const slider = document.querySelector('.viewport-slider');
    let timer;
    slider.addEventListener('scroll', () => {
        clearTimeout(timer);
        timer = setTimeout(procesar, 150);
    });

    window.onresize = procesar;
    procesar();
};