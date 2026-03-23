// particle.js - Organic Jellyfish-like Metaball Particle
class FluidParticle {
    constructor(type) {
        this.type = type;
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(random(-0.5, 0.5), random(-0.3, 0.3));
        this.acc = createVector(0, 0);
        
        // Fluid properties - slower, more organic
        this.mass = random(2, 5);
        this.maxSpeed = 1.5; // Much slower for smooth wave motion
        this.maxForce = 0.1;
        
        // Organic jellyfish properties
        this.baseRadius = random(30, 70); // Larger, blob-like
        this.radius = this.baseRadius;
        this.targetRadius = this.baseRadius;
        this.pulseSpeed = random(0.01, 0.03);
        this.pulseOffset = random(TWO_PI);
        
        // Organic shape vertices
        this.numVertices = 12;
        this.vertexOffsets = [];
        for (let i = 0; i < this.numVertices; i++) {
            this.vertexOffsets.push({
                r: random(0.8, 1.2),
                speed: random(0.02, 0.05),
                offset: random(TWO_PI)
            });
        }
        
        this.opacity = random(120, 200);
    }
    
    applyForce(force) {
        let f = force.copy();
        f.div(this.mass);
        this.acc.add(f);
    }
    
    follow(flowField) {
        let x = floor(this.pos.x / scl);
        let y = floor(this.pos.y / scl);
        let index = x + y * cols;
        let force = flowField[index];
        if (force) {
            let scaledForce = force.copy();
            scaledForce.mult(0.3); // Gentler force application
            this.applyForce(scaledForce);
        }
    }
    
    update() {
        // Get velocity multiplier from data
        let velocityMult = dataFactors[this.type].velocity;
        
        // Smooth, wave-like motion with minimal friction
        let friction = this.vel.copy();
        friction.mult(-0.02); // Very light friction for smooth gliding
        this.applyForce(friction);
        
        // Organic pulsing
        this.targetRadius = this.baseRadius * velocityMult * 
                           (1 + sin(frameCount * this.pulseSpeed + this.pulseOffset) * 0.15);
        this.radius = lerp(this.radius, this.targetRadius, 0.1);
        
        // Update velocity - very smooth
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed * velocityMult);
        
        // Update position
        this.pos.add(this.vel);
        
        // Reset acceleration
        this.acc.mult(0);
        
        // Update organic shape vertices
        for (let i = 0; i < this.vertexOffsets.length; i++) {
            this.vertexOffsets[i].r = 0.8 + 
                sin(frameCount * this.vertexOffsets[i].speed + this.vertexOffsets[i].offset) * 0.2;
        }
    }
    
    show() {
        let col = dataFactors[this.type].color;
        let velocityMult = dataFactors[this.type].velocity;
        
        push();
        translate(this.pos.x, this.pos.y);
        
        // Draw organic jellyfish blob shape
        noStroke();
        
        // Multiple layers for depth and glow
        for (let layer = 4; layer >= 0; layer--) {
            let layerAlpha = this.opacity * (0.15 / (layer + 1));
            let layerScale = 1 + layer * 0.3;
            
            fill(col[0], col[1], col[2], layerAlpha);
            
            beginShape();
            for (let i = 0; i < this.numVertices; i++) {
                let angle = map(i, 0, this.numVertices, 0, TWO_PI);
                let r = this.radius * this.vertexOffsets[i].r * layerScale;
                let x = cos(angle) * r;
                let y = sin(angle) * r;
                
                // Add curve vertices for smooth, organic shape
                curveVertex(x, y);
            }
            // Close the shape smoothly
            let angle = 0;
            let r = this.radius * this.vertexOffsets[0].r * layerScale;
            curveVertex(cos(angle) * r, sin(angle) * r);
            angle = map(1, 0, this.numVertices, 0, TWO_PI);
            r = this.radius * this.vertexOffsets[1].r * layerScale;
            curveVertex(cos(angle) * r, sin(angle) * r);
            endShape(CLOSE);
        }
        
        // Inner core highlight
        fill(255, 255, 255, this.opacity * 0.2);
        ellipse(0, 0, this.radius * 0.4, this.radius * 0.4);
        
        pop();
    }
    
    // Metaball interaction - merge with nearby particles
    getMetaballInfluence(x, y) {
        let d = dist(x, y, this.pos.x, this.pos.y);
        if (d < this.radius * 2) {
            return this.radius * this.radius / (d * d + 1);
        }
        return 0;
    }
    
    edges() {
        let margin = this.radius * 2;
        
        // Smooth wrapping with margin
        if (this.pos.x > width + margin) {
            this.pos.x = -margin;
        }
        if (this.pos.x < -margin) {
            this.pos.x = width + margin;
        }
        if (this.pos.y > height + margin) {
            this.pos.y = -margin;
        }
        if (this.pos.y < -margin) {
            this.pos.y = height + margin;
        }
    }
}