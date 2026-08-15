# 📊 Análisis de Datos TUU/DPay - Campos Enviados vs Base de Datos

## 🎯 Resumen Ejecutivo

**Fecha del análisis:** 10 de febrero de 2026  
**App:** DTemite POS Mobile  
**Tabla analizada:** `tbl_dpay`  
**Endpoint:** `POST /Api/pos/transaccion`

---

## ✅ Campos que SÍ se están enviando correctamente

| Campo BD | Campo App/API | Origen | Notas |
|----------|---------------|--------|-------|
| `rut_empresa` | ✅ `rut_empresa` | `authStore.user.empresa.rut` | Inyectado en `registrarTransaccionTuu` |
| `folio_dte` | ✅ `folio_dte` | `sale.folio` | Asignado después de emitir DTE |
| `tipo_dte` | ✅ `tipo_dte` | `documentType.id` | 33, 34, 39, 41 |
| `id_cliente` | ✅ `id_cliente` | `sale.client.id` | 0 si no registrado |
| `rut_cliente` | ✅ `rut_cliente` | `sale.client.rut` | '66666666-6' para público |
| `nombre_cliente` | ✅ `nombre_cliente` | `sale.client.name` | 'PUBLICO GENERAL' por defecto |
| `email_cliente` | ✅ `email_cliente` | `sale.client.email` | Opcional |
| `telefono_cliente` | ✅ `telefono_cliente` | `sale.client.telefono` | Opcional |
| `tipo_cliente` | ✅ `tipo_cliente` | - | 'registrado' o 'natural' |
| `id_mediopago` | ✅ `id_mediopago` | `mapTuuMethodToMedioPago()` | 101=Crédito, 104=Débito |
| `monto` | ✅ `monto` | `tuuPaymentData.request.amount` | Total con IVA |
| `cuotas` | ✅ `cuotas` | - | 0 para débito, variable para crédito |
| `propina` | ✅ `propina` | `tuuPaymentData.response.transactionTip` | 0 si no aplica |
| `cashback` | ✅ `cashback` | `tuuPaymentData.response.transactionCashback` | 0 si no aplica |
| `transaction_status` | ✅ `transaction_status` | `tuuPaymentData.response.transactionStatus` | true/false |
| `sequence_number` | ✅ `sequence_number` | `tuuPaymentData.response.sequenceNumber` | ID TUU |
| `printer_voucher_commerce` | ✅ `printer_voucher_commerce` | `tuuPaymentData.response.printerVoucherCommerce` | false (imprimimos nosotros) |
| `tax_idn_validation` | ⚠️ `tax_idn_validation` | `tuuRequest.extraData.taxIdnValidation` | **Se envía vacío '' para evitar validación** |
| `exempt_amount` | ✅ `exempt_amount` | `tuuPaymentData.montoExento` | Calculado según tipo DTE |
| `net_amount` | ✅ `net_amount` | `tuuPaymentData.montoNeto` | Calculado según tipo DTE |
| `source_name` | ✅ `source_name` | - | 'DTemite POS' |
| `source_version` | ✅ `source_version` | - | '2.0.0' |
| `tipo_tarjeta` | ✅ `tipo_tarjeta` | - | 'CREDITO' o 'DEBITO' |
| `comision_porcentaje` | ✅ `comision_porcentaje` | `calcularComisionDpay()` | 1.9 fija / 1.4 mixta |
| `comision_monto` | ✅ `comision_monto` | `calcularComisionDpay()` | Total con IVA |
| `tipo_comision` | ✅ `tipo_comision` | `dpayComisiones.tipo_comision` | 'fija' o 'mixta' |
| `comision_monto_fijo` | ✅ `comision_monto_fijo` | `dpayComisiones.comision_monto_fijo` | $0 fija / $70 mixta |
| `request_json` | ✅ `request_json` | `tuuPaymentData.request` | Payload completo enviado a TUU |
| `response_json` | ✅ `response_json` | `tuuPaymentData.response` | Respuesta completa de TUU |
| `usuario` | ✅ `usuario` | `authStore.user.usuario` | Usuario autenticado |
| `sistema` | ✅ `sistema` | - | 'DTemite POS' (inyectado en API) |
| `detalle` | ✅ `detalle` | - | ítems de venta (max 200 chars) |

---

## ❌ Campos que NO se están enviando (FALTANTES)

### 🔴 **Críticos - Datos de TUU que deberían capturarse**

