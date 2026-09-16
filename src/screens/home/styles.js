import { StyleSheet } from 'react-native';
import {
  systemFont,
  systemFontMedium,
  systemFontBold,
  theme,
  themeColors,
  spacing,
  radius,
  typeScale
} from '../../theme.js';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.light.bg
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.light.bg
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.lg
  },
  carouselWrap: {
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden'
  },
  bannerSlideItem: {
    height: 168,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A'
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: themeColors.border
  },
  dotActive: {
    backgroundColor: themeColors.textPrimary,
    width: 20,
    borderRadius: 4
  },
  heroActionCard: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    gap: 14
  },
  heroTextContainer: {
    gap: 4
  },
  heroTitle: {
    fontSize: 15,
    color: '#FAF8F5',
    fontFamily: systemFontMedium,
    letterSpacing: 0.2
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#A1A1AA',
    fontFamily: systemFont,
    lineHeight: 17
  },
  liveBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.35)'
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E'
  },
  liveBadgeText: {
    color: '#4ADE80',
    fontSize: 10,
    fontFamily: systemFontMedium,
    letterSpacing: 0.4
  },
  heroButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%'
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: '#3F3F46',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontMedium
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  secondaryActionText: {
    color: '#FAF8F5',
    fontSize: 13,
    fontFamily: systemFontMedium
  },
  joinCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F8F8FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#EEEEF0'
  },
  joinCodeInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    fontFamily: systemFontMedium,
    paddingVertical: 4
  },
  joinCodeSubmitBtn: {
    backgroundColor: '#EEEEF0',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  sectionTitle: {
    fontSize: 11.5,
    color: theme.light.textMuted,
    letterSpacing: 0.8,
    fontFamily: systemFontBold
  },
  sectionTitleLive: {
    fontSize: 11.5,
    color: theme.light.primary,
    letterSpacing: 0.8,
    fontFamily: systemFontBold
  },
  sectionLink: {
    fontSize: typeScale.caption,
    color: theme.light.primary,
    fontFamily: systemFontMedium
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E'
  },
  liveMatchCard: {
    backgroundColor: theme.light.cardBg,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    gap: spacing.lg - 2
  },
  liveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  liveMatchTitle: {
    fontSize: typeScale.label,
    color: theme.light.textPrimary,
    fontFamily: systemFontBold,
    flex: 1
  },
  liveTag: {
    backgroundColor: theme.light.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm
  },
  liveTagText: {
    fontSize: 10,
    color: theme.light.primary,
    fontFamily: systemFontBold
  },
  liveScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6
  },
  liveTeamCol: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1
  },
  liveTeamName: {
    fontSize: typeScale.body,
    color: theme.light.textPrimary,
    fontFamily: systemFontBold
  },
  liveTeamNameMuted: {
    fontSize: typeScale.body,
    color: theme.light.textMuted,
    fontFamily: systemFontMedium
  },
  liveScoreBig: {
    fontSize: 22,
    color: theme.light.primary,
    fontFamily: systemFontBold,
    fontVariant: ['tabular-nums']
  },
  liveOversSmall: {
    fontSize: typeScale.micro,
    color: theme.light.textMuted,
    fontFamily: systemFontMedium
  },
  liveScoreMuted: {
    fontSize: typeScale.caption,
    color: theme.light.textSubtle,
    fontFamily: systemFontMedium
  },
  liveVsText: {
    fontSize: typeScale.caption,
    color: theme.light.cardBorderDark,
    fontFamily: systemFontBold
  },
  liveCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  liveFooterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    backgroundColor: theme.light.primarySurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  liveFooterBtnText: {
    color: theme.light.primary,
    fontSize: typeScale.caption,
    fontFamily: systemFontBold
  },
  liveFooterBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    backgroundColor: theme.light.primary,
    borderRadius: radius.md
  },
  liveFooterBtnPrimaryText: {
    color: theme.hero.text,
    fontSize: typeScale.caption,
    fontFamily: systemFontBold
  },
  emptyCard: {
    backgroundColor: theme.light.cardBg,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.light.cardBorder,
    gap: spacing.sm
  },
  emptyCardTitle: {
    fontSize: typeScale.name,
    color: theme.light.textPrimary,
    fontFamily: systemFontBold,
    marginTop: spacing.xs
  },
  emptyCardSubtitle: {
    fontSize: typeScale.caption,
    color: theme.light.textMuted,
    fontFamily: systemFontMedium,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 260
  },
  emptyCardBtn: {
    backgroundColor: theme.light.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginTop: 6
  },
  emptyCardBtnText: {
    color: theme.hero.text,
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  performersRow: {
    flexDirection: 'row',
    gap: 10
  },
  performerCard: {
    flex: 1,
    backgroundColor: theme.light.cardBg,
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.light.cardBorder,
    gap: 6
  },
  performerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: theme.light.primarySurface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 2
  },
  performerBadgeText: {
    fontSize: 9,
    color: theme.light.primary,
    fontFamily: systemFontBold
  },
  performerName: {
    fontSize: 12.5,
    color: theme.light.textPrimary,
    fontFamily: systemFontBold
  },
  performerStat: {
    fontSize: typeScale.name,
    color: theme.light.primary,
    fontFamily: systemFontBold
  },
  performerStatLabel: {
    fontSize: typeScale.micro,
    color: theme.light.textMuted,
    fontFamily: systemFont
  },
  searchSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingVertical: 4
  },
  searchSummaryText: {
    fontSize: 13,
    color: themeColors.textSecondary,
    fontFamily: systemFontMedium
  },
  searchClearText: {
    fontSize: 13,
    color: themeColors.textPrimary,
    fontFamily: systemFontBold
  },
  searchPlayerListCard: {
    backgroundColor: themeColors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: themeColors.border,
    overflow: 'hidden'
  },
  searchPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12
  },
  searchPlayerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border
  },
  searchPlayerName: {
    fontSize: 13.5,
    color: themeColors.textPrimary,
    fontFamily: systemFontMedium
  },
  searchPlayerRole: {
    fontSize: 12,
    color: themeColors.textMuted,
    fontFamily: systemFont,
    marginTop: 1
  }
});

export default styles;
