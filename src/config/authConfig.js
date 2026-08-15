/**
 * Google Cloud Console & Supabase Auth Configuration
 * 
 * When you get your Google Cloud Console credentials:
 * 1. Put Web Client ID below (Required for Expo / Supabase OAuth).
 * 2. Put Android Client ID (Required for standalone APK builds).
 * 3. Put iOS Client ID (Required for standalone iOS builds).
 */
export const GOOGLE_AUTH_CONFIG = {
  // Google OAuth 2.0 Web Client ID from Google Cloud Console
  webClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com',

  // Android Client ID (generated with your SHA-1 key)
  androidClientId: 'YOUR_GOOGLE_ANDROID_CLIENT_ID.apps.googleusercontent.com',

  // iOS Client ID
  iosClientId: 'YOUR_GOOGLE_IOS_CLIENT_ID.apps.googleusercontent.com',

  // Scopes requested from user
  scopes: ['profile', 'email']
};

export default GOOGLE_AUTH_CONFIG;
