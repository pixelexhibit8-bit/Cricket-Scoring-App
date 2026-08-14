import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { systemFont, systemFontBold, systemFontMedium, fontWeights, typeScale } from '../theme';
import { PlayerAvatar } from './PlayerAvatar';

export const PreInningsScorecard = ({ players = [], title = 'Inning has not started yet.' }) => {
  return (
    <View style={{ gap: 14 }}>
      {/* Notice Banner / Flip Clock Icon */}
      <View
        style={{
          backgroundColor: '#F4F7FA',
          borderRadius: 14,
          paddingVertical: 24,
          paddingHorizontal: 16,
          alignItems: 'center',
          justify: 'center',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          gap: 10
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            backgroundColor: '#F1F5F9',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 10
          }}
        >
          {['0', '0', ':', '0', '0'].map((char, index) => (
            <View
              key={index}
              style={
                char === ':'
                  ? { justifyContent: 'center' }
                  : {
                      backgroundColor: '#F4F7FA',
                      width: 22,
                      height: 28,
                      borderRadius: 4,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: '#CBD5E1'
                    }
              }
            >
              <Text
                style={{
                  color: '#64748B',
                  fontSize: 14,
                  fontWeight: fontWeights.bold,
                  fontFamily: systemFont
                }}
              >
                {char}
              </Text>
            </View>
          ))}
        </View>

        <Text
          style={{
            color: '#475569',
            fontSize: typeScale.body,
            fontWeight: fontWeights.bold,
            fontFamily: systemFont
          }}
        >
          {title}
        </Text>
      </View>

      {/* Declared Playing XI Roster Table */}
      <View
        style={{
          backgroundColor: '#F4F7FA',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          overflow: 'hidden'
        }}
      >
        <View
          style={{
            minHeight: 44,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
            borderBottomWidth: 1,
            borderBottomColor: '#E2E8F0'
          }}
        >
          <Text
            style={{
              flex: 1,
              color: '#64748B',
              fontSize: 11,
              fontWeight: fontWeights.bold,
              fontFamily: systemFont
            }}
          >
            Playing XI
          </Text>
          <Text
            style={{
              width: 50,
              color: '#64748B',
              fontSize: 11,
              fontWeight: fontWeights.bold,
              textAlign: 'right',
              fontFamily: systemFont
            }}
          >
            Avg
          </Text>
          <Text
            style={{
              width: 58,
              color: '#64748B',
              fontSize: 11,
              fontWeight: fontWeights.bold,
              textAlign: 'right',
              fontFamily: systemFont
            }}
          >
            SR
          </Text>
        </View>

        {(players || []).map((player, index) => {
          const playerName = typeof player === 'string' ? player : player.name || 'Player';
          const avg = typeof player === 'object' && player.avg ? player.avg : '-';
          const sr = typeof player === 'object' && player.sr ? player.sr : '-';

          return (
            <View
              key={`${playerName}-${index}`}
              style={{
                minHeight: 50,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                borderTopWidth: index > 0 ? 1 : 0,
                borderTopColor: '#F1F5F9'
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                <PlayerAvatar name={playerName} size={28} />
                <Text
                  selectable
                  style={{
                    flex: 1,
                    color: '#0F172A',
                    fontSize: typeScale.name,
                    fontFamily: systemFont
                  }}
                  numberOfLines={1}
                >
                  {playerName}
                </Text>
              </View>

              <Text
                selectable
                style={{
                  width: 50,
                  color: '#475569',
                  fontSize: 12,
                  textAlign: 'right',
                  fontVariant: ['tabular-nums'],
                  fontFamily: systemFontMedium
                }}
              >
                {avg}
              </Text>

              <Text
                selectable
                style={{
                  width: 58,
                  color: '#475569',
                  fontSize: 12,
                  textAlign: 'right',
                  fontVariant: ['tabular-nums'],
                  fontFamily: systemFontMedium
                }}
              >
                {sr}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default PreInningsScorecard;
