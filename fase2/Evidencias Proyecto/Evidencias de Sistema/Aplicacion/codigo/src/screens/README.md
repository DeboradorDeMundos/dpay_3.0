# Screens (Pantallas)

Todas las pantallas de la aplicación. Cada pantalla representa una vista completa.

## Lista de Pantallas

1. **LoginScreen** - Autenticación
2. **SaleScreen** - Punto de venta principal
3. **PaymentMethodScreen** - Selección de método de pago
4. **DocumentTypeScreen** - Selección de tipo de documento
5. **SaleCompletedScreen** - Confirmación de venta
6. **CatalogueScreen** - Catálogo de productos
7. **ClientsScreen** - Gestión de clientes
8. **ViewInvoiceScreen** - Visualización de documentos
9. **ShareScreen** - Compartir documentos
10. **SettingsScreen** - Configuración
11. **MySalesScreen** - Historial de ventas
12. **DocumentTypeSelectorScreen** - Selector de tipo de documento
13. **PrinterSelectorScreen** - Configuración de impresora
14. **MakePaymentScreen** - Procesar pago

## Convenciones

- Nombrar archivos como `NombreScreen.tsx`
- Usar TypeScript
- Tipar las props de navegación
- Exportar como default
- Usar hooks de navegación de React Navigation

## Ejemplo de Screen

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@types';

type Props = NativeStackScreenProps<RootStackParamList, 'Sale'>;

export default function SaleScreen({ navigation, route }: Props) {
  return (
    <View className="flex-1 bg-white">
      <Text className="text-2xl font-bold">Venta</Text>
    </View>
  );
}
```
