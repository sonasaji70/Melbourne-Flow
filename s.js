// ml5-pose.js - ML5 PoseNet for body and gesture detection

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

// Gesture detection variables
let handRaised = false;
let armsSpread = false;
let bodyMovementSpeed = 0;

// Video and detection settings
let videoReady = false;
let detectionConfidence = 0.5;

function setupML5() {
    // Create video capture
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();
    
    // Create PoseNet
    poseNet = ml5.poseNet(video, {
        architecture: 'MobileNetV1',
        imageScaleFactor: 0.3,
        outputStride: 16,
        flipHorizontal: true,
        minConfidence: detectionConfidence,
        maxPoseDetections: 2,
        scoreThreshold: 0.5,
        nmsRadius: 20,
        detectionType: 'single',
        inputResolution: 513,
        multiplier: 0.75,
        quantBytes: 2
    }, modelReady);
    
    // Listen for pose events
    poseNet.on('pose', function(results) {
        poses = results;
        processPoses();
    });
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
        
        // Get first detected person
        let pose = poses[0].pose;
        
        // Store keypoints
        bodyKeypoints = pose.keypoints;
        bodySkeleton = poses[0].skeleton;
        
        // Calculate body center
        calculateBodyCenter();
        
        // Calculate body velocity
        calculateBodyVelocity();
        
        // Detect gestures
        detectGestures();
    } else {
        bodyCenter = null;
        bodyVelocity = null;
        gestureState = "idle";
    }
}

