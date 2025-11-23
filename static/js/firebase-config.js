// @@ static/js/firebase-config.js

// Firebase initialization module
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBD37FkmI_N1phGg9TR3Gc6U_g3VvKoO10",
  authDomain: "finapp-46e53.firebaseapp.com",
  projectId: "finapp-46e53",
  storageBucket: "finapp-46e53.firebasestorage.app",
  messagingSenderId: "781527975465",
  appId: "1:781527975465:web:ad1478aa6a9b7e01383e38",
  measurementId: "G-N85YZ0TRE2"
};

// Initialize Firebase using dynamic config from Flask
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

