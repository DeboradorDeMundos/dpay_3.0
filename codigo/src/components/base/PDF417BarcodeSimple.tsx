import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

interface PDF417BarcodeProps {
  text: string;
  width?: number;
  onImageGenerated?: (base64Image: string) => void;
}

/**
 * Componente que genera un código de barras PDF417 del TED
 * Usa bwip-js API para generar el código
 */
export const PDF417BarcodeSimple: React.FC<PDF417BarcodeProps> = ({
  text,
  width = 384,
  onImageGenerated,
}) => {
  const hasGeneratedRef = useRef(false);
  const lastTextRef = useRef('');

  useEffect(() => {
    if (
      Platform.OS === 'android' &&
      onImageGenerated &&
      text &&
      text !== lastTextRef.current
    ) {
      lastTextRef.current = text;
      hasGeneratedRef.current = true;

      // Usar timeout para evitar bloquear el render
      setTimeout(async () => {
        try {
          // Generar PDF417 usando API pública de bwip-js
          // Encode text to base64 para la URL
          const encodedText = encodeURIComponent(text);
          // Parámetros ultra compactos para papel POS de 58mm
          const url = `https://bwipjs-api.metafloor.com/?bcid=pdf417&text=${encodedText}&scale=1&height=6&columns=4&rows=12&includetext=false`;
          
          const response = await fetch(url);
          const blob = await response.blob();
          
          // Convertir blob a base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            // Remover el prefijo "data:image/png;base64,"
            const base64Image = base64.split(',')[1];
            
            if (base64Image) {
              console.log('[PDF417] Código generado exitosamente');
              onImageGenerated(base64Image);
            }
          };
          reader.readAsDataURL(blob);
        } catch (error) {
          console.warn('[PDF417] No se pudo generar código de barras:', error?.message || error);
        }
      }, 100);
    }
  }, [text, width, onImageGenerated]);

  return null;
};
