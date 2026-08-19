import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/navigation/AppHeader.jsx';
import { AppBottomNav } from '../components/navigation/AppBottomNav.jsx';
import { MatchesScreen } from './MatchesScreen.jsx';
import { RankingsScreen } from './RankingsScreen.jsx';
import { MyProfileScreen } from './MyProfileScreen.jsx';
import { TeamIdentityMark } from '../components/TeamIdentityMark.jsx';
import { MatchListScoreCard } from '../components/MatchListScoreCard.jsx';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
import { ScalePressable, FadeSlideIn } from '../components/motion/MotionSystem.jsx';
import {
  systemFont,
  systemFontMedium,
  systemFontBold,
  fontWeights
} from '../theme.js';
import {
  formatOvers,
  getScorePartsFromText,
  getFinishedResultCardText,
  getTeamShortCode
} from '../utils/cricketUtils.js';

export function HomeScreen(props) {
  const {
    bottomNavTab = 'home',
    setBottomNavTab,
    openScorerScreen,
    searchQuery = '',
    setSearchQuery,
    TOP_BATTERS = [],
    TOP_BOWLERS = [],
    TOP_ALLROUNDERS = [],
    refreshing = false,
    handlePullToRefresh = null,
    setSelectedPlayerProfile,
    setCurrentScreen,
    finishedArchive = [],
    activeMatch,
    setActiveMatch,
    setSelectedMatch,
    visibleLiveMatches = [],
    recentFinishedMatches = [],
    onJoinMatchByCode
  } = props;

  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoinCodeExpanded, setIsJoinCodeExpanded] = useState(false);

  // 1. If bottom tab is "matches" -> Render MatchesScreen
  if (bottomNavTab === 'matches') {
    return <MatchesScreen {...props} />;
  }

  // 2. If bottom tab is "rankings" -> Render RankingsScreen with bottom nav
  if (bottomNavTab === 'rankings') {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <RankingsScreen
          topBatters={TOP_BATTERS}
          topBowlers={TOP_BOWLERS}
          topAllRounders={TOP_ALLROUNDERS}
          onSelectPlayer={(playerName, meta) => {
            if (setSelectedPlayerProfile) setSelectedPlayerProfile({ name: playerName, ...meta });
            if (setCurrentScreen) setCurrentScreen('playerProfile');
          }}
          refreshing={refreshing}
          onRefresh={handlePullToRefresh}
        />
        <AppBottomNav
          activeTab={bottomNavTab}
          onTabChange={(tabId) => {
            if (setBottomNavTab) setBottomNavTab(tabId);
          }}
        />
      </View>
    );
  }

  // 3. If bottom tab is "profile" -> Render MyProfileScreen with bottom nav
  if (bottomNavTab === 'profile') {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <MyProfileScreen
          finishedMatches={finishedArchive || []}
          activeMatch={activeMatch}
          onStartQuickMatch={openScorerScreen}
          onJoinMatchByCode={onJoinMatchByCode}
          onSelectMatch={(m) => {
            if (setSelectedMatch) setSelectedMatch(m);
            if (setCurrentScreen) setCurrentScreen('finishedView');
          }}
        />
        <AppBottomNav
          activeTab={bottomNavTab}
          onTabChange={(tabId) => {
            if (setBottomNavTab) setBottomNavTab(tabId);
          }}
        />
      </View>
    );
  }

  // Identify Live Matches
  const allLive = visibleLiveMatches.length > 0
    ? visibleLiveMatches
    : (activeMatch && activeMatch.phase !== 'result' && activeMatch.phase !== 'finished' && !activeMatch.isCompleted
      ? [activeMatch]
      : []);

  const primaryLiveMatch = allLive[0] || null;

  // Identify Recent Finished Matches
  const displayedFinished = (recentFinishedMatches.length > 0 ? recentFinishedMatches : finishedArchive).slice(0, 3);

  const topBatter = TOP_BATTERS[0] || null;
  const topBowler = TOP_BOWLERS[0] || null;

  const handleJoinSubmit = () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;
    if (onJoinMatchByCode) {
      onJoinMatchByCode(code);
    }
    setJoinCodeInput('');
    setIsJoinCodeExpanded(false);
  };

  // 4. Rich Native Home Dashboard
  return (
    <View style={styles.container}>
      {/* REUSABLE TOP APP HEADER */}
      <AppHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search players, matches..."
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          handlePullToRefresh ? (
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={handlePullToRefresh}
              colors={['#0284C7']}
              tintColor="#0284C7"
            />
          ) : undefined
        }
      >
        {/* HERO QUICK MATCH ACTIONS */}
        <FadeSlideIn distance={12} delay={0}>
          <View style={styles.heroActionCard}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>Local Ground Cricket</Text>
              <Text style={styles.heroSubtitle}>
                Instant zero-friction scoring for turf, gaon & gully matches
              </Text>
            </View>

            <View style={styles.heroButtonsRow}>
              <ScalePressable
                activeScale={0.96}
                onPress={openScorerScreen}
                style={styles.primaryActionButton}
              >
                <MaterialCommunityIcons name="cricket" size={20} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>Start Quick Match</Text>
              </ScalePressable>

              <ScalePressable
                activeScale={0.96}
                onPress={() => setIsJoinCodeExpanded(!isJoinCodeExpanded)}
                style={styles.secondaryActionButton}
              >
                <Ionicons name="enter-outline" size={18} color="#0284C7" />
                <Text style={styles.secondaryActionText}>Join Match</Text>
              </ScalePressable>
            </View>

            {/* EXPANDABLE JOIN CODE INPUT */}
            {isJoinCodeExpanded ? (
              <View style={styles.joinCodeBox}>
                <TextInput
                  value={joinCodeInput}
                  onChangeText={setJoinCodeInput}
                  placeholder="Enter Match Code (e.g. CF-1234)"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  style={styles.joinCodeInput}
                  returnKeyType="go"
                  onSubmitEditing={handleJoinSubmit}
                />
                <TouchableOpacity
                  onPress={handleJoinSubmit}
                  style={styles.joinCodeSubmitBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </FadeSlideIn>

        {/* LIVE MATCH SPOTLIGHT SECTION */}
        {primaryLiveMatch ? (
          <FadeSlideIn distance={12} delay={50}>
            <View style={styles.sectionHeader}>
              <View style={styles.liveIndicatorRow}>
                <View style={styles.livePulseDot} />
                <Text style={styles.sectionTitleLive}>LIVE MATCH</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (setBottomNavTab) setBottomNavTab('matches');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionLink}>View all ({allLive.length})</Text>
              </TouchableOpacity>
            </View>

            {(() => {
              const inn = primaryLiveMatch.inning === 2
                ? (primaryLiveMatch.innings?.[1] || primaryLiveMatch.secondInning)
                : (primaryLiveMatch.innings?.[0] || primaryLiveMatch.firstInning);
              const batTeam = inn?.battingTeam || primaryLiveMatch.team1;
              const bowlTeam = inn?.bowlingTeam || primaryLiveMatch.team2;
              const runs = batTeam?.runs ?? 0;
              const wkts = batTeam?.wickets ?? 0;
              const totalBalls = inn?.totalLegalBalls ?? 0;
              const overs = formatOvers(totalBalls);
              const maxOvers = primaryLiveMatch.maxOvers || 20;

              return (
                <ScalePressable
                  activeScale={0.98}
                  onPress={() => {
                    if (setActiveMatch) setActiveMatch(primaryLiveMatch);
                    if (setCurrentScreen) setCurrentScreen('liveView');
                  }}
                  style={styles.liveMatchCard}
                >
                  <View style={styles.liveCardHeader}>
                    <Text style={styles.liveMatchTitle} numberOfLines={1}>
                      {primaryLiveMatch.matchTitle || primaryLiveMatch.title || `${batTeam?.name || 'Team 1'} vs ${bowlTeam?.name || 'Team 2'}`}
                    </Text>
                    <View style={styles.liveTag}>
                      <Text style={styles.liveTagText}>INNING {primaryLiveMatch.inning || 1}</Text>
                    </View>
                  </View>

                  <View style={styles.liveScoreRow}>
                    <View style={styles.liveTeamCol}>
                      <TeamIdentityMark team={batTeam} size={36} />
                      <Text style={styles.liveTeamName} numberOfLines={1}>
                        {getTeamShortCode(batTeam, batTeam?.name)}
                      </Text>
                      <Text style={styles.liveScoreBig}>
                        {runs}/{wkts}
                      </Text>
                      <Text style={styles.liveOversSmall}>
                        ({overs}/{maxOvers} Ov)
                      </Text>
                    </View>

                    <Text style={styles.liveVsText}>VS</Text>

                    <View style={styles.liveTeamCol}>
                      <TeamIdentityMark team={bowlTeam} size={36} isMuted />
                      <Text style={styles.liveTeamNameMuted} numberOfLines={1}>
                        {getTeamShortCode(bowlTeam, bowlTeam?.name)}
                      </Text>
                      <Text style={styles.liveScoreMuted}>
                        {primaryLiveMatch.inning === 2 ? `${primaryLiveMatch.target ? `Target: ${primaryLiveMatch.target}` : 'Bowling'}` : 'Yet to bat'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.liveCardFooter}>
                    <TouchableOpacity
                      onPress={() => {
                        if (setActiveMatch) setActiveMatch(primaryLiveMatch);
                        if (setCurrentScreen) setCurrentScreen('liveView');
                      }}
                      style={styles.liveFooterBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="radio-outline" size={14} color="#0284C7" />
                      <Text style={styles.liveFooterBtnText}>Watch Live</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        if (setActiveMatch) setActiveMatch(primaryLiveMatch);
                        if (setCurrentScreen) setCurrentScreen('scorerWizard');
                      }}
                      style={styles.liveFooterBtnPrimary}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="scoreboard-outline" size={14} color="#FFFFFF" />
                      <Text style={styles.liveFooterBtnPrimaryText}>Score Match</Text>
                    </TouchableOpacity>
                  </View>
                </ScalePressable>
              );
            })()}
          </FadeSlideIn>
        ) : null}

        {/* RECENT MATCHES SECTION */}
        <FadeSlideIn distance={12} delay={100}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>RECENT MATCHES</Text>
            {finishedArchive.length > 0 ? (
              <TouchableOpacity
                onPress={() => {
                  if (setBottomNavTab) setBottomNavTab('matches');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionLink}>See all ({finishedArchive.length})</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {displayedFinished.length > 0 ? (
            displayedFinished.map((match, idx) => {
              const teamOneScore = getScorePartsFromText(match.team1?.score);
              const teamTwoScore = getScorePartsFromText(match.team2?.score);
              const resultCardText = getFinishedResultCardText(match);
              const resultColor = match.winnerTeamName === match.team1?.name ? '#0369A1' : '#92400E';
              const subtitleText = `${match.maxOvers || 5} Overs • ${match.venue || 'Sadokan Ground'}`;

              return (
                <View key={`home-fin-${match.id || 'm'}-${idx}`} style={{ marginBottom: 10 }}>
                  <MatchListScoreCard
                    subtitle={subtitleText}
                    teamOne={match.team1}
                    teamTwo={match.team2}
                    teamOneScore={teamOneScore.score}
                    teamOneOvers={teamOneScore.overs}
                    teamTwoScore={teamTwoScore.score}
                    teamTwoOvers={teamTwoScore.overs}
                    winnerTeamName={match.winnerTeamName}
                    resultTitle={resultCardText.title}
                    resultDetail={resultCardText.detail}
                    resultColor={resultColor}
                    topRightIcon={null}
                    onPress={() => {
                      if (setSelectedMatch) setSelectedMatch(match);
                      if (setCurrentScreen) setCurrentScreen('finishedView');
                    }}
                  />
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="cricket" size={36} color="#CBD5E1" />
              <Text style={styles.emptyCardTitle}>No finished matches yet</Text>
              <Text style={styles.emptyCardSubtitle}>
                Score your first ground match to start tracking team results and career stats.
              </Text>
              <TouchableOpacity
                onPress={openScorerScreen}
                style={styles.emptyCardBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyCardBtnText}>+ Start Match</Text>
              </TouchableOpacity>
            </View>
          )}
        </FadeSlideIn>

        {/* TOP PERFORMERS SPOTLIGHT */}
        {(topBatter || topBowler) ? (
          <FadeSlideIn distance={12} delay={150}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>GROUND RANKINGS</Text>
              <TouchableOpacity
                onPress={() => {
                  if (setBottomNavTab) setBottomNavTab('rankings');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionLink}>Full Leaderboard</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.performersRow}>
              {topBatter ? (
                <TouchableOpacity
                  onPress={() => {
                    if (setSelectedPlayerProfile) setSelectedPlayerProfile({ name: topBatter.name });
                    if (setCurrentScreen) setCurrentScreen('playerProfile');
                  }}
                  activeOpacity={0.8}
                  style={styles.performerCard}
                >
                  <View style={styles.performerBadge}>
                    <MaterialCommunityIcons name="bat" size={12} color="#0284C7" />
                    <Text style={styles.performerBadgeText}>TOP BATTER</Text>
                  </View>
                  <PlayerAvatar name={topBatter.name} photoUrl={topBatter.photoUrl || topBatter.photo_url} size={40} />
                  <Text style={styles.performerName} numberOfLines={1}>
                    {topBatter.name}
                  </Text>
                  <Text style={styles.performerStat}>
                    {topBatter.runs || topBatter.total_runs || 0} <Text style={styles.performerStatLabel}>runs</Text>
                  </Text>
                </TouchableOpacity>
              ) : null}

              {topBowler ? (
                <TouchableOpacity
                  onPress={() => {
                    if (setSelectedPlayerProfile) setSelectedPlayerProfile({ name: topBowler.name });
                    if (setCurrentScreen) setCurrentScreen('playerProfile');
                  }}
                  activeOpacity={0.8}
                  style={styles.performerCard}
                >
                  <View style={[styles.performerBadge, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                    <MaterialCommunityIcons name="baseball" size={12} color="#16A34A" />
                    <Text style={[styles.performerBadgeText, { color: '#16A34A' }]}>TOP BOWLER</Text>
                  </View>
                  <PlayerAvatar name={topBowler.name} photoUrl={topBowler.photoUrl || topBowler.photo_url} size={40} />
                  <Text style={styles.performerName} numberOfLines={1}>
                    {topBowler.name}
                  </Text>
                  <Text style={styles.performerStat}>
                    {topBowler.wickets || topBowler.total_wickets || 0} <Text style={styles.performerStatLabel}>wickets</Text>
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </FadeSlideIn>
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* INDUSTRIAL STANDARD BOTTOM NAVIGATION BAR */}
      <AppBottomNav
        activeTab={bottomNavTab}
        onTabChange={(tabId) => {
          if (setBottomNavTab) setBottomNavTab(tabId);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollContent: {
    padding: 14,
    gap: 16
  },
  heroActionCard: {
    backgroundColor: '#071B2C',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#123A56',
    gap: 14
  },
  heroTextContainer: {
    gap: 4
  },
  heroTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: systemFontBold,
    letterSpacing: -0.2
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: '#9FC4D7',
    fontFamily: systemFontMedium,
    lineHeight: 18
  },
  heroButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  primaryActionButton: {
    flex: 1.3,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: systemFontBold
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: '#0E2A42',
    borderWidth: 1,
    borderColor: '#1E4D6B',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  secondaryActionText: {
    color: '#38BDF8',
    fontSize: 13,
    fontFamily: systemFontBold
  },
  joinCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0A2236',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1E4D6B'
  },
  joinCodeInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: systemFontBold,
    paddingVertical: 4
  },
  joinCodeSubmitBtn: {
    backgroundColor: '#0284C7',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 11.5,
    color: '#64748B',
    letterSpacing: 0.8,
    fontFamily: systemFontBold
  },
  sectionTitleLive: {
    fontSize: 11.5,
    color: '#0284C7',
    letterSpacing: 0.8,
    fontFamily: systemFontBold
  },
  sectionLink: {
    fontSize: 12,
    color: '#0284C7',
    fontFamily: systemFontMedium
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E'
  },
  liveMatchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    gap: 14
  },
  liveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  liveMatchTitle: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: systemFontBold,
    flex: 1
  },
  liveTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  liveTagText: {
    fontSize: 10,
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  liveScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6
  },
  liveTeamCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1
  },
  liveTeamName: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  liveTeamNameMuted: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: systemFontMedium
  },
  liveScoreBig: {
    fontSize: 22,
    color: '#0284C7',
    fontFamily: systemFontBold,
    fontVariant: ['tabular-nums']
  },
  liveOversSmall: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: systemFontMedium
  },
  liveScoreMuted: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: systemFontMedium
  },
  liveVsText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontFamily: systemFontBold
  },
  liveCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  liveFooterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  liveFooterBtnText: {
    color: '#0284C7',
    fontSize: 12,
    fontFamily: systemFontBold
  },
  liveFooterBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#0284C7',
    borderRadius: 8
  },
  liveFooterBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: systemFontBold
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8
  },
  emptyCardTitle: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: systemFontBold,
    marginTop: 4
  },
  emptyCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: systemFontMedium,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 260
  },
  emptyCardBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6
  },
  emptyCardBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  performersRow: {
    flexDirection: 'row',
    gap: 10
  },
  performerCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6
  },
  performerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 2
  },
  performerBadgeText: {
    fontSize: 9,
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  performerName: {
    fontSize: 12.5,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  performerStat: {
    fontSize: 15,
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  performerStatLabel: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: systemFont
  }
});

export default HomeScreen;
