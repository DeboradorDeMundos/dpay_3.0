# Ecosistema DTemite y D-PAY

**Documento de contexto Capstone** — leer antes de Vision, Arquitectura o Backlog.

---

## 1. El problema de negocio (por qué existe D-PAY)

**DTemite** es una empresa chilena de software SaaS. Su producto principal es un **ERP web multi-tenant** (Slim PHP + PostgreSQL por cliente) para PYMES: facturación electrónica (DTE/SII), inventario, cobranza, contabilidad, remuneraciones y WMS. El comercio opera eso desde un computador (`nuevodtemite`, menú en `views/includes/Layout.twig`).

Ese ERP resuelve la **oficina**. **No resuelve el mostrador ni la calle.**

Un comercio que vende en local, feria o delivery necesita, en el mismo momento de la venta:

1. Armar el cobro (monto, producto, cliente).
2. Cobrar (efectivo o tarjeta).
3. Emitir el DTE al SII.
4. Entregar comprobante (PDF o ticket térmico).
5. Que esa venta quede en la misma base de datos del ERP.

DTemite decide **emprender un rubro nuevo**: el **punto de venta móvil**. Ese producto se llama **D-PAY**.

> D-PAY es un **DTemite compacto para celular** (y terminal POS): las capacidades de venta, cobro y emisión DTE del ecosistema DTemite, llevadas a un dispositivo en la mano del cajero, con integraciones de pago.

El Capstone **D-PAY 3.0** es el diseño y desarrollo de ese producto completo.

---

## 2. Qué es cada pieza

| Pieza | Qué es | Rol en el Capstone |
|---|---|---|
| **DTemite ERP** | Plataforma web SaaS: DTE, inventario, WMS, cobranza, contabilidad, remuneraciones, CRM | Empresa mandante e infraestructura cloud |
| **API DTemite** | Backend REST + Legacy PHP + PostgreSQL multi-tenant | Plataforma que D-PAY consume (login, catálogo, `tbl_dpay`, SII) |
| **D-PAY** | App móvil POS: vender + cobrar + emitir DTE | **Producto que el equipo crea y documenta** |

### Repositorios de trabajo

| Repositorio | Contenido | Cómo se usa en el Capstone |
|---|---|---|
| **`dpay_3.0`** | App D-PAY + documentación Scrum/técnica + fases Duoc | **Repositorio oficial del Capstone** |
| **`nuevodtemite`** | ERP web + API Slim PHP + SQL | Plataforma de la empresa; se documenta e integra, no se reescribe |
| **`dtemite`** | Copia operativa de la app en campo | Referencia de hardware Kozen / TUU; no es el repo académico |

