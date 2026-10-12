# Hooks Personalizados

Custom hooks para lógica reutilizable.

## Hooks Disponibles

### `useCustomAlert.ts`
Hook para mostrar alertas personalizadas
- Alertas con diseño de la app
- Botones personalizables
- Estilos: default, cancel, destructive

### `usePrinter.ts`
Hook para manejo de impresión
- Conectar impresora
- Imprimir documentos
- Estado de conexión

### `useShare.ts`
Hook para compartir contenido
- Compartir PDF
- Enviar por WhatsApp
- Enviar por Email

### `useAuth.ts`
Hook para autenticación
- Login/Logout
- Verificar sesión
- Renovar token

### `useBiometrics.ts`
Hook para biometría
- Verificar disponibilidad
- Autenticar con huella/Face ID

### `useSync.ts`
Hook para sincronización
- Sincronizar ventas
- Estado de sync
- Reintentos automáticos

## Ejemplo de Hook

```typescript
import { useState, useEffect } from 'react';
import { useAuthStore } from '@stores/authStore';
import { apiLogin } from '@services/api';

interface UseAuthReturn {
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: setAuth, logout: clearAuth } = useAuthStore();

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiLogin({ username, password });
      
      if (response.success && response.data) {
        setAuth(response.data.user, response.data.token);
      } else {
        setError(response.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
  };

  return {
    isLoading,
    error,
    login,
    logout,
  };
}
```

## Uso

```typescript
import { useAuth } from '@hooks/useAuth';

function LoginScreen() {
  const { isLoading, error, login } = useAuth();
  
  const handleLogin = async () => {
    await login('usuario', 'password');
  };
  
  return (
    <View>
      {isLoading && <ActivityIndicator />}
      {error && <Text>{error}</Text>}
      <Button onPress={handleLogin} title="Login" />
    </View>
  );
}
```
