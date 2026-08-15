# Stores (Estado Global)

Gestión de estado global usando **Zustand + MMKV**.

## Arquitectura

✅ **Zustand**: State management moderno y minimalista  
✅ **MMKV**: Almacenamiento persistente ultrarrápido (30x más rápido que AsyncStorage)  
✅ **TypeScript**: Type-safe en todo momento  
✅ **Sin boilerplate**: No requiere actions, reducers ni providers  

## Stores Implementados

### 1. `authStore.ts`
Estado de autenticación del usuario.

**Estado:**
- `token`: Token de autenticación JWT
- `user`: Información completa del usuario (LoginInformation)
- `isAuthenticated`: Booleano de estado
- `savedCredentials`: Credenciales guardadas para login rápido
- `pattern`: PIN/patrón de seguridad
- `useBiometric`: Habilitar autenticación biométrica

**Acciones principales:**
- `login(loginInfo)`: Iniciar sesión
- `logout()`: Cerrar sesión
- `saveCredentials()`: Guardar credenciales
- `savePattern()`: Guardar patrón de seguridad
- `validatePattern()`: Validar patrón ingresado

---

### 2. `salesStore.ts`
Gestión de ventas activas (carrito).

**Estado:**
- `sales`: Array de ventas (soporte multi-venta)
- `currentSale`: Índice de venta activa
- `client`: Cliente seleccionado
- `paymentMethod`: Método de pago
- `documentType`: Tipo de documento (33, 34, 39, 41)
- `change`: Vuelto calculado

**Acciones principales:**
- `addItem(item)`: Agregar producto al carrito
- `editItem(item, index)`: Editar producto
- `removeItem(index)`: Eliminar producto
- `setNewSale()`: Crear nueva venta
- `setClient(client)`: Asignar cliente
- `getTotal()`: Calcular total

---

### 3. `cafStore.ts` ⭐ NUEVO
Gestión de CAFs (Código de Autorización de Folios).

**Estado:**
- `cafs`: Array de todos los CAFs descargados
- `activeCafs`: CAFs activos por tipo de documento

**Acciones principales:**
- `addCAF(caf)`: Agregar nuevo CAF
- `setActiveCAF(documentType, cafId)`: Activar CAF para un tipo de documento
- `getNextFolio(documentType)`: Obtener siguiente folio disponible
- `incrementFolio(documentType)`: Incrementar contador de folio
- `getAvailableFoliosCount(documentType)`: Contar folios restantes

**Uso:**
```typescript
const { getNextFolio, incrementFolio } = useCAFStore();

// Al crear factura
const folio = getNextFolio(DocumentType.FACTURA_AFECTA);
if (folio) {
  // ... generar factura con folio
  incrementFolio(DocumentType.FACTURA_AFECTA);
}
```

---

### 4. `catalogueStore.ts` ⭐ NUEVO
Catálogo de productos.

**Estado:**
- `products`: Array de productos
- `searchQuery`: Búsqueda activa
- `selectedCategory`: Categoría filtrada

**Acciones principales:**
- `setProducts(products)`: Cargar catálogo
- `addProduct(product)`: Agregar producto
- `updateProduct(id, updates)`: Actualizar producto
- `getFilteredProducts()`: Obtener productos filtrados
- `getProductByCode(code)`: Buscar por código de barras

---

### 5. `clientsStore.ts` ⭐ NUEVO
Gestión de clientes.

**Estado:**
- `clients`: Array de clientes
- `selectedClient`: Cliente seleccionado
- `searchQuery`: Búsqueda activa

**Acciones principales:**
- `setClients(clients)`: Cargar clientes
- `addClient(client)`: Agregar cliente
- `setSelectedClient(client)`: Seleccionar cliente
- `getClientByRut(rut)`: Buscar por RUT
- `getFilteredClients()`: Obtener clientes filtrados

---

### 6. `mySalesStore.ts` ⭐ NUEVO
Historial de ventas completadas.

**Estado:**
- `sales`: Array de ventas completadas

**Acciones principales:**
- `addSale(sale)`: Agregar venta al historial
- `markAsSynced(id)`: Marcar venta como sincronizada
- `getUnsyncedSales()`: Obtener ventas pendientes de sync
- `getSaleByFolio(folio, documentType)`: Buscar por folio

---

### 7. `settingsStore.ts`
Configuración del sistema.

**Estado:**
- `printer`: Impresora Bluetooth configurada
- `documentType`: Tipos de documento habilitados
- `automaticPrinting`: Impresión automática
- `selectClient`: Solicitar cliente
- `header1-4`: Encabezados de impresión
- `footer1-4`: Pies de impresión
- `processPayments`: Procesar pagos

**Acciones principales:**
- `updateSettings(settings)`: Actualizar configuración
- `setPrinter(printer)`: Configurar impresora
- `setAutomaticPrinting(enabled)`: Toggle impresión automática

---

### 8. `themeStore.ts`
Tema y apariencia.

**Estado:**
- `theme`: 'light' | 'dark'

**Acciones:**
- `toggleTheme()`: Cambiar tema

---

## Ventajas sobre Redux

| Característica | Redux + AsyncStorage | Zustand + MMKV |
|---|---|---|
| **Boilerplate** | Actions, reducers, types | Solo el store |
| **Performance** | Lento (AsyncStorage) | **30x más rápido** |
| **TypeScript** | Requiere configuración | Nativo |
| **Tamaño** | ~20KB + 8KB | ~3KB + 2KB |
| **DevTools** | Redux DevTools | Zustand DevTools |
| **Curva aprendizaje** | Alta | **Baja** |

---

## Ejemplo de Uso

```typescript
import { useSalesStore } from '@stores';

function SaleScreen() {
  const { addItem, getTotal, getCurrentSale } = useSalesStore();
  
  const handleAddProduct = (product: Product) => {
    addItem({
      code: product.code,
      name: product.name,
      value: product.price,
      count: 1,
      total: product.price,
    });
  };
  
  const sale = getCurrentSale();
  const total = getTotal();
  
  return (
    <View>
      <Text>Items: {sale?.results.length}</Text>
      <Text>Total: ${total}</Text>
    </View>
  );
}
```

---

## Persistencia con MMKV

Cada store tiene su propio almacenamiento MMKV aislado:

```typescript
const storage = new MMKV({ id: 'caf-storage' });

// Guardar
storage.set('cafs', JSON.stringify(cafs));

// Leer
const cafs = storage.getString('cafs');

// Eliminar
storage.delete('cafs');
```

**IDs de almacenamiento:**
- `auth-storage`: Autenticación
- `sales-storage`: Ventas activas
- `caf-storage`: CAFs
- `catalogue-storage`: Productos
- `clients-storage`: Clientes
- `my-sales-storage`: Historial
- `settings-storage`: Configuración
- `theme-storage`: Tema

---

## Migración desde Redux

### Antes (Redux):
```javascript
// actions/salesActions.js
export const addItem = (item) => ({
  type: 'ADD_ITEM',
  payload: item,
});

// reducers/salesReducer.js
case 'ADD_ITEM':
  return {
    ...state,
    items: [...state.items, action.payload],
  };

// Componente
dispatch(addItem(product));
```

### Ahora (Zustand):
```typescript
// stores/salesStore.ts
addItem: (item) => {
  const newItems = [...get().items, item];
  set({ items: newItems });
},

// Componente
const { addItem } = useSalesStore();
addItem(product);
```

✅ **Menos código**  
✅ **Más legible**  
✅ **Type-safe**  
✅ **Más rápido**
