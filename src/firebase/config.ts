import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';

// User's provided Firebase Project Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCgusgSaCLIfuV53u7SQWqapCLc3czj3nQ",
  authDomain: "sanjeevani-v2.firebaseapp.com",
  databaseURL: "https://sanjeevani-v2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sanjeevani-v2",
  storageBucket: "sanjeevani-v2.firebasestorage.app",
  messagingSenderId: "678230707158",
  appId: "1:678230707158:web:abab20bbd5171d606cf277",
  measurementId: "G-09H9VQGRQ0"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

import { getFirestore } from 'firebase/firestore';

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore Database
export const db = getFirestore(app);

export type { User };
