---
name: dpay-adr-catalog
description: Catálogo y plantillas de ADRs D-PAY 3.0 — decisiones PaymentGateway, Webpay, exclusiones MVP, monolito. Usar al escribir ADR del proyecto, registrar decisión arquitectónica Capstone, o unificar criterios con Product Vision.
metadata:
  layer: project
  project: dpay-3.0
  version: "1.0.0"
disable-model-invocation: true
---

# D-PAY — Catálogo de ADRs

Ubicación sugerida en repo: `docs/adr/` (crear solo con OK del equipo — no modificar sin permiso).

## ADRs recomendados (MVP)

| ID | Título | Estado sugerido | HU |
|---|---|---|---|
| ADR-001 | Patrón PaymentGateway (adapter/strategy) | Accepted | HU-02 |
| ADR-002 | Webpay sandbox vía backend Dtemite | Accepted | HU-03 |
| ADR-003 | Monolito por capas (no microservicios) | Accepted | HU-05 |
| ADR-004 | Exclusión Docker del alcance Capstone | Accepted | — |
| ADR-005 | MMKV para tokens (no AsyncStorage) | Accepted | RNF |
| ADR-006 | Exclusión NFC/SoftPOS post-Capstone | Accepted | — |
| ADR-007 | PayPal — pendiente unificación docs | Proposed | — |

## ADR-001 — esqueleto (PaymentGateway)

Usar plantilla `arch-adr`. Opciones mínimas:

- **A:** if/else en UI — rechazada (violación mantenibilidad)
- **B:** PaymentGateway + Factory — **elegida**
- **C:** Microservicio pagos — rechazada (plazo, complejidad)

## ADR-002 — esqueleto (Webpay)

- **A:** SDK Transbank en app — rechazada (PCI, keys)
- **B:** Proxy backend — **elegida**

## Gobernanza

- **Proposed** en PR de diseño
- **Accepted** tras review Diego + par (Pablo)
- **Superseded** si cambia decisión — nunca editar Accepted in-place

## Inconsistencias a resolver con ADR-007

Product Vision / Backlog mencionan PayPal; decisión externa de excluir (USD vs CLP). **Unificar** antes defensa.

## Trazabilidad

Cada ADR Accepted debe aparecer en:

- Informe HU-05
- Matriz RF→decisión (si aplica)
- `arch-review` checklist

## Workflow agente

1. Verificar si ADR existe para la pregunta
2. Si no → proponer borrador MADR con `arch-adr`
3. **Preguntar** antes de crear archivos en repo
