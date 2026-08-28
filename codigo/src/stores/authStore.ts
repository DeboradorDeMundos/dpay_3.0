import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { encode as base64Encode } from 'base-64';
import md5 from 'md5';
import { LoginInformation } from '../types';
import { setAuthToken } from '../services/apiClient';
import { usePaymentHubStore } from './paymentHubStore';

const storage = new MMKV({ id: 'auth-storage' });

/**
 * Convierte una cadena a su representación hexadecimal
 * Replica la función bin2hex del proyecto antiguo
 */
const bin2hex = (str: string): string => {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i).toString(16);
    hex += chr.length < 2 ? '0' + chr : chr;
  }
  return hex;
};

/**
 * Codifica la contraseña para la API legacy de emisión DTE.
 * Debe coincidir con PHP: substr(bin2hex(md5(strtolower($password))), 0, 64) → Base64
 */
const encodePasswordForAPI = (password: string): string => {
  const md5Hash = md5(password.toLowerCase());
  const hexed = bin2hex(md5Hash).substr(0, 64);
  return base64Encode(hexed);
};

interface AuthState {
  // State
  token: string | null;
  user: LoginInformation | null;
  isAuthenticated: boolean;
  b64pass: string | null; // Contraseña en Base64 para emisión de documentos
  savedCredentials: { rut: string; usuario: string; password: string } | null;
  pattern: string | null;
  useBiometric: boolean;
  
  // Actions
  login: (loginInfo: LoginInformation, password?: string) => void;
  logout: () => void;
  saveCredentials: (rut: string, usuario: string, password: string) => void;
  clearCredentials: () => void;
  savePattern: (pattern: string) => void;
  validatePattern: (pattern: string) => boolean;
  clearPattern: () => void;
  setBiometric: (enabled: boolean) => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  token: null,
  user: null,
  isAuthenticated: false,
  b64pass: null,
  savedCredentials: null,
  pattern: null,
  useBiometric: false,
  
  // Login
  login: (loginInfo, password) => {
    console.log('[AuthStore] Login called with:', {
      hasToken: !!loginInfo.token,
      hasUser: !!loginInfo.usuario,
      hasEmpresa: !!loginInfo.empresa,
    });
    
    try {
      console.log('[AuthStore] Saving token:', loginInfo.token);
      storage.set('token', loginInfo.token);
      
      // Regenerar siempre si hay password (alinea b64pass con login PHP)
      let b64pass = loginInfo.b64pass || null;
      if (password) {
        b64pass = encodePasswordForAPI(password);
        console.log('[AuthStore] Password encoded for API (MD5 lowercase + bin2hex + Base64)');
      }
      
      // Guardar b64pass en el loginInfo
      const loginInfoWithPass = { ...loginInfo, b64pass };
      
      console.log('[AuthStore] Stringifying loginInfo...');
      const jsonString = JSON.stringify(loginInfoWithPass);
      console.log('[AuthStore] JSON length:', jsonString.length);
      
      storage.set('loginInformation', jsonString);
      if (b64pass) {
        storage.set('b64pass', b64pass);
      }
      console.log('[AuthStore] Saved successfully');
      
      // Setear token en apiClient
      setAuthToken(loginInfo.token);
      
      set({
        token: loginInfo.token,
        user: loginInfoWithPass,
        isAuthenticated: true,
        b64pass,
      });
    } catch (error) {
      console.error('[AuthStore] Login error:', error);
      throw error;
    }
  },
  
  // Logout
  logout: () => {
    // Solo borrar token y loginInformation
    // NO borrar savedCredentials, pattern ni useBiometric
    storage.delete('token');
    storage.delete('loginInformation');
    storage.delete('b64pass');
    
    // Limpiar token en apiClient
    setAuthToken(null);

    // Limpiar estado de cobros externos para evitar que persista entre sesiones distintas
    usePaymentHubStore.getState().clear();
    
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      b64pass: null,
    });
  },
  
  // Save credentials for quick login
  saveCredentials: (rut, usuario, password) => {
    const credentials = { rut, usuario, password };
    storage.set('savedCredentials', JSON.stringify(credentials));
    set({ savedCredentials: credentials });
  },
  
  // Clear saved credentials
  clearCredentials: () => {
    storage.delete('savedCredentials');
    storage.delete('pattern');
    set({ savedCredentials: null, pattern: null });
  },
  
  // Save pattern PIN
  savePattern: (pattern) => {
    storage.set('pattern', pattern);
    set({ pattern });
  },
  
  // Validate pattern
  validatePattern: (inputPattern) => {
    const savedPattern = get().pattern;
    return savedPattern === inputPattern;
  },
  
  // Clear pattern
  clearPattern: () => {
    storage.delete('pattern');
    set({ pattern: null });
  },
  
  // Set biometric
  setBiometric: (enabled) => {
    storage.set('useBiometric', enabled ? 'true' : 'false');
    set({ useBiometric: enabled });
  },
  
  // Load from storage on app start
  loadFromStorage: () => {
    try {
      const token = storage.getString('token');
      const loginInfoStr = storage.getString('loginInformation');
      const savedCredsStr = storage.getString('savedCredentials');
      const pattern = storage.getString('pattern');
      const useBiometric = storage.getString('useBiometric') === 'true';

      const loginInfo = loginInfoStr ? JSON.parse(loginInfoStr) : null;
      const savedCreds = savedCredsStr ? JSON.parse(savedCredsStr) : null;

      // Regenerar b64pass desde credenciales guardadas (corrige encoding antiguo sin lowercase)
      let b64pass = storage.getString('b64pass') || null;
      if (savedCreds?.password) {
        b64pass = encodePasswordForAPI(savedCreds.password);
        storage.set('b64pass', b64pass);
        if (loginInfo) {
          const updated = { ...loginInfo, b64pass };
          storage.set('loginInformation', JSON.stringify(updated));
        }
      }

      if (token) {
        setAuthToken(token);
        console.log('[AuthStore] Token loaded and set in apiClient');
      }

      set({
        token: token || null,
        user: loginInfo ? { ...loginInfo, b64pass: b64pass || loginInfo.b64pass } : null,
        isAuthenticated: !!token,
        b64pass: b64pass || null,
        savedCredentials: savedCreds,
        pattern: pattern || null,
        useBiometric,
      });
    } catch (error) {
      console.error('Error loading auth from storage:', error);
    }
  },
}));
