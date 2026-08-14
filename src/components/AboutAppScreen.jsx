import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { systemFont, systemFontMedium, systemFontBold } from '../theme.js';

export function AboutAppScreen() {
  const phone = '9983228208';

  const handleCall = () => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Contact Developer', `Developer Phone: ${phone}`);
    });
  };

  const handleWhatsApp = () => {
    Linking.openURL(`https://wa.me/91${phone}`).catch(() => {
      Alert.alert('Contact Developer', `WhatsApp: ${phone}`);
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* APP HERO CARD */}
      <View style={styles.heroCard}>
        <Image source={require('../../assets/logo.png')} style={styles.appLogo} />
        <Text style={styles.appName}>Cric <Text style={styles.logoAccent}>Scorer</Text></Text>
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>v1.0.0 • by Basti Ram</Text>
        </View>
        <Text style={styles.appTagline}>
          Fast, Reliable & Easy Live Scoring App for Local Cricket Matches
        </Text>
      </View>

      {/* DEVELOPER PROFILE CARD */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="person-circle-outline" size={24} color="#0284C7" />
          <Text style={styles.cardHeaderTitle}>Developer & Creator</Text>
        </View>

        <View style={styles.devRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>BR</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.devName}>Basti Ram</Text>
            <Text style={styles.devRole}>Lead Application Developer</Text>
            <Text style={styles.devLocation}>Nagaur, Rajasthan, India</Text>
          </View>
        </View>

        {/* Developer Personal Message */}
        <View style={styles.messageBox}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0284C7" style={{ marginTop: 1 }} />
          <Text style={styles.messageText}>
            "Have suggestions, feedback, or need assistance while using Cric Scorer? Feel free to call or connect on WhatsApp — I am always happy to help!"
          </Text>
        </View>

        {/* Direct Contact Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Ionicons name="call-outline" size={16} color="#FFFFFF" />
            <Text style={styles.callBtnText}>Call: {phone}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={16} color="#15803D" />
            <Text style={styles.whatsappBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* APP PURPOSE & VISION */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="cricket" size={22} color="#0284C7" />
          <Text style={styles.cardHeaderTitle}>About Cric Scorer</Text>
        </View>
        <Text style={styles.bodyText}>
          Cric Scorer is a dedicated live scoring application crafted for local, village, and tournament cricket matches. It delivers an intuitive scoring experience with instant ball-by-ball score synchronization across all connected viewers.
        </Text>
        <Text style={[styles.bodyText, { marginTop: 8 }]}>
          With features like the 6-Digit Unique Scorer PIN for multi-device match handovers and permanent date & time match archiving, your cricket match records stay secure and accessible anytime.
        </Text>
      </View>

      {/* KEY FEATURES LIST */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="checkmark-done-circle-outline" size={22} color="#0284C7" />
          <Text style={styles.cardHeaderTitle}>Key Features</Text>
        </View>

        <View style={styles.featureGrid}>
          {[
            { icon: 'key-outline', text: '6-Digit Unique Scorer PIN & Match Resume' },
            { icon: 'volume-medium-outline', text: 'Instant Ball-by-Ball Voice Announcements' },
            { icon: 'stats-chart-outline', text: 'Real-time Scorecard & Overs Graph' },
            { icon: 'calendar-outline', text: 'Permanent Day, Date & Time Archived History' },
            { icon: 'arrow-undo-outline', text: 'Easy Undo & Mid-Match Squad Management' }
          ].map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <Ionicons name={f.icon} size={15} color="#0284C7" />
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Crafted by Basti Ram • Nagaur, Rajasthan</Text>
        <Text style={styles.footerSubText}>Cric Scorer © 2026</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  content: {
    padding: 14,
    gap: 12,
    paddingBottom: 24
  },
  heroCard: {
    backgroundColor: '#071B2C',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  appLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginBottom: 10
  },
  appName: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  logoAccent: {
    color: '#38BDF8'
  },
  versionBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#334155'
  },
  versionText: {
    fontSize: 10,
    color: '#38BDF8',
    fontFamily: systemFontMedium
  },
  appTagline: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: systemFontMedium,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8
  },
  cardHeaderTitle: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  devName: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  devRole: {
    fontSize: 11,
    color: '#0284C7',
    fontFamily: systemFontMedium
  },
  devLocation: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: systemFontMedium,
    marginTop: 1
  },
  messageBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  messageText: {
    flex: 1,
    fontSize: 11,
    color: '#0369A1',
    fontFamily: systemFontMedium,
    lineHeight: 16
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  callBtn: {
    flex: 1.2,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  callBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  whatsappBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  whatsappBtnText: {
    fontSize: 12,
    color: '#15803D',
    fontFamily: systemFontBold
  },
  bodyText: {
    fontSize: 11,
    color: '#475569',
    fontFamily: systemFontMedium,
    lineHeight: 17
  },
  featureGrid: {
    gap: 8,
    marginTop: 4
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  featureText: {
    fontSize: 11,
    color: '#334155',
    fontFamily: systemFontMedium
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 2
  },
  footerText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: systemFontMedium
  },
  footerSubText: {
    fontSize: 9,
    color: '#94A3B8',
    fontFamily: systemFontMedium
  }
});

export default AboutAppScreen;
