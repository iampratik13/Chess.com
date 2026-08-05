import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your Firebase configuration
// Get these from Firebase Console > Project Settings > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyDB5RqmZavEvF7T7m6N2XLoDNMvJ-uq5NY",
  authDomain: "chess-ea981.firebaseapp.com",
  projectId: "chess-ea981",
  storageBucket: "chess-ea981.firebasestorage.app",
  messagingSenderId: "541912378335",
  appId: "1:541912378335:web:38ed0a90e209f50741f26a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
