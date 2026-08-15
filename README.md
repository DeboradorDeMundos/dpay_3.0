# 🏪 DTemite POS - Sistema POS para Facturación Electrónica

[![React Native](https://img.shields.io/badge/React%20Native-0.75.5-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![Android](https://img.shields.io/badge/Android-7.0%2B-green.svg)](https://developer.android.com/)
[![Kozen P8 Neo](https://img.shields.io/badge/Kozen-P8%20Neo-orange.svg)](https://www.kozen.com/)
[![License](https://img.shields.io/badge/License-Private-red.svg)](LICENSE)

Sistema de Punto de Venta profesional para terminales **Kozen P8 Neo** y Android desarrollado con **React Native + TypeScript**, especializado en la generación de **Documentos Tributarios Electrónicos (DTE)** según la normativa chilena del SII, con integración completa de pagos con tarjeta vía **Tuu**.

---

## 📋 Tabla de Contenidos

- [🚀 Inicio Rápido para Desarrollo](#-inicio-rápido-para-desarrollo)
- [Características](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura-del-proyecto)
- [Instalación](#-instalación-y-configuración)
- [Funcionalidades](#-funcionalidades-implementadas)
- [Estado del Proyecto](#-estado-del-proyecto)
- [API Integration](#-integración-con-api)
- [Stores](#-stores-zustand)
- [Sistema de Diseño](#-sistema-de-diseño)
- [Seguridad](#-seguridad-y-almacenamiento)
- [Scripts](#-scripts-disponibles)
- [Troubleshooting](#-troubleshooting)
- [Contribución](#-contribución)

---

## 🚀 Inicio Rápido para Desarrollo

### Desarrollo en POS conectado

**1. Conecta tu POS por USB**
```bash
# Verifica que esté conectado
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
& "$env:ANDROID_HOME\platform-tools\adb.exe" devices
```

**2. Inicia el entorno de desarrollo (Recomendado)**
```powershell
.\start-dev.ps1
```
Este script automáticamente:
- ✅ Verifica la conexión del dispositivo
- ✅ Configura port forwarding (Metro → POS)
- ✅ Inicia Metro Bundler si no está corriendo
- ✅ Recarga la app en el POS

**3. Visualiza la pantalla del POS en tu PC (scrcpy)**
```powershell
.\start-scrcpy.ps1
```

Opciones disponibles:
- **Opción 1**: Pantalla completa (recomendado para desarrollo)
- **Opción 2**: Ventana pequeña (800px)
- **Opción 3**: Alta calidad (sin comprimir)
- **Opción 4**: Solo visualización (sin control)

### Comandos manuales

```powershell
# Iniciar Metro Bundler
npm start

# Compilar e instalar en POS
npm run android

# Ver logs del dispositivo
npx react-native log-android

# Recargar app en el POS
# Opción 1: Agita el dispositivo
# Opción 2: Presiona 'r' en la terminal de Metro
# Opción 3: ADB
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
& "$env:ANDROID_HOME\platform-tools\adb.exe" shell input text "RR"

# Port forwarding manual (si falla la conexión a Metro)
& "$env:ANDROID_HOME\platform-tools\adb.exe" reverse tcp:8081 tcp:8081
```

### Instalación de scrcpy

Si no tienes scrcpy instalado:

**Con Chocolatey:**
```powershell
choco install scrcpy
```

**Con Scoop:**
```powershell
scoop install scrcpy
```

**Manual:**
Descarga desde: https://github.com/Genymobile/scrcpy/releases

### Debugging
- 🔧 Hot Reload: Los cambios se reflejan automáticamente
- 🐛 Chrome DevTools: Abre el Dev Menu (agita el POS) → "Debug"
- 📊 React Native Debugger: Recomendado para Redux/Zustand
- 📱 Flipper: Para debugging avanzado (redes, base de datos, etc.)

---

## ✨ Características Principales

### 🔐 Seguridad Avanzada
- **Autenticación RUT chileno** con validación y formato automático
- **Patrón PIN de 4 dígitos** para acceso rápido
- **Biometría** (huella digital / reconocimiento facial)
- **Almacenamiento encriptado** con MMKV (30x más rápido que AsyncStorage)
- **Tokens JWT** con renovación automática

### 📱 Funcionalidades de Negocio
- **Catálogo de productos** con búsqueda en tiempo real
- **Gestión de ventas** con calculadora táctil integrada
- **Historial de ventas** con filtros por fecha y sincronización
- **Impresión térmica Bluetooth** con impresión automática configurable
- **Modo offline** completo con sincronización automática al SII
- **Documentos tributarios electrónicos** (Boleta, Factura, Nota de Crédito)
- **Firma digital** de documentos con algoritmo SHA1withRSA (jsrsasign)
- **Timbre Electrónico (TED)** con código PDF417 para validación SII

### 💳 Integración Tuu (Pagos con Tarjeta)
- **Crédito y Débito** vía app Tuu Negocio
- **Cuotas configurables** para pagos con crédito
- **Manejo de errores ICE** con mensajes amigables al usuario
- **Auto-ejecución inteligente** cuando hay un solo método de pago configurado
- **Cancelación controlada** sin re-ejecuciones automáticas

### 🎨 Experiencia de Usuario
- **Tema claro/oscuro** con persistencia
- **Navegación fluida** con React Navigation 7
- **Diseño adaptativo** siguiendo guías de Material Design
- **Componentes reutilizables** con TypeScript type-safe
- **Date pickers nativos** para selección de fechas
- **Loading unificado** durante sincronización y procesamiento

---

## 🚀 Stack Tecnológico

### Core
- **React Native** 0.75.5 - Framework principal
- **TypeScript** 5.9.3 - Type safety y mejor DX
- **JSC** (JavaScript Core) - JS Engine optimizado

### State Management & Storage
- **Zustand** 5.0.8 - State management simple y performante
- **MMKV** 2.12.2 - Storage persistente ultra rápido (nativo C++)

### Navegación & UI
- **React Navigation** 7.x - Stack & Drawer navigation
- **React Native Gesture Handler** 2.22.1 - Gestos nativos
- **React Native Reanimated** 3.16.1 - Animaciones 60fps
- **React Native Modal** 13.0.1 - Modales personalizados

### Documentos & Firma Digital
- **jsrsasign** 11.1.0 - Firma digital RSA/SHA1
- **react-native-html-to-pdf** 0.12.0 - Generación de PDFs
- **react-native-share** 10.2.1 - Compartir documentos

### Hardware & Dispositivo
- **react-native-biometrics** 3.0.1 - Autenticación biométrica
- **react-native-ble-manager** 11.5.4 - Bluetooth Low Energy
- **react-native-bluetooth-escpos-printer** 0.0.5 - Impresión térmica ESC/POS
- **react-native-device-info** 14.1.1 - Info del dispositivo

### Pagos con Tarjeta
- **Tuu Negocio** - Integración via Intent Android para pagos con tarjeta
- **Soporte ICE codes** - Manejo completo de errores de terminal

### Utilidades
- **date-fns** 4.1.0 - Manejo de fechas
- **lodash** 4.17.21 - Utilidades JavaScript
- **base-64** 1.0.0 - Codificación base64

---

## 🏗️ Arquitectura del Proyecto

```
dtemite-pos/
├── 📱 android/                    # Proyecto Android nativo
│   ├── app/
│   │   ├── build.gradle          # Configuración de build (SDK 35)
│   │   └── src/                  # Código Java/Kotlin nativo
│   ├── build.gradle              # Build principal
│   └── gradle.properties         # Configuración de Gradle
│
├── 🎨 assets/                     # Recursos estáticos
│   ├── fonts/                    # Fuentes AllRoundGothic
│   ├── icons/                    # Iconos PNG
│   └── images/                   # Imágenes
│
├── 📝 src/                        # Código fuente principal
│   ├── 🧩 components/            # Componentes React
│   │   ├── base/                 # Componentes reutilizables
│   │   ├── login/                # Componentes de login
│   │   ├── sales/                # Componentes de ventas
│   │   ├── payment/              # Componentes de pago
│   │   └── settings/             # Componentes de configuración
│   │
│   ├── 🗺️ navigation/            # Configuración de navegación
│   ├── 📺 screens/                # Pantallas principales
│   ├── 🔌 services/               # Servicios externos (API, PDF, Firma)
│   ├── 💾 stores/                 # Zustand stores
│   ├── 🎨 theme/                  # Sistema de diseño
│   ├── 📐 types/                  # TypeScript types
│   ├── 🔧 utils/                  # Utilidades
│   ├── 🪝 hooks/                  # Custom hooks
│   └── 📊 constants/              # Constantes globales
│
├── 📄 Documentación/
│   ├── ANALISIS_DIFERENCIAS_PROYECTO.md
│   ├── ANALISIS_LOGO.md
│   ├── ANALISIS_TIMBRE_SII.md
│   └── CREDENCIALES_PRUEBA.md
│
└── ⚙️ Configuración/
    ├── babel.config.js
    ├── metro.config.js
    ├── tsconfig.json
    └── package.json
```

---

## 🛠️ Instalación y Configuración

### 📋 Requisitos Previos

| Herramienta | Versión Mínima | Recomendada |
|-------------|----------------|-------------|
| **Node.js** | 18.x | 20.19.4+ |
| **JDK** | 17 | 21 LTS |
| **Android Studio** | 2023.x | Latest |
| **Android SDK** | API 24 (7.0) | API 35 (15.0) |

### 🔧 Instalación

```bash
# 1. Clonar repositorio
git clone https://bitbucket.org/dtemite/dpay.git
cd dpay

# 2. Instalar dependencias
npm install

# 3. Configurar Android Studio
# - Instalar SDK Platform 35
# - Configurar ANDROID_HOME y JAVA_HOME

# 4. Ejecutar aplicación
npm run android
```

### ⚙️ Configuración de Gradle

Verificar `android/gradle.properties`:

```properties
# IMPORTANTE: Hermes deshabilitado por estabilidad
hermesEnabled=false

# SDK Versions
compileSdkVersion=35
targetSdkVersion=35
minSdkVersion=24
```

---

## 📱 Funcionalidades Implementadas

### ✅ Completo (100%)

#### **LoginScreen** - Autenticación Segura
- Validación de RUT chileno con formato automático
- Patrón PIN de 4 dígitos
- Autenticación biométrica (huella/facial)
- Descarga automática de datos offline (CAFs, catálogo, clientes)
- Persistencia de credenciales encriptada
- Tema claro/oscuro adaptativo

#### **CatalogueScreen** - Catálogo de Productos
- Lista de productos con scroll infinito
- Búsqueda en tiempo real (código, nombre, descripción)
- Indicador de stock (número o símbolo ∞)
- Carga desde API y almacenamiento local MMKV
- Botón "Agregar al carrito"

#### **SaleScreen** - Pantalla Principal de Ventas
- Calculadora táctil integrada
- Lista de items del carrito
- Edición de cantidad y eliminación de items
- Cálculo automático de subtotal, IVA, total
- Menú lateral con navegación

#### **PaymentMethodScreen** - Métodos de Pago
- Selector de método (Efectivo, Crédito, Débito)
- Input de efectivo con cálculo de vuelto automático
- Integración completa con Tuu para pagos con tarjeta
- Auto-ejecución inteligente (1 método configurado)
- Manejo de cancelación sin re-ejecución

#### **SaleCompletedScreen** - Procesamiento de Venta
- Sincronización automática con API SII
- Generación de TED (Timbre Electrónico Digital)
- Asignación de folio desde servidor
- Navegación a vista de factura

#### **ViewInvoiceScreen** - Vista de Documento
- Visualización completa del DTE emitido
- Impresión automática configurable
- Impresión manual bajo demanda
- Compartir documento (PDF)
- Información de cliente, items, totales

#### **MySalesScreen** - Historial de Ventas
- Filtro por rango de fechas con date pickers nativos
- Toggle "Ver detalle de ventas"
- Indicadores de sincronización (✓ synced, ⟳ pending, ✗ error)
- Sincronización manual de ventas pendientes
- Resumen de totales
- Soporte completo para modo oscuro

#### **PrinterSettingsScreen** - Configuración de Impresora
- Escaneo de impresoras Bluetooth
- Selección y conexión automática
- Impresión de prueba
- Reconexión automática al imprimir
- Manejo de permisos Bluetooth (Android 12+)
- Persistencia de configuración

#### **SettingsScreen** - Configuraciones
- Selector de impresora Bluetooth
- Logo de empresa (upload, preview, delete)
- Impresión automática toggle
- Imprimir TED (código PDF417) toggle
- Sincronización automática toggle
- Tipos de documento habilitados por empresa
- Métodos de pago por tipo de documento
- Headers y footers personalizados para impresión
- Tema claro/oscuro

#### **ClientsScreen** - Gestión de Clientes
- Lista de clientes desde API
- Búsqueda por RUT o nombre
- Selección para asociar a venta
- Datos: RUT, Razón Social, Email
---

## 💳 Integración Tuu - Pagos con Tarjeta

### Flujo de Pago
1. Usuario selecciona método de pago (Crédito/Débito)
2. App invoca Tuu Negocio via Intent Android
3. Tuu procesa el pago en terminal
4. Retorna resultado con `sequenceNumber`
5. App continúa con emisión de DTE

### Códigos de Error ICE Manejados

| Código | Descripción | Mensaje al Usuario |
|--------|-------------|-------------------|
| ICE-000 | Tarjeta no soportada | "La tarjeta ingresada no es válida" |
| ICE-001 | Tarjeta expirada | "La tarjeta está vencida" |
| ICE-002 | Fondos insuficientes | "Fondos insuficientes" |
| ICE-003 | Transacción rechazada | "Transacción rechazada por el banco" |
| ICE-010 | Sin conexión | "Sin conexión a internet" |
| ICE-014 | Cancelado por usuario | "Pago cancelado" |
| ICE-050 | Terminal ocupado | "Terminal ocupado, intente nuevamente" |

### Payload de Pago
```typescript
interface TuuPaymentRequest {
  amount: number;           // Monto total
  tip: number;              // Propina (-1 = no usar)
  cashback: number;         // Cashback (-1 = no usar)
  method: 1 | 2;            // 1=Crédito, 2=Débito
  installmentsQuantity: number; // Cuotas (0=solicitar, -1=no usar)
  printVoucherOnApp: boolean;   // false = nosotros imprimimos
  dteType: number;          // Tipo documento (33, 39, etc.)
  extraData: {
    taxIdnValidation: string;   // RUT cliente
    exemptAmount: number;       // Monto exento
    netAmount: number;          // Monto neto
    sourceName: string;         // "DTemite POS"
    sourceVersion: string;      // "2.0.0"
  };
}
```

---

## 🔗 Integración con API

### Base URL
```
https://prodev.dtemite.cl/api
```

### Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/login` | Autenticación de usuario |
| GET | `/folios/caf` | Obtener folios CAF disponibles |
| GET | `/producto` | Obtener catálogo de productos |
| GET | `/cliente` | Obtener lista de clientes |
| POST | `/documento` | Guardar DTE firmado |

Ver documentación completa de endpoints en la sección [API Integration](#-integración-con-api) del README extendido.

---

## 💾 Stores (Zustand)

| Store | Responsabilidad | Persistencia |
|-------|----------------|--------------|
| **authStore** | Autenticación, tokens, credenciales | ✅ MMKV |
| **salesStore** | Carrito de ventas, items | ❌ Temporal |
| **catalogueStore** | Productos, búsqueda | ✅ MMKV |
| **mySalesStore** | Historial de ventas | ✅ MMKV |
| **cafStore** | Folios CAF | ✅ MMKV |
| **printerStore** | Configuración impresora | ✅ MMKV |
| **settingsStore** | Configuraciones generales | ✅ MMKV |
| **themeStore** | Tema claro/oscuro | ✅ MMKV |
| **alertStore** | Sistema de alertas | ❌ Temporal |

---

## 🎨 Sistema de Diseño

### Paleta de Colores

#### Modo Claro
```typescript
primary: '#75bebf'        // Turquesa - Botones primarios
secondary: '#213d8b'      // Azul oscuro - Textos principales
tertiary: '#d4186e'       // Rosa/magenta - Acentos
background: '#FFFFFF'
text: '#213d8b'
```

#### Modo Oscuro
```typescript
primary: '#75bebf'
secondary: '#75bebf'      // Adaptado para contraste
tertiary: '#d4186e'
background: '#1a1a1a'
text: '#FFFFFF'
```

### Espaciado
```typescript
xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64
```

### Tipografía
```typescript
Fuentes: AllRoundGothicW03-Bold, Medium, Book
Tamaños: xs(12) → 5xl(48)
Pesos: light(300) → extrabold(800)
```

### Hook de Tema
```typescript
import { useThemeColors } from '../hooks/useThemeColors';

const MyComponent = () => {
  const themeColors = useThemeColors();
  return (
    <View style={{ backgroundColor: themeColors.background }}>
      <Text style={{ color: themeColors.text }}>Texto adaptativo</Text>
    </View>
  );
};
```

---

## 🔐 Seguridad y Almacenamiento

### MMKV Storage
**MMKV** es 30x más rápido que AsyncStorage y soporta encriptación nativa.

```typescript
import { storage } from 'react-native-mmkv';

// Guardar
storage.set('key', JSON.stringify(data));

// Leer
const data = JSON.parse(storage.getString('key') || '{}');

// Eliminar
storage.delete('key');
```

### Keys en MMKV

| Key | Tipo | Descripción |
|-----|------|-------------|
| `auth-token` | string | JWT token de sesión |
| `auth-loginInfo` | JSON | Info del usuario |
| `auth-savedCredentials` | JSON | Credenciales guardadas |
| `auth-pattern` | string | PIN de 4 dígitos |
| `auth-useBiometric` | boolean | Biometría habilitada |
| `products` | JSON | Catálogo de productos |
| `clients` | JSON | Lista de clientes |
| `cafs` | JSON | Folios CAF |
| `my-sales` | JSON | Historial de ventas |
| `printer-config` | JSON | Config de impresora |
| `settings` | JSON | Configuraciones |
| `theme-isDark` | boolean | Tema oscuro |

### Firma Digital (SHA1withRSA)
```typescript
import { KJUR } from 'jsrsasign';

const sig = new KJUR.crypto.Signature({ alg: 'SHA1withRSA' });
sig.init(privateKey);
sig.updateString(ddXML);
const signature = sig.sign();
```

Ver análisis completo en: `ANALISIS_TIMBRE_SII.md`

---

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm start                    # Metro bundler
npm run android              # Build + Run Android
npm run ios                  # Build + Run iOS

# Testing
npm test                     # Jest tests
npm run lint                 # ESLint
npm run format               # Prettier

# Android
cd android && ./gradlew clean                   # Limpiar build
cd android && ./gradlew assembleRelease         # Build release
```

---

## 🐛 Troubleshooting

### App se cierra inmediatamente
```bash
# Verificar Hermes deshabilitado
grep hermesEnabled android/gradle.properties

# Limpiar y reinstalar
cd android && ./gradlew clean && cd ..
rm -rf node_modules && npm install
npm run android
```

### Productos no aparecen
```bash
# Ver logs durante login
npx react-native log-android | grep -i "productos"

# Verificar MMKV
import { storage } from 'react-native-mmkv';
console.log('Products:', storage.getString('products'));
```

### Date picker no funciona
```bash
npm install react-native-date-picker
cd android && ./gradlew clean && cd ..
npm run android
```

### Bluetooth no conecta
```bash
# Verificar permisos en AndroidManifest.xml
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

# Vincular impresora en Android Settings
```

---

## 📊 Estado del Proyecto

### Progreso General: 95%

| Módulo | Progreso | Estado |
|--------|----------|--------|
| **Autenticación** | 100% | ✅ Completo |
| **Catálogo** | 100% | ✅ Completo |
| **Ventas** | 100% | ✅ Completo |
| **Historial** | 100% | ✅ Completo |
| **Impresión** | 100% | ✅ Completo |
| **Pago Efectivo** | 100% | ✅ Completo |
| **Pago Tarjeta (Tuu)** | 100% | ✅ Completo |
| **Documentos DTE** | 100% | ✅ Completo |
| **Sincronización SII** | 100% | ✅ Completo |
| **Clientes** | 100% | ✅ Completo |
| **Configuración** | 100% | ✅ Completo |
| **Tema Claro/Oscuro** | 100% | ✅ Completo |

### Características Completadas

- ✅ Flujo completo de venta desde calculadora hasta impresión
- ✅ Integración Tuu para pagos con tarjeta (crédito/débito)
- ✅ Generación y firma de TED (Timbre Electrónico)
- ✅ Sincronización automática con API SII
- ✅ Impresión automática de documentos
- ✅ Manejo de errores ICE con mensajes amigables
- ✅ Configuración de métodos de pago por tipo de documento
- ✅ Modo offline con sincronización posterior

### Próximos Pasos

1. **Testing en producción** con clientes reales
2. **Optimizaciones de rendimiento** en dispositivos Kozen
3. **Reportes y estadísticas** de ventas
4. **Backup y restauración** de datos

---

## 👥 Contribución

### Flujo de Trabajo

1. Crear rama feature: `git checkout -b feature/nombre`
2. Commits descriptivos: `git commit -m "feat: ..."`
3. Push a Bitbucket: `git push origin feature/nombre`
4. Crear Pull Request
5. Code Review y aprobación
6. Merge a main

### Estándares de Código

- ✅ TypeScript estricto en todos los archivos
- ✅ Componentes funcionales con hooks
- ✅ Named exports para utilities, default para components
- ✅ Sin colores hardcodeados, usar `useThemeColors()`
- ✅ Comentarios solo cuando sea necesario
- ✅ Sin código obsoleto o comentado

### Convenciones

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Archivos | PascalCase | `LoginScreen.tsx` |
| Componentes | PascalCase | `Button`, `Card` |
| Hooks | camelCase + `use` | `useThemeColors` |
| Variables | camelCase | `userName`, `isLoading` |
| Constantes | UPPER_SNAKE | `API_BASE_URL` |

---

## 📄 Licencia

**Privado** - © 2025 DTemite. Todos los derechos reservados.

---

## 📞 Contacto

**Empresa:** DTemite  
**Proyecto:** DPay - Sistema POS  
**Repositorio:** https://bitbucket.org/dtemite/dpay

**Equipo de Desarrollo:**
- **Lead Developer:** Diego Madrid Lang ([diego.madrid@dtemite.cl](mailto:diego.madrid@dtemite.cl))
- **Project Owners:** Erik Mardones, Felipe Espinoza, Sergio Silva

---

## 🎯 Roadmap 2025

### Q1-Q2 2025 ✅
- [x] Setup inicial del proyecto
- [x] Sistema de autenticación completo
- [x] Catálogo de productos
- [x] Historial de ventas
- [x] Integración con impresora Bluetooth

### Q3-Q4 2025 ✅
- [x] Flujo de pago completo
- [x] Integración Tuu (pagos con tarjeta)
- [x] Generación de DTE con TED
- [x] Sincronización con API SII
- [x] Impresión automática
- [x] Manejo de errores ICE

### 2026 (Planificado)
- [ ] Reportes y estadísticas de ventas
- [ ] Dashboard web para administración
- [ ] Soporte multi-sucursal
- [ ] iOS support
- [ ] Integraciones adicionales de pago

---

<div align="center">

**🚀 Desarrollado con ❤️ usando React Native + TypeScript**

[![React Native](https://img.shields.io/badge/React%20Native-0.75.5-61DAFB?style=for-the-badge&logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Android](https://img.shields.io/badge/Android-7.0%2B-3DDC84?style=for-the-badge&logo=android)](https://developer.android.com/)

**v2.0.0** | Diciembre 2025

</div>
