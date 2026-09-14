# Evidencia QA — auditoría COD-02 / COD-03 / COD-04 / COD-05

**Proyecto:** D-PAY 3.0  
**Fecha:** 2026-09-11  
**Responsable QA:** Reinhartd Munzenmayer  
**Rama:** `feature/COD-03-05-payment-gateway-ui`  
**Commits auditados:** `a7c9808`, `dcfb2f8`  
**Dispositivo objetivo:** Honor X5c (`GENERIC_MOBILE`)

---

## 1. Alcance auditado

- COD-02 / HU-02: contrato `IPaymentGateway`, factory y aislamiento TUU.
- COD-03: `MockPaymentGateway` (aprobado, rechazado y timeout).
- COD-04 / HU-03: stub Webpay y condiciones de desbloqueo.
- COD-05 / HU-04: visibilidad y selección de pasarela.
- Seguridad de credenciales Trello y datos de pago.
- Regresión Jest, TypeScript, React Doctor y build Android.

---

## 2. Modificaciones verificadas

| Área | Archivos principales | Resultado |
|---|---|---|
| Mock | `MockPaymentGateway.ts` | Escenarios approved/declined/timeout, solo `__DEV__` |
| Factory | `PaymentGatewayFactory.ts` | TUU en Kozen; Mock en celular genérico debug |
| Webpay | `WebpayPaymentGateway.ts` | Stub seguro, deshabilitado hasta backend |
| UI | `PaymentGatewayBadge.tsx`, `PaymentsMethods.tsx` | Badge, auto-selección y filtro de tarjeta |
| Persistencia | `common.ts`, `SaleCompletedScreen.tsx`, `mySalesStore.ts` | Mock identificado y excluido de sincronización TUU |
| Selector | `PaymentMethodSelectorScreen.tsx` | Tarjetas habilitadas cuando existe Mock |
| Tipos | `global.d.ts`, `tuu.d.ts`, `package.json` | Module augmentation y tipos Jest |
| Trello CLI | `scripts/trello.py` | Lee `.env.trello` desde repo o carpeta padre; salida Unicode segura |

---

## 3. Ejecución automática

### TC-AUTO-01 — Gateway y detección

```powershell
npm test -- --runInBand --no-coverage --testPathPattern="devicePaymentProfile|PaymentGatewayFactory|MockPaymentGateway"
```

**Resultado:** PASS — 3 suites, 9 tests.

- `TUU_KOZEN` → gateway TUU.
- Honor X5c simulado → `GENERIC_MOBILE` + Mock.
- Mock aprobado, rechazado y timeout.
- Factory retorna Mock en debug y `null` sin pasarelas.

### TC-AUTO-02 — Suite Jest completa

```powershell
npm test -- --runInBand --no-coverage
```

**Resultado:** FAIL parcial.

- 3 suites / 9 tests: PASS.
- `App.test.tsx`: FAIL preexistente por ESM de `@react-navigation/native`.

### TC-AUTO-03 — TypeScript

```powershell
npx tsc --noEmit
```

**Resultado:** FAIL — 45 errores legacy. Antes de corregir las declaraciones React Native eran 569.

No se detectaron errores TypeScript nuevos específicos en `MockPaymentGateway`,
`PaymentGatewayFactory`, `PaymentGatewayBadge` o `paymentGatewayErrors`.

### TC-AUTO-04 — React Doctor

```powershell
npx react-doctor@latest --verbose --scope changed
```

**Resultado:** 2 advertencias:

1. Iteraciones `.filter().map()` en `PaymentsMethods.tsx` (rendimiento, baja).
2. Dependencias faltantes en efecto de `SaleCompletedScreen.tsx` (riesgo de
   idempotencia; no agregar dependencias sin guard de ejecución única).

### TC-BUILD-01 — APK debug

```powershell
cd codigo/android
.\gradlew.bat assembleDebug --no-daemon
```

