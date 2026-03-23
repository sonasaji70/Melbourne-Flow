// ml5-pose.js - ML5 PoseNet with Enhanced Gesture Detection (Spirals & Fractals)

let video;
let poseNet;
let poses = [];
let bodySkeleton = [];
let bodyDetected = false;
let gestureState = "idle";
let poseDetectionEnabled = true;

// Body parts tracking
let bodyKeypoints = [];
let bodyCenter = null;
let previousBodyCenter = null;
let bodyVelocity = null;

// ENHANCED GESTURE DETECTION
let handRaised = false;
let armsSpread = false;
let bodyMovementSpeed = 0;
let leftHandRaised = false;
let rightHandRaised = false;
let bothHandsRaised = false;
let oneHandRaised = false;

// Video and detection settings
let videoReady = false;
let detectionConfidence = 0.3;

// Spiral and fractal animation variables
let spiralAngle = 0;
let fractalDepth = 0;
let fractalAnimTime = 0;

function setupML5() {
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();
    
    poseNet = ml5.poseNet(video, {
        architecture: 'MobileNetV1',
        imageScaleFactor: 0.3,
        outputStride: 16,
        flipHorizontal: true,
        minConfidence: 0.3,
        maxPoseDetections: 5,
        scoreThreshold: 0.3,
        nmsRadius: 30,
        detectionType: 'multiple',
        inputResolution: 513,
        multiplier: 0.75,
        quantBytes: 2
    }, modelReady);
    
    poseNet.on('pose', function(results) {
        poses = results;
        processPoses();
    });
    
    console.log('ML5 PoseNet initialized with enhanced gesture detection');
}

function modelReady() {
    console.log('PoseNet Model Loaded!');
    videoReady = true;
}

function processPoses() {
    bodyKeypoints = [];
    bodySkeleton = [];
    bodyDetected = false;
    
    if (poses.length > 0) {
        bodyDetected = true;
        let pose = poses[0].pose;
        bodyKeypoints = pose.keypoints;
        bodySkeleton = poses[0].skeleton;
        calculateBodyCenter();
        calculateBodyVelocity();
        detectGestures();
    } else {
        bodyCenter = null;
        bodyVelocity = null;
        gestureState = "idle";
        resetGestureFlags();
    }
}

function calculateBodyCenter() {
    if (bodyKeypoints.length === 0) return;
    
    let sumX = 0;
    let sumY = 0;
    let count = 0;
    
    for (let kp of bodyKeypoints) {
        if (kp.score > detectionConfidence) {
            sumX += map(kp.position.x, 0, video.width, 0, width);
            sumY += map(kp.position.y, 0, video.height, 0, height);
            count++;
        }
    }
    
    if (count > 0) {
        previousBodyCenter = bodyCenter;
        bodyCenter = createVector(sumX / count, sumY / count);
    }
}

function calculateBodyVelocity() {
    if (bodyCenter && previousBodyCenter) {
        bodyVelocity = p5.Vector.sub(bodyCenter, previousBodyCenter);
        bodyMovementSpeed = bodyVelocity.mag();
    } else {
        bodyVelocity = createVector(0, 0);
        bodyMovementSpeed = 0;
    }
}

