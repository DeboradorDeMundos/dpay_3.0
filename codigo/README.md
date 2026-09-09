# D-PAY — POS móvil de DTemite

[![React Native](https://img.shields.io/badge/React%20Native-0.75.5-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Android](https://img.shields.io/badge/Android-7.0%2B-3DDC84?style=flat-square&logo=android)](https://developer.android.com/)
[![Duoc UC](https://img.shields.io/badge/Duoc%20UC-San%20Bernardo-003366?style=flat-square)](https://www.duoc.cl/)

**Proyecto Capstone — Ingeniería en Informática**  
Duoc UC, Sede San Bernardo · 2026

**D-PAY** es el punto de venta móvil de DTemite: vender, cobrar y emitir **DTE** al SII desde un Android (celular o terminal Kozen). Stack: **React Native + TypeScript**.

La app se integra a la plataforma cloud de DTemite (API REST + Legacy PHP). Documentación del producto: [`../docs/00-ecosistema-dtemite.md`](../docs/00-ecosistema-dtemite.md).

---

## Equipo Capstone

| Integrante | Rol |
|---|---|
| **Diego Madrid** | Desarrollo / integración |
| **Pablo Gutiérrez** | Desarrollo / arquitectura |
| **Reinhartd Munzenmayer** | Desarrollo / QA |

**Institución:** Duoc UC — San Bernardo  
**Repositorio:** [github.com/DeboradorDeMundos/dpay_3.0](https://github.com/DeboradorDeMundos/dpay_3.0)

---

## Tabla de contenidos

- [Visión del proyecto](#visión-del-proyecto)
- [Modos de operación](#modos-de-operación)
- [Características implementadas](#características-implementadas)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Requisitos e instalación](#requisitos-e-instalación)
- [Desarrollo en dispositivo](#desarrollo-en-dispositivo)
- [Generar APK release](#generar-apk-release)
- [Anulación de documentos y pagos](#anulación-de-documentos-y-pagos)
- [Integración con backend](#integración-con-backend)
- [Seguridad del repositorio](#seguridad-del-repositorio)
- [Scripts disponibles](#scripts-disponibles)
- [Roadmap Capstone](#roadmap-capstone)
- [Documentación adicional](#documentación-adicional)
- [Licencia académica](#licencia-académica)

---

## Visión del proyecto

DTemite factura en la oficina (ERP web). **D-PAY** es el POS de bolsillo: el mismo comercio vende, cobra y emite DTE desde Android. El Capstone desarrolla ese producto completo:

1. **Autenticación** de comercio (tenant) y cajero
2. **Venta** con catálogo, calculadora y scanner
3. **Cobro** efectivo y tarjeta TUU (Kozen)
4. **Emisión DTE** (boleta, factura, NC)
5. **Historial**, sincronización y anulaciones
6. **Impresión** térmica Bluetooth

---

## Modos de operación

### Terminal POS Kozen (TUU / Haulmer)

Kozen P8 Neo con **TUU Negocio**. Cobro con tarjeta vía Intent Android. Crédito/débito/cuotas.

### Smartphone Android

Mismos flujos de venta y DTE. El cobro del producto es **efectivo**. Tarjeta en celular (Webpay, etc.) queda como mejora futura, no como objetivo del Capstone.

| Entorno | API |
|---|---|
| Metro / debug | `proqa.dtemite.cl` |
| APK release | `pro.dtemite.cl` |

---

## Características implementadas

### Autenticación y sesión
- Login con RUT chileno, usuario y contraseña
- PIN patrón 3×3 y biometría (huella; off en Kozen)
- Descarga inicial de CAFs, catálogo y clientes
- Token de sesión (bearer) persistente en MMKV

### Ventas
- Calculadora táctil integrada
- Catálogo con búsqueda y escaneo de código de barras (Vision Camera)
- Selección de tipo de documento (boleta, factura, comprobante, etc.)
- Métodos de pago: efectivo, crédito, débito
- Propina configurable
- Modo offline con sincronización posterior

### Documentos tributarios (DTE)
- Emisión de boletas y facturas electrónicas
- Notas de crédito (anulación total y corrección de monto)
- Firma digital SHA1withRSA y timbre TED (PDF417)
- PDF y compartir documento
- Integración con API legacy PHP del SII vía backend DTEmite

### Historial (`MySalesScreen`)
- Filtro por rango de fechas y tipo de documento
- Búsqueda por folio
- Documentos locales + documentos del servidor unificados
- Resumen de ventas del período
- Sincronización manual de ventas pendientes

### Anulación
- **Documentos tributarios:** emisión de Nota de Crédito (NC total o corrección)
- **Pagos sin DTE:** anulación vía API `PUT /pos/transaccion/{id}/anular`
- **Sin restricción por flag de login** (`permite_nota_credito`) — habilitado para pruebas Capstone
- Modal simplificado por defecto (NC total); modal extendido si `ncCorreccionMonto` está activo en ajustes

### Impresión
- Impresora térmica Bluetooth ESC/POS
- Impresión automática configurable (documento / voucher / ambos)
- Impresión de TED (código PDF417)

### Payment Hub (integraciones externas)
- Modo gateway para recibir pagos de sistemas externos
- Listener de intents de cobro remoto
- APIs documentadas en `docs/postman/`

### Configuración
- Logo de empresa, headers/footers de impresión
- Tipos de documento habilitados
- Métodos de pago globales
- Tema claro / oscuro
- Comisiones D-PAY

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | React Native 0.75.5 |
| Lenguaje | TypeScript 5.9.3 |
| Estado | Zustand 5 + MMKV |
| Navegación | React Navigation 7 |
| Firma DTE | jsrsasign (SHA1withRSA) |
| PDF | react-native-html-to-pdf |
| Bluetooth | react-native-bluetooth-escpos-printer |
| Biometría | react-native-biometrics |
| Escaneo | react-native-vision-camera |
| Pagos POS | TUU Negocio (Intent Android) |
| Build Android | Gradle 8.6 · SDK 35 · minSdk 24 |

---

## Arquitectura

```
dpay_3.0/
├── android/                 # Proyecto nativo Android (Kotlin/Java)
│   ├── app/build.gradle     # Signing, React Native, módulos nativos
│   └── keystore.properties.example
├── ios/                     # Proyecto iOS (base React Native)
├── assets/                  # Fuentes, iconos, logos
├── scripts/
│   ├── build-release.ps1    # Bundle JS + APK universal
│   ├── dev-pos.ps1          # Desarrollo en POS conectado
│   └── patch-bluetooth-printer.js
├── src/
│   ├── components/          # UI reutilizable (base, sales, payment, settings)
│   ├── screens/             # Pantallas principales
│   ├── services/            # API, PDF, TUU, Payment Hub, TED
│   ├── stores/              # Zustand (auth, sales, settings, etc.)
│   ├── navigation/          # Stack navigator
│   ├── hooks/               # usePrinter, useThemeColors, etc.
│   ├── utils/               # Formateo, RUT, cálculos DTE
│   └── types/               # TypeScript interfaces
├── docs/                    # Postman, planes técnicos
├── ENDPOINTS_DTEMITE.md     # Referencia de API
└── CONFIGURACION_ENTORNOS.md
```

### Stores principales (Zustand + MMKV)

| Store | Responsabilidad |
|---|---|
| `authStore` | Token, usuario, contraseña codificada para emisión DTE |
| `salesStore` | Carrito de venta activa |
| `mySalesStore` | Historial local de ventas |
| `catalogueStore` | Productos |
| `settingsStore` | Configuración de impresión, documentos, pagos |
| `paymentHubStore` | Modo gateway / integraciones externas |
| `printerStore` | Impresora Bluetooth seleccionada |

---

## Requisitos e instalación

### Requisitos previos

| Herramienta | Versión |
|---|---|
| Node.js | 18+ (recomendado 20 LTS) |
| JDK | 17 o 21 |
| Android Studio | 2023+ con SDK 35 |
| Git | Cualquier versión reciente |

### Clonar e instalar

```powershell
git clone https://github.com/DeboradorDeMundos/dpay_3.0.git
cd dpay_3.0
npm install
```

### Configuración local (no subir a Git)

```powershell
# Credenciales de firma APK release (opcional)
Copy-Item android\keystore.properties.example android\keystore.properties
# Editar android\keystore.properties con tus valores locales
```

Archivos ignorados por Git (ver `.gitignore`):
- `android/keystore.properties`
- `.env`
- Colecciones Postman con API keys personales
- Bundles compilados y logs

---

## Desarrollo en dispositivo

### POS Kozen conectado por USB

```powershell
# Verificar dispositivo
adb devices

# Port forwarding para Metro
adb reverse tcp:8081 tcp:8081

# Iniciar Metro
npm start

# Compilar e instalar (otra terminal)
npm run android
```

### Scripts de desarrollo

```powershell
.\scripts\dev-pos.ps1          # Entorno POS automatizado
npm run scrcpy                 # Ver pantalla del dispositivo en PC
npx react-native log-android   # Logs en tiempo real
```

En **modo debug** (`__DEV__=true`), la app apunta a QA:

```
https://proqa.dtemite.cl/api
```

---

## Generar APK release

Para una APK que funcione **en el celular sin PC ni Metro**:

```powershell
npm run build:apk
# Equivalente a: .\scripts\build-release.ps1
```

El script realiza:

1. Parches nativos (Bluetooth, sonido de escaneo)
2. Bundle JS embebido (`--dev false` → API producción)
3. `assembleRelease` con todas las ABI (universal)
4. APK en `android/app/build/outputs/apk/release/`

### Variante solo arm64 (no usar en Kozen P8)

```powershell
npm run build:apk:pos
```

> **Kozen P8 Neo** usa `armeabi-v7a`. Usar siempre el build universal para ese terminal.

### Entornos en release vs debug

| Modo | API Base | TUU |
|---|---|---|
| Debug (Metro) | `proqa.dtemite.cl` | Producción (`com.haulmer.paymentapp`) |
| Release (APK) | `pro.dtemite.cl` | Producción |

Configuración en `src/services/apiClient.ts`.

---

## Anulación de documentos y pagos

Flujo unificado desde **Mis Ventas** (`MySalesScreen`):

| Tipo | Acción | API |
|---|---|---|
| Boleta / Factura / DTE | Nota de Crédito total o corrección | `emitCreditNote()` → legacy PHP |
| Pago recibido (sin DTE) | Anular transacción | `PUT /pos/transaccion/{id}/anular` |
| Nota de crédito | No anulable | — |

### Comportamiento Capstone

Para pruebas con un solo sistema de demostración:

- **`permite_nota_credito` del login se ignora** — siempre habilitado en la app
- **El botón Anular no depende de `emitirDocumento`** en configuración
- Por defecto se muestra modal simplificado de NC total
- Si se activa **"NC por corrección de monto"** en ajustes, aparece opción de corrección parcial

> La emisión de NC requiere sesión activa y contraseña codificada (`b64pass`) guardada al login. Si se usa solo patrón/biometría sin regenerar contraseña, puede fallar la NC — volver a ingresar contraseña resuelve el caso.

---

## Integración con backend

### URLs (configuración actual)

```typescript
// src/services/apiClient.ts
export const API_BASE_URL = __DEV__
  ? 'https://proqa.dtemite.cl/api'      // Debug
  : 'https://pro.dtemite.cl/api';      // Release APK
```

### Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/login` | Autenticación |
| GET | `/folios/caf` | Folios CAF disponibles |
| GET | `/producto` | Catálogo |
| GET | `/cliente` | Clientes |
| POST | `/documento` | Guardar DTE firmado |
| GET | `/dpay/documento` | Listar documentos D-PAY |
| PUT | `/pos/transaccion/{id}/anular` | Anular pago sin DTE |
| POST | `/dpay/documento/eliminar` | Eliminar boleta (legacy) |

Documentación extendida:
- [`ENDPOINTS_DTEMITE.md`](ENDPOINTS_DTEMITE.md)
- [`ENDPOINTS_DTEMITE_CORE.md`](ENDPOINTS_DTEMITE_CORE.md)
- [`docs/postman/README.md`](docs/postman/README.md)

---

## Seguridad del repositorio

Este es un **repositorio público académico**. No incluye:

- Contraseñas de keystore Android
- API keys reales
- Archivos `.env` con credenciales
- Colecciones Postman personales

Antes de contribuir, verificar que no se suban secretos. Usar siempre:
- `android/keystore.properties.example` como plantilla
- `.env.example` con placeholders

---

## Scripts disponibles

```powershell
npm start              # Metro bundler
npm run start:reset    # Metro con caché limpia
npm run android        # Build + run Android
npm run build:apk      # APK release universal
npm run build:apk:pos  # APK solo arm64
npm run scrcpy         # Espejo de pantalla del dispositivo
npm test               # Jest
npm run lint           # ESLint
```

---

## Roadmap Capstone

### Fase 1 — Definir el producto
- [x] Vision: D-PAY como POS completo de DTemite
- [x] Backlog HU-01 a HU-14
- [x] Arquitectura, RF/RNF, UML

### Fase 2 — Estabilizar y evidenciar el POS
- [ ] Flujo login → venta → cobro → DTE demostrable en QA
- [ ] Historial, NC, impresión, Payment Hub
- [ ] Matriz de pruebas + informe S10
- [ ] APK Semana 15

### Fase 3 — Defensa
- [ ] Video del flujo de caja
- [ ] Presentación y `3.4_APT122`

---

## Documentación adicional

| Archivo | Contenido |
|---|---|
| [`ANALISIS_DPAY.md`](ANALISIS_DPAY.md) | Análisis funcional del sistema |
| [`CONFIGURACION_ENTORNOS.md`](CONFIGURACION_ENTORNOS.md) | Entornos QA / producción |
| [`PUBLICACION_TUU.md`](PUBLICACION_TUU.md) | Publicación en tienda TUU |
| [`docs/PLAN-DTEMITE-PAYMENT-HUB-COMPLETO.md`](docs/PLAN-DTEMITE-PAYMENT-HUB-COMPLETO.md) | Payment Hub |
| [`docs/postman/`](docs/postman/) | Colecciones Postman (generar con placeholders) |

---

## Licencia académica

Proyecto desarrollado con fines **educativos** en el marco del Capstone de Duoc UC San Bernardo.

El código base proviene de un sistema POS comercial; esta versión ha sido adaptada, documentada y sanitizada para uso académico. **No está destinado a despliegue productivo sin revisión de seguridad y autorización del titular original.**

---

<div align="center">

**Duoc UC · San Bernardo · 2026**

Diego Madrid · Pablo Gutiérrez · Reinhartd Munzenmayer

[![React Native](https://img.shields.io/badge/React%20Native-0.75.5-61DAFB?style=for-the-badge&logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

**D-PAY 3.0** · v2.7.0

</div>
