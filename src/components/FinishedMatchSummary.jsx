import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { systemFont, fontWeights } from '../theme.js';
import { PlayerAvatar } from './PlayerAvatar.jsx';
import { isWicketToken } from '../utils/cricketUtils.js';

export const getTeamPerformers = (match, targetTeamName) => {
  const team = [match.team1, match.team2].find(t => (t?.name || '').toLowerCase() === (targetTeamName || '').toLowerCase()) || (targetTeamName === match.team1?.name ? match.team1 : match.team2) || {};
  const batters = [...(team?.batting || [])]
    .filter(player => player.runs > 0 || player.balls > 0)
    .sort((a, b) => b.runs - a.runs || a.balls - b.balls)
    .slice(0, 2)
    .map(player => ({
      key: `bat-${player.name}`,
      name: player.name,
      detail: `SR ${player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : '0.0'}`,
      value: `${player.runs} (${player.balls})`,
      icon: 'cricket'
    }));

  const opponent = [match.team1, match.team2].find(t => (t?.name || '').toLowerCase() !== (targetTeamName || '').toLowerCase()) || {};
  const bowler = [...(opponent?.bowling || [])]
    .filter(b => Number(b.wickets || 0) > 0 || Number(b.overs || 0) > 0)
    .sort((a, b) => (b.wickets || 0) - (a.wickets || 0) || (a.runs || 0) - (b.runs || 0))[0];

  const performers = bowler
    ? [...batters, {
      key: `bowl-${bowler.name}`,
      name: bowler.name,
      detail: `ECO ${bowler.econ || bowler.eco || '0.00'}`,
      value: `${bowler.wickets || 0}-${bowler.runs || 0} (${bowler.overs || '0.0'})`,
      icon: 'baseball'
    }]
    : batters;
  return performers;
};

