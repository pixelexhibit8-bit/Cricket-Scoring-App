import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { systemFont, systemFontMedium, systemFontBold, shadows } from '../../theme.js';

export function MatchCompleteModal({
  visible,
  match,
  onClose,
  onStartRematch,
  onViewScorecard
}) {
  if (!match) return null;

  const inn1 = match.innings?.[0];
  const inn2 = match.innings?.[1];
  const team1Name = match.teams?.[0]?.name || inn1?.battingTeam?.name || 'Team 1';
  const team2Name = match.teams?.[1]?.name || inn2?.battingTeam?.name || 'Team 2';

  const team1Score = inn1?.battingTeam ? `${inn1.battingTeam.runs}-${inn1.battingTeam.wickets}` : '-';
  const team2Score = inn2?.battingTeam ? `${inn2.battingTeam.runs}-${inn2.battingTeam.wickets}` : '-';

  const resultText = match.resultText || match.winner || 'Match Completed';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.iconBadge}>
                <Ionicons name="trophy" size={18} color="#D97706" />
              </View>
              <Text style={styles.title}>Match Completed!</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Result Banner */}
          <View style={styles.resultBanner}>
            <MaterialCommunityIcons name="star-circle" size={18} color="#0284C7" />
            <Text style={styles.resultText} numberOfLines={2}>{resultText}</Text>
          </View>

          {/* Scores Summary Card */}
          <View style={styles.scoresCard}>
            <View style={styles.scoreRow}>
              <Text style={styles.teamName} numberOfLines={1}>{team1Name}</Text>
              <Text style={styles.teamScore}>{team1Score}</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreRow}>
              <Text style={styles.teamName} numberOfLines={1}>{team2Name}</Text>
              <Text style={styles.teamScore}>{team2Score}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.rematchBtn}
              onPress={() => {
                onClose();
                if (onStartRematch) onStartRematch();
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.rematchBtnText}>START REMATCH (SAME TEAMS)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.scorecardBtn}
              onPress={() => {
                onClose();
                if (onViewScorecard) onViewScorecard();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text-outline" size={17} color="#0F172A" />
              <Text style={styles.scorecardBtnText}>View Full Scorecard</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.helperNotice}>
            Starting a rematch preloads both squads for a quick new match setup.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.medium,
    elevation: 10
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 17,
    color: '#0F172A',
    fontFamily: systemFontBold,
    letterSpacing: 0.2
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 14
  },
  resultText: {
    flex: 1,
    fontSize: 13,
    color: '#0369A1',
    fontFamily: systemFontBold
  },
  scoresCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  scoreDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6
  },
  teamName: {
    fontSize: 13,
    color: '#334155',
    fontFamily: systemFontBold,
    flex: 1,
    marginRight: 8
  },
  teamScore: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: systemFontBold,
    fontVariant: ['tabular-nums']
  },
  actionsContainer: {
    gap: 10
  },
  rematchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 13,
    borderRadius: 12,
    elevation: 2
  },
  rematchBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontBold,
    letterSpacing: 0.3
  },
  scorecardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  scorecardBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontFamily: systemFontBold
  },
  helperNotice: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
    fontFamily: systemFontMedium
  }
});

export default MatchCompleteModal;
