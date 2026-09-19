# Fase 2 — Desarrollo (Semanas 5–15)

**Ponderación:** 50%  
**Hitos:** Informe S10 (20%) + Producto S15 (30%)

---

## Objetivo

Dejar **D-PAY defendible como POS**: login → venta → cobro → DTE → historial → impresión, integrado a la API de DTemite.

---

## Estructura

```
fase2/
├── proyecto/           Baseline COD, docs transversales del POS
├── grupales/           Entregables de equipo (informes, presentaciones)
├── individuales/       APT122 por integrante (ej. reinhard/)
├── evidencias/         Capturas y logs de prueba (repo público: placeholders)
├── informe-avance/     Informe semana 10
└── entrega-final/      APK firmada, matriz TC, video S15
```

Copias locales de respaldo (Word, capturas Honor): `C:\CAPSTONE_documentos\Fase2\` — no van al repo público.

## Entregables

| Artefacto | Dónde |
|---|---|
| App | `codigo/` |
| Sprint backlog | `codigo/docs/10-sprint-backlog.md` |
| Pruebas | `codigo/docs/11-plan-pruebas-evidencias.md` |
| Evidencias markdown | `fase2/individuales/reinhard/` |
| Evidencias capturas | `fase2/evidencias/` (+ local `Evidencias_dpay/`) |
| Informe S10 | `fase2/informe-avance/` |
| APK | `codigo/` (`npm run build:apk`) → `fase2/entrega-final/` |

Historias: HU-01 a HU-14 en [codigo/docs/02-backlog.md](../codigo/docs/02-backlog.md).

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

Manual: [codigo/docs/12-manual-tecnico-despliegue.md](../codigo/docs/12-manual-tecnico-despliegue.md)
