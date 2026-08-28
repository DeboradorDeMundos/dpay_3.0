# DTemite — Integración core (documentos, productos, clientes)

> Referencia técnica de endpoints y servicios de DTemite para emisión de DTEs, consulta de documentos, visualización de PDFs, gestión de productos, clientes y folios (CAFs). No incluye terminales de pago.

---

## Tabla de contenidos

1. [Arquitectura y URLs](#1-arquitectura-y-urls)
2. [Autenticación](#2-autenticación)
3. [Productos / Catálogo](#3-productos--catálogo)
4. [Clientes](#4-clientes)
5. [Datos geográficos](#5-datos-geográficos)
6. [CAFs — Folios autorizados](#6-cafs--folios-autorizados)
7. [Emitir documento DTE](#7-emitir-documento-dte)
8. [Emitir Nota de Crédito](#8-emitir-nota-de-crédito)
9. [Historial de documentos](#9-historial-de-documentos)
10. [Visualizar PDF de un documento](#10-visualizar-pdf-de-un-documento)
11. [TED — Timbre electrónico local](#11-ted--timbre-electrónico-local)
12. [Generar PDF local (HTML)](#12-generar-pdf-local-html)
13. [Tabla de tipos de documento](#13-tabla-de-tipos-de-documento)
14. [Consideraciones y errores frecuentes](#14-consideraciones-y-errores-frecuentes)

---

## 1. Arquitectura y URLs

DTemite expone **dos sistemas** con URLs y mecanismos de auth distintos:

| Sistema | URL base | Para qué |
|---------|----------|----------|
| **REST API** | `https://pro.dtemite.cl/api` | Login, productos, clientes, CAFs, documentos, PDF |
| **Legacy PHP** | `https://sistema.dtemite.cl/sistema/Backend/WsMaster/ApiIntegracionController.php` | Emisión de DTEs al SII |

La REST API se configura en **un solo lugar** (`apiClient.ts`):
```typescript
// src/services/apiClient.ts
const API_BASE_URL = 'https://pro.dtemite.cl/api';   // PRODUCCIÓN
// const API_BASE_URL = 'https://proqa.dtemite.cl/api'; // QA
```

El endpoint Legacy PHP se llama directamente con `fetch()` desde `api.ts` (hay que cambiarlo manualmente al cambiar de entorno).

---

## 2. Autenticación

### `POST /api/login`

No requiere ningún header de autorización.

**Request:**
```json
{
  "rut": "12345678-9",
  "usuario": "mi_usuario",
  "password": "mi_clave"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": "mi_usuario",
  "nombre": "Juan Pérez",
  "sistema": "MI_SISTEMA",
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

**Cómo usar el token en peticiones siguientes:**

```http
Authorization: bearer eyJhbGci...
               ^^^^^^
               Minúscula — el servidor rechaza "Bearer" (mayúscula)
```

**El campo `sistema`** es el identificador del cliente dentro de DTemite. Se usa para construir la URL del PDF (ver sección 10).

**⚠️ `b64pass`:** La app guarda adicionalmente la clave en base64 en el store (`authStore.b64pass`). Esta contraseña codificada se envía como campo `clave` en el sistema Legacy PHP para emitir DTEs. Es **distinta** al JWT. Si el usuario cierra sesión, se regenera en el próximo login.

---

## 3. Productos / Catálogo

### `GET /producto`

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
    "activo": true,
    "giro": "Comercio",
    "nombreBodega": "BODEGA_PRINCIPAL"
  }
]
```

> Los precios que devuelve el catálogo **incluyen IVA**. Al construir el detalle de una Factura Electrónica (TipoDTE=33), hay que dividir por 1.19 para obtener el neto. Ver sección 7.

---

## 4. Clientes

> **Inconsistencia de rutas en el backend:** el listado usa `/cliente` pero las operaciones individuales usan `/dpay/cliente`.

### `GET /cliente`

Lista todos los clientes de la empresa autenticada.

**Response:** Array. Los nombres de campos pueden variar (`razon` o `razon_social`, `direccion` o `address`) — normalizar al recibir.

```json
[
  {
    "id": 5,
    "rut": "11111111-1",
    "razon": "Cliente Ejemplo Ltda",
    "giro": "Servicios",
    "email": "cliente@ejemplo.cl",
    "telefono": "+56912345678",
    "direccion": "Av. Principal 742",
    "comuna": "Providencia",
    "id_region": 13,
    "id_provincia": 131,
    "id_comuna": 13101,
    "activo": true
  }
]
```

---

### `GET /dpay/cliente/{rutEmpresa}/{clientId}`

Detalle de un cliente específico.

**Parámetros en URL:**
- `rutEmpresa` — RUT de la empresa autenticada (ej: `98765432-1`)
- `clientId` — ID del cliente

**Response:** Objeto cliente, o `{ "error": true, "mensaje": "..." }`.

---

### `POST /dpay/cliente`

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

> Los campos enteros opcionales deben enviarse como `null` explícito, no omitirse, para que la BD los trate correctamente.

**Response exitosa:**
```json
{ "id": 42, "mensaje": "Cliente creado correctamente" }
```

**Response de error:**
```json
{ "error": true, "mensaje": "El RUT ya existe" }
```

---

### `PUT /dpay/cliente/{clientId}`

Actualiza un cliente existente. Mismo body que el POST, todos los campos opcionales excepto `rut_empresa`.

---

## 5. Datos geográficos

Para poblar selectores de región / provincia / comuna en formularios.

### `GET /auxiliares/Regiones`

```json
[
  { "id_region": 13, "nombre_region": "Metropolitana de Santiago" },
  { "id_region": 5,  "nombre_region": "Valparaíso" }
]
```

La respuesta puede venir directo como array o dentro de `data.regiones`. Manejar ambos casos.

---

### `GET /auxiliares/Provincia`

⚠️ **Devuelve TODAS las provincias del país.** El filtrado por región se hace en el cliente:

```json
[
  { "id_provincia": 131, "nombre_provincia": "Santiago", "id_region": 13 },
  { "id_provincia": 132, "nombre_provincia": "Cordillera", "id_region": 13 },
  { "id_provincia": 51,  "nombre_provincia": "Valparaíso", "id_region": 5 }
]
```

```typescript
// Filtrar en el cliente:
const provinciasDeLaRegion = todas.filter(p => p.id_region === idRegionSeleccionada);
```

---

### `GET /auxiliares/Comunas/{idProvincia}`

Comunas de una provincia específica.

```json
[
  { "id_comuna": 13101, "nombre_comuna": "Santiago",  "id_provincia": 131 },
  { "id_comuna": 13102, "nombre_comuna": "Cerrillos", "id_provincia": 131 }
]
```

---

## 6. CAFs — Folios autorizados

### `GET /folios/caf`

Retorna los Códigos de Autorización de Folios (CAFs) vigentes de la empresa. Son los documentos XML firmados por el SII que autorizan el uso de rangos de folios por tipo de documento.

**Response:**
```json
[
  {
    "id_ctrl_folio": 1,
    "id_td": 39,
    "nom_archivocaf": "<AUTORIZACION>...(XML completo)...</AUTORIZACION>",
    "rsask": "-----BEGIN RSA PRIVATE KEY-----\nMIIEo...",
    "rango_desde": 1,
    "rango_hasta": 500,
    "activo": true
  }
]
```

| Campo | Descripción |
|-------|-------------|
| `id_td` | Tipo de documento al que aplica (33, 39, 41, etc.) |
| `nom_archivocaf` | XML del CAF completo. Contiene la clave pública del SII y los datos del rango de folios |
| `rsask` | Clave privada RSA (Base64) del par de claves creado al solicitar el CAF. Necesaria para firmar el TED localmente |
| `rango_desde / rango_hasta` | Rango de folios autorizados por el SII |
| `activo` | `true` = puede usarse |

**Uso en esta app:**
- Los CAFs se cachean en `cafStore` al iniciar sesión
- Al emitir un DTE, el folio siempre se envía como `"0"` — el servidor asigna el folio real desde el CAF
- Los CAFs también se usan localmente para generar el TED/PDF417 (ver sección 11)

---

## 7. Emitir documento DTE

### `POST /Api/Documento`

**URL completa:**
```
https://sistema.dtemite.cl/sistema/Backend/WsMaster/ApiIntegracionController.php/Api/Documento
```

**⚠️ Sin header Authorization** — la autenticación va dentro del JSON en el campo `Sistema.clave`.

**Headers:**
```
Content-Type: application/json
```

---

### Body completo

```json
{
  "Sistema": {
    "nombre": "NOMBRE_DEL_SISTEMA",
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
        "FmaPagEx": "Efectivo"
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
      { "valor": "Nota extra: texto libre" }
    ]
  }
}
```

---

### Descripción de cada sección

#### `Sistema`

| Campo | Obligatorio | Descripción |
|-------|:-----------:|-------------|
| `nombre` | ✅ | Nombre del sistema (campo `usuario.sistema` del login) |
| `rut` | ✅ | RUT de la empresa emisora |
| `usuario` | ✅ | Usuario de acceso |
| `clave` | ✅ | **Contraseña en Base64** (campo `b64pass` guardado en el login) |
| `bodega` | — | Código de bodega/sucursal (ej: `"01"`) |

#### `IdDoc`

| Campo | Descripción |
|-------|-------------|
| `TipoDTE` | Tipo de documento — ver [tabla completa](#13-tabla-de-tipos-de-documento) |
| `Folio` | Siempre `"0"` — el servidor asigna el folio real del CAF |
| `FchEmis` | Fecha de emisión `YYYY-MM-DD` |
| `FchVenc` | Fecha de vencimiento `YYYY-MM-DD` (mismo día en ventas al contado) |
| `FmaPago` | `"1"` Contado · `"2"` Crédito · `"3"` Sin Costo |
| `FmaPagEx` | Glosa de forma de pago (texto libre, ej: `"Efectivo"`, `"Tarjeta de Débito"`) |

#### `Receptor`

Para ventas sin cliente identificado usar:
```json
{ "RUTRecep": "66666666-6", "RznSocRecep": "PUBLICO GENERAL" }
```

#### `Totales`

Los montos dependen del tipo de documento:

| TipoDTE | `MntNeto` | `MntExe` | `IVA` |
|---------|-----------|----------|-------|
| 33 (Factura) | `round(total × 19/119)` extraído del total | `0` | `total - neto` |
| 34 (Fact. Exenta) | `0` | `total` | `0` |
| 39 (Boleta) | `round(total × 19/119)` | `0` | `total - neto` |
| 41 (Bol. Exenta) | `0` | `total` | `0` |

#### `Detalle` — precios según tipo de documento

⚠️ **Esta es la regla más crítica.** Enviar el precio equivocado genera IVA incorrecto ante el SII.

| TipoDTE | `PrcItem` / `MontoItem` | Cómo calcularlo |
|---------|------------------------|-----------------|
| **33** (Factura) | **Neto** — sin IVA | `Math.round(precioConIVA / 1.19)` |
| **34** (Fact. Exenta) | Bruto sin cambio | `precio` |
| **39** (Boleta) | **Bruto** — IVA incluido | `precio` (sin modificar) |
| **41** (Bol. Exenta) | Bruto sin cambio | `precio` |

> La boleta muestra el precio final al consumidor (IVA ya incluido), por eso se envía tal cual. La factura desglosa el neto + IVA por separado.

#### `CodBodega`

Va dentro de **cada ítem** del Detalle (no en `Sistema`). Permite al backend descontar stock de la bodega correcta:
```json
{ "NroLinDet": "1", ..., "CodBodega": "BODEGA_PRINCIPAL" }
```

#### `Adicional`

Campo **opcional** para información extra. Va al **nivel raíz** del JSON — al mismo nivel que `Documento`, **NO** adentro de él. El backend PHP asigna automáticamente A1, A2... al iterar `NodosA`:

```json
{
  "Sistema": { ... },
  "Documento": { ... },
  "Adicional": {
    "NodosA": [
      { "valor": "Propina: $500" },
      { "valor": "Otro dato: valor" }
    ]
  }
}
```

---

### Response

**Exitosa (HTTP 200):**
```json
{
  "status": "success",
  "Mensaje": "Documento emitido con folio 1234",
  "folio": 1234,
  "id_documento": 9876,
  "ted": "<TED>...(XML del timbre electrónico)...</TED>",
  "pdf": "JVBERi0xLjQ...(base64 opcional)",
  "xml": "<?xml version='1.0'...>"
}
```

> El folio puede llegar en distintas claves: `result.folio`, `result.Folio`, `result.data.folio`. Si ninguna, intentar parsearlo desde `result.Mensaje` con regex `/folio[:\s]*(\d+)/i`.

**Error (el servidor puede responder HTTP 200 aunque haya fallo):**
```json
{
  "status": "error",
  "Mensaje": "Error: RUT emisor inválido"
}
```

> Siempre verificar `result.status === 'error'` o `result.error` además del HTTP status code.

**Caso especial:** Si el servidor responde con el texto `"Documento ya registrado"`, el documento ya existe — tratar como éxito.

---

## 8. Emitir Nota de Crédito

Usa **el mismo endpoint** que la emisión normal:
```
POST /Api/Documento
```

Diferencias respecto a un DTE normal:
1. `TipoDTE` siempre es `"61"`
2. Se agrega el array `Referencia` apuntando al documento que se anula/corrige
3. Para documentos originales exentos (34, 41), cada ítem del Detalle lleva `"IndExe": "1"`

### Body de ejemplo (NC total que anula Boleta folio 100)

```json
{
  "Sistema": {
    "nombre": "MI_SISTEMA",
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
        "FmaPago": "1"
      },
      "Emisor": { "...": "igual que siempre" },
      "Receptor": { "...": "mismo receptor que el documento original" },
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
        "CdgItem": { "TpoCodigo": "INT1", "VlrCodigo": "PROD001" },
        "NmbItem": "Producto X",
        "QtyItem": "2",
        "PrcItem": "4202",
        "MontoItem": "8403"
      }
    ],
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

### Campo `CodRef`

| Valor | Significado |
|-------|-------------|
| `"1"` | Anulación total del documento |
| `"3"` | Corrección de monto (NC parcial — requiere items con los montos a corregir) |

### NC de documentos exentos

Si el TipoDTE original es 34 o 41, agregar `"IndExe": "1"` en cada ítem:
```json
{ "NroLinDet": "1", ..., "IndExe": "1" }
```

Si el original es afecto (33, 39), los ítems se construyen igual que para una Factura (precios netos, sin `IndExe`).

### Response

Igual que la emisión normal, más el campo `referencia`:
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

## 9. Historial de documentos

### `POST /dpay/documentos`

Lista los documentos emitidos en un rango de fechas para la empresa autenticada.

**Headers:**
```
Authorization: bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "rut_empresa": "98765432-1",
  "usuario": "mi_usuario",
  "fecha_desde": "01-05-2026",
  "fecha_hasta": "05-05-2026"
}
```

> **Formato de fechas:** `DD-MM-YYYY` — no usar formato ISO.

**Response:** La respuesta puede venir como array directo, `{ data: [...] }` o `{ resultado: [...] }`. Manejar los tres casos.

Campos principales de cada documento:
```json
{
  "id_documento": 9876,
  "folio": 1234,
  "tipo_documento": "Boleta Electrónica",
  "fecha_creacion": "2026-05-05T10:30:00",
  "montototal": 10000,
  "anulado": false,
  "folio_nc_anulacion": null,
  "ted": "<TED>...</TED>"
}
```

---

### `POST /dpay/documento`

Detalle completo de un documento, incluyendo el desglose de ítems.

**Body:**
```json
{
  "id_documento": 9876,
  "rut_empresa": "98765432-1"
}
```

**Response:**
```json
{
  "id_documento": 9876,
  "folio": 1234,
  "tipo_documento": "Boleta Electrónica",
  "fecha_emision": "2026-05-05",
  "fecha_creacion": "2026-05-05T10:30:00",
  "rut_cliente": "11111111-1",
  "razon_social": "Juan Pérez",
  "direccion": "Av. Siempreviva 742",
  "email": "juan@mail.cl",
  "monto_neto": 8403,
  "monto_exento": 0,
  "montoiva": 1597,
  "montototal": 10000,
  "anulado": false,
  "ted": "<TED>...</TED>",
  "sistema": "MI_SISTEMA",
  "detalle": [
    {
      "numero_linea": 1,
      "cod_producto": "PROD001",
      "descripcion_prod": "Producto X",
      "cantidad": 2,
      "precio_unitario": 4202,
      "descuento": 0,
      "recargo": 0,
      "total": 8403,
      "bodega": "BODEGA_PRINCIPAL",
      "afecto": 1
    }
  ]
}
```

---

## 10. Visualizar PDF de un documento

### `GET /api/pdfview/O/{md5Sistema}/{md5IdDocumento}`

Endpoint proxy que genera el PDF a través del WebService de DTemite y devuelve un **redirect 301** a la URL real del archivo. El cliente debe seguir el redirect.

**URL:** `https://pro.dtemite.cl/api/pdfview/O/{md5(sistema)}/{md5(id_documento)}`

Los parámetros van como **hash MD5** del valor original:

```typescript
import md5 from 'md5';

const sistema      = "MI_SISTEMA";   // campo 'sistema' del usuario o del documento
const idDocumento  = 9876;

const url = `https://pro.dtemite.cl/api/pdfview/O/${md5(sistema)}/${md5(String(idDocumento))}`;
// → "https://pro.dtemite.cl/api/pdfview/O/a1b2c3.../d4e5f6..."
```

**No requiere Authorization header** — la autenticación está implícita en los parámetros hasheados.

**Cómo obtener `sistema`:** viene del campo `usuario.sistema` del login. También puede llegar en el objeto de documento (`documento.sistema` o `documento.dpay_sistema`).

**Cómo obtener `id_documento`:** es el `id_documento` devuelto por el endpoint de emisión o por los endpoints de historial.

**Uso en la app (React Native):**

```typescript
// Opción A: Abrir en browser externo
import { Linking } from 'react-native';
await Linking.openURL(pdfProxyUrl);

// Opción B: Descargar y mostrar inline con react-native-pdf
import ReactNativeBlobUtil from 'react-native-blob-util';
const res = await ReactNativeBlobUtil.config({ fileCache: true, appendExt: 'pdf' })
  .fetch('GET', pdfProxyUrl);
const localPath = res.path();
// → pasar localPath al componente <Pdf source={{ uri: 'file://' + localPath }} />
```

---

## 11. TED — Timbre electrónico local

El TED (Timbre Electrónico DTE) es el código PDF417 que aparece en boletas y facturas impresas. Puede generarse de dos formas:

**a) Desde el servidor:** el endpoint de emisión devuelve `result.ted` con el XML del TED ya firmado.

**b) Localmente (offline):** la app puede generarlo con el CAF y la clave RSA:

```
CAF (rango de folios + clave pública SII)
  + Datos del documento (folio, monto, RUT receptor, fecha)
  + Clave privada RSA del CAF
  ──────────────────────────────────────────────────────
  → DD (Documento Descriptor) en XML
  → Firma del DD con SHA1withRSA (jsrsasign)
  → TED XML completo
  → Convertir a imagen PDF417
```

La app usa `src/services/ted.ts` + `src/services/signDD.ts` + `src/utils/PDF417Generator.ts` para todo el proceso.

**Campos del DD que se firman:**
```
RUTEmisor · TipoDTE · Folio · FechaEmisión · RUTReceptor · RazonSocialReceptor · MontoTotal · PrimerItem
```

> El TED del servidor y el TED local deben ser equivalentes. Si el servidor devuelve el TED en la respuesta de emisión, se usa ese directamente (es el canónico del SII).

---

## 12. Generar PDF local (HTML)

Cuando el PDF del servidor no está disponible (venta reciente sin sync, modo offline), la app genera el PDF localmente a partir de los datos de la venta usando `src/services/pdf.ts`.

**Proceso:**
1. `generateBoletaPDF(sale, settings, tedImageBase64)` → genera un string HTML con todos los datos del documento
2. `RNHTMLtoPDF.convert({ html, fileName, width, height })` → convierte el HTML a PDF en disco
3. El archivo resultante se muestra con el componente `<Pdf>` de `react-native-pdf`

**Datos de entrada para el PDF local:**

```typescript
interface InvoiceData {
  sale: { results: Array<{ name, code, count, value, total }> };
  ted: string;                          // XML del timbre (para renderizar PDF417)
  information: { empresa: { razon, rut, giro, direccion, comuna, telefono, email } };
  documentType: { id: number; name: string };
  folio: number;
  purchaseDate: string;                 // ISO: "2026-05-05T10:30:00"
  neto: number;
  exento: number;
  iva: number;
  total: number;
  propina?: number;
  cliente?: { rut: string; nombre: string };
}
```

**Settings personalizables (desde `settingsStore`):**

| Campo | Descripción |
|-------|-------------|
| `systemImage` | Logo en base64 (aparece en la cabecera del PDF) |
| `header1`–`header4` | Líneas de texto libre en la cabecera |
| `footer1`–`footer4` | Líneas de texto libre en el pie |
| `commentInvoice` | Comentario / observación al pie del documento |

---

## 13. Tabla de tipos de documento

| TipoDTE | Nombre oficial SII | IVA | Notas |
|---------|--------------------|-----|-------|
| `33` | Factura Electrónica | ✅ 19% | Precios en neto en el Detalle |
| `34` | Factura No Afecta o Exenta | ❌ | Sin IVA, `MntExe = total` |
| `39` | Boleta Electrónica | ✅ 19% | Precios brutos (IVA incluido) en el Detalle |
| `41` | Boleta No Afecta o Exenta | ❌ | Sin IVA, `MntExe = total` |
| `61` | Nota de Crédito Electrónica | Hereda del original | Requiere `Referencia` al doc original |

---

## 14. Consideraciones y errores frecuentes

### Autenticación

| Problema | Causa | Solución |
|----------|-------|----------|
| `401` en endpoints REST | Token expirado o mal formado | Volver a hacer login |
| `bearer` vs `Bearer` | El servidor espera minúscula | Siempre usar `bearer` (minúscula) |
| Error "contraseña codificada no encontrada" | `b64pass` nulo en store | El usuario debe cerrar sesión y volver a entrar |

### Emisión DTE

| Problema | Causa | Solución |
|----------|-------|----------|
| IVA incorrecto en el SII | Precios brutos enviados en una Factura | Dividir por 1.19 al construir el Detalle |
| Error de folio | Se envió un folio específico en lugar de `"0"` | Siempre enviar `"0"` |
| NC rechazada — monto exento incorrecto | `IndExe` faltante en ítems de doc exento | Agregar `"IndExe": "1"` a cada ítem del Detalle |
| Campo `Adicional` ignorado | Se puso dentro de `Documento` | Debe ir al nivel raíz del JSON |
| Folio no viene en la respuesta | El servidor lo incluye en `Mensaje` | Parsear con `/folio[:\s]*(\d+)/i` |
| HTTP 200 pero operación fallida | El PHP siempre devuelve 200 | Verificar `result.status` y `result.error` |

### Productos y clientes

| Problema | Causa | Solución |
|----------|-------|----------|
| Cliente sin nombre | Backend puede usar `razon` en lugar de `name` | Normalizar: `razon \|\| razon_social \|\| name \|\| nombre` |
| Campos enteros rechazados al crear cliente | Se omiten en lugar de `null` | Enviar `null` explícito para `id_region`, `id_provincia`, etc. |
| Provincias incorrectas | El endpoint devuelve todas las del país | Filtrar localmente por `id_region` |

### PDF

| Problema | Causa | Solución |
|----------|-------|----------|
| `pdfProxyUrl` es `null` | Falta `sistema` o `id_documento` | Verificar que el documento tenga ambos campos antes de construir la URL |
| PDF no carga | El redirect 301 no se sigue automáticamente | Usar `ReactNativeBlobUtil.fetch()` que sí sigue redirects, o `Linking.openURL()` |
| PDF local sin TED/PDF417 | El TED no fue generado o no llegó del servidor | Intentar generar el TED localmente con `generateTEDForSale()` antes de renderizar el PDF |

---

*Basado en el código fuente de `src/services/api.ts`, `apiClient.ts`, `pdf.ts`, `ted.ts`, `signDD.ts` y `screens/ViewInvoiceScreen.tsx` — mayo 2026.*
