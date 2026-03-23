#  Melbourne Flow

**Melbourne Flow** is an interactive, data-driven fluid simulation that visualises Melbourne’s live microclimate. Environmental data and human gestures dynamically shape the system, creating a continuously evolving visual experience.

---

##  Preview
<img width="940" height="802" alt="image (1)" src="https://github.com/user-attachments/assets/50fb6356-fdbd-4ce4-9f78-4625fecf7e94" />
<img width="940" height="802" alt="Screenshot 2025-10-19 000534" src="https://github.com/user-attachments/assets/c53f48a0-cba9-4800-90a8-b585ff9567be" />
<img width="940" height="802" alt="Screenshot 2025-10-18 235305" src="https://github.com/user-attachments/assets/b699d60e-f704-486a-83e7-4a02ae391192" />
<img width="940" height="802" alt="Screenshot 2025-10-19 003622" src="https://github.com/user-attachments/assets/a3ee0584-2465-4b7e-9752-7ca0777f1c67" />


---

##  Concept

This project explores how real-time urban data can be translated into fluid, organic motion.  
Using Melbourne’s open climate sensor data, invisible environmental conditions such as temperature, wind, air quality, and noise are visualised as dynamic fluid flows.

The system is designed as a **public interactive installation**, where users can engage with the environment through movement and gestures.

---

##  Features

-  Physics-based fluid / particle simulation  
-  Real-time Melbourne microclimate data integration  
-  Dynamic colour and motion mapping  
-  Pose detection using **ml5.js**  
-  Ambient and interactive sound layer  
-  Non-repetitive, evolving visuals  

---

##  Data Mapping

| Data Input | Visual Output |
|------------|--------------|
| Temperature | Colour gradient |
| Wind speed | Flow direction |
| Air quality (PM2.5/PM10) | Opacity / density |
| Noise levels | Turbulence |
| Humidity | Particle spread |

---

##  System Overview

City of Melbourne Data → Data Mapping → Fluid Simulation Engine  
                                     ↑  
                             Pose Detection (ml5)  
                                     ↑  
                                   User Input  

---

##  Tech Stack

- **p5.js** – visual rendering  
- **p5.sound** – audio interaction  
- **ml5.js** – pose detection  
- **Matter.js / custom physics** – fluid behaviour  
- **Melbourne Open Data API** – live data input  

---

##  Getting Started

1. Clone the repository  
```bash
git clone https://github.com/yourusername/melbourne-flow.git
