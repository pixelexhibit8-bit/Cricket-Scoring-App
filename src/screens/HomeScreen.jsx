import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Keyboard
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { systemFont, systemFontBold, systemFontMedium, fontWeights, theme, typeScale } from '../theme.js';
import { MatchListScoreCard } from '../components/MatchListScoreCard.jsx';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';

export function HomeScreen({
  openScorerScreen,
  setIsMenuOpen,
  searchQuery,
  setSearchQuery,
  bottomNavTab,
  setBottomNavTab,
  matchesSubTab,
  setMatchesSubTab,
  statsCategory,
  setStatsCategory,
  refreshing,
  handlePullToRefresh,
  setupPlayerNames,
  searchNeedle,
  setSelectedPlayerName,
  setCurrentScreen,
  renderSetupPlayerPhoto,
  activeMatchVisible,
  renderActiveMatchListCard,
  recentFinishedMatch,
  renderFinishedMatchListCard,
  visibleFinishedMatches,
  finishedArchive,
  activeMatch,
  topBatters,
  topBowlers,
  topAllrounders,
  styles,
  isScorerUnlocked
}) {
  return (
          ) : (
            /* ——— HOME DASHBOARD ——— */
            <View style={{ flex: 1 }}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logoRow}>
                  <Image source={require('./assets/logo.png')} style={styles.logoImg} />
                  <Text style={styles.logoText}>Cric <Text style={styles.logoAccent}>Scorer</Text></Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 20,
                      backgroundColor: activeMatch && (activeMatch.phase === 'playing' || activeMatch.phase === 'inningBreak') && isScorerUnlocked
                        ? '#059669'
                        : '#0284C7',
                    }}
                    onPress={openScorerScreen}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={activeMatch && (activeMatch.phase === 'playing' || activeMatch.phase === 'inningBreak') && isScorerUnlocked
                        ? "scoreboard"
                        : "key-outline"
                      }
                      size={15}
                      color="#FFFFFF"
                    />
                    <Text style={{
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontFamily: systemFontBold,
                    }}>
                      {activeMatch && (activeMatch.phase === 'playing' || activeMatch.phase === 'inningBreak') && isScorerUnlocked
                        ? 'Scorer Console'
                        : 'Scorer Login'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsMenuOpen(true)}
                    style={{ paddingHorizontal: 4, paddingVertical: 4 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="menu" size={26} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Search */}
              <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                  <Ionicons name="search" size={17} color="#0284C7" style={{ marginLeft: 12 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search player, team, ground..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#94A3B8"
                    returnKeyType="search"
                  />
                  {Boolean(searchQuery) && (
                    <TouchableOpacity
                      onPress={() => {
                        setSearchQuery('');
                        Keyboard.dismiss();
                      }}
                      style={{ padding: 8, marginRight: 4 }}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* MATCHES SUB-PILLS (SHOWN WHEN MATCHES TAB IS ACTIVE) */}
              {bottomNavTab === 'matches' && (
                <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                  {[
                    { id: 'live', label: 'Live', icon: 'radio-outline' },
                    { id: 'finished', label: 'Finished', icon: 'trophy-outline' },
                    { id: 'playerStats', label: 'Rankings', icon: 'stats-chart-outline' }
                  ].map(t => {
                    const active = matchesSubTab === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => setMatchesSubTab(t.id)}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: active ? '#0284C7' : '#F1F5F9',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'row',
                          gap: 5
                        }}
                      >
                        <Ionicons name={t.icon} size={13} color={active ? '#FFFFFF' : '#475569'} />
                        <Text style={{ fontSize: 12, fontWeight: fontWeights.bold, color: active ? '#FFFFFF' : '#475569', fontFamily: systemFont }}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <ScrollView
                style={{ flex: 1, backgroundColor: '#F8FAFC' }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                onScrollBeginDrag={Keyboard.dismiss}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handlePullToRefresh}
                    colors={['#0284C7']}
                    tintColor="#0284C7"
                  />
                }
              >

                <View style={styles.tabContent}>
                  {/* SEARCHED PLAYERS SECTION (SEARCH BY NAME OR MOBILE NUMBER) */}
                  {searchNeedle.length > 0 && (() => {
                    const matchedPlayers = setupPlayerNames.filter(pName => {
                      if (!searchNeedle) return false;
                      const q = searchNeedle.toLowerCase().trim();
                      const qClean = q.replace(/\D/g, '');
                      const dbMatch = localPlayersList.find(p => p && p.name && p.name.trim().toLowerCase() === pName.trim().toLowerCase());
                      const phone = dbMatch?.phone || dbMatch?.mobile || '';
                      const phoneClean = String(phone).replace(/\D/g, '');

                      const matchName = pName.toLowerCase().includes(q);
                      const matchPhoneRaw = Boolean(phone && String(phone).toLowerCase().includes(q));
                      const matchPhoneClean = Boolean(qClean.length > 0 && phoneClean.length > 0 && phoneClean.includes(qClean));

                      return matchName || matchPhoneRaw || matchPhoneClean;
                    });

                    if (matchedPlayers.length === 0) {
                      return (
                        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12, alignItems: 'center', gap: 8 }}>
                          <Ionicons name="search-outline" size={24} color="#94A3B8" />
                          <Text style={{ fontSize: 13, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>
                            No Player Found
                          </Text>
                          <Text style={{ fontSize: 11, color: '#64748B', textAlign: 'center', fontFamily: systemFontMedium }}>
                            No player matching "{searchNeedle}" in name or mobile number
                          </Text>
                          <TouchableOpacity
                            onPress={() => setCurrentScreen('matchSelection')}
                            style={{ marginTop: 4, backgroundColor: '#0284C7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                          >
                            <Ionicons name="person-add" size={15} color="#FFFFFF" />
                            <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: systemFontBold }}>
                              + Add New Player
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    }

                    return (
                      <View style={{ marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>PLAYERS ({matchedPlayers.length})</Text>
                          <TouchableOpacity
                            onPress={() => {
                              setSearchQuery('');
                              Keyboard.dismiss();
                            }}
                            style={{ paddingHorizontal: 6, paddingVertical: 2 }}
                            activeOpacity={0.7}
                          >
                            <Text style={{ fontSize: 11, color: '#0284C7', fontFamily: systemFontBold }}>Clear</Text>
                          </TouchableOpacity>
                        </View>
                        {matchedPlayers.slice(0, 5).map(pName => (
                          <TouchableOpacity
                            key={pName}
                            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 6, gap: 10 }}
                            onPress={() => {
                              const profile = getSetupPlayerProfile(pName) || { name: pName, role: 'Local Player' };
                              setSelectedPlayerProfile(profile);
                              setSelectedPlayerName(pName);
                              setCurrentScreen('playerProfile');
                            }}
                          >
                            {renderSetupPlayerPhoto(pName, 32)}
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>{pName}</Text>
                              {(() => {
                                const dbFound = localPlayersList.find(p => p && p.name && p.name.trim().toLowerCase() === pName.trim().toLowerCase())
                                  || MASTER_PLAYERS_DB.find(p => p && p.name && p.name.trim().toLowerCase() === pName.trim().toLowerCase());
                                const pRole = dbFound?.role || 'Local Player';
                                return (
                                  <Text style={{ fontSize: 11, color: '#0284C7', fontFamily: systemFontBold, marginTop: 1 }}>
                                    {pRole}
                                  </Text>
                                );
                              })()}
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#0284C7" />
                          </TouchableOpacity>
                        ))}
                      </View>
                    );
                  })()}

                  {/* 1. LIVE MATCHES VIEW */}
                  {matchesSubTab === 'live' && (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 }}>
                        <Text style={{ fontSize: 12, fontWeight: fontWeights.bold, color: '#64748B', fontFamily: systemFont, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          {activeMatchVisible ? 'LIVE MATCH' : 'FEATURED MATCH'}
                        </Text>
                      </View>

                      {activeMatchVisible ? (
                        renderActiveMatchListCard()
                      ) : (
                        <View style={styles.idleCard}>
                          <View style={styles.idleIconBg}><MaterialCommunityIcons name="cricket" size={28} color="#0284C7" /></View>
                          <Text style={styles.idleTitle}>No Live Match Currently</Text>
                          <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: fontWeights.medium, marginTop: 4, fontFamily: systemFont }}>Live match scorecards will appear here</Text>
                        </View>
                      )}

                      {recentFinishedMatches.length > 0 ? (
                        <>
                          <Text style={[styles.sectionLabel, { marginTop: 14 }]}>RECENT MATCH RESULTS</Text>
                          {recentFinishedMatches.map(m => renderFinishedMatchListCard(m))}
                        </>
                      ) : null}
                    </>
                  )}

                  {/* 2. FINISHED MATCHES ARCHIVE VIEW */}
                  {matchesSubTab === 'finished' && (
                    <>
                      {(() => {
                        if (visibleFinishedMatches.length === 0) {
                          return (
                            <View style={[styles.idleCard, { borderRadius: 8 }]}>
                              <Text style={styles.idleTitle}>No Finished Match Yet</Text>
                              <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: systemFont }}>Completed matches will be saved date-wise here</Text>
                            </View>
                          );
                        }
                        const groups = {};
                        visibleFinishedMatches.forEach(m => {
                          const dateLabel = m.dateLabel || (m.dateText ? m.dateText.split(',')[0] : 'Recent Matches');
                          if (!groups[dateLabel]) groups[dateLabel] = [];
                          groups[dateLabel].push(m);
                        });

                        return Object.keys(groups).map(dateKey => (
                          <View key={dateKey} style={{ marginBottom: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, paddingHorizontal: 4 }}>
                              <Ionicons name="calendar-outline" size={14} color="#0284C7" />
                              <Text style={{ fontSize: 12, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>{dateKey}</Text>
                              <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0', marginLeft: 4 }} />
                            </View>
                            {groups[dateKey].map(f => renderFinishedMatchListCard(f))}
                          </View>
                        ));
                      })()}
                    </>
                  )}

                  {/* 3. RANKINGS LEADERBOARD VIEW */}
                  {matchesSubTab === 'playerStats' && (
                    <>
                      <Text style={styles.sectionLabel}>PLAYER LEADERBOARD RANKINGS</Text>
                      <View style={styles.subFilterRow}>
                        <TouchableOpacity style={[styles.subFilterBtn, statsCategory === 'batters' && styles.subFilterActive]} onPress={() => setStatsCategory('batters')}>
                          <MaterialCommunityIcons name="cricket" size={15} color={statsCategory === 'batters' ? '#FFFFFF' : '#475569'} />
                          <Text style={[styles.subFilterText, statsCategory === 'batters' && { color: '#FFFFFF' }]}>Batters</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.subFilterBtn, statsCategory === 'bowlers' && styles.subFilterActive]} onPress={() => setStatsCategory('bowlers')}>
                          <MaterialCommunityIcons name="baseball" size={15} color={statsCategory === 'bowlers' ? '#FFFFFF' : '#475569'} />
                          <Text style={[styles.subFilterText, statsCategory === 'bowlers' && { color: '#FFFFFF' }]}>Bowlers</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.subFilterBtn, statsCategory === 'allrounders' && styles.subFilterActive]} onPress={() => setStatsCategory('allrounders')}>
                          <MaterialCommunityIcons name="star-circle-outline" size={15} color={statsCategory === 'allrounders' ? '#FFFFFF' : '#475569'} />
                          <Text style={[styles.subFilterText, statsCategory === 'allrounders' && { color: '#FFFFFF' }]}>All-Rounders</Text>
                        </TouchableOpacity>
                      </View>
                      {statsCategory === 'batters' && TOP_BATTERS.map(b => (
                        <View key={b.rank} style={styles.rankItem}>
                          <View style={styles.rankBadge}><Text style={styles.rankBadgeText}>#{b.rank}</Text></View>
                          <View style={{ flex: 1 }}><Text style={styles.rankName}>{b.name}</Text><Text style={styles.rankSub}>{b.team} - {b.badge}</Text></View>
                          <Text style={styles.rankVal}>{b.runs} Runs</Text>
                        </View>
                      ))}
                      {statsCategory === 'batters' && TOP_BATTERS.length === 0 && (
                        <View style={[styles.idleCard, { borderRadius: 10 }]}>
                          <Text style={styles.idleTitle}>No Batting Rankings Yet</Text>
                        </View>
                      )}

                      {statsCategory === 'bowlers' && TOP_BOWLERS.map(b => (
                        <View key={b.rank} style={styles.rankItem}>
                          <View style={[styles.rankBadge, { backgroundColor: '#EDE9FE' }]}><Text style={[styles.rankBadgeText, { color: '#6D28D9' }]}>#{b.rank}</Text></View>
                          <View style={{ flex: 1 }}><Text style={styles.rankName}>{b.name}</Text><Text style={styles.rankSub}>{b.team} - {b.badge}</Text></View>
                          <Text style={[styles.rankVal, { color: '#6D28D9' }]}>{b.wickets} Wkts</Text>
                        </View>
                      ))}
                      {statsCategory === 'bowlers' && TOP_BOWLERS.length === 0 && (
                        <View style={[styles.idleCard, { borderRadius: 10 }]}>
                          <Text style={styles.idleTitle}>No Bowling Rankings Yet</Text>
                        </View>
                      )}

                      {statsCategory === 'allrounders' && TOP_ALLROUNDERS.map(b => (
                        <View key={b.rank} style={styles.rankItem}>
                          <View style={[styles.rankBadge, { backgroundColor: '#FEF3C7' }]}><Text style={[styles.rankBadgeText, { color: '#B45309' }]}>#{b.rank}</Text></View>
                          <View style={{ flex: 1 }}><Text style={styles.rankName}>{b.name}</Text><Text style={styles.rankSub}>{b.team} - {b.badge}</Text></View>
                          <Text style={[styles.rankVal, { color: '#B45309' }]}>{b.pts}</Text>
                        </View>
                      ))}
                      {statsCategory === 'allrounders' && TOP_ALLROUNDERS.length === 0 && (
                        <View style={[styles.idleCard, { borderRadius: 10 }]}>
                          <Text style={styles.idleTitle}>No All-Rounder Rankings Yet</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>

                {/* 3. TOURNAMENT TAB */}
                {bottomNavTab === 'tournament' && (
                  <TournamentScreen finishedMatches={finishedArchive} activeMatch={activeMatch} />
                )}

                {/* 4. ABOUT APP TAB */}
                {bottomNavTab === 'about' && (
                  <AboutAppScreen />
                )}

              </ScrollView>
            </View>
          )}

        </SafeAreaView>

  );
}
