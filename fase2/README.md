# Fase 2 — Desarrollo (Semanas 5–15)

**Ponderación:** 50%  
**Hitos:** Informe S10 (20%) + Producto S15 (30%)

---

## Objetivo

Dejar **D-PAY defendible como POS**: login → venta → cobro → DTE → historial → impresión, integrado a la API de DTemite.

---

## Entregables

| Artefacto | Dónde |
|---|---|
| App | `codigo/` |
| Sprint backlog | `docs/10-sprint-backlog.md` |
| Pruebas | `docs/11-plan-pruebas-evidencias.md` |
| Evidencias | `fase2/evidencias/` |
| Informe S10 | `fase2/informe-avance/` |
| APK | `codigo/` (`npm run build:apk`) |

Historias: HU-01 a HU-14 en [docs/02-backlog.md](../docs/02-backlog.md).

---

## Fuera de esta fase (código)

- Reescribir el ERP `nuevodtemite`
- Webpay / Flow / Mercado Pago (backlog futuro)
- iOS

---

```powershell
cd codigo
npm run dev:mobile
```

Manual: [docs/12-manual-tecnico-despliegue.md](../docs/12-manual-tecnico-despliegue.md)
