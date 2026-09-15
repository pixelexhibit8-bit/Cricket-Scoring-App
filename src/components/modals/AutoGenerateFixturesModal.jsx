import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  StyleSheet
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
  visible,
  onClose,
  tournament,
  onSaveFixtures
}) {
  const teams = Array.isArray(tournament?.teams) ? tournament.teams : [];
  const numTeams = teams.length;
  const numLeagueMatches = (numTeams * (numTeams - 1)) / 2;

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const day = d.getDate();
    const m = d.toLocaleDateString('en-GB', { month: 'short' });
    return `${day} ${m} ${d.getFullYear()}`;
  });
  const [venue, setVenue] = useState(tournament?.city || 'Sadokan Cricket Ground');
  const [overs, setOvers] = useState(String(tournament?.overs || 10));
  const [includePlayoffs, setIncludePlayoffs] = useState(numTeams >= 4);
  const [isGenerating, setIsGenerating] = useState(false);

  const totalMatches = numLeagueMatches + (includePlayoffs ? (numTeams >= 5 ? 3 : 1) : 0);

  const handleGenerate = async () => {
    if (numTeams < 2) {
      showToast('At least 2 participating teams are required to generate fixtures.', 'error', 'Need More Teams');
      return;
    }

    setIsGenerating(true);
    try {
      const generated = generateRoundRobinFixtures(teams, {
        startDate: startDate || new Date().toISOString(),
        matchTimes: ['09:00 AM', '02:00 PM'],
        venue: venue || tournament?.city || 'Local Ground',
        overs: parseInt(overs, 10) || 10,
        includePlayoffs: includePlayoffs,
        tournamentId: tournament.id,
        tournamentName: tournament.name || tournament.title || 'Tournament'
      });

      if (onSaveFixtures) {
        await onSaveFixtures(generated);
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
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
                    <Text style={styles.teamChipText} numberOfLines={1}>{t.name || `Team ${idx + 1}`}</Text>
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
              <Text style={styles.fieldLabel}>Venue / Ground Name</Text>
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
                  Top 4 teams qualify from Round-Robin league table for playoffs
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
              activeOpacity={0.85}
              disabled={isGenerating}
            >
              <MaterialCommunityIcons name="lightning-bolt" size={18} color="#FFFFFF" />
              <Text style={styles.generateBtnText}>
                {isGenerating ? 'GENERATING...' : `GENERATE ${totalMatches} FIXTURES`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEF0'
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  closeBtn: {
    padding: 4
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  summaryTitle: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: '#334155'
  },
  matchCountBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  matchCountBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: systemFontMedium
  },
  teamsListRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6
  },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  teamChipText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  fieldGroup: {
    marginBottom: 14
  },
  fieldLabel: {
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    color: '#475569',
    marginBottom: 6
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: systemFont,
    color: '#0F172A'
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4
  },
  switchLabel: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: '#0F172A',
    marginBottom: 2
  },
  switchSubLabel: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: '#64748B'
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEF0',
    gap: 12
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  generateBtn: {
    flex: 1,
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontMedium,
    letterSpacing: 0.3
  }
});

export default AutoGenerateFixturesModal;
