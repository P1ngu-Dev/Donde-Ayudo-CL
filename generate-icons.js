#!/usr/bin/env node

/**
 * Script para generar íconos PWA en diferentes tamaños
 * Por ahora crea placeholders SVG, idealmente usar sharp o similar para PNG
 */

import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, 'public', 'icons');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const createIconSVG = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#1E40AF" rx="100"/>
  <circle cx="256" cy="256" r="180" fill="#3B82F6" opacity="0.3"/>
  <path d="M256 120 C200 120 155 165 155 221 C155 300 256 392 256 392 S357 300 357 221 C357 165 312 120 256 120 Z" 
        fill="white" stroke="white" stroke-width="8" stroke-linejoin="round"/>
  <circle cx="256" cy="221" r="40" fill="#1E40AF"/>
  <rect x="246" y="340" width="20" height="60" fill="white" rx="4"/>
  <rect x="226" y="360" width="60" height="20" fill="white" rx="4"/>
</svg>`;

console.log('📱 Generando íconos PWA...');

sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const svgFilename = `icon-${size}x${size}.svg`;
  const svgPath = join(iconsDir, svgFilename);
  
  // Por ahora generamos SVG (navegadores modernos los soportan)
  writeFileSync(svgPath, createIconSVG(size));
  console.log(`✓ Generado: ${svgFilename}`);
});

console.log('\n✅ Íconos generados exitosamente');
console.log('\n⚠️  Nota: Para mejor compatibilidad, convierte los SVG a PNG usando:');
console.log('   - ImageMagick: convert icon.svg icon.png');
console.log('   - Online: https://cloudconvert.com/svg-to-png');
console.log('   - O instala sharp: npm i -D sharp');
