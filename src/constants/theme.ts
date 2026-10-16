// Design tokens — the same palette as the web system (resources/views/layouts:
// --gd/--gm/--gl greens, --yg lime, --cr cream, --bd border, --rd red; the
// dark theme follows the executive dashboard's --ex-* palette).

export const Brand = {
  dark: '#1a3c1a',
  mid: '#2d5a2d',
  light: '#4a7c4a',
  accent: '#c8e63c',
  accentDark: '#a8c42c',
  accentSoft: '#e8f5b0',
  cream: '#f5f0e8',
  red: '#8b1a1a',
} as const;

export const Colors = {
  light: {
    text: '#1f2a1f',
    textSecondary: '#5a7a5a',
    textMuted: '#8a9a8a',
    background: Brand.cream,
    backgroundElement: '#ffffff',
    backgroundSelected: '#eef3e6',
    surfaceAlt: '#faf7f1',
    border: '#e2ddd4',
    primary: Brand.mid,
    primaryStrong: Brand.dark,
    onPrimary: '#ffffff',
    accent: Brand.accent,
    onAccent: Brand.dark,
    danger: Brand.red,
    dangerSoft: '#fde8e8',
    warning: '#a15c00',
    warningSoft: '#fff2d9',
    success: '#2e7d32',
    successSoft: '#e5f2e3',
    info: '#1f5f8b',
    infoSoft: '#e4eef7',
    neutralSoft: '#efebe3',
    header: Brand.dark,
    onHeader: '#ffffff',
  },
  dark: {
    text: '#e6edf3',
    textSecondary: '#9aa5b1',
    textMuted: '#7d8590',
    background: '#0d1117',
    backgroundElement: '#161b22',
    backgroundSelected: '#1f2a1f',
    surfaceAlt: '#1c2230',
    border: '#30363d',
    primary: Brand.accent,
    primaryStrong: Brand.accentDark,
    onPrimary: Brand.dark,
    accent: Brand.accent,
    onAccent: Brand.dark,
    danger: '#f85149',
    dangerSoft: 'rgba(248,81,73,0.15)',
    warning: '#d29922',
    warningSoft: 'rgba(210,153,34,0.15)',
    success: '#3fb950',
    successSoft: 'rgba(63,185,80,0.15)',
    info: '#58a6ff',
    infoSoft: 'rgba(88,166,255,0.15)',
    neutralSoft: '#21262d',
    header: '#161b22',
    onHeader: '#e6edf3',
  },
} as const;

export type Theme = (typeof Colors)['light'] | (typeof Colors)['dark'];
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Nunito, as on the web. React Native picks weights by font family name, so
// each weight is its own family (loaded in app/_layout.tsx).
export const Fonts = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

export const Type = {
  display: { fontFamily: Fonts.black, fontSize: 28, lineHeight: 34 },
  title: { fontFamily: Fonts.extrabold, fontSize: 22, lineHeight: 28 },
  heading: { fontFamily: Fonts.bold, fontSize: 17, lineHeight: 23 },
  body: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: Fonts.semibold, fontSize: 15, lineHeight: 21 },
  label: { fontFamily: Fonts.bold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: Fonts.regular, fontSize: 12, lineHeight: 16 },
  overline: { fontFamily: Fonts.extrabold, fontSize: 11, lineHeight: 14, letterSpacing: 0.8 },
} as const;

export type TypeVariant = keyof typeof Type;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
  seven: 48,
} as const;

export const Radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

// One status → tone map for badges, tracker accents and queue tabs, so a
// status never shows in two different colours. Tones resolve to theme colours.
export type Tone = 'neutral' | 'info' | 'primary' | 'warning' | 'success' | 'danger';

const STATUS_TONES: Record<string, Tone> = {
  'For Acknowledgment': 'info',
  'For Classification': 'info',
  Classified: 'info',
  Assigned: 'primary',
  'In Progress Service Request': 'primary',
  'Closed Service Request': 'primary',
  'In Progress Service Report': 'primary',
  'Done Service Report': 'primary',
  'Report For Review': 'warning',
  'Approved Service Report': 'success',
  'Requestor Confirmation': 'warning',
  'On Hold': 'warning',
  Escalated: 'danger',
  Closed: 'success',
  Cancelled: 'neutral',
};

export function statusTone(status: string | null | undefined): Tone {
  return (status && STATUS_TONES[status]) || 'neutral';
}

export function toneColors(theme: Theme, tone: Tone): { fg: string; bg: string } {
  switch (tone) {
    case 'info':
      return { fg: theme.info, bg: theme.infoSoft };
    case 'primary':
      return { fg: theme.primary, bg: theme.backgroundSelected };
    case 'warning':
      return { fg: theme.warning, bg: theme.warningSoft };
    case 'success':
      return { fg: theme.success, bg: theme.successSoft };
    case 'danger':
      return { fg: theme.danger, bg: theme.dangerSoft };
    default:
      return { fg: theme.textSecondary, bg: theme.neutralSoft };
  }
}

// Priority colours, as on the web's priority dots.
export function priorityTone(priority: string | null | undefined): Tone {
  switch (priority) {
    case 'Critical':
      return 'danger';
    case 'High':
      return 'warning';
    case 'Medium':
      return 'info';
    default:
      return 'neutral';
  }
}
