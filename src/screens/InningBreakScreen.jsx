import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { systemFontMedium } from '../theme.js';
import { TeamIdentityMark } from '../components/TeamIdentityMark.jsx';
import { OpeningPlayersSelector } from '../components/OpeningPlayersSelector.jsx';
import { formatOvers } from '../utils/cricketUtils.js';

export function InningBreakScreen({
  activeMatch,
  getRosterForTeam,
  inn2Striker,
  inn2NonStriker,
  inn2Bowler,
  handleSelectInning2Opener,
  setInn2Bowler,
  renderSetupPlayerPhoto,
  handleStartInning2
}) {
  if (!activeMatch || !activeMatch.innings || !activeMatch.innings[0]) return null;

  const inn1 = activeMatch.innings[0];
  const target = activeMatch.target || (inn1.battingTeam.runs + 1);
  const totalBalls = (Number(activeMatch.maxOvers) || 5) * 6;
  const rrr = totalBalls > 0 ? ((target / totalBalls) * 6).toFixed(2) : '0.00';
  const firstInningTeamMeta = activeMatch.teams?.find(team => team.name === inn1.battingTeam.name) || {
    ...inn1.battingTeam,
    logoKey: activeMatch.team1?.logoKey || 'csk'
  };
  const bat2Roster = getRosterForTeam ? getRosterForTeam(inn1.bowlingTeam.name, []) : [];
  const bowl2Roster = getRosterForTeam ? getRosterForTeam(inn1.battingTeam.name, []) : [];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* TOP INNINGS BREAK BANNER */}
      <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
        <View style={{ minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="pause-circle" size={18} color="#0284C7" />
            <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontMedium }}>INNINGS BREAK</Text>
          </View>
          <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ color: '#0369A1', fontSize: 11, fontFamily: systemFontMedium }}>1ST INNINGS COMPLETED</Text>
          </View>
        </View>

        {/* 1ST INNINGS SUMMARY SCORE */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TeamIdentityMark team={firstInningTeamMeta} size={44} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: '#64748B', fontSize: 11, fontFamily: systemFontMedium }} numberOfLines={1}>
              {inn1.battingTeam.name.toUpperCase()}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
              <Text selectable style={{ color: '#0F172A', fontSize: 22, fontFamily: systemFontMedium, fontVariant: ['tabular-nums'] }}>
                {inn1.battingTeam.runs}-{inn1.battingTeam.wickets}
              </Text>
              <Text selectable style={{ color: '#64748B', fontSize: 12.5, fontFamily: systemFontMedium, fontVariant: ['tabular-nums'] }}>
                {formatOvers(inn1.totalLegalBalls)} ({activeMatch.maxOvers} ov)
              </Text>
            </View>
          </View>

          {/* TARGET CALLOUT BADGE */}
          <View style={{ alignItems: 'flex-end', backgroundColor: '#FFFBEB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#FDE68A' }}>
            <Text style={{ color: '#92400E', fontSize: 9.5, fontFamily: systemFontMedium }}>TARGET</Text>
            <Text selectable style={{ color: '#B45309', fontSize: 18, fontFamily: systemFontMedium, fontVariant: ['tabular-nums'] }}>
              {target}
            </Text>
          </View>
        </View>
      </View>

      {/* SHARED OPENING PLAYERS SELECTOR */}
      <OpeningPlayersSelector
        battingTeamName={inn1.bowlingTeam.name}
        bowlingTeamName={inn1.battingTeam.name}
        battingRoster={bat2Roster}
        bowlingRoster={bowl2Roster}
        striker={inn2Striker}
        nonStriker={inn2NonStriker}
        bowler={inn2Bowler}
        onSelectBatter={handleSelectInning2Opener}
        onSelectBowler={setInn2Bowler}
        renderPlayerPhoto={renderSetupPlayerPhoto}
        bannerNotice={`${inn1.bowlingTeam.name} need ${target} runs from ${totalBalls} balls (RRR: ${rrr})`}
        ctaText="START 2ND INNINGS (CHASE)"
        onStart={handleStartInning2}
        headerTitle="2ND INNINGS OPENERS"
      />
    </View>
  );
}
