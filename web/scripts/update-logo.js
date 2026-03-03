/* eslint-disable */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourcePath = 'D:\\antigravity\\xpace-on\\02. IDENTIDADE\\PNG\\XPACE ON app.png';
const publicIconsPath = 'D:\\antigravity\\xpace-on\\web\\public\\icons';
const publicImagesPath = 'D:\\antigravity\\xpace-on\\web\\public\\images';

async function generateLogos() {
    try {
        console.log('Generating PWA Icons and replacing old logos...');

        // Main Logo in images
        await sharp(sourcePath)
            .resize({ width: 800, withoutEnlargement: true })
            .toFile(path.join(publicImagesPath, 'xpace-logo-branca.png'));

        // Main Logo in images (Landing Page explicit reference)
        await sharp(sourcePath)
            .resize({ width: 800, withoutEnlargement: true })
            .toFile(path.join(publicImagesPath, 'xpace-on-branco.png'));

        // Basic Logo in icons
        await sharp(sourcePath)
            .resize({ width: 512, withoutEnlargement: true })
            .toFile(path.join(publicIconsPath, 'logo.png'));

        // PWA Icon 512x512 (Standard Android)
        await sharp(sourcePath)
            .resize(512, 512, { fit: 'contain', background: { r: 5, g: 5, b: 5, alpha: 1 } })
            .toFile(path.join(publicIconsPath, 'icon-512x512.png'));

        // PWA Icon 192x192 (Standard Android)
        await sharp(sourcePath)
            .resize(192, 192, { fit: 'contain', background: { r: 5, g: 5, b: 5, alpha: 1 } })
            .toFile(path.join(publicIconsPath, 'icon-192x192.png'));

        // Apple Touch Icon
        await sharp(sourcePath)
            .resize(180, 180, { fit: 'contain', background: { r: 5, g: 5, b: 5, alpha: 1 } })
            .toFile(path.join(publicIconsPath, 'apple-touch-icon.png'));

        // Favicon 32x32
        await sharp(sourcePath)
            .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toFile(path.join(publicIconsPath, 'favicon-32x32.png'));

        // Favicon 16x16
        await sharp(sourcePath)
            .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toFile(path.join(publicIconsPath, 'favicon-16x16.png'));

        console.log('Successfully generated all logos and icons!');
    } catch (err) {
        console.error('Error generating logos:', err);
    }
}

generateLogos();
