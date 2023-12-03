document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById('waveCanvas');
    const ctx = canvas.getContext('2d');
    const graphCanvas = document.getElementById('graphCanvas');
    const graphCtx = graphCanvas.getContext('2d');

    const controls = {
        a: document.getElementById('a'),
        k: document.getElementById('k'),
        h: document.getElementById('h'),
        g: document.getElementById('g'),
        gridSpacing: document.getElementById('gridSpacing')
    };

    let theta0 = 0;
    let wOld = calculateAngularFrequency(controls.k.value, controls.h.value, controls.g.value);
    let animationFrameId; // To keep track of the animation frame

    // Add input event listeners to update the animation and graph upon parameter changes
    Object.values(controls).forEach(control => {
        control.addEventListener('input', drawAll);
    });

    // Aggregate function to update both the wave and the graph based on the current parameters
    function drawAll() {
        const params = getCurrentParameters();
        updateTheta0(params.w);
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId); // Cancel the previous animation frame
        }
        drawWave(ctx, params, canvas);
        drawGraph(graphCtx, params, graphCanvas);
        displayDependentParameters(params);
    }

    // Extracts values from UI elements to use in wave and graph calculations
    function getCurrentParameters() {
        return {
            a: parseFloat(controls.a.value),
            k: parseFloat(controls.k.value),
            h: parseFloat(controls.h.value),
            g: parseFloat(controls.g.value),
            gridSpacing: parseFloat(controls.gridSpacing.value),
            w: calculateAngularFrequency(controls.k.value, controls.h.value, controls.g.value)
        };
    }

    // Compute angular frequency from wave parameters
    function calculateAngularFrequency(k, h, g) {
        return Math.sqrt(g * k * Math.tanh(k * h));
    }

    // Update theta0 to ensure smooth transition when parameters change
    function updateTheta0(wNew) {
        const time = new Date().getTime() / 1000;
        theta0 += time * (wNew - wOld);
        wOld = wNew;
    }

    // Renders the wave animation based on current parameters
    function drawWave(context, params, canvasElement) {
        context.clearRect(0, 0, canvasElement.width, canvasElement.height);
        const time = new Date().getTime() / 1000;

        for (let x0 = -8; x0 <= 8; x0 += params.gridSpacing) {
            for (let z0 = -params.h; z0 <= 0; z0 += params.gridSpacing) {
                const pos = calculateParticlePosition(x0, z0, time, params, theta0);
                drawParticle(context, pos, params.h);
            }
        }

        // Start a new animation frame
        animationFrameId = requestAnimationFrame(() => drawWave(context, params, canvasElement));
    }

    // Calculate position of a particle based on wave parameters, time, and theta0
    function calculateParticlePosition(x0, z0, t, params, theta0) {
        const theta = params.k * x0 - params.w * t + theta0;
        const x = x0 - params.a * Math.cosh(params.k * (z0 + params.h)) / Math.sinh(params.k * params.h) * Math.sin(theta);
        const z = z0 + params.a * Math.sinh(params.k * (z0 + params.h)) / Math.sinh(params.k * params.h) * Math.cos(theta);
        return { x, z };
    }

    // Draw a particle on the canvas at the calculated position
    function drawParticle(context, pos, h) {
        const canvasX = pos.x * 200 + context.canvas.width / 2;
        const canvasZ = context.canvas.height - (pos.z + h) * 200;
        context.beginPath();
        context.arc(canvasX, canvasZ, 2, 0, 2 * Math.PI);
        context.fill();
    }

    // Render the graph displaying the tanh function related to wave properties
    function drawGraph(context, params, canvasElement) {
        const maxKh = 4;
        const graphWidth = canvasElement.width;
        const graphHeight = canvasElement.height;

        clearGraph(context, graphWidth, graphHeight);
        shadeBackground(context, graphWidth, graphHeight, maxKh);
        drawGraphGrid(context, graphWidth, graphHeight, maxKh);
        plotTanhGraph(context, maxKh, graphWidth, graphHeight);
        highlightCurrentPointOnGraph(context, params, maxKh, graphWidth, graphHeight);
    }

    // Clears the graph canvas for redrawing
    function clearGraph(context, width, height) {
        context.clearRect(0, 0, width, height);
    }

    // Shades the background of the graph to indicate shallow, intermediate, and deep water regions
    function shadeBackground(context, width, height, maxKh) {
        const shallowLimit = Math.PI / 10;
        const deepLimit = Math.PI;

        // Shallow region (k h < pi/10)
        context.fillStyle = '#add8e6'; // Light blue for shallow
        context.fillRect(0, 0, (shallowLimit / maxKh) * width, height);

        // Intermediate region (pi/10 < k h < pi)
        context.fillStyle = '#8899e0';
        context.fillRect((shallowLimit / maxKh) * width, 0, (deepLimit / maxKh) * width, height);

        // Deep region (k h > pi)
        context.fillStyle = '#566cd9'; // Medium blue for deep
        context.fillRect((deepLimit / maxKh) * width, 0, width - (deepLimit / maxKh) * width, height);

    }

    // Draws grid lines on the graph for better visualization
    function drawGraphGrid(context, width, height, maxKh) {
        context.strokeStyle = '#e0e0e0';
        const gridStep = 0.1;

        context.beginPath();
        for (let x = 0; x <= width; x += (gridStep / maxKh) * width) {
            context.moveTo(x, 0);
            context.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += (gridStep / maxKh) * height) {
            context.moveTo(0, y);
            context.lineTo(width, y);
        }
        context.stroke();
    }

    // Plot the tanh(kh) graph, representing the wave's dispersion relation
    function plotTanhGraph(context, maxKh, width, height) {
        context.strokeStyle = '#000000';
        context.beginPath();
        context.moveTo(0, height);

        for (let x = 0; x <= maxKh; x += 0.05) {
            const y = Math.tanh(x);
            const graphX = (x / maxKh) * width;
            const graphY = height - (y * height);
            context.lineTo(graphX, graphY);
        }
        context.stroke();
    }

    // Emphasizes the current parameter values on the graph
    function highlightCurrentPointOnGraph(context, params, maxKh, width, height) {
        const currentKh = params.k * params.h;
        const currentTanKh = Math.tanh(currentKh);
        const pointX = (currentKh / maxKh) * width;
        const pointY = height - (currentTanKh * height);

        context.beginPath();
        context.arc(pointX, pointY, 5, 0, 2 * Math.PI);
        context.fillStyle = 'red';
        context.fill();
    }

    function displayDependentParameters(params) {
        const v = `v = ${(params.w / params.k).toFixed(2)}`;
        const lambda = `\\lambda = ${(2 * Math.PI / params.k).toFixed(2)}`;
        const hOverLambda = `\\frac{h}{\\lambda} = ${(params.h / (2 * Math.PI / params.k)).toFixed(2)}`;
        const kh = `kh = ${(params.h * params.k).toFixed(2)}`;
        const tanhKH = `\\tanh(hk) = ${Math.tanh(params.k * params.h).toFixed(2)}`;
        const omega = `\\omega = ${params.w.toFixed(2)}`;
    
        updateMathContent('valueV', v);
        updateMathContent('valueLambda', lambda);
        updateMathContent('valueHOverLambda', hOverLambda);
        updateMathContent('valueKH', kh);
        updateMathContent('valueTanhKH', tanhKH);
        updateMathContent('valueOmega', omega);
    }
    
    function updateMathContent(elementId, mathContent) {
        const element = document.getElementById(elementId);
        element.textContent = mathContent;
        katex.render(mathContent, element, {
            throwOnError: false
        });
    }

    // Initial draw call to kickstart the visualization
    drawAll();
});
