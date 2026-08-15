import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import TeamIdentityMark from './TeamIdentityMark';
import { getTeamShortCode } from '../utils/teamUtils';
import { systemFont, fontWeights, typeScale } from '../theme';

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
  onPress
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
            fontWeight: isWinner ? fontWeights.bold : (isLoser ? fontWeights.medium : fontWeights.bold),
            color: isLoser ? '#94A3B8' : (muted ? '#64748B' : '#0F172A'),
            minWidth: 42,
            fontFamily: systemFont
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
                fontSize: typeScale.keyAction,
                fontWeight: fontWeights.bold,
                fontVariant: ['tabular-nums'],
                fontFamily: systemFont
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
                  fontWeight: fontWeights.medium,
                  fontVariant: ['tabular-nums'],
                  fontFamily: systemFont
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
              fontWeight: fontWeights.medium,
              fontFamily: systemFont
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
    <TouchableOpacity
      activeOpacity={0.82}
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
        <Text style={{ fontSize: 12, color: '#64748B', fontWeight: fontWeights.medium, flex: 1, fontFamily: systemFont }} numberOfLines={1}>
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
          <View style={{ width: 104, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              selectable
              style={{
                fontSize: 16,
                lineHeight: 20,
                fontWeight: fontWeights.semibold,
                color: resultColor,
                textAlign: 'center',
                fontFamily: systemFont
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {resultTitle}
            </Text>
            {resultDetail ? (
              <Text
                selectable
                style={{
                  fontSize: 12,
                  lineHeight: 16,
                  fontWeight: fontWeights.medium,
                  color: '#64748B',
                  textAlign: 'center',
                  marginTop: 4,
                  fontFamily: systemFont
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {resultDetail}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={{ width: 104, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusDotColor }} />
              <Text style={{ fontSize: 15, fontWeight: fontWeights.bold, color: statusColor, fontFamily: systemFont }}>
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
            fontWeight: fontWeights.semibold,
            color: footerColor,
            fontFamily: systemFont,
            paddingTop: 4,
            borderTopWidth: 1,
            borderTopColor: '#F8FAFC'
          }}
          numberOfLines={2}
        >
          {footerText}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

export default MatchListScoreCard;
