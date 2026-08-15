# 🌍 Configuración de Entornos - D-PAY

## 📋 Resumen

Todas las URLs de API están centralizadas en un solo archivo: **`src/config/environment.ts`**

Para cambiar entre QA y PRODUCCIÓN, solo necesitas modificar **1 línea**.

---

## 🔧 Cómo Cambiar de Entorno

### Archivo: `src/config/environment.ts`

```typescript
// Línea 10 - Solo cambiar esta línea
export const ENVIRONMENT_MODE: EnvironmentMode = 'QA';  // ← Aquí
```

### Para ir a PRODUCCIÓN:

```typescript
export const ENVIRONMENT_MODE: EnvironmentMode = 'PRODUCTION';
```

### Para volver a QA:

```typescript
export const ENVIRONMENT_MODE: EnvironmentMode = 'QA';
```

---

## 🗺️ URLs Configuradas

### QA (PROQA)
```
API Base:          https://proqa.dtemite.cl/api
Sincronización:    https://proqa.dtemite.cl/api/Documento
POS Transacciones: https://proqa.dtemite.cl/api/pos/transaccion
```

### PRODUCCIÓN (PRO)
```
API Base:          https://pro.dtemite.cl/api
Sincronización:    https://pro.dtemite.cl/api/Documento
POS Transacciones: https://pro.dtemite.cl/api/pos/transaccion
```

---

## 📂 Archivos Actualizados

Los siguientes archivos ahora usan la configuración centralizada:

### ✅ `src/services/apiClient.ts`
- **Antes:** URL hardcodeada
- **Ahora:** Importa `API_BASE_URL` desde environment.ts
- **Uso:** Login, CAFs, catálogo, clientes, documentos DPay

### ✅ `src/services/api.ts`
- **Antes:** 3 URLs hardcodeadas en diferentes funciones
- **Ahora:** Importa dinámicamente según necesidad:
  - `DOCUMENT_SYNC_URL` para `syncSale()` y `emitCreditNote()`
  - `POS_TRANSACTION_URL` para `syncPosTransaction()`
  - `getVincularDteUrl()` para `vincularDteATransaccion()`

### ✅ `src/screens/LoginScreen.tsx`
- **Antes:** URL de logos hardcodeada
- **Ahora:** Usa helper `getLogoUrl()` desde environment.ts

---

## ⚙️ Después de Cambiar el Entorno

### 1. Recargar la app:
```powershell
# En Metro Bundler, presionar 'r' para reload
# O ejecutar:
./run-android.ps1
```

### 2. Verificar en consola:
Deberías ver este log al iniciar:
```
🌍 [Environment] Configuración activa: {
  mode: 'QA',  // o 'PRODUCTION'
  apiBase: 'https://proqa.dtemite.cl/api',
  ...
}
```

### 3. Probar funcionalidades críticas:
- ✅ Login
- ✅ Sincronización de ventas
- ✅ Transacciones TUU Pagos
- ✅ Descarga de logos

---

## 🚀 Para Publicación

Antes de generar el APK de producción:

1. **Cambiar a PRODUCTION:**
   ```typescript
   export const ENVIRONMENT_MODE: EnvironmentMode = 'PRODUCTION';
   ```

2. **Generar APK:**
   ```powershell
   .\generar-apk-release.ps1
   ```

3. **Verificar en un dispositivo de prueba:**
   - Asegúrate de que todas las APIs responden correctamente
   - Verifica que no haya errores de sincronización

4. **¡Listo para publicar en TUU App Store!**

---

## 📝 Notas Importantes

### URLs Estáticas (No cambian)
Estas URLs no se modifican entre entornos:
- Logos empresas: `https://www.dtemite.cl/sistema/Content/Logos/`
- SII: `https://www.sii.cl`
- DTemite corporativo: `https://www.dtemite.cl`

### Estructura Consistente
Todas las URLs siguen el mismo formato:
```
QA:         https://proqa.dtemite.cl/api/[endpoint]
PRODUCCIÓN: https://pro.dtemite.cl/api/[endpoint]
```

### TypeScript IntelliSense
El archivo `environment.ts` está tipado, así que obtendrás autocompletado al importar:
```typescript
import { API_BASE_URL, DOCUMENT_SYNC_URL, getLogoUrl } from '../config/environment';
```

---

## 🔄 Volver a QA Después de Publicar

Si necesitas volver a QA para desarrollo:

1. Cambiar en `environment.ts`:
   ```typescript
   export const ENVIRONMENT_MODE: EnvironmentMode = 'QA';
   ```

2. Recargar app en desarrollo:
   ```powershell
   ./run-android.ps1
   ```

¡Listo! Toda la app vuelve a apuntar a QA.

---

## ❓ Troubleshooting

### "No se puede conectar al servidor"
- ✅ Verifica `ENVIRONMENT_MODE` en `environment.ts`
- ✅ Revisa los logs en consola para ver qué URL se está usando
- ✅ Confirma que el servidor de destino está disponible

### "Token inválido después de cambiar entorno"
- ✅ Cierra sesión y vuelve a iniciar
- ✅ Las credenciales de QA y PRODUCCIÓN son diferentes

### "Logo de empresa no carga"
- ✅ La URL de logos es la misma para ambos entornos
- ✅ Verifica que el nombre del sistema sea correcto

---

**Última actualización:** 17 de febrero de 2026
