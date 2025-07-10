# Image Color Changer Chrome Extension

## Description

Image Color Changer is a Chrome extension that allows you to instantly replace specific colors in an image directly from the browser side panel. Perfect for designers, developers, or anyone who wants to change image colors without editing software.

## Main Features

- **Pick color from image**: Click on the image to get the Hex color code.
- **Replace specific color**: Enter the source and replacement color, then click "Replace Color".
- **Color tolerance**: Adjust how similar the color to be replaced is using the tolerance slider.
- **Download result**: Download the modified image.
- **Copy color code**: Copy the source or replacement color code with one click.

## How to Install (Developer Mode)

1. Download or clone this repository to your computer.
2. Extract the downloaded folder, usually in `C:\Users\<YourName>\Downloads`.
3. Open Chrome and go to `chrome://extensions/`.
4. Enable **Developer mode** (top left).
5. Click **Load unpacked** and select the extracted folder (the one containing `manifest.json`).
6. The extension is now ready to use!

## How to Use

1. Click the "Image Color Changer" extension icon in Chrome.
2. Enter the image URL you want to edit, then click **Load Image**.
3. Click on the image to pick the source color (the Hex code will appear).
4. Enter the replacement color (you can type the Hex or use the color picker).
5. Adjust the tolerance if needed (higher value means more similar colors will be replaced).
6. Click **Replace Color** to see the result below.
7. Click **Download** to save the modified image.

## Important Notes

- The image must be publicly accessible (not from Google Drive, WhatsApp, etc. that require login).
- This extension does not store your images or data.
- The color picker is accurate and supports browser zoom and HiDPI screens.

## License

MIT
