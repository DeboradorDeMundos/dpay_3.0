/**
 * Copia assets/sonidos/sonido-scaner.mp3 → android/app/src/main/res/raw/sonido_scaner.mp3
 * Ejecutado en postinstall para que el beep nativo siempre tenga el archivo en res/raw.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'assets', 'sonidos', 'sonido-scaner.mp3');
const destDir = path.join(root, 'android', 'app', 'src', 'main', 'res', 'raw');
const dest = path.join(destDir, 'sonido_scaner.mp3');

if (!fs.existsSync(src)) {
  console.warn('[sync-scan-sound] No existe', src);
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('[sync-scan-sound] Copiado a', dest);
