# DOC-05 — Manual técnico de ejecución

Fecha: 2026-09-26. No usa Docker. El repo de verdad es `dpay_3.0`. La copia que compila Android es `C:\dpay`, actualizada con `scripts/sync-build-copy.ps1` o copiando los archivos tocados.

## Proxy

```powershell
cd C:\dpay\webpay-proxy
copy .env.example .env
npm start
```

Queda en `http://127.0.0.1:8787`. Salud: `GET /health` → `{"ok":true,"provider":"sim"}`.

Variables (ver `.env.example`):

| Variable | Uso |
|---|---|
| `PORT` | 8787 |
| `PROVIDER` | `sim` para la demo. `webpayplus` llama a la integración Transbank. `chimuelo` exige `CHIMUELO_TOKEN`. |
| `PUBLIC_BASE_URL` | URL que el checkout y Transbank usan para volver al proxy |
| `APP_RETURN_SCHEME` | `dtemitepos://payments/webpay/return` |
| `TBK_API_KEY_ID` / `TBK_API_KEY_SECRET` | Códigos públicos de integración. No son la llave del comercio en producción. |
| `PROXY_API_TOKEN` | Vacío en QA de LAN. Si tiene valor, la app debe enviarlo. |
| `SQLITE_PATH` | `./data/webpay_payments.sqlite` |

Pruebas del proxy: `npm test` dentro de `webpay-proxy`.

## App en el Honor (USB)

El teléfono y el PC no necesitan la misma WiFi. `dev-mobile.ps1` instala la app y hace `adb reverse` de Metro (8081) y del proxy (8787).

```powershell
cd C:\dpay\codigo
npm run dev:mobile -- -DeviceId "AFMGBB6413102097"
```

## App en emulador

Hace falta el paquete `emulator` del SDK y un AVD. Este PC, al 2026-09-26, tiene el SDK pero no el emulador ni un AVD.

```powershell
cd C:\dpay\codigo
npm run dev:emulator
```

El emulador ve el proxy como `http://10.0.2.2:8787`. No usa `adb reverse`.

## Datos móviles

Definir `WEBPAY_PROXY_PUBLIC_URL` con un HTTPS alcanzable desde la red del operador. `127.0.0.1` y `192.168.x` no sirven fuera de la LAN.
