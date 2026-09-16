import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
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
import { TeamIdentityMark } from '../TeamIdentityMark.jsx';
import { showToast } from '../../services/toastService.js';

export function ManualScheduleMatchModal({
  visible = false,
  onClose = () => {},
  tournament = null,
  initialMatchData = null,
  onSaveMatch = () => {}
}) {
  const teams = Array.isArray(tournament?.teams) ? tournament.teams : [];
  const tournamentRounds = Array.isArray(tournament?.rounds) && tournament.rounds.length > 0
    ? tournament.rounds
    : ['Group / League Matches', 'Quarter Final', 'Semi Final', 'Final'];

  const tournamentVenues = Array.isArray(tournament?.venues) && tournament.venues.length > 0
    ? tournament.venues
    : [tournament?.venue || tournament?.ground || (tournament?.city ? `${tournament.city} Cricket Ground` : 'Cricket Ground')];

  const isEditing = Boolean(initialMatchData);

  const [selectedStage, setSelectedStage] = useState('Group / League Matches');
  const [selectedTeam1, setSelectedTeam1] = useState(null);
  const [selectedTeam2, setSelectedTeam2] = useState(null);
  const [dateStr, setDateStr] = useState('Tomorrow');
  const [timeStr, setTimeStr] = useState('09:30 AM');
  const [selectedVenue, setSelectedVenue] = useState(tournamentVenues[0] || 'Cricket Ground');
  const [overs, setOvers] = useState(String(tournament?.overs || 10));

  useEffect(() => {
    if (visible) {
      if (initialMatchData) {
        setSelectedStage(initialMatchData.stage || 'Group / League Matches');
        
        const t1 = teams.find(t => t.name === initialMatchData.team1?.name || t.id === initialMatchData.team1?.id) || initialMatchData.team1 || null;
        const t2 = teams.find(t => t.name === initialMatchData.team2?.name || t.id === initialMatchData.team2?.id) || initialMatchData.team2 || null;
        setSelectedTeam1(t1);
        setSelectedTeam2(t2);

        setDateStr(initialMatchData.dateStr || initialMatchData.date || 'Tomorrow');
        setTimeStr(initialMatchData.time || initialMatchData.timeText || '09:30 AM');
        setSelectedVenue(initialMatchData.venue || tournamentVenues[0] || 'Cricket Ground');
        setOvers(String(initialMatchData.overs || tournament?.overs || 10));
      } else {
        setSelectedStage(tournamentRounds[0] || 'Group / League Matches');
        setSelectedTeam1(teams[0] || null);
        setSelectedTeam2(teams[1] || null);
        setDateStr('Tomorrow');
        setTimeStr('09:30 AM');
        setSelectedVenue(tournamentVenues[0] || 'Cricket Ground');
        setOvers(String(tournament?.overs || 10));
      }
    }
  }, [visible, initialMatchData, tournament]);

  const handleSave = () => {
    if (!selectedTeam1 || !selectedTeam2) {
      Alert.alert('Select Teams', 'Please select both Team 1 and Team 2 for the match.');
      return;
    }

    const t1Name = selectedTeam1.name || selectedTeam1;
    const t2Name = selectedTeam2.name || selectedTeam2;

    if (String(t1Name).trim().toLowerCase() === String(t2Name).trim().toLowerCase()) {
      Alert.alert('Duplicate Teams', 'Team 1 and Team 2 must be different teams.');
      return;
    }

    const matchPayload = {
      ...(initialMatchData || {}),
      id: initialMatchData?.id || `match_${tournament?.id || 't'}_${Date.now()}`,
      stage: selectedStage,
      matchTitle: `${t1Name} vs ${t2Name}`,
      team1: typeof selectedTeam1 === 'object' ? selectedTeam1 : { name: t1Name },
      team2: typeof selectedTeam2 === 'object' ? selectedTeam2 : { name: t2Name },
      dateStr: dateStr.trim() || 'Upcoming',
      date: dateStr.trim() || 'Upcoming',
      time: timeStr.trim() || '09:30 AM',
      timeText: timeStr.trim() || '09:30 AM',
      venue: selectedVenue.trim() || 'Cricket Ground',
      overs: parseInt(overs, 10) || 10,
      maxOvers: parseInt(overs, 10) || 10,
      status: initialMatchData?.status || 'UPCOMING',
      phase: initialMatchData?.phase || 'upcoming'
    };

    onSaveMatch(matchPayload);
    showToast(isEditing ? 'Fixture rescheduled successfully!' : 'Match scheduled successfully!', 'success');
    onClose();
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
              <MaterialCommunityIcons name="calendar-clock" size={22} color="#0284C7" />
              <Text style={styles.headerTitle}>{isEditing ? 'Reschedule Match' : 'Manual Match Scheduler'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 1. Round / Stage Selector */}
            <Text style={styles.fieldLabel}>Select Round / Stage</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
              {tournamentRounds.map((rnd) => {
                const isSel = selectedStage === rnd;
                return (
                  <TouchableOpacity
                    key={`rnd_${rnd}`}
                    style={[styles.chipPill, isSel && styles.chipPillActive]}
                    onPress={() => setSelectedStage(rnd)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipPillText, isSel && styles.chipPillTextActive]}>{rnd}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 2. Team 1 Selection */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Team 1 (Batting / Home)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
              {teams.map((t) => {
                const isSel = selectedTeam1?.name === t.name || selectedTeam1?.id === t.id;
                return (
                  <TouchableOpacity
                    key={`t1_${t.id || t.name}`}
                    style={[styles.teamCardChip, isSel && styles.teamCardChipActive]}
                    onPress={() => setSelectedTeam1(t)}
                    activeOpacity={0.7}
                  >
                    <TeamIdentityMark team={t} size={22} />
                    <Text style={[styles.teamCardChipText, isSel && styles.teamCardChipTextActive]} numberOfLines={1}>
                      {t.shortName || t.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 3. Team 2 Selection */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Team 2 (Bowling / Away)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
              {teams.map((t) => {
                const isSel = selectedTeam2?.name === t.name || selectedTeam2?.id === t.id;
                return (
                  <TouchableOpacity
                    key={`t2_${t.id || t.name}`}
                    style={[styles.teamCardChip, isSel && styles.teamCardChipActive]}
                    onPress={() => setSelectedTeam2(t)}
                    activeOpacity={0.7}
                  >
                    <TeamIdentityMark team={t} size={22} />
                    <Text style={[styles.teamCardChipText, isSel && styles.teamCardChipTextActive]} numberOfLines={1}>
                      {t.shortName || t.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 4. Match Date */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Match Date</Text>
            <View style={styles.quickSelectRow}>
              {['Today', 'Tomorrow', 'In 2 Days'].map((d) => (
                <TouchableOpacity
                  key={`qdate_${d}`}
                  style={[styles.quickBtn, dateStr === d && styles.quickBtnActive]}
                  onPress={() => setDateStr(d)}
                >
                  <Text style={[styles.quickBtnText, dateStr === d && styles.quickBtnTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.textInput}
              value={dateStr}
              onChangeText={setDateStr}
              placeholder="e.g. 18 Sep 2026"
              placeholderTextColor="#94A3B8"
            />

            {/* 5. Match Time Slot */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Match Time Slot</Text>
            <View style={styles.quickSelectRow}>
              {['09:30 AM', '02:00 PM', '05:30 PM', '07:30 PM'].map((tm) => (
                <TouchableOpacity
                  key={`qtime_${tm}`}
                  style={[styles.quickBtn, timeStr === tm && styles.quickBtnActive]}
                  onPress={() => setTimeStr(tm)}
                >
                  <Text style={[styles.quickBtnText, timeStr === tm && styles.quickBtnTextActive]}>{tm}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.textInput}
              value={timeStr}
              onChangeText={setTimeStr}
              placeholder="e.g. 10:00 AM"
              placeholderTextColor="#94A3B8"
            />

            {/* 6. Venue Selection */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Ground / Venue</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
              {tournamentVenues.map((v) => {
                const isSel = selectedVenue === v;
                return (
                  <TouchableOpacity
                    key={`v_${v}`}
                    style={[styles.chipPill, isSel && styles.chipPillActive]}
                    onPress={() => setSelectedVenue(v)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="stadium-variant" size={14} color={isSel ? '#0284C7' : '#64748B'} />
                    <Text style={[styles.chipPillText, isSel && styles.chipPillTextActive]}>{v}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TextInput
              style={[styles.textInput, { marginTop: 8 }]}
              value={selectedVenue}
              onChangeText={setSelectedVenue}
              placeholder="Enter ground name"
              placeholderTextColor="#94A3B8"
            />

            {/* 7. Overs */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Overs per Inning</Text>
            <TextInput
              style={styles.textInput}
              value={overs}
              onChangeText={setOvers}
              keyboardType="numeric"
              placeholder="10"
              placeholderTextColor="#94A3B8"
            />

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>{isEditing ? 'UPDATE FIXTURE' : 'SCHEDULE MATCH'}</Text>
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
    borderWidth: 0,
    borderColor: '#EEEEF0'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 0,
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
  fieldLabel: {
    fontSize: 12.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    marginBottom: 6
  },
  horizontalChips: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 0,
    borderColor: '#E2E8F0'
  },
  chipPillActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7'
  },
  chipPillText: {
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  chipPillTextActive: {
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  teamCardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 0,
    borderColor: '#E2E8F0'
  },
  teamCardChipActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7'
  },
  teamCardChipText: {
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    color: '#334155'
  },
  teamCardChipTextActive: {
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  quickSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 0,
    borderColor: '#E2E8F0'
  },
  quickBtnActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7'
  },
  quickBtnText: {
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  quickBtnTextActive: {
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  textInput: {
    backgroundColor: '#FAFAFC',
    borderWidth: 0,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 42,
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 0,
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
  saveBtn: {
    flex: 2,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  saveBtnText: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: '#FFFFFF'
  }
});

export default ManualScheduleMatchModal;
