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
import { Ionicons } from '@expo/vector-icons';
import { systemFont, systemFontBold, systemFontMedium } from '../../theme.js';
import { TeamIdentityMark } from '../TeamIdentityMark.jsx';
import { PlayerAvatar } from '../PlayerAvatar.jsx';

export function SquadSelectorModal({
  visible,
  onClose,
  team1Name = 'Team 1',
  team2Name = 'Team 2',
  team1LogoKey = 'csk',
  team2LogoKey = 'rcb',
  team1Roster = [],
  team2Roster = [],
  allPlayersPool = [],
  localPlayersDb = [],
  onMoveToTeam,
  onOpenAddPlayerModal,
  onOpenSquadPreview,
  onEditPlayerPhoto
}) {
  const [activeTab, setActiveTab] = useState('team1'); // 'team1' | 'team2'
  const [searchQuery, setSearchQuery] = useState('');

  const activeTeamName = activeTab === 'team1' ? team1Name : team2Name;
  const activeTeamLogoKey = activeTab === 'team1' ? team1LogoKey : team2LogoKey;
  const activeRoster = activeTab === 'team1' ? team1Roster : team2Roster;
  const otherTeamName = activeTab === 'team1' ? team2Name : team1Name;
  const otherRoster = activeTab === 'team1' ? team2Roster : team1Roster;

  const filteredPlayers = allPlayersPool.filter(name => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const qClean = q.replace(/\D/g, '');
    const dbMatch = localPlayersDb.find(p => p && p.name && p.name.trim().toLowerCase() === name.trim().toLowerCase());
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

          <Text style={styles.headerTitle}>Select Squad Players</Text>

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
                {team1Roster.length > 0 ? (
                  <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Ionicons name="checkmark-circle" size={11} color="#15803D" />
                    <Text style={{ fontSize: 10.5, color: '#15803D', fontFamily: systemFontBold }}>
                      {team1Roster.length} Added
                    </Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10.5, color: '#B45309', fontFamily: systemFontMedium }}>
                      0 Selected
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
                {team2Roster.length > 0 ? (
                  <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Ionicons name="checkmark-circle" size={11} color="#15803D" />
                    <Text style={{ fontSize: 10.5, color: '#15803D', fontFamily: systemFontBold }}>
                      {team2Roster.length} Added
                    </Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: team1Roster.length > 0 ? '#FEF3C7' : '#F1F5F9', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10.5, color: team1Roster.length > 0 ? '#B45309' : '#64748B', fontFamily: systemFontBold }}>
                      {team1Roster.length > 0 ? 'Needs Players' : '0 Selected'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search & Add Player Row */}
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

          <TouchableOpacity
            onPress={onOpenAddPlayerModal}
            activeOpacity={0.8}
            style={styles.addPlayerBtn}
          >
            <Ionicons name="person-add" size={15} color="#0284C7" />
            <Text style={styles.addPlayerBtnText}>
              + Add New Ground Player
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sub-header text */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderText}>
            SELECT PLAYERS FOR {activeTeamName.toUpperCase()}
          </Text>
          <Text style={styles.listHeaderCount}>
            {activeRoster.length} in Squad
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
              const dbMatch = localPlayersDb.find(p => p && p.name && p.name.trim().toLowerCase() === playerName.trim().toLowerCase());
              const playerPhone = dbMatch?.phone || dbMatch?.mobile || '';
              const role = dbMatch?.role || 'All-Rounder';
              const photoUrl = dbMatch?.avatar || dbMatch?.photoUrl || dbMatch?.photo_url || null;

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
                    <Text style={styles.playerSubText} numberOfLines={1}>
                      {role}{playerPhone ? ` • ${playerPhone.slice(-4)}` : ''}
                    </Text>
                  </View>

                  {/* Right Action Button */}
                  {inCurrent ? (
                    <TouchableOpacity
                      onPress={() => onMoveToTeam && onMoveToTeam(playerName, 'pool')}
                      style={styles.selectedBadgeBtn}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.selectedBadgeText}>Selected</Text>
                    </TouchableOpacity>
                  ) : inOther ? (
                    <View style={styles.inOtherBadge}>
                      <Text style={styles.inOtherBadgeText} numberOfLines={1}>
                        In {otherTeamName}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => onMoveToTeam && onMoveToTeam(playerName, activeTab)}
                      style={styles.selectBtn}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={15} color="#0284C7" />
                      <Text style={styles.selectBtnText}>Select</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Bottom Fixed Action Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomSummaryRow}>
            <Text style={styles.bottomSummaryText}>
              {team1Name}: <Text style={{ color: team1Roster.length > 0 ? '#15803D' : '#B45309', fontFamily: systemFontBold }}>{team1Roster.length} Players</Text>
              {'  •  '}
              {team2Name}: <Text style={{ color: team2Roster.length > 0 ? '#15803D' : '#B45309', fontFamily: systemFontBold }}>{team2Roster.length} Players</Text>
            </Text>
          </View>

          {(() => {
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
    borderBottomWidth: 1,
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
    borderWidth: 1,
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
    borderBottomWidth: 1,
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
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  tabItemActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
    borderWidth: 1.5
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
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
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
  addPlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 7
  },
  addPlayerBtnText: {
    color: '#0284C7',
    fontSize: 12,
    fontFamily: systemFontMedium
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
    borderWidth: 1,
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
  inOtherBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
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
    borderWidth: 1,
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
    borderWidth: 1,
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
    borderTopWidth: 1,
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
