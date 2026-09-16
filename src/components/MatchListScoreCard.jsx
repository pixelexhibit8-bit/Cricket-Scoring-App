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
  useFullName = false,
  activeTeamName,
  winnerTeamName,
  statusLabel,
  statusSubLabel,
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
  const isUpcoming = useFullName || (!teamOneScore && !teamTwoScore && !resultTitle);

  const renderTeamRow = (team, score, overs, muted = false) => {
    const isActive = activeTeamName === team?.name;
    const scoreColor = isActive ? '#0284C7' : '#0F172A';
    const teamDisplayName = isUpcoming ? (team?.name || 'Team') : (getTeamShortCode(team, team?.name) || 'Team');

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <TeamIdentityMark team={team} size={26} />
        <Text
          style={{
            fontSize: isUpcoming ? 14.5 : 15.5,
            color: muted ? '#64748B' : '#0F172A',
            minWidth: isUpcoming ? undefined : 44,
            flex: isUpcoming ? 1 : undefined,
            fontFamily: systemFontMedium
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {teamDisplayName}
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
        ) : (!isUpcoming ? (
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
        ) : null)}
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
          borderWidth: 0,
          gap: 12
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#94A3B8', flex: 1, fontFamily: systemFontMedium }} numberOfLines={1}>
            {subtitle}
          </Text>
          {topRightIcon ? <Ionicons name={topRightIcon} size={17} color="#94A3B8" /> : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, minWidth: 0, gap: 12 }}>
            {renderTeamRow(teamOne, teamOneScore, teamOneOvers)}
            {renderTeamRow(teamTwo, teamTwoScore, teamTwoOvers, !teamTwoScore)}
          </View>

          <View style={{ width: 1, height: 50, backgroundColor: '#EEEEF0', marginHorizontal: 14 }} />

          {resultTitle ? (
            <View style={{ minWidth: 105, alignItems: 'center', justifyContent: 'center' }}>
              <Text
                selectable
                style={{
                  fontSize: 16.5,
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
            <View style={{ minWidth: 105, alignItems: 'center', justifyContent: 'center' }}>
              {isUpcoming ? (
                <>
                  <Text
                    selectable
                    style={{
                      fontSize: 15.5,
                      lineHeight: 20,
                      color: statusColor || '#0F172A',
                      textAlign: 'center',
                      fontFamily: systemFontMedium
                    }}
                    numberOfLines={1}
                  >
                    {statusLabel}
                  </Text>
                  {statusSubLabel ? (
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
                      {statusSubLabel}
                    </Text>
                  ) : null}
                </>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFE4E6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 5 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E11D48' }} />
                  <Text style={{ color: '#E11D48', fontSize: 11, fontFamily: systemFontBold, letterSpacing: 0.3 }}>
                    LIVE
                  </Text>
                </View>
              )}
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
              paddingTop: 4
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

