// Motion and physics systems for smooth, organic jellyfish-like flow

// Cohesion force - particles attract to nearby particles (blob formation)
function calculateCohesion(particle, allParticles, radius) {
    let sum = createVector(0, 0);
    let count = 0;
    
    for (let other of allParticles) {
        if (other !== particle && other.type === particle.type) {
            let d = dist(particle.pos.x, particle.pos.y, other.pos.x, other.pos.y);
            if (d < radius && d > 0) {
                sum.add(other.pos);
                count++;
            }
        }
    }
    
    if (count > 0) {
        sum.div(count);
        let desired = p5.Vector.sub(sum, particle.pos);
        desired.setMag(0.02); // Gentle attraction
        return desired;
    }
    return createVector(0, 0);
}

// Separation force - prevents particles from overlapping
function calculateSeparation(particle, allParticles, radius) {
    let steer = createVector(0, 0);
    let count = 0;
    
    for (let other of allParticles) {
        if (other !== particle) {
            let d = dist(particle.pos.x, particle.pos.y, other.pos.x, other.pos.y);
            if (d < radius && d > 0) {
                let diff = p5.Vector.sub(particle.pos, other.pos);
                diff.normalize();
                diff.div(d); // Weight by distance
                steer.add(diff);
                count++;
            }
        }
    }
    
    if (count > 0) {
        steer.div(count);
        steer.setMag(0.05); // Gentle separation
    }
    
    return steer;
}

// Smooth wave motion - gentle oscillation
function generateWaveMotion(x, y, time) {
    let waveX = sin(y * 0.005 + time * 0.01) * 0.05;
    let waveY = cos(x * 0.005 + time * 0.01) * 0.05;
    return createVector(waveX, waveY);
}

// Organic pulsing force
function generatePulse(particle, time) {
    let pulseStrength = sin(time * particle.pulseSpeed + particle.pulseOffset) * 0.02;
    let pulse = particle.vel.copy();
    pulse.normalize();
    pulse.mult(pulseStrength);
    return pulse;
}

// Turbulence - very subtle for smooth flow
function generateTurbulence(x, y, time) {
    let turbX = (noise(x * 0.003, time * 0.005) - 0.5) * 0.1;
    let turbY = (noise(y * 0.003, time * 0.005 + 1000) - 0.5) * 0.1;
    return createVector(turbX, turbY);
}

// Fluid attraction - creates flowing streams
function calculateFluidAttraction(particle, allParticles, radius) {
    let attraction = createVector(0, 0);
    let count = 0;
    
    for (let other of allParticles) {
        if (other !== particle && other.type === particle.type) {
            let d = dist(particle.pos.x, particle.pos.y, other.pos.x, other.pos.y);
            if (d < radius && d > 0) {
                // Attract toward nearby particles' velocity
                let velDir = other.vel.copy();
                velDir.normalize();
                velDir.mult(0.01 / d);
                attraction.add(velDir);
                count++;
            }
        }
    }
    
    if (count > 0) {
        attraction.div(count);
    }
    
    return attraction;
}

// Viscosity - smooth blending between particle velocities
function applyViscosity(particle, allParticles, radius) {
    let avgVel = createVector(0, 0);
    let count = 0;
    
    for (let other of allParticles) {
        if (other !== particle && other.type === particle.type) {
            let d = dist(particle.pos.x, particle.pos.y, other.pos.x, other.pos.y);
            if (d < radius && d > 0) {
                avgVel.add(other.vel);
                count++;
            }
        }
    }
    
    if (count > 0) {
        avgVel.div(count);
        let viscosity = p5.Vector.sub(avgVel, particle.vel);
        viscosity.mult(0.03);
        return viscosity;
    }
    
    return createVector(0, 0);
}

// Surface tension - creates blob-like merging
function applySurfaceTension(particle, allParticles) {
    let tension = createVector(0, 0);
    let count = 0;
    let tensionRadius = particle.radius * 2.5;
    
    for (let other of allParticles) {
        if (other !== particle && other.type === particle.type) {
            let d = dist(particle.pos.x, particle.pos.y, other.pos.x, other.pos.y);
            if (d < tensionRadius && d > 0) {
                let combinedRadius = particle.radius + other.radius;
                if (d < combinedRadius) {
                    // Strong pull when overlapping
                    let pull = p5.Vector.sub(other.pos, particle.pos);
                    pull.normalize();
                    pull.mult(0.03 * (1 - d / combinedRadius));
                    tension.add(pull);
                    count++;
                }
            }
        }
    }
    
    if (count > 0) {
        tension.div(count);
    }
    
    return tension;
}