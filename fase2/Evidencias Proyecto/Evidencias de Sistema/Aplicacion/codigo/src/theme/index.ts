export { colors } from './colors';
export { spacing, borderRadius } from './spacing';
export { typography } from './typography';
export { shadows } from './shadows';

export type { Colors } from './colors';
export type { Spacing, BorderRadius } from './spacing';
export type { Typography } from './typography';
export type { Shadows } from './shadows';

// Theme object completo
export const theme = {
  colors: require('./colors').colors,
  spacing: require('./spacing').spacing,
  borderRadius: require('./spacing').borderRadius,
  typography: require('./typography').typography,
  shadows: require('./shadows').shadows,
};
