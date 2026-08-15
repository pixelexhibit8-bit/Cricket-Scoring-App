import { Platform } from 'react-native';

// ─── 2. TYPOGRAPHY ───────────────────────────────────────────────────────────
export const systemFont = 'SFProDisplay-Regular';
export const systemFontMedium = 'SFProDisplay-Medium';
export const systemFontBold = 'SFProDisplay-Bold';

// ─── 1. DESIGN TOKENS (COLORS) ────────────────────────────────────────────────
export const themeColors = {
  // Light Theme (Standard Screens)
  appBackground: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceOffWhite: '#F8FAFC',
  cardBackground: '#FFFFFF',
  cardBorder: '#E2E8F0',
  border: '#E2E8F0',
  borderDark: '#CBD5E1',
  primary: '#0284C7',
  primaryDark: '#0369A1',
  primaryLight: '#E0F2FE',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
  warning: '#D97706',
  warningLight: '#FEF3C7',

  // Hero Theme (Live Match Header - CREX Style)
  heroBackground: '#071B2C',
  heroBorder: '#123A56',
  heroDivider: '#1E4D6B',
  heroText: '#FFFFFF',
  heroSubtext: '#9FC4D7',

  // Scorer Theme (High Contrast Dark)
  scorerBg: '#0F172A',
  scorerCard: '#1E293B',
  scorerBorder: '#334155',
  scorerText: '#FFFFFF',
  scorerMuted: '#94A3B8',

  // Outcomes & Ball-by-ball Badges
  wicket: '#EF4444',
  boundaryFour: '#2563EB',
  boundarySix: '#7C3AED',
  normalDot: '#E2E8F0',
  normalDotText: '#0F172A',
  wideNoBall: '#D97706',
  wideAmber: '#B45309',

  // Win Bar & Accents
  winTeamA: '#2563EB',
  winTeamB: '#059669',
  accentGold: '#F59E0B'
};

// ─── TYPE SCALE (px) ──────────────────────────────────────────────────────────
export const typeScale = {
  micro: 11,
  caption: 12,
  label: 13,
  body: 14,
  name: 15,
  title: 17,
  pageTitle: 19,
  score: 30,
  heroScore: 50,
  outcome: 26,
  preInningsScore: 32,
  scorerScore: 32,
  keypad: 26,
  keyAction: 20,
  weather: 32
};

export const fontWeights = {
  regular: 'normal',
  medium: Platform.OS === 'ios' ? '500' : 'normal',
  semibold: Platform.OS === 'ios' ? '600' : 'normal',
  bold: Platform.OS === 'ios' ? '700' : 'normal',
  strong: Platform.OS === 'ios' ? 'bold' : 'normal'
};

export const publicType = {
  label: { fontSize: typeScale.caption, fontFamily: systemFontBold },
  meta: { fontSize: typeScale.label, fontFamily: systemFontMedium },
  name: { fontSize: typeScale.name, fontFamily: systemFontBold },
  strongName: { fontSize: typeScale.name, fontFamily: systemFontBold },
  score: { fontSize: typeScale.score, lineHeight: 34, fontFamily: systemFontBold },
  outcome: { fontSize: typeScale.outcome, lineHeight: 30, fontFamily: systemFontBold },
  tableValue: { fontSize: typeScale.body, fontFamily: systemFontBold }
};

// ─── 3. SPACING & RADIUS ──────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999
};

// ─── 4. SHADOWS (Light Theme) ─────────────────────────────────────────────────
export const shadows = {
  small: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  medium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3
  },
  large: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6
  }
};

// ─── UNIFIED INDUSTRIAL DESIGN TOKENS SYSTEM ──────────────────────────────────
export const theme = {
  // 1. Scorer Outdoor High-Contrast Dark Console Theme
  scorer: {
    bg: '#0F172A',
    card: '#1E293B',
    border: '#334155',
    text: '#FFFFFF',
    textMuted: '#94A3B8',
    accentSky: '#38BDF8',
    undoBg: '#78350F',
    undoBorder: '#F59E0B',
    undoText: '#FDE68A',
  },

  // 2. CREX Dark Hero Match Header Theme
  hero: {
    bg: '#071B2C',
    border: '#123A56',
    divider: '#1E4D6B',
    text: '#FFFFFF',
    subtext: '#9FC4D7',
  },

  // 3. Crisp Light Mode (Standard Screens)
  light: {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    cardBorder: '#E2E8F0',
    cardBorderDark: '#CBD5E1',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    textSubtle: '#94A3B8',
    primary: '#0284C7',
    primaryDark: '#0369A1',
    primaryLight: '#E0F2FE',
  },

  // 4. Ball Outcome & Result Badges
  outcomes: {
    four: '#2563EB',
    six: '#7C3AED',
    wicket: '#EF4444',
    wide: '#B45309',
    noBall: '#D97706',
    dot: '#E2E8F0',
    dotText: '#0F172A',
  },

  colors: themeColors,
  spacing,
  radius,
  shadows,
  typeScale,
  fontWeights,
  fonts: {
    regular: systemFont,
    medium: systemFontMedium,
    bold: systemFontBold,
  }
};

// ─── 6. REUSABLE UI BUILDING BLOCKS (COMMON STYLES) ───────────────────────────
export const commonStyles = {
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.small
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  outlineButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: systemFont,
    color: '#0F172A'
  }
};
