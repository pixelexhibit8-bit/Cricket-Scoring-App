import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { systemFont, fontWeights, typeScale, themeColors } from '../theme';

const getTeamShortCode = (name = '') => {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return String(name).replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase() || 'TM';
};

export const ManhattanGraph = ({ match, team1Inning, team2Inning }) => {
  const [selectedTeamIndex, setSelectedTeamIndex] = useState(0); // 0 = Team 1, 1 = Team 2

  const team1Name = match?.teams?.[0]?.name || match?.team1?.name || 'Team 1';
  const team2Name = match?.teams?.[1]?.name || match?.team2?.name || 'Team 2';
  const team1Code = getTeamShortCode(team1Name);
  const team2Code = getTeamShortCode(team2Name);

  const selectedInning = selectedTeamIndex === 0 ? team1Inning : team2Inning;
  const selectedTeamCode = selectedTeamIndex === 0 ? team1Code : team2Code;
  const selectedTeamColor = selectedTeamIndex === 0 ? '#475569' : '#E11D48';

  const maxOvers = Number(match?.maxOvers) || 20;

  // Extract over-by-over runs & wickets array
  const extractOverHistory = (inning) => {
    if (!inning) return [];
    const history = (inning.overHistory || []).map(over => ({
      overNum: Number(over.overNum) || 1,
      runs: Number(over.runs) || 0,
      wickets: Number(over.wickets) || 0,
      bowlerName: over.bowlerName || ''
    }));

    if (!inning.isOverComplete && (inning.currentOverBalls || []).length > 0) {
      const balls = inning.currentOverBalls || [];
      const partialRuns = balls.reduce((sum, b) => {
        const val = parseInt(String(b).replace(/[^\d]/g, '') || '0', 10);
        return sum + (Number.isFinite(val) ? val : 0);
      }, 0);
      const partialWickets = balls.filter(b => /^(\d+)?W$/i.test(String(b))).length;
      const currentOverNum = Math.floor((inning.totalLegalBalls || 0) / 6) + 1;
      history.push({
        overNum: currentOverNum,
        runs: partialRuns,
        wickets: partialWickets,
        bowlerName: inning.bowler?.name || 'Bowler',
        isCurrent: true
      });
    }

    return history;
  };

  const oversList = extractOverHistory(selectedInning);
  const hasData = oversList.length > 0;

  let maxOverRuns = 15;
  oversList.forEach(o => { if (o.runs > maxOverRuns) maxOverRuns = o.runs; });
  const yAxisMax = Math.ceil(maxOverRuns / 6) * 6 || 18;

  const yTicks = [
    yAxisMax,
    Math.round(yAxisMax * 0.75),
    Math.round(yAxisMax * 0.5),
    Math.round(yAxisMax * 0.25),
    0
  ];

  const totalRuns = selectedInning?.battingTeam?.runs || 0;
  const totalWickets = selectedInning?.battingTeam?.wickets || 0;
  const totalOversText = selectedInning
    ? `${Math.floor((selectedInning.totalLegalBalls || 0) / 6)}.${(selectedInning.totalLegalBalls || 0) % 6}`
    : '0.0';

  const lastOverRuns = oversList.length > 0 ? oversList[oversList.length - 1].runs : 0;

  // DYNAMIC PILLAR (BAR) & GAP CALCULATION
  const canvasWidth = 270;
  const totalSlots = Math.max(1, maxOvers);
  const slotWidth = canvasWidth / totalSlots;
  const barGap = Math.max(1, Math.min(6, Math.floor(slotWidth * 0.18)));
  const barWidth = Math.max(3, Math.min(36, Math.floor(slotWidth - barGap)));
  const wicketDotSize = Math.max(3, Math.min(8, Math.floor(barWidth * 0.65)));

  // X-Axis tick label step logic (e.g. 1, 4, 7, 10, 13, 16, 19 like screenshot)
  const labelStep = maxOvers <= 10 ? 2 : maxOvers <= 20 ? 3 : 5;
  const shouldShowLabel = (overNum) => {
    if (overNum === 1 || overNum === maxOvers) return true;
    return (overNum - 1) % labelStep === 0;
  };

  return (
    <View style={styles.cardContainer}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.titleText}>Manhattan</Text>
        <Text style={styles.lastOverText}>{lastOverRuns} Runs</Text>
        <Text style={styles.scoreText}>
          {selectedTeamCode} {totalRuns}-{totalWickets} ({totalOversText})
        </Text>
      </View>

      {/* Team Switcher Pills */}
      <View style={styles.teamSwitchRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedTeamIndex(0)}
          style={[
            styles.teamPill,
            selectedTeamIndex === 0 ? styles.teamPillActive : styles.teamPillInactive
          ]}
        >
          <Text
            style={[
              styles.teamPillText,
              { color: selectedTeamIndex === 0 ? '#0284C7' : '#64748B' }
            ]}
          >
            {team1Code}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedTeamIndex(1)}
          style={[
            styles.teamPill,
            selectedTeamIndex === 1 ? styles.teamPillActive : styles.teamPillInactive
          ]}
        >
          <Text
            style={[
              styles.teamPillText,
              { color: selectedTeamIndex === 1 ? '#0284C7' : '#64748B' }
            ]}
          >
            {team2Code}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chart Surface */}
      {!hasData ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No overs completed yet for {selectedTeamCode}. Manhattan chart updates after each over!
          </Text>
        </View>
      ) : (
        <View style={styles.chartWrapper}>
          <Text style={styles.yAxisTopLabel}>Runs</Text>

          <View style={styles.graphBody}>
            {/* Y Axis Labels */}
            <View style={styles.yAxisContainer}>
              {yTicks.map((val, idx) => (
                <Text key={idx} style={styles.yAxisText}>
                  {val}
                </Text>
              ))}
            </View>

            {/* Bars Canvas */}
            <View style={styles.canvasContainer}>
              {/* Horizontal Grid lines */}
              {yTicks.map((_, idx) => (
                <View
                  key={`grid-${idx}`}
                  style={[
                    styles.gridLine,
                    { top: (idx / (yTicks.length - 1)) * 140 }
                  ]}
                />
              ))}

              {/* Dynamic Bars Row */}
              <View style={[styles.barsRow, { gap: barGap }]}>
                {oversList.map((over) => {
                  const barHeight = Math.max(3, (over.runs / yAxisMax) * 140);
                  const isCurrentOver = over.isCurrent;

                  return (
                    <View
                      key={over.overNum}
                      style={[styles.barColumn, { width: barWidth }]}
                    >
                      {/* Wicket Dots Stack */}
                      <View style={styles.wicketDotsContainer}>
                        {Array.from({ length: over.wickets }).map((_, wIdx) => (
                          <View
                            key={wIdx}
                            style={[
                              styles.wicketDot,
                              {
                                width: wicketDotSize,
                                height: wicketDotSize,
                                borderRadius: wicketDotSize / 2,
                                backgroundColor: selectedTeamColor
                              }
                            ]}
                          />
                        ))}
                      </View>

                      {/* Over Bar (Pillar) */}
                      <View
                        style={[
                          styles.barShape,
                          {
                            width: barWidth,
                            height: barHeight,
                            backgroundColor: isCurrentOver
                              ? '#334155'
                              : selectedTeamColor
                          }
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* X Axis Overs Labels */}
          <View style={styles.xAxisRow}>
            <View style={styles.xAxisSpacer} />
            <View style={[styles.xAxisLabelsContainer, { gap: barGap }]}>
              {oversList.map((over) => (
                <View key={over.overNum} style={{ width: barWidth, alignItems: 'center' }}>
                  {shouldShowLabel(over.overNum) ? (
                    <Text style={styles.xAxisText}>{over.overNum}</Text>
                  ) : null}
                </View>
              ))}
            </View>
            <Text style={styles.xAxisRightLabel}>Ov</Text>
          </View>

          {/* Bottom Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#475569' }]} />
              <Text style={styles.legendText}>{team1Code}</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#E11D48' }]} />
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 14
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  titleText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: fontWeights.bold,
    fontFamily: systemFont
  },
  lastOverText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    fontFamily: systemFont
  },
  scoreText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: fontWeights.bold,
    fontFamily: systemFont,
    fontVariant: ['tabular-nums']
  },
  teamSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    marginBottom: 4
  },
  teamPill: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1
  },
  teamPillActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7'
  },
  teamPillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0'
  },
  teamPillText: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    fontFamily: systemFont
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
    marginTop: 10
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
    height: 140
  },
  yAxisContainer: {
    width: 30,
    height: 140,
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
    height: 140,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative'
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F8FAFC'
  },
  barsRow: {
    width: 270,
    height: 140,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 2
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  wicketDotsContainer: {
    gap: 2,
    marginBottom: 3,
    alignItems: 'center'
  },
  wicketDot: {
    borderRadius: 4
  },
  barShape: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2
  },
  xAxisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  xAxisSpacer: {
    width: 30
  },
  xAxisLabelsContainer: {
    width: 270,
    flexDirection: 'row',
    paddingLeft: 2
  },
  xAxisText: {
    textAlign: 'center',
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