function detectGestures() {
    if (bodyKeypoints.length === 0) return;
    
    resetGestureFlags();
    
    let nose = getKeypoint('nose');
    let leftWrist = getKeypoint('leftWrist');
    let rightWrist = getKeypoint('rightWrist');
    let leftShoulder = getKeypoint('leftShoulder');
    let rightShoulder = getKeypoint('rightShoulder');
    let leftElbow = getKeypoint('leftElbow');
    let rightElbow = getKeypoint('rightElbow');
    
    // ENHANCED: Detect individual hands raised with RELAXED threshold
    if (leftWrist && leftShoulder && leftElbow) {
        // Left hand is raised if wrist is above elbow AND above shoulder level
        // RELAXED: Increased threshold from 50 to 80 pixels below nose
        if (leftWrist.position.y < leftElbow.position.y && 
            leftWrist.position.y < leftShoulder.position.y + 30) {
            leftHandRaised = true;
            console.log("LEFT HAND DETECTED!");
        }
    }
    
    if (rightWrist && rightShoulder && rightElbow) {
        // Right hand is raised if wrist is above elbow AND above shoulder level
        if (rightWrist.position.y < rightElbow.position.y && 
            rightWrist.position.y < rightShoulder.position.y + 30) {
            rightHandRaised = true;
            console.log("RIGHT HAND DETECTED!");
        }
    }
    
    // Determine gesture state based on hands
    if (leftHandRaised && rightHandRaised) {
        bothHandsRaised = true;
        oneHandRaised = false;
        handRaised = true;
        gestureState = "both_hands_raised";
        fractalAnimTime += 0.02;
        console.log("✋✋ BOTH HANDS RAISED - FRACTALS ACTIVE!");
    } else if (leftHandRaised || rightHandRaised) {
        oneHandRaised = true;
        bothHandsRaised = false;
        handRaised = true;
        gestureState = "one_hand_raised";
        spiralAngle += 0.08;
        console.log("✋ ONE HAND RAISED - SPIRALS ACTIVE!");
    } else {
        gestureState = "idle";
    }
    
    // Detect arms spread (existing)
    if (leftWrist && rightWrist && leftShoulder && rightShoulder) {
        let shoulderWidth = dist(leftShoulder.position.x, leftShoulder.position.y,
                                rightShoulder.position.x, rightShoulder.position.y);
        let armSpan = dist(leftWrist.position.x, leftWrist.position.y,
                          rightWrist.position.x, rightWrist.position.y);
        
        if (armSpan > shoulderWidth * 1.8) {
            armsSpread = true;
            if (gestureState === "idle") {
                gestureState = "arms_spread";
            }
        }
    }
    
    // Detect movement (existing)
    if (bodyMovementSpeed > 5 && gestureState === "idle") {
        gestureState = "moving";
    }
}

function resetGestureFlags() {
    handRaised = false;
    armsSpread = false;
    leftHandRaised = false;
    rightHandRaised = false;
    bothHandsRaised = false;
    oneHandRaised = false;
}

function getKeypoint(name) {
    for (let kp of bodyKeypoints) {
        if (kp.part === name && kp.score > detectionConfidence) {
            return kp;
        }
    }
    return null;
}

// NEURAL NETWORK SILHOUETTE VISUALIZATION
function drawBodySilhouette() {
    if (!bodyDetected || poses.length === 0) return;
    
    push();
    
    for (let i = 0; i < poses.length; i++) {
        let pose = poses[i].pose;
        let skeleton = poses[i].skeleton;
        let personKeypoints = pose.keypoints;
        
        let personHue = (i * 137.5) % 360;
        colorMode(HSB, 360, 100, 100);
        let personColor = color(personHue, 70, 90);
        colorMode(RGB, 255);
        
        drawNeuralNetwork(personKeypoints, skeleton, personColor, i);
    }
    
    pop();
}

