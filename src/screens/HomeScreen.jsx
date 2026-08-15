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
import { AppBottomNav } from '../components/navigation/AppBottomNav.jsx';
import { AboutAppScreen } from '../components/AboutAppScreen.jsx';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
import { LinearGradient } from 'expo-linear-gradient';

export function HomeScreen({
  openScorerScreen,
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
  setupPlayerNames = [],
  searchNeedle = '',
  setSelectedPlayerName,
  setCurrentScreen,
  renderSetupPlayerPhoto,
  activeMatchVisible,
  renderActiveMatchListCard,
  recentFinishedMatches = [],
  renderFinishedMatchListCard,
  visibleFinishedMatches = [],
  activeMatch,
  TOP_BATTERS = [],
  TOP_BOWLERS = [],
  TOP_ALLROUNDERS = [],
  localPlayersList = [],
  MASTER_PLAYERS_DB = [],
  getSetupPlayerProfile,
  setSelectedPlayerProfile,
  styles,
  isScorerUnlocked
}) {
  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image source={require('../../assets/logo.png')} style={styles.logoImg} />
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
        scrollEventThrottle={16}
        removeClippedSubviews={true}
        overScrollMode="never"
        decelerationRate="normal"
        nestedScrollEnabled={true}
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
          {/* SEARCHED PLAYERS SECTION */}
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
                      const dbFound = localPlayersList.find(p => p && p.name && p.name.trim().toLowerCase() === pName.trim().toLowerCase())
                        || MASTER_PLAYERS_DB.find(p => p && p.name && p.name.trim().toLowerCase() === pName.trim().toLowerCase());
                      const profile = dbFound || (getSetupPlayerProfile ? getSetupPlayerProfile(pName) : { name: pName, role: 'Local Player' });
                      if (setSelectedPlayerProfile) setSelectedPlayerProfile(profile);
                      setSelectedPlayerName(pName);
                      setCurrentScreen('playerProfile');
                    }}
                  >
                    {renderSetupPlayerPhoto && renderSetupPlayerPhoto(pName, 32)}
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
          {bottomNavTab === 'matches' && matchesSubTab === 'live' && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: fontWeights.bold, color: '#64748B', fontFamily: systemFont, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  {activeMatchVisible ? 'LIVE MATCH' : 'FEATURED MATCH'}
                </Text>
              </View>

              {activeMatchVisible ? (
                renderActiveMatchListCard && renderActiveMatchListCard()
              ) : (
                <View style={styles.idleCard}>
                  <View style={styles.idleIconBg}><MaterialCommunityIcons name="cricket" size={28} color="#0284C7" /></View>
                  <Text style={styles.idleTitle}>No Live Match Currently</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: fontWeights.medium, marginTop: 4, fontFamily: systemFont }}>Live match scorecards will appear here</Text>
                </View>
              )}

              {recentFinishedMatches && recentFinishedMatches.length > 0 ? (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: 14 }]}>RECENT MATCH RESULTS</Text>
                  {recentFinishedMatches.map(m => renderFinishedMatchListCard && renderFinishedMatchListCard(m))}
                </>
              ) : null}
            </>
          )}

          {/* 2. FINISHED MATCHES ARCHIVE VIEW */}
          {bottomNavTab === 'matches' && matchesSubTab === 'finished' && (
            <>
              {(() => {
                if (!visibleFinishedMatches || visibleFinishedMatches.length === 0) {
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
                    {groups[dateKey].map(f => renderFinishedMatchListCard && renderFinishedMatchListCard(f))}
                  </View>
                ));
              })()}
            </>
          )}

          {/* 3. RANKINGS LEADERBOARD VIEW */}
          {bottomNavTab === 'matches' && matchesSubTab === 'playerStats' && (
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
              {/* COLUMN HEADER (CRICBUZZ / ICC STYLE) */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 10,
                marginTop: 2
              }}>
                <Text style={{ fontSize: 12, fontWeight: fontWeights.bold, color: '#94A3B8', fontFamily: systemFontMedium, letterSpacing: 0.3 }}>
                  Rank
                </Text>
                <Text style={{ fontSize: 12, fontWeight: fontWeights.bold, color: '#94A3B8', fontFamily: systemFontMedium, letterSpacing: 0.3 }}>
                  {statsCategory === 'batters' ? 'Runs (SR)' : (statsCategory === 'bowlers' ? 'Wkts (ECO)' : 'MVP Points')}
                </Text>
              </View>

              {/* BATTERS RANKINGS */}
              {statsCategory === 'batters' && (TOP_BATTERS && TOP_BATTERS.length > 0) && (
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  overflow: 'hidden',
                  marginBottom: 16
                }}>
                  {TOP_BATTERS.map((b, idx) => {
                    const isLast = idx === TOP_BATTERS.length - 1;

                    return (
                      <TouchableOpacity
                        key={`bat-${b.name}-${b.rank}`}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderBottomWidth: isLast ? 0 : 1,
                          borderBottomColor: '#F1F5F9'
                        }}
                        onPress={() => {
                          const dbFound = localPlayersList.find(p => p && p.name && p.name.trim().toLowerCase() === b.name.trim().toLowerCase())
                            || MASTER_PLAYERS_DB.find(p => p && p.name && p.name.trim().toLowerCase() === b.name.trim().toLowerCase());
                          const profile = dbFound || (getSetupPlayerProfile ? getSetupPlayerProfile(b.name) : { name: b.name, role: b.role || 'Local Player', photoUrl: b.photoUrl, city: b.city });
                          if (setSelectedPlayerProfile) setSelectedPlayerProfile(profile);
                          setSelectedPlayerName(b.name);
                          setCurrentScreen('playerProfile');
                        }}
                      >
                        <Text style={{
                          width: 28,
                          fontSize: 15,
                          fontWeight: fontWeights.bold,
                          color: b.rank <= 3 ? '#0F172A' : '#475569',
                          fontFamily: systemFontBold
                        }}>
                          {b.rank}
                        </Text>

                        <PlayerAvatar name={b.name} photoUrl={b.photoUrl} size={48} />

                        <View style={{ flex: 1, marginLeft: 14 }}>
                          <Text style={{ fontSize: 15.5, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFontBold }} numberOfLines={1}>
                            {b.name}
                          </Text>
                          <Text style={{ fontSize: 12.5, color: '#64748B', marginTop: 2, fontFamily: systemFontMedium }} numberOfLines={1}>
                            {b.city || 'Sadokan'}
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 15.5, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFontBold }}>
                            {b.runs}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 1, fontFamily: systemFont }}>
                            SR {b.sr}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {statsCategory === 'batters' && (!TOP_BATTERS || TOP_BATTERS.length === 0) && (
                <View style={[styles.idleCard, { borderRadius: 10 }]}>
                  <Text style={styles.idleTitle}>No Batting Rankings Yet</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 4, fontFamily: systemFont }}>Play ground matches to rank top batters automatically</Text>
                </View>
              )}

              {/* BOWLERS RANKINGS */}
              {statsCategory === 'bowlers' && (TOP_BOWLERS && TOP_BOWLERS.length > 0) && (
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  overflow: 'hidden',
                  marginBottom: 16
                }}>
                  {TOP_BOWLERS.map((b, idx) => {
                    const isLast = idx === TOP_BOWLERS.length - 1;

                    return (
                      <TouchableOpacity
                        key={`bowl-${b.name}-${b.rank}`}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderBottomWidth: isLast ? 0 : 1,
                          borderBottomColor: '#F1F5F9'
                        }}
                        onPress={() => {
                          const dbFound = localPlayersList.find(p => p && p.name && p.name.trim().toLowerCase() === b.name.trim().toLowerCase())
                            || MASTER_PLAYERS_DB.find(p => p && p.name && p.name.trim().toLowerCase() === b.name.trim().toLowerCase());
                          const profile = dbFound || (getSetupPlayerProfile ? getSetupPlayerProfile(b.name) : { name: b.name, role: b.role || 'Local Player', photoUrl: b.photoUrl, city: b.city });
                          if (setSelectedPlayerProfile) setSelectedPlayerProfile(profile);
                          setSelectedPlayerName(b.name);
                          setCurrentScreen('playerProfile');
                        }}
                      >
                        <Text style={{
                          width: 28,
                          fontSize: 15,
                          fontWeight: fontWeights.bold,
                          color: b.rank <= 3 ? '#0F172A' : '#475569',
                          fontFamily: systemFontBold
                        }}>
                          {b.rank}
                        </Text>

                        <PlayerAvatar name={b.name} photoUrl={b.photoUrl} size={48} />

                        <View style={{ flex: 1, marginLeft: 14 }}>
                          <Text style={{ fontSize: 15.5, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFontBold }} numberOfLines={1}>
                            {b.name}
                          </Text>
                          <Text style={{ fontSize: 12.5, color: '#64748B', marginTop: 2, fontFamily: systemFontMedium }} numberOfLines={1}>
                            {b.city || 'Sadokan'}
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 15.5, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFontBold }}>
                            {b.wickets} Wkts
                          </Text>
                          <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 1, fontFamily: systemFont }}>
                            ECO {b.econ}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {statsCategory === 'bowlers' && (!TOP_BOWLERS || TOP_BOWLERS.length === 0) && (
                <View style={[styles.idleCard, { borderRadius: 10 }]}>
                  <Text style={styles.idleTitle}>No Bowling Rankings Yet</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 4, fontFamily: systemFont }}>Play ground matches to rank top bowlers automatically</Text>
                </View>
              )}

              {/* ALL-ROUNDERS RANKINGS */}
              {statsCategory === 'allrounders' && (TOP_ALLROUNDERS && TOP_ALLROUNDERS.length > 0) && (
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  overflow: 'hidden',
                  marginBottom: 16
                }}>
                  {TOP_ALLROUNDERS.map((b, idx) => {
                    const isLast = idx === TOP_ALLROUNDERS.length - 1;

                    return (
                      <TouchableOpacity
                        key={`all-${b.name}-${b.rank}`}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderBottomWidth: isLast ? 0 : 1,
                          borderBottomColor: '#F1F5F9'
                        }}
                        onPress={() => {
                          const dbFound = localPlayersList.find(p => p && p.name && p.name.trim().toLowerCase() === b.name.trim().toLowerCase())
                            || MASTER_PLAYERS_DB.find(p => p && p.name && p.name.trim().toLowerCase() === b.name.trim().toLowerCase());
                          const profile = dbFound || (getSetupPlayerProfile ? getSetupPlayerProfile(b.name) : { name: b.name, role: b.role || 'Local Player', photoUrl: b.photoUrl, city: b.city });
                          if (setSelectedPlayerProfile) setSelectedPlayerProfile(profile);
                          setSelectedPlayerName(b.name);
                          setCurrentScreen('playerProfile');
                        }}
                      >
                        <Text style={{
                          width: 28,
                          fontSize: 15,
                          fontWeight: fontWeights.bold,
                          color: b.rank <= 3 ? '#0F172A' : '#475569',
                          fontFamily: systemFontBold
                        }}>
                          {b.rank}
                        </Text>

                        <PlayerAvatar name={b.name} photoUrl={b.photoUrl} size={48} />

                        <View style={{ flex: 1, marginLeft: 14 }}>
                          <Text style={{ fontSize: 15.5, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFontBold }} numberOfLines={1}>
                            {b.name}
                          </Text>
                          <Text style={{ fontSize: 12.5, color: '#64748B', marginTop: 2, fontFamily: systemFontMedium }} numberOfLines={1}>
                            {b.city || 'Sadokan'}
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 15.5, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFontBold }}>
                            {b.pts}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 1, fontFamily: systemFont }}>
                            MVP Points
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {statsCategory === 'allrounders' && (!TOP_ALLROUNDERS || TOP_ALLROUNDERS.length === 0) && (
                <View style={[styles.idleCard, { borderRadius: 10 }]}>
                  <Text style={styles.idleTitle}>No All-Rounder Rankings Yet</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 4, fontFamily: systemFont }}>Play ground matches to rank top all-rounders automatically</Text>
                </View>
              )}
            </>
          )}

          {/* ABOUT APP TAB */}
          {bottomNavTab === 'about' && (
            <AboutAppScreen />
          )}
        </View>
      </ScrollView>

      {/* INDUSTRIAL STANDARD BOTTOM NAVIGATION BAR */}
      <AppBottomNav
        activeTab={bottomNavTab}
        onTabChange={setBottomNavTab}
      />
    </View>
  );
}

export default HomeScreen;
