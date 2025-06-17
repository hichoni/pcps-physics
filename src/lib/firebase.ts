
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Log environment variables to see if they are loaded correctly by the application.
console.log("====================================================================");
console.log("Attempting to load Firebase config from environment variables (src/lib/firebase.ts)...");
console.log("SCRIPT VERSION: 1.2 - Explicit Logging");
console.log("====================================================================");

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

// Log the raw values read from process.env
console.log("Raw NEXT_PUBLIC_FIREBASE_API_KEY from process.env:", apiKey);
console.log("Raw NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN from process.env:", authDomain);
console.log("Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID from process.env:", projectId);
console.log("Raw NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET from process.env:", storageBucket);
console.log("Raw NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID from process.env:", messagingSenderId);
console.log("Raw NEXT_PUBLIC_FIREBASE_APP_ID from process.env:", appId);

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
};

console.log("--------------------------------------------------------------------");
console.log("Firebase config OBJECT to be used by initializeApp (src/lib/firebase.ts):");
console.log("apiKey:", firebaseConfig.apiKey);
console.log("authDomain:", firebaseConfig.authDomain);
console.log("projectId:", firebaseConfig.projectId);
console.log("storageBucket:", firebaseConfig.storageBucket);
console.log("messagingSenderId:", firebaseConfig.messagingSenderId);
console.log("appId:", firebaseConfig.appId);
console.log("--------------------------------------------------------------------");

let app;
let db;

if (
    firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("YOUR_") && !firebaseConfig.apiKey.startsWith("!!!_REPLACE_") &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId && !firebaseConfig.projectId.includes("YOUR_") && !firebaseConfig.projectId.startsWith("!!!_REPLACE_") &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
) {
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
      console.error("Firebase app object is invalid or critical options (like projectId) are missing AFTER initialization attempt (src/lib/firebase.ts).");
      console.error("This might happen if initializeApp failed silently or returned an incomplete object.");
      console.log("====================================================================");
    }
  } catch (error) {
    console.error("Firebase INITIALIZATION ERROR in src/lib/firebase.ts:", error);
    console.error("Firebase config that caused error:", firebaseConfig);
    console.error("Ensure all values in .env.local are correct, match your Firebase project, and the Next.js server has been RESTARTED.");
    console.log("====================================================================");
  }
} else {
  console.error("CRITICAL ERROR: One or more Firebase environment variables are MISSING, UNDEFINED, or still contain PLACEHOLDERS. Firebase CANNOT be initialized. (src/lib/firebase.ts)");
  console.error("Please ensure all NEXT_PUBLIC_FIREBASE_... variables are correctly set with your ACTUAL Firebase project credentials in your .env.local file and the server has been RESTARTED.");
  console.error("Problematic firebaseConfig values received by src/lib/firebase.ts:", firebaseConfig);
  console.log("====================================================================");
}

export { db };
