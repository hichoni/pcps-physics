
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app;
let db;

// Check if all critical Firebase config values are present
const criticalConfigValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId
];

// Ensure that values are not undefined, null, empty strings, or common placeholder indicators
const allCriticalValuesPresent = criticalConfigValues.every(
  value => value && typeof value === 'string' && value.trim() !== '' && !value.startsWith("YOUR_") && !value.includes("!!! UNDEFINED")
);

if (allCriticalValuesPresent) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
  } catch (error: any) {
    console.error("Firebase initialization error (src/lib/firebase.ts):", error.message);
    // In a production environment, you might want to log this error to a dedicated error tracking service.
  }
} else {
  console.error(
    "CRITICAL Firebase Config Error (src/lib/firebase.ts): " +
    "One or more NEXT_PUBLIC_FIREBASE_... environment variables are missing, invalid, or contain placeholders. " +
    "Ensure they are set correctly in your deployment environment. " +
    "Missing or invalid keys: " + 
    Object.entries(firebaseConfig)
      .filter(([key, value]) => 
        ['apiKey', 'authDomain', 'projectId', 'appId'].includes(key) && 
        (!value || typeof value !== 'string' || value.trim() === '' || value.startsWith("YOUR_") || value.includes("!!! UNDEFINED"))
      )
      .map(([key]) => key)
      .join(', ')
  );
}

export { db };

