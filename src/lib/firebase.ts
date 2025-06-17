
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Log environment variables to see if they are loaded
console.log("Attempting to load Firebase config from environment variables...");
console.log("NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log("NEXT_PUBLIC_FIREBASE_PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
console.log("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:", process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
console.log("NEXT_PUBLIC_FIREBASE_APP_ID:", process.env.NEXT_PUBLIC_FIREBASE_APP_ID);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY_PLACEHOLDER_IN_CODE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN_PLACEHOLDER_IN_CODE",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID_PLACEHOLDER_IN_CODE",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET_PLACEHOLDER_IN_CODE",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID_PLACEHOLDER_IN_CODE",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID_PLACEHOLDER_IN_CODE",
};

console.log("Firebase config to be used by initializeApp:", firebaseConfig);

// Initialize Firebase
let app;
let db;

try {
  if (!getApps().length) {
    console.log("Initializing new Firebase app...");
    app = initializeApp(firebaseConfig);
  } else {
    console.log("Getting existing Firebase app...");
    app = getApp();
  }
  console.log("Firebase app initialized/retrieved successfully.");
  db = getFirestore(app);
  console.log("Firestore instance initialized successfully.");
} catch (error) {
  console.error("Firebase initialization error in src/lib/firebase.ts:", error);
  // To make sure 'db' is defined even if initialization fails.
  // This is primarily for preventing cascading 'db is not defined' errors.
  // The core issue of not connecting to Firebase will persist if an error occurs here.
  // db = undefined; // Explicitly set to undefined or handle as per app's error strategy
}

export { db };
