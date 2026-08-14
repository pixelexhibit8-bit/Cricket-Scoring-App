import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { systemFont, systemFontBold, systemFontMedium, fontWeights } from '../theme';

export const MatchInfoPanel = ({ rows = [], teamOneName, teamTwoName, playerCount, onOpenPlayingXi }) => (
  <View style={{ gap: 14 }}>
    <View style={{ backgroundColor: '#F4F7FA', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
      <View style={{ minHeight: 46, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <Ionicons name="information-circle-outline" size={18} color="#0284C7" />
        <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontBold }}>MATCH INFORMATION</Text>
      </View>
      {rows.filter(item => item?.value).map((item, index) => (
        <View key={item.label} style={{ minHeight: 52, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: index > 0 ? 1 : 0, borderTopColor: '#F1F5F9' }}>
          <Ionicons name={item.icon} size={17} color="#64748B" />
          <View style={{ width: 86 }}>
            <Text style={{ color: '#64748B', fontSize: 11, fontFamily: systemFontBold }}>{item.label.toUpperCase()}</Text>
          </View>
          <Text
            selectable
            style={{ flex: 1, color: item.accent ? '#0284C7' : '#0F172A', fontSize: 12, lineHeight: 17, textAlign: 'right', fontFamily: item.emphasis ? systemFontBold : systemFontMedium }}
            numberOfLines={2}
          >
            {item.value}
          </Text>
        </View>
      ))}
    </View>

    {onOpenPlayingXi ? (
      <TouchableOpacity
        activeOpacity={0.72}
        onPress={onOpenPlayingXi}
        style={{ minHeight: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F4F7FA', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' }}
      >
        <MaterialCommunityIcons name="account-group" size={21} color="#0284C7" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontBold }}>PLAYING XI</Text>
          <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2, fontFamily: systemFontMedium }} numberOfLines={1}>
            {teamOneName} and {teamTwoName}
          </Text>
        </View>
        <Text style={{ color: '#64748B', fontSize: 11, fontFamily: systemFontBold }}>{playerCount} PLAYERS</Text>
        <Ionicons name="chevron-forward" size={18} color="#64748B" />
      </TouchableOpacity>
    ) : null}
  </View>
);

export default MatchInfoPanel;
