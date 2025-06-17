
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Log environment variables to see if they are loaded correctly by the application.
console.log("====================================================================");
console.log("Attempting to load Firebase config from environment variables (src/lib/firebase.ts)...");
console.log("SCRIPT VERSION: 1.4 - Strict Env Var Check");
console.log("====================================================================");

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID; // Added measurementId

// Log the raw values read from process.env
console.log("Raw NEXT_PUBLIC_FIREBASE_API_KEY from process.env:", apiKey ? "******** (loaded)" : "!!! UNDEFINED / NOT LOADED !!!");
console.log("Raw NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN from process.env:", authDomain ? authDomain : "!!! UNDEFINED / NOT LOADED !!!");
console.log("Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID from process.env:", projectId ? projectId : "!!! UNDEFINED / NOT LOADED !!!");
console.log("Raw NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET from process.env:", storageBucket ? storageBucket : "!!! UNDEFINED / NOT LOADED !!!");
console.log("Raw NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID from process.env:", messagingSenderId ? messagingSenderId : "!!! UNDEFINED / NOT LOADED !!!");
console.log("Raw NEXT_PUBLIC_FIREBASE_APP_ID from process.env:", appId ? appId : "!!! UNDEFINED / NOT LOADED !!!");
console.log("Raw NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID from process.env:", measurementId ? measurementId : "!!! UNDEFINED / NOT LOADED !!!");


const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
  measurementId: measurementId, // Added measurementId
};

console.log("--------------------------------------------------------------------");
console.log("Firebase config OBJECT to be used by initializeApp (src/lib/firebase.ts):");
console.log("apiKey:", firebaseConfig.apiKey ? "******** (set in config)" : "!!! apiKey IS UNDEFINED / NOT SET !!!");
console.log("authDomain:", firebaseConfig.authDomain);
console.log("projectId:", firebaseConfig.projectId);
console.log("storageBucket:", firebaseConfig.storageBucket);
console.log("messagingSenderId:", firebaseConfig.messagingSenderId);
console.log("appId:", firebaseConfig.appId);
console.log("measurementId:", firebaseConfig.measurementId);
console.log("--------------------------------------------------------------------");


let app;
let db;

// Check if all critical Firebase config values are present
const criticalConfigValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId
];

const allCriticalValuesPresent = criticalConfigValues.every(value => value && !value.startsWith("YOUR_") && !value.includes("!!! UNDEFINED"));

if (allCriticalValuesPresent) {
  try {
    if (!getApps().length) {
      console.log("Initializing new Firebase app (src/lib/firebase.ts)...");
      app = initializeApp(firebaseConfig);
    } else {
      console.log("Getting existing Firebase app (src/lib/firebase.ts)...");
      app = getApp();
    }

    if (app && app.options.projectId) {
      console.log("Firebase app initialized/retrieved successfully (src/lib/firebase.ts). Project ID in use: " + app.options.projectId);
      db = getFirestore(app);
      console.log("Firestore instance initialized successfully (src/lib/firebase.ts). ALL LOOKS GOOD HERE!");
      console.log("====================================================================");
    } else {
      console.error("Firebase app object is invalid or critical options (like projectId) are missing AFTER initialization attempt (src/lib/firebase.ts). This might happen if initializeApp failed silently or returned an incomplete object based on faulty config values from .env.local.");
      console.log("====================================================================");
    }
  } catch (error: any) {
    console.error("Firebase INITIALIZATION ERROR in src/lib/firebase.ts:", error.message);
    console.error("Firebase config that caused error:", firebaseConfig);
    console.error("Ensure all NEXT_PUBLIC_... variables in .env.local are correct, have NO TYPOS (especially in names like NEXT_PUBLIC_FIREBASE_PROJECT_ID), and match your Firebase project. The Next.js server must be RESTARTED after .env.local changes.");
    console.log("====================================================================");
  }
} else {
  console.error("CRITICAL ERROR: One or more critical Firebase environment variables (apiKey, authDomain, projectId, appId) are MISSING, UNDEFINED, or still contain PLACEHOLDERS in the 'firebaseConfig' object (src/lib/firebase.ts).");
  console.error("This usually means the NEXT_PUBLIC_... variables were not correctly loaded from .env.local or are missing there.");
  console.error("Please ensure all NEXT_PUBLIC_FIREBASE_... variables are correctly set with your ACTUAL Firebase project credentials in your .env.local file (using the correct variable names like NEXT_PUBLIC_FIREBASE_API_KEY, etc.) and the server has been RESTARTED.");
  console.error("Problematic firebaseConfig object that led to this error:", firebaseConfig);
  console.log("====================================================================");
}

export { db };
