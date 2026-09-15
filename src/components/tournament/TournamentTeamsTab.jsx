import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../../theme.js';
import { TeamIdentityMark } from '../TeamIdentityMark.jsx';

export const TournamentTeamsTab = React.memo(function TournamentTeamsTab({
  tournament,
  onSelectTeam,
  onAddTeam,
  onShareInvite,
  onOpenCaptainRegistration,
  isUserOrganiser
}) {
  const teams = Array.isArray(tournament?.teams) ? tournament.teams : [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Clean Captain Registration Bar if Open Registrations */}
      {!isUserOrganiser && tournament?.needMoreTeams && (
        <View style={styles.captainActionBar}>
          <TouchableOpacity
            style={styles.captainRegisterBtn}
            onPress={onOpenCaptainRegistration}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="shield-plus-outline" size={18} color="#FFFFFF" />
            <Text style={styles.captainRegisterBtnText}>Register Your Team (Captain)</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── TEAMS LIST ── */}
      {teams.length > 0 ? (
        <View style={styles.teamsListContainer}>
          {teams.map((team, idx) => {
            const squadCount = Array.isArray(team.players)
              ? team.players.length
              : (Array.isArray(team.squad) ? team.squad.length : (team.playersCount || 16));

            const captainText = team.captainName || team.captain ? ` • Capt: ${team.captainName || team.captain}` : '';

            return (
              <TouchableOpacity
                key={team.id || `team_${idx}`}
                style={styles.teamCardRow}
                activeOpacity={0.7}
                onPress={() => onSelectTeam && onSelectTeam(team)}
              >
                {/* Team Logo */}
                <View style={styles.teamLogoWrapper}>
                  <TeamIdentityMark team={team} tournamentTeams={teams} size={36} />
                </View>

                {/* Team Name and Player Count */}
                <View style={styles.teamInfoCol}>
                  <Text style={styles.teamFullName} numberOfLines={1}>
                    {team.fullName || team.name || `Team ${idx + 1}`}
                  </Text>
                  <Text style={styles.teamMetaSubtitle} numberOfLines={1}>
                    {squadCount} Players{captainText}
                  </Text>
                </View>

                {/* Chevron */}
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="people-outline" size={32} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Teams Registered Yet</Text>
          <Text style={styles.emptySubtitle}>
            {isUserOrganiser
              ? 'Add teams manually, search saved ground teams, or share the tournament code with captains.'
              : 'The organizer has not registered teams for this tournament yet. Captains can register their squad below.'}
          </Text>
          {isUserOrganiser ? (
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={onAddTeam}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyActionBtnText}>+ Add First Team</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={onOpenCaptainRegistration}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyActionBtnText}>Register Team Now</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.appBackground
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  organiserBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
  inviteCaptainsBtn: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 10
  },
  inviteCaptainsText: {
    color: '#16A34A',
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  addTeamBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCDCE0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 10
  },
  addTeamText: {
    color: themeColors.textPrimary,
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  teamsListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    overflow: 'hidden'
  },
  teamCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8FA'
  },
  teamLogoWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  teamInfoCol: {
    flex: 1
  },
  teamFullName: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  teamMetaSubtitle: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    marginTop: 2
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20
  },
  emptyTitle: {
    fontSize: 14.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    textAlign: 'center',
    lineHeight: 18
  },
  emptyActionBtn: {
    backgroundColor: '#18181B',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 6
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: systemFontBold
  },
  captainActionBar: {
    marginBottom: 12
  },
  captainRegisterBtn: {
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: 10
  },
  captainRegisterBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontBold
  }
});
