# Product Backlog — D-PAY 3.0

**POS móvil de DTemite: vender, cobrar y emitir DTE**

---

| Campo | Valor |
|---|---|
| **Empresa mandante** | DTemite |
| **Product Owner** | José Robles Rocha |
| **Scrum Master** | Pablo Gutiérrez |
| **Equipo** | Diego Madrid, Pablo Gutiérrez, Reinhartd Munzenmayer |
| **Docente guía** | Fabián Alcántara Guajardo |
| **Metodología** | Scrum |
| **Revisión** | v2.0 — 9 septiembre 2026 |

---

## 1. Introducción

Este backlog describe **D-PAY completo**: el POS móvil que DTemite encarga para entrar al rubro de venta en terreno. Las historias cubren autenticación, venta, cobro, DTE, historial, impresión y Payment Hub — no un módulo de pasarelas.

Priorización:

1. **Flujo comercial de punta a punta** (login → venta → cobro → DTE).
2. **Post-venta** (historial, NC, impresión) para que el producto sea usable de verdad.
3. **Integración y calidad** (Hub, documentación, pruebas).

Ver [01-vision.md](./01-vision.md) y [00-ecosistema-dtemite.md](./00-ecosistema-dtemite.md).

### Convenciones

| Concepto | Definición |
|---|---|
| **Estimación** | Puntos Fibonacci (1, 2, 3, 5, 8, 13) |
| **Prioridad** | Alta / Media / Baja |
| **Estado** | Por hacer / En progreso / Hecho / Cancelado |
| **Sprint** | Tentativo; se confirma en Sprint Planning |

### Velocidad

- 3 integrantes, disponibilidad parcial.
- Objetivo: **18–22 puntos por sprint** (2 semanas).
- MVP producto (HU-01 a HU-12): **73 puntos** a lo largo de Fase 1–2.

---

## 2. Épicas

| ID | Épica | Descripción | Historias |
|---|---|---|---|
| **EP-01** | Identidad y sesión | Entrar al POS como comercio DTemite | HU-01, HU-02 |
| **EP-02** | Venta | Armar el cobro en el mostrador | HU-03, HU-04 |
| **EP-03** | Cobro | Efectivo y tarjeta TUU | HU-05, HU-06 |
| **EP-04** | Tributario | Emitir DTE al SII | HU-07 |
| **EP-05** | Post-venta | Historial, NC, impresión | HU-08, HU-09, HU-10 |
| **EP-06** | Integraciones | Payment Hub y configuración | HU-11, HU-12 |
| **EP-07** | Calidad Capstone | Docs y pruebas | HU-13, HU-14 |

---

## 3. Backlog priorizado — producto MVP

| ID | Historia de usuario | Criterios de aceptación (resumen) | Prioridad | Pts. | Sprint | Estado |
|---|---|---|---|---|---|---|
| **HU-01** | Como comercio DTemite, quiero entrar a D-PAY con RUT, usuario y clave, para usar mi empresa (tenant) desde el celular. | • Login contra `POST /api/login`<br>• Token bearer en MMKV<br>• Descarga CAF, catálogo y clientes | Alta | 5 | 1 | En progreso |
| **HU-02** | Como cajero, quiero bloquear la app con PIN patrón o biometría, para que nadie use mi sesión abierta. | • PIN patrón 3×3<br>• Biometría opcional (no en Kozen)<br>• `b64pass` solo para DTE legacy | Alta | 3 | 1 | En progreso |
| **HU-03** | Como cajero, quiero armar una venta con calculadora, catálogo o scanner, para cobrar rápido. | • Calculadora táctil<br>• Catálogo con búsqueda<br>• Scanner de barras<br>• Offline con sync | Alta | 8 | 1–2 | En progreso |
| **HU-04** | Como cajero, quiero elegir tipo de documento y cliente, para emitir boleta, factura o comprobante. | • Tipos 39, 33, 34, 41, 0<br>• Cliente o consumidor final<br>• Propina configurable | Alta | 5 | 2 | En progreso |
| **HU-05** | Como cajero, quiero cobrar en efectivo, para cerrar ventas sin terminal de tarjeta. | • Medio efectivo<br>• Registro en `tbl_dpay`<br>• Sigue a DTE si aplica | Alta | 5 | 2 | En progreso |
| **HU-06** | Como cajero con terminal Kozen, quiero cobrar con crédito o débito vía TUU, para aceptar tarjeta. | • Intent TUU<br>• `authCode`, last4, comisiones<br>• Fallos con `detalle_error` | Alta | 8 | 2 | En progreso |
| **HU-07** | Como comercio, quiero emitir el DTE al SII al cerrar la venta, para cumplir la ley y entregar boleta/factura. | • API legacy Documento<br>• Neto/IVA según tipo<br>• TED + PDF + vínculo a transacción | Alta | 13 | 2–3 | En progreso |
| **HU-08** | Como cajero, quiero ver el historial de ventas, para revisar folios y montos del día. | • Filtro fecha / tipo / folio<br>• Une local + servidor<br>• Sync manual | Media | 5 | 3 | En progreso |
| **HU-09** | Como cajero, quiero anular o emitir nota de crédito, para corregir una venta. | • NC total o corrección<br>• Anular pago sin DTE | Media | 5 | 3 | En progreso |
| **HU-10** | Como cajero, quiero imprimir el ticket por Bluetooth, para entregar comprobante en papel. | • ESC/POS<br>• Auto print doc/voucher<br>• TED PDF417 | Media | 5 | 3 | En progreso |
| **HU-11** | Como integrador, quiero enviar un cobro al POS por Payment Hub, para cobrar sin cable. | • Poll de intents<br>• Cobro local<br>• Resultado al Hub | Media | 8 | 4 | En progreso |
| **HU-12** | Como cajero, quiero configurar documentos, logo, impresión, comisiones y tema, para adaptar el POS a mi local. | • Logo / headers<br>• Docs on/off<br>• Comisiones<br>• Claro/oscuro | Baja | 3 | 4 | En progreso |
| **HU-13** | Como equipo, quiero documentar visión, arquitectura, RF/RNF y UML, para el Capstone. | • `docs/` completo<br>• Vision + Backlog Word | Media | 5 | 0–1 | En progreso |
| **HU-14** | Como equipo, quiero probar el flujo venta → cobro → DTE, para defender el producto con evidencia. | • Matriz TC<br>• Capturas / video<br>• 0 críticos abiertos | Media | 8 | 5 | Por hacer |

