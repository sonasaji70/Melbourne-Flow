// Velocity control and data mapping

// Calculate velocity multiplier based on sensor data
function calculateVelocityMultiplier(value, average, range) {
    // Below average range
    if (value < average - range) {
        return 0.6; // 60% speed - slower, smaller particles
    }
    // Above average range
    if (value > average + range) {
        return 1.6; // 160% speed - faster, larger particles
    }
    // Within average range
    return 1.0; // 100% speed - normal flow
}

// Update all data factor velocities based on sensor readings
function updateDataFactorVelocities(sensorData) {
    // Temperature (average: 20°C, range: ±5°C)
    if (sensorData.air_temperature !== undefined) {
        dataFactors.temperature.value = sensorData.air_temperature;
        dataFactors.temperature.velocity = calculateVelocityMultiplier(
            sensorData.air_temperature, 
            20, 
            5
        );
    }

    // Humidity (average: 60%, range: ±15%)
    if (sensorData.relative_humidity !== undefined) {
        dataFactors.humidity.value = sensorData.relative_humidity;
        dataFactors.humidity.velocity = calculateVelocityMultiplier(
            sensorData.relative_humidity, 
            60, 
            15
        );
    }

    // Atmospheric Pressure (average: 1013 hPa, range: ±10 hPa)
    if (sensorData.atmospheric_pressure !== undefined) {
        dataFactors.pressure.value = sensorData.atmospheric_pressure;
        dataFactors.pressure.velocity = calculateVelocityMultiplier(
            sensorData.atmospheric_pressure, 
            1013, 
            10
        );
    }

    // Wind Speed (average: 10 km/h, range: ±5 km/h)
    if (sensorData.wind_speed !== undefined) {
        dataFactors.windSpeed.value = sensorData.wind_speed;
        dataFactors.windSpeed.velocity = calculateVelocityMultiplier(
            sensorData.wind_speed, 
            10, 
            5
        );
    }

    // Gust Speed (average: 15 km/h, range: ±10 km/h)
    if (sensorData.wind_gust_speed !== undefined) {
        dataFactors.gustSpeed.value = sensorData.wind_gust_speed;
        dataFactors.gustSpeed.velocity = calculateVelocityMultiplier(
            sensorData.wind_gust_speed, 
            15, 
            10
        );
    }

    // PM2.5 (average: 10 µg/m³, range: ±5 µg/m³)
    if (sensorData.pm2_5 !== undefined) {
        dataFactors.pm25.value = sensorData.pm2_5;
        dataFactors.pm25.velocity = calculateVelocityMultiplier(
            sensorData.pm2_5, 
            10, 
            5
        );
    }

    // PM10 (average: 20 µg/m³, range: ±10 µg/m³)
    if (sensorData.pm10 !== undefined) {
        dataFactors.pm10.value = sensorData.pm10;
        dataFactors.pm10.velocity = calculateVelocityMultiplier(
            sensorData.pm10, 
            20, 
            10
        );
    }

    // Noise Level (average: 60 dB, range: ±10 dB)
    if (sensorData.noise_level !== undefined) {
        dataFactors.noise.value = sensorData.noise_level;
        dataFactors.noise.velocity = calculateVelocityMultiplier(
            sensorData.noise_level, 
            60, 
            10
        );
    }
}

// Smooth velocity transitions to avoid sudden jumps
class VelocitySmoothing {
    constructor(initialValue = 1.0, smoothingFactor = 0.1) {
        this.currentValue = initialValue;
        this.targetValue = initialValue;
        this.smoothingFactor = smoothingFactor;
    }
    
    setTarget(newTarget) {
        this.targetValue = newTarget;
    }
    
    update() {
        // Lerp towards target value
        this.currentValue = lerp(
            this.currentValue, 
            this.targetValue, 
            this.smoothingFactor
        );
        return this.currentValue;
    }
    
    getValue() {
        return this.currentValue;
    }
}

// Velocity interpolation for smooth transitions
function interpolateVelocity(current, target, speed = 0.05) {
    return lerp(current, target, speed);
}

// Apply velocity scale to particle movement
function scaleVelocityByData(baseVelocity, dataMultiplier, minScale = 0.5, maxScale = 2.0) {
    let scaledMultiplier = constrain(dataMultiplier, minScale, maxScale);
    return baseVelocity * scaledMultiplier;
}

// Get velocity status text for UI
function getVelocityStatus(multiplier) {
    if (multiplier < 0.8) {
        return "Below Average - Slower Flow";
    } else if (multiplier > 1.2) {
        return "Above Average - Faster Flow";
    } else {
        return "Average - Normal Flow";
    }
}

// Calculate average velocity across all data factors
function getAverageVelocity() {
    let sum = 0;
    let count = 0;
    
    for (let key in dataFactors) {
        sum += dataFactors[key].velocity;
        count++;
    }
    
    return count > 0 ? sum / count : 1.0;
}

// Get velocity by factor type
function getVelocityByType(type) {
    if (dataFactors[type]) {
        return dataFactors[type].velocity;
    }
    return 1.0;
}

// Dynamic max speed based on overall system state
function getDynamicMaxSpeed(baseMaxSpeed = 4) {
    let avgVelocity = getAverageVelocity();
    return baseMaxSpeed * avgVelocity;
}