
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Log environment variables to see if they are loaded correctly by the application.
console.log("Attempting to load Firebase config from environment variables (src/lib/firebase.ts)...");

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

// Log the config object that will be used for initialization.
// Use JSON.stringify to ensure undefined values are explicitly shown as such if they occur.
console.log("Firebase config to be used by initializeApp (src/lib/firebase.ts):", JSON.stringify(firebaseConfig, null, 2));

let app;
let db;

// Check if all required config values are present
if (apiKey && authDomain && projectId && storageBucket && messagingSenderId && appId) {
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
      console.log("Firestore instance initialized successfully (src/lib/firebase.ts).");
    } else {
      console.error("Firebase app object seems invalid or critical options (like projectId) are missing after initialization attempt (src/lib/firebase.ts).");
      console.error("Double-check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_ variables are correctly set and the server was restarted.");
    }
  } catch (error) {
    console.error("Firebase initialization error in src/lib/firebase.ts:", error);
    console.error("Firebase config that may have caused error:", JSON.stringify(firebaseConfig, null, 2));
    console.error("Ensure all values in .env.local are correct and the Next.js server has been restarted.");
  }
} else {
  console.error("One or more Firebase environment variables are missing. Firebase cannot be initialized. (src/lib/firebase.ts)");
  console.error("Please ensure all NEXT_PUBLIC_FIREBASE_... variables are set in your .env.local file and the server has been restarted.");
  // Log which specific values are missing or undefined
  if (!apiKey) console.error("Missing: NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!authDomain) console.error("Missing: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!projectId) console.error("Missing: NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!storageBucket) console.error("Missing: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!messagingSenderId) console.error("Missing: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!appId) console.error("Missing: NEXT_PUBLIC_FIREBASE_APP_ID");
}

export { db };
