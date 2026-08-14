import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Alert, Modal, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { systemFont, systemFontMedium, systemFontBold, fontWeights } from '../theme.js';
import { AddTournamentModal } from './modals/AddTournamentModal.jsx';

const TOURNAMENTS_STORAGE_KEY = '@cricflow_tournaments_list';

export function TournamentScreen({ finishedMatches = [], activeMatch = null }) {
  const [filterTab, setFilterTab] = useState('active'); // 'active' | 'completed'
  const [tourneySubTab, setTourneySubTab] = useState('points'); // 'points' | 'fixtures' | 'stats'
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  // Tournaments State
  const [tournaments, setTournaments] = useState([
    {
      id: 'tourney-default-1',
      name: 'Sadokan Champions Trophy 2026',
      code: 'SCT26',
      location: 'Sadokan Stadium, Nagaur',
      teamsCount: 4,
      createdAt: new Date().toISOString(),
      status: 'active'
    }
  ]);

  // Load Saved Tournaments on Mount
  useEffect(() => {
    AsyncStorage.getItem(TOURNAMENTS_STORAGE_KEY)
      .then(raw => {
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTournaments(parsed);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Save Tournaments when updated
  const saveTournaments = (newList) => {
    setTournaments(newList);
    AsyncStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(newList)).catch(() => {});
  };

  // DYNAMICALLY CALCULATE REAL POINTS TABLE & NRR FROM FINISHED MATCHES
  const pointsTable = useMemo(() => {
    const teamsMap = {};

    const getTeamRecord = (teamName, logoKey = 'default-team-1') => {
      const name = String(teamName || 'Team').trim();
      if (!teamsMap[name]) {
        teamsMap[name] = {
          name,
          p: 0,
          w: 0,
          l: 0,
          pts: 0,
          runsScored: 0,
          oversFaced: 0,
          runsConceded: 0,
          oversBowled: 0,
          logoKey
        };
      }
      return teamsMap[name];
    };

    // Initialize Default Teams if no matches exist yet
    tournaments.forEach(tr => {
      (tr.teams || []).forEach((tName, idx) => {
        getTeamRecord(tName, idx % 2 === 0 ? 'default-team-1' : 'default-team-2');
      });
    });

    if (Object.keys(teamsMap).length === 0) {
      getTeamRecord('Sadokan Tigers', 'default-team-1');
      getTeamRecord('Kings 11 Sadokan', 'default-team-2');
    }

    // Aggregate statistics from all completed matches
    (finishedMatches || []).forEach((match) => {
      const t1 = match.team1 || match.teams?.[0];
      const t2 = match.team2 || match.teams?.[1];

      if (!t1?.name || !t2?.name) return;

      const team1Rec = getTeamRecord(t1.name, t1.logoKey || 'default-team-1');
      const team2Rec = getTeamRecord(t2.name, t2.logoKey || 'default-team-2');

      team1Rec.p += 1;
      team2Rec.p += 1;

      const r1 = Number(t1.runs) || 0;
      const ov1 = (Number(t1.legalBalls) || 0) / 6 || 1;
      const r2 = Number(t2.runs) || 0;
      const ov2 = (Number(t2.legalBalls) || 0) / 6 || 1;

      team1Rec.runsScored += r1;
      team1Rec.oversFaced += ov1;
      team1Rec.runsConceded += r2;
      team1Rec.oversBowled += ov2;

      team2Rec.runsScored += r2;
      team2Rec.oversFaced += ov2;
      team2Rec.runsConceded += r1;
      team2Rec.oversBowled += ov1;

      const winner = match.winnerTeamName || (match.winner ? (match.winner.includes(t1.name) ? t1.name : t2.name) : '');
      if (winner === t1.name) {
        team1Rec.w += 1;
        team1Rec.pts += 2;
        team2Rec.l += 1;
      } else if (winner === t2.name) {
        team2Rec.w += 1;
        team2Rec.pts += 2;
        team1Rec.l += 1;
      }
    });

    // Calculate NRR and Rank Teams
    return Object.values(teamsMap || {})
      .map(t => {
        const rrFor = t.oversFaced > 0 ? t.runsScored / t.oversFaced : 0;
        const rrAgainst = t.oversBowled > 0 ? t.runsConceded / t.oversBowled : 0;
        const nrrVal = rrFor - rrAgainst;
        return {
          ...t,
          nrrVal,
          nrr: (nrrVal >= 0 ? '+' : '') + nrrVal.toFixed(3)
        };
      })
      .sort((a, b) => b.pts - a.pts || b.nrrVal - a.nrrVal)
      .map((t, idx) => ({ ...t, rank: idx + 1 }));
  }, [finishedMatches]);

  // DYNAMICALLY CALCULATE PLAYER LEADERBOARDS FROM FINISHED MATCHES
  const leaderboards = useMemo(() => {
    const batters = {};
    const bowlers = {};

    (finishedMatches || []).forEach((match) => {
      if (!match) return;
      [match.team1, match.team2].forEach(team => {
        if (!team) return;
        (team.batting || []).forEach(player => {
          if (!player?.name) return;
          const pName = player.name.trim();
          if (!batters[pName]) batters[pName] = { name: pName, team: team.name, runs: 0, balls: 0, fours: 0, sixes: 0 };
          batters[pName].runs += player.runs || 0;
          batters[pName].balls += player.balls || 0;
          batters[pName].fours += player.fours || 0;
          batters[pName].sixes += player.sixes || 0;
        });

        (team.bowling || []).forEach(b => {
          if (!b?.name) return;
          const bName = b.name.trim();
          if (!bowlers[bName]) bowlers[bName] = { name: bName, team: team.name, wickets: 0, runsConceded: 0, overs: 0 };
          bowlers[bName].wickets += b.wickets || 0;
          bowlers[bName].runsConceded += b.runs || 0;
          bowlers[bName].overs += parseFloat(b.overs || 0) || 0;
        });
      });
    });

    const topBatters = Object.values(batters || {})
      .sort((a, b) => b.runs - a.runs || a.balls - b.balls)
      .slice(0, 5);

    const topBowlers = Object.values(bowlers || {})
      .sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)
      .slice(0, 5);

    return { topBatters, topBowlers };
  }, [finishedMatches]);

  const handleSaveNewTournament = (newTourney) => {
    const tourneyObj = {
      ...newTourney,
      code: (newTourney.name || 'TOUR').slice(0, 4).toUpperCase(),
      location: `${newTourney.city || 'Nagaur'}, Rajasthan`
    };

    saveTournaments([tourneyObj, ...tournaments]);
    Alert.alert('Tournament Created', `"${tourneyObj.name}" has been created and saved successfully.`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* APP THEME MATCHED HERO HEADER */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeaderRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="trophy" size={20} color="#38BDF8" />
              <Text style={styles.heroTitle}>Tournaments</Text>
            </View>
            <Text style={styles.heroSubtitle}>Live Points Table, Standings & Leaderboards</Text>
          </View>

          <TouchableOpacity style={styles.createBtn} onPress={() => setCreateModalVisible(true)}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.createBtnText}>Create</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Bar */}
        <View style={styles.filterRow}>
          {[
            { id: 'active', label: `Active (${tournaments.length})` },
            { id: 'completed', label: 'Completed' }
          ].map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.filterPill, filterTab === t.id && styles.filterPillActive]}
              onPress={() => setFilterTab(t.id)}
            >
              <Text style={[styles.filterPillText, filterTab === t.id && styles.filterPillTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* TOURNAMENTS LIST */}
      {tournaments.map((tourney) => (
        <View key={tourney.id} style={styles.tourneyCard}>
          {/* Card Header */}
          <View style={styles.tourneyHeader}>
            <View style={styles.badgeBox}>
              <MaterialCommunityIcons name="trophy-award" size={22} color="#0284C7" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.tourneyName}>{tourney.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="location-outline" size={12} color="#64748B" />
                <Text style={styles.tourneyMeta}>{tourney.location} • {tourney.teamsCount} Teams</Text>
              </View>
            </View>

            <View style={styles.activePill}>
              <View style={styles.activeDot} />
              <Text style={styles.activePillText}>LIVE</Text>
            </View>
          </View>

          {/* Tab Navigation inside Card */}
          <View style={styles.cardSubTabs}>
            {[
              { id: 'points', label: 'Points Table', icon: 'podium-outline' },
              { id: 'fixtures', label: 'Matches', icon: 'calendar-outline' },
              { id: 'stats', label: 'Leaderboard', icon: 'medal-outline' }
            ].map(sub => (
              <TouchableOpacity
                key={sub.id}
                style={[styles.cardSubTabBtn, tourneySubTab === sub.id && styles.cardSubTabBtnActive]}
                onPress={() => setTourneySubTab(sub.id)}
              >
                <Ionicons
                  name={sub.icon}
                  size={14}
                  color={tourneySubTab === sub.id ? '#0284C7' : '#64748B'}
                />
                <Text style={[styles.cardSubTabText, tourneySubTab === sub.id && styles.cardSubTabTextActive]}>
                  {sub.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TAB 1: REAL POINTS TABLE & NRR */}
          {tourneySubTab === 'points' && (
            <View style={styles.tableBox}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thCell, { width: 28 }]}>#</Text>
                <Text style={[styles.thCell, { flex: 1 }]}>Team</Text>
                <Text style={[styles.thCell, { width: 26, textAlign: 'center' }]}>P</Text>
                <Text style={[styles.thCell, { width: 26, textAlign: 'center' }]}>W</Text>
                <Text style={[styles.thCell, { width: 26, textAlign: 'center' }]}>L</Text>
                <Text style={[styles.thCell, { width: 32, textAlign: 'center' }]}>Pts</Text>
                <Text style={[styles.thCell, { width: 55, textAlign: 'right' }]}>NRR</Text>
              </View>

              {pointsTable.map((row) => (
                <View key={row.name} style={[styles.tableDataRow, row.rank === 1 && styles.tableRowLeader]}>
                  <Text style={[styles.tdCell, { width: 28, fontFamily: systemFontBold, color: row.rank === 1 ? '#0284C7' : '#0F172A' }]}>
                    {row.rank}
                  </Text>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Image
                      source={row.logoKey === 'default-team-1' ? require('../../assets/default_team_1.png') : require('../../assets/default_team_2.png')}
                      style={{ width: 18, height: 18, resizeMode: 'contain' }}
                    />
                    <Text style={[styles.tdCell, { fontFamily: systemFontBold, color: '#0F172A' }]} numberOfLines={1}>
                      {row.name}
                    </Text>
                  </View>
                  <Text style={[styles.tdCell, { width: 26, textAlign: 'center' }]}>{row.p}</Text>
                  <Text style={[styles.tdCell, { width: 26, textAlign: 'center', color: '#16A34A', fontFamily: systemFontBold }]}>{row.w}</Text>
                  <Text style={[styles.tdCell, { width: 26, textAlign: 'center', color: '#DC2626' }]}>{row.l}</Text>
                  <Text style={[styles.tdCell, { width: 32, textAlign: 'center', fontFamily: systemFontBold, color: '#0284C7' }]}>{row.pts}</Text>
                  <Text style={[styles.tdCell, { width: 55, textAlign: 'right', fontSize: 10, color: '#64748B', fontFamily: systemFontMedium }]}>{row.nrr}</Text>
                </View>
              ))}
            </View>
          )}

          {/* TAB 2: MATCHES / FIXTURES */}
          {tourneySubTab === 'fixtures' && (
            <View style={{ gap: 8 }}>
              {activeMatch ? (
                <View style={styles.matchRowCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.matchCardTitle}>{activeMatch.matchTitle || 'Live Match'}</Text>
                    <View style={styles.liveTag}><Text style={styles.liveTagText}>LIVE SCORE</Text></View>
                  </View>
                  <Text style={styles.matchCardScore}>
                    {activeMatch.team1?.name}: {activeMatch.team1?.score || '0-0'}
                  </Text>
                  <Text style={styles.matchCardScore}>
                    {activeMatch.team2?.name}: {activeMatch.team2?.score || '0-0'}
                  </Text>
                </View>
              ) : null}

              {(finishedMatches || []).slice(0, 3).map((fm) => (
                <View key={fm.id} style={styles.matchRowCard}>
                  <Text style={styles.matchCardTitle}>{fm.title || fm.matchTitle}</Text>
                  <Text style={styles.matchCardResult}>{fm.winner || fm.resultText || 'Match Finished'}</Text>
                  <Text style={styles.matchCardDate}>{fm.dateText || 'Recent Match'}</Text>
                </View>
              ))}

              {(tourney.fixtures || []).map((fix) => (
                <View key={fix.id} style={styles.matchRowCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.matchCardTitle}>{fix.team1} vs {fix.team2}</Text>
                    <View style={styles.upcomingTag}>
                      <Text style={styles.upcomingTagText}>{fix.status || 'UPCOMING'}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Ionicons name="location-outline" size={12} color="#64748B" />
                    <Text style={styles.matchCardDate}>{fix.venue} • {fix.dateText}</Text>
                  </View>
                </View>
              ))}

              {(!activeMatch && (!finishedMatches || finishedMatches.length === 0) && (!tourney.fixtures || tourney.fixtures.length === 0)) && (
                <View style={styles.emptyCard}>
                  <Ionicons name="calendar-outline" size={24} color="#94A3B8" />
                  <Text style={styles.emptyCardText}>No matches scheduled yet for this tournament.</Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 3: PLAYER LEADERBOARDS */}
          {tourneySubTab === 'stats' && (
            <View style={{ gap: 10 }}>
              {/* Orange Cap */}
              <View style={styles.cardBox}>
                <View style={styles.cardBoxHeader}>
                  <Ionicons name="shirt-outline" size={16} color="#D97706" />
                  <Text style={styles.cardBoxTitle}>Orange Cap (Most Runs)</Text>
                </View>
                {leaderboards.topBatters.length > 0 ? (
                  leaderboards.topBatters.map((b, idx) => (
                    <View key={b.name} style={styles.leaderRow}>
                      <Text style={styles.leaderRank}>#{idx + 1}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.leaderName}>{b.name}</Text>
                        <Text style={styles.leaderSub}>{b.team}</Text>
                      </View>
                      <Text style={styles.leaderStat}>{b.runs} Runs <Text style={{ fontSize: 10, color: '#64748B' }}>({b.balls}b)</Text></Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyCardText}>Play and finish matches to populate batting leaderboard.</Text>
                )}
              </View>

              {/* Purple Cap */}
              <View style={styles.cardBox}>
                <View style={styles.cardBoxHeader}>
                  <Ionicons name="baseball-outline" size={16} color="#0284C7" />
                  <Text style={styles.cardBoxTitle}>Purple Cap (Most Wickets)</Text>
                </View>
                {leaderboards.topBowlers.length > 0 ? (
                  leaderboards.topBowlers.map((b, idx) => (
                    <View key={b.name} style={styles.leaderRow}>
                      <Text style={styles.leaderRank}>#{idx + 1}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.leaderName}>{b.name}</Text>
                        <Text style={styles.leaderSub}>{b.team}</Text>
                      </View>
                      <Text style={styles.leaderStat}>{b.wickets} Wkts <Text style={{ fontSize: 10, color: '#64748B' }}>({b.runsConceded}r)</Text></Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyCardText}>Play and finish matches to populate bowling leaderboard.</Text>
                )}
              </View>
            </View>
          )}
        </View>
      ))}

      {/* CRICHEROES-STYLE ADD TOURNAMENT / SERIES MODAL */}
      <AddTournamentModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSubmitTournament={handleSaveNewTournament}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  content: {
    padding: 14,
    gap: 12,
    paddingBottom: 24
  },
  heroCard: {
    backgroundColor: '#071B2C',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  heroTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  heroSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: systemFontMedium,
    marginTop: 2
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20
  },
  createBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155'
  },
  filterPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  filterPillText: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: systemFontMedium
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  tourneyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12
  },
  tourneyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  badgeBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  tourneyName: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  tourneyMeta: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: systemFontMedium
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B45309'
  },
  activePillText: {
    fontSize: 10,
    color: '#B45309',
    fontFamily: systemFontBold
  },
  cardSubTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 4
  },
  cardSubTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 6
  },
  cardSubTabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#0284C7'
  },
  cardSubTabText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: systemFontMedium
  },
  cardSubTabTextActive: {
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  tableBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden'
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  thCell: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: systemFontBold
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  tableRowLeader: {
    backgroundColor: '#F0F9FF'
  },
  tdCell: {
    fontSize: 11,
    color: '#334155',
    fontFamily: systemFontMedium
  },
  matchRowCard: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4
  },
  matchCardTitle: {
    fontSize: 12,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  matchCardResult: {
    fontSize: 11,
    color: '#0284C7',
    fontFamily: systemFontMedium
  },
  matchCardDate: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: systemFontMedium
  },
  matchCardScore: {
    fontSize: 11,
    color: '#334155',
    fontFamily: systemFontBold
  },
  liveTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  liveTagText: {
    fontSize: 9,
    color: '#15803D',
    fontFamily: systemFontBold
  },
  upcomingTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  upcomingTagText: {
    fontSize: 9,
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  cardBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8
  },
  cardBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 6
  },
  cardBoxTitle: {
    fontSize: 12,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4
  },
  leaderRank: {
    fontSize: 11,
    color: '#0284C7',
    fontFamily: systemFontBold,
    width: 24
  },
  leaderName: {
    fontSize: 12,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  leaderSub: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: systemFontMedium
  },
  leaderStat: {
    fontSize: 11,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  emptyCardText: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: systemFontMedium,
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 27, 44, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10
  },
  modalTitle: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  inputLabel: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: systemFontBold,
    marginBottom: 4
  },
  textInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
    fontFamily: systemFontMedium
  },
  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: systemFontBold
  },
  submitBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: systemFontBold
  }
});

export default TournamentScreen;
