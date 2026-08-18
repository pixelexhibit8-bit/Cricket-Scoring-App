import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { systemFont, systemFontBold, systemFontMedium, typeScale } from '../../theme.js';
import { PlayerAvatar } from '../PlayerAvatar.jsx';

const nameFitProps = {
  numberOfLines: 1,
  ellipsizeMode: 'tail',
  adjustsFontSizeToFit: true,
  minimumFontScale: 0.82
};

export function WicketPendingModal({
  visible,
  onClose,
  curInning,
  getAvailableBatsmen,
  selectNewBatsman,
  handleNewBatsman,
  newBatsmanName,
  setNewBatsmanName
}) {
  if (!visible) return null;

  const availableBatters = getAvailableBatsmen ? getAvailableBatsmen() : [];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {/* Top Header Bar */}
        <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#CBD5E1', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="cricket" size={20} color="#0284C7" />
              <Text style={{ fontSize: 16, color: '#0F172A', fontFamily: systemFontBold }}>SELECT NEXT BATTER</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#64748B', fontFamily: systemFontMedium, marginTop: 2 }}>
              {curInning?.pendingBatterEnd === 'nonStriker' ? 'Will join at non-striker end' : 'Will take strike'}
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
          {/* Card: Available Batters */}
          <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, overflow: 'hidden' }}>
            <View style={{ minHeight: 42, paddingHorizontal: 14, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 11, color: '#64748B', fontFamily: systemFontMedium }}>
                AVAILABLE PLAYERS ({availableBatters.length})
              </Text>
              <Text style={{ fontSize: 11, color: '#0284C7', fontFamily: systemFontMedium }}>TAP TO SEND IN</Text>
            </View>

            {availableBatters.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: '#64748B', fontSize: 13, fontFamily: systemFontMedium }}>No available batters left in squad.</Text>
              </View>
            ) : (
              availableBatters.map((name, idx, arr) => (
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
                  onPress={() => selectNewBatsman(name)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, paddingRight: 10 }}>
                    <PlayerAvatar name={name} size={38} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text selectable {...nameFitProps} style={{ fontSize: 14, color: '#0F172A', fontFamily: systemFontMedium }}>{name}</Text>
                      <Text style={{ fontSize: 11, color: '#64748B', fontFamily: systemFontMedium, marginTop: 1 }}>Batter #{idx + 1}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialCommunityIcons name="cricket" size={14} color="#0284C7" />
                    <Text style={{ color: '#0284C7', fontSize: 11, fontFamily: systemFontMedium }}>Select</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
