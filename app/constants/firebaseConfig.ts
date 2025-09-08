// app/constants/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCzAzCusQt-6Kk-0qlsPIdg0JtrY8vtyJ8",
  authDomain: "monitoreo-agricola-468e7.firebaseapp.com",
  databaseURL: "https://monitoreo-agricola-468e7-default-rtdb.firebaseio.com",
  projectId: "monitoreo-agricola-468e7",
  storageBucket: "monitoreo-agricola-468e7.firebasestorage.app",
  messagingSenderId: "70389491690",
  appId: "1:70389491690:web:5e8ddab12e5b6bdb9df493"
};

// Inicializa
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
