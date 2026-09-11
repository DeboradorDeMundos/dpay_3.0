---
name: dpay-hu06-execution
description: Ejecuta y documenta pruebas HU-06 de D-PAY 3.0 — pago aprobado, rechazado, error de conexión y regresión TUU/Kozen. Usar en pruebas de Webpay sandbox, QA Capstone, evidencia HU-06, o cuando el usuario menciona HU-06, casos de prueba de pago o regresión PaymentGateway.
metadata:
  layer: project
  project: dpay-3.0
  hu: HU-06
  version: "1.0.0"
paths:
  - "**/payment/**"
  - "**/PaymentGateway*"
  - "**/*payment*"
  - "**/*.test.ts"
  - "**/*.test.tsx"
---

# D-PAY 3.0 — Ejecución HU-06

## Responsable académico

Reinhartd Munzenmayer — evidencia obligatoria para informe y defensa.

## Escenarios obligatorios

| ID sugerido | Escenario | Gateway | Dispositivo |
|---|---|---|---|
| TC-061 | Pago **aprobado** Webpay sandbox | Webpay | Celular genérico |
| TC-062 | Pago **rechazado** Webpay sandbox | Webpay | Celular genérico |
| TC-063 | **Error de conexión** / timeout Transbank | Webpay | Celular genérico |
| TC-064 | **Regresión TUU/Kozen** — cobro terminal físico | TUU | Kozen P8 Neo |

Usar tarjetas/RUT oficiales de [transbankdevelopers.cl](https://www.transbankdevelopers.cl) — **no inventar PAN**.

## Precondiciones comunes

- Build con `PaymentGateway` integrado (HU-02+)
- Sandbox Webpay configurado (sin keys en repo)
- Para TC-064: terminal Kozen disponible, flujo Intent Android intacto

## Pasos de ejecución (por escenario)

### TC-061 — Aprobado

1. Iniciar venta en app → seleccionar Webpay (HU-04 si aplica)
2. Completar pago sandbox con tarjeta de **aprobación** oficial
3. Verificar retorno a app y estado en `salesStore`
4. Capturar evidencia (UI + log backend sin secrets)

**Esperado:** venta en estado pagado/confirmado; sin crash; sin credenciales en logs.

### TC-062 — Rechazado

1. Repetir flujo con tarjeta de **rechazo** oficial
2. Verificar mensaje al usuario y estado de venta (no ambiguo)

**Esperado:** rechazo manejado; venta no queda como pagada.

### TC-063 — Error de conexión

1. Simular red caída, timeout o servicio Transbank no disponible
2. Verificar manejo de error en app

**Esperado:** sin crash; estado de venta recuperable o claramente fallido; mensaje al usuario.

### TC-064 — Regresión TUU/Kozen

1. **Sin cambiar** configuración Webpay, ejecutar cobro con terminal físico
2. Comparar comportamiento con baseline pre-refactor (Intent nativo)

**Esperado:** flujo TUU idéntico al pre-HU-02; detección HU-01 correcta (Kozen ≠ celular genérico).

## Orden de debugging (Webpay)

1. Backend recibió `sale_id` correcto
2. Respuesta cruda SDK Transbank (log backend, sanitizado)
3. Estado en `salesStore` / stores relacionados

## Orden de debugging (TUU)

1. Intent nativo Android sigue invocándose
2. Adaptador `TuuPaymentGateway` / `tuuPayment.ts` no rompió contrato
3. Detección de dispositivo (HU-01)

## Al encontrar defecto

Registrar con `/qa-defect-report` **antes** de fix silencioso.

## Evidencia

Archivar con `/qa-test-evidence` bajo `evidencia/DPAY/HU-06/`.

## Skills globales complementarios

- `qa-test-case-design` — ampliar casos
- `qa-traceability` — cerrar HU con matriz
- `qa-regression-plan` — tras cada merge a PaymentGateway
