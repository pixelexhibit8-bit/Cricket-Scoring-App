import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { FadeSlideIn } from '../motion/MotionSystem.jsx';
import { systemFontBold, systemFontMedium } from '../../theme.js';
import { formatOvers } from '../../utils/cricketUtils.js';

export const ScorerHubCard = React.memo(function ScorerHubCard({
  hasActiveMatch,
  activeMatch,
  onResumeScoring,
  onStartQuickMatch,
  onOpenShareModal,
  onOpenJoinModal
}) {
  const currentInningIdx = (activeMatch?.inning || 1) - 1;
  const currentInningData = activeMatch?.innings?.[currentInningIdx];
  const activeRuns = currentInningData?.battingTeam?.runs ?? 0;
  const activeWickets = currentInningData?.battingTeam?.wickets ?? 0;
  const activeOvers = formatOvers(currentInningData?.totalLegalBalls || 0);
  const matchTitle = activeMatch?.matchTitle || `${activeMatch?.team1?.name || 'Team 1'} vs ${activeMatch?.team2?.name || 'Team 2'}`;

  return (
    <FadeSlideIn distance={12} delay={0}>
      <View style={styles.cardContainer}>
        {hasActiveMatch ? (
          <View style={styles.activeMatchBox}>
            {/* Top Indicator Row */}
            <View style={styles.activeHeaderRow}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>MATCH IN PROGRESS</Text>
              </View>
              {activeMatch?.matchCode ? (
                <View style={styles.codeBadge}>
                  <Text style={styles.codeBadgeText}>Code: {activeMatch.matchCode}</Text>
                </View>
              ) : null}
            </View>

            {/* Match Title */}
            <Text style={styles.matchTitleText}>{matchTitle}</Text>

            {/* Score & Overs */}
            <Text style={styles.matchScoreText}>
              Inning {activeMatch?.inning || 1} • {activeRuns}/{activeWickets}  {activeOvers}
            </Text>

            {/* Resume Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onResumeScoring && onResumeScoring(activeMatch)}
              style={styles.resumeBtn}
            >
              <MaterialCommunityIcons name="play-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.resumeBtnText}>RESUME SCORING</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Ground Scoring Header */}
            <View style={styles.idleHeaderRow}>
              <View style={styles.idleTitleWrap}>
                <MaterialCommunityIcons name="scoreboard-outline" size={18} color="#18181B" />
                <Text style={styles.idleTitleText}>GROUND MATCH SCORING</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>Verified Scorer</Text>
              </View>
            </View>

            {/* Start Quick Match Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onStartQuickMatch}
              style={styles.startMatchBtn}
            >
              <MaterialCommunityIcons name="cricket" size={18} color="#FFFFFF" />
              <Text style={styles.startMatchBtnText}>START NEW QUICK MATCH</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Co-Scorer / Join Actions */}
        {hasActiveMatch ? (
          <View style={styles.splitActionsRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onOpenShareModal}
              style={styles.splitActionBtn}
            >
              <Ionicons name="share-social-outline" size={14} color="#18181B" />
              <Text style={styles.splitActionText}>Share Access</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onOpenJoinModal}
              style={styles.splitActionBtn}
            >
              <Ionicons name="enter-outline" size={14} color="#18181B" />
              <Text style={styles.splitActionText}>Join Match</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onOpenJoinModal}
            style={styles.joinMatchCodeBtn}
          >
            <Ionicons name="enter-outline" size={15} color="#18181B" />
            <Text style={styles.joinMatchCodeText}>Join Match with Code</Text>
          </TouchableOpacity>
        )}
      </View>
    </FadeSlideIn>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    gap: 10
  },
  activeMatchBox: {
    backgroundColor: '#F8F8FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    gap: 8
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E11D48'
  },
  liveBadgeText: {
    fontSize: 11,
    color: '#E11D48',
    fontFamily: systemFontBold
  },
  codeBadge: {
    backgroundColor: '#EEEEF0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  codeBadgeText: {
    fontSize: 10,
    color: '#333333',
    fontFamily: systemFontMedium
  },
  matchTitleText: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  matchScoreText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: systemFontMedium
  },
  resumeBtn: {
    backgroundColor: '#18181B',
    borderRadius: 10,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4
  },
  resumeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontBold
  },
  idleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  idleTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  idleTitleText: {
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 0.5,
    fontFamily: systemFontBold
  },
  verifiedBadge: {
    backgroundColor: '#F8F8FA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEF0'
  },
  verifiedBadgeText: {
    fontSize: 10,
    color: '#18181B',
    fontFamily: systemFontBold
  },
  startMatchBtn: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  startMatchBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontBold
  },
  splitActionsRow: {
    flexDirection: 'row',
    gap: 8
  },
  splitActionBtn: {
    flex: 1,
    backgroundColor: '#F8F8FA',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderColor: '#EEEEF0'
  },
  splitActionText: {
    color: '#333333',
    fontSize: 11.5,
    fontFamily: systemFontMedium
  },
  joinMatchCodeBtn: {
    backgroundColor: '#F8F8FA',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderColor: '#EEEEF0'
  },
  joinMatchCodeText: {
    color: '#333333',
    fontSize: 12,
    fontFamily: systemFontMedium
  }
});

export default ScorerHubCard;
