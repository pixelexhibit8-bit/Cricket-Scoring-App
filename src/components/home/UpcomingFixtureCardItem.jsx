import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { TeamIdentityMark } from '../TeamIdentityMark.jsx';
import { systemFont, systemFontMedium, systemFontBold } from '../../theme.js';
import { ScalePressable, FadeSlideIn } from '../motion/MotionSystem.jsx';

export const UpcomingFixtureCardItem = React.memo(function UpcomingFixtureCardItem({
  fixture,
  onPress,
  onScorePress,
  delay = 0
}) {
  if (!fixture) return null;

  const t1Name = fixture.team1?.name || fixture.team1Name || fixture.teams?.[0]?.name || 'Team 1';
  const t2Name = fixture.team2?.name || fixture.team2Name || fixture.teams?.[1]?.name || 'Team 2';
  const tourName = fixture.tournamentName || fixture.tournamentTitle || fixture.seriesName || 'Tournament';
  const stage = fixture.stage || 'LEAGUE';
  const venue = fixture.venue || 'Sadokan Ground';
  const overs = fixture.overs || fixture.totalOvers || fixture.maxOvers || 5;
  const matchDate = fixture.dateText || fixture.matchDate || 'Upcoming';
  const time = fixture.time || '10:00 AM';

  return (
    <FadeSlideIn delay={delay} distance={8}>
      <ScalePressable
        activeScale={0.98}
        onPress={onPress}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: '#EEEEF0',
          marginBottom: 10,
          gap: 12
        }}
      >
        {/* Card Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 }}>
            <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ fontSize: 10.5, color: '#475569', fontFamily: systemFontMedium, textTransform: 'uppercase' }} numberOfLines={1}>
                {stage}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#94A3B8', fontFamily: systemFontMedium, flex: 1 }} numberOfLines={1}>
              {tourName} • {overs} Ov
            </Text>
          </View>
          <Text style={{ fontSize: 11.5, color: '#0284C7', fontFamily: systemFontMedium }}>
            {matchDate}
          </Text>
        </View>

        {/* Teams Matchup Section */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: 12 }}>
            {/* Team 1 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TeamIdentityMark team={fixture.team1 || { name: t1Name }} size={26} />
              <Text style={{ fontSize: 15.5, color: '#0F172A', fontFamily: systemFontMedium, flex: 1 }} numberOfLines={1}>
                {t1Name}
              </Text>
            </View>

            {/* Team 2 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TeamIdentityMark team={fixture.team2 || { name: t2Name }} size={26} />
              <Text style={{ fontSize: 15.5, color: '#0F172A', fontFamily: systemFontMedium, flex: 1 }} numberOfLines={1}>
                {t2Name}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={{ width: 1, height: 50, backgroundColor: '#F1F5F9', marginHorizontal: 14 }} />

          {/* Right Action / Time Column */}
          <View style={{ minWidth: 90, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Text style={{ fontSize: 13, fontFamily: systemFontMedium, color: '#64748B' }}>
              {time}
            </Text>
            {onScorePress ? (
              <TouchableOpacity
                onPress={() => onScorePress(fixture)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#0284C7',
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <MaterialCommunityIcons name="cricket" size={13} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: systemFontMedium }}>
                  SCORE
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Footer Ground Info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#F8FAFC' }}>
          <Ionicons name="location-outline" size={13} color="#94A3B8" />
          <Text style={{ fontSize: 11.5, color: '#94A3B8', fontFamily: systemFont }} numberOfLines={1}>
            {venue}
          </Text>
        </View>
      </ScalePressable>
    </FadeSlideIn>
  );
});

export default UpcomingFixtureCardItem;
