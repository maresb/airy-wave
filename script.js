document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.getElementById('waveCanvas');
    const ctx = canvas.getContext('2d');
    const controls = {
        a: document.getElementById('a'),
        k: document.getElementById('k'),
        h: document.getElementById('h'),
        g: document.getElementById('g'),
        gridSpacing: document.getElementById('gridSpacing')
    };
    let animationFrameId;
    
    function updateParameters() {
        const params = {
            a: parseFloat(controls.a.value),
            k: parseFloat(controls.k.value),
            h: parseFloat(controls.h.value),
            g: parseFloat(controls.g.value),
            gridSpacing: parseFloat(controls.gridSpacing.value),
            w: 0
        };
        params.w = Math.sqrt(params.g * params.k * Math.tanh(params.k * params.h));
        draw(params);
    }

    function particlePosition(x0, z0, t, params) {
        const theta = params.k * x0 - params.w * t;
        const x = x0 - params.a * Math.cosh(params.k * (z0 + params.h)) / Math.sinh(params.k * params.h) * Math.sin(theta);
        const z = z0 + params.a * Math.sinh(params.k * (z0 + params.h)) / Math.sinh(params.k * params.h) * Math.cos(theta);
        return { x, z };
    }

    function draw(params) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const time = new Date().getTime() / 1000;

        for (let x0 = -8; x0 <= 8; x0 += params.gridSpacing) {
            for (let z0 = -params.h; z0 <= 0; z0 += params.gridSpacing) {
                const pos = particlePosition(x0, z0, time, params);
                const canvasX = pos.x * 200 + canvas.width / 2;
                const canvasZ = canvas.height - (pos.z + params.h) * 200;
                ctx.beginPath();
                ctx.arc(canvasX, canvasZ, 2, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        animationFrameId = requestAnimationFrame(() => draw(params));
    }

    for (const key in controls) {
        controls[key].addEventListener('input', updateParameters);
    }

    updateParameters(); // Initial draw
});
