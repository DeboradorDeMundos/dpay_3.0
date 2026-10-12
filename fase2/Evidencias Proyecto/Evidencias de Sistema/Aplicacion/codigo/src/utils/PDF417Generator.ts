import { NativeModules } from 'react-native';

interface PDF417GeneratorInterface {
  /**
   * Genera un código PDF417 como imagen base64
   * @param data Datos a codificar (XML del TED)
   * @param width Ancho en píxeles (default: 384)
   * @param height Altura en píxeles (default: 120)
   * @returns Promise con la imagen en base64
   */
  generate(data: string, width?: number, height?: number): Promise<string>;
}

const { PDF417Generator } = NativeModules;

if (!PDF417Generator) {
  throw new Error(
    'PDF417Generator módulo nativo no encontrado. ' +
    'Asegúrate de ejecutar: cd android && ./gradlew clean && cd .. && npm run android'
  );
}

export default PDF417Generator as PDF417GeneratorInterface;
