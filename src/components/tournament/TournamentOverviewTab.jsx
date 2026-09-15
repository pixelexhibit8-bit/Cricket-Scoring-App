import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../../theme.js';
import { TeamIdentityMark } from '../TeamIdentityMark.jsx';
import { PlayerAvatar } from '../PlayerAvatar.jsx';
import { PointsTableSection } from './PointsTableSection.jsx';
import { resolveTeamWithRoster, formatMatchResult } from '../../utils/teamUtils.js';

function isKnockoutStage(stage) {
  if (!stage || typeof stage !== 'string') return false;
  const s = stage.trim().toLowerCase();
  return s.includes('eliminator') || s.includes('final') || s.includes('semi') || s.includes('playoff') || s.includes('quarter') || s.includes('qualifier');
}

export const TournamentOverviewTab = React.memo(function TournamentOverviewTab({
  tournament,
  stats,
  pointsTableData,
  teamFormEnabled,
  onToggleTeamForm,
  onViewAllMatches,
  onViewAllStats,
  onViewAllStandings,
  onSelectTeamSquad,
  onStartMatchScoring,
  onWatchLive,
  onViewScorecard,
  isUserOrganiser
}) {
  const matches = Array.isArray(tournament?.matches) ? tournament.matches : [];
  const teams = Array.isArray(tournament?.teams) ? tournament.teams : [];

  // Key Stats data from engine
  const mostRuns = stats?.batting?.mostRuns || {};
  const mostWickets = stats?.bowling?.mostWickets || {};
  const bestFigures = stats?.bowling?.bestFigures || {};
  const highestScore = stats?.batting?.highestScore || {};
  const mostSixes = stats?.batting?.mostSixes || {};

  // Smart Featured Matches Selection: 1-2 Upcoming/Live + 1 Latest Completed
  const featuredMatches = useMemo(() => {
    if (!matches || matches.length === 0) return [];

    const upcomingOrLive = matches.filter(m => m.status === 'LIVE' || m.status === 'UPCOMING' || (!m.status && !m.result));
    const completed = matches.filter(m => m.status === 'FINISHED' || Boolean(m.result) || m.phase === 'result');

    // Prioritize knockout upcoming matches first
    const knockouts = upcomingOrLive.filter(m => isKnockoutStage(m.stage));
    const regularUpcoming = upcomingOrLive.filter(m => !isKnockoutStage(m.stage));
    const sortedUpcoming = [...knockouts, ...regularUpcoming];

    const result = [];

    // Pick top 2 upcoming matches if available
    if (sortedUpcoming.length >= 2) {
      result.push(sortedUpcoming[0], sortedUpcoming[1]);
    } else if (sortedUpcoming.length === 1) {
      result.push(sortedUpcoming[0]);
    }

    // Pick 1 most recent completed match
    if (completed.length > 0) {
      result.push(completed[completed.length - 1]);
    }

    // If still less than 3, fill with remaining matches
    if (result.length < 3) {
      matches.forEach(m => {
        if (!result.some(r => r.id === m.id) && result.length < 3) {
          result.push(m);
        }
      });
    }

    return result;
  }, [matches]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 1. FEATURED MATCHES SECTION ── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Featured Matches</Text>
        {matches.length > 0 ? (
          <TouchableOpacity onPress={onViewAllMatches} activeOpacity={0.7}>
            <Text style={styles.seeAllLink}>All Matches</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {featuredMatches.length > 0 ? (
        <View style={styles.featuredMatchesList}>
          {featuredMatches.map((m, idx) => {
            const isFinished = Boolean(m.result || m.status === 'FINISHED' || m.phase === 'result');
            const isLive = m.status === 'LIVE' || m.phase === 'playing';

            const t1Resolved = resolveTeamWithRoster(m.team1, teams);
            const t2Resolved = resolveTeamWithRoster(m.team2, teams);

            const t1Name = t1Resolved.name || 'Team 1';
            const t2Name = t2Resolved.name || 'Team 2';

            const t1Code = t1Resolved.shortName || (typeof t1Name === 'string' ? t1Name.slice(0, 6).toUpperCase() : 'T1');
            const t2Code = t2Resolved.shortName || (typeof t2Name === 'string' ? t2Name.slice(0, 6).toUpperCase() : 'T2');

            const hasRibbon = isKnockoutStage(m.stage);
            const ribbonText = m.stage || 'Final';
            const ribbonBg = String(m.stage || '').toLowerCase().includes('final') && !String(m.stage || '').toLowerCase().includes('semi')
              ? '#334155'
              : '#1D4ED8';

            return (
              <TouchableOpacity
                key={m.id || `feat_${idx}`}
                style={styles.featuredMatchCard}
                activeOpacity={0.8}
                onPress={() => {
                  if (isLive && onWatchLive) onWatchLive(m);
                  else if (isFinished && onViewScorecard) onViewScorecard(m);
                  else if (isUserOrganiser && onStartMatchScoring) onStartMatchScoring(m);
                }}
              >
                {/* Left Vertical Ribbon: ONLY for Knockout / Big Matches */}
                {hasRibbon ? (
                  <View style={[styles.cardRibbon, { backgroundColor: ribbonBg }]}>
                    <Text style={styles.cardRibbonText} numberOfLines={1}>
                      {ribbonText}
                    </Text>
                  </View>
                ) : null}

                {/* Match Card Body */}
                <View style={[styles.matchCardBody, !hasRibbon && { paddingLeft: 16 }]}>
                  {/* Team 1 */}
                  <View style={styles.teamSideBlock}>
                    <TeamIdentityMark team={t1Resolved} tournamentTeams={teams} size={30} />
                    <Text style={styles.teamCodeText} numberOfLines={1}>
                      {t1Code}
                    </Text>
                  </View>

                  {/* Center Status / Time / Result */}
                  <View style={styles.matchCenterBlock}>
                    {isFinished ? (
                      (() => {
                        const { winnerHeadline, marginText } = formatMatchResult(m, t1Resolved, t2Resolved, teams);
                        return (
                          <View style={styles.finishedResultCenter}>
                            <Text style={styles.winnerHeadline} numberOfLines={1}>
                              {winnerHeadline}
                            </Text>
                            <Text style={styles.winnerSubMargin} numberOfLines={1}>
                              {marginText}
                            </Text>
                          </View>
                        );
                      })()
                    ) : isLive ? (
                      <View style={styles.liveCenterBlock}>
                        <View style={styles.liveBadge}>
                          <View style={styles.liveDot} />
                          <Text style={styles.liveBadgeText}>LIVE</Text>
                        </View>
                        <Text style={styles.liveScoreText}>
                          {m.team1?.score || 'In Progress'}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.upcomingCenterBlock}>
                        <Text style={styles.matchTimeText}>
                          {m.time || '07:30 PM'}
                        </Text>
                        <Text style={styles.matchDateText}>
                          {m.dateStr || 'Tomorrow'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Team 2 */}
                  <View style={styles.teamSideBlockRight}>
                    <Text style={styles.teamCodeText} numberOfLines={1}>
                      {t2Code}
                    </Text>
                    <TeamIdentityMark team={t2Resolved} tournamentTeams={teams} size={30} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyFeaturedCard}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={24} color="#94A3B8" />
          <Text style={styles.emptyCardText}>No fixtures scheduled yet</Text>
        </View>
      )}

      {/* ── 2. KEY STATS SECTION ── */}
      <View style={[styles.sectionHeaderRow, { marginTop: 18 }]}>
        <Text style={styles.sectionTitle}>Key Stats</Text>
        {stats?.hasMatchesPlayed ? (
          <TouchableOpacity onPress={onViewAllStats} activeOpacity={0.7}>
            <Text style={styles.seeAllLink}>See All</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {stats?.hasMatchesPlayed ? (
        <>
          {/* Top Large Highlight Card: Most Runs */}
          <TouchableOpacity
            style={styles.heroStatCard}
            activeOpacity={0.85}
            onPress={onViewAllStats}
          >
            <Text style={styles.heroStatCategoryLabel}>Most Runs</Text>
            <View style={styles.heroStatRow}>
              <PlayerAvatar name={mostRuns.player} size={48} />
              <View style={styles.heroStatPlayerDetails}>
                <Text style={styles.heroStatPlayerName} numberOfLines={1}>
                  {mostRuns.player || 'Leading Batter'}
                </Text>
                <Text style={styles.heroStatPlayerTeam} numberOfLines={1}>
                  {mostRuns.team || tournament?.name || 'Tournament'}
                </Text>
              </View>
              <View style={styles.heroStatValBlock}>
                <Text style={styles.heroStatNumber}>{mostRuns.value || '-'}</Text>
                <Text style={styles.heroStatUnit}>runs</Text>
              </View>
            </View>
            {/* Page dot indicator */}
            <View style={styles.statDotContainer}>
              <View style={styles.statDotActive} />
            </View>
          </TouchableOpacity>

          {/* 2-Column Grid: Most Wickets & Best Figures */}
          <View style={styles.twoColGridRow}>
            {/* Most Wickets Card */}
            <TouchableOpacity
              style={styles.gridMiniStatCard}
              activeOpacity={0.85}
              onPress={onViewAllStats}
            >
              <Text style={styles.miniCardCategoryLabel}>Most Wickets</Text>
              <View style={styles.miniCardPlayerRow}>
                <PlayerAvatar name={mostWickets.player} size={36} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.miniCardTeamCode} numberOfLines={1}>
                    {mostWickets.team ? String(mostWickets.team).slice(0, 8).toUpperCase() : 'TEAM'}
                  </Text>
                  <Text style={styles.miniCardPlayerName} numberOfLines={1}>
                    {mostWickets.player || '-'}
                  </Text>
                </View>
              </View>
              <View style={styles.miniCardValueRow}>
                <Text style={styles.miniCardNumber}>{mostWickets.value || '-'}</Text>
                <Text style={styles.miniCardUnit}>wickets</Text>
              </View>
            </TouchableOpacity>

            {/* Best Figures Card */}
            <TouchableOpacity
              style={styles.gridMiniStatCard}
              activeOpacity={0.85}
              onPress={onViewAllStats}
            >
              <Text style={styles.miniCardCategoryLabel}>Best Figures</Text>
              <View style={styles.miniCardPlayerRow}>
                <PlayerAvatar name={bestFigures.player} size={36} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.miniCardTeamCode} numberOfLines={1}>
                    {bestFigures.team ? String(bestFigures.team).slice(0, 8).toUpperCase() : 'TEAM'}
                  </Text>
                  <Text style={styles.miniCardPlayerName} numberOfLines={1}>
                    {bestFigures.player || '-'}
                  </Text>
                </View>
              </View>
              <View style={styles.miniCardValueRow}>
                <Text style={styles.miniCardNumber}>{bestFigures.value || '-'}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Single Row Stat Cards: Highest Score & Most Sixes */}
          <TouchableOpacity
            style={styles.singleRowStatCard}
            activeOpacity={0.85}
            onPress={onViewAllStats}
          >
            <Text style={styles.singleRowCategoryLabel}>Highest Score</Text>
            <View style={styles.singleRowContent}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Text style={styles.singleRowPlayerName} numberOfLines={1}>
                  {highestScore.player || '-'}
                </Text>
                {highestScore.team ? (
                  <Text style={styles.singleRowTeamCode} numberOfLines={1}>
                    {String(highestScore.team).slice(0, 8).toUpperCase()}
                  </Text>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                <Text style={styles.singleRowValueText}>{highestScore.value || '-'}</Text>
                <Text style={styles.singleRowUnitText}>runs</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.singleRowStatCard}
            activeOpacity={0.85}
            onPress={onViewAllStats}
          >
            <Text style={styles.singleRowCategoryLabel}>Most Sixes</Text>
            <View style={styles.singleRowContent}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Text style={styles.singleRowPlayerName} numberOfLines={1}>
                  {mostSixes.player || '-'}
                </Text>
                {mostSixes.team ? (
                  <Text style={styles.singleRowTeamCode} numberOfLines={1}>
                    {String(mostSixes.team).slice(0, 8).toUpperCase()}
                  </Text>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                <Text style={styles.singleRowValueText}>{mostSixes.value || '-'}</Text>
                <Text style={styles.singleRowUnitText}>sixes</Text>
              </View>
            </View>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.statsNotAvailableCard}>
          <View style={styles.statsNotAvailableIconWrap}>
            <MaterialCommunityIcons name="chart-box-outline" size={24} color="#0284C7" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.statsNotAvailableTitle}>Stats Not Available Yet</Text>
            <Text style={styles.statsNotAvailableSubtitle}>
              Tournament leaderboards and player stats will appear here after matches are played.
            </Text>
          </View>
        </View>
      )}

      {/* ── 3. POINTS TABLE PREVIEW SECTION ── */}
      <View style={{ marginTop: 14 }}>
        <PointsTableSection
          pointsTableData={pointsTableData}
          totalTeams={teams.length}
          tournamentTeams={teams}
          isOverviewPreview={true}
          teamFormEnabled={teamFormEnabled}
          onToggleTeamForm={onToggleTeamForm}
          onViewAll={onViewAllStandings}
        />
      </View>

      {/* ── 4. TEAM SQUADS CAROUSEL SECTION ── */}
      {teams.length > 0 ? (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.sectionTitle}>Team Squads</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.teamSquadsScrollContent}
          >
            {teams.map((t, tIdx) => {
              const tCode = t.shortName || (t.name ? t.name.slice(0, 5).toUpperCase() : `T${tIdx + 1}`);
              return (
                <TouchableOpacity
                  key={t.id || `team_sq_${tIdx}`}
                  style={styles.teamSquadCard}
                  activeOpacity={0.8}
                  onPress={() => onSelectTeamSquad && onSelectTeamSquad(t)}
                >
                  <View style={styles.teamSquadLogoContainer}>
                    <TeamIdentityMark team={t} tournamentTeams={teams} size={46} />
                  </View>
                  <Text style={styles.teamSquadCardName} numberOfLines={1}>
                    {tCode}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* ── 5. SERIES INFO SECTION ── */}
      <View style={{ marginTop: 18, marginBottom: 20 }}>
        <Text style={styles.sectionTitle}>Series Info</Text>
        <View style={styles.seriesInfoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoKeyLabel}>Series</Text>
            <Text style={styles.infoValueText} numberOfLines={2}>
              {tournament.fullName || tournament.name || tournament.title}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKeyLabel}>Host</Text>
            <Text style={styles.infoValueText}>
              {tournament.host || tournament.city || 'Ground Location'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKeyLabel}>Duration</Text>
            <Text style={styles.infoValueText}>
              {tournament.duration || tournament.startDate || 'Season 2026'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKeyLabel}>Format</Text>
            <Text style={styles.infoValueText}>
              {tournament.format || `${matches.length || 8} T20s`}
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoKeyLabel}>Broadcaster</Text>
            <Text style={styles.infoValueText}>
              {tournament.broadcaster || 'CricFlow Live, Ground Scoring'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.appBackground
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  seeAllLink: {
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    color: '#0284C7'
  },
  featuredMatchesList: {
    gap: 10
  },
  featuredMatchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    flexDirection: 'row',
    overflow: 'hidden',
    height: 74
  },
  cardRibbon: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4
  },
  cardRibbonText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontFamily: systemFontBold,
    transform: [{ rotate: '-90deg' }],
    width: 65,
    textAlign: 'center'
  },
  matchCardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14
  },
  teamSideBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 90
  },
  teamSideBlockRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    width: 90
  },
  teamCodeText: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  matchCenterBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  finishedResultCenter: {
    alignItems: 'center'
  },
  winnerHeadline: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: '#991B1B'
  },
  winnerSubMargin: {
    fontSize: 10.5,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    marginTop: 1
  },
  liveCenterBlock: {
    alignItems: 'center'
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48'
  },
  liveBadgeText: {
    color: '#E11D48',
    fontSize: 9,
    fontFamily: systemFontBold
  },
  liveScoreText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary,
    marginTop: 2
  },
  upcomingCenterBlock: {
    alignItems: 'center'
  },
  matchTimeText: {
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    color: themeColors.textMuted
  },
  matchDateText: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    marginTop: 1
  },
  emptyFeaturedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  emptyCardText: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  heroStatCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    padding: 14,
    marginBottom: 10
  },
  heroStatCategoryLabel: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#7E22CE',
    marginBottom: 8
  },
  heroStatRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  heroStatPlayerDetails: {
    flex: 1,
    marginLeft: 12
  },
  heroStatPlayerName: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  heroStatPlayerTeam: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    marginTop: 2
  },
  heroStatValBlock: {
    alignItems: 'flex-end'
  },
  heroStatNumber: {
    fontSize: 22,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    lineHeight: 26
  },
  heroStatUnit: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  statDotContainer: {
    alignItems: 'center',
    marginTop: 6
  },
  statDotActive: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#D8B4FE'
  },
  twoColGridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  gridMiniStatCard: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 12
  },
  miniCardCategoryLabel: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#15803D',
    marginBottom: 8
  },
  miniCardPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  miniCardTeamCode: {
    fontSize: 9.5,
    fontFamily: systemFontBold,
    color: themeColors.textMuted
  },
  miniCardPlayerName: {
    fontSize: 12.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  miniCardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4
  },
  miniCardNumber: {
    fontSize: 20,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  miniCardUnit: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  singleRowStatCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8
  },
  singleRowCategoryLabel: {
    fontSize: 10.5,
    fontFamily: systemFontMedium,
    color: '#1D4ED8',
    marginBottom: 4
  },
  singleRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  singleRowPlayerName: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  singleRowTeamCode: {
    fontSize: 10,
    fontFamily: systemFontMedium,
    color: themeColors.textMuted
  },
  singleRowValueText: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  singleRowUnitText: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  teamSquadsScrollContent: {
    paddingVertical: 6,
    gap: 10
  },
  teamSquadCard: {
    width: 100,
    backgroundColor: '#F8F8FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  teamSquadLogoContainer: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  teamSquadCardName: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    textAlign: 'center'
  },
  seriesInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8FA'
  },
  infoKeyLabel: {
    fontSize: 12.5,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    width: 100
  },
  infoValueText: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary,
    flex: 1,
    textAlign: 'right'
  },
  statsNotAvailableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  statsNotAvailableIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0F2FE'
  },
  statsNotAvailableTitle: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    marginBottom: 2
  },
  statsNotAvailableSubtitle: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: themeColors.textSecondary,
    lineHeight: 16
  }
});
