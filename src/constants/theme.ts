// Brand palette — the same greens as the web system (layouts/executive.blade.php).

import { Platform } from 'react-native';

export const Brand = {
  dark: '#1a3c1a',
  mid: '#2d5a2d',
  light: '#4a7c4a',
  accent: '#c8e63c',
  accentSoft: '#e8f5b0',
} as const;

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#60646C',
    background: '#F6F8F4',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E8F0E3',
    border: '#DDE3D8',
    primary: Brand.mid,
    onPrimary: '#FFFFFF',
    danger: '#C0362C',
    warning: '#B26B00',
    success: '#2E7D32',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#0E120D',
    backgroundElement: '#182017',
    backgroundSelected: '#22301F',
    border: '#2C3A29',
    primary: Brand.accent,
    onPrimary: Brand.dark,
    danger: '#FF6B5E',
    warning: '#FFB547',
    success: '#7BD88F',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = { sm: 8, md: 12, lg: 16 } as const;
