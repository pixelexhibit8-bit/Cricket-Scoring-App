import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

  // Format team code
  const getTeamCode = (row) => {
    if (row.shortName && row.shortName.trim().length > 0) return row.shortName.trim().toUpperCase();
    if (row.shortCode && row.shortCode.trim().length > 0) return row.shortCode.trim().toUpperCase();
    if (row.team) {
      const parts = String(row.team).trim().split(/\s+/);
      if (parts.length >= 2) {
        return parts.map(p => p[0]).join('').slice(0, 4).toUpperCase();
      }
      return row.team.slice(0, 4).toUpperCase();
    }
    return 'TEAM';
  };

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
          <Text style={[styles.tableColHeader, { flex: 1, paddingLeft: 22 }]}>Team</Text>
          <Text style={[styles.tableColHeader, styles.colP]}>P</Text>
          <Text style={[styles.tableColHeader, styles.colW]}>W</Text>
          <Text style={[styles.tableColHeader, styles.colL]}>L</Text>
          <Text style={[styles.tableColHeader, styles.colNR]}>NR</Text>
          <Text style={[styles.tableColHeader, styles.colNRR]}>NRR</Text>
          <Text style={[styles.tableColHeader, styles.colPts]}>Pts</Text>
        </View>

        {/* Dynamic Table Rows for ALL Teams */}
        {pointsTableData.map((row, idx) => {
          const rank = idx + 1;
          const isQualifier = rank <= effectiveCutoff;
          const teamCode = getTeamCode(row);

          const nrrNum = parseFloat(row.nrr || 0);
          const nrrFormatted = nrrNum > 0 ? `+${nrrNum.toFixed(3)}` : (nrrNum < 0 ? nrrNum.toFixed(3) : '0.000');
          const nrrColor = nrrNum > 0 ? '#16A34A' : (nrrNum < 0 ? '#DC2626' : '#64748B');

          return (
            <View
              key={row.team || idx}
              style={[
                styles.tableDataRow,
                isQualifier && styles.qualifierRowHighlight,
                idx === pointsTableData.length - 1 && { borderBottomWidth: 0 }
              ]}
            >
              {/* Team Identity Column: Q Tag + Logo + Short Name */}
              <View style={styles.teamInfoCell}>
                {isQualifier ? (
                  <View style={styles.qTagBadge}>
                    <Text style={styles.qTagText}>Q</Text>
                  </View>
                ) : (
                  <View style={styles.qTagPlaceholder} />
                )}

                <TeamIdentityMark team={{ name: row.team, shortName: teamCode }} size={20} />

                <Text style={styles.teamCodeText} numberOfLines={1}>
                  {teamCode}
                </Text>

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

              {/* Stats Columns with Exact Proportional Widths */}
              <Text style={[styles.tableCell, styles.colP]}>{row.p ?? 0}</Text>
              <Text style={[styles.tableCell, styles.colW]}>{row.w ?? 0}</Text>
              <Text style={[styles.tableCell, styles.colL]}>{row.l ?? 0}</Text>
              <Text style={[styles.tableCell, styles.colNR]}>{row.nr ?? 0}</Text>
              <Text style={[styles.tableCell, styles.colNRR, { color: nrrColor }]}>
                {nrrFormatted}
              </Text>
              <Text style={[styles.tableCell, styles.colPts, styles.ptsCell]}>
                {row.pts ?? 0}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Qualified Badge Indicator below Table */}
      <View style={styles.qualifierIndicatorRow}>
        <View style={styles.qTagBadgeSmall}>
          <Text style={styles.qTagTextSmall}>Q</Text>
        </View>
        <Text style={styles.qualifierIndicatorText}>Qualified</Text>
      </View>

      {/* Clean 2-Column Standard Cricket Glossary */}
      <View style={styles.glossaryContainer}>
        <Text style={styles.glossaryTitle}>Glossary</Text>
        <View style={styles.glossaryTwoColRow}>
          {/* Left Column */}
          <View style={styles.glossaryCol}>
            <View style={styles.glossaryItem}>
              <Text style={styles.glossaryKey}>P:</Text>
              <Text style={styles.glossaryVal}>The number of matches played</Text>
            </View>
            <View style={styles.glossaryItem}>
              <Text style={styles.glossaryKey}>W:</Text>
              <Text style={styles.glossaryVal}>The number of matches won</Text>
            </View>
            <View style={styles.glossaryItem}>
              <Text style={styles.glossaryKey}>L:</Text>
              <Text style={styles.glossaryVal}>The number of matches lost</Text>
            </View>
            <View style={styles.glossaryItem}>
              <Text style={styles.glossaryKey}>NRR:</Text>
              <Text style={styles.glossaryVal}>Net Run Rate</Text>
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.glossaryCol}>
            <View style={styles.glossaryItem}>
              <Text style={styles.glossaryKey}>NR:</Text>
              <Text style={styles.glossaryVal}>No Result</Text>
            </View>
            <View style={styles.glossaryItem}>
              <Text style={styles.glossaryKey}>Pts:</Text>
              <Text style={styles.glossaryVal}>Points</Text>
            </View>
            <View style={styles.glossaryItem}>
              <View style={styles.eTagBadgeMini}>
                <Text style={styles.eTagTextMini}>E</Text>
              </View>
              <Text style={styles.glossaryVal}>Eliminated</Text>
            </View>
            <View style={styles.glossaryItem}>
              <View style={styles.qTagBadgeMini}>
                <Text style={styles.qTagTextMini}>Q</Text>
              </View>
              <Text style={styles.glossaryVal}>Qualified</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 20
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: systemFontBold,
    color: '#0F172A',
    letterSpacing: -0.2
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
    width: 34,
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
    backgroundColor: '#FAFAFA',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  tableColHeader: {
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  colP: {
    width: 26,
    textAlign: 'center'
  },
  colW: {
    width: 26,
    textAlign: 'center'
  },
  colL: {
    width: 26,
    textAlign: 'center'
  },
  colNR: {
    width: 26,
    textAlign: 'center'
  },
  colNRR: {
    width: 58,
    textAlign: 'right'
  },
  colPts: {
    width: 32,
    textAlign: 'center'
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF'
  },
  qualifierRowHighlight: {
    backgroundColor: '#FFFDF0'
  },
  teamInfoCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4
  },
  qTagBadge: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  qTagText: {
    fontSize: 9,
    fontFamily: systemFontBold,
    color: '#854D0E',
    lineHeight: 11
  },
  qTagPlaceholder: {
    width: 14,
    height: 14
  },
  teamCodeText: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: '#0F172A',
    letterSpacing: 0.2
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
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: '#334155'
  },
  ptsCell: {
    fontFamily: systemFontBold,
    color: '#D97706',
    fontSize: 14
  },
  qualifierIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 4
  },
  qTagBadgeSmall: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  qTagTextSmall: {
    fontSize: 9,
    fontFamily: systemFontBold,
    color: '#854D0E',
    lineHeight: 11
  },
  qualifierIndicatorText: {
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  glossaryContainer: {
    marginTop: 20,
    paddingHorizontal: 2
  },
  glossaryTitle: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: '#0F172A',
    marginBottom: 12
  },
  glossaryTwoColRow: {
    flexDirection: 'row',
    gap: 16
  },
  glossaryCol: {
    flex: 1,
    gap: 8
  },
  glossaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  glossaryKey: {
    fontSize: 11.5,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  glossaryVal: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: '#64748B',
    flexShrink: 1
  },
  eTagBadgeMini: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2
  },
  eTagTextMini: {
    fontSize: 9,
    fontFamily: systemFontBold,
    color: '#DC2626',
    lineHeight: 11
  },
  qTagBadgeMini: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2
  },
  qTagTextMini: {
    fontSize: 9,
    fontFamily: systemFontBold,
    color: '#854D0E',
    lineHeight: 11
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
    fontFamily: systemFontBold,
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
