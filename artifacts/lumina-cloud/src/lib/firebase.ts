import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

// Export mutable bindings so we can conditionally initialize without using
// `export` statements inside control flow (which static bundlers reject).
export const firebaseConfigured = Boolean(apiKey);
export let auth: any = null;
export let db: any = null;
let defaultApp: any = null;

if (!apiKey) {
  // Development fallback: do not initialize Firebase when env vars are missing.
  // This allows the app to run locally without Firebase credentials.
  // eslint-disable-next-line no-console
  console.warn("Firebase not initialized: VITE_FIREBASE_API_KEY is not set.");
} else {
  const firebaseConfig = {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const app = initializeApp(firebaseConfig);

  auth = getAuth(app);
  db = getFirestore(app);
  defaultApp = app;
}

export default defaultApp;
