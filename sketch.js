// sketch.js - Main P5.js Setup with Spiral & Fractal Effects
let particles = [];
let flowField = [];
let cols, rows;
let scl = 20;
let zoff = 0;
let sensorData = null;
let dataFactors = {
    temperature: { value: 20, color: [220, 20, 60], velocity: 1, count: 25 },
    humidity: { value: 50, color: [20, 20, 25], velocity: 1, count: 30 },
    pressure: { value: 1013, color: [90, 0, 160], velocity: 1, count: 20 },
    windSpeed: { value: 0, color: [0, 150, 255], velocity: 1, count: 25 },
    gustSpeed: { value: 0, color: [255, 0, 180], velocity: 1, count: 20 },
    pm25: { value: 0, color: [255, 170, 0], velocity: 1, count: 18 },
    pm10: { value: 0, color: [0, 200, 150], velocity: 1, count: 18 },
    noise: { value: 0, color: [200, 170, 255], velocity: 1, count: 22 }
};

function setup() {
    createCanvas(windowWidth, windowHeight);
    cols = floor(width / scl);
    rows = floor(height / scl);
    
    // Initialize flow field
    flowField = new Array(cols * rows);
    
    // Initialize particles for each data type
    let factorKeys = Object.keys(dataFactors);
    factorKeys.forEach(key => {
        let factor = dataFactors[key];
        for (let i = 0; i < factor.count; i++) {
            particles.push(new FluidParticle(key));
        }
    });
    
    // Fetch data
    fetchMelbourneData();
    setInterval(fetchMelbourneData, 900000);
}

function draw() {
    // Draw camera background when enabled
    if (typeof drawCameraBackground === 'function') {
        drawCameraBackground();
    } else {
        // Original fade effect when camera is off
        fill(10, 10, 20, 40);
        noStroke();
        rect(0, 0, width, height);
    }
    
    // Update flow field - very smooth wave motion
    updateFlowField();
    
    // Apply body interaction forces to particles
    if (typeof applyBodyInteraction === 'function') {
        applyBodyInteraction();
    }
    
    // Apply inter-particle forces for cohesion
    for (let i = 0; i < particles.length; i++) {
        let particle = particles[i];
        
        // Cohesion and separation forces
        let cohesion = calculateCohesion(particle, particles, 150);
        let separation = calculateSeparation(particle, particles, 100);
        
        cohesion.mult(0.05);
        separation.mult(0.08);
        
        particle.applyForce(cohesion);
        particle.applyForce(separation);
        
        particle.follow(flowField);
        particle.update();
        particle.edges();
    }
    
    // Draw all particles
    for (let particle of particles) {
        particle.show();
    }
    
    // *** NEW: Draw spiral effects when one hand is raised ***
    if (typeof drawParticleSpirals === 'function') {
        drawParticleSpirals();
    }
    
    // *** NEW: Draw fractal effects when both hands are raised ***
    if (typeof drawParticleFractals === 'function') {
        drawParticleFractals();
    }
    
    // Draw UI overlay (location pins, chart, legend)
    drawUI();
}

function mousePressed() {
    if (typeof checkChartButtonClick === 'function') {
        checkChartButtonClick(mouseX, mouseY);
    }
}

function updateFlowField() {
    let yoff = 0;
    for (let y = 0; y < rows; y++) {
        let xoff = 0;
        for (let x = 0; x < cols; x++) {
            let index = x + y * cols;
            let noiseVal = noise(xoff, yoff, zoff);
            let angle = map(noiseVal, 0, 1, -PI/3, PI/3);
            let v = p5.Vector.fromAngle(angle);
            v.setMag(0.15);
            flowField[index] = v;
            xoff += 0.05;
        }
        yoff += 0.05;
    }
    zoff += 0.001;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    cols = floor(width / scl);
    rows = floor(height / scl);
    flowField = new Array(cols * rows);
}