export const FinishedMatchSummary = ({ match, onRematch, onPressPlayer }) => {
  if (!match) return null;
  const team1 = match.team1 || {};
  const team2 = match.team2 || {};
  const team1Name = team1.name || 'Team 1';
  const team2Name = team2.name || 'Team 2';

  const team1Performers = getTeamPerformers(match, team1Name);
  const team2Performers = getTeamPerformers(match, team2Name);
  const teamSections = [
    { team: team1, performers: team1Performers },
    { team: team2, performers: team2Performers }
  ].filter(section => section.team?.name);

  return (
    <View style={{ marginHorizontal: -14 }}>
      {match.lastOver?.balls?.length ? (
        <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
          <View style={{ minHeight: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ minWidth: 58 }}>
              <Text style={{ color: '#7C8793', fontSize: 9, fontWeight: fontWeights.bold, fontFamily: systemFont }}>FINAL OVER</Text>
              <Text selectable style={{ color: '#0F172A', fontSize: 12, fontWeight: fontWeights.bold, marginTop: 2, fontFamily: systemFont }}>Over {match.lastOver.overNum}</Text>
            </View>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {match.lastOver.balls.map((ball, index) => {
                const strongBall = isWicketToken(ball) || ball === '4' || ball === '6';
                const ballColor = isWicketToken(ball) ? '#E11D48' : ball === '4' ? '#0284C7' : ball === '6' ? '#7C3AED' : '#F1F5F9';
                return (
                  <View key={`${ball}-${index}`} style={{ minWidth: 27, height: 27, paddingHorizontal: 5, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: ballColor, borderWidth: strongBall ? 0 : 1, borderColor: '#CBD5E1' }}>
                    <Text style={{ color: strongBall ? '#FFFFFF' : '#334155', fontSize: 10, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{ball}</Text>
                  </View>
                );
              })}
            </View>
            <Text selectable style={{ color: '#0F172A', fontSize: 12, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{match.lastOver.runs} R</Text>
          </View>
        </View>
      ) : null}

      {(() => {
        const potm = match.playerOfTheMatch
          || (match.topScorer ? { name: match.topScorer.name, statText: `${match.topScorer.runs} (${match.topScorer.balls})` } : null)
          || (() => {
            const allBatters = [...(match.team1?.batting || []), ...(match.team2?.batting || [])]
              .filter(p => p && ((Number(p.runs) || 0) > 0 || (Number(p.balls) || 0) > 0))
              .sort((a, b) => (Number(b.runs) || 0) - (Number(a.runs) || 0));
            const allBowlers = [...(match.team1?.bowling || []), ...(match.team2?.bowling || [])]
              .filter(b => b && ((Number(b.wickets) || 0) > 0 || (Number(b.balls) || 0) > 0))
              .sort((a, b) => (Number(b.wickets) || 0) - (Number(a.wickets) || 0) || (Number(a.runs) || 0) - (Number(b.runs) || 0));

            const topB = allBatters[0];
            const topBw = allBowlers[0];

            if (topBw && (topBw.wickets >= 3 || (topB && topBw.wickets * 25 > topB.runs))) {
              return { name: topBw.name, statText: `${topBw.wickets}-${topBw.runs || 0} (${topBw.overs || '0.0'} Ov)` };
            }
            if (topB) {
              return { name: topB.name, statText: `${topB.runs} (${topB.balls || 0})` };
            }
            return null;
          })();

        if (!potm) return null;
        return (
          <TouchableOpacity
            onPress={() => onPressPlayer && onPressPlayer(potm.name)}
            activeOpacity={0.7}
            style={{ marginHorizontal: 16, marginVertical: 14, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#F7F3EE', borderRadius: 16, borderWidth: 1, borderColor: '#F0EAE1' }}
          >
            <PlayerAvatar name={potm.name} size={54} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text selectable style={{ color: '#1C1917', fontSize: 16, fontWeight: fontWeights.bold, fontFamily: systemFont }} numberOfLines={1}>
                {potm.name}
              </Text>
              <Text selectable style={{ color: '#8C857B', fontSize: 13, fontWeight: fontWeights.medium, marginTop: 2, fontFamily: systemFont }} numberOfLines={1}>
                Player of the Match
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text selectable style={{ color: '#1C1917', fontSize: 16, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
                {potm.statText}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })()}

      <View style={{ paddingHorizontal: 16, paddingVertical: 15, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <Text style={{ color: '#0F172A', fontSize: 15, fontWeight: fontWeights.bold, fontFamily: systemFont }}>TOP PERFORMERS</Text>
      </View>
      {teamSections.map(({ team, performers }) => (
        <View key={team.name} style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
          <View style={{ minHeight: 42, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: '#F8FAFC' }}>
            <Text selectable style={{ flex: 1, color: '#64748B', fontSize: 11, fontWeight: fontWeights.semibold, fontFamily: systemFont }} numberOfLines={1}>{team.name}</Text>
            <Text selectable style={{ color: '#64748B', fontSize: 11, fontWeight: fontWeights.semibold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{team.score}</Text>
          </View>
          {performers.map((performer, index) => (
            <TouchableOpacity
              key={performer.key}
              onPress={() => onPressPlayer && onPressPlayer(performer.name)}
              activeOpacity={0.7}
              style={{ minHeight: 66, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 11, borderTopWidth: index > 0 ? 1 : 0, borderTopColor: '#E8ECEF' }}
            >
              <PlayerAvatar name={performer.name} size={36} />
              <View style={{ flex: 1 }}>
                <Text selectable style={{ color: '#0F172A', fontSize: 13, fontWeight: fontWeights.bold, fontFamily: systemFont }} numberOfLines={1}>{performer.name}</Text>
                <Text selectable style={{ color: '#7C8793', fontSize: 10, fontWeight: fontWeights.semibold, marginTop: 2, fontFamily: systemFont }}>{performer.detail}</Text>
              </View>
              <Text selectable style={{ color: '#0F172A', fontSize: 14, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{performer.value}</Text>
            </TouchableOpacity>
          ))}
          {performers.length === 0 ? (
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: fontWeights.semibold, paddingHorizontal: 16, paddingVertical: 18, fontFamily: systemFont }}>No recorded performance</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
};

export default FinishedMatchSummary;
