import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { systemFont, typeScale, fontWeights } from '../../theme.js';
import { MASTER_PLAYERS_DB } from '../../../mockData.js';

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

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {/* Top Navigation Bar */}
        <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: typeScale.pageTitle, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>SELECT NEW BATTER</Text>
            <Text style={{ fontSize: 12, color: '#64748B', fontWeight: fontWeights.medium, marginTop: 2, fontFamily: systemFont }}>
              {curInning?.pendingBatterEnd === 'nonStriker' ? 'Will join at non-striker end' : 'Will take strike'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' }}
          >
            <Ionicons name="close" size={16} color="#0F172A" />
            <Text style={{ color: '#0F172A', fontWeight: fontWeights.bold, fontSize: 12, fontFamily: systemFont }}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
          {/* Squad Header Pill */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: fontWeights.bold, color: '#64748B', letterSpacing: 0.5, fontFamily: systemFont }}>PLAYING SQUAD</Text>
            <Text style={{ fontSize: 11, fontWeight: fontWeights.semibold, color: '#94A3B8', fontFamily: systemFont }}>TAP TO SEND IN</Text>
          </View>

          {/* Full Squad Minimal Player Cards List */}
          <View style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
            {getAvailableBatsmen().map((name, idx, arr) => {
              const playerObj = MASTER_PLAYERS_DB.find(p => p.name === name);
              const avatar = playerObj?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';

              return (
                <TouchableOpacity
                  key={name}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14,
                    borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: '#E2E8F0',
                    backgroundColor: '#FFFFFF'
                  }}
                  onPress={() => selectNewBatsman(name)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, paddingRight: 10 }}>
                    <Image source={{ uri: avatar }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9' }} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text selectable {...nameFitProps} style={{ fontSize: 16, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>{name}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: '#0F172A', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: fontWeights.bold, fontFamily: systemFont }}>Select</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Or Add Custom Player */}
          <View style={{ gap: 6, marginTop: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: fontWeights.bold, color: '#64748B', fontFamily: systemFont }}>ADD NEW PLAYER</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#CBD5E1',
                  paddingHorizontal: 14,
                  backgroundColor: '#FFFFFF',
                  fontSize: 14,
                  color: '#0F172A',
                  fontFamily: systemFont
                }}
                placeholder="Type new player name..."
                placeholderTextColor="#94A3B8"
                value={newBatsmanName}
                onChangeText={setNewBatsmanName}
              />
              <TouchableOpacity
                style={{ backgroundColor: newBatsmanName.trim() ? '#0F172A' : '#94A3B8', paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}
                onPress={handleNewBatsman}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: fontWeights.bold, fontSize: 13, fontFamily: systemFont }}>Add & Select</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
