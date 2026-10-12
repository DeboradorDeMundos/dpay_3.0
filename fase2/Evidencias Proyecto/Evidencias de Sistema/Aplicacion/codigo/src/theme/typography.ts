export const typography = {
  families: {
    normal: 'Montserrat-Bold_0',
    bold: 'Montserrat-Bold_0',
  },
  
  sizes: {
    xxs: 10,
    xs: 12,
    sm: 14,
    base: 16,
    s: 18,
    lg: 18,
    xl: 20,
    sm2: 26,
    '2xl': 24,
    '3xl': 30,
    m: 38,
    '4xl': 36,
    lg2: 48,
    '5xl': 48,
  },
  
  weights: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export type Typography = typeof typography;
