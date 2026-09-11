---
name: dpay-rnf-security-gate
description: Gate de seguridad pre-merge D-PAY 3.0 — verifica RNF transversales, PCI, secretos, alcance MVP antes de cerrar HU o PR. Usar al preparar merge a main, demo Capstone, o cuando el usuario pide gate de seguridad, DoD de RNF o checklist pre-release.
metadata:
  layer: project
  project: dpay-3.0
  version: "1.0.0"
disable-model-invocation: true
---

# D-PAY 3.0 — Gate de seguridad (RNF)

Verificar **cada ítem** antes de aprobar merge o demo. Complementa `dpay-acceptance-criteria` (funcional) y `sec-pr-review` (código).

## RNF — Datos y pagos

- [ ] Sin PAN/CVV persistidos en dispositivo (RNF-02.4)
- [ ] Tokens/credenciales en MMKV, no AsyncStorage
- [ ] Sin API keys / commerce codes en código, logs ni commits
- [ ] Evidencia QA sin secretos visibles (`qa-test-evidence`)

## RNF — Arquitectura y alcance

- [ ] Sin Docker introducido en alcance MVP (decisión de equipo)
- [ ] NFC/SoftPOS no implementado ni documentado como entregado
- [ ] `PaymentGateway` respetado — sin lógica de pasarela en `SalePaymentScreen`

## RNF — Operación y agente IA

- [ ] `.cursorignore` cubre `.env`, tokens, keys locales
- [ ] Skills de terceros vetadas con `sec-skills-vetting` si se instalaron
- [ ] Run Mode Cursor: preferir Auto-review (no Run Everything)

## Por HU (seguridad mínima)

| HU | Control de seguridad |
|---|---|
| HU-01 | Detección no filtra fingerprint sensible innecesario |
| HU-02 | Refactor TUU no expone nuevos permisos Android |
| HU-03 | Webpay sandbox; validación server-side donde aplique |
| HU-04 | UI no expone datos de otra sesión/tenant |
| HU-05 | Diagramas no incluyen secretos reales |
| HU-06 | TC error/rechazo no filtra internals en UI |

## Veredicto

```markdown
**Gate seguridad D-PAY — [fecha / PR / HU]**

| Categoría | Estado |
|---|---|
| Datos y pagos | Pass / Fail |
| Arquitectura | Pass / Fail |
| Agente / tooling | Pass / Fail |

**Veredicto:** ✅ Apto / ❌ Bloqueado
**Bloqueadores:** …
```

## Inconsistencias documentales (alertar)

- PayPal en docs vs exclusión por moneda — unificar antes de defensa
- Credenciales en documentos Word/PDF — revisar antes de entregar

## Escalación

- Fallo Crítico → `qa-defect-report` + bloqueo merge
- Dudas PCI/compliance comercial → PO Dtemite (no decisión solo estudiantes)
