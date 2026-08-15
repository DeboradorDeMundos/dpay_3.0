# Postman — Payment Hub D-PAY (desarrollo)

## Importar

| Uso | Archivo |
|-----|---------|
| **Personal dev** | `D-PAY-PaymentHub-Personal-Dev.postman_collection.json` |

No hay Environment aparte: `api_key`, `merchant_rut`, terminal, etc. están en **Variables de la colección** (Edit → Variables).

La colección para **integradores** y la guía pública están en el repo **web-dpay** (`docs/postman/`).

## Regenerar (solo colección personal)

```powershell
node docs/postman/generate-postman-collections.js
```
