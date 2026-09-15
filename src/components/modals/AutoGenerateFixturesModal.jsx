import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../../theme.js';
import { TeamIdentityMark } from '../TeamIdentityMark.jsx';
import { generateRoundRobinFixtures } from '../../utils/cricketUtils.js';
import { showToast } from '../../services/toastService.js';

export function AutoGenerateFixturesModal({
  visible = false,
  onClose = () => {},
  tournament = null,
  onSaveFixtures = () => {}
}) {
  const teams = Array.isArray(tournament?.teams) ? tournament.teams : [];
  const currentMatches = Array.isArray(tournament?.matches) ? tournament.matches : [];
  
  // Safe completed matches count
  const completedMatches = currentMatches.filter(
    m => m.status === 'FINISHED' || Boolean(m.result) || m.phase === 'result' || m.phase === 'finished'
  );
  const liveMatches = currentMatches.filter(
    m => m.status === 'LIVE' || m.phase === 'playing'
  );

  const numTeams = teams.length;
  const numLeagueMatches = (numTeams * Math.max(1, numTeams - 1)) / 2;

  // Step: 'guidelines' (Screenshot 1)
  const [step, setStep] = useState('guidelines');

  const tournamentVenues = Array.isArray(tournament?.venues) && tournament.venues.length > 0
    ? tournament.venues
    : [tournament?.venue || tournament?.ground || (tournament?.city ? `${tournament.city} Cricket Ground` : 'Cricket Ground')];

  const defaultVenue = tournamentVenues[0] || tournament?.ground || tournament?.venue || (tournament?.city ? `${tournament.city} Cricket Ground` : 'Cricket Ground');
  const defaultOvers = parseInt(tournament?.overs || tournament?.matchOvers || tournament?.oversPerMatch || 10, 10);
  const defaultStartDate = tournament?.startDate || new Date().toISOString();

  const [venue, setVenue] = useState(defaultVenue);
  const [overs, setOvers] = useState(String(defaultOvers));
  const [includePlayoffs, setIncludePlayoffs] = useState(numTeams >= 4);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep('guidelines');
      setVenue(defaultVenue);
      setOvers(String(defaultOvers));
      setIncludePlayoffs(numTeams >= 4);
      setIsGenerating(false);
    }
  }, [visible, tournament]);

  const handleGenerate = async () => {
    if (numTeams < 2) {
      Alert.alert(
        'Add Teams First',
        'At least 2 participating teams are required in the tournament before you can auto-generate match fixtures.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsGenerating(true);
    try {
      const targetVenue = tournamentVenues[0] || tournament?.ground || tournament?.venue || (tournament?.city ? `${tournament.city} Cricket Ground` : 'Cricket Ground');
      const targetOvers = parseInt(tournament?.overs || tournament?.matchOvers || tournament?.oversPerMatch || overs || 10, 10);
      const targetStartDate = tournament?.startDate || defaultStartDate;

      const generated = generateRoundRobinFixtures(teams, {
        startDate: targetStartDate,
        matchTimes: ['09:30 AM', '02:00 PM', '05:30 PM'],
        venue: targetVenue,
        overs: targetOvers,
        includePlayoffs: numTeams >= 4,
        tournamentId: tournament.id,
        tournamentName: tournament.name || tournament.title || 'Tournament'
      });

      // ── CRITICAL SAFEGUARD: PRESERVE ALL FINISHED & LIVE MATCHES ──
      const lockedMatches = currentMatches.filter(
        m => m.status === 'FINISHED' || m.status === 'LIVE' || Boolean(m.result)
      );

      let finalFixturesList = [];
      if (lockedMatches.length > 0) {
        // Adjust match numbering of newly generated fixtures to follow locked matches
        const startNumber = lockedMatches.length + 1;
        const renumberedGenerated = generated.map((m, idx) => ({
          ...m,
          id: `match_${tournament.id}_${startNumber + idx}`,
          matchNumber: startNumber + idx,
          matchNo: startNumber + idx,
          stage: m.stage.startsWith('Match') ? `Match ${startNumber + idx}` : m.stage
        }));
        finalFixturesList = [...lockedMatches, ...renumberedGenerated];
      } else {
        finalFixturesList = generated;
      }

      if (onSaveFixtures) {
        await onSaveFixtures(finalFixturesList);
      }

      showToast(`Generated ${generated.length} tournament fixtures successfully!`, 'success', 'Fixtures Scheduled');
      onClose();
    } catch (err) {
      console.warn('Fixture generation error:', err);
      showToast('Failed to generate fixtures', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProceedFromGuidelines = () => {
    handleGenerate();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      {step === 'guidelines' ? (
        /* ── STEP 1: AUTO SCHEDULE GUIDELINES DIALOG (MATCHES SCREENSHOT) ── */
        <Pressable style={styles.modalOverlayCenter} onPress={onClose}>
          <Pressable style={styles.guidelinesDialogCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.guidelinesTitle}>Auto schedule guidelines</Text>

            <View style={styles.guidelinesContentBlock}>
              <Text style={styles.guidelineBulletItem}>
                • Add all teams to the tournament first (at least team names).
              </Text>
              <Text style={[styles.guidelineBulletItem, { marginTop: 12 }]}>
                • Add all required rounds and groups before you start
              </Text>
            </View>

            {completedMatches.length > 0 ? (
              <View style={styles.safeRescheduleNotice}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#0D9488" />
                <Text style={styles.safeRescheduleNoticeText}>
                  {completedMatches.length} completed match scorecards are locked and will be preserved.
                </Text>
              </View>
            ) : null}

            {/* Dialog Footer Actions */}
            <View style={styles.dialogFooterRow}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dialogOkBtn, isGenerating && { opacity: 0.7 }]}
                onPress={handleProceedFromGuidelines}
                disabled={isGenerating}
                activeOpacity={0.85}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.dialogOkText}>Ok</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      ) : (
        /* ── STEP 2: FIXTURE GENERATOR CONFIG FORM ── */
        <View style={styles.modalOverlayBottom}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="lightning-bolt" size={22} color="#0284C7" />
                <Text style={styles.headerTitle}>Auto Fixture Generator</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Safe Reschedule Info Banner if in-progress */}
              {completedMatches.length > 0 ? (
                <View style={styles.activeTournamentBanner}>
                  <MaterialCommunityIcons name="shield-lock" size={18} color="#0D9488" />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.activeBannerTitle}>Safe Reschedule Active</Text>
                    <Text style={styles.activeBannerDesc}>
                      {completedMatches.length} completed match results and points table records are locked. Only upcoming fixtures will be generated.
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Participating Teams Summary */}
              <View style={styles.summaryCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={styles.summaryTitle}>Participating Teams ({numTeams})</Text>
                  <View style={styles.matchCountBadge}>
                    <Text style={styles.matchCountBadgeText}>{totalMatches} Matches</Text>
                  </View>
                </View>

                <View style={styles.teamsListRow}>
                  {teams.map((t, idx) => (
                    <View key={t.id || idx} style={styles.teamChip}>
                      <TeamIdentityMark team={t} size={18} />
                      <Text style={styles.teamChipText} numberOfLines={1}>{t.shortName || t.name || `Team ${idx + 1}`}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Config Fields */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Start Date</Text>
                <TextInput
                  style={styles.textInput}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="e.g. 24 Oct 2026"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Ground / Venue</Text>
                {tournamentVenues.length > 1 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 8 }}>
                    {tournamentVenues.map(v => (
                      <TouchableOpacity
                        key={`v_${v}`}
                        style={[styles.venueSelectChip, venue === v && styles.venueSelectChipActive]}
                        onPress={() => setVenue(v)}
                      >
                        <Text style={[styles.venueSelectChipText, venue === v && styles.venueSelectChipTextActive]}>{v}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : null}
                <TextInput
                  style={styles.textInput}
                  value={venue}
                  onChangeText={setVenue}
                  placeholder="Ground Name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Overs Per Match</Text>
                <TextInput
                  style={styles.textInput}
                  value={overs}
                  onChangeText={setOvers}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Playoffs Toggle */}
              <View style={styles.switchRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.switchLabel}>Include Playoffs (Semi-Finals & Final)</Text>
                  <Text style={styles.switchSubLabel}>
                    Top 4 teams qualify from Round-Robin standings for playoffs
                  </Text>
                </View>
                <Switch
                  value={includePlayoffs}
                  onValueChange={setIncludePlayoffs}
                  trackColor={{ false: '#E2E8F0', true: '#0284C7' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Action Footer */}
            <View style={styles.footerRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.generateBtn, isGenerating && { opacity: 0.6 }]}
                onPress={handleGenerate}
                disabled={isGenerating}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="lightning-bolt" size={18} color="#FFFFFF" />
                <Text style={styles.generateBtnText}>
                  {isGenerating ? 'GENERATING...' : (completedMatches.length > 0 ? 'RESCHEDULE UPCOMING' : 'GENERATE FIXTURES')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  guidelinesDialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8
  },
  guidelinesTitle: {
    fontSize: 18,
    fontFamily: systemFontBold,
    color: '#DC2626',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 10
  },
  guidelinesContentBlock: {
    paddingHorizontal: 22,
    paddingBottom: 22
  },
  guidelineBulletItem: {
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: '#334155',
    lineHeight: 20
  },
  safeRescheduleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 22,
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#F0FDFA',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCFBF1'
  },
  safeRescheduleNoticeText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#0F766E',
    flex: 1
  },
  dialogFooterRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  dialogCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC'
  },
  dialogCancelText: {
    fontSize: 14,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  dialogOkBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488'
  },
  dialogOkText: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: '#FFFFFF'
  },
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 16,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: '#EEEEF0'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  headerTitle: {
    fontSize: 16.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  closeBtn: {
    padding: 4
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14
  },
  activeTournamentBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14
  },
  activeBannerTitle: {
    fontSize: 12.5,
    fontFamily: systemFontBold,
    color: '#0F766E'
  },
  activeBannerDesc: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: '#115E59',
    marginTop: 2,
    lineHeight: 16
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14
  },
  summaryTitle: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  matchCountBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  matchCountBadgeText: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: '#0284C7'
  },
  teamsListRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  teamChipText: {
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    color: '#334155',
    maxWidth: 100
  },
  fieldGroup: {
    marginBottom: 14
  },
  fieldLabel: {
    fontSize: 12.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    marginBottom: 6
  },
  venueSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  venueSelectChipActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7'
  },
  venueSelectChipText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  venueSelectChipTextActive: {
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  textInput: {
    backgroundColor: '#FAFAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 42,
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4
  },
  switchLabel: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  switchSubLabel: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    marginTop: 2
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  generateBtn: {
    flex: 2,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  generateBtnText: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: '#FFFFFF'
  }
});

export default AutoGenerateFixturesModal;
