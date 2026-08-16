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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TeamIdentityMark team={team} size={26} isLoser={isLoser} />
        <Text
          style={{
            fontSize: 15.5,
            color: isLoser ? '#94A3B8' : (muted ? '#64748B' : '#0F172A'),
            minWidth: 44,
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
          borderColor: '#F1F5F9',
          gap: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.03,
          shadowRadius: 4,
          elevation: 1
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#94A3B8', flex: 1, fontFamily: systemFontMedium }} numberOfLines={1}>
            {subtitle}
          </Text>
          {topRightIcon ? <Ionicons name={topRightIcon} size={17} color="#94A3B8" /> : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: 12 }}>
            {renderTeamRow(teamOne, teamOneScore, teamOneOvers)}
            {renderTeamRow(teamTwo, teamTwoScore, teamTwoOvers, !teamTwoScore)}
          </View>

          <View style={{ width: 1, height: 50, backgroundColor: '#F1F5F9', marginHorizontal: 14 }} />

          {resultTitle ? (
            <View style={{ minWidth: 105, alignItems: 'center', justifyContent: 'center' }}>
              <Text
                selectable
                style={{
                  fontSize: 17,
                  lineHeight: 22,
                  color: resultColor || '#0284C7',
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
                    fontFamily: systemFontMedium,
                    marginTop: 3
                  }}
                  numberOfLines={1}
                >
                  {resultDetail}
                </Text>
              ) : null}
            </View>
          ) : (statusLabel ? (
            <View style={{ minWidth: 90, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 6.5, height: 6.5, borderRadius: 3.5, backgroundColor: statusDotColor }} />
                <Text style={{ fontSize: 14, color: statusColor, fontFamily: systemFontMedium }}>
                  {statusLabel}
                </Text>
              </View>
            </View>
          ) : null)}
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

