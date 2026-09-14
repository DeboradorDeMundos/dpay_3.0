# Diagramas UML — D-PAY 3.0

Diagramas mínimos de la guía APT122. El caso principal es **realizar una venta completa** (cobro + DTE), no un módulo de pasarelas.

---

## 1. Casos de uso

### Actores

| Actor | Descripción |
|---|---|
| **Cajero / comerciante** | Usuario de D-PAY |
| **Cliente final** | Quien paga |
| **Integrador** | Sistema externo vía Payment Hub |
| **Plataforma DTemite** | API REST + Legacy + BD |
| **TUU** | Pasarela de tarjeta en Kozen |
| **SII** | Receptor del DTE |

### Diagrama

```mermaid
flowchart LR
    subgraph Actores
        A1[Cajero]
        A2[Cliente final]
        A3[Integrador]
    end

    subgraph Dpay["D-PAY"]
        UC1((Autenticarse))
        UC2((Armar venta))
        UC3((Cobrar))
        UC4((Emitir DTE))
        UC5((Ver historial))
        UC6((Emitir NC))
        UC7((Imprimir))
        UC8((Recibir cobro Hub))
        UC9((Configurar POS))
    end

    A1 --> UC1
    A1 --> UC2
    A1 --> UC3
    A1 --> UC5
    A1 --> UC6
    A1 --> UC7
    A1 --> UC9
    A3 --> UC8
    UC2 --> UC3
    UC3 --> UC4
    A2 -.-> UC3
```

### CU-02/03/04 — Venta + cobro + DTE (principal)

| Campo | Valor |
|---|---|
| **Actor** | Cajero |
| **Precondición** | Sesión activa, catálogo/CAF disponibles |
| **Flujo** | 1. Ítems 2. Tipo DTE y cliente 3. Efectivo o TUU 4. Emitir DTE si aplica 5. Registrar `tbl_dpay` 6. Imprimir |
| **Extensiones** | Pago rechazado; sin red (efectivo offline); tipo 0 sin SII |
| **Postcondición** | Venta en historial; DTE en SII si correspondía |

---

## 2. Secuencia — venta efectivo + boleta

```mermaid
sequenceDiagram
    autonumber
    actor Cajero
    participant App as D-PAY
    participant REST as API DTemite
    participant Legacy as Legacy PHP
    participant SII as SII

    Cajero->>App: Login
    App->>REST: POST /api/login
    REST-->>App: token + tenant
    Cajero->>App: Venta + boleta 39 + efectivo
    App->>Legacy: POST /Api/Documento
    Legacy->>SII: DTE
    Legacy-->>App: folio, TED
    App->>REST: POST /pos/transaccion
    App->>REST: PUT /pos/transaccion/{id}/dte
    App-->>Cajero: Venta lista / PDF / ticket
```

### Secuencia — venta tarjeta TUU (Kozen)

```mermaid
sequenceDiagram
    autonumber
    actor Cajero
    participant App as D-PAY
    participant TUU as TUU Negocio
    participant REST as API DTemite
    participant Legacy as Legacy PHP

    Cajero->>App: Venta + tarjeta
    App->>TUU: Intent (monto)
    TUU-->>App: authCode, last4
    App->>Legacy: Emitir DTE
    App->>REST: POST /pos/transaccion
    App->>REST: Vincular DTE
```

---

## 3. Componentes

```mermaid
graph TB
    subgraph Mobile["D-PAY"]
        UI[Screens]
        ST[Zustand stores]
        SVC[Services]
        NAT[Módulos nativos]
    end

    subgraph Cloud["Plataforma DTemite"]
        REST[REST API]
        LEG[Legacy DTE]
        PG[(PostgreSQL)]
        ERP[ERP web]
    end

    subgraph Ext["Externos"]
        TUU[TUU]
        SII[SII]
        BT[Impresora BT]
    end

    UI --> ST
    UI --> SVC
    SVC --> REST
    SVC --> LEG
    NAT --> TUU
    NAT --> BT
    REST --> PG
    LEG --> SII
    ERP --> PG
```

---

## 4. Clases (dominio mobile)

```mermaid
classDiagram
    class AuthStore {
        +token
        +user
        +empresa
        +login()
        +logout()
    }
    class SalesStore {
        +items
        +cliente
        +tipoDte
        +addItem()
        +clear()
    }
    class SaleLine {
        +descripcion
        +cantidad
        +precio
    }
    class PaymentService {
        +payCash()
        +payTuu()
    }
    class DteService {
        +emit()
        +signTed()
    }
    class PosApi {
        +registerTransaction()
        +linkDte()
    }

    SalesStore o-- SaleLine
    AuthStore --> PosApi
    PaymentService --> PosApi
    DteService --> PosApi
```

---

## 5. Despliegue

Ver [05-arquitectura.md](./05-arquitectura.md) §8.

Datos persistidos relevantes:

- `tbl_dpay` — transacción POS (tenant)
- `tbl_documento` — DTE
- `tbl_payment_intent` — cola Hub (`admin_dtemite`)

---

**Revisión:** v2.0 — 9 septiembre 2026
