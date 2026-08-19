import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { systemFont, systemFontMedium, fontWeights, typeScale } from '../../theme.js';
import { PlayerAvatar } from '../PlayerAvatar.jsx';

const nameFitProps = {
  numberOfLines: 1,
  ellipsizeMode: 'tail',
  adjustsFontSizeToFit: true,
  minimumFontScale: 0.82
};

export const PlayingXiModal = ({
  visible,
  onClose,
  match = null,
  playingXiMatchTitle: customTitle = '',
  playingXiTabs: customTabs = null,
  initialTeamTab = 1
}) => {
  const screenWidth = Dimensions.get('window').width;
  const [playingXiTeamTab, setPlayingXiTeamTab] = useState(initialTeamTab || 1);
  const [tabLayouts, setTabLayouts] = useState({});

  const pagerRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Reset tab when modal opens
  useEffect(() => {
    if (visible) {
      setPlayingXiTeamTab(initialTeamTab || 1);
      const initialOffset = ((initialTeamTab || 1) - 1) * screenWidth;
      scrollX.setValue(initialOffset);
      setTimeout(() => {
        pagerRef.current?.scrollTo({ x: initialOffset, animated: false });
      }, 50);
    }
  }, [visible, initialTeamTab, screenWidth]);

  // Derive Tabs from match if customTabs not passed
  const tabs = customTabs || (
    match?.teams?.length >= 2 && match?.playingXI
      ? match.teams.slice(0, 2).map((team, index) => ({
        id: index + 1,
        name: team.name,
        roster: match.playingXI[team.name] || []
      }))
      : match?.team1 && match?.team2
        ? [
          { id: 1, name: match.team1?.name || 'Team 1', roster: (match.team1?.batting || []).map(p => p.name || p).filter(Boolean) },
          { id: 2, name: match.team2?.name || 'Team 2', roster: (match.team2?.batting || []).map(p => p.name || p).filter(Boolean) }
        ]
        : [
          { id: 1, name: match?.teams?.[0]?.name || 'Team 1', roster: [] },
          { id: 2, name: match?.teams?.[1]?.name || 'Team 2', roster: [] }
        ]
  );

  const matchTitle = customTitle || match?.title || match?.matchTitle || 'Match Playing XI';

  const captureTabLayout = (teamId, event) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts(prev => {
      const cur = prev[teamId];
      if (cur && Math.abs(cur.x - x) < 0.5 && Math.abs(cur.width - width) < 0.5) return prev;
      return { ...prev, [teamId]: { x, width } };
    });
  };

  const changeTeam = (teamId) => {
    const nextIndex = teamId - 1;
    pagerRef.current?.scrollTo({ x: nextIndex * screenWidth, animated: true });
    setPlayingXiTeamTab(teamId);
  };

  const handlePagerEnd = (event) => {
    const nextIndex = Math.max(0, Math.min(tabs.length - 1, Math.round(event.nativeEvent.contentOffset.x / screenWidth)));
    const nextTeamId = nextIndex + 1;
    if (nextTeamId !== playingXiTeamTab) {
      setPlayingXiTeamTab(nextTeamId);
    }
  };

  const tabsMeasured = tabs.every(team => tabLayouts[team.id]);
  const indicatorTranslateX = tabsMeasured
    ? scrollX.interpolate({
      inputRange: [0, screenWidth],
      outputRange: tabs.map(team => {
        const layout = tabLayouts[team.id];
        return layout ? layout.x + (layout.width / 2) - 50 : 0;
      }),
      extrapolate: 'clamp'
    })
    : 0;

  const indicatorScaleX = tabsMeasured
    ? scrollX.interpolate({
      inputRange: [0, screenWidth],
      outputRange: tabs.map(team => (tabLayouts[team.id]?.width || 100) / 100),
      extrapolate: 'clamp'
    })
    : 1;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      transparent={false}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Modal Header */}
        <View style={{ minHeight: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
          <TouchableOpacity
            onPress={onClose}
            style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#0F172A', fontSize: typeScale.pageTitle, fontWeight: fontWeights.bold, fontFamily: systemFont }}>PLAYING XI</Text>
            <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, marginTop: 2, fontFamily: systemFont }} numberOfLines={1}>
              {matchTitle}
            </Text>
          </View>
        </View>

        {/* Tab Strip */}
        <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
          <View style={{ position: 'relative', minHeight: 48, width: '100%', flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-evenly' }}>
            {tabs.map(team => {
              const active = playingXiTeamTab === team.id;
              return (
                <TouchableOpacity
                  key={team.id}
                  onLayout={(event) => captureTabLayout(team.id, event)}
                  onPress={() => changeTeam(team.id)}
                  style={{ maxWidth: (screenWidth - 48) / 2, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <MaterialCommunityIcons name="account-group" size={17} color={active ? '#0284C7' : '#94A3B8'} />
                  <Text style={{ flexShrink: 1, color: active ? '#0284C7' : '#64748B', fontSize: 13, fontFamily: systemFontMedium }} numberOfLines={1}>
                    {team.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {tabsMeasured ? (
              <Animated.View
                pointerEvents="none"
                style={{ position: 'absolute', left: 0, bottom: 0, width: 100, height: 3, transform: [{ translateX: indicatorTranslateX }] }}
              >
                <Animated.View style={{ flex: 1, borderRadius: 2, backgroundColor: '#0284C7', transform: [{ scaleX: indicatorScaleX }] }} />
              </Animated.View>
            ) : null}
          </View>
        </View>

        {/* Horizontal Swipe Pager */}
        <Animated.ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          snapToInterval={screenWidth}
          snapToAlignment="start"
          disableIntervalMomentum
          directionalLockEnabled
          nestedScrollEnabled
          bounces={false}
          overScrollMode="never"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          onMomentumScrollEnd={handlePagerEnd}
          style={{ flex: 1 }}
        >
          {tabs.map(team => (
            <View key={team.id} style={{ width: screenWidth, flex: 1 }}>
              <ScrollView
                style={{ flex: 1 }}
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={{ paddingBottom: 24, backgroundColor: '#FFFFFF' }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                <View style={{ minHeight: 42, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                  <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, fontFamily: systemFont }}>SQUAD</Text>
                  <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{team.roster?.length || 0} PLAYERS</Text>
                </View>

                {(team.roster || []).map((playerName) => (
                  <View
                    key={`${team.id}-${playerName}`}
                    style={{
                      minHeight: 68,
                      paddingHorizontal: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      backgroundColor: '#FFFFFF',
                      borderBottomWidth: 1,
                      borderBottomColor: '#E8ECEF'
                    }}
                  >
                    <PlayerAvatar name={playerName} size={44} />
                    <Text
                      selectable
                      {...nameFitProps}
                      style={{ flex: 1, minWidth: 0, color: '#0F172A', fontSize: 14, lineHeight: 19, fontWeight: fontWeights.bold, fontFamily: systemFont }}
                    >
                      {playerName}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ))}
        </Animated.ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default PlayingXiModal;
