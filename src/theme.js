import { Platform } from 'react-native';

// ==============================================================================
// CRICFLOW DESIGN SYSTEM V1 (4-COLOR MINIMAL PREMIUM PALETTE)
// Single Source of Truth for Colors, Typography, Spacing, Cards, Inputs & UI Tokens
// ==============================================================================

// ─── 1. CORE FONTS & TYPOGRAPHY TOKENS ───────────────────────────────────────
// Only Regular (400) and Medium (500/SemiBold) — Bold removed by design
export const fonts = {
  regular: 'SFProDisplay-Regular', // 400 - Paragraphs, meta, helper text
  medium: 'SFProDisplay-Medium',   // 500 - Names, scores, titles, buttons, labels
  bold: 'SFProDisplay-Medium',     // Alias → Medium (Bold intentionally removed)
};

export const typography = {
  body: fonts.regular,
  subheading: fonts.medium,
  heading: fonts.medium,
  caption: fonts.regular,
  label: fonts.medium,
  score: fonts.medium,
};

// Aliases for seamless backward compatibility across all existing screens & modals
export const systemFont = fonts.regular;
export const systemFontMedium = fonts.medium;
export const systemFontBold = fonts.medium; // → Medium (Bold removed)

export const fontWeights = {
  regular: 'normal',
  medium: Platform.OS === 'ios' ? '500' : 'normal',
  semibold: Platform.OS === 'ios' ? '600' : 'normal',
  bold: Platform.OS === 'ios' ? '700' : 'normal',
  strong: Platform.OS === 'ios' ? 'bold' : 'normal'
};

// ─── 2. TYPE SCALE (px) ──────────────────────────────────────────────────────
export const typeScale = {
  micro: 11,
  caption: 12,
  label: 13,
  body: 14,
  name: 15,
  title: 17,
  pageTitle: 19,
  score: 30,
  heroScore: 46,
  outcome: 26,
  preInningsScore: 32,
  scorerScore: 38,
  keypad: 26,
  keyAction: 20,
  weather: 32
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

// ─── 3. DESIGN TOKENS (COLORS - 4-COLOR PREMIUM SYSTEM) ───────────────────────
export const themeColors = {
  // ── 1. Clean Canvas Background & Surfaces ──
  appBackground: '#FCFCFD',   // Pure & Airy Near-White Canvas
  surface: '#FFFFFF',         // Pure White Surface
  surfaceOffWhite: '#F8F8FA', // Subtle Soft Contrast
  cardBackground: '#FFFFFF',  // Card Surface
  cardBorder: '#EEEEF0',      // Ultra-clean Subtle Border
  border: '#EEEEF0',          // Divider Lines
  borderDark: '#DCDCE0',      // Active / Emphasized Border

  // ── 2. Primary Font & Neutral Palette ──
  textPrimary: '#333333',     // Charcoal Dark Font on Light Canvas
  textSecondary: '#555555',   // Medium Neutral Font
  textMuted: '#777777',       // Muted Label / Hint Font
  textSubtle: '#999999',      // Subtle Placeholder Font

  // ── 3. Brand & Interactive Buttons ──
  primary: '#1E1E20',         // Deep Dark Action / Button Color
  primaryDark: '#121214',     // Dark Pressed State
  primaryLight: '#F5F5F5',    // Light Hover / Soft Tag
  primarySurface: '#FAFAFA',  // Light Surface
  buttonText: '#FAF8F5',      // Soft Off-White Font on Dark Buttons

  // ── 4. Dark Popups & Match Hero Header ──
  heroBackground: '#18181B',  // Deep Dark Charcoal Popup & Hero
  heroCardBg: '#232326',      // Dark Card Surface
  heroBorder: '#323236',      // Dark Border
  heroDivider: '#3D3D42',     // Dark Divider
  heroText: '#FAF8F5',        // Soft Off-White Font on Dark Surfaces
  heroSubtext: '#D4D4D8',     // Muted Font on Dark Surfaces

  // ── 5. Scorer Console Theme (Dark Outdoor Contrast) ──
  scorerBg: '#18181B',
  scorerCard: '#232326',
  scorerBorder: '#323236',
  scorerText: '#FAF8F5',      // Soft Off-White Font on Scorer Console
  scorerMuted: '#A1A1AA',

  // ── 6. Status & Cricket Ball Outcomes ──
  warning: '#D97706',
  warningLight: '#FEF3C7',
  wicket: '#DC2626',
  wicketDark: '#B91C1C',
  boundaryFour: '#2563EB',
  boundarySix: '#7C3AED',
  normalDot: '#EBE3D5',
  normalDotText: '#333333',
  wideNoBall: '#D97706',
  wideAmber: '#B45309',

  // ── 7. Win Indicators & Accents ──
  winTeamA: '#2563EB',
  winTeamB: '#059669',
  accentGold: '#D97706',

  // ── 8. Ground Spotlight Card Theme Tokens ──
  spotlightBatterBg: '#0F2744',
  spotlightBatterBorder: '#1E3A8A',
  spotlightBowlerBg: '#EA580C',
  spotlightBowlerBorder: '#C2410C',
  spotlightAllRounderBg: '#18181B',
  spotlightAllRounderBorder: '#27272A'
};

// ─── 4. SPACING & RADIUS ──────────────────────────────────────────────────────
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
  sm: 6,
  md: 8,
  lg: 12,
  xl: 14,
  xxl: 16,
  pill: 999
};

