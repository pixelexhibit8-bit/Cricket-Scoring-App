import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import TeamIdentityMark from './TeamIdentityMark';
import { getTeamShortCode } from '../utils/teamUtils';
import { systemFont, systemFontMedium, systemFontBold, fontWeights, typeScale } from '../theme';
import { ScalePressable, FadeSlideIn } from './motion/MotionSystem';

export const MatchListScoreCard = ({
  subtitle,
  teamOne,
  teamTwo,
  teamOneScore,
  teamOneOvers,
  teamTwoScore,
  teamTwoOvers,
  activeTeamName,
  winnerTeamName,
  statusLabel,
  statusColor = '#0284C7',
  statusDotColor = statusColor,
  resultTitle,
  resultDetail,
  resultColor = statusColor,
  footerText,
  footerColor = '#B45309',
  topRightIcon = 'notifications-outline',
  onPress,
  delay = 0
}) => {
  const renderTeamRow = (team, score, overs, muted = false) => {
    const isActive = activeTeamName === team?.name;
    const isWinner = Boolean(winnerTeamName && winnerTeamName === team?.name);
    const isFinished = Boolean(winnerTeamName);
    const isLoser = isFinished && !isWinner;
    const scoreColor = isWinner || isActive ? '#0284C7' : (isLoser ? '#94A3B8' : '#0F172A');

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TeamIdentityMark team={team} size={30} isLoser={isLoser} />
        <Text
          style={{
            fontSize: 15,
            color: isLoser ? '#94A3B8' : (muted ? '#64748B' : '#0F172A'),
            minWidth: 42,
            fontFamily: systemFontMedium
          }}
          numberOfLines={1}
        >
          {getTeamShortCode(team, team?.name) || 'Team'}
        </Text>

        {score ? (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flexShrink: 1 }}>
            <Text
              selectable
              style={{
                color: scoreColor,
                fontSize: 16.5,
                fontVariant: ['tabular-nums'],
                fontFamily: systemFontMedium
              }}
              numberOfLines={1}
            >
              {score}
            </Text>
            {overs ? (
              <Text
                selectable
                style={{
                  color: '#64748B',
                  fontSize: 13,
                  fontVariant: ['tabular-nums'],
                  fontFamily: systemFontMedium
                }}
                numberOfLines={1}
              >
                {overs}
              </Text>
            ) : null}
            {isActive ? <MaterialCommunityIcons name="cricket" size={14} color="#0284C7" /> : null}
            {isWinner ? <Ionicons name="trophy-outline" size={13} color="#0284C7" /> : null}
          </View>
        ) : (
          <Text
            style={{
              color: muted ? '#94A3B8' : '#64748B',
              fontSize: 13,
              fontFamily: systemFontMedium
            }}
            numberOfLines={1}
          >
            Yet to bat
          </Text>
        )}
      </View>
    );
  };

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
          borderColor: '#E2E8F0',
          gap: 12
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 12, color: '#64748B', flex: 1, fontFamily: systemFontMedium }} numberOfLines={1}>
            {subtitle}
          </Text>
          {topRightIcon ? <Ionicons name={topRightIcon} size={18} color="#64748B" /> : null}
        </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: 10 }}>
          {renderTeamRow(teamOne, teamOneScore, teamOneOvers)}
          {renderTeamRow(teamTwo, teamTwoScore, teamTwoOvers, !teamTwoScore)}
        </View>

        <View style={{ width: 1, height: 48, backgroundColor: '#F1F5F9', marginHorizontal: 14 }} />

        {resultTitle ? (
          <View style={{ width: 110, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              selectable
              style={{
                fontSize: 13.5,
                lineHeight: 18,
                color: resultColor,
                textAlign: 'center',
                fontFamily: systemFontMedium
              }}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {resultTitle}
            </Text>
            {resultDetail ? (
              <Text
                selectable
                style={{
                  fontSize: 12,
                  lineHeight: 16,
                  color: '#64748B',
                  textAlign: 'center',
                  marginTop: 3,
                  fontFamily: systemFontMedium
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {resultDetail}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={{ width: 110, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusDotColor }} />
              <Text style={{ fontSize: 14.5, color: statusColor, fontFamily: systemFontMedium }}>
                {statusLabel}
              </Text>
            </View>
          </View>
        )}
      </View>

      {footerText ? (
        <Text
          selectable
          style={{
            fontSize: 12,
            color: footerColor,
            fontFamily: systemFontMedium,
            paddingTop: 4,
            borderTopWidth: 1,
            borderTopColor: '#F8FAFC'
          }}
          numberOfLines={2}
        >
          {footerText}
        </Text>
      ) : null}
      </ScalePressable>
    </FadeSlideIn>
  );
};

export default MatchListScoreCard;

