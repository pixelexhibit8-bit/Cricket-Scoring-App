import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { systemFont, fontWeights } from '../../theme.js';

export function ExtrasModal({ visible, onClose, onRecordBall }) {
  if (!visible) return null;

  const sections = [
    {
      title: 'WIDES',
      icon: 'radio-outline',
      color: '#B45309',
      bg: '#FFFBEB',
      items: [
        { label: '2 WIDES', action: () => onRecordBall(1, 'wd') },
        { label: '3 WIDES', action: () => onRecordBall(2, 'wd') },
        { label: '4 WIDES', action: () => onRecordBall(3, 'wd') },
        { label: '5 WIDES', action: () => onRecordBall(4, 'wd') }
      ]
    },
    {
      title: 'NO BALL WITH BAT RUNS',
      icon: 'alert-circle-outline',
      color: '#B45309',
      bg: '#FFFBEB',
      items: [
        { label: 'NB +1', action: () => onRecordBall(1, 'nb') },
        { label: 'NB +2', action: () => onRecordBall(2, 'nb') },
        { label: 'NB +4', action: () => onRecordBall(4, 'nb') },
        { label: 'NB +6', action: () => onRecordBall(6, 'nb') }
      ]
    },
    {
      title: 'BYES',
      icon: 'swap-horizontal-outline',
      color: '#475569',
      bg: '#F8FAFC',
      items: [1, 2, 3, 4].map(runs => ({ label: `+${runs} BYE`, action: () => onRecordBall(runs, null, false, 'b') }))
    },
    {
      title: 'LEG BYES',
      icon: 'swap-horizontal-outline',
      color: '#475569',
      bg: '#F8FAFC',
      items: [1, 2, 3, 4].map(runs => ({ label: `+${runs} LB`, action: () => onRecordBall(runs, null, false, 'lb') }))
    }
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.42)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, borderColor: '#CBD5E1', maxHeight: '82%' }}>
          <View style={{ minHeight: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="add-circle-outline" size={20} color="#0284C7" />
              <View>
                <Text style={{ color: '#0F172A', fontSize: 15, fontWeight: fontWeights.bold, fontFamily: systemFont }}>EXTRAS</Text>
                <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, marginTop: 2, fontFamily: systemFont }}>Advanced scoring inputs</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' }}>
              <Ionicons name="close" size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 22 }} showsVerticalScrollIndicator={false}>
            {sections.map(section => (
              <View key={section.title} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name={section.icon} size={15} color={section.color} />
                  <Text style={{ color: '#64748B', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{section.title}</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {section.items.map(item => (
                    <TouchableOpacity
                      key={item.label}
                      onPress={() => {
                        onClose();
                        item.action();
                      }}
                      style={{ width: '48%', minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: section.bg, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ color: section.color, fontSize: 13, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="add-circle-outline" size={15} color="#475569" />
                <Text style={{ color: '#64748B', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>PENALTY</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onRecordBall(0, null, false, 'penalty');
                }}
                style={{ minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#475569', fontSize: 13, fontWeight: fontWeights.bold, fontFamily: systemFont }}>+5 PENALTY</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