function drawNeuralNetwork(keypoints, skeleton, personColor, personIndex) {
    let nodes = [];
    
    for (let kp of keypoints) {
        if (kp.score > detectionConfidence) {
            let x = map(kp.position.x, 0, video.width, 0, width);
            let y = map(kp.position.y, 0, video.height, 0, height);
            
            nodes.push({
                x: x,
                y: y,
                part: kp.part,
                score: kp.score
            });
        }
    }
    
    // Draw silhouette body parts
    drawBodyParts(keypoints, personColor, personIndex);
    
    // Draw neural connections (skeleton)
    strokeWeight(2);
    for (let i = 0; i < skeleton.length; i++) {
        let a = skeleton[i][0];
        let b = skeleton[i][1];
        
        if (a.score > detectionConfidence && b.score > detectionConfidence) {
            let ax = map(a.position.x, 0, video.width, 0, width);
            let ay = map(a.position.y, 0, video.height, 0, height);
            let bx = map(b.position.x, 0, video.width, 0, width);
            let by = map(b.position.y, 0, video.height, 0, height);
            
            drawGradientLine(ax, ay, bx, by, personColor);
            
            let pulse = sin(frameCount * 0.05 + i) * 0.5 + 0.5;
            stroke(255, 255, 255, 150 * pulse);
            strokeWeight(1);
            line(ax, ay, bx, by);
        }
    }
    
    // Draw neural nodes (keypoints)
    for (let node of nodes) {
        noStroke();
        fill(red(personColor), green(personColor), blue(personColor), 50);
        ellipse(node.x, node.y, 30, 30);
        
        fill(red(personColor), green(personColor), blue(personColor), 100);
        ellipse(node.x, node.y, 20, 20);
        
        fill(255, 255, 255, 230);
        ellipse(node.x, node.y, 10, 10);
        
        let pulse = sin(frameCount * 0.1) * 5 + 10;
        stroke(255, 255, 255, 100);
        strokeWeight(2);
        noFill();
        ellipse(node.x, node.y, pulse, pulse);
    }
    
    drawNeuralMesh(nodes, personColor);
}

function drawBodyParts(keypoints, personColor, personIndex) {
    fill(0, 0, 0, 180);
    noStroke();
    
    let nose = findKeypoint(keypoints, 'nose');
    if (nose) {
        let x = map(nose.position.x, 0, video.width, 0, width);
        let y = map(nose.position.y, 0, video.height, 0, height);
        ellipse(x, y, 100, 120);
    }
    
    let leftShoulder = findKeypoint(keypoints, 'leftShoulder');
    let rightShoulder = findKeypoint(keypoints, 'rightShoulder');
    let leftHip = findKeypoint(keypoints, 'leftHip');
    let rightHip = findKeypoint(keypoints, 'rightHip');
    
    if (leftShoulder && rightShoulder && leftHip && rightHip) {
        beginShape();
        vertex(map(leftShoulder.position.x, 0, video.width, 0, width), 
               map(leftShoulder.position.y, 0, video.height, 0, height));
        vertex(map(rightShoulder.position.x, 0, video.width, 0, width), 
               map(rightShoulder.position.y, 0, video.height, 0, height));
        vertex(map(rightHip.position.x, 0, video.width, 0, width), 
               map(rightHip.position.y, 0, video.height, 0, height));
        vertex(map(leftHip.position.x, 0, video.width, 0, width), 
               map(leftHip.position.y, 0, video.height, 0, height));
        endShape(CLOSE);
    }
    
    stroke(0, 0, 0, 180);
    strokeWeight(40);
    strokeCap(ROUND);
    
    drawLimbPart(keypoints, 'leftShoulder', 'leftElbow');
    drawLimbPart(keypoints, 'leftElbow', 'leftWrist');
    drawLimbPart(keypoints, 'rightShoulder', 'rightElbow');
    drawLimbPart(keypoints, 'rightElbow', 'rightWrist');
    drawLimbPart(keypoints, 'leftHip', 'leftKnee');
    drawLimbPart(keypoints, 'leftKnee', 'leftAnkle');
    drawLimbPart(keypoints, 'rightHip', 'rightKnee');
    drawLimbPart(keypoints, 'rightKnee', 'rightAnkle');
}

function drawLimbPart(keypoints, startName, endName) {
    let start = findKeypoint(keypoints, startName);
    let end = findKeypoint(keypoints, endName);
    
    if (start && end) {
        let sx = map(start.position.x, 0, video.width, 0, width);
        let sy = map(start.position.y, 0, video.height, 0, height);
        let ex = map(end.position.x, 0, video.width, 0, width);
        let ey = map(end.position.y, 0, video.height, 0, height);
        line(sx, sy, ex, ey);
    }
}

