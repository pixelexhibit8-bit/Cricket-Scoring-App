import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  StyleSheet,
  StatusBar,
  useWindowDimensions
} from 'react-native';
import { systemFont, systemFontMedium, systemFontBold } from '../../theme.js';

export function AppSplashScreen({ onFinish }) {
  const { width, height } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const containerFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Entrance animation: logo fades in and subtly scales up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true
      })
    ]).start(() => {
      // 2. Hold momentarily (industry standard 800ms) then fade out seamlessly
      setTimeout(() => {
        Animated.timing(containerFade, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true
        }).start(() => {
          if (typeof onFinish === 'function') {
            onFinish();
          }
        });
      }, 750);
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerFade,
          width,
          height
        }
      ]}
      pointerEvents="none"
    >
      <StatusBar barStyle="light-content" backgroundColor="#071B2C" translucent />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* App Logo */}
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Brand Name */}
        <Text style={styles.brandTitle}>
          Cric<Text style={styles.brandAccent}>Scorer</Text>
        </Text>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Fast Ground Cricket Scoring & Stats
        </Text>
      </Animated.View>

      {/* Subtle Footer */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Text style={styles.footerText}>MADE FOR LOCAL CRICKET</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#071B2C',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    elevation: 99999
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  logo: {
    width: 104,
    height: 104,
    marginBottom: 16
  },
  brandTitle: {
    fontSize: 26,
    color: '#FFFFFF',
    fontFamily: systemFontBold,
    letterSpacing: 0.5
  },
  brandAccent: {
    color: '#38BDF8'
  },
  tagline: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: systemFont,
    marginTop: 6,
    textAlign: 'center'
  },
  footer: {
    position: 'absolute',
    bottom: 36,
    alignItems: 'center'
  },
  footerText: {
    fontSize: 10.5,
    color: '#475569',
    fontFamily: systemFontMedium,
    letterSpacing: 1.5
  }
});
