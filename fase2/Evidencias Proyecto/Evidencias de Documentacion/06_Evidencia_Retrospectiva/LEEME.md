# DOC-06 — Evidencia de retrospectiva

**Fuente de trabajo (Reinhartd):** `C:\CAPSTONE_documentos\06_Evidencia_Retrospectiva`  
**Carpeta Drive / Git a publicar:** `06_Evidencia_Retrospectiva`  
**Instrumentos:** 2.3 grupal · 2.2 individual

Una carpeta por sprint (`Sprint_01` … `Sprint_07`).

## Estado (corte 14/10/2026)

| Sprint | Ventana | Archivo principal | Estado |
|--------|---------|-------------------|--------|
| 1 | 08/09–21/09 | `Sprint_01/DPAY3_ACTA_Retro_S01.docx` (+ `.md` espejo, anexo) | **Cerrado** — acta firmada por los 3 integrantes (04/10/2026) |
| 2 | 22/09–05/10 | `Sprint_02/DPAY3_ACTA_Retro_S02.docx` (+ `.md` espejo, anexo) | **Cerrado** — acta firmada por los 3 integrantes (04/10/2026) |
| 3 | 06/10–17/10 | `Sprint_03/DPAY3_Retro_S03.md` v0.4 + `DPAY3_ACTA_Retro_S03_PARA_FIRMAR.md` | Borrador acta 16/10; **firmas pendientes** → `DPAY3_ACTA_Retro_S03.docx`. Anexo: `ANEXO_Evidencias_Retro_S03.md` |
| 4–7 | ver Gantt | `DPAY3_Retro_S0X` plantilla v0.0 | No completar hasta la Review |

## Convención de cierre (S01/S02)

- Archivo firmado: `DPAY3_ACTA_Retro_S0X.docx` (sin sufijo `_PARA_FIRMAR`). Estado «Cerrado», Observaciones «Sin observaciones» o texto del equipo, Evidencia complementaria «Ninguna» o archivo adjunto.
- `.md` hermano = espejo del `.docx` firmado (prevalece el `.docx`).
- `ANEXO_Evidencias_Retro_S0X.md` con índice de evidencias.
- `DPAY3_Retro_S01.docx` / `S02.docx` (retro técnica) no están en las carpetas; el contenido firmado vive en el acta.

## Reglas

- No inventar métricas ni acciones de un sprint que no ocurrió.
- Al cerrar: acta firmada en la misma carpeta del sprint.
- Generadores (actualizados 11/10/2026): `_gen/generate_docs.py` ya no genera `retro_s1`/`retro_s2` y acepta regeneración selectiva (`python generate_docs.py plan_maestro retro_s3 ...`); `_gen/generate_actas_firmas.py` omite los sprints que ya tienen `DPAY3_ACTA_Retro_S0X.docx` y no reescribe `LEEME_FIRMAS_RETROS.md`; `docbuilder.emit` se niega a escribir cualquier `DPAY3_ACTA_Retro_SNN`.
