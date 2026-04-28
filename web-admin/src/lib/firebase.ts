import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// V6 VERIFIED CASE-SENSITIVE KEY - CRITICAL UPDATE
const firebaseConfig = {
  apiKey: "AIzaSyCmSUrWIwbLAEP0gF8Ci9un9RVkOhY7DL4",
  authDomain: "smartrelief-a9b54.firebaseapp.com",
  projectId: "smartrelief-a9b54",
  storageBucket: "smartrelief-a9b54.firebasestorage.app",
  messagingSenderId: "127143907466",
  appId: "1:127143907466:web:9576ce51a4f02d85f11d73",
  measurementId: "G-QC2FB4ENCC"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

console.log("📡 [FIREBASE] System Online - Case-Sensitive Key Applied");

export { app, auth, db, googleProvider };
