import type { Sale } from '../types';
import type { DpayDocumentDetail } from '../services/api';

export type RootStackParamList = {
  Login: undefined;
  Sale: undefined;
  PaymentMethod: { total: number; autoExecute?: boolean };
  DocumentType: { items: any[] };
  SaleCompleted: { 
    sale: any; 
    tuuTransactionId?: string;
    tuuPaymentData?: Sale['tuuPaymentData'];
  };
  Catalogue: undefined;
  Clients: undefined;
  ViewInvoice: { 
    saleId?: string; 
    dpayDocument?: DpayDocumentDetail;
    dpayIdDocumento?: number;  // id_documento del servidor cuando se abre venta local que ya está sincronizada
    printInvoice?: boolean; 
    blockBackPress?: boolean;
    showNewSaleButton?: boolean;
  };
  Share: { 
    invoiceData: any;
    settings: any;
    barcodeImage?: string;
  };
  Settings: undefined;
  MySales: undefined;
  MakePayment: { sale: any };
  PrinterSelector: undefined;
  DocumentTypeSelector: undefined;
  PaymentMethodSelector: undefined;
  PrinterSettings: { returnToSettings?: boolean } | undefined;
  CreditNote: { 
    originalSale: Sale; // Documento original a anular parcialmente
  };
  ExternalPayment: {
    intent: import('../services/paymentHubService').PaymentIntent;
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
