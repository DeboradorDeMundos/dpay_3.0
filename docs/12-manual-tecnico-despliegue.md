# Manual Técnico y Despliegue — D-PAY 3.0

**Capstone APT122 · Duoc UC · 2026-2**

---

## 1. Arquitectura de despliegue

D-PAY es el **POS móvil** de DTemite: una APK Android que consume la plataforma cloud de la empresa. El Capstone no despliega el ERP.

```
[Dispositivo Android + APK D-PAY]
        │ HTTPS
        ▼
[DTemite Cloud — pro.dtemite.cl / proqa.dtemite.cl]
        │
        ├── REST API (bearer token)
        ├── Legacy PHP (DTE → SII)
        └── Payment Hub (opcional)
        │
        ▼
[TUU Negocio en Kozen · impresora Bluetooth]
```

---

## 2. Requisitos del entorno de desarrollo

| Componente | Versión mínima |
|---|---|
| Windows 10/11 o macOS | — |
| Node.js | 18+ (recomendado 20 LTS) |
| npm | 9+ |
| JDK | 17 o 21 |
| Android Studio | 2023+ |
| Android SDK | API 35, minSdk 24 |
| Git | Reciente |
| Docker Desktop (opcional) | Para entorno dev reproducible |

### Hardware recomendado

- **Desarrollo general:** smartphone Android 10+ o emulador
- **Pruebas TUU:** terminal Kozen P8 Neo (armeabi-v7a)
- **Impresión:** impresora Bluetooth ESC/POS (opcional)

---

## 3. Instalación paso a paso (host)

### 3.1 Clonar repositorio

```powershell
git clone https://github.com/DeboradorDeMundos/dpay_3.0.git
cd dpay_3.0/codigo
```

### 3.2 Dependencias Node

```powershell
npm install
```

### 3.3 Variables de entorno

```powershell
Copy-Item .env.example .env
# Completar .env con lo indicado en .env.example (nunca commitear secretos)
```

**Nunca commitear** `.env`, `android/keystore.properties`.

### 3.4 Keystore release (opcional)

```powershell
Copy-Item android\keystore.properties.example android\keystore.properties
# Completar valores locales para firmar APK
```

### 3.5 Ejecutar en desarrollo

```powershell
# Terminal 1 — Metro
npm start

# Terminal 2 — dispositivo USB
adb devices
adb reverse tcp:8081 tcp:8081
npm run android
```

En modo debug (`__DEV__`), la API apunta automáticamente a **QA**: `https://proqa.dtemite.cl/api`

### 3.6 Generar APK release

```powershell
npm run build:apk
# Salida: android/app/build/outputs/apk/release/
```

Release usa API **producción**: `https://pro.dtemite.cl/api`

---

## 4. Docker — entorno de desarrollo reproducible

> La guía Capstone exige Dockerfile y docker-compose. En proyectos **mobile**, el contenedor estandariza **herramientas Node** (lint, CI); la compilación Android requiere SDK en el host.

### 4.1 Levantar contenedor dev

Desde la raíz del repo:

```powershell
cd dpay_3.0
docker compose run --rm dev-tools
```

Ejecuta: `npm ci` + `npm run lint` en entorno Node 20 aislado.

### 4.2 Archivos

| Archivo | Propósito |
|---|---|
| `docker-compose.yml` | Servicio `dev-tools` |
| `docker/Dockerfile.dev` | Imagen Node 20 slim |
| `codigo/.env.example` | Plantilla variables (montada como referencia) |

### 4.3 Variables de entorno (`.env`)

| Variable | Descripción | Obligatorio |
|---|---|---|
| `WEBPAY_COMMERCE_CODE` | Código comercio sandbox Transbank | Sprint 2+ |
| `WEBPAY_API_KEY` | API Key integración | Sprint 2+ |
| `WEBPAY_ENV` | `integration` | Sprint 2+ |

Las credenciales DTemite QA se obtienen del PO (José Robles Rocha).

---

## 5. Configuración de entornos

| Modo | API REST | Legacy DTE | TUU |
|---|---|---|---|
| Debug (Metro) | proqa.dtemite.cl | sistema.dtemite.cl | Producción |
| Release (APK) | pro.dtemite.cl | sistema.dtemite.cl | Producción |

Archivos clave:
- `codigo/src/services/apiClient.ts` — base URL REST
- `codigo/src/services/api.ts` — URLs emisión DTE

Ver también: `codigo/CONFIGURACION_ENTORNOS.md`

---

## 6. Scripts disponibles

```powershell
npm start              # Metro bundler
npm run start:reset    # Metro caché limpia
npm run android        # Build + run en dispositivo
npm run build:apk      # APK release universal (Kozen + arm64)
npm run build:apk:pos  # Solo arm64 (no usar en Kozen P8)
npm run lint           # ESLint
npm test               # Jest
```

Scripts PowerShell adicionales en `codigo/scripts/`:
- `build-release.ps1` — bundle JS + APK
- `dev-pos.ps1` — entorno POS automatizado

---

## 7. Backend DTemite (externo al repo)

El backend **no se despliega desde este repositorio**. Repositorio separado: `nuevodtemite`.

Endpoints principales consumidos por D-PAY:

| Método | Ruta | Uso |
|---|---|---|
| POST | `/login` | Autenticación |
| GET | `/producto` | Catálogo |
| POST | `/pos/transaccion` | Registro tbl_dpay |
| POST | `/Api/Documento` (legacy) | Emisión DTE |

Documentación: `codigo/ENDPOINTS_DTEMITE.md`

---

## 8. Troubleshooting

| Problema | Solución |
|---|---|
| Metro no conecta | `adb reverse tcp:8081 tcp:8081` |
| 401 API | Re-login; verificar token bearer minúscula |
| NC falla | Regenerar b64pass (cerrar sesión y entrar con contraseña) |
| TUU no abre | Verificar app TUU instalada en Kozen |
| APK no instala en Kozen | Usar build universal, no solo arm64 |

---

## 9. Checklist pre-entrega Semana 15

- [ ] APK firmada en `fase2/entrega-final/`
- [ ] Tag Git `v3.0.0-capstone`
- [ ] README raíz actualizado
- [ ] `.env.example` sin secretos reales
- [ ] `docker compose run dev-tools` exitoso

---

**Revisión:** v1.0 — 29 agosto 2026
