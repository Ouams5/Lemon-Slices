import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  User as FirebaseUser 
} from "firebase/auth";
import { getFirestore, collection, doc, setDoc, addDoc, getDocs, getDoc, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCUS31RLfWZHhAbpL2vOFHR05klRGdPr7g",
  authDomain: "lemon-slices.firebaseapp.com",
  projectId: "lemon-slices",
  storageBucket: "lemon-slices.firebasestorage.app",
  messagingSenderId: "375527052919",
  appId: "1:375527052919:web:1665e07f951d086a495872"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  getDocs, 
  getDoc,
  query, 
  where 
};

export type { FirebaseUser };