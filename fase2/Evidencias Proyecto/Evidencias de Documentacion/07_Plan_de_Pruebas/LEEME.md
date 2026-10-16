# DOC-07 — Plan de pruebas + evidencias

**Fuente de trabajo (Reinhartd):** `C:\CAPSTONE_documentos\07_Plan_de_Pruebas`  
**Carpeta Drive / Git a publicar:** `07_Plan_de_Pruebas`  
**Instrumentos:** 2.3 grupal · 2.2 individual

## Estructura

| Carpeta | Contenido |
|---------|-----------|
| `00_Plan_maestro/` | Plan (md v1.2), catálogo CSY4111, listado de defectos (md v1.2) |
| `01_Unitarias/` | Jest app + proxy; salida HU-06/TUU 11/10 |
| `02_Integracion/` | Contrato Webpay create/commit/status |
| `03_Rendimiento/` | RNF login/catálogo/Webpay |
| `04_Seguridad/` | PAN/CVV, secretos, HTTPS |
| `05_Evidencias_por_sprint/Sprint_0X/` | Casos ejecutados de ese sprint |

## Corte 14/10/2026

- **S01:** cerrado (sandbox 19/09).
- **S02:** cerrado: efectivo+historial 27/09; QR+cancel 03/10; TBK aprobado y TC-WP-04 rechazado 04/10; DEF-NET/DEF-CFG documentados.
- **S03 (en curso):** hu06Tuu + factory + detección PASS 11/10; **TC-064 / TC-RG-01 Parcial** 13/10 (débito $2.000 aprobado + crédito $5.000 cancelado en Kozen P8 Neo). DTE boleta 39, folio servidor, NC 61 y re-test DEF-NET pendientes.
- **HU-06:** aprobado PASS, rechazado PASS, error de conexión parcial, regresión TUU **Parcial** (no Bloqueado). Ver Plan §14.1 y `Sprint_03/DPAY3_Pruebas_S03.md`.

## Sincronía `.md` / `.docx`

Los `.docx` se generan con `_gen/generate_docs.py`, que también reescribe los `.md`; cualquier cambio se hace en el script, no en el `.md`. El 11/10 se regeneraron Plan maestro v1.2, Listado de defectos v1.2, Unitarias v1.1, `Sprint_03/DPAY3_Pruebas_S03` v0.2 y Retro S03 v0.2 (`python generate_docs.py plan_maestro cat_unitarias listado_defectos pruebas_s3 retro_s3`); `.md` y `.docx` coinciden. Respaldo previo: `_gen/_backup_20261011/`.

## Nomenclatura (vigente)

- Renombres 11/10 (tabla en `Evidencias_dpay/00-indice/RENOMBRES-EVIDENCIA-2026-10-11.md`): capturas 19/09 `TC-WP-03_*` -> `TC-WP-01_*`; 03/10 -> `TC-WP-TBK_*`. TC-WP-03 queda solo para error de conexión (evidencia **DEF-NET**). Sufijo de dispositivo único `CelularAndroid`.
- `TC-02_OK_clave-incorrecta_*` (antes `TC-02_FAIL_`): el mensaje de error esperado es un **PASS**. Casos negativos que pasan llevan `_OK_`.
- IDs HU-06 de la guía (TC-061..064) mapeados en Plan §14.1; no renombrar archivos ya citados.

## Evidencias foto

Originales en `Evidencias_dpay\` (no Git). Copiar JPG a `05_Evidencias_por_sprint` al empaquetar entrega (`Sprint_02/capturas_20261004/` 04/10; `Sprint_03/capturas_20261013/` 8 JPG TUU/Kozen 13/10).
