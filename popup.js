document.addEventListener('DOMContentLoaded', () => {
    const mainImageUpload = document.getElementById('mainImageUpload');
    const paletteImageUpload = document.getElementById('paletteImageUpload');
    const processGradingBtn = document.getElementById('processGrading');
    const imageCanvas = document.getElementById('imageCanvas');
    const downloadImageBtn = document.getElementById('downloadImage');
    const imagePreviewCard = document.getElementById('imagePreviewCard');
    const ctx = imageCanvas.getContext('2d');

    const extractedPaletteCard = document.getElementById('extractedPaletteCard');
    const extractedPaletteDiv = document.getElementById('extractedPalette');

    let mainImage = null;
    let paletteImage = null;

    // Fungsi utilitas untuk menghitung rata-rata dan standar deviasi (tidak berubah)
    function analyzeImageColors(imageData) {
        const pixels = imageData.data;
        let sumR = 0, sumG = 0, sumB = 0;
        let count = 0;

        for (let i = 0; i < pixels.length; i += 4) {
            sumR += pixels[i];
            sumG += pixels[i + 1];
            sumB += pixels[i + 2];
            count++;
        }

        const meanR = sumR / count;
        const meanG = sumG / count;
        const meanB = sumB / count;

        let sumSqDiffR = 0, sumSqDiffG = 0, sumSqDiffB = 0;

        for (let i = 0; i < pixels.length; i += 4) {
            sumSqDiffR += Math.pow(pixels[i] - meanR, 2);
            sumSqDiffG += Math.pow(pixels[i + 1] - meanG, 2);
            sumSqDiffB += Math.pow(pixels[i + 2] - meanB, 2);
        }

        const stdDevR = Math.sqrt(sumSqDiffR / count);
        const stdDevG = Math.sqrt(sumSqDiffG / count);
        const stdDevB = Math.sqrt(sumSqDiffB / count);

        return {
            mean: { r: meanR, g: meanG, b: meanB },
            stdDev: { r: stdDevR, g: stdDevG, b: stdDevB }
        };
    }

    // Fungsi untuk mengubah RGB ke Hex
    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    // Fungsi untuk menghitung jarak Euclidean antara dua warna RGB
    function colorDistance(rgb1, rgb2) {
        const dr = rgb1[0] - rgb2[0];
        const dg = rgb1[1] - rgb2[1];
        const db = rgb1[2] - rgb2[2];
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    // Fungsi utama untuk mengekstrak palet warna yang "double checked"
    function extractDominantColors(image) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // Untuk "double check" yang lebih baik, gunakan resolusi yang lebih tinggi
        // atau bahkan resolusi asli jika gambar tidak terlalu besar.
        // Di sini kita skalakan ke maks 200px untuk keseimbangan performa
        const maxDim = 200; // Ukuran maksimum untuk analisis palet
        const scale = maxDim / Math.max(image.width, image.height);
        const analyzeWidth = image.width * scale;
        const analyzeHeight = image.height * scale;

        tempCanvas.width = analyzeWidth;
        tempCanvas.height = analyzeHeight;
        tempCtx.drawImage(image, 0, 0, analyzeWidth, analyzeHeight);

        const imageData = tempCtx.getImageData(0, 0, analyzeWidth, analyzeHeight);
        const pixels = imageData.data;

        const colorCounts = new Map(); // Map untuk menyimpan warna RGB string dan frekuensinya

        // 1. Hitung frekuensi setiap warna unik
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const rgbaString = `${r},${g},${b}`;

            colorCounts.set(rgbaString, (colorCounts.get(rgbaString) || 0) + 1);
        }

        // Konversi Map ke array, lalu urutkan berdasarkan frekuensi (terbanyak ke terkecil)
        const sortedUniqueColors = Array.from(colorCounts.entries())
            .map(entry => {
                const rgb = entry[0].split(',').map(Number);
                return { rgb: rgb, count: entry[1] };
            })
            .sort((a, b) => b.count - a.count);

        const finalPalette = [];
        const colorSimilarityThreshold = 40; // Ambang batas jarak RGB (nilai 0-255). Sesuaikan ini!
                                              // Nilai yang lebih kecil = lebih banyak warna unik.
                                              // Nilai yang lebih besar = lebih sedikit warna unik (lebih banyak pengelompokan).

        // 2. Kelompokkan warna yang mirip
        for (const { rgb } of sortedUniqueColors) {
            let isSimilarToExisting = false;
            for (const existingRgb of finalPalette) {
                if (colorDistance(rgb, existingRgb) < colorSimilarityThreshold) {
                    isSimilarToExisting = true;
                    break;
                }
            }

            if (!isSimilarToExisting) {
                finalPalette.push(rgb);
                if (finalPalette.length >= 20) { // Batasi jumlah warna dalam palet akhir
                    break;
                }
            }
        }

        // 3. Konversi palet akhir ke format Hex
        return finalPalette.map(rgb => rgbToHex(rgb[0], rgb[1], rgb[2]));
    }

    // Tampilkan palet yang diekstrak di UI
    function displayExtractedPalette(colors) {
        extractedPaletteDiv.innerHTML = '';
        if (colors.length === 0) {
            extractedPaletteDiv.textContent = 'Tidak ada warna dominan yang ditemukan.';
            extractedPaletteCard.style.display = 'block';
            return;
        }

        colors.forEach(hex => {
            const swatch = document.createElement('div');
            swatch.className = 'palette-color-swatch';
            swatch.style.backgroundColor = hex;
            swatch.textContent = hex;

            const r = parseInt(hex.substring(1,3), 16);
            const g = parseInt(hex.substring(3,5), 16);
            const b = parseInt(hex.substring(5,7), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            if (luminance > 0.5) {
                swatch.style.color = '#333';
                swatch.style.textShadow = 'none';
            } else {
                swatch.style.color = '#fff';
            }

            swatch.title = `Klik untuk menyalin: ${hex}`;
            swatch.addEventListener('click', () => {
                navigator.clipboard.writeText(hex).then(() => {
                    alert(`Kode Hex ${hex} berhasil disalin!`);
                }).catch(err => {
                    console.error('Gagal menyalin:', err);
                });
            });

            extractedPaletteDiv.appendChild(swatch);
        });
        extractedPaletteCard.style.display = 'block';
    }


    // Handle main image upload (diperbarui)
    mainImageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    mainImage = img;

                    imageCanvas.width = Math.min(img.width, 400);
                    imageCanvas.height = (img.height * imageCanvas.width) / img.width;
                    ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
                    ctx.drawImage(mainImage, 0, 0, imageCanvas.width, imageCanvas.height);
                    imagePreviewCard.style.display = 'block';
                    downloadImageBtn.style.display = 'none';

                    // Ekstrak dan tampilkan palet warna dari gambar utama
                    const extractedColors = extractDominantColors(mainImage);
                    displayExtractedPalette(extractedColors);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle palette image upload (tidak berubah)
    paletteImageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    paletteImage = img;
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Process Color Grading (tidak berubah)
    processGradingBtn.addEventListener('click', () => {
        if (!mainImage || !paletteImage) {
            alert('Harap unggah kedua gambar (Foto Utama dan Color Palette) terlebih dahulu!');
            return;
        }

        const tempCanvasMain = document.createElement('canvas');
        const tempCtxMain = tempCanvasMain.getContext('2d');
        tempCanvasMain.width = mainImage.width;
        tempCanvasMain.height = mainImage.height;
        tempCtxMain.drawImage(mainImage, 0, 0);
        const mainImageData = tempCtxMain.getImageData(0, 0, mainImage.width, mainImage.height);
        const mainStats = analyzeImageColors(mainImageData);

        const tempCanvasPalette = document.createElement('canvas');
        const tempCtxPalette = tempCanvasPalette.getContext('2d');
        tempCanvasPalette.width = paletteImage.width;
        tempCanvasPalette.height = paletteImage.height;
        tempCtxPalette.drawImage(paletteImage, 0, 0);
        const paletteImageData = tempCtxPalette.getImageData(0, 0, paletteImage.width, paletteImage.height);
        const paletteStats = analyzeImageColors(paletteImageData);

        const pixels = mainImageData.data;

        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            let newR = (r - mainStats.mean.r) * (paletteStats.stdDev.r / mainStats.stdDev.r) + paletteStats.mean.r;
            let newG = (g - mainStats.mean.g) * (paletteStats.stdDev.g / mainStats.stdDev.g) + paletteStats.mean.g;
            let newB = (b - mainStats.mean.b) * (paletteStats.stdDev.b / mainStats.stdDev.b) + paletteStats.mean.b;

            pixels[i] = Math.max(0, Math.min(255, newR));
            pixels[i + 1] = Math.max(0, Math.min(255, newG));
            pixels[i + 2] = Math.max(0, Math.min(255, newB));
        }

        const finalImageCanvas = document.createElement('canvas');
        finalImageCanvas.width = mainImage.width;
        finalImageCanvas.height = mainImage.height;
        const finalCtx = finalImageCanvas.getContext('2d');
        finalCtx.putImageData(mainImageData, 0, 0);

        ctx.drawImage(finalImageCanvas, 0, 0, imageCanvas.width, imageCanvas.height);

        downloadImageBtn.style.display = 'block';
    });

    // Handle image download (tidak berubah)
    downloadImageBtn.addEventListener('click', () => {
        if (!mainImage || !paletteImage) {
            alert('Tidak ada gambar untuk diunduh!');
            return;
        }

        const dataURL = imageCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'graded_image.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
});