**Resultado:** BLOQUEADO. El proceso quedó más de 20 minutos sin avanzar después
de configurar Firebase, Reanimated y Vision Camera; fue terminado de forma
controlada. No se generó evidencia de APK válida.

---

## 4. Defectos y correcciones

| ID | Severidad | Hallazgo | Estado |
|---|---|---|---|
| DEF-PAY-01 | Alta | Celular genérico eliminaba tarjetas aun con Mock disponible | Corregido en `dcfb2f8`; manual pendiente |
| DEF-PAY-02 | Alta | Pago Mock podía persistirse/sincronizarse como TUU | Corregido en `dcfb2f8`; Mock queda solo local |
| DEF-PAY-03 | Media | Catch resolvía nuevamente el gateway y podía clasificar mal el error | Corregido: conserva `gatewayId` usado |
| DEF-TYPES-01 | Media | Declaraciones locales reemplazaban tipos de React Native | Corregido; errores tsc 569 → 45 |
| DEF-TEST-01 | Media | `App.test.tsx` no transforma ESM React Navigation | Abierto |
| DEF-BUILD-01 | Alta | `assembleDebug` queda colgado en configuración Gradle | Abierto |
| SEC-TRELLO-01 | Crítica | Token Trello estuvo en historial Git y contexto de sesión | Token rotado según responsable; limpiar historial pendiente |

---

## 5. Criterios de cierre

### COD-02 / HU-02

- [x] Contrato y resultado definidos.
- [x] TUU envuelto mediante adapter.
- [x] Factory por perfil de dispositivo.
- [x] UI de venta no invoca `tuuPaymentService` directamente.
- [x] Cancelación opcional en contrato.
- [ ] Regresión TUU en Kozen (sin hardware disponible).
- [ ] Refactor de `ExternalPaymentScreen` (Payment Hub, entrega separada).

### COD-03

- [x] Mock aprobado.
- [x] Mock rechazado.
- [x] Mock timeout.
- [x] Mismos tipos del contrato.
- [x] Limitado a `__DEV__`.
- [x] No sincroniza datos Mock como TUU.
- [ ] Evidencia manual en Honor X5c.

### COD-04 / HU-03

- [x] Stub seguro sin credenciales en app.
- [x] Bloqueo visible hasta disponer del backend.
- [ ] Endpoint backend create/commit.
- [ ] Redirect/WebView y retorno.
- [ ] Persistencia con `provider=webpay`.
- [ ] Aprobado/rechazado/error de conexión.
- [ ] Regresión DTE y verificación sin PAN/CVV.

### COD-05 / HU-04

- [x] Badge de pasarela y auto-selección con una opción.
- [x] Flujo efectivo no modificado.
- [x] Oculta tarjetas cuando no existe pasarela.
- [ ] Selector interactivo cuando existan dos o más pasarelas.
- [ ] Validación visual claro/oscuro y accesibilidad en dispositivo.

---

## 6. Evidencia manual pendiente

Guardar en `fase2/evidencias/DPAY/HU-04/`:

- `TC-MOCK-01_aprobado_20260911_pass.png`
- `TC-MOCK-02_rechazado_20260911_pass.png`
- `TC-MOCK-03_timeout_20260911_pass.png`
- `TC-MOCK-04_efectivo-regresion_20260911_pass.png`
- `TC-DEV-02_generic-mobile_20260911_pass.log`

Las capturas y logs deben estar sanitizados: sin token, PAN, CVV ni datos
personales reales.

---

## 7. Veredicto

**COD-03:** apto para QA manual.  
**COD-02:** código listo; regresión Kozen pendiente.  
**COD-04:** bloqueado, solo stub; no declarar terminado.  
**COD-05:** parcial; falta selección multi-gateway y prueba visual.  
**Merge de rama:** condicionado a corregir/aceptar `DEF-BUILD-01`, ejecutar QA
manual y revisar el commit `dcfb2f8`.
