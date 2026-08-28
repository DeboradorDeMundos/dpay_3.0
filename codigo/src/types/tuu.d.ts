declare module 'react-native' {
  export interface NativeModulesStatic {
    TuuPaymentModule: {
      isTuuAppInstalled(isDev: boolean): Promise<boolean>;
      startPayment(paymentData: any, isDev: boolean): Promise<any>;
    };
  }
}
