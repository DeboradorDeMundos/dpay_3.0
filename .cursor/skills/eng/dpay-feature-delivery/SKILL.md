---
name: dpay-feature-delivery
description: Entrega de features D-PAY por HU — rama feature/HU-XX, alcance MVP, coordinación Scrum, Definition of Done. Usar al iniciar sprint, abrir rama, planificar HU-01 a HU-06, o cuando el usuario pide flujo de desarrollo Capstone Fase 2.
metadata:
  layer: project
  project: dpay-3.0
  version: "1.0.0"
disable-model-invocation: true
---

# D-PAY — Entrega por Historia de Usuario

## Modelo de ramas (equipo)

| Trabajo | Rama |
|---|---|
| Código HU | `feature/HU-XX` |
| Docs personal | `docs/fase2-[descriptor]-reinhard` |
| Integración | PR → `main` |

**No** rama única `fase2` compartida — una HU = una rama/PR cuando sea posible.

## Mapa HU → enfoque dev

| HU | Foco | Skill principal |
|---|---|---|
| HU-01 | Detección Kozen vs genérico | `dpay-rn-stack` |
| HU-02 | PaymentGateway + refactor TUU | `dpay-payment-gateway-dev` |
| HU-03 | Webpay E2E sandbox | `dpay-payment-gateway-dev` + `eng-api-design` |
| HU-04 | UI selección pasarela | `dpay-rn-stack` |
| HU-05 | UML / arquitectura | `eng-architecture` |
| HU-06 | Pruebas + evidencia | `qa-*`, todos pueden desarrollar |

## Workflow por HU

1. **Acordar owner** de rama (equipo cross-funcional)
2. Branch desde `main` actualizado
3. Implementar alcance mínimo del criterio de aceptación
4. Probar + evidencia (QA)
5. PR `[HU-XX] …` con revisión de par
6. Regresión pagos si tocó gateway
7. Cierre: `dpay-acceptance-criteria` + `dpay-rnf-security-gate`

## Definition of Done (dev)

- [ ] Criterios de aceptación HU verificados uno a uno
- [ ] PR revisado por ≥1 integrante
- [ ] Sin secretos en diff
- [ ] Regresión TUU si tocó pagos
- [ ] Trazabilidad RF→HU documentada si aplica informe

## Alcance excluido MVP

- Docker
- NFC / SoftPOS
- PayPal (pendiente decisión PO — alertar inconsistencia docs)

## Commits

```
feat(HU-03): agrega creación transacción Webpay en backend
refactor(HU-02): extrae IPaymentGateway desde TuuPaymentGateway
```

Ver `eng-git-pr` y rule `08-git-github`.

## Coordinación

- Diego/Pablo: arquitectura e integración
- Reinhartd: QA HU-06 + puede desarrollar
- PO Dtemite: afiliación productiva pasarelas (comercial)

## Freeze de fase

Antes entrega: solo bugs, no features nuevas (rule `08-git-github`).
