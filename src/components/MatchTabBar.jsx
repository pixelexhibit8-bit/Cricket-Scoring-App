import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { systemFontMedium } from '../theme';

export const MatchTabBar = ({
  tabs = [],
  activeTab,
  layouts = {},
  layoutPrefix = '',
  pageWidth = 1,
  scrollX,
  scrollRef,
  onPress,
  onTabLayout,
  tone = 'light'
}) => {
  const isDark = tone === 'dark';
  const getLayoutKey = (tabId) => `${layoutPrefix}${tabId}`;
  const measured = tabs.every(tab => layouts[getLayoutKey(tab.id)]);

  const indicatorTranslateX = scrollX
    ? scrollX.interpolate({
        inputRange: tabs.map((_, index) => index * pageWidth),
        outputRange: tabs.map(tab => {
          const layout = layouts[getLayoutKey(tab.id)];
          return layout ? layout.x + layout.width / 2 - 50 : 0;
        }),
        extrapolate: 'clamp'
      })
    : 0;

  const indicatorScaleX = scrollX
    ? scrollX.interpolate({
        inputRange: tabs.map((_, index) => index * pageWidth),
        outputRange: tabs.map(tab => (layouts[getLayoutKey(tab.id)]?.width || 100) / 100),
        extrapolate: 'clamp'
      })
    : 1;

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ marginTop: 8 }}
    >
      <View style={{ position: 'relative', flexDirection: 'row', gap: 24, paddingLeft: 14, paddingRight: 18 }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onLayout={event => onTabLayout && onTabLayout(getLayoutKey(tab.id), event)}
              onPress={() => onPress && onPress(tab.id)}
              activeOpacity={0.7}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 2,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {tab.icon ? (
                  <Ionicons
                    name={tab.icon}
                    size={16}
                    color={
                      isActive
                        ? isDark
                          ? '#E0F2FE'
                          : '#0284C7'
                        : isDark
                        ? '#7EAAC2'
                        : '#64748B'
                    }
                  />
                ) : null}
                <Text
                  style={{
                    fontSize: 15,
                    color:
                      isActive
                        ? isDark
                          ? '#FFFFFF'
                          : '#0284C7'
                        : isDark
                        ? '#8FB7CD'
                        : '#64748B',
                    fontFamily: systemFontMedium,
                    letterSpacing: -0.1
                  }}
                >
                  {tab.label}
                </Text>
              </View>

              {/* Clean Active Underline Indicator when selected */}
              {isActive && (!scrollX || !measured) ? (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2.5,
                    borderRadius: 2,
                    backgroundColor: isDark ? '#38BDF8' : '#0284C7'
                  }}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
        {measured && scrollX ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: 100,
              height: 2.5,
              transform: [{ translateX: indicatorTranslateX }]
            }}
          >
            <Animated.View
              style={{
                flex: 1,
                borderRadius: 2,
                backgroundColor: isDark ? '#38BDF8' : '#0284C7',
                transform: [{ scaleX: indicatorScaleX }]
              }}
            />
          </Animated.View>
        ) : null}
      </View>
    </ScrollView>
  );
};

export default MatchTabBar;
