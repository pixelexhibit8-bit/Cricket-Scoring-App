import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  systemFont,
  systemFontBold,
  systemFontMedium,
  fontWeights
} from '../theme.js';
import { subscribeToast } from '../services/toastService.js';

export function CricGlobalToast() {
  const [toastState, setToastState] = useState({
    visible: false,
    message: '',
    title: '',
    type: 'info',
    duration: 2600
  });

  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToast((newToast) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToastState({ ...newToast, visible: true });

      // Animate In from Top
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();

      timerRef.current = setTimeout(() => {
        hideToast();
      }, newToast.duration || 2600);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      setToastState(prev => ({ ...prev, visible: false }));
    });
  };

  if (!toastState.visible) return null;

  const isSuccess = toastState.type === 'success';
  const isError = toastState.type === 'error';
  const isWarning = toastState.type === 'warning';

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          transform: [{ translateY }],
          opacity
        }
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={hideToast}
        style={[
          styles.toastCard,
          isSuccess && styles.successCard,
          isError && styles.errorCard,
          isWarning && styles.warningCard
        ]}
      >
        <View
          style={[
            styles.iconCircle,
            isSuccess && styles.successIconCircle,
            isError && styles.errorIconCircle,
            isWarning && styles.warningIconCircle
          ]}
        >
          <Ionicons
            name={
              isSuccess
                ? 'checkmark'
                : isError
                ? 'alert-circle'
                : isWarning
                ? 'warning'
                : 'information'
            }
            size={16}
            color="#FFFFFF"
          />
        </View>

        <View style={{ flex: 1 }}>
          {toastState.title ? (
            <Text style={styles.titleText}>{toastState.title}</Text>
          ) : null}
          <Text
            style={[
              styles.messageText,
              isSuccess && styles.successText,
              isError && styles.errorText,
              isWarning && styles.warningText
            ]}
            numberOfLines={3}
          >
            {toastState.message}
          </Text>
        </View>

        <TouchableOpacity onPress={hideToast} style={{ padding: 4 }}>
          <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 16,
    right: 16,
    zIndex: 999999,
    elevation: 9999,
    alignItems: 'center'
  },
  toastCard: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 12
  },
  successCard: {
    backgroundColor: '#064E3B',
    borderColor: '#059669'
  },
  errorCard: {
    backgroundColor: '#7F1D1D',
    borderColor: '#DC2626'
  },
  warningCard: {
    backgroundColor: '#78350F',
    borderColor: '#D97706'
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  warningIconCircle: {
    backgroundColor: '#F59E0B'
  },
  titleText: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: '#FFFFFF',
    marginBottom: 2
  },
  messageText: {
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    color: '#F8FAFC',
    lineHeight: 17
  },
  successText: {
    color: '#ECFDF5'
  },
  errorText: {
    color: '#FEF2F2'
  },
  warningText: {
    color: '#FEF3C7'
  }
});
