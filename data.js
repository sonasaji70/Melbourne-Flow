// Melbourne microclimate data API integration

// Fetch live data from Melbourne Open Data API
async function fetchMelbourneData() {
    try {
        updateStatus('loading', 'Connecting...');
        
        var response = await fetch(
            'https://data.melbourne.vic.gov.au/api/v2/catalog/datasets/microclimate-sensors-data/exports/json?limit=50'
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        
        var data = await response.json();
        
        if (data && data.length > 0) {
            // Calculate averages from the array of records
            var avgData = {
                air_temperature: 0,
                relative_humidity: 0,
                atmospheric_pressure: 0,
                wind_speed: 0,
                wind_gust_speed: 0,
                pm2_5: 0,
                pm10: 0,
                noise_level: 0
            };
            
            var counts = {
                air_temperature: 0,
                relative_humidity: 0,
                atmospheric_pressure: 0,
                wind_speed: 0,
                wind_gust_speed: 0,
                pm2_5: 0,
                pm10: 0,
                noise_level: 0
            };
            
            // Sum all values
            data.forEach(function(record) {
                if (record.airtemperature !== undefined) {
                    avgData.air_temperature += parseFloat(record.airtemperature);
                    counts.air_temperature++;
                }
                if (record.relativehumidity !== undefined) {
                    avgData.relative_humidity += parseFloat(record.relativehumidity);
                    counts.relative_humidity++;
                }
                if (record.atmosphericpressure !== undefined) {
                    avgData.atmospheric_pressure += parseFloat(record.atmosphericpressure);
                    counts.atmospheric_pressure++;
                }
                if (record.averagewindspeed !== undefined) {
                    avgData.wind_speed += parseFloat(record.averagewindspeed);
                    counts.wind_speed++;
                }
                if (record.gustwindspeed !== undefined) {
                    avgData.wind_gust_speed += parseFloat(record.gustwindspeed);
                    counts.wind_gust_speed++;
                }
                if (record.pm25 !== undefined) {
                    avgData.pm2_5 += parseFloat(record.pm25);
                    counts.pm2_5++;
                }
                if (record.pm10 !== undefined) {
                    avgData.pm10 += parseFloat(record.pm10);
                    counts.pm10++;
                }
                if (record.noise !== undefined) {
                    avgData.noise_level += parseFloat(record.noise);
                    counts.noise_level++;
                }
            });
            
            // Calculate averages
            for (var key in avgData) {
                var countKey = key;
                if (counts[countKey] > 0) {
                    avgData[key] = avgData[key] / counts[countKey];
                }
            }
            
            avgData.local_time = new Date().toISOString();
            
            sensorData = avgData;
            updateDataFactorVelocities(sensorData);
            updateStatus('connected', 'Live Data');
            console.log('Data updated:', sensorData);
            return sensorData;
        } else {
            console.warn('No data in results');
            useDemoData();
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        useDemoData();
    }
}

// Use demo data when API fails
function useDemoData() {
    sensorData = {
        air_temperature: 22 + Math.random() * 5,
        relative_humidity: 50 + Math.random() * 20,
        atmospheric_pressure: 1013 + Math.random() * 10,
        wind_speed: Math.random() * 20,
        wind_gust_speed: Math.random() * 30,
        pm2_5: Math.random() * 25,
        pm10: Math.random() * 50,
        noise_level: 50 + Math.random() * 30,
        local_time: new Date().toISOString()
    };
    
    updateDataFactorVelocities(sensorData);
    updateStatus('demo', 'Demo Mode');
    console.log('Using demo data:', sensorData);
    return sensorData;
}

// Update status indicator
function updateStatus(status, text) {
    var statusElement = document.getElementById('status-text');
    var statusDot = document.querySelector('.status-dot');
    
    if (statusElement) {
        statusElement.textContent = text;
    }
    
    if (statusDot) {
        switch(status) {
            case 'connected':
                statusDot.style.background = '#10b981';
                break;
            case 'loading':
                statusDot.style.background = '#f59e0b';
                break;
            case 'demo':
                statusDot.style.background = '#3b82f6';
                break;
            case 'error':
                statusDot.style.background = '#ef4444';
                break;
            default:
                statusDot.style.background = '#6b7280';
        }
    }
}

// Parse sensor data and extract values
function parseSensorData(data) {
    return {
        temperature: data.air_temperature || null,
        humidity: data.relative_humidity || null,
        pressure: data.atmospheric_pressure || null,
        windSpeed: data.wind_speed || null,
        gustSpeed: data.wind_gust_speed || null,
        pm25: data.pm2_5 || null,
        pm10: data.pm10 || null,
        noise: data.noise_level || null,
        timestamp: data.local_time || null
    };
}

// Get latest sensor reading
function getLatestReading() {
    return sensorData;
}

// Check if data is fresh (within 1 hour)
function isDataFresh() {
    if (!sensorData || !sensorData.local_time) {
        return false;
    }
    
    var dataTime = new Date(sensorData.local_time);
    var now = new Date();
    var diffMinutes = (now - dataTime) / (1000 * 60);
    
    return diffMinutes < 60;
}

// Format sensor value for display
function formatSensorValue(value, unit, decimals = 1) {
    if (value === null || value === undefined) {
        return 'N/A';
    }
    return value.toFixed(decimals) + ' ' + unit;
}

// Get all sensor readings formatted
function getFormattedReadings() {
    if (!sensorData) {
        return null;
    }
    
    return {
        temperature: formatSensorValue(sensorData.air_temperature, '°C'),
        humidity: formatSensorValue(sensorData.relative_humidity, '%'),
        pressure: formatSensorValue(sensorData.atmospheric_pressure, 'hPa'),
        windSpeed: formatSensorValue(sensorData.wind_speed, 'km/h'),
        gustSpeed: formatSensorValue(sensorData.wind_gust_speed, 'km/h'),
        pm25: formatSensorValue(sensorData.pm2_5, 'µg/m³'),
        pm10: formatSensorValue(sensorData.pm10, 'µg/m³'),
        noise: formatSensorValue(sensorData.noise_level, 'dB')
    };
}

// Data refresh interval management
var dataRefreshInterval = null;

function startDataRefresh(intervalMinutes = 15) {
    // Clear existing interval
    if (dataRefreshInterval) {
        clearInterval(dataRefreshInterval);
    }
    
    // Set new interval
    dataRefreshInterval = setInterval(function() {
        console.log('Refreshing data...');
        fetchMelbourneData();
    }, intervalMinutes * 60 * 1000);
    
    console.log('Data refresh started: every ' + intervalMinutes + ' minutes');
}

function stopDataRefresh() {
    if (dataRefreshInterval) {
        clearInterval(dataRefreshInterval);
        dataRefreshInterval = null;
        console.log('Data refresh stopped');
    }
}