// ─── 5. SHADOWS (Clean Border-Led Flat Design) ──────────────────────────────────
export const shadows = {
  small: {
    elevation: 0,
    shadowOpacity: 0
  },
  medium: {
    elevation: 0,
    shadowOpacity: 0
  },
  large: {
    elevation: 0,
    shadowOpacity: 0
  }
};

// ─── 6. UNIFIED THEME MAP (LINKED DIRECTLY TO TOKENS FOR 100% CONSISTENCY) ─────
export const theme = {
  // 1. Scorer Console Theme
  scorer: {
    bg: themeColors.scorerBg,
    card: themeColors.scorerCard,
    border: themeColors.scorerBorder,
    text: themeColors.scorerText,
    textMuted: themeColors.scorerMuted,
    accentSky: '#38BDF8',
    undoBg: '#78350F',
    undoBorder: '#F59E0B',
    undoText: '#FDE68A',
  },

  // 2. Dark Hero & Dark Popup Theme
  hero: {
    bg: themeColors.heroBackground,
    cardBg: themeColors.heroCardBg,
    border: themeColors.heroBorder,
    divider: themeColors.heroDivider,
    text: themeColors.heroText,
    subtext: themeColors.heroSubtext,
  },

  // 3. Butter Canvas Light Mode (Standard Screens)
  light: {
    bg: themeColors.appBackground,
    cardBg: themeColors.cardBackground,
    cardBorder: themeColors.cardBorder,
    cardBorderDark: themeColors.borderDark,
    textPrimary: themeColors.textPrimary,
    textSecondary: themeColors.textSecondary,
    textMuted: themeColors.textMuted,
    textSubtle: themeColors.textSubtle,
    primary: themeColors.primary,
    primaryDark: themeColors.primaryDark,
    primaryLight: themeColors.primaryLight,
    primarySurface: themeColors.primarySurface,
  },

  // 4. Ball Outcome & Result Badges
  outcomes: {
    four: themeColors.boundaryFour,
    six: themeColors.boundarySix,
    wicket: themeColors.wicket,
    wide: themeColors.wideAmber,
    noBall: themeColors.wideNoBall,
    dot: themeColors.normalDot,
    dotText: themeColors.normalDotText,
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

// ─── 7. REUSABLE UI BUILDING BLOCKS (COMMON STYLES) ───────────────────────────
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
    backgroundColor: themeColors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#F3EDE1',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: themeColors.border
  },
  card: {
    backgroundColor: themeColors.cardBackground,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: themeColors.cardBorder,
    ...shadows.small
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButton: {
    backgroundColor: themeColors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  outlineButton: {
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  inputField: {
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: typeScale.body,
    fontFamily: systemFont,
    color: themeColors.textPrimary
  }
};
