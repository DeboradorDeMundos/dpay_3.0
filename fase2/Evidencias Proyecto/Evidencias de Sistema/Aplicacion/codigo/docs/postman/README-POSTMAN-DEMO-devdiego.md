# Demo Postman — sistema externo `devdiego`

Simula un **partner** que cobra en el POS D-PAY usando solo `X-Api-Key`.

## Archivos

| Archivo | Uso |
|---------|-----|
| `D-PAY-PaymentHub-devdiego.postman_collection.json` | Importar en Postman |
| `D-PAY-PaymentHub-devdiego.postman_environment.json` | Variables de entorno QA |

## Datos del entorno de prueba (devdiego)

| Variable | Valor | Notas |
|----------|-------|-------|
| `hub_base_url` | `https://proqa.dtemite.cl/api` | Mismo Hub que D-PAY debug |
| `merchant_rut` | `77000333-4` | Empresa Diego test |
| `sistema` | `devdiego` | Tenant DTemite |
| `terminal_code` | `caja-01` | Panel Admin → Terminales POS |
| `terminal_serial` | `60110B232561701920` | Serial hardware (confirmado vía API) |
| `device_fingerprint` | `3b95f422d863c90d` | Id. D-PAY en el POS |
| `demo_amount` | `15990` | CLP |

> Si `terminal_code` no coincide, ejecuta **Listar TODOS los terminales** y copia el código real al environment.

---

## Paso 0 — Crear integrador y API key (Admin DTemite)

Esto lo hace **una vez** alguien con acceso admin (no usa Postman partner).

### Opción A — Panel Admin POS (UI)

1. Crear integrador nombre: `devdiego` (o `Sistema externo demo`).
2. Copiar **`api_key`** (`dph_...`) — solo se muestra al crear o rotar.
3. Vincular integrador al cliente RUT **`77000333-4`**.
4. Verificar terminal **`6010B232561701920`** con **`external_payment_enabled = true`**.

### Opción B — API admin (sesión DTemite)

**Crear integrador:**

```http
POST https://pro.dtemite.cl/api/posadmin/integradores
Content-Type: application/json
Cookie: {sesión admin}

{
  "nombre": "devdiego",
  "webhook_url_default": "https://example.com/webhook"
}
```

Respuesta incluye `api_key` y `webhook_secret`.

**Vincular al merchant:**

```http
POST https://pro.dtemite.cl/api/posadmin/cliente/77000333-4/integradores
Content-Type: application/json
Cookie: {sesión admin}

{
  "nombre": "devdiego"
}
```

O con integrador ya creado:

```json
{ "partner_id": 1 }
```

---

## Paso 1 — Importar en Postman

1. Postman → **Import** → seleccionar los 2 JSON de esta carpeta.
2. Arriba a la derecha elegir environment **D-PAY Hub — devdiego (QA)**.
3. Editar variable **`api_key`** → pegar tu `dph_...`.
4. **Save**.

---

## Paso 2 — Preparar el POS

1. POS conectado (USB + scrcpy opcional).
2. D-PAY logueado (usuario `diegotest` / empresa devdiego).
3. **Configuración → Modo pasarela externa → ON**.
4. Ver en Settings: terminal **online**.

---

## Paso 3 — Ejecutar la demo (orden)

### Carpeta `00 — Pre-demo`

1. **Listar TODOS los terminales** → confirma API key OK.
2. **Listar terminales ONLINE** → debe aparecer al menos 1.
   - Si vacío: activar modo pasarela y esperar ~30 s (heartbeat).

### Carpeta `01 — Demo cobro simple`

3. **Crear cobro (payment_only)** → en ~5 s aparece en POS.
4. En el POS: Débito/Crédito → TUU → aprobar.
5. **Consultar intent por ID (poll)** → repetir hasta `status: succeeded`.
6. Opcional: **Consultar por external_id**.

### Carpeta `02 — Demo cobro con documento`

7. **Crear cobro (with_document)** → POS muestra líneas y cliente.

### Carpeta `03 — Cancelar cobro`

8. Crear un cobro, **no** pagar en POS → **Cancelar intent (partner)**.

---

## Qué mirar en cada respuesta

### Crear cobro — 200 OK

```json
{
  "success": true,
  "intent": {
    "id": 42,
    "status": "pending",
    "external_id": "DEVDIEGO-1719172800000",
    "amount": 15990,
    "terminal_code": "POS-C90D",
    "expires_at": "..."
  }
}
```

Postman guarda automáticamente `intent_id` y `external_id` en el environment.

### Poll — estados posibles

| status | Significado |
|--------|-------------|
| `pending` | Esperando POS |
| `claimed` | POS abrió pantalla |
| `processing` | TUU en curso |
| `succeeded` | ✅ Listo — ver `dpay_transaccion_id` |
| `failed` | Tarjeta rechazada |
| `cancelled` | Cancelado |
| `expired` | Venció (15 min default) |

### Éxito final

```json
{
  "success": true,
  "intent": {
    "status": "succeeded",
    "dpay_transaccion_id": 456,
    "completed_at": "..."
  }
}
```

---

## Errores frecuentes en la demo

| Respuesta | Causa | Solución |
|-----------|-------|----------|
| 401 `API Key no válida` | Key mal pegada o no creada | Recrear/rotar en admin |
| 403 `Partner no autorizado` | Integrador no vinculado al RUT | `POST .../integradores` al cliente |
| 403 `cobros externos` | Flag apagado | Admin POS → terminal → external_payment_enabled |
| 409 `desconectado` | POS offline | Modo pasarela ON + heartbeat |
| 409 `external_id` duplicado | Mismo ID activo | El prerequest genera ID único; si falla, cambiar manualmente |
| 404 terminal | `terminal_code` incorrecto | Listar terminales y corregir environment |

---

## Script rápido (sin Postman)

```powershell
$HUB = "https://proqa.dtemite.cl/api"
$KEY = "dph_TU_CLAVE"
$RUT = "77000333-4"
$CODE = "POS-C90D"
$EXT = "DEVDIEGO-$(Get-Date -Format 'yyyyMMddHHmmss')"

# Terminales online
curl.exe -s -G "$HUB/paymenthub/terminals" `
  -H "X-Api-Key: $KEY" `
  --data-urlencode "merchant_rut=$RUT" `
  --data-urlencode "status=online"

# Crear cobro
curl.exe -s -X POST "$HUB/paymenthub/intents" `
  -H "Content-Type: application/json" `
  -H "X-Api-Key: $KEY" `
  -d "{ `"merchant_rut`":`"$RUT`", `"sistema`":`"devdiego`", `"amount`":15990, `"terminal_code`":`"$CODE`", `"external_id`":`"$EXT`", `"description`":`"Demo`", `"metadata`":{ `"flow_type`":`"payment_only`" } }"
```

---

## Checklist reunión (5 min antes)

- [ ] `api_key` en Postman environment
- [ ] POS online (`Listar terminales ONLINE` > 0)
- [ ] scrcpy / POS visible para audiencia
- [ ] TUU `.dev` operativo
- [ ] Collection importada + environment seleccionado
- [ ] Tarjeta prueba TUU a mano

---

*Referencia API para integradores: repo `web-dpay` → `docs/payment-hub-integracion/DPAy-INTEGRACION-COBROS-EXTERNOS.md`*
