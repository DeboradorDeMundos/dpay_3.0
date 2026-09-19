# Fase 2 — Desarrollo (Semanas 5–15)

**Ponderación:** 50%  
**Hitos:** Informe S10 (20%) + Producto S15 (30%)

---

## Objetivo

Dejar **D-PAY defendible como POS**: login → venta → cobro → DTE → historial → impresión, integrado a la API de DTemite.

---

## Estructura (repo público)

Alineada a entregables APT Fase 2 — **proyecto · grupales · individuales**:

```
fase2/
├── proyecto/       Docs transversales del POS (baseline COD, arquitectura)
├── grupales/       Informes y entregables de equipo (S10, S15, presentaciones)
├── individuales/   APT122 por integrante (ej. reinhard/)
└── evidencias/     Placeholders de capturas/logs referenciados en el repo
```

**Informes Word / planillas Duoc (2.x APT122):** `C:\CAPSTONE_documentos\Fase2\` — no van al repo público.

**Capturas QA Honor:** `C:\Users\NEKODev\Documents\CAPSTONE\Evidencias_dpay\` — local, no GitHub.

---

## Entregables

| Artefacto | Dónde |
|---|---|
| App | `codigo/` |
| Sprint backlog | `codigo/docs/10-sprint-backlog.md` |
| Pruebas | `codigo/docs/11-plan-pruebas-evidencias.md` |
| Baseline COD-00 | `fase2/proyecto/COD-00-inventario-baseline.md` |
| Evidencias markdown | `fase2/individuales/reinhard/` |
| Evidencias capturas (repo) | `fase2/evidencias/` |
| Informe avance S10 (Word) | `C:\CAPSTONE_documentos\Fase2\` → copia resumen en `fase2/grupales/` |
| Producto final S15 (APK, video) | `fase2/grupales/` + respaldo local |

Historias: HU-01 a HU-14 en [codigo/docs/02-backlog.md](../codigo/docs/02-backlog.md).

---

## Fuera de esta fase (código)

- Reescribir el ERP `nuevodtemite`
- iOS

---

```powershell
cd codigo
npm run dev:mobile
```

Manual: [codigo/docs/12-manual-tecnico-despliegue.md](../codigo/docs/12-manual-tecnico-despliegue.md)
