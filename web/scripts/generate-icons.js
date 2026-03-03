/* eslint-disable */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, '../public/icons/logo.png');
const outputDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

async function generateIcons() {
    try {
        const bg = { r: 0, g: 0, b: 0, alpha: 1 }; // Black background

        // Web app manifest icons
        await sharp(inputPath)
            .resize(192, 192, { fit: 'contain', background: bg })
            .toFile(path.join(outputDir, 'icon-192x192.png'));

        await sharp(inputPath)
            .resize(512, 512, { fit: 'contain', background: bg })
            .toFile(path.join(outputDir, 'icon-512x512.png'));

        // Apple Touch Icon
        await sharp(inputPath)
            .resize(180, 180, { fit: 'contain', background: bg })
            .toFile(path.join(outputDir, 'apple-touch-icon.png'));

        // Favicon standard
        await sharp(inputPath)
            .resize(32, 32, { fit: 'contain', background: bg })
            .toFile(path.join(outputDir, 'favicon-32x32.png'));

        await sharp(inputPath)
            .resize(16, 16, { fit: 'contain', background: bg })
            .toFile(path.join(outputDir, 'favicon-16x16.png'));

        console.log('Icons generated successfully.');
    } catch (error) {
        console.error('Error generating icons:', error);
    }
}

generateIcons();
