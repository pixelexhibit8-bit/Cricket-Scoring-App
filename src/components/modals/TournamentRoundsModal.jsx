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

// Comprehensive Round Definitions based on real tournament formats (Screenshot 4)
const ROUND_ROBIN_ROUNDS = [
  'Group / League Matches',
  'Pre Quarter Final',
  'Quarter Final',
  'Semi Final',
  'Semi Final 1',
  'Semi Final 2',
  'Final',
  'Super League',
  'Super Eight',
  'Super Ten',
  'Super Six',
  'Super Four',
  'Super Three',
  'Qualifier 1',
  'Eliminator',
  'Qualifier 2',
  'Third Position',
  'Fourth Position',
  'Fifth Position',
  'Warm up Match',
  'Relegation Matches',
  'Super Division Matches',
  '1st Test',
  '2nd Test',
  '3rd Test',
  'Gold Final',
  'Silver Final',
  'Plate Final',
  'Trophy Final'
];

const KNOCKOUT_ROUNDS = [
  'Super Knockout',
  'Round One',
  'Round Two',
  'Round Three',
  'Round Four',
  'Round Five',
  'Pre Quarter Final',
  'Quarter Final',
  'Semi Final',
  'Semi Final 1',
  'Semi Final 2',
  'Final',
  'Super League',
  'Super Six',
  'Third Position',
  'Deciding Match',
  'Plate Play Off',
  'Trophy Semi Final'
];

