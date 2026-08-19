import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Linking } from 'react-native';
import { systemFontMedium, systemFontBold, themeColors } from '../theme.js';

export function SocialConnectCard({
  instagramHandle = 'cricflow.live_',
  instagramUrl = 'https://instagram.com/cricflow.live_',
  xHandle = 'cricflow_live',
  xUrl = 'https://x.com/cricflow_live'
}) {
  const handleOpenLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (e) {
      console.log('Error opening social URL:', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Connect with CricFlow on{'\n'}Instagram and X !!
      </Text>

      <View style={styles.buttonsWrap}>
        {/* INSTAGRAM PILL BUTTON */}
        <TouchableOpacity
          onPress={() => handleOpenLink(instagramUrl)}
          style={styles.pillButton}
          activeOpacity={0.75}
        >
          <Image
            source={require('../../assets/icons/instagram.png')}
            style={styles.socialIcon}
            resizeMode="contain"
          />
          <Text style={styles.handleText}>{instagramHandle}</Text>
        </TouchableOpacity>

        {/* X (TWITTER) PILL BUTTON */}
        <TouchableOpacity
          onPress={() => handleOpenLink(xUrl)}
          style={styles.pillButton}
          activeOpacity={0.75}
        >
          <Image
            source={require('../../assets/icons/x_twitter.png')}
            style={styles.socialIcon}
            resizeMode="contain"
          />
          <Text style={styles.handleText}>{xHandle}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 16
  },
  title: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: systemFontMedium,
    textAlign: 'center',
    lineHeight: 23,
    letterSpacing: -0.2
  },
  buttonsWrap: {
    width: '100%',
    maxWidth: 320,
    gap: 10
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 10
  },
  socialIcon: {
    width: 20,
    height: 20
  },
  handleText: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: systemFontMedium,
    letterSpacing: -0.1
  }
});
