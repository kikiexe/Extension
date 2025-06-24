document.addEventListener('DOMContentLoaded', () => {
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
    const replacementColorSwatch = document.getElementById('replacementColorSwatch');

    let uploadedImage = null;
    let modifiedImageData = null;

    function rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x =>
            x.toString(16).padStart(2, '0')
        ).join('').toUpperCase();
    }

    function hexToRgb(hex) {
        let cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
        if (cleanHex.length === 3) {
            cleanHex = cleanHex.split('').map(char => char + char).join('');
        }
        if (cleanHex.length !== 6) return null;
        const bigint = parseInt(cleanHex, 16);
        if (isNaN(bigint)) return null;
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r, g, b];
    }

    function getColorDifference(rgb1, rgb2) {
        const dr = rgb1[0] - rgb2[0];
        const dg = rgb1[1] - rgb2[1];
        const db = rgb1[2] - rgb2[2];
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    function drawCanvas(canvas, ctx, imageOrImageData) {
        if (!imageOrImageData) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (imageOrImageData instanceof ImageData) {
            ctx.putImageData(imageOrImageData, 0, 0);
        } else {
            ctx.drawImage(imageOrImageData, 0, 0);
        }
    }

    function drawMainImageDisplay() {
        drawCanvas(mainImageDisplayCanvas, mainImageDisplayCtx, uploadedImage);
    }

    function drawOutputCanvas() {
        drawCanvas(outputCanvas, outputCtx, modifiedImageData);
    }

    loadImageButton.addEventListener('click', () => {
        const imageUrl = imageUrlInput.value.trim();
        if (!imageUrl) return;

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            uploadedImage = img;

            mainImageDisplayCanvas.width = img.width;
            mainImageDisplayCanvas.height = img.height;
            outputCanvas.width = img.width;
            outputCanvas.height = img.height;

            drawMainImageDisplay();
            outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
            modifiedImageData = null;

            hexValueText.textContent = 'Klik pada gambar untuk mendapatkan warna.';
            colorSwatch.style.backgroundColor = 'transparent';
            document.documentElement.style.setProperty('--accent', '#A020F0');

            updateInputSwatch(targetColorHexInput.value, targetColorSwatch);
            updateInputSwatch(replacementColorHexInput.value, replacementColorSwatch);
        };
        img.onerror = () => alert('Gagal memuat gambar.');
        img.src = imageUrl;
    });

    mainImageDisplayCanvas.addEventListener('click', (event) => {
        if (!uploadedImage) return;

        const rect = mainImageDisplayCanvas.getBoundingClientRect();
        const scaleX = mainImageDisplayCanvas.width / rect.width;
        const scaleY = mainImageDisplayCanvas.height / rect.height;
        const x = event.offsetX * scaleX;
        const y = event.offsetY * scaleY;

        if (x < 0 || x >= uploadedImage.width || y < 0 || y >= uploadedImage.height) return;

        const pixel = mainImageDisplayCtx.getImageData(x, y, 1, 1).data;
        const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

        hexValueText.textContent = `Kode Hex: ${hex}`;
        colorSwatch.style.backgroundColor = hex;
        document.documentElement.style.setProperty('--accent', hex);

        targetColorHexInput.value = hex;
        updateInputSwatch(hex, targetColorSwatch);
    });

    colorToleranceInput.addEventListener('input', () => {
        toleranceValueSpan.textContent = `${colorToleranceInput.value}%`;
        updateSliderProgress();
    });

    function updateSliderProgress() {
        const slider = colorToleranceInput;
        const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        document.documentElement.style.setProperty('--slider-progress', `${percentage}%`);
    }

    processColorChangeButton.addEventListener('click', () => {
        if (!uploadedImage) return;

        const targetColorHex = targetColorHexInput.value.trim();
        const replacementColorHex = replacementColorHexInput.value.trim();
        const tolerancePercentage = parseInt(colorToleranceInput.value);

        const targetRgb = hexToRgb(targetColorHex);
        const replacementRgb = hexToRgb(replacementColorHex);
        if (!targetRgb || !replacementRgb) return;

        const imageData = mainImageDisplayCtx.getImageData(0, 0, mainImageDisplayCanvas.width, mainImageDisplayCanvas.height);
        const pixels = imageData.data;

        const maxDistance = Math.sqrt(255 * 255 * 3);
        const effectiveTolerance = (tolerancePercentage / 100) * maxDistance;

        for (let i = 0; i < pixels.length; i += 4) {
            const current = [pixels[i], pixels[i + 1], pixels[i + 2]];
            if (getColorDifference(current, targetRgb) <= effectiveTolerance) {
                pixels[i] = replacementRgb[0];
                pixels[i + 1] = replacementRgb[1];
                pixels[i + 2] = replacementRgb[2];
            }
        }

        modifiedImageData = imageData;
        drawOutputCanvas();
        alert('Penggantian warna selesai! Lihat hasilnya di bawah.');
    });

    downloadModifiedImageButton.addEventListener('click', () => {
        if (!modifiedImageData) return;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = uploadedImage.width;
        tempCanvas.height = uploadedImage.height;
        tempCtx.putImageData(modifiedImageData, 0, 0);

        const a = document.createElement('a');
        a.href = tempCanvas.toDataURL('image/png');
        a.download = 'modified_image.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    function updateInputSwatch(hex, element) {
        const rgb = hexToRgb(hex);
        if (rgb) {
            element.style.backgroundColor = hex;
            element.style.borderColor = rgbToHex(
                rgb[0] > 128 ? rgb[0] - 50 : rgb[0] + 50,
                rgb[1] > 128 ? rgb[1] - 50 : rgb[1] + 50,
                rgb[2] > 128 ? rgb[2] - 50 : rgb[2] + 50
            );
        } else {
            element.style.backgroundColor = 'transparent';
            element.style.borderColor = 'var(--border-retro)';
        }
    }

    targetColorHexInput.addEventListener('input', e => {
        updateInputSwatch(e.target.value, targetColorSwatch);
    });

    replacementColorHexInput.addocument.addEventListener('DOMContentLoaded', () => {
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
    const replacementColorSwatch = document.getElementById('replacementColorSwatch');

    let uploadedImage = null;
    let modifiedImageData = null;

    function rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x =>
            x.toString(16).padStart(2, '0')
        ).join('').toUpperCase();
    }

    function hexToRgb(hex) {
        let cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
        if (cleanHex.length === 3) {
            cleanHex = cleanHex.split('').map(char => char + char).join('');
        }
        if (cleanHex.length !== 6) return null;
        const bigint = parseInt(cleanHex, 16);
        if (isNaN(bigint)) return null;
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r, g, b];
    }

    function getColorDifference(rgb1, rgb2) {
        const dr = rgb1[0] - rgb2[0];
        const dg = rgb1[1] - rgb2[1];
        const db = rgb1[2] - rgb2[2];
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    function drawCanvas(canvas, ctx, imageOrImageData) {
        if (!imageOrImageData) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (imageOrImageData instanceof ImageData) {
            ctx.putImageData(imageOrImageData, 0, 0);
        } else {
            ctx.drawImage(imageOrImageData, 0, 0);
        }
    }

    function drawMainImageDisplay() {
        drawCanvas(mainImageDisplayCanvas, mainImageDisplayCtx, uploadedImage);
    }

    function drawOutputCanvas() {
        drawCanvas(outputCanvas, outputCtx, modifiedImageData);
    }

    loadImageButton.addEventListener('click', () => {
        const imageUrl = imageUrlInput.value.trim();
        if (!imageUrl) return;

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            uploadedImage = img;

            mainImageDisplayCanvas.width = img.width;
            mainImageDisplayCanvas.height = img.height;
            outputCanvas.width = img.width;
            outputCanvas.height = img.height;

            drawMainImageDisplay();
            outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
            modifiedImageData = null;

            hexValueText.textContent = 'Klik pada gambar untuk mendapatkan warna.';
            colorSwatch.style.backgroundColor = 'transparent';
            document.documentElement.style.setProperty('--accent', '#A020F0');

            updateInputSwatch(targetColorHexInput.value, targetColorSwatch);
            updateInputSwatch(replacementColorHexInput.value, replacementColorSwatch);
        };
        img.onerror = () => alert('Gagal memuat gambar.');
        img.src = imageUrl;
    });

    mainImageDisplayCanvas.addEventListener('click', (event) => {
        if (!uploadedImage) return;

        const rect = mainImageDisplayCanvas.getBoundingClientRect();
        const scaleX = mainImageDisplayCanvas.width / rect.width;
        const scaleY = mainImageDisplayCanvas.height / rect.height;
        const x = event.offsetX * scaleX;
        const y = event.offsetY * scaleY;

        if (x < 0 || x >= uploadedImage.width || y < 0 || y >= uploadedImage.height) return;

        const pixel = mainImageDisplayCtx.getImageData(x, y, 1, 1).data;
        const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

        hexValueText.textContent = `Kode Hex: ${hex}`;
        colorSwatch.style.backgroundColor = hex;
        document.documentElement.style.setProperty('--accent', hex);

        targetColorHexInput.value = hex;
        updateInputSwatch(hex, targetColorSwatch);
    });

    colorToleranceInput.addEventListener('input', () => {
        toleranceValueSpan.textContent = `${colorToleranceInput.value}%`;
        updateSliderProgress();
    });

    function updateSliderProgress() {
        const slider = colorToleranceInput;
        const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        document.documentElement.style.setProperty('--slider-progress', `${percentage}%`);
    }

    processColorChangeButton.addEventListener('click', () => {
        if (!uploadedImage) return;

        const targetColorHex = targetColorHexInput.value.trim();
        const replacementColorHex = replacementColorHexInput.value.trim();
        const tolerancePercentage = parseInt(colorToleranceInput.value);

        const targetRgb = hexToRgb(targetColorHex);
        const replacementRgb = hexToRgb(replacementColorHex);
        if (!targetRgb || !replacementRgb) return;

        const imageData = mainImageDisplayCtx.getImageData(0, 0, mainImageDisplayCanvas.width, mainImageDisplayCanvas.height);
        const pixels = imageData.data;

        const maxDistance = Math.sqrt(255 * 255 * 3);
        const effectiveTolerance = (tolerancePercentage / 100) * maxDistance;

        for (let i = 0; i < pixels.length; i += 4) {
            const current = [pixels[i], pixels[i + 1], pixels[i + 2]];
            if (getColorDifference(current, targetRgb) <= effectiveTolerance) {
                pixels[i] = replacementRgb[0];
                pixels[i + 1] = replacementRgb[1];
                pixels[i + 2] = replacementRgb[2];
            }
        }

        modifiedImageData = imageData;
        drawOutputCanvas();
        alert('Penggantian warna selesai! Lihat hasilnya di bawah.');
    });

    downloadModifiedImageButton.addEventListener('click', () => {
        if (!modifiedImageData) return;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = uploadedImage.width;
        tempCanvas.height = uploadedImage.height;
        tempCtx.putImageData(modifiedImageData, 0, 0);

        const a = document.createElement('a');
        a.href = tempCanvas.toDataURL('image/png');
        a.download = 'modified_image.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    function updateInputSwatch(hex, element) {
        const rgb = hexToRgb(hex);
        if (rgb) {
            element.style.backgroundColor = hex;
            element.style.borderColor = rgbToHex(
                rgb[0] > 128 ? rgb[0] - 50 : rgb[0] + 50,
                rgb[1] > 128 ? rgb[1] - 50 : rgb[1] + 50,
                rgb[2] > 128 ? rgb[2] - 50 : rgb[2] + 50
            );
        } else {
            element.style.backgroundColor = 'transparent';
            element.style.borderColor = 'var(--border-retro)';
        }
    }

    targetColorHexInput.addEventListener('input', e => {
        updateInputSwatch(e.target.value, targetColorSwatch);
    });

    replacementColorHexInput.addEventListener('input', e => {
        updateInputSwatch(e.target.value, replacementColorSwatch);
    });

    // Init slider dan swatch saat pertama kali dimuat
    updateSliderProgress();
    updateInputSwatch(targetColorHexInput.value, targetColorSwatch);
    updateInputSwatch(replacementColorHexInput.value, replacementColorSwatch);
});dEventListener('input', e => {
        updateInputSwatch(e.target.value, replacementColorSwatch);
    });

    // Init slider dan swatch saat pertama kali dimuat
    updateSliderProgress();
    updateInputSwatch(targetColorHexInput.value, targetColorSwatch);
    updateInputSwatch(replacementColorHexInput.value, replacementColorSwatch);
});