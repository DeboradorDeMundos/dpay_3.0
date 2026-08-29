/// <reference types="nativewind/types" />

declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.jpeg' {
  const value: any;
  export default value;
}

declare module '*.gif' {
  const value: any;
  export default value;
}

declare module '*.mp3' {
  const value: number;
  export default value;
}

declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module '@env' {
  export const API_URL: string;
  export const API_TIMEOUT: string;
  export const FIREBASE_API_KEY: string;
  export const FIREBASE_AUTH_DOMAIN: string;
  export const FIREBASE_PROJECT_ID: string;
  export const FIREBASE_STORAGE_BUCKET: string;
  export const FIREBASE_MESSAGING_SENDER_ID: string;
  export const FIREBASE_APP_ID: string;
  export const APP_NAME: string;
  export const APP_VERSION: string;
  export const ENVIRONMENT: string;
  export const ENABLE_LOGS: string;
}

// Módulo nativo para procesamiento de imágenes
declare module 'react-native' {
  interface NativeModulesStatic {
    ImageProcessor: {
      processForPrinting(base64Image: string, maxWidth: number): Promise<string>;
    };
    ScanBeep: {
      preload: () => Promise<string | boolean>;
      play: () => Promise<boolean>;
      test: () => Promise<boolean>;
    };
  }
}

// Declaraciones para librerías de facturación electrónica
declare module 'jsrsasign' {
  export const KEYUTIL: any;
  export const KJUR: any;
  export const hextob64: (hex: string) => string;
  export const b64tohex: (b64: string) => string;
}

declare module 'jsrsasign-util' {
  export function readFile(path: string): string;
}

declare module 'base-64' {
  export function encode(input: string): string;
  export function decode(input: string): string;
}

declare module 'md5' {
  function md5(message: string): string;
  export = md5;
}

// Declaraciones para librerías de impresión Bluetooth
declare module 'react-native-bluetooth-escpos-printer' {
  export interface BluetoothDevice {
    name: string;
    address: string;
  }

  export const BluetoothManager: {
    isBluetoothEnabled(): Promise<boolean>;
    enableBluetooth(): Promise<void>;
    scanDevices(): Promise<BluetoothDevice[]>;
    connect(address: string): Promise<void>;
    disconnect(): Promise<void>;
    getPairedDevices(): Promise<BluetoothDevice[]>;
  };

  export const BluetoothEscposPrinter: {
    printerAlign(align: number): Promise<void>;
    setBlob(size: number): Promise<void>;
    printText(text: string, options: any): Promise<void>;
    printColumn(
      columnWidths: number[],
      columnAligns: number[],
      columnTexts: string[],
      options: any
    ): Promise<void>;
    printQRCode(content: string, size: number, correctionLevel: number): Promise<void>;
    printPDF417(content: string, width: number): Promise<void>;
    printBarCode(
      content: string,
      barcodeType: number,
      width: number,
      height: number,
      textPosition: number
    ): Promise<void>;
    printPic(base64: string, options: any): Promise<void>;
    printPicNoCut(base64: string, options: { width?: number; left?: number }): Promise<void>;
    rotate(rotation: number): Promise<void>;
    setWidth(width: number): Promise<void>;
    printerLeftSpace(space: number): Promise<void>;
    printerLineSpace(space: number): Promise<void>;
    ALIGN: {
      LEFT: number;
      CENTER: number;
      RIGHT: number;
    };
  };
}

declare module 'react-native-ble-manager' {
  const BleManager: any;
  export default BleManager;
}

// Declaraciones para librerías de PDF
declare module 'react-native-html-to-pdf' {
  interface Options {
    html: string;
    fileName: string;
    directory?: string;
    base64?: boolean;
    width?: number;
    height?: number;
    bgColor?: string;
    padding?: number;
  }

  interface Result {
    filePath: string;
    base64?: string;
  }

  const RNHTMLtoPDF: {
    convert(options: Options): Promise<Result>;
  };
  export default RNHTMLtoPDF;
}

declare module 'react-native-share' {
  interface ShareOptions {
    title?: string;
    message?: string;
    url?: string;
    urls?: string[];
    type?: string;
    subject?: string;
    email?: string;
    recipient?: string;
    failOnCancel?: boolean;
  }

  interface ShareResponse {
    success: boolean;
    message?: string;
  }

  const Share: {
    open(options: ShareOptions): Promise<ShareResponse>;
    shareSingle(options: ShareOptions & { social: string }): Promise<ShareResponse>;
  };

  export default Share;
}
