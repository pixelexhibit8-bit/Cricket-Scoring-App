import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { systemFont, systemFontBold, systemFontMedium } from '../../theme.js';
import { TeamIdentityMark } from '../TeamIdentityMark.jsx';
import { PlayerAvatar } from '../PlayerAvatar.jsx';
import { getPlayerMatchStatus } from '../../utils/cricketUtils.js';
import { showToast } from '../../services/toastService.js';

export function SquadSelectorModal({
  visible,
  onClose,
  activeMatch = null,
  team1Name: propTeam1Name,
  team2Name: propTeam2Name,
  team1LogoKey: propTeam1LogoKey,
  team2LogoKey: propTeam2LogoKey,
  team1Roster: propTeam1Roster,
  team2Roster: propTeam2Roster,
  allPlayersPool = [],
  localPlayersDb = [],
  onMoveToTeam,
  onMovePlayer,
  onOpenAddPlayerModal,
  onOpenSquadPreview,
  onEditPlayerPhoto
}) {
  const [activeTab, setActiveTab] = useState('team1'); // 'team1' | 'team2'
  const [searchQuery, setSearchQuery] = useState('');

  const moveHandler = onMoveToTeam || onMovePlayer;

  const team1Name = propTeam1Name || activeMatch?.teams?.[0]?.name || activeMatch?.innings?.[0]?.battingTeam?.name || 'Team 1';
  const team2Name = propTeam2Name || activeMatch?.teams?.[1]?.name || activeMatch?.innings?.[0]?.bowlingTeam?.name || 'Team 2';
  const team1LogoKey = propTeam1LogoKey || activeMatch?.teams?.[0]?.logoKey || 'csk';
  const team2LogoKey = propTeam2LogoKey || activeMatch?.teams?.[1]?.logoKey || 'rcb';
  const team1Roster = propTeam1Roster || activeMatch?.playingXI?.[team1Name] || activeMatch?.teams?.[0]?.roster || [];
  const team2Roster = propTeam2Roster || activeMatch?.playingXI?.[team2Name] || activeMatch?.teams?.[1]?.roster || [];

  const activeTeamName = activeTab === 'team1' ? team1Name : team2Name;
  const activeTeamLogoKey = activeTab === 'team1' ? team1LogoKey : team2LogoKey;
  const activeRoster = activeTab === 'team1' ? team1Roster : team2Roster;
  const otherTeamName = activeTab === 'team1' ? team2Name : team1Name;
  const otherRoster = activeTab === 'team1' ? team2Roster : team1Roster;

  const filteredPlayers = allPlayersPool.filter(name => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const qClean = q.replace(/\D/g, '');
    const dbMatch = (localPlayersDb || []).find(p => p && p.name && p.name.trim().toLowerCase() === name.trim().toLowerCase());
    const phone = dbMatch?.phone || dbMatch?.mobile || '';
    const phoneClean = String(phone).replace(/\D/g, '');

    const matchName = name.toLowerCase().includes(q);
    const matchPhoneRaw = Boolean(phone && String(phone).toLowerCase().includes(q));
    const matchPhoneClean = Boolean(qClean.length > 0 && phoneClean.includes(qClean));

    return matchName || matchPhoneRaw || matchPhoneClean;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Clean Light Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onClose} style={styles.headerLeftBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>
              {activeMatch ? 'Edit Squad (Live Match)' : 'Select Squad Players'}
            </Text>
            {activeMatch ? (
              <Text style={{ fontSize: 10.5, color: '#0284C7', fontFamily: systemFontMedium }}>
                Live Match in Progress
              </Text>
            ) : null}
          </View>

          <View style={{ width: 48 }} />
        </View>

        {/* Segmented Team Switcher Tabs (Team 1 vs Team 2) */}
        <View style={styles.tabBar}>
          {/* TEAM 1 TAB */}
          <TouchableOpacity
            onPress={() => setActiveTab('team1')}
            activeOpacity={0.8}
            style={[
              styles.tabItem,
              activeTab === 'team1' && styles.tabItemActive
            ]}
          >
            <TeamIdentityMark team={{ name: team1Name, logoKey: team1LogoKey }} size={28} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={[
                  styles.tabTitleText,
                  activeTab === 'team1' ? styles.tabTitleActive : styles.tabTitleInactive
                ]}
                numberOfLines={1}
              >
                {team1Name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                {team1Roster.length === 11 ? (
                  <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Ionicons name="checkmark-circle" size={11} color="#15803D" />
                    <Text style={{ fontSize: 10.5, color: '#15803D', fontFamily: systemFontBold }}>
                      11/11 Playing XI
                    </Text>
                  </View>
                ) : team1Roster.length > 11 ? (
                  <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Ionicons name="alert-circle" size={11} color="#DC2626" />
                    <Text style={{ fontSize: 10.5, color: '#DC2626', fontFamily: systemFontBold }}>
                      {team1Roster.length}/11 (Max 11)
                    </Text>
                  </View>
                ) : team1Roster.length > 0 ? (
                  <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Ionicons name="people" size={11} color="#0284C7" />
                    <Text style={{ fontSize: 10.5, color: '#0284C7', fontFamily: systemFontBold }}>
                      {team1Roster.length}/11 Selected
                    </Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10.5, color: '#B45309', fontFamily: systemFontMedium }}>
                      0/11 Selected
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* TEAM 2 TAB */}
          <TouchableOpacity
            onPress={() => setActiveTab('team2')}
            activeOpacity={0.8}
            style={[
              styles.tabItem,
              activeTab === 'team2' && styles.tabItemActive,
              team2Roster.length === 0 && team1Roster.length > 0 && activeTab === 'team1' && {
                borderColor: '#F59E0B',
                backgroundColor: '#FFFBEB'
              }
            ]}
          >
            <TeamIdentityMark team={{ name: team2Name, logoKey: team2LogoKey }} size={28} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={[
                  styles.tabTitleText,
                  activeTab === 'team2' ? styles.tabTitleActive : styles.tabTitleInactive
                ]}
                numberOfLines={1}
              >
                {team2Name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                {team2Roster.length === 11 ? (
                  <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Ionicons name="checkmark-circle" size={11} color="#15803D" />
                    <Text style={{ fontSize: 10.5, color: '#15803D', fontFamily: systemFontBold }}>
                      11/11 Playing XI
                    </Text>
                  </View>
                ) : team2Roster.length > 11 ? (
                  <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Ionicons name="alert-circle" size={11} color="#DC2626" />
                    <Text style={{ fontSize: 10.5, color: '#DC2626', fontFamily: systemFontBold }}>
                      {team2Roster.length}/11 (Max 11)
                    </Text>
                  </View>
                ) : team2Roster.length > 0 ? (
                  <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Ionicons name="people" size={11} color="#0284C7" />
                    <Text style={{ fontSize: 10.5, color: '#0284C7', fontFamily: systemFontBold }}>
                      {team2Roster.length}/11 Selected
                    </Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: team1Roster.length > 0 ? '#FEF3C7' : '#F1F5F9', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10.5, color: team1Roster.length > 0 ? '#B45309' : '#64748B', fontFamily: systemFontBold }}>
                      {team1Roster.length > 0 ? 'Needs Players' : '0/11 Selected'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={17} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search player for ${activeTeamName}...`}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="words"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={17} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Sub-header text */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderText}>
            SELECT PLAYERS FOR {activeTeamName.toUpperCase()}
          </Text>
          <Text style={[styles.listHeaderCount, activeRoster.length >= 11 && { color: activeRoster.length === 11 ? '#15803D' : '#DC2626', fontFamily: systemFontBold }]}>
            {activeRoster.length}/11 {activeRoster.length === 11 ? 'Playing XI Complete' : activeRoster.length > 11 ? '(Max 11 Exceeded)' : 'Selected'}
          </Text>
        </View>

        {/* Clean Player List (Rankings Style) */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        >
          {filteredPlayers.length === 0 ? (
            <View style={styles.emptyView}>
              <Ionicons name="people-outline" size={32} color="#94A3B8" />
              <Text style={styles.emptyText}>No players found matching "{searchQuery}"</Text>
              <TouchableOpacity
                onPress={onOpenAddPlayerModal}
                style={styles.emptyAddBtn}
              >
                <Text style={styles.emptyAddBtnText}>+ Add "{searchQuery}" as New Player</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredPlayers.map((playerName) => {
              const inCurrent = activeRoster.includes(playerName);
              const inOther = otherRoster.includes(playerName);
              const dbMatch = (localPlayersDb || []).find(p => p && p.name && p.name.trim().toLowerCase() === playerName.trim().toLowerCase());
              const playerPhone = dbMatch?.phone || dbMatch?.mobile || '';
              const role = dbMatch?.role || 'All-Rounder';
              const photoUrl = dbMatch?.avatar || dbMatch?.photoUrl || dbMatch?.photo_url || null;

              const matchStatus = getPlayerMatchStatus(activeMatch, playerName);

              return (
                <View
                  key={`sq-row-${playerName}`}
                  style={[
                    styles.playerCard,
                    inCurrent && styles.playerCardSelected,
                    inOther && styles.playerCardDisabled
                  ]}
                >
                  {/* Left: Avatar + Details */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      if (onEditPlayerPhoto) onEditPlayerPhoto(playerName, dbMatch);
                    }}
                    style={styles.playerAvatarTouch}
                  >
                    <PlayerAvatar name={playerName} photoUrl={photoUrl} size={40} />
                  </TouchableOpacity>

                  <View style={styles.playerInfoCol}>
                    <Text style={styles.playerNameText} numberOfLines={1}>
                      {playerName}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Text style={styles.playerSubText} numberOfLines={1}>
                        {role}{playerPhone ? ` • ${playerPhone.slice(-4)}` : ''}
                      </Text>
                      {matchStatus.statusLabel ? (
                        <View style={{ backgroundColor: matchStatus.badgeBg, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, borderWidth: 0, borderColor: matchStatus.badgeBorder, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <Ionicons name="lock-closed" size={9} color={matchStatus.badgeText} />
                          <Text style={{ fontSize: 9.5, color: matchStatus.badgeText, fontFamily: systemFontMedium }}>
                            {matchStatus.statusLabel}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Right Action Button */}
                  {inCurrent ? (
                    !matchStatus.canRemove ? (
                      <TouchableOpacity
                        onPress={() => showToast(matchStatus.reason || `${playerName} is actively playing in this match and cannot be removed`, 'info')}
                        style={[styles.lockedBadgeBtn, { backgroundColor: matchStatus.badgeBg || '#F1F5F9', borderColor: matchStatus.badgeBorder || '#E2E8F0' }]}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="lock-closed" size={12} color={matchStatus.badgeText || '#64748B'} />
                        <Text style={[styles.lockedBadgeText, { color: matchStatus.badgeText || '#64748B' }]}>
                          {matchStatus.statusLabel || 'In Match'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => moveHandler && moveHandler(playerName, 'pool')}
                        style={styles.selectedBadgeBtn}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                        <Text style={styles.selectedBadgeText}>Selected</Text>
                      </TouchableOpacity>
                    )
                  ) : inOther ? (
                    <View style={styles.inOtherBadge}>
                      <Text style={styles.inOtherBadgeText} numberOfLines={1}>
                        In {otherTeamName}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        if (activeRoster.length >= 11) {
                          showToast(
                            `Playing XI for ${activeTeamName} is full (11/11). Deselect an existing player to replace.`,
                            'warning',
                            'Playing XI Full'
                          );
                          return;
                        }
                        if (moveHandler) moveHandler(playerName, activeTab);
                      }}
                      style={[
                        styles.selectBtn,
                        activeRoster.length >= 11 && { borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' }
                      ]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={15} color={activeRoster.length >= 11 ? '#94A3B8' : '#0284C7'} />
                      <Text style={[styles.selectBtnText, activeRoster.length >= 11 && { color: '#94A3B8' }]}>Select</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Bottom Fixed Action Bar */}
        <View style={styles.bottomBar}>
          {/* Prominent Large Add New Player Button */}
          <TouchableOpacity
            onPress={onOpenAddPlayerModal}
            activeOpacity={0.8}
            style={styles.bottomAddPlayerBtn}
          >
            <Ionicons name="person-add-outline" size={16} color="#0284C7" />
            <Text style={styles.bottomAddPlayerBtnText}>
              + Add New Player to {activeTeamName}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSummaryRow}>
            <Text style={styles.bottomSummaryText}>
              {team1Name}: <Text style={{ color: team1Roster.length === 11 ? '#15803D' : team1Roster.length > 11 ? '#DC2626' : '#B45309', fontFamily: systemFontBold }}>{team1Roster.length}/11 Players</Text>
              {'  •  '}
              {team2Name}: <Text style={{ color: team2Roster.length === 11 ? '#15803D' : team2Roster.length > 11 ? '#DC2626' : '#B45309', fontFamily: systemFontBold }}>{team2Roster.length}/11 Players</Text>
            </Text>
          </View>

          {(() => {
            const team1OverLimit = team1Roster.length > 11;
            const team2OverLimit = team2Roster.length > 11;

            if (team1OverLimit || team2OverLimit) {
              const overTeam = team1OverLimit ? team1Name : team2Name;
              const overCount = team1OverLimit ? team1Roster.length : team2Roster.length;
              return (
                <TouchableOpacity
                  onPress={() => {
                    showToast(`${overTeam} has ${overCount} players. Maximum 11 players allowed. Please deselect ${overCount - 11} player(s).`, 'warning', 'Max 11 Players');
                  }}
                  style={[styles.confirmBtn, { backgroundColor: '#DC2626' }]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="alert-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmBtnText}>MAX 11 PLAYERS ALLOWED ({overCount}/11)</Text>
                </TouchableOpacity>
              );
            }

            // If active on Team 1 and Team 1 has players, but Team 2 has 0 players: Prompt to switch to Team 2!
            const needsTeam2 = activeTab === 'team1' && team1Roster.length > 0 && team2Roster.length === 0;
            const bothReady = team1Roster.length > 0 && team2Roster.length > 0;
            const currentEmpty = (activeTab === 'team1' && team1Roster.length === 0) || (activeTab === 'team2' && team2Roster.length === 0);

            if (needsTeam2) {
              return (
                <TouchableOpacity
                  onPress={() => setActiveTab('team2')}
                  style={[styles.confirmBtn, { backgroundColor: '#0284C7' }]}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmBtnText}>NEXT: SELECT {team2Name.toUpperCase()} SQUAD</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              );
            }

            if (bothReady) {
              return (
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.confirmBtn, { backgroundColor: '#16A34A' }]}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmBtnText}>CONFIRM BOTH SQUADS ({team1Roster.length} vs {team2Roster.length})</Text>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                disabled={currentEmpty}
                onPress={onClose}
                style={[styles.confirmBtn, { backgroundColor: currentEmpty ? '#94A3B8' : '#0284C7' }]}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmBtnText}>
                  {activeTab === 'team1' ? `SELECT PLAYERS FOR ${team1Name.toUpperCase()}` : `SELECT PLAYERS FOR ${team2Name.toUpperCase()}`}
                </Text>
              </TouchableOpacity>
            );
          })()}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  headerBar: {
    height: 52,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  headerLeftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4
  },
  backBtnText: {
    fontSize: 14,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontFamily: systemFontBold
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 0,
    borderColor: '#BAE6FD'
  },
  previewBtnText: {
    color: '#0284C7',
    fontSize: 11.5,
    fontFamily: systemFontMedium
  },
  doneBtn: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: systemFontBold
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 0,
    borderColor: '#E2E8F0'
  },
  tabItemActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
    borderWidth: 0
  },
  tabTitleText: {
    fontSize: 13,
    fontFamily: systemFontMedium
  },
  tabTitleActive: {
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  tabTitleInactive: {
    color: '#334155'
  },
  tabCountText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#64748B',
    marginTop: 1
  },
  searchSection: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
    borderBottomColor: '#E2E8F0'
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 0,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    height: 40,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
    fontFamily: systemFont
  },
  bottomAddPlayerBtn: {
    backgroundColor: '#F0F9FF',
    borderWidth: 0,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4
  },
  bottomAddPlayerBtnText: {
    color: '#0284C7',
    fontSize: 13,
    fontFamily: systemFontBold
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6
  },
  listHeaderText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#64748B',
    letterSpacing: 0.4
  },
  listHeaderCount: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#0284C7'
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    paddingBottom: 30
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 0,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  playerCardSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD'
  },
  playerCardDisabled: {
    opacity: 0.5,
    backgroundColor: '#F8FAFC'
  },
  playerAvatarTouch: {
    position: 'relative'
  },
  playerInfoCol: {
    flex: 1,
    minWidth: 0
  },
  playerNameText: {
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  playerSubText: {
    fontSize: 11,
    fontFamily: systemFont,
    color: '#64748B',
    marginTop: 1
  },
  selectedBadgeBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: systemFontMedium
  },
  lockedBadgeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  lockedBadgeText: {
    fontSize: 11,
    fontFamily: systemFontMedium
  },
  inOtherBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 0,
    borderColor: '#E2E8F0',
    maxWidth: 90
  },
  inOtherBadgeText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontFamily: systemFont
  },
  selectBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 0,
    borderColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  selectBtnText: {
    color: '#0284C7',
    fontSize: 11,
    fontFamily: systemFontMedium
  },
  emptyView: {
    padding: 30,
    alignItems: 'center',
    gap: 10
  },
  emptyText: {
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    color: '#64748B',
    textAlign: 'center'
  },
  emptyAddBtn: {
    backgroundColor: '#F0F9FF',
    borderWidth: 0,
    borderColor: '#BAE6FD',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4
  },
  emptyAddBtnText: {
    color: '#0284C7',
    fontSize: 12,
    fontFamily: systemFontMedium
  },
  bottomBar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    borderTopColor: '#E2E8F0',
    gap: 6
  },
  bottomSummaryRow: {
    alignItems: 'center'
  },
  bottomSummaryText: {
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  confirmBtn: {
    backgroundColor: '#0284C7',
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: systemFontBold
  }
});

export default SquadSelectorModal;
