# Clasificación capturas - 2026-10-13 (TUU/Kozen P8 Neo)

**Dispositivo:** Kozen P8 Neo (título de ventana `P8 Neo` / `D-PAY-3.0`)  
**Pasarela en UI:** TUU / Kozen (no Webpay)  
**Documento tributario en UI:** Comprobante Electrónico  
**QA (clasificación):** Reinhartd Munzenmayer, 14/10/2026  
**Caso de plan:** TC-RG-01 = TC-064 (regresión TUU/Kozen, HU-06)  
**Origen:** `_por-clasificar/` quedó vacía; los JPG ya estaban en `COD-08-HU06-tuu-kozen/capturas/` (13/10 21:50–21:51) y en `07_Plan_de_Pruebas/05_Evidencias_por_sprint/Sprint_03/capturas_20261013/`.

`_por-clasificar/` se deja vacía otra vez (solo `LEEME.md`).

---

## Lectura (no redondear)

Hay **dos ventanas de hora** en la barra de estado:

| Sesión | Reloj en captura | Qué cubre |
|---|---|---|
| A (mañana) | **10:32 a. m.** | Débito **aprobado** $2.000 - *Pago exitoso* (UI TUU nativa, título `P8 Neo`) |
| B (tarde) | **2:18–2:21 p. m.** | Crédito $5.000: Opera tarjeta → cancelar → *Transacción cancelada*; luego débito $5.000: Opera + PIN (sin comprobante de éxito) |

El “rechazo” de crédito **no es rechazo del emisor**. Es **cancelación de usuario** en TUU (`Cancelar transacción` → `La transacción fue cancelada.`). Equivale a flujo negativo tipo cancel, no a declined de marca.

**No hay** captura de crédito **aprobado** (*Pago exitoso* + Tarjeta de Crédito).  
**No hay** cierre de débito $5.000 (PIN a las 14:21 sin *Pago exitoso*).

**Veredicto TC-RG-01 / TC-064:** **Parcial** (deja de estar Bloqueado). Débito aprobado PASS; cancelación de crédito PASS; crédito aprobado y rechazo emisor sin evidencia.

---

## A - Crédito $5.000 (sesión B, ~14:18)

Carpeta: `Evidencias_dpay/COD-08-HU06-tuu-kozen/capturas/`

| # | Archivo | Qué se ve | Resultado |
|---|---|---|---|
| 1 | `TC-RG-01_selector-tuu-kozen_5000_20261013_KozenP8Neo.jpg` | Métodos de pago $5.000; **Pasarela: TUU / Kozen**; Efectivo / Crédito / Débito | HU-01: Kozen ≠ celular genérico |
| 2 | `TC-RG-01b_opera-tarjeta-credito_5000_20261013_KozenP8Neo.jpg` | TUU *Opera tu tarjeta* $5.000 **TARJETA DE CRÉDITO** (PAN ilustrado 9999, no real) | Inicio cobro crédito |
| 3 | `TC-RG-01e_cancelar-transaccion-tuu_5000_20261013_KozenP8Neo.jpg` | Diálogo *Cancelar transacción* sobre crédito $5.000 (14:18) | Paso de cancelación |
| 4 | `TC-RG-01e_OK_transaccion-cancelada_5000_20261013_KozenP8Neo.jpg` | *Transacción cancelada. La transacción fue cancelada.* Vuelta a métodos | **PASS** caso negativo (venta no cobrada) |

---

## B - Débito (sesión A $2.000 aprobado + sesión B $5.000 PIN)

| # | Archivo | Qué se ve | Resultado |
|---|---|---|---|
| 5 | `TC-RG-01c_selector-tuu-kozen_2000_20261013_KozenP8Neo.jpg` | Métodos $2.000; **Pasarela: TUU / Kozen** | Precondición débito |
| 6 | `TC-RG-01c_opera-tarjeta-debito_5000_20261013_KozenP8Neo.jpg` | *Opera tu tarjeta* $5.000 **TARJETA DE DÉBITO** | Inicio débito (monto 5000, no 2000) |
| 7 | `TC-RG-01c_pin-tuu-debito_5000_20261013_KozenP8Neo.jpg` | *Ingresa tu clave* teclado TUU (14:21). Sin PAN/CVV | PIN débito $5.000; **sin cierre** |
| 8 | `TC-RG-01c_OK_pago-exitoso-debito_2000_20261013_KozenP8Neo.jpg` | *Pago exitoso* $2.000 **Tarjeta de Débito**; comprobante; Email/Imprimir (10:32) | **PASS** débito aprobado |

---

## Trazabilidad

| ID | HU / COD | Resultado | Evidencia principal |
|---|---|---|---|
| TC-RG-01 / TC-064 débito aprobado | HU-06 | **OK** | `TC-RG-01c_OK_pago-exitoso-debito_2000_20261013_KozenP8Neo.jpg` |
| TC-RG-01 / TC-064 crédito cancelado | HU-06 | **OK** (cancel, no declined emisor) | `TC-RG-01e_OK_transaccion-cancelada_5000_20261013_KozenP8Neo.jpg` |
| TC-RG-01 / TC-064 crédito aprobado | HU-06 | **Sin evidencia** | - |
| TC-RG-01 / TC-064 rechazo emisor | HU-06 | **Sin evidencia** | - |
| HU-01 detección en Kozen | HU-01 | **OK** | selector *Pasarela: TUU / Kozen* $5.000 y $2.000 |
| TC-RG-01 / TC-064 **conjunto** | HU-06 | **Parcial** | 8 JPG + Jest 17/17 (11/10) |

PCI: las capturas no muestran PAN ni CVV reales (ilustración TUU 9999; PIN sin dígitos marcados).

Copia de entrega DOC-07: `C:\CAPSTONE_documentos\07_Plan_de_Pruebas\05_Evidencias_por_sprint\Sprint_03\capturas_20261013\`.
