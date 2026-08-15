# Services (Servicios)

Capa de servicios para interactuar con APIs, almacenamiento y funcionalidades nativas.

## Servicios Principales

### `api.ts`
Servicio para comunicación con la API REST
- Login
- CRUD de productos
- CRUD de clientes
- Guardar documentos
- Obtener CAFs
- Sincronización

### `storage.ts`
Servicio de almacenamiento local con MMKV
- Guardar/obtener datos
- Persistencia de sesión
- Cache local

### `printer.ts`
Servicio de impresión térmica Bluetooth
- Conectar impresora
- Imprimir documentos
- Formateo ESC/POS

### `pdf.ts`
Generación de PDFs
- Crear PDF de documentos
- Formato de boletas/facturas

### `auth.ts`
Autenticación y seguridad
- Login/Logout
- Biometría
- Manejo de tokens
- Keychain/Keystore

### `validation.ts`
Validaciones
- Validar RUT
- Validar emails
- Validar teléfonos

### `tuuPayment.ts`
Integración con Tuu Pagos
- Verificar instalación de Tuu
- Procesar pagos con tarjeta
- Manejo de respuestas y errores
- Mapeo de códigos de error

### `tuuSyncService.ts` ⚡ **NUEVO**
Sistema automático de sincronización de transacciones Tuu
- **Sincronización automática en segundo plano** (cada 1 minuto)
- **Sincronización al inicio de la app** para transacciones pendientes
- **Retry automático** de transacciones que fallaron
- **Forzar sincronización manual** cuando sea necesario
- **Estadísticas de sincronización** (total, sincronizadas, pendientes, errores)

**Uso:**
```typescript
import { TuuSyncScheduler, syncPendingTuuTransactions } from '../services/tuuSyncService';

// Forzar sincronización inmediata
const count = await TuuSyncScheduler.forceSync();

// Sincronizar todas las pendientes
const synced = await syncPendingTuuTransactions();

// Configurar intervalo (default: 60 segundos)
TuuSyncScheduler.setSyncInterval(120000); // 2 minutos
```

**Integración:**
- Automáticamente integrado en el servicio de background de la app
- Se ejecuta cada 60 segundos si hay transacciones pendientes
- No requiere configuración adicional

### `sync.ts`
Sincronización de datos
- Sincronizar ventas pendientes
- Upload automático
- Manejo de conflictos

## Ejemplo de Service

```typescript
import axios from 'axios';
import { API_URL } from '@env';
import { ApiResponse, Product } from '@types';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getProducts = async (): Promise<ApiResponse<Product[]>> => {
  try {
    const response = await api.get('/api/productos');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};
```
