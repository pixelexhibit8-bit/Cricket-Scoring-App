import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  StyleSheet,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../../theme.js';
import { saveTournament } from '../../services/tournamentService.js';

export function TournamentRulesModal({
  visible = false,
  onClose = () => {},
  tournament = null,
  onTournamentUpdated = () => {}
}) {
  if (!tournament) return null;

  // Wagon Wheel Rules
  const [wwDotBalls, setWwDotBalls] = useState(false);
  const [wwSingles, setWwSingles] = useState(true);
  const [shotSelection, setShotSelection] = useState(true);

  // Wide / No Ball Rules
  const [wideIsLegal, setWideIsLegal] = useState(false);
  const [wideRuns, setWideRuns] = useState(1);
  const [noBallIsLegal, setNoBallIsLegal] = useState(false);
  const [noBallRuns, setNoBallRuns] = useState(1);

  // Impact Player & Max Overs
  const [enableImpactPlayer, setEnableImpactPlayer] = useState(false);
  const [maxOversPerBowler, setMaxOversPerBowler] = useState('2');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tournament) {
      const r = tournament.matchRulesConfig || {};
      setWwDotBalls(Boolean(r.wwDotBalls));
      setWwSingles(r.wwSingles !== undefined ? Boolean(r.wwSingles) : true);
      setShotSelection(r.shotSelection !== undefined ? Boolean(r.shotSelection) : true);
      setWideIsLegal(Boolean(r.wideIsLegal));
      setWideRuns(r.wideRuns || 1);
      setNoBallIsLegal(Boolean(r.noBallIsLegal));
      setNoBallRuns(r.noBallRuns || 1);
      setEnableImpactPlayer(Boolean(r.enableImpactPlayer));
      setMaxOversPerBowler(r.maxOversPerBowler ? String(r.maxOversPerBowler) : '2');
    }
  }, [tournament, visible]);

  const handleReset = () => {
    setWwDotBalls(false);
    setWwSingles(true);
    setShotSelection(true);
    setWideIsLegal(false);
    setWideRuns(1);
    setNoBallIsLegal(false);
    setNoBallRuns(1);
    setEnableImpactPlayer(false);
    setMaxOversPerBowler('2');
  };

  const handleSave = async () => {
    setSaving(true);
    const updated = {
      ...tournament,
      matchRulesConfig: {
        wwDotBalls,
        wwSingles,
        shotSelection,
        wideIsLegal,
        wideRuns,
        noBallIsLegal,
        noBallRuns,
        enableImpactPlayer,
        maxOversPerBowler: parseInt(maxOversPerBowler, 10) || 2
      },
      updatedAt: new Date().toISOString()
    };

    try {
      await saveTournament(updated);
      setSaving(false);
      onTournamentUpdated(updated);
      onClose();
    } catch (err) {
      setSaving(false);
      Alert.alert('Error', 'Failed to save tournament rules.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={themeColors.surface} />
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Tournament Rules</Text>
            <Text style={styles.headerSub}>Scoring regulations & ball settings</Text>
          </View>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.doneBtnText}>{saving ? 'Saving...' : 'Done'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 1. Wagon Wheel */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>WAGON WHEEL</Text>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Show Wagon Wheel for dot balls</Text>
              <Switch
                value={wwDotBalls}
                onValueChange={setWwDotBalls}
                trackColor={{ false: '#E2E8F0', true: '#059669' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Show Wagon Wheel for 1s, 2s & 3s</Text>
              <Switch
                value={wwSingles}
                onValueChange={setWwSingles}
                trackColor={{ false: '#E2E8F0', true: '#059669' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Shot selection tracking</Text>
              <Switch
                value={shotSelection}
                onValueChange={setShotSelection}
                trackColor={{ false: '#E2E8F0', true: '#059669' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <Text style={styles.sectionFootnote}>
              * Wagon Wheel & Shot selection are always active for boundaries and wickets.
            </Text>
          </View>

          {/* 2. Wide / No Ball Rules */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>WIDE / NO BALL RULES</Text>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Count wide as a legal delivery</Text>
              <Switch
                value={wideIsLegal}
                onValueChange={setWideIsLegal}
                trackColor={{ false: '#E2E8F0', true: '#059669' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.stepperRow}>
              <Text style={styles.stepperLabel}>Wide runs penalty</Text>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setWideRuns(Math.max(1, wideRuns - 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={16} color={themeColors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{wideRuns}</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setWideRuns(wideRuns + 1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color={themeColors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Count no ball as a legal delivery</Text>
              <Switch
                value={noBallIsLegal}
                onValueChange={setNoBallIsLegal}
                trackColor={{ false: '#E2E8F0', true: '#059669' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.stepperRow}>
              <Text style={styles.stepperLabel}>No ball runs penalty</Text>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setNoBallRuns(Math.max(1, noBallRuns - 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={16} color={themeColors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{noBallRuns}</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setNoBallRuns(noBallRuns + 1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color={themeColors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 3. Impact Player & Bowler Quota */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>SPECIAL RULES & QUOTA</Text>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Enable Impact Player rule</Text>
                <Text style={styles.toggleSub}>Allow 1 tactical substitute substitution per innings</Text>
              </View>
              <Switch
                value={enableImpactPlayer}
                onValueChange={setEnableImpactPlayer}
                trackColor={{ false: '#E2E8F0', true: '#059669' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.inputRow}>
              <Text style={styles.toggleLabel}>Max Overs Per Bowler</Text>
              <TextInput
                style={styles.numberInput}
                keyboardType="numeric"
                value={maxOversPerBowler}
                onChangeText={setMaxOversPerBowler}
                maxLength={2}
              />
            </View>
          </View>

          {/* Bottom Reset & Done Buttons */}
          <View style={styles.bottomButtonsRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={styles.resetBtnText}>Reset Defaults</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.submitBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.surface
  },
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
  sectionCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: 16,
    gap: 12
  },
  sectionTitle: {
    fontSize: 11.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    letterSpacing: 0.8
  },
  sectionFootnote: {
    fontSize: 10.5,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    fontStyle: 'italic',
    marginTop: 4
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  toggleLabel: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  },
  toggleSub: {
    fontSize: 10.5,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    marginTop: 2
  },
  dividerLine: {
    height: 1,
    backgroundColor: themeColors.border
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  stepperLabel: {
    fontSize: 13,
    fontFamily: systemFont,
    color: themeColors.textSecondary
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepperValue: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    minWidth: 20,
    textAlign: 'center'
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  numberInput: {
    width: 60,
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    borderRadius: 8,
    textAlign: 'center',
    paddingVertical: 6,
    fontSize: 14,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8
  },
  resetBtn: {
    flex: 1,
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  resetBtnText: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitBtnText: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: '#FFFFFF'
  }
});

export default TournamentRulesModal;
