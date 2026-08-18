import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { systemFont, systemFontBold, systemFontMedium, typeScale } from '../../theme.js';
import { PlayerAvatar } from '../PlayerAvatar.jsx';
import { getBowlerFigureFromInning } from '../../utils/cricketUtils.js';
import { capitalizeWords } from '../../utils/textUtils.js';

const nameFitProps = {
  numberOfLines: 1,
  ellipsizeMode: 'tail',
  adjustsFontSizeToFit: true,
  minimumFontScale: 0.82
};

export function BowlerChangeModal({
  visible,
  onClose,
  activeMatch,
  setActiveMatch,
  curInning,
  getAvailableBowlers,
  nextBowlerName,
  setNextBowlerName,
  handleNewBowler
}) {
  if (!visible) return null;

  const availableBowlers = getAvailableBowlers ? getAvailableBowlers() : [];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {/* Top Header Bar */}
        <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#CBD5E1', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="baseball" size={20} color="#E11D48" />
              <Text style={{ fontSize: 16, color: '#0F172A', fontFamily: systemFontBold }}>SELECT NEXT BOWLER</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#64748B', fontFamily: systemFontMedium, marginTop: 2 }}>
              Choose who bowls the upcoming over
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="close" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 12 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Card: Available Bowlers */}
          <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, overflow: 'hidden' }}>
            <View style={{ minHeight: 42, paddingHorizontal: 14, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 11, color: '#64748B', fontFamily: systemFontMedium }}>
                AVAILABLE BOWLERS ({availableBowlers.length})
              </Text>
              <Text style={{ fontSize: 11, color: '#E11D48', fontFamily: systemFontMedium }}>TAP TO BOWL</Text>
            </View>

            {availableBowlers.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: '#64748B', fontSize: 13, fontFamily: systemFontMedium }}>No available bowlers found in roster.</Text>
              </View>
            ) : (
              availableBowlers.map((name, idx, arr) => {
                const existingFigures = curInning?.bowlingStats?.[name];
                const figuresText = existingFigures ? `${existingFigures.overs || '0.0'} ov • ${existingFigures.wickets || 0}w • ${existingFigures.runs || 0}r` : 'Yet to bowl';

                return (
                  <TouchableOpacity
                    key={name}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      minHeight: 56,
                      borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                      borderBottomColor: '#F1F5F9',
                      backgroundColor: '#FFFFFF'
                    }}
                    onPress={() => {
                      if ((curInning?.currentOverBalls || []).length > 0 && !curInning?.isOverComplete) {
                        Alert.alert('Change Bowler', 'Normal bowler change is allowed only after the over is complete.');
                        return;
                      }
                      setActiveMatch(prev => {
                        const innings = prev.innings.map(x => ({ ...x }));
                        const inn = { ...innings[prev.inning - 1] };
                        if ((inn.currentOverBalls || []).length > 0 && !inn.isOverComplete) {
                          Alert.alert('Change Bowler', 'Normal bowler change is allowed only after the over is complete.');
                          return prev;
                        }
                        const savedBowlerFigure = getBowlerFigureFromInning(inn, name);
                        inn.bowlingStats = { ...(inn.bowlingStats || {}), [name]: savedBowlerFigure };
                        inn.bowler = {
                          name,
                          runs: savedBowlerFigure.runs,
                          wickets: savedBowlerFigure.wickets,
                          overs: savedBowlerFigure.overs
                        };
                        inn.bowlerLegalBalls = savedBowlerFigure.balls;
                        innings[prev.inning - 1] = inn;
                        return { ...prev, innings };
                      });
                      setNextBowlerName('');
                      onClose();
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, paddingRight: 10 }}>
                      <PlayerAvatar name={name} size={38} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text selectable {...nameFitProps} style={{ fontSize: 14, color: '#0F172A', fontFamily: systemFontMedium }}>{name}</Text>
                        <Text style={{ fontSize: 11, color: '#64748B', fontFamily: systemFontMedium, marginTop: 1 }}>{figuresText}</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECDD3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MaterialCommunityIcons name="baseball" size={14} color="#E11D48" />
                      <Text style={{ color: '#E11D48', fontSize: 11, fontFamily: systemFontMedium }}>Select</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Add New Bowler On-The-Fly */}
          <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="person-add-outline" size={16} color="#E11D48" />
              <Text style={{ fontSize: 12, color: '#0F172A', fontFamily: systemFontBold }}>ADD NEW BOWLER MID-MATCH</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#CBD5E1',
                  paddingHorizontal: 12,
                  backgroundColor: '#F8FAFC',
                  fontSize: 13,
                  color: '#0F172A',
                  fontFamily: systemFontMedium
                }}
                placeholder="Type new bowler name..."
                placeholderTextColor="#94A3B8"
                value={nextBowlerName}
                onChangeText={(t) => setNextBowlerName(capitalizeWords(t))}
                autoCapitalize="words"
              />
              <TouchableOpacity
                disabled={!nextBowlerName.trim()}
                style={{
                  backgroundColor: nextBowlerName.trim() ? '#E11D48' : '#94A3B8',
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={() => handleNewBowler && handleNewBowler(capitalizeWords(nextBowlerName.trim()))}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: systemFontBold }}>Add & Select</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
