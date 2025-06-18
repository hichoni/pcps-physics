
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Storage 임포트 추가

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // Storage Bucket 설정 확인 중요
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app;
let db;
let storage; // storage 변수 선언

// Check if all critical Firebase config values are present
const criticalConfigValues: Record<string, string | undefined> = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket, 
  appId: firebaseConfig.appId
};

// Ensure that values are not undefined, null, empty strings, or common placeholder indicators
const allCriticalValuesPresent = Object.entries(criticalConfigValues).every(
  ([key, value]) => value && typeof value === 'string' && value.trim() !== '' && !value.startsWith("YOUR_") && !value.includes("!!! UNDEFINED") && value !== "null"
);

if (allCriticalValuesPresent) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    storage = getStorage(app); // storage 초기화
  } catch (error: any) {
    console.error("Firebase initialization error (src/lib/firebase.ts):", error.message);
    // Set db and storage to undefined or null so their absence can be checked elsewhere
    db = undefined; 
    storage = undefined;
  }
} else {
  const missingOrInvalidKeys = Object.entries(criticalConfigValues)
    .filter(([, value]) => 
      !value || typeof value !== 'string' || value.trim() === '' || value.startsWith("YOUR_") || value.includes("!!! UNDEFINED") || value === "null"
    )
    .map(([key]) => key)
    .join(', ');

  console.error(
    "CRITICAL Firebase Config Error (src/lib/firebase.ts): " +
    "One or more NEXT_PUBLIC_FIREBASE_... environment variables are missing, invalid, or contain placeholders. " +
    "Ensure they are set correctly in your deployment environment. " +
    "Missing or invalid keys: " + missingOrInvalidKeys
  );
  // Set db and storage to undefined or null
  db = undefined;
  storage = undefined;
}

export { db, storage }; // storage 익스포트
