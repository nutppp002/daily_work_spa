import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD5NNHiFaYoYDbeaasO8HpHdsMzWYjk3-U",
  authDomain: "dilywork-89fec.firebaseapp.com",
  projectId: "dilywork-89fec",
  storageBucket: "dilywork-89fec.firebasestorage.app",
  messagingSenderId: "643506439945",
  appId: "1:643506439945:web:ddbc87f36c7d12d239f5d8",
  measurementId: "G-TR301MG4H5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
