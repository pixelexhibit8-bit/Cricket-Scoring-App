import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { systemFont, systemFontBold, systemFontMedium, typeScale, fontWeights } from '../../theme.js';
import { PlayerAvatar } from '../PlayerAvatar.jsx';

const nameFitProps = {
  numberOfLines: 1,
  ellipsizeMode: 'tail',
  adjustsFontSizeToFit: true,
  minimumFontScale: 0.82
};

export function RunOutModal({
  visible,
  onClose,
  curInning,
  runOutDismissed,
  setRunOutDismissed,
  runOutEnd,
  setRunOutEnd,
  runOutRuns,
  setRunOutRuns,
  handleConfirmRunOut
}) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={{ minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
          <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: systemFontBold }}>RUN OUT</Text>
            <Text style={{ color: '#64748B', fontSize: 11.5, fontFamily: systemFontMedium, marginTop: 2 }}>Record dismissal details</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          <View style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#CBD5E1' }}>
            <View style={{ minHeight: 42, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
              <Text style={{ color: '#64748B', fontSize: 11, fontFamily: systemFontMedium }}>SELECT BATTER OUT</Text>
            </View>
            {[
              { id: 'striker', label: 'Striker', name: curInning?.striker?.name },
              { id: 'nonStriker', label: 'Non-striker', name: curInning?.nonStriker?.name }
            ].filter(item => item.name).map((item) => {
              const selected = runOutDismissed === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setRunOutDismissed(item.id)}
                  activeOpacity={0.7}
                  style={{ minHeight: 56, paddingHorizontal: 16, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 11, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: selected ? '#FFF1F2' : '#FFFFFF' }}
                >
                  <PlayerAvatar name={item.name} size={36} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text selectable {...nameFitProps} style={{ color: '#0F172A', fontSize: 13.5, fontFamily: systemFontMedium }}>{item.name}</Text>
                    <Text style={{ color: selected ? '#E11D48' : '#64748B', fontSize: 10, fontFamily: systemFontMedium, marginTop: 2 }}>{item.label.toUpperCase()}</Text>
                  </View>
                  <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={19} color={selected ? '#E11D48' : '#CBD5E1'} />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#CBD5E1' }}>
            <View style={{ minHeight: 42, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
              <Text style={{ color: '#64748B', fontSize: 10.5, fontFamily: systemFontMedium, letterSpacing: 0.5 }}>WICKET BROKEN AT</Text>
            </View>
            {[
              { id: 'striker', label: 'Striker End' },
              { id: 'nonStriker', label: 'Non-striker End' }
            ].map((item) => {
              const selected = runOutEnd === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setRunOutEnd(item.id)}
                  style={{ minHeight: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 11, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: selected ? '#F0F9FF' : '#FFFFFF' }}
                >
                  <Ionicons name="flag-outline" size={18} color={selected ? '#0284C7' : '#64748B'} />
                  <Text style={{ flex: 1, color: '#0F172A', fontSize: 14, fontFamily: selected ? systemFontBold : systemFontMedium }}>{item.label}</Text>
                  <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={19} color={selected ? '#0284C7' : '#CBD5E1'} />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#CBD5E1' }}>
            <View style={{ minHeight: 42, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
              <Text style={{ color: '#64748B', fontSize: 10.5, fontFamily: systemFontMedium, letterSpacing: 0.5 }}>COMPLETED RUNS</Text>
            </View>
            <View style={{ minHeight: 58, flexDirection: 'row', alignItems: 'stretch' }}>
              <TouchableOpacity
                disabled={runOutRuns === 0}
                onPress={() => setRunOutRuns(value => Math.max(0, value - 1))}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: runOutRuns === 0 ? 0.35 : 1 }}
              >
                <Ionicons name="remove" size={22} color="#0F172A" />
              </TouchableOpacity>
              <View style={{ flex: 1.4, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
                <Text style={{ color: '#0F172A', fontSize: typeScale.keyAction, fontVariant: ['tabular-nums'], fontFamily: systemFontBold }}>{runOutRuns}</Text>
                <Text style={{ color: '#64748B', fontSize: 9, marginTop: 2, fontFamily: systemFontMedium }}>RUNS</Text>
              </View>
              <TouchableOpacity onPress={() => setRunOutRuns(value => value + 1)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="add" size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 14, paddingVertical: 11, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#CBD5E1' }}>
          <TouchableOpacity
            disabled={!runOutDismissed || !runOutEnd}
            onPress={handleConfirmRunOut}
            style={{
              height: 48,
              borderRadius: 6,
              backgroundColor: runOutDismissed && runOutEnd ? '#E11D48' : '#94A3B8',
              flexDirection: 'row',
              alignItems: 'center',
              justify: 'center',
              gap: 8
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={17} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: systemFontBold }}>CONFIRM RUN OUT</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
