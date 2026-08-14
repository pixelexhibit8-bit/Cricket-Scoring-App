import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { systemFont, systemFontMedium, systemFontBold } from '../theme';

export function MatchSelectionScreen({
  onSelectIndividual,
  onSelectTournament,
  onCancel
}) {
  const [selectedType, setSelectedType] = useState('individual'); // 'individual' | 'series'

  const handleContinue = () => {
    if (selectedType === 'individual' && typeof onSelectIndividual === 'function') {
      onSelectIndividual();
    } else if (selectedType === 'series' && typeof onSelectTournament === 'function') {
      onSelectTournament();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#071B2C" />

      {/* CricFlow Dark Hero Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Start a Match</Text>
          <Text style={styles.headerSubTitle}>Choose format to continue setup</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeader}>MATCH FORMAT</Text>

        {/* Option 1: Individual Match */}
        <TouchableOpacity
          style={[
            styles.matchCard,
            selectedType === 'individual' && styles.matchCardActive
          ]}
          activeOpacity={0.88}
          onPress={() => setSelectedType('individual')}
        >
          <View style={styles.cardMainRow}>
            <View style={[styles.iconBox, selectedType === 'individual' ? styles.iconBoxActive : styles.iconBoxInactive]}>
              <MaterialCommunityIcons 
                name="cricket" 
                size={26} 
                color={selectedType === 'individual' ? '#0284C7' : '#64748B'} 
              />
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>Individual Match</Text>
                <View style={styles.singleTag}>
                  <Text style={styles.singleTagText}>1 MATCH</Text>
                </View>
              </View>
              <Text style={styles.cardSubText}>Friendly, Club or Box Cricket match</Text>
            </View>

            <View style={[styles.checkCircle, selectedType === 'individual' && styles.checkCircleActive]}>
              {selectedType === 'individual' && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
          </View>

          {/* Quick Feature Pills */}
          <View style={styles.pillsRow}>
            <View style={styles.pill}>
              <Ionicons name="flash-outline" size={12} color="#0284C7" />
              <Text style={styles.pillText}>Instant Setup</Text>
            </View>
            <View style={styles.pill}>
              <Ionicons name="people-outline" size={12} color="#64748B" />
              <Text style={styles.pillText}>2 Teams</Text>
            </View>
            <View style={styles.pill}>
              <MaterialCommunityIcons name="scoreboard-outline" size={12} color="#64748B" />
              <Text style={styles.pillText}>Ball-by-Ball</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Option 2: Series Match (Bilateral Series) */}
        <TouchableOpacity
          style={[
            styles.matchCard,
            selectedType === 'series' && styles.matchCardActive
          ]}
          activeOpacity={0.88}
          onPress={() => setSelectedType('series')}
        >
          <View style={styles.cardMainRow}>
            <View style={[styles.iconBox, selectedType === 'series' ? styles.iconBoxAmberActive : styles.iconBoxInactive]}>
              <MaterialCommunityIcons 
                name="trophy-variant" 
                size={26} 
                color={selectedType === 'series' ? '#D97706' : '#64748B'} 
              />
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>Series Match</Text>
                <View style={styles.seriesTag}>
                  <Text style={styles.seriesTagText}>BILATERAL</Text>
                </View>
              </View>
              <Text style={styles.cardSubText}>2 to 5 matches between same 2 teams</Text>
            </View>

            <View style={[styles.checkCircle, selectedType === 'series' && styles.checkCircleActiveAmber]}>
              {selectedType === 'series' && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
          </View>

          {/* Quick Feature Pills */}
          <View style={styles.pillsRow}>
            <View style={styles.pillAmber}>
              <Ionicons name="stats-chart-outline" size={12} color="#D97706" />
              <Text style={styles.pillAmberText}>Series Tally (2-1)</Text>
            </View>
            <View style={styles.pillAmber}>
              <Ionicons name="people-outline" size={12} color="#D97706" />
              <Text style={styles.pillAmberText}>Same Roster</Text>
            </View>
            <View style={styles.pill}>
              <Ionicons name="repeat-outline" size={12} color="#64748B" />
              <Text style={styles.pillText}>Multi-Game</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Action Footer */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBarWrapper}>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.continueBtn}
            activeOpacity={0.85}
            onPress={handleContinue}
          >
            <Text style={styles.continueBtnText}>
              {selectedType === 'individual' ? 'Continue Setup' : 'Create / Select Series'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#071B2C',
    borderBottomWidth: 1,
    borderBottomColor: '#123A56'
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  headerTitle: {
    fontSize: 17,
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  headerSubTitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: systemFontMedium,
    marginTop: 1
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    gap: 14
  },
  sectionHeader: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: systemFontBold,
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 2
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 14,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6
  },
  matchCardActive: {
    borderColor: '#0284C7',
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.12,
    shadowRadius: 10
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconBoxInactive: {
    backgroundColor: '#F1F5F9'
  },
  iconBoxActive: {
    backgroundColor: '#E0F2FE'
  },
  iconBoxAmberActive: {
    backgroundColor: '#FEF3C7'
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  cardTitle: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  cardSubText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: systemFontMedium,
    marginTop: 2
  },
  singleTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6
  },
  singleTagText: {
    fontSize: 10,
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  seriesTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6
  },
  seriesTagText: {
    fontSize: 10,
    color: '#B45309',
    fontFamily: systemFontBold
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkCircleActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  checkCircleActiveAmber: {
    backgroundColor: '#D97706',
    borderColor: '#D97706'
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  pillText: {
    fontSize: 11,
    color: '#475569',
    fontFamily: systemFontMedium
  },
  pillAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  pillAmberText: {
    fontSize: 11,
    color: '#B45309',
    fontFamily: systemFontMedium
  },
  bottomBarWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  bottomBar: {
    padding: 16
  },
  continueBtn: {
    height: 50,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 8
  },
  continueBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: systemFontBold
  }
});

