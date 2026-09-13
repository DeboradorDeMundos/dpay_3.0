# Historias de Usuario — D-PAY 3.0

Detalle del Product Backlog: criterios de aceptación, tareas y dependencias.

**Referencia:** [02-backlog.md](./02-backlog.md) · [01-vision.md](./01-vision.md)

---

## EP-01 — Identidad y sesión

### HU-01 — Login multi-tenant

**Como** comercio cliente de DTemite,  
**quiero** entrar a D-PAY con RUT de empresa, usuario y clave,  
**para** operar mi tenant desde el celular.

| Prioridad | Pts. | Sprint | Épica |
|---|---|---|---|
| Alta | 5 | 1 | EP-01 |

#### Criterios de aceptación

1. **CA-01.1:** Login contra `POST /api/login` con RUT, usuario y contraseña.
2. **CA-01.2:** El token de sesión (opaco) se guarda en MMKV y se envía como `Authorization: bearer {token}`.
3. **CA-01.3:** Credenciales inválidas muestran error en español, sin stack técnico.
4. **CA-01.4:** Al primer login se descargan CAFs, catálogo y clientes.
5. **CA-01.5:** Logout limpia token y datos de sesión sensibles.

#### Tareas técnicas

- [ ] `LoginScreen` + `authStore`
- [ ] Cliente HTTP `apiClient.ts`
- [ ] Persistencia MMKV

#### Dependencias

Ninguna.

---

### HU-02 — PIN y biometría

**Como** cajero,  
**quiero** bloquear D-PAY con PIN o huella,  
**para** que nadie use mi caja si dejo el teléfono.

| Prioridad | Pts. | Sprint | Épica |
|---|---|---|---|
| Alta | 3 | 1 | EP-01 |

#### Criterios de aceptación

1. **CA-02.1:** PIN patrón (grilla 3×3) para desbloquear.
2. **CA-02.2:** Biometría opcional (`react-native-biometrics`); deshabilitada en terminal POS.
3. **CA-02.3:** La contraseña no se guarda en texto plano; `b64pass` solo para API legacy DTE.
4. **CA-02.4:** Si falta el anexo de servicio `dpay_pos`, se muestra T&C y se acepta vía `/dpay/contrato/aceptar-anexo`.

---

## EP-02 — Venta

### HU-03 — Armar la venta

**Como** cajero,  
**quiero** armar una venta con calculadora, catálogo o scanner,  
**para** cobrar sin un computador.

| Prioridad | Pts. | Sprint | Épica |
|---|---|---|---|
| Alta | 8 | 1–2 | EP-02 |

#### Criterios de aceptación

1. **CA-03.1:** Calculadora táctil para monto libre.
2. **CA-03.2:** Catálogo con búsqueda (`CatalogueScreen`).
3. **CA-03.3:** Escaneo de código de barras (Vision Camera).
4. **CA-03.4:** Carrito en `salesStore` (ítems, totales).
5. **CA-03.5:** Carrito y ventas quedan en MMKV. Emisión DTE y TUU requieren red; las pendientes se reintentan (`syncSale` / `TuuSyncScheduler`).
6. **CA-03.6:** Producto rápido (`POST /producto/rapido`) si `crea_productos` está activo.

---

### HU-04 — Documento y cliente

**Como** cajero,  
**quiero** elegir tipo de DTE y cliente,  
**para** emitir boleta, factura, exenta o comprobante.

| Prioridad | Pts. | Sprint | Épica |
|---|---|---|---|
| Alta | 5 | 2 | EP-02 |

#### Criterios de aceptación

1. **CA-04.1:** Tipos 39 (boleta), 33 (factura), 34/41 (exentas), 0 (comprobante).
2. **CA-04.2:** Cliente desde `ClientsScreen` o consumidor final `66666666-6`.
3. **CA-04.3:** Propina configurable.
4. **CA-04.4:** Tipos pueden habilitarse/deshabilitarse en settings.

---

## EP-03 — Cobro

### HU-05 — Efectivo

**Como** cajero,  
**quiero** cobrar en efectivo,  
**para** cerrar la venta sin pasarela.

| Prioridad | Pts. | Sprint | Épica |
|---|---|---|---|
| Alta | 5 | 2 | EP-03 |

#### Criterios de aceptación

1. **CA-05.1:** Medio de pago efectivo en `PaymentMethodScreen`.
2. **CA-05.2:** Registro en `POST /pos/transaccion`.
3. **CA-05.3:** Si el tipo no es 0, continúa a emisión DTE (HU-07).

---

### HU-06 — Tarjeta TUU (Kozen)

**Como** cajero con terminal Kozen,  
**quiero** cobrar crédito o débito con TUU,  
**para** aceptar tarjeta en el POS.

| Prioridad | Pts. | Sprint | Épica |
|---|---|---|---|
| Alta | 8 | 2 | EP-03 |

#### Criterios de aceptación

1. **CA-06.1:** Intent Android a `com.haulmer.paymentapp`.
2. **CA-06.2:** Mapeo a `id_mediopago` 101 (crédito) y 104 (débito).
3. **CA-06.3:** Captura `authCode`, last4, comisiones; registro en `POST /pos/transaccion`.
4. **CA-06.4:** Fallos TUU se registran con `detalle_error` (códigos HP/ICE).
5. **CA-06.5:** En celular sin TUU el flujo de tarjeta no se ofrece (efectivo sí).

---

## EP-04 — Tributario

