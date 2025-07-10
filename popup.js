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
    
    // handles drawing the image on the canvas (buat gambar di kanvas)
    function drawCanvas(canvas, ctx, imageOrImageData) {
        if (!imageOrImageData) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (imageOrImageData instanceof ImageData) {
            ctx.putImageData(imageOrImageData, 0, 0);
        } else {
            // Gambar image ke kanvas sesuai ukuran internalnya (resolusi asli)
            ctx.drawImage(imageOrImageData, 0, 0, canvas.width, canvas.height);
        }
    }

    // this runs when you click the 'load image' button (jalan pas kamu klik tombol 'muat gambar')
    loadImageButton.addEventListener('click', () => {
        const imageUrl = imageUrlInput.value.trim();
        if (!imageUrl) return;

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            uploadedImage = img;
            
            // --- PERBAIKAN BUG DIMULAI (BAGIAN 1) ---
            // Set resolusi internal kanvas agar sama dengan resolusi asli gambar.
            // Ini penting untuk menjaga kualitas dan akurasi color picking.
            mainImageDisplayCanvas.width = img.width;
            mainImageDisplayCanvas.height = img.height;
            outputCanvas.width = img.width;
            outputCanvas.height = img.height;
            
            // Hapus baris yang mengatur style.width dan style.height secara manual.
            // Biarkan file CSS (popup.css) yang mengatur ukuran tampilan kanvas
            // agar menjadi responsif (width: 100%; height: auto;).
            // --- PERBAIKAN BUG SELESAI (BAGIAN 1) ---

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

        // --- PERBAIKAN BUG DIMULAI (BAGIAN 2) ---
        // Dapatkan ukuran dan posisi kanvas yang ditampilkan di layar.
        const rect = canvas.getBoundingClientRect();

        // Hitung posisi mouse relatif terhadap elemen kanvas.
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Hitung koordinat piksel yang sebenarnya di dalam data gambar (resolusi asli)
        // dengan memperhitungkan rasio skala antara ukuran tampilan dan ukuran internal.
        const x = Math.floor(mouseX * (canvas.width / rect.width));
        const y = Math.floor(mouseY * (canvas.height / rect.height));
        // --- PERBAIKAN BUG SELESAI (BAGIAN 2) ---

        // Pastikan koordinat berada dalam batas sebelum mengambil data piksel.
        const finalX = Math.max(0, Math.min(canvas.width - 1, x));
        const finalY = Math.max(0, Math.min(canvas.height - 1, y));

        const pixel = ctx.getImageData(finalX, finalY, 1, 1).data;
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
        drawCanvas(outputCanvas, outputCtx, modifiedImageData);
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

    // get things ready when the page first loads (siapin semuanya pas halaman pertama kali dimuat)
    updateSliderProgress();
    updateInputSwatch(targetColorHexInput.value, targetColorSwatch);
});