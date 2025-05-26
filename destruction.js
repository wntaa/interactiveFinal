// Some initial writing and debugging support was assisted by AI (ChatGPT).
// All final decisions, code, and reflections are my own.

let destructionActive = false;
let destructionCanvas;
let gridSize = 20;
let drawnTiles = [];

function setup() {
    destructionCanvas = createCanvas(windowWidth, windowHeight);
    destructionCanvas.id("destroyCanvas");
    clear(); // keep transparent until active
    noLoop();
}

function draw() {
    if (!destructionActive) return;
    for (let t of drawnTiles) {
        drawTile(t.x, t.y, t.type);
    }
}
function mouseDragged() {
    if (currentMode !== 'circle') return;
    generateTiles(mouseX, mouseY);
    redraw();
}

function mousePressed() {
    if (currentMode !== 'circle') return;
    generateTiles(mouseX, mouseY);
    redraw();
}

function generateTiles(mx, my) {
    let range = 100;
    for (let x = mx - range; x < mx + range; x += gridSize) {
        for (let y = my - range; y < my + range; y += gridSize) {
            if (x < 0 || y < 0 || x > width || y > height) continue;
            let d = dist(mx, my, x, y);
            let prob = map(d, 0, range, 1, 0);
            if (random() < prob) {
                let shapeType = floor(random(5));
                drawnTiles.push({ x: x, y: y, type: shapeType });
            }
        }
    }
}

function drawTile(x, y, type) {
    push();
    translate(x, y);
    fill(0, 0, 255);
    noStroke();
    switch (type) {
        case 0:
            rect(0, 0, gridSize, gridSize);
            break;
        case 1:
            rect(gridSize / 3, 0, gridSize / 3, gridSize);
            rect(0, gridSize / 3, gridSize, gridSize / 3);
            break;
        case 2:
            triangle(0, gridSize, gridSize / 2, 0, gridSize, gridSize);
            break;
        case 3:
            rect(0, 0, gridSize / 2, gridSize / 2);
            rect(gridSize / 2, gridSize / 2, gridSize / 2, gridSize / 2);
            break;
        case 4:
            for (let i = 0; i < gridSize; i += gridSize / 4) {
                for (let j = 0; j < gridSize; j += gridSize / 4) {
                    rect(i, j, gridSize / 8, gridSize / 8);
                }
            }
            break;
    }
    pop();
}

// 🔥 Trigger this from index.html
function enableDestructionMode() {
    destructionActive = true;
    clear();
    redraw();
}