### HU-07 — Emisión DTE

**Como** comercio,  
**quiero** que al cobrar se emita el DTE al SII,  
**para** cumplir la normativa y entregar boleta o factura.

| Prioridad | Pts. | Sprint | Épica |
|---|---|---|---|
| Alta | 13 | 2–3 | EP-04 |

#### Criterios de aceptación

1. **CA-07.1:** Emisión vía `POST /Api/Documento` (legacy PHP).
2. **CA-07.2:** Folio `"0"` para asignación en servidor.
3. **CA-07.3:** Neto/IVA: factura 33 neto; boleta 39 bruto.
4. **CA-07.4:** Firma TED local con CAF (SHA1withRSA) cuando aplique.
5. **CA-07.5:** PDF del documento.
6. **CA-07.6:** `PUT /pos/transaccion/{id}/dte` vincula DTE y pago.
7. **CA-07.7:** Tipo 0 (comprobante) no emite DTE al SII.

---

## EP-05 — Post-venta

### HU-08 — Historial

**Como** cajero,  
**quiero** ver mis ventas,  
**para** ubicar folio, monto y estado.

| Prioridad | Pts. | Sprint | Épica |
|---|---|---|---|
| Media | 5 | 3 | EP-05 |

#### Criterios de aceptación

1. **CA-08.1:** Filtro por fecha, tipo de documento y folio (`MySalesScreen`).
2. **CA-08.2:** Une ventas locales pendientes y documentos del servidor.
3. **CA-08.3:** Sync manual de pendientes.

---

### HU-09 — Nota de crédito y anulación

**Como** cajero,  
**quiero** anular o corregir una venta,  
**para** enmendar errores de monto o documento.

| Prioridad | Pts. | Sprint | Épica |
|---|---|---|---|
| Media | 5 | 3 | EP-05 |

#### Criterios de aceptación

1. **CA-09.1:** NC total o corrección de monto (`CreditNoteScreen`, tipo 61).
2. **CA-09.2:** Anulación de pago sin DTE: `PUT /pos/transaccion/{id}/anular`.
3. **CA-09.3:** Estado de pago actualizado en historial.

---

### HU-10 — Impresión Bluetooth

**Como** cajero,  
**quiero** imprimir el ticket,  
**para** entregar comprobante en papel.

| Prioridad | Pts. | Sprint | Épica |
|---|---|---|---|
| Media | 5 | 3 | EP-05 |

#### Criterios de aceptación

1. **CA-10.1:** Impresora térmica ESC/POS por Bluetooth.
2. **CA-10.2:** Autoimpresión: documento, voucher o ambos.
3. **CA-10.3:** TED en PDF417 en el ticket cuando hay DTE.

---

## EP-06 — Integraciones

### HU-11 — Payment Hub

**Como** integrador externo,  
**quiero** enviar un cobro al POS,  
**para** que el cajero cobre sin que yo hable con el terminal.

| Prioridad | Pts. | Sprint | Épica |
|---|---|---|---|
| Media | 8 | 4 | EP-06 |

#### Criterios de aceptación

1. **CA-11.1:** D-PAY recibe intents por polling (`paymentHubAgent.ts`).
2. **CA-11.2:** Muestra monto y dispara cobro local (TUU o según medio).
3. **CA-11.3:** Resultado vuelve al Hub y a `tbl_dpay`.

---

### HU-12 — Configuración del POS

**Como** cajero,  
**quiero** ajustar el POS a mi local,  
**para** imprimir con mi logo y usar solo los documentos que emito.

| Prioridad | Pts. | Sprint | Épica |
|---|---|---|---|
| Baja | 3 | 4 | EP-06 |

#### Criterios de aceptación

1. **CA-12.1:** Logo, header y footer de impresión.
2. **CA-12.2:** Habilitar/deshabilitar tipos de documento.
3. **CA-12.3:** Ver comisiones D-PAY (fija/mixta).
4. **CA-12.4:** Tema claro/oscuro.

---

## EP-07 — Calidad Capstone

### HU-13 — Documentación del producto

**Como** equipo,  
**quiero** documentar D-PAY como producto completo,  
**para** cumplir Fase 1 y defender el Capstone.

| Prioridad | Pts. | Sprint | Épica |
|---|---|---|---|
| Media | 5 | 0–1 | EP-07 |

#### Criterios de aceptación

1. **CA-13.1:** Vision, Backlog, RF/RNF, arquitectura, BD, UML.
2. **CA-13.2:** Ecosistema DTemite vs D-PAY documentado.
3. **CA-13.3:** Word Fase 1 regenerados (`Product_*_DPAYv3.0.docx`).

---

### HU-14 — Pruebas del flujo POS

**Como** equipo,  
**quiero** probar venta → cobro → DTE → historial,  
**para** demostrar el producto con evidencia.

| Prioridad | Pts. | Sprint | Épica |
|---|---|---|---|
| Media | 8 | 5 | EP-07 |

#### Criterios de aceptación

Ver matriz en [11-plan-pruebas-evidencias.md](./11-plan-pruebas-evidencias.md). Mínimo: login, venta efectivo + boleta, TUU (si hay Kozen), historial, NC, impresión, Hub, seguridad (sin secretos en Git).

---

## Plantilla

```markdown
### HU-XX — [Título]

**Como** [rol],
**quiero** [acción],
**para** [beneficio].
```

---

**Revisión:** v2.0 — 9 septiembre 2026
