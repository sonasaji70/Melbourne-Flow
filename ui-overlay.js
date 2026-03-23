// ui-overlay.js - Location pins, labels, and factor chart

// Sensor location data (example Melbourne CBD locations)
let sensorLocations = [
    { name: "Bourke Street Mall", x: 0.25, y: 0.4 },
    { name: "Federation Square", x: 0.45, y: 0.6 },
    { name: "Carlton Gardens", x: 0.6, y: 0.3 },
    { name: "Docklands", x: 0.15, y: 0.5 },
    { name: "South Melbourne", x: 0.35, y: 0.75 }
];

// UI state
let showLocationPins = true;
let showFactorChart = true;
let chartExpanded = false;

function drawLocationPins() {
    if (!showLocationPins) return;
    
    push();
    
    for (let loc of sensorLocations) {
        let x = loc.x * width;
        let y = loc.y * height;
        
        // Pin shadow
        fill(0, 0, 0, 60);
        noStroke();
        ellipse(x + 2, y + 2, 8, 8);
        
        // Pin circle
        fill(255, 255, 255, 200);
        stroke(0, 150, 255, 255);
        strokeWeight(3);
        ellipse(x, y, 20, 20);
        
        // Pin inner dot
        fill(0, 150, 255);
        noStroke();
        ellipse(x, y, 8, 8);
        
        // Pin stem
        stroke(0, 150, 255, 255);
        strokeWeight(3);
        line(x, y, x, y + 25);
        
        // Pin base
        fill(0, 150, 255, 180);
        noStroke();
        ellipse(x, y + 25, 12, 6);
        
        // Location label
        fill(255, 255, 255, 220);
        stroke(0, 0, 0, 180);
        strokeWeight(4);
        textAlign(CENTER);
        textSize(14);
        text(loc.name, x, y - 15);
        
        // Remove stroke for next elements
        noStroke();
        fill(255, 255, 255, 220);
        text(loc.name, x, y - 15);
    }
    
    pop();
}

function drawFactorChart() {
    if (!showFactorChart) return;
    
    push();
    
    // Chart position and size - BOTTOM RIGHT corner with better spacing
    let chartWidth = chartExpanded ? 450 : 320;
    let chartHeight = chartExpanded ? 360 : 190;
    let chartX = width - chartWidth - 30;
    let chartY = height - chartHeight - 30; // Fixed to always be 30px from bottom
    
    // Chart background
    fill(0, 0, 0, 160);
    stroke(255, 255, 255, 80);
    strokeWeight(1);
    rect(chartX, chartY, chartWidth, chartHeight, 10);
    
    // Chart title
    fill(255, 255, 255, 255);
    noStroke();
    textAlign(LEFT);
    textSize(16);
    textStyle(BOLD);
    text("Environmental Factors", chartX + 15, chartY + 25);
    
    // Expand/collapse button
    fill(255, 255, 255, 100);
    stroke(255, 255, 255, 150);
    strokeWeight(1);
    let btnX = chartX + chartWidth - 35;
    let btnY = chartY + 10;
    rect(btnX, btnY, 25, 25, 4);
    
    fill(255, 255, 255, 255);
    noStroke();
    textAlign(CENTER);
    textSize(14);
    text(chartExpanded ? "−" : "+", btnX + 12.5, btnY + 18);
    
    // Factor bars
    let startY = chartY + 50;
    let barHeight = chartExpanded ? 28 : 12;
    let barSpacing = chartExpanded ? 8 : 4;
    let labelWidth = 100; // Space for factor names
    let valueWidth = chartExpanded ? 70 : 0; // Space for value text on right
    let maxBarWidth = chartWidth - labelWidth - valueWidth - 40; // Space for bars
    
    let factors = [
        { name: "Temperature", key: "temperature", unit: "°C" },
        { name: "Humidity", key: "humidity", unit: "%" },
        { name: "Pressure", key: "pressure", unit: "hPa" },
        { name: "Wind Speed", key: "windSpeed", unit: "km/h" },
        { name: "Gust Speed", key: "gustSpeed", unit: "km/h" },
        { name: "PM2.5", key: "pm25", unit: "µg/m³" },
        { name: "PM10", key: "pm10", unit: "µg/m³" },
        { name: "Noise Level", key: "noise", unit: "dB" }
    ];
    
    textAlign(LEFT);
    textSize(chartExpanded ? 13 : 11);
    textStyle(NORMAL);
    
    for (let i = 0; i < factors.length; i++) {
        let factor = factors[i];
        let data = dataFactors[factor.key];
        let y = startY + i * (barHeight + barSpacing);
        
        // Factor name - LEFT aligned with consistent spacing
        fill(255, 255, 255, 200);
        noStroke();
        text(factor.name, chartX + 15, y + barHeight - (chartExpanded ? 8 : 3));
        
        // Color indicator - fixed position
        let colorBoxX = chartX + labelWidth + 5;
        fill(data.color[0], data.color[1], data.color[2], 200);
        noStroke();
        rect(colorBoxX, y, 15, barHeight, 3);
        
        // Velocity bar (represents data intensity)
        let barStartX = colorBoxX + 20;
        let barWidth = map(data.velocity, 0.6, 1.6, 0, maxBarWidth);
        
        // Bar background
        fill(50, 50, 50, 150);
        noStroke();
        rect(barStartX, y, maxBarWidth, barHeight, 3);
        
        // Bar fill
        fill(data.color[0], data.color[1], data.color[2], 180);
        noStroke();
        rect(barStartX, y, barWidth, barHeight, 3);
        
        // Bar outline
        noFill();
        stroke(data.color[0], data.color[1], data.color[2], 255);
        strokeWeight(1);
        rect(barStartX, y, maxBarWidth, barHeight, 3);
        
        // Value text - when expanded
        if (chartExpanded && sensorData) {
            let value = data.value;
            let valueText = value ? value.toFixed(1) + " " + factor.unit : "N/A";
            fill(255, 255, 255, 220);
            noStroke();
            textAlign(LEFT);
            textSize(11);
            // Position value text right after the bar ends
            let valueX = barStartX + maxBarWidth + 8;
            text(valueText, valueX, y + barHeight - 9);
        }
    }
    
    // Legend
    if (chartExpanded) {
        let legendY = startY + factors.length * (barHeight + barSpacing) + 15;
        
        fill(255, 255, 255, 150);
        noStroke();
        textAlign(LEFT);
        textSize(10);
        text("Bar length: Data intensity (Below avg ← → Above avg)", chartX + 15, legendY);
    }
    
    pop();
}

