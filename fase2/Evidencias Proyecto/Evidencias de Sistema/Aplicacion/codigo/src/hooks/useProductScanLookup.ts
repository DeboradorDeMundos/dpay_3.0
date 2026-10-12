import { useCallback, useRef, useState } from 'react';
import { useCatalogueStore } from '../stores/catalogueStore';
import { useAlertStore } from '../stores/alertStore';
import { searchProductByCode } from '../services/api';
import {
  expandScanVariants,
  findProductInCatalogue,
  pickBestProductMatch,
} from '../utils/findProductByBarcode';
import { playScanSuccessSound } from '../utils/playScanSuccessSound';
import { useAddCatalogueProduct, AddCatalogueProductResult } from './useAddCatalogueProduct';

export type ScanLookupResult =
  | { status: 'added'; productName: string; productPrice: number }
  | { status: 'no_stock' }
  | { status: 'not_found'; code: string }
  | { status: 'offline' }
  | { status: 'busy' };

async function searchProductInApi(scannedCode: string): Promise<any | null> {
  const variants = expandScanVariants(scannedCode);
  const tried = new Set<string>();

  for (const variant of variants) {
    if (tried.has(variant)) continue;
    tried.add(variant);
    const batch = await searchProductByCode(variant);
    if (batch.length) {
      return pickBestProductMatch(batch) ?? batch[0];
    }
  }
  return null;
}

export function useProductScanLookup() {
  const products = useCatalogueStore((s) => s.products);
  const mergeProducts = useCatalogueStore((s) => s.mergeProducts);
  const { showAlert } = useAlertStore();
  const { addCatalogueProduct } = useAddCatalogueProduct();
  const [isLookingUp, setIsLookingUp] = useState(false);
  const busyRef = useRef(false);

  const resolveAndAdd = useCallback((product: any): AddCatalogueProductResult => {
    return addCatalogueProduct(product);
  }, [addCatalogueProduct]);

  const lookupAndAdd = useCallback(async (scannedCode: string): Promise<ScanLookupResult> => {
    if (busyRef.current) {
      return { status: 'busy' };
    }
    busyRef.current = true;
    setIsLookingUp(true);

    try {
      const variants = expandScanVariants(scannedCode);
      console.log('[Scan] Código leído:', scannedCode, 'variantes:', variants);

      let product = findProductInCatalogue(products, scannedCode);

      if (!product) {
        try {
          product = await searchProductInApi(scannedCode);
          if (product) {
            mergeProducts([product]);
            const refreshed = findProductInCatalogue(
              useCatalogueStore.getState().products,
              scannedCode,
            );
            product = refreshed ?? product;
          }
        } catch (err: any) {
          console.error('[Scan] Error API buscar producto:', err);
          const msg = err?.message || '';
          const isNetwork = msg.includes('Network') || msg.includes('fetch') || msg.includes('Failed');
          if (isNetwork) {
            showAlert(
              'Sin conexión',
              'El producto no está en el catálogo local. Conéctate a internet para buscarlo en el servidor.',
            );
            return { status: 'offline' };
          }
        }
      }

      if (!product) {
        return { status: 'not_found', code: scannedCode };
      }

      const result = resolveAndAdd(product);
      if (result.ok) {
        playScanSuccessSound();
        const precioRaw = product.precio || product.price || 0;
        const productPrice = typeof precioRaw === 'string' ? parseFloat(precioRaw) || 0 : precioRaw;
        const productName = product.nombre || product.name || 'Producto';
        return { status: 'added', productName, productPrice };
      }
      if (result.reason === 'no_stock') {
        return { status: 'no_stock' };
      }
      return { status: 'not_found', code: scannedCode };
    } finally {
      busyRef.current = false;
      setIsLookingUp(false);
    }
  }, [products, mergeProducts, showAlert, resolveAndAdd]);

  /** Prueba varios códigos del mismo frame (ML Kit puede devolver más de uno). */
  const lookupAndAddMany = useCallback(async (scannedCodes: string[]): Promise<ScanLookupResult> => {
    const unique = [...new Set(scannedCodes.map((c) => c.trim()).filter(Boolean))];
    for (const code of unique) {
      const result = await lookupAndAdd(code);
      if (result.status !== 'not_found' && result.status !== 'busy') {
        return result;
      }
    }
    if (unique.length) {
      return { status: 'not_found', code: unique[0] };
    }
    return { status: 'busy' };
  }, [lookupAndAdd]);

  return { lookupAndAdd, lookupAndAddMany, isLookingUp };
}
