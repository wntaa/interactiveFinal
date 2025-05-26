// Some initial writing and debugging support was assisted by AI (ChatGPT).
// All final decisions, code, and reflections are my own.

// bowApology.js - Completely invisible bow detection
let apologyMode = false;
let apologyOverlay = null; // Keep variable but never create overlay
let debugCanvas = null;
let debugCtx = null;

// Nose tracking variables
let noseHistory = [];
let bowDetected = false;
let bowThreshold = 40;

// Face detection (only initialize when needed)
let faceDetector = null;
let faceInitPromise = null;

// Test function to verify bowApology.js is loaded
function testApologyMode() {
    console.log("🔧 Testing apology mode function...");
    alert("bowApology.js is loaded and working!");
}

// Make it globally available for testing
window.testApologyMode = testApologyMode;

// This is called from script.js onResults - keep it minimal when not in apology mode
function checkForBowing(handLandmarks) {
    // CRITICAL: Do absolutely nothing if not in apology mode or if bow already detected
    if (!apologyMode || bowDetected) return;

    // Only try face detection if we have the video element and it's ready
    if (typeof video !== 'undefined' && video && video.readyState >= 2) {
        tryFaceDetection();
    } else {
        console.log("📱 Waiting for camera...");
    }
}

// Try face detection (throttled)
let lastFaceCheck = 0;
function tryFaceDetection() {
    const now = Date.now();

    // Only check every 200ms to avoid lag
    if (now - lastFaceCheck < 200) return;
    lastFaceCheck = now;

    // Initialize face detector if needed
    if (!faceDetector && !faceInitPromise) {
        initializeFaceDetector();
        return;
    }

    // Send frame if detector is ready
    if (faceDetector && video) {
        faceDetector.send({ image: video }).catch(() => {
            // Silently handle errors
        });
    }
}

// Initialize face detector (async, only when needed)
function initializeFaceDetector() {
    console.log("📱 Initializing face detection...");

    faceInitPromise = new Promise((resolve) => {
        try {
            const faceMesh = new FaceMesh({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
            });

            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: false,
                minDetectionConfidence: 0.6,
                minTrackingConfidence: 0.6,
            });

            faceMesh.onResults(onFaceResults);

            // Small delay to ensure it's ready
            setTimeout(() => {
                faceDetector = faceMesh;
                console.log("📱 Face detection ready - bow your head");
                resolve(true);
            }, 1000);

        } catch (error) {
            console.error("Face detection error:", error);
            console.log("📱 Face detection failed");
            resolve(false);
        }
    });
}

// Handle face results
function onFaceResults(results) {
    if (!apologyMode || !debugCtx) return;

    // Clear debug canvas
    debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const face = results.multiFaceLandmarks[0];
        const noseTip = face[1]; // nose tip landmark
        const noseX = noseTip.x * window.innerWidth;
        const noseY = noseTip.y * window.innerHeight;

        drawNoseDot(noseX, noseY);
        trackBowGesture(noseX, noseY);

    } else {
        console.log("📱 No face detected - look at camera");

        // Draw message
        debugCtx.fillStyle = '#FF4444';
        debugCtx.font = '24px Arial';
        debugCtx.textAlign = 'center';
        debugCtx.fillText('LOOK AT CAMERA', window.innerWidth / 2, window.innerHeight / 2);
        debugCtx.textAlign = 'start';
    }
}

// Activate apology mode - COMPLETELY INVISIBLE
function activateApologyMode() {
    try {
        console.log("🙏 Starting INVISIBLE apology mode!");
        apologyMode = true;
        bowDetected = false;
        noseHistory = [];

        // Create ONLY debug canvas for green dot
        createDebugCanvas();

        // Add ESC key listener
        document.addEventListener('keydown', handleApologyEscape);

        console.log("👃 Apology mode activated - bow down 40px to clean!");

    } catch (error) {
        console.error("❌ Error in activateApologyMode:", error);
        alert("Error activating apology mode: " + error.message);
    }
}

