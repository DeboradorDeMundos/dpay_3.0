import { NativeModules } from 'react-native';

const { ImageProcessor } = NativeModules;

/**
 * Procesa una imagen para impresión térmica.
 * - Elimina transparencia (fondo blanco)
 * - Convierte a escala de grises
 * - Aumenta contraste
 * 
 * @param base64Image - Imagen en base64 sin prefijo data:image
 * @param maxWidth - Ancho máximo en píxeles (default 384 para 58mm)
 * @returns Imagen procesada en base64
 */
export const processImageForPrinting = async (
  base64Image: string,
  maxWidth: number = 384
): Promise<string> => {
  if (!base64Image) {
    throw new Error('No se proporcionó imagen');
  }
  
  return await ImageProcessor.processForPrinting(base64Image, maxWidth);
};

export default {
  processImageForPrinting,
};
