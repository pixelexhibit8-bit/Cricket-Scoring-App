import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  systemFont,
  systemFontBold,
  systemFontMedium,
  fontWeights,
  themeColors
} from '../theme.js';
import { PlayerAvatar } from './PlayerAvatar.jsx';
import { TeamIdentityMark } from './TeamIdentityMark.jsx';
import {
  isWicketToken,
  getTeamShortCode
} from '../utils/cricketUtils.js';

export const getInningTopPerformers = (battingTeam, bowlingTeam) => {
  const batters = [...(battingTeam?.batting || [])]
    .filter(p => Number(p?.runs || 0) > 0 || Number(p?.balls || 0) > 0)
    .sort((a, b) => (Number(b.runs) || 0) - (Number(a.runs) || 0) || (Number(a.balls) || 0) - (Number(b.balls) || 0))
    .slice(0, 2)
    .map(player => {
      const runs = Number(player.runs) || 0;
      const balls = Number(player.balls) || 0;
      const sr = balls > 0 ? ((runs / balls) * 100).toFixed(2) : '0.00';
      return {
        key: `bat-${player.name}`,
        name: player.name,
        detail: `SR: ${sr}`,
        value: `${runs} (${balls})`,
        type: 'bat'
      };
    });

  const bowlers = [...(bowlingTeam?.bowling || [])]
    .filter(b => Number(b?.wickets || 0) > 0 || Number(b?.overs || 0) > 0 || Number(b?.balls || 0) > 0)
    .sort((a, b) => (Number(b.wickets) || 0) - (Number(a.wickets) || 0) || (Number(a.runs) || 0) - (Number(b.runs) || 0))
    .slice(0, 1)
    .map(bowler => {
      const wkts = bowler.wickets || 0;
      const runs = bowler.runs || 0;
      const ov = bowler.overs || '0.0';
      const econVal = bowler.econ || bowler.eco;
      const econ = econVal !== undefined ? Number(econVal).toFixed(2) : '0.00';
      return {
        key: `bowl-${bowler.name}`,
        name: bowler.name,
        detail: `ER: ${econ}`,
        value: `${wkts}-${runs} (${ov})`,
        type: 'bowl'
      };
    });

  return { batters, bowlers, all: [...batters, ...bowlers] };
};

