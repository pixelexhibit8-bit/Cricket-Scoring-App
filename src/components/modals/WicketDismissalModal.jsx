import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { systemFont, systemFontBold, systemFontMedium, fontWeights } from '../../theme.js';
import { PlayerAvatar } from '../PlayerAvatar.jsx';

const nameFitProps = {
  numberOfLines: 1,
  ellipsizeMode: 'tail',
  adjustsFontSizeToFit: true,
  minimumFontScale: 0.82
};

export const WICKET_TYPES = [
  { id: 'bowled', label: 'Bowled', icon: 'radio-button-on' },
  { id: 'caught', label: 'Caught', icon: 'hand-left-outline' },
  { id: 'lbw', label: 'LBW', icon: 'body-outline' },
  { id: 'runOut', label: 'Run Out', icon: 'swap-horizontal-outline' },
  { id: 'stumped', label: 'Stumped', icon: 'flash-outline' },
  { id: 'hitWicket', label: 'Hit Wicket', icon: 'alert-circle-outline' }
];

export const WicketDismissalModal = ({
  visible,
  onRequestClose,
  pendingFielderDismissal,
  setPendingFielderDismissal,
  cancelWicketEntry,
  curInning,
  getBowlingRoster,
  handleSelectDismissalFielder,
  handleSelectWicketType,
  wicketTypes = WICKET_TYPES
}) => {
  const bowlingRoster = typeof getBowlingRoster === 'function' ? getBowlingRoster() : [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onRequestClose || (() => pendingFielderDismissal ? setPendingFielderDismissal('') : cancelWicketEntry && cancelWicketEntry())}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {/* Header */}
        <View style={{ minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
          <TouchableOpacity
            onPress={() => pendingFielderDismissal ? setPendingFielderDismissal('') : cancelWicketEntry && cancelWicketEntry()}
            style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name={pendingFielderDismissal ? 'arrow-back' : 'close'} size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#0F172A', fontSize: 15, fontFamily: systemFontBold }}>
              {pendingFielderDismissal === 'caught'
                ? 'WHO TOOK THE CATCH?'
                : pendingFielderDismissal === 'stumped'
                  ? 'WHO COMPLETED THE STUMPING?'
                  : 'HOW WAS THE BATTER OUT?'}
            </Text>
            <Text style={{ color: '#64748B', fontSize: 11.5, fontFamily: systemFontMedium, marginTop: 2 }} numberOfLines={1}>
              {pendingFielderDismissal
                ? `${curInning?.bowlingTeam?.name || 'Bowling team'} fielders`
                : curInning?.striker?.name || 'Striker'}
            </Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          {pendingFielderDismissal ? (
            <View style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#CBD5E1' }}>
              <View style={{ minHeight: 42, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
                <Text style={{ color: '#64748B', fontSize: 11, fontFamily: systemFontMedium }}>
                  {pendingFielderDismissal === 'caught' ? 'SELECT FIELDER' : 'SELECT WICKETKEEPER / FIELDER'}
                </Text>
              </View>
              {bowlingRoster.map((name, index) => (
                <TouchableOpacity
                  key={name}
                  onPress={() => handleSelectDismissalFielder && handleSelectDismissalFielder(name)}
                  activeOpacity={0.7}
                  style={{ minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 11, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}
                >
                  <Text style={{ width: 22, color: '#94A3B8', fontSize: 11, fontFamily: systemFontMedium, fontVariant: ['tabular-nums'] }}>{index + 1}</Text>
                  <PlayerAvatar name={name} size={36} />
                  <Text selectable {...nameFitProps} style={{ flex: 1, minWidth: 0, color: '#0F172A', fontSize: 13.5, fontFamily: systemFontMedium }}>{name}</Text>
                  {name === curInning?.bowler?.name ? (
                    <Text style={{ color: '#0284C7', fontSize: 10, fontFamily: systemFontMedium }}>BOWLER</Text>
                  ) : null}
                  <Ionicons name="chevron-forward" size={17} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#CBD5E1' }}>
              <View style={{ minHeight: 42, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
                <Text style={{ color: '#64748B', fontSize: 11, fontFamily: systemFontMedium }}>SELECT DISMISSAL TYPE</Text>
              </View>
              {wicketTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => handleSelectWicketType && handleSelectWicketType(type.id)}
                  activeOpacity={0.7}
                  style={{ minHeight: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}
                >
                  <Ionicons name={type.icon} size={19} color={type.id === 'runOut' ? '#E11D48' : '#475569'} />
                  <Text style={{ flex: 1, color: '#0F172A', fontSize: 13.5, fontFamily: systemFontMedium }}>{type.label}</Text>
                  <Ionicons name="chevron-forward" size={17} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default WicketDismissalModal;
