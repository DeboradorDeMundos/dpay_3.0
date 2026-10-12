# Componentes

Esta carpeta contiene todos los componentes reutilizables de la aplicación.

## Estructura

### `/base`
Componentes base compartidos en toda la app:
- Botones
- Inputs
- Headers
- Modals
- Selects
- Toast/Alerts

### `/login`
Componentes específicos de autenticación:
- Formulario de login
- Popup biométrico
- Validación de patrones

### `/sales`
Componentes del módulo de ventas:
- Lista de productos
- Calculadora
- Resumen de venta
- Items de venta

### `/payment`
Componentes de pago:
- Métodos de pago
- Input de efectivo
- Total a pagar

### `/settings`
Componentes de configuración:
- Configuración de impresora
- Configuración de documentos
- Perfil de usuario

## Convenciones

- Usar TypeScript para todos los componentes
- Props bien tipadas con interfaces
- Exportar como default
- Nombrar archivos en camelCase
- Documentar props con comentarios JSDoc

## Ejemplo de componente

```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

/**
 * Botón reutilizable con variantes
 */
export default function Button({ 
  title, 
  onPress, 
  variant = 'primary',
  disabled = false 
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`p-4 rounded-lg ${variant === 'primary' ? 'bg-primary' : 'bg-secondary'}`}
    >
      <Text className="text-white text-center font-semibold">
        {title}
      </Text>
    </TouchableOpacity>
  );
}
```
