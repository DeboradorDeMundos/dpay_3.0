# Product Vision — D-PAY 3.0

**POS móvil de DTemite: vender, cobrar y emitir DTE desde el celular**

---

| Campo | Valor |
|---|---|
| **Institución** | Duoc UC — Escuela de Informática y Telecomunicaciones |
| **Asignatura** | DSY1102 / PTY4614-001V — Capstone (Sección 001) |
| **Empresa mandante** | DTemite |
| **Contacto empresa** | José Robles Rocha |
| **Equipo** | Diego Madrid, Pablo Gutiérrez, Reinhartd Munzenmayer |
| **Product Owner** | José Robles Rocha (DTemite) |
| **Scrum Master** | Pablo Gutiérrez |
| **Docente guía** | Fabián Alcántara Guajardo |
| **Metodología** | Scrum |
| **Repositorio** | github.com/DeboradorDeMundos/dpay_3.0 |
| **Duración Capstone** | 18 semanas — Semestre 2026-2 |
| **Revisión** | v2.0 — 9 septiembre 2026 |

---

## 1. Resumen ejecutivo

**DTemite** es una empresa SaaS de facturación electrónica. Su ERP web permite a comercios chilenos emitir DTE al SII, administrar clientes, productos y folios desde un computador. Ese producto cubre la **oficina**.

DTemite quiere **emprender un rubro nuevo**: el punto de venta en terreno. El comercio no puede llevar el ERP al mostrador, a la feria ni al delivery. Necesita un sistema en el celular que, en un solo flujo, venda, cobre y deje el documento tributario emitido.

Ese producto es **D-PAY**: un **DTemite compacto para celular** (y terminal POS). El equipo Capstone **diseña y desarrolla D-PAY completo** — no un módulo aislado — integrado a la plataforma cloud de la empresa (API multi-tenant, emisión SII, registro de transacciones).

El criterio de “situación real” del Capstone se cumple: empresa mandante, normativa SII, pagos reales (TUU) y un problema de negocio genuino (abrir un canal móvil para un ERP que hoy vive en escritorio).

Contexto del ecosistema: [00-ecosistema-dtemite.md](./00-ecosistema-dtemite.md).

---

## 2. Problema u oportunidad

### Situación de la empresa

DTemite opera un ERP web (`nuevodtemite`) con:

- Emisión de DTE al SII (boletas, facturas, notas de crédito).
- Catálogo, clientes, folios CAF, multi-tenant PostgreSQL.
- Módulos de conciliación, abonos y un D-POS web secundario.

El comercio usuario de DTemite **ya factura en oficina**. Lo que no tiene es un POS de bolsillo alineado a esa misma base de datos.

### El hueco de mercado

| Hoy (solo ERP web) | Lo que el comercio necesita en el momento de vender |
|---|---|
| Computador + navegador | Celular o terminal en la mano |
| Emisión DTE de escritorio | Boleta/factura en segundos, frente al cliente |
| Cobros por otros canales o fuera de sistema | Efectivo y tarjeta en el mismo flujo |
| Reportes al final del día | Historial e impresión inmediata |

Sin un producto móvil, DTemite:

- Queda fuera del rubro POS (competidores: Transbank, Haulmer, SumUp, apps de boleta).
- Obliga al comercio a usar **dos herramientas** (caja + facturador).
- Pierde el registro unificado de la venta (pago + DTE + tenant).

### Oportunidad

Crear **D-PAY** como línea de producto nueva:

1. **Venta** — calculadora, catálogo, scanner, cliente, tipo de documento.
2. **Cobro** — efectivo y tarjeta (TUU en terminal Kozen).
3. **DTE** — emisión conforme SII, firma TED, PDF.
4. **Post-venta** — historial, notas de crédito, impresión Bluetooth.
5. **Integración** — misma API y `tbl_dpay` del ERP; Payment Hub para cobros remotos.

D-PAY no reemplaza el ERP. Lo **extiende al punto de venta**.

---

## 3. Objetivos

### Objetivo general

Diseñar y desarrollar **D-PAY**, el POS móvil de DTemite: una aplicación que permita a un comercio autenticado vender, cobrar y emitir DTE desde un dispositivo Android, integrada a la plataforma cloud de la empresa.

### Objetivos específicos

