
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Log environment variables to see if they are loaded
console.log("Attempting to load Firebase config from environment variables (src/lib/firebase.ts)...");

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

console.log("NEXT_PUBLIC_FIREBASE_API_KEY:", apiKey);
console.log("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", authDomain);
console.log("NEXT_PUBLIC_FIREBASE_PROJECT_ID:", projectId);
console.log("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:", storageBucket);
console.log("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:", messagingSenderId);
console.log("NEXT_PUBLIC_FIREBASE_APP_ID:", appId);

const firebaseConfig = {
  apiKey: apiKey || "!!!_REPLACE_WITH_YOUR_API_KEY_!!!",
  authDomain: authDomain || "!!!_REPLACE_WITH_YOUR_AUTH_DOMAIN_!!!",
  projectId: projectId || "!!!_REPLACE_WITH_YOUR_PROJECT_ID_!!!",
  storageBucket: storageBucket || "!!!_REPLACE_WITH_YOUR_STORAGE_BUCKET_!!!",
  messagingSenderId: messagingSenderId || "!!!_REPLACE_WITH_YOUR_MESSAGING_SENDER_ID_!!!",
  appId: appId || "!!!_REPLACE_WITH_YOUR_APP_ID_!!!",
};

// Use JSON.stringify and then JSON.parse to ensure the full object structure is logged,
// especially if some values are undefined, they won't be omitted by console.log's object formatting.
console.log("Firebase config to be used by initializeApp (src/lib/firebase.ts):", JSON.parse(JSON.stringify(firebaseConfig)));

// Initialize Firebase
let app;
let db;

try {
  if (!getApps().length) {
    console.log("Initializing new Firebase app (src/lib/firebase.ts)...");
    app = initializeApp(firebaseConfig);
  } else {
    console.log("Getting existing Firebase app (src/lib/firebase.ts)...");
    app = getApp();
  }
  // Check if the projectId in the initialized app matches what we expect
  if (app && app.options.projectId && app.options.projectId !== "!!!_REPLACE_WITH_YOUR_PROJECT_ID_!!!") {
    console.log("Firebase app initialized/retrieved successfully (src/lib/firebase.ts). Project ID in use: " + app.options.projectId);
    db = getFirestore(app);
    console.log("Firestore instance initialized successfully (src/lib/firebase.ts).");
  } else if (app && app.options.projectId) {
    // Project ID is still the placeholder
    console.warn("Firebase app initialized/retrieved, but with PLACEHOLDER projectId: " + app.options.projectId + ". Firestore will likely fail. Check your Firebase config.");
    // db will remain undefined or throw error later
  } else {
    // App object might be invalid or options missing
    console.error("Firebase app object seems invalid or options are missing after initialization attempt.");
  }
  
} catch (error) {
  console.error("Firebase initialization error in src/lib/firebase.ts:", error);
  // Log the config that caused the error, safely.
  console.error("Firebase config that may have caused error:", JSON.parse(JSON.stringify(firebaseConfig)));
  // db = undefined; // db will be undefined by default if an error occurs before assignment
}

export { db };
