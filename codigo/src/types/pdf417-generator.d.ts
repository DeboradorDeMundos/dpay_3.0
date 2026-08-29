declare module 'pdf417-generator' {
  interface PDF417Options {
    encoding?: 'base64' | 'binary';
    width?: number;
    height?: number;
  }

  function getBarcodeBuffer(text: string, options?: PDF417Options): string;

  export default {
    getBarcodeBuffer,
  };
}
