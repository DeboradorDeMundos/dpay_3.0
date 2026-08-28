# 📱 Guía de Publicación D-PAY en TUU App Store

## ✅ Información de la App

- **Nombre:** D-PAY
- **Package:** com.dtemitepos
- **Versión:** 2.0 (versionCode: 3)
- **Modelo destino:** P8 Neo
- **Organización:** [Tu organización registrada en TUU]

## 🔐 Paso 1: Generar Keystore de Producción

Ejecutar en el terminal desde la carpeta `android/app`:

```powershell
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore dpay-release.keystore -alias dpay-key -keyalg RSA -keysize 2048 -validity 10000
```

**Datos sugeridos:**
- Password del keystore: `[GUARDAR EN LUGAR SEGURO]`
- Nombre: DTemite
- Unidad organizativa: Desarrollo
- Organización: DTemite
- Ciudad: Santiago
- Provincia: RM
- Código país: CL

⚠️ **IMPORTANTE:** Guardar el archivo `dpay-release.keystore` y la contraseña en un lugar seguro.

## 📝 Paso 2: Configurar Firma en build.gradle

Ya está configurado en `android/app/build.gradle`, pero necesitas crear el archivo `android/gradle.properties` con:

```properties
DPAY_RELEASE_STORE_FILE=dpay-release.keystore
DPAY_RELEASE_KEY_ALIAS=dpay-key
DPAY_RELEASE_STORE_PASSWORD=[TU_PASSWORD]
DPAY_RELEASE_KEY_PASSWORD=[TU_PASSWORD]
```

Y actualizar `build.gradle` con:

```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        if (project.hasProperty('DPAY_RELEASE_STORE_FILE')) {
            storeFile file(DPAY_RELEASE_STORE_FILE)
            storePassword DPAY_RELEASE_STORE_PASSWORD
            keyAlias DPAY_RELEASE_KEY_ALIAS
            keyPassword DPAY_RELEASE_KEY_PASSWORD
        }
    }
}
```

## 🏗️ Paso 3: Generar APK de Producción

```powershell
cd android
./gradlew assembleRelease
```

El APK se generará en: `android/app/build/outputs/apk/release/d-pay_v2.0-universal-release.apk`

## 📦 Paso 4: Assets Requeridos

### Ícono de la App
- **Archivo:** `assets/logos/d_isotipo.png`
- **Requisitos:** Formato PNG, preferiblemente 512x512px
- **Ubicación en proyecto:** Ya disponible ✅

### Capturas de Pantalla (Opcional pero recomendado)
Tomar capturas de:
- Pantalla de login
- Pantalla principal de ventas
- Pantalla de catálogo
- Pantalla de mis ventas

## 📋 Paso 5: Información para el Formulario TUU

### Basic Information
- **Installation Package:** `d-pay_v2.0-universal-release.apk`
- **Icon:** `d_isotipo.png` (512x512)
- **App Name:** D-PAY
- **Package Name:** com.dtemitepos
- **Version Name:** 2.0
- **Version Code:** 3

### Configuration
- **App Signature:** [Mantener valor por defecto]
- **Valid Model:** P8 Neo
- **Visible Method:** Designed Organization
- **Visible Object:** [Tu organización]

### Descripción Sugerida

```
D-PAY es un sistema POS completo para facturación electrónica integrado con TUU Pagos.

Características principales:
✅ Facturación electrónica (Boletas y Facturas)
✅ Integración nativa con TUU Pagos DPAY
✅ Catálogo de productos
✅ Gestión de clientes
✅ Historial de ventas y documentos
✅ Emisión de Notas de Crédito
✅ Sincronización automática con DTemite
✅ Modo oscuro/claro
✅ Impresión térmica

Requisitos:
- Cuenta activa en DTemite (https://dtemite.cl)
- Contrato TUU Pagos DPAY
```

## 🚀 Paso 6: Proceso de Publicación

1. **Acceder a la plataforma TUU Partner:**
   - URL: [Acceder al sistema]
   - Ir a: App Store > Applications

2. **Subir la aplicación:**
   - Click en ADD
   - Cargar APK firmado
   - Cargar ícono
   - Completar formularios
   - Seleccionar P8 Neo en Valid Model
   - Save

3. **Solicitar revisión vía Slack:**
   - Unirse al canal comunitario Haulmer
   - Buscar bot "IntegradoresTUU"
   - Seleccionar "Publicar una nueva app"
   - Completar formulario con:
     * Nombre de la app: D-PAY
     * Versión: 2.0
     * Email de contacto: [tu email]
     * Descripción de cambios: Primera versión pública

4. **Esperar aprobación:**
   - Tiempo estimado: 3 días hábiles
   - Revisión de correo (incluyendo spam)
   - Posibles correcciones según feedback

## ✅ Checklist Final Antes de Subir

- [ ] Keystore de producción creado y guardado
- [ ] APK firmado generado correctamente
- [ ] Ícono preparado (512x512 PNG)
- [ ] Capturas de pantalla tomadas
- [ ] Descripción preparada
- [ ] Cuenta partner TUU activa
- [ ] Acceso a Slack Haulmer configurado
- [ ] Email de contacto confirmado

## 📞 Contacto y Soporte

En caso de problemas durante la publicación:
- Canal Slack: Haulmer / IntegradoresTUU
- Correo: [Según documentación TUU]
- Tiempo de respuesta: Mismo día hábil

---

**Notas Importantes:**
- El APK debe estar firmado (no usar debug.keystore)
- Solo compatible con P8 Neo
- Requiere permisos específicos del sistema TUU
- La app se publicará solo para tu organización inicialmente
