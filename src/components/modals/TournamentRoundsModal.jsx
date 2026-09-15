import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../../theme.js';
import { saveTournament } from '../../services/tournamentService.js';

const LEAGUE_ROUNDS = [
  'Group / League Matches',
  'Pre Quarter Final',
  'Quarter Final',
  'Semi Final',
  'Qualifier 1',
  'Eliminator',
  'Qualifier 2',
  'Super Four',
  'Super Six',
  'Final',
  'Third Position Match',
  'Warm Up Match'
];

const KNOCKOUT_ROUNDS = [
  'Round One',
  'Round Two',
  'Round Three',
  'Pre Quarter Final',
  'Quarter Final',
  'Semi Final',
  'Final',
  'Third Position Match'
];

export function TournamentRoundsModal({
  visible = false,
  onClose = () => {},
  tournament = null,
  onTournamentUpdated = () => {}
}) {
  if (!tournament) return null;

  const [selectedRounds, setSelectedRounds] = useState([]);
  const [leagueExpanded, setLeagueExpanded] = useState(true);
  const [knockoutExpanded, setKnockoutExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tournament) {
      const existing = Array.isArray(tournament.rounds) && tournament.rounds.length > 0
        ? tournament.rounds
        : ['Group / League Matches', 'Quarter Final', 'Semi Final', 'Final'];
      setSelectedRounds(existing);
    }
  }, [tournament, visible]);

  const toggleRound = (roundName) => {
    if (selectedRounds.includes(roundName)) {
      if (selectedRounds.length === 1) {
        Alert.alert('Minimum One Round', 'Tournament must have at least one active round.');
        return;
      }
      setSelectedRounds(selectedRounds.filter(r => r !== roundName));
    } else {
      setSelectedRounds([...selectedRounds, roundName]);
    }
  };

  const handleSaveRounds = async () => {
    setSaving(true);
    const updated = {
      ...tournament,
      rounds: selectedRounds,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveTournament(updated);
      setSaving(false);
      onTournamentUpdated(updated);
      onClose();
    } catch (err) {
      setSaving(false);
      Alert.alert('Error', 'Failed to save tournament rounds.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Tournament Rounds</Text>
            <Text style={styles.headerSub}>Configure stages for match progression</Text>
          </View>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={handleSaveRounds}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.doneBtnText}>{saving ? 'Saving...' : 'Done'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Active Flow Diagram */}
          <View style={styles.treeSectionCard}>
            <View style={styles.cardHeaderRow}>
              <MaterialCommunityIcons name="tournament" size={18} color="#18181B" />
              <Text style={styles.cardHeaderTitle}>ACTIVE TOURNAMENT STAGES ({selectedRounds.length})</Text>
            </View>

            <View style={styles.treeList}>
              {selectedRounds.map((rnd, idx) => (
                <View key={`${rnd}-${idx}`} style={styles.treeItemWrap}>
                  <View style={styles.treeBadge}>
                    <Text style={styles.treeBadgeText}>{rnd}</Text>
                    <TouchableOpacity
                      onPress={() => toggleRound(rnd)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ marginLeft: 6 }}
                    >
                      <Ionicons name="close-circle" size={16} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                  {idx < selectedRounds.length - 1 && (
                    <View style={styles.treeConnectorLine} />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* League Rounds Dropdown Section */}
          <View style={styles.accordionCard}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setLeagueExpanded(!leagueExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.accordionTitleRow}>
                <MaterialCommunityIcons name="format-list-numbered" size={18} color="#18181B" />
                <Text style={styles.accordionTitle}>Round Robin (League Matches)</Text>
              </View>
              <Ionicons
                name={leagueExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={themeColors.textSecondary}
              />
            </TouchableOpacity>

            {leagueExpanded && (
              <View style={styles.roundItemsList}>
                {LEAGUE_ROUNDS.map((rName) => {
                  const isChecked = selectedRounds.includes(rName);
                  return (
                    <TouchableOpacity
                      key={rName}
                      style={styles.roundOptionRow}
                      onPress={() => toggleRound(rName)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.roundOptionText, isChecked && styles.roundOptionTextActive]}>
                        {rName}
                      </Text>
                      <Ionicons
                        name={isChecked ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={isChecked ? '#059669' : '#CBD5E1'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Knockout Rounds Dropdown Section */}
          <View style={styles.accordionCard}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setKnockoutExpanded(!knockoutExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.accordionTitleRow}>
                <MaterialCommunityIcons name="sword-cross" size={18} color="#18181B" />
                <Text style={styles.accordionTitle}>Knockout Rounds</Text>
              </View>
              <Ionicons
                name={knockoutExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={themeColors.textSecondary}
              />
            </TouchableOpacity>

            {knockoutExpanded && (
              <View style={styles.roundItemsList}>
                {KNOCKOUT_ROUNDS.map((rName) => {
                  const isChecked = selectedRounds.includes(rName);
                  return (
                    <TouchableOpacity
                      key={rName}
                      style={styles.roundOptionRow}
                      onPress={() => toggleRound(rName)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.roundOptionText, isChecked && styles.roundOptionTextActive]}>
                        {rName}
                      </Text>
                      <Ionicons
                        name={isChecked ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={isChecked ? '#059669' : '#CBD5E1'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: themeColors.appBackground
  },
  headerBar: {
    height: 54,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  headerTitleWrap: {
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  headerSub: {
    fontSize: 10,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  doneBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16
  },
  treeSectionCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: 16,
    alignItems: 'center'
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    alignSelf: 'flex-start'
  },
  cardHeaderTitle: {
    fontSize: 11.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    letterSpacing: 0.8
  },
  treeList: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8
  },
  treeItemWrap: {
    alignItems: 'center'
  },
  treeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1.5,
    borderColor: '#18181B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    minWidth: 200,
    justifyContent: 'center'
  },
  treeBadgeText: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  treeConnectorLine: {
    width: 2,
    height: 20,
    backgroundColor: '#94A3B8',
    marginVertical: 2
  },
  accordionCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border,
    overflow: 'hidden'
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: themeColors.surfaceOffWhite
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  accordionTitle: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  roundItemsList: {
    backgroundColor: themeColors.surface
  },
  roundOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border
  },
  roundOptionText: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  roundOptionTextActive: {
    color: themeColors.textPrimary,
    fontFamily: systemFontBold
  }
});

export default TournamentRoundsModal;