| Campo BD | ¿TUU lo devuelve? | Estado |
|----------|-------------------|--------|
| `codigo_autorizacion` | ✅ SÍ (`authCode`) | ✅ **IMPLEMENTADO** (10/02/2026) |
| `ultimos_digitos` | ✅ SÍ (`last4`) | ✅ **IMPLEMENTADO** (10/02/2026) |
| `response_code` | ⚠️ No confirmado | Pendiente confirmación TUU |
| `marca_tarjeta` | ⚠️ No confirmado | Pendiente confirmación TUU |

### 🟡 **Importantes - Datos del dispositivo/contexto**

| Campo BD | ¿Se puede obtener? | Estado |
|----------|-------------------|--------|
| `dispositivo` | ✅ SÍ | ✅ **IMPLEMENTADO** - Hardcodeado "POS PRO2" (10/02/2026) |
| `ip_origen` | ✅ SÍ | Pendiente - Requiere `@react-native-community/netinfo` |
| `detalle_error` | ✅ SÍ | ✅ **IMPLEMENTADO** - Se captura automáticamente cuando fallan transacciones (10/02/2026) |

### ⚪ **Opcionales - Campos sin uso actual**

| Campo BD | Notas |
|----------|-------|
| `custom_fields` | Definido en interfaz pero no se usa |
| `voucher_data` | Definido en interfaz pero no se usa |
| `terminal_id` | No aplica (no hay terminal físico) |
| `transaction_id` | No se usa (TUU usa `sequence_number`) |

---

## 🔍 Análisis de la Respuesta TUU

### Datos actuales capturados de TUU:

```typescript
export interface TuuPaymentResponse {
  transactionStatus: boolean;
  sequenceNumber: string;
  printerVoucherCommerce: boolean;
  transactionTip?: number;
  transactionCashback?: number;
}
```

### ⚠️ **PROBLEMA**: La interfaz `TuuPaymentResponse` es muy limitada

Según la documentación de TUU/Haulmer, la respuesta probablemente incluye más campos como:
- `authorizationCode` / `codigoAutorizacion`
- `cardType` / `tipoTarjeta` (VISA, MASTERCARD, etc.)
- `cardBrand` / `marcaTarjeta`
- `lastDigits` / `ultimosDigitos`
- `responseCode` / `codigoRespuesta`
- `installments` / `cuotas`
- `issuer` / `emisor`

---

## 🛠️ Recomendaciones de Implementación

### 1️⃣ **✅ COMPLETADO (Parcial): Interfaz TuuPaymentResponse ampliada**

```typescript
export interface TuuPaymentResponse {
  // Existentes
  transactionStatus: boolean;
  sequenceNumber: string;
  printerVoucherCommerce: boolean;
  transactionTip?: number;
  transactionCashback?: number;
  
  // ✅ IMPLEMENTADO (10/02/2026):
  authCode?: string;                // codigo_autorizacion (confirmado por TUU)
  last4?: string;                   // ultimos_digitos (confirmado por TUU)
  
  // ⚠️ PENDIENTE (solicitar confirmación a TUU):
  cardType?: string;                // tipo_tarjeta (VISA, MC, AMEX)
  cardBrand?: string;               // marca_tarjeta
  responseCode?: string;            // response_code
  installments?: number;            // cuotas
}
```