function drawLegend() {
    push();
    
    // Move Flow Dynamics box DOWN MORE - positioned well below controls
    let legendX = width - 320;
    let legendY = 80; // Moved down from 120 to 200 for more clearance
    let legendWidth = 290;
    let legendHeight = bodyDetected && poses && poses.length > 0 ? 140 + (poses.length * 18) : 120;
    
    // Legend background
    fill(0, 0, 0, 160);
    stroke(255, 255, 255, 80);
    strokeWeight(1);
   rect(legendX, legendY, legendWidth, legendHeight, 10);
    
    // Legend title
    fill(255, 255, 255, 255);
    noStroke();
    textAlign(LEFT);
    textSize(14);
    textStyle(BOLD);
    text("Flow Dynamics", legendX + 15, legendY + 25);
    
    textStyle(NORMAL);
    textSize(11);
    fill(255, 255, 255, 180);
    
    let itemY = legendY + 45;
    let lineHeight = 18;
    
   text("• Blob size = Data value intensity", legendX + 15, itemY);
    text("• Flow speed = Velocity multiplier", legendX + 15, itemY + lineHeight);
    text("• Color = Environmental factor", legendX + 15, itemY + lineHeight * 2);
    text("• Blobs merge via surface tension", legendX + 15, itemY + lineHeight * 3);
    
    if (bodyDetected && typeof poses !== 'undefined' && poses.length > 0) {
        fill(0, 255, 150, 255);
        text("✓ " + poses.length + " Person" + (poses.length > 1 ? "s" : "") + " Detected", legendX + 15, itemY + lineHeight * 4);
        
        fill(255, 255, 255, 180);
        for (let i = 0; i < poses.length; i++) {
            // Generate color for each person (same as neural network)
            let personHue = (i * 137.5) % 360;
            colorMode(HSB, 360, 100, 100);
            let personColor = color(personHue, 70, 90);
            colorMode(RGB, 255);
            
            // Color indicator
            fill(red(personColor), green(personColor), blue(personColor), 200);
            noStroke();
            ellipse(legendX + 25, itemY + lineHeight * (5 + i) + 5, 8, 8);
            
            fill(255, 255, 255, 180);
            let gesture = i === 0 ? gestureState : "detected"; // Only first person has gesture tracking
            text("Person " + (i + 1) + ": " + gesture, legendX + 35, itemY + lineHeight * (5 + i) + 9);
        }
    }
    
    pop();
}

function checkChartButtonClick(mouseX, mouseY) {
    if (!showFactorChart) return false;
    
    let chartWidth = chartExpanded ? 450 : 320;
    let chartHeight = chartExpanded ? 360 : 190;
    let chartX = width - chartWidth - 30;
    let chartY = height - chartHeight - 30;
    
    let btnX = chartX + chartWidth - 35;
    let btnY = chartY + 10;
    let btnSize = 25;
    
    if (mouseX > btnX && mouseX < btnX + btnSize &&
        mouseY > btnY && mouseY < btnY + btnSize) {
        chartExpanded = !chartExpanded;
        return true;
    }
    
    return false;
}

function toggleLocationPins() {
    showLocationPins = !showLocationPins;
}

function toggleFactorChart() {
    showFactorChart = !showFactorChart;
}

// Add to main draw loop
function drawUI() {
    drawLocationPins();
    drawFactorChart();
    drawLegend();
}

// Mouse interaction
function mousePressed() {
    checkChartButtonClick(mouseX, mouseY);
}