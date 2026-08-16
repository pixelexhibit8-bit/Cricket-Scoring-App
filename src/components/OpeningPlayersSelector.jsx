import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { systemFont, systemFontBold, systemFontMedium, fontWeights } from '../theme.js';
import { TeamIdentityMark } from './TeamIdentityMark.jsx';

/**
 * Reusable Opening Players Selector Primitive
 * Shared across 1st Innings Match Setup (Step 3) and 2nd Innings Break.
 */
export function OpeningPlayersSelector({
  battingTeamName = 'Batting Team',
  bowlingTeamName = 'Bowling Team',
  battingLogoKey,
  bowlingLogoKey,
  battingRoster = [],
  bowlingRoster = [],
  striker = '',
  nonStriker = '',
  bowler = '',
  onSelectBatter,
  onSelectBowler,
  renderPlayerPhoto,
  bannerNotice = '',
  ctaText = 'START MATCH',
  onStart,
  onBack,
  headerTitle = 'OPENING PLAYERS'
}) {
  const selectedOpening = [
    { label: 'Striker', name: striker, color: '#0284C7' },
    { label: 'Non-striker', name: nonStriker, color: '#0284C7' },
    { label: 'Bowler', name: bowler, color: '#E11D48' }
  ];

  const renderOpeningRow = ({ name, active, accent, iconName, roleLabel, onPress }) => (
    <TouchableOpacity
      key={name}
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        minHeight: 46,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: active ? (accent === '#E11D48' ? '#FFF1F2' : '#F0F9FF') : '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        {renderPlayerPhoto ? renderPlayerPhoto(name, 32) : (
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person" size={16} color="#64748B" />
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontMedium }} numberOfLines={1}>
            {name}
          </Text>
          {roleLabel ? (
            <Text style={{ color: accent, fontSize: 9.5, fontFamily: systemFontMedium, marginTop: 1 }}>
              {roleLabel}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: active ? accent : '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <MaterialCommunityIcons name={iconName} size={15} color={active ? '#FFFFFF' : '#94A3B8'} />
      </View>
    </TouchableOpacity>
  );

  const isReady = Boolean(striker && nonStriker && bowler && striker !== nonStriker);

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* SUMMARY CARD (STRIKER | NON-STRIKER | BOWLER 3 COLUMNS) */}
        <View style={styles.cardBox}>
          <View style={{ minHeight: 46, paddingHorizontal: 14, backgroundColor: '#F0F9FF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#0369A1', fontSize: 12, fontFamily: systemFontBold }}>{headerTitle}</Text>
            <Text style={{ color: '#64748B', fontSize: 11, fontFamily: systemFontMedium }} numberOfLines={1}>{battingTeamName} batting</Text>
          </View>

          {bannerNotice ? (
            <View style={{ paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#FFFBEB', borderBottomWidth: 1, borderBottomColor: '#FDE68A', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="flag-outline" size={15} color="#B45309" />
              <Text style={{ flex: 1, color: '#92400E', fontSize: 12, fontFamily: systemFontMedium }} numberOfLines={1}>
                {bannerNotice}
              </Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row' }}>
            {selectedOpening.map((item, index) => (
              <View key={item.label} style={{ flex: 1, minHeight: 62, padding: 9, borderRightWidth: index < selectedOpening.length - 1 ? 1 : 0, borderRightColor: '#E2E8F0', justifyContent: 'center' }}>
                <Text style={{ color: '#94A3B8', fontSize: 9.5, fontFamily: systemFontMedium }}>{item.label.toUpperCase()}</Text>
                <Text style={{ color: item.name ? item.color : '#64748B', fontSize: 12, fontFamily: systemFontMedium, marginTop: 4 }} numberOfLines={1}>
                  {item.name || 'Select'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* OPENING BATTERS SELECTION */}
        <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, overflow: 'hidden' }}>
          <View style={{ minHeight: 42, paddingHorizontal: 12, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <MaterialCommunityIcons name="cricket" size={16} color="#0284C7" />
              <Text style={{ color: '#0F172A', fontSize: 12, fontFamily: systemFontMedium }} numberOfLines={1}>
                OPENING BATTERS ({battingTeamName})
              </Text>
            </View>
            <Text style={{ color: '#0284C7', fontSize: 11, fontFamily: systemFontMedium }}>
              {[striker, nonStriker].filter(Boolean).length}/2 Selected
            </Text>
          </View>

          {battingRoster.map(name => {
            const isStriker = striker === name;
            const isNonStriker = nonStriker === name;
            const active = isStriker || isNonStriker;
            const roleLabel = isStriker ? 'STRIKER' : isNonStriker ? 'NON-STRIKER' : '';

            return renderOpeningRow({
              name,
              active,
              accent: '#0284C7',
              iconName: 'cricket',
              roleLabel,
              onPress: () => onSelectBatter && onSelectBatter(name)
            });
          })}
        </View>

        {/* OPENING BOWLER SELECTION */}
        <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, overflow: 'hidden' }}>
          <View style={{ minHeight: 42, paddingHorizontal: 12, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <MaterialCommunityIcons name="baseball" size={16} color="#E11D48" />
              <Text style={{ color: '#0F172A', fontSize: 12, fontFamily: systemFontMedium }} numberOfLines={1}>
                OPENING BOWLER ({bowlingTeamName})
              </Text>
            </View>
            {bowler ? (
              <Text style={{ color: '#15803D', fontSize: 11, fontFamily: systemFontMedium }}>1 Selected</Text>
            ) : null}
          </View>

          {bowlingRoster.map(name => {
            const active = bowler === name;

            return renderOpeningRow({
              name,
              active,
              accent: '#E11D48',
              iconName: 'baseball',
              roleLabel: active ? 'OPENING BOWLER' : '',
              onPress: () => onSelectBowler && onSelectBowler(active ? '' : name)
            });
          })}
        </View>
      </ScrollView>

      {/* BOTTOM ACTION FOOTER */}
      <View style={[styles.footerBar, { flexDirection: 'row', gap: 10 }]}>
        {onBack ? (
          <TouchableOpacity
            style={{ flex: 0.3, height: 48, borderRadius: 8, backgroundColor: '#475569', alignItems: 'center', justifyContent: 'center' }}
            onPress={onBack}
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          disabled={!isReady}
          style={[styles.primaryBtn, { flex: 1, backgroundColor: isReady ? '#0284C7' : '#94A3B8' }]}
          onPress={onStart}
        >
          <MaterialCommunityIcons name="cricket" size={18} color="#FFFFFF" />
          <Text style={styles.btnText}>{ctaText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  cardBox: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#CBD5E1', overflow: 'hidden' },
  footerBar: { padding: 14, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#CBD5E1' },
  primaryBtn: { height: 48, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontSize: 13, color: '#FFFFFF', fontFamily: systemFontBold }
});