// Create debug canvas - simple version
function createDebugCanvas() {
    console.log("📍 Creating debug canvas...");
    debugCanvas = document.createElement('canvas');
    debugCanvas.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        z-index: 10000;
        pointer-events: none;
    `;
    debugCanvas.width = window.innerWidth;
    debugCanvas.height = window.innerHeight;
    debugCtx = debugCanvas.getContext('2d');
    document.body.appendChild(debugCanvas);
    console.log("✅ Debug canvas created successfully");
}

// Handle ESC key during apology mode
function handleApologyEscape(e) {
    if (e.key === 'Escape' && apologyMode) {
        console.log("🔄 ESC pressed - canceling apology");
        e.preventDefault();
        e.stopPropagation();
        cancelApology();
    }
}

// Draw nose dot
function drawNoseDot(x, y) {
    if (!debugCtx) return;

    // Green dot with white outline
    debugCtx.fillStyle = '#00FF00';
    debugCtx.beginPath();
    debugCtx.arc(x, y, 12, 0, 2 * Math.PI);
    debugCtx.fill();

    debugCtx.strokeStyle = '#FFFFFF';
    debugCtx.lineWidth = 2;
    debugCtx.beginPath();
    debugCtx.arc(x, y, 12, 0, 2 * Math.PI);
    debugCtx.stroke();

    // Coordinates
    debugCtx.fillStyle = '#FFFFFF';
    debugCtx.font = '14px Arial';
    debugCtx.fillText(`${Math.round(x)}, ${Math.round(y)}`, x + 20, y - 10);
}

// Track bow gesture - INSTANT cleanup at 40px with forgiveness message
function trackBowGesture(noseX, noseY) {
    noseHistory.push({ x: noseX, y: noseY, time: Date.now() });

    // Keep only last 3 points for ultra-fast response
    if (noseHistory.length > 3) {
        noseHistory.shift();
    }

    if (noseHistory.length < 2) {
        return; // Just wait quietly
    }

    // Calculate movement from first tracked point to current
    const start = noseHistory[0];
    const current = noseHistory[noseHistory.length - 1];
    const movement = current.y - start.y;

    // INSTANT CLEANUP with forgiveness message
    if (movement >= bowThreshold && !bowDetected) {
        console.log(`🎯 40px reached! Instant cleanup: ${movement}px`);
        bowDetected = true;

        // Show forgiveness message first
        showForgivenessMessage();

        // Then cleanup after brief display
        setTimeout(() => {
            cleanupApologyMode();
            cleanAllDestruction();
        }, 1500); // 1.5 seconds to read the message

        return;
    }

    // Show green dot only
    if (debugCtx && !bowDetected) {
        // Progress indicator next to nose
        debugCtx.fillStyle = '#FFFF00';
        debugCtx.font = '16px Arial';
        debugCtx.fillText(`${Math.round(movement)}/${bowThreshold}px`, noseX + 25, noseY);
    }
}

// Show forgiveness message
function showForgivenessMessage() {
    // Create forgiveness overlay
    const forgivenessDiv = document.createElement('div');
    forgivenessDiv.id = 'forgivenessMessage';
    forgivenessDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 15000;
        
        color: #ffdd44;
        font-family: 'Silkscreen', monospace;
        font-size: 3rem;
        text-align: center;
        text-shadow: 0 0 20px #ffdd44;
        
        animation: forgivenessAppear 1.5s ease-out;
        pointer-events: none;
    `;

    forgivenessDiv.textContent = 'APOLOGY ACCEPTED';

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes forgivenessAppear {
            0% { 
                opacity: 0; 
                transform: translate(-50%, -50%) scale(0.5);
            }
            20% { 
                opacity: 1; 
                transform: translate(-50%, -50%) scale(1.1);
            }
            100% { 
                opacity: 1; 
                transform: translate(-50%, -50%) scale(1);
            }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(forgivenessDiv);

    // Remove the message after animation
    setTimeout(() => {
        if (forgivenessDiv && forgivenessDiv.parentNode) {
            forgivenessDiv.parentNode.removeChild(forgivenessDiv);
        }
        if (style && style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }, 1500);
}

// Update detection status - no overlay, just console
function updateDetectionStatus(message) {
    // No overlay to update anymore, just log to console
    console.log(`📱 ${message}`);
}

// Cleanup - no overlay to remove anymore
function cleanupApologyMode() {
    console.log("🧹 Quick cleanup - no screens to remove...");

    apologyMode = false;
    noseHistory = [];
    bowDetected = false;

    // Remove ESC key listener
    document.removeEventListener('keydown', handleApologyEscape);

    // Clean up face detector completely
    if (faceDetector) {
        try {
            faceDetector.close();
        } catch (e) {
            console.log("Face detector cleanup:", e.message);
        }
        faceDetector = null;
    }
    faceInitPromise = null;

    // Remove debug canvas (just the green dot)
    if (debugCanvas) {
        console.log("Removing debug canvas...");
        if (debugCanvas.parentNode) {
            debugCanvas.parentNode.removeChild(debugCanvas);
        }
        debugCanvas = null;
        debugCtx = null;
    }

    console.log("✅ Invisible cleanup complete");
}

// Use existing cleaning logic from script.js
function cleanAllDestruction() {
    console.log("🧹 Using existing cleaning logic from script.js...");

    // Reset current mode first
    if (typeof currentMode !== 'undefined') {
        console.log(`📋 Resetting currentMode from ${currentMode} to null`);
        currentMode = null;
    }

    // Use the exact same cleaning logic as the ESC key handler in script.js
    console.log("🟦 Clearing circle destruction...");
    if (typeof destructionActive !== 'undefined') destructionActive = false;
    if (typeof clear === 'function') clear();
    if (typeof drawnTiles !== 'undefined') drawnTiles = [];

    console.log("🟨 Clearing square destruction...");
    const squareCanvas = document.getElementById("squareCanvas");
    if (squareCanvas) squareCanvas.remove();

    console.log("🔺 Deactivating triangle...");
    if (typeof deactivateTriangleEffect === 'function') {
        deactivateTriangleEffect(); // This stops microphone and closes audio context
    }

    console.log("🔺 Clearing triangle destruction...");
    const triangleCanvas = document.getElementById("triangleCanvas");
    if (triangleCanvas) triangleCanvas.remove();

    // Restore the clean image (this should happen automatically via onResults -> showImage)
    console.log("🖼️ Image should restore automatically via main canvas loop");

    // Restore the UI message
    console.log("💬 Restoring message...");
    if (typeof messageDiv !== 'undefined' && messageDiv) {
        messageDiv.textContent = "Swipe to change your stress";
        messageDiv.classList.remove("hidden");
        console.log("💬 Message restored");
    }

    console.log("✅ Cleanup complete using script.js logic");
}

// Cancel apology (called by ESC key)
function cancelApology() {
    if (apologyMode) {
        console.log("🚫 Apology canceled by user");
        cleanupApologyMode();
        // Don't call cleanAllDestruction when canceling - leave destruction as-is
    }
}