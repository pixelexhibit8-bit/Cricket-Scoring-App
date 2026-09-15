import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TeamIdentityMark } from '../TeamIdentityMark.jsx';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../../theme.js';

export const PointsTableSection = React.memo(function PointsTableSection({
  pointsTableData = [],
  totalTeams = 0,
  qualifyingSpots = 4,
  isOverviewPreview = false,
  teamFormEnabled = false,
  onToggleTeamForm,
  onViewAll
}) {
  const teamsCount = totalTeams || pointsTableData.length;
  const effectiveCutoff = teamsCount >= 5 ? 4 : (teamsCount >= 3 ? 2 : 1);

  if (!pointsTableData || pointsTableData.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <MaterialCommunityIcons name="table" size={26} color="#94A3B8" />
        <Text style={styles.emptyCardTitle}>Points Table Ready</Text>
        <Text style={styles.emptyCardSubtitle}>
          Standings will calculate automatically as matches are scored.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Table Section Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Points Table</Text>
        {isOverviewPreview ? (
          onViewAll ? (
            <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
              <Text style={styles.seeAllText}>Full Table ›</Text>
            </TouchableOpacity>
          ) : null
        ) : (
          onToggleTeamForm ? (
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabelText}>Team Form</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onToggleTeamForm}
                style={[styles.toggleSwitchTrack, teamFormEnabled && styles.toggleSwitchTrackActive]}
              >
                <View style={[styles.toggleSwitchThumb, teamFormEnabled && styles.toggleSwitchThumbActive]} />
              </TouchableOpacity>
            </View>
          ) : null
        )}
      </View>

      {/* Main Table Card */}
      <View style={styles.tableCard}>
        {/* Table Column Headers */}
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableColHeader, { width: 22, textAlign: 'center' }]}>#</Text>
          <Text style={[styles.tableColHeader, { flex: 1, paddingLeft: 4 }]}>Team</Text>
          <Text style={[styles.tableColHeader, { width: 22, textAlign: 'center' }]}>P</Text>
          <Text style={[styles.tableColHeader, { width: 22, textAlign: 'center' }]}>W</Text>
          <Text style={[styles.tableColHeader, { width: 22, textAlign: 'center' }]}>L</Text>
          {!isOverviewPreview && (
            <Text style={[styles.tableColHeader, { width: 22, textAlign: 'center' }]}>NR</Text>
          )}
          <Text style={[styles.tableColHeader, { width: 50, textAlign: 'right' }]}>NRR</Text>
          <Text style={[styles.tableColHeader, { width: 28, textAlign: 'center' }]}>Pts</Text>
        </View>

        {/* Dynamic Table Rows for ALL Teams */}
        {pointsTableData.map((row, idx) => {
          const rank = idx + 1;
          const isQualifier = rank <= effectiveCutoff;
          const isLastQualifier = rank === effectiveCutoff;
          const isEliminated = rank > effectiveCutoff;

          const nrrNum = parseFloat(row.nrr || 0);
          const nrrColor = nrrNum > 0 ? '#16A34A' : (nrrNum < 0 ? '#DC2626' : '#64748B');

          return (
            <React.Fragment key={row.team || idx}>
              <View
                style={[
                  styles.tableDataRow,
                  isQualifier && styles.qualifierRowHighlight,
                  idx === pointsTableData.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                {/* Rank Number */}
                <Text style={[styles.rankCell, isQualifier && styles.rankCellQualifier]}>
                  {rank}
                </Text>

                {/* Team Identity + Name + Qualification Badge */}
                <View style={styles.teamInfoCell}>
                  <TeamIdentityMark team={{ name: row.team, shortName: row.shortName }} size={20} />
                  <Text style={styles.teamNameText} numberOfLines={1}>
                    {row.team}
                  </Text>

                  {/* Qualification Badge: Q or E */}
                  {isQualifier ? (
                    <View style={styles.qBadge}>
                      <Text style={styles.qBadgeText}>Q</Text>
                    </View>
                  ) : isEliminated ? (
                    <View style={styles.eBadge}>
                      <Text style={styles.eBadgeText}>E</Text>
                    </View>
                  ) : null}

                  {/* Form Pills if Enabled */}
                  {teamFormEnabled && row.form && Array.isArray(row.form) ? (
                    <View style={styles.formPillsWrap}>
                      {row.form.map((f, fIdx) => (
                        <View
                          key={fIdx}
                          style={[
                            styles.formPill,
                            { backgroundColor: f === 'W' ? '#16A34A' : (f === 'L' ? '#DC2626' : '#94A3B8') }
                          ]}
                        >
                          <Text style={styles.formPillText}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>

                {/* Stats Columns */}
                <Text style={[styles.tableCell, { width: 22, textAlign: 'center' }]}>{row.p ?? 0}</Text>
                <Text style={[styles.tableCell, { width: 22, textAlign: 'center' }]}>{row.w ?? 0}</Text>
                <Text style={[styles.tableCell, { width: 22, textAlign: 'center' }]}>{row.l ?? 0}</Text>
                {!isOverviewPreview && (
                  <Text style={[styles.tableCell, { width: 22, textAlign: 'center' }]}>{row.nr ?? 0}</Text>
                )}
                <Text style={[styles.tableCell, { width: 50, textAlign: 'right', fontFamily: systemFontMedium, color: nrrColor }]}>
                  {row.nrr || '0.000'}
                </Text>
                <Text style={[styles.tableCell, { width: 28, textAlign: 'center', fontFamily: systemFontBold, color: '#D97706' }]}>
                  {row.pts ?? 0}
                </Text>
              </View>

              {/* Qualification Cutoff Divider Line */}
              {isLastQualifier && rank < pointsTableData.length && (
                <View style={styles.cutoffDivider}>
                  <View style={styles.cutoffLine} />
                  <Text style={styles.cutoffText}>
                    {teamsCount >= 5 ? 'Top 4 Qualify for Semi-Finals' : 'Top 2 Qualify for Final'}
                  </Text>
                  <View style={styles.cutoffLine} />
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Standard Cricket Standings Legend / Footnote */}
      <View style={styles.legendCard}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={styles.legendDotGreen} />
            <Text style={styles.legendText}>
              <Text style={{ fontFamily: systemFontBold }}>Q:</Text> Qualified for Playoffs
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendDotRed} />
            <Text style={styles.legendText}>
              <Text style={{ fontFamily: systemFontBold }}>E:</Text> Eliminated
            </Text>
          </View>
        </View>

        <View style={styles.legendRow}>
          <Text style={styles.legendMutedText}>
            <Text style={{ fontFamily: systemFontBold, color: '#475569' }}>NRR:</Text> Net Run Rate = (Runs / Overs Faced) - (Runs / Overs Bowled)
          </Text>
        </View>

        <View style={styles.legendGlossaryRow}>
          <Text style={styles.legendGlossaryText}>P: Played</Text>
          <Text style={styles.legendGlossaryText}>•</Text>
          <Text style={styles.legendGlossaryText}>W: Won</Text>
          <Text style={styles.legendGlossaryText}>•</Text>
          <Text style={styles.legendGlossaryText}>L: Lost</Text>
          <Text style={styles.legendGlossaryText}>•</Text>
          <Text style={styles.legendGlossaryText}>Pts: Points</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: systemFontMedium,
    color: '#0F172A',
    letterSpacing: -0.1
  },
  seeAllText: {
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    color: '#0284C7'
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  toggleLabelText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  toggleSwitchTrack: {
    width: 32,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
    padding: 2,
    justifyContent: 'center'
  },
  toggleSwitchTrackActive: {
    backgroundColor: '#0284C7'
  },
  toggleSwitchThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF'
  },
  toggleSwitchThumbActive: {
    alignSelf: 'flex-end'
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    overflow: 'hidden'
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8FA',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEF0'
  },
  tableColHeader: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: '#64748B',
    textTransform: 'uppercase'
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  qualifierRowHighlight: {
    backgroundColor: '#FFFFFF'
  },
  rankCell: {
    width: 22,
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#94A3B8',
    textAlign: 'center'
  },
  rankCellQualifier: {
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  teamInfoCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 6
  },
  teamNameText: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: '#0F172A',
    flexShrink: 1
  },
  qBadge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1
  },
  qBadgeText: {
    fontSize: 9.5,
    fontFamily: systemFontBold,
    color: '#15803D'
  },
  eBadge: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1
  },
  eBadgeText: {
    fontSize: 9.5,
    fontFamily: systemFontBold,
    color: '#DC2626'
  },
  formPillsWrap: {
    flexDirection: 'row',
    gap: 2,
    marginLeft: 4
  },
  formPill: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center'
  },
  formPillText: {
    fontSize: 8.5,
    fontFamily: systemFontBold,
    color: '#FFFFFF'
  },
  tableCell: {
    fontSize: 12,
    fontFamily: systemFont,
    color: '#334155'
  },
  cutoffDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 12,
    gap: 8
  },
  cutoffLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1'
  },
  cutoffText: {
    fontSize: 10,
    fontFamily: systemFontMedium,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3
  },
  legendCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    gap: 4
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  legendDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A'
  },
  legendDotRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626'
  },
  legendText: {
    fontSize: 11,
    fontFamily: systemFont,
    color: '#334155'
  },
  legendMutedText: {
    fontSize: 10.5,
    fontFamily: systemFont,
    color: '#64748B',
    lineHeight: 14
  },
  legendGlossaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  legendGlossaryText: {
    fontSize: 10,
    fontFamily: systemFont,
    color: '#64748B'
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEEF0',
    gap: 6
  },
  emptyCardTitle: {
    fontSize: 14,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  emptyCardSubtitle: {
    fontSize: 12,
    fontFamily: systemFont,
    color: '#64748B',
    textAlign: 'center'
  }
});

export default PointsTableSection;