```
┌──────────────────────────────────────────────────────────────────┐
│                         DTemite Ltda.                            │
│                                                                  │
│   ERP WEB (oficina)              D-PAY (nuevo rubro: POS móvil)  │
│   nuevodtemite                   dpay_3.0 / codigo               │
│   ┌─────────────────┐            ┌────────────────────────────┐  │
│   │ Facturación DTE │            │ Login multi-tenant         │  │
│   │ Inventario      │◄── API ───►│ Venta (calc / catálogo)    │  │
│   │ Clientes        │            │ Cobro efectivo / tarjeta   │  │
│   │ Folios / SII    │            │ Emisión DTE + TED          │  │
│   │ tbl_dpay        │            │ Historial + NC             │  │
│   │ Payment Hub     │            │ Impresión Bluetooth        │  │
│   │ D-POS web       │            │ Payment Hub (agente)       │  │
│   └─────────────────┘            └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Qué del ERP vive en el celular

D-PAY **no copia el ERP entero**. Replica en el teléfono lo que el cajero necesita en el momento de la venta y deja en la web lo que es de oficina.

| Capacidad | D-PAY (móvil) | ERP DTemite (web) |
|---|---|---|
| Login por empresa (RUT + usuario) | Sí + PIN patrón 3×3 + biometría | Sí |
| Contrato / anexo `dpay_pos` | Aceptación en primer uso | Inscripción corporate |
| Venta rápida (calculadora / catálogo / scanner / producto rápido) | Sí — flujo principal | Ventas de escritorio + D-POS |
| Cobro efectivo y tarjeta | Efectivo + TUU crédito (101) / débito (104) | Webpay de **mensualidades** DTemite; panel POS |
| Emisión DTE en venta | 0, 33, 34, 39, 41 + NC 61 | Todos los tipos + compras, guías, exportación |
| Historial / anulación | Mis ventas + NC / eliminar boleta | Libros SII, informes, conciliación |
| Impresión térmica Bluetooth + compartir | Sí (ticket, voucher, SMS/email) | Impresoras de oficina |
| Payment Hub (cobros remotos) | Agente en el POS | API + cola de intents |
| Abonos, liquidaciones, onboarding | No | Panel POS + `tbl_inscripcion_dpay` |
| Inventario, WMS, contabilidad, remuneraciones, CRM | No | Sí — quedan en el ERP |

El ERP es grande a propósito (Administradores, Emisión, Libros, Cobranza, Contabilidad, Inventario/WMS, Caja, Remuneraciones, CRM, Reportes, panel `/Pos` y `/DPos`). Llevar *todo* eso al celular no tiene sentido. D-PAY lleva **solo el momento de la venta**.

---

## 4. Flujos de punta a punta

### 4.1 Login y tenant

1. D-PAY envía RUT empresa, usuario y clave a `POST /api/login`.
2. El backend resuelve el tenant en `admin_dtemite.tbl_sistema` y abre la BD del cliente.
3. Devuelve un **token opaco** (`{sistema}_{hash}`), no JWT.
4. D-PAY guarda el token en MMKV y lo envía como `Authorization: bearer …` y `X-DPay-Token`.
5. Al primer login descarga CAFs, catálogo, clientes y, si falta, pide aceptar el anexo `dpay_pos`.

### 4.2 Venta + cobro + DTE

1. El cajero arma la venta (calculadora, catálogo o scanner).
2. Elige tipo de documento y cliente (o consumidor final).
3. Cobra en efectivo o con tarjeta vía TUU (terminal Kozen).
4. Si el tipo no es comprobante (0), D-PAY emite DTE al SII por la API legacy.
5. Registra la transacción en `tbl_dpay` (`POST /pos/transaccion`) y vincula el DTE.
6. Imprime ticket y/o genera PDF.

### 4.3 Payment Hub

1. Un integrador externo crea un intent en la API DTemite.
2. D-PAY hace poll por el serial del terminal.
3. El cajero cobra en el POS; el resultado vuelve al Hub y a `tbl_dpay`.

---

## 5. Backend DTemite — módulos que D-PAY usa

| Módulo | Archivos | Para qué lo usa D-PAY |
|---|---|---|
| Auth | `login.php`, `login.class.php` | Sesión multi-tenant |
| D-PAY mobile | `dpay.php`, `dpay.class.php` | Documentos, clientes, checkout |
| Transacciones POS | `pos.php`, `pos.class.php` | `tbl_dpay`, comisiones, anulaciones |
| Payment Hub | `paymenthub.php` | Intents remotos |
| DTE / folios | `documento.php`, `folios.php` | CAF, emisión SII |
| Corporate / inscripción | `inscripciondpay.php` | Onboarding de comercios (ERP) |
| Webpay corporativo | `webpay.php` | Mensualidades DTemite (no es cobro de la app) |

Schema: `nuevodtemite/sql/estructura-dpay.txt`, `paymenthub.sql`, `Estructura_BD.txt`.

---

## 6. Alcance Capstone vs plataforma empresa

| Ámbito | Qué hace el equipo Capstone |
|---|---|
| App D-PAY completa | **Diseño, desarrollo y documentación** (login → venta → cobro → DTE → historial → impresión → Hub) |
| Integración con API DTemite | Contrato documentado y consumido |
| ERP web (inventario, abonos, D-POS escritorio) | Contexto de empresa; no se reimplementa |
| Nuevas pasarelas (Webpay, Flow, etc.) | Mejora futura, no el objetivo del proyecto |

---

## 7. Entornos

| Entorno | API REST | Legacy PHP (DTE) | Uso |
|---|---|---|---|
| QA | `proqa.dtemite.cl/api` | `sistema.dtemite.cl` | Debug Metro (`__DEV__`) |
| Producción | `pro.dtemite.cl/api` | Idem | APK release |

---

## 8. Dónde buscar qué

| Necesito… | Dónde |
|---|---|
| Pantallas D-PAY | `dpay_3.0/codigo/src/screens/` |
| Cliente HTTP | `codigo/src/services/apiClient.ts` |
| Transacción POS | `nuevodtemite/controllers/pos.php` |
| Modelo `tbl_dpay` | `nuevodtemite/sql/estructura-dpay.txt` + [06-base-datos.md](./06-base-datos.md) |
| Documentación Scrum | `dpay_3.0/codigo/docs/` |
| Entregables Word Fase 1 | `fase1/grupales/` |

---

## 9. Referencias

- [01-vision.md](./01-vision.md) — Product Vision de D-PAY
- [05-arquitectura.md](./05-arquitectura.md) — Arquitectura del producto
- [06-base-datos.md](./06-base-datos.md) — Modelo de datos
- [codigo/README.md](../codigo/README.md) — Desarrollo de la app

**Revisión:** v2.0 — 9 septiembre 2026
