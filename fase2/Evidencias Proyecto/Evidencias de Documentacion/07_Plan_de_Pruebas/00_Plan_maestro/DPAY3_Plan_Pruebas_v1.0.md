# Plan Maestro de Pruebas - D-PAY 3.0

_Capstone APT122 - DTemite - POS movil multi-pasarela de pago_

- **Proyecto:** D-PAY 3.0 - POS movil multi-pasarela (DTemite)
- **Asignatura:** Capstone APT122 - Duoc UC 2026-2
- **Documento:** DOC-07 - Plan de Pruebas (maestro)
- **Version:** 1.2.1
- **Fecha:** 2026-10-14
- **Autor:** Reinhartd Munzenmayer (QA)
- **Equipo:** Diego Madrid, Pablo Gutierrez, Reinhartd Munzenmayer
- **Estado:** Vigente
- **Repositorio:** https://github.com/DeboradorDeMundos/dpay_3.0

---

## 1. Introduccion y objetivo

Este Plan Maestro de Pruebas define la estrategia, el alcance, los niveles de prueba, los casos minimos y los criterios de aceptacion para validar D-PAY 3.0 como POS movil completo de DTemite: el cajero entra, arma una venta, cobra (efectivo / TUU-Kozen / Webpay), emite DTE, revisa historial e imprime. Las pruebas cubren el producto, con foco en el diferenciador del Capstone: la seleccion automatica de pasarela de pago segun el dispositivo.

Es el documento maestro del entregable DOC-07. En el marco agil se complementa con una version de evidencias por sprint (carpeta 05_Evidencias_por_sprint) que se actualiza en cada Sprint Review.


## 2. Alcance


### 2.1 Dentro de alcance

- Pruebas unitarias (Jest) de la deteccion de dispositivo y la factory de pasarelas.
- Pruebas de integracion del proxy Webpay en sandbox (create -> commit -> status).
- Pruebas funcionales E2E del flujo de caja en Android (Celular Android).
- Regresion de efectivo + DTE y de TUU/Kozen (si hay hardware).
- Medicion de RNF de rendimiento (login, redireccion Webpay).
- Verificacion de seguridad: sin PAN/CVV en logs ni MMKV; secretos fuera de Git.


### 2.2 Fuera de alcance

- Reescritura del ERP web nuevodtemite (plataforma de la empresa).
- Cliente iOS nativo (RF-W03).
- Certificacion PCI del PAN (lo maneja TUU / Transbank, no la app).


## 3. Documentos de referencia

| Referencia | Ubicacion |
|---|---|
| Requerimientos RF/RNF v2.0 | codigo/docs/04-requerimientos.md |
| Historias de usuario HU-01..HU-14 | codigo/docs/03-historias-usuario.md |
| Plan de pruebas base v2.0 | codigo/docs/11-plan-pruebas-evidencias.md |
| Matriz de trazabilidad de evidencias | Evidencias_dpay/00-indice/MATRIZ-TRAZABILIDAD.md |
| Proxy Webpay (COD-04) | webpay-proxy/README.md |
| Carta Gantt v2.0 | codigo/docs/08-carta-gantt.md |


## 4. Estrategia de pruebas

| Nivel | Alcance | Herramienta | Cuando |
|---|---|---|---|
| Unitaria | Deteccion de dispositivo, factory, mapeo Webpay, intentos de tarjeta | Jest / node:test | Cada PR |
| Integracion | Proxy Webpay sandbox (create/commit/status), login, DTE | node:test + Postman | Continuo |
| Funcional E2E | Flujo de caja en Android | Celular Android (manual) | Cada sprint |
| Regresion | Efectivo + DTE; TUU/Kozen si hay hardware | Dispositivo fisico | Cada Review |
| Rendimiento | Login, redireccion Webpay, catalogo, DTE | Cronometro / logs | S10 y S15 |
| Seguridad | PAN/CVV, secretos, HTTPS, MMKV | Checklist + git | Sprints 2, 3 y 5 |


## 5. Entorno y herramientas

