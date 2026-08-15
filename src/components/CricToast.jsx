import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  StyleSheet,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  systemFont,
  systemFontBold,
  systemFontMedium,
  fontWeights
} from '../theme.js';

/**
 * Modern, non-intrusive floating toast banner
 * Replaces harsh native Alert.alert popups
 */
export function CricToast({
  visible,
  message,
  type = 'success', // 'success' | 'error' | 'info'
  onDismiss,
  duration = 2600
}) {
  const translateY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true
        })
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 60,
        duration: 180,
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true
      })
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  if (!visible && opacity._value === 0) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
          opacity
        }
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hideToast}
        style={[
          styles.toastCard,
          isSuccess && styles.successCard,
          isError && styles.errorCard
        ]}
      >
        <View
          style={[
            styles.iconCircle,
            isSuccess && styles.successIconCircle,
            isError && styles.errorIconCircle
          ]}
        >
          <Ionicons
            name={isSuccess ? 'checkmark' : isError ? 'alert-circle' : 'information'}
            size={16}
            color="#FFFFFF"
          />
        </View>

        <Text
          style={[
            styles.messageText,
            isSuccess && styles.successText,
            isError && styles.errorText
          ]}
          numberOfLines={2}
        >
          {message}
        </Text>

        <Ionicons name="close" size={16} color="#94A3B8" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 99999,
    elevation: 999
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 10,
    maxWidth: 420,
    width: '100%',
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  successCard: {
    backgroundColor: '#064E3B',
    borderColor: '#059669'
  },
  errorCard: {
    backgroundColor: '#7F1D1D',
    borderColor: '#DC2626'
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  successIconCircle: {
    backgroundColor: '#10B981'
  },
  errorIconCircle: {
    backgroundColor: '#EF4444'
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: '#FFFFFF'
  },
  successText: {
    color: '#ECFDF5',
    fontFamily: systemFontBold
  },
  errorText: {
    color: '#FEF2F2',
    fontFamily: systemFontBold
  }
});
