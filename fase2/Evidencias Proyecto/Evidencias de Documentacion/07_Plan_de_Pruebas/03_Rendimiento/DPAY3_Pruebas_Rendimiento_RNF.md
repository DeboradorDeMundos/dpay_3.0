# Pruebas de Rendimiento (RNF) - D-PAY 3.0

_Redireccion Webpay < 10 s y Login < 3 s_

- **Proyecto:** D-PAY 3.0 - POS movil multi-pasarela (DTemite)
- **Asignatura:** Capstone APT122 - Duoc UC 2026-2
- **Documento:** DOC-07 / 03_Rendimiento
- **Version:** 1.3
- **Fecha:** 2026-10-04
- **Autor:** Reinhartd Munzenmayer (QA)
- **Equipo:** Diego Madrid, Pablo Gutierrez, Reinhartd Munzenmayer
- **Estado:** Vigente (MTC-13 OK 04/10)
- **Repositorio:** https://github.com/DeboradorDeMundos/dpay_3.0

---

## 1. Objetivo

Medir los RNF de rendimiento: redireccion a Webpay (< 10 s) y login (< 3 s). Incluye laboratorio del 27/09/2026 y mediciones E2E en Celular Android (WiFi y 4G) informadas el mismo dia.


## 2. Metodo

- Laboratorio (PC): 5 muestras de create+checkout y probe API login proqa.
- Celular Android: cronometro por escenario (arranque, login primera vez, login con credenciales, catalogo) en WiFi y 4G.
- Una muestra por escenario (no son 5 repeticiones del mismo tap).
- Redireccion Webpay E2E (QR escaneado -> formulario Transbank) medida 04/10 en Celular Android.


## 3. Celular Android E2E (27/09/2026)

Dispositivo Celular Android. Fuente: cronometro del QA. Evidencia: 03_Rendimiento/metricas-celular-android-20260927.txt.

| Escenario | WiFi | 4G | Objetivo | Cumple |
|---|---|---|---|---|
| Levantar / iniciar aplicacion | 5.0 s | 2.0 s | N/A (fuera de RNF-01.1) | Informativo |
| Login primera vez | 1.5 s | 2.5 s | Login < 3 s (RNF-01.1) | SI |
| Login credenciales + biometria | 1.0 s | 1.5 s | Login < 3 s (RNF-01.1) | SI |
| Carga de catalogo | 1.0 s | 1.0 s | Catalogo < 5 s con 500 productos (RNF-01.3) | Parcial (volumen no verificado) |
| Redireccion Webpay (QR->checkout) | ~10 s | ~10 s | < 10 s (RNF-01.5) | En el borde (04/10; decision «< 10 s» o «≤ 10 s» abierta) |
| Emision DTE | - | - | < 15 s (RNF-01.4) | Pendiente |

> RNF-01.1 se evalua sobre el tiempo de login, no sobre el arranque en frio. El arranque WiFi (5 s) se registra pero no incumple el RNF de login. El caso mas exigente de login es 4G primera vez: 2.5 s < 3 s.


## 4. Resultados de laboratorio (27/09/2026)

Evidencia: 03_Rendimiento/metricas-laboratorio-20260927.txt y .json. Proxy sim 127.0.0.1:8787. API proqa.dtemite.cl (POST /login vacio, HTTP 400).

| Metrica (lab) | Objetivo E2E | M1 | M2 | M3 | M4 | M5 | Prom. | Max. | Cumple cota |
|---|---|---|---|---|---|---|---|---|---|
| Webpay create+checkout | < 10 s | 0.198 s | 0.013 s | 0.012 s | 0.011 s | 0.010 s | 0.049 s | 0.198 s | SI |
| API login (RTT, HTTP 400) | < 3 s | 0.234 s | 0.157 s | 0.155 s | 0.159 s | 0.151 s | 0.171 s | 0.234 s | SI |


## 5. Celular Android Webpay E2E (04/10/2026) - MTC-13

Dispositivo Celular Android + cliente Chrome misma WiFi LAN (proxy 192.168.1.7:8787). Cronometro QA: escaneo QR -> pantalla formulario webpay3gint.

| Muestra | Flujo | Tiempo | Evidencia |
|---|---|---|---|
| 1 | VISA aprobada $2.000 | ~10 s | metricas-celular-android-webpay-20261004.txt; TC-WP-TBK_01 (20:48) |
| 2 | MC rechazada $3.500 | ~10 s | TC-WP-04_11 (20:50); CLASIFICACION-2026-10-04.md |

> Valor en borde del RNF (< 10 s); aceptado como cumplimiento del entregable Capstone.


## 6. Pendiente

- Emision DTE < 15 s cuando el flujo boleta 39 este estable.
- Repetir MTC-13 en 4G/WWAN con tunel HTTPS (opcional).
