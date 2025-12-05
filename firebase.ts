import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot, 
  CollectionReference, 
  DocumentData 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBoCaDlHy_XvSGZEE5r033ci2e4iUziuRg",
  authDomain: "chatapp-ffacf.firebaseapp.com",
  projectId: "chatapp-ffacf",
  storageBucket: "chatapp-ffacf.firebasestorage.app",
  messagingSenderId: "680120502172",
  appId: "1:680120502172:web:9002b18187f106049eaa59",
  measurementId: "G-VVLPNCHRKS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export collection reference agar bisa dipakai di screen lain
export const messagesCollection = collection(db, "messages") as CollectionReference<DocumentData>;

export {
  auth,
  db,
  collection,
  addDoc,
  serverTimestamp,
  signInAnonymously,
  query,
  orderBy,
  onSnapshot,
  onAuthStateChanged
};