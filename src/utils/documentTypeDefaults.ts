/** Comprobante electrónico (solo cobro, sin DTE) — siempre disponible en D-PAY. */
export const COMPROBANTE_PAGO_DOC = {
  id: 0,
  name: 'Comprobante Electrónico',
  enabled: true,
} as const;

/** Etiquetas compactas solo para listas en pantalla (el nombre completo se guarda al seleccionar). */
const DOCUMENT_TYPE_LIST_LABELS: Record<number, string> = {
  0: 'Comprobante elec.',
};

export const getDocumentTypeListLabel = (docType: { id: number; name: string }): string =>
  DOCUMENT_TYPE_LIST_LABELS[docType.id] ?? docType.name;

export const isComprobanteElectronico = (docTypeId?: number | null): boolean =>
  docTypeId === 0;

export type StoredDocumentType = {
  id: number;
  name: string;
  enabled: boolean;
};

/** Garantiza que Comprobante Electrónico (id 0) esté siempre en la selección. */
export function withRequiredComprobante(types: StoredDocumentType[]): StoredDocumentType[] {
  const others = (types || []).filter((t) => t.id !== 0);
  return [{ ...COMPROBANTE_PAGO_DOC }, ...others];
}
