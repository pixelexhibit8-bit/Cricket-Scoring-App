import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { systemFont, fontWeights, typeScale, themeColors } from '../theme';
import { getTeamShortCode } from '../utils/teamUtils.js';

export const WormGraph = ({ match, team1Inning, team2Inning }) => {
  const team1Name = match?.teams?.[0]?.name || match?.team1?.name || 'Team 1';
  const team2Name = match?.teams?.[1]?.name || match?.team2?.name || 'Team 2';
  const team1Code = getTeamShortCode(team1Name);
  const team2Code = getTeamShortCode(team2Name);

  const maxOvers = Number(match?.maxOvers) || 20;

  // Extract cumulative points
  const extractPoints = (inning) => {
    const points = [{ over: 0, runs: 0, wickets: 0, isWicket: false }];
    if (!inning) return points;

    const overHistory = inning.overHistory || [];
    let cumulativeRuns = 0;
    let cumulativeWickets = 0;

    overHistory.forEach(over => {
      const runs = Number(over.runs) || 0;
      const wickets = Number(over.wickets) || 0;
      cumulativeRuns += runs;
      cumulativeWickets += wickets;
      points.push({
        over: Number(over.overNum) || points.length,
        runs: cumulativeRuns,
        wickets: cumulativeWickets,
        isWicket: wickets > 0
      });
    });

    if (!inning.isOverComplete && (inning.currentOverBalls || []).length > 0) {
      const legalBalls = inning.totalLegalBalls || 0;
      const currentOverNum = legalBalls / 6;
      const currentRuns = inning.battingTeam?.runs ?? cumulativeRuns;
      const currentWickets = inning.battingTeam?.wickets ?? cumulativeWickets;
      if (currentOverNum > points[points.length - 1].over) {
        points.push({
          over: currentOverNum,
          runs: currentRuns,
          wickets: currentWickets,
          isWicket: currentWickets > points[points.length - 1].wickets
        });
      }
    }

    return points;
  };

  const team1Points = extractPoints(team1Inning);
  const team2Points = extractPoints(team2Inning);

  const hasData = team1Points.length > 1 || team2Points.length > 1;

  let maxRunVal = 50;
  team1Points.forEach(p => { if (p.runs > maxRunVal) maxRunVal = p.runs; });
  team2Points.forEach(p => { if (p.runs > maxRunVal) maxRunVal = p.runs; });

  const yAxisMax = Math.ceil(maxRunVal / 20) * 20 || 60;
  const yTicks = [
    yAxisMax,
    Math.round(yAxisMax * 0.75),
    Math.round(yAxisMax * 0.5),
    Math.round(yAxisMax * 0.25),
    0
  ];

  const step = maxOvers <= 10 ? 2 : maxOvers <= 20 ? 3 : 5;
  const xTicks = [];
  for (let i = 0; i <= maxOvers; i += step) {
    xTicks.push(i);
  }
  if (xTicks[xTicks.length - 1] !== maxOvers) {
    xTicks.push(maxOvers);
  }

  const team1Latest = team1Points[team1Points.length - 1];
  const team2Latest = team2Points[team2Points.length - 1];

  const team1ScoreText = team1Inning
    ? `${team1Inning.battingTeam?.runs || 0}-${team1Inning.battingTeam?.wickets || 0}`
    : '0-0';
  const team2ScoreText = team2Inning
    ? `${team2Inning.battingTeam?.runs || 0}-${team2Inning.battingTeam?.wickets || 0}`
    : '0-0';

  const currentOverDisplay = team2Inning && team2Points.length > 1
    ? `${(team2Latest.over).toFixed(1)} Ov`
    : team1Inning && team1Points.length > 1
      ? `${(team1Latest.over).toFixed(1)} Ov`
      : '0.0 Ov';

  const canvasWidth = 270;
  const canvasHeight = 150;

  const team1Color = '#475569'; // Clean Dark Slate (Team 1)
  const team2Color = '#E11D48'; // Clean Red / Rose (Team 2)

  const renderLineSegments = (points, color, teamLabel) => {
    if (points.length < 2) return null;

    const segments = [];
    const wicketDots = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      const x1 = (p1.over / maxOvers) * canvasWidth;
      const y1 = canvasHeight - (p1.runs / yAxisMax) * canvasHeight;

      const x2 = (p2.over / maxOvers) * canvasWidth;
      const y2 = canvasHeight - (p2.runs / yAxisMax) * canvasHeight;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;

      segments.push(
        <View
          key={`seg-${teamLabel}-${i}`}
          style={{
            position: 'absolute',
            left: cx - dist / 2,
            top: cy - 1,
            width: dist,
            height: 2,
            backgroundColor: color,
            transform: [{ rotate: `${angle}deg` }]
          }}
        />
      );

      if (p2.isWicket) {
        wicketDots.push(
          <View
            key={`wkt-${teamLabel}-${i + 1}`}
            style={{
              position: 'absolute',
              left: x2 - 4.5,
              top: y2 - 4.5,
              width: 9,
              height: 9,
              borderRadius: 4.5,
              backgroundColor: color,
              borderWidth: 1,
              borderColor: '#FFFFFF',
              zIndex: 10
            }}
          />
        );
      }
    }

    return (
      <>
        {segments}
        {wicketDots}
      </>
    );
  };

  return (
    <View style={styles.cardContainer}>
      {/* Header Row - Exact Match with Scorecard Style */}
      <View style={styles.headerRow}>
        <Text style={styles.titleText}>Worm</Text>
        <Text style={styles.overText}>At {currentOverDisplay}</Text>
        <View style={styles.scoresRow}>
          <Text style={styles.team1ScoreText}>
            {team1Code} {team1ScoreText}
          </Text>
          <Text style={styles.dotSeparator}> • </Text>
          <Text style={styles.team2ScoreText}>
            {team2Code} {team2ScoreText}
          </Text>
        </View>
      </View>

      {/* Main Chart Area */}
      {!hasData ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No completed overs yet. Worm graph updates after each over!
          </Text>
        </View>
      ) : (
        <View style={styles.chartWrapper}>
          {/* Top Label */}
          <Text style={styles.yAxisTopLabel}>Runs</Text>

          <View style={styles.graphBody}>
            {/* Y-Axis Scale Ticks */}
            <View style={styles.yAxisContainer}>
              {yTicks.map((val, idx) => (
                <Text key={idx} style={styles.yAxisText}>
                  {val}
                </Text>
              ))}
            </View>

            {/* Plot Surface */}
            <View style={styles.canvasContainer}>
              {/* Gridlines */}
              {yTicks.map((_, idx) => (
                <View
                  key={`grid-${idx}`}
                  style={[
                    styles.gridLine,
                    { top: (idx / (yTicks.length - 1)) * canvasHeight }
                  ]}
                />
              ))}

              {/* Lines */}
              {renderLineSegments(team1Points, team1Color, team1Code)}
              {renderLineSegments(team2Points, team2Color, team2Code)}
            </View>
          </View>

          {/* X-Axis Ticks & Label */}
          <View style={styles.xAxisRow}>
            <View style={styles.xAxisSpacer} />
            <View style={styles.xAxisTicksContainer}>
              {xTicks.map((val, idx) => (
                <Text key={idx} style={styles.xAxisText}>
                  {val}
                </Text>
              ))}
            </View>
            <Text style={styles.xAxisRightLabel}>Ov</Text>
          </View>

          {/* Simple Bottom Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: team1Color }]} />
              <Text style={styles.legendText}>{team1Code}</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: team2Color }]} />
              <Text style={styles.legendText}>{team2Code}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF', // Clean Scorecard White
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  titleText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: fontWeights.bold,
    fontFamily: systemFont
  },
  overText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    fontFamily: systemFont
  },
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  team1ScoreText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: fontWeights.bold,
    fontFamily: systemFont,
    fontVariant: ['tabular-nums']
  },
  dotSeparator: {
    color: '#94A3B8',
    fontSize: 12
  },
  team2ScoreText: {
    color: '#E11D48',
    fontSize: 13,
    fontWeight: fontWeights.bold,
    fontFamily: systemFont,
    fontVariant: ['tabular-nums']
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center'
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    fontFamily: systemFont
  },
  chartWrapper: {
    marginTop: 12
  },
  yAxisTopLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    marginBottom: 4,
    fontFamily: systemFont
  },
  graphBody: {
    flexDirection: 'row',
    height: 150
  },
  yAxisContainer: {
    width: 32,
    height: 150,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 6
  },
  yAxisText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    fontVariant: ['tabular-nums'],
    fontFamily: systemFont
  },
  canvasContainer: {
    width: 270,
    height: 150,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    overflow: 'visible'
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F8FAFC'
  },
  xAxisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  xAxisSpacer: {
    width: 32
  },
  xAxisTicksContainer: {
    width: 270,
    flexDirection: 'row',
    justify: 'space-between'
  },
  xAxisText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    fontVariant: ['tabular-nums'],
    fontFamily: systemFont
  },
  xAxisRightLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    marginLeft: 6,
    fontFamily: systemFont
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2
  },
  legendText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: fontWeights.bold,
    fontFamily: systemFont
  }
});
