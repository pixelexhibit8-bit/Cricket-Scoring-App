import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Image,
  FlatList,
  StyleSheet
} from 'react-native';
import { themeColors } from '../../theme.js';

const BANNER_SLIDES = [
  { id: '1', image: require('../../../assets/banner_1.jpg') },
  { id: '2', image: require('../../../assets/banner_2.jpg') },
  { id: '3', image: require('../../../assets/banner_3.jpg') },
];

export const HomeBannerCarousel = React.memo(function HomeBannerCarousel({ bannerWidth }) {
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerFlatListRef = useRef(null);

  useEffect(() => {
    if (BANNER_SLIDES.length <= 1) return;
    const interval = setInterval(() => {
      setBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % BANNER_SLIDES.length;
        if (bannerFlatListRef.current) {
          bannerFlatListRef.current.scrollToOffset({
            offset: nextIndex * bannerWidth,
            animated: true
          });
        }
        return nextIndex;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [bannerWidth]);

  const getItemLayout = useCallback((_, index) => ({
    length: bannerWidth,
    offset: bannerWidth * index,
    index
  }), [bannerWidth]);

  const renderBannerItem = useCallback(({ item }) => (
    <View style={[styles.bannerSlideItem, { width: bannerWidth }]}>
      <Image
        source={item.image}
        style={styles.bannerImage}
        resizeMode="cover"
      />
    </View>
  ), [bannerWidth]);

  return (
    <View style={styles.carouselWrap}>
      <FlatList
        ref={bannerFlatListRef}
        data={BANNER_SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={bannerWidth}
        decelerationRate="fast"
        bounces={false}
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={(e) => {
          const contentOffset = e.nativeEvent.contentOffset.x;
          const newIndex = Math.round(contentOffset / bannerWidth);
          setBannerIndex(Math.max(0, Math.min(newIndex, BANNER_SLIDES.length - 1)));
        }}
        renderItem={renderBannerItem}
      />

      {/* DOT INDICATORS */}
      <View style={styles.dotsRow}>
        {BANNER_SLIDES.map((_, i) => (
          <View
            key={`dot-${i}`}
            style={[styles.dot, i === bannerIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  carouselWrap: {
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden'
  },
  bannerSlideItem: {
    height: 168,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A'
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: themeColors.border
  },
  dotActive: {
    backgroundColor: themeColors.textPrimary,
    width: 20,
    borderRadius: 4
  }
});

export default HomeBannerCarousel;
