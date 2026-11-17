# Catalogo de pruebas por tipo - CSY4111 / DOC-07

_10 funcionales + 5 no funcionales (plantilla Calidad de Software) + codigo, E2E y estaticas_

- **Proyecto:** D-PAY 3.0 - POS movil multi-pasarela (DTemite)
- **Asignatura:** Capstone APT122 - Duoc UC 2026-2
- **Documento:** DOC-07 / Catalogo por tipo
- **Version:** 1.2
- **Fecha:** 2026-10-14
- **Autor:** Reinhartd Munzenmayer (QA)
- **Equipo:** Diego Madrid, Pablo Gutierrez, Reinhartd Munzenmayer
- **Estado:** Vigente
- **Repositorio:** https://github.com/DeboradorDeMundos/dpay_3.0

---

## 1. Referencia academica

Asignatura CSY4111 Calidad de Software. Actividades 1.2.2 / 2.1.2: 10 casos funcionales y 5 no funcionales; estrategia caja negra / caja blanca / hibrida; ejecutar y registrar resultado (OK / NOK / No ejecutado / Bloqueado). Tipos del plan Duoc: Funcional, No Funcional, Codigo, End to End, Rendimiento, Carga/Stress, UAT, Estatica.


## 2. Control de ejecucion (2026-10-14)

| Estado | Cantidad |
|---|---|
| OK | 17 |
| NOK | 1 |
| No ejecutado | 0 |
| Bloqueado | 0 |
| Parcial (fuera de los 15 MTC: TUU HW) | 1 (TC-064 / TC-RG-01) |
| Total disenados | 19 |
| % ejecutados (OK+NOK+Parcial) | 100% |

04/10: MTC-09, MTC-10 y MTC-13 (~10 s QR->checkout) PASS.  
13/10: TC-064 / TC-RG-01 deja de estar Bloqueado (Parcial: debito aprobado + credito cancelado en Kozen).


## 3. Casos funcionales (caja negra) - 10

| ID | Nombre | Tipo | Estrategia | Esperado | Obtenido | Modulo | Resultado | Auto |
|---|---|---|---|---|---|---|---|---|
| MTC-01 | Login valido + catalogo | Funcional / E2E | Caja negra | Entra al POS y carga catalogo | Login Celular Android 1.5 s WiFi / 2.5 s 4G; catalogo 1 s | Auth | OK | NO |
| MTC-02 | Error de conexion en login | Funcional / Error | Caja negra | Mensaje en espanol, no entra | TC-01_login-error-conexion_20260909: Error de conexion | Auth | OK | NO |
| MTC-03 | Solo efectivo si no hay pasarela | Funcional | Caja negra / tabla decision | UI solo Efectivo; venta cierra | TC-RNF03_01..03 $100.000 comprobante | Cobro | OK | NO |
| MTC-04 | Webpay sandbox aprobado | Funcional / Integracion | Caja negra | Comprobante con auth, sin PAN | 19/09 credito/debito + 04/10 TBK comprobante $2.000 | Webpay | OK | Parcial |
| MTC-05 | Historial filtra por fecha | Funcional | Caja negra | Aparece la venta del dia | MIS VENTAS 27-09 folio 0 $100.000 13:37 | Historial | OK | NO |
| MTC-06 | Historial sin API (offline) | Funcional / Error | Flujo alterno | Falla red y venta local visible | Network request failed; venta detras del modal | Historial | OK | NO |
| MTC-07 | PDF local del comprobante | Funcional | Caja negra | PDF sin DTE SII, totales correctos | TC-RNF03_04 PDF $100.000 exento | Tributario | OK | NO |
| MTC-08 | Auto-seleccion de pasarela unica | Funcional / Codigo | Caja blanca | Una sola pasarela sin selector | Jest PaymentGatewayFactory 7/7 PASS | Factory | OK | SI |
| MTC-09 | Webpay rechazado | Funcional / Error | Flujo alterno | status declined; mensaje claro; sin DTE | Rechazar sim + Pago no completado Transbank $3.500 app 04/10 | Webpay | OK | NO |
| MTC-10 | Clave incorrecta | Funcional / Error | Caja negra | Error en espanol, no entra | TC-02_OK_clave-incorrecta_20261004_CelularAndroid.jpg | Auth | OK | NO |


