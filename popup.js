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
        const replacementColorSwatch = document.getElementById('replacementColorSwatch');

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
                ctx.drawImage(imageOrImageData, 0, 0);
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
                mainImageDisplayCanvas.width = img.width;
                mainImageDisplayCanvas.height = img.height;
                outputCanvas.width = img.width;
                outputCanvas.height = img.height;

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

            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = event.offsetX * scaleX;
            const y = event.offsetY * scaleY;

            const pixel = ctx.getImageData(x, y, 1, 1).data;
            const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

            hexValueText.textContent = `Hex Code: ${hex}`;
            colorSwatch.style.backgroundColor = hex;
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

            // figure out which image to use, the new one or the original (cari tau gambar mana yang mau dipake, yang baru atau yang asli)
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

            // save the new picture and show it in the result box (simpan gambar baru dan tampilin di kotak hasil)
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

        // for the replacement color text field (buat kolom teks warna pengganti)
        replacementColorHexInput.addEventListener('input', e => {
            updateInputSwatch(e.target.value, replacementColorSwatch);
        });

        // get things ready when the page first loads (siapin semuanya pas halaman pertama kali dimuat)
        updateSliderProgress();
        updateInputSwatch(targetColorHexInput.value, targetColorSwatch);
        updateInputSwatch(replacementColorHexInput.value, replacementColorSwatch);
    });
