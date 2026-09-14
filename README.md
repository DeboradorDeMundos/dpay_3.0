# D-PAY 3.0 — Capstone Duoc UC

**Proyecto APT · Ingeniería en Informática · PTY4614-001V**  
Duoc UC, Sede San Bernardo · Semestre 2026-2  
Empresa mandante: **DTemite**

---

## 1. Nombre del proyecto

**D-PAY 3.0 — POS móvil de DTemite**

Punto de venta para celular y terminal Android: vender, cobrar y emitir Documentos Tributarios Electrónicos (DTE) al SII, integrado a la plataforma cloud de DTemite.

DTemite es un ERP web de facturación electrónica. D-PAY es su **nuevo rubro**: un DTemite compacto para el mostrador y la calle.

Contexto: [`codigo/docs/00-ecosistema-dtemite.md`](codigo/docs/00-ecosistema-dtemite.md)

---

## 2. Descripción general

### Problema que resuelve

El ERP de DTemite factura desde un computador. El comercio que vende en local, feria o delivery necesita **en el mismo momento** armar la venta, cobrar (efectivo o tarjeta) y emitir la boleta o factura. Sin un POS móvil, DTemite queda fuera de ese rubro y el comercio usa dos herramientas desconectadas.

### Público objetivo

- Comercios clientes de DTemite que venden fuera de un escritorio.
- Cajeros con smartphone Android o terminal POS Kozen.
- DTemite, que abre una línea de producto POS sobre su misma plataforma.

### Propuesta de valor

Una sola app: login de empresa, venta, cobro, DTE, historial, impresión y cobros remotos (Payment Hub). La venta móvil queda en la misma base del ERP (`tbl_dpay`).

Documentación: [`codigo/docs/`](codigo/docs/README.md)

---

## 3. Tecnologías utilizadas

| Capa | Tecnología |
|---|---|
| Mobile | React Native 0.75.5, TypeScript 5.9.3 |
| Estado | Zustand + MMKV |
| Navegación | React Navigation 7 |
| Android nativo | Kotlin/Java (TUU Intent, Bluetooth ESC/POS) |
| Plataforma empresa | `nuevodtemite` — Slim PHP, PostgreSQL multi-tenant, ERP web |
| APIs | REST bearer token (`pro.dtemite.cl/api`), Legacy PHP (DTE → SII) |
| Pagos | Efectivo; TUU Negocio (Haulmer) en terminal Kozen |
| Firma DTE | jsrsasign (SHA1withRSA), TED PDF417 |
| Control de versiones | Git, GitHub (repositorio **público**) |
| Metodología | Scrum |

---

## 4. Instrucciones para levantar y ejecutar localmente

El código de la aplicación está en [`codigo/`](codigo/README.md).

### Requisitos

- Node.js 18+ (recomendado 20 LTS)
- JDK 17 o 21
- Android Studio + SDK 35
- Dispositivo Android o emulador (API 24+)
- Credenciales QA DTemite (solicitar al PO)

### Pasos rápidos

```powershell
cd codigo
npm install
npm start
# Otra terminal:
npm run android
```

### APK release (sin Metro)

```powershell
cd codigo
npm run build:apk
```

### Entorno Docker (herramientas de desarrollo)

```powershell
cd codigo
docker compose run --rm dev-tools
```

Ver [`codigo/docs/12-manual-tecnico-despliegue.md`](codigo/docs/12-manual-tecnico-despliegue.md) y [`codigo/docker-compose.yml`](codigo/docker-compose.yml).

### Variables de entorno

Copiar `codigo/.env.example` → `codigo/.env` (no subir a Git).

---

## 5. Integrantes y roles

| Integrante | Rol en el Capstone |
|---|---|
| **Diego Madrid** | Desarrollo, integración mobile–backend |
| **Pablo Gutiérrez** | Arquitectura, **Scrum Master** |
| **Reinhartd Munzenmayer** | QA, pruebas, documentación |

**Product Owner (empresa):** José Robles Rocha — DTemite  
**Docente guía:** Fabián Alcántara Guajardo — f.alcantara@profesor.duoc.cl

---

## 6. Metodología de trabajo

**Scrum** — sprints de 2 semanas, 18 semanas totales.

| Fase | Semanas | Ponderación | Entregables clave |
|---|---|---|---|
| Fase 1 — Definición | 1–4 | 20% | Vision, Backlog, exposición grupal |
| Fase 2 — Desarrollo | 5–15 | 50% | Informe avance S10, producto final S15 |
| Fase 3 — Presentación | 16–18 | 30% | Defensa comisión calificadora S17 |

Detalle: [`codigo/docs/07-metodologia.md`](codigo/docs/07-metodologia.md) · Checklist: [`codigo/docs/09-checklist-capstone-apt122.md`](codigo/docs/09-checklist-capstone-apt122.md)

---

## 7. Arquitectura de la solución

```
D-PAY (React Native)                    Plataforma DTemite
┌─────────────────────────┐             ┌──────────────────────────┐
│ Login / sesión          │   HTTPS     │ REST API (bearer token)  │
│ Venta + catálogo        │────────────►│ Legacy PHP (DTE → SII)   │
│ Cobro efectivo / TUU    │             │ PostgreSQL multi-tenant  │
│ Emisión DTE + TED       │             │ tbl_dpay / Payment Hub   │
│ Historial + NC          │             │ ERP web (oficina)        │
│ Impresión Bluetooth     │             └──────────────────────────┘
│ Payment Hub (agente)    │
└─────────────────────────┘
```

Diagramas: [`codigo/docs/05-arquitectura.md`](codigo/docs/05-arquitectura.md) · [`codigo/docs/15-diagramas-uml.md`](codigo/docs/15-diagramas-uml.md)

---

## Estructura del repositorio

```
dpay_3.0/
├── README.md              ← Este archivo (índice Capstone)
├── codigo/                ← App D-PAY, docs técnicos, Docker, scripts
├── fase1/                 ← Entregables Fase 1 (Duoc)
├── fase2/                 ← Evidencias Fase 2
└── fase3/                 ← Cierre y defensa
```

Todo lo operativo (app, documentación Scrum, Docker, scripts Trello, Postman) vive en **`codigo/`**.  
La plataforma ERP/API de la empresa está en el repositorio `nuevodtemite` (externo).

> **Nota:** `.github/workflows/` permanece en la raíz porque GitHub Actions lo exige; el manual Trello está en `codigo/docs/TRELLO.md`.

---

## Documentación Capstone

Índice: **[codigo/docs/README.md](codigo/docs/README.md)**

---

**Duoc UC · San Bernardo · 2026** · Repositorio público auditado Semanas 1–18
