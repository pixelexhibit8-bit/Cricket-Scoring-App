import React, { useState } from 'react';
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
  systemFontMedium,
  fontWeights
} from '../../theme.js';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 55 }, (_, i) => CURRENT_YEAR - 6 - i); // e.g. 2018 down to 1964

export function DobPickerModal({ visible, initialDate, onClose, onSelectDate }) {
  // Parse initialDate if present (YYYY-MM-DD)
  const parseInitial = () => {
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
      const [y, m, d] = initialDate.split('-').map(Number);
      return { year: y, month: m - 1, day: d };
    }
    return { year: 2000, month: 0, day: 1 };
  };

  const parsed = parseInitial();
  const [selectedYear, setSelectedYear] = useState(parsed.year);
  const [selectedMonth, setSelectedMonth] = useState(parsed.month);
  const [selectedDay, setSelectedDay] = useState(parsed.day);
  const [pickerTab, setPickerTab] = useState('day'); // 'day' | 'year'

  // Get days in selected month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Calculate age
  const age = CURRENT_YEAR - selectedYear;

  const handleConfirm = () => {
    const mm = String(selectedMonth + 1).padStart(2, '0');
    const dd = String(selectedDay).padStart(2, '0');
    const dateStr = `${selectedYear}-${mm}-${dd}`;
    onSelectDate(dateStr);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.backdrop}>
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Date of Birth</Text>
              <Text style={styles.subtitle}>
                {selectedDay} {MONTHS[selectedMonth]} {selectedYear} • {age} Years
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Tab Bar for Year vs Day Selection */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => setPickerTab('day')}
              style={[styles.tabBtn, pickerTab === 'day' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, pickerTab === 'day' && styles.tabTextActive]}>
                {selectedDay} {MONTHS[selectedMonth]}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPickerTab('year')}
              style={[styles.tabBtn, pickerTab === 'year' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, pickerTab === 'year' && styles.tabTextActive]}>
                Year: {selectedYear}
              </Text>
            </TouchableOpacity>
          </View>

          {pickerTab === 'day' ? (
            <>
              {/* Month Selector Horizontal Scroll */}
              <View style={styles.monthContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {MONTHS.map((m, idx) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setSelectedMonth(idx)}
                      style={[styles.monthPill, selectedMonth === idx && styles.monthPillActive]}
                    >
                      <Text style={[styles.monthText, selectedMonth === idx && styles.monthTextActive]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Day Grid */}
              <View style={styles.dayGrid}>
                {daysArray.map(d => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setSelectedDay(d)}
                    style={[styles.dayCell, selectedDay === d && styles.dayCellActive]}
                  >
                    <Text style={[styles.dayText, selectedDay === d && styles.dayTextActive]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            /* Year Selector Grid */
            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              <View style={styles.yearGrid}>
                {YEARS.map(y => (
                  <TouchableOpacity
                    key={y}
                    onPress={() => {
                      setSelectedYear(y);
                      setPickerTab('day');
                    }}
                    style={[styles.yearCell, selectedYear === y && styles.yearCellActive]}
                  >
                    <Text style={[styles.yearText, selectedYear === y && styles.yearTextActive]}>
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}>
              <Text style={styles.confirmText}>Set Date</Text>
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
    backgroundColor: 'rgba(7, 27, 44, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: 17,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  subtitle: {
    fontSize: 13,
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 4
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1
  },
  tabText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  tabTextActive: {
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  monthContainer: {
    paddingVertical: 4
  },
  monthPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  monthPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0284C7'
  },
  monthText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  monthTextActive: {
    fontFamily: systemFontBold,
    color: '#0284C7'
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start'
  },
  dayCell: {
    width: 40,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#0F172A'
  },
  dayTextActive: {
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  yearCell: {
    width: '23%',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  yearCellActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  yearText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  yearTextActive: {
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelText: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: '#64748B'
  },
  confirmBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmText: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: '#FFFFFF'
  }
});