| # | Objetivo | Entregable verificable |
|---|---|---|
| OE-01 | Autenticar al comercio contra la API multi-tenant y persistir sesión segura | Login RUT + usuario + clave; token bearer en MMKV; PIN/biometría |
| OE-02 | Permitir armar una venta (calculadora, catálogo, scanner, cliente, tipo DTE) | Flujo `SaleScreen` → documento → cliente |
| OE-03 | Cobrar en efectivo y con tarjeta (TUU) y registrar en `tbl_dpay` | `POST /pos/transaccion` con medio de pago |
| OE-04 | Emitir DTE al SII (33, 34, 39, 41, comprobante 0, NC 61) | API legacy + CAF/TED + vínculo a la transacción |
| OE-05 | Consultar historial, anular y emitir notas de crédito | `MySalesScreen`, `CreditNoteScreen` |
| OE-06 | Imprimir ticket térmico Bluetooth (documento / voucher / TED) | ESC/POS + configuración de impresión |
| OE-07 | Recibir cobros remotos vía Payment Hub | Agente de polling + cobro local |
| OE-08 | Documentar producto, arquitectura, RF/RNF y pruebas del Capstone | Carpeta `docs/` + entregables Fase 1–3 |

---

## 4. Usuarios y stakeholders

### Personas

| Persona | Descripción | Necesidad principal |
|---|---|---|
| **Comerciante / cajero** | Dueño o vendedor con celular o terminal POS | Cerrar la venta y emitir DTE sin un PC |
| **Cliente final** | Comprador en el local o delivery | Pagar y recibir boleta/factura |
| **Administrador DTemite** | Opera el ERP y los comercios | Ver las ventas móviles en la misma BD |
| **Integrador externo** | Sistema que envía cobros al POS (ej. clínica, ERP vertical) | Payment Hub cloud-to-cloud |

### Stakeholders

| Stakeholder | Rol | Interés |
|---|---|---|
| **DTemite** | Empresa mandante | Abrir el rubro POS móvil sin abandonar el ERP |
| **José Robles Rocha** | Product Owner | Priorizar y aceptar el producto |
| **Equipo Capstone** | Desarrollo | Entregar D-PAY completo y defendible |
| **Fabián Alcántara Guajardo** | Docente guía | Evaluar Scrum, diseño y defensa |
| **Haulmer / TUU** | Pasarela POS | Cobro con tarjeta en hardware certificado |
| **SII (Chile)** | Regulador | DTE conforme a normativa |

---

## 5. Alcance del producto (MVP Capstone)

El MVP **es D-PAY completo**. No es un experimento de pasarela.

### Incluye

- Login multi-tenant, sesión, PIN patrón 3×3, biometría y aceptación de contrato `dpay_pos`.
- Venta con calculadora, catálogo, escaneo de barras, propina y modo offline.
- Tipos de documento: boleta 39, factura 33, exentas 34/41, comprobante 0.
- Cobro efectivo y tarjeta (crédito/débito vía TUU en Kozen).
- Emisión DTE, firma TED, PDF, vínculo transacción–documento.
- Historial unificado, nota de crédito, anulación de pago, compartir PDF (SMS/email).
- Impresión Bluetooth ESC/POS (documento, voucher, TED PDF417).
- Payment Hub (recibir intent, cobrar, reportar).
- Configuración: logo, documentos habilitados, comisiones, tema claro/oscuro.
- Documentación técnica y plan de pruebas del Capstone.

### No incluye (fuera de alcance)

| Exclusión | Justificación |
|---|---|
| Reescribir el ERP web DTemite | Es la plataforma de la empresa; D-PAY lo consume |
| Módulo de abonos / liquidaciones / inventario avanzado | Quedan en el ERP de oficina |
| iOS nativo | Prioridad Android (celular y Kozen) |
| Nuevas pasarelas web (Webpay, Flow, Mercado Pago) | Extensión futura; el MVP cobra con efectivo y TUU |
| Credenciales de pago en producción distintas a las de DTemite | Se usa QA/producción de la empresa mandante |

---

## 6. Restricciones

