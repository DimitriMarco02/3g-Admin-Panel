import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhJNDuDcEXILschKKn_Y-va9k2E5nqixQ",
  authDomain: "g-coaching-admin-panel.firebaseapp.com",
  projectId: "g-coaching-admin-panel",
  storageBucket: "g-coaching-admin-panel.appspot.com",
  messagingSenderId: "294443053157",
  appId: "1:294443053157:web:be57301a30854de0f1168c",
  measurementId: "G-VQR4PJ9Z95"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the Firestore database instance
export const db = getFirestore(app);

// Export the Auth instance
export const auth = getAuth(app);
