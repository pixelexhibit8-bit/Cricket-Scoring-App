import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { systemFontBold, systemFontMedium } from '../theme.js';

export function AuthScreen({ onSaveProfile, onClose }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('All-Rounder');
  const [city, setCity] = useState('Nagaur');

  const roles = [
    { id: 'Batter', label: 'Batter', icon: 'baseball-outline' },
    { id: 'Bowler', label: 'Bowler', icon: 'tennisball-outline' },
    { id: 'All-Rounder', label: 'All-Rounder', icon: 'trophy-outline' },
    { id: 'Wicket Keeper', label: 'Wicket Keeper', icon: 'hand-left-outline' }
  ];

  const handleSave = () => {
    if (!name.trim()) return;

    const profile = {
      id: `player-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || '9876543210',
      role,
      city: city.trim() || 'Nagaur',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      stats: {
        matches: 12,
        innings: 10,
        runs: 348,
        highestScore: '78*',
        avg: 38.6,
        sr: 142.5,
        wickets: 14,
        economy: 6.4,
        fifties: 3,
        hundreds: 0,
        mvpPoints: 420
      }
    };

    if (onSaveProfile) onSaveProfile(profile);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, color: '#0F172A', fontFamily: systemFontBold }}>Player Login & Profile</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: '#071B2C', borderRadius: 16, padding: 18, alignItems: 'center', gap: 8 }}>
          <Ionicons name="person-circle-outline" size={48} color="#38BDF8" />
          <Text style={{ fontSize: 18, color: '#FFFFFF', textAlign: 'center', fontFamily: systemFontBold }}>Create Player Profile</Text>
          <Text style={{ fontSize: 12, color: '#9FC4D7', textAlign: 'center', fontFamily: systemFontMedium }}>
            Track career stats, MVP points, and tournament leaderboards
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontFamily: systemFontBold }}>FULL NAME *</Text>
            <TextInput
              style={{ height: 46, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 12, fontSize: 14, color: '#0F172A', fontFamily: systemFontMedium }}
              placeholder="e.g. Bastiram Choudhary"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View>
            <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontFamily: systemFontBold }}>PHONE NUMBER</Text>
            <TextInput
              style={{ height: 46, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 12, fontSize: 14, color: '#0F172A', fontFamily: systemFontMedium }}
              placeholder="10-digit mobile number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View>
            <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 6, fontFamily: systemFontBold }}>PRIMARY ROLE</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {roles.map(r => {
                const isSelected = role === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => setRole(r.id)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
                      borderWidth: 1, borderColor: isSelected ? '#0284C7' : '#E2E8F0',
                      backgroundColor: isSelected ? '#F0F9FF' : '#FFFFFF'
                    }}
                  >
                    <Ionicons name={r.icon} size={14} color={isSelected ? '#0284C7' : '#64748B'} />
                    <Text style={{ fontSize: 12, color: isSelected ? '#0284C7' : '#475569', fontFamily: isSelected ? systemFontBold : systemFontMedium }}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View>
            <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontFamily: systemFontBold }}>CITY / DISTRICT</Text>
            <TextInput
              style={{ height: 46, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 12, fontSize: 14, color: '#0F172A', fontFamily: systemFontMedium }}
              placeholder="e.g. Nagaur, Rajasthan"
              placeholderTextColor="#94A3B8"
              value={city}
              onChangeText={setCity}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!name.trim()}
          style={{
            height: 48, borderRadius: 12, backgroundColor: name.trim() ? '#0284C7' : '#94A3B8',
            alignItems: 'center', justifyContent: 'center', marginTop: 10
          }}
        >
          <Text style={{ fontSize: 15, color: '#FFFFFF', fontFamily: systemFontBold }}>Save Profile & Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default AuthScreen;
