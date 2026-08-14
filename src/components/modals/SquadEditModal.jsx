import React, { useState } from 'react';
import {
  View, Text, Modal, TextInput, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { systemFont, systemFontBold, systemFontMedium, typeScale, fontWeights } from '../../theme.js';
import { saveLocalPlayer } from '../../services/localPlayerService.js';
import { generateUUID } from '../../services/supabaseClient.js';

const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'WK-Batsman'];

export function SquadEditModal({
  visible,
  onClose,
  team1Name = 'Team A',
  team2Name = 'Team B',
  team1Roster = [],
  team2Roster = [],
  onPlayerAdded, // (playerName, teamIndex: 1|2) => void
}) {
  const [activeTeam, setActiveTeam] = useState(1); // 1 or 2
  const [showAddForm, setShowAddForm] = useState(false);

  // Add player form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('Batsman');
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setNewName('');
    setNewPhone('');
    setNewRole('Batsman');
    setShowAddForm(false);
  };

  const handleSave = async () => {
    if (!newName.trim()) {
      Alert.alert('Name Required', 'Please enter player name.');
      return;
    }
    setIsSaving(true);
    try {
      const playerObj = {
        id: generateUUID(),
        name: newName.trim(),
        phone: newPhone.trim(),
        role: newRole,
        photoUrl: ''
      };
      await saveLocalPlayer(playerObj);
      onPlayerAdded && onPlayerAdded(playerObj.name, activeTeam);
      resetForm();
    } catch (e) {
      Alert.alert('Error', 'Could not save player.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentRoster = activeTeam === 1 ? team1Roster : team2Roster;
  const currentTeamName = activeTeam === 1 ? team1Name : team2Name;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          {/* Header */}
          <View style={{
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: '#E2E8F0',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <View>
              <Text style={{ fontSize: typeScale.title, fontFamily: systemFontBold, color: '#0F172A' }}>
                EDIT SQUAD
              </Text>
              <Text style={{ fontSize: typeScale.caption, fontFamily: systemFontMedium, color: '#64748B', marginTop: 2 }}>
                View players · Add mid-match sub
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' }}
            >
              <Ionicons name="close" size={16} color="#64748B" />
              <Text style={{ color: '#64748B', fontFamily: systemFontBold, fontSize: 12 }}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* Team Tabs */}
          <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
            {[{ id: 1, name: team1Name }, { id: 2, name: team2Name }].map(t => (
              <TouchableOpacity
                key={t.id}
                onPress={() => { setActiveTeam(t.id); setShowAddForm(false); }}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderBottomWidth: 2,
                  borderBottomColor: activeTeam === t.id ? '#0284C7' : 'transparent'
                }}
              >
                <Text style={{
                  fontSize: typeScale.label,
                  fontFamily: activeTeam === t.id ? systemFontBold : systemFontMedium,
                  color: activeTeam === t.id ? '#0284C7' : '#64748B'
                }} numberOfLines={1}>
                  {t.name}
                </Text>
                <Text style={{ fontSize: typeScale.micro, fontFamily: systemFontMedium, color: '#94A3B8', marginTop: 1 }}>
                  {(t.id === 1 ? team1Roster : team2Roster).length} players
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">

            {/* Squad List */}
            <View style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E2E8F0' }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="account-group" size={16} color="#0284C7" />
                <Text style={{ fontSize: typeScale.label, fontFamily: systemFontBold, color: '#0F172A' }}>
                  {currentTeamName.toUpperCase()} — PLAYING XI
                </Text>
              </View>

              {currentRoster.length === 0 ? (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ fontSize: typeScale.body, fontFamily: systemFontMedium, color: '#94A3B8' }}>No players in squad</Text>
                </View>
              ) : (
                currentRoster.map((name, idx) => (
                  <View
                    key={name + idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 13,
                      borderTopWidth: idx === 0 ? 0 : 1,
                      borderTopColor: '#E2E8F0',
                      gap: 12
                    }}
                  >
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 12, fontFamily: systemFontBold, color: '#0284C7' }}>{idx + 1}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: typeScale.body, fontFamily: systemFontMedium, color: '#0F172A' }} numberOfLines={1}>
                      {name}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Add Player Form or Button */}
            <View style={{ marginTop: 16, marginHorizontal: 12 }}>
              {!showAddForm ? (
                <TouchableOpacity
                  onPress={() => setShowAddForm(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: '#0F172A',
                    borderRadius: 12,
                    paddingVertical: 14
                  }}
                >
                  <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: typeScale.body, fontFamily: systemFontBold }}>
                    Add Player to {currentTeamName}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, gap: 12 }}>
                  <Text style={{ fontSize: typeScale.title, fontFamily: systemFontBold, color: '#0F172A' }}>
                    Add New Player
                  </Text>

                  {/* Name */}
                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: typeScale.caption, fontFamily: systemFontBold, color: '#64748B' }}>FULL NAME *</Text>
                    <TextInput
                      style={{ height: 46, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 14, backgroundColor: '#F8FAFC', fontSize: typeScale.body, color: '#0F172A', fontFamily: systemFont }}
                      placeholder="Player full name"
                      placeholderTextColor="#94A3B8"
                      value={newName}
                      onChangeText={setNewName}
                      autoFocus
                    />
                  </View>

                  {/* Mobile */}
                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: typeScale.caption, fontFamily: systemFontBold, color: '#64748B' }}>MOBILE NUMBER</Text>
                    <TextInput
                      style={{ height: 46, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 14, backgroundColor: '#F8FAFC', fontSize: typeScale.body, color: '#0F172A', fontFamily: systemFont }}
                      placeholder="10-digit mobile"
                      placeholderTextColor="#94A3B8"
                      value={newPhone}
                      onChangeText={setNewPhone}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>

                  {/* Role */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: typeScale.caption, fontFamily: systemFontBold, color: '#64748B' }}>ROLE</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {ROLES.map(r => (
                        <TouchableOpacity
                          key={r}
                          onPress={() => setNewRole(r)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 20,
                            borderWidth: 1.5,
                            borderColor: newRole === r ? '#0284C7' : '#CBD5E1',
                            backgroundColor: newRole === r ? '#EFF6FF' : '#F8FAFC'
                          }}
                        >
                          <Text style={{ fontSize: 12, fontFamily: newRole === r ? systemFontBold : systemFontMedium, color: newRole === r ? '#0284C7' : '#64748B' }}>
                            {r}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    <TouchableOpacity
                      onPress={resetForm}
                      style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' }}
                    >
                      <Text style={{ fontSize: typeScale.body, fontFamily: systemFontBold, color: '#64748B' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSave}
                      disabled={isSaving}
                      style={{ flex: 2, paddingVertical: 12, borderRadius: 10, backgroundColor: isSaving ? '#94A3B8' : '#0284C7', alignItems: 'center' }}
                    >
                      <Text style={{ fontSize: typeScale.body, fontFamily: systemFontBold, color: '#FFFFFF' }}>
                        {isSaving ? 'Saving...' : `Save & Add to ${currentTeamName}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
