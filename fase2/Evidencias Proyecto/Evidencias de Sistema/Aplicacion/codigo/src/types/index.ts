// ============================================
// TIPOS GLOBALES DE LA APLICACIÓN
// ============================================

// Exportar tipos de facturación electrónica
export * from './caf';
export * from './invoice';
export * from './ted';
export * from './common';

// Navegación (tipos de pantallas)
export type RootStackParamList = {
  Login: undefined;
  Sale: undefined;
  PaymentMethod: undefined;
  DocumentType: undefined;
  SaleCompleted: { saleId: string };
  Catalogue: undefined;
  Clients: undefined;
  ViewInvoice: { saleId: string };
  Settings: undefined;
  MySales: undefined;
  TestDependencies: undefined;
};

