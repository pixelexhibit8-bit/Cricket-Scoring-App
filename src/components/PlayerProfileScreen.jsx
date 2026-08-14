import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { systemFontBold, systemFontMedium } from '../theme.js';

export function PlayerProfileScreen({ userProfile, onEditProfile }) {
  const profile = userProfile || {
    name: 'Bastiram Choudhary',
    role: 'All-Rounder',
    city: 'Nagaur',
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

  const stats = profile.stats || {};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ backgroundColor: '#071B2C', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#123A56' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: systemFontBold }}>Player Profile</Text>
        <TouchableOpacity onPress={onEditProfile}>
          <Ionicons name="create-outline" size={20} color="#38BDF8" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 14 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: '#071B2C', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#123A56', gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Image source={{ uri: profile.avatar }} style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#0284C7' }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: systemFontBold }} numberOfLines={1}>
                {profile.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <View style={{ backgroundColor: '#0284C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontFamily: systemFontBold }}>{profile.role}</Text>
                </View>
                <Text style={{ color: '#9FC4D7', fontSize: 12, fontFamily: systemFontMedium }}>📍 {profile.city || 'Nagaur'}</Text>
              </View>
            </View>

            <View style={{ backgroundColor: '#1E4D6B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ color: '#F59E0B', fontSize: 14, fontFamily: systemFontBold }}>🏆 {stats.mvpPoints || 420}</Text>
              <Text style={{ color: '#9FC4D7', fontSize: 9, fontFamily: systemFontMedium }}>MVP PTS</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', backgroundColor: '#0F2942', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8, justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#9FC4D7', fontSize: 10, fontFamily: systemFontMedium }}>MATCHES</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: systemFontBold }}>{stats.matches || 0}</Text>
            </View>
            <View style={{ width: 1, height: 26, backgroundColor: '#1E4D6B' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#9FC4D7', fontSize: 10, fontFamily: systemFontMedium }}>RUNS</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: systemFontBold }}>{stats.runs || 0}</Text>
            </View>
            <View style={{ width: 1, height: 26, backgroundColor: '#1E4D6B' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#9FC4D7', fontSize: 10, fontFamily: systemFontMedium }}>WICKETS</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: systemFontBold }}>{stats.wickets || 0}</Text>
            </View>
            <View style={{ width: 1, height: 26, backgroundColor: '#1E4D6B' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#9FC4D7', fontSize: 10, fontFamily: systemFontMedium }}>AVG</Text>
              <Text style={{ color: '#38BDF8', fontSize: 16, fontFamily: systemFontBold }}>{stats.avg || 0}</Text>
            </View>
          </View>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 }}>
          <Text style={{ fontSize: 14, color: '#0F172A', fontFamily: systemFontBold }}>BATTING PERFORMANCE</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 }}>
            <Text style={{ color: '#64748B', fontSize: 12, fontFamily: systemFontMedium }}>Strike Rate (SR)</Text>
            <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontBold }}>{stats.sr || 0}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 }}>
            <Text style={{ color: '#64748B', fontSize: 12, fontFamily: systemFontMedium }}>Highest Score (HS)</Text>
            <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontBold }}>{stats.highestScore || '0'}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 4 }}>
            <Text style={{ color: '#64748B', fontSize: 12, fontFamily: systemFontMedium }}>50s / 100s</Text>
            <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontBold }}>{stats.fifties || 0} / {stats.hundreds || 0}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 }}>
          <Text style={{ fontSize: 14, color: '#0F172A', fontFamily: systemFontBold }}>BOWLING PERFORMANCE</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 }}>
            <Text style={{ color: '#64748B', fontSize: 12, fontFamily: systemFontMedium }}>Economy Rate</Text>
            <Text style={{ color: '#059669', fontSize: 13, fontFamily: systemFontBold }}>{stats.economy || 0}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 4 }}>
            <Text style={{ color: '#64748B', fontSize: 12, fontFamily: systemFontMedium }}>Best Bowling</Text>
            <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontBold }}>3/18</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default PlayerProfileScreen;
