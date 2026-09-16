import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../../theme.js';
import { saveTournament } from '../../services/tournamentService.js';

export function TournamentGroupsModal({
  visible = false,
  onClose = () => {},
  tournament = null,
  onTournamentUpdated = () => {},
  onOpenRounds = () => {}
}) {
  if (!tournament) return null;

  const [groups, setGroups] = useState([]);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [selectedRoundForNewGroup, setSelectedRoundForNewGroup] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedTeamsForNewGroup, setSelectedTeamsForNewGroup] = useState([]);
  const [saving, setSaving] = useState(false);

  const registeredTeams = Array.isArray(tournament.teams) ? tournament.teams : [];
  const tournamentRounds = Array.isArray(tournament.rounds) && tournament.rounds.length > 0
    ? tournament.rounds
    : [];

  useEffect(() => {
    if (tournament) {
      if (Array.isArray(tournament.groups) && tournament.groups.length > 0) {
        setGroups(tournament.groups);
      } else if (tournamentRounds.length > 0 && registeredTeams.length > 0) {
        // Automatically default to Group A & Group B for initial round
        const firstRound = tournamentRounds[0];
        const half = Math.ceil(registeredTeams.length / 2);
        const gA = registeredTeams.slice(0, half).map(t => t.name || t.teamName || t.id);
        const gB = registeredTeams.slice(half).map(t => t.name || t.teamName || t.id);

        setGroups([
          { id: 'group_a', roundName: firstRound, name: 'Group A', teams: gA },
          { id: 'group_b', roundName: firstRound, name: 'Group B', teams: gB }
        ]);
      } else {
        setGroups([]);
      }
      setShowAddGroupModal(false);
    }
  }, [tournament, visible]);

  // Click on "Add groups" button (Screenshot 5 / 6)
  const handleAddGroupClick = () => {
    // Check if tournament has any rounds
    if (tournamentRounds.length === 0) {
      Alert.alert(
        'Add rounds first',
        'Before adding a group, you need to add rounds for this tournament.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Rounds',
            onPress: () => {
              onClose();
              if (onOpenRounds) onOpenRounds();
            }
          }
        ]
      );
      return;
    }

    // Set default round for new group
    setSelectedRoundForNewGroup(tournamentRounds[0]);
    setNewGroupName(`Group ${String.fromCharCode(65 + groups.length)}`);
    setSelectedTeamsForNewGroup([]);
    setShowAddGroupModal(true);
  };

  const handleCreateGroup = () => {
    const name = newGroupName.trim() || `Group ${String.fromCharCode(65 + groups.length)}`;
    if (groups.some(g => g.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Duplicate Group', 'A group with this name already exists.');
      return;
    }

    const newGroupObj = {
      id: `group_${Date.now()}`,
      roundName: selectedRoundForNewGroup || tournamentRounds[0] || 'Group Stage',
      name,
      teams: selectedTeamsForNewGroup
    };

    setGroups([...groups, newGroupObj]);
    setShowAddGroupModal(false);
  };

  const handleRemoveGroup = (groupId) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const toggleTeamInGroup = (groupId, teamName) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        const hasTeam = g.teams.includes(teamName);
        return {
          ...g,
          teams: hasTeam ? g.teams.filter(t => t !== teamName) : [...g.teams, teamName]
        };
      }
      return g;
    }));
  };

  const handleSaveGroups = async () => {
    setSaving(true);
    const updated = {
      ...tournament,
      groups,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveTournament(updated);
      setSaving(false);
      onTournamentUpdated(updated);
      onClose();
    } catch (err) {
      setSaving(false);
      Alert.alert('Error', 'Failed to save groups.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={themeColors.surface} />
        <View style={styles.modalContainer}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Groups</Text>
            <Text style={styles.headerSub}>Points table pool allocation</Text>
          </View>
          <TouchableOpacity
            style={styles.saveHeaderBtn}
            onPress={handleSaveGroups}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveHeaderBtnText}>{saving ? 'Saving...' : 'Done'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Visual Tree Diagram (Matching Screenshot 5) */}
          {groups.length > 0 ? (
            <View style={styles.treeSectionCard}>
              <View style={styles.treeHeaderRow}>
                <MaterialCommunityIcons name="tournament" size={18} color="#18181B" />
                <Text style={styles.treeHeaderTitle}>GROUP STAGE ALLOCATION</Text>
              </View>

              {/* Horizontal Root -> Groups -> Teams Tree Layout (Screenshot 5) */}
              <View style={styles.treeBranchContainer}>
                {/* 1. Left Root Round Node */}
                <View style={styles.roundRootNode}>
                  <Text style={styles.roundRootNodeText}>
                    {tournamentRounds[0] || 'Group Stage'}
                  </Text>
                </View>

                {/* 2. Middle Groups & Right Teams Branches */}
                <View style={styles.groupsBranchList}>
                  {groups.map((grp) => (
                    <View key={grp.id} style={styles.groupBranchItem}>
                      <View style={styles.groupNodeBox}>
                        <Text style={styles.groupNodeName}>{grp.name}</Text>
                      </View>

                      <View style={styles.teamsNodeColumn}>
                        {grp.teams.length > 0 ? (
                          grp.teams.map((tName, tIdx) => (
                            <View key={`${tName}-${tIdx}`} style={styles.teamNodeBox}>
                              <Text style={styles.teamNodeText} numberOfLines={1}>{tName}</Text>
                            </View>
                          ))
                        ) : (
                          <View style={[styles.teamNodeBox, { borderStyle: 'dashed' }]}>
                            <Text style={[styles.teamNodeText, { color: themeColors.textMuted }]}>
                              No teams assigned
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyGroupsCard}>
              <MaterialCommunityIcons name="account-group-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyGroupsTitle}>Add groups</Text>
              <Text style={styles.emptyGroupsSub}>
                For generating points table, you will have to add groups first.
              </Text>
            </View>
          )}

          {/* Group Team Assignment Cards */}
          {groups.map((groupItem) => (
            <View key={groupItem.id} style={styles.groupCard}>
              <View style={styles.groupCardHeader}>
                <View style={styles.groupCardTitleRow}>
                  <MaterialCommunityIcons name="shield-outline" size={18} color="#18181B" />
                  <Text style={styles.groupCardTitle}>{groupItem.name}</Text>
                  <View style={styles.groupCountBadge}>
                    <Text style={styles.groupCountBadgeText}>{groupItem.teams.length} Teams</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeGroupBtn}
                  onPress={() => handleRemoveGroup(groupItem.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <Text style={styles.groupCardSub}>Tap teams to include in {groupItem.name}:</Text>

              {registeredTeams.length > 0 ? (
                <View style={styles.teamSelectionGrid}>
                  {registeredTeams.map((team) => {
                    const teamName = team.name || team.teamName || 'Team';
                    const isSelected = groupItem.teams.includes(teamName);
                    return (
                      <TouchableOpacity
                        key={team.id || teamName}
                        style={[
                          styles.teamSelectCard,
                          isSelected && styles.teamSelectCardActive
                        ]}
                        onPress={() => toggleTeamInGroup(groupItem.id, teamName)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name="cricket"
                          size={14}
                          color={isSelected ? '#FFFFFF' : '#64748B'}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.teamSelectText,
                            isSelected && styles.teamSelectTextActive
                          ]}
                          numberOfLines={1}
                        >
                          {teamName}
                        </Text>
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={16}
                          color={isSelected ? '#FFFFFF' : '#CBD5E1'}
                          style={{ marginLeft: 6 }}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.noRegisteredTeamsBox}>
                  <Text style={styles.noRegisteredTeamsText}>
                    No teams registered yet. Register tournament teams first.
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* ── BOTTOM ACTION BAR (Matching Screenshot 5) ── */}
        <View style={styles.bottomBarContainer}>
          <TouchableOpacity
            style={styles.doneBottomBtn}
            onPress={handleSaveGroups}
            activeOpacity={0.8}
          >
            <Text style={styles.doneBottomBtnText}>Done</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addGroupsBottomBtn}
            onPress={handleAddGroupClick}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.addGroupsBottomBtnText}>Add groups</Text>
          </TouchableOpacity>
        </View>

        {/* ── ADD GROUP MODAL (Matching Screenshot 6) ── */}
        <Modal
          visible={showAddGroupModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowAddGroupModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.addGroupDialog}>
              <View style={styles.dialogHeaderRow}>
                <Text style={styles.dialogTitle}>Add groups</Text>
                <TouchableOpacity onPress={() => setShowAddGroupModal(false)}>
                  <Ionicons name="close" size={22} color={themeColors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Field 1: Select Round */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select round *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {tournamentRounds.map((rnd) => {
                    const isSelected = selectedRoundForNewGroup === rnd;
                    return (
                      <TouchableOpacity
                        key={rnd}
                        style={[styles.roundPill, isSelected && styles.roundPillActive]}
                        onPress={() => setSelectedRoundForNewGroup(rnd)}
                      >
                        <Text style={[styles.roundPillText, isSelected && styles.roundPillTextActive]}>
                          {rnd}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Field 2: Group Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Group name (e.g. Group A or Pool 1) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Group Name"
                  placeholderTextColor={themeColors.textSubtle}
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.dialogActionsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowAddGroupModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.createBtn}
                  onPress={handleCreateGroup}
                >
                  <Text style={styles.createBtnText}>Add Group</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.surface
  },
  modalContainer: {
    flex: 1,
    backgroundColor: themeColors.appBackground
  },
  headerBar: {
    height: 54,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  headerTitleWrap: {
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  headerSub: {
    fontSize: 10,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  saveHeaderBtn: {
    backgroundColor: '#18181B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8
  },
  saveHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
    gap: 16
  },
  treeSectionCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: 16
  },
  treeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16
  },
  treeHeaderTitle: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    letterSpacing: 0.8
  },
  treeBranchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  roundRootNode: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1.5,
    borderColor: themeColors.borderDark,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 14,
    width: 90,
    alignItems: 'center',
    justifyContent: 'center'
  },
  roundRootNodeText: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    textAlign: 'center'
  },
  groupsBranchList: {
    flex: 1,
    gap: 12
  },
  groupBranchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  groupNodeBox: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1.5,
    borderColor: themeColors.borderDark,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center'
  },
  groupNodeName: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  teamsNodeColumn: {
    flex: 1,
    gap: 4
  },
  teamNodeBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  teamNodeText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  },
  emptyGroupsCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    marginTop: 20
  },
  emptyGroupsTitle: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  emptyGroupsSub: {
    fontSize: 12.5,
    fontFamily: systemFont,
    color: themeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18
  },
  groupCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: 16,
    gap: 10
  },
  groupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  groupCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  groupCardTitle: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  groupCountBadge: {
    backgroundColor: themeColors.surfaceOffWhite,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  groupCountBadgeText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  removeGroupBtn: {
    padding: 4
  },
  groupCardSub: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: themeColors.textSecondary
  },
  teamSelectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  teamSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8
  },
  teamSelectCardActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B'
  },
  teamSelectText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary,
    maxWidth: 130
  },
  teamSelectTextActive: {
    color: '#FFFFFF'
  },
  noRegisteredTeamsBox: {
    paddingVertical: 10,
    alignItems: 'center'
  },
  noRegisteredTeamsText: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  bottomBarContainer: {
    backgroundColor: themeColors.surface,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12
  },
  doneBottomBtn: {
    flex: 1,
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  doneBottomBtnText: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  addGroupsBottomBtn: {
    flex: 1.3,
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addGroupsBottomBtnText: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: '#FFFFFF'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  addGroupDialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    gap: 14
  },
  dialogHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  dialogTitle: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  inputGroup: {
    gap: 6
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  textInput: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    fontFamily: systemFont,
    color: themeColors.textPrimary
  },
  roundPill: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  roundPillActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B'
  },
  roundPillText: {
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  roundPillTextActive: {
    color: '#FFFFFF'
  },
  dialogActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: themeColors.surfaceOffWhite,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  createBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center'
  },
  createBtnText: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: '#FFFFFF'
  }
});

export default TournamentGroupsModal;
