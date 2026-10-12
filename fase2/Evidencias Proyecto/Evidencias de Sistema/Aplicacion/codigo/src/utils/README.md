# Utilidades

Funciones helper y utilidades reutilizables.

## Utilidades Disponibles

### `formatters.ts`
Formateadores de datos
- `formatCurrency(value)` - Formato de moneda chilena
- `formatRUT(rut)` - Formato de RUT (12.345.678-9)
- `formatDate(date)` - Formato de fechas
- `formatPhone(phone)` - Formato de teléfonos

### `validators.ts`
Validaciones
- `validateRUT(rut)` - Valida RUT chileno
- `validateEmail(email)` - Valida email
- `validatePhone(phone)` - Valida teléfono chileno
- `calculateRUTDigit(rut)` - Calcula dígito verificador

### `calculations.ts`
Cálculos
- `calculateTax(amount)` - Calcula IVA
- `calculateTotal(items)` - Calcula total de venta
- `calculateChange(payment, total)` - Calcula vuelto
- `applyDiscount(price, discount)` - Aplica descuento

### `logger.ts`
Sistema de logging
- `log(message)` - Log normal
- `error(message)` - Log de errores
- `warn(message)` - Log de advertencias
- `debug(message)` - Log de debug

### `permissions.ts`
Manejo de permisos
- `requestCameraPermission()` - Permiso de cámara
- `requestBluetoothPermission()` - Permiso de Bluetooth
- `requestStoragePermission()` - Permiso de almacenamiento

## Ejemplos

```typescript
// formatters.ts
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(value);
};

export const formatRUT = (rut: string): string => {
  // Eliminar puntos y guión
  const clean = rut.replace(/[.-]/g, '');
  
  // Separar número y dígito verificador
  const number = clean.slice(0, -1);
  const dv = clean.slice(-1);
  
  // Formatear con puntos
  const formatted = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formatted}-${dv}`;
};

// validators.ts
export const validateRUT = (rut: string): boolean => {
  // Eliminar formato
  const clean = rut.replace(/[.-]/g, '');
  
  if (clean.length < 2) return false;
  
  const number = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();
  
  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;
  
  for (let i = number.length - 1; i >= 0; i--) {
    sum += parseInt(number[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDV = 11 - (sum % 11);
  const calculatedDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();
  
  return calculatedDV === dv;
};

// calculations.ts
import { TAX } from '@constants';

export const calculateTax = (netAmount: number): number => {
  return Math.round(netAmount * TAX.RATE);
};

export const calculateTotal = (items: SaleItem[]): number => {
  return items.reduce((sum, item) => sum + item.total, 0);
};
```