function drawGradientLine(x1, y1, x2, y2, col) {
    let steps = 20;
    for (let i = 0; i < steps; i++) {
        let t = i / steps;
        let x = lerp(x1, x2, t);
        let y = lerp(y1, y2, t);
        let nextX = lerp(x1, x2, (i + 1) / steps);
        let nextY = lerp(y1, y2, (i + 1) / steps);
        
        let alpha = map(i, 0, steps, 200, 100);
        stroke(red(col), green(col), blue(col), alpha);
        strokeWeight(3);
        line(x, y, nextX, nextY);
    }
}

function drawNeuralMesh(nodes, personColor) {
    stroke(red(personColor), green(personColor), blue(personColor), 30);
    strokeWeight(1);
    
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            let d = dist(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
            
            if (d < 200) {
                let alpha = map(d, 0, 200, 50, 0);
                stroke(255, 255, 255, alpha);
                line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
            }
        }
    }
}

function findKeypoint(keypoints, name) {
    for (let kp of keypoints) {
        if (kp.part === name && kp.score > detectionConfidence) {
            return kp;
        }
    }
    return null;
}

// ===========================================
// SPIRAL EFFECTS (ONE HAND RAISED)
// ===========================================
function drawParticleSpirals() {
    if (!oneHandRaised) return;
    
    push();
    
    for (let particle of particles) {
        // Draw BRIGHT WHITE spiral overlapping particle center
        drawWhiteSpiral(particle.pos.x, particle.pos.y, particle.radius, spiralAngle);
    }
    
    pop();
}

function drawWhiteSpiral(cx, cy, radius, baseAngle) {
    push();
    
    // Draw multiple layers for visibility
    let numArms = 4; // More arms for fuller look
    let maxRadius = radius * 3; // Even larger spiral
    let rotations = 2.5;
    
    // OUTER GLOW LAYER (thickest, most transparent)
    noFill();
    strokeWeight(8);
    for (let arm = 0; arm < numArms; arm++) {
        let armOffset = (TWO_PI / numArms) * arm;
        
        beginShape();
        for (let i = 0; i <= 80; i++) {
            let t = i / 80;
            let angle = baseAngle + armOffset + (t * TWO_PI * rotations);
            let r = t * maxRadius;
            
            let x = cx + cos(angle) * r;
            let y = cy + sin(angle) * r;
            
            let alpha = map(t, 0, 1, 100, 0);
            stroke(255, 255, 255, alpha);
            vertex(x, y);
        }
        endShape();
    }
    
    // MIDDLE GLOW LAYER
    strokeWeight(4);
    for (let arm = 0; arm < numArms; arm++) {
        let armOffset = (TWO_PI / numArms) * arm;
        
        beginShape();
        for (let i = 0; i <= 80; i++) {
            let t = i / 80;
            let angle = baseAngle + armOffset + (t * TWO_PI * rotations);
            let r = t * maxRadius;
            
            let x = cx + cos(angle) * r;
            let y = cy + sin(angle) * r;
            
            let alpha = map(t, 0, 1, 180, 0);
            stroke(255, 255, 255, alpha);
            vertex(x, y);
        }
        endShape();
    }
    
    // BRIGHT CORE LAYER (most visible)
    strokeWeight(2.5);
    for (let arm = 0; arm < numArms; arm++) {
        let armOffset = (TWO_PI / numArms) * arm;
        
        beginShape();
        for (let i = 0; i <= 80; i++) {
            let t = i / 80;
            let angle = baseAngle + armOffset + (t * TWO_PI * rotations);
            let r = t * maxRadius;
            
            let x = cx + cos(angle) * r;
            let y = cy + sin(angle) * r;
            
            let alpha = map(t, 0, 1, 255, 20); // Brighter, stays visible longer
            stroke(255, 255, 255, alpha);
            vertex(x, y);
        }
        endShape();
    }
    
    // CENTER GLOW - bright spot at particle center
    noStroke();
    fill(255, 255, 255, 150);
    ellipse(cx, cy, 20, 20);
    fill(255, 255, 255, 220);
    ellipse(cx, cy, 10, 10);
    
    pop();
}

