/* // gesture.js - Gesture-based Jelly Visual Controller
// Dependencies: ml5.js, p5.js, particle.js (FluidParticle)

let gestureActive = false;
let merging = false;
let rippleIntensity = 0;

function setupGestures() {
    setupML5(); // initialize PoseNet from your ml5-pose.js
}

// Called each frame to update gestures’ visual effects
function handleGestures() {
    if (!bodyDetected) return;

    // One hand raised → Ripple shimmer and expand blobs
    if (gestureState === "hand_raised") {
        gestureActive = true;
        merging = false;
        rippleIntensity = lerp(rippleIntensity, 1, 0.1);
        applyRippleEffectToJelly();
    }

    // Both hands raised → Merge blobs into cellular pattern
    else if (gestureState === "arms_spread") {
        gestureActive = true;
        rippleIntensity = 0;
        triggerCellularMerging();
    }

    // Idle → return blobs to calm state
    else {
        gestureActive = false;
        merging = false;
        rippleIntensity = lerp(rippleIntensity, 0, 0.05);
    }
}

// ✦ Make jelly structures pulse and ripple ✦
function applyRippleEffectToJelly() {
    for (let p of particles) {
        let pulse = sin(frameCount * 0.2 + p.offset) * 0.5 + 0.5;
        let lift = createVector(
            cos(p.angle + pulse) * 0.05,
            sin(p.angle - pulse) * 0.05
        );
        p.applyForce(lift);
        p.size = p.baseSize * (1.1 + 0.2 * pulse);
    }
}

// ✦ Trigger merging into cellular automata ✦
function triggerCellularMerging() {
    if (merging) return;
    merging = true;

    for (let p of particles) {
        let targetX = round(p.pos.x / 60) * 60;
        let targetY = round(p.pos.y / 60) * 60;
        let target = createVector(targetX, targetY);
        let toward = p5.Vector.sub(target, p.pos);
        toward.mult(0.03);
        p.applyForce(toward);
        p.size = lerp(p.size, 25, 0.05);
    }

    drawCellularConnections();
}

// ✦ Draw subtle glowing lines between close blobs when merged ✦
function drawCellularConnections() {
    push();
    blendMode(ADD);
    stroke(255, 255, 255, 30);
    strokeWeight(1.2);
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            let d = dist(
                particles[i].pos.x,
                particles[i].pos.y,
                particles[j].pos.x,
                particles[j].pos.y
            );
            if (d < 120) {
                let alpha = map(d, 0, 120, 100, 0);
                stroke(255, 255, 255, alpha);
                line(
                    particles[i].pos.x,
                    particles[i].pos.y,
                    particles[j].pos.x,
                    particles[j].pos.y
                );
            }
        }
    }
    pop();
}

// ✦ Draw shimmering jelly outer boundary ✦
function drawJellyGestures() {
    handleGestures();

    // Keep the body silhouette and core blobs untouched — just add shimmer
    push();
    noFill();
    blendMode(ADD);

    for (let p of particles) {
        // Outer organic shimmer (matches jelly curve)
        let r = p.size * (1.2 + 0.2 * sin(frameCount * 0.03 + p.offset));
        let baseCol = color(p.color);
        baseCol.setAlpha(40 + 20 * sin(frameCount * 0.05 + p.offset));
        stroke(baseCol);
        strokeWeight(2);
        ellipse(p.pos.x, p.pos.y, r * 2);

        // Overlapping circular shimmer waves for motion
        let rippleCount = 3;
        for (let i = 0; i < rippleCount; i++) {
            let offset = i * 8 + sin(frameCount * 0.02 + i + p.offset) * 2;
            let c = color(p.color);
            c.setAlpha(25 - i * 5);
            stroke(c);
            ellipse(p.pos.x, p.pos.y, (r + offset) * 2);
        }
    }

    pop();

    // Gesture-based enhancements
    if (gestureActive && rippleIntensity > 0.3) {
        // Continuous liquid-like shimmer
        push();
        noFill();
        stroke(255, 255, 255, 60 * rippleIntensity);
        strokeWeight(1.5);
        for (let p of particles) {
            let waveR = p.size * (1.3 + 0.1 * sin(frameCount * 0.05 + p.offset));
            ellipse(p.pos.x, p.pos.y, waveR * 2);
        }
        pop();
    }

    if (merging) {
        drawCellularConnections();
    }
}
*/