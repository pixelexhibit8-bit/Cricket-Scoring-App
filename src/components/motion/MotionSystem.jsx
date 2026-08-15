import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Pressable,
  AccessibilityInfo,
  ScrollView,
  Platform
} from 'react-native';

/**
 * Hook to detect if user has requested reduced motion in their OS settings.
 */
export const useReducedMotion = () => {
  const [reduceMotion, setReduceMotion] = React.useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      setReduceMotion(enabled);
    });

    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );

    return () => {
      sub?.remove();
    };
  }, []);

  return reduceMotion;
};

/**
 * Spring-based press feedback wrapper (scale ~0.97 on pressIn, 1.0 on pressOut).
 * Runs 100% on the native thread with zero lag.
 */
export const ScalePressable = ({
  children,
  onPress,
  onLongPress,
  disabled,
  style,
  activeScale = 0.97,
  hitSlop,
  activeOpacity = 0.88,
  ...props
}) => {
  const reduceMotion = useReducedMotion();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || reduceMotion) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: activeScale,
        useNativeDriver: true,
        speed: 35,
        bounciness: 0,
      }),
      Animated.timing(opacityAnim, {
        toValue: activeOpacity,
        duration: 80,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled || reduceMotion) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 25,
        bounciness: 4,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      })
    ]).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      {...props}
    >
      <Animated.View
        style={[
          style,
          !reduceMotion && {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim
          }
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};

/**
 * Subtle entrance animation (6-10px translateY + fade opacity).
 * Ideal for cards, hero tiles, and list items on load.
 */
export const FadeSlideIn = ({
  children,
  delay = 0,
  duration = 260,
  distance = 8,
  style,
  ...props
}) => {
  const reduceMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reduceMotion ? 0 : distance)).current;

  useEffect(() => {
    if (reduceMotion) return;

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          speed: 18,
          bounciness: 2,
          useNativeDriver: true,
        })
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, distance, reduceMotion]);

  return (
    <Animated.View
      style={[
        style,
        !reduceMotion && {
          opacity,
          transform: [{ translateY }]
        }
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Pre-configured high-performance Native ScrollView for 60fps scrolling.
 */
export const OptimizedScrollView = ({
  children,
  style,
  contentContainerStyle,
  ...props
}) => {
  return (
    <ScrollView
      style={style}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={16}
      removeClippedSubviews={Platform.OS === 'android'}
      overScrollMode="never"
      decelerationRate="normal"
      nestedScrollEnabled={true}
      {...props}
    >
      {children}
    </ScrollView>
  );
};