// ===========================================
// FRACTAL EFFECTS (BOTH HANDS RAISED)
// ===========================================
function drawParticleFractals() {
    if (!bothHandsRaised) return;
    
    push();
    
    for (let particle of particles) {
        // Draw colorful straight line fractals in different directions
        drawColorfulLineFractals(particle.pos.x, particle.pos.y, particle.radius, fractalAnimTime);
    }
    
    pop();
}

function drawColorfulLineFractals(cx, cy, radius, animTime) {
    push();
    translate(cx, cy);
    
    // Number of fractal lines emanating from center
    let numLines = 8;
    let baseLength = radius * 2;
    
    // Define vibrant color palette - SOLID COLORS (no white mixing)
    let colors = [
        [255, 0, 100],    // Hot Pink
        [0, 255, 180],    // Cyan
        [255, 180, 0],    // Gold
        [150, 0, 255],    // Purple
        [255, 80, 0],     // Orange
        [0, 180, 255],    // Sky Blue
        [180, 255, 0],    // Lime
        [255, 0, 200]     // Magenta
    ];
    
    for (let i = 0; i < numLines; i++) {
        let angle = (TWO_PI / numLines) * i;
        let colorIndex = i % colors.length;
        let col = colors[colorIndex];
        
        // Animate angle slightly for organic movement
        let angleVariation = sin(animTime * 2 + i) * 0.2;
        angle += angleVariation;
        
        // Pulsing length
        let lengthPulse = 1 + sin(animTime * 3 + i * 0.5) * 0.3;
        let length = baseLength * lengthPulse;
        
        // Draw straight line fractal
        drawColorfulFractalLine(0, 0, angle, length, 4, col, animTime + i);
    }
    
    pop();
}

function drawColorfulFractalLine(x, y, angle, length, depth, col, animTime) {
    if (depth === 0 || length < 3) return;
    
    // Calculate end point
    let x2 = x + cos(angle) * length;
    let y2 = y + sin(angle) * length;
    
    // Pulsing alpha based on depth
    let pulse = sin(animTime * 2 + depth) * 0.3 + 0.7;
    let alpha = map(depth, 0, 4, 120, 255) * pulse;
    
    // Draw main line with glow - PURE COLOR
    strokeWeight(depth * 2);
    stroke(col[0], col[1], col[2], alpha * 0.4);
    line(x, y, x2, y2);
    
    strokeWeight(depth * 1.2);
    stroke(col[0], col[1], col[2], alpha);
    line(x, y, x2, y2);
    
    // Colorful endpoint - NO WHITE
    noStroke();
    fill(col[0], col[1], col[2], alpha * 0.7);
    ellipse(x2, y2, depth * 4, depth * 4);
    fill(col[0], col[1], col[2], alpha);
    ellipse(x2, y2, depth * 2, depth * 2);
    
    // Continue straight line with decreasing length
    let newLength = length * 0.7;
    
    // Draw continuation of straight line
    drawColorfulFractalLine(x2, y2, angle, newLength, depth - 1, col, animTime);
    
    // Optional: Add slight branches at intervals
    if (depth % 2 === 0) {
        let branchAngle = PI / 6; // 30 degree branches
        drawColorfulFractalLine(x2, y2, angle - branchAngle, newLength * 0.5, depth - 1, col, animTime);
        drawColorfulFractalLine(x2, y2, angle + branchAngle, newLength * 0.5, depth - 1, col, animTime);
    }
}

// ===========================================
// PARTICLE INTERACTION FUNCTIONS
// ===========================================
function applyBodyForceToParticles() {
    if (!bodyDetected || !bodyCenter) return;
    
    for (let particle of particles) {
        let d = dist(particle.pos.x, particle.pos.y, bodyCenter.x, bodyCenter.y);
        
        let bodyRadius = 150;
        let engulfRadius = 250;
        
        if (d < bodyRadius) {
            let repel = p5.Vector.sub(particle.pos, bodyCenter);
            repel.normalize();
            repel.mult(map(d, 0, bodyRadius, 0.3, 0.05));
            particle.applyForce(repel);
        } else if (d < engulfRadius) {
            let attract = p5.Vector.sub(bodyCenter, particle.pos);
            attract.normalize();
            attract.mult(map(d, bodyRadius, engulfRadius, 0.05, 0.15));
            particle.applyForce(attract);
        }
        
        if (bodyVelocity && bodyMovementSpeed > 2) {
            let follow = bodyVelocity.copy();
            follow.mult(0.1);
            particle.applyForce(follow);
        }
        
        applyGestureForces(particle);
    }
}

