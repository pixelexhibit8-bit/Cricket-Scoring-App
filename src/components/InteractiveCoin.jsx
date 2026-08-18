import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet
} from 'react-native';
import {
  systemFontBold
} from '../theme.js';
import * as Speech from 'expo-speech';

export function InteractiveCoin({
  onFlipEnd = null
}) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [currentFace, setCurrentFace] = useState('H'); // 'H' or 'T'

  // Master animated values
  const flipAngle = useRef(new Animated.Value(0)).current;
  const jumpAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Track current angle to toggle between H and T in lockstep with rotation
  const flipCoin = () => {
    if (isFlipping) return;

    setIsFlipping(true);

    // Fair 50/50 toss result
    const nextOutcome = Math.random() < 0.5 ? 'H' : 'T';
    
    // Heads ends at 10 full turns (3600 deg). Tails ends at 9.5 turns (3420 deg).
    const targetDegrees = nextOutcome === 'H' ? 3600 : 3420;

    // Reset values
    flipAngle.setValue(0);
    jumpAnim.setValue(0);
    scaleAnim.setValue(1);

    // Track rotation angle to swap H / T instantly during rotation
    const listenerId = flipAngle.addListener(({ value }) => {
      const normalized = value % 360;
      if (normalized > 90 && normalized < 270) {
        setCurrentFace('T');
      } else {
        setCurrentFace('H');
      }
    });

    Animated.parallel([
      // 1. Rotation Animation
      Animated.timing(flipAngle, {
        toValue: targetDegrees,
        duration: 1750,
        easing: Easing.bezier(0.2, 0.9, 0.3, 1),
        useNativeDriver: true
      }),

      // 2. Jump in air with realistic ground bounces
      Animated.sequence([
        Animated.timing(jumpAnim, {
          toValue: -110,
          duration: 720,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(jumpAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(jumpAnim, {
          toValue: -14,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(jumpAnim, {
          toValue: 0,
          duration: 210,
          easing: Easing.bounce,
          useNativeDriver: true
        })
      ]),

      // 3. Perspective Scale
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.28,
          duration: 720,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1030,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    ]).start(() => {
      flipAngle.removeListener(listenerId);
      setCurrentFace(nextOutcome);
      setIsFlipping(false);

      if (onFlipEnd) {
        onFlipEnd(nextOutcome === 'H' ? 'HEADS' : 'TAILS');
      }
    });
  };

  const rotateX = flipAngle.interpolate({
    inputRange: [0, 3600],
    outputRange: ['0deg', '3600deg']
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={flipCoin}
        disabled={isFlipping}
        style={styles.touchArea}
      >
        <Animated.View
          style={[
            styles.coinOuter,
            {
              transform: [
                { translateY: jumpAnim },
                { scale: scaleAnim },
                { rotateX }
              ]
            }
          ]}
        >
          {/* Metallic Outer Edge Ring */}
          <View style={styles.ribbedRing}>
            {/* Inner Gold Plate */}
            <View style={styles.innerPlate}>
              {/* Crisp Bold Letter (H or T) - Inverted on T so it stands 100% upright */}
              <Text
                style={[
                  styles.letterText,
                  { transform: [{ rotateX: currentFace === 'T' ? '180deg' : '0deg' }] }
                ]}
              >
                {currentFace}
              </Text>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  touchArea: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center'
  },
  coinOuter: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4.5,
    borderColor: '#E2E8F0'
  },
  ribbedRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#1E293B'
  },
  innerPlate: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#94A3B8'
  },
  letterText: {
    fontSize: 72,
    fontFamily: systemFontBold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(15, 23, 42, 0.9)',
    textShadowOffset: { width: 1.5, height: 2.5 },
    textShadowRadius: 4,
    lineHeight: 78,
    textAlign: 'center'
  }
});

export default InteractiveCoin;
