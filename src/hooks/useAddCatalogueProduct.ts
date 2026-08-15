import { useCallback } from 'react';
import { useSalesStore } from '../stores/salesStore';
import { useAlertStore } from '../stores/alertStore';

export interface AddCatalogueProductResult {
  ok: boolean;
  reason?: 'no_stock' | 'invalid';
}

/**
 * Agrega un producto del catálogo (formato API) al carrito.
 * Misma lógica que CatalogueScreen.handleSelectProduct.
 */
export function useAddCatalogueProduct() {
  const addItem = useSalesStore((state) => state.addItem);
  const { showAlert } = useAlertStore();

  const addCatalogueProduct = useCallback((product: any): AddCatalogueProductResult => {
    if (!product) {
      return { ok: false, reason: 'invalid' };
    }

    const esInventariable = product.inventariable !== undefined
      ? (String(product.inventariable) === 'true' || String(product.inventariable) === '1' || product.inventariable === true)
      : true;

    if (esInventariable) {
      const rawStock = product.cantidad !== undefined && product.cantidad !== null
        ? product.cantidad
        : product.stock;
      let stock = 0;
      if (rawStock !== undefined && rawStock !== null && rawStock !== '') {
        const parsed = typeof rawStock === 'string' ? parseFloat(rawStock) : rawStock;
        stock = Math.floor(parsed);
      }
      if (stock <= 0) {
        return { ok: false, reason: 'no_stock' };
      }
    }

    const precioRaw = product.precio || product.price || 0;
    const precio = typeof precioRaw === 'string' ? parseFloat(precioRaw) || 0 : precioRaw;
    const nombre = product.nombre || product.name || '';
    const codigo = product.codigo || product.code || '';
    const bodegaId = product.id_bodega != null ? String(product.id_bodega) : '';
    const nombreBodega = product.nombre_bodega || '';

    if (!precio || precio <= 0) {
      showAlert('Atención', 'El producto no tiene precio configurado.');
      return { ok: false, reason: 'invalid' };
    }

    addItem({
      code: codigo,
      name: nombre,
      value: precio,
      count: 1,
      total: precio,
      ...(bodegaId ? { bodega: bodegaId, nombreBodega } : {}),
    });

    return { ok: true };
  }, [addItem, showAlert]);

  return { addCatalogueProduct };
}
