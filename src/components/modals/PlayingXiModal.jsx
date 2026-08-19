import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Animated,
  SafeAreaView
} from 'react-native';
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
  playingXiMatchTitle,
  playingXiTabs = [],
  playingXiTeamTab = 1,
  changePlayingXiTeam,
  capturePlayingXiTabLayout,
  playingXiTabsMeasured,
  playingXiIndicatorTranslateX,
  playingXiIndicatorScaleX,
  playingXiPagerRef,
  playingXiPagerScrollX,
  handlePlayingXiPagerEnd,
  screenWidth
}) => {
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
              {playingXiMatchTitle}
            </Text>
          </View>
        </View>

        {/* Tab Strip */}
        <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
          <View style={{ position: 'relative', minHeight: 48, width: '100%', flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-evenly' }}>
            {playingXiTabs.map(team => {
              const active = playingXiTeamTab === team.id;
              return (
                <TouchableOpacity
                  key={team.id}
                  onLayout={(event) => capturePlayingXiTabLayout && capturePlayingXiTabLayout(team.id, event)}
                  onPress={() => changePlayingXiTeam && changePlayingXiTeam(team.id)}
                  style={{ maxWidth: (screenWidth - 48) / 2, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <MaterialCommunityIcons name="account-group" size={17} color={active ? '#0284C7' : '#94A3B8'} />
                  <Text style={{ flexShrink: 1, color: active ? '#0284C7' : '#64748B', fontSize: 13, fontFamily: systemFontMedium }} numberOfLines={1}>
                    {team.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {playingXiTabsMeasured && playingXiIndicatorTranslateX && playingXiIndicatorScaleX ? (
              <Animated.View
                pointerEvents="none"
                style={{ position: 'absolute', left: 0, bottom: 0, width: 100, height: 3, transform: [{ translateX: playingXiIndicatorTranslateX }] }}
              >
                <Animated.View style={{ flex: 1, borderRadius: 2, backgroundColor: '#0284C7', transform: [{ scaleX: playingXiIndicatorScaleX }] }} />
              </Animated.View>
            ) : null}
          </View>
        </View>

        {/* Horizontal Swipe Pager */}
        <Animated.ScrollView
          ref={playingXiPagerRef}
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
          onScroll={playingXiPagerScrollX ? Animated.event(
            [{ nativeEvent: { contentOffset: { x: playingXiPagerScrollX } } }],
            { useNativeDriver: true }
          ) : undefined}
          onMomentumScrollEnd={handlePlayingXiPagerEnd}
          onLayout={() => {
            const offset = (playingXiTeamTab - 1) * screenWidth;
            playingXiPagerRef?.current?.scrollTo({ x: offset, animated: false });
            if (playingXiPagerScrollX) playingXiPagerScrollX.setValue(offset);
          }}
          style={{ flex: 1 }}
        >
          {playingXiTabs.map(team => (
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

                {(team.roster || []).map((playerName) => {
                  return (
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
                  );
                })}
              </ScrollView>
            </View>
          ))}
        </Animated.ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default PlayingXiModal;
