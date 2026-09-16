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

  const numTeams = teams.length;
  const numLeagueMatches = Math.max(0, (numTeams * Math.max(1, numTeams - 1)) / 2);

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

  const totalMatches = includePlayoffs ? (numLeagueMatches + (numTeams >= 4 ? 3 : 1)) : numLeagueMatches;

  useEffect(() => {
    if (visible) {
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
      const targetVenue = venue.trim() || defaultVenue;
      const targetOvers = parseInt(overs || defaultOvers || 10, 10);
      const targetStartDate = tournament?.startDate || defaultStartDate;

      const generated = generateRoundRobinFixtures(teams, {
        startDate: targetStartDate,
        matchTimes: ['09:30 AM', '02:00 PM', '05:30 PM'],
        venue: targetVenue,
        overs: targetOvers,
        includePlayoffs: includePlayoffs && numTeams >= 4,
        tournamentId: tournament.id,
        tournamentName: tournament.name || tournament.title || 'Tournament'
      });

      // ── SAFEGUARD: PRESERVE ONLY GENUINELY FINISHED MATCHES ──
      const lockedMatches = currentMatches.filter(
        m => m.status === 'FINISHED' || Boolean(m.result) || m.phase === 'finished'
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

      showToast(`Scheduled ${generated.length} tournament fixtures successfully!`, 'success', 'Fixtures Scheduled');
      onClose();
    } catch (err) {
      console.warn('Fixture generation error:', err);
      showToast('Failed to generate fixtures', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeftCol}>
              <View style={styles.headerIconBox}>
                <MaterialCommunityIcons name="lightning-bolt" size={20} color="#18181B" />
              </View>
              <Text style={styles.headerTitle}>Auto Schedule Fixtures</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Safe Reschedule Info Banner if matches already completed */}
            {completedMatches.length > 0 ? (
              <View style={styles.safeRescheduleCard}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#18181B" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.safeRescheduleTitle}>Safe Reschedule Active</Text>
                  <Text style={styles.safeRescheduleText}>
                    {completedMatches.length} completed match scorecards are locked and will be preserved. Only upcoming fixtures will be generated.
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Participating Teams Summary */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Participating Teams ({numTeams})</Text>
                <View style={styles.matchCountBadge}>
                  <Text style={styles.matchCountBadgeText}>{totalMatches} Matches</Text>
                </View>
              </View>

              {teams.length > 0 ? (
                <View style={styles.teamsListRow}>
                  {teams.map((t, idx) => (
                    <View key={t.id || `team_${idx}`} style={styles.teamChip}>
                      <TeamIdentityMark team={t} size={16} />
                      <Text style={styles.teamChipText} numberOfLines={1}>
                        {t.shortName || t.name || `Team ${idx + 1}`}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyNoticeText}>
                  No teams added yet. Please add at least 2 teams to generate fixtures.
                </Text>
              )}
            </View>

            {/* Guidelines Card */}
            <View style={styles.guidelinesCard}>
              <View style={styles.guidelineRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#18181B" style={{ marginTop: 2 }} />
                <Text style={styles.guidelineText}>
                  Generates balanced round-robin fixtures where every team plays against each other.
                </Text>
              </View>
              <View style={[styles.guidelineRow, { marginTop: 8 }]}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#18181B" style={{ marginTop: 2 }} />
                <Text style={styles.guidelineText}>
                  Evenly distributes matches across morning, afternoon, and evening slots.
                </Text>
              </View>
            </View>

            {/* Ground / Venue Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Ground / Venue</Text>
              {tournamentVenues.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.venueChipsScroll}>
                  {tournamentVenues.map(v => (
                    <TouchableOpacity
                      key={`venue_${v}`}
                      style={[styles.venueChip, venue === v && styles.venueChipActive]}
                      onPress={() => setVenue(v)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.venueChipText, venue === v && styles.venueChipTextActive]}>
                        {v}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}
              <TextInput
                style={styles.textInput}
                value={venue}
                onChangeText={setVenue}
                placeholder="Enter Ground Name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Overs Per Match */}
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

            {/* Playoffs Toggle (Semi-Finals & Final) */}
            {numTeams >= 4 ? (
              <View style={styles.switchRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.switchLabel}>Include Playoffs</Text>
                  <Text style={styles.switchSubLabel}>
                    Top 4 teams qualify from standings for Semi-Finals & Final
                  </Text>
                </View>
                <Switch
                  value={includePlayoffs}
                  onValueChange={setIncludePlayoffs}
                  trackColor={{ false: '#E2E8F0', true: '#18181B' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ) : null}

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.generateBtn, (isGenerating || numTeams < 2) && { opacity: 0.6 }]}
              onPress={handleGenerate}
              disabled={isGenerating || numTeams < 2}
              activeOpacity={0.85}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="lightning-bolt" size={18} color="#FFFFFF" />
                  <Text style={styles.generateBtnText}>
                    {completedMatches.length > 0 ? 'Reschedule Upcoming' : 'Generate Fixtures'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    paddingTop: 16,
    paddingBottom: 24,
    borderWidth: 0,
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
  headerLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  closeBtn: {
    padding: 4
  },
  scrollContent: {
    maxHeight: 480
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 14
  },
  safeRescheduleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEEEF0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14
  },
  safeRescheduleTitle: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  safeRescheduleText: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textSecondary,
    marginTop: 2,
    lineHeight: 17
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    marginBottom: 14
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  matchCountBadge: {
    backgroundColor: '#18181B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  matchCountBadgeText: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: '#FFFFFF'
  },
  teamsListRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  teamChipText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary,
    maxWidth: 120
  },
  emptyNoticeText: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  guidelinesCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    marginBottom: 14
  },
  guidelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8
  },
  guidelineText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    color: '#334155',
    lineHeight: 18
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
  venueChipsScroll: {
    gap: 6,
    marginBottom: 8
  },
  venueChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7'
  },
  venueChipActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B'
  },
  venueChipText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#52525B'
  },
  venueChipTextActive: {
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  textInput: {
    backgroundColor: '#FAFAFC',
    borderWidth: 1,
    borderColor: '#EEEEF0',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    marginBottom: 14
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
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  generateBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  generateBtnText: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: '#FFFFFF'
  }
});

export default AutoGenerateFixturesModal;
