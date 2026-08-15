// Colores DPay - Nueva identidad visual
export const lightColors = {
  // Primary - Azul DPay
  primary: '#213d8b',
  primaryDark: '#1a2f6b',
  primaryLight: '#4a5fa5',
  
  // Secondary - Rosa/Magenta DPay
  secondary: '#d4186e',
  secondaryDark: '#a8135a',
  secondaryLight: '#e04a8e',
  
  // Tertiary - Turquesa DPay
  tertiary: '#75bebf',
  tertiaryDark: '#5a9fa0',
  tertiaryLight: '#90d3d4',
  
  // Status colors
  success: '#34C759',
  successDark: '#248A3D',
  successLight: '#5DD47D',
  
  error: '#FF3B30',
  errorDark: '#D32F2F',
  errorLight: '#FF6659',
  danger: '#FF3B30',
  
  warning: '#ffdba2',
  warningDark: '#e6c391',
  warningLight: '#ffe8b8',
  
  info: '#5AC8FA',
  infoDark: '#32ADE6',
  infoLight: '#7ED4FB',
  
  // Neutrals
  white: '#FFFFFF',
  black: '#111111',
  
  // D-PAY specific colors
  silverChalice: '#9f9f9f',
  silver: '#cccccc',
  mercury: '#e3e3e3',
  alabaster: '#f7f7f7',
  wapp: '#128c7e',
  email: '#6fcbf2',
  
  // Grays
  gray: {
    50: '#f7f7f7',
    100: '#e3e3e3',
    200: '#cccccc',
    300: '#9f9f9f',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111111',
  },
  
  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#f7f7f7',
  
  // Text
  text: '#111111',
  textSecondary: '#6B7280',
  textTertiary: '#9f9f9f',
  textInverse: '#FFFFFF',
  
  // Borders
  border: '#e3e3e3',
  borderDark: '#cccccc',
  
  // Shadows
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
} as const;

export const darkColors = {
  // Primary - Azul DPay (en dark mode el botón principal es blanco)
  primary: '#FFFFFF',
  primaryDark: '#E5E7EB',
  primaryLight: '#F3F4F6',
  
  // Secondary - Rosa/Magenta DPay (se mantiene)
  secondary: '#d4186e',
  secondaryDark: '#a8135a',
  secondaryLight: '#e04a8e',
  
  // Tertiary - Turquesa DPay
  tertiary: '#75bebf',
  tertiaryDark: '#5a9fa0',
  tertiaryLight: '#90d3d4',
  
  // Status colors
  success: '#5DD47D',
  successDark: '#34C759',
  successLight: '#7FE09A',
  
  error: '#FF6659',
  errorDark: '#FF3B30',
  errorLight: '#FF8A80',
  danger: '#FF6659',
  
  warning: '#ffe8b8',
  warningDark: '#ffdba2',
  warningLight: '#fff0d1',
  
  info: '#7ED4FB',
  infoDark: '#5AC8FA',
  infoLight: '#9FE0FC',
  
  // Neutrals (invertidos)
  white: '#1F2937',
  black: '#FFFFFF',
  
  // D-PAY specific colors (ajustados para dark mode)
  silverChalice: '#9CA3AF',
  silver: '#4B5563',
  mercury: '#374151',
  alabaster: '#1F2937',
  wapp: '#25D366',
  email: '#6fcbf2',
  
  // Grays (invertidos)
  gray: {
    50: '#1F2937',
    100: '#374151',
    200: '#4B5563',
    300: '#6B7280',
    400: '#9CA3AF',
    500: '#cccccc',
    600: '#e3e3e3',
    700: '#f7f7f7',
    800: '#FAFAFA',
    900: '#FFFFFF',
  },
  
  // Backgrounds - Azul oscuro DPay
  background: '#1a2a4a',
  backgroundSecondary: '#243456',
  
  // Text (invertidos)
  text: '#FFFFFF',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  textInverse: '#111111',
  
  // Borders (oscuros)
  border: '#374151',
  borderDark: '#4B5563',
  
  // Shadows (más oscuras)
  shadowLight: 'rgba(0, 0, 0, 0.3)',
  shadow: 'rgba(0, 0, 0, 0.5)',
  shadowDark: 'rgba(0, 0, 0, 0.7)',
} as const;

export const colors = lightColors;

export type Colors = typeof lightColors;
