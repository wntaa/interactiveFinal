// Some initial writing and debugging support was assisted by AI (ChatGPT).
// All final decisions, code, and reflections are my own.

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
const messageDiv = document.getElementById("message");

let images = [];
let currentIndex = 0;
const totalImages = 6;

let currentMode = null;


// Load images
for (let i = 1; i <= totalImages; i++) {
    const img = new Image();
    img.src = `img/site${i}.png`;
    images.push(img);
}

// Resize canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let lastX = null;
let cooldown = 0;
let xBuffer = [];

function showImage() {
    const img = images[currentIndex];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

function showNextImage() {
    currentIndex = (currentIndex + 1) % totalImages;
    showImage();
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

// MediaPipe setup
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});
hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.6,
});

hands.onResults(onResults);

const video = document.createElement('video');
video.style.display = "none";
document.body.appendChild(video);

const camera = new Camera(video, {
    onFrame: async () => {
        await hands.send({ image: video });
    },
    width: 640,
    height: 480,
});
camera.start();

function onResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    showImage();

    if (results.multiHandLandmarks.length > 0) {
        const hand1 = results.multiHandLandmarks[0];
        drawLandmarks(ctx, hand1, { color: '#00FF00', radius: 3 });

        // Check for bowing during apology mode
        checkForBowing(results.multiHandLandmarks);

        const palm = hand1[0]; // wrist

        // --- Swipe detection using index finger tip (landmark 8)
        const palm4 = hand1[8].x;

        xBuffer.push(palm4);
        if (xBuffer.length > 6) xBuffer.shift();

        if (xBuffer.length === 6 && cooldown === 0) {
            const delta = xBuffer[5] - xBuffer[0];

            if (Math.abs(delta) > 0.15) {
                showNextImage();
                cooldown = 30;
                messageDiv.textContent = "";
                messageDiv.classList.add("hidden");

                xBuffer = [];
            }
        }
    } else {
        // Handle when no hands detected during apology mode
        if (apologyMode) {
            checkForBowing(null);
        }
    }

    if (cooldown > 0) cooldown--;
}

document.querySelector('.circle')?.addEventListener('click', () => {
    if (currentMode !== 'circle') {
        console.log("🟦 Switching to: circle mode");

        // Deactivate triangle effect if active (but keep circles visible)
        if (currentMode === 'triangle') {
            triangleActive = false; // Stop drawing new circles
            // Don't call deactivateTriangleEffect() to preserve existing circles
        }

        currentMode = 'circle';
        enableDestructionMode(); // activates circle destruction mode
    }
});

document.querySelector('.square')?.addEventListener('click', () => {
    if (currentMode !== 'square') {
        console.log("🟨 Switching to: square mode");

        // Deactivate circle mode but keep destruction
        if (currentMode === 'circle') {
            destructionActive = false;
        }

        // Deactivate triangle effect if active (but keep circles visible)
        if (currentMode === 'triangle') {
            triangleActive = false; // Stop drawing new circles
            // Don't call deactivateTriangleEffect() to preserve existing circles
        }

        currentMode = 'square';
        activateSquareEffect(); // typography sketch
    }
});

document.querySelector('.triangle')?.addEventListener('click', () => {
    if (currentMode !== 'triangle') {
        console.log("🔺 Switching to: triangle mode");

        // Deactivate circle mode but keep destruction
        if (currentMode === 'circle') {
            destructionActive = false;
        }

        currentMode = 'triangle';
        activateTriangleEffect(); // This will trigger microphone permission request
    }
});

// Star button handler (apology button)
document.querySelector('.star')?.addEventListener('click', () => {
    console.log("⭐ Apology ritual initiated...");

    // Start the bow apology sequence
    activateApologyMode();

    // Visual feedback
    const starButton = document.querySelector('.star');
    starButton.style.transform = 'scale(1.3) rotate(72deg)';
    starButton.style.transition = 'transform 0.3s ease';

    setTimeout(() => {
        starButton.style.transform = 'scale(1) rotate(0deg)';
    }, 300);
});


document.querySelector('.star')?.addEventListener('click', () => {
    console.log("⭐ Apology ritual initiated...");

    // Start the bow apology sequence
    activateApologyMode();

    // Visual feedback - make star sparkle briefly
    const starButton = document.querySelector('.star');
    starButton.style.transform = 'scale(1.3) rotate(72deg)';
    starButton.style.transition = 'transform 0.3s ease';

    setTimeout(() => {
        starButton.style.transform = 'scale(1) rotate(0deg)';
    }, 300);
});

// Escape key handler
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        cancelApology();
        console.log("🔄 Resetting mode - clearing all destruction");
        currentMode = null;

        // Clear circle destruction
        destructionActive = false;
        clear();
        drawnTiles = [];

        // Clear square destruction
        const squareCanvas = document.getElementById("squareCanvas");
        if (squareCanvas) squareCanvas.remove();

        // Deactivate triangle
        deactivateTriangleEffect(); // This stops microphone and closes audio context

        // clear triangle destruction
        const triangleCanvas = document.getElementById("triangleCanvas");
        if (triangleCanvas) triangleCanvas.remove();
    }
});


// Clean button that erases ALL mess but keeps current mode active
function addCleanButton() {
    const cleanButton = document.createElement('button');

    // Hover effect
    cleanButton.addEventListener('mouseenter', () => {
        cleanButton.style.background = 'rgba(255,0,0,0.5)';
        cleanButton.style.transform = 'scale(1.05)';
    });

    cleanButton.addEventListener('mouseleave', () => {
        cleanButton.style.background = 'rgba(255,0,0,0.3)';
        cleanButton.style.transform = 'scale(1)';
    });

    cleanButton.addEventListener('click', () => {
        console.log("🧹 Apologizing - cleaning all destruction");

        // Clear ALL circle destruction (p5.js canvas)
        clear();
        drawnTiles = [];

        // Clear ALL square destruction (remove entire square canvas)
        const squareCanvas = document.getElementById("squareCanvas");
        if (squareCanvas) {
            squareCanvas.remove();
        }

        // Clear ALL triangle destruction (microphone circles)
        clearTriangleDestruction();

        // Keep the current mode active so users can continue creating mess
        // Don't reset currentMode - just clean the destruction

        // If triangle mode was active, reactivate it for new destruction
        if (currentMode === 'triangle') {
            activateTriangleEffect();
        }

        // Brief feedback
        cleanButton.textContent = 'Forgiven';
        setTimeout(() => {
            cleanButton.textContent = 'Apology';
        }, 1000);
    });

    document.body.appendChild(cleanButton);
}

// Uncomment this to add the apology button that cleans ALL destruction
addCleanButton();