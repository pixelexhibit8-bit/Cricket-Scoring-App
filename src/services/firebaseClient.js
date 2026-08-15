import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyBYxOGKE6eJFLpcffdOcs_F490DqyNMkn8",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "cric-scorer-55281.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "cric-scorer-55281",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "cric-scorer-55281.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "289246113323",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:289246113323:web:c67983cdb9fc2b7e14046e"
};

let app;
let auth;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
} catch (e) {
  console.warn('Firebase init warning:', e);
}

export { app, auth, firebaseConfig };
