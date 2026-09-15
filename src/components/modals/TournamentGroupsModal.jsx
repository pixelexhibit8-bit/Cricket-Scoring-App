import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
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
  onTournamentUpdated = () => {}
}) {
  if (!tournament) return null;

  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddGroupInput, setShowAddGroupInput] = useState(false);
  const [saving, setSaving] = useState(false);

  const registeredTeams = Array.isArray(tournament.teams) ? tournament.teams : [];

  useEffect(() => {
    if (tournament) {
      if (Array.isArray(tournament.groups) && tournament.groups.length > 0) {
        setGroups(tournament.groups);
      } else {
        // Default two groups if teams exist
        const half = Math.ceil(registeredTeams.length / 2);
        const gA = registeredTeams.slice(0, half).map(t => t.name || t.teamName || t.id);
        const gB = registeredTeams.slice(half).map(t => t.name || t.teamName || t.id);

        setGroups([
          { id: 'group_a', name: 'Group A', teams: gA },
          { id: 'group_b', name: 'Group B', teams: gB }
        ]);
      }
    }
  }, [tournament, visible]);

  const handleAddGroup = () => {
    const name = newGroupName.trim() || `Group ${String.fromCharCode(65 + groups.length)}`;
    if (groups.some(g => g.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Duplicate Group', 'A group with this name already exists.');
      return;
    }
    setGroups([...groups, { id: `group_${Date.now()}`, name, teams: [] }]);
    setNewGroupName('');
    setShowAddGroupInput(false);
  };

  const handleRemoveGroup = (groupId) => {
    if (groups.length <= 1) {
      Alert.alert('Minimum One Group', 'You must have at least one group.');
      return;
    }
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
      } else {
        // Remove team from other groups so a team belongs to only one group
        return {
          ...g,
          teams: g.teams.filter(t => t !== teamName)
        };
      }
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
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Tournament Groups</Text>
            <Text style={styles.headerSub}>Organize teams for group stages & points table</Text>
          </View>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={handleSaveGroups}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.doneBtnText}>{saving ? 'Saving...' : 'Done'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Tree Diagram Overview */}
          <View style={styles.overviewCard}>
            <View style={styles.cardHeaderRow}>
              <MaterialCommunityIcons name="group" size={18} color="#18181B" />
              <Text style={styles.cardHeaderTitle}>GROUP STRUCTURE</Text>
            </View>

            <View style={styles.treeWrap}>
              <View style={styles.treeRoot}>
                <Text style={styles.treeRootText}>Round Stage</Text>
              </View>

              <View style={styles.treeBranches}>
                {groups.map((grp) => (
                  <View key={grp.id} style={styles.treeGroupNode}>
                    <View style={styles.groupNodeBadge}>
                      <Text style={styles.groupNodeBadgeText}>{grp.name}</Text>
                      <Text style={styles.groupNodeCountText}>({grp.teams.length} teams)</Text>
                    </View>
                    <View style={styles.groupTeamsPills}>
                      {grp.teams.length > 0 ? (
                        grp.teams.map((tName, i) => (
                          <View key={`${tName}-${i}`} style={styles.teamMiniPill}>
                            <Text style={styles.teamMiniPillText}>{tName}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noTeamsHintText}>No teams assigned yet</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Add Group Action */}
          {showAddGroupInput ? (
            <View style={styles.addGroupInputCard}>
              <Text style={styles.inputLabel}>Group Name</Text>
              <View style={styles.addGroupRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="e.g. Group C or Pool 1"
                  placeholderTextColor={themeColors.textSubtle}
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                />
                <TouchableOpacity style={styles.createGroupBtn} onPress={handleAddGroup} activeOpacity={0.8}>
                  <Text style={styles.createGroupBtnText}>Create</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelAddGroupBtn}
                  onPress={() => setShowAddGroupInput(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addNewGroupTriggerBtn}
              onPress={() => setShowAddGroupInput(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={20} color="#18181B" style={{ marginRight: 6 }} />
              <Text style={styles.addNewGroupTriggerText}>+ Add New Group</Text>
            </TouchableOpacity>
          )}

          {/* Group Team Allocation Cards */}
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
                {groups.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeGroupBtn}
                    onPress={() => handleRemoveGroup(groupItem.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.groupCardSub}>Select teams to place into {groupItem.name}:</Text>

              {registeredTeams.length > 0 ? (
                <View style={styles.teamSelectionGrid}>
                  {registeredTeams.map((team) => {
                    const teamName = team.name || team.teamName || 'Team';
                    const isSelectedInThisGroup = groupItem.teams.includes(teamName);
                    return (
                      <TouchableOpacity
                        key={team.id || teamName}
                        style={[
                          styles.teamSelectCard,
                          isSelectedInThisGroup && styles.teamSelectCardActive
                        ]}
                        onPress={() => toggleTeamInGroup(groupItem.id, teamName)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name="cricket"
                          size={14}
                          color={isSelectedInThisGroup ? '#FFFFFF' : '#64748B'}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.teamSelectText,
                            isSelectedInThisGroup && styles.teamSelectTextActive
                          ]}
                          numberOfLines={1}
                        >
                          {teamName}
                        </Text>
                        <Ionicons
                          name={isSelectedInThisGroup ? 'checkmark-circle' : 'ellipse-outline'}
                          size={16}
                          color={isSelectedInThisGroup ? '#FFFFFF' : '#CBD5E1'}
                          style={{ marginLeft: 6 }}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.noRegisteredTeamsBox}>
                  <Text style={styles.noRegisteredTeamsText}>
                    No teams registered yet. Add teams to tournament first.
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  doneBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16
  },
  overviewCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: 16
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12
  },
  cardHeaderTitle: {
    fontSize: 11.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    letterSpacing: 0.8
  },
  treeWrap: {
    alignItems: 'center',
    paddingVertical: 8
  },
  treeRoot: {
    backgroundColor: '#18181B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12
  },
  treeRootText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  treeBranches: {
    width: '100%',
    gap: 10
  },
  treeGroupNode: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    borderRadius: 10,
    padding: 10
  },
  groupNodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  },
  groupNodeBadgeText: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  groupNodeCountText: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textSecondary
  },
  groupTeamsPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  teamMiniPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  teamMiniPillText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  },
  noTeamsHintText: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    fontStyle: 'italic'
  },
  addNewGroupTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#18181B',
    borderRadius: 12,
    paddingVertical: 12
  },
  addNewGroupTriggerText: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: '#18181B'
  },
  addGroupInputCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: 14,
    gap: 8
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  addGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  textInput: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: systemFont,
    color: themeColors.textPrimary
  },
  createGroupBtn: {
    backgroundColor: '#18181B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8
  },
  createGroupBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  cancelAddGroupBtn: {
    padding: 6
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
  }
});

export default TournamentGroupsModal;
