import { initializeApp } from "firebase/app";
import { 
  initializeAuth,
  signInAnonymously, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
//@ts-ignore
import { getReactNativePersistence } from "@firebase/auth/dist/rn/index.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot, 
  CollectionReference, 
  DocumentData,
  doc,
  setDoc,
  getDocs,
  where
} from "firebase/firestore";
import { 
  getStorage, 
  ref, 
  uploadBytes,
  uploadString,
  getDownloadURL 
} from "firebase/storage";

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

// Inisialisasi Auth dengan AsyncStorage persistence untuk React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

// Inisialisasi Firebase Storage
const storage = getStorage(app);

// Export collection reference agar bisa dipakai di screen lain
export const messagesCollection = collection(db, "messages") as CollectionReference<DocumentData>;
export const usersCollection = collection(db, "users") as CollectionReference<DocumentData>;

// Fungsi untuk mendapatkan email berdasarkan username
export const getEmailByUsername = async (username: string): Promise<string | null> => {
  const q = query(usersCollection, where("username", "==", username.toLowerCase()));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const userData = snapshot.docs[0].data();
  return userData.email || null;
};

// Fungsi untuk mengecek apakah username sudah digunakan
export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  const q = query(usersCollection, where("username", "==", username.toLowerCase()));
  const snapshot = await getDocs(q);
  return snapshot.empty;
};

// Fungsi untuk generate email dari username (untuk Firebase Auth)
export const generateEmailFromUsername = (username: string): string => {
  return `${username.toLowerCase()}@chatapp.local`;
};

// Fungsi untuk menyimpan data user ke Firestore
export const saveUserData = async (uid: string, username: string): Promise<void> => {
  const generatedEmail = generateEmailFromUsername(username);
  await setDoc(doc(db, "users", uid), {
    username: username.toLowerCase(),
    displayUsername: username, // Menyimpan format asli dengan huruf besar/kecil
    email: generatedEmail,
    createdAt: serverTimestamp(),
  });
};

export {
  auth,
  db,
  storage,
  collection,
  addDoc,
  serverTimestamp,
  signInAnonymously,
  query,
  orderBy,
  onSnapshot,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  doc,
  setDoc,
  getDocs,
  where,
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL
};