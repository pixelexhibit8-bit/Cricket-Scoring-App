import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../../theme.js';
import { TeamIdentityMark } from '../TeamIdentityMark.jsx';
import { resolveTeamWithRoster, formatMatchResult, cleanMatchDate, getScorePartsFromText } from '../../utils/teamUtils.js';

function getOrdinal(n) {
  const num = parseInt(n, 10);
  if (!num || isNaN(num)) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatMatchHeaderTitle(m, tournament, fallbackIdx = 0) {
  const overs = Number(m.overs || tournament?.overs || 20);
  const formatText = overs === 20 ? 'T20' : (overs === 10 ? 'T10' : (overs === 50 ? 'ODI' : `${overs} Ov`));
  const venue = m.venue || tournament?.venue || (Array.isArray(tournament?.venues) && tournament.venues[0]) || tournament?.city || tournament?.host || 'Cricket Ground';

  const rawStage = String(m.stage || '').trim();
  const lowerStage = rawStage.toLowerCase();

  let prefix = '';
  if (lowerStage.includes('final') || lowerStage.includes('eliminator') || lowerStage.includes('qualifier') || lowerStage.includes('semi')) {
    prefix = `${rawStage} ${formatText}`;
  } else if (m.matchNumber || m.matchNo) {
    prefix = `${getOrdinal(m.matchNumber || m.matchNo)} ${formatText}`;
  } else if (rawStage && !lowerStage.includes('match')) {
    prefix = `${rawStage} ${formatText}`;
  } else {
    const num = fallbackIdx + 1;
    prefix = `${getOrdinal(num)} ${formatText}`;
  }

  return `${prefix}, ${venue}`;
}

export const TournamentMatchesTab = React.memo(function TournamentMatchesTab({
  tournament,
  onStartMatchScoring,
  onWatchLive,
  onViewScorecard,
  isUserOrganiser,
  onOpenAutoSchedule,
  onOpenManualSchedule,
  onRescheduleMatch
}) {
  const matches = Array.isArray(tournament?.matches) ? tournament.matches : [];
  const teams = Array.isArray(tournament?.teams) ? tournament.teams : [];

  // Filter by Team State
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('ALL');
  const [teamDropdownVisible, setTeamDropdownVisible] = useState(false);

  // Filter matches by selected team
  const filteredMatches = useMemo(() => {
    if (selectedTeamFilter === 'ALL') return matches;
    const filterNorm = selectedTeamFilter.toLowerCase().trim();
    return matches.filter(m => {
      const t1Resolved = resolveTeamWithRoster(m.team1, teams);
      const t2Resolved = resolveTeamWithRoster(m.team2, teams);
      const t1Name = String(t1Resolved.name || m.team1?.name || m.team1?.shortName || m.team1 || '').toLowerCase().trim();
      const t2Name = String(t2Resolved.name || m.team2?.name || m.team2?.shortName || m.team2 || '').toLowerCase().trim();
      const t1Short = String(t1Resolved.shortName || m.team1?.shortName || '').toLowerCase().trim();
      const t2Short = String(t2Resolved.shortName || m.team2?.shortName || '').toLowerCase().trim();
      return t1Name.includes(filterNorm) || t2Name.includes(filterNorm) ||
        (t1Short && t1Short === filterNorm) || (t2Short && t2Short === filterNorm);
    });
  }, [matches, selectedTeamFilter, teams]);

  // Split into Completed vs Upcoming / Live
  const { completedMatches, liveMatches, upcomingMatchesGrouped } = useMemo(() => {
    const completed = [];
    const live = [];
    const upcoming = [];

    filteredMatches.forEach(m => {
      const isFinished = Boolean(m.result || m.status === 'FINISHED' || m.phase === 'result' || m.phase === 'finished');
      const isLive = m.status === 'LIVE' || m.phase === 'playing' || m.phase === 'inningBreak' || Boolean(m.rawMatchData && m.rawMatchData.phase !== 'finished');

      if (isFinished) {
        completed.push(m);
      } else if (isLive) {
        live.push(m);
      } else {
        upcoming.push(m);
      }
    });

    // Group upcoming matches by Date string (e.g. "Tomorrow, 16 September" or "17 September, Thursday")
    const groups = {};
    upcoming.forEach(m => {
      const rawDate = m.dateGroup || m.dateStr || m.matchDate || 'Upcoming Fixtures';
      const dateKey = cleanMatchDate(rawDate, 'Upcoming Fixtures');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(m);
    });

    return {
      completedMatches: completed,
      liveMatches: live,
      upcomingMatchesGrouped: Object.entries(groups)
    };
  }, [filteredMatches]);

  const selectedTeamLabel = selectedTeamFilter === 'ALL'
    ? 'All Teams'
    : (teams.find(t => t.name === selectedTeamFilter || t.shortName === selectedTeamFilter)?.name || selectedTeamFilter);

  return (
    <View style={styles.container}>
      {/* ── 1. FILTER BY TEAMS BAR ── */}
      <View style={styles.filterBar}>
        <Text style={styles.filterBarLabel}>Filter by teams</Text>
        <TouchableOpacity
          style={styles.filterDropdownBtn}
          onPress={() => setTeamDropdownVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.filterDropdownText} numberOfLines={1}>
            {selectedTeamLabel}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#0284C7" />
        </TouchableOpacity>
      </View>

      {/* ── 2. MATCHES SCROLL STREAM ── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── A. COMPLETED MATCHES SECTION ── */}
        {completedMatches.length > 0 ? (
          <View style={styles.matchesSectionBlock}>
            {completedMatches.map((m, idx) => {
              const t1Resolved = resolveTeamWithRoster(m.team1, teams);
              const t2Resolved = resolveTeamWithRoster(m.team2, teams);

              const t1Name = t1Resolved.shortName || t1Resolved.name || 'Team 1';
              const t2Name = t2Resolved.shortName || t2Resolved.name || 'Team 2';

              const t1Raw = m.team1?.score || (m.innings?.[0]?.battingTeam?.runs != null ? `${m.innings[0].battingTeam.runs}-${m.innings[0].battingTeam.wickets || 0}` : (m.team1?.runs != null ? `${m.team1.runs}-${m.team1.wickets || 0}` : ''));
              const t1Parts = getScorePartsFromText(t1Raw);
              const t1Score = t1Parts.score || (m.team1?.runs != null ? `${m.team1.runs}-${m.team1.wickets || 0}` : (m.innings?.[0]?.battingTeam?.runs != null ? `${m.innings[0].battingTeam.runs}-${m.innings[0].battingTeam.wickets || 0}` : (t1Raw || '0-0')));
              const t1Overs = t1Parts.overs || (m.team1?.overs ? String(m.team1.overs).replace(/[()]/g, '').trim() : (m.innings?.[0]?.overs ? String(m.innings[0].overs).replace(/[()]/g, '').trim() : ''));

              const t2Raw = m.team2?.score || (m.innings?.[1]?.battingTeam?.runs != null ? `${m.innings[1].battingTeam.runs}-${m.innings[1].battingTeam.wickets || 0}` : (m.team2?.runs != null ? `${m.team2.runs}-${m.team2.wickets || 0}` : ''));
              const t2Parts = getScorePartsFromText(t2Raw);
              const t2Score = t2Parts.score || (m.team2?.runs != null ? `${m.team2.runs}-${m.team2.wickets || 0}` : (m.innings?.[1]?.battingTeam?.runs != null ? `${m.innings[1].battingTeam.runs}-${m.innings[1].battingTeam.wickets || 0}` : (t2Raw || '0-0')));
              const t2Overs = t2Parts.overs || (m.team2?.overs ? String(m.team2.overs).replace(/[()]/g, '').trim() : (m.innings?.[1]?.overs ? String(m.innings[1].overs).replace(/[()]/g, '').trim() : ''));

              const headerTitle = formatMatchHeaderTitle(m, tournament, idx);
              const { winnerHeadline, marginText } = formatMatchResult(m, t1Resolved, t2Resolved, teams);

              return (
                <TouchableOpacity
                  key={m.id || `comp_${idx}`}
                  style={styles.completedMatchCard}
                  activeOpacity={0.85}
                  onPress={() => onViewScorecard && onViewScorecard(m)}
                >
                  {/* Match Header Line */}
                  <Text style={styles.matchHeaderVenueText} numberOfLines={1}>
                    {headerTitle}
                  </Text>

                  {/* Body: Left Team Scores | Right Result */}
                  <View style={styles.completedCardBody}>
                    {/* Left Teams & Scores */}
                    <View style={styles.scoresColumn}>
                      {/* Team 1 */}
                      <View style={styles.teamScoreRow}>
                        <TeamIdentityMark team={t1Resolved} tournamentTeams={teams} size={26} />
                        <Text style={styles.completedTeamCode} numberOfLines={1}>
                          {t1Name}
                        </Text>
                        <Text style={styles.completedScoreMain}>
                          {t1Score}
                          {t1Overs ? (
                            <Text style={styles.completedOversSub}> ({t1Overs})</Text>
                          ) : null}
                        </Text>
                      </View>

                      {/* Team 2 */}
                      <View style={[styles.teamScoreRow, { marginTop: 10 }]}>
                        <TeamIdentityMark team={t2Resolved} tournamentTeams={teams} size={26} />
                        <Text style={styles.completedTeamCode} numberOfLines={1}>
                          {t2Name}
                        </Text>
                        <Text style={styles.completedScoreMain}>
                          {t2Score}
                          {t2Overs ? (
                            <Text style={styles.completedOversSub}> ({t2Overs})</Text>
                          ) : null}
                        </Text>
                      </View>
                    </View>

                    {/* Vertical Divider */}
                    <View style={styles.verticalDivider} />

                    {/* Right Result Block */}
                    <View style={styles.resultRightBlock}>
                      <Text style={styles.resultWonHeadline} numberOfLines={1}>
                        {winnerHeadline}
                      </Text>
                      <Text style={styles.resultWonMarginText} numberOfLines={2}>
                        {marginText}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {/* ── B. LIVE MATCHES SECTION ── */}
        {liveMatches.length > 0 ? (
          <View style={styles.matchesSectionBlock}>
            {liveMatches.map((m, idx) => {
              const t1Resolved = resolveTeamWithRoster(m.team1, teams);
              const t2Resolved = resolveTeamWithRoster(m.team2, teams);

              const t1Name = t1Resolved.name || t1Resolved.shortName || 'Team 1';
              const t2Name = t2Resolved.name || t2Resolved.shortName || 'Team 2';

              const t1Score = m.team1?.score || (m.innings?.[0]?.battingTeam?.runs != null ? `${m.innings[0].battingTeam.runs}-${m.innings[0].battingTeam.wickets || 0} (${m.innings[0].overs || 0})` : '0-0 (0.0)');
              const t2Score = m.team2?.score || (m.innings?.[1]?.battingTeam?.runs != null ? `${m.innings[1].battingTeam.runs}-${m.innings[1].battingTeam.wickets || 0} (${m.innings[1].overs || 0})` : 'Yet to bat');

              return (
                <TouchableOpacity
                  key={m.id || `live_${idx}`}
                  style={styles.liveMatchCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (isUserOrganiser && onStartMatchScoring) {
                      onStartMatchScoring(m);
                    } else if (onWatchLive) {
                      onWatchLive(m);
                    }
                  }}
                >
                  <View style={styles.liveHeaderRow}>
                    <View style={styles.liveBadgeRow}>
                      <View style={styles.livePulseDot} />
                      <Text style={styles.liveBadgeText}>LIVE NOW</Text>
                    </View>
                    <Text style={styles.liveVenueText} numberOfLines={1}>
                      {m.venue || tournament?.city || 'Ground'}
                    </Text>
                  </View>

                  <View style={styles.liveTeamsContainer}>
                    <View style={styles.liveTeamRow}>
                      <TeamIdentityMark team={t1Resolved} tournamentTeams={teams} size={24} />
                      <Text style={styles.liveTeamName} numberOfLines={1}>{t1Name}</Text>
                      <Text style={styles.liveTeamScore}>{t1Score}</Text>
                    </View>
                    <View style={[styles.liveTeamRow, { marginTop: 6 }]}>
                      <TeamIdentityMark team={t2Resolved} tournamentTeams={teams} size={24} />
                      <Text style={styles.liveTeamName} numberOfLines={1}>{t2Name}</Text>
                      <Text style={styles.liveTeamScore}>{t2Score}</Text>
                    </View>
                  </View>

                  {isUserOrganiser ? (
                    <View style={styles.liveFooterRow}>
                      <View style={{ flex: 1 }} />
                      <TouchableOpacity
                        style={styles.resumeScoringLiveBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          if (onStartMatchScoring) onStartMatchScoring(m);
                        }}
                        activeOpacity={0.85}
                      >
                        <MaterialCommunityIcons name="cricket" size={13} color="#FFFFFF" />
                        <Text style={styles.resumeScoringLiveText}>Resume Scoring</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {/* ── C. UPCOMING FIXTURES GROUPED BY DATE ── */}
        {upcomingMatchesGrouped.length > 0 ? (
          upcomingMatchesGrouped.map(([dateTitle, dateMatches]) => (
            <View key={dateTitle} style={styles.dateGroupContainer}>
              <Text style={styles.dateGroupHeaderTitle}>{dateTitle}</Text>

              {dateMatches.map((m, mIdx) => {
                const t1Resolved = resolveTeamWithRoster(m.team1, teams);
                const t2Resolved = resolveTeamWithRoster(m.team2, teams);

                const t1FullName = t1Resolved.fullName || t1Resolved.name || 'Team 1';
                const t2FullName = t2Resolved.fullName || t2Resolved.name || 'Team 2';

                const headerSubtitle = formatMatchHeaderTitle(m, tournament, mIdx);
                const startTime = m.time || '07:30 PM';

                return (
                  <TouchableOpacity
                    key={m.id || `up_${mIdx}`}
                    style={styles.upcomingMatchCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (onViewScorecard) {
                        onViewScorecard(m);
                      } else if (onWatchLive) {
                        onWatchLive(m);
                      } else if (isUserOrganiser && onStartMatchScoring) {
                        onStartMatchScoring(m);
                      }
                    }}
                  >
                    {/* Header Row: Stage/Venue + Bell Icon */}
                    <View style={styles.upcomingHeaderRow}>
                      <Text style={styles.upcomingVenueSubtitle} numberOfLines={1}>
                        {headerSubtitle}
                      </Text>
                      <Ionicons name="notifications-outline" size={16} color="#94A3B8" />
                    </View>

                    {/* Body: Teams List on Left | Starts at on Right */}
                    <View style={styles.upcomingBodyRow}>
                      {/* Left: Full Teams Stack */}
                      <View style={styles.upcomingTeamsCol}>
                        <View style={styles.upcomingTeamItem}>
                          <TeamIdentityMark team={t1Resolved} tournamentTeams={teams} size={26} />
                          <Text style={styles.upcomingTeamFullName} numberOfLines={1}>
                            {t1FullName}
                          </Text>
                        </View>
                        <View style={[styles.upcomingTeamItem, { marginTop: 10 }]}>
                          <TeamIdentityMark team={t2Resolved} tournamentTeams={teams} size={26} />
                          <Text style={styles.upcomingTeamFullName} numberOfLines={1}>
                            {t2FullName}
                          </Text>
                        </View>
                      </View>

                      {/* Right: Starts at Time */}
                      <View style={styles.upcomingStartsAtCol}>
                        <Text style={styles.startsAtLabel}>Starts at:</Text>
                        <Text style={styles.startsAtTimeText}>{startTime}</Text>
                      </View>
                    </View>

                    {/* Organiser Action Buttons for Upcoming Fixture */}
                    {isUserOrganiser ? (
                      <View style={styles.upcomingActionRow}>
                        <TouchableOpacity
                          style={styles.rescheduleBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            if (onRescheduleMatch) onRescheduleMatch(m);
                          }}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="calendar-edit" size={14} color="#0284C7" />
                          <Text style={styles.rescheduleBtnText}>Reschedule</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.startScoringQuickBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            if (onStartMatchScoring) onStartMatchScoring(m);
                          }}
                          activeOpacity={0.85}
                        >
                          <MaterialCommunityIcons name="cricket" size={14} color="#FFFFFF" />
                          <Text style={styles.startScoringQuickText}>Start Scoring</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        ) : null}

        {/* Empty Slate if No Matches at all */}
        {matches.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyStateTitle}>No Matches Scheduled</Text>
            <Text style={styles.emptyStateSub}>
              {isUserOrganiser
                ? 'Use Auto Schedule or Add Manual Match to generate fixtures for participating teams.'
                : 'The organizer has not published fixtures for this tournament yet.'}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* ── 3. FILTER DROPDOWN MODAL ── */}
      <Modal
        visible={teamDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTeamDropdownVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setTeamDropdownVisible(false)}
        >
          <View style={styles.dropdownModalCard}>
            <View style={styles.dropdownHeaderRow}>
              <Text style={styles.dropdownModalTitle}>Filter by Team</Text>
              <TouchableOpacity
                onPress={() => setTeamDropdownVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle-outline" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.dropdownScrollView}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableOpacity
                style={[
                  styles.teamOptionRow,
                  selectedTeamFilter === 'ALL' && styles.teamOptionRowActive
                ]}
                onPress={() => {
                  setSelectedTeamFilter('ALL');
                  setTeamDropdownVisible(false);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={styles.allTeamsIconCircle}>
                    <MaterialCommunityIcons name="account-group" size={16} color="#0284C7" />
                  </View>
                  <Text
                    style={[
                      styles.teamOptionText,
                      selectedTeamFilter === 'ALL' && styles.teamOptionTextActive
                    ]}
                  >
                    All Teams ({teams.length})
                  </Text>
                </View>
                {selectedTeamFilter === 'ALL' ? (
                  <Ionicons name="checkmark-circle" size={18} color="#0284C7" />
                ) : null}
              </TouchableOpacity>

              {teams.map(t => {
                const isSel = selectedTeamFilter === t.name || selectedTeamFilter === t.shortName;
                return (
                  <TouchableOpacity
                    key={t.id || t.name}
                    style={[styles.teamOptionRow, isSel && styles.teamOptionRowActive]}
                    onPress={() => {
                      setSelectedTeamFilter(t.name);
                      setTeamDropdownVisible(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <TeamIdentityMark team={t} tournamentTeams={teams} size={24} />
                      <Text
                        style={[styles.teamOptionText, isSel && styles.teamOptionTextActive]}
                        numberOfLines={1}
                      >
                        {t.name}
                      </Text>
                    </View>
                    {isSel ? (
                      <Ionicons name="checkmark-circle" size={18} color="#0284C7" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.appBackground
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0
  },
  filterBarLabel: {
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  },
  filterDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  filterDropdownText: {
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: '#0284C7'
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14
  },
  organiserActionBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4
  },
  primaryActionBtn: {
    flex: 1.2,
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 8
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: systemFontBold
  },
  outlineActionBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    borderRadius: 8
  },
  outlineActionBtnText: {
    color: themeColors.textPrimary,
    fontSize: 11.5,
    fontFamily: systemFontMedium
  },
  matchesSectionBlock: {
    gap: 10
  },
  completedMatchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  matchHeaderVenueText: {
    fontSize: 12.5,
    fontFamily: systemFont,
    color: '#71717A',
    marginBottom: 12
  },
  completedCardBody: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  scoresColumn: {
    flex: 1.6
  },
  teamScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  completedTeamCode: {
    fontSize: 15.5,
    fontFamily: systemFontMedium,
    color: '#0F172A',
    minWidth: 64,
    marginRight: 4
  },
  completedScoreMain: {
    fontSize: 16.5,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  completedOversSub: {
    fontSize: 13,
    fontFamily: systemFont,
    color: '#71717A'
  },
  verticalDivider: {
    width: 1,
    height: 52,
    backgroundColor: '#EEEEF0',
    marginHorizontal: 14
  },
  resultRightBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4
  },
  resultWonHeadline: {
    fontSize: 16.5,
    fontFamily: systemFontMedium,
    color: '#9F1239',
    textAlign: 'center'
  },
  resultWonMarginText: {
    fontSize: 12.5,
    fontFamily: systemFont,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 3
  },
  liveMatchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0,
    padding: 14
  },
  liveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48'
  },
  liveBadgeText: {
    color: '#E11D48',
    fontSize: 9.5,
    fontFamily: systemFontBold
  },
  liveVenueText: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  liveTeamsContainer: {
    paddingVertical: 4
  },
  liveTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  liveTeamName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14.5,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  },
  liveTeamScore: {
    fontSize: 14.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  liveFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0
  },
  liveStatusText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    color: '#0284C7'
  },
  resumeScoringLiveBtn: {
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  resumeScoringLiveText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: systemFontBold
  },
  watchLiveBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4
  },
  watchLiveBtnText: {
    fontSize: 11.5,
    fontFamily: systemFontBold,
    color: '#0284C7'
  },
  dateGroupContainer: {
    gap: 10
  },
  dateGroupHeaderTitle: {
    fontSize: 15.5,
    fontFamily: systemFontBold,
    color: '#0F172A',
    marginTop: 18,
    marginBottom: 8
  },
  upcomingMatchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  upcomingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  upcomingVenueSubtitle: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: systemFont,
    color: '#71717A',
    marginRight: 8
  },
  upcomingBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  upcomingTeamsCol: {
    flex: 1
  },
  upcomingTeamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  upcomingTeamFullName: {
    fontSize: 14.5,
    fontFamily: systemFontMedium,
    color: '#0F172A',
    flexShrink: 1
  },
  upcomingStartsAtCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 12
  },
  startsAtLabel: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: '#64748B'
  },
  startsAtTimeText: {
    fontSize: 17.5,
    fontFamily: systemFontBold,
    color: '#0F172A',
    marginTop: 2
  },
  upcomingActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 0
  },
  rescheduleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 0
  },
  rescheduleBtnText: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: '#0284C7'
  },
  startScoringQuickBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#18181B'
  },
  startScoringQuickText: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: '#FFFFFF'
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 0,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20
  },
  emptyStateTitle: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  emptyStateSub: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    textAlign: 'center',
    lineHeight: 18
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  dropdownModalCard: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8
  },
  dropdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 0,
    marginBottom: 6
  },
  dropdownModalTitle: {
    fontSize: 15,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  dropdownScrollView: {
    maxHeight: 360
  },
  allTeamsIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center'
  },
  teamOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8
  },
  teamOptionRowActive: {
    backgroundColor: '#F0F9FF'
  },
  teamOptionText: {
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary,
    flex: 1
  },
  teamOptionTextActive: {
    fontFamily: systemFontBold,
    color: '#0284C7'
  }
});
