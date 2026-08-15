# DTemite — Guía de integración (documentos, productos y clientes)

> Referencia técnica de los endpoints y servicios de DTemite para emitir documentos tributarios electrónicos, consultar el historial, visualizar PDFs, gestionar productos, clientes y folios. No incluye integración con terminales de pago.

---

## Tabla de contenidos

1. [Arquitectura general](#1-arquitectura-general)
2. [Autenticación](#2-autenticación)
3. [API REST — `pro.dtemite.cl/api`](#3-api-rest--prodtemiteclapi)
   - [Catálogo de productos](#31-catálogo-de-productos)
   - [Clientes](#32-clientes)
   - [Datos geográficos](#33-datos-geográficos)
   - [CAFs (Folios)](#34-cafs-folios)
   - [Comisiones DPay](#35-comisiones-dpay)
   - [Transacciones POS/TUU](#36-transacciones-postuu)
   - [Documentos DPay (historial)](#37-documentos-dpay-historial)
4. [API Legacy PHP — `sistema.dtemite.cl`](#4-api-legacy-php--sistemadtemitecl)
   - [Emitir documento DTE](#41-emitir-documento-dte)
   - [Emitir Nota de Crédito](#42-emitir-nota-de-crédito)
5. [Flujo completo de una venta](#5-flujo-completo-de-una-venta)
6. [Cambio de entorno (QA ↔ PROD)](#6-cambio-de-entorno-qa--prod)
7. [Consideraciones y errores frecuentes](#7-consideraciones-y-errores-frecuentes)

---

## 1. Arquitectura general

La integración con DTemite usa **dos sistemas distintos** que NO comparten autenticación ni base URL:

| Sistema | URL base | Qué hace |
|---------|----------|----------|
| **REST API** | `https://pro.dtemite.cl/api` | Login, productos, clientes, CAFs, comisiones, transacciones POS, historial |
| **Legacy PHP** | `https://sistema.dtemite.cl/sistema/Backend/WsMaster/ApiIntegracionController.php` | Emisión de DTEs al SII (boletas, facturas, notas de crédito) |

```
App React Native
    │
    ├── apiClient.ts (base: pro.dtemite.cl/api)
    │       ├── POST /login
    │       ├── GET  /producto
    │       ├── GET/POST/PUT /cliente, /dpay/cliente
    │       ├── GET  /auxiliares/...
    │       ├── GET  /folios/caf
    │       ├── GET  /pos/comisiones
    │       ├── POST/PUT /pos/transaccion
    │       └── POST /dpay/documentos, /dpay/documento
    │
    └── fetch() directo (sistema.dtemite.cl)
            ├── POST /Api/Documento  ← Emitir DTE
            └── POST /Api/Documento  ← Emitir Nota de Crédito
```

---

## 2. Autenticación

### `POST /api/login`

No requiere Authorization header.

**Request:**
```json
{
  "rut": "12345678-9",
  "usuario": "mi_usuario",
  "password": "mi_clave"
}
```

**Response exitosa:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": "mi_usuario",
  "nombre": "Juan Pérez",
  "sistema": "D-PAY MOBILE",
  "empresa": {
    "rut": "98765432-1",
    "razon": "Mi Empresa SpA",
    "giro": "Comercio al por menor",
    "direccion": "Calle 123",
    "comuna": "Santiago",
    "provincia": "Santiago"
  }
}
```

**Cómo se usa el token:**

Se guarda en `apiClient.ts` mediante `setAuthToken(token)` y se inyecta automáticamente en cada petición:

```
Authorization: bearer eyJhbGci...
             ^^^^^^^^
             MINÚSCULA — no "Bearer"
```

**⚠️ El `b64pass`:** Además del token JWT, la app guarda en `authStore` la contraseña en base64 (`b64pass`). Este valor se usa como campo `clave` en el sistema legacy PHP para emitir DTEs. Sin `b64pass` no se puede emitir documentos. Si el usuario cierra sesión y vuelve a entrar, se regenera automáticamente.

---

## 3. API REST — `pro.dtemite.cl/api`

Todas estas rutas usan `https://pro.dtemite.cl/api` como base (definida en `apiClient.ts`).  
Todas **requieren** `Authorization: bearer {token}` salvo `/login`.

---

### 3.1 Catálogo de productos

#### `GET /producto`

Devuelve todos los productos/servicios disponibles para la empresa autenticada.

**Headers:**
```
Authorization: bearer {token}
```

**Response:** Array de productos
```json
[
  {
    "id": 1,
    "codigo": "PROD001",
    "nombre": "Producto de ejemplo",
    "precio": 11900,
    "stock": 50,
    "activo": true
  }
]
```

---

### 3.2 Clientes

> **Atención:** Existe una inconsistencia de rutas. El listado usa `/cliente` pero las operaciones CRUD usan `/dpay/cliente`.

#### `GET /cliente`

Lista todos los clientes de la empresa.

**Response:** Array de clientes. Los campos pueden venir con distintos nombres según el backend (`razon` o `razon_social`, `direccion` o `address`). La app normaliza esto al recibir.

```json
[
  {
    "id": 5,
    "rut": "11111111-1",
    "razon": "Cliente de Ejemplo Ltda",
    "giro": "Servicios",
    "email": "cliente@ejemplo.cl",
    "telefono": "+56912345678",
    "direccion": "Av. Siempreviva 742",
    "comuna": "Providencia",
    "id_region": 13,
    "id_provincia": 131,
    "id_comuna": 13101,
    "activo": true
  }
]
```

---

#### `GET /dpay/cliente/{rutEmpresa}/{clientId}`

Obtiene el detalle de un cliente específico.

**Parámetros en URL:**
- `rutEmpresa` — RUT de la empresa autenticada (ej: `98765432-1`)
- `clientId` — ID del cliente

**Response:** Objeto con los mismos campos que en el listado, o `{ "error": true, "mensaje": "..." }` en caso de error.

---

#### `POST /dpay/cliente`

Crea un nuevo cliente.

**Body:**
```json
{
  "rut": "22222222-2",
  "razon": "Nuevo Cliente SpA",
  "giro": "Tecnología",
  "email": "nuevo@cliente.cl",
  "telefono": "+56987654321",
  "direccion": "Calle Nueva 456",
  "id_region": 13,
  "id_provincia": 131,
  "id_comuna": 13101,
  "id_clasificacion": null,
  "id_vendedor": null,
  "id_pais_receptor": null,
  "id_cuenta": null,
  "id_cuenta_pro": null,
  "rut_empresa": "98765432-1"
}
```

> Los campos enteros opcionales deben enviarse como `null` explícito (no omitirlos) para que la BD los acepte correctamente.

**Response exitosa:**
```json
{ "id": 42, "mensaje": "Cliente creado correctamente" }
```

**Response de error:**
```json
{ "error": true, "mensaje": "El RUT ya existe" }
```

---

#### `PUT /dpay/cliente/{clientId}`

Actualiza un cliente existente. Mismo body que el POST, todos los campos son opcionales excepto `rut_empresa`.

**Response:** igual estructura que POST.

---

### 3.3 Datos geográficos

Usados para poblar selectores de región/provincia/comuna en formularios de clientes.

#### `GET /auxiliares/Regiones`

**Response:** Array de regiones (puede venir directo o dentro de `data.regiones`)
```json
[
  { "id_region": 13, "nombre_region": "Metropolitana de Santiago" },
  { "id_region": 5,  "nombre_region": "Valparaíso" }
]
```

---

#### `GET /auxiliares/Provincia`

**⚠️ Devuelve TODAS las provincias del país.** El filtrado por región se hace en el cliente, no en el servidor.

```json
[
  { "id_provincia": 131, "nombre_provincia": "Santiago", "id_region": 13 },
  { "id_provincia": 132, "nombre_provincia": "Cordillera", "id_region": 13 }
]
```

Filtrar en código: `all.filter(p => p.id_region === idRegion)`

---

#### `GET /auxiliares/Comunas/{idProvincia}`

Devuelve las comunas de una provincia específica.

```json
[
  { "id_comuna": 13101, "nombre_comuna": "Santiago", "id_provincia": 131 },
  { "id_comuna": 13102, "nombre_comuna": "Cerrillos",  "id_provincia": 131 }
]
```

---

### 3.4 CAFs (Folios)

#### `GET /folios/caf`

Retorna los Códigos de Autorización de Folios (CAFs) vigentes de la empresa. Son los XML firmados por el SII que autorizan el uso de rangos de folios por tipo de documento.

**Response:** Array de CAFs
```json
[
  {
    "id_ctrl_folio": 1,
    "id_td": 39,
    "nom_archivocaf": "<AUTORIZACION>...(XML base64)...</AUTORIZACION>",
    "rsask": "-----BEGIN RSA PRIVATE KEY-----\n...",
    "rango_desde": 1,
    "rango_hasta": 500,
    "activo": true
  }
]
```

| Campo | Descripción |
|-------|-------------|
| `id_td` | Tipo de documento: 33=Factura, 39=Boleta, 41=Bol.Exenta, etc. |
| `nom_archivocaf` | XML del CAF (necesario para firmar el TED localmente) |
| `rsask` | Clave privada RSA para firmar |
| `rango_desde / rango_hasta` | Rango de folios autorizados |

> **Nota:** La app cachea los CAFs en `cafStore`. En la emisión, el folio siempre se envía como `"0"` y el servidor asigna el número real. Los CAFs se usan localmente solo si se implementara firma offline.

---

### 3.5 Comisiones DPay

#### `GET /pos/comisiones?rut_empresa={rut}`

Obtiene la configuración de comisiones del terminal POS para la empresa.

**Response:**
```json
{
  "habilitado": true,
  "tipo_comision": "fija",
  "comision_porcentaje": 1.9,
  "comision_monto_fijo": 0
}
```

| `tipo_comision` | Fórmula |
|-----------------|---------|
| `"fija"` | `(monto × 1.9%) × 1.19 (IVA)` |
| `"mixta"` | `((monto × 1.4%) + $70) × 1.19 (IVA)` |

Ejemplo: venta de $10.000 con comisión fija:
```
comisión neta  = 10000 × 0.019 = $190
comisión total = 190 × 1.19   = $226 (con IVA)
```

---

### 3.6 Transacciones POS/TUU

#### `POST /pos/transaccion`

Registra en la BD una transacción procesada por el terminal TUU. Se llama **después** de que TUU aprueba el pago y, opcionalmente, después de emitir el DTE.

**Body:**
```json
{
  "monto": 10000,
  "rut_empresa": "98765432-1",
  "usuario": "cajero1",
  "sistema": "D-PAY",

  "id_mediopago": 101,
  "tipo_tarjeta": "VISA",
  "ultimos_digitos": "1234",
  "codigo_autorizacion": "654321",
  "cuotas": 1,
  "propina": 0,
  "cashback": 0,

  "transaction_status": true,
  "sequence_number": "001234",
  "response_code": "00",
  "response_message": "APROBADO",

  "tipo_comision": "fija",
  "comision_porcentaje": 1.9,
  "comision_monto_fijo": 0,
  "comision_monto": 226,

  "id_cliente": 5,
  "rut_cliente": "11111111-1",
  "nombre_cliente": "Juan Pérez",

  "tipo_dte": 39,
  "folio_dte": 1234,
  "id_documento": 9876,

  "request_json": { },
  "response_json": { }
}
```

**Campos importantes:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `monto` | number | **Requerido**. Monto total de la transacción |
| `id_mediopago` | number | `101` = Crédito, `104` = Débito |
| `ultimos_digitos` | string | Solo los 4 dígitos (sin `****`). El SDK TUU devuelve `"****1234"` — extraer con `.replace(/\*/g, '').slice(-4)` |
| `transaction_status` | boolean | `true` = aprobada, `false` = rechazada |
| `comision_monto` | number | Total de comisión **con IVA** incluido |
| `request_json` / `response_json` | object | Payload completo enviado/recibido de TUU (para auditoría) |

**Response exitosa:**
```json
{ "success": true, "id": 777, "message": "Transacción registrada" }
```

**Response de error:**
```json
{ "success": false, "message": "Error al registrar" }
```

---

#### `PUT /pos/transaccion/{id}/dte`

Vincula un DTE ya emitido a una transacción TUU existente. Se usa cuando el DTE se emite después de registrar la transacción.

**Parámetro URL:** `id` — ID devuelto por el POST anterior.

**Body:**
```json
{
  "tipo_dte": 39,
  "folio_dte": 1234,
  "id_documento": 9876
}
```

**Response:**
```json
{ "success": true, "message": "DTE vinculado correctamente" }
```

---

### 3.7 Documentos DPay (historial)

#### `POST /dpay/documentos`

Lista los documentos emitidos en un rango de fechas.

**Body:**
```json
{
  "rut_empresa": "98765432-1",
  "usuario": "cajero1",
  "fecha_desde": "01-05-2026",
  "fecha_hasta": "05-05-2026"
}
```

> **Formato de fechas:** `DD-MM-YYYY` (no ISO).

**Response:** Array de `DpayDocument` o `{ data: [...] }` o `{ resultado: [...] }` — la app maneja los tres casos.

Campos principales de cada documento:
```json
{
  "id_documento": 9876,
  "folio": 1234,
  "tipo_documento": "BOLETA",
  "fecha_creacion": "2026-05-05T10:30:00",
  "montototal": 10000,
  "anulado": false,
  "dpay_id": 777,
  "dpay_monto": 10000,
  "dpay_tipo_tarjeta": "VISA",
  "dpay_ultimos_digitos": "1234",
  "dpay_codigo_autorizacion": "654321",
  "dpay_comision_monto": 226,
  "dpay_transaction_status": true,
  "dpay_medio_pago": "Crédito",
  "ted": "<TED>...</TED>"
}
```

---

#### `POST /dpay/documento`

Obtiene el detalle completo de un documento incluyendo el desglose de items.

**Body:**
```json
{
  "id_documento": 9876,
  "rut_empresa": "98765432-1"
}
```

**Response:** Mismo objeto que en el listado más:
```json
{
  "monto_neto": 8403,
  "monto_exento": 0,
  "montoiva": 1597,
  "rut_cliente": "11111111-1",
  "razon_social": "Juan Pérez",
  "detalle": [
    {
      "numero_linea": 1,
      "cod_producto": "PROD001",
      "descripcion_prod": "Producto X",
      "cantidad": 2,
      "precio_unitario": 4202,
      "total": 8403
    }
  ]
}
```

---

## 4. API Legacy PHP — `sistema.dtemite.cl`

Esta API **no usa el JWT** del login. Se autentica con usuario/clave embebidos en el body del JSON. El token de sesión no aplica aquí.

URL base:
```
https://sistema.dtemite.cl/sistema/Backend/WsMaster/ApiIntegracionController.php
```

---

### 4.1 Emitir documento DTE

#### `POST /Api/Documento`

Emite un documento tributario electrónico (boleta, factura) y lo registra en el SII.

**Headers:**
```
Content-Type: application/json
(sin Authorization)
```

**Body completo:**
```json
{
  "Sistema": {
    "nombre": "D-PAY Mobile",
    "rut": "98765432-1",
    "usuario": "mi_usuario",
    "clave": "bWlfY2xhdmU=",
    "bodega": "01"
  },
  "Documento": {
    "Encabezado": {
      "IdDoc": {
        "TipoDTE": "39",
        "Folio": "0",
        "FchEmis": "2026-05-05",
        "FchVenc": "2026-05-05",
        "FmaPago": "1",
        "FmaPagEx": "Tarjeta de Débito"
      },
      "Emisor": {
        "RUTEmisor": "98765432-1",
        "RznSocEmisor": "Mi Empresa SpA",
        "GiroEmisor": "Comercio al por menor",
        "DirOrigen": "Calle 123",
        "CmnaOrigen": "Santiago",
        "CiudadOrigen": "Santiago"
      },
      "Receptor": {
        "RUTRecep": "11111111-1",
        "RznSocRecep": "Juan Pérez",
        "CorreoRecep": "juan@mail.cl",
        "DirRecep": "Av. Siempreviva 742",
        "CmnaRecep": "Providencia",
        "CiudadRecep": "Santiago"
      },
      "Totales": {
        "MntNeto": "8403",
        "MntExe": "0",
        "TasaIVA": "19",
        "IVA": "1597",
        "MntTotal": "10000"
      }
    },
    "Detalle": [
      {
        "NroLinDet": "1",
        "CdgItem": {
          "TpoCodigo": "INT1",
          "VlrCodigo": "PROD001"
        },
        "NmbItem": "Producto X",
        "QtyItem": "2",
        "PrcItem": "4202",
        "MontoItem": "8403",
        "CodBodega": "BODEGA_PRINCIPAL"
      }
    ]
  },
  "Adicional": {
    "NodosA": [
      { "valor": "Propina: $500" }
    ]
  }
}
```

#### Campos del objeto `Sistema`

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| `nombre` | Sí | Nombre del sistema integrador |
| `rut` | Sí | RUT de la empresa emisora |
| `usuario` | Sí | Usuario de acceso al sistema |
| `clave` | Sí | **Contraseña en Base64** (`b64pass` del login) |
| `bodega` | No | Código de bodega/sucursal (ej: `"01"`) |

#### `TipoDTE` — Tipos de documento

| Valor | Documento |
|-------|-----------|
| `"33"` | Factura Electrónica |
| `"34"` | Factura No Afecta o Exenta |
| `"39"` | Boleta Electrónica |
| `"41"` | Boleta No Afecta o Exenta |
| `"61"` | Nota de Crédito |

#### `FmaPago` — Forma de pago

| Valor | Significado |
|-------|-------------|
| `"1"` | Contado (efectivo, débito) |
| `"2"` | Crédito |
| `"3"` | Sin Costo |

#### Reglas de precios en `Detalle` según tipo de documento

| TipoDTE | `PrcItem` / `MontoItem` | Lógica |
|---------|------------------------|--------|
| `33` (Factura) | **Neto** — sin IVA | `precio ÷ 1.19` |
| `34` (Fact. Exenta) | Bruto sin cambio | `precio` |
| `39` (Boleta) | **Bruto** — IVA incluido | `precio` (sin modificar) |
| `41` (Bol. Exenta) | Bruto sin cambio | `precio` |

> ⚠️ **Crítico:** Enviar el precio equivocado resulta en IVA incorrecto en el SII. Factura = neto. Boleta = bruto.

#### Reglas de `Totales`

Para facturas (TipoDTE=33): el total tiene IVA, hay que extraer el neto:
```
IVA   = round(total × 19 / 119)
Neto  = total - IVA
Exento = 0
```

Para boletas exentas (TipoDTE=41):
```
MntNeto = 0
MntExe  = total
IVA     = 0
```

#### El campo `Adicional`

Va al **nivel raíz** del JSON (mismo nivel que `Documento`, **NO** adentro de `Documento`). Se usa para agregar información extra, como propina:
```json
{
  "Sistema": { ... },
  "Documento": { ... },
  "Adicional": {
    "NodosA": [
      { "valor": "Propina: $500" }
    ]
  }
}
```
El backend PHP asigna automáticamente los campos A1, A2... al iterar `NodosA`.

#### `Folio`

**Siempre enviar `"0"`**. El servidor asigna el folio real del CAF disponible. Nunca pre-asignar un folio desde la app.

#### `CodBodega`

Se incluye por cada ítem en el `Detalle` (no en `Sistema`). Permite que el backend descuente stock de la bodega correcta.

---

**Response exitosa:**
```json
{
  "status": "success",
  "Mensaje": "Documento emitido con folio 1234",
  "folio": 1234,
  "id_documento": 9876,
  "ted": "<TED>...(timbre electrónico PDF417)...</TED>",
  "pdf": "JVBERi0xLjQ...(base64)",
  "xml": "<?xml version='1.0'...>"
}
```

> El folio puede venir como `result.folio`, `result.Folio`, `result.data.folio` o extraído de `result.Mensaje` con regex. La app maneja todos los casos.

**Response de error (HTTP 200 con error en body):**
```json
{
  "status": "error",
  "Mensaje": "Error: RUT emisor no válido"
}
```

> ⚠️ El endpoint PHP puede responder HTTP 200 aunque haya error — siempre verificar `result.status` o `result.error`.

**Caso especial — "Documento ya registrado":**  
Si el servidor responde con el texto `"Documento ya registrado"` en el error, la app lo trata como éxito (el documento ya existe en el sistema).

---

### 4.2 Emitir Nota de Crédito

Usa **el mismo endpoint** que la emisión normal:

#### `POST /Api/Documento`

La diferencia está en el body:
- `TipoDTE`: siempre `"61"`
- Se agrega el campo `Referencia` apuntando al documento original
- Para documentos exentos, cada ítem lleva `"IndExe": "1"`

**Body ejemplo (NC total que anula Boleta folio 100):**
```json
{
  "Sistema": {
    "nombre": "D-PAY Mobile",
    "rut": "98765432-1",
    "usuario": "mi_usuario",
    "clave": "bWlfY2xhdmU="
  },
  "Documento": {
    "Encabezado": {
      "IdDoc": {
        "TipoDTE": "61",
        "Folio": "0",
        "FchEmis": "2026-05-05",
        "FchVenc": "2026-05-05",
        "FmaPago": "1",
        "FmaPagEx": "Tarjeta de Débito"
      },
      "Emisor": { ... },
      "Receptor": { ... },
      "Totales": {
        "MntNeto": "8403",
        "MntExe": "0",
        "TasaIVA": "19",
        "IVA": "1597",
        "MntTotal": "10000"
      }
    },
    "Detalle": [ ... ],
    "Referencia": [
      {
        "NroLinRef": "1",
        "TpoDocRef": "39",
        "FolioRef": "100",
        "CodRef": "1",
        "RazonRef": "Anula documento total",
        "FchRef": "2026-05-04"
      }
    ]
  }
}
```

#### `CodRef` — Código de referencia SII

| Valor | Significado |
|-------|-------------|
| `"1"` | Anulación total del documento |
| `"3"` | Corrección de monto (NC parcial) |

#### Detalle para NC de documentos exentos

Si el documento original es TipoDTE 34 o 41 (exento), cada ítem del Detalle debe incluir:
```json
{ ..., "IndExe": "1" }
```

Para NC de documentos afectos (33, 39), el Detalle se construye igual que una Factura (precios netos, sin `IndExe`).

**Response:** Igual que la emisión normal, más el campo `referencia` con info del documento anulado:
```json
{
  "status": "success",
  "folio": 50,
  "id_documento": 10001,
  "referencia": {
    "tipoDocRef": 39,
    "nombreDocRef": "Boleta Electrónica",
    "folioRef": 100,
    "fechaRef": "2026-05-04",
    "razonRef": "Anula documento total",
    "codigoRef": 1
  }
}
```

---

## 5. Flujo completo de una venta

```
┌─────────────────────────────────────────────────────────────────┐
│  1. USUARIO crea venta                                          │
│     Items + Cliente (opcional) + TipoDTE                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. TUU procesa el pago (Bluetooth)                            │
│     Devuelve: last4="****1234", authCode, paymentType, tip...  │
│     Extraer dígitos: .replace(/\*/g, '').slice(-4) → "1234"   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           │ TipoDTE ≠ 0                   │ TipoDTE = 0
           │ (emite DTE)                   │ (solo comprobante)
           ▼                               ▼
┌──────────────────────┐       ┌──────────────────────────────┐
│  3. emitDocument()   │       │  3. Registrar transacción    │
│  POST /Api/Documento │       │  POST /pos/transaccion       │
│  ← folio             │       │  (sin DTE vinculado)         │
│  ← id_documento      │       └──────────────────────────────┘
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. registrarTransaccionTuu()                                   │
│  POST /pos/transaccion                                          │
│  (incluye tipo_dte, folio_dte, id_documento del paso 3)        │
│  ← id de la transacción creada                                 │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  5. vincularDteATransaccion()                                   │
│  PUT /pos/transaccion/{id}/dte                                  │
│  { tipo_dte, folio_dte, id_documento }                         │
└──────────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  6. Imprimir voucher de pago + DTE (ESC/POS Bluetooth)         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Cambio de entorno (QA ↔ PROD)

La app tiene **tres entornos**:

| Entorno | REST API | PHP emisión |
|---------|----------|-------------|
| Producción | `pro.dtemite.cl/api` | `sistema.dtemite.cl` |
| QA | `proqa.dtemite.cl/api` | *(misma URL en QA)* |

Para cambiar de entorno hay que tocar **dos archivos**:

### `src/services/apiClient.ts` — línea 6
```typescript
// PRODUCCIÓN:
const API_BASE_URL = 'https://pro.dtemite.cl/api';

// QA:
// const API_BASE_URL = 'https://proqa.dtemite.cl/api';
```

### `src/services/api.ts` — funciones `emitDocument` y `emitCreditNote`
```typescript
// Buscar las dos llamadas fetch() hardcodeadas:

// PRODUCCIÓN:
'https://sistema.dtemite.cl/sistema/Backend/WsMaster/ApiIntegracionController.php/Api/Documento'

// QA:
// 'https://proqa.dtemite.cl/api/Documento'
```

---

## 7. Consideraciones y errores frecuentes

### Auth

| Problema | Causa | Solución |
|----------|-------|----------|
| `401 Unauthorized` en endpoints REST | Token expirado o mal formado | Volver a hacer login, regenerar token |
| `bearer` vs `Bearer` | El servidor espera minúscula | Siempre usar `bearer` (minúscula) |
| Error "contraseña codificada no encontrada" | `b64pass` nulo en store | El usuario debe cerrar sesión y volver a entrar |

### Emisión DTE

| Problema | Causa | Solución |
|----------|-------|----------|
| IVA incorrecto en el SII | Precios enviados como bruto en Factura | Dividir por 1.19 para obtener neto |
| `Folio ya utilizado` | Se envió un folio específico | Siempre enviar `"0"` — el servidor asigna |
| NC rechazada | `IndExe` faltante en ítems de doc exento | Agregar `"IndExe": "1"` a cada ítem del Detalle |
| `Adicional` ignorado | Se puso dentro de `Documento` | Debe ir al **nivel raíz** del JSON |
| Folio no viene en respuesta | El servidor lo incluye en `Mensaje` | Parsear con regex: `/folio[:\s]*(\d+)/i` |

### Transacciones TUU

| Problema | Causa | Solución |
|----------|-------|----------|
| `ultimos_digitos` guardado como `****` | SDK TUU devuelve `"****1234"` | `.replace(/\*/g, '').slice(-4)` |
| `id_mediopago` incorrecto | TUU devuelve 1/2, BD espera 101/104 | `mapTuuMethodToMedioPago(tuuMethod)` |
| Transacción sin DTE vinculado | Fallo de red al emitir DTE | `mySalesStore` reintenta la sincronización |

### Clientes

| Problema | Causa | Solución |
|----------|-------|----------|
| Cliente sin nombre | Backend usa `razon` no `name` | Normalizar: `razon \|\| razon_social \|\| name \|\| nombre` |
| Campos enteros rechazados | Se omiten en lugar de null | Enviar `null` explícito para `id_region`, `id_provincia`, etc. |

### Datos geográficos

| Problema | Causa | Solución |
|----------|-------|----------|
| Provincias no filtradas | El endpoint devuelve todas las del país | Filtrar localmente por `id_region` |

---

*Última actualización: mayo 2026 — basado en el código de `src/services/api.ts` y `src/services/apiClient.ts`*