function calculateBodyCenter() {
    if (bodyKeypoints.length === 0) return;
    
    let sumX = 0;
    let sumY = 0;
    let count = 0;
    
    // Calculate center from visible keypoints
    for (let kp of bodyKeypoints) {
        if (kp.score > detectionConfidence) {
            // Map video coordinates to canvas coordinates
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
    
    // Get key body parts
    let nose = getKeypoint('nose');
    let leftWrist = getKeypoint('leftWrist');
    let rightWrist = getKeypoint('rightWrist');
    let leftShoulder = getKeypoint('leftShoulder');
    let rightShoulder = getKeypoint('rightShoulder');
    let leftHip = getKeypoint('leftHip');
    let rightHip = getKeypoint('rightHip');
    
    // Detect hand raised
    if (leftWrist && leftShoulder && nose) {
        if (leftWrist.position.y < nose.position.y) {
            handRaised = true;
            gestureState = "hand_raised";
        }
    }
    if (rightWrist && rightShoulder && nose) {
        if (rightWrist.position.y < nose.position.y) {
            handRaised = true;
            gestureState = "hand_raised";
        }
    }
    
    // Detect arms spread
    if (leftWrist && rightWrist && leftShoulder && rightShoulder) {
        let shoulderWidth = dist(leftShoulder.position.x, leftShoulder.position.y,
                                rightShoulder.position.x, rightShoulder.position.y);
        let armSpan = dist(leftWrist.position.x, leftWrist.position.y,
                          rightWrist.position.x, rightWrist.position.y);
        
        if (armSpan > shoulderWidth * 1.8) {
            armsSpread = true;
            gestureState = "arms_spread";
        }
    }
    
    // Detect movement gesture
    if (bodyMovementSpeed > 5) {
        gestureState = "moving";
    }
    
    // Reset gesture flags if not detected
    if (!handRaised && !armsSpread && bodyMovementSpeed < 5) {
        gestureState = "idle";
    }
}

function getKeypoint(name) {
    for (let kp of bodyKeypoints) {
        if (kp.part === name && kp.score > detectionConfidence) {
            return kp;
        }
    }
    return null;
}

function drawBodyDetection() {
    if (!bodyDetected) return;
    
    push();
    
    // Draw skeleton connections
    stroke(0, 255, 150, 180);
    strokeWeight(3);
    for (let i = 0; i < bodySkeleton.length; i++) {
        let a = bodySkeleton[i][0];
        let b = bodySkeleton[i][1];
        
        if (a.score > detectionConfidence && b.score > detectionConfidence) {
            let ax = map(a.position.x, 0, video.width, 0, width);
            let ay = map(a.position.y, 0, video.height, 0, height);
            let bx = map(b.position.x, 0, video.width, 0, width);
            let by = map(b.position.y, 0, video.height, 0, height);
            line(ax, ay, bx, by);
        }
    }
    
    // Draw keypoints
    for (let kp of bodyKeypoints) {
        if (kp.score > detectionConfidence) {
            let x = map(kp.position.x, 0, video.width, 0, width);
            let y = map(kp.position.y, 0, video.height, 0, height);
            
            fill(255, 100, 100, 200);
            noStroke();
            ellipse(x, y, 12, 12);
            
            // Label keypoint
            fill(255, 255, 255, 200);
            textSize(10);
            textAlign(CENTER);
            text(kp.part, x, y - 15);
        }
    }
    
    // Draw body center
    if (bodyCenter) {
        fill(255, 200, 0, 200);
        noStroke();
        ellipse(bodyCenter.x, bodyCenter.y, 20, 20);
        
        // Draw velocity vector
        if (bodyVelocity) {
            stroke(255, 200, 0, 200);
            strokeWeight(2);
            let velScale = 5;
            line(bodyCenter.x, bodyCenter.y, 
                 bodyCenter.x + bodyVelocity.x * velScale, 
                 bodyCenter.y + bodyVelocity.y * velScale);
        }
    }
    
    // Gesture state indicator
    fill(255, 255, 255, 220);
    noStroke();
    textSize(16);
    textAlign(LEFT);
    text('Gesture: ' + gestureState, 20, height - 80);
    text('Movement: ' + bodyMovementSpeed.toFixed(2), 20, height - 60);
    
    pop();
}
function drawBodySilhouette() {
    if (!bodyDetected) return;
    
    push();
    
    // Draw filled body parts as ellipses for better shape
    fill(0, 0, 0, 200); // Solid black
    noStroke();
    
    // Draw head (larger circle)
    let nose = getKeypoint('nose');
    if (nose) {
        let x = map(nose.position.x, 0, video.width, 0, width);
        let y = map(nose.position.y, 0, video.height, 0, height);
        ellipse(x, y, 120, 140); // Head
    }
    
    // Draw torso (rectangle between shoulders and hips)
    let leftShoulder = getKeypoint('leftShoulder');
    let rightShoulder = getKeypoint('rightShoulder');
    let leftHip = getKeypoint('leftHip');
    let rightHip = getKeypoint('rightHip');
    
    if (leftShoulder && rightShoulder && leftHip && rightHip) {
        let lsx = map(leftShoulder.position.x, 0, video.width, 0, width);
        let lsy = map(leftShoulder.position.y, 0, video.height, 0, height);
        let rsx = map(rightShoulder.position.x, 0, video.width, 0, width);
        let rsy = map(rightShoulder.position.y, 0, video.height, 0, height);
        let lhx = map(leftHip.position.x, 0, video.width, 0, width);
        let lhy = map(leftHip.position.y, 0, video.height, 0, height);
        let rhx = map(rightHip.position.x, 0, video.width, 0, width);
        let rhy = map(rightHip.position.y, 0, video.height, 0, height);
        
        // Draw torso as a quad
        beginShape();
        vertex(lsx, lsy);
        vertex(rsx, rsy);
        vertex(rhx, rhy);
        vertex(lhx, lhy);
        endShape(CLOSE);
    }
    
    // Draw limbs as thick lines with rounded caps
    strokeWeight(50);
    strokeCap(ROUND);
    stroke(0, 0, 0, 200);
    
    // Draw arms
    drawLimb('leftShoulder', 'leftElbow');
    drawLimb('leftElbow', 'leftWrist');
    drawLimb('rightShoulder', 'rightElbow');
    drawLimb('rightElbow', 'rightWrist');
    
    // Draw legs
    drawLimb('leftHip', 'leftKnee');
    drawLimb('leftKnee', 'leftAnkle');
    drawLimb('rightHip', 'rightKnee');
    drawLimb('rightKnee', 'rightAnkle');
    
    // Draw white skeleton on top
    stroke(255, 255, 255, 250);
    strokeWeight(3);
    strokeCap(ROUND);
    
    for (let i = 0; i < bodySkeleton.length; i++) {
        let a = bodySkeleton[i][0];
        let b = bodySkeleton[i][1];
        
        if (a.score > detectionConfidence && b.score > detectionConfidence) {
            let ax = map(a.position.x, 0, video.width, 0, width);
            let ay = map(a.position.y, 0, video.height, 0, height);
            let bx = map(b.position.x, 0, video.width, 0, width);
            let by = map(b.position.y, 0, video.height, 0, height);
            line(ax, ay, bx, by);
        }
    }
    
    // Draw white keypoint dots
    fill(255, 255, 255, 250);
    noStroke();
    for (let kp of bodyKeypoints) {
        if (kp.score > detectionConfidence) {
            let x = map(kp.position.x, 0, video.width, 0, width);
            let y = map(kp.position.y, 0, video.height, 0, height);
            ellipse(x, y, 12, 12);
        }
    }
    
    pop();
}

// Helper function to draw limbs
function drawLimb(startPoint, endPoint) {
    let start = getKeypoint(startPoint);
    let end = getKeypoint(endPoint);
    
    if (start && end) {
        let sx = map(start.position.x, 0, video.width, 0, width);
        let sy = map(start.position.y, 0, video.height, 0, height);
        let ex = map(end.position.x, 0, video.width, 0, width);
        let ey = map(end.position.y, 0, video.height, 0, height);
        line(sx, sy, ex, ey);
    }
}

function applyBodyForceToParticles() {
    if (!bodyDetected || !bodyCenter) return;
    
    for (let particle of particles) {
        let d = dist(particle.pos.x, particle.pos.y, bodyCenter.x, bodyCenter.y);
        
        // Engulf around body - create attraction/repulsion zones
        let bodyRadius = 150;
        let engulfRadius = 250;
        
        if (d < bodyRadius) {
            // Repel from body center (push away)
            let repel = p5.Vector.sub(particle.pos, bodyCenter);
            repel.normalize();
            repel.mult(map(d, 0, bodyRadius, 0.3, 0.05));
            particle.applyForce(repel);
        } else if (d < engulfRadius) {
            // Attract around body (engulf)
            let attract = p5.Vector.sub(bodyCenter, particle.pos);
            attract.normalize();
            attract.mult(map(d, bodyRadius, engulfRadius, 0.05, 0.15));
            particle.applyForce(attract);
        }
        
        // Move with body velocity
        if (bodyVelocity && bodyMovementSpeed > 2) {
            let follow = bodyVelocity.copy();
            follow.mult(0.1);
            particle.applyForce(follow);
        }
        
        // Apply gesture-based forces
        applyGestureForces(particle);
    }
}

function applyGestureForces(particle) {
    if (!bodyDetected) return;
    
    // Hand raised - particles lift up
    if (gestureState === "hand_raised") {
        let lift = createVector(0, -0.05);
        particle.applyForce(lift);
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
        // Stop pose detection
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
        // Restart pose detection
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

// Get body outline for particle engulfing
function getBodyOutline() {
    if (!bodyDetected) return [];
    
    let outline = [];
    
    // Create outline from keypoints
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