import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  systemFont,
  systemFontBold,
  systemFontMedium
} from '../../theme.js';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Standard Cricket Match Slot Times
const POPULAR_TIME_SLOTS = [
  { hour: '07', minute: '00', period: 'AM', label: '07:00 AM (Morning Slot)' },
  { hour: '08', minute: '30', period: 'AM', label: '08:30 AM (Early Match)' },
  { hour: '10', minute: '00', period: 'AM', label: '10:00 AM (Day Match)' },
  { hour: '02', minute: '30', period: 'PM', label: '02:30 PM (Afternoon)' },
  { hour: '04', minute: '00', period: 'PM', label: '04:00 PM (Evening Slot)' },
  { hour: '05', minute: '30', period: 'PM', label: '05:30 PM (Sunset Slot)' },
  { hour: '07', minute: '30', period: 'PM', label: '07:30 PM (Night Turf)' }
];

export function MatchDatePickerModal({
  visible,
  onClose,
  onSelectDateTime
}) {
  const [selectedDayOffset, setSelectedDayOffset] = useState(0); // 0 = Today, 1 = Tomorrow, 2 = Day After, etc.
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(POPULAR_TIME_SLOTS[4]); // 04:00 PM default

  // Generate 7 consecutive upcoming days cleanly with day names
  const upcomingDays = useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAY_NAMES[d.getDay()];
      const formattedDate = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
      const fullDate = `${dayName}, ${formattedDate}`;
      list.push({
        offset: i,
        dayName,
        formattedDate,
        fullDate,
        dateObj: d
      });
    }
    return list;
  }, []);

  const activeDay = upcomingDays[selectedDayOffset] || upcomingDays[0];

  const handleConfirm = () => {
    const d = new Date();
    d.setDate(d.getDate() + selectedDayOffset);

    let hourNum = parseInt(selectedTimeSlot.hour, 10);
    if (selectedTimeSlot.period === 'PM' && hourNum < 12) hourNum += 12;
    if (selectedTimeSlot.period === 'AM' && hourNum === 12) hourNum = 0;

    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(hourNum).padStart(2, '0');
    const min = String(selectedTimeSlot.minute).padStart(2, '0');

    const isoString = `${d.getFullYear()}-${mm}-${dd}T${hh}:${min}:00`;
    const label = `${activeDay.fullDate} • ${selectedTimeSlot.hour}:${selectedTimeSlot.minute} ${selectedTimeSlot.period}`;

    onSelectDateTime({
      isoString,
      label,
      dateText: activeDay.fullDate,
      timeText: `${selectedTimeSlot.hour}:${selectedTimeSlot.minute} ${selectedTimeSlot.period}`
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.backdrop}>
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Match Schedule (Date & Time)</Text>
              <Text style={styles.previewSubtitle}>
                {activeDay.fullDate} • {selectedTimeSlot.hour}:{selectedTimeSlot.minute} {selectedTimeSlot.period}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            {/* 1. SELECT DAY CHIPS */}
            <View style={{ gap: 8 }}>
              <Text style={styles.sectionLabel}>1. SELECT MATCH DAY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {upcomingDays.map((item) => {
                  const active = selectedDayOffset === item.offset;
                  return (
                    <TouchableOpacity
                      key={`day-${item.offset}`}
                      onPress={() => setSelectedDayOffset(item.offset)}
                      activeOpacity={0.75}
                      style={[styles.dayChip, active && styles.dayChipActive]}
                    >
                      <Text style={[styles.dayChipTitle, active && styles.dayChipTitleActive]}>
                        {item.dayName}
                      </Text>
                      <Text style={[styles.dayChipDate, active && styles.dayChipDateActive]}>
                        {item.formattedDate}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2. SELECT TIME SLOT */}
            <View style={{ gap: 8 }}>
              <Text style={styles.sectionLabel}>2. SELECT MATCH START TIME</Text>
              <View style={{ gap: 6 }}>
                {POPULAR_TIME_SLOTS.map((slot, sIdx) => {
                  const active = (selectedTimeSlot.hour === slot.hour && selectedTimeSlot.minute === slot.minute && selectedTimeSlot.period === slot.period);
                  return (
                    <TouchableOpacity
                      key={`slot-${sIdx}-${slot.hour}-${slot.minute}`}
                      onPress={() => setSelectedTimeSlot(slot)}
                      activeOpacity={0.75}
                      style={[styles.timeRow, active && styles.timeRowActive]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Ionicons name="time-outline" size={18} color={active ? '#0284C7' : '#64748B'} />
                        <Text style={[styles.timeRowText, active && styles.timeRowTextActive]}>
                          {slot.label}
                        </Text>
                      </View>
                      <Ionicons
                        name={active ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={active ? '#0284C7' : '#CBD5E1'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.saveBtn}>
              <Text style={styles.saveText}>Confirm Schedule</Text>
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
    justifyContent: 'flex-end'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom: 28,
    gap: 14,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#CBD5E1'
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
  previewSubtitle: {
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
  sectionLabel: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: '#64748B',
    letterSpacing: 0.5
  },
  dayChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    minWidth: 80
  },
  dayChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  dayChipTitle: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  dayChipTitleActive: {
    color: '#FFFFFF'
  },
  dayChipDate: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#64748B',
    marginTop: 2
  },
  dayChipDateActive: {
    color: 'rgba(255, 255, 255, 0.9)'
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  timeRowActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD'
  },
  timeRowText: {
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: '#334155'
  },
  timeRowTextActive: {
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 6
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center'
  },
  cancelText: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  saveBtn: {
    flex: 1.6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center'
  },
  saveText: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: '#FFFFFF'
  }
});
