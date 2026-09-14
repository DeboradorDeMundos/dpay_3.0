export {};

declare module 'react-native' {
  export interface NativeModulesStatic {
    TuuPaymentModule: {
      isTuuAppInstalled(isDev: boolean): Promise<boolean>;
      startPayment(paymentData: any, isDev: boolean): Promise<any>;
    };
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