| # | Restricción | Impacto |
|---|---|---|
| R-01 | Plazo fijo: **18 semanas** | Producto priorizado por flujos de venta, no por el ERP entero |
| R-02 | Stack mobile: React Native 0.75.5, TypeScript, Zustand, MMKV | No cambiar framework a mitad de semestre |
| R-03 | Equipo de **3 integrantes** | Alcance = POS móvil, no reescritura del SaaS |
| R-04 | Repositorio **público** | Sin secretos (.env, keystore) |
| R-05 | Backend DTemite es productivo y compartido | Integración por API; cambios de servidor coordinados con PO |
| R-06 | TUU solo en hardware Kozen certificado | En celular genérico el cobro del MVP es efectivo (tarjeta = TUU/Kozen) |
| R-07 | Emisión DTE sujeta a normativa SII | Folios CAF, tipos de documento y TED no son opcionales |

---

## 7. Justificación de la solución

### Por qué D-PAY (y no “otro módulo del ERP”)

El ERP ya factura. El problema es **dónde** ocurre la venta. Un POS móvil es un producto distinto: UX táctil, offline, impresora Bluetooth, Intent de pago, sesión de cajero. Meter eso en el navegador del ERP no resuelve feria, delivery ni mostrador.

### Por qué este proyecto cumple el Capstone

1. **Situación real:** empresa mandante, API real, SII, pasarela TUU.
2. **Problema de ingeniería:** app nativa, multi-tenant, dual API (REST + legacy), pagos, tributario.
3. **Producto completo:** no un CRUD; un flujo comercial de punta a punta.
4. **Valor para DTemite:** nueva línea de negocio (POS) sobre la misma plataforma.

```
   ERP DTemite (oficina)          D-PAY (punto de venta)
   ┌──────────────────┐           ┌─────────────────────┐
   │ Web / Twig       │           │ React Native        │
   │ Inventario,      │  HTTPS    │ Venta + cobro       │
   │ reportes, abonos │◄─────────►│ DTE + impresión     │
   │ admin comercios  │  API      │ Historial + Hub     │
   └──────────────────┘           └─────────────────────┘
              │                              │
              └──────── PostgreSQL ──────────┘
                     (tenant del cliente)
```

---

## 8. Métricas de éxito

| Métrica | Objetivo |
|---|---|
| Flujos core del POS | Login, venta, efectivo, TUU, DTE, historial, NC, impresión |
| Tipos DTE operativos | 33, 34, 39, 41, 0, NC 61 |
| Registro en backend | Transacción en `tbl_dpay` + DTE vinculado |
| Payment Hub | Intent remoto cobrado y reportado |
| Documentación Capstone | `docs/` + Vision/Backlog Word + pruebas |
| Defectos críticos en demo | 0 en el flujo venta → cobro → DTE |

---

## 9. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Dependencia de API / QA DTemite | Media | Alto | Entorno QA + credenciales desde Semana 1; documentar contrato |
| Hardware TUU / Kozen no disponible | Media | Medio | Flujo efectivo + DTE siempre demostrable en celular |
| Complejidad normativa DTE | Media | Alto | Reutilizar contrato legacy ya usado por DTemite; no reinventar SII |
| Equipo de 3 personas | Baja | Medio | Alcance = POS móvil; ERP fuera de reescritura |
| Repo público con secretos | Baja | Alto | `.gitignore`, `.env.example`, sin keystores de release |

---

## 10. Roadmap de alto nivel

| Fase | Semanas | Foco |
|---|---|---|
| **Fase 1 — Definición** | 1–4 | Visión del producto completo, backlog, arquitectura, exposición |
| **Fase 2 — Desarrollo** | 5–15 | Completar, estabilizar y evidenciar D-PAY (venta → cobro → DTE → post-venta) |
| **Fase 3 — Cierre** | 16–18 | Informe, video demo del flujo completo, defensa |

---

## 11. Referencias

- Ecosistema: [00-ecosistema-dtemite.md](./00-ecosistema-dtemite.md)
- App Capstone: `dpay_3.0/codigo/`
- Plataforma empresa: `nuevodtemite/`
- Fase 1: `fase1/grupales/Product_Vision_DPAY3.0.docx`
- Análisis: `codigo/ANALISIS_DPAY.md`
- Endpoints: `codigo/ENDPOINTS_DTEMITE.md`

---

**Documento vivo.** Se actualiza con el feedback de DTemite y los sprints.

**Próxima revisión:** fin de Sprint 2.
