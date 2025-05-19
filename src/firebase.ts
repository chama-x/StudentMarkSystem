// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  // Use environment variables with fallback to hardcoded values for local development
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBsOg0o3RGczlOYm7A4W6EBO98bKdXce70",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "studentmarknew.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://studentmarknew-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "studentmarknew",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "studentmarknew.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "472997938076",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:472997938076:web:ebaf0fb9e5c3c5c967be59",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RZ0EF5Y01M"
};

// Log config for debugging (only in development)
if (import.meta.env.DEV) {
  console.log("Firebase config:", {
    apiKey: firebaseConfig.apiKey ? "configured" : "missing",
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    databaseURL: firebaseConfig.databaseURL
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in production)
let analytics = null;
if (import.meta.env.PROD) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Analytics initialization failed:", error);
  }
}

// Initialize and configure Auth
const auth = getAuth(app);
auth.useDeviceLanguage(); // Set language to browser's language

// Set persistence to local
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    if (import.meta.env.DEV) {
    console.log('Firebase Auth persistence set to local');
    }
  })
  .catch((error) => {
    console.error('Error setting auth persistence:', error);
  });

// Initialize database
const database = getDatabase(app);

export { app, analytics, auth, database }; 