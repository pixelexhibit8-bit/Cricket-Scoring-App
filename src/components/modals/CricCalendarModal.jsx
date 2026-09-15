import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontBold,
  systemFontMedium,
  fontWeights
} from '../../theme.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/**
 * Format a Date object to "01 Dec 2026"
 */
export function formatCricDate(d) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Parse date strings like "01 Dec 2026" or "2026-12-01" to Date object
 */
export function parseCricDate(str) {
  if (!str) return null;
  if (str instanceof Date && !isNaN(str.getTime())) return str;

  // Try parsing "01 Dec 2026" format
  const parts = String(str).trim().split(/[\s-]+/);
  if (parts.length === 3) {
    // If format is DD Mon YYYY (e.g. 01 Dec 2026)
    if (isNaN(parts[1])) {
      const day = parseInt(parts[0], 10);
      const monthIdx = MONTH_SHORT.findIndex(m => m.toLowerCase() === parts[1].toLowerCase().slice(0, 3));
      const year = parseInt(parts[2], 10);
      if (monthIdx >= 0 && !isNaN(day) && !isNaN(year)) {
        return new Date(year, monthIdx, day);
      }
    }
    // If format is YYYY-MM-DD
    if (parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Universal Reusable CricCalendarModal
 * 
 * Supports:
 * - mode="range" (Start Date & End Date selection for Tournaments/Series)
 * - mode="single" (Single Date selection for Matches/Fixtures/Events)
 */
export function CricCalendarModal({
  visible,
  mode = 'range', // 'range' | 'single'
  initialStartDate = null,
  initialEndDate = null,
  title = 'Select Tournament Dates',
  subtitle = 'Choose starting and finishing dates',
  onClose,
  onSelectRange, // ({ startDate, endDate, duration, totalDays }) => void
  onSelectDate // (dateString) => void
}) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const parsedStart = useMemo(() => parseCricDate(initialStartDate) || today, [initialStartDate, today]);
  const parsedEnd = useMemo(() => parseCricDate(initialEndDate) || (new Date(parsedStart.getTime() + 9 * 86400000)), [initialEndDate, parsedStart]);

  // Current Viewing Month & Year
  const [viewYear, setViewYear] = useState(parsedStart.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedStart.getMonth());

  // Selected Date Range State
  const [selectedStart, setSelectedStart] = useState(parsedStart);
  const [selectedEnd, setSelectedEnd] = useState(mode === 'range' ? parsedEnd : null);
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);

  // Sync state when modal opens
  React.useEffect(() => {
    if (visible) {
      const s = parseCricDate(initialStartDate) || today;
      const e = parseCricDate(initialEndDate) || (new Date(s.getTime() + 9 * 86400000));
      setSelectedStart(s);
      setSelectedEnd(mode === 'range' ? e : null);
      setViewYear(s.getFullYear());
      setViewMonth(s.getMonth());
      setIsSelectingEnd(false);
    }
  }, [visible, initialStartDate, initialEndDate, mode, today]);

  // Month Navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  // Days Grid Calculation for the Viewing Month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...
    // Convert to Monday = 0
    const startOffset = (firstDayIndex + 6) % 7;
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days = [];
    // Empty cells before 1st of month
    for (let i = 0; i < startOffset; i++) {
      days.push({ key: `empty-${i}`, empty: true });
    }

    // Days of current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateObj = new Date(viewYear, viewMonth, d);
      dateObj.setHours(0, 0, 0, 0);

      const isPast = dateObj.getTime() < today.getTime();
      const isToday = dateObj.getTime() === today.getTime();

      let isStart = false;
      let isEnd = false;
      let isInRange = false;

      if (selectedStart) {
        isStart = dateObj.getTime() === selectedStart.getTime();
      }
      if (selectedEnd) {
        isEnd = dateObj.getTime() === selectedEnd.getTime();
      }
      if (selectedStart && selectedEnd && selectedStart.getTime() < selectedEnd.getTime()) {
        isInRange = dateObj.getTime() > selectedStart.getTime() && dateObj.getTime() < selectedEnd.getTime();
      }

      days.push({
        key: `day-${viewYear}-${viewMonth}-${d}`,
        dayNum: d,
        dateObj,
        isPast,
        isToday,
        isStart,
        isEnd,
        isInRange
      });
    }

    return days;
  }, [viewYear, viewMonth, today, selectedStart, selectedEnd]);

  // Day Selection Handler
  const handleDayPress = (dayItem) => {
    if (!dayItem || dayItem.empty) return;
    const clickedDate = dayItem.dateObj;

    if (mode === 'single') {
      setSelectedStart(clickedDate);
      setSelectedEnd(null);
      return;
    }

    // Range Mode Selection Logic
    if (!isSelectingEnd || !selectedStart) {
      // 1. Pick Start Date
      setSelectedStart(clickedDate);
      setSelectedEnd(null);
      setIsSelectingEnd(true);
    } else {
      // 2. Pick End Date
      if (clickedDate.getTime() < selectedStart.getTime()) {
        // If clicked earlier date, reset start to this date
        setSelectedStart(clickedDate);
        setSelectedEnd(null);
        setIsSelectingEnd(true);
      } else {
        setSelectedEnd(clickedDate);
        setIsSelectingEnd(false);
      }
    }
  };

  // Quick Presets Handlers
  const applyPreset = (daysCount) => {
    const start = new Date(today);
    const end = new Date(today.getTime() + (daysCount - 1) * 86400000);
    setSelectedStart(start);
    setSelectedEnd(end);
    setViewYear(start.getFullYear());
    setViewMonth(start.getMonth());
    setIsSelectingEnd(false);
  };

  const applyWeekendPreset = () => {
    const current = new Date(today);
    const dayOfWeek = current.getDay(); // 0 is Sun, 6 is Sat
    const daysUntilSat = (6 - dayOfWeek + 7) % 7;
    const saturday = new Date(current.getTime() + daysUntilSat * 86400000);
    const sunday = new Date(saturday.getTime() + 86400000);

    setSelectedStart(saturday);
    setSelectedEnd(sunday);
    setViewYear(saturday.getFullYear());
    setViewMonth(saturday.getMonth());
    setIsSelectingEnd(false);
  };

  // Calculate Duration
  const totalDays = useMemo(() => {
    if (!selectedStart) return 1;
    if (!selectedEnd) return 1;
    const diffTime = Math.abs(selectedEnd.getTime() - selectedStart.getTime());
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [selectedStart, selectedEnd]);

  // Final Confirmation
  const handleConfirm = () => {
    const formattedStart = formatCricDate(selectedStart || today);
    const formattedEnd = formatCricDate(selectedEnd || selectedStart || today);
    const durationStr = `${formattedStart} - ${formattedEnd}`;

    if (mode === 'range' && onSelectRange) {
      onSelectRange({
        startDate: formattedStart,
        endDate: formattedEnd,
        duration: durationStr,
        totalDays
      });
    } else if (onSelectDate) {
      onSelectDate(formattedStart);
    }
    if (onClose) onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.titleText}>{title}</Text>
              <Text style={styles.subtitleText}>{subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={themeColors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Quick Presets Bar (Range Mode Only) */}
          {mode === 'range' ? (
            <View style={styles.presetsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsContent}>
                <TouchableOpacity
                  style={[styles.presetChip, totalDays === 2 && styles.presetChipActive]}
                  onPress={() => applyPreset(2)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetChipText, totalDays === 2 && styles.presetChipTextActive]}>2 Days</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.presetChip, totalDays === 7 && styles.presetChipActive]}
                  onPress={() => applyPreset(7)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetChipText, totalDays === 7 && styles.presetChipTextActive]}>1 Week</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={applyWeekendPreset}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetChipText}>This Weekend</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.presetChip, totalDays === 14 && styles.presetChipActive]}
                  onPress={() => applyPreset(14)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetChipText, totalDays === 14 && styles.presetChipTextActive]}>2 Weeks</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.presetChip, totalDays === 30 && styles.presetChipActive]}
                  onPress={() => applyPreset(30)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetChipText, totalDays === 30 && styles.presetChipTextActive]}>1 Month</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          ) : null}

          {/* Month & Year Navigation Row */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={18} color={themeColors.textPrimary} />
            </TouchableOpacity>

            <Text style={styles.monthYearTitle}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={18} color={themeColors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Day of Week Header Row (Mo, Tu, We...) */}
          <View style={styles.dayOfWeekHeaderRow}>
            {DAY_LABELS.map((dayLabel, idx) => (
              <View key={dayLabel} style={styles.dayOfWeekCell}>
                <Text style={[styles.dayOfWeekText, (idx === 5 || idx === 6) && styles.weekendHeaderText]}>
                  {dayLabel}
                </Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((dayItem) => {
              if (dayItem.empty) {
                return <View key={dayItem.key} style={styles.dayCellEmpty} />;
              }

              const isStart = dayItem.isStart;
              const isEnd = dayItem.isEnd;
              const inRange = dayItem.isInRange;
              const isSelectedEndpoint = isStart || isEnd;

              return (
                <View key={dayItem.key} style={styles.dayCellContainer}>
                  {/* Range Background Fill Strip */}
                  {inRange ? (
                    <View style={styles.rangeBackgroundFill} />
                  ) : null}
                  {isStart && selectedEnd ? (
                    <View style={styles.rangeBackgroundFillRight} />
                  ) : null}
                  {isEnd && selectedStart ? (
                    <View style={styles.rangeBackgroundFillLeft} />
                  ) : null}

                  {/* Touchable Day Circle */}
                  <TouchableOpacity
                    onPress={() => handleDayPress(dayItem)}
                    style={[
                      styles.dayCircle,
                      isSelectedEndpoint && styles.dayCircleSelected,
                      dayItem.isToday && !isSelectedEndpoint && styles.dayCircleToday
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        isSelectedEndpoint && styles.dayNumberTextSelected,
                        dayItem.isToday && !isSelectedEndpoint && styles.dayNumberTextToday
                      ]}
                    >
                      {dayItem.dayNum}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Selected Summary Strip */}
          <View style={styles.summaryStrip}>
            <View style={styles.summaryDateItem}>
              <Text style={styles.summaryLabel}>START</Text>
              <Text style={styles.summaryDateValue}>{formatCricDate(selectedStart || today)}</Text>
            </View>

            {mode === 'range' ? (
              <>
                <View style={styles.summaryArrowWrap}>
                  <Ionicons name="arrow-forward" size={14} color="#64748B" />
                  <View style={styles.totalDaysBadge}>
                    <Text style={styles.totalDaysBadgeText}>{totalDays} {totalDays === 1 ? 'Day' : 'Days'}</Text>
                  </View>
                </View>

                <View style={[styles.summaryDateItem, { alignItems: 'flex-end' }]}>
                  <Text style={styles.summaryLabel}>END</Text>
                  <Text style={styles.summaryDateValue}>{formatCricDate(selectedEnd || selectedStart || today)}</Text>
                </View>
              </>
            ) : null}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn} activeOpacity={0.85}>
              <MaterialCommunityIcons name="calendar-check" size={16} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>Confirm Dates</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: themeColors.surface,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: themeColors.border
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  titleText: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  subtitleText: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    marginTop: 1
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: themeColors.surfaceOffWhite,
    alignItems: 'center',
    justifyContent: 'center'
  },
  presetsContainer: {
    marginBottom: 12
  },
  presetsContent: {
    gap: 6
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.border
  },
  presetChipActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B'
  },
  presetChipText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  presetChipTextActive: {
    color: '#FFFFFF'
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 6
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: themeColors.surfaceOffWhite,
    alignItems: 'center',
    justifyContent: 'center'
  },
  monthYearTitle: {
    fontSize: 14.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  dayOfWeekHeaderRow: {
    flexDirection: 'row',
    marginBottom: 6
  },
  dayOfWeekCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4
  },
  dayOfWeekText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: themeColors.textMuted
  },
  weekendHeaderText: {
    color: '#0284C7'
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    height: 36
  },
  dayCellContainer: {
    width: `${100 / 7}%`,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  rangeBackgroundFill: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 0,
    right: 0,
    backgroundColor: '#E0F2FE'
  },
  rangeBackgroundFillRight: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: '50%',
    right: 0,
    backgroundColor: '#E0F2FE'
  },
  rangeBackgroundFillLeft: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 0,
    right: '50%',
    backgroundColor: '#E0F2FE'
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  dayCircleSelected: {
    backgroundColor: '#18181B'
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: '#0284C7'
  },
  dayNumberText: {
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  },
  dayNumberTextSelected: {
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  dayNumberTextToday: {
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: themeColors.surfaceOffWhite,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: themeColors.border,
    marginBottom: 14
  },
  summaryDateItem: {
    flex: 1
  },
  summaryLabel: {
    fontSize: 9,
    fontFamily: systemFontBold,
    color: themeColors.textMuted,
    letterSpacing: 0.5
  },
  summaryDateValue: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    marginTop: 1
  },
  summaryArrowWrap: {
    alignItems: 'center',
    paddingHorizontal: 6
  },
  totalDaysBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 2
  },
  totalDaysBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: systemFontBold
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10
  },
  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: themeColors.surfaceOffWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: themeColors.border
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  confirmBtn: {
    flex: 1.6,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  confirmBtnText: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: '#FFFFFF'
  }
});