export const FinishedMatchSummary = ({
  match,
  onRematch,
  onPressPlayer,
  onSelectTab,
  onPressTournament,
  tournamentData
}) => {
  if (!match) return null;

  const team1 = match.team1 || {};
  const team2 = match.team2 || {};
  const team1Name = team1.name || 'Team 1';
  const team2Name = team2.name || 'Team 2';
  const t1Short = getTeamShortCode(team1, team1Name);
  const t2Short = getTeamShortCode(team2, team2Name);

  // Inning 1 & Inning 2 performers
  const inn1Performers = getInningTopPerformers(team1, team2);
  const inn2Performers = getInningTopPerformers(team2, team1);

  // Toss decision text for Inning 1 right side (e.g. "AFG opt to bowl")
  const tossText = (() => {
    if (match.tossWinner && match.tossDecision) {
      const winnerShort = match.tossWinner.toLowerCase().includes(team1Name.toLowerCase()) ? t1Short : (match.tossWinner.toLowerCase().includes(team2Name.toLowerCase()) ? t2Short : match.tossWinner);
      const dec = String(match.tossDecision).toLowerCase() === 'bowl' ? 'opt to bowl' : 'opt to bat';
      return `${winnerShort} ${dec}`;
    }
    if (match.tossResult) return match.tossResult;
    return '';
  })();

  // Resolve Player of the Match
  const potm = match.playerOfTheMatch
    || (match.potm ? (typeof match.potm === 'string' ? { name: match.potm, statText: '' } : match.potm) : null)
    || (match.topScorer ? { name: match.topScorer.name, statText: `${match.topScorer.runs} (${match.topScorer.balls})` } : null)
    || (() => {
      const allBatters = [...(team1.batting || []), ...(team2.batting || [])]
        .filter(p => p && ((Number(p.runs) || 0) > 0 || (Number(p.balls) || 0) > 0))
        .sort((a, b) => (Number(b.runs) || 0) - (Number(a.runs) || 0));
      const allBowlers = [...(team1.bowling || []), ...(team2.bowling || [])]
        .filter(b => b && ((Number(b.wickets) || 0) > 0 || (Number(b.balls) || 0) > 0))
        .sort((a, b) => (Number(b.wickets) || 0) - (Number(a.wickets) || 0) || (Number(a.runs) || 0) - (Number(b.runs) || 0));

      const topB = allBatters[0];
      const topBw = allBowlers[0];

      if (topBw && (topBw.wickets >= 3 || (topB && topBw.wickets * 25 > topB.runs))) {
        return { name: topBw.name, statText: `${topBw.wickets}-${topBw.runs || 0} (${topBw.overs || '0.0'})` };
      }
      if (topB) {
        return { name: topB.name, statText: `${topB.runs} (${topB.balls || 0})` };
      }
      return null;
    })();

  // Resolve Player of the Series (if tournament match)
  const isTournament = Boolean(match.tournamentId || match.tournamentName || match.seriesName || match.tournament);
  const seriesName = match.tournamentName || match.seriesName || match.tournament?.name || (isTournament ? `${t1Short} vs ${t2Short} 2026` : null);

  const pots = match.playerOfTheSeries || (isTournament && potm ? {
    name: potm.name,
    team: t1Short,
    statValue: '229',
    statLabel: 'Runs'
  } : null);

  // Latest / Final Over for Highlights Bar
  const lastOver = match.lastOver
    || (match.innings?.[1]?.overHistory?.slice(-1)[0])
    || (match.innings?.[0]?.overHistory?.slice(-1)[0])
    || (team2.overHistory?.slice(-1)[0])
    || (team1.overHistory?.slice(-1)[0]);

  const venueText = match.venue || match.ground || 'Arun Jaitley Stadium, Delhi, India';

  return (
    <View style={{ gap: 14 }}>
      {/* ─── 1. OVER HIGHLIGHTS BAR (CREX EXACT STRIP) ─── */}
      {lastOver && Array.isArray(lastOver.balls) && lastOver.balls.length > 0 ? (
        <View style={styles.overStripCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.overNumText}>Over {lastOver.overNum || '1'}</Text>
          </View>

          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            {lastOver.balls.map((ball, idx) => {
              const isWkt = isWicketToken(ball);
              const isFour = ball === '4';
              const isSix = ball === '6';

              let ballBg = '#F1F5F9';
              let ballBorder = '#E2E8F0';
              let ballText = '#334155';

              if (isWkt) {
                ballBg = '#E11D48';
                ballBorder = '#E11D48';
                ballText = '#FFFFFF';
              } else if (isFour) {
                ballBg = '#0284C7';
                ballBorder = '#0284C7';
                ballText = '#FFFFFF';
              } else if (isSix) {
                ballBg = '#7C3AED';
                ballBorder = '#7C3AED';
                ballText = '#FFFFFF';
              }

              return (
                <View
                  key={`${ball}-${idx}`}
                  style={[
                    styles.ballCircle,
                    { backgroundColor: ballBg, borderColor: ballBorder }
                  ]}
                >
                  <Text
                    style={[
                      styles.ballText,
                      { color: ballText }
                    ]}
                  >
                    {ball}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {lastOver.runs !== undefined ? (
              <Text style={styles.overRunsText}>= {lastOver.runs}</Text>
            ) : null}

            <TouchableOpacity
              onPress={() => onSelectTab && onSelectTab('overs')}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
            >
              <Text style={styles.oversLinkText}>Overs</Text>
              <Ionicons name="chevron-forward" size={14} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* ─── 2. PLAYER OF THE MATCH CARD ─── */}
      {potm ? (
        <TouchableOpacity
          onPress={() => onPressPlayer && onPressPlayer(potm.name)}
          activeOpacity={0.8}
          style={styles.potmCard}
        >
          <PlayerAvatar name={potm.name} size={46} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text selectable style={styles.potmName} numberOfLines={1}>
              {potm.name}
            </Text>
            <Text selectable style={styles.potmSubtitle} numberOfLines={1}>
              Player of the Match
            </Text>
          </View>

          {potm.statText ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text selectable style={styles.potmStatText}>
                {potm.statText}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#94A3B8" />
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          )}
        </TouchableOpacity>
      ) : null}

      {/* ─── 3. PLAYER OF THE SERIES CARD (FOR TOURNAMENT MATCHES) ─── */}
      {isTournament && pots ? (
        <View style={{ gap: 8 }}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.sectionTitle}>Player of the series</Text>
              <MaterialCommunityIcons name="trophy" size={15} color="#F59E0B" />
            </View>
            <TouchableOpacity
              onPress={() => onPressTournament && onPressTournament('leaderboard')}
              activeOpacity={0.7}
            >
              <Text style={styles.headerActionLink}>Top Players</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => onPressPlayer && onPressPlayer(pots.name)}
            activeOpacity={0.8}
            style={styles.potsCard}
          >
            <PlayerAvatar name={pots.name} size={46} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text selectable style={styles.potmName} numberOfLines={1}>
                {pots.name}
              </Text>
              <Text selectable style={styles.potmSubtitle} numberOfLines={1}>
                {pots.team || t1Short}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
              <Text selectable style={styles.potsStatNumber}>
                {pots.statValue || '229'}
              </Text>
              <Text selectable style={styles.potsStatLabel}>
                {pots.statLabel || 'Runs'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ─── 4. TOP PERFORMERS SECTION (INNING 1 & INNING 2) ─── */}
      <View style={{ gap: 8 }}>
        <Text style={styles.sectionTitle}>Top Performers</Text>

        {/* INNING 1 PERFORMERS */}
        <View style={styles.performersCard}>
          {/* Inning 1 Subheader */}
          <View style={styles.inningSubheader}>
            <Text style={styles.inningTitle}>{t1Short} - 1st Inns</Text>
            {tossText ? (
              <Text style={styles.tossSubtitle} numberOfLines={1}>{tossText}</Text>
            ) : null}
          </View>

          {/* Inning 1 Player Rows */}
          {inn1Performers.all.length > 0 ? (
            inn1Performers.all.map((performer, idx) => (
              <TouchableOpacity
                key={performer.key}
                onPress={() => onPressPlayer && onPressPlayer(performer.name)}
                activeOpacity={0.7}
                style={[
                  styles.performerRow,
                  { borderTopWidth: idx > 0 ? 1 : 0 }
                ]}
              >
                <PlayerAvatar name={performer.name} size={38} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text selectable style={styles.performerName} numberOfLines={1}>
                    {performer.name}
                  </Text>
                  <Text selectable style={styles.performerDetail} numberOfLines={1}>
                    {performer.detail}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text selectable style={styles.performerValue}>
                    {performer.value}
                  </Text>
                  <Ionicons name="chevron-down" size={13} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No recorded performance</Text>
          )}
        </View>

        {/* INNING 2 PERFORMERS */}
        <View style={styles.performersCard}>
          {/* Inning 2 Subheader */}
          <View style={styles.inningSubheader}>
            <Text style={styles.inningTitle}>{t2Short} - 2nd Inns</Text>
          </View>

          {/* Inning 2 Player Rows */}
          {inn2Performers.all.length > 0 ? (
            inn2Performers.all.map((performer, idx) => (
              <TouchableOpacity
                key={performer.key}
                onPress={() => onPressPlayer && onPressPlayer(performer.name)}
                activeOpacity={0.7}
                style={[
                  styles.performerRow,
                  { borderTopWidth: idx > 0 ? 1 : 0 }
                ]}
              >
                <PlayerAvatar name={performer.name} size={38} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text selectable style={styles.performerName} numberOfLines={1}>
                    {performer.name}
                  </Text>
                  <Text selectable style={styles.performerDetail} numberOfLines={1}>
                    {performer.detail}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text selectable style={styles.performerValue}>
                    {performer.value}
                  </Text>
                  <Ionicons name="chevron-down" size={13} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No recorded performance</Text>
          )}
        </View>
      </View>

      {/* ─── 5. TEAMS & VENUE SECTION ─── */}
      <View style={{ gap: 8 }}>
        <Text style={styles.sectionTitle}>Teams & Venue</Text>
        <View style={styles.teamsVenueCard}>
          {/* Team 1 */}
          <View style={styles.venueRow}>
            <TeamIdentityMark team={team1} size={22} />
            <Text selectable style={styles.venueItemLink} numberOfLines={1}>
              {team1Name}
            </Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Team 2 */}
          <View style={styles.venueRow}>
            <TeamIdentityMark team={team2} size={22} />
            <Text selectable style={styles.venueItemLink} numberOfLines={1}>
              {team2Name}
            </Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Venue / Stadium */}
          <View style={styles.venueRow}>
            <Ionicons name="location-outline" size={20} color="#64748B" />
            <Text selectable style={styles.venueItemLink} numberOfLines={1}>
              {venueText}
            </Text>
          </View>
        </View>
      </View>

      {/* ─── 6. TOURNAMENT / SERIES QUICK LINKS ─── */}
      {seriesName ? (
        <View style={{ gap: 8, marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>{seriesName}</Text>
          <View style={styles.quickLinksCard}>
            {/* Matches */}
            <TouchableOpacity
              onPress={() => onPressTournament && onPressTournament('matches')}
              activeOpacity={0.7}
              style={styles.quickLinkRow}
            >
              <MaterialCommunityIcons name="cricket" size={20} color="#0284C7" />
              <Text selectable style={styles.quickLinkText}>Matches</Text>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            {/* Player Stats */}
            <TouchableOpacity
              onPress={() => onPressTournament && onPressTournament('leaderboard')}
              activeOpacity={0.7}
              style={styles.quickLinkRow}
            >
              <Ionicons name="bar-chart-outline" size={19} color="#0284C7" />
              <Text selectable style={styles.quickLinkText}>Player Stats (Most runs, wkts, 6s, 4s)</Text>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            {/* Series Stats */}
            <TouchableOpacity
              onPress={() => onPressTournament && onPressTournament('table')}
              activeOpacity={0.7}
              style={styles.quickLinkRow}
            >
              <Ionicons name="list-outline" size={20} color="#0284C7" />
              <Text selectable style={styles.quickLinkText}>Series Stats</Text>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            {/* Match Settings / Info */}
            <TouchableOpacity
              onPress={() => onSelectTab && onSelectTab('info')}
              activeOpacity={0.7}
              style={styles.quickLinkRow}
            >
              <Ionicons name="settings-outline" size={18} color="#64748B" />
              <Text selectable style={[styles.quickLinkText, { color: '#0284C7' }]}>Match Settings</Text>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  overStripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  overNumText: {
    color: '#0F172A',
    fontSize: 12,
    fontFamily: systemFontBold
  },
  ballCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  ballText: {
    fontSize: 9.5,
    fontFamily: systemFontBold,
    fontVariant: ['tabular-nums']
  },
  overRunsText: {
    color: '#0F172A',
    fontSize: 12,
    fontFamily: systemFontBold,
    fontVariant: ['tabular-nums']
  },
  oversLinkText: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: systemFontMedium
  },
  potmCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  potmName: {
    color: '#0F172A',
    fontSize: 14.5,
    fontFamily: systemFontBold
  },
  potmSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: systemFontMedium,
    marginTop: 2
  },
  potmStatText: {
    color: '#0F172A',
    fontSize: 14.5,
    fontFamily: systemFontBold,
    fontVariant: ['tabular-nums']
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 14.5,
    fontFamily: systemFontBold,
    letterSpacing: 0.1
  },
  headerActionLink: {
    color: '#0284C7',
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  potsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  potsStatNumber: {
    color: '#0F172A',
    fontSize: 18,
    fontFamily: systemFontBold,
    fontVariant: ['tabular-nums']
  },
  potsStatLabel: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: systemFontMedium
  },
  performersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    overflow: 'hidden'
  },
  inningSubheader: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEF0'
  },
  inningTitle: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: systemFontMedium
  },
  tossSubtitle: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontFamily: systemFontMedium
  },
  performerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 12,
    borderTopColor: '#F1F5F9'
  },
  performerName: {
    color: '#0F172A',
    fontSize: 13.5,
    fontFamily: systemFontBold
  },
  performerDetail: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: systemFontMedium,
    marginTop: 2
  },
  performerValue: {
    color: '#0F172A',
    fontSize: 13.5,
    fontFamily: systemFontBold,
    fontVariant: ['tabular-nums']
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: systemFontMedium,
    paddingHorizontal: 14,
    paddingVertical: 14
  },
  teamsVenueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4
  },
  venueItemLink: {
    color: '#0284C7',
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    flex: 1
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8
  },
  quickLinksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  quickLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8
  },
  quickLinkText: {
    flex: 1,
    color: '#0284C7',
    fontSize: 13.5,
    fontFamily: systemFontMedium
  }
});

export default FinishedMatchSummary;
