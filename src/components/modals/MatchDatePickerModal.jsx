import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  systemFont,
  systemFontBold,
  systemFontMedium,
  fontWeights
} from '../../theme.js';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const HOURS = ['06', '07', '08', '09', '10', '11', '12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
const MINUTES = ['00', '15', '30', '45'];

export function MatchDatePickerModal({
  visible,
  initialDate,
  initialTime,
  onClose,
  onSelectDateTime
}) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());

  // Time state
  const [selectedHour, setSelectedHour] = useState('04');
  const [selectedMinute, setSelectedMinute] = useState('30');
  const [selectedPeriod, setSelectedPeriod] = useState('PM');
  const [activeTab, setActiveTab] = useState('date'); // 'date' | 'time'

  // Quick Preset Options
  const handleQuickPreset = (type) => {
    const d = new Date();
    if (type === 'today') {
      setSelectedYear(d.getFullYear());
      setSelectedMonth(d.getMonth());
      setSelectedDay(d.getDate());
    } else if (type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      setSelectedYear(d.getFullYear());
      setSelectedMonth(d.getMonth());
      setSelectedDay(d.getDate());
    }
  };

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const formattedDatePreview = `${selectedDay} ${MONTHS[selectedMonth]} ${selectedYear}`;
  const formattedTimePreview = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;

  const handleConfirm = () => {
    // Construct standard ISO date string
    let hourNum = parseInt(selectedHour, 10);
    if (selectedPeriod === 'PM' && hourNum < 12) hourNum += 12;
    if (selectedPeriod === 'AM' && hourNum === 12) hourNum = 0;
    
    const mm = String(selectedMonth + 1).padStart(2, '0');
    const dd = String(selectedDay).padStart(2, '0');
    const hh = String(hourNum).padStart(2, '0');
    const min = String(selectedMinute).padStart(2, '0');
    
    const isoString = `${selectedYear}-${mm}-${dd}T${hh}:${min}:00`;
    const label = `${formattedDatePreview}, ${formattedTimePreview}`;
    
    onSelectDateTime({
      isoString,
      label,
      dateText: formattedDatePreview,
      timeText: formattedTimePreview
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.backdrop}>
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Match Schedule</Text>
              <Text style={styles.subtitle}>
                {formattedDatePreview} • {formattedTimePreview}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Quick Preset Buttons */}
          <View style={styles.presetRow}>
            <TouchableOpacity
              onPress={() => handleQuickPreset('today')}
              style={[styles.presetBtn, selectedDay === now.getDate() && selectedMonth === now.getMonth() && styles.presetBtnActive]}
            >
              <Ionicons name="calendar-outline" size={13} color={selectedDay === now.getDate() && selectedMonth === now.getMonth() ? '#0284C7' : '#64748B'} />
              <Text style={[styles.presetBtnText, selectedDay === now.getDate() && selectedMonth === now.getMonth() && styles.presetBtnTextActive]}>
                Today ({now.getDate()} {MONTHS[now.getMonth()]})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickPreset('tomorrow')}
              style={[styles.presetBtn, selectedDay === now.getDate() + 1 && styles.presetBtnActive]}
            >
              <Ionicons name="sunny-outline" size={13} color={selectedDay === now.getDate() + 1 ? '#0284C7' : '#64748B'} />
              <Text style={[styles.presetBtnText, selectedDay === now.getDate() + 1 && styles.presetBtnTextActive]}>
                Tomorrow
              </Text>
            </TouchableOpacity>
          </View>

          {/* Switcher Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => setActiveTab('date')}
              style={[styles.tabBtn, activeTab === 'date' && styles.tabBtnActive]}
            >
              <Ionicons name="calendar" size={15} color={activeTab === 'date' ? '#0284C7' : '#64748B'} />
              <Text style={[styles.tabText, activeTab === 'date' && styles.tabTextActive]}>
                {formattedDatePreview}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('time')}
              style={[styles.tabBtn, activeTab === 'time' && styles.tabBtnActive]}
            >
              <Ionicons name="time" size={15} color={activeTab === 'time' ? '#0284C7' : '#64748B'} />
              <Text style={[styles.tabText, activeTab === 'time' && styles.tabTextActive]}>
                {formattedTimePreview}
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: DATE PICKER */}
          {activeTab === 'date' ? (
            <View style={{ gap: 12 }}>
              {/* Month Selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {MONTHS.map((m, idx) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setSelectedMonth(idx)}
                    style={[styles.monthChip, selectedMonth === idx && styles.monthChipActive]}
                  >
                    <Text style={[styles.monthText, selectedMonth === idx && styles.monthTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Day Grid */}
              <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                <View style={styles.daysGrid}>
                  {daysArray.map(d => {
                    const active = selectedDay === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        onPress={() => setSelectedDay(d)}
                        style={[styles.dayCell, active && styles.dayCellActive]}
                      >
                        <Text style={[styles.dayText, active && styles.dayTextActive]}>{d}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          ) : (
            /* TAB 2: TIME PICKER */
            <View style={{ gap: 14 }}>
              {/* AM / PM Selector */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['AM', 'PM'].map(p => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setSelectedPeriod(p)}
                    style={[styles.periodBtn, selectedPeriod === p && styles.periodBtnActive]}
                  >
                    <Text style={[styles.periodText, selectedPeriod === p && styles.periodTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Hour & Minute Row */}
              <View style={{ gap: 8 }}>
                <Text style={styles.sectionLabel}>SELECT HOUR</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {HOURS.map(h => (
                    <TouchableOpacity
                      key={h}
                      onPress={() => setSelectedHour(h)}
                      style={[styles.timeChip, selectedHour === h && styles.timeChipActive]}
                    >
                      <Text style={[styles.timeChipText, selectedHour === h && styles.timeChipTextActive]}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.sectionLabel, { marginTop: 6 }]}>SELECT MINUTE</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {MINUTES.map(m => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setSelectedMinute(m)}
                      style={[styles.minChip, selectedMinute === m && styles.timeChipActive]}
                    >
                      <Text style={[styles.timeChipText, selectedMinute === m && styles.timeChipTextActive]}>{m}m</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}>
              <Text style={styles.confirmText}>Set Schedule</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    elevation: 8
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10
  },
  title: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  subtitle: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#0284C7',
    marginTop: 2
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8
  },
  presetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  presetBtnActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#38BDF8'
  },
  presetBtnText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#475569'
  },
  presetBtnTextActive: {
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 4
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2
  },
  tabText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  tabTextActive: {
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  monthChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  monthChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  monthText: {
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    color: '#475569'
  },
  monthTextActive: {
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 4
  },
  dayCell: {
    width: '12.8%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  dayCellActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  dayText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#334155'
  },
  dayTextActive: {
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center'
  },
  periodBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  periodText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#475569'
  },
  periodTextActive: {
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: systemFontBold,
    color: '#64748B',
    letterSpacing: 0.5
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  minChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center'
  },
  timeChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  timeChipText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#334155'
  },
  timeChipTextActive: {
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 6
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center'
  },
  cancelText: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  confirmBtn: {
    flex: 1.5,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center'
  },
  confirmText: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: '#FFFFFF'
  }
});
