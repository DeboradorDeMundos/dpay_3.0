# Requerimientos Funcionales y No Funcionales — D-PAY 3.0

**POS móvil de DTemite — Capstone Duoc UC 2026-2**

---

## 1. Introducción

Este documento define los requerimientos de **D-PAY**, el punto de venta móvil que DTemite encarga para vender, cobrar y emitir DTE desde un dispositivo Android.

DTemite aporta la plataforma cloud (ERP + API). Los RF de este documento son del **producto móvil**. El ERP web no se reespecifica aquí.

Ver [00-ecosistema-dtemite.md](./00-ecosistema-dtemite.md).

**Prioridad:** Must (obligatorio producto) | Should (importante) | Could (deseable) | Won't (fuera de alcance)

---

## 2. Requerimientos funcionales — D-PAY

### RF-01 — Autenticación y sesión

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-01.1 | Login con RUT empresa, usuario y contraseña contra `POST /api/login` | Must | Implementado |
| RF-01.2 | Persistir token de sesión en MMKV e inyectarlo como `Authorization: bearer {token}` | Must | Implementado |
| RF-01.3 | Desbloqueo con PIN patrón 3×3 y biometría (biometría off en Kozen) | Should | Implementado |
| RF-01.7 | Aceptar anexo de contrato `dpay_pos` en el primer uso si corresponde | Must | Implementado |
| RF-01.4 | Almacenar `b64pass` solo para emisión DTE legacy (no texto plano de clave) | Must | Implementado |
| RF-01.5 | Descargar CAFs, catálogo y clientes al primer login | Must | Implementado |
| RF-01.6 | Cerrar sesión y limpiar token | Must | Implementado |

### RF-02 — Gestión de ventas

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-02.1 | Crear ventas con calculadora táctil | Must | Implementado |
| RF-02.2 | Agregar productos desde catálogo con búsqueda | Must | Implementado |
| RF-02.3 | Escanear código de barras | Should | Implementado |
| RF-02.4 | Seleccionar tipo de documento: 39, 33, 34, 41, 0 | Must | Implementado |
| RF-02.5 | Seleccionar cliente o consumidor final (66666666-6) | Must | Implementado |
| RF-02.6 | Propina configurable | Should | Implementado |
| RF-02.7 | Persistir carrito y ventas locales en MMKV; reintentar sync (`mySalesStore`) | Should | Implementado |
| RF-02.8 | Crear producto rápido (`POST /producto/rapido`) si el tenant lo permite | Could | Implementado |

### RF-03 — Cobro

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-03.1 | Cobrar en efectivo sin pasarela | Must | Implementado |
| RF-03.2 | Cobrar crédito vía TUU Intent en terminal Kozen | Must | Implementado |
| RF-03.3 | Cobrar débito vía TUU Intent en terminal Kozen | Must | Implementado |
| RF-03.4 | Mapear respuesta TUU a `id_mediopago` (101 crédito, 104 débito) | Must | Implementado |
| RF-03.5 | Capturar `authCode`, last4, comisiones y registrar en `POST /pos/transaccion` | Must | Implementado |
| RF-03.6 | Registrar transacciones fallidas con `detalle_error` | Must | Implementado |

### RF-04 — Emisión DTE

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-04.1 | Emitir DTE vía API legacy (`POST /Api/Documento`) | Must | Implementado |
| RF-04.2 | Enviar folio `"0"` para asignación en servidor | Must | Implementado |
| RF-04.3 | Calcular neto/IVA según tipo (33 neto, 39 bruto) | Must | Implementado |
| RF-04.4 | Firmar TED localmente con CAF (SHA1withRSA) cuando aplique | Should | Implementado |
| RF-04.5 | Generar PDF del documento | Should | Implementado |
| RF-04.6 | Vincular DTE a transacción (`PUT /pos/transaccion/{id}/dte`) | Must | Implementado |

### RF-05 — Historial y anulaciones

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-05.1 | Consultar historial con filtro fecha, tipo y folio | Must | Implementado |
| RF-05.2 | Unificar ventas locales y documentos del servidor | Must | Implementado |
| RF-05.3 | Emitir Nota de Crédito (anulación total o corrección) | Must | Implementado |
| RF-05.4 | Anular pagos sin DTE (`PUT /pos/transaccion/{id}/anular`) | Must | Implementado |
| RF-05.5 | Sincronizar ventas pendientes de forma manual | Should | Implementado |
| RF-05.6 | Compartir documento por SMS o email (`ShareScreen`) | Should | Implementado |

### RF-06 — Impresión

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-06.1 | Imprimir en térmica Bluetooth ESC/POS | Must | Implementado |
| RF-06.2 | Configurar impresión automática (documento / voucher / ambos) | Should | Implementado |
| RF-06.3 | Imprimir TED (PDF417) en el ticket | Should | Implementado |

### RF-07 — Payment Hub

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-07.1 | Recibir payment intents vía polling | Should | Implementado |
| RF-07.2 | Procesar cobro local y reportar resultado al Hub | Should | Implementado |
| RF-07.3 | El Hub registra el resultado en `tbl_dpay` del tenant | Must | Implementado (backend) |

### RF-08 — Configuración

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-08.1 | Configurar logo, headers y footers de impresión | Should | Implementado |
| RF-08.2 | Habilitar o deshabilitar tipos de documento | Should | Implementado |
| RF-08.3 | Tema claro/oscuro | Could | Implementado |
| RF-08.4 | Mostrar comisiones D-PAY (fija/mixta) | Should | Implementado |

