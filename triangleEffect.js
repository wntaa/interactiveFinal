// Some initial writing and debugging support was assisted by AI (ChatGPT).
// All final decisions, code, and reflections are my own.

let triangleCanvas;
let audioContext;
let analyser;
let microphone;
let dataArray;
let triangleActive = false;
let drawnCircles = [];

// Triangle effect activation
function activateTriangleEffect() {
    if (!document.getElementById("triangleCanvas")) {
        // Create canvas for triangle effect
        triangleCanvas = document.createElement('div');
        triangleCanvas.id = "triangleCanvas";
        triangleCanvas.style.position = "absolute";
        triangleCanvas.style.top = 0;
        triangleCanvas.style.left = 0;
        triangleCanvas.style.width = "100vw";
        triangleCanvas.style.height = "100vh";
        triangleCanvas.style.pointerEvents = "none"; // Don't block other interactions
        triangleCanvas.style.zIndex = "500";
        document.body.appendChild(triangleCanvas);
    }

    // Initialize microphone
    if (!audioContext) {
        initializeMicrophone();
    }

    triangleActive = true;
    startDrawing();
}

// Initialize microphone and audio analysis
async function initializeMicrophone() {
    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Create audio context and analyser
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);

        // Configure analyser
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        // Connect microphone to analyser
        microphone.connect(analyser);

        console.log("🎤 Microphone initialized successfully");

    } catch (error) {
        console.error("❌ Microphone access denied:", error);
        // Fallback: use random values if mic is denied
        simulateMicrophoneData();
    }
}

// Fallback function if microphone access is denied
function simulateMicrophoneData() {
    console.log("🔄 Using simulated audio data");
    dataArray = new Uint8Array(128);

    // Generate fake audio data that varies over time
    setInterval(() => {
        if (triangleActive) {
            for (let i = 0; i < dataArray.length; i++) {
                dataArray[i] = Math.random() * 100 + Math.sin(Date.now() * 0.01) * 50 + 50;
            }
        }
    }, 100);
}

// Get current volume level
function getVolumeLevel() {
    if (!analyser || !dataArray) return 20; // Default small size

    // Get frequency data
    analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    const average = sum / dataArray.length;

    // Map volume to circle size (min 5px, max 80px)
    return Math.max(5, Math.min(80, average * 0.8));
}

// Main drawing loop
function startDrawing() {
    if (!triangleActive) return;

    // Get current volume
    const volume = getVolumeLevel();

    // Only draw if volume is above threshold
    if (volume > 10) {
        drawVolumeCircle(volume);
    }

    // Continue drawing at 30fps
    setTimeout(() => {
        if (triangleActive) {
            startDrawing();
        }
    }, 33); // ~30fps
}


function drawVolumeCircle(size) {
    // Random position on screen
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;

    // Create square element (renamed from circle for clarity)
    const square = document.createElement('div');
    square.className = 'volume-square'; // renamed class
    square.style.position = 'absolute';
    square.style.left = (x - size / 2) + 'px';
    square.style.top = (y - size / 2) + 'px';
    square.style.width = size + 'px';
    square.style.height = size + 'px';
    square.style.borderRadius = '0px'; // CHANGED: makes squares instead of circles
    square.style.backgroundColor = '#0000FF'; // Bright blue
    square.style.opacity = '0.7';
    square.style.pointerEvents = 'none';
    square.style.zIndex = '999';

    // Add to canvas and store reference
    triangleCanvas.appendChild(square);
    drawnCircles.push(square); // still using same array name

    // Optional: Fade in effect
    square.style.opacity = '0';
    setTimeout(() => {
        square.style.transition = 'opacity 0.3s ease';
        square.style.opacity = '0.7';
    }, 10);
}
// Clean up triangle effect
function deactivateTriangleEffect() {
    triangleActive = false;

    // Stop microphone
    if (microphone) {
        microphone.disconnect();
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    console.log("🔺 Triangle effect deactivated");
}

// Clear all triangle destruction
function clearTriangleDestruction() {
    const canvas = document.getElementById("triangleCanvas");
    if (canvas) {
        canvas.remove();
    }
    drawnCircles = [];
    triangleActive = false;
}