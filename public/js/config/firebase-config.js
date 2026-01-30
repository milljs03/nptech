// public/js/config/firebase-config.js

// USE CDN LINKS for browser modules without a bundler
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Your NPTech Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJBdyTbPP-nGHtTPozXJ6vHm-xoNIT_Lg",
  authDomain: "np-tech.firebaseapp.com",
  projectId: "np-tech",
  storageBucket: "np-tech.firebasestorage.app",
  messagingSenderId: "860583590360",
  appId: "1:860583590360:web:049d84453435a8c8491aad",
  measurementId: "G-CYCE8JJXZC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

console.log("Firebase Config Loaded");

export { app, analytics, db };