| Componente | Detalle |
|---|---|
| Dispositivo QA | Celular Android (version de Android por confirmar; perfil GENERIC_MOBILE) - APK v2.7.0 code 18. Sufijo de evidencia: CelularAndroid |
| Terminal TUU | Kozen P8 Neo (armeabi-v7a) - linea base D-PAY 2.0 en produccion, operada por Diego Madrid; evidencia manual 13/10/2026 (TC-RG-01 / TC-064 Parcial) |
| Backend pagos | webpay-proxy (Node) PROVIDER=sim, SQLite local, puerto 8787 |
| Pruebas unitarias app | Jest (codigo/__tests__) |
| Pruebas proxy | node --test (webpay-proxy/src/*.test.js) |
| Integracion API | Postman (codigo/docs/postman) |
| Ambiente API | QA proqa.dtemite.cl / produccion segun RNF-09.2 |


## 6. Matriz de casos de prueba

Casos minimos exigidos para el entregable, mas los casos de producto asociados. Leyenda de estado: OK (ejecutado y aprobado), Parcial, Pendiente, Bloqueado.

| ID | HU / RF | Escenario | Tipo | Prioridad | Estado |
|---|---|---|---|---|---|
| TC-WP-01 | HU-06 ext / COD-04 | Webpay sandbox aprobado -> comprobante | Funcional/Integr. | Alta | OK |
| TC-WP-QR | HU-03 / COD-04 | Modal QR in-app (monto, timer, cancelar) | Funcional | Alta | OK |
| TC-WP-05 | HU-03 / COD-04 | Webpay cancelado en app (QR) | Flujo alterno | Alta | OK |
| TC-WP-TBK | HU-03 / COD-04 | QR LAN -> Transbank integracion (form+banco) -> comprobante Celular Android | Integracion | Alta | OK (04/10) |
| TC-WP-02 / TC-WP-04 | HU-03 / COD-04 | Webpay rechazado (declined) en app | Flujo alterno | Alta | OK (04/10) |
| TC-WP-TIMEOUT | HU-03 / COD-04 | Timeout checkout QR | Error | Media | Parcial (ver nota timeout) |
| DEF-NET / TC-WP-err | HU-03 / RNF-03.2 | Proxy caido: Procesando... o solo efectivo | Error | Alta | Parcial (FAIL documentado 03/10; mitigado en codigo; re-test pendiente) |
| TC-AS-01 | HU-04/06 / COD-02 | Auto-seleccion si hay una sola pasarela | Funcional | Alta | OK (unit) |
| TC-DEV-04 | HU-01 / COD-01 | Ruta legacy TUU en celular generico: modal 'App Tuu no encontrada' (sin crash) | Regresion | Media | OK (S1, 19/09; ver 14.2) |
| TC-RG-01 | HU-06 / COD-01 / RNF-01.2, RNF-05.2 | Regresion TUU/Kozen credito y debito | Regresion | Alta | Parcial 13/10: debito aprobado $2.000 + credito cancelado $5.000; unit hu06Tuu PASS 11/10 |
| TC-EF-01 / TC-RNF03 | HU-05 / RNF-03.1 | Solo efectivo (pasarela no disponible) + comprobante + PDF + historial | Funcional | Alta | OK |
| TC-01 | HU-01 / RF-01 | Login valido QA carga catalogo/CAF | Funcional | Alta | Parcial (login + catalogo OK = MTC-01; carga CAF sin evidencia propia) |
| TC-02 | HU-01 / RF-01 | Clave incorrecta -> error en espanol | Error | Alta | OK (04/10) |
| TC-03 | HU-05/07 | Efectivo + boleta 39 -> DTE + tbl_dpay | Funcional | Alta | Parcial |
| TC-08 | HU-08 | Historial: filtro fecha; venta local $100.000 visible (folio 0) | Funcional | Alta | OK |
| TC-09 | HU-09 | NC 61 anulacion total post-boleta | Funcional | Alta | Pendiente |
| TC-13 | RNF-02.5 | Secretos no versionados en Git | Seguridad | Alta | OK |
| TC-14 | RNF-01.1 | Login < 3 s | Rendimiento | Media | OK (Celular Android) |
| TC-WP-PERF / MTC-13 | RNF-01.5 | Redireccion Webpay < 10 s | Rendimiento | Media | Ejecutado 04/10: ~10 s (en el borde; ver nota) |

> RNF-01.5 (apertura checkout Webpay) ya es ID canonico del catalogo RNF v1.0 (09/10, IDs del DoD). La medicion del 04/10 da ~10 s con cronometro manual: DOC-07 la registro como cumplida, pero el catalogo RNF la deja «Parcial». Falta decidir el criterio («< 10 s» estricto o «≤ 10 s»; decision abierta) y, si es estricto, repetir con cronometraje preciso.

> Nota timeout: valor oficial = 300 s (WEBPAY_CHECKOUT_TIMEOUT_SEC = 5 * 60). La captura TC-WP-TIMEOUT_dialogo-300s_20500_20261003_CelularAndroid.jpg coincide con el codigo. DEF-DOC-01 cerrado el 12/10. Todos los tiempos de este plan se expresan en s.


## 7. Casos de prueba detallados (ISO/IEC/IEEE 29119-3)


### TC-WP-01 - Webpay aprobado

| Campo | Valor |
|---|---|
| ID | TC-WP-01 |
| HU / RF | HU-06 (ext. Webpay) / COD-04 |
| Titulo | Cobro Webpay sandbox aprobado genera comprobante |
| Prioridad | Alta |
| Tipo | Funcional / Integracion |
| Precondicion | Celular Android GENERIC_MOBILE; proxy sim arriba (8787); PC y Celular Android en la misma WiFi; venta armada |
| Datos de prueba | Monto $7.000, credito, simulate=approved (sandbox, sin PAN real) |
| Pasos | 1. Armar venta. 2. Metodo tarjeta. 3. Se auto-selecciona Webpay. 4. Checkout sandbox. 5. Aprobar. 6. Volver por deep link. |
| Resultado esperado | status=approved; se reciben auth_code y last4; comprobante emitido; sin PAN en logs |
| Postcondicion | Intento guardado en historial de tarjeta; venta lista para DTE/registro |
| Evidencia | TC-WP-01_OK_comprobante-credito-7000_20260919_CelularAndroid.jpg |
| Estado | OK (19/09/2026) |


### TC-WP-02 - Webpay rechazado

| Campo | Valor |
|---|---|
| ID | TC-WP-02 |
| HU / RF | HU-06 (ext. Webpay) / COD-04 |
| Titulo | Webpay rechazado informa error y no emite comprobante |
| Prioridad | Alta |
| Tipo | Flujo alterno |
| Precondicion | Celular Android GENERIC_MOBILE; proxy sim arriba; venta armada |
| Datos de prueba | simulate=declined / tarjeta de rechazo sandbox |
| Pasos | 1..3 igual TC-WP-01. 4. Forzar rechazo. 5. Volver a la app. |
| Resultado esperado | status=declined; mensaje claro en espanol; sin DTE SII; intento guardado (cardPaymentAttempts) |
| Postcondicion | La venta permanece disponible para reintento o cambio de medio |
| Evidencia | 04/10 Celular Android + cliente Chrome, MC integracion 5186 (Transbank Developers): TC-WP-04_06_simulador-rechazar_2000_20261004_cliente.jpg, TC-WP-04_07_DECLINED_webpay-final_2000_20261004_cliente.jpg, TC-WP-04_DECLINED_dialogo-cobro-cancelado_2000_20261004_CelularAndroid.jpg, TC-WP-04_DECLINED_pago-no-completado_3500_20261004_CelularAndroid.jpg (CLASIFICACION-CAPTURAS-2026-10-04.md) |
| Estado | OK (04/10/2026). Pendiente menor: no hay captura de cardPaymentAttempts (intento guardado) |


### TC-WP-03 - Webpay error de conexion

| Campo | Valor |
|---|---|
| ID | TC-WP-03 |
| HU / RF | HU-06 (ext. Webpay) / COD-04 / RNF-03 |
| Titulo | Sin conexion al proxy, Webpay no se ofrece y la venta no se pierde |
| Prioridad | Alta |
| Tipo | Error |
| Precondicion | Proxy detenido o Celular Android sin red LAN |
| Datos de prueba | N/A |
| Pasos | 1. Detener proxy. 2. Armar venta. 3. Intentar cobro tarjeta. |
| Resultado esperado | isAvailable()=false: no se ofrece Webpay o se muestra 'no se pudo conectar'; la venta queda en MMKV para reintento |
| Postcondicion | Sin transacciones colgadas; reintento al recuperar red |
| Evidencia | DEF-NET-01/03 (03/10): solo Efectivo o Procesando eterno $13.500; mitigado LAN+NetInfo+timeout 8 s. Las capturas que antes usaban el prefijo TC-WP-03 se renombraron el 11/10 a TC-WP-01 (19/09) y TC-WP-TBK (03/10). |
| Estado | Parcial: el comportamiento de error quedo documentado como FAIL (DEF-NET-01/03, 03/10) y se mitigo en codigo, pero no hay re-test PASS sin USB. Complemento: timeout manejado (TC-WP-TIMEOUT_dialogo-300s_*) y unit WebpayPaymentGateway.test.ts (isAvailable por /health) |


### TC-AS-01 - Auto-seleccion de pasarela unica

| Campo | Valor |
|---|---|
| ID | TC-AS-01 |
| HU / RF | HU-04/06 / COD-02 (PaymentGatewayFactory) |
| Titulo | Con una sola pasarela disponible el POS la selecciona sin preguntar |
| Prioridad | Alta |
| Tipo | Funcional (tabla de decision) |
| Precondicion | Perfil con una unica pasarela: TUU_KOZEN -> [tuu]; o GENERIC_MOBILE con solo webpay disponible |
| Datos de prueba | Combinaciones perfil x pasarelas disponibles |
| Pasos | 1. Detectar perfil. 2. getDefaultCardGateway. 3. Observar UI. |
| Resultado esperado | Se retorna la unica pasarela disponible; no se muestra selector; si no hay ninguna, retorna null (solo efectivo) |
| Postcondicion | Cobro por la pasarela unica |
| Evidencia | Jest: PaymentGatewayFactory.test.ts y devicePaymentProfile.test.ts (verdes) |
| Estado | OK (unit) |


### TC-RG-01 - Regresion TUU / Kozen

| Campo | Valor |
|---|---|
| ID | TC-RG-01 |
| HU / RF | HU-06 / RF-03 / COD-01 |
| Titulo | En Kozen se detecta TUU y se cobra credito/debito |
| Prioridad | Alta |
| Tipo | Regresion |
| Precondicion | Terminal Kozen P8 Neo con app TUU instalada |
| Datos de prueba | Credito y debito de prueba TUU |
| Pasos | 1. Detectar perfil TUU_KOZEN. 2. Cobrar credito. 3. Cobrar debito. |
| Resultado esperado | id_mediopago 101 (credito) / 104 (debito); authCode y last4 capturados; fallos con detalle_error |
| Postcondicion | Transaccion registrada en tbl_dpay |
| Evidencia | Manual 13/10/2026 Kozen P8 Neo: TC-RG-01c_OK_pago-exitoso-debito_2000_20261013_KozenP8Neo.jpg; TC-RG-01e_OK_transaccion-cancelada_5000_20261013_KozenP8Neo.jpg; indice CLASIFICACION-CAPTURAS-2026-10-13.md. Automatica 11/10/2026 (commit 405b8db): hu06Tuu.test.ts CA-06.1 a CA-06.5 PASS + factory + deteccion. Salida: 01_Unitarias/jest-hu06Tuu-factory-deteccion-output-20261011.txt |
| Estado | Parcial (14/10/2026): debito aprobado y cancelacion de credito evidenciados; falta credito aprobado y rechazo emisor. No es fallo de regresion del Intent TUU. RNF-01.2 / RNF-05.2 siguen Must |


### TC-EF-01 / TC-RNF03 - Solo efectivo (pasarela no disponible)

| Campo | Valor |
|---|---|
| ID | TC-EF-01 / TC-RNF03 |
| HU / RF | HU-05 / RF-03.1 / RNF-03.1 |
| Titulo | Venta en efectivo cuando no hay pasarela de tarjeta |
| Prioridad | Alta |
| Tipo | Funcional / Disponibilidad |
| Precondicion | Celular Android con sesion; pasarela de tarjeta no disponible (sin credito/debito en UI) |
| Datos de prueba | Venta efectivo $100.000, comprobante electronico exento |
| Pasos | 1. Armar venta. 2. Metodos de pago muestra solo Efectivo. 3. Seleccionar Efectivo. 4. Confirmar. 5. Ver comprobante y PDF local. |
| Resultado esperado | No se ofrecen credito ni debito; venta cierra en efectivo; comprobante tipo 0 (exento) y PDF local; sin DTE SII; sin PAN/CVV |
| Postcondicion | Comprobante y PDF locales; venta en MIS VENTAS (folio 0, Pago recibido) |
| Evidencia | TC-RNF03_01..06 (27/09/2026 Celular Android). Ver CLASIFICACION-CAPTURAS-2026-09-27.md |
| Estado | OK (27/09/2026) |

> Historial: TC-RNF03_05 muestra la venta con filtro 27-09-2026. TC-RNF03_06 muestra Network request failed / 'No se pudieron cargar los documentos DPay' y la venta local sigue visible (folio 0 = no llego al servidor). Eso cierra el flujo solo efectivo sin red de API. Complemento login: TC-01_login-error-conexion_20260909_CelularAndroid.jpg.


### TC-08 - Historial de la venta efectivo

| Campo | Valor |
|---|---|
| ID | TC-08 |
| HU / RF | HU-08 / RF-05.1-05.2 |
| Titulo | La venta efectivo aparece en MIS VENTAS (filtro fecha); sin red permanece local |
| Prioridad | Alta |
| Tipo | Funcional / Disponibilidad |
| Precondicion | Venta TC-RNF03 cerrada el 27/09 ($100.000, efectivo, comprobante) |
| Datos de prueba | Filtro Fecha desde/hasta = 27-09-2026 |
| Pasos | 1. Abrir MIS VENTAS. 2. Filtrar 27-09-2026. 3. Observar listado. 4. Provocar fallo de red al cargar documentos DPay. |
| Resultado esperado | Aparece Folio 0, Pago recibido, $100.000, Efectivo, 13:37. Si la API falla, modal Network request failed y la venta local sigue visible. |
| Postcondicion | Historial local coherente con el comprobante |
| Evidencia | TC-RNF03_05 y TC-RNF03_06 (27/09/2026) |
| Estado | OK (27/09/2026) |


## 8. Pruebas unitarias (Jest)

Cobertura minima exigida: factory de pasarelas y deteccion de dispositivo. Suites reales del repo (codigo/__tests__ y webpay-proxy/src):

| Suite | Que valida | Resultado |
|---|---|---|
| devicePaymentProfile.test.ts | Kozen+TUU -> TUU_KOZEN; Celular Android sin TUU -> GENERIC_MOBILE (webpay,mock) | PASS |
| PaymentGatewayFactory.test.ts | prioridad webpay>mock; fallback; null sin pasarelas; keepUserSelection | PASS |
| WebpayPaymentGateway.test.ts | isAvailable por /health; create approved devuelve auth_code/last4 | PASS |
| webpayProxyConfig.test.ts | URL proxy segun runtime (emulador 10.0.2.2 / fisico 127.0.0.1) | PASS |
| MockPaymentGateway.test.ts | escenarios approved / declined / timeout | PASS |
| cardPaymentAttempts.test.ts | historial de intentos recorta y ordena | PASS |
| hu06Tuu.test.ts | HU-06 TUU: CA-06.1..06.5 (Intent, 101/104, authCode/last4, detalle_error, generico sin TUU) | PASS (11/10) |
| App.test.tsx | arranque de la app | FALLA (SyntaxError 'export' en @react-navigation; re-verificado 11/10) - ver defecto D-01 |

Resultado agregado (npx jest --ci, 27/09/2026): Test Suites 6 passed / 1 failed / 7 total; Tests 18 passed / 18 total. Esa corrida no incluia hu06Tuu.test.ts. Proxy (node --test): 5 passed / 5 total. Evidencia: 01_Unitarias/jest-codigo-output.txt y jest-proxy-output.txt.

Re-ejecucion focalizada 11/10/2026 (rama feature/HU-03-webpay-red-qr, commit 405b8db): hu06Tuu + PaymentGatewayFactory + devicePaymentProfile = 3/3 suites, 17/17 tests PASS. Evidencia: 01_Unitarias/jest-hu06Tuu-factory-deteccion-output-20261011.txt.


## 9. Pruebas de integracion - Webpay sandbox

El proxy implementa el contrato que consume WebpayPaymentGateway. Flujo init -> commit -> estado de venta:

| Paso | Endpoint | Verificacion |
|---|---|---|
| Init | POST /payments/webpay/create | 201; payment_id; buy_order <=26 chars; idempotencia por idempotency_key (reuse=true) |
| Commit | POST /payments/webpay/:id/commit | AUTHORIZED -> approved con auth_code y last4; FAILED -> declined; nunca guarda PAN |
| Estado | GET /payments/webpay/:id/status | status=approved y amount correctos |

Prueba automatica 'create + simulate approved + status' PASS (node:test). Ademas se valida la clasificacion del retorno (commit / cancel / timeout / error_form). Evidencia: COD-04-HU03-webpay/logs/ y 01_Unitarias/jest-proxy-output.txt.


## 10. Rendimiento (RNF)

| Metrica | Objetivo | Metodo | Estado |
|---|---|---|---|
| Redireccion Webpay | < 10 s (RNF-01.5) | Lab 0.05 s prom.; E2E Celular Android ~10 s (2 muestras, 04/10) | Ejecutado en el borde (decidir criterio; catalogo RNF: Parcial) |
| Login | < 3 s (RNF-01.1) | Celular Android: 1.5 s WiFi / 2.5 s 4G (primera vez) | OK |
| Carga catalogo | < 5 s con 500 productos (RNF-01.3) | Celular Android: 1 s WiFi y 4G | Parcial (tiempo OK; volumen de 500 productos no verificado) |
| Emision DTE | < 15 s (RNF-01.4) | Confirmar -> folio | Pendiente medir |

Las mediciones se registran en 03_Rendimiento/ y en el informe de avance S10.


## 11. Seguridad

| Check | Criterio | Metodo | Estado |
|---|---|---|---|
| SEC-01 | No PAN/CVV en logs ni MMKV (RNF-02.4) | Revision de codigo + proxy no guarda card_number | OK |
| SEC-02 | Token en MMKV (RNF-02.1) | authStore | OK |
| SEC-03 | API solo HTTPS TLS1.2+ (RNF-02.3) | Revision apiClient.ts | OK |
| SEC-04 | .env y keystore fuera de Git (RNF-02.5) | git ls-files / .gitignore | OK |

Verificacion 27/09/2026: git ls-files solo lista *.example y debug.keystore (no de firma); .env, .env.trello y webpay-proxy/.env estan git-ignored. El proxy mapea solo last4, nunca el PAN (test 'commit AUTHORIZED ... no el PAN'). Detalle en 04_Seguridad/.


## 12. Gestion de defectos

| Severidad | Definicion | SLA |
|---|---|---|
| Critico | No se puede vender o se pierde el DTE | Antes de cerrar el sprint |
| Alto | TUU o emision fallan en caso feliz | <= 3 dias |
| Medio | UI / mensaje / suite de prueba | Siguiente sprint |
| Bajo | Cosmetico | Backlog |


## 13. Criterios de entrada y salida (DoD de pruebas)

- Entrada: HU con criterios de aceptacion definidos y build instalable en Celular Android.
- Salida: 100% de casos Alta ejecutados (TUU/Kozen TC-RG-01 en Parcial: debito aprobado + credito cancelado 13/10; falta credito aprobado).
- Salida: 0 defectos criticos abiertos.
- Salida: evidencias (capturas/logs/video) archivadas antes de S10.
- Salida: flujo efectivo + boleta grabado en video (<= 600 s).


## 14. Evidencias y trazabilidad

Nomenclatura de capturas: TC-<COD>-<NN>_<resultado>_<fecha>_<dispositivo>.ext (ej. TC-WP-01_OK_comprobante-credito-7000_20260919_CelularAndroid.jpg). Un ID por escenario; casos negativos que pasan llevan _OK_; sufijo de POS unico CelularAndroid (cliente = segundo celular). Renombres del 11/10: Evidencias_dpay/00-indice/RENOMBRES-EVIDENCIA-2026-10-11.md. Estructura:

- Evidencias locales (no Git): C:\Users\NEKODev\Documents\CAPSTONE\Evidencias_dpay
- Evidencias por sprint (entregable): 07_Plan_de_Pruebas/05_Evidencias_por_sprint/Sprint_0X/
- Matriz de trazabilidad HU/RF -> TC -> evidencia -> defecto: Evidencias_dpay/00-indice/MATRIZ-TRAZABILIDAD.md


### 14.1 Matriz de cierre HU-06 (corte 14/10/2026)

Los IDs TC-061..064 de la guia HU-06 se mapean a los IDs del plan; no se renombran capturas ya archivadas.

| HU-06 | Escenario | RNF / HU | IDs del plan | Resultado | Evidencia | Defecto |
|---|---|---|---|---|---|---|
| TC-061 | Pago aprobado Webpay sandbox | HU-03 / RNF-02.4 | TC-WP-01, TC-WP-TBK, MTC-04 | PASS (19/09 y 04/10) | TC-WP-01_OK_comprobante-credito-7000_20260919_CelularAndroid.jpg, TC-WP-01_OK_comprobante-debito-1200000_20260919_CelularAndroid.jpg, TC-WP-TBK_OK_comprobante-debito_2000_20261004_CelularAndroid.jpg | - |
| TC-062 | Pago rechazado Webpay sandbox | HU-03 / RNF-03.2 | TC-WP-02 / TC-WP-04, MTC-09 | PASS (04/10) | TC-WP-04_07_DECLINED_webpay-final_2000_20261004_cliente.jpg, TC-WP-04_DECLINED_pago-no-completado_3500_20261004_CelularAndroid.jpg | - |
| TC-063 | Error de conexion / timeout | HU-03 / RNF-03.2, RNF-04.1 | TC-WP-03 (plan), DEF-NET, TC-WP-TIMEOUT | Parcial: falla documentada y mitigada; falta re-test PASS sin USB | capturas/defectos/TC-WP-DEF-NET-01_*, TC-WP-DEF-NET-03_* (FAIL 03/10); TC-WP-TIMEOUT_dialogo-300s_20500_20261003_CelularAndroid.jpg | DEF-NET-01/03 (mitigados); DEF-DOC-01 cerrado (timeout oficial 300 s) |
| TC-064 | Regresion TUU/Kozen | HU-01, HU-02 / RNF-01.2, RNF-05.2 | TC-RG-01 | Parcial 13/10: debito aprobado $2.000 + credito $5.000 cancelado (no declined emisor); unit PASS 11/10 | COD-08-HU06-tuu-kozen/capturas/TC-RG-01*; CLASIFICACION-CAPTURAS-2026-10-13.md; 01_Unitarias/jest-hu06Tuu-factory-deteccion-output-20261011.txt | - |

Checklist HU-06 (dpay-acceptance-criteria): aprobado [x], rechazado [x], error de conexion [ ] (parcial), regresion TUU [ ] (parcial: debito OK + cancel credito; falta credito aprobado), defectos en formato estandar [x], matriz RF->HU->TC completa [ ] (faltan TC-03/TC-09/RNF-01.4 de DTE).


### 14.2 Evidencia archivada sin caso propio en el plan (mapeo 11/10/2026)

| ID en evidencia | Que muestra | Decision | Caso del plan | Evidencia |
|---|---|---|---|---|
| TC-DEV-01 | POS vacio con sesion iniciada en celular generico | Mapear (paso de arranque) | TC-AS-01 / HU-01 deteccion (precondicion de TC-WP-01) | COD-00-inventario/capturas/TC-DEV-01_POS-inicio_20260919_CelularAndroid.jpg |
| TC-DEV-04 | Modal 'App Tuu no encontrada' al elegir debito en celular generico (09/09 antes del fix de perfil; 19/09 ruta legacy post-fix) | Agregar al plan como caso de regresion de deteccion | TC-DEV-04 (HU-01 / CA-06.5: generico no recibe TUU) | COD-01-HU01-deteccion/capturas/TC-DEV-04_*_debito-seleccionado_* y *_debito-sin-seleccion_* (09/09 y 19/09) |
| TC-TBK-AUTH | Simulador banco Transbank: RUT/clave vacios o incorrectos | Mapear (observacion informativa, error de usuario en el simulador, no defecto D-PAY) | TC-WP-TBK / TC-WP-04 (pasos banco-*) | TC-WP-TBK_OK_banco-*_20261003_cliente.jpg; TC-WP-04_03..05_banco-*_20261004_cliente.jpg |
| TC-WP-HTTP | Aviso Chrome 'not secure' al enviar el POST HTTP al proxy LAN | Mapear (comportamiento esperado en QA LAN; en WWAN/tunel debe ser HTTPS) | TC-WP-TBK / TC-WP-04 (paso chrome-http-warn); RNF de seguridad del tunel en S3 | TC-WP-TBK_OK_chrome-http-warn_*_20261003_cliente.jpg; TC-WP-04_08/13_chrome-http-warn_*_20261004_cliente.jpg |
| TC-01_login-pattern | Login con usuario kiltro por patron/huella | Mapear como variante de TC-01 | TC-01 (login valido) | COD-00-inventario/capturas/TC-01_login-pattern-kiltro_20260909_CelularAndroid.jpg |


## 15. Cronograma de pruebas por sprint

| Sprint | Semanas | Foco de pruebas |
|---|---|---|
| S1 | 5-6 | Unitarias factory/deteccion; Webpay sandbox aprobado; efectivo |
| S2 | 7-8 | Efectivo+historial (27/09); QR+cancel (03/10); Transbank parcial; rechazo pasa a S3 |
| S3 | 9-10 | TC-WP-04 declined (S2); TC-064 Kozen Parcial 13/10; DTE/historial folio; informe S10 |
| S4 | 11-12 | Impresion, Hub, settings; regresion |
| S5 | 13-15 | Matriz TC completa; seguridad; APK; video |
| S6-S7 | 16-18 | Regresion final y defensa |


## 16. Riesgos y supuestos

- Riesgo: TC-RG-01 / TC-064 sigue Parcial (falta credito aprobado y rechazo emisor en Kozen). Mitigacion: debito aprobado + cancelacion credito 13/10 + Jest 17/17; recaptura pendiente.
- Riesgo: dependencia del backend para sync tbl_dpay/id_mediopago en Webpay.
- Supuesto: DTemite mantiene QA (proqa.dtemite.cl) y credenciales de prueba.
- Supuesto: el PO valida prioridades en cada Sprint Review.


## 17. Control de versiones

| Version | Fecha | Autor | Cambios |
|---|---|---|---|
| 1.0 | 2026-09-27 | Reinhartd Munzenmayer | Version inicial del plan maestro (DOC-07) |
| 1.1 | 2026-10-04 | Reinhartd Munzenmayer | QR in-app, TC-WP-05 app, TC-WP-TBK parcial, DEF-NET, timeout 120 s |
| 1.2 | 2026-10-11 | Reinhartd Munzenmayer | Estados segun evidencia 04/10 (TC-WP-TBK, TC-WP-04, TC-02 OK); TC-WP-03/DEF-NET pasa a Parcial; TC-RG-01 con hu06Tuu 11/10 y linea base D-PAY 2.0; nota timeout 300 s en main; matriz HU-06 (14.1); RNF-01.5 canonico; nombres de evidencia normalizados y mapeo TC-DEV-01/04, TC-TBK-AUTH, TC-WP-HTTP, TC-01_login-pattern (14.2) |
| 1.2.1 | 2026-10-14 | Reinhartd Munzenmayer | TC-RG-01 / TC-064 pasa de Bloqueado a Parcial: Kozen P8 Neo 13/10 (debito $2.000 aprobado + credito $5.000 cancelado). Indice CLASIFICACION-CAPTURAS-2026-10-13.md. |
