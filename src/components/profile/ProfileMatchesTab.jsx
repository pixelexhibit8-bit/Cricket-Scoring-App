import React, { useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { systemFont, systemFontBold } from '../../theme.js';

const MatchHistoryItem = React.memo(function MatchHistoryItem({ match, onSelect }) {
  const matchTitle = useMemo(() => {
    return match.match_title || match.matchTitle || match.title ||
      (match.team1_name && match.team2_name ? `${match.team1_name} vs ${match.team2_name}` : '') ||
      (match.match_data?.matchTitle || (match.match_data?.team1?.name && match.match_data?.team2?.name ? `${match.match_data.team1.name} vs ${match.match_data.team2.name}` : '')) ||
      (match.team1?.name && match.team2?.name ? `${match.team1.name} vs ${match.team2.name}` : 'Cricket Match');
  }, [match]);

  const matchResult = useMemo(() => {
    return match.result_text || match.resultText || match.match_data?.resultText || match.winner || 'Match Completed';
  }, [match]);

  const matchDate = useMemo(() => {
    return match.dateText || match.dateLabel || (match.created_at ? new Date(match.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent Match');
  }, [match]);

  const handlePress = useCallback(() => {
    if (onSelect) {
      const fullMatch = match.match_data
        ? { ...match.match_data, id: match.id, title: matchTitle, matchTitle, resultText: matchResult, dateText: matchDate }
        : match;
      onSelect(fullMatch);
    }
  }, [match, onSelect, matchTitle, matchResult, matchDate]);

  return (
    <TouchableOpacity
      style={styles.matchHistoryItem}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.matchTitle}>{matchTitle}</Text>
        <Text style={styles.matchDate}>{matchDate}</Text>
        <Text style={styles.matchResultText} numberOfLines={1}>{matchResult}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </TouchableOpacity>
  );
});

export const ProfileMatchesTab = React.memo(function ProfileMatchesTab({
  participatedMatches = [],
  onSelectMatch
}) {
  const renderItem = useCallback(({ item }) => {
    return <MatchHistoryItem match={item} onSelect={onSelectMatch} />;
  }, [onSelectMatch]);

  const keyExtractor = useCallback((item, index) => {
    return `profile_match_${item?.id || 'item'}_${index}`;
  }, []);

  const ListEmptyComponent = useMemo(() => (
    <View style={styles.emptyMatchesCard}>
      <Ionicons name="trophy-outline" size={28} color="#94A3B8" />
      <Text style={styles.emptyTitle}>No Matches Recorded Yet</Text>
      <Text style={styles.emptySub}>
        When you play in a match on CricFlow, your individual batting and bowling cards will appear here.
      </Text>
    </View>
  ), []);

  return (
    <FlatList
      data={participatedMatches}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      ListEmptyComponent={ListEmptyComponent}
    />
  );
});

const styles = StyleSheet.create({
  scrollContent: {
    padding: 14,
    paddingBottom: 28
  },
  matchHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 0,
    marginBottom: 8
  },
  matchTitle: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  matchDate: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: systemFont,
    marginTop: 2
  },
  matchResultText: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: '#059669',
    marginTop: 4
  },
  emptyMatchesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    gap: 6
  },
  emptyTitle: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: '#0F172A',
    marginTop: 4
  },
  emptySub: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: systemFont,
    textAlign: 'center',
    lineHeight: 16
  }
});