**Total MVP:** 86 puntos (73 producto + 13 calidad)

---

## 4. Backlog futuro — post producto

| ID | Historia | Resumen | Prioridad | Pts. |
|---|---|---|---|---|
| **HU-15** | Cobro con Webpay en celular sin Kozen | Pasarela web sandbox | Baja | 13 |
| **HU-16** | Cobro con Flow / Mercado Pago | Más medios | Baja | 13 |
| **HU-17** | D-PAY en iOS | Misma app en iPhone | Baja | 13 |
| **HU-18** | Reportes POS en el ERP web | Filtro `source_name`, export | Baja | 5 |

Estas historias **no son el proyecto**. Son el siguiente rubro si DTemite quiere ampliar medios de pago o plataforma.

---

## 5. Backlog técnico

| ID | Item | Descripción | Prioridad | Pts. |
|---|---|---|---|---|
| **TECH-01** | Captura `ip_origen` | NetInfo en transacción | Baja | 2 |
| **TECH-02** | DeviceInfo dinámico | No hardcodear modelo POS | Baja | 2 |
| **TECH-03** | Sync offline más robusto | Reintentos en `mySalesStore` | Media | 5 |
| **TECH-04** | Tests unitarios de venta/DTE | Jest sobre cálculos y mapeos | Media | 5 |

---

## 6. Mapa de dependencias

```
HU-01 Login
  └── HU-02 PIN / biometría
        └── HU-03 Venta
              └── HU-04 Documento + cliente
                    ├── HU-05 Efectivo ──┐
                    └── HU-06 TUU ───────┼── HU-07 DTE
                                         ├── HU-08 Historial
                                         ├── HU-09 NC
                                         └── HU-10 Impresión
HU-11 Payment Hub (paralelo, requiere HU-06)
HU-12 Configuración (paralelo)
HU-13 Documentación (continuo)
HU-14 Pruebas (después de HU-07)
```

---

## 7. Planificación por sprint

| Sprint | Semanas | Objetivo | Historias | Puntos |
|---|---|---|---|---|
| **Sprint 0** | 1–4 | Definir el producto D-PAY completo | HU-13 (parcial) | — |
| **Sprint 1** | 5–6 | Identidad + venta base | HU-01, HU-02, HU-03, HU-13 | ~21 |
| **Sprint 2** | 7–8 | Documento, cobro, inicio DTE | HU-04, HU-05, HU-06, HU-07 | ~31 |
| **Sprint 3** | 9–10 | DTE cierre + post-venta; informe S10 | HU-07, HU-08, HU-09 | ~15 |
| **Sprint 4** | 11–12 | Impresión, Hub, settings | HU-10, HU-11, HU-12 | ~16 |
| **Sprint 5** | 13–15 | Pruebas, APK, docs finales | HU-14 | 8 |
| **Sprint 6–7** | 16–18 | Defensa | — | — |

---

## 8. Definition of Ready (DoR)

- [ ] Criterios de aceptación verificables.
- [ ] Sin dependencia bloqueante sin dueño.
- [ ] Estimada en puntos.
- [ ] Priorizada por el PO (o el equipo en su ausencia).
- [ ] Riesgos técnicos identificados.

---

## 9. Definition of Done (DoD)

- [ ] Código en `main`.
- [ ] CA verificados en dispositivo Android.
- [ ] Flujo venta → cobro → DTE sin regresión si la historia lo toca.
- [ ] Documentación actualizada si cambia API o arquitectura.
- [ ] Revisión entre pares.
- [ ] Demo en Sprint Review.

---

## 10. Evidencia UI

Pantallas del producto (baseline a demostrar):

- Login, venta, tipos de documento, métodos de pago.
- Catálogo, clientes, historial, detalle, nota de crédito.
- Configuración, impresora, Payment Hub (cobro externo).

---

## 11. Historial de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| v0.1 | Semanas 1–4 | Borrador Fase 1 |
| v1.0 | 28-08-2026 | Enfoque multi-pasarela (descartado) |
| v2.0 | 09-09-2026 | Backlog del producto D-PAY completo |

---

**Documento vivo.** Origen: `fase1/grupales/Product_Backlog_DPAY3.0.docx`