---

## 3. Requerimientos de plataforma (DTemite — consumo)

D-PAY no implementa el ERP. Exige que la plataforma de la empresa cumpla:

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-API-01 | `POST /api/login` resuelve tenant y entrega token bearer | Must |
| RF-API-02 | `POST /pos/transaccion` persiste ventas POS en `tbl_dpay` | Must |
| RF-API-03 | Endpoints de catálogo, clientes y CAF disponibles para el POS | Must |
| RF-API-04 | Legacy PHP emite DTE al SII | Must |
| RF-API-05 | Payment Hub crea y cierra intents | Should |

---

## 4. Fuera de alcance (Won't)

| ID | Requerimiento | Motivo |
|---|---|---|
| RF-W01 | Reescribir ERP web (inventario, compras, abonos) | Plataforma de la empresa |
| RF-W02 | Cobro Webpay / Flow / Mercado Pago en el MVP | Extensión futura |
| RF-W03 | Cliente iOS nativo | Prioridad Android |
| RF-W04 | Pasarela de tarjeta en celular genérico sin TUU | Requiere Kozen + TUU |

---

## 5. Requerimientos no funcionales

### RNF-01 — Rendimiento

| ID | Requerimiento | Métrica | Prioridad |
|---|---|---|---|
| RNF-01.1 | Tiempo de login | < 3 s en 4G | Must |
| RNF-01.2 | Inicio de cobro TUU | < 2 s tras confirmar monto | Must |
| RNF-01.3 | Carga de catálogo (500 productos) | < 5 s | Should |
| RNF-01.4 | Emisión DTE | < 15 s incluyendo firma | Should |

### RNF-02 — Seguridad

| ID | Requerimiento | Prioridad |
|---|---|---|
| RNF-02.1 | Token en MMKV, no AsyncStorage plano | Must |
| RNF-02.2 | Contraseña nunca en texto plano | Must |
| RNF-02.3 | API solo HTTPS (TLS 1.2+) | Must |
| RNF-02.4 | No almacenar PAN ni CVV en el dispositivo | Must |
| RNF-02.5 | Keystore y `.env` fuera de Git | Must |
| RNF-02.6 | API keys del Hub hasheadas en backend | Must (plataforma) |

### RNF-03 — Disponibilidad

| ID | Requerimiento | Prioridad |
|---|---|---|
| RNF-03.1 | Ventas en efectivo sin conexión | Should |
| RNF-03.2 | Sync al recuperar red | Should |
| RNF-03.3 | Transacciones fallidas auditables | Must |

### RNF-04 — Usabilidad

| ID | Requerimiento | Prioridad |
|---|---|---|
| RNF-04.1 | UI táctil para pantallas 5"–6" | Must |
| RNF-04.2 | Errores de pago y DTE en español | Must |
| RNF-04.3 | Venta completable en pocos taps | Should |
| RNF-04.4 | Tema claro y oscuro | Could |

### RNF-05 — Compatibilidad

| ID | Requerimiento | Prioridad |
|---|---|---|
| RNF-05.1 | Android API 24+ (7.0) | Must |
| RNF-05.2 | Kozen P8 Neo (armeabi-v7a) para TUU | Must |
| RNF-05.3 | Smartphone Android 10+ para flujos sin TUU | Must |
| RNF-05.4 | iOS | Won't |

### RNF-06 — Mantenibilidad

| ID | Requerimiento | Prioridad |
|---|---|---|
| RNF-06.1 | TypeScript con tipado estricto | Must |
| RNF-06.2 | Separación stores / services / screens | Must |
| RNF-06.3 | Contrato API documentado | Should |

### RNF-07 — Escalabilidad

| ID | Requerimiento | Prioridad |
|---|---|---|
| RNF-07.1 | Multi-tenant: un cliente = una BD PostgreSQL | Must (plataforma) |
| RNF-07.2 | Varios terminales por comercio (Hub) | Should |

### RNF-08 — Cumplimiento

| ID | Requerimiento | Prioridad |
|---|---|---|
| RNF-08.1 | DTE conforme normativa SII Chile | Must |
| RNF-08.2 | Tipos 33, 34, 39, 41, 61 | Must |
| RNF-08.3 | PCI: no manejar PAN en servidores propios (TUU) | Must |

### RNF-09 — Operación

| ID | Requerimiento | Prioridad |
|---|---|---|
| RNF-09.1 | Debug → QA (`proqa.dtemite.cl`); release → producción | Must |
| RNF-09.2 | APK release con `npm run build:apk` | Must |
| RNF-09.3 | Repo público sin secretos | Must |

---

## 6. Trazabilidad

| Requerimiento | Historia |
|---|---|
| RF-01.* | HU-01, HU-02 |
| RF-02.* | HU-03, HU-04 |
| RF-03.* | HU-05, HU-06 |
| RF-04.* | HU-07 |
| RF-05.* | HU-08, HU-09 |
| RF-06.* | HU-10 |
| RF-07.* | HU-11 |
| RF-08.* | HU-12 |
| RNF + docs | HU-13, HU-14 |

---

## 7. Supuestos

| # | Supuesto |
|---|---|
| S-01 | DTemite mantiene QA y credenciales de prueba |
| S-02 | Terminal Kozen disponible para demo TUU (si no, se demo efectivo + DTE) |
| S-03 | El PO valida prioridades en Sprint Review |
| S-04 | El esquema `tbl_dpay` no se rediseña en el Capstone |

---

**Revisión:** v2.0 — 9 septiembre 2026
