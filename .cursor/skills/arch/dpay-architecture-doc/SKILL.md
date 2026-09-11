---
name: dpay-architecture-doc
description: Produce entregables HU-05 D-PAY — UML/C4, arc42 LEAN, trazabilidad RF→decisiones, alineado plantilla Duoc. Usar en documentación Fase 2, informe arquitectura, defensa oral, o cuando el usuario pide HU-05, diagramas UML o documento arquitectura Capstone.
metadata:
  layer: project
  project: dpay-3.0
  version: "1.0.0"
disable-model-invocation: true
---

# D-PAY — Documentación de arquitectura (HU-05)

## Responsable académico

Diego Madrid (arquitectura) + equipo — QA valida trazabilidad en pruebas.

## Entregables mínimos HU-05

- [ ] Diagrama **contexto** (C4 L1) — D-PAY, usuario, Transbank, TUU, backend
- [ ] Diagrama **contenedores** (C4 L2) — app, API, DB, legacy si aplica
- [ ] Diagrama **componentes** PaymentGateway (C4 L3)
- [ ] **ADRs** clave indexados (PaymentGateway, Webpay proxy, no Docker)
- [ ] **RNF** referenciados con escenarios de calidad
- [ ] Trazabilidad **RF-N01…05 → HU-01…06**

## Convenciones Capstone

- Respetar **plantilla docente** (Doc 1.5: RNF en anexo post §8)
- Markdown vivo → PDF/docx para entrega plataforma
- Nomenclatura archivos: `APELLIDO_NOMBRE_X.X_APT122_...`
- Honestidad: marcar qué existía en D-PAY pre-Capstone vs aporte semestre

## Estructura sugerida informe

1. Introducción y objetivo arquitectónico multi-gateway
2. Restricciones (no Docker, no NFC, PCI, monolito)
3. Vistas C4 (context → container → component)
4. Flujos runtime (Webpay E2E, TUU regresión)
5. Decisiones (tabla ADR)
6. RNF y quality scenarios
7. Riesgos abiertos (PayPal inconsistencia docs)

## Skills a invocar en orden

1. `arch-c4-diagrams`
2. `arch-adr` + `dpay-adr-catalog`
3. `arch-quality-attributes`
4. `arch-arc42` (mapear a plantilla)
5. `arch-review` antes de entregar

## Diagramas UML

Si docente exige UML además de C4:

- **Component diagram** — PaymentGateway, Factory, Adapters
- **Sequence** — flujo Webpay sandbox (app → API → Transbank → commit)

Preferir claridad sobre notación exhaustiva.

## Checklist pre-entrega

- [ ] Sin credenciales en diagramas
- [ ] Terminología: Webpay (Transbank), PaymentGateway
- [ ] Nombre QA: **Reinhartd** Munzenmayer
- [ ] Consistencia con Product Vision / Backlog (alertar PayPal)