function applyGestureForces(particle) {
    if (!bodyDetected) return;
    
    // ONE HAND RAISED - Spiral rotation force
    if (gestureState === "one_hand_raised") {
        let lift = createVector(0, -0.05);
        particle.applyForce(lift);
        
        // Add rotational force for spiral effect
        if (bodyCenter) {
            let toCenter = p5.Vector.sub(bodyCenter, particle.pos);
            let perpendicular = createVector(-toCenter.y, toCenter.x);
            perpendicular.normalize();
            perpendicular.mult(0.03);
            particle.applyForce(perpendicular);
        }
    }
    
    // BOTH HANDS RAISED - Fractal expansion/contraction
    if (gestureState === "both_hands_raised") {
        if (bodyCenter) {
            let toCenter = p5.Vector.sub(particle.pos, bodyCenter);
            let distance = toCenter.mag();
            
            // Pulsing fractal behavior
            let pulse = sin(fractalAnimTime * 3 + distance * 0.01);
            toCenter.normalize();
            toCenter.mult(pulse * 0.1);
            particle.applyForce(toCenter);
        }
    }
    
    // Arms spread - particles expand outward
    if (gestureState === "arms_spread") {
        if (bodyCenter) {
            let expand = p5.Vector.sub(particle.pos, bodyCenter);
            expand.normalize();
            expand.mult(0.08);
            particle.applyForce(expand);
        }
    }
    
    // Moving - particles follow with turbulence
    if (gestureState === "moving" && bodyVelocity) {
        let turbulence = bodyVelocity.copy();
        turbulence.rotate(random(-PI/4, PI/4));
        turbulence.mult(0.15);
        particle.applyForce(turbulence);
    }
}

function applyBodyRepulsionToKeypoints(particle) {
    if (!bodyDetected) return;
    
    for (let kp of bodyKeypoints) {
        if (kp.score > detectionConfidence) {
            let kpX = map(kp.position.x, 0, video.width, 0, width);
            let kpY = map(kp.position.y, 0, video.height, 0, height);
            let d = dist(particle.pos.x, particle.pos.y, kpX, kpY);
            
            if (d < 80) {
                let repel = p5.Vector.sub(particle.pos, createVector(kpX, kpY));
                repel.normalize();
                repel.mult(map(d, 0, 80, 0.2, 0));
                particle.applyForce(repel);
            }
        }
    }
}

function togglePoseDetection() {
    poseDetectionEnabled = !poseDetectionEnabled;
    
    if (!poseDetectionEnabled) {
        if (video && video.elt && video.elt.srcObject) {
            video.elt.srcObject.getTracks().forEach(track => track.stop());
        }
        if (video) {
            video.hide();
        }
        bodyDetected = false;
        poses = [];
        bodyKeypoints = [];
        console.log('Pose detection stopped');
    } else {
        if (!video || !video.elt || !video.elt.srcObject) {
            setupML5();
            console.log('Pose detection restarting');
        } else {
            video.show();
            console.log('Pose detection resumed');
        }
    }
    
    return poseDetectionEnabled;
}

function getBodyOutline() {
    if (!bodyDetected) return [];
    
    let outline = [];
    let outlinePoints = [
        'nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar',
        'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow',
        'leftWrist', 'rightWrist', 'leftHip', 'rightHip',
        'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'
    ];
    
    for (let pointName of outlinePoints) {
        let kp = getKeypoint(pointName);
        if (kp) {
            let x = map(kp.position.x, 0, video.width, 0, width);
            let y = map(kp.position.y, 0, video.height, 0, height);
            outline.push(createVector(x, y));
        }
    }
    
    return outline;
}