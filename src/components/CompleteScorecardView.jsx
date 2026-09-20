import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontBold,
  systemFontMedium
} from '../theme.js';
import { PlayerAvatar } from './PlayerAvatar.jsx';
import { PreInningsScorecard } from './PreInningsScorecard.jsx';
import {
  formatOvers,
  getInningBowlingRows,
  getUnplayedBatters,
  getTeamShortCode
} from '../utils/cricketUtils.js';

export const CompleteScorecardView = React.memo(function CompleteScorecardView({
  match = {},
  inningIndex = 0,
  onSelectInning,
  onSelectPlayer,
  isLive = false,
  team1Name: customTeam1Name,
  team2Name: customTeam2Name,
  team1Score: customTeam1Score,
  team2Score: customTeam2Score
}) {
  const m = match || {};
  const raw = m.rawMatchData || m;

  // 1. Resolve Team Names
  const team1Name = customTeam1Name
    || m.team1?.name
    || m.teams?.[0]?.name
    || raw.team1?.name
    || 'Team 1';
  const team2Name = customTeam2Name
    || m.team2?.name
    || m.teams?.[1]?.name
    || raw.team2?.name
    || 'Team 2';

  const team1Code = getTeamShortCode(m.team1 || m.teams?.[0] || { name: team1Name }, team1Name);
  const team2Code = getTeamShortCode(m.team2 || m.teams?.[1] || { name: team2Name }, team2Name);

  // 2. Resolve Innings Data
  const inningsList = Array.isArray(raw.innings)
    ? raw.innings
    : (Array.isArray(m.innings) ? m.innings : (raw.inningsList || []));

  const inn1 = inningsList[0] || m.sourceMatch?.innings?.[0] || m.team1 || {};
  const inn2 = inningsList[1] || m.sourceMatch?.innings?.[1] || m.team2 || {};

  const currentInning = inningIndex === 1 ? inn2 : inn1;
  const isSecondInning = inningIndex === 1;

  // 3. Batting Team & Opponent Names
  const battingTeamName = currentInning?.battingTeam?.name
    || currentInning?.battingTeamName
    || currentInning?.name
    || (isSecondInning ? team2Name : team1Name);
  const bowlingTeamName = currentInning?.bowlingTeam?.name
    || currentInning?.bowlingTeamName
    || (isSecondInning ? team1Name : team2Name);

  // 4. Extract Total Score, Legal Balls, Wickets, Overs
  const totalRuns = currentInning?.battingTeam?.runs
    ?? currentInning?.runs
    ?? currentInning?.totalRuns
    ?? 0;
  const totalWickets = currentInning?.battingTeam?.wickets
    ?? currentInning?.wickets
    ?? currentInning?.totalWickets
    ?? 0;
  const legalBalls = currentInning?.totalLegalBalls
    ?? currentInning?.legalBalls
    ?? 0;
  const oversFormatted = formatOvers(legalBalls);
  const oversFloat = Math.floor(legalBalls / 6) + (legalBalls % 6) / 6;
  const currentRunRate = oversFloat > 0 ? (totalRuns / oversFloat).toFixed(2) : '0.00';

  // Max Overs Limit
  const maxOvers = m.totalOvers || m.maxOvers || m.overs || 20;

  // Required Run Rate (for chasing team in 2nd inning)
  const inn1Runs = Number(inn1?.battingTeam?.runs ?? inn1?.runs ?? 0);
  const targetRuns = inn1Runs + 1;
  const remainingRuns = Math.max(0, targetRuns - totalRuns);
  const remainingBalls = Math.max(0, (maxOvers * 6) - legalBalls);
  const requiredRunRate = (isSecondInning && remainingBalls > 0 && totalWickets < 10 && remainingRuns > 0)
    ? ((remainingRuns / remainingBalls) * 6).toFixed(2)
    : null;

  // Check if Inning has Started
  const inningHasStarted = Boolean(
    legalBalls > 0 ||
    totalRuns > 0 ||
    totalWickets > 0 ||
    (currentInning?.allBatters && Object.keys(currentInning.allBatters).length > 0) ||
    (currentInning?.overHistory && currentInning.overHistory.length > 0)
  );

  // 5. Extract Batters List
  const battingRows = useMemo(() => {
    let rawBatters = [];
    if (Array.isArray(currentInning?.allBatters)) {
      rawBatters = currentInning.allBatters;
    } else if (currentInning?.allBatters && typeof currentInning.allBatters === 'object') {
      rawBatters = Object.values(currentInning.allBatters);
    } else if (Array.isArray(currentInning?.batting)) {
      rawBatters = currentInning.batting;
    } else if (Array.isArray(currentInning?.batsmen)) {
      rawBatters = currentInning.batsmen;
    } else if (Array.isArray(currentInning?.batters)) {
      rawBatters = currentInning.batters;
    } else {
      rawBatters = [currentInning?.striker, currentInning?.nonStriker].filter(Boolean);
    }

    const strikerName = currentInning?.striker?.name;
    const nonStrikerName = currentInning?.nonStriker?.name;

    return rawBatters
      .filter(b => b && (b.name || b.playerName))
      .map(b => {
        const name = String(b.name || b.playerName || '').trim();
        const runs = Number(b.runs || 0);
        const balls = Number(b.balls || b.ballsFaced || 0);
        const fours = Number(b.fours || b.foursCount || b['4s'] || 0);
        const sixes = Number(b.sixes || b.sixesCount || b['6s'] || 0);
        const isOut = Boolean(
          b.isOut ||
          (b.dismissal &&
            !String(b.dismissal).toLowerCase().includes('not out') &&
            !String(b.dismissal).toLowerCase().includes('did not'))
        );
        const sr = balls > 0 ? ((runs / balls) * 100).toFixed(1) : (b.sr || '0.0');
        const dismissal = b.dismissal || (isOut ? 'Out' : 'Not out');
        const isOnStrike = isLive && (name === strikerName);
        const isNonStriker = isLive && (name === nonStrikerName);

        return {
          name,
          runs,
          balls,
          fours,
          sixes,
          sr,
          isOut,
          dismissal,
          isOnStrike,
          isNonStriker,
          avatar: b.avatar || b.photoUrl
        };
      });
  }, [currentInning, isLive]);

  // 6. Extract Extras Breakdown
  const knownBattersRuns = battingRows.reduce((sum, b) => sum + (b.runs || 0), 0);
  const totalExtras = Math.max(0, totalRuns - knownBattersRuns);
  const extrasWides = Number(currentInning?.extrasWides || currentInning?.wides || 0);
  const extrasNoBalls = Number(currentInning?.extrasNoBalls || currentInning?.noBalls || 0);
  const extrasByes = Number(currentInning?.extrasByes || currentInning?.byes || 0);
  const extrasLegByes = Number(currentInning?.extrasLegByes || currentInning?.legByes || 0);

  // 7. Extract Bowling Figures with Maidens & Dots
  const bowlingRows = useMemo(() => {
    let rows = getInningBowlingRows(currentInning) || [];
    if (rows.length === 0 && Array.isArray(currentInning?.bowling)) {
      rows = currentInning.bowling;
    }

    const overHistory = Array.isArray(currentInning?.overHistory) ? currentInning.overHistory : [];
    const activeBowlerName = currentInning?.bowler?.name;

    return rows.map((bw, idx) => {
      const name = String(bw.name || bw.playerName || `Bowler ${idx + 1}`).trim();
      const overs = bw.overs != null ? String(bw.overs) : formatOvers(bw.balls || 0);
      const runs = Number(bw.runs || bw.runsConceded || bw.r || 0);
      const wickets = Number(bw.wickets || bw.wkts || bw.w || 0);
      const econ = bw.econ || bw.economy || (bw.balls > 0 ? ((runs / bw.balls) * 6).toFixed(2) : '0.00');

      // Calculate maidens from over history for this bowler
      const bowlerOvers = overHistory.filter(o => o.bowlerName === name);
      const maidens = bw.maidens != null
        ? Number(bw.maidens)
        : bowlerOvers.filter(o => (o.runs === 0 || o.bowlerRuns === 0) && (o.legalBalls >= 6 || (o.balls || []).length >= 6)).length;

      // Calculate dot balls
      let dots = Number(bw.dots || bw.dotBalls || 0);
      if (dots === 0 && bowlerOvers.length > 0) {
        bowlerOvers.forEach(o => {
          (o.balls || []).forEach(token => {
            if (token === 0 || token === '0' || token === '•' || token === 'dot') dots += 1;
          });
        });
      }

      const isActiveBowler = isLive && (name === activeBowlerName);

      return {
        name,
        overs,
        maidens,
        runs,
        wickets,
        econ,
        dots,
        isActiveBowler,
        avatar: bw.avatar || bw.photoUrl
      };
    });
  }, [currentInning, isLive]);

  // 8. Extract Fall of Wickets (FOW)
  const fallOfWicketsList = useMemo(() => {
    let fow = [];
    if (Array.isArray(currentInning?.fallOfWickets) && currentInning.fallOfWickets.length > 0) {
      fow = currentInning.fallOfWickets;
    } else if (Array.isArray(currentInning?.partnershipHistory) && currentInning.partnershipHistory.length > 0) {
      fow = currentInning.partnershipHistory.filter(p => p.status === 'out' || p.dismissedName);
    }

    if (fow.length > 0) {
      return fow.map((item, idx) => ({
        wicketNum: item.wicketNumber || item.wkt || (idx + 1),
        score: item.teamScore || item.score || `${item.runs || totalRuns}-${idx + 1}`,
        over: item.over || item.overs || '0.0',
        batterName: item.dismissedName || item.batterName || item.name || `Batter ${idx + 1}`
      }));
    }

    // Reconstruct Fall of Wickets from dismissed batters if history is not explicitly attached
    const outBatters = battingRows.filter(b => b.isOut);
    if (outBatters.length > 0) {
      return outBatters.map((b, idx) => ({
        wicketNum: idx + 1,
        score: `${b.runs}-${idx + 1}`,
        over: '-',
        batterName: b.name
      }));
    }

    return [];
  }, [currentInning, battingRows, totalRuns]);

  // 9. Extract Partnerships
  const partnershipsData = useMemo(() => {
    const list = [];
    const history = Array.isArray(currentInning?.partnershipHistory) ? currentInning.partnershipHistory : [];

    history.forEach((p, idx) => {
      const p1 = p.p1 || p.strikerName || '';
      const r1 = p.r1 ?? p.p1Runs ?? 0;
      const b1 = p.b1 ?? p.p1Balls ?? 0;
      const p2 = p.p2 || p.nonStrikerName || '';
      const r2 = p.r2 ?? p.p2Runs ?? 0;
      const b2 = p.b2 ?? p.p2Balls ?? 0;
      const totalPRuns = p.totalRuns ?? p.runs ?? (r1 + r2);
      const totalPBalls = p.totalBalls ?? p.balls ?? (b1 + b2);

      if (p1 || p2 || totalPRuns > 0) {
        list.push({
          id: `hist_p_${idx}`,
          wktLabel: `${idx + 1}${getOrdinalSuffix(idx + 1)} Wicket`,
          p1,
          r1,
          b1,
          p2,
          r2,
          b2,
          totalRuns: totalPRuns,
          totalBalls: totalPBalls,
          status: p.status || 'out'
        });
      }
    });

    // Current Live Unbroken Partnership
    if (isLive && ((currentInning?.partnershipRuns || 0) > 0 || currentInning?.striker || currentInning?.nonStriker)) {
      const p1 = currentInning.striker?.name || '';
      const p2 = currentInning.nonStriker?.name || '';
      const r1 = currentInning.partnershipContributions?.[p1]?.runs ?? currentInning.striker?.runs ?? 0;
      const b1 = currentInning.partnershipContributions?.[p1]?.balls ?? currentInning.striker?.balls ?? 0;
      const r2 = currentInning.partnershipContributions?.[p2]?.runs ?? currentInning.nonStriker?.runs ?? 0;
      const b2 = currentInning.partnershipContributions?.[p2]?.balls ?? currentInning.nonStriker?.balls ?? 0;
      const totalPRuns = currentInning.partnershipRuns ?? (r1 + r2);
      const totalPBalls = currentInning.partnershipBalls ?? (b1 + b2);

      list.unshift({
        id: 'current_live_partnership',
        wktLabel: 'Current Partnership (Live)',
        p1,
        r1,
        b1,
        p2,
        r2,
        b2,
        totalRuns: totalPRuns,
        totalBalls: totalPBalls,
        isCurrent: true
      });
    }

    return list;
  }, [currentInning, isLive]);

  // 10. Extract Overs Progression (Who Bowled Which Over)
  const overHistoryList = useMemo(() => {
    const rawOvers = Array.isArray(currentInning?.overHistory) ? currentInning.overHistory : [];
    return rawOvers.map((ov, idx) => {
      const overNum = ov.overNumber || (idx + 1);
      const bowler = ov.bowlerName || 'Bowler';
      const runs = ov.bowlerRuns ?? ov.runs ?? 0;
      const wickets = ov.bowlerWickets ?? ov.wickets ?? 0;
      const isMaiden = Boolean(ov.isMaiden || runs === 0);
      const scoreAtEnd = ov.scoreAtOverEnd || ov.teamScore || '';

      return {
        overNum,
        bowler,
        runs,
        wickets,
        isMaiden,
        scoreAtEnd
      };
    });
  }, [currentInning]);

  // 11. Extract Unplayed / Did Not Bat Squad Members
  const declaredRoster = useMemo(() => {
    return m.playingXI?.[battingTeamName]
      || m.sourceMatch?.playingXI?.[battingTeamName]
      || (raw.playingXI ? raw.playingXI[battingTeamName] : [])
      || [];
  }, [m, raw, battingTeamName]);

  const unplayedBatters = useMemo(() => {
    return getUnplayedBatters(declaredRoster, battingRows);
  }, [declaredRoster, battingRows]);

  // Format clean score strings for Inning Switcher Pills (e.g. "221-7 (20.0)" or "94 (14.1)")
  const inn1ScorePill = useMemo(() => {
    if (customTeam1Score && customTeam1Score !== '0-0') return customTeam1Score;
    if (inn1?.battingTeam) {
      const r = inn1.battingTeam.runs ?? 0;
      const w = inn1.battingTeam.wickets ?? 0;
      const ov = formatOvers(inn1.totalLegalBalls || 0);
      return `${r}-${w} (${ov})`;
    }
    return '0-0 (0.0)';
  }, [customTeam1Score, inn1]);

  const inn2ScorePill = useMemo(() => {
    if (customTeam2Score && customTeam2Score !== '0-0') return customTeam2Score;
    if (inn2?.battingTeam && (inn2.totalLegalBalls > 0 || (inn2.battingTeam.runs || 0) > 0 || inn2.allBatters)) {
      const r = inn2.battingTeam.runs ?? 0;
      const w = inn2.battingTeam.wickets ?? 0;
      const ov = formatOvers(inn2.totalLegalBalls || 0);
      return `${r}${w < 10 ? `-${w}` : ''} (${ov})`;
    }
    return isLive ? '0-0 (0.0)' : 'Yet to bat';
  }, [customTeam2Score, inn2, isLive]);

  // If Not Started
  if (!inningHasStarted) {
    const declaredPlayerObjects = declaredRoster.map(name => ({
      name,
      avg: '-',
      sr: '-'
    }));

    return (
      <View style={styles.container}>
        {/* Innings Switcher Tabs */}
        <InningsSwitcherTabs
          team1Name={team1Code}
          team2Name={team2Code}
          inn1Score={inn1ScorePill}
          inn2Score={inn2ScorePill}
          selectedIndex={inningIndex}
          onSelect={onSelectInning}
        />
        <PreInningsScorecard players={declaredPlayerObjects} title={`${battingTeamName} has not started batting yet.`} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── 1. INNINGS SWITCHER PILLS (CREX PILL DESIGN) ── */}
      <InningsSwitcherTabs
        team1Name={team1Code}
        team2Name={team2Code}
        inn1Score={inn1ScorePill}
        inn2Score={inn2ScorePill}
        selectedIndex={inningIndex}
        onSelect={onSelectInning}
      />

      {/* ── 2. COMPREHENSIVE BATTING TABLE ── */}
      <View style={styles.sectionCard}>
        {/* Batting Header */}
        <View style={styles.tableHeaderRow}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.tableHeaderColMain}>Batter</Text>
            <Ionicons name="arrow-down" size={13} color="#0284C7" />
          </View>
          <Text style={styles.tableHeaderCol}>R</Text>
          <Text style={styles.tableHeaderCol}>B</Text>
          <Text style={styles.tableHeaderCol}>4s</Text>
          <Text style={styles.tableHeaderCol}>6s</Text>
          <Text style={[styles.tableHeaderCol, { width: 48 }]}>SR</Text>
          <View style={{ width: 14 }} />
        </View>

        {/* Batter Rows */}
        {battingRows.map((b, idx) => (
          <TouchableOpacity
            key={`bat_${b.name}_${idx}`}
            style={[styles.batterRow, idx === battingRows.length - 1 && { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={() => onSelectPlayer && onSelectPlayer(b.name)}
          >
            <View style={styles.playerInfoCol}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.playerNameText} numberOfLines={1}>
                    {b.name}
                  </Text>
                  {b.isOnStrike ? (
                    <View style={styles.strikeBadge}>
                      <Text style={styles.strikeBadgeText}>*</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.dismissalText, !b.isOut && styles.dismissalNotOut]} numberOfLines={1}>
                  {b.dismissal}
                </Text>
              </View>
            </View>

            <Text style={styles.runsText}>{b.runs}</Text>
            <Text style={styles.statColText}>{b.balls}</Text>
            <Text style={styles.statColText}>{b.fours}</Text>
            <Text style={styles.statColText}>{b.sixes}</Text>
            <Text style={styles.strikeRateText}>{b.sr}</Text>
            <Ionicons name="chevron-down" size={13} color="#CBD5E1" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        ))}

        {/* Extras Summary Line */}
        <View style={styles.extrasFooterRow}>
          <Text style={styles.extrasLabel}>
            Extras: <Text style={styles.extrasTotalNumber}>{totalExtras}</Text>
            {Boolean(extrasWides || extrasNoBalls || extrasByes || extrasLegByes) && (
              <Text style={styles.extrasBreakdownText}>
                {'  '}{extrasWides ? `${extrasWides}w ` : ''}{extrasNoBalls ? `${extrasNoBalls}nb ` : ''}{extrasByes ? `${extrasByes}b ` : ''}{extrasLegByes ? `${extrasLegByes}lb` : ''}
              </Text>
            )}
          </Text>
        </View>
      </View>

      {/* ── 3. DID NOT BAT SECTION ── */}
      {unplayedBatters && unplayedBatters.length > 0 ? (
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitleText}>
              {isLive ? 'YET TO BAT' : 'DID NOT BAT'}
            </Text>
          </View>
          <View style={styles.yetToBatGrid}>
            {unplayedBatters.map((p, idx) => (
              <TouchableOpacity
                key={`unplayed_${p.name}_${idx}`}
                style={styles.yetToBatItem}
                activeOpacity={0.7}
                onPress={() => onSelectPlayer && onSelectPlayer(p.name)}
              >
                <PlayerAvatar name={p.name} photoUrl={p.avatar} size={36} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.yetToBatName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.yetToBatSub} numberOfLines={1}>{p.sr ? `SR: ${p.sr}` : (p.role || 'Player')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      {/* ── 4. COMPREHENSIVE BOWLING TABLE ── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitleText}>BOWLING</Text>
        </View>
        {/* Bowling Header */}
        <View style={styles.tableHeaderRow}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.tableHeaderColMain}>Bowler</Text>
            <Ionicons name="arrow-down" size={13} color="#0284C7" />
          </View>
          <Text style={styles.tableHeaderCol}>O</Text>
          <Text style={styles.tableHeaderCol}>M</Text>
          <Text style={styles.tableHeaderCol}>R</Text>
          <Text style={[styles.tableHeaderCol, { color: '#0F172A', fontFamily: systemFontBold }]}>W</Text>
          <Text style={[styles.tableHeaderCol, { width: 44 }]}>Eco</Text>
          <View style={{ width: 14 }} />
        </View>

        {/* Bowler Rows */}
        {bowlingRows.length > 0 ? (
          bowlingRows.map((bw, idx) => (
            <TouchableOpacity
              key={`bowl_${bw.name}_${idx}`}
              style={[styles.bowlerRow, idx === bowlingRows.length - 1 && { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={() => onSelectPlayer && onSelectPlayer(bw.name)}
            >
              <View style={styles.playerInfoCol}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.playerNameText} numberOfLines={1}>{bw.name}</Text>
                    {bw.isActiveBowler ? (
                      <View style={styles.bowlingActiveDot} />
                    ) : null}
                  </View>
                </View>
              </View>

              <Text style={styles.statColText}>{bw.overs}</Text>
              <Text style={styles.statColText}>{bw.maidens}</Text>
              <Text style={styles.statColText}>{bw.runs}</Text>
              <Text style={styles.wicketsNumberText}>{bw.wickets}</Text>
              <Text style={[styles.statColText, { width: 44 }]}>{bw.econ}</Text>
              <Ionicons name="chevron-down" size={13} color="#CBD5E1" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyFiguresText}>No bowling figures available for this innings.</Text>
        )}
      </View>

      {/* ── 5. FALL OF WICKETS (FOW) SECTION ── */}
      {fallOfWicketsList.length > 0 ? (
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitleText}>FALL OF WICKETS</Text>
          </View>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderColMain, { color: '#64748B' }]}>Batter</Text>
            <Text style={[styles.tableHeaderCol, { width: 64, textAlign: 'center' }]}>Score</Text>
            <Text style={[styles.tableHeaderCol, { width: 50, textAlign: 'right' }]}>Over</Text>
            <View style={{ width: 14 }} />
          </View>
          <View style={styles.fowListWrap}>
            {fallOfWicketsList.map((fow, idx) => (
              <View key={`fow_${idx}`} style={styles.fowItemRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.fowBatterName} numberOfLines={1}>
                    {fow.batterName}
                  </Text>
                </View>
                <Text style={styles.fowScoreText}>{fow.score}</Text>
                <Text style={styles.fowOverText}>{fow.over !== '-' ? fow.over : '-'}</Text>
                <Ionicons name="chevron-down" size={13} color="#CBD5E1" style={{ marginLeft: 2 }} />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* ── 6. PARTNERSHIPS SECTION ── */}
      {partnershipsData.length > 0 ? (
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitleText}>PARTNERSHIPS</Text>
          </View>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderColMain, { color: '#64748B' }]}>Batter 1</Text>
            <Text style={[styles.tableHeaderCol, { color: '#64748B', flex: 1, textAlign: 'right' }]}>Batter 2</Text>
          </View>
          <View style={{ paddingHorizontal: 14, paddingVertical: 8, gap: 14 }}>
            {partnershipsData.map(p => {
              const p1Ratio = p.totalRuns > 0 ? Math.min(100, Math.max(0, Math.round((p.r1 / p.totalRuns) * 100))) : 50;
              return (
                <View key={p.id} style={styles.crexPartnershipRow}>
                  {/* Left Batter */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.crexPartnerName} numberOfLines={1}>{p.p1 || 'Batter 1'}</Text>
                    <Text style={styles.crexPartnerScore}>
                      <Text style={{ fontFamily: systemFontBold, color: '#0F172A' }}>{p.r1}</Text> ({p.b1})
                    </Text>
                  </View>

                  {/* Center Score & Split Bar */}
                  <View style={styles.crexPartnerCenterBlock}>
                    <Text style={styles.crexPartnerCenterScore}>
                      {p.totalRuns} <Text style={styles.crexPartnerCenterBalls}>({p.totalBalls})</Text>
                    </Text>
                    <View style={styles.crexPartnerBarTrack}>
                      <View style={[styles.crexPartnerBarGreen, { width: `${p1Ratio}%` }]} />
                      <View style={[styles.crexPartnerBarMaroon, { width: `${100 - p1Ratio}%` }]} />
                    </View>
                  </View>

                  {/* Right Batter */}
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.crexPartnerName} numberOfLines={1}>{p.p2 || 'Batter 2'}</Text>
                    <Text style={styles.crexPartnerScore}>
                      <Text style={{ fontFamily: systemFontBold, color: '#0F172A' }}>{p.r2}</Text> ({p.b2})
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* ── 7. INNINGS OVERS TIMELINE BREAKDOWN ── */}
      {overHistoryList.length > 0 ? (
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitleText}>OVERS PROGRESSION ({overHistoryList.length})</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.oversScrollRow}>
            {overHistoryList.map(ov => (
              <View key={`ov_${ov.overNum}`} style={[styles.overCardPill, ov.isMaiden && styles.overCardPillMaiden]}>
                <View style={styles.overCardTop}>
                  <Text style={styles.overCardNumText}>Over {ov.overNum}</Text>
                  <Text style={[styles.overCardRunsText, ov.wickets > 0 && { color: '#DC2626' }]}>
                    {ov.runs}R {ov.wickets > 0 ? `• ${ov.wickets}W` : ''}
                  </Text>
                </View>
                <Text style={styles.overCardBowlerText} numberOfLines={1}>{ov.bowler}</Text>
                {ov.scoreAtEnd ? (
                  <Text style={styles.overCardScoreText}>Score: {ov.scoreAtEnd}</Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Innings Switcher Tabs Subcomponent (CREX Pill Design)
// ─────────────────────────────────────────────────────────────────────────────
function InningsSwitcherTabs({ team1Name, team2Name, inn1Score, inn2Score, selectedIndex, onSelect }) {
  const tabs = [
    { name: team1Name, score: inn1Score },
    { name: team2Name, score: inn2Score }
  ];

  return (
    <View style={styles.switcherContainer}>
      {tabs.map((tObj, idx) => {
        const active = selectedIndex === idx;
        return (
          <TouchableOpacity
            key={`inn_tab_${tObj.name}_${idx}`}
            onPress={() => onSelect && onSelect(idx)}
            activeOpacity={0.85}
            style={[styles.switcherPill, active ? styles.switcherPillActive : styles.switcherPillInactive]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={[styles.switcherTeamName, active ? styles.switcherTeamNameActive : styles.switcherTeamNameInactive]} numberOfLines={1}>
                {tObj.name}
              </Text>
              <Text style={[styles.switcherScoreText, active ? styles.switcherScoreTextActive : styles.switcherScoreTextInactive]} numberOfLines={1}>
                {tObj.score}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function getOrdinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 24
  },
  switcherContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 0,
    backgroundColor: 'transparent'
  },
  switcherPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  switcherPillActive: {
    backgroundColor: '#0F3B66',
    borderWidth: 0
  },
  switcherPillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  switcherTeamName: {
    fontSize: 14,
    fontFamily: systemFontBold
  },
  switcherTeamNameActive: {
    color: '#FFFFFF'
  },
  switcherTeamNameInactive: {
    color: '#0F172A'
  },
  switcherScoreText: {
    fontSize: 14,
    fontFamily: systemFontMedium
  },
  switcherScoreTextActive: {
    color: '#E0F2FE'
  },
  switcherScoreTextInactive: {
    color: '#475569'
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden'
  },
  sectionTitleRow: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6
  },
  sectionTitleText: {
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    color: '#64748B',
    letterSpacing: 0.5
  },
  tableHeaderRow: {
    minHeight: 34,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  tableHeaderColMain: {
    color: '#0284C7',
    fontSize: 13,
    fontFamily: systemFontMedium
  },
  tableHeaderCol: {
    color: '#64748B',
    fontSize: 12,
    width: 34,
    textAlign: 'right',
    fontFamily: systemFontMedium
  },
  batterRow: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
  },
  playerInfoCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6
  },
  playerNameText: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: systemFontMedium
  },
  strikeBadge: {
    backgroundColor: '#0284C7',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center'
  },
  strikeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: systemFontBold,
    marginTop: -1
  },
  dismissalText: {
    color: '#64748B',
    fontSize: 11.5,
    marginTop: 2,
    fontFamily: systemFont
  },
  dismissalNotOut: {
    color: '#0284C7',
    fontFamily: systemFontMedium
  },
  runsText: {
    color: '#0F172A',
    fontSize: 14.5,
    width: 34,
    textAlign: 'right',
    fontFamily: systemFontBold
  },
  statColText: {
    color: '#64748B',
    fontSize: 12.5,
    width: 34,
    textAlign: 'right',
    fontFamily: systemFont
  },
  strikeRateText: {
    color: '#64748B',
    fontSize: 12,
    width: 48,
    textAlign: 'right',
    fontFamily: systemFont
  },
  extrasFooterRow: {
    minHeight: 38,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  extrasLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontFamily: systemFontMedium
  },
  extrasTotalNumber: {
    color: '#0F172A',
    fontSize: 13.5,
    fontFamily: systemFontBold
  },
  extrasBreakdownText: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: systemFont
  },
  yetToBatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 16
  },
  yetToBatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 135
  },
  yetToBatName: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  yetToBatSub: {
    fontSize: 11,
    fontFamily: systemFont,
    color: '#64748B',
    marginTop: 1
  },
  bowlerRow: {
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
  },
  bowlingActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginLeft: 3
  },
  wicketsNumberText: {
    color: '#0F172A',
    fontSize: 14,
    width: 34,
    textAlign: 'right',
    fontFamily: systemFontBold
  },
  emptyFiguresText: {
    color: '#94A3B8',
    fontSize: 12,
    padding: 16,
    textAlign: 'center',
    fontFamily: systemFont
  },
  fowListWrap: {
    paddingHorizontal: 14,
    paddingBottom: 6
  },
  fowItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
  },
  fowBatterName: {
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  fowScoreText: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: '#0F172A',
    width: 64,
    textAlign: 'center'
  },
  fowOverText: {
    fontSize: 12.5,
    fontFamily: systemFont,
    color: '#64748B',
    width: 50,
    textAlign: 'right'
  },
  crexPartnershipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  crexPartnerName: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  crexPartnerScore: {
    fontSize: 12,
    fontFamily: systemFont,
    color: '#64748B',
    marginTop: 2
  },
  crexPartnerCenterBlock: {
    width: 110,
    alignItems: 'center',
    paddingHorizontal: 6
  },
  crexPartnerCenterScore: {
    fontSize: 14.5,
    fontFamily: systemFontBold,
    color: '#B45309'
  },
  crexPartnerCenterBalls: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: '#64748B'
  },
  crexPartnerBarTrack: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 4
  },
  crexPartnerBarGreen: {
    height: '100%',
    backgroundColor: '#22C55E'
  },
  crexPartnerBarMaroon: {
    height: '100%',
    backgroundColor: '#991B1B'
  },
  oversScrollRow: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8
  },
  overCardPill: {
    backgroundColor: '#F8F8FA',
    borderRadius: 8,
    padding: 8,
    minWidth: 100,
    gap: 2
  },
  overCardPillMaiden: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0'
  },
  overCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  overCardNumText: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: '#64748B'
  },
  overCardRunsText: {
    fontSize: 11.5,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  overCardBowlerText: {
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    color: '#0F172A',
    marginTop: 2
  },
  overCardScoreText: {
    fontSize: 10,
    fontFamily: systemFont,
    color: '#94A3B8'
  }
});

export default CompleteScorecardView;