## 4. Casos no funcionales - 5

| ID | Nombre | Tipo | Estrategia | Esperado | Obtenido | Resultado | Auto |
|---|---|---|---|---|---|---|---|
| MTC-11 | Login < 3 s (RNF-01.1) | No Funcional / Rendimiento | Medicion | < 3 s | 2.5 s 4G primera vez; 1.5 s WiFi | OK | NO |
| MTC-12 | Catalogo < 5 s (RNF-01.3) | No Funcional / Rendimiento | Medicion | < 5 s con 500 productos | 1.0 s WiFi y 4G (volumen de 500 productos no verificado) | Parcial | NO |
| MTC-13 | Redireccion Webpay < 10 s (RNF-01.5) | No Funcional / Rendimiento | Medicion | < 10 s E2E | Celular Android ~10 s QR->checkout WiFi 04/10 (2 muestras) | Parcial (en el borde) | NO |
| MTC-14 | Sin PAN/CVV en logs ni MMKV | No Funcional / Seguridad | Caja blanca | Solo last4 / auth_code | Test proxy 'no el PAN' PASS; capturas sin PAN | OK | SI |
| MTC-15 | Mensajes claros en espanol (RNF-04.1) | No Funcional / Usabilidad | Caja negra | Error login y red en espanol | Error de conexion; No se pudieron cargar los documentos DPay | OK | NO |


## 5. Extensiones 03/10 (QR / cancel)

| ID | Nombre | Tipo | Esperado | Obtenido | Resultado |
|---|---|---|---|---|---|
| MTC-16 | Modal QR Webpay in-app | Funcional / E2E | QR, monto, timer, tarjetas integracion | TC-WP-QR-01..03 $20.500 / $5.000 (03/10) | OK |
| MTC-17 | Cancelar cobro QR | Funcional / Error | Dialogo Cobro cancelado; vuelta a metodos | TC-WP-05_CANCEL_* Celular Android 03/10 | OK |


## 6. Otros tipos CSY4111

| Tipo | Que se hizo | Resultado |
|---|---|---|
| Codigo (unitaria / caja blanca) | Jest 27/09: 18/18 tests; App.test.tsx no carga (D-01). Proxy 5/5. | OK parcial |
| End to End | Celular Android: efectivo+historial; Webpay 19/09; QR+cancel+TBK parcial 03/10 | OK parcial |
| Regresion | Efectivo 19/09 y 27/09; TUU Kozen 13/10 (debito OK, credito cancel) | OK parcial (TUU) |
| Estatica (documentacion) | Ambiguedades RNF; timeout oficial 300 s | OK (4 hallazgos) |
| UAT | PO/Review formal no registrado | No ejecutado |
| Carga / Stress | Fuera de alcance Capstone | No aplica |
| TUU/Kozen (regresion HW) | Kozen P8 Neo 13/10: debito $2.000 *Pago exitoso*; credito $5.000 *Transaccion cancelada*. Falta credito aprobado y declined emisor. Jest 17/17 (11/10). | Parcial |


## 7. Prueba estatica - ambiguedades (1.3.2)

| Doc | Texto ambiguo | Sugerencia |
|---|---|---|
| 04-requerimientos.md RNF-01 | No existe redireccion Webpay < 10 s; el entregable la exige | Agregar RNF-01.5 formal (resuelto 09/10: RNF-01.5 en 04-requerimientos v2.1) |
| 04-requerimientos.md RF-04..08 | Casi todo marcado Implementado | Alinear con sprint backlog (DTE/NC/Hub en S3-S4) |
| 11-plan-pruebas v2.0 vs DOC-07 v1.0 | Dos versiones del plan | Declarar v1.0 como maestro de entrega |
| WEBPAY-QR-TRANSBANK-DEV.md | Timeout oficial 300 s | Valor oficial 300 s |
| ID TC-WP-03 | Evidencias 03/10 = Transbank; maestro = error conexion | Resuelto 11/10: capturas renombradas a TC-WP-01 / TC-WP-TBK; TC-WP-03 = error de conexion (DEF-NET) |


## 8. Ejecucion automatica de esta sesion

Re-ejecucion 27/09 noche: webpay-proxy npm test = 5 pass / 0 fail. Jest app: ver 01_Unitarias (18 tests PASS, suite App.test.tsx NOK).
