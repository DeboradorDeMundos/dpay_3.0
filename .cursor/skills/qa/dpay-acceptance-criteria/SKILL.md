---
name: dpay-acceptance-criteria
description: Verifica criterios de aceptación por HU del MVP D-PAY 3.0 (HU-01 a HU-06) uno a uno antes de cierre de sprint. Usar al revisar Product Backlog, cerrar historias, preparar demo, o cuando el usuario pide validar criterios de aceptación o Definition of Done del Capstone.
metadata:
  layer: project
  project: dpay-3.0
  version: "1.0.0"
disable-model-invocation: true
---

# D-PAY 3.0 — Criterios de aceptación (checklist)

Verificar **cada ítem** antes de marcar HU como Done. Usar con `qa-traceability`.

## HU-01 — Detección de dispositivo

- [ ] App distingue terminal Kozen/TUU vs celular genérico
- [ ] Sin falsos positivos en dispositivos de prueba del equipo
- [ ] Factory/selección de gateway coherente con detección

## HU-02 — PaymentGateway + refactor TUU

- [ ] Existe contrato `PaymentGateway` / `IPaymentGateway`
- [ ] Implementación TUU/Kozen usa el contrato
- [ ] `SalePaymentScreen` no contiene lógica específica de pasarela nueva

## HU-03 — Webpay sandbox E2E

- [ ] SDK/API Transbank integrado en sandbox
- [ ] Flujo: inicio → redirección/confirmación → retorno con resultado
- [ ] Resultado reflejado correctamente en estado de venta

## HU-04 — UI selección de pasarela

- [ ] Usuario puede elegir pasarela cuando aplica (multi-gateway)
- [ ] UX coherente con flujo existente; sin dead-ends

## HU-05 — Documentación de arquitectura

- [ ] UML/diagramas actualizados con PaymentGateway y factory
- [ ] RNF relevantes referenciados (seguridad, no PAN en dispositivo)

## HU-06 — Pruebas (Reinhartd)

- [ ] TC aprobado Webpay — evidencia
- [ ] TC rechazado Webpay — evidencia
- [ ] TC error de conexión — evidencia
- [ ] Regresión TUU/Kozen — evidencia
- [ ] Defectos registrados con formato estándar
- [ ] Matriz RF→HU→TC completa para la entrega

## RNF transversales (Definition of Done)

- [ ] Sin Docker en alcance ni documentación contradictoria
- [ ] MMKV para tokens; no AsyncStorage para credenciales
- [ ] Sin hardcode de API keys / commerce codes
- [ ] NFC/SoftPOS fuera de alcance MVP

## Inconsistencias abiertas (alertar siempre)

- PayPal en docs Fase 1 vs decisión de exclusión — **unificar antes de defensa**
- Ortografía **Reinhartd** en documentos oficiales
