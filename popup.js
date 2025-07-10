document.addEventListener('DOMContentLoaded', () => {
    // grab all the stuff from the html (ambil semua elemen dari html)
    const imageUrlInput = document.getElementById('imageUrl');
    const loadImageButton = document.getElementById('loadImage');
    const mainImageDisplayCanvas = document.getElementById('mainImageDisplayCanvas');
    const mainImageDisplayCtx = mainImageDisplayCanvas.getContext('2d', { willReadFrequently: true });
    const hexCodeDisplay = document.getElementById('hexCodeDisplay');
    const colorSwatch = document.getElementById('colorSwatch');
    const hexValueText = document.getElementById('hexValueText');

    const targetColorHexInput = document.getElementById('targetColorHex');
    const replacementColorHexInput = document.getElementById('replacementColorHex');
    const colorToleranceInput = document.getElementById('colorTolerance');
    const toleranceValueSpan = document.getElementById('toleranceValue');
    const processColorChangeButton = document.getElementById('processColorChange');

    const outputCanvas = document.getElementById('outputCanvas');
    const outputCtx = outputCanvas.getContext('2d', { willReadFrequently: true });
    const downloadModifiedImageButton = document.getElementById('downloadModifiedImage');

    const targetColorSwatch = document.getElementById('targetColorSwatch');
    const replacementColorPicker = document.getElementById('replacementColorPicker');
    
    const copySourceColorButton = document.getElementById('copySourceColorButton');
    const copyReplacementColorButton = document.getElementById('copyReplacementColorButton');

    let uploadedImage = null;
    let modifiedImageData = null;
    // HAPUS: Semua variabel zoom dan pan

    // turns rgb color to hex (ubah warna rgb ke hex)
    function rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    // turns hex color to rgb (ubah warna hex ke rgb)
    function hexToRgb(hex) {
        let cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
        if (cleanHex.length === 3) { cleanHex = cleanHex.split('').map(char => char + char).join(''); }
        if (cleanHex.length !== 6) return null;
        const bigint = parseInt(cleanHex, 16);
        if (isNaN(bigint)) return null;
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    }

    // checks how different two colors are (cek seberapa beda dua warna)
    function getColorDifference(rgb1, rgb2) {
        const dr = rgb1[0] - rgb2[0];
        const dg = rgb1[1] - rgb2[1];
        const db = rgb1[2] - rgb2[2];
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }
    
    // handles drawing the image on the canvas with zoom and pan (buat gambar di kanvas dengan zoom dan pan)
    function drawCanvas(canvas, ctx, imageOrImageData) {
        if (!imageOrImageData) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (imageOrImageData instanceof ImageData) {
            ctx.putImageData(imageOrImageData, 0, 0);
        } else {
            ctx.drawImage(imageOrImageData, 0, 0);
        }
    }

    // Reset zoom and pan untuk main canvas saja
    function resetCanvasView(canvasType) {
        if (canvasType === 'main') {
            if (uploadedImage) {
                drawCanvas(mainImageDisplayCanvas, mainImageDisplayCtx, uploadedImage);
            }
        } else if (canvasType === 'output') {
            if (modifiedImageData) {
                drawCanvas(outputCanvas, outputCtx, modifiedImageData);
            }
        }
    }

    // Handle mouse wheel zoom
    function handleCanvasZoom(event, canvasType) {
        event.preventDefault();
        
        const delta = event.deltaY > 0 ? 0.9 : 1.1;
        const rect = event.target.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        if (canvasType === 'main') {
            // const oldZoom = mainCanvasZoom; // HAPUS
            // mainCanvasZoom = Math.max(0.1, Math.min(5, mainCanvasZoom * delta)); // HAPUS
            
            // // Adjust pan to zoom towards mouse position // HAPUS
            // const zoomRatio = mainCanvasZoom / oldZoom; // HAPUS
            // mainCanvasPanX = mouseX - (mouseX - mainCanvasPanX) * zoomRatio; // HAPUS
            // mainCanvasPanY = mouseY - (mouseY - mainCanvasPanY) * zoomRatio; // HAPUS
            
            if (uploadedImage) {
                drawCanvas(mainImageDisplayCanvas, mainImageDisplayCtx, uploadedImage);
            }
        } else if (canvasType === 'output') {
            // const oldZoom = outputCanvasZoom; // HAPUS
            // outputCanvasZoom = Math.max(0.1, Math.min(5, outputCanvasZoom * delta)); // HAPUS
            
            // // Adjust pan to zoom towards mouse position // HAPUS
            // const zoomRatio = outputCanvasZoom / oldZoom; // HAPUS
            // outputCanvasPanX = mouseX - (mouseX - outputCanvasPanX) * zoomRatio; // HAPUS
            // outputCanvasPanY = mouseY - (mouseY - outputCanvasPanY) * zoomRatio; // HAPUS
            
            if (modifiedImageData) {
                drawCanvas(outputCanvas, outputCtx, modifiedImageData);
            }
        }
    }

    // Handle mouse down for panning
    function handleCanvasMouseDown(event, canvasType) {
        if (event.button === 0) { // Left mouse button only
            if (canvasType === 'main') {
                // isMainCanvasDragging = true; // HAPUS
                // lastMainCanvasMouseX = event.clientX; // HAPUS
                // lastMainCanvasMouseY = event.clientY; // HAPUS
                // mainImageDisplayCanvas.style.cursor = 'grabbing'; // HAPUS
            } else if (canvasType === 'output') {
                // isOutputCanvasDragging = true; // HAPUS
                // lastOutputCanvasMouseX = event.clientX; // HAPUS
                // lastOutputCanvasMouseY = event.clientY; // HAPUS
                // outputCanvas.style.cursor = 'grabbing'; // HAPUS
            }
        }
    }

    // Handle mouse move for panning
    function handleCanvasMouseMove(event, canvasType) {
        if (canvasType === 'main' && false) { // HAPUS
            const deltaX = event.clientX - lastMainCanvasMouseX; // HAPUS
            const deltaY = event.clientY - lastMainCanvasMouseY; // HAPUS
            
            // mainCanvasPanX += deltaX; // HAPUS
            // mainCanvasPanY += deltaY; // HAPUS
            
            // lastMainCanvasMouseX = event.clientX; // HAPUS
            // lastMainCanvasMouseY = event.clientY; // HAPUS
            
            if (uploadedImage) {
                drawCanvas(mainImageDisplayCanvas, mainImageDisplayCtx, uploadedImage);
            }
        } else if (canvasType === 'output' && false) { // HAPUS
            const deltaX = event.clientX - lastOutputCanvasMouseX; // HAPUS
            const deltaY = event.clientY - lastOutputCanvasMouseY; // HAPUS
            
            // outputCanvasPanX += deltaX; // HAPUS
            // outputCanvasPanY += deltaY; // HAPUS
            
            // lastOutputCanvasMouseX = event.clientX; // HAPUS
            // lastOutputCanvasMouseY = event.clientY; // HAPUS
            
            if (modifiedImageData) {
                drawCanvas(outputCanvas, outputCtx, modifiedImageData);
            }
        }
    }

    // Handle mouse up for panning
    function handleCanvasMouseUp(event, canvasType) {
        if (canvasType === 'main') {
            // isMainCanvasDragging = false; // HAPUS
            // mainImageDisplayCanvas.style.cursor = 'crosshair'; // HAPUS
        } else if (canvasType === 'output') {
            // isOutputCanvasDragging = false; // HAPUS
            // outputCanvas.style.cursor = 'crosshair'; // HAPUS
        }
    }

    // Add zoom and pan event listeners hanya untuk mainImageDisplayCanvas
    function setupCanvasControls() {
        // Main canvas controls
        // mainImageDisplayCanvas.addEventListener('wheel', (e) => handleCanvasZoom(e, 'main')); // HAPUS
        // mainImageDisplayCanvas.addEventListener('mousedown', (e) => handleCanvasMouseDown(e, 'main')); // HAPUS
        // mainImageDisplayCanvas.addEventListener('mousemove', (e) => handleCanvasMouseMove(e, 'main')); // HAPUS
        // mainImageDisplayCanvas.addEventListener('mouseup', (e) => handleCanvasMouseUp(e, 'main')); // HAPUS
        // mainImageDisplayCanvas.addEventListener('mouseleave', (e) => handleCanvasMouseUp(e, 'main')); // HAPUS

        // Zoom control buttons untuk main canvas
        // document.getElementById('mainCanvasZoomIn').addEventListener('click', () => { // HAPUS
        //     mainCanvasZoom = Math.min(5, mainCanvasZoom * 1.2); // HAPUS
        //     if (uploadedImage) { // HAPUS
        //         drawCanvas(mainImageDisplayCanvas, mainImageDisplayCtx, uploadedImage, mainCanvasZoom, mainCanvasPanX, mainCanvasPanY); // HAPUS
        //     } // HAPUS
        // }); // HAPUS
        // document.getElementById('mainCanvasZoomOut').addEventListener('click', () => { // HAPUS
        //     mainCanvasZoom = Math.max(0.1, mainCanvasZoom / 1.2); // HAPUS
        //     if (uploadedImage) { // HAPUS
        //         drawCanvas(mainImageDisplayCanvas, mainImageDisplayCtx, uploadedImage, mainCanvasZoom, mainCanvasPanX, mainCanvasPanY); // HAPUS
        //     } // HAPUS
        // }); // HAPUS
        // document.getElementById('mainCanvasReset').addEventListener('click', () => { // HAPUS
        //     resetCanvasView('main'); // HAPUS
        // }); // HAPUS
        // Tidak ada event listener zoom/pan untuk outputCanvas
    }

    // this runs when you click the 'load image' button (jalan pas kamu klik tombol 'muat gambar')
    loadImageButton.addEventListener('click', () => {
        const imageUrl = imageUrlInput.value.trim();
        if (!imageUrl) return;

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            uploadedImage = img;
            const dpr = window.devicePixelRatio || 1;
            mainImageDisplayCanvas.width = img.width * dpr;
            mainImageDisplayCanvas.height = img.height * dpr;
            mainImageDisplayCanvas.style.width = img.width + "px";
            mainImageDisplayCanvas.style.height = img.height + "px";

            outputCanvas.width = img.width * dpr;
            outputCanvas.height = img.height * dpr;
            outputCanvas.style.width = img.width + "px";
            outputCanvas.style.height = img.height + "px";

            // Reset zoom and pan when loading new image
            resetCanvasView('main');
            resetCanvasView('output');

            drawCanvas(mainImageDisplayCanvas, mainImageDisplayCtx, uploadedImage);
            outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
            modifiedImageData = null;

            hexValueText.textContent = 'Click on the image to get a color.';
            colorSwatch.style.backgroundColor = 'transparent';
        };
        img.onerror = () => alert('Failed to load image. Make sure the URL is valid and accessible.');
        img.src = imageUrl;
    });

    // this runs when you click a canvas to pick a color (jalan pas kamu klik kanvas buat pilih warna)
    const handleColorPick = (event) => {
        const canvas = event.target;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!canvas.width || !canvas.height) return;

        // Step 1: mouse position relative to canvas DOM
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const mouseX = (event.clientX - rect.left) * dpr;
        const mouseY = (event.clientY - rect.top) * dpr;

        // Step 2: scale to canvas pixel coordinates
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = mouseX * scaleX;
        const canvasY = mouseY * scaleY;

        // Step 3: adjust for pan and zoom
        let x, y;
        if (canvas === mainImageDisplayCanvas) {
            x = Math.max(0, Math.min(canvas.width - 1, Math.floor(mouseX)));
            y = Math.max(0, Math.min(canvas.height - 1, Math.floor(mouseY)));
        } else {
            x = Math.max(0, Math.min(canvas.width - 1, Math.floor(mouseX)));
            y = Math.max(0, Math.min(canvas.height - 1, Math.floor(mouseY)));
        }

        // Ensure coordinates are within bounds
        x = Math.max(0, Math.min(canvas.width - 1, x));
        y = Math.max(0, Math.min(canvas.height - 1, y));

        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

        // Perbarui tampilan info di atas
        hexValueText.textContent = `Hex Code: ${hex}`;
        colorSwatch.style.backgroundColor = hex;
        
        // Perbarui juga input field dan kotak warna "Source Color"
        targetColorHexInput.value = hex;
        updateInputSwatch(hex, targetColorSwatch);
    };

    // make both canvases clickable (bikin kedua kanvas bisa diklik)
    mainImageDisplayCanvas.addEventListener('click', handleColorPick);
    outputCanvas.addEventListener('click', handleColorPick);

    // for the tolerance slider (buat slider toleransi)
    colorToleranceInput.addEventListener('input', () => {
        toleranceValueSpan.textContent = `${colorToleranceInput.value}%`;
        updateSliderProgress();
    });
    
    // makes the slider look like it's filling up (bikin slidernya keliatan keisi)
    function updateSliderProgress() {
        const slider = colorToleranceInput;
        const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        document.documentElement.style.setProperty('--slider-progress', `${percentage}%`);
    }

    // this runs when you click the 'replace color' button (jalan pas kamu klik tombol 'ganti warna')
    processColorChangeButton.addEventListener('click', () => {
        const targetColorHex = targetColorHexInput.value.trim();
        const replacementColorHex = replacementColorHexInput.value.trim();
        const tolerancePercentage = parseInt(colorToleranceInput.value);
        const targetRgb = hexToRgb(targetColorHex);
        const replacementRgb = hexToRgb(replacementColorHex);
        
        if (!targetRgb) { alert('Invalid Source Color Hex format.'); return; }
        if (!replacementRgb) { alert('Invalid Replacement Color Hex format.'); return; }

        const sourceCtx = modifiedImageData ? outputCtx : mainImageDisplayCtx;
        const sourceCanvas = modifiedImageData ? outputCanvas : mainImageDisplayCanvas;

        if (!sourceCanvas.width || !sourceCanvas.height) {
            alert('Please load an image first.');
            return;
        }

        const imageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        const pixels = imageData.data;
        const maxDistance = Math.sqrt(255 * 255 * 3);
        const effectiveTolerance = (tolerancePercentage / 100) * maxDistance;

        for (let i = 0; i < pixels.length; i += 4) {
            const currentRgb = [pixels[i], pixels[i + 1], pixels[i + 2]];
            if (getColorDifference(currentRgb, targetRgb) <= effectiveTolerance) {
                pixels[i] = replacementRgb[0];
                pixels[i + 1] = replacementRgb[1];
                pixels[i + 2] = replacementRgb[2];
            }
        }
        
        modifiedImageData = imageData;
        drawCanvas(outputCanvas, outputCtx, modifiedImageData); // selalu normal
    });

    // for the download button (buat tombol unduh)
    downloadModifiedImageButton.addEventListener('click', () => {
        const canvasToDownload = modifiedImageData ? outputCanvas : mainImageDisplayCanvas;
        if (!canvasToDownload.width || !canvasToDownload.height) {
            alert('No image to download.');
            return;
        }

        const a = document.createElement('a');
        a.href = canvasToDownload.toDataURL('image/png');
        a.download = 'modified_image.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    // updates the little color box next to the text field (update kotak warna kecil di sebelah kolom teks)
    function updateInputSwatch(hex, element) {
        if (hexToRgb(hex)) {
            element.style.backgroundColor = hex;
        } else {
            element.style.backgroundColor = 'transparent';
        }
    }

    // for the source color text field (buat kolom teks warna asal)
    targetColorHexInput.addEventListener('input', e => {
        updateInputSwatch(e.target.value, targetColorSwatch);
    });

    // new logic for syncing the color picker and text field (logika baru untuk sinkronisasi)
    replacementColorPicker.addEventListener('input', (e) => {
        const newColor = e.target.value.toUpperCase();
        replacementColorHexInput.value = newColor;
    });

    replacementColorHexInput.addEventListener('input', (e) => {
        const newColor = e.target.value;
        if (hexToRgb(newColor)) {
            replacementColorPicker.value = newColor;
        }
    });
    
    // reusable copy function (fungsi salin yang bisa dipakai ulang)
    function copyToClipboard(text, button) {
        if (!text) return;

        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            const originalContent = button.innerHTML;
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.innerHTML = originalContent;
            }, 1500);
        } catch (err) {
            alert('Oops, unable to copy');
        }

        document.body.removeChild(textArea);
    }

    // copy button for source color (tombol salin untuk warna asal)
    copySourceColorButton.addEventListener('click', () => {
        copyToClipboard(targetColorHexInput.value, copySourceColorButton);
    });

    // copy button for replacement color (tombol salin untuk warna pengganti)
    copyReplacementColorButton.addEventListener('click', () => {
        copyToClipboard(replacementColorHexInput.value, copyReplacementColorButton);
    });

    // Setup canvas controls
    // setupCanvasControls(); // HAPUS

    // get things ready when the page first loads (siapin semuanya pas halaman pertama kali dimuat)
    updateSliderProgress();
    updateInputSwatch(targetColorHexInput.value, targetColorSwatch);
});
