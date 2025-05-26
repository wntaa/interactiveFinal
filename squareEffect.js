// Some initial writing and debugging support was assisted by AI (ChatGPT).
// All final decisions, code, and reflections are my own.

let squareCanvas, isDrawing = false, startX, startY, selectionBox;

function activateSquareEffect() {
    if (!document.getElementById("squareCanvas")) {
        squareCanvas = document.createElement('div');
        squareCanvas.id = "squareCanvas";
        squareCanvas.style.position = "absolute";
        squareCanvas.style.top = 0;
        squareCanvas.style.left = 0;
        squareCanvas.style.width = "100vw";
        squareCanvas.style.height = "100vh";
        squareCanvas.style.backgroundSize = "20px 20px";
        squareCanvas.style.backgroundPosition = "0 0, 0 10px, 10px -10px, -10px 0px";
        squareCanvas.className = "canvas";
        document.body.appendChild(squareCanvas);

        squareCanvas.addEventListener('mousedown', startDraw);
        squareCanvas.addEventListener('mousemove', drawBox);
        squareCanvas.addEventListener('mouseup', stopDraw);
        squareCanvas.addEventListener('contextmenu', e => e.preventDefault());
    }
}

function startDraw(e) {
    if (currentMode !== 'square') return;

    isDrawing = true;
    startX = e.clientX;
    startY = e.clientY;

    selectionBox = document.createElement('div');
    selectionBox.className = 'selection-box';
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    document.getElementById('squareCanvas').appendChild(selectionBox);
}

function drawBox(e) {
    if (currentMode !== 'square') return;

    if (!isDrawing) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(currentX, startX);
    const top = Math.min(currentY, startY);

    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
}

function stopDraw(e) {
    if (currentMode !== 'square') return;

    if (!isDrawing) return;
    isDrawing = false;

    const rect = selectionBox.getBoundingClientRect();
    if (rect.width > 50 && rect.height > 50) {
        createTextArea(rect.left, rect.top, rect.width, rect.height);
    }
    document.getElementById('squareCanvas').removeChild(selectionBox);
}

function createTextArea(x, y, width, height) {
    const textArea = document.createElement('div');
    textArea.className = 'text-area';
    textArea.style.left = x + 'px';
    textArea.style.top = y + 'px';
    textArea.style.width = width + 'px';
    textArea.style.height = height + 'px';
    textArea.innerHTML = generateText(width, height);

    document.getElementById('squareCanvas').appendChild(textArea);
}

function generateText(width, height) {
    const loremWords = [..."lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua".split(" ")];
    const fonts = ['Arial Black', 'Impact', 'Franklin Gothic Medium', 'Trebuchet MS', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia'];
    const area = width * height;
    const textAmount = Math.floor(area / 5000) + 5;
    let html = '';

    for (let i = 0; i < textAmount; i++) {
        const word = loremWords[Math.floor(Math.random() * loremWords.length)];
        const fontSize = Math.random() * (width / 3) + 12;
        const fontFamily = fonts[Math.floor(Math.random() * fonts.length)];
        const rotation = (Math.random() - 0.5) * 20;
        const wordWidth = fontSize * word.length * 0.6;
        const wordHeight = fontSize;
        const maxX = Math.max(0, width - wordWidth);
        const maxY = Math.max(0, height - wordHeight);
        const posX = Math.random() * maxX;
        const posY = Math.random() * maxY;
        const opacity = 1;

        const color = '#0000FF';

        html += `<span style="position: absolute; left: ${posX}px; top: ${posY}px; color:${color}; font-size: ${fontSize}px; font-family: '${fontFamily}', sans-serif; font-weight: ${Math.random() > 0.5 ? '900' : '400'}; transform: rotate(${rotation}deg); opacity: ${opacity}; text-transform: ${Math.random() > 0.7 ? 'uppercase' : 'none'}; font-style: ${Math.random() > 0.8 ? 'italic' : 'normal'};">${word}</span>`;
    }

    return html;
}