**Archivos modificados:**
- ✅ [src/services/tuuPayment.ts](src/services/tuuPayment.ts#L27-L35)
- ✅ [android/.../TuuPaymentModule.java](android/app/src/main/java/com/dtemitepos/TuuPaymentModule.java#L330-L336)
- ✅ [src/types/common.ts](src/types/common.ts#L94-L102)
- ✅ [src/components/payment/PaymentsMethods.tsx](src/components/payment/PaymentsMethods.tsx#L233-L241)
- ✅ [src/screens/SaleCompletedScreen.tsx](src/screens/SaleCompletedScreen.tsx#L203-L204)
- ✅ [src/stores/mySalesStore.ts](src/stores/mySalesStore.ts#L228-L229)

---

### 2️⃣ **Agregar Información del Dispositivo**

Instalar dependencias:
```bash
npm install react-native-device-info
npm install @react-native-community/netinfo
```

Modificar payload en **PaymentsMethods.tsx** y **SaleCompletedScreen.tsx**:

```typescript
import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';

// Al registrar transacción:
const deviceModel = await DeviceInfo.getModel();
const deviceBrand = await DeviceInfo.getBrand();
const netInfo = await NetInfo.fetch();

await registrarTransaccionTuu({
  // ... campos existentes
  dispositivo: `${deviceBrand} ${deviceModel}`, // ej: "Samsung SM-G991B"
  ip_origen: netInfo.details?.ipAddress || undefined,
});
```

**Archivos a modificar:**
- [src/components/payment/PaymentsMethods.tsx](src/components/payment/PaymentsMethods.tsx#L184)
- [src/screens/SaleCompletedScreen.tsx](src/screens/SaleCompletedScreen.tsx#L184)
- [src/stores/mySalesStore.ts](src/stores/mySalesStore.ts#L208)

---

### 3️⃣ **Capturar Errores Correctamente**

Modificar el catch en **PaymentsMethods.tsx**:

```typescript
} catch (error: any) {
  console.error('[Tuu] Error en pago:', error);

  const { title, message, isCancellable } = parseTuuError(error);

  // AGREGAR: Registrar transacción fallida en BD
  if (error?.responseCode || error?.errorCode) {
    await registrarTransaccionTuu({
      monto: totalWithIVA,
      transaction_status: false,
      response_code: error.responseCode || error.errorCode,
      detalle_error: error.errorMessage || message,
      // ... otros campos básicos
    });
  }

  if (isCancellable) {
    setPaymentMethod('');
    onAutoPaymentFailed?.();
  }

  Alert.alert(title, message, [{ text: 'OK' }]);
}
```

---

### 4️⃣ **Actualizar Interface TuuTransactionData**

Verificar que todos los campos opcionales estén bien tipados:

```typescript
export interface TuuTransactionData {
  // ... campos existentes
  
  // Actualizar estos específicamente:
  codigo_autorizacion?: string;  // ✅ Ya existe
  ultimos_digitos?: string;      // ✅ Ya existe
  marca_tarjeta?: string;        // ✅ Ya existe
  response_code?: string;        // ✅ Ya existe
  detalle_error?: string;        // ✅ Ya existe (solo texto)
  dispositivo?: string;          // ✅ Ya existe
  ip_origen?: string;            // ✅ Ya existe
}
```

**✅ La interfaz ya tiene todos los campos, solo falta ENVIARLOS**

---

## 📋 Plan de Acción Paso a Paso

### Fase 1: Investigación (1 día)
- [ ] Hacer prueba con TUU DEV y capturar respuesta completa con `console.log` detallado
- [ ] Verificar qué campos adicionales devuelve TUU en la respuesta
- [ ] Documentar estructura exacta del response de TUU

### Fase 2: Código Nativo ✅ **COMPLETADO PARCIALMENTE**
- [x] ✅ Capturar `authCode` en `TuuPaymentModule.java`
- [x] ✅ Capturar `last4` en `TuuPaymentModule.java`
- [ ] Solicitar a TUU confirmación sobre campos adicionales (`cardType`, `responseCode`, `installments`)
  
  **Archivo:** `android/app/src/main/java/com/dtemitepos/TuuPaymentModule.java`

### Fase 3: TypeScript ✅ **COMPLETADO PARCIALMENTE**
- [x] ✅ Actualizar `TuuPaymentResponse` con `authCode` y `last4`
- [x] ✅ Actualizar tipo `tuuPaymentData` en `common.ts`
- [x] ✅ Modificar lógica de captura en `PaymentsMethods.tsx`
- [x] ✅ Actualizar llamadas a `registrarTransaccionTuu` en `SaleCompletedScreen.tsx`
- [x] ✅ Actualizar llamadas a `registrarTransaccionTuu` en `mySalesStore.ts`
- [ ] Agregar DeviceInfo y NetInfo (siguiente paso)
- [ ] Capturar campos adicionales cuando TUU los confirme

### Fase 4: Testing (1-2 días)
- [ ] Probar con TUU DEV
- [ ] Verificar que todos los campos se guarden en BD
- [ ] Probar casos de error y validar que se capture `detalle_error`
- [ ] Probar con diferentes tipos de tarjeta

---

## 🎯 Campos Prioritarios a Implementar

### Alta Prioridad (impacta análisis de negocio):
1. ✅ `codigo_autorizacion` - Para conciliación bancaria
2. ✅ `ultimos_digitos` - Para identificar tarjeta en UI
3. ✅ `marca_tarjeta` - Para estadísticas (VISA vs MC)
4. ✅ **HECHO** `codigo_autorizacion` (campo `authCode`) - Para conciliación bancaria
2. ✅ **HECHO** `ultimos_digitos` (campo `last4`) - Para identificar tarjeta en UI
3. ⚠️ `marca_tarjeta` - Para estadísticas (VISA vs MC) - **Pendiente confirmación TUU**
4. ⚠️ `response_code` - Para análisis de rechazos - **Pendiente confirmación TUU**
6. ✅ `ip_origen` - Para seguridad/auditoría
7. ✅ `detalle_error` - Para debugging

### Baja Prioridad:
8. ⚪ `custom_fields` - No se usa actualmente
9. ⚪ `voucher_data` - No se usa (imprimen desde app)

---

## 📊 Estado Actual vs Objetivo

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Campos enviados | 32/42 (+4) | 35/42 |
| Completitud | 76% (+9%) | 83% |
| Datos TUU capturados | 7/12+ (+2) | 12/12 |
| Contexto dispositivo | 2/3 (+2) | 3/3 |
| **Errores mapeados** | **100+ códigos HP/ICE** | ✅ **COMPLETO** |

**Última actualización:** 10/02/2026 - Implementados `authCode`, `last4`, `dispositivo`, `detalle_error` + **TODOS los códigos de error HP/ICE** controlados

---

## 🔗 Archivos Relacionados

1. **Servicio TUU:**
   - [src/services/tuuPayment.ts](src/services/tuuPayment.ts) - Interfaces y servicio
   - [android/.../TuuPaymentModule.java](android/app/src/main/java/com/dtemitepos/TuuPaymentModule.java) - Módulo nativo

2. **API Backend:**
   - [src/services/api.ts](src/services/api.ts#L834) - `registrarTransaccionTuu()`

3. **Componentes que registran:**
   - [src/components/payment/PaymentsMethods.tsx](src/components/payment/PaymentsMethods.tsx#L180)
   - [src/screens/SaleCompletedScreen.tsx](src/screens/SaleCompletedScreen.tsx#L184)
   - [src/stores/mySalesStore.ts](src/stores/mySalesStore.ts#L208)

4. **Tipos:**
   - [src/types/common.ts](src/types/common.ts#L84) - `Sale['tuuPaymentData']`

---

## 💡 Notas Adicionales

### ⚠️ Campo `tax_idn_validation`
Actualmente se envía **vacío (`''`)** intencionalmente en [PaymentsMethods.tsx:168](src/components/payment/PaymentsMethods.tsx#L168):
```typescript
taxIdnValidation: '', // Vacío para evitar validación de RUT
```

**Razón:** Si se envía, debe coincidir EXACTAMENTE con el RUT del titular de la tarjeta validado por TUU, lo cual genera errores.

**Recomendación:** Mantener vacío a menos que TUU devuelva el RUT validado en su respuesta.

---

### 📞 Soporte

Si necesitas revisar la documentación técnica de TUU/Haulmer:
- Solicitar al equipo de TUU la especificación completa del response
- Verificar si hay campos adicionales no documentados
- Confirmar nombres exactos de campos para evitar errores de mapeo

---

**Documento generado el:**10/02/2026 - Implementados campos `authCode` y `last4` confirmados por TUU

---

## 📝 Historial de Cambios

### 10/02/2026 - Control completo de errores + authCode, last4, dispositivo y detalle_error
- ✅ Agregado campo `authCode` (código de autorización) en respuesta TUU
- ✅ Agregado campo `last4` (últimos 4 dígitos) en respuesta TUU
- ✅ Agregado campo `dispositivo` hardcodeado como "POS PRO2"
- ✅ **Implementado captura automática de `detalle_error` para transacciones fallidas**
- ✅ **Agregados 100+ códigos de error HP (procesador de pagos/banco)**
- ✅ **Agregados códigos ICE (errores de TUU/integración)**
- ✅ **Registro automático de transacciones fallidas en BD para auditoría**
- ✅ Actualizado `TuuPaymentModule.java` para capturar campos TUU
- ✅ Actualizado interfaces TypeScript (`TuuPaymentResponse`, `Sale.tuuPaymentData`)
- ✅ Actualizado mapeo en `PaymentsMethods.tsx`
- ✅ Actualizado envío a BD en `SaleCompletedScreen.tsx` y `mySalesStore.ts`
- **Resultado:** Completitud aumentó de 67% → 76% (32/42 campos)
- **Resultado:** 100% de códigos de error conocidos están mapeados y controladosde 2026  
**Versión de la app:** 2.0.0  
**Última actualización:** Initial version