export function TournamentRoundsModal({
  visible = false,
  onClose = () => {},
  tournament = null,
  onTournamentUpdated = () => {}
}) {
  if (!tournament) return null;

  // View Mode: 'list' (Visual flow diagram, Screenshot 2) | 'add' (Categorized round picker, Screenshot 3/4)
  const [viewMode, setViewMode] = useState('list');
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
      setViewMode('list');
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

  const moveRoundUp = (index) => {
    if (index === 0) return;
    const updated = [...selectedRounds];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setSelectedRounds(updated);
  };

  const moveRoundDown = (index) => {
    if (index === selectedRounds.length - 1) return;
    const updated = [...selectedRounds];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setSelectedRounds(updated);
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
        {/* ── HEADER BAR ── */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (viewMode === 'add') {
                setViewMode('list');
              } else {
                onClose();
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>
              {viewMode === 'list' ? 'Rounds' : 'Add rounds'}
            </Text>
            <Text style={styles.headerSub}>
              {viewMode === 'list' ? 'Tournament stage progression' : 'Select stages to add to tournament'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.saveHeaderBtn}
            onPress={handleSaveRounds}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveHeaderBtnText}>{saving ? 'Saving...' : 'Done'}</Text>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW MODE 1: VISUAL TREE FLOW (Matching Screenshot 2)
            ═══════════════════════════════════════════════════════════════════ */}
        {viewMode === 'list' ? (
          <View style={styles.flex1}>
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContentList}
              showsVerticalScrollIndicator={false}
            >
              {selectedRounds.length > 0 ? (
                <View style={styles.visualTreeCard}>
                  <View style={styles.treeHeader}>
                    <MaterialCommunityIcons name="tournament" size={20} color="#18181B" />
                    <Text style={styles.treeHeaderTitle}>TOURNAMENT ROUNDS PROGRESSION</Text>
                  </View>
                  <Text style={styles.treeHeaderSub}>
                    Matches are organized sequentially through these stages:
                  </Text>

                  {/* Vertical Oval Connected Nodes (Screenshot 2) */}
                  <View style={styles.ovalNodesWrapper}>
                    {selectedRounds.map((rName, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === selectedRounds.length - 1;
                      return (
                        <View key={`${rName}-${idx}`} style={styles.nodeItemContainer}>
                          <View style={styles.ovalNodeBadge}>
                            <View style={styles.nodeNumberBadge}>
                              <Text style={styles.nodeNumberText}>{idx + 1}</Text>
                            </View>

                            <Text style={styles.ovalNodeText}>{rName}</Text>

                            {/* Reorder / Delete Controls */}
                            <View style={styles.nodeActionsRow}>
                              {!isFirst && (
                                <TouchableOpacity
                                  style={styles.nodeActionBtn}
                                  onPress={() => moveRoundUp(idx)}
                                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                >
                                  <Ionicons name="arrow-up" size={15} color="#64748B" />
                                </TouchableOpacity>
                              )}
                              {!isLast && (
                                <TouchableOpacity
                                  style={styles.nodeActionBtn}
                                  onPress={() => moveRoundDown(idx)}
                                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                >
                                  <Ionicons name="arrow-down" size={15} color="#64748B" />
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity
                                style={styles.nodeActionBtn}
                                onPress={() => toggleRound(rName)}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                              >
                                <Ionicons name="trash-outline" size={15} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Vertical Connector Line */}
                          {!isLast && <View style={styles.verticalConnectorLine} />}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <View style={styles.emptyRoundsBox}>
                  <MaterialCommunityIcons name="tournament" size={48} color="#94A3B8" />
                  <Text style={styles.emptyRoundsTitle}>Add rounds</Text>
                  <Text style={styles.emptyRoundsSub}>
                    You haven't added any rounds yet. Go ahead and add rounds for your tournament.
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Bottom Two Action Buttons (Screenshot 2) */}
            <View style={styles.bottomBarContainer}>
              <TouchableOpacity
                style={styles.doneBottomBtn}
                onPress={handleSaveRounds}
                activeOpacity={0.8}
              >
                <Text style={styles.doneBottomBtnText}>Done</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addRoundsBottomBtn}
                onPress={() => setViewMode('add')}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.addRoundsBottomBtnText}>Add rounds</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════
              VIEW MODE 2: CATEGORIZED ADD ROUNDS PICKER (Screenshot 3 & 4)
              ═══════════════════════════════════════════════════════════════════ */
          <View style={styles.flex1}>
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContentAdd}
              showsVerticalScrollIndicator={false}
            >
              {/* Accordion 1: Round Robin (League matches) */}
              <View style={styles.accordionContainer}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => setLeagueExpanded(!leagueExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.accordionHeaderText}>Round robin (league matches)</Text>
                  <Ionicons
                    name={leagueExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#18181B"
                  />
                </TouchableOpacity>

                {leagueExpanded && (
                  <View style={styles.roundOptionList}>
                    {ROUND_ROBIN_ROUNDS.map((rName) => {
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
                            size={22}
                            color={isChecked ? '#059669' : '#CBD5E1'}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Accordion 2: Knock out */}
              <View style={styles.accordionContainer}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => setKnockoutExpanded(!knockoutExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.accordionHeaderText}>Knock out</Text>
                  <Ionicons
                    name={knockoutExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#18181B"
                  />
                </TouchableOpacity>

                {knockoutExpanded && (
                  <View style={styles.roundOptionList}>
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
                            size={22}
                            color={isChecked ? '#059669' : '#CBD5E1'}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Bottom Bar: Back to Tree List */}
            <View style={styles.bottomBarContainer}>
              <TouchableOpacity
                style={[styles.addRoundsBottomBtn, { flex: 1 }]}
                onPress={() => setViewMode('list')}
                activeOpacity={0.85}
              >
                <Text style={styles.addRoundsBottomBtnText}>VIEW ACTIVE ROUNDS ({selectedRounds.length})</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: themeColors.appBackground
  },
  flex1: {
    flex: 1
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
  saveHeaderBtn: {
    backgroundColor: '#18181B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8
  },
  saveHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  scrollArea: {
    flex: 1
  },
  scrollContentList: {
    padding: 16,
    paddingBottom: 20
  },
  scrollContentAdd: {
    paddingVertical: 12
  },
  visualTreeCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: 16,
    alignItems: 'center'
  },
  treeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  treeHeaderTitle: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    letterSpacing: 0.8
  },
  treeHeaderSub: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textSecondary,
    marginBottom: 20,
    textAlign: 'center'
  },
  ovalNodesWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 4
  },
  nodeItemContainer: {
    alignItems: 'center',
    width: '100%'
  },
  ovalNodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1.5,
    borderColor: '#18181B',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 30,
    width: '90%',
    maxWidth: 320,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  nodeNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center'
  },
  nodeNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: systemFontBold
  },
  ovalNodeText: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8
  },
  nodeActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  nodeActionBtn: {
    padding: 2
  },
  verticalConnectorLine: {
    width: 2,
    height: 24,
    backgroundColor: '#18181B',
    marginVertical: 1
  },
  emptyRoundsBox: {
    backgroundColor: themeColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    marginTop: 20
  },
  emptyRoundsTitle: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  emptyRoundsSub: {
    fontSize: 12.5,
    fontFamily: systemFont,
    color: themeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18
  },
  bottomBarContainer: {
    backgroundColor: themeColors.surface,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12
  },
  doneBottomBtn: {
    flex: 1,
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  doneBottomBtnText: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  addRoundsBottomBtn: {
    flex: 1.3,
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addRoundsBottomBtnText: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: '#FFFFFF'
  },
  accordionContainer: {
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: themeColors.surfaceOffWhite,
    borderTopWidth: 1,
    borderTopColor: themeColors.border
  },
  accordionHeaderText: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  roundOptionList: {
    backgroundColor: themeColors.surface
  },
  roundOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border
  },
  roundOptionText: {
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  roundOptionTextActive: {
    color: themeColors.textPrimary,
    fontFamily: systemFontBold
  }
});

export default TournamentRoundsModal;
