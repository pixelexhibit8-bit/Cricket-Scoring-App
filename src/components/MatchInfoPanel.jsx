import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontBold,
  systemFontMedium
} from '../theme.js';
import { TeamIdentityMark } from './TeamIdentityMark.jsx';
import { getTeamShortCode, formatMatchDateTime } from '../utils/cricketUtils.js';
import { getTournamentBannerSource } from '../utils/teamUtils.js';

export const MatchInfoPanel = React.memo(function MatchInfoPanel({
  match = {},
  teamOne = {},
  teamTwo = {},
  teamOneName = '',
  teamTwoName = '',
  tossSummary = '',
  matchResult = '',
  playerCount = 22,
  onOpenPlayingXi,
  onPressTournament,
  tournamentData = null
}) {
  const m = match || {};
  const t1Name = teamOneName || teamOne?.name || m.team1?.name || m.teams?.[0]?.name || 'Team 1';
  const t2Name = teamTwoName || teamTwo?.name || m.team2?.name || m.teams?.[1]?.name || 'Team 2';

  const t1Obj = teamOne || m.team1 || m.teams?.[0] || { name: t1Name };
  const t2Obj = teamTwo || m.team2 || m.teams?.[1] || { name: t2Name };

  const t1Code = getTeamShortCode(t1Obj, t1Name);
  const t2Code = getTeamShortCode(t2Obj, t2Name);

  // Tournament Info
  const tournamentObj = tournamentData || m.tournament || {
    id: m.tournamentId,
    name: m.tournamentName || m.tournamentTitle || m.seriesName
  };

  const tournamentTitle = tournamentObj?.fullName
    || tournamentObj?.name
    || tournamentObj?.title
    || m.tournamentName
    || m.tournamentTitle
    || m.seriesName
    || 'Cricket League 2026';

  const bannerSource = getTournamentBannerSource(tournamentObj);

  const matchOrdinal = m.matchNumber || m.matchNo
    ? `${m.matchNumber || m.matchNo}${getOrdinalSuffix(m.matchNumber || m.matchNo)} Match • ${m.overs || 20} Overs`
    : (m.matchTitle || m.title || `Match • ${m.overs || 20} Overs`);

  // Venue & DateTime
  const venueText = m.venue || 'Sadokan Cricket Ground, Rajasthan';
  const dateTimeText = formatMatchDateTime(m.startedAt || m.date || new Date().toISOString());

  // Broadcaster / Streaming
  const broadcastText = m.broadcaster
    || m.streamText
    || 'CricFlow Live Streaming • Star Sports Network, YouTube';

  // Umpires
  const umpireText = m.umpireName || m.umpire || 'Official CricFlow Umpire';

  // Toss text
  const tossText = tossSummary
    || m.tossResult
    || (m.tossWinner ? `${m.tossWinner} won the toss and chose to ${String(m.tossDecision || 'bat').toLowerCase()}` : '');

  // Result text
  const resultText = matchResult || m.resultText || m.result || '';

  // Team Form (Last 5 matches)
  const t1Form = Array.isArray(t1Obj.form) && t1Obj.form.length > 0
    ? t1Obj.form.slice(0, 5)
    : (Array.isArray(m.team1Form) ? m.team1Form : ['W', 'W', 'L', 'W', 'L']);
  const t2Form = Array.isArray(t2Obj.form) && t2Obj.form.length > 0
    ? t2Obj.form.slice(0, 5)
    : (Array.isArray(m.team2Form) ? m.team2Form : ['L', 'W', 'L', 'L', 'W']);

  return (
    <View style={styles.container}>
      {/* ── 1. MATCH RESULT & TOSS CALLOUT (TOP HERO CALLOUT) ── */}
      {resultText ? (
        <View style={styles.resultCalloutCard}>
          <Text style={styles.resultMainText} numberOfLines={1}>
            {resultText}
          </Text>
          {tossText ? (
            <Text style={styles.tossSubtitleText} numberOfLines={2}>
              {tossText}
            </Text>
          ) : null}
        </View>
      ) : tossText ? (
        <View style={styles.tossOnlyCard}>
          <Ionicons name="swap-horizontal-outline" size={16} color="#B45309" />
          <Text style={styles.tossOnlyText} numberOfLines={2}>
            {tossText}
          </Text>
        </View>
      ) : null}

      {/* ── 2. TOURNAMENT BANNER CARD (TAPPABLE TO NAVIGATE TO SERIES) ── */}
      <TouchableOpacity
        style={styles.tournamentCard}
        activeOpacity={0.8}
        onPress={() => onPressTournament && onPressTournament(tournamentObj || m)}
      >
        <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
          <Text style={styles.matchOrdinalText} numberOfLines={1}>
            {matchOrdinal}
          </Text>
          <View style={styles.tournamentTitleRow}>
            <Text style={styles.tournamentTitleText} numberOfLines={1}>
              {tournamentTitle}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#0F172A" style={{ marginTop: 1 }} />
          </View>
        </View>

        {/* Tournament Poster Thumbnail Box */}
        <View style={styles.tournamentThumbBox}>
          <Image
            source={bannerSource}
            style={styles.tournamentThumbImage}
            resizeMode="cover"
          />
        </View>
      </TouchableOpacity>

      {/* ── 3. CLEAN MATCH INFORMATION LIST (CALENDAR, VENUE, BROADCAST, UMPIRE) ── */}
      <View style={styles.infoListCard}>
        {/* Date & Time */}
        <View style={styles.infoRow}>
          <View style={styles.infoIconBox}>
            <Ionicons name="calendar-outline" size={20} color="#64748B" />
          </View>
          <Text style={styles.infoRowText} numberOfLines={1}>
            {dateTimeText}
          </Text>
        </View>

        {/* Venue with Dropdown Chevron */}
        <View style={styles.infoRow}>
          <View style={styles.infoIconBox}>
            <Ionicons name="location-outline" size={20} color="#64748B" />
          </View>
          <Text style={styles.infoRowText} numberOfLines={2}>
            {venueText}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#0284C7" />
        </View>

        {/* Broadcast & Streaming */}
        <View style={styles.infoRow}>
          <View style={styles.infoIconBox}>
            <Ionicons name="play-outline" size={20} color="#64748B" />
          </View>
          <Text style={styles.infoRowText} numberOfLines={2}>
            {broadcastText}
          </Text>
        </View>

        {/* Match Officials */}
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <View style={styles.infoIconBox}>
            <Ionicons name="person-outline" size={20} color="#64748B" />
          </View>
          <Text style={styles.infoRowText} numberOfLines={1}>
            {umpireText}
          </Text>
        </View>
      </View>

      {/* ── 4. PLAYING XI SECTION (SEPARATE TEAM ROWS WITH CHEVRONS) ── */}
      <View style={{ marginTop: 8 }}>
        <Text style={styles.sectionHeaderTitle}>Playing XI</Text>

        <View style={{ gap: 8 }}>
          {/* Team 1 Row */}
          <TouchableOpacity
            style={styles.playingXiTeamCard}
            activeOpacity={0.7}
            onPress={() => onOpenPlayingXi && onOpenPlayingXi(t1Name)}
          >
            <TeamIdentityMark team={t1Obj} size={28} />
            <Text style={styles.playingXiTeamName} numberOfLines={1}>
              {t1Name}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Team 2 Row */}
          <TouchableOpacity
            style={styles.playingXiTeamCard}
            activeOpacity={0.7}
            onPress={() => onOpenPlayingXi && onOpenPlayingXi(t2Name)}
          >
            <TeamIdentityMark team={t2Obj} size={28} />
            <Text style={styles.playingXiTeamName} numberOfLines={1}>
              {t2Name}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 5. TEAM FORM (LAST 5 MATCHES) SECTION ── */}
      <View style={{ marginTop: 10 }}>
        <View style={styles.teamFormTitleRow}>
          <Text style={styles.sectionHeaderTitle}>Team form</Text>
          <Text style={styles.teamFormSubTitle}>(Last 5 matches)</Text>
        </View>

        <View style={styles.teamFormCard}>
          {/* Team 1 Form */}
          <View style={styles.teamFormRow}>
            <View style={styles.teamFormIdentityCol}>
              <TeamIdentityMark team={t1Obj} size={22} />
              <Text style={styles.teamFormCodeText} numberOfLines={1}>
                {t1Code}
              </Text>
            </View>
            <View style={styles.formPillsList}>
              {t1Form.map((f, fIdx) => (
                <View
                  key={`t1_f_${fIdx}`}
                  style={[
                    styles.formPillCircle,
                    { backgroundColor: f === 'W' ? '#16A34A' : (f === 'L' ? '#DC2626' : '#94A3B8') }
                  ]}
                >
                  <Text style={styles.formPillLetter}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Team 2 Form */}
          <View style={[styles.teamFormRow, { borderTopWidth: 1, borderTopColor: '#F8F8FA' }]}>
            <View style={styles.teamFormIdentityCol}>
              <TeamIdentityMark team={t2Obj} size={22} />
              <Text style={styles.teamFormCodeText} numberOfLines={1}>
                {t2Code}
              </Text>
            </View>
            <View style={styles.formPillsList}>
              {t2Form.map((f, fIdx) => (
                <View
                  key={`t2_f_${fIdx}`}
                  style={[
                    styles.formPillCircle,
                    { backgroundColor: f === 'W' ? '#16A34A' : (f === 'L' ? '#DC2626' : '#94A3B8') }
                  ]}
                >
                  <Text style={styles.formPillLetter}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

function getOrdinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = Number(n) % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingBottom: 24
  },
  resultCalloutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  resultMainText: {
    fontSize: 15,
    fontFamily: systemFontBold,
    color: '#B45309',
    textAlign: 'center'
  },
  tossSubtitleText: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: '#64748B',
    textAlign: 'center'
  },
  tossOnlyCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  tossOnlyText: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: '#92400E',
    flex: 1
  },
  tournamentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  matchOrdinalText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  tournamentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4
  },
  tournamentTitleText: {
    fontSize: 18,
    fontFamily: systemFontBold,
    color: '#0F172A',
    letterSpacing: -0.2
  },
  tournamentThumbBox: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#0F2744',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tournamentThumbImage: {
    width: '100%',
    height: '100%'
  },
  tournamentThumbFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#071B2C'
  },
  tournamentThumbFallbackCode: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: systemFontBold,
    marginTop: 2,
    letterSpacing: 0.5
  },
  infoListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    overflow: 'hidden'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8FA'
  },
  infoIconBox: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoRowText: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: '#0F172A',
    lineHeight: 18
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: '#0F172A',
    marginBottom: 8
  },
  playingXiTeamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#EEEEF0'
  },
  playingXiTeamName: {
    flex: 1,
    fontSize: 15,
    fontFamily: systemFontMedium,
    color: '#0284C7'
  },
  teamFormTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8
  },
  teamFormSubTitle: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  teamFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    paddingHorizontal: 14,
    paddingVertical: 4
  },
  teamFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12
  },
  teamFormIdentityCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  teamFormCodeText: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  formPillsList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  formPillCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center'
  },
  formPillLetter: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: systemFontBold
  }
});

export default MatchInfoPanel;
