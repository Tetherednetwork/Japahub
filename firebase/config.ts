export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCLMzWX3lI7u6TQi6fD_cY_RE5JnsloKas",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "japahub-34138.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "japahub-34138",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "japahub-34138.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "187405934972",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:187405934972:web:638d46152c662ff3ad44f9",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};
