# Innovación y Propuesta de Valor — D-PAY 3.0

Respuestas exigidas por la guía Capstone APT122.

---

## 1. ¿Qué problema resuelve?

### Problema de negocio

DTemite ya es un ERP de facturación electrónica: el comercio emite DTE al SII desde un computador. Ese producto **no llega al mostrador**. Quien vende en local, feria o delivery necesita, en el mismo instante, armar la venta, cobrar y dejar la boleta o factura emitida.

Sin un POS móvil, DTemite no puede entrar a ese rubro. El comercio termina usando una caja de un lado y el facturador de otro: doble digitación, conciliaciones rotas y pérdida de venta.

### Problema técnico

Un ERP web no resuelve Intent de pago (TUU), impresora Bluetooth, sesión de cajero, modo offline ni UX táctil de 5 pulgadas. Hace falta **otro producto**, no otra pantalla del ERP: D-PAY.

### Problema académico

Demostrar Ingeniería en Informática sobre un producto real (empresa mandante, SII, pagos, multi-tenant), no un CRUD inventado.

---

## 2. ¿Qué hace diferente a la solución?

| Aspecto | Proyecto académico típico | D-PAY |
|---|---|---|
| Origen | App ficticia | Producto de una empresa que abre un **rubro nuevo** (POS) |
| Alcance | Un módulo | POS completo: login → venta → cobro → DTE → historial |
| Integración | BD local | Plataforma SaaS real: tenant, SII, TUU, Payment Hub |
| Normativa | Opcional | DTE Chile (tipos 33, 34, 39, 41, 61) |
| Relación con el ERP | No existe | D-PAY es el DTemite compacto para celular; el ERP sigue siendo la oficina |

### Diferenciador

D-PAY no “agrega una pasarela”. **Lleva DTemite al punto de venta.** La misma empresa, la misma BD del cliente, otro canal: el celular.

---

## 3. ¿Qué valor agrega?

### Para DTemite

| Valor | Impacto |
|---|---|
| Nueva línea de negocio | Vender POS además del ERP |
| Un solo dato | La venta móvil cae en `tbl_dpay` del tenant |
| Menos fuga de clientes | El comercio no busca otra app de boleta |

### Para el comercio

| Valor | Impacto |
|---|---|
| Una herramienta en la mano | Vender, cobrar y facturar sin PC |
| Efectivo y tarjeta (Kozen) | Caja real, no solo emisión |
| Historial e impresión | Cierre de día y ticket para el cliente |

### Para el equipo (perfil de egreso)

| Competencia | Evidencia |
|---|---|
| Desarrollo de software | React Native, TypeScript, módulos nativos |
| Arquitectura | Cliente móvil + API dual + multi-tenant |
| Integración | DTemite REST, Legacy SII, TUU, Hub |
| Gestión ágil | Scrum, sprints, retrospectivas |
| Calidad | Plan de pruebas del flujo POS |

---

## 4. Elevator pitch

> DTemite factura en la oficina. D-PAY es el producto que inventamos para que esa misma empresa venda en el mostrador: un DTemite compacto para celular que cobra y emite DTE al SII, integrado a la plataforma que el comercio ya usa.

---

**Uso:** presentación Fase 1, informe S10 y defensa S17.

**Revisión:** v2.0 — 9 septiembre 2026
