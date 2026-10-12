const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const sourceImage = path.join(__dirname, '../assets/logos/d_isotipo.png');
const androidResPath = path.join(__dirname, '../android/app/src/main/res');

async function generateIcons() {
  for (const [folder, size] of Object.entries(sizes)) {
    const outputPath = path.join(androidResPath, folder);
    
    // Crear ic_launcher.png
    await sharp(sourceImage)
      .resize(size, size)
      .png()
      .toFile(path.join(outputPath, 'ic_launcher.png'));
    
    // Crear ic_launcher_round.png (mismo archivo, Android lo manejará)
    await sharp(sourceImage)
      .resize(size, size)
      .png()
      .toFile(path.join(outputPath, 'ic_launcher_round.png'));
    
    console.log(`✓ ${folder}: ${size}x${size}`);
  }
  
  console.log('\n¡Iconos generados exitosamente!');
}

generateIcons().catch(